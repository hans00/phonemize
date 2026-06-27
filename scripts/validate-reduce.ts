/**
 * P2.2 validator: check whether vowel reduction rules match the dict.
 *
 * Strategy: for each dict entry, walk its IPA, find each unstressed vowel
 * nucleus, and check that it falls into one of the three predicted reduced
 * categories:
 *   - ɝ (when followed by ɹ in same syllable)
 *   - i (when word-final, after high front)
 *   - ə
 *
 * Any unstressed nucleus that's a full vowel other than these is a
 * reduction failure — either an actual irregularity, or a rule we're
 * missing (e.g., secondary-stress retention, compound vowels).
 */

import { readFileSync } from "fs";
import { findNuclei, extractStressedNuclei } from "../src/en/reduce";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

function stripStress(s: string): string {
  return s.replace(/[ˈˌ]/g, "");
}

let totalUnstressed = 0;
let asExpected = 0;
const unexpectedCounts: Map<string, number> = new Map();
const examples: Map<string, string[]> = new Map();

for (const [word, ipa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 4) continue;

  const stressed = extractStressedNuclei(ipa);
  const stripped = stripStress(ipa);
  const nuclei = findNuclei(stripped);

  for (let n = 0; n < nuclei.length; n++) {
    if (stressed.has(n)) continue;
    const [start, end] = nuclei[n];
    const nucleus = stripped.slice(start, end);
    totalUnstressed++;

    // Classify the nucleus
    // 1. Single ə / ɝ → expected
    // 2. Single i in word-final position → happy-tensing
    // 3. ɪ in word-final → also acceptable (variant of happy-tensing)
    // 4. ʊ → acceptable as reduced (e.g., -ful)
    // 5. anything else → unexpected

    const isWordFinal = n === nuclei.length - 1 && end === stripped.length;
    const nextNucleusAdjacent =
      n < nuclei.length - 1 && nuclei[n + 1][0] === end; // hiatus: no consonant between
    if (nucleus === "ə" || nucleus === "ɝ") {
      asExpected++;
    } else if (isWordFinal && (nucleus === "i" || nucleus === "ɪ")) {
      asExpected++;
    } else if (nucleus === "ʊ" || nucleus === "ɪ") {
      // Lax vowel — often acceptable as "reduced" in many dialects
      asExpected++;
    } else if (nextNucleusAdjacent && (nucleus === "i" || nucleus === "u")) {
      // Hiatus: unstressed high vowel before another vowel (e.g., -iate, -uate)
      asExpected++;
    } else {
      // Unexpected: full vowel in unstressed position
      const key = nucleus.length === 1 ? nucleus : nucleus;
      unexpectedCounts.set(key, (unexpectedCounts.get(key) ?? 0) + 1);
      if (!examples.has(key)) examples.set(key, []);
      const eg = examples.get(key)!;
      if (eg.length < 5) eg.push(`${word}: ${ipa}`);
    }
  }
}

const pct = (n: number, d: number) => ((n / d) * 100).toFixed(1) + "%";

console.log(`Total unstressed nuclei observed: ${totalUnstressed}`);
console.log(`Match reduced-vowel set (ə/ɝ/i word-final/ɪ/ʊ): ${asExpected} (${pct(asExpected, totalUnstressed)})`);
console.log(`Unexpected (full vowel unstressed): ${totalUnstressed - asExpected} (${pct(totalUnstressed - asExpected, totalUnstressed)})`);

console.log(`\n=== Top unexpected unstressed vowels ===`);
const sorted = Array.from(unexpectedCounts.entries()).sort((a, b) => b[1] - a[1]);
for (const [v, count] of sorted.slice(0, 15)) {
  console.log(`  ${v}  ${count}× (${pct(count, totalUnstressed)})`);
  const egs = examples.get(v) ?? [];
  for (const eg of egs.slice(0, 3)) console.log(`     ${eg}`);
}
