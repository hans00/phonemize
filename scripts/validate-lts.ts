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

// Same orthographic foreign-origin heuristic as compile-lts.ts.
const FOREIGN_PATTERNS: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/, /(cz|sz|rz|szcz)/,
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/, /(gli|gn[aeiou])/,
  /(eaux|aux|eau|oise|ois|aire|ette|elle|gne|ille|ique)$/, /(beau|deau|reau|teau|mont|jean)/,
  /(ez|os|illo|illa|ando|endo|ente)$/, /(rodriguez|gonzalez|hernandez|sanchez|gomez|santos)/,
  /(stein|berg|burg|mann|hoff|holz|brunn|heim|bach|wald|enstein)$/, /(sch|tsch|pf)/,
  /(ovich|evich|ovna|evna|insky|insk|ova|ev|ov|enko|sky)$/, /(opoulos|idis|akis|opolous|antos|aros)$/,
  /(ahmed|hamed|hussein|hassan|abdul|mohammed|mohamed)/, /^(mc|mac|o')/, /(ough|llwyd|gwyn|aoibh)/,
  /(tsuda|shima|moto|hara|yama|kawa|saki|naka|hashi|guchi|sato|suzuki|takaha)$/,
  /^(nguyen|tran|huynh|wang|chen|liu|zhang|kim|lee|park|choi)$/,
];
const NATIVE_OVERRIDE = /^(scratch|scheme|schedule|sch|school)$/;
function isLikelyForeign(word: string): boolean {
  if (NATIVE_OVERRIDE.test(word)) return false;
  for (const p of FOREIGN_PATTERNS) if (p.test(word) && word.length >= 5) return true;
  return false;
}

let total = 0, exact = 0, lenient = 0, edSum = 0;
let nativeTotal = 0, nativeExact = 0, nativeLenient = 0, nativeEdSum = 0;
let foreignTotal = 0, foreignExact = 0, foreignLenient = 0, foreignEdSum = 0;
const samples: Array<{ word: string; pred: string; exp: string; d: number }> = [];

for (const [word, expected] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 3 || word.length > 12) continue;
  const pred = predictByLTS(word);
  if (!pred) continue;
  total++;
  const isExact = norm(pred) === norm(expected);
  const d = levenshtein.get(canon(pred), canon(expected));
  edSum += d;
  if (isExact) exact++;
  if (d <= 1) lenient++;

  if (isLikelyForeign(word)) {
    foreignTotal++;
    foreignEdSum += d;
    if (isExact) foreignExact++;
    if (d <= 1) foreignLenient++;
  } else {
    nativeTotal++;
    nativeEdSum += d;
    if (isExact) nativeExact++;
    if (d <= 1) nativeLenient++;
  }

  if (d >= 2 && samples.length < 25 && Math.random() < 0.002) {
    samples.push({ word, pred, exp: norm(expected), d });
  }
}

const fmt = (n: number, d: number) => ((n / d) * 100).toFixed(2) + "%";
console.log(`=== ALL words scored: ${total} ===`);
console.log(`  exact:    ${exact} (${fmt(exact, total)})`);
console.log(`  lenient:  ${lenient} (${fmt(lenient, total)})`);
console.log(`  mean ED:  ${(edSum / total).toFixed(4)}`);

console.log(`\n=== NATIVE words: ${nativeTotal} ===`);
console.log(`  exact:    ${nativeExact} (${fmt(nativeExact, nativeTotal)})`);
console.log(`  lenient:  ${nativeLenient} (${fmt(nativeLenient, nativeTotal)})`);
console.log(`  mean ED:  ${(nativeEdSum / nativeTotal).toFixed(4)}`);

console.log(`\n=== FOREIGN words: ${foreignTotal} ===`);
console.log(`  exact:    ${foreignExact} (${fmt(foreignExact, foreignTotal)})`);
console.log(`  lenient:  ${foreignLenient} (${fmt(foreignLenient, foreignTotal)})`);
console.log(`  mean ED:  ${(foreignEdSum / foreignTotal).toFixed(4)}`);

console.log(`\n=== Sample mismatches (d ≥ 2) ===`);
for (const s of samples.slice(0, 15)) {
  console.log(`  ${s.word.padEnd(12)} pred=${s.pred.padEnd(18)} exp=${s.exp.padEnd(18)} d=${s.d}`);
}
