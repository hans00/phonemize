/**
 * Abstract G2P (Grapheme-to-Phoneme) Processor Interface
 * 
 * This module provides an abstraction layer for different G2P engines,
 * allowing dynamic registration and usage of language-specific processors.
 */

// === Type Definitions ===

export interface G2PProcessor {
  /**
   * Unique identifier for this G2P processor
   */
  readonly id: string;
  
  /**
   * Human-readable name for this G2P processor
   */
  readonly name: string;
  
  /**
   * Languages this processor can handle
   * Array of ISO 639-1 language codes (e.g., ['en', 'zh', 'ja'])
   */
  readonly supportedLanguages: string[];
  
  /**
   * Predict phonemes for a given word
   * 
   * @param word - Word to convert to phonemes
   * @param language - Language code (optional, for disambiguation)
   * @param pos - Part of speech (optional, for homograph disambiguation)
   * @returns Phoneme string in IPA format, or null if cannot process
   */
  predict(word: string, language?: string, pos?: string): string | null;

  /**
   * Add a custom pronunciation for a word
   * 
   * @param word - Word to add pronunciation for
   * @param pronunciation - IPA pronunciation string
   */
  addPronunciation(word: string, pronunciation: string): void;
}

// === G2P Registry ===

class G2PRegistry {
  private processors: Map<string, G2PProcessor> = new Map();
  private languageMap: Map<string, G2PProcessor[]> = new Map();
  
  /**
   * Register a G2P processor
   * 
   * @param processor - G2P processor to register
   */
  register(processor: G2PProcessor): void {
    // Register by ID
    this.processors.set(processor.id, processor);
    
    // Register by supported languages
    for (const lang of processor.supportedLanguages) {
      if (!this.languageMap.has(lang)) {
        this.languageMap.set(lang, []);
      }
      this.languageMap.get(lang)!.push(processor);
    }
  }
  
  /**
   * Get processor by ID
   * 
   * @param id - Processor ID
   * @returns G2P processor or undefined
   */
  getProcessor(id: string): G2PProcessor | undefined {
    return this.processors.get(id);
  }
  
  /**
   * Get processors that support a specific language
   * 
   * @param language - Language code
   * @returns Array of processors that support the language
   */
  getProcessorsForLanguage(language: string): G2PProcessor[] {
    return this.languageMap.get(language) || [];
  }
  
  /**
   * Get all registered processors
   * 
   * @returns Array of all registered processors
   */
  getAllProcessors(): G2PProcessor[] {
    return Array.from(this.processors.values());
  }
  
  /**
   * Find the best processor for a given word and language
   * 
   * @param word - Word to process
   * @param language - Language code (optional)
   * @returns Best matching processor or null
   */
  findBestProcessor(word: string, language?: string): G2PProcessor | null {
    // If language is specified, try processors for that language first
    if (language) {
      const langProcessors = this.getProcessorsForLanguage(language);
      if (langProcessors.length > 0) {
        return langProcessors[0]; // Return first processor for the language
      }
    }
    
    // If no language specified or no processor found, try all processors
    const allProcessors = Array.from(this.processors.values());
    if (allProcessors.length > 0) {
      return allProcessors[0]; // Return first available processor
    }
    
    return null;
  }
  
  /**
   * Clear all registered processors
   */
  clear(): void {
    this.processors.clear();
    this.languageMap.clear();
  }
}

// === Global Registry Instance ===

export const g2pRegistry = new G2PRegistry();

// === Language Detection ===

const CHINESE_CHARS = /[\u4e00-\u9fa5]/;
const JAPANESE_CHARS = /[\u3040-\u30ff]/;
const KOREAN_CHARS = /[\uac00-\ud7af]/;
const RUSSIAN_CHARS = /[\u0400-\u04FF]/;
const GERMAN_CHARS = /[äöüÄÖÜß]/;
const ARABIC_CHARS = /[\u0600-\u06FF]/;
const THAI_CHARS = /[\u0e00-\u0e7f]/;

/**
 * Detect the language of the given text based on Unicode character ranges
 * 
 * @param text - Text to detect language for
 * @returns Language code or null if not detected
 */
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

// === Public API ===

/**
 * Use a specific G2P processor by instance
 * 
 * @param processor - G2P processor instance to use
 * @returns True if processor was successfully registered
 */
export function useG2P(processor: G2PProcessor): boolean {
  try {
    g2pRegistry.register(processor);
    return true;
  } catch (error) {
    console.warn('Failed to register G2P processor:', error);
    return false;
  }
}

/**
 * Get the best G2P processor for a word
 * 
 * @param word - Word to process
 * @param language - Language code (optional)
 * @returns G2P processor or null
 */
export function getG2PProcessor(word: string, language?: string): G2PProcessor | null {
  return g2pRegistry.findBestProcessor(word, language);
}

/**
 * Predict phonemes using the best available processor
 * 
 * @param word - Word to convert
 * @param language - Language code (optional)
 * @param pos - Part of speech (optional)
 * @returns Phoneme string or null if no processor can handle it
 */
export function predictPhonemes(word: string, language?: string, pos?: string): string | null {
  // If no language specified, try to detect it
  if (!language) {
    const detectedLang = detectLanguage(word);
    if (detectedLang) {
      language = detectedLang;
    }
  }
  
  const processor = g2pRegistry.findBestProcessor(word, language);
  if (processor) {
    const result = processor.predict(word, language, pos);
    // Return null if processor returns empty string or null
    return result && result.trim() ? result : null;
  }
  return null;
}

/**
 * Get all registered processor IDs
 * 
 * @returns Array of processor IDs
 */
export function getRegisteredProcessorIds(): string[] {
  return g2pRegistry.getAllProcessors().map(p => p.id);
}

/**
 * Get processors that support a specific language
 * 
 * @param language - Language code
 * @returns Array of processors that support the language
 */
export function getProcessorsForLanguage(language: string): G2PProcessor[] {
  return g2pRegistry.getProcessorsForLanguage(language);
}

// === Utility Functions ===

/**
 * Get all supported languages
 * 
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): string[] {
  const languages = new Set<string>();
  for (const processor of g2pRegistry.getAllProcessors()) {
    for (const lang of processor.supportedLanguages) {
      languages.add(lang);
    }
  }
  return Array.from(languages);
}
