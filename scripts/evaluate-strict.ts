/**
 * Stress-aware evaluation.
 *
 * The legacy `scripts/evaluate.ts` strips stress marks (`ˈ` `ˌ`) and
 * applies a SIMILAR-vowel canonicalization before comparing predicted
 * vs dict IPA. That artificially inflates scores because rule errors
 * in stress placement and reduced-vowel choice are masked.
 *
 * This script measures *what users hear*: stress preserved, vowels not
 * collapsed. Three buckets:
 *
 *   1. exactMatch        — identical IPA strings.
 *   2. stressOnly        — IPA identical after stripping stress, but
 *                          stress differs (over/under-marked, wrong
 *                          syllable).
 *   3. vowelOnly         — IPA differs in vowel quality only, stress
 *                          positions match.
 *   4. structural        — segment count or consonant differs.
 *
 * Use `--update-baseline` to capture the current numbers as the new
 * reference; subsequent runs compare against it.
 */

import EnglishG2P from "../src/en/g2p";
import { readFileSync, writeFileSync, existsSync } from "fs";
import * as levenshtein from "fast-levenshtein";

const BASELINE = "./scripts/eval-strict-baseline.json";
const UPDATE = process.argv.includes("--update-baseline");

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

// Foreign-origin filter (mirrors scripts/mine-exceptions.ts ORIGIN_RULES).
// Rules can't predict source-language phonology — these belong in exceptions,
// not in the rule-engine target.
const FOREIGN: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/, /(cz|sz|rz|szcz)/,
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/,
  /(gli|gn[aeiou])/,
  /(eaux|aux|eau|oise|ois|aire|ette|elle|gne|ille|ique)$/,
  /(beau|deau|reau|teau|mont|jean)/,
  /(ez|os|illo|illa|ando|endo|ente)$/,
  /(rodriguez|gonzalez|hernandez|sanchez|gomez|santos)/,
  /(stein|berg|burg|mann|hoff|holz|brunn|heim|bach|wald|enstein)$/,
  /(sch|tsch|pf)/,
  /(ovich|evich|ovna|evna|insky|insk|ova|ev|ov|enko|sky)$/,
  /(opoulos|idis|akis|opolous|antos|aros)$/,
  /(ahmed|hamed|hussein|hassan|abdul|mohammed|mohamed)/,
  /^(mc|mac|o')/, /(ough|llwyd|gwyn|aoibh)/,
  /(tsuda|shima|moto|hara|yama|kawa|saki|naka|hashi|guchi|sato|suzuki|takaha)$/,
  /^(nguyen|tran|huynh|wang|chen|liu|zhang|kim|lee|park|choi)$/,
];
const NATIVE_OVERRIDE = /^(scratch|scheme|schedule|sch|school)$/;
function isForeign(w: string): boolean {
  if (NATIVE_OVERRIDE.test(w)) return false;
  for (const p of FOREIGN) if (p.test(w) && w.length >= 5) return true;
  return false;
}

// Acronym detector — these are letter-spelling outputs that rules can't
// reproduce without an explicit acronym handler.
const LETTER_NAMES: Record<string, string> = {
  a: "eɪ", b: "bi", c: "si", d: "di", e: "i", f: "ɛf", g: "dʒi", h: "eɪtʃ",
  i: "aɪ", j: "dʒeɪ", k: "keɪ", l: "ɛɫ", m: "ɛm", n: "ɛn", o: "oʊ", p: "pi",
  q: "kju", r: "ɑɹ", s: "ɛs", t: "ti", u: "ju", v: "vi", w: "dʌbəɫju",
  x: "ɛks", y: "waɪ", z: "zi",
};
function isAcronym(word: string, ipa: string): boolean {
  let p = ipa.replace(STRESS, "").replace(/ɫ/g, "l");
  for (const c of word) {
    const l = LETTER_NAMES[c]?.replace(/ɫ/g, "l");
    if (!l || !p.startsWith(l)) return false;
    p = p.slice(l.length);
  }
  return p === "";
}

const STRESS = /[ˈˌ]/g;
const stripStress = (s: string) => s.replace(STRESS, "");

// en-US phonemic canonicalization — the headline accuracy metric.
// CMUDict (the reference) marks two things inconsistently and
// non-contrastively for General American, so matching its exact string
// over-penalizes pronunciations that are equally correct en-US:
//   1. Secondary stress (ˌ) — not phonemically contrastive; dictionaries
//      disagree heavily on whether/where to mark it. Neutralized.
//   2. The unstressed weak-vowel merger — unstressed /ɪ/ and /ə/ are
//      merged for most NAmE speakers (roses ≈ Rosa's), and CMUDict uses
//      IH0/AH0 interchangeably for the same contexts. Unstressed /ɪ/ → /ə/.
// Primary stress placement, stressed-vowel quality, and every consonant
// stay fully strict.
const PHON_VOWELS = "aeiouɑæɛɪɔʊʌəɝ";
function enUsPhonemic(ipa: string): string {
  const noSecondary = ipa.replace(/ˌ/g, "");
  let out = "";
  for (let i = 0; i < noSecondary.length; i++) {
    if (noSecondary[i] !== "ɪ") {
      out += noSecondary[i];
      continue;
    }
    // /ɪ/ is stressed iff scanning back over its onset reaches a primary
    // mark before any other vowel; otherwise it is the reduced weak vowel.
    let stressed = false;
    for (let j = i - 1; j >= 0; j--) {
      const c = noSecondary[j];
      if (c === "ˈ") { stressed = true; break; }
      if (PHON_VOWELS.includes(c)) break;
    }
    out += stressed ? "ɪ" : "ə";
  }
  return out;
}

// Find the index of the primary-stressed nucleus (-1 if none).
const VOWELS = new Set("aeiouæɛɪɔʊʌəɝ");
function primaryStressIdx(ipa: string): number {
  let nuclei = 0, inV = false, pending = false;
  for (const c of ipa) {
    if (c === "ˈ") { pending = true; inV = false; continue; }
    if (c === "ˌ") { inV = false; continue; }
    if (VOWELS.has(c)) {
      if (!inV) {
        if (pending) { pending = false; return nuclei; }
        nuclei++;
      }
      inV = true;
    } else { inV = false; }
  }
  return -1;
}

interface Bucket { count: number; sample: string[]; }
const buckets: Record<string, Bucket> = {
  exact: { count: 0, sample: [] },
  stressOnly: { count: 0, sample: [] },
  vowelOnly: { count: 0, sample: [] },
  structural: { count: 0, sample: [] },
};

let total = 0, edSum = 0, phonemicExact = 0;
const g2p = new EnglishG2P({ disableDict: true });

for (const [word, expected] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 3 || word.length > 12) continue;
  // Skip words that rules can never predict from spelling alone:
  // - Foreign borrowings (source-language phonology)
  // - Letter-name acronyms (need a separate acronym handler)
  if (isForeign(word)) continue;
  if (isAcronym(word, expected)) continue;
  const pred = g2p.predict(word, "en");
  if (typeof pred !== "string") continue;
  total++;

  const distance = levenshtein.get(pred, expected);
  edSum += distance;

  if (enUsPhonemic(pred) === enUsPhonemic(expected)) phonemicExact++;

  if (pred === expected) {
    buckets.exact.count++;
    continue;
  }
  if (stripStress(pred) === stripStress(expected)) {
    buckets.stressOnly.count++;
    if (buckets.stressOnly.sample.length < 8)
      buckets.stressOnly.sample.push(`${word}: ${pred}  ≠ ${expected}`);
    continue;
  }
  const predNoVow = stripStress(pred).replace(/[æɛɪɔʊʌəɝaeiouy]/g, "·");
  const expNoVow = stripStress(expected).replace(/[æɛɪɔʊʌəɝaeiouy]/g, "·");
  const samePrimary = primaryStressIdx(pred) === primaryStressIdx(expected);
  if (predNoVow === expNoVow && samePrimary) {
    buckets.vowelOnly.count++;
    if (buckets.vowelOnly.sample.length < 8)
      buckets.vowelOnly.sample.push(`${word}: ${pred}  ≠ ${expected}`);
    continue;
  }
  buckets.structural.count++;
  if (buckets.structural.sample.length < 8)
    buckets.structural.sample.push(`${word}: ${pred}  ≠ ${expected}`);
}

const pct = (n: number) => ((n / total) * 100).toFixed(2) + "%";
const results = {
  total,
  exact: buckets.exact.count,
  phonemicExact,
  stressOnly: buckets.stressOnly.count,
  vowelOnly: buckets.vowelOnly.count,
  structural: buckets.structural.count,
  meanED: Number((edSum / total).toFixed(4)),
};

console.log(`Total scored: ${total}`);
console.log(`en-US phonemic accuracy:      ${results.phonemicExact}  (${pct(results.phonemicExact)})  ← headline (2ry-stress + weak-vowel neutralized)`);
console.log(`Exact match (full IPA):       ${results.exact}  (${pct(results.exact)})`);
console.log(`Stress-only mismatch:         ${results.stressOnly}  (${pct(results.stressOnly)})`);
console.log(`Vowel-quality only:           ${results.vowelOnly}  (${pct(results.vowelOnly)})`);
console.log(`Structural (consonant/syl):   ${results.structural}  (${pct(results.structural)})`);
console.log(`Mean raw Levenshtein:         ${results.meanED}`);

// Diff vs baseline
if (existsSync(BASELINE) && !UPDATE) {
  const base = JSON.parse(readFileSync(BASELINE, "utf8")) as typeof results;
  const delta = (cur: number, prev: number) => {
    const d = cur - prev;
    if (d === 0) return "";
    return ` (${d >= 0 ? "+" : ""}${d})`;
  };
  console.log(`\nΔ vs baseline (${BASELINE}):`);
  console.log(`  phonemic:   ${delta(results.phonemicExact, base.phonemicExact ?? 0)}`);
  console.log(`  exact:      ${delta(results.exact, base.exact)}`);
  console.log(`  stressOnly: ${delta(results.stressOnly, base.stressOnly)}`);
  console.log(`  vowelOnly:  ${delta(results.vowelOnly, base.vowelOnly)}`);
  console.log(`  structural: ${delta(results.structural, base.structural)}`);
  console.log(`  meanED:     ${(results.meanED - base.meanED).toFixed(4)}`);
}

if (UPDATE) {
  writeFileSync(BASELINE, JSON.stringify(results, null, 2));
  console.log(`\nBaseline updated → ${BASELINE}`);
}

console.log(`\n=== Stress-only mismatch samples ===`);
for (const s of buckets.stressOnly.sample) console.log("  " + s);
console.log(`\n=== Vowel-only mismatch samples ===`);
for (const s of buckets.vowelOnly.sample) console.log("  " + s);
console.log(`\n=== Structural mismatch samples ===`);
for (const s of buckets.structural.sample) console.log("  " + s);
