/**
 * Utility functions for phoneme format conversion
 */

import { 
  IPA_TO_ARPABET, 
  IPA_TO_STRESS, 
  ARPABET_TO_IPA, 
  IPA_STRESS_MAP, 
  CHINESE_TONE_TO_ARROW,
  PINYIN_INITIALS_TO_ZHUYIN,
  PINYIN_FINALS_TO_ZHUYIN
} from "./consts";

/**
 * Convert IPA phonetic notation to ARPABET format
 * @param ipa - IPA phonetic string
 * @returns ARPABET formatted string
 */
export function ipaToArpabet(ipa: string): string {
  if (!ipa || typeof ipa !== 'string' || !ipa.trim()) {
    return "";
  }
  
  const result: string[] = [];
  let i = 0;
  
  while (i < ipa.length) {
    const char = ipa[i];
    
    // Handle stress markers
    if (IPA_TO_STRESS[char]) {
      const stress = IPA_TO_STRESS[char];
      // Apply stress to the next phoneme
      i++;
      const nextPhoneme = getNextPhoneme(ipa, i);
      if (nextPhoneme) {
        result.push(nextPhoneme.arpabet + stress);
        i += nextPhoneme.length;
      }
      continue;
    }
    
    // Try two-character IPA symbols first
    const twoChar = ipa.substring(i, i + 2);
    if (IPA_TO_ARPABET[twoChar]) {
      result.push(IPA_TO_ARPABET[twoChar]);
      i += 2;
      continue;
    }
    
    // Try single character
    if (IPA_TO_ARPABET[char]) {
      result.push(IPA_TO_ARPABET[char]);
      i++;
      continue;
    }
    
    // Handle unknown characters
    if (char === ' ') {
      if (result.length > 0 && result[result.length - 1] !== ' ') {
        result.push(' ');
      }
    } else if (char.trim()) {
      // Unknown non-space character - push as undefined
      result.push('undefined');
    }
    i++;
  }
  
  return result.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Convert ARPABET phonetic notation to IPA format
 * @param arpabet - ARPABET phonetic string  
 * @returns IPA formatted string
 */
export function arpabetToIpa(arpabet: string): string {
  if (!arpabet || typeof arpabet !== 'string' || !arpabet.trim()) {
    return "";
  }
  
  const phonemes = arpabet.split(/\s+/).filter(p => p.trim());
  const result: string[] = [];
  let primaryStressFound = false;
  let secondaryStressFound = false;
  
  // First pass: convert phonemes without stress markers
  for (const phoneme of phonemes) {
    const stressMatch = phoneme.match(/([012])$/);
    const stress = stressMatch?.[0] || "";
    const basePhoneme = phoneme.replace(/[012]$/, "");
    
    const ipaPhoneme = ARPABET_TO_IPA[basePhoneme];
    if (ipaPhoneme) {
      result.push(ipaPhoneme);
      
      // Track stress positions
      if (stress === "1") {
        primaryStressFound = true;
      } else if (stress === "2") {
        secondaryStressFound = true;
      }
    } else {
      // Preserve unknown phonemes as-is
      result.push(phoneme);
    }
  }
  
  // Add stress markers at the beginning if found
  let finalResult = result.join("");
  if (primaryStressFound) {
    finalResult = "ˈ" + finalResult;
  } else if (secondaryStressFound) {
    finalResult = "ˌ" + finalResult;
  }
  
  return finalResult;
}

/**
 * Helper function to extract the next phoneme from IPA string
 * @param ipa - IPA string
 * @param startIndex - Starting index
 * @returns Object with ARPABET equivalent and length
 */
function getNextPhoneme(ipa: string, startIndex: number): { arpabet: string; length: number } | null {
  // Try two-character symbols first
  const twoChar = ipa.substring(startIndex, startIndex + 2);
  if (IPA_TO_ARPABET[twoChar]) {
    return { arpabet: IPA_TO_ARPABET[twoChar], length: 2 };
  }
  
  // Try single character
  const oneChar = ipa[startIndex];
  if (IPA_TO_ARPABET[oneChar]) {
    return { arpabet: IPA_TO_ARPABET[oneChar], length: 1 };
  }
  
  return null;
}

/**
 * Convert Chinese IPA tone marks to arrow format
 * @param ipa - IPA string with Chinese tone marks
 * @returns IPA string with arrow tone symbols
 */
export function convertChineseTonesToArrows(ipa: string): string {
  if (!ipa || typeof ipa !== 'string') {
    return ipa;
  }
  
  let result = ipa;
  
  // Sort by length (longest first) to avoid partial replacements
  const toneKeys = Object.keys(CHINESE_TONE_TO_ARROW).sort((a, b) => b.length - a.length);
  
  for (const tonePattern of toneKeys) {
    const arrowSymbol = CHINESE_TONE_TO_ARROW[tonePattern];
    result = result.replace(new RegExp(tonePattern, 'g'), arrowSymbol);
  }
  
  return result;
}

/**
 * Convert pinyin syllable to Zhuyin (Bopomofo) notation
 * @param pinyin - Pinyin syllable with tone number (e.g., "zhong1", "wen2")
 * @returns Zhuyin notation with tone number (e.g., "ㄓㄨㄥ1", "ㄨㄣ2")
 */
export function pinyinToZhuyin(pinyin: string): string {
  if (!pinyin?.trim()) {
    return pinyin;
  }

  // Extract tone number from the end
  const toneMatch = pinyin.match(/([1-5])$/);
  const toneNumber = toneMatch ? toneMatch[1] : '';
  const syllableWithoutTone = pinyin.replace(/[1-5]$/, '');

  // Handle special complete syllables first
  if (PINYIN_FINALS_TO_ZHUYIN[syllableWithoutTone]) {
    return PINYIN_FINALS_TO_ZHUYIN[syllableWithoutTone] + toneNumber;
  }

  // Decompose pinyin into initial and final
  const { initial, final } = decomposePinyinSyllable(syllableWithoutTone);
  
  let zhuyin = '';

  // Convert initial
  if (initial && PINYIN_INITIALS_TO_ZHUYIN[initial]) {
    zhuyin += PINYIN_INITIALS_TO_ZHUYIN[initial];
  }

  // Convert final
  if (final && PINYIN_FINALS_TO_ZHUYIN[final]) {
    zhuyin += PINYIN_FINALS_TO_ZHUYIN[final];
  } else if (final) {
    // If the final is not recognized, the syllable is invalid. Revert to the original.
    zhuyin = syllableWithoutTone;
    console.warn(`Could not find a Zhuyin mapping for pinyin final: ${final}`);
  } else if (!final && initial) {
    // If there is only an initial but it's not a special syllable, it's invalid.
    zhuyin = syllableWithoutTone;
  }

  // Append the tone number. Default to 5 (neutral tone) if not present.
  return zhuyin + (toneNumber || '5');
}

/**
 * Decompose pinyin syllable into initial and final parts
 * @param syllable - Pinyin syllable without tone
 * @returns Object with initial and final parts
 */
function decomposePinyinSyllable(syllable: string): { initial: string; final: string } {
  // Handle empty or invalid input
  if (!syllable?.trim()) {
    return { initial: '', final: '' };
  }

  // Special cases for retroflex sounds
  if (syllable.startsWith('zh')) {
    return { initial: 'zh', final: syllable.slice(2) };
  }
  if (syllable.startsWith('ch')) {
    return { initial: 'ch', final: syllable.slice(2) };
  }
  if (syllable.startsWith('sh')) {
    return { initial: 'sh', final: syllable.slice(2) };
  }

  // Handle other two-letter initials (none in standard pinyin)
  
  // Single letter initials
  const possibleInitials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];
  
  for (const initial of possibleInitials) {
    if (syllable.startsWith(initial)) {
      return { initial, final: syllable.slice(initial.length) };
    }
  }

  // No initial found, entire syllable is final
  return { initial: '', final: syllable };
}

/**
 * Convert Chinese IPA arrow format back to Unicode tone marks
 * @param ipa - IPA string with arrow tone symbols
 * @returns IPA string with Unicode tone marks
 */
export function convertChineseTonesToUnicode(ipa: string): string {
  if (!ipa || typeof ipa !== 'string') {
    return ipa;
  }
  
  let result = ipa;
  
  // Reverse mapping from arrows to Unicode
  const arrowToUnicode: Record<string, string> = {};
  for (const [unicode, arrow] of Object.entries(CHINESE_TONE_TO_ARROW)) {
    arrowToUnicode[arrow] = unicode;
  }
  
  // Sort by length (longest first) to handle ↓↗ before ↓
  const arrowKeys = Object.keys(arrowToUnicode).sort((a, b) => b.length - a.length);
  
  for (const arrowSymbol of arrowKeys) {
    const unicodePattern = arrowToUnicode[arrowSymbol];
    result = result.replace(new RegExp(arrowSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), unicodePattern);
  }
  
  return result;
}

export function resolveJson<T>(data: {default: T} | T): T {
  // @ts-ignore
  return (typeof data.default === 'object' ? data.default : data) as T;
}
