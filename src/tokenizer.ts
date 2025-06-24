/**
 * Text tokenization and phoneme processing system
 * Handles language detection, preprocessing, and format conversion
 */

import anyAscii from "any-ascii";
import { predict } from "./g2p";
import { expandText } from "./expand";
import { simplePOSTagger, POSResult } from "./pos-tagger";
import { ARPABET_TO_IPA, IPA_STRESS_MAP, PUNCTUATION } from "./consts";
import { detectLanguage } from "./multilingual-processor";
import { chineseG2P } from "./zh-g2p";
import { ipaToArpabet } from "./utils";

/**
 * Configuration options for tokenizer behavior
 */
export interface TokenizerOptions {
  /** Custom pronunciation overrides */
  homograph?: Record<string, string>;
  /** Remove stress markers from output */
  stripStress?: boolean;
  /** Output format (IPA or ARPABET) */
  format?: "ipa" | "arpabet";
  /** Token separator in output string */
  separator?: string;
  /** Convert non-Latin text to ASCII approximation */
  anyAscii?: boolean;
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
 * Fast ARPABET to IPA conversion for legacy compatibility
 */
function arpabetToIpa(arpabet: string): string {
  const stress = arpabet.match(/[012]$/)?.[0];
  const arpabetWithoutStress = arpabet.replace(/[012]$/, "");
  const ipa = ARPABET_TO_IPA[arpabetWithoutStress as keyof typeof ARPABET_TO_IPA];
  return stress ? `${IPA_STRESS_MAP[stress]}${ipa}` : ipa;
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
      ...options,
    };
  }

  /**
   * Preprocess text with language detection and segmentation
   */
  protected _preprocess(text: string): PreprocessResult {
    const segments = this._segmentByLanguage(text);
    
    if (!this.options.anyAscii) {
      return {
        text,
        languageMap: {},
        segments,
      };
    }

    // Apply anyAscii conversion while preserving Chinese for G2P
    const words = text.split(/(\s+)/);
    const languageMap: Record<string, string> = {};
    let processedText = '';

    for (const word of words) {
      const trimmed = word.trim();
      if (trimmed && !PUNCTUATION.includes(trimmed)) {
        const detectedLang = detectLanguage(trimmed);
        if (detectedLang) {
          if (detectedLang === 'zh' && chineseG2P.isChineseText(trimmed)) {
            // Preserve Chinese text for G2P processing
            processedText += word;
            languageMap[trimmed.toLowerCase()] = detectedLang;
          } else {
            // Convert non-Chinese multilingual text to ASCII
            const asciiWord = anyAscii(trimmed);
            processedText += word.replace(trimmed, asciiWord);
            languageMap[asciiWord.toLowerCase()] = detectedLang;
          }
        } else {
          // Convert non-multilingual text to ASCII
          processedText += anyAscii(word);
        }
      } else {
        // Preserve whitespace and punctuation
        processedText += word;
      }
    }

    return {
      text: processedText,
      languageMap,
      segments,
    };
  }

  /**
   * Segment text by character-level language detection
   */
  private _segmentByLanguage(text: string): LanguageSegment[] {
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
    
    return segments;
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
    // G2P returns IPA format, convert to ARPABET if needed
    if (this.options.format === "arpabet") {
      phonemes = ipaToArpabet(phonemes);
      
      // Remove ARPABET stress markers if requested
      if (this.options.stripStress) {
        phonemes = phonemes.replace(/[012]/g, "");
      }
    } else {
      // Remove IPA stress markers if requested  
      if (this.options.stripStress) {
        phonemes = phonemes.replace(/[ˈˌ]/g, "");
      }
    }

    return phonemes;
  }

  /**
   * Core tokenization method - converts text to phoneme array
   */
  public tokenize(text: string): string[] {
    if (!text?.trim()) return [];

    const { text: processedText, languageMap } = this._preprocess(text);
    const expandedText = expandText(processedText);
    
    // Split but preserve punctuation and spacing
    const tokens = expandedText.split(/(\s+|[^\w\s])/g).filter(token => token.trim());
    
    // Get POS tags for homograph disambiguation
    const cleanWords = tokens.filter(token => 
      token.trim() && !PUNCTUATION.includes(token.trim())
    );
    const posResults = simplePOSTagger.tagWords(cleanWords);
    
    const phonemes: string[] = [];
    let cleanWordIndex = 0;

    for (const token of tokens) {
      const cleanToken = token.trim();
      
      // Handle punctuation - preserve it
      if (PUNCTUATION.includes(cleanToken)) {
        phonemes.push(cleanToken);
        continue;
      }

      // Get POS tag for homograph disambiguation
      const pos = posResults[cleanWordIndex]?.pos;
      cleanWordIndex++;

      // Check for custom pronunciations
      const customPronunciation = this.options.homograph?.[cleanToken.toLowerCase()];
      if (customPronunciation) {
        let processed = this._postProcess(customPronunciation);
        // Apply custom separator to individual phonemes if needed
        if (this.options.separator !== " ") {
          processed = processed.split(' ').join(this.options.separator);
        }
        phonemes.push(processed);
        continue;
      }

      // Check language map for multilingual words
      const detectedLanguage = languageMap[cleanToken.toLowerCase()];
      
      // Get pronunciation from G2P system with POS for homograph disambiguation
      let pronunciation = predict(cleanToken, pos, detectedLanguage);
      pronunciation = this._postProcess(pronunciation);
      
      // Apply custom separator to individual phonemes if needed
      if (this.options.separator !== " ") {
        pronunciation = pronunciation.split(' ').join(this.options.separator);
      }
      
      phonemes.push(pronunciation);
    }

    return phonemes;
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
        // For custom separators, split phonemes into characters
        if (this.options.separator !== " ") {
          result.push(phoneme.split('').join(this.options.separator));
        } else {
          result.push(phoneme);
        }
      }
    }
    
    return result.join(this.options.separator === " " ? " " : " ");
  }

  /**
   * Convert text to detailed phoneme tokens with metadata
   */
  public tokenizeToTokens(text: string): PhonemeToken[] {
    if (!text?.trim()) return [];

    const { text: processedText, languageMap } = this._preprocess(text);
    const expandedText = expandText(processedText);
    const tokens = expandedText.split(/(\s+)/).filter(token => token);
    
    // Get POS tags for homograph disambiguation
    const cleanWords = tokens.filter(token => 
      token.trim() && !PUNCTUATION.includes(token.trim())
    );
    const posResults = simplePOSTagger.tagWords(cleanWords);
    
    const results: PhonemeToken[] = [];
    let position = 0;
    let cleanWordIndex = 0;

    for (const token of tokens) {
      if (token.trim() && !PUNCTUATION.includes(token.trim())) {
        const cleanToken = token.trim();
        
        // Get POS tag for homograph disambiguation
        const pos = posResults[cleanWordIndex]?.pos;
        cleanWordIndex++;
        
        // Check for custom pronunciations
        const customPronunciation = this.options.homograph?.[cleanToken.toLowerCase()];
        let phoneme: string;
        
        if (customPronunciation) {
          phoneme = this._postProcess(customPronunciation);
        } else {
          // Check language map for multilingual words
          const detectedLanguage = languageMap[cleanToken.toLowerCase()];
          const pronunciation = predict(cleanToken, pos, detectedLanguage);
          phoneme = this._postProcess(pronunciation);
        }

        results.push({
          phoneme,
          word: cleanToken,
          position
        });
      }
      position += token.length;
    }

    return results;
  }
}

// Legacy function exports for backward compatibility
export function tokenizeText(
  text: string,
  _g2pPredict: any, // Deprecated parameter
  options: TokenizerOptions = {},
): PhonemeToken[] {
  const tokenizer = new Tokenizer(options);
  return tokenizer.tokenizeToTokens(text);
}

export function textToIPA(
  text: string,
  _g2pPredict: any, // Deprecated parameter
  options: TokenizerOptions = {},
): string {
  const tokenizer = new Tokenizer({ ...options, format: "ipa" });
  return tokenizer.tokenizeToString(text);
}

export function textToARPABET(
  text: string,
  _g2pPredict: any, // Deprecated parameter
  options: TokenizerOptions = {},
): string {
  const tokenizer = new Tokenizer({ ...options, format: "arpabet" });
  return tokenizer.tokenizeToString(text);
}
