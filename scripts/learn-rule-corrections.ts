/**
 * Offline, family-grouped transformation learning over the existing rule policy.
 * Adapted from the interrupted common-word TBL experiment (2026-09-30).
 * Inspiration: Brill (1995), https://aclanthology.org/J95-4004/.
 *
 * Emits reviewable corrections and evidence; never changes src/ or baselines.
 * --structural adds syllable/affix contexts to the original local templates.
 * A spelling-family component stays in one fold. Selection and stopping use
 * TRAIN fixes-minus-breaks only; HELD scores are reported, never optimized.
 * The old gram-style filter is retained as a TRAIN-only diagnostic, not as
 * permission to ship a correction. Final adoption needs the project's gates.
 *
 * Candidate generation currently covers direct rule rendering only, excluding
 * words resolved by lexical, morphology or compound paths. Default word
 * filters match evaluate.ts (including <=12 letters); --include-long lifts
 * that limit for research, without redefining the project's baseline. Candidate replay
 * uses the actual predict() pipeline, with a temporary per-instance hook at
 * ruleSyllables, restored in finally. This is a research tool, not a runtime
 * extension point. Coverage is always reported; omitted words are not scored
 * as improved. Structural features describe spelling, not gold morphology.
 *
 * node --import tsx scripts/learn-rule-corrections.ts --out /tmp/local
 * node --import tsx scripts/learn-rule-corrections.ts --structural --out /tmp/structural
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import levenshtein from "fast-levenshtein";
import EnglishG2P from "../src/en/g2p";
import dictionary from "../data/en/dict.json";
import { decompose } from "../src/en/suffixes";
import { isSyllableHeavy } from "../src/en/syllabify";
import {
  syllabify,
  assignStress,
  secondaryStressIndices,
  syllableToIPA,
} from "../src/en/syllabify";
import { isForeign } from "./foreign-filter";

// ─────────────────────────── CLI args ────────────────────────────────────
const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log("node --import tsx scripts/learn-rule-corrections.ts [--structural] [--include-long] [--k-folds 10] [--max-rules 30] [--min-support 5] [--seed 20260928] [--limit N] [--out DIR]");
  console.log("Research only: emits candidates, train-only filter diagnostics, and family-held-out scores; never updates runtime or baselines.");
  process.exit(0);
}
function flag(name: string, def?: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return def;
  const value = argv[i + 1];
  if (!value || value.startsWith("--")) throw new Error(`--${name} requires a value`);
  return value;
}
const LIMIT = flag("limit") ? Number(flag("limit")) : undefined;
const MAX_RULES = Number(flag("max-rules", "30"));
const SEED = Number(flag("seed", "20260928"));
const OUT_DIR = flag("out", "/tmp/phonemize-rule-corrections")!;
const MIN_SUPPORT = Number(flag("min-support", "5")); // pre-scoring prune (lower than Trial B's 8: common-only population is ~1/10th the size)
const K_FOLDS = Number(flag("k-folds", "10"));
for (const [name, value, minimum] of [["max-rules", MAX_RULES, 1], ["min-support", MIN_SUPPORT, 1], ["k-folds", K_FOLDS, 2], ["seed", SEED, 0]] as const) {
  if (!Number.isInteger(value) || value < minimum) throw new Error(`--${name} must be an integer >= ${minimum}`);
}
if (LIMIT !== undefined && (!Number.isInteger(LIMIT) || LIMIT < K_FOLDS)) throw new Error("--limit must be an integer >= k-folds");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const toolHash = createHash("sha256").update(readFileSync(__filename)).digest("hex");
function log(...a: unknown[]): void {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
}

// ─────────────────────── normalization (mirrors evaluate.ts) ─────────────
const STRESS_RE = /[ˈˌ]/g;
function strip(s: string): string {
  return s.replace(STRESS_RE, "").replace(/ʌ/g, "ə");
}
const SIMILAR: string[][] = [
  ["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"],
];
function canon(s: string): string {
  let out = strip(s);
  for (const g of SIMILAR) for (let i = 1; i < g.length; i++) out = out.split(g[i]).join(g[0]);
  return out;
}
function lenientOk(pred: string, gold: string): boolean {
  return levenshtein.get(canon(pred), canon(gold)) <= 1;
}
function strictOk(pred: string, gold: string): boolean {
  return strip(pred) === strip(gold);
}

// ─────────────────────── testable-word filter (evaluate.ts) ──────────────
const MAX_WORD_LENGTH = argv.includes("--include-long") ? Infinity : 12;
function getTestableWords(words: string[]): string[] {
  const VOWELS_AEIOU = new Set("aeiou".split(""));
  return words.filter((word) => {
    if (!/^[a-z']+$/i.test(word) || word.length < 3) return false;
    if (word.length > MAX_WORD_LENGTH) return false;
    if (/^([A-Z]\.?){2,8}$/.test(word)) return false;
    if (![...word.toLowerCase()].some((c) => VOWELS_AEIOU.has(c))) return false;
    return true;
  });
}

// ─────────────────────── seeded RNG + stratified split ────────────────────
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function (): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────── runtime replay (validated below) ───────────────
interface Step {
  grapheme: string;
  phoneme: string;
  rule: string;
  syllableIndex: number;
  offsetInSyllable: number; // cumulative pre-reduction char offset within its syllable
}

// JS-private methods are visible to this isolated lab instance. Do not expose
// this research hook in the public API or ship learned drafts automatically.
type RuleForm = { syllables: string[]; stressedIdx: number; ipa: string[] };
const replay = new EnglishG2P({ disableDict: true }) as unknown as {
  predict(word: string, language: string): string | undefined;
  ruleSyllables(word: string, forcedStress?: number, steps?: unknown[]): RuleForm;
};
const originalRuleSyllables = replay.ruleSyllables.bind(replay);
let replayReachedRoot = false;
function rebuildFinal(
  lowerWord: string,
  syllables: string[],
  stressedIdx: number,
  syllableIPA: string[],
): string {
  replayReachedRoot = false;
  replay.ruleSyllables = (word, forced, steps) => {
    if (word !== lowerWord) return originalRuleSyllables(word, forced, steps);
    replayReachedRoot = true;
    return { syllables, stressedIdx, ipa: syllableIPA };
  };
  try { return replay.predict(lowerWord, "en") ?? lowerWord; }
  finally { replay.ruleSyllables = originalRuleSyllables; }
}

interface Render {
  syllables: string[];
  stressedIdx: number;
  secondary: Set<number>;
  ipa: string[];
  flatSteps: Step[];
  final: string;
  reachedRoot: boolean;
}
function render(lowerWord: string): Render {
  const syllables = syllabify(lowerWord);
  const stressedIdx = assignStress(syllables, lowerWord);
  const secondary = secondaryStressIndices(syllables, stressedIdx);
  const flatSteps: Step[] = [];
  const ipa = syllables.map((s, i) => {
    const raw: Array<{ grapheme: string; phoneme: string; rule: string }> = [];
    const r = syllableToIPA(
      s,
      i,
      i === stressedIdx,
      i === syllables.length - 1,
      i < syllables.length - 1 ? syllables[i + 1] : undefined,
      raw,
      i > 0 ? syllables[i - 1] : undefined,
      i === syllables.length - 2,
      syllables.slice(i + 1).join(""),
      secondary.has(i),
      syllables.slice(0, i).join(""),
      i > 0 && i - 1 === stressedIdx,
    );
    let off = 0;
    for (const st of raw) {
      flatSteps.push({ ...st, syllableIndex: i, offsetInSyllable: off });
      off += st.phoneme.length;
    }
    return r;
  });
  const final = rebuildFinal(lowerWord, syllables, stressedIdx, ipa);
  return { syllables, stressedIdx, secondary, ipa, flatSteps, final, reachedRoot: replayReachedRoot };
}

// ─────────────────────── generic char-level edit-script DP ────────────────
type Op = { type: "match" | "sub" | "del" | "ins"; a: number; b: number };
function editScript(a: string, b: string): Op[] {
  const n = a.length, m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const ops: Op[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      ops.push({ type: "match", a: i - 1, b: j - 1 });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ type: "sub", a: i - 1, b: j - 1 });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ type: "del", a: i - 1, b: -1 });
      i--;
    } else {
      ops.push({ type: "ins", a: -1, b: j - 1 });
      j--;
    }
  }
  ops.reverse();
  return ops;
}
// Merge consecutive non-match ops into contiguous error spans (predStart,
// predEnd) / (goldStart, goldEnd), half-open ranges over the ORIGINAL
// strings' indices.
interface ErrSpan { predStart: number; predEnd: number; goldStart: number; goldEnd: number }
function errorSpans(ops: Op[]): ErrSpan[] {
  const spans: ErrSpan[] = [];
  let cur: ErrSpan | null = null;
  for (const op of ops) {
    if (op.type === "match") { cur = null; continue; }
    if (!cur) {
      cur = {
        predStart: op.a >= 0 ? op.a : Infinity,
        predEnd: op.a >= 0 ? op.a + 1 : -Infinity,
        goldStart: op.b >= 0 ? op.b : Infinity,
        goldEnd: op.b >= 0 ? op.b + 1 : -Infinity,
      };
      spans.push(cur);
    } else {
      if (op.a >= 0) { cur.predStart = Math.min(cur.predStart, op.a); cur.predEnd = Math.max(cur.predEnd, op.a + 1); }
      if (op.b >= 0) { cur.goldStart = Math.min(cur.goldStart, op.b); cur.goldEnd = Math.max(cur.goldEnd, op.b + 1); }
    }
  }
  for (const s of spans) {
    if (!isFinite(s.predStart)) { s.predStart = 0; s.predEnd = 0; }
    if (!isFinite(s.goldStart)) { s.goldStart = 0; s.goldEnd = 0; }
  }
  return spans;
}

// ─────────────────────── context templates ─────────────────────────────
const VOWEL_SET = new Set("aeiouy".split(""));
function letterClass(ch: string): string {
  if (ch === "^" || ch === "$") return ch;
  return VOWEL_SET.has(ch) ? "V" : "C";
}
interface TemplateCtx {
  syllableCount: string;
  slotFromEnd: string;
  heavy: string;
  suffix: string;
  suffixClass: string;
  prefix: string;
  leftLetter: string;
  rightLetter: string;
  leftClass: string;
  rightClass: string;
  left2: string;
  right2: string;
  stressStatus: string;
  position: string;
  doubledConsonant: boolean;
  silentE: boolean;
  wordInitial: boolean;
  wordFinal: boolean;
}
// name -> (ctx) -> value string; complexity used as an MDL tie-break
// (lower = simpler/more general, preferred on a scoring tie).
const TEMPLATES: Array<{ name: string; complexity: number; value: (c: TemplateCtx) => string }> = [
  { name: "leftClass", complexity: 1, value: (c) => c.leftClass },
  { name: "rightClass", complexity: 1, value: (c) => c.rightClass },
  { name: "stressStatus", complexity: 1, value: (c) => c.stressStatus },
  { name: "position", complexity: 1, value: (c) => c.position },
  { name: "doubledConsonant", complexity: 1, value: (c) => String(c.doubledConsonant) },
  { name: "silentE", complexity: 1, value: (c) => String(c.silentE) },
  { name: "wordInitial", complexity: 1, value: (c) => String(c.wordInitial) },
  { name: "wordFinal", complexity: 1, value: (c) => String(c.wordFinal) },
  { name: "leftLetter", complexity: 2, value: (c) => c.leftLetter },
  { name: "rightLetter", complexity: 2, value: (c) => c.rightLetter },
  { name: "leftClass+rightClass", complexity: 3, value: (c) => `${c.leftClass},${c.rightClass}` },
  { name: "leftLetter+stress", complexity: 3, value: (c) => `${c.leftLetter},${c.stressStatus}` },
  { name: "rightLetter+stress", complexity: 3, value: (c) => `${c.rightLetter},${c.stressStatus}` },
  { name: "leftLetter+rightLetter", complexity: 4, value: (c) => `${c.leftLetter},${c.rightLetter}` },
  { name: "left2", complexity: 4, value: (c) => c.left2 },
  { name: "right2", complexity: 4, value: (c) => c.right2 },
];

// E4 feature ablation: existing templates versus whole-word structural context.
if (argv.includes("--structural")) {
  const structural: Array<[string, (c: TemplateCtx) => string]> = [
    ["syllableCount", c => c.syllableCount], ["slotFromEnd", c => c.slotFromEnd],
    ["heavy", c => c.heavy], ["suffix", c => c.suffix],
    ["suffixClass", c => c.suffixClass], ["prefix", c => c.prefix],
  ];
  for (const [name, value] of structural) {
    TEMPLATES.push({name, complexity: 2, value});
    TEMPLATES.push({name: name + "+stress", complexity: 3, value: c => value(c) + "," + c.stressStatus});
    TEMPLATES.push({name: name + "+right", complexity: 4, value: c => value(c) + "," + c.rightLetter});
  }
}

// ─────────────────────── per-word record ────────────────────────────────
interface WordRec {
  word: string;
  lowerWord: string;
  gold: string;
  goldNorm: string; // strip()'d
  syllables: string[];
  stressedIdx: number;
  secondary: Set<number>;
  ipa: string[]; // baseline (immutable)
  flatSteps: Step[];
  baselineFinal: string; // = g2p.predict(), validated == runtime replay
  curIpa: string[]; // mutable across the greedy loop
  curFinal: string;
  foreign: boolean;
  top5000: boolean;
  isTrain: boolean;
  foldIndex: number; // 0..K_FOLDS-1, assigned once over the whole common population
}

// Each occurrence of a grapheme-step is indexed against all 16 templates
// so the reverse index and candidate generation share one code path.
interface StepCtx {
  step: Step;
  ctx: TemplateCtx;
}
function buildStepCtx(rec: { syllables: string[]; stressedIdx: number; secondary: Set<number>; flatSteps: Step[] }, k: number): StepCtx {
  const step = rec.flatSteps[k];
  const prev = rec.flatSteps[k - 1];
  const next = rec.flatSteps[k + 1];
  const leftLetter = prev ? prev.grapheme[prev.grapheme.length - 1] : "^";
  const rightLetter = next ? next.grapheme[0] : "$";
  const prev2 = rec.flatSteps[k - 2];
  const next2 = rec.flatSteps[k + 1] === next ? rec.flatSteps[k + 2] : undefined;
  const left2raw = (prev2?.grapheme ?? "") + (prev?.grapheme ?? "");
  const right2raw = (next?.grapheme ?? "") + (next2?.grapheme ?? "");
  const left2 = (("^^" + left2raw).slice(-2));
  const right2 = ((right2raw + "$$").slice(0, 2));
  const syl = rec.syllables[step.syllableIndex];
  const isLastSyl = step.syllableIndex === rec.syllables.length - 1;
  const doubledConsonant = /([bcdfghjklmnpqrstvwxz])\1/i.test(syl);
  const lastStepInSyl = !next || next.syllableIndex !== step.syllableIndex
    ? step
    : (() => {
        let last = step;
        for (let j = k; j < rec.flatSteps.length && rec.flatSteps[j].syllableIndex === step.syllableIndex; j++) last = rec.flatSteps[j];
        return last;
      })();
  const silentE = isLastSyl && syl.length > 1 && syl.endsWith("e") && !lastStepInSyl.grapheme.endsWith("e");
  const spelling = rec.syllables.join("");
  const morph = decompose(spelling);
  const outer = morph.steps[0]?.entry;
  const ctx: TemplateCtx = {
    syllableCount: String(Math.min(5, rec.syllables.length)),
    slotFromEnd: String(Math.min(4, rec.syllables.length - step.syllableIndex)),
    heavy: String(isSyllableHeavy(syl)),
    suffix: outer?.suffix ?? "none",
    suffixClass: outer?.stress ?? "none",
    prefix: spelling.match(/^(?:under|over|inter|trans|pre|pro|con|com|dis|mis|un|re|in|de|ad|ab)/)?.[0] ?? "none",
    leftLetter,
    rightLetter,
    leftClass: letterClass(leftLetter),
    rightClass: letterClass(rightLetter),
    left2,
    right2,
    stressStatus: step.syllableIndex === rec.stressedIdx ? "stressed" : rec.secondary.has(step.syllableIndex) ? "secondary" : "unstressed",
    position: step.syllableIndex === 0 ? "initial" : isLastSyl ? "final" : step.syllableIndex === rec.syllables.length - 2 ? "penult" : "medial",
    doubledConsonant,
    silentE,
    wordInitial: k === 0,
    wordFinal: k === rec.flatSteps.length - 1,
  };
  return { step, ctx };
}

// Nearest flatSteps index (within the same syllable) to a target
// pre-reduction offset — used only to pick which step's CONTEXT
// describes an error span; never used to locate the span itself.
function nearestStepInSyllable(flatSteps: Step[], syllableIndex: number, targetOffset: number): number {
  let best = -1, bestDist = Infinity;
  for (let k = 0; k < flatSteps.length; k++) {
    const st = flatSteps[k];
    if (st.syllableIndex !== syllableIndex) continue;
    const dist = Math.min(
      Math.abs(st.offsetInSyllable - targetOffset),
      Math.abs(st.offsetInSyllable + st.phoneme.length - targetOffset),
    );
    if (dist < bestDist) { bestDist = dist; best = k; }
  }
  return best;
}

// ─────────────────────── candidate key (module scope: shared across folds) ─
interface CandKey { grapheme: string; template: string; value: string; p: string; q: string }
interface CandAgg { key: CandKey; keyStr: string; complexity: number; supportWords: Set<string> }
function keyOf(k: CandKey): string {
  return `${k.grapheme}\u0000${k.template}\u0000${k.value}\u0000${k.p}\u0000${k.q}`;
}

// ═══════════════════════════ MAIN ═════════════════════════════════════
async function main(): Promise<void> {
  const dict = dictionary as Record<string, string>;
  const cacheDir = "scripts/.common-accuracy-cache";
  const freqPath = join(cacheDir, "frequency.txt");
  if (!existsSync(freqPath)) throw new Error(`Missing ${freqPath} — run yarn test:common-accuracy --download first.`);
  const freqWordsAll = [...new Set(readFileSync(freqPath, "utf8").trim().split(/\s+/))].map((w) => w.toLowerCase());
  const freqSet = new Set(freqWordsAll);
  const top5000Set = new Set(freqWordsAll.slice(0, 5000));

  log("Loading dictionary + building testable word list...");
  let words = Object.keys(dict);
  if (LIMIT) words = words.slice(0, LIMIT * 3); // headroom before testable filter, dev only
  const testable = getTestableWords(words);
  log(`  ${testable.length} testable words`);

  // Match evaluate.ts: common English frequency-list words, excluding foreign names.
  const commonWords = testable.filter((w) => freqSet.has(w.toLowerCase()) && !isForeign(w.toLowerCase()));
  log(`  ${commonWords.length} common (frequency-list ∩ !isForeign) testable words — this is the population for the whole run`);

  log("Building EnglishG2P (disableDict:true)...");
  const g2p = new EnglishG2P({ disableDict: true });

  log("Rendering + scope-checking every common word (this validates the runtime replay)...");
  const recs: WordRec[] = [];
  let scopeOk = 0, scopeMismatch = 0;
  for (const word of commonWords) {
    const lowerWord = word.toLowerCase();
    const gold = dict[word];
    if (!gold) continue;
    const actual = g2p.predict(word, "en") ?? "";
    let r: Render;
    try {
      r = render(lowerWord);
    } catch {
      continue;
    }
    const inScope = r.reachedRoot && r.final === actual;
    if (inScope) scopeOk++;
    else { scopeMismatch++; continue; } // out of scope: leave untouched, don't add to recs
    recs.push({
      word, lowerWord, gold, goldNorm: strip(gold),
      syllables: r.syllables, stressedIdx: r.stressedIdx, secondary: r.secondary,
      ipa: r.ipa, flatSteps: r.flatSteps, baselineFinal: actual,
      curIpa: r.ipa.slice(), curFinal: actual,
      foreign: isForeign(lowerWord), top5000: top5000Set.has(lowerWord),
      isTrain: false, foldIndex: -1,
    });
  }
  log(`Scope: ${scopeOk} in-scope (pure rules-path) / ${scopeOk + scopeMismatch} common testable (${((scopeOk / (scopeOk + scopeMismatch)) * 100).toFixed(2)}% coverage)`);
  writeFileSync(join(OUT_DIR, "scope-report-common.json"), JSON.stringify({
    commonTestable: commonWords.length, inScope: scopeOk, outOfScope: scopeMismatch,
    coveragePct: (scopeOk / (scopeOk + scopeMismatch)) * 100,
  }, null, 2));

  // Assign family components to balanced folds, without consulting IPA labels.
  // Conservative spelling-family components. Labels/IPA never decide grouping.
  // Connect only attested common words; ambiguities merge rather than leak.
  const vocabulary = new Set(commonWords.map(w => w.toLowerCase()));
  const parent = new Map([...vocabulary].map(w => [w, w]));
  function root(w: string): string {
    const p = parent.get(w)!;
    if (p === w) return w;
    const r = root(p); parent.set(w, r); return r;
  }
  function joinFamily(a: string, b: string): void {
    if (!vocabulary.has(b)) return;
    const x = root(a), y = root(b);
    if (x !== y) parent.set(x < y ? y : x, x < y ? x : y);
  }
  for (const word of vocabulary) {
    const d = decompose(word);
    if (d.steps.length) for (const b of [d.base, ...d.baseAlts]) joinFamily(word, b);
    const stem = word.replace(/(?:ing|ed|es|s)$/, "");
    if (stem !== word && stem.length >= 3) {
      for (const b of [stem, stem + "e", stem.replace(/([bcdfghjklmnpqrstvwxyz])\1$/, "$1")]) joinFamily(word, b);
    }
    if (word.endsWith("ies")) joinFamily(word, word.slice(0, -3) + "y");
  }
  const families = new Map<string, WordRec[]>();
  for (const r of recs) {
    const key = root(r.lowerWord);
    const family = families.get(key) ?? []; family.push(r); families.set(key, family);
  }
  if (families.size < K_FOLDS) throw new Error(`Need at least ${K_FOLDS} spelling families, got ${families.size}`);
  const rng = mulberry32(SEED);
  const groups = seededShuffle([...families.values()], rng).sort((a,b) => b.length-a.length);
  const foldSizes = Array(K_FOLDS).fill(0);
  for (const group of groups) {
    const fold = foldSizes.indexOf(Math.min(...foldSizes));
    for (const r of group) r.foldIndex = fold;
    foldSizes[fold] += group.length;
  }
  writeFileSync(join(OUT_DIR, "family-folds.json"), JSON.stringify({
    grouping: "connected attested spelling relatives, heuristic not gold morphology",
    seed: SEED, sizes: foldSizes,
    assignments: recs.map(r => ({word:r.word, family:root(r.lowerWord), fold:r.foldIndex})),
  }, null, 2));
  log(`Assigned ${K_FOLDS} folds over ${families.size} spelling families: ${foldSizes}`);

  function scoreCorpus(recsSubset: WordRec[], useCur: boolean): { strict: number; lenient: number; n: number } {
    let strictN = 0, lenientN = 0;
    for (const r of recsSubset) {
      const pred = useCur ? r.curFinal : r.baselineFinal;
      if (strictOk(pred, r.gold)) strictN++;
      if (lenientOk(pred, r.gold)) lenientN++;
    }
    return { strict: strictN, lenient: lenientN, n: recsSubset.length };
  }

  // ── Reverse index: (grapheme,template,value) -> occurrences. Built ONCE
  // over the whole common in-scope population — it doesn't depend on the
  // train/held split, only on orthography, so every fold reuses it.
  log("Building reverse index over all in-scope common words...");
  interface IndexEntry { rec: WordRec; syllableIndex: number; offsetGuess: number }
  const revIndex = new Map<string, IndexEntry[]>();
  for (const rec of recs) {
    for (let k = 0; k < rec.flatSteps.length; k++) {
      const { step, ctx } = buildStepCtx(rec, k);
      for (const tmpl of TEMPLATES) {
        const value = tmpl.value(ctx);
        const ik = `${step.grapheme}\u0000${tmpl.name}\u0000${value}`;
        let arr = revIndex.get(ik);
        if (!arr) { arr = []; revIndex.set(ik, arr); }
        arr.push({ rec, syllableIndex: step.syllableIndex, offsetGuess: step.offsetInSyllable });
      }
    }
  }
  log(`  reverse index has ${revIndex.size} distinct (grapheme,template,value) contexts`);

  function findNearest(hay: string, needle: string, guess: number): number {
    if (needle === "") return -1;
    let best = -1, bestDist = Infinity;
    let from = 0;
    for (;;) {
      const pos = hay.indexOf(needle, from);
      if (pos < 0) break;
      const dist = Math.abs(pos - guess);
      if (dist < bestDist) { bestDist = dist; best = pos; }
      from = pos + 1;
    }
    return best;
  }
  interface ScoreResult {
    trainFix: number; trainBreak: number;
    heldFix: number; heldBreak: number;
    top5000Fix: number; top5000Break: number;
    top5000DistDown: number; top5000DistUp: number;
    foreignFix: number; foreignBreak: number;
    affectedTrainNonForeign: number;
    changedTrainNonForeign: number;
    fixedWordsTrain: Array<{ word: string; before: string; after: string; gold: string }>;
    brokenWordsTrain: Array<{ word: string; before: string; after: string; gold: string }>;
  }
  function applyOne(rec: WordRec, syllableIndex: number, offsetGuess: number, p: string, q: string): string[] | null {
    const cur = rec.curIpa[syllableIndex];
    const pos = findNearest(cur.replace(/ʌ/g, "ə"), p, offsetGuess);
    if (pos < 0) return null;
    const newSyl = cur.slice(0, pos) + q + cur.slice(pos + p.length);
    const out = rec.curIpa.slice();
    out[syllableIndex] = newSyl;
    return out;
  }
  function scoreCandidate(cand: CandKey): ScoreResult {
    const ik = `${cand.grapheme}\u0000${cand.template}\u0000${cand.value}`;
    const entries = revIndex.get(ik) ?? [];
    const res: ScoreResult = {
      trainFix: 0, trainBreak: 0, heldFix: 0, heldBreak: 0,
      top5000Fix: 0, top5000Break: 0, top5000DistDown: 0, top5000DistUp: 0,
      foreignFix: 0, foreignBreak: 0,
      affectedTrainNonForeign: 0, changedTrainNonForeign: 0,
      fixedWordsTrain: [], brokenWordsTrain: [],
    };
    const seen = new Set<WordRec>();
    for (const e of entries) {
      if (seen.has(e.rec)) continue;
      const newIpa = applyOne(e.rec, e.syllableIndex, e.offsetGuess, cand.p, cand.q);
      if (!newIpa) continue;
      seen.add(e.rec);
      const newFinal = rebuildFinal(e.rec.lowerWord, e.rec.syllables, e.rec.stressedIdx, newIpa);
      if (newFinal === e.rec.curFinal) continue;
      const wasOk = strictOk(e.rec.curFinal, e.rec.gold);
      const nowOk = strictOk(newFinal, e.rec.gold);
      const fixed = !wasOk && nowOk;
      const broken = wasOk && !nowOk;
      const distBefore = levenshtein.get(strip(e.rec.curFinal), strip(e.rec.gold));
      const distAfter = levenshtein.get(strip(newFinal), strip(e.rec.gold));
      if (e.rec.isTrain && !e.rec.foreign) {
        res.changedTrainNonForeign++;
        if (fixed) { res.affectedTrainNonForeign++; res.trainFix++; if (res.fixedWordsTrain.length < 5) res.fixedWordsTrain.push({ word: e.rec.word, before: e.rec.curFinal, after: newFinal, gold: e.rec.gold }); }
        if (broken) { res.affectedTrainNonForeign++; res.trainBreak++; if (res.brokenWordsTrain.length < 5) res.brokenWordsTrain.push({ word: e.rec.word, before: e.rec.curFinal, after: newFinal, gold: e.rec.gold }); }
      } else if (e.rec.isTrain && e.rec.foreign) {
        if (fixed) res.foreignFix++;
        if (broken) res.foreignBreak++;
      } else if (!e.rec.isTrain) {
        if (fixed) res.heldFix++;
        if (broken) res.heldBreak++;
      }
      if (e.rec.isTrain && e.rec.top5000) {
        if (fixed) res.top5000Fix++;
        if (broken) res.top5000Break++;
        if (distAfter < distBefore) res.top5000DistDown++;
        if (distAfter > distBefore) res.top5000DistUp++;
      }
    }
    return res;
  }

  const LEGACY_MIN_AFFECTED = 20, LEGACY_MIN_FIX_RATE = 0.75, LEGACY_MIN_TOP5000_FIX = 3;

  interface FoldRuleReport {
    keyStr: string; key: CandKey; complexity: number;
    trainFixes: number; trainBreaks: number; affected: number; fixRate: number;
    heldFixes: number; heldBreaks: number; top5000Fixes: number; top5000Breaks: number;
    top5000DistUp: number; pass: boolean; reason: string;
    examplesBroken: Array<{ word: string; before: string; after: string; gold: string }>;
    examplesFixed: Array<{ word: string; before: string; after: string; gold: string }>;
  }
  interface FoldReport {
    fold: number; trainN: number; heldN: number;
    mismatchCount: number; candPoolSize: number; prunedSize: number;
    acceptedCount: number; passedCount: number;
    heldStrictBefore: number; heldStrictAfterAllAccepted: number; heldStrictAfterPassed: number;
    rules: FoldRuleReport[];
  }
  const foldReports: FoldReport[] = [];

  for (let fold = 0; fold < K_FOLDS; fold++) {
    log(`\n════ FOLD ${fold + 1}/${K_FOLDS} ════`);
    for (const r of recs) {
      r.isTrain = r.foldIndex !== fold;
      r.curIpa = r.ipa.slice();
      r.curFinal = r.baselineFinal;
    }
    const trainNonForeign = recs.filter((r) => r.isTrain && !r.foreign);
    const heldNonForeign = recs.filter((r) => !r.isTrain && !r.foreign);
    log(`  train=${trainNonForeign.length} held=${heldNonForeign.length}`);
    log(`  baseline strict: train=${scoreCorpus(trainNonForeign, false).strict}/${trainNonForeign.length} held=${scoreCorpus(heldNonForeign, false).strict}/${heldNonForeign.length}`);

    // ── candidate generation from this fold's train mismatches ──
    const candPool = new Map<string, CandAgg>();
    let mismatchCount = 0;
    for (const rec of trainNonForeign) {
      const predNorm = rec.ipa.join("").replace(/ʌ/g, "ə");
      const goldNorm = rec.goldNorm.replace(/ɫ/g, "l");
      if (predNorm === goldNorm) continue;
      if (strictOk(rec.baselineFinal, rec.gold)) continue;
      mismatchCount++;
      const ops = editScript(predNorm, goldNorm);
      const spans = errorSpans(ops);
      const cumLen: number[] = [0];
      for (const s of rec.ipa) cumLen.push(cumLen[cumLen.length - 1] + s.length);
      for (const span of spans) {
        const p = predNorm.slice(span.predStart, span.predEnd);
        const q = goldNorm.slice(span.goldStart, span.goldEnd);
        if (p === "" || p === q) continue;
        let syl = -1;
        for (let i = 0; i < rec.ipa.length; i++) {
          if (span.predStart >= cumLen[i] && span.predEnd <= cumLen[i + 1]) { syl = i; break; }
        }
        if (syl < 0) continue;
        const offsetInSyl = span.predStart - cumLen[syl];
        const k = nearestStepInSyllable(rec.flatSteps, syl, offsetInSyl);
        if (k < 0) continue;
        const { step, ctx } = buildStepCtx(rec, k);
        for (const tmpl of TEMPLATES) {
          const value = tmpl.value(ctx);
          const key: CandKey = { grapheme: step.grapheme, template: tmpl.name, value, p, q };
          const ks = keyOf(key);
          let agg = candPool.get(ks);
          if (!agg) { agg = { key, keyStr: ks, complexity: tmpl.complexity, supportWords: new Set() }; candPool.set(ks, agg); }
          agg.supportWords.add(rec.word);
        }
      }
    }
    const pruned = [...candPool.values()].filter((c) => c.supportWords.size >= MIN_SUPPORT);
    log(`  ${mismatchCount} mismatched train words -> ${candPool.size} raw candidates, ${pruned.length} clear min-support=${MIN_SUPPORT}`);

    // ── greedy TBL loop ──
    interface AcceptedRule { idx: number; key: CandKey; complexity: number; score: ScoreResult; cumulativeHeldStrict: number }
    const accepted: AcceptedRule[] = [];
    let pool = pruned;
    const scoreCache = new Map<string, ScoreResult>();
    function getScore(c: CandAgg): ScoreResult {
      let s = scoreCache.get(c.keyStr);
      if (!s) { s = scoreCandidate(c.key); scoreCache.set(c.keyStr, s); }
      return s;
    }
    for (let round = 0; round < MAX_RULES; round++) {
      let best: CandAgg | null = null, bestScore: ScoreResult | null = null, bestNet = -Infinity;
      for (const c of pool) {
        const s = getScore(c);
        const net = s.trainFix - s.trainBreak;
        if (net > bestNet || (net === bestNet && best && c.complexity < best.complexity)) { best = c; bestScore = s; bestNet = net; }
      }
      if (!best || !bestScore || bestNet <= 0) break;
      const ik = `${best.key.grapheme}\u0000${best.key.template}\u0000${best.key.value}`;
      const entries = revIndex.get(ik) ?? [];
      const touched = new Set<WordRec>();
      const seen = new Set<WordRec>();
      for (const e of entries) {
        if (seen.has(e.rec)) continue;
        const newIpa = applyOne(e.rec, e.syllableIndex, e.offsetGuess, best.key.p, best.key.q);
        if (!newIpa) continue;
        seen.add(e.rec);
        const newFinal = rebuildFinal(e.rec.lowerWord, e.rec.syllables, e.rec.stressedIdx, newIpa);
        if (newFinal === e.rec.curFinal) continue;
        e.rec.curIpa = newIpa; e.rec.curFinal = newFinal; touched.add(e.rec);
      }
      const heldStrictNow = scoreCorpus(heldNonForeign, true).strict;
      accepted.push({ idx: round, key: best.key, complexity: best.complexity, score: bestScore, cumulativeHeldStrict: heldStrictNow });
      pool = pool.filter((c) => c !== best);
      for (const c of pool) {
        const cik = `${c.key.grapheme}\u0000${c.key.template}\u0000${c.key.value}`;
        const es = revIndex.get(cik) ?? [];
        if (es.some((e) => touched.has(e.rec))) scoreCache.delete(c.keyStr);
      }
    }
    log(`  greedy loop accepted ${accepted.length} rules`);

    // ── legacy filter diagnostic, applied per rule within this fold ──
    const ruleReports: FoldRuleReport[] = accepted.map((a) => {
      const affected = a.score.changedTrainNonForeign;
      const fixRate = affected > 0 ? a.score.trainFix / affected : 0;
      const pass =
        affected >= LEGACY_MIN_AFFECTED &&
        fixRate >= LEGACY_MIN_FIX_RATE &&
        a.score.top5000Fix >= LEGACY_MIN_TOP5000_FIX &&
        a.score.top5000Break === 0 &&
        a.score.top5000DistUp === 0;
      const reason = pass ? "passes" :
        `fails: ${affected < LEGACY_MIN_AFFECTED ? `affected=${affected}<${LEGACY_MIN_AFFECTED} ` : ""}${fixRate < LEGACY_MIN_FIX_RATE ? `fixRate=${fixRate.toFixed(2)}<${LEGACY_MIN_FIX_RATE} ` : ""}${a.score.top5000Fix < LEGACY_MIN_TOP5000_FIX ? `top5000Fix=${a.score.top5000Fix}<${LEGACY_MIN_TOP5000_FIX} ` : ""}${a.score.top5000Break > 0 ? `top5000Break=${a.score.top5000Break}>0 ` : ""}${a.score.top5000DistUp > 0 ? `top5000DistUp=${a.score.top5000DistUp}>0` : ""}`.trim();
      return {
        keyStr: keyOf(a.key), key: a.key, complexity: a.complexity,
        trainFixes: a.score.trainFix, trainBreaks: a.score.trainBreak,
        affected, fixRate,
        heldFixes: a.score.heldFix, heldBreaks: a.score.heldBreak,
        top5000Fixes: a.score.top5000Fix, top5000Breaks: a.score.top5000Break, top5000DistUp: a.score.top5000DistUp,
        pass, reason, examplesFixed: a.score.fixedWordsTrain, examplesBroken: a.score.brokenWordsTrain,
      };
    });
    const passedCount = ruleReports.filter((r) => r.pass).length;
    log(`  ${passedCount}/${ruleReports.length} accepted rules PASS the legacy filter diagnostic this fold`);
    for (const r of ruleReports.filter((r) => r.pass)) {
      log(`    PASS: ${r.key.grapheme} [${r.key.template}=${r.key.value}] ${JSON.stringify(r.key.p)}->${JSON.stringify(r.key.q)} affected=${r.affected} fixRate=${r.fixRate.toFixed(2)} top5000+${r.top5000Fixes}/-${r.top5000Breaks}`);
    }

    // Replay filter-passed rules from baseline for a clean held-out "afterPassed" measurement.
    for (const rec of recs) { rec.curIpa = rec.ipa.slice(); rec.curFinal = rec.baselineFinal; }
    for (const r of ruleReports) {
      if (!r.pass) continue;
      const ik = `${r.key.grapheme}\u0000${r.key.template}\u0000${r.key.value}`;
      const entries = revIndex.get(ik) ?? [];
      const seen = new Set<WordRec>();
      for (const e of entries) {
        if (seen.has(e.rec)) continue;
        const newIpa = applyOne(e.rec, e.syllableIndex, e.offsetGuess, r.key.p, r.key.q);
        if (!newIpa) continue;
        seen.add(e.rec);
        e.rec.curIpa = newIpa; e.rec.curFinal = rebuildFinal(e.rec.lowerWord, e.rec.syllables, e.rec.stressedIdx, newIpa);
      }
    }
    const heldStrictAfterPassed = scoreCorpus(heldNonForeign, true).strict;
    // Replay ALL accepted (not just passed) for the "afterAllAccepted" reference number.
    for (const rec of recs) { rec.curIpa = rec.ipa.slice(); rec.curFinal = rec.baselineFinal; }
    for (const a of accepted) {
      const ik = `${a.key.grapheme}\u0000${a.key.template}\u0000${a.key.value}`;
      const entries = revIndex.get(ik) ?? [];
      const seen = new Set<WordRec>();
      for (const e of entries) {
        if (seen.has(e.rec)) continue;
        const newIpa = applyOne(e.rec, e.syllableIndex, e.offsetGuess, a.key.p, a.key.q);
        if (!newIpa) continue;
        seen.add(e.rec);
        e.rec.curIpa = newIpa; e.rec.curFinal = rebuildFinal(e.rec.lowerWord, e.rec.syllables, e.rec.stressedIdx, newIpa);
      }
    }
    const heldStrictAfterAllAccepted = scoreCorpus(heldNonForeign, true).strict;

    foldReports.push({
      fold, trainN: trainNonForeign.length, heldN: heldNonForeign.length,
      mismatchCount, candPoolSize: candPool.size, prunedSize: pruned.length,
      acceptedCount: accepted.length, passedCount,
      heldStrictBefore: scoreCorpus(heldNonForeign, false).strict,
      heldStrictAfterAllAccepted, heldStrictAfterPassed,
      rules: ruleReports,
    });
  }

  // ── aggregate across folds ──
  const totalPassed = foldReports.reduce((s, f) => s + f.passedCount, 0);
  const totalAccepted = foldReports.reduce((s, f) => s + f.acceptedCount, 0);
  log(`\n════ SUMMARY over ${K_FOLDS} folds ════`);
  log(`  total accepted (across folds): ${totalAccepted}, total PASSING legacy filter diagnostic: ${totalPassed} (mean ${(totalPassed / K_FOLDS).toFixed(2)}/fold)`);
  const heldStrictPctBefore = foldReports.map((f) => (f.heldStrictBefore / f.heldN) * 100);
  const heldStrictPctAfterPassed = foldReports.map((f) => (f.heldStrictAfterPassed / f.heldN) * 100);
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const std = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
  log(`  held-out strict% BEFORE any rule: mean=${mean(heldStrictPctBefore).toFixed(2)} std=${std(heldStrictPctBefore).toFixed(2)}`);
  log(`  held-out strict% AFTER filter-passed rules only: mean=${mean(heldStrictPctAfterPassed).toFixed(2)} std=${std(heldStrictPctAfterPassed).toFixed(2)}`);

  // Pool passing rules by signature: how many folds did each recur+pass in.
  interface Pooled { keyStr: string; key: CandKey; foldsAccepted: number; foldsPassed: number; sumTrainFix: number; sumTrainBreak: number; sumTop5000Fix: number; sumTop5000Break: number; meanAffected: number; meanFixRate: number; }
  const pool = new Map<string, Pooled>();
  for (const f of foldReports) {
    for (const r of f.rules) {
      let p = pool.get(r.keyStr);
      if (!p) p = { keyStr: r.keyStr, key: r.key, foldsAccepted: 0, foldsPassed: 0, sumTrainFix: 0, sumTrainBreak: 0, sumTop5000Fix: 0, sumTop5000Break: 0, meanAffected: 0, meanFixRate: 0 };
      p.foldsAccepted++;
      if (r.pass) p.foldsPassed++;
      p.sumTrainFix += r.trainFixes; p.sumTrainBreak += r.trainBreaks;
      p.sumTop5000Fix += r.top5000Fixes; p.sumTop5000Break += r.top5000Breaks;
      p.meanAffected += r.affected; p.meanFixRate += r.fixRate;
      pool.set(r.keyStr, p);
    }
  }
  const pooledArr = [...pool.values()].map((p) => ({ ...p, meanAffected: p.meanAffected / p.foldsAccepted, meanFixRate: p.meanFixRate / p.foldsAccepted }));
  pooledArr.sort((a, b) => (b.foldsPassed - a.foldsPassed) || (b.sumTop5000Fix - a.sumTop5000Fix) || ((b.sumTrainFix - b.sumTrainBreak) - (a.sumTrainFix - a.sumTrainBreak)));
  log(`\n  ${pooledArr.length} distinct candidate readings were accepted in at least one fold; ${pooledArr.filter((p) => p.foldsPassed > 0).length} passed the legacy filter diagnostic in at least one fold`);
  log(`  Top 15 by folds-passed / top5000 evidence:`);
  for (const p of pooledArr.slice(0, 15)) {
    log(`    ${p.key.grapheme} [${p.key.template}=${p.key.value}] ${JSON.stringify(p.key.p)}->${JSON.stringify(p.key.q)}  foldsAccepted=${p.foldsAccepted}/${K_FOLDS} foldsPassed=${p.foldsPassed}/${K_FOLDS} sumTrain+${p.sumTrainFix}/-${p.sumTrainBreak} sumTop5000+${p.sumTop5000Fix}/-${p.sumTop5000Break} meanAffected=${p.meanAffected.toFixed(1)} meanFixRate=${p.meanFixRate.toFixed(2)}`);
  }

  const summary = {
    toolSha256: toolHash,
    dictionarySha256: createHash("sha256").update(JSON.stringify(dict)).digest("hex"),
    frequencySha256: createHash("sha256").update(readFileSync(freqPath)).digest("hex"),
    baselineSha256: createHash("sha256").update(JSON.stringify(recs.map(r => [r.word, r.baselineFinal]))).digest("hex"),
    structuralFeatures: argv.includes("--structural"), familyGrouped: true,
    maxWordLength: Number.isFinite(MAX_WORD_LENGTH) ? MAX_WORD_LENGTH : null,
    longWordsInScope: recs.filter(r => r.word.length > 12).length,
    kFolds: K_FOLDS, minSupport: MIN_SUPPORT, maxRules: MAX_RULES, seed: SEED,
    replay: "actual predict() with an isolated ruleSyllables hook; no replica tail",
    diagnosticFilterUsesTrainOnly: true,
    population: { commonTestable: commonWords.length, inScope: recs.length, coveragePct: (scopeOk / (scopeOk + scopeMismatch)) * 100 },
    totalAccepted, totalPassed, meanPassedPerFold: totalPassed / K_FOLDS,
    heldStrictPctBefore: { mean: mean(heldStrictPctBefore), std: std(heldStrictPctBefore), perFold: heldStrictPctBefore },
    heldStrictPctAfterAllAccepted: { mean: mean(foldReports.map(f => 100 * f.heldStrictAfterAllAccepted / f.heldN)),
      strictCorrect: foldReports.reduce((s,f) => s + f.heldStrictAfterAllAccepted, 0),
      total: foldReports.reduce((s,f) => s + f.heldN, 0) },
    heldStrictPctAfterPassed: { mean: mean(heldStrictPctAfterPassed), std: std(heldStrictPctAfterPassed), perFold: heldStrictPctAfterPassed },
    selection: "train net word fixes > 0, up to max-rules; held-out does not select k",
    perFold: foldReports.map((f) => ({
      fold: f.fold, trainN: f.trainN, heldN: f.heldN, mismatchCount: f.mismatchCount,
      candPoolSize: f.candPoolSize, prunedSize: f.prunedSize, acceptedCount: f.acceptedCount, passedCount: f.passedCount,
      heldStrictPctBefore: (f.heldStrictBefore / f.heldN) * 100,
      heldStrictPctAfterAllAccepted: (f.heldStrictAfterAllAccepted / f.heldN) * 100,
      heldStrictPctAfterPassed: (f.heldStrictAfterPassed / f.heldN) * 100,
      rules: f.rules,
      passingRules: f.rules.filter((r) => r.pass).map((r) => ({ grapheme: r.key.grapheme, template: r.key.template, value: r.key.value, from: r.key.p, to: r.key.q, affected: r.affected, fixRate: r.fixRate, top5000Fixes: r.top5000Fixes, top5000Breaks: r.top5000Breaks, examplesFixed: r.examplesFixed })),
    })),
    pooledCandidates: pooledArr,
  };
  writeFileSync(join(OUT_DIR, "cv-common-report.json"), JSON.stringify(summary, null, 2));
  log(`\nWrote ${join(OUT_DIR, "cv-common-report.json")}`);
  log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
