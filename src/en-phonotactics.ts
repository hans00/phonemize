/**
 * Universal English phonotactic post-processing.
 *
 * A small, principled set of rules that apply to *any* IPA output
 * regardless of which pipeline produced it. These are pure
 * phonological tweaks (not word-specific patches) that adjust the
 * surface form to match native phonology — happy-tensing, syllabic
 * consonants, etc.
 *
 * Distinct from the retired postBase pile (which was 500+ ad-hoc
 * if/replace rules for specific orthographic patterns). The rules
 * here have ≤10 entries and each one captures a universal pattern.
 */

const VOWELS = new Set("aeiouæɛɪɔʊʌəɝ");

/**
 * Happy-tensing: word-final unstressed high front /ɪ/ realises as
 * tense /i/ (happy, city, abadi, valley). Applies when the IPA ends
 * with a single ɪ preceded by a consonant or stress mark — i.e.,
 * it's actually the nucleus of the final syllable, not the second
 * half of a diphthong (ai, oi, ei).
 */
function applyHappyTensing(ipa: string): string {
  if (!ipa.endsWith("ɪ")) return ipa;
  const len = ipa.length;
  // Must not be part of a diphthong (eɪ, aɪ, oɪ, ɔɪ).
  const prev = ipa[len - 2];
  if (prev && "eaoɔ".includes(prev)) return ipa;
  // The previous nucleus must not bear stress *immediately* before this
  // ɪ — that would make ɪ stressed, not "happy". This is approximated
  // by checking there's no ˈ in the trailing run.
  // Simpler: scan back for the nearest stress mark and ensure it's not
  // between this nucleus's onset and the nucleus itself.
  let i = len - 2;
  while (i >= 0 && !VOWELS.has(ipa[i])) {
    if (ipa[i] === "ˈ") return ipa; // stress mark right before ɪ → ɪ is stressed
    i--;
  }
  return ipa.slice(0, len - 1) + "i";
}

/**
 * Apply the small phonotactic rule set. Currently:
 *   1. Happy-tensing on word-final /ɪ/.
 */
export function applyPhonotactics(ipa: string): string {
  return applyHappyTensing(ipa);
}
