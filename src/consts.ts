export const PUNCTUATION = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

export const ARPABET_TO_IPA = {
  AA: "ɑ",
  AE: "æ",
  AH: "ʌ",
  AO: "ɔ",
  AW: "aʊ",
  AY: "aɪ",
  AX: "ə",
  AXR: "ɚ",
  B: "b",
  CH: "tʃ",
  D: "d",
  DH: "ð",
  EL: "ɫ",
  EH: "ɛ",
  ER: "ɝ",
  EY: "eɪ",
  F: "f",
  G: "ɡ",
  HH: "h",
  IH: "ɪ",
  IY: "i",
  JH: "dʒ",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ŋ",
  OW: "oʊ",
  OY: "ɔɪ",
  P: "p",
  R: "ɹ",
  S: "s",
  SH: "ʃ",
  T: "t",
  TH: "θ",
  UH: "ʊ",
  UW: "u",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "ʒ",

  // Pinyin-specific phonemes
  UO: "uo", // For "guo" - Chinese "uo" sound
  YE: "je", // For "xie" - Chinese "ie" sound
  UAH: "ua", // For compound vowel sounds
  YEN: "jɛn", // For "jian" - Chinese "ian" sound
  YAW: "jaʊ", // For "xiao" - Chinese "iao" sound
  YOW: "joʊ", // For "jiu" - Chinese "iou" sound
  WAY: "waɪ", // For "uai" sound
  UAHN: "uɑn", // For "uan" sound
  UE: "yɛ", // For Chinese "ü" sound
  UY: "ui", // For "ui" sound
  UA: "ua", // For "ua" sound
  TS: "ts", // For "c" initial in pinyin
  EN: "ən", // For "en" final
  IN: "in", // For "in" final
  UN: "un", // For "un" final

  // Multilingual phonemes
  // German umlauts
  OE: "ø", // For German "ö" sound

  // Korean specific sounds
  // (Korean uses existing phonemes mostly)

  // Arabic sounds
  AR: "ɑr", // For Arabic "ar" sound
  HL: "ħl", // For Arabic pharyngeal sounds
  AB: "ɑb", // For Arabic "ab" sound

  // Thai sounds
  SAW: "ɔ", // Thai "aw" sound (using SAW to avoid conflict with AW)
  KH: "kʰ", // Thai aspirated k
  PH: "pʰ", // Thai aspirated p
  NY: "ɲ", // Thai "ny" sound (restored to standard)

  // Japanese long vowels (for romanization)
  // Using existing phonemes with length markers would be handled in processing
};

export const IPA_STRESS_MAP: Record<string, string> = {
  "0": "",
  "1": "ˈ",
  "2": "ˌ",
};

export const IPA_TO_ARPABET = Object.fromEntries(
  Object.entries(ARPABET_TO_IPA).map(([key, value]) => [value, key]),
);

export const IPA_TO_STRESS = Object.fromEntries(
  Object.entries(IPA_STRESS_MAP).map(([key, value]) => [value, key]),
);
