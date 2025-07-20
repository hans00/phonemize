/**
 * Text tokenization and phoneme processing system
 * Handles language detection, preprocessing, and format conversion
 */

import anyAscii from "any-ascii";
import { expandText } from "./expand";
import { simplePOSTagger } from "./pos-tagger";
import { ARPABET_TO_IPA, IPA_STRESS_MAP, PUNCTUATION } from "./consts";
import { detectLanguage, getG2PProcessor, predictPhonemes } from "./g2p";
import { ipaToArpabet, convertChineseTonesToArrows } from "./utils";
import type { G2PProcessor } from "./g2p";
import type ChineseG2P from "./zh-g2p";

// Tokenization regex patterns
const TOKEN_REGEX = /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+|\w+['']?\w*|[^\w\s\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])/g;

/**
 * Configuration options for tokenizer behavior
 */
export interface TokenizerOptions {
  /** Custom pronunciation overrides */
  homograph?: Record<string, string>;
  /** Remove stress markers from output */
  stripStress?: boolean;
  /**
   * Output format (IPA, ARPABET, or Zhuyin)
   * 
   * Note: Non-chinese in zhuyin format will be converted to IPA
   **/
  format?: "ipa" | "arpabet" | "zhuyin";
  /** Token separator in output string */
  separator?: string;
  /** Convert non-Latin text to ASCII approximation */
  anyAscii?: boolean;
  /** Chinese tone format: 'unicode' (˧˩˧) or 'arrow' (↓↗↘→). Only applies when format is 'ipa' */
  toneFormat?: "unicode" | "arrow";
}

/**
 * Individual phoneme token with metadata
 */
export interface PhonemeToken {
  /** IPA or ARPABET phoneme string */
  phoneme: string;
  /** Original word/text */
  word: string;
  /** Position in original text */
  position: number;
}

/**
 * Language segment for multilingual processing
 */
interface LanguageSegment {
  text: string;
  language: string;
  startIndex: number;
}

/**
 * Preprocessing result with language information
 */
interface PreprocessResult {
  text: string;
  languageMap: Record<string, string>;
  segments: LanguageSegment[];
}

/**
 * Main tokenizer class for phoneme processing
 */
export class Tokenizer {
  protected readonly options: Required<TokenizerOptions>;

  constructor(options: TokenizerOptions = {}) {
    this.options = {
      stripStress: false,
      format: "ipa",
      separator: " ",
      anyAscii: false,
      homograph: {},
      toneFormat: "unicode",
      ...options,
    };
  }

  /**
   * Preprocess text with language detection and segmentation
   */
  protected _preprocess(text: string): PreprocessResult {
    const { words, languageMap, segments } = this._detectLanguagesAndSegment(text);
    
    if (!this.options.anyAscii) {
      return {
        text,
        languageMap,
        segments,
      };
    }

    // Apply anyAscii conversion while preserving Chinese for G2P
    const processedText = this._applyAnyAscii(words, languageMap);

    return {
      text: processedText,
      languageMap,
      segments,
    };
  }

  /**
   * Detect languages for words and create character-level segments
   */
  private _detectLanguagesAndSegment(text: string): { 
    words: string[], 
    languageMap: Record<string, string>,
    segments: LanguageSegment[]
  } {
    const words = text.split(/(\s+)/);
    const languageMap: Record<string, string> = {};
    const segments: LanguageSegment[] = [];
    
    let currentSegment = '';
    let currentLanguage = '';
    let segmentStartIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charLang = this._detectCharLanguage(char);
      
      if (charLang !== currentLanguage) {
        // Language changed - save current segment if not empty
        if (currentSegment.trim()) {
          segments.push({
            text: currentSegment,
            language: currentLanguage || 'en',
            startIndex: segmentStartIndex
          });
        }
        // Start new segment
        currentSegment = char;
        currentLanguage = charLang;
        segmentStartIndex = i;
      } else {
        currentSegment += char;
      }
    }
    
    // Add final segment
    if (currentSegment.trim()) {
      segments.push({
        text: currentSegment,
        language: currentLanguage || 'en',
        startIndex: segmentStartIndex
      });
    }
    
    // Detect languages for words
    for (const word of words) {
      const trimmed = word.trim();
      if (trimmed && !PUNCTUATION.includes(trimmed)) {
        const detectedLang = detectLanguage(trimmed);
        if (detectedLang) {
          languageMap[trimmed.toLowerCase()] = detectedLang;
        }
      }
    }
    
    return { words, languageMap, segments };
  }

  /**
   * Apply anyAscii conversion while preserving Chinese text
   */
  private _applyAnyAscii(words: string[], languageMap: Record<string, string>): string {
    let processedText = '';

    for (const word of words) {
      const trimmed = word.trim();
      if (trimmed && !PUNCTUATION.includes(trimmed)) {
        const detectedLang = languageMap[trimmed.toLowerCase()];
        if (detectedLang === 'zh') {
          // Preserve Chinese text for G2P processing
          processedText += word;
        } else {
          // Convert non-Chinese multilingual text to ASCII
          const asciiWord = anyAscii(trimmed);
          processedText += word.replace(trimmed, asciiWord);
          // Store language mapping for ASCII version
          languageMap[asciiWord.toLowerCase()] = detectedLang;
        }
      } else {
        // Preserve whitespace and punctuation
        processedText += word;
      }
    }

    return processedText;
  }



  /**
   * Fast character-level language detection
   */
  private _detectCharLanguage(char: string): string {
    const code = char.charCodeAt(0);
    
    // Chinese (CJK) - most common ranges first
    if ((code >= 0x4e00 && code <= 0x9fff) ||     // CJK Unified Ideographs
        (code >= 0x3400 && code <= 0x4dbf) ||     // CJK Extension A
        (code >= 0x20000 && code <= 0x2a6df)) {   // CJK Extension B
      return 'zh';
    }
    
    // Japanese
    if ((code >= 0x3040 && code <= 0x309f) ||     // Hiragana
        (code >= 0x30a0 && code <= 0x30ff)) {     // Katakana
      return 'ja';
    }
    
    // Korean
    if ((code >= 0xac00 && code <= 0xd7af) ||     // Hangul Syllables
        (code >= 0x1100 && code <= 0x11ff) ||     // Hangul Jamo
        (code >= 0x3130 && code <= 0x318f)) {     // Hangul Compatibility Jamo
      return 'ko';
    }
    
    // Thai
    if (code >= 0x0e00 && code <= 0x0e7f) {
      return 'th';
    }
    
    // Arabic
    if ((code >= 0x0600 && code <= 0x06ff) ||     // Arabic
        (code >= 0x0750 && code <= 0x077f) ||     // Arabic Supplement
        (code >= 0xfb50 && code <= 0xfdff) ||     // Arabic Presentation Forms-A
        (code >= 0xfe70 && code <= 0xfeff)) {     // Arabic Presentation Forms-B
      return 'ar';
    }
    
    // Cyrillic (Russian, etc.)
    if (code >= 0x0400 && code <= 0x04ff) {
      return 'ru';
    }
    
    // Default to English/Latin
    return 'en';
  }

  /**
   * Post-process phonemes for format conversion and cleanup
   */
  protected _postProcess(phonemes: string): string {
    if (this.options.format === "arpabet") {
      // Convert to ARPABET format
      phonemes = ipaToArpabet(phonemes);
      
      // Remove ARPABET stress markers if requested
      if (this.options.stripStress) {
        phonemes = phonemes.replace(/[012]/g, "");
      }
    } else if (this.options.format === "zhuyin") {
      // Zhuyin format processing - handled per token, not here
      // This is a placeholder for any global zhuyin post-processing
      // The actual conversion happens in the tokenize method
      return phonemes;
    } else {
      // IPA format processing
      
      // Convert Chinese tone format if requested
      if (this.options.toneFormat === "arrow") {
        phonemes = convertChineseTonesToArrows(phonemes);
      }
      
      // Remove IPA stress markers if requested  
      if (this.options.stripStress) {
        phonemes = phonemes.replace(/[ˈˌ]/g, "");
      }
    }

    return phonemes;
  }

  private _predict(token: string, language: string, pos: string): string {
    const predicted = predictPhonemes(token, language, pos);
    return this._postProcess(predicted || token);
  }

  /**
   * Core token processing method that handles both simple and detailed tokenization
   */
  private _processTokens(text: string, includePositions = false): (PhonemeToken | { phoneme: string })[] {
    if (!text?.trim()) return [];

    const { text: processedText, languageMap } = this._preprocess(text);
    const expandedText = expandText(processedText);
    
    // Get tokens with or without positions
    const tokenMatches: { token: string; position?: number }[] = [];
    
    if (includePositions) {
      // Use regex to get tokens with their positions in original text
      let match;
      
      while ((match = TOKEN_REGEX.exec(expandedText)) !== null) {
        const token = match[1];
        
        // Skip pure whitespace tokens
        if (/^\s+$/.test(token)) {
          continue;
        }
        
        // Only process non-whitespace tokens
        if (token.trim()) {
          tokenMatches.push({
            token: token.trim(),
            position: match.index
          });
        }
      }
    } else {
      // Use simple tokenization
      const tokens = this._smartTokenize(expandedText);
      tokenMatches.push(...tokens.map(token => ({ token })));
    }
    
    // Get POS tags for homograph disambiguation
    const cleanWords = tokenMatches.filter(({ token }) => 
      !PUNCTUATION.includes(token)
    );
    const posResults = simplePOSTagger.tagWords(cleanWords.map(({ token }) => token));
    
    const results: (PhonemeToken | { phoneme: string })[] = [];
    let cleanWordIndex = 0;

    for (const { token, position } of tokenMatches) {
      const cleanToken = token.trim();
      
      // Handle punctuation - preserve it
      if (PUNCTUATION.includes(cleanToken)) {
        const result = includePositions && position !== undefined 
          ? { phoneme: cleanToken, word: cleanToken, position }
          : { phoneme: cleanToken };
        results.push(result);
        continue;
      }

      // Get POS tag for homograph disambiguation
      const pos = posResults[cleanWordIndex]?.pos;
      cleanWordIndex++;

      // Check for custom pronunciations
      const customPronunciation = this.options.homograph?.[cleanToken.toLowerCase()];
      let phoneme: string;
      
      if (customPronunciation) {
        phoneme = this._postProcess(customPronunciation);
        // Apply custom separator to individual phonemes if needed
        if (this.options.separator !== " ") {
          phoneme = phoneme.split(' ').join(this.options.separator);
        }
      } else {
        // Check language map for multilingual words
        const detectedLanguage = languageMap[cleanToken.toLowerCase()];
        
        // Handle Zhuyin format specially
        if (this.options.format === "zhuyin" && detectedLanguage === "zh") {
          // Convert Chinese to Zhuyin
          const g2p = getG2PProcessor(cleanToken, detectedLanguage) as ChineseG2P | null;
          phoneme = g2p?.textToZhuyin?.(cleanToken) ?? this._predict(cleanToken, detectedLanguage, pos);
        } else {
          // Regular IPA/ARPABET processing
          phoneme = this._predict(cleanToken, detectedLanguage, pos);
        }
        
        // Apply custom separator to individual phonemes if needed
        if (this.options.separator !== " ") {
          phoneme = phoneme.split(' ').join(this.options.separator);
        }
      }

      const result = includePositions && position !== undefined 
        ? { phoneme, word: cleanToken, position }
        : { phoneme };
      results.push(result);
    }

    return results;
  }

  /**
   * Core tokenization method - converts text to phoneme array
   */
  public tokenize(text: string): string[] {
    const tokens = this._processTokens(text, false);
    return tokens.map(token => token.phoneme);
  }

  /**
   * Smart tokenization using efficient regex patterns
   */
  private _smartTokenize(text: string): string[] {
    const tokens: string[] = [];
    let match;
    
    while ((match = TOKEN_REGEX.exec(text)) !== null) {
      const token = match[1];
      
      // Skip pure whitespace tokens
      if (/^\s+$/.test(token)) {
        continue;
      }
      
      // Handle punctuation - only add if it's in our known punctuation list
      if (token.length === 1 && PUNCTUATION.includes(token)) {
        tokens.push(token);
        continue;
      }
      
      // Add word tokens (Chinese, English, numbers, contractions, etc.)
      if (token.trim()) {
        tokens.push(token.trim());
      }
    }
    
    return tokens;
  }

  /**
   * Convert text to phoneme string with specified separator
   */
  public tokenizeToString(text: string): string {
    const phonemes = this.tokenize(text);
    
    // Join phonemes, handling punctuation attachment properly
    const result: string[] = [];
    
    for (let i = 0; i < phonemes.length; i++) {
      const phoneme = phonemes[i];
      
      if (PUNCTUATION.includes(phoneme)) {
        // Attach punctuation to previous phoneme without space
        if (result.length > 0) {
          result[result.length - 1] += phoneme;
        } else {
          result.push(phoneme);
        }
      } else {
        // Add phoneme as-is (separator is already applied in tokenize method)
        result.push(phoneme);
      }
    }
    
    return result.join(this.options.separator);
  }

  /**
   * Convert text to detailed phoneme tokens with metadata
   */
  public tokenizeToTokens(text: string): PhonemeToken[] {
    const tokens = this._processTokens(text, true);
    return tokens.filter((token): token is PhonemeToken => 'word' in token);
  }
}
