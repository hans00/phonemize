/**
 * English stress assignment FSM (P2.1 of G2P redesign).
 *
 * Given a syllable count and (optionally) the outer suffix that was peeled
 * off, return the index of the primary stress (and secondary if computable).
 *
 * Two layers:
 *
 *   1. Suffix-driven (rule from SuffixEntry.stress):
 *      - "neutral":  inherit base stress (caller supplies baseStress)
 *      - "pre":      stress on syllable immediately before suffix
 *      - "pre2":     stress on syllable two before suffix
 *      - "self":     suffix syllable bears stress
 *
 *   2. Latin default (no suffix or after recursion):
 *      - 1-2 syllable words: stress initial
 *      - 3+ syllable words: heavy penult attracts, else antepenult
 *      - A syllable is "heavy" if it has a long vowel/diphthong or is closed
 *
 * Syllable representation here is opaque — caller is responsible for
 * syllabifying. The FSM works on syllable counts + heaviness predicate.
 */

import type { SuffixEntry } from "./en-suffixes";

export interface Stress {
  /** Index (0-based) of the primary-stressed syllable. */
  primary: number;
  /** Optional index of secondary stress (often 2 syllables before primary). */
  secondary?: number;
}

/** Vowel chars used to detect nuclei when computing IPA syllable counts. */
const IPA_VOWELS = new Set("aeiouæɛɪɔʊʌəɝ");

/**
 * Count vowel nuclei in an IPA string. A diphthong like "eɪ" counts as one
 * (two consecutive vowel chars = one nucleus run). Stress marks act as
 * syllable boundaries (so "vi" + "ˈeɪ" in "abbreviation" counts as two
 * separate nuclei, not one hiatus run).
 */
export function countIpaSyllables(ipa: string): number {
  let count = 0;
  let inVowel = false;
  for (const c of ipa) {
    if (IPA_VOWELS.has(c)) {
      if (!inVowel) count++;
      inVowel = true;
    } else {
      // Any non-vowel (including stress marks) ends the current nucleus.
      inVowel = false;
    }
  }
  return count;
}

/**
 * Find the index of the primary-stressed syllable from a dict IPA string.
 * Returns -1 if no primary stress mark is present.
 */
export function dictStressIdx(ipa: string): number {
  let nucleiBefore = 0;
  let inVowel = false;
  for (const c of ipa) {
    if (c === "ˈ") return nucleiBefore;
    if (IPA_VOWELS.has(c)) {
      if (!inVowel) nucleiBefore++;
      inVowel = true;
    } else if (c !== "ˌ") {
      inVowel = false;
    }
  }
  return -1;
}

/**
 * Default Latin stress: heavy penult attracts, else antepenult. For very
 * short words, stress initial syllable.
 */
export function latinStress(
  syllableCount: number,
  isHeavy: (i: number) => boolean
): Stress {
  if (syllableCount <= 1) return { primary: 0 };
  if (syllableCount === 2) return { primary: 0 };
  const penult = syllableCount - 2;
  if (isHeavy(penult)) return { primary: penult };
  return { primary: Math.max(0, syllableCount - 3) };
}

/**
 * Assign stress to a word given total syllable count, an optional outer
 * suffix that was peeled off, and (for the neutral case) the base's own
 * stress index. Position-from-end indexing matches the underlying Latin
 * stress rule and unifies the suffix table.
 */
export function assignStress(opts: {
  syllableCount: number;
  suffix?: SuffixEntry;
  baseStress?: number;      // for neutral suffixes
  isHeavy?: (i: number) => boolean;
}): Stress {
  const { syllableCount, suffix } = opts;
  if (syllableCount <= 0) return { primary: 0 };
  if (syllableCount === 1) return { primary: 0 };

  if (suffix) {
    switch (suffix.stress) {
      case "final":
        return withSecondary(syllableCount - 1);
      case "penult":
        return withSecondary(Math.max(0, syllableCount - 2));
      case "antepenult":
        return withSecondary(Math.max(0, syllableCount - 3));
      case "neutral": {
        if (opts.baseStress !== undefined) return withSecondary(opts.baseStress);
        break;
      }
    }
  }

  // Default: Latin rule
  return latinStress(syllableCount, opts.isHeavy ?? (() => false));
}

/** Add a secondary stress two syllables before primary (Eng. default). */
function withSecondary(primary: number): Stress {
  const secondary = primary - 2;
  return secondary >= 0 ? { primary, secondary } : { primary };
}
