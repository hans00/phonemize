/**
 * P1: Build-time grapheme→phoneme aligner.
 *
 * Reads data/en/dict.json. For each (word, IPA) pair, aligns letter clusters
 * to phoneme clusters using DP over a seed atom table. Outputs:
 *   - data/en/alignments.json — per-word alignment (build artifact, not shipped)
 *   - stdout: stats (atom frequencies, top unaligned words)
 *
 * Atom = (grapheme-cluster, phoneme-cluster) pair the aligner is allowed to use.
 * Empty phoneme allowed (for silent letters). DP picks lowest-cost path, where
 * cost = number of atoms used → longer atoms win on ties.
 *
 * Iteration: run, inspect unaligned, add missing atoms, repeat (P1 task #2).
 */

import { readFileSync, writeFileSync } from "fs";

const DICT_PATH = "./data/en/dict.json";
const OUT_PATH = "./data/en/alignments.json";
const STATS_PATH = "./data/en/align-stats.json";

const dict: Record<string, string> = JSON.parse(readFileSync(DICT_PATH, "utf8"));

// ─── Seed atoms ───────────────────────────────────────────────────────────────
// Order doesn't matter for DP correctness; longer atoms get priority via cost.
// Notation:
//   ɫ is normalized to l (the runtime postBase distinguishes them, but for
//   alignment they collapse — we only care about the grapheme→phoneme mapping).
//   Stress marks are stripped before alignment.
//   "" = silent grapheme.

const ATOMS: Array<[string, string]> = [
  // ─── Tetragraphs / pentagraphs (rare, distinctive) ──────────────────────────
  ["eight", "eɪt"],
  ["ought", "ɔt"], ["ought", "ʌt"], ["ought", "aʊt"],
  ["augh", "æf"], ["augh", "ɔ"],
  ["eigh", "eɪ"], ["eigh", "aɪ"],
  ["ough", "ʌf"], ["ough", "u"], ["ough", "oʊ"], ["ough", "ɔ"], ["ough", "aʊ"], ["ough", "əf"],
  ["tion", "ʃən"], ["sion", "ʒən"], ["sion", "ʃən"],
  ["cian", "ʃən"], ["tian", "ʃən"],
  ["ture", "tʃɝ"], ["ture", "tjʊɹ"],
  ["sure", "ʒɝ"], ["sure", "ʃɝ"],
  ["cial", "ʃəl"], ["tial", "ʃəl"],
  ["cious", "ʃəs"], ["tious", "ʃəs"], ["geous", "dʒəs"],
  ["ious", "iəs"], ["eous", "iəs"],

  // ─── Trigraphs ──────────────────────────────────────────────────────────────
  ["tch", "tʃ"],
  ["dge", "dʒ"], ["dg", "dʒ"],
  ["sch", "sk"], ["sch", "ʃ"],
  ["thr", "θɹ"], ["shr", "ʃɹ"],
  ["scr", "skɹ"], ["spr", "spɹ"], ["str", "stɹ"], ["spl", "spl"],
  ["chr", "kɹ"], ["phr", "fɹ"],
  ["nch", "ntʃ"],
  ["nge", "ndʒ"], ["nge", "ŋ"],
  ["dle", "dəl"], ["tle", "təl"], ["ple", "pəl"], ["ble", "bəl"],
  ["gle", "ɡəl"], ["kle", "kəl"], ["zle", "zəl"], ["fle", "fəl"],

  // ─── Digraphs: consonants ───────────────────────────────────────────────────
  ["ng", "ŋ"], ["ng", "ŋɡ"], ["ng", "ndʒ"],
  ["nk", "ŋk"],
  ["th", "θ"], ["th", "ð"], ["th", "t"],
  ["sh", "ʃ"],
  ["ch", "tʃ"], ["ch", "k"], ["ch", "ʃ"],
  ["ph", "f"], ["ph", "v"],
  ["gh", "ɡ"], ["gh", "f"], ["gh", ""],
  ["wh", "w"], ["wh", "h"],
  ["qu", "kw"], ["qu", "k"],
  ["ck", "k"],
  ["kn", "n"],
  ["wr", "ɹ"],
  ["gn", "n"], ["gn", "ɡn"],
  ["pn", "n"],
  ["ps", "s"], ["ps", "ps"],
  ["pt", "t"], ["pt", "pt"],
  ["mb", "m"], ["mb", "mb"],
  ["mn", "m"], ["mn", "mn"],
  ["bt", "t"],
  ["rh", "ɹ"],
  ["xh", "ks"], ["xh", "ɡz"],
  ["sc", "s"], ["sc", "sk"], ["sc", "ʃ"],
  ["sw", "sw"],
  ["zh", "ʒ"],

  // ─── Digraphs: vowels ───────────────────────────────────────────────────────
  ["ai", "eɪ"], ["ai", "ɛ"], ["ai", "aɪ"], ["ai", "aɪɪ"],
  ["ay", "eɪ"], ["ay", "i"], ["ay", "aɪ"],
  ["au", "ɔ"], ["au", "æ"], ["au", "aʊ"], ["au", "ɑ"], ["au", "oʊ"], ["au", "ɒ"],
  ["ao", "aʊ"], ["ao", "eɪoʊ"], ["ao", "ɑ"],
  ["eo", "ioʊ"], ["eo", "iə"], ["eo", "ɛoʊ"],
  ["aw", "ɔ"], ["aw", "æ"],
  ["ea", "i"], ["ea", "ɛ"], ["ea", "eɪ"], ["ea", "iə"], ["ea", "ɪə"],
  ["ee", "i"], ["ee", "ɪ"],
  ["ei", "i"], ["ei", "eɪ"], ["ei", "aɪ"], ["ei", "ɛ"],
  ["eu", "ju"], ["eu", "u"], ["eu", "ʊ"],
  ["ew", "ju"], ["ew", "u"], ["ew", "oʊ"],
  ["ey", "i"], ["ey", "eɪ"],
  ["ie", "i"], ["ie", "aɪ"], ["ie", "iə"], ["ie", "aɪə"], ["ie", "ɪ"], ["ie", "ɛ"],
  ["io", "iə"], ["io", "io"], ["io", "aɪoʊ"], ["io", "iˈoʊ"],
  ["oa", "oʊ"], ["oa", "ɔ"],
  ["oe", "oʊ"], ["oe", "u"], ["oe", "i"], ["oe", "wɑ"],
  ["oi", "ɔɪ"], ["oi", "wɑ"],
  ["oo", "u"], ["oo", "ʊ"], ["oo", "ʌ"], ["oo", "oʊ"], ["oo", "ɔ"],
  ["ou", "aʊ"], ["ou", "u"], ["ou", "ʌ"], ["ou", "oʊ"], ["ou", "ɔ"], ["ou", "ʊ"], ["ou", "ə"],
  ["ow", "oʊ"], ["ow", "aʊ"],
  ["oy", "ɔɪ"],
  ["ua", "ə"], ["ua", "uə"], ["ua", "wɑ"], ["ua", "uɑ"], ["ua", "weɪ"],
  ["ue", "ju"], ["ue", "u"], ["ue", "ʊ"], ["ue", "uə"], ["ue", "wɛ"], ["ue", ""],
  ["ui", "u"], ["ui", "ʊ"], ["ui", "ʊɪ"], ["ui", "aɪ"], ["ui", "wɪ"], ["ui", "ɪ"],
  ["uo", "uoʊ"], ["uo", "ʊə"],
  ["uy", "aɪ"], ["uy", "wi"],
  ["ya", "jə"], ["ya", "jæ"], ["ya", "jɑ"],
  ["ye", "aɪ"], ["ye", "i"], ["ye", "jɛ"],
  ["yo", "joʊ"], ["yo", "jɔ"], ["yo", "jɑ"],
  ["yu", "ju"],

  // ─── R-controlled vowels ────────────────────────────────────────────────────
  ["ar", "ɑɹ"], ["ar", "ɛɹ"], ["ar", "ɝ"], ["ar", "ɔɹ"], ["ar", "ɝ"], ["ar", "ɑɝ"],
  ["arr", "ɛɹ"], ["arr", "æɹ"], ["arr", "ɑɹ"],
  ["er", "ɝ"], ["er", "ɛɹ"], ["er", "ɪɹ"], ["er", "ə"], ["er", "iɝ"],
  ["err", "ɛɹ"], ["err", "ɝ"],
  ["ir", "ɝ"], ["ir", "aɪɹ"], ["ir", "ɪɹ"], ["ir", "aɪɝ"],
  ["irr", "ɪɹ"], ["irr", "ɝ"],
  ["or", "ɔɹ"], ["or", "ɝ"], ["or", "ʊɹ"], ["or", "ɑɹ"], ["or", "wɝ"], ["or", "ə"],
  ["orr", "ɔɹ"], ["orr", "ɝ"], ["orr", "ɑɹ"],
  ["ur", "ɝ"], ["ur", "jʊɹ"], ["ur", "ʊɹ"], ["ur", "jɝ"],
  ["urr", "ɝ"], ["urr", "ʊɹ"],
  ["yr", "ɝ"], ["yr", "ɪɹ"], ["yr", "aɪɹ"],
  ["oar", "ɔɹ"], ["our", "aʊɹ"], ["our", "ʊɹ"], ["our", "ɔɹ"], ["our", "ɝ"], ["our", "uɹ"],
  ["ear", "ɪɹ"], ["ear", "ɛɹ"], ["ear", "ɝ"], ["ear", "ɑɹ"],
  ["eer", "ɪɹ"], ["eir", "ɛɹ"], ["eir", "ɪɹ"],
  ["ier", "iɝ"], ["ier", "aɪɝ"], ["ier", "jɝ"],
  ["ire", "aɪɹ"], ["ire", "aɪɝ"], ["ire", "ɪɹ"],
  ["are", "ɛɹ"], ["are", "ɑɹ"], ["are", "ɑɹeɪ"],
  ["ore", "ɔɹ"], ["ore", "ɝ"],
  ["ure", "jʊɹ"], ["ure", "ʊɹ"], ["ure", "ɝ"],

  // ─── Single vowels (broadest range) ─────────────────────────────────────────
  ["a", "æ"], ["a", "ə"], ["a", "eɪ"], ["a", "ɑ"], ["a", "ɔ"], ["a", "ɛ"], ["a", "ɪ"], ["a", "ʌ"], ["a", "i"], ["a", "ɝ"], ["a", "ʊ"], ["a", "aɪ"], ["a", "wə"], ["a", ""],
  ["e", "ɛ"], ["e", "ə"], ["e", "i"], ["e", "ɪ"], ["e", "eɪ"], ["e", "ɝ"], ["e", "ʌ"], ["e", ""], ["e", "aɪ"],
  ["i", "ɪ"], ["i", "aɪ"], ["i", "i"], ["i", "ə"], ["i", "j"], ["i", "ɝ"], ["i", "ɛ"], ["i", ""], ["i", "aɪə"],
  ["o", "ɑ"], ["o", "ɔ"], ["o", "oʊ"], ["o", "ə"], ["o", "u"], ["o", "ʊ"], ["o", "ʌ"], ["o", "ɝ"], ["o", "i"], ["o", "ɪ"], ["o", "w"], ["o", ""],
  ["u", "ʌ"], ["u", "u"], ["u", "ʊ"], ["u", "ə"], ["u", "ju"], ["u", "jə"], ["u", "ɝ"], ["u", "jʊ"], ["u", "w"], ["u", "ɪ"], ["u", "ɔ"], ["u", "ɛ"], ["u", "uw"], ["u", ""],
  ["y", "ɪ"], ["y", "i"], ["y", "aɪ"], ["y", "j"], ["y", "ə"], ["y", "ɝ"], ["y", ""],

  // ─── Single consonants ──────────────────────────────────────────────────────
  ["b", "b"], ["b", ""],
  ["c", "k"], ["c", "s"], ["c", "ʃ"], ["c", "tʃ"], ["c", ""], ["c", "ɡ"],
  ["d", "d"], ["d", "dʒ"], ["d", "t"], ["d", "ɾ"], ["d", "ð"], ["d", ""],
  ["f", "f"], ["f", "v"], ["f", ""],
  ["g", "ɡ"], ["g", "dʒ"], ["g", "ʒ"], ["g", ""], ["g", "k"],
  ["h", "h"], ["h", ""],
  ["j", "dʒ"], ["j", "j"], ["j", "ʒ"], ["j", "h"], ["j", "x"], ["j", "tʃ"], ["j", ""],
  ["k", "k"], ["k", ""],
  ["l", "l"], ["l", ""], ["l", "əl"], ["l", "j"],
  ["m", "m"], ["m", "əm"], ["m", ""],
  ["n", "n"], ["n", "ŋ"], ["n", "ən"], ["n", "nj"], ["n", ""],
  ["p", "p"], ["p", ""],
  ["q", "k"], ["q", "kw"], ["q", ""],
  ["r", "ɹ"], ["r", "ɝ"], ["r", ""],
  ["s", "s"], ["s", "z"], ["s", "ʃ"], ["s", "ʒ"], ["s", ""],
  ["t", "t"], ["t", "ʔ"], ["t", "ɾ"], ["t", ""], ["t", "tʃ"], ["t", "ʃ"], ["t", "θ"], ["t", "d"],
  ["v", "v"], ["v", "f"], ["v", ""],
  ["w", "w"], ["w", ""], ["w", "v"],
  ["x", "ks"], ["x", "ɡz"], ["x", "z"], ["x", "kʃ"], ["x", "ɡʒ"], ["x", "h"], ["x", ""],
  ["z", "z"], ["z", "ʒ"], ["z", "s"], ["z", "ts"], ["z", ""],

  // ─── Polish/Slavic clusters (common surname patterns in dict) ───────────────
  ["cz", "tʃ"], ["cz", "ts"], ["sz", "ʃ"], ["rz", "ʒ"], ["rz", "ɹʒ"],
  ["wicz", "vɪtʃ"], ["wicz", "vɪts"],
  ["czy", "tʃi"], ["szy", "ʃi"],
  ["ck", "ts"], ["cki", "tski"], ["cki", "tʃki"],
  ["ows", "ɔfs"], ["ows", "ɑfs"],
  ["owski", "ɔfski"], ["owski", "ɑfski"],
  ["owicz", "əvɪtʃ"], ["owicz", "ɔfɪtʃ"],
  ["dz", "dz"], ["dz", "ts"], ["dz", "dʒ"],
  ["kv", "kw"], ["ck", "k"],

  // ─── Common high-frequency patterns missed in first pass ───────────────────
  ["air", "ɛɹ"], ["aire", "ɛɹ"],
  ["ury", "ɛɹi"], ["ury", "jʊɹi"], ["ury", "ɝi"],
  ["bury", "bɛɹi"],
  ["eu", "ɔɪ"], // German diphthong (bayreuth, freud)
  ["oi", "wɑ"], // French
  ["in", "æn"], // French nasal (boivin, beaudin)
  ["ire", "aɪɹ"], ["ire", "aɪɝ"], ["ire", "ɪɹ"],
  ["age", "ɪdʒ"], ["age", "eɪdʒ"], ["age", "ɑʒ"],
  ["ace", "eɪs"], ["ace", "əs"], ["ace", "ɑs"],
  ["ice", "aɪs"], ["ice", "ɪs"],
  ["ate", "eɪt"], ["ate", "ət"], ["ate", "ɪt"],
  ["ite", "aɪt"], ["ite", "ɪt"],
  ["ote", "oʊt"],
  ["ute", "ut"], ["ute", "jut"],
  ["ese", "iz"],
  ["ize", "aɪz"],
  ["use", "juz"], ["use", "jus"],
  ["ous", "əs"], ["ous", "aʊs"],
  ["ble", "bəl"], ["ply", "pli"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STRESS = /[ˈˌ]/g;
function stripStress(ipa: string): string {
  return ipa.replace(STRESS, "");
}
// Normalize ɫ→l so atoms don't need to list both forms.
function normalizePhon(ipa: string): string {
  return ipa.replace(/ɫ/g, "l");
}

// Pre-index atoms by grapheme length for fast lookup
const MAX_GRAPH = Math.max(...ATOMS.map(([g]) => g.length));
type AtomBucket = Map<string, Array<string>>; // graph -> list of phonemes
const atomsByLen: Map<number, AtomBucket> = new Map();
for (const [g, p] of ATOMS) {
  if (!atomsByLen.has(g.length)) atomsByLen.set(g.length, new Map());
  const bucket = atomsByLen.get(g.length)!;
  if (!bucket.has(g)) bucket.set(g, []);
  bucket.get(g)!.push(p);
}

// ─── DP aligner ───────────────────────────────────────────────────────────────
type Align = Array<[string, string]>;

function alignWord(word: string, ipa: string): Align | null {
  const phon = normalizePhon(stripStress(ipa));
  const W = word.length;
  const P = phon.length;

  // dp[i][j] = { cost, back: [prev_i, prev_j, atom_g, atom_p] }
  const dp: Array<Array<{ cost: number; bi: number; bj: number; ag: string; ap: string }>> =
    Array.from({ length: W + 1 }, () =>
      Array.from({ length: P + 1 }, () => ({ cost: Infinity, bi: -1, bj: -1, ag: "", ap: "" }))
    );
  dp[0][0].cost = 0;

  for (let i = 0; i <= W; i++) {
    for (let j = 0; j <= P; j++) {
      const cur = dp[i][j].cost;
      if (cur === Infinity) continue;

      // Try atoms of each grapheme length
      for (let gLen = 1; gLen <= MAX_GRAPH; gLen++) {
        if (i + gLen > W) break;
        const bucket = atomsByLen.get(gLen);
        if (!bucket) continue;
        const gSlice = word.slice(i, i + gLen);
        const phons = bucket.get(gSlice);
        if (!phons) continue;
        for (const p of phons) {
          const pLen = p.length;
          if (j + pLen > P) continue;
          if (pLen > 0 && phon.slice(j, j + pLen) !== p) continue;
          // Atom matches; cost = +1 (so longer atoms win ties)
          const newCost = cur + 1;
          const ni = i + gLen;
          const nj = j + pLen;
          if (newCost < dp[ni][nj].cost) {
            dp[ni][nj] = { cost: newCost, bi: i, bj: j, ag: gSlice, ap: p };
          }
        }
      }
    }
  }

  if (dp[W][P].cost === Infinity) return null;

  const out: Align = [];
  let ci = W, cj = P;
  while (ci > 0 || cj > 0) {
    const cell = dp[ci][cj];
    if (cell.bi < 0) return null;
    out.unshift([cell.ag, cell.ap]);
    ci = cell.bi;
    cj = cell.bj;
  }
  return out;
}

// ─── Run ──────────────────────────────────────────────────────────────────────
function isAlphabetic(w: string): boolean {
  return /^[a-z]+$/.test(w);
}

// Heuristic: detect spelled-out acronyms (abc → eɪbisi, adhd → eɪdieɪtʃdi).
// Letter names in IPA: a=eɪ b=bi c=si d=di e=i f=ɛf g=dʒi h=eɪtʃ i=aɪ j=dʒeɪ
// k=keɪ l=ɛl m=ɛm n=ɛn o=oʊ p=pi q=kju r=ɑɹ s=ɛs t=ti u=ju v=vi w=dʌbəɫju
// x=ɛks y=waɪ z=zi
const LETTER_NAMES: Record<string, string> = {
  a: "eɪ", b: "bi", c: "si", d: "di", e: "i", f: "ɛf", g: "dʒi", h: "eɪtʃ",
  i: "aɪ", j: "dʒeɪ", k: "keɪ", l: "ɛɫ", m: "ɛm", n: "ɛn", o: "oʊ", p: "pi",
  q: "kju", r: "ɑɹ", s: "ɛs", t: "ti", u: "ju", v: "vi", w: "dʌbəɫju",
  x: "ɛks", y: "waɪ", z: "zi",
};
function isAcronym(word: string, ipa: string): boolean {
  const phon = normalizePhon(stripStress(ipa));
  let p = phon, l: string;
  for (const c of word) {
    l = LETTER_NAMES[c]?.replace(/ɫ/g, "l");
    if (!l || !p.startsWith(l)) return false;
    p = p.slice(l.length);
  }
  return p === "";
}

const aligned: Record<string, string> = {}; // compact: "g/p g/p ..." per word
const unalignedReal: string[] = [];
const unalignedAcronym: string[] = [];
const atomCount: Map<string, number> = new Map();
// Per-context table: key = "L|g|R" (left letter, grapheme, right letter; ^/$ for boundaries)
// Value: phoneme -> count
const ctxTable: Map<string, Map<string, number>> = new Map();
let total = 0;

for (const [word, ipa] of Object.entries(dict)) {
  if (!isAlphabetic(word)) continue;
  total++;
  const align = alignWord(word, ipa);
  if (align) {
    aligned[word] = align.map(([g, p]) => `${g}/${p}`).join(" ");
    // Reconstruct positions to extract context
    let pos = 0;
    for (let i = 0; i < align.length; i++) {
      const [g, p] = align[i];
      const left = pos === 0 ? "^" : word[pos - 1];
      const right = pos + g.length >= word.length ? "$" : word[pos + g.length];
      const key = `${left}|${g}|${right}`;
      if (!ctxTable.has(key)) ctxTable.set(key, new Map());
      const inner = ctxTable.get(key)!;
      inner.set(p, (inner.get(p) ?? 0) + 1);
      atomCount.set(`${g}|${p}`, (atomCount.get(`${g}|${p}`) ?? 0) + 1);
      pos += g.length;
    }
  } else if (isAcronym(word, ipa)) {
    unalignedAcronym.push(word);
  } else {
    unalignedReal.push(word);
  }
}

const alignedCount = Object.keys(aligned).length;
const realDenom = total - unalignedAcronym.length;
const coverage = ((alignedCount / total) * 100).toFixed(2);
const coverageEx = ((alignedCount / realDenom) * 100).toFixed(2);

console.log(`Total alphabetic entries: ${total}`);
console.log(`Aligned: ${alignedCount} (${coverage}% of all, ${coverageEx}% excluding acronyms)`);
console.log(`Unaligned (real): ${unalignedReal.length}`);
console.log(`Unaligned (acronyms): ${unalignedAcronym.length} — excluded from rule training`);

// Top 40 most frequent atoms
const topAtoms = Array.from(atomCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 40);
console.log("\n=== Top atoms (grapheme | phoneme) ===");
for (const [key, n] of topAtoms) {
  const [g, p] = key.split("|");
  console.log(`  ${n.toString().padStart(7)}  ${g.padEnd(6)} → ${p || "∅"}`);
}

// Sample unaligned (non-acronym) for inspection
const shortUnaligned = unalignedReal
  .filter((w) => w.length >= 3 && w.length <= 10)
  .slice(0, 50);
console.log("\n=== Sample unaligned (non-acronym, short) ===");
for (const w of shortUnaligned) {
  console.log(`  ${w}  (ipa=${stripStress(dict[w])})`);
}

// Sample aligned for inspection
console.log("\n=== Sample alignments ===");
const samples = ["nation", "knife", "though", "phoenix", "psychology", "rendezvous", "colonel"];
for (const w of samples) {
  if (aligned[w]) console.log(`  ${w}: ${aligned[w]}`);
}

// ─── Ambiguity analysis ────────────────────────────────────────────────────
// For each context key, find the dominant phoneme and the entropy.
// Low entropy = clean rule; high entropy = needs P3's context-aware table.
let cleanCtx = 0, ambiguousCtx = 0;
const topAmbiguous: Array<{ key: string; total: number; phons: Array<[string, number]> }> = [];
Array.from(ctxTable.entries()).forEach(([key, phons]: [string, Map<string, number>]) => {
  const ctxTotal = Array.from(phons.values()).reduce((a: number, b: number) => a + b, 0);
  if (ctxTotal < 20) return;
  const sorted = Array.from(phons.entries()).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
  const dominantShare = sorted[0][1] / ctxTotal;
  if (dominantShare >= 0.9) cleanCtx++;
  else {
    ambiguousCtx++;
    topAmbiguous.push({ key, total: ctxTotal, phons: sorted });
  }
});
topAmbiguous.sort((a, b) => b.total - a.total);

console.log(`\n=== Context analysis (min 20 occurrences) ===`);
console.log(`  Clean contexts (≥90% dominant phoneme): ${cleanCtx}`);
console.log(`  Ambiguous contexts: ${ambiguousCtx}`);
console.log(`\n=== Top 20 ambiguous contexts (where P3 table will help) ===`);
for (const { key, total, phons } of topAmbiguous.slice(0, 20)) {
  const [L, g, R] = key.split("|");
  const top3 = phons
    .slice(0, 3)
    .map(([p, n]) => `${p || "∅"}=${((n / total) * 100).toFixed(0)}%`)
    .join(" ");
  console.log(`  ${L}_${g}_${R}  (n=${total})  ${top3}`);
}

// Build serialisable stats: drop low-freq contexts to keep file size small.
const ctxOut: Record<string, Record<string, number>> = {};
Array.from(ctxTable.entries()).forEach(([key, phons]: [string, Map<string, number>]) => {
  const ctxTotal = Array.from(phons.values()).reduce((a: number, b: number) => a + b, 0);
  if (ctxTotal < 3) return;
  ctxOut[key] = Object.fromEntries(phons);
});

// Write artifacts
writeFileSync(OUT_PATH, JSON.stringify(aligned), "utf8");
writeFileSync(
  STATS_PATH,
  JSON.stringify(
    {
      totals: { total, aligned: alignedCount, acronyms: unalignedAcronym.length, unaligned: unalignedReal.length },
      atomCount: Object.fromEntries(atomCount),
      ctxTable: ctxOut,
      unalignedReal,
      unalignedAcronym,
    },
    null,
    0
  ),
  "utf8"
);
console.log(`\nWrote ${OUT_PATH} (${alignedCount} entries)`);
console.log(`Wrote ${STATS_PATH} (${Object.keys(ctxOut).length} contexts, ${atomCount.size} atoms)`);
