/**
 * P2.0 validator: runs the suffix decomposer over the dict.
 *
 * For each entry, decomposes the word and checks:
 *   1. Does the decomposition recover a known base (in dict)?
 *   2. Does the suffix IPA appear as a tail of the dict IPA?
 *
 * Reports coverage, top suffix frequencies, and unknown-base examples.
 */

import { readFileSync } from "fs";
import { decompose, SuffixEntry } from "../src/en-suffixes";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

function stripStress(s: string): string {
  return s.replace(/[ˈˌ]/g, "");
}
function normPhon(s: string): string {
  return stripStress(s).replace(/ɫ/g, "l");
}

let total = 0;
let decomposed = 0;
let baseKnown = 0;
let ipaTailMatch = 0;
let depthSum = 0;

const perSuffix: Map<string, { uses: number; baseKnown: number; ipaMatch: number; samples: string[] }> = new Map();
const baseUnknown: string[] = [];
const ipaMismatch: Array<{ word: string; base: string; suffix: string; expected: string; ipa: string }> = [];

for (const [word, ipa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 4) continue;
  total++;

  const d = decompose(word);
  if (d.steps.length === 0) continue;
  decomposed++;
  depthSum += d.steps.length;

  const outerStep = d.steps[0];
  const outerSuffix = outerStep.entry.suffix;
  if (!perSuffix.has(outerSuffix))
    perSuffix.set(outerSuffix, { uses: 0, baseKnown: 0, ipaMatch: 0, samples: [] });
  const s = perSuffix.get(outerSuffix)!;
  s.uses++;
  if (s.samples.length < 5) s.samples.push(word);

  // Does the (final) base (or any alt) look like a known dict entry?
  const baseCandidates = [d.base, ...d.baseAlts];
  const resolved = baseCandidates.find((b: string) => dict[b] !== undefined);
  if (resolved) {
    baseKnown++;
    s.baseKnown++;
  } else if (baseUnknown.length < 50) {
    baseUnknown.push(
      `${word} → ${d.steps.map((st: { entry: SuffixEntry }) => st.entry.suffix).join("/")} → ${baseCandidates.join(" | ")}`
    );
  }

  // Does the outermost suffix IPA (or any allomorph) appear at the end?
  const phon = normPhon(ipa);
  const tails = [outerStep.entry.ipa, ...(outerStep.entry.ipaAlts ?? [])].map(normPhon);
  if (tails.some((t: string) => phon.endsWith(t))) {
    ipaTailMatch++;
    s.ipaMatch++;
  } else if (ipaMismatch.length < 50) {
    ipaMismatch.push({ word, base: d.base, suffix: outerSuffix, expected: tails.join("|"), ipa: phon });
  }
}

const pct = (n: number, d: number) => ((n / d) * 100).toFixed(1) + "%";

console.log(`Total alphabetic dict entries (≥4 letters): ${total}`);
console.log(`Decomposed (at least one suffix matched): ${decomposed} (${pct(decomposed, total)})`);
console.log(`  ...where final base exists in dict: ${baseKnown} (${pct(baseKnown, decomposed)} of decomposed)`);
console.log(`  ...where outer suffix IPA tail matches: ${ipaTailMatch} (${pct(ipaTailMatch, decomposed)} of decomposed)`);
console.log(`Average decomposition depth: ${(depthSum / Math.max(1, decomposed)).toFixed(2)}`);

console.log(`\n=== Top 25 suffixes by usage ===`);
const sorted = Array.from(perSuffix.entries()).sort((a, b) => b[1].uses - a[1].uses);
console.log(`${"suffix".padEnd(12)} ${"uses".padStart(6)} ${"base✓".padStart(7)} ${"ipa✓".padStart(7)}  samples`);
for (const [suf, st] of sorted.slice(0, 25)) {
  console.log(
    `${("-" + suf).padEnd(12)} ${st.uses.toString().padStart(6)} ${pct(st.baseKnown, st.uses).padStart(7)} ${pct(st.ipaMatch, st.uses).padStart(7)}  ${st.samples.join(", ")}`
  );
}

console.log(`\n=== Suffixes with poor base-recovery (<30%, top 15) ===`);
const poorBase = Array.from(perSuffix.entries())
  .filter(([, st]) => st.uses >= 20 && st.baseKnown / st.uses < 0.3)
  .sort((a, b) => b[1].uses - a[1].uses)
  .slice(0, 15);
for (const [suf, st] of poorBase) {
  console.log(
    `  -${suf.padEnd(8)} ${st.uses.toString().padStart(5)}× base✓=${pct(st.baseKnown, st.uses).padStart(6)}  ${st.samples.slice(0, 3).join(", ")}`
  );
}

console.log(`\n=== Sample IPA mismatches (suffix IPA not at tail) ===`);
for (const m of ipaMismatch.slice(0, 15)) {
  console.log(`  ${m.word} (-${m.suffix})  expected …${m.expected}  got ${m.ipa}`);
}

console.log(`\n=== Sample base-unknown decompositions ===`);
for (const s of baseUnknown.slice(0, 20)) console.log(`  ${s}`);
