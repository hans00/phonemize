/**
 * P3.1 validator: score predictByLTS against the dict.
 *
 * For each alphabetic dict entry, predict via LTS and compare to the
 * dict's IPA. Score by exact match and lenient (edit distance ≤ 1)
 * using the same canonicalization the main eval uses.
 *
 * Note: this is the LTS table alone (no suffix/stress/reduction layer)
 * predicting the *whole word*. The principled pipeline combines LTS
 * (for the base) with stress + reduction, so its accuracy will be
 * different from this baseline.
 */

import { readFileSync } from "fs";
import * as levenshtein from "fast-levenshtein";
import { predictByLTS } from "../src/en-lts";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

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

let total = 0, exact = 0, lenient = 0, edSum = 0;
const samples: Array<{ word: string; pred: string; exp: string; d: number }> = [];

for (const [word, expected] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 3 || word.length > 12) continue;
  const pred = predictByLTS(word);
  if (!pred) continue;
  total++;
  if (norm(pred) === norm(expected)) exact++;
  const d = levenshtein.get(canon(pred), canon(expected));
  edSum += d;
  if (d <= 1) lenient++;
  else if (samples.length < 25 && Math.random() < 0.002) {
    samples.push({ word, pred, exp: norm(expected), d });
  }
}

const fmt = (n: number, d: number) => ((n / d) * 100).toFixed(2) + "%";
console.log(`Total scored: ${total}`);
console.log(`Exact match: ${exact} (${fmt(exact, total)})`);
console.log(`Lenient (ed ≤ 1): ${lenient} (${fmt(lenient, total)})`);
console.log(`Mean ED: ${(edSum / total).toFixed(4)}`);

console.log(`\n=== Sample mismatches (d ≥ 2) ===`);
for (const s of samples.slice(0, 15)) {
  console.log(`  ${s.word.padEnd(12)} pred=${s.pred.padEnd(18)} exp=${s.exp.padEnd(18)} d=${s.d}`);
}
