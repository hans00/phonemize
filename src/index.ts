/**
 * Phonemize Library - Main API
 * 
 * A comprehensive text-to-phoneme conversion library supporting:
 * - IPA (International Phonetic Alphabet) output
 * - ARPABET phonetic notation
 * - Multilingual text processing (Chinese, Japanese, Korean, Thai, Arabic, Russian)
 * - Rule-based G2P conversion with dictionary lookup
 * - Compound word decomposition
 * - Number and abbreviation expansion
 */

import EnglishG2P from "./en-g2p";
import { Tokenizer, TokenizerOptions, PhonemeToken } from "./tokenizer";
import { getG2PProcessor, useG2P } from "./g2p";

// Re-export core types and classes for public API
export type { TokenizerOptions, PhonemeToken };
export { Tokenizer, useG2P };

// Initialize default G2P processors, here only english G2P is required others are not default in use
useG2P(new EnglishG2P());

/**
 * Convert text to phonetic representation
 * 
 * @param text - Input text to convert
 * @param options - Configuration options with returnArray flag
 * @returns Array of phoneme tokens with metadata
 */
export function phonemize(
  text: string,
  options: TokenizerOptions & { returnArray: true },
): PhonemeToken[];

/**
 * Convert text to phonetic representation
 * 
 * @param text - Input text to convert
 * @param options - Configuration options
 * @returns Space-separated phoneme string
 */
export function phonemize(text: string, options?: TokenizerOptions): string;

/**
 * Convert text to phonetic representation (legacy array format)
 * 
 * @param text - Input text to convert
 * @param returnArray - If true, return array format
 * @returns Array of phoneme tokens
 */
export function phonemize(text: string, returnArray: true): PhonemeToken[];

/**
 * Main phonemize function implementation
 */
export function phonemize(
  text: string,
  options: true | (TokenizerOptions & { returnArray?: boolean }) = {},
): string | PhonemeToken[] {
  // Handle legacy boolean parameter
  if (options === true) {
    options = { returnArray: true };
  }

  const tokenizer = new Tokenizer(options);
  
  if (options.returnArray) {
    return tokenizer.tokenizeToTokens(text);
  }
  
  return tokenizer.tokenizeToString(text);
}

/**
 * Convert text to International Phonetic Alphabet (IPA) notation
 * 
 * @param text - Input text to convert
 * @param options - Configuration options (format will be overridden to 'ipa')
 * @returns IPA phonetic string
 * 
 * @example
 * ```typescript
 * toIPA("hello world") // "həloʊ wɝld"
 * toIPA("中文", { anyAscii: false }) // "ʈʂʊŋ˥˥ wən˧˥"
 * ```
 */
export function toIPA(
  text: string,
  options?: Omit<TokenizerOptions, "format">,
): string {
  const ipaOptions: TokenizerOptions = { ...options, format: "ipa" };
  const tokenizer = new Tokenizer(ipaOptions);
  return tokenizer.tokenizeToString(text);
}

/**
 * Convert text to ARPABET phonetic notation
 * 
 * @param text - Input text to convert
 * @param options - Configuration options (format will be overridden to 'arpabet')
 * @returns ARPABET phonetic string
 * 
 * @example
 * ```typescript
 * toARPABET("hello world") // "HH AH L OW W ER L D"
 * toARPABET("testing", { stripStress: true }) // "T EH S T IH NG"
 * ```
 */
export function toARPABET(
  text: string,
  options?: Omit<TokenizerOptions, "format">,
): string {
  const arpabetOptions: TokenizerOptions = { ...options, format: "arpabet" };
  const tokenizer = new Tokenizer(arpabetOptions);
  return tokenizer.tokenizeToString(text);
}

/**
 * Convert text to Zhuyin (Bopomofo) notation
 * Chinese characters are converted to Zhuyin with tone numbers,
 * non-Chinese characters are converted to IPA as fallback.
 * 
 * @param text - Input text to convert
 * @param options - Configuration options (format will be overridden to 'zhuyin')
 * @returns Zhuyin phonetic string with tone numbers
 * 
 * @example
 * ```typescript
 * toZhuyin("中文") // "ㄓㄨㄥ1 ㄨㄣ2"
 * toZhuyin("中文 hello") // "ㄓㄨㄥ1 ㄨㄣ2 həˈloʊ"
 * toZhuyin("測試", { stripStress: true }) // "ㄘㄜ4 ㄕ4"
 * ```
 */
export function toZhuyin(
  text: string,
  options?: Omit<TokenizerOptions, "format">,
): string {
  const zhuyinOptions: TokenizerOptions = { ...options, format: "zhuyin" };
  const tokenizer = new Tokenizer(zhuyinOptions);
  return tokenizer.tokenizeToString(text);
}

/**
 * Add custom pronunciation to the internal dictionary
 * 
 * @param word - Word to add pronunciation for
 * @param pronunciation - IPA pronunciation string
 * 
 * @example
 * ```typescript
 * addPronunciation("github", "ɡɪthʌb");
 * toIPA("github") // "ɡɪthʌb"
 * ```
 */
export function addPronunciation(word: string, pronunciation: string, language?: string): void {
  if (!word?.trim() || !pronunciation?.trim()) {
    throw new Error("Both word and pronunciation must be non-empty strings");
  }
  
  // Use the registered English G2P processor to add pronunciation
  const processor = getG2PProcessor(word, language);
  processor?.addPronunciation(word.toLowerCase(), pronunciation);
}

/**
 * Create a custom tokenizer instance with specific configuration
 * 
 * @param options - Tokenizer configuration options
 * @returns Configured Tokenizer instance
 * 
 * @example
 * ```typescript
 * const tokenizer = createTokenizer({
 *   format: "ipa",
 *   stripStress: true,
 *   separator: "-"
 * });
 * 
 * const result = tokenizer.tokenizeToString("hello");
 * ```
 */
export function createTokenizer(options: TokenizerOptions = {}): Tokenizer {
  return new Tokenizer(options);
}

/**
 * Phonemize library default export
 * Provides all core functions and classes for CommonJS compatibility
 */
const phonemizer = {
  // === Core Functions ===
  phonemize,
  toIPA,
  toARPABET,
  toZhuyin,

  // === Utilities ===
  addPronunciation,
  createTokenizer,

  // === Classes ===
  Tokenizer,
} as const;

export default phonemizer;