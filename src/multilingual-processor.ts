import { chineseG2P } from "./zh-g2p";

// === JAPANESE ROMANIZATION ===
const JAPANESE_TO_PHONEME: { [key: string]: string } = {
  // Basic syllables using IPA - Vowels are kept pure, not diphthongized
  ka: "ka",
  ki: "ki",
  ku: "kɯ", // More accurately the unrounded back vowel
  ke: "ke",
  ko: "ko",
  ga: "ɡa",
  gi: "ɡi",
  gu: "ɡɯ",
  ge: "ɡe",
  go: "ɡo",
  sa: "sa",
  shi: "ʃi",
  su: "sɯ",
  se: "se",
  so: "so",
  za: "za",
  ji: "dʑi", // More accurate voiced alveolo-palatal affricate
  zu: "zɯ",
  ze: "ze",
  zo: "zo",
  ta: "ta",
  chi: "tɕi", // More accurate voiceless alveolo-palatal affricate
  tsu: "tsɯ",
  te: "te",
  to: "to",
  da: "da",
  de: "de",
  do: "do",
  na: "na",
  ni: "ni",
  nu: "nɯ",
  ne: "nɛ",
  no: "no",
  ha: "ha",
  hi: "çi", // Palatal fricative before 'i'
  fu: "ɸɯ", // Bilabial fricative
  he: "hɛ",
  ho: "ho",
  ba: "ba",
  bi: "bi",
  bu: "bɯ",
  be: "be",
  bo: "bo",
  pa: "pa",
  pi: "pi",
  pu: "pɯ",
  pe: "pe",
  po: "po",
  ma: "ma",
  mi: "mi",
  mu: "mɯ",
  me: "mɛ",
  mo: "mo",
  ya: "ja",
  yu: "jɯ",
  yo: "jo",
  ra: "ɾa",
  ri: "ɾi",
  ru: "ɾɯ",
  wa: "wa",
  wo: "o", // Particle 'wo' is pronounced 'o'
  n: "n",   // Syllabic n, can also be ŋ or m depending on context
  // Special combinations
  kya: "kja",
  kyu: "kjɯ",
  kyo: "kjo",
  gya: "ɡja",
  gyu: "ɡjɯ",
  gyo: "ɡjo",
  sha: "ʃa",
  shu: "ʃɯ",
  sho: "ʃo",
  ja: "dʑa",
  ju: "dʑɯ",
  jo: "dʑo",
  cha: "tɕa",
  chu: "tɕɯ",
  cho: "tɕo",
  nya: "ɲa",
  nyu: "ɲɯ",
  nyo: "ɲo",
  hya: "ça",
  hyu: "çɯ",
  hyo: "ço",
  ryu: "ɾjɯ",
};

// === KOREAN ROMANIZATION ===
// A more structured approach for Korean G2P based on Jamo (consonant/vowel parts)
const KOREAN_CONSONANTS: { [key: string]: string } = {
  // Initials (初聲)
  'g': 'k', 'kk': 'k͈', 'k': 'kʰ',
  'n': 'n',
  'd': 't', 'tt': 't͈', 't': 'tʰ',
  'r': 'ɾ', 'l': 'l', // r/l are context-dependent
  'm': 'm',
  'b': 'p', 'pp': 'p͈', 'p': 'pʰ',
  's': 's', 'ss': 's͈',
  'j': 'tɕ', 'jj': 'tɕ͈', 'ch': 'tɕʰ',
  'h': 'h',
  'ng': 'ŋ', // Usually a final, but can be initial in 'eung'
  '': 'ʔ',  // Represents the silent initial 'ㅇ'
};

const KOREAN_VOWELS: { [key: string]: string } = {
  // Medials (中聲)
  'a': 'a', 'ae': 'ɛ', 'ya': 'ja', 'yae': 'jɛ',
  'eo': 'ʌ', 'e': 'e', 'yeo': 'jʌ', 'ye': 'je',
  'o': 'o', 'wa': 'wa', 'wae': 'wɛ', 'oe': 'we',
  'u': 'u', 'wo': 'wʌ', 'we': 'we', 'wi': 'wi',
  'eu': 'ɯ', 'ui': 'ɰi', // Note: ui is complex
  'i': 'i',
};

// Finals (終聲) - 7 representative sounds
const KOREAN_FINALS: { [key: string]: string } = {
    'g': 'k̚', 'k': 'k̚', 'kk': 'k̚',
    'n': 'n',
    'd': 't̚', 's': 't̚', 'ss': 't̚', 't': 't̚', 'j': 't̚', 'ch': 't̚',
    'l': 'l',
    'm': 'm',
    'b': 'p̚', 'p': 'p̚',
    'ng': 'ŋ',
};

// === OTHER LANGUAGES ===
const RUSSIAN_TO_PHONEME: { [key: string]: string } = {
  // Vowels (after anyascii) - a, e, i, o, u, y
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', 'y': 'ɨ',
  // Consonants
  'b': 'b', 'v': 'v', 'g': 'ɡ', 'd': 'd', 'zh': 'ʐ', 'z': 'z',
  'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
  'r': 'r', 's': 's', 't': 't', 'f': 'f', 'kh': 'x', 'ts': 'ts',
  'ch': 'tɕ', 'sh': 'ʂ', 'shch': 'ɕː',
  // Special characters
  '\'': 'ʲ', // Soft sign
  '"': '' // Hard sign is often unpronounced or causes a slight pause
};


// === LANGUAGE DETECTION ===
export function detectLanguage(text: string): string | null {
  if (CHINESE_CHARS.test(text)) return 'zh';
  if (JAPANESE_CHARS.test(text)) return 'ja';
  if (KOREAN_CHARS.test(text)) return 'ko';
  if (RUSSIAN_CHARS.test(text)) return 'ru';
  if (GERMAN_CHARS.test(text)) return 'de';
  if (ARABIC_CHARS.test(text)) return 'ar';
  if (THAI_CHARS.test(text)) return 'th';

  return null;
}

// === UNIFIED PROCESSING ===
export function processMultilingualText(
  text: string,
  lang?: string,
): string | null {
  const detectedLang = lang || detectLanguage(text);

  if (!detectedLang) {
    return null;
  }

  // Directly call the appropriate processor and return its result.
  // The individual processors are responsible for the entire G2P logic for their language.
  switch (detectedLang) {
    case 'zh':
      return chineseG2P.textToIPA(text);
    case 'ja':
      return processJapanese(text);
    case 'ko':
      return processKorean(text);
    case 'ru':
      return processRussian(text);
    default:
      return null;
  }
}

const JAPANESE_SYLLABLE_MAP: { [key: string]: string } = {
  // Basic syllables
  'a': 'a', 'i': 'i', 'u': 'ɯ', 'e': 'e', 'o': 'o',
  'ka': 'ka', 'ki': 'ki', 'ku': 'kɯ', 'ke': 'ke', 'ko': 'ko',
  'ga': 'ɡa', 'gi': 'ɡi', 'gu': 'ɡɯ', 'ge': 'ɡe', 'go': 'ɡo',
  'sa': 'sa', 'shi': 'ʃi', 'su': 'sɯ', 'se': 'se', 'so': 'so',
  'za': 'za', 'ji': 'dʑi', 'zu': 'zɯ', 'ze': 'ze', 'zo': 'zo',
  'ta': 'ta', 'chi': 'tɕi', 'tsu': 'tsɯ', 'te': 'te', 'to': 'to',
  'da': 'da', 'de': 'de', 'do': 'do', 'na': 'na', 'ni': 'ni',
  'nu': 'nɯ', 'ne': 'nɛ', 'no': 'no', 'ha': 'ha', 'hi': 'çi',
  'fu': 'ɸɯ', 'he': 'hɛ', 'ho': 'ho', 'ba': 'ba', 'bi': 'bi',
  'bu': 'bɯ', 'be': 'be', 'bo': 'bo', 'pa': 'pa', 'pi': 'pi',
  'pu': 'pɯ', 'pe': 'pe', 'po': 'po', 'ma': 'ma', 'mi': 'mi',
  'mu': 'mɯ', 'me': 'mɛ', 'mo': 'mo', 'ya': 'ja', 'yu': 'jɯ',
  'yo': 'jo', 'ra': 'ɾa', 'ri': 'ɾi', 'ru': 'ɾɯ', 'wa': 'wa',
  'wo': 'o', 'n': 'n', 'kya': 'kja', 'kyu': 'kjɯ', 'kyo': 'kjo',
  'gya': 'ɡja', 'gyu': 'ɡjɯ', 'gyo': 'ɡjo', 'sha': 'ʃa', 'shu': 'ʃɯ',
  'sho': 'ʃo', 'ja': 'dʑa', 'ju': 'dʑɯ', 'jo': 'dʑo', 'cha': 'tɕa',
  'chu': 'tɕɯ', 'cho': 'tɕo', 'nya': 'ɲa', 'nyu': 'ɲɯ', 'nyo': 'ɲo',
  'hya': 'ça', 'hyu': 'çɯ', 'hyo': 'ço', 'ryu': 'ɾjɯ'
};

function processJapanese(text: string): string {
  text = text.toLowerCase();

  // Particle Rules
  if (text.endsWith('ha')) text = text.slice(0, -2) + 'wa';
  if (text.endsWith('he')) text = text.slice(0, -2) + 'e';
  if (text.endsWith('wo')) text = text.slice(0, -2) + 'o';
  
  // Sokuon (geminated consonants), excluding 'n'
  text = text.replace(/([bcdfghjklmpqrstvwxyz])\1/g, "っ$1");

  // Moraic nasal 'n' (撥音 ん) before a consonant
  text = text.replace(/n(?=[bcdfghjklmpqrstvwxyz])/g, "ん");

  // Long vowels
  for (const [key, value] of Object.entries(JAPANESE_LONG_VOWEL_RULES)) {
    text = text.replace(new RegExp(key, 'g'), value);
  }

  // Syllable mapping using the single unified map
  let result = "";
  let i = 0;
  while(i < text.length) {
    let matched = false;
    // Greedily match longest possible syllable
    for(let j = 3; j > 0; j--) {
        if (i + j <= text.length) {
            const sub = text.substring(i, i+j);
            if(JAPANESE_SYLLABLE_MAP[sub]) {
                result += JAPANESE_SYLLABLE_MAP[sub];
                i += j;
                matched = true;
                break;
            }
        }
    }
    if(!matched) {
        // Handle special characters like 'っ' and 'ん'
        if (text[i] === 'っ') {
            result += 'っ';
        } else if (text[i] === 'ん') {
            result += 'n';
        } else {
            result += text[i];
        }
        i++;
    }
  }

  // Final cleanup for sokuon representation
  return result.replace(/っ/g, '');
}

// --- KOREAN PROCESSING ENGINE ---

interface KoreanSyllable {
  initial: string;
  medial: string;
  final: string;
  original: string;
}

function decomposeRomajaSyllable(syllable: string): KoreanSyllable {
    syllable = syllable.toLowerCase();
    let initial = '';
    let medial = '';
    let final = '';

    const vowelKeys = Object.keys(KOREAN_VOWELS).sort((a, b) => b.length - a.length);
    for (const v of vowelKeys) {
        const index = syllable.indexOf(v);
        if (index !== -1) {
            medial = v;
            initial = syllable.substring(0, index);
            final = syllable.substring(index + v.length);
            break;
        }
    }
    
    if (!medial) { // If no vowel found, it's not a valid syllable
        return { initial: '', medial: syllable, final: '', original: syllable };
    }

    return { initial, medial, final, original: syllable };
}

function processKorean(text: string): string {
    const syllables = text.match(/[A-Z][a-z]*/g) || [];
    if (syllables.length === 0) return text;

    let decomposed: KoreanSyllable[] = syllables.map(decomposeRomajaSyllable);

    // Apply Liaison (연음) and other linking rules
    for (let i = 0; i < decomposed.length - 1; i++) {
        const current = decomposed[i];
        const next = decomposed[i+1];

        // Liaison: final consonant moves to next empty initial
        if (current.final && !next.initial) {
            next.initial = current.final;
            current.final = '';
        }
    }

    // Generate IPA from decomposed syllables
    let ipaString = "";
    for (let i = 0; i < decomposed.length; i++) {
        const syl = decomposed[i];
        let initialIpa = KOREAN_CONSONANTS[syl.initial] || syl.initial;
        const medialIpa = KOREAN_VOWELS[syl.medial] || syl.medial;
        const finalIpa = KOREAN_FINALS[syl.final] || '';

        // Intervocalic voicing for g, d, b, j
        if (i > 0 && ['k', 't', 'p', 'tɕ'].includes(initialIpa)) {
            const prev = decomposed[i-1];
            if (KOREAN_VOWELS[prev.medial] || ['n', 'm', 'ŋ', 'l'].includes(KOREAN_FINALS[prev.final])) {
                const voiced: {[key: string]: string} = {'k': 'ɡ', 't': 'd', 'p': 'b', 'tɕ': 'dʑ'};
                initialIpa = voiced[initialIpa];
            }
        }
        
        ipaString += initialIpa + medialIpa + finalIpa;
    }

    return ipaString;
}

function processRussian(text: string): string {
  text = text.toLowerCase();
  let ipa = '';
  const softVowels = ['е', 'ё', 'и', 'ю', 'я'];
  const anyasciiSoftVowels = ['e', 'yo', 'i', 'yu', 'ya'];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];
    
    let phoneme = RUSSIAN_TO_PHONEME[char] || char;

    // Palatalization rule for consonants
    if (RUSSIAN_TO_PHONEME[char] && !anyasciiSoftVowels.includes(char) && nextChar && anyasciiSoftVowels.includes(nextChar)) {
       if (!['j', 'ʃ', 'ʒ', 'ts'].includes(phoneme)) { // These don't get palatalized
          phoneme += 'ʲ';
       }
    }
    
    ipa += phoneme;
  }
  
  // We clean up some artifacts from the simple palatalization.
  return ipa.replace(/ʲj/g, 'j');
}

export function isMultilingualText(text: string): boolean {
  return detectLanguage(text) !== null;
}

const JAPANESE_LONG_VOWEL_RULES: { [key:string]: string } = {
  'aa': 'aː', 'ii': 'iː', 'uu': 'uː', 'ee': 'eː', 'oo': 'oː',
};

const JAPANESE_PARTICLE_RULES: {[key: string]: string} = {
  'ha': 'wa',
  'he': 'e',
  'wo': 'o'
};

const CHINESE_CHARS = /[\u4e00-\u9fa5]/;
const JAPANESE_CHARS = /[\u3040-\u30ff]/;
const KOREAN_CHARS = /[\uac00-\ud7af]/;
const RUSSIAN_CHARS = /[\u0400-\u04FF]/;
const GERMAN_CHARS = /[äöüÄÖÜß]/;
const ARABIC_CHARS = /[\u0600-\u06FF]/;
const THAI_CHARS = /[\u0e00-\u0e7f]/;
