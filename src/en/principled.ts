/**
 * End-to-end principled prediction (P2.3 of G2P redesign).
 *
 * Combines decomposer + stress FSM + reduction into a single function:
 *
 *    predictPrincipled(word, baseLookup) → IPA | null
 *
 * Steps:
 *   1. Decompose word → outer suffix + base (with alternate spellings).
 *   2. Look up base IPA via `baseLookup` (caller supplies; typically dict
 *      lookup, eventually compiled rule table from P3).
 *   3. Concatenate base IPA + suffix IPA (stress marks stripped from base).
 *   4. Compute new stress via assignStress, passing the base's own stress
 *      index for neutral suffixes.
 *   5. Reduce unstressed vowels in the result.
 *   6. Insert stress marks at the predicted positions.
 *
 * Returns null if the word can't be decomposed or the base can't be
 * resolved. The caller falls back to other strategies in that case.
 *
 * This is purely a composition layer — all the linguistic logic lives in
 * en-suffixes, en-stress, and en-reduce.
 */

import { decompose, reduces, SuffixEntry } from "./suffixes";
import {
  assignStress,
  countIpaSyllables,
  dictStressIdx,
  Stress,
} from "./stress";
import {
  findNuclei,
  reduceUnstressedVowels,
} from "./reduce";

export type BaseLookup = (word: string) => string | undefined;

export interface PrincipledResult {
  ipa: string;
  base: string;
  suffix: SuffixEntry;
  stress: Stress;
}

function stripStress(s: string): string {
  return s.replace(/[ˈˌ]/g, "");
}

/**
 * Insert a stress mark before the onset of the syllable containing nucleus
 * `nucleusIdx`. Simple convention: place the mark immediately before the
 * first non-vowel character preceding the nucleus (i.e., the syllable's
 * onset consonants), or directly before the nucleus if it's onsetless.
 */
function insertStressMark(
  ipa: string,
  nucleusIdx: number,
  mark: string
): string {
  const nuclei = findNuclei(ipa);
  if (nucleusIdx < 0 || nucleusIdx >= nuclei.length) return ipa;
  const [nucStart] = nuclei[nucleusIdx];

  // Walk backwards from nucStart to find the start of the onset consonants.
  // Stop when we hit the end of the previous nucleus, an existing stress
  // mark, or the start of the string.
  let i = nucStart;
  while (i > 0) {
    const prev = ipa[i - 1];
    if (prev === "ˈ" || prev === "ˌ") break;
    if ("aeiouæɛɪɔʊʌəɝ".includes(prev)) break;
    i--;
  }
  return ipa.slice(0, i) + mark + ipa.slice(i);
}

/**
 * Run the full principled pipeline. Returns null if the word can't be
 * processed (no recognizable suffix, or base not resolvable).
 */
export function predictPrincipled(
  word: string,
  baseLookup: BaseLookup
): PrincipledResult | null {
  // Only the OUTERMOST suffix is peeled — deeper decomposition risks
  // matching the wrong base (e.g., "access" → -s → -es → "acc" hits the
  // acronym entry). Once we have a working pipeline, deeper analysis can
  // be done recursively on the resolved base.
  const d = decompose(word, /* maxDepth */ 1);
  if (d.steps.length === 0) return null;

  const outer = d.steps[0].entry;
  const baseCandidate = d.steps[0].after;
  const baseAlts = d.steps[0].afterAlts;

  // Prefer silent-e-recovered forms for vowel-initial suffixes
  // (e.g. "caning" → "cane" before "can").
  const vowelInitialSuffix = /^[aeiouy]/.test(outer.suffix);
  const orderedBases = vowelInitialSuffix
    ? [...baseAlts, baseCandidate]
    : [baseCandidate, ...baseAlts];
  let baseWord: string | null = null;
  let baseIpa: string | null = null;
  for (const cand of orderedBases) {
    const found = baseLookup(cand);
    if (found !== undefined) {
      baseWord = cand;
      baseIpa = found;
      break;
    }
  }
  if (baseIpa === null || baseWord === null) return null;

  const baseStressIdx = dictStressIdx(baseIpa);
  let baseStripped = stripStress(baseIpa);

  // Morphophonological boundary adjustment: when the base was reconstructed
  // by adding back -ate/-ite/-ote/-ute (Latinate -ion family) or -ct/-pt
  // (palatalized -tion forms), the IPA segment we added back is *also*
  // contained in the suffix's IPA. Strip it from the base side to avoid
  // doubling (e.g., "educate" + "-ation" → strip "eɪt" before concat so
  // we don't get "kétà-éɪt-éɪshən").
  if (baseWord !== baseCandidate) {
    const added = baseWord.slice(baseCandidate.length);
    const stripIfEnds = (suffix: string) => {
      if (baseStripped.endsWith(suffix)) {
        baseStripped = baseStripped.slice(0, -suffix.length);
        return true;
      }
      return false;
    };
    switch (added) {
      case "ate": stripIfEnds("eɪt") || stripIfEnds("ət"); break;
      case "ite": stripIfEnds("aɪt") || stripIfEnds("ɪt"); break;
      case "ote": stripIfEnds("oʊt"); break;
      case "ute": stripIfEnds("jut") || stripIfEnds("ut"); break;
      case "ct":  stripIfEnds("kt"); break;
      case "pt":  stripIfEnds("pt"); break;
    }
  }

  // Combine base + suffix IPA (suffix has no stress marks).
  const fullIpa = baseStripped + outer.ipa;

  // Compute new stress.
  const sylCount = countIpaSyllables(fullIpa);
  const stress = assignStress({
    syllableCount: sylCount,
    suffix: outer,
    baseStress: baseStressIdx >= 0 ? baseStressIdx : undefined,
  });

  // Reduce unstressed vowels (only if the suffix triggers it, i.e., not
  // for neutral Class-II suffixes — those preserve base vowels).
  const stressedSet = new Set<number>([stress.primary]);
  if (stress.secondary !== undefined) stressedSet.add(stress.secondary);

  const reducedIpa = reduces(outer)
    ? reduceUnstressedVowels(fullIpa, stressedSet)
    : fullIpa;

  // Insert stress marks: secondary first (so the position indices remain
  // valid as we work right-to-left).
  let withStress = reducedIpa;
  // Insert primary; recompute secondary position to be safe.
  withStress = insertStressMark(withStress, stress.primary, "ˈ");
  if (stress.secondary !== undefined) {
    // After insertion, the nucleus indices shift only if the secondary is
    // to the right of primary. Our convention places secondary BEFORE
    // primary (lower index), so secondary's nucleus index is unchanged
    // in `reducedIpa`, but its char position has shifted in `withStress`
    // by 1 (the inserted mark). insertStressMark re-finds by nucleus, so
    // we just call it again on the stress-augmented string.
    withStress = insertStressMark(withStress, stress.secondary, "ˌ");
  }

  return { ipa: withStress, base: baseWord, suffix: outer, stress };
}
