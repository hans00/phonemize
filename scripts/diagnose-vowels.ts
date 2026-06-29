/**
 * Categorize vowel-quality mismatches in the strict eval by the
 * specific vowel-pair substitution (predicted → expected).
 *
 * Helps target the highest-leverage vowel fixes: e.g., if "ə → ɛ"
 * accounts for 30% of vowel errors, focus on schwa-vs-epsilon
 * reduction rules.
 */

import { readFileSync } from "fs";
import EnglishG2P from "../src/en/g2p";
import * as levenshtein from "fast-levenshtein";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

const VOWELS = new Set("aeiouæɛɪɔʊʌəɝ");
const STRESS = /[ˈˌ]/g;
const stripStress = (s: string) => s.replace(STRESS, "");

// Same foreign/acronym filters as evaluate-strict.ts (kept inline so this
// script stands alone).
const FOREIGN: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/, /(cz|sz|rz|szcz)/,
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/,
  /(gli|gn[aeiou])/,
  /(eaux|aux|eau|oise|ois|aire|ette|elle|gne|ille|ique)$/,
  /(stein|berg|burg|mann|hoff|holz|brunn|heim|bach|wald|enstein)$/,
  /(sch|tsch|pf)/,
  /(ovich|evich|insky|insk|ova|enko|sky)$/,
  /(opoulos|idis|akis)$/,
  /^(mc|mac|o')/,
];
function isForeign(w: string) {
  if (/^(scratch|scheme|schedule|sch|school)$/.test(w)) return false;
  return FOREIGN.some((p) => p.test(w) && w.length >= 5);
}

const g2p = new EnglishG2P({ disableDict: true });

// pair "pVowel|eVowel" -> { count, examples }
interface Pair { count: number; examples: string[]; }
const pairs: Map<string, Pair> = new Map();
let totalVowelOnly = 0;

for (const [word, expected] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 3 || word.length > 12) continue;
  if (isForeign(word)) continue;
  const pred = g2p.predict(word, "en");
  if (typeof pred !== "string") continue;
  if (pred === expected) continue;
  const predN = stripStress(pred), expN = stripStress(expected);
  if (predN === expN) continue;
  if (predN.length !== expN.length) continue; // structural mismatch, not vowel-only

  // Walk char by char; record each differing position if both chars are vowels.
  let diffs = 0;
  const localPairs: string[] = [];
  for (let i = 0; i < predN.length; i++) {
    if (predN[i] === expN[i]) continue;
    diffs++;
    if (!VOWELS.has(predN[i]) || !VOWELS.has(expN[i])) {
      diffs = -1; break; // consonant differs → not pure vowel-only
    }
    localPairs.push(`${predN[i]}|${expN[i]}`);
  }
  if (diffs <= 0) continue;
  totalVowelOnly++;
  for (const k of localPairs) {
    if (!pairs.has(k)) pairs.set(k, { count: 0, examples: [] });
    const p = pairs.get(k)!;
    p.count++;
    if (p.examples.length < 5) p.examples.push(`${word}: ${pred}  ≠  ${expected}`);
  }
}

console.log(`Vowel-only mismatches: ${totalVowelOnly}`);
console.log(`\n=== Top vowel substitutions (predicted → expected) ===`);
const sorted = Array.from(pairs.entries()).sort((a, b) => b[1].count - a[1].count);
for (const [k, p] of sorted.slice(0, 20)) {
  const [pv, ev] = k.split("|");
  const pct = ((p.count / totalVowelOnly) * 100).toFixed(1);
  console.log(`  ${pv.padEnd(2)} → ${ev.padEnd(2)}  ${p.count.toString().padStart(5)}  (${pct.padStart(4)}%)`);
  for (const e of p.examples.slice(0, 2)) console.log(`      ${e}`);
}
