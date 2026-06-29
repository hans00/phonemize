/**
 * P2.1 validator: predict stress position via assignStress() and compare
 * with dict's actual ˈ mark position.
 *
 * Method (no orthographic syllabifier dependency):
 *   - Count syllables in dict IPA (vowel nuclei)
 *   - Decompose word; count suffix syllables from its IPA
 *   - Predict stress via assignStress
 *   - Compare to dictStressIdx(ipa)
 *
 * Reports: per-class accuracy, mismatches grouped by suffix.
 */

import { readFileSync } from "fs";
import { decompose } from "../src/en/suffixes";
import { assignStress, countIpaSyllables, dictStressIdx } from "../src/en/stress";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

let total = 0;
let predicted = 0;
let correct = 0;
let offByOne = 0;

const perClass: Map<string, { total: number; correct: number; off1: number; samples: string[] }> = new Map();
const mismatches: Array<{ word: string; suffix: string; cls: string; expected: number; got: number; ipa: string }> = [];

for (const [word, ipa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 4) continue;
  total++;

  const d = decompose(word);
  if (d.steps.length === 0) continue;

  const sylCount = countIpaSyllables(ipa);
  if (sylCount < 2) continue;

  const expected = dictStressIdx(ipa);
  if (expected < 0) continue;

  const outer = d.steps[0].entry;
  const cls = outer.stress;
  // For neutral suffixes, look up the base's stress (this is what the runtime
  // will do once the principled pipeline is integrated).
  let baseStress: number | undefined;
  if (cls === "neutral") {
    const baseCandidates = [d.base, ...d.baseAlts];
    for (const cand of baseCandidates) {
      if (dict[cand] !== undefined) {
        baseStress = dictStressIdx(dict[cand]);
        if (baseStress >= 0) break;
      }
    }
  }
  const predictedStress = assignStress({
    syllableCount: sylCount,
    suffix: outer,
    baseStress: baseStress !== undefined && baseStress >= 0 ? baseStress : undefined,
  });

  predicted++;
  if (!perClass.has(cls)) perClass.set(cls, { total: 0, correct: 0, off1: 0, samples: [] });
  const c = perClass.get(cls)!;
  c.total++;

  if (predictedStress.primary === expected) {
    correct++;
    c.correct++;
  } else if (Math.abs(predictedStress.primary - expected) === 1) {
    offByOne++;
    c.off1++;
    if (c.samples.length < 5) c.samples.push(`${word} (got=${predictedStress.primary}, exp=${expected})`);
  } else {
    if (mismatches.length < 50 && Math.random() < 0.05) {
      mismatches.push({ word, suffix: outer.suffix, cls, expected, got: predictedStress.primary, ipa });
    }
  }
}

const pct = (n: number, d: number) => (d === 0 ? "n/a" : ((n / d) * 100).toFixed(1) + "%");

console.log(`Total dict entries (≥4 letters, ≥2 syllables, decomposable): ${predicted}`);
console.log(`Correct primary stress:    ${correct} (${pct(correct, predicted)})`);
console.log(`Off by one syllable:       ${offByOne} (${pct(offByOne, predicted)})`);
console.log(`Off by ≥2:                 ${predicted - correct - offByOne} (${pct(predicted - correct - offByOne, predicted)})`);

console.log(`\n=== Per stress-class accuracy ===`);
console.log(`${"class".padEnd(10)} ${"total".padStart(7)} ${"correct".padStart(9)} ${"off1".padStart(8)}`);
for (const [cls, st] of Array.from(perClass.entries()).sort((a, b) => b[1].total - a[1].total)) {
  console.log(
    `${cls.padEnd(10)} ${st.total.toString().padStart(7)} ${pct(st.correct, st.total).padStart(9)} ${pct(st.off1, st.total).padStart(8)}`
  );
  if (st.samples.length > 0) {
    console.log(`  off-by-1 samples: ${st.samples.slice(0, 3).join("; ")}`);
  }
}

console.log(`\n=== Sample mismatches (off by ≥2) ===`);
for (const m of mismatches.slice(0, 15)) {
  console.log(`  ${m.word} (-${m.suffix}, ${m.cls}): predicted syl ${m.got}, dict syl ${m.expected}  ipa=${m.ipa}`);
}
