/**
 * Chinese Grapheme-to-Phoneme (G2P) conversion system
 * Converts Chinese text to International Phonetic Alphabet (IPA) notation
 */

import { pinyin, addDict } from 'pinyin-pro';
import dict from '../data/zh/dict.json';
import { pinyinToZhuyin } from './utils';

addDict(dict, 'phonemize-zh');

/**
 * Comprehensive pinyin to IPA phoneme mapping
 * Organized by phoneme type for better maintainability
 */
const PINYIN_TO_IPA: Readonly<Record<string, string>> = {
  // === INITIALS (聲母) ===
  // Stops
  'b': 'p',      // 不送氣清雙唇塞音
  'p': 'pʰ',     // 送氣清雙唇塞音  
  'd': 't',      // 不送氣清齒齦塞音
  't': 'tʰ',     // 送氣清齒齦塞音
  'g': 'k',      // 不送氣清軟顎塞音
  'k': 'kʰ',     // 送氣清軟顎塞音
  
  // Affricates  
  'j': 'tɕ',     // 不送氣清齦顎塞擦音
  'q': 'tɕʰ',    // 送氣清齦顎塞擦音
  'zh': 'ʈʂ',    // 不送氣清捲舌塞擦音
  'ch': 'ʈʂʰ',   // 送氣清捲舌塞擦音
  'z': 'ts',     // 不送氣清齒塞擦音
  'c': 'tsʰ',    // 送氣清齒塞擦音
  
  // Fricatives
  'f': 'f',      // 清唇齒擦音
  'x': 'ɕ',      // 清齦顎擦音
  'sh': 'ʂ',     // 清捲舌擦音
  'r': 'ʐ',      // 濁捲舌擦音
  's': 's',      // 清齒擦音
  'h': 'x',      // 清軟顎擦音
  
  // Nasals & Liquids
  'm': 'm',      // 雙唇鼻音
  'n': 'n',      // 齒齦鼻音
  'l': 'l',      // 齒齦邊音
  
  // Glides
  'w': 'w',      // 圓唇軟顎近音
  'y': 'j',      // 硬顎近音
  
  // === FINALS (韻母) ===
  // Simple vowels
  'a': 'a',      // 低央不圓唇元音
  'o': 'o',      // 中後圓唇元音
  'e': 'ə',      // 中央元音（schwa）
  'i': 'i',      // 高前不圓唇元音
  'u': 'u',      // 高後圓唇元音
  'ü': 'y',      // 高前圓唇元音
  'v': 'y',      // ü的替代拼寫
  
  // Diphthongs
  'ai': 'aɪ',    // 央低到高前雙元音
  'ei': 'eɪ',    // 中前到高前雙元音
  'ao': 'ɑʊ',    // 央低到高後雙元音
  'ou': 'oʊ',    // 中後到高後雙元音
  
  // Nasal finals
  'an': 'an',    // 央低元音+齒齦鼻音
  'en': 'ən',    // 中央元音+齒齦鼻音
  'ang': 'ɑŋ',   // 央低元音+軟顎鼻音
  'eng': 'əŋ',   // 中央元音+軟顎鼻音
  'ong': 'ʊŋ',   // 高後近圓唇元音+軟顎鼻音
  'er': 'ɚ',     // 中央r化元音
  
  // Complex finals with medials
  'ia': 'ia',    // i+a
  'ie': 'iɛ',    // i+e（實際音值接近ɛ）
  'iao': 'iɑʊ',  // i+ao
  'iu': 'ioʊ',   // i+ou（簡化拼寫）
  'iou': 'ioʊ',  // i+ou（完整拼寫）
  'ian': 'iɛn',  // i+an（實際音值）
  'in': 'in',    // i+n
  'iang': 'iɑŋ', // i+ang
  'ing': 'iŋ',   // i+ng
  'iong': 'iʊŋ', // i+ong
  
  'ua': 'ua',    // u+a
  'uo': 'uɔ',    // u+o
  'uai': 'uaɪ',  // u+ai
  'ui': 'ueɪ',   // u+ei（簡化拼寫）
  'uei': 'ueɪ',  // u+ei（完整拼寫）
  'uan': 'uan',  // u+an
  'un': 'uən',   // u+en（簡化拼寫）
  'uen': 'uən',  // u+en（完整拼寫）
  'uang': 'uɑŋ', // u+ang
  'ueng': 'uəŋ', // u+eng
  
  'üe': 'yɛ',    // ü+e
  've': 'yɛ',    // üe的替代拼寫
  'üan': 'yɛn',  // ü+an
  'van': 'yɛn',  // üan的替代拼寫
  'ün': 'yn',    // ü+n
  'vn': 'yn',    // ün的替代拼寫
  
  // === SPECIAL SYLLABLES (特殊音節) ===
  // Retroflex vowels
  'zhi': 'ʈʂɨ',  // zh+空韻
  'chi': 'ʈʂʰɨ', // ch+空韻
  'shi': 'ʂɨ',   // sh+空韻
  'ri': 'ʐɨ',    // r+空韻
  'zi': 'tsɨ',   // z+空韻
  'ci': 'tsʰɨ',  // c+空韻
  'si': 'sɨ',    // s+空韻
  
  // === COMMON COMPLETE SYLLABLES ===
  'zhong': 'ʈʂʊŋ', // 中
  'wen': 'wən',     // 文
  'hao': 'xɑʊ',     // 好
  'de': 'tə',       // 的
  'de0': 'tə',      // 的 (輕聲)
  'wo': 'wɔ',       // 我
  'ta': 'tʰa',      // 他/她/它
  'zhe': 'ʈʂə',     // 這
  'ge': 'kə',       // 個
  'le': 'lə',       // 了
  'yi': 'i',        // 一/抑
  'san': 'san',     // 三
  'wu': 'wu',       // 五
  'liu': 'lioʊ',    // 六
  'qi': 'tɕi',      // 七
  'ba': 'pa',       // 八
  'jiu': 'tɕioʊ',   // 九
} as const;

/**
 * Chinese tone marks in IPA notation
 */
const TONE_MARKS: Readonly<Record<number, string>> = {
  1: '˥˥',    // 第一聲：高平調 (55)
  2: '˧˥',    // 第二聲：中升調 (35)
  3: '˧˩˧',   // 第三聲：低降升調 (214)
  4: '˥˩',    // 第四聲：高降調 (51)
  5: '˧',     // 輕聲：中平調 (3)
  0: '',      // 無聲調標記
} as const;

// Cached values for performance
const INITIAL_PATTERNS = ['zh', 'ch', 'sh']; // Three-letter initials
const SINGLE_INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];

/**
 * Result interface for Chinese pinyin conversion
 */
export interface ChinesePinyinResult {
  /** Original pinyin with tone number */
  pinyin: string;
  /** Tone number (1-5, 0 for neutral) */
  tone: number;
  /** IPA representation with tone marks */
  ipa: string;
  /** Original Chinese character */
  word: string;
}

/**
 * Main Chinese G2P processor class
 */
export class ChineseG2P {
  /**
   * Convert Chinese text to IPA phonetic notation
   * @param text - Chinese text to convert
   * @returns Space-separated IPA string
   */
  public textToIPA(text: string): string {
    if (!text?.trim()) return '';
    
    const results = this.textToPinyinResults(text);
    return results.map(result => result.ipa).join(' ');
  }

  /**
   * Convert Chinese text to Zhuyin (Bopomofo) notation
   * @param text - Chinese text to convert
   * @returns Space-separated Zhuyin string with tone numbers
   */
  public textToZhuyin(text: string): string {
    if (!text?.trim()) return '';
    
    const results = this.textToPinyinResults(text);
    return results.map(result => {
      if (this.isChinese(result.word)) {
        // Convert Chinese characters to Zhuyin
        // result.pinyin already includes tone number, so use it directly
        return pinyinToZhuyin(result.pinyin);
      } else {
        // Keep non-Chinese characters as-is
        return result.word;
      }
    }).join(' ');
  }

  /**
   * Convert Chinese text to detailed pinyin analysis results
   * @param text - Chinese text to convert
   * @returns Array of detailed conversion results
   */
  public textToPinyinResults(text: string): ChinesePinyinResult[] {
    if (!text?.trim()) return [];
    
    const results: ChinesePinyinResult[] = [];
    
    try {
      // Use pinyin-pro for pinyin conversion with tone numbers
      const pinyinResults = pinyin(text, {
        toneType: 'num',
        type: 'array', 
        v: true, // Use 'v' for 'ü'
        nonZh: 'removed' // Remove non-Chinese characters from pinyin result
      });

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (this.isChinese(char)) {
          const pinyinResult = pinyinResults[Math.min(i, pinyinResults.length - 1)];
          const { syllable, tone } = this.parsePinyinWithTone(pinyinResult || char);
          const ipa = this.pinyinToIPA(syllable, tone);
          
          results.push({
            pinyin: pinyinResult || char,
            tone: tone,
            ipa: ipa,
            word: char
          });
        } else {
          // Non-Chinese characters preserved as-is
          results.push({
            pinyin: char,
            tone: 0,
            ipa: char,
            word: char
          });
        }
      }
    } catch (error) {
      // Fallback: return characters as-is if pinyin conversion fails
      console.warn('Chinese G2P conversion failed:', error);
      return Array.from(text).map(char => ({
        pinyin: char,
        tone: 0,
        ipa: char,
        word: char
      }));
    }
    
    return results;
  }

  /**
   * Convert pinyin syllable to IPA with tone
   * @param pinyin - Pinyin syllable (without tone)
   * @param tone - Tone number (1-5)
   * @returns IPA string with tone marks
   */
  private pinyinToIPA(pinyin: string, tone: number): string {
    // Direct mapping lookup (most efficient)
    const directMapping = PINYIN_TO_IPA[pinyin];
    if (directMapping) {
      return directMapping + TONE_MARKS[tone];
    }
    
    // Decompose and reconstruct
    const { initial, final } = this.decomposePinyin(pinyin);
    const initialIPA = PINYIN_TO_IPA[initial] || '';
    const finalIPA = PINYIN_TO_IPA[final] || final;
    
    return initialIPA + finalIPA + TONE_MARKS[tone];
  }

  /**
   * Decompose pinyin into initial and final components
   * @param pinyin - Complete pinyin syllable
   * @returns Object with initial and final parts
   */
  private decomposePinyin(pinyin: string): { initial: string; final: string } {
    // Check three-letter initials first (more specific)
    for (const initial of INITIAL_PATTERNS) {
      if (pinyin.startsWith(initial)) {
        return {
          initial: initial,
          final: pinyin.slice(initial.length)
        };
      }
    }
    
    // Check single-letter initials
    for (const initial of SINGLE_INITIALS) {
      if (pinyin.startsWith(initial)) {
        return {
          initial: initial,
          final: pinyin.slice(1)
        };
      }
    }
    
    // No initial found - treat entire string as final
    return {
      initial: '',
      final: pinyin
    };
  }

  /**
   * Parse pinyin string with tone number
   * @param pinyinWithTone - Pinyin with tone number suffix
   * @returns Object with syllable and tone
   */
  private parsePinyinWithTone(pinyinWithTone: string): { syllable: string; tone: number } {
    const match = pinyinWithTone.match(/^(.+?)([1-5]?)$/);
    if (match) {
      const syllable = match[1];
      const toneStr = match[2];
      const tone = toneStr ? parseInt(toneStr, 10) : 5; // Default to neutral tone
      return { syllable, tone };
    }
    
    // Fallback
    return { syllable: pinyinWithTone, tone: 5 };
  }

  /**
   * Check if a character is Chinese
   * @param char - Character to check
   * @returns True if character is Chinese
   */
  private isChinese(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9fff) ||     // CJK Unified Ideographs
           (code >= 0x3400 && code <= 0x4dbf) ||     // CJK Extension A
           (code >= 0x20000 && code <= 0x2a6df) ||   // CJK Extension B
           (code >= 0x2a700 && code <= 0x2b73f) ||   // CJK Extension C
           (code >= 0x2b740 && code <= 0x2b81f) ||   // CJK Extension D
           (code >= 0x2b820 && code <= 0x2ceaf) ||   // CJK Extension E
           (code >= 0x2ceb0 && code <= 0x2ebef);     // CJK Extension F
  }

  /**
   * Check if text contains Chinese characters
   * @param text - Text to check
   * @returns True if text contains Chinese characters
   */
  public isChineseText(text: string): boolean {
    return Array.from(text).some(char => this.isChinese(char));
  }
}

/**
 * Global Chinese G2P instance for convenient usage
 */
export const chineseG2P = new ChineseG2P(); 