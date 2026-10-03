/**
 * P4: Mine exception candidates from the dict.
 *
 * Runs the production rule pipeline (disableDict=true) over every dict
 * entry, computes Levenshtein distance to the dict IPA, and outputs the
 * words where the rules deviate too far (ed ≥ threshold) as exception
 * candidates.
 *
 * Goal: produce a shippable exceptions list that, combined with the rule
 * pipeline, gives near-dict accuracy at a fraction of the dict's size.
 * The current dict is ~2.7MB / 100K entries; targeting ~5K-10K exceptions
 * would cut shipping size by ~95%.
 *
 * Output: data/en/exception-candidates.json — sorted by edit distance
 * (worst first), so manual review can focus on the most impactful.
 */

import { readFileSync, writeFileSync } from "fs";
import { FUNCTION_WORDS } from "../src/en/pos-tagger";
import * as levenshtein from "fast-levenshtein";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

// disableDict still consults lexical stems during morphology. Reset the
// previous output before loading G2P, otherwise repeated builds learn from
// their own exception table and alternately add/remove the same entries.
writeFileSync("./data/en/exceptions.json", "{}");
const EnglishG2P: typeof import("../src/en/g2p").default =
  require("../src/en/g2p").default;
const g2p = new EnglishG2P({ disableDict: true });

const SIMILAR: string[][] = [
  ["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"],
];
function norm(s: string): string {
  return s.replace(/[ˈˌ]/g, "");
}
// Index (from word start) of the vowel nucleus carrying primary stress;
// -1 if unmarked. Used to detect contrastive primary-stress mismatches.
const PRIMARY_V = "aeiouɑæɛɪɔʊʌəɝ";
function primaryNucleusIdx(s: string): number {
  const i = s.indexOf("ˈ");
  if (i < 0) return -1;
  let n = 0;
  let inV = false;
  for (let j = 0; j < i; j++) {
    if (PRIMARY_V.includes(s[j])) {
      if (!inV) n++;
      inV = true;
    } else inV = false;
  }
  return n;
}

function canon(s: string): string {
  let t = norm(s);
  SIMILAR.forEach((g: string[]) => {
    const c = g[0];
    for (let i = 1; i < g.length; i++) t = t.replace(new RegExp(g[i], "g"), c);
  });
  return t;
}

// Recognize dictionary-attested letter sequences (abc → eɪ-bi-si).
// Their pronunciation cannot be inferred from lowercase spelling; retain
// them as lexical entries instead of discarding them from the runtime data.
const LETTER_NAMES: Record<string, string> = {
  a: "eɪ", b: "bi", c: "si", d: "di", e: "i", f: "ɛf", g: "dʒi", h: "eɪtʃ",
  i: "aɪ", j: "dʒeɪ", k: "keɪ", l: "ɛɫ", m: "ɛm", n: "ɛn", o: "oʊ", p: "pi",
  q: "kju", r: "ɑɹ", s: "ɛs", t: "ti", u: "ju", v: "vi", w: "dʌbəɫju",
  x: "ɛks", y: "waɪ", z: "zi",
};
function isAcronym(word: string, ipa: string): boolean {
  // Canonicalize both sides so ə≡ʌ, ɫ≡l, ɑ≡ɔ etc. — needed because the
  // dict uses dialectal/stylistic variants (e.g., "w"=dəbəɫju in dict,
  // dʌbəɫju in our LETTER_NAMES).
  let p = canon(ipa);
  for (const c of word) {
    const name = LETTER_NAMES[c];
    if (!name) return false;
    const l = canon(name);
    if (!p.startsWith(l)) return false;
    p = p.slice(l.length);
  }
  return p === "";
}

// ─── Linguistic-origin classifier ──────────────────────────────────────────
//
// Foreign borrowings cannot be predicted by English rules — they retain
// (some of) the source language's phonology. Categorising the candidates
// lets the threshold decision be informed by linguistics, not just by ED:
// foreign-origin words *must* ship in the exception list regardless of
// ED, while native words with high ED suggest rule bugs we should fix.
//
// Heuristics are orthographic only — surface patterns characteristic of
// the source language. They will miss some assimilated borrowings, but
// the goal is to catch the obvious cases (Polish -wski, French -eaux,
// Italian -elli, Spanish -ez, Russian -ov, etc.).

type Origin =
  | "polish"
  | "french"
  | "italian"
  | "spanish"
  | "german"
  | "japanese"
  | "russian"
  | "greek"
  | "arabic"
  | "celtic"
  | "asian"
  | "native";

interface OriginRule {
  origin: Exclude<Origin, "native">;
  test: (w: string) => boolean;
}

const ORIGIN_RULES: OriginRule[] = [
  // Polish — extremely distinctive consonant clusters and surname endings
  { origin: "polish", test: (w) => /(wski|wska|cki|cka|czyk|czak|wicz)$/.test(w) },
  { origin: "polish", test: (w) => /(cz|sz|rz|szcz)/.test(w) && !/^(scratch|scheme|schedule|sch)/.test(w) },
  // Italian
  { origin: "italian", test: (w) => /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|ucci|aldo|otto|essa)$/.test(w) },
  { origin: "italian", test: (w) => /(gli|gn[aeiou])/.test(w) && w.length >= 5 },
  // French
  { origin: "french", test: (w) => /(eaux|aux|eau|oise|ois|aire|ette|elle|gne|ille|ique)$/.test(w) },
  { origin: "french", test: (w) => /(beau|deau|reau|teau|mont|jean)/.test(w) },
  // Spanish / Portuguese
  { origin: "spanish", test: (w) => /(ez|os|illo|illa|ando|endo|ente)$/.test(w) && w.length >= 5 },
  { origin: "spanish", test: (w) => /(rodriguez|gonzalez|hernandez|sanchez|gomez|santos)/.test(w) },
  // German
  { origin: "german", test: (w) => /(stein|berg|burg|mann|hoff|holz|brunn|heim|bach|wald|enstein)$/.test(w) },
  { origin: "german", test: (w) => /(sch|tsch|pf)/.test(w) && w.length >= 5 && !/(schedule|scheme|school)/.test(w) },
  // Russian (transliterated)
  { origin: "russian", test: (w) => /(ovich|evich|ovna|evna|insky|insk|ova|ev|ov|enko|sky)$/.test(w) },
  // Greek
  { origin: "greek", test: (w) => /(opoulos|idis|akis|opolous|antos|aros)$/.test(w) },
  // Arabic / Middle Eastern
  { origin: "arabic", test: (w) => /(ahmed|hamed|hussein|hassan|abdul|mohammed|mohamed)/.test(w) },
  // Celtic (Irish/Scottish/Welsh)
  { origin: "celtic", test: (w) => /^(mc|mac|o')/.test(w) },
  { origin: "celtic", test: (w) => /(ough|llwyd|gwyn|aoibh)/.test(w) && w.length >= 5 },
  // Japanese (romanized: Hepburn-ish)
  { origin: "japanese", test: (w) => /(tsuda|shima|moto|hara|yama|kawa|saki|naka|hashi|guchi|sato|suzuki|takaha)$/.test(w) },
  // Other Asian (Chinese/Korean/Vietnamese surnames in dict are often
  // 3-4 letter open syllables — too ambiguous to reliably classify; skip)
  { origin: "asian", test: (w) => /^(nguyen|tran|huynh|wang|chen|liu|zhang|kim|lee|park|choi)$/.test(w) },
];

function originOf(word: string): Origin {
  for (const r of ORIGIN_RULES) {
    if (r.test(word)) return r.origin;
  }
  return "native";
}

interface Cand {
  word: string;
  dictIpa: string;
  predIpa: string;
  ed: number;
  origin: Origin;
}

const candidates: Cand[] = [];
const initialisms: Record<string, string> = Object.create(null);
// word -> dict IPA for every rule-exact word (ed<1) that this pass
// therefore never ships. See the eviction comment at the `ed < 1` check
// below and the "Dependency-aware eviction" section at the end of the
// file that consumes this map.
const evictedMap = new Map<string, string>();
let total = 0;
let withinLenient = 0;
let acronymsSkipped = 0;

// Also track origin distribution across the *whole* dict, so we can see
// how foreign-origin words concentrate in the high-ED tail.
const originAll: Map<Origin, number> = new Map();

for (const [word, dictIpa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  total++;
  if (isAcronym(word, dictIpa)) {
    initialisms[word] = dictIpa;
    acronymsSkipped++;
    continue;
  }
  const origin = originOf(word);
  originAll.set(origin, (originAll.get(origin) ?? 0) + 1);
  const pred = g2p.predict(word, "en");
  if (!pred) continue;
  const d = levenshtein.get(norm(pred), norm(dictIpa));
  // Primary-stress position (vowel-nuclei before the ˈ mark). canon()
  // strips stress, so a word the rules get segmentally right but mis-stress
  // (bouquet ˈbukeɪ vs buˈkeɪ) scores d=0 and would be skipped. Treat a
  // primary-stress-position mismatch as a real error worth memorizing —
  // lexical primary stress IS contrastive. (Secondary stress is ignored.)
  const stressDiff = primaryNucleusIdx(pred) !== primaryNucleusIdx(dictIpa);
  const ed = stressDiff ? Math.max(d, 1) : d;
  // Floor at ed≥1: ship every in-dict word the rules don't already
  // reproduce (after similar-vowel canonicalization). The runtime
  // returns the dict value for these directly, so common words keep
  // their exact pronunciation even as the rule engine improves. (A
  // higher floor shrinks the table but lets the rule path's residual
  // ed≤1 deviations leak through on known words — which the test
  // suite pins to exact dict values.)
  if (ed < 1) {
    withinLenient++;
    // This word never enters `candidates`/`shippedMap` — it's the
    // "rule-exact eviction" this file's docstring and AGENTS.md's
    // "get/-ange(r) pass" describe: correctly derivable in isolation, so
    // it's dropped from exceptions.json. But `tryMorphologicalAnalysis`
    // (src/en/g2p.ts) still looks stems up in `this.dictionary` — via
    // `wellKnown()`/`lex()` for the -s/-ed/-ing/-er/-al/-able/-ation
    // family and the -nge -es corroboration, and directly via
    // `this.dictionary[chunk]` for `tryDecomposition` — REGARDLESS of
    // `disableDict`, since that flag only gates the WHOLE WORD's own
    // direct table hit (`predictInternal`'s Priority 2), not a stem
    // lookup buried inside morphology. So a derived word whose own
    // rules-only prediction depends on this exact stem being in the
    // table (getting/changed/designed/errors/tutorials/location were
    // all this, each currently patched by a narrow rule fallback — see
    // AGENTS.md) silently regresses under `disableDict:true` — which is
    // exactly what `yarn test:eval` measures, and exactly the path a
    // genuinely out-of-dictionary derived word takes in production too,
    // since it has no memorized entry of its own to fall back on. Kept
    // here (word -> dict IPA) so the dependency-aware eviction pass
    // below can test, for every word whose rules-only prediction is
    // currently wrong, whether restoring some subset of this set fixes
    // it — and re-pin only that subset, rather than shipping the whole
    // evicted set (which would defeat eviction's compression entirely)
    // or hand-patching each new case in g2p.ts as it's found.
    evictedMap.set(word, dictIpa);
    continue;
  }
  candidates.push({ word, dictIpa, predIpa: pred, ed, origin });
}

// Sort by edit distance (worst first), then alphabetically for stability.
candidates.sort((a: Cand, b: Cand) => b.ed - a.ed || a.word.localeCompare(b.word));

const fmt = (n: number, d: number) => ((n / d) * 100).toFixed(2) + "%";

console.log(`Total alphabetic dict entries:        ${total}`);
console.log(`Initialisms retained separately:      ${acronymsSkipped}`);
console.log(`Rules already within ed < 2 of dict:  ${withinLenient} (${fmt(withinLenient, total)})`);
console.log(`Exception candidates (ed ≥ 2):        ${candidates.length} (${fmt(candidates.length, total)})`);

// Histogram by edit distance
const hist: Map<number, number> = new Map();
for (const c of candidates) hist.set(c.ed, (hist.get(c.ed) ?? 0) + 1);
console.log(`\n=== ED distribution among exceptions ===`);
Array.from(hist.entries()).sort((a, b) => a[0] - b[0]).forEach(([ed, n]) => {
  console.log(`  ed=${ed.toString().padStart(2)}: ${n}`);
});

// Origin distribution across the whole dict (so we know baseline rates)
console.log(`\n=== Origin distribution: whole dict vs exception candidates ===`);
const denomAll = total - acronymsSkipped;
const allOrigins: Origin[] = ["native", "polish", "french", "italian", "spanish", "german", "russian", "greek", "celtic", "arabic", "japanese", "asian"];
const inExceptions: Map<Origin, number> = new Map();
for (const c of candidates) inExceptions.set(c.origin, (inExceptions.get(c.origin) ?? 0) + 1);
console.log(`  ${"origin".padEnd(10)}  ${"all dict".padStart(8)}  ${"ex cand".padStart(8)}  ${"ex/all".padStart(7)}`);
for (const o of allOrigins) {
  const allN = originAll.get(o) ?? 0;
  const exN = inExceptions.get(o) ?? 0;
  if (allN === 0) continue;
  console.log(`  ${o.padEnd(10)}  ${allN.toString().padStart(8)}  ${exN.toString().padStart(8)}  ${fmt(exN, allN).padStart(7)}`);
}

// Algorithmic threshold ladder (foreign + native both gated by same ED)
console.log(`\n=== Pure ED threshold ladder ===`);
for (const t of [2, 3, 4, 5, 6]) {
  const filtered = candidates.filter((c: Cand) => c.ed >= t);
  const size = JSON.stringify(Object.fromEntries(filtered.map((c: Cand) => [c.word, c.dictIpa]))).length;
  const lenientCovered = withinLenient + filtered.length;
  console.log(
    `  ed≥${t}: ${filtered.length.toString().padStart(6)} entries  (${(size / 1024).toFixed(1)} KB)  lenient on dict: ${fmt(lenientCovered, denomAll)}`
  );
}

// Linguistically-informed policy: keep ALL foreign-origin candidates
// (English rules can't predict them — they're not "rule bugs"), gate
// native candidates by a separate ED threshold (those *should* be
// derivable; high ED there indicates either a rule gap or genuine
// English irregularity worth shipping as exception).
console.log(`\n=== Hybrid policy: all foreign + native ed≥N ===`);
const foreignCands = candidates.filter((c: Cand) => c.origin !== "native");
const nativeCands = candidates.filter((c: Cand) => c.origin === "native");
console.log(`  foreign candidates always shipped: ${foreignCands.length}`);
console.log(`  native candidates by threshold:`);
for (const t of [2, 3, 4, 5, 6]) {
  const nativeFiltered = nativeCands.filter((c: Cand) => c.ed >= t);
  const total = [...foreignCands, ...nativeFiltered];
  const size = JSON.stringify(Object.fromEntries(total.map((c: Cand) => [c.word, c.dictIpa]))).length;
  const lenientCovered = withinLenient + total.length;
  console.log(
    `    native ed≥${t}: total ${total.length.toString().padStart(6)} (${nativeFiltered.length} native)  (${(size / 1024).toFixed(1)} KB)  lenient on dict: ${fmt(lenientCovered, denomAll)}`
  );
}

// Top 20 worst (largest ed) — with origin tag
console.log(`\n=== 20 worst-prediction words (with origin guess) ===`);
for (const c of candidates.slice(0, 20)) {
  console.log(
    `  ed=${c.ed.toString().padStart(2)}  ${c.origin.padEnd(9)} ${c.word.padEnd(20)} dict=${c.dictIpa.padEnd(25)} pred=${c.predIpa}`
  );
}

// Worst 15 NATIVE words specifically — these are the rule-bug suspects.
console.log(`\n=== 15 worst native-origin words (rule-gap candidates) ===`);
for (const c of nativeCands.slice(0, 15)) {
  console.log(`  ed=${c.ed.toString().padStart(2)}  ${c.word.padEnd(20)} dict=${c.dictIpa.padEnd(25)} pred=${c.predIpa}`);
}

// ─── Output files ──────────────────────────────────────────────────────
//
// 1. exception-candidates.json — full investigation set (everything ed≥2);
//    not shipped, used for analysis and downstream curation.
// 2. exceptions.json — the *canonical* runtime exception table, generated
//    using the hybrid policy: ship ALL foreign-origin candidates plus
//    native candidates above NATIVE_THRESHOLD. This honors the
//    linguistic reality that foreign borrowings can't be derived from
//    English rules. Threshold is overridable via CLI:
//
//      yarn ts-node scripts/mine-exceptions.ts --native-min 4
const cliMin = (() => {
  const idx = process.argv.indexOf("--native-min");
  if (idx >= 0 && idx + 1 < process.argv.length) {
    const n = parseInt(process.argv[idx + 1], 10);
    if (!isNaN(n)) return n;
  }
  return 2; // default — preserves dict-level lenient accuracy (99.8%)
            // at ~22% the size of dict.json. ed≥3 (~304 KB) is also
            // viable for max compression at the cost of ~13pts lenient.
})();

const candidatesMap: Record<string, string> = {};
for (const c of candidates) candidatesMap[c.word] = c.dictIpa;
writeFileSync(
  "./data/en/exception-candidates.json",
  JSON.stringify(candidatesMap),
  "utf8"
);
console.log(`\nWrote data/en/exception-candidates.json (${candidates.length} entries, ${(JSON.stringify(candidatesMap).length / 1024).toFixed(1)} KB)`);

// A standard IPA transcription has exactly one primary stress.
// scripts/build-dict.ts's normalizeMultiplePrimaryStress now fixes this at
// the source — dict.json itself never carries 2+ ˈ marks any more — so
// dictIpa is always single-primary here and no separate eviction check is
// needed. (Previously ~1,400 dict entries reached this point with 2+ ˈ
// marks, e.g. addresses→ˈæˈdɹɛsɪz, and were dropped outright whenever the
// rule path already produced a single primary; that just left the word
// relying on the rule never regressing, with no memorized fallback and a
// scoring reference that couldn't be matched either way. `primaryCount` is
// still used below, as a sanity guard on the refinement/redundancy pass.)
const primaryCount = (s: string): number => (s.match(/ˈ/g) ?? []).length;
// The ipa-dict source frequently drops /t/ in an /nt/ cluster (county
// ˈkaʊni, accountable əˈkaʊnəbəl) — a casual-speech reduction the AI judge
// penalises in careful pronunciation. When the spelling has "nt" and the
// rule keeps it but the dict dropped it, don't memorize the corrupt dict
// value; the rule's /nt/ form is the better pronunciation.
const ntDropped = (c: Cand): boolean =>
  c.word.includes("nt") &&
  norm(c.predIpa).includes("nt") &&
  !norm(c.dictIpa).includes("nt") &&
  c.dictIpa.includes("n");
const shippedCands = candidates.filter(
  (c: Cand) =>
    !ntDropped(c) &&
    (c.origin !== "native" || c.ed >= cliMin)
);
const shippedMap: Record<string, string> = {};
for (const c of shippedCands) shippedMap[c.word] = c.dictIpa;
// Keep alphabet names for isolated letters and the existing uppercase
// initialism speller. These are sourced from the same pronunciation lexicon.
for (const letter of "abcdefghijklmnopqrstuvwxyz") {
  if (dict[letter]) initialisms[letter] = dict[letter];
}
// Keep spelling pronunciations separate from lexical stems: GA + s must
// not intercept gas, and letter sequences must not become compound parts.
writeFileSync("./data/en/initialisms.json", JSON.stringify(initialisms), "utf8");
for (const letter of ["a", "i"]) {
  if (dict[letter]) shippedMap[letter] = dict[letter];
}
// Closed-class function words are the highest-frequency vocabulary, and
// several are lexically irregular in ways spelling-driven rules can't
// derive — TH-voicing (this/that/those/the → /ð/, not /θ/) and weak
// vowels. The edit-distance gate deliberately leaves high-ED native words
// for rule fixes, which drops exactly these. Always ship every function
// word that has a dictionary entry so the most common words in any text
// are correct by lookup rather than by an unreliable spelling rule.
for (const w of FUNCTION_WORDS) {
  if (dict[w]) shippedMap[w] = dict[w];
}
// Adding lexical stems can change morphology/decomposition for words that
// matched on the empty-table pass (collect + ion is a typical false split).
// Close over those new errors using the production pipeline. Entries only
// accumulate, so this cannot oscillate between successive builds. No word
// frequency list or benchmark reference participates in this process.
let refinementRounds = 0;
const refinedWords = new Set<string>();
for (;;) {
  writeFileSync("./data/en/exceptions.json", JSON.stringify(shippedMap), "utf8");
  delete require.cache[require.resolve("../data/en/exceptions.json")];
  delete require.cache[require.resolve("../data/en/initialisms.json")];
  delete require.cache[require.resolve("../src/en/g2p")];
  const RuntimeG2P: typeof import("../src/en/g2p").default = require("../src/en/g2p").default;
  const runtime = new RuntimeG2P();
  let added = 0;
  for (const [word, dictIpa] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(word) || Object.prototype.hasOwnProperty.call(shippedMap, word) || initialisms[word]) continue;
    const predIpa = runtime.predict(word, "en");
    if (!predIpa) continue;
    const distance = levenshtein.get(norm(predIpa), norm(dictIpa));
    const ed = primaryNucleusIdx(predIpa) !== primaryNucleusIdx(dictIpa)
      ? Math.max(distance, 1) : distance;
    const candidate: Cand = { word, dictIpa, predIpa, ed, origin: originOf(word) };
    if (ed < 1 || (candidate.origin === "native" && ed < cliMin)) continue;
    if (ntDropped(candidate)) continue;
    shippedMap[word] = dictIpa;
    refinedWords.add(word);
    added++;
  }
  refinementRounds++;
  console.log(`Runtime refinement ${refinementRounds}: ${added} additional exceptions`);
  if (added === 0) break;
}
// Refinement can temporarily need an exception that later stems make
// redundant. Retain its lexical availability, but avoid changing only the
// primary-stress boundary or secondary marks when the rule form is
// redundant. Segment strings and the primary nucleus must be identical;
// stale secondary marks can otherwise promote a weak schwa to STRUT.
const FinalG2P: typeof import("../src/en/g2p").default = require("../src/en/g2p").default;
const finalRules = new FinalG2P({ disableDict: true });
for (const word of refinedWords) {
  const lexical = shippedMap[word];
  const predicted = finalRules.predict(word, "en");
  if (predicted && primaryCount(lexical) === 1 && primaryCount(predicted) === 1 &&
      norm(lexical) === norm(predicted) &&
      primaryNucleusIdx(lexical) === primaryNucleusIdx(predicted)) {
    shippedMap[word] = predicted;
  }
}
const shippedSize = JSON.stringify(shippedMap).length;
writeFileSync(
  "./data/en/exceptions.json",
  JSON.stringify(shippedMap),
  "utf8"
);
console.log(
  `Wrote data/en/exceptions.json (hybrid policy: all foreign + native ed≥${cliMin}): ${Object.keys(shippedMap).length} entries, ${(shippedSize / 1024).toFixed(1)} KB`
);
const shippedForeign = shippedCands.filter((c: Cand) => c.origin !== "native").length;
const shippedNative = shippedCands.length - shippedForeign;
console.log(`  initial pass: ${shippedForeign} foreign + ${shippedNative} native`);
console.log(`  separate initialisms: ${Object.keys(initialisms).length} entries`);

// ─── Dependency-aware eviction (2026-09-28) ────────────────────────────────
//
// The eviction above (ed<1 → never shipped) is correct for the WORD IN
// ISOLATION, but `tryMorphologicalAnalysis` (src/en/g2p.ts) looks its
// STEMS up in `this.dictionary` too, through `wellKnown()`/`lex()` — for
// the -s/-ed/-ing/-er/-ation/-ance/-ence/-al/-able family and the -nge
// -es corroboration — and, for `tryDecomposition`, directly through
// `this.dictionary[chunk]`. Neither check is gated by `disableDict`
// (only the WHOLE WORD's own direct table hit is), so an evicted stem
// silently changes what `disableDict:true` — i.e. `yarn test:eval`, and
// any real out-of-dictionary derived word at runtime — predicts for
// every word that depends on it. getting/changed/designed/errors/
// tutorials/location all broke this way; each currently has a narrow
// rule-level fallback patch (AGENTS.md's "get/-ange(r)" and "de+si-
// voicing" passes). This section replaces the need to keep discovering
// and hand-patching this class one word at a time: it empirically finds
// every dict word whose disableDict:true prediction depends on an
// evicted stem, and re-pins (ships) only that stem.
//
// Method: predict every dict word twice with the real runtime
// (disableDict:true, so the word's own direct entry is bypassed exactly
// as `yarn test:eval` bypasses it) — once against `shippedMap` (what
// ships today) and once against `shippedMap ∪ evictedMap` (eviction
// undone entirely). A word that's wrong in the first pass and exact in
// the second depends on SOME evicted stem. Attribution then narrows
// that down to the specific stem(s) by testing candidates individually
// against a per-instance `customDict` (checked by `wellKnown()`, so it
// reaches every handler above except `tryDecomposition`, which reads
// `this.dictionary` directly and needs the real file — see Phase 2).
//
// NOTE: dict-ENABLED runtime (disableDict:false, the actual shipped
// predict()) is essentially unaffected by this bug: a word whose own
// disableDict:true prediction is wrong (with an EMPTY table) is, BY
// CONSTRUCTION, itself a `shippedMap` entry (a direct table hit), so
// its dict-enabled prediction never reaches the broken stem lookup at
// all. The bug only shows up (a) in disableDict:true evaluation, and
// (b) for real derived words that aren't themselves dict entries. Both
// matter — (a) is `yarn test:eval`/`evaluate-strict`, and (b) is
// production text — but neither is `yarn test:parity`/
// `test:common-accuracy`, which only score words that ARE in the dict.
const depT0 = Date.now();

function isExactMatch(pred: string | null | undefined, dictIpa: string): boolean {
  if (!pred) return false;
  if (norm(pred) !== norm(dictIpa)) return false;
  return primaryNucleusIdx(pred) === primaryNucleusIdx(dictIpa);
}

function reloadRuntime(): typeof import("../src/en/g2p").default {
  delete require.cache[require.resolve("../data/en/exceptions.json")];
  delete require.cache[require.resolve("../data/en/initialisms.json")];
  delete require.cache[require.resolve("../src/en/g2p")];
  return require("../src/en/g2p").default;
}

const dictWords: [string, string][] = Object.entries(dict).filter(
  ([w]) => /^[a-z]+$/.test(w) && !initialisms[w],
) as [string, string][];

// Diagnostic only (not used to drive attribution): dict-ENABLED
// correctness with today's shippedMap, confirming the reasoning above —
// this should be near-total agreement with test:parity's own strict
// number, i.e. this eviction bug contributes ~nothing here, because
// every word this bug touches is memorized directly in shippedMap.
{
  const initCtor: typeof import("../src/en/g2p").default = require("../src/en/g2p").default;
  const dictEnabled = new initCtor();
  let wrongDictEnabled = 0;
  for (const [word, dictIpa] of dictWords) {
    if (!isExactMatch(dictEnabled.predict(word, "en"), dictIpa)) wrongDictEnabled++;
  }
  console.log(
    `\nDict-enabled (shippedMap only) mismatches: ${wrongDictEnabled}/${dictWords.length} — ` +
      `expected to track test:parity's own strict gap, not this eviction bug.`,
  );
}

// Run A: disableDict:true against shippedMap — what test:eval measures
// today, and what a real out-of-dictionary derived word gets today.
const RunA = reloadRuntime();
const runtimeA = new RunA({ disableDict: true });
const correctA = new Set<string>();
for (const [word, dictIpa] of dictWords) {
  if (isExactMatch(runtimeA.predict(word, "en"), dictIpa)) correctA.add(word);
}

// Run B: same, but with every evicted stem restored — simulates
// "eviction never happened" to find which words depend on it.
writeFileSync(
  "./data/en/exceptions.json",
  JSON.stringify({ ...shippedMap, ...Object.fromEntries(evictedMap) }),
  "utf8",
);
const RunB = reloadRuntime();
const runtimeB = new RunB({ disableDict: true });
const correctB = new Set<string>();
for (const [word, dictIpa] of dictWords) {
  if (isExactMatch(runtimeB.predict(word, "en"), dictIpa)) correctB.add(word);
}

const flipSet = new Map<string, string>(); // wrong in A, exact in B
let antiFlips = 0; // exact in A, wrong in B — blanket-restore risk
for (const [word, dictIpa] of dictWords) {
  const a = correctA.has(word);
  const b = correctB.has(word);
  if (!a && b) flipSet.set(word, dictIpa);
  if (a && !b) antiFlips++;
}
console.log(
  `Rules-only (disableDict:true) mismatches under shippedMap: ${dictWords.length - correctA.size}`,
);
console.log(
  `  fixed if eviction were entirely undone: ${flipSet.size} ` +
    `(anti-flips from a blanket restore: ${antiFlips})`,
);

// Restore the real candidate table before attribution probing.
writeFileSync("./data/en/exceptions.json", JSON.stringify(shippedMap), "utf8");
let AttribCtor = reloadRuntime();

// `attributed`: stem -> the flip words it was found responsible for.
// Used at the end to weigh a stem's benefit against any regression it
// turns out to also cause.
const attributed = new Map<string, string[]>();
function attribute(stem: string, word: string): void {
  rePinned.set(stem, evictedMap.get(stem)!);
  const words = attributed.get(stem);
  if (words) words.push(word); else attributed.set(stem, [word]);
}

// Phase 1 (fast, customDict-based): every regular derivational relation
// (plural/-ed/-ing/consonant-doubling/-ate/-y agent noun/the -nge -es
// corroboration) keeps the stem's initial letters, so bucketing evicted
// words by their first 3 letters finds a derived word's stem(s) without
// hand-modeling each suffix transform. `addPronunciation()` writes to
// a per-instance customDict, which `wellKnown()` checks before
// `this.dictionary` — reaching every handler except `tryDecomposition`
// (Phase 2). Tried individually only, first match wins: a same-prefix
// bucket routinely holds a dozen+ evicted words with no real relation
// to each other (e.g. "con"/"cal"/"conference" all bucket under "con"),
// so a "try the whole bucket together" fallback was measured and
// dropped — it never actually resolved anything Phase 2 didn't already
// reach on its own, since it only fires when EVERY individual member
// fails, which for this dict is exactly the tryDecomposition words
// Phase 2 is built for.
const rePinned = new Map<string, string>();
const evictedBuckets = new Map<string, string[]>();
for (const word of evictedMap.keys()) {
  const key = word.slice(0, 3);
  const arr = evictedBuckets.get(key);
  if (arr) arr.push(word);
  else evictedBuckets.set(key, [word]);
}
// A stem ending in one of inflect()'s closed-inflection-stem clusters
// plus a silent e (change, range, hinge, singe — the exact set
// `inflect()`'s own "ll|ss|ch|sh|ck|ng|lk" closed-stem list guards) is
// never re-pinned. `inflect()`'s FIRST -ed/-ing check is an ungated
// `wellKnown(base + "e")`: adding such a word directly to the table
// makes it a literal hit there, bypassing the -nge pass's whole reason
// to exist — corroborating a dropped-e reading only through the word's
// own attested -es plural, precisely because the bare-stem reading
// (bring/sing/hang, no dropped e) is orthographically identical and
// common. Measured: re-pinning "singe" (for a legitimate flip needing
// it as ITS OWN base, e.g. singeing) silently broke "singing" — sing +
// -ing — through this exact short-circuit; "singing" isn't a dict
// headword, so no metric here sees it, only `yarn test`'s pinned
// -nge-inflections regressions do. The -es corroboration mechanism
// itself is untouched and still free to fire on its own terms.
const AMBIGUOUS_CLUSTER_E = /(?:ll|ss|ch|sh|ck|ng|lk)e$/;
const resolvedByPhase1 = new Set<string>();
const residual: string[] = [];
for (const [word, dictIpa] of flipSet) {
  const bucket = (evictedBuckets.get(word.slice(0, 3)) ?? []).filter(
    (stem) => !AMBIGUOUS_CLUSTER_E.test(stem),
  );
  let found = false;
  for (const stem of bucket) {
    const probe = new AttribCtor({ disableDict: true });
    probe.addPronunciation(stem, evictedMap.get(stem)!);
    if (isExactMatch(probe.predict(word, "en"), dictIpa)) {
      attribute(stem, word);
      found = true;
      break;
    }
  }
  if (found) resolvedByPhase1.add(word);
  else residual.push(word);
}
console.log(`Phase 1 (customDict) resolved: ${resolvedByPhase1.size}/${flipSet.size}`);

// Phase 2 (file-based, for tryDecomposition): the residual after Phase 1
// is expected small — `tryDecomposition` only applies to 8+ letter
// words and never sees a customDict probe, since it indexes
// `this.dictionary[chunk]` directly rather than going through
// `wellKnown()`. Reimplementing its DP locally (mirroring g2p.ts's
// `tryDecomposition` exactly, including the 3+-chunk/<4-letter reject)
// against `shippedMap ∪ evictedMap` finds the SPECIFIC split it would
// choose once eviction no longer hides a chunk from it, so only that
// split's own chunks are re-pinned — not every substring of the word
// that happens to be a dict word, which was measured to re-pin whole
// unrelated fragment families (e.g. "arc"/"bis"/"bishop"/"shop"/"hop",
// every ≥3-letter substring of "archbishop") for a single target word
// and cost 71 regressions elsewhere via brand-new, unwanted splits of
// OTHER words that happened to contain one of those same fragments
// (con+vent+ion newly decomposing "convention"). One reload verifies
// the chosen split still produces the right word, exactly as before.
function localTryDecomposition(
  word: string,
  chunkExists: (c: string) => boolean,
): string[] | undefined {
  if (word.length < 8) return undefined;
  const dp: (string[] | undefined)[] = Array(word.length + 1).fill(undefined);
  dp[0] = [];
  for (let i = 1; i <= word.length; i++) {
    for (let j = 0; j < i; j++) {
      const chunk = word.substring(j, i);
      if (dp[j] !== undefined && chunk.length >= 3 && chunkExists(chunk)) {
        const candidate = [...dp[j]!, chunk];
        if (!dp[i] || candidate.length < dp[i]!.length) dp[i] = candidate;
      }
    }
  }
  const result = dp[word.length];
  if (result && result.length >= 3 && result.some((p) => p.length < 4)) return undefined;
  return result;
}
const chunkExists = (c: string): boolean => Object.prototype.hasOwnProperty.call(shippedMap, c) || evictedMap.has(c);
const resolvedByPhase2 = new Set<string>();
for (const word of residual) {
  const dictIpa = flipSet.get(word)!;
  const decomp = localTryDecomposition(word, chunkExists);
  if (!decomp || decomp.length < 2) continue;
  const neededChunks = decomp.filter((c) => evictedMap.has(c));
  if (neededChunks.length === 0) continue;
  if (neededChunks.some((c) => AMBIGUOUS_CLUSTER_E.test(c))) continue;
  writeFileSync(
    "./data/en/exceptions.json",
    JSON.stringify({
      ...shippedMap,
      ...Object.fromEntries(neededChunks.map((c) => [c, evictedMap.get(c)!])),
    }),
    "utf8",
  );
  const probeCtor = reloadRuntime();
  const probe = new probeCtor({ disableDict: true });
  if (isExactMatch(probe.predict(word, "en"), dictIpa)) {
    neededChunks.forEach((c) => attribute(c, word));
    resolvedByPhase2.add(word);
  }
}
if (residual.length > 0) {
  console.log(`Phase 2 (tryDecomposition, file-based) resolved: ${resolvedByPhase2.size}/${residual.length}`);
}
const stillUnresolved = residual.filter((w) => !resolvedByPhase2.has(w));
if (stillUnresolved.length > 0) {
  console.log(
    `  unresolved (flip cause not found by either phase, not re-pinned): ${stillUnresolved.slice(0, 20).join(", ")}` +
      (stillUnresolved.length > 20 ? ` … (${stillUnresolved.length} total)` : ""),
  );
}

// Net check: a re-pinned stem is only ever justified by the flip(s) it
// was found for, but once shipped it's a real table entry visible to
// every OTHER word too, mainly through `tryDecomposition`'s raw
// dictionary scan (a short re-pinned fragment can complete a NEW split
// for an unrelated word that was blocked before). One reload finds any
// such regression against the disableDict:true baseline (`correctA`);
// each regressed word's culprit(s) are re-pinned stems it either starts
// with (the `lex(base)`/`wellKnown(stem)` collision — "din" re-pinned
// for one word intercepting "dining"'s own stem lookup) or, for an
// 8+-letter word, contains as a substring (the decomposition risk
// above). A stem is dropped only when the regressions it's blamed for
// outnumber the flips Phase 1/2 actually attributed to it — the same
// win/loss adoption test every other rule in this codebase is held to
// (AGENTS.md) — so a stem responsible for more fixes than damage ships
// anyway and the residual regression is reported below, not hidden.
// Repeated a few rounds (still cheap — one reload plus one dict pass
// each, no per-suspect reload): dropping one stem can occasionally
// reveal that a second, otherwise-fine stem now regresses fewer/more
// words than it did in combination, so a single pass doesn't always
// reach the stable point the win/loss test is aiming for.
for (let round = 0; round < 3; round++) {
  const netCheckMap = { ...shippedMap, ...Object.fromEntries(rePinned) };
  writeFileSync("./data/en/exceptions.json", JSON.stringify(netCheckMap), "utf8");
  const NetCtor = reloadRuntime();
  const netRuntime = new NetCtor({ disableDict: true });
  const benefit = new Map<string, number>();
  for (const [word, dictIpa] of dictWords) {
    if (!correctA.has(word) || isExactMatch(netRuntime.predict(word, "en"), dictIpa)) continue;
    for (const stem of rePinned.keys()) {
      const culprit = word.startsWith(stem) || (word.length >= 8 && stem.length >= 3 && word.includes(stem));
      if (culprit) benefit.set(stem, (benefit.get(stem) ?? 0) + 1);
    }
  }
  let droppedAny = false;
  for (const [stem, regressions] of benefit) {
    const fixes = attributed.get(stem)?.length ?? 0;
    if (regressions > fixes) {
      rePinned.delete(stem);
      droppedAny = true;
    }
  }
  console.log(`Net-check round ${round + 1}: ${benefit.size} implicated stems, ${droppedAny ? "some" : "none"} dropped`);
  if (!droppedAny) break;
}

const finalMap: Record<string, string> = { ...shippedMap, ...Object.fromEntries(rePinned) };
{
  writeFileSync("./data/en/exceptions.json", JSON.stringify(finalMap), "utf8");
  const PostRepinCtor = reloadRuntime();
  const postRepinRuntime = new PostRepinCtor();
  let postRepinAdded = 0;
  for (const [word, dictIpa] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(word) || Object.prototype.hasOwnProperty.call(finalMap, word) || initialisms[word]) continue;
    const predIpa = postRepinRuntime.predict(word, "en");
    if (!predIpa) continue;
    const distance = levenshtein.get(norm(predIpa), norm(dictIpa));
    const ed = primaryNucleusIdx(predIpa) !== primaryNucleusIdx(dictIpa)
      ? Math.max(distance, 1) : distance;
    const candidate: Cand = { word, dictIpa, predIpa, ed, origin: originOf(word) };
    if (ed < 1 || (candidate.origin === "native" && ed < cliMin)) continue;
    if (ntDropped(candidate)) continue;
    finalMap[word] = dictIpa;
    postRepinAdded++;
  }
  console.log(`Post-repin refinement: ${postRepinAdded} additional exceptions`);
}

// Final sanity pass: re-verify every originally-wrong word against the
// FINAL table, so the report below is measured, not assumed.
writeFileSync("./data/en/exceptions.json", JSON.stringify(finalMap), "utf8");
const FinalCheckCtor = reloadRuntime();
const finalCheckRuntime = new FinalCheckCtor({ disableDict: true });
let resolvedCount = 0;
let regressedCount = 0;
const regressedWords: string[] = [];
for (const [word, dictIpa] of dictWords) {
  const wasCorrect = correctA.has(word);
  const isNowCorrect = isExactMatch(finalCheckRuntime.predict(word, "en"), dictIpa);
  if (!wasCorrect && isNowCorrect) resolvedCount++;
  if (wasCorrect && !isNowCorrect) { regressedCount++; regressedWords.push(word); }
}

const depElapsedS = ((Date.now() - depT0) / 1000).toFixed(1);
const finalSize = JSON.stringify(finalMap).length;
console.log(`\n=== Dependency-aware eviction summary ===`);
console.log(`  rule-exact evicted words:        ${evictedMap.size}`);
console.log(`  re-pinned entries:               ${rePinned.size}`);
console.log(`  resolved (wrong → exact):        ${resolvedCount}`);
console.log(`  regressed (exact → wrong):       ${regressedCount}`);
if (regressedCount > 0) {
  // Each of these is a stem the net-check above kept anyway because it
  // fixes more flips than it regresses (net-positive on the whole dict,
  // per AGENTS.md's win/loss discipline) — named here so a real problem
  // is visible rather than hidden behind a net count.
  console.log(`  regressed words (kept net-positive): ${regressedWords.join(", ")}`);
}
console.log(
  `  final exceptions.json:           ${Object.keys(finalMap).length} entries, ${(finalSize / 1024).toFixed(1)} KB`,
);
console.log(`  added build time:                ${depElapsedS}s`);

writeFileSync("./data/en/exceptions.json", JSON.stringify(finalMap), "utf8");
