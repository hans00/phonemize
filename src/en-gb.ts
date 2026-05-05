/**
 * RP (Received Pronunciation) post-processing for English G2P output.
 *
 * The base English G2P returns General American IPA. This module turns
 * that output into a reasonable RP/Southern Standard British rendering
 * via rule-based transformation — no separate dictionary file is loaded
 * (which would roughly double the package size).
 *
 * Coverage is intentionally conservative. We handle the high-impact
 * RP↔GA differences (non-rhoticity, NURSE, rhotic-vowel diphthongs,
 * yod retention, French `-age`) and leave subtler choices (LOT
 * rounding to /ɒ/, FOOT-STRUT split, smoothing) to consumers who need
 * them.
 */

/**
 * Words whose RP form is irregular enough that a rule-based pass alone
 * gets it wrong. Keys are lowercase. Entries should be the full RP IPA
 * (post-transform output is replaced wholesale, not patched).
 */
const RP_WORD_OVERRIDES: Record<string, string> = {
  // French -age borrowings keep /ʒ/ in RP (vs AmE /dʒ/)
  garage: "ˈɡæɹɑːʒ",
  massage: "ˈmæsɑːʒ",
  barrage: "ˈbæɹɑːʒ",
  camouflage: "ˈkæməflɑːʒ",
  sabotage: "ˈsæbətɑːʒ",
  espionage: "ˈɛspiənɑːʒ",
  reportage: "ɹɪˈpɔːtɑːʒ",

  // Yod retention after /s/ where AmE drops it
  sue: "sjuː",
  suit: "sjuːt",
  super: "ˈsjuːpə",
  superb: "sjuːˈpɜːb",

  // -ormation series: AmE reduces the /ɔː/ to schwa, RP preserves it
  information: "ˌɪnfəˈmeɪʃən",
  transformation: "ˌtɹænsfəˈmeɪʃən",
  reformation: "ˌɹɛfəˈmeɪʃən",
  confirmation: "ˌkɒnfəˈmeɪʃən",

  // Shibboleth pronunciations
  schedule: "ˈʃɛdjuːl",
  tomato: "təˈmɑːtəʊ",
  vase: "vɑːz",
  herb: "hɜːb",
  zebra: "ˈzɛbɹə",
  lieutenant: "lɛfˈtɛnənt",
};

/**
 * Pure rule-based AmE → RP transformation. Order matters: rhotic-vowel
 * pairs run first so the leftover /ɹ/-drop pass only sees "stranded"
 * coda /ɹ/ in unusual spellings.
 */
function applyRPRules(ipa: string): string {
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
  out = out
    .replace(/aɪɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "aɪə") // FIRE — match before ɑɹ
    .replace(/aʊɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "aʊə") // POWER
    .replace(/ɑɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɑː") // START
    .replace(/ɔɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɔː") // NORTH/FORCE
    .replace(/ɛɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɛə") // SQUARE
    .replace(/ɪɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ɪə") // NEAR
    .replace(/ʊɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "ʊə"); // CURE

  // 3. Drop any remaining /ɹ/ in coda position (before a consonant or
  //    word boundary). Onset /ɹ/ — followed by a vowel — is preserved.
  out = out.replace(/ɹ(?![aeiouæɑɒəɛɪʌʊɔ])/g, "");

  // 4. Tidy stray /əː/ artifacts → /ɜː/.
  out = out.replace(/əː/g, "ɜː");

  return out;
}

/**
 * Convert American-English IPA to RP IPA for the given word. Handles
 * word-level overrides first, then rule-based transformation.
 */
export function transformAmericanToRP(word: string, ipaUS: string): string {
  const lower = word.toLowerCase();
  const override = RP_WORD_OVERRIDES[lower];
  if (override) return override;

  return applyRPRules(ipaUS);
}
