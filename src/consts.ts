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
 * Chinese tone mapping from Unicode tone marks to arrow symbols
 */
export const CHINESE_TONE_TO_ARROW: Record<string, string> = {
  // Tone 1: High level (˥˥) → →
  "˥˥": "→",
  "˥": "→",
  
  // Tone 2: Rising (˧˥) → ↗
  "˧˥": "↗",
  
  // Tone 3: Falling-rising (˧˩˧) → ↓↗
  "˧˩˧": "↓↗",
  "˧˩": "↓",
  
  // Tone 4: Falling (˥˩) → ↘
  "˥˩": "↘",
  
  // Additional tone variations
  "˧": "→",      // Mid level
  "˩": "↓",      // Low level
  "˩˥": "↗",     // Low rising
  "˥˧": "↘",     // High falling
  "˧˧": "→",     // Mid level variant
};

/**
 * Reverse mappings for conversion utilities
 */
export const IPA_TO_ARPABET = Object.fromEntries(
  Object.entries(ARPABET_TO_IPA).map(([key, value]) => [value, key])
) as Record<string, string>;

export const IPA_TO_STRESS = Object.fromEntries(
  Object.entries(IPA_STRESS_MAP).map(([key, value]) => [value, key])
) as Record<string, string>;

/**
 * Pinyin initials (聲母) to Zhuyin mapping
 */
export const PINYIN_INITIALS_TO_ZHUYIN: Record<string, string> = {
  // Bilabials (雙唇音)
  'b': 'ㄅ',   // ㄅㄚ ba
  'p': 'ㄆ',   // ㄆㄚ pa  
  'm': 'ㄇ',   // ㄇㄚ ma
  'f': 'ㄈ',   // ㄈㄚ fa

  // Alveolars (齒齦音)
  'd': 'ㄉ',   // ㄉㄚ da
  't': 'ㄊ',   // ㄊㄚ ta
  'n': 'ㄋ',   // ㄋㄚ na
  'l': 'ㄌ',   // ㄌㄚ la

  // Velars (軟顎音)
  'g': 'ㄍ',   // ㄍㄚ ga
  'k': 'ㄎ',   // ㄎㄚ ka
  'h': 'ㄏ',   // ㄏㄚ ha

  // Palatals (硬顎音)
  'j': 'ㄐ',   // ㄐㄧ ji
  'q': 'ㄑ',   // ㄑㄧ qi
  'x': 'ㄒ',   // ㄒㄧ xi

  // Retroflexes (捲舌音)
  'zh': 'ㄓ',  // ㄓ zhi
  'ch': 'ㄔ',  // ㄔ chi
  'sh': 'ㄕ',  // ㄕ shi
  'r': 'ㄖ',   // ㄖ ri

  // Dentals (齒音)
  'z': 'ㄗ',   // ㄗ zi
  'c': 'ㄘ',   // ㄘ ci
  's': 'ㄙ',   // ㄙ si

  // Semi-vowels (半元音)
  'y': 'ㄧ',   // when used as initial
  'w': 'ㄨ',   // when used as initial
} as const;

/**
 * Pinyin finals (韻母) to Zhuyin mapping
 */
export const PINYIN_FINALS_TO_ZHUYIN: Record<string, string> = {
  // Simple vowels (單韻母)
  'a': 'ㄚ',    // 阿 a
  'o': 'ㄛ',    // 喔 o
  'e': 'ㄜ',    // 鵝 e
  'i': 'ㄧ',    // 衣 i
  'u': 'ㄨ',    // 烏 u
  'ü': 'ㄩ',    // 迂 ü
  'v': 'ㄩ',    // alternative for ü

  // Compound vowels (複韻母)
  'ai': 'ㄞ',   // 哀 ai
  'ei': 'ㄟ',   // 欸 ei
  'ao': 'ㄠ',   // 熬 ao
  'ou': 'ㄡ',   // 歐 ou

  // Nasal finals (鼻韻母)
  'an': 'ㄢ',   // 安 an
  'en': 'ㄣ',   // 恩 en
  'ang': 'ㄤ',  // 昂 ang
  'eng': 'ㄥ',  // 鞥 eng
  'ong': 'ㄨㄥ', // 翁 ong (實際是 u + eng)
  'er': 'ㄦ',   // 兒 er

  // i-group finals (i組韻母)
  'ia': 'ㄧㄚ',  // 呀 ia
  'ie': 'ㄧㄝ',  // 耶 ie
  'iao': 'ㄧㄠ', // 腰 iao
  'iu': 'ㄧㄡ',  // 憂 iu (same as iou)
  'iou': 'ㄧㄡ', // 憂 iou
  'ian': 'ㄧㄢ', // 煙 ian
  'in': 'ㄧㄣ',  // 因 in
  'iang': 'ㄧㄤ', // 央 iang
  'ing': 'ㄧㄥ', // 英 ing
  'iong': 'ㄧㄨㄥ', // 雍 iong

  // u-group finals (u組韻母)
  'ua': 'ㄨㄚ',  // 蛙 ua
  'uo': 'ㄨㄛ',  // 窩 uo
  'uai': 'ㄨㄞ', // 歪 uai
  'ui': 'ㄨㄟ',  // 威 ui (same as uei)
  'uei': 'ㄨㄟ', // 威 uei
  'uan': 'ㄨㄢ', // 彎 uan
  'un': 'ㄨㄣ',  // 溫 un (same as uen)
  'uen': 'ㄨㄣ', // 溫 uen
  'uang': 'ㄨㄤ', // 汪 uang
  'ueng': 'ㄨㄥ', // 翁 ueng (rare)

  // ü-group finals (ü組韻母)
  'üe': 'ㄩㄝ',  // 約 üe
  've': 'ㄩㄝ',  // alternative for üe
  'üan': 'ㄩㄢ', // 冤 üan
  'van': 'ㄩㄢ', // alternative for üan
  'ün': 'ㄩㄣ',  // 暈 ün
  'vn': 'ㄩㄣ',  // alternative for ün

  // Special syllables for retroflex/dental initials
  'zhi': 'ㄓ',   // 知 zhi (no separate final)
  'chi': 'ㄔ',   // 吃 chi
  'shi': 'ㄕ',   // 是 shi
  'ri': 'ㄖ',    // 日 ri
  'zi': 'ㄗ',    // 字 zi
  'ci': 'ㄘ',    // 次 ci
  'si': 'ㄙ',    // 思 si

  // Complete syllables starting with y/w (no separate initial)
  'yin': 'ㄧㄣ',  // 音 yin (equivalent to 'in')
  'yang': 'ㄧㄤ', // 央 yang (equivalent to 'iang')
  'yao': 'ㄧㄠ',  // 腰 yao (equivalent to 'iao')
  'ye': 'ㄧㄝ',   // 耶 ye (equivalent to 'ie')
  'yi': 'ㄧ',    // 衣 yi (equivalent to 'i')
  'yo': 'ㄧㄛ',   // 喲 yo
  'you': 'ㄧㄡ',  // 優 you (equivalent to 'iu')
  'yu': 'ㄩ',    // 魚 yu (equivalent to 'ü')
  'yue': 'ㄩㄝ',  // 月 yue (equivalent to 'üe')
  'yun': 'ㄩㄣ',  // 雲 yun (equivalent to 'ün')
  'yuan': 'ㄩㄢ', // 元 yuan (equivalent to 'üan')
  
  'wa': 'ㄨㄚ',   // 蛙 wa (equivalent to 'ua')
  'wai': 'ㄨㄞ',  // 歪 wai (equivalent to 'uai')
  'wan': 'ㄨㄢ',  // 彎 wan (equivalent to 'uan')
  'wang': 'ㄨㄤ', // 汪 wang (equivalent to 'uang')
  'wei': 'ㄨㄟ',  // 威 wei (equivalent to 'ui')
  'wen': 'ㄨㄣ',  // 文 wen (equivalent to 'un')
  'weng': 'ㄨㄥ', // 翁 weng (equivalent to 'ung')
  'wo': 'ㄨㄛ',   // 我 wo (equivalent to 'uo')
  'wu': 'ㄨ'     // 無 wu (equivalent to 'u')
} as const;
