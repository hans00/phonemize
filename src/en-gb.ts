/**
 * RP (Received Pronunciation) post-processing for English G2P output.
 *
 * The base English G2P returns General American IPA. This module turns
 * that output into a reasonable RP / Southern Standard British rendering
 * via rule-based transformation — no separate dictionary file is loaded
 * (which would roughly double the package size).
 *
 * Coverage is intentionally conservative:
 *   - non-rhoticity (drop coda /ɹ/, lengthen the preceding vowel)
 *   - NURSE split: stressed /ɝ/ → /ɜː/, unstressed → /ə/
 *   - SQUARE / NEAR / CURE diphthongs from /Vɹ/ pairs
 *   - FIRE / POWER from diphthong + /ɹ/
 *   - French -age borrowings: lengthen final stressed vowel + drop /d/
 *   - yod retention after word-initial /s/ (sue, suit, super, …)
 *
 * Words whose RP form genuinely can't be derived by rule (schedule,
 * tomato, herb, …) live in `src-data/en-gb/lexical.json`, not in this
 * source file.
 */

import { resolveJson } from "./utils";
import * as lexicalData from "../src-data/en-gb/lexical.json";

/**
 * Lexical exceptions — true shibboleths whose RP pronunciation diverges
 * from AmE in ways no general phonological rule predicts. Edit the JSON
 * to add or correct entries; keep this file rule-only.
 */
const RP_LEXICAL: Record<string, string> =
  resolveJson<Record<string, string>>(lexicalData);

/**
 * Pure rule-based AmE → RP transformation. Order matters: rhotic-vowel
 * pairs run first so the leftover /ɹ/-drop pass only sees "stranded"
 * coda /ɹ/ in unusual spellings.
 */
function applyRPRules(word: string, ipa: string): string {
  let out = ipa;

  // 1. Split rhotacized /ɝ/ by stress. AmE collapses NURSE (stressed)
  //    and rhotacized schwa (unstressed) into the same symbol; RP
  //    splits them into /ɜː/ and /ə/ respectively. A /ɝ/ counts as
  //    stressed when only consonants sit between it and the most
  //    recent stress mark — i.e. it's the first vowel of that syllable.
  out = out.replace(/([ˈˌ][^ˈˌaeiouæɑɒəɛɪʌʊɔ]*)ɝ/g, "$1ɜː");
  out = out.replace(/ɝ/g, "ə"); // any remaining /ɝ/ is unstressed

  // 2. SQUARE/NEAR/CURE diphthongs replace V+ɹ in coda. The lookahead
  //    ensures we don't touch onset /ɹ/ (e.g. "barrel" /bæɹəl/ stays).
  //    FIRE / POWER (diphthong + ɹ) must run before bare ɑɹ / aʊɹ.
  out = out
    .replace(/aɪɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "aɪə")
    .replace(/aʊɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "aʊə")
    .replace(/ɑɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɑː")
    .replace(/ɔɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɔː")
    .replace(/ɛɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɛə")
    .replace(/ɪɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɪə")
    .replace(/ʊɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ʊə");

  // 3. Drop any remaining /ɹ/ in coda position (before a consonant or
  //    word boundary). Onset /ɹ/ — followed by a vowel — is preserved.
  out = out.replace(/ɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "");

  // 4. Tidy stray /əː/ artifacts → /ɜː/.
  out = out.replace(/əː/g, "ɜː");

  // 5. French -age borrowings. AmE keeps the stressed back-vowel + ʒ
  //    pattern (garage /ɡɝˈɑʒ/, sabotage /ˈsæbəˌtɑʒ/, espionage
  //    /ˈɛspiənɑdʒ/). RP lengthens that vowel to /ɑː/ and drops any
  //    affricate /d/. The IPA-side filter — final vowel must be one
  //    of [ɑ ɒ æ] — keeps native English -age untouched (marriage
  //    /ɪdʒ/, package /ədʒ/). Spelling check `[a-z]{2,}age$` excludes
  //    monosyllables like rage / cage / sage.
  if (/[a-z]{2,}age$/.test(word)) {
    out = out.replace(/[ɑɒæ](d?)ʒ$/, "ɑːʒ");
  }

  // 6. Yod retention after word-initial /s/. AmE drops historical /j/
  //    in sue / suit / super; RP keeps it. The lookbehind via spelling
  //    (`^su` followed by another letter) plus the IPA negative
  //    lookahead `(?!ʃ)` — to skip 'sushi' and similar — gives a tight
  //    rule without an exception list. AmE base must start with /s/
  //    directly followed by /u/, otherwise nothing fires.
  if (/^su[a-z]/i.test(word)) {
    out = out.replace(/^(ˈ?)su(?!ʃ)/, "$1sjuː");
  }

  return out;
}

/**
 * Convert American-English IPA to RP IPA for the given word. Looks up
 * lexical shibboleths first; falls back to rule-based transformation.
 */
export function transformAmericanToRP(word: string, ipaUS: string): string {
  const lower = word.toLowerCase();
  const lex = RP_LEXICAL[lower];
  if (lex) return lex;

  return applyRPRules(lower, ipaUS);
}
