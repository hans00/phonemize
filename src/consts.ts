/**
 * Phonemization constants and mappings
 */

export const PUNCTUATION = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

/**
 * Core ARPABET to IPA mapping
 */
export const ARPABET_TO_IPA: Record<string, string> = {
  // Vowels - monophthongs
  AA: "ɑ",    // father
  AE: "æ",    // cat  
  AH: "ʌ",    // cut
  AO: "ɔ",    // thought
  AX: "ə",    // about (schwa)
  AXR: "ɚ",   // letter (r-colored schwa)
  EH: "ɛ",    // bed
  ER: "ɝ",    // bird (r-colored)
  IH: "ɪ",    // bit
  IY: "i",    // beat
  UH: "ʊ",    // book
  UW: "u",    // boot
  
  // Vowels - diphthongs  
  AW: "aʊ",   // cow
  AY: "aɪ",   // bite
  EY: "eɪ",   // bait
  OW: "oʊ",   // boat
  OY: "ɔɪ",   // boy
  
  // Consonants - stops
  B: "b",     // bee
  D: "d",     // dee
  G: "ɡ",     // green
  K: "k",     // key
  P: "p",     // pee
  T: "t",     // tea
  
  // Consonants - fricatives
  DH: "ð",    // thee
  F: "f",     // fee
  HH: "h",    // he
  S: "s",     // see
  SH: "ʃ",    // she
  TH: "θ",    // three
  V: "v",     // vee
  Z: "z",     // zee
  ZH: "ʒ",    // seizure
  
  // Consonants - affricates
  CH: "tʃ",   // cheese
  JH: "dʒ",   // jeez
  
  // Consonants - nasals
  M: "m",     // me
  N: "n",     // knee
  NG: "ŋ",    // ping
  
  // Consonants - liquids
  EL: "ɫ",    // dark l
  L: "l",     // lee
  R: "ɹ",     // red
  
  // Consonants - glides
  W: "w",     // we
  Y: "j",     // yes

  // Chinese-specific mappings for multilingual support
  TS: "ts",   // Chinese 'c' initial
  UO: "uo",   // Chinese compound final
  YE: "je",   // Chinese 'ie' 
  UAH: "ua",  // Chinese compound vowel
  YEN: "jɛn", // Chinese 'ian'
  YAW: "jaʊ", // Chinese 'iao'
  YOW: "joʊ", // Chinese 'iou'
  WAY: "waɪ", // Chinese 'uai'
  UAHN: "uɑn", // Chinese 'uan'
  UE: "yɛ",   // Chinese 'ü'
  UY: "ui",   // Chinese 'ui'
  UA: "ua",   // Chinese 'ua'
  EN: "ən",   // Chinese 'en'
  IN: "in",   // Chinese 'in' 
  UN: "un",   // Chinese 'un'

  // Additional language-specific sounds
  OE: "ø",    // German 'ö'
  AR: "ɑr",   // Arabic 'ar'
  HL: "ħl",   // Arabic pharyngeal
  AB: "ɑb",   // Arabic 'ab'
  SAW: "ɔ",   // Thai 'aw' (avoiding conflict with AW)
  KH: "kʰ",   // Thai aspirated k
  PH: "pʰ",   // Thai aspirated p  
  NY: "ɲ",    // Thai/other 'ny'
} as const;

/**
 * Stress level mappings
 */
export const IPA_STRESS_MAP: Record<string, string> = {
  "0": "",    // No stress
  "1": "ˈ",   // Primary stress
  "2": "ˌ",   // Secondary stress
} as const;

/**
 * Reverse mappings for conversion utilities
 */
export const IPA_TO_ARPABET = Object.fromEntries(
  Object.entries(ARPABET_TO_IPA).map(([key, value]) => [value, key])
) as Record<string, string>;

export const IPA_TO_STRESS = Object.fromEntries(
  Object.entries(IPA_STRESS_MAP).map(([key, value]) => [value, key])
) as Record<string, string>;
