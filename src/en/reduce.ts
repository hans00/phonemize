/**
 * English vowel reduction (P2.2 of G2P redesign).
 *
 * Given an IPA string (no stress marks) and the set of stressed nucleus
 * indices, replace each unstressed vowel nucleus with its reduced form.
 *
 * Reduction rules (simple, ordered by specificity):
 *
 *   1. Unstressed nucleus immediately followed by /ɹ/ (any vowel + r in
 *      the same syllable) → ɝ.  Examples: doctor /dɑkˈtɝ/, mother /mʌðˈɝ/.
 *
 *   2. Unstressed word-final open syllable with high front vowel
 *      (/i, ɪ/) → i (happy-tensing).
 *
 *   3. All other unstressed nuclei → ə.
 *
 * Stressed nuclei are left untouched. Long vowels (/i/, /u/, /eɪ/, /oʊ/,
 * /aɪ/, /aʊ/, /ɔɪ/) generally don't reduce — caller can decide whether to
 * apply rules to them via the `reduceLong` option (default: false).
 *
 * The function expects no stress marks in the input — caller manages
 * stress externally via the indices.
 */

const VOWELS = new Set("aeiouæɛɪɔʊʌəɝ");
const LONG_VOWEL_STARTS = new Set("eoauɔ"); // start char of eɪ, oʊ, aɪ, aʊ, ɔɪ
const DIPHTHONG_FOLLOWERS = new Set("ɪʊ"); // second char of eɪ, oʊ, aɪ, aʊ, ɔɪ

/**
 * Locate each vowel nucleus in `ipa`. Returns array of (startIdx, endIdx)
 * where endIdx is exclusive.
 */
export function findNuclei(ipa: string): Array<[number, number]> {
  const nuclei: Array<[number, number]> = [];
  let i = 0;
  while (i < ipa.length) {
    if (VOWELS.has(ipa[i])) {
      const start = i;
      while (i < ipa.length && VOWELS.has(ipa[i])) i++;
      nuclei.push([start, i]);
    } else {
      i++;
    }
  }
  return nuclei;
}

/**
 * Determine if a nucleus represents a long/tense vowel that resists
 * reduction (diphthong or long monophthong).
 */
function isLongVowel(nucleus: string): boolean {
  if (nucleus.length >= 2) {
    // Check for English diphthongs: eɪ, oʊ, aɪ, aʊ, ɔɪ, iə, uə
    if (
      LONG_VOWEL_STARTS.has(nucleus[0]) &&
      DIPHTHONG_FOLLOWERS.has(nucleus[1])
    ) {
      return true;
    }
  }
  // Single long vowels: i, u (tense), ɝ (already rhotic), ɔ (sometimes)
  return nucleus === "i" || nucleus === "u" || nucleus === "ɝ";
}

export interface ReduceOptions {
  /** Also reduce long vowels (default: false — they typically resist). */
  reduceLong?: boolean;
  /** Apply happy-tensing for unstressed word-final /i/. */
  happyTensing?: boolean;
}

/**
 * Reduce unstressed vowels in `ipa`. `stressed` is a set of nucleus indices
 * (0-based, in the order they appear in `ipa`) that should NOT be reduced.
 */
export function reduceUnstressedVowels(
  ipa: string,
  stressed: ReadonlySet<number>,
  opts: ReduceOptions = {}
): string {
  const { reduceLong = false, happyTensing = true } = opts;
  const nuclei = findNuclei(ipa);

  // Build new string by replacing each unstressed, reducible nucleus.
  const parts: string[] = [];
  let cursor = 0;
  for (let n = 0; n < nuclei.length; n++) {
    const [start, end] = nuclei[n];
    parts.push(ipa.slice(cursor, start));
    const nucleus = ipa.slice(start, end);
    if (stressed.has(n)) {
      parts.push(nucleus);
    } else if (!reduceLong && isLongVowel(nucleus)) {
      parts.push(nucleus);
    } else {
      parts.push(reduceForContext(nucleus, ipa, end, n === nuclei.length - 1, happyTensing));
    }
    cursor = end;
  }
  parts.push(ipa.slice(cursor));
  return parts.join("");
}

function reduceForContext(
  nucleus: string,
  fullIpa: string,
  endPos: number,
  isFinalNucleus: boolean,
  happyTensing: boolean
): string {
  // R-coloring: nucleus + immediately following ɹ → ɝ (one segment).
  if (fullIpa[endPos] === "ɹ") return "ɝ";

  // Happy-tensing: word-final unstressed high front → i.
  if (
    happyTensing &&
    isFinalNucleus &&
    endPos === fullIpa.length &&
    (nucleus === "i" || nucleus === "ɪ")
  ) {
    return "i";
  }

  return "ə";
}

/**
 * Given an IPA string with stress marks, extract the set of stressed
 * nucleus indices (primary + secondary both count as "stressed" for
 * reduction purposes).
 */
export function extractStressedNuclei(ipa: string): Set<number> {
  const stressed = new Set<number>();
  let nucleusIdx = -1;
  let inVowel = false;
  let pendingStress = false;
  for (const c of ipa) {
    if (c === "ˈ" || c === "ˌ") {
      pendingStress = true;
      inVowel = false;
      continue;
    }
    if (VOWELS.has(c)) {
      if (!inVowel) {
        nucleusIdx++;
        if (pendingStress) {
          stressed.add(nucleusIdx);
          pendingStress = false;
        }
      }
      inVowel = true;
    } else {
      // Stress mark applies to the next nucleus across the onset consonants
      // (so "əˈbɛɹ" still marks the ɛ stressed even though ˈ→b→ɛ).
      inVowel = false;
    }
  }
  return stressed;
}
