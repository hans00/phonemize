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
import EnglishG2P from "../src/en-g2p";
import * as levenshtein from "fast-levenshtein";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

const g2p = new EnglishG2P({ disableDict: true });

const SIMILAR: string[][] = [
  ["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"],
];
function norm(s: string): string {
  return s.replace(/[ˈˌ]/g, "");
}
function canon(s: string): string {
  let t = norm(s);
  SIMILAR.forEach((g: string[]) => {
    const c = g[0];
    for (let i = 1; i < g.length; i++) t = t.replace(new RegExp(g[i], "g"), c);
  });
  return t;
}

// Acronym detector: spelled-out letter sequences (abc → eɪ-bi-si). These
// belong in a separate abbreviation handler, not in a phoneme exception
// table. Same heuristic as scripts/align.ts.
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

interface Cand {
  word: string;
  dictIpa: string;
  predIpa: string;
  ed: number;
}

const candidates: Cand[] = [];
let total = 0;
let withinLenient = 0;
let acronymsSkipped = 0;

for (const [word, dictIpa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  total++;
  if (isAcronym(word, dictIpa)) {
    acronymsSkipped++;
    continue;
  }
  const pred = g2p.predict(word, "en");
  if (!pred) continue;
  const d = levenshtein.get(canon(pred), canon(dictIpa));
  if (d < 2) {
    withinLenient++;
    continue;
  }
  candidates.push({ word, dictIpa, predIpa: pred, ed: d });
}

// Sort by edit distance (worst first), then alphabetically for stability.
candidates.sort((a: Cand, b: Cand) => b.ed - a.ed || a.word.localeCompare(b.word));

const fmt = (n: number, d: number) => ((n / d) * 100).toFixed(2) + "%";

console.log(`Total alphabetic dict entries:        ${total}`);
console.log(`Acronyms skipped:                     ${acronymsSkipped}`);
console.log(`Rules already within ed < 2 of dict:  ${withinLenient} (${fmt(withinLenient, total)})`);
console.log(`Exception candidates (ed ≥ 2):        ${candidates.length} (${fmt(candidates.length, total)})`);

// Histogram by edit distance
const hist: Map<number, number> = new Map();
for (const c of candidates) hist.set(c.ed, (hist.get(c.ed) ?? 0) + 1);
console.log(`\n=== ED distribution among exceptions ===`);
Array.from(hist.entries()).sort((a, b) => a[0] - b[0]).forEach(([ed, n]) => {
  console.log(`  ed=${ed.toString().padStart(2)}: ${n}`);
});

// Cumulative sizes at different thresholds (so reader can choose tradeoff)
console.log(`\n=== Shipping-size tradeoff by threshold ===`);
for (const t of [2, 3, 4, 5, 6]) {
  const filtered = candidates.filter((c: Cand) => c.ed >= t);
  const map: Record<string, string> = {};
  for (const c of filtered) map[c.word] = c.dictIpa;
  const size = JSON.stringify(map).length;
  // Runtime accuracy = (total - filtered) words predicted by rules within ed<2 + filtered words exact via exception
  // i.e., everything ed<t goes to rules (some may be wrong), everything ed≥t is exact.
  // Strict lenient: rules cover ed<2 perfectly, ed in [2,t) are off, ed≥t exact via exception.
  const rulesPerfect = withinLenient;
  const rulesOff = candidates.filter((c: Cand) => c.ed < t).length;
  const lenientCovered = rulesPerfect + filtered.length;
  console.log(
    `  ed≥${t}: ${filtered.length.toString().padStart(6)} entries  (${(size / 1024).toFixed(1)} KB)  lenient acc on dict: ${fmt(lenientCovered, total - acronymsSkipped)}  (rules-only deviation count: ${rulesOff})`
  );
}

// Top 20 worst (largest ed)
console.log(`\n=== 20 worst-prediction non-acronym words ===`);
for (const c of candidates.slice(0, 20)) {
  console.log(`  ed=${c.ed.toString().padStart(2)}  ${c.word.padEnd(20)} dict=${c.dictIpa.padEnd(25)} pred=${c.predIpa}`);
}

// Write at threshold=2 (full coverage)
const exceptionMap: Record<string, string> = {};
for (const c of candidates) exceptionMap[c.word] = c.dictIpa;
writeFileSync(
  "./data/en/exception-candidates.json",
  JSON.stringify(exceptionMap),
  "utf8"
);
console.log(`\nWrote data/en/exception-candidates.json (${candidates.length} entries, ${(JSON.stringify(exceptionMap).length / 1024).toFixed(1)} KB)`);
