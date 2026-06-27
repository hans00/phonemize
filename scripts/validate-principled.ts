/**
 * P2.3 end-to-end validator: runs predictPrincipled against dict.
 *
 * For each dict entry where (a) decomposition succeeds and (b) the base is
 * also in dict, predict the IPA and compare to the dict's IPA. Score by
 * edit distance with the same canon collapsing the eval uses.
 */

import { readFileSync } from "fs";
import { predictPrincipled } from "../src/en/principled";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

const SIMILAR: string[][] = [
  ["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"],
];

function strip(s: string): string {
  return s.replace(/[ˈˌ]/g, "");
}
function canon(s: string): string {
  let t = strip(s);
  SIMILAR.forEach((g: string[]) => {
    const c = g[0];
    for (let i = 1; i < g.length; i++) {
      t = t.replace(new RegExp(g[i], "g"), c);
    }
  });
  return t;
}
function ed(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_: unknown, i: number) =>
    Array.from({ length: n + 1 }, (_: unknown, j: number) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

const lookup = (w: string) => dict[w];

let attempted = 0;
let produced = 0;
let exact = 0;
let lenient = 0;
let edSum = 0;
const perClass: Map<string, { n: number; exact: number; lenient: number }> = new Map();
const samples: Array<{ word: string; pred: string; exp: string; d: number; cls: string }> = [];

for (const [word, ipa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 4) continue;
  attempted++;
  const result = predictPrincipled(word, lookup);
  if (!result) continue;
  produced++;

  const cls = result.suffix.stress;
  if (!perClass.has(cls)) perClass.set(cls, { n: 0, exact: 0, lenient: 0 });
  const c = perClass.get(cls)!;
  c.n++;

  const predStripped = strip(result.ipa);
  const expStripped = strip(ipa);
  const distance = ed(canon(predStripped), canon(expStripped));
  edSum += distance;

  if (predStripped === expStripped) {
    exact++;
    c.exact++;
  }
  if (distance <= 1) {
    lenient++;
    c.lenient++;
  } else if (samples.length < 40 && Math.random() < 0.005) {
    samples.push({ word, pred: result.ipa, exp: ipa, d: distance, cls });
  }
}

const pct = (n: number, d: number) => (d === 0 ? "n/a" : ((n / d) * 100).toFixed(1) + "%");

console.log(`Total alphabetic dict entries (≥4 letters): ${attempted}`);
console.log(`Principled prediction produced output for: ${produced} (${pct(produced, attempted)})`);
console.log(`  ...exact match: ${exact} (${pct(exact, produced)})`);
console.log(`  ...lenient (ed ≤ 1): ${lenient} (${pct(lenient, produced)})`);
console.log(`  ...mean edit distance: ${(edSum / Math.max(1, produced)).toFixed(2)}`);

console.log(`\n=== Per stress-class accuracy ===`);
console.log(`${"class".padEnd(12)} ${"n".padStart(6)} ${"exact".padStart(8)} ${"lenient".padStart(10)}`);
for (const [cls, st] of Array.from(perClass.entries()).sort((a, b) => b[1].n - a[1].n)) {
  console.log(
    `${cls.padEnd(12)} ${st.n.toString().padStart(6)} ${pct(st.exact, st.n).padStart(8)} ${pct(st.lenient, st.n).padStart(10)}`
  );
}

console.log(`\n=== Sample mismatches (d ≥ 2) ===`);
for (const s of samples.slice(0, 15)) {
  console.log(`  ${s.word} (${s.cls}, d=${s.d}): pred=${s.pred}  exp=${s.exp}`);
}
