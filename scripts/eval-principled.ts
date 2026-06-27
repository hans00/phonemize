/**
 * A/B comparison: eval with the principled pipeline on vs off.
 *
 * Mirrors scripts/evaluate.ts but runs both modes back-to-back so we can
 * see the delta of enabling the new path.
 */

import EnglishG2P from "../src/en/g2p";
import { readFileSync } from "fs";
import * as levenshtein from "fast-levenshtein";

const dictionary: Record<string, string> = JSON.parse(
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

interface Scores {
  total: number;
  exact: number;
  lenient: number; // ed <= 1
  edSum: number;
}

function score(g2p: EnglishG2P): Scores {
  let total = 0, exact = 0, lenient = 0, edSum = 0;
  for (const [word, expected] of Object.entries(dictionary)) {
    if (!/^[a-z]+$/.test(word)) continue;
    if (word.length < 3 || word.length > 12) continue;
    const pred = g2p.predict(word, "en");
    if (!pred) continue;
    total++;
    const a = norm(pred), b = norm(expected);
    if (a === b) exact++;
    const d = levenshtein.get(canon(pred), canon(expected));
    edSum += d;
    if (d <= 1) lenient++;
  }
  return { total, exact, lenient, edSum };
}

const fmt = (n: number, d: number) => ((n / d) * 100).toFixed(2) + "%";

console.log("=== Eval with principled OFF (baseline) ===");
const off = score(new EnglishG2P({ disableDict: true, enablePrincipled: false }));
console.log(`  total: ${off.total}`);
console.log(`  exact: ${off.exact} (${fmt(off.exact, off.total)})`);
console.log(`  lenient: ${off.lenient} (${fmt(off.lenient, off.total)})`);
console.log(`  mean ED: ${(off.edSum / off.total).toFixed(4)}`);

console.log("\n=== Eval with principled ON ===");
const on = score(new EnglishG2P({ disableDict: true, enablePrincipled: true }));
console.log(`  total: ${on.total}`);
console.log(`  exact: ${on.exact} (${fmt(on.exact, on.total)})`);
console.log(`  lenient: ${on.lenient} (${fmt(on.lenient, on.total)})`);
console.log(`  mean ED: ${(on.edSum / on.total).toFixed(4)}`);

console.log("\n=== Delta (ON − OFF) ===");
console.log(`  exact:   ${on.exact - off.exact} (${fmt(on.exact - off.exact, off.total)})`);
console.log(`  lenient: ${on.lenient - off.lenient} (${fmt(on.lenient - off.lenient, off.total)})`);
console.log(`  ED Δ:    ${((on.edSum - off.edSum) / off.total).toFixed(4)}`);
