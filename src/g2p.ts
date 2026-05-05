/**
 * Abstract G2P (Grapheme-to-Phoneme) Processor Interface
 *
 * This module provides an abstraction layer for different G2P engines,
 * allowing dynamic registration and usage of language-specific processors.
 *
 * The exported `g2pRegistry` and free functions wrap a default global
 * registry to preserve the simple `phonemize("hello")` API. To create
 * isolated registrations (so multiple language sets can coexist without
 * stepping on each other) use `new G2PRegistry()` directly or the
 * higher-level `createPhonemizer()` factory in `core.ts`.
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
   * Languages this processor can handle. Use BCP 47-style tags; the
   * registry treats `en` as a parent of `en-US`/`en-GB` etc., so a
   * processor that lists `["en"]` will be selected for `en-GB` requests
   * unless a more specific processor is also registered.
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

// === Language tag helpers ===

/**
 * Return the primary language subtag — `en-GB` → `en`, `zh-Hant-TW` → `zh`.
 */
export function primaryLang(tag: string): string {
  const idx = tag.indexOf("-");
  return idx === -1 ? tag : tag.slice(0, idx);
}

/**
 * True when `processorTag` covers `requestTag` under BCP 47 fallback:
 * exact match, or processor's tag is a prefix of the request.
 *
 *   "en"     covers "en", "en-US", "en-GB"
 *   "en-GB"  covers "en-GB" only
 *   "en-US"  does NOT cover "en-GB"
 */
function tagCovers(processorTag: string, requestTag: string): boolean {
  if (processorTag === requestTag) return true;
  return requestTag.startsWith(processorTag + "-");
}

// === G2P Registry ===

export class G2PRegistry {
  private processors: Map<string, G2PProcessor> = new Map();
  /** Insertion order for stable "first registered wins" semantics. */
  private order: G2PProcessor[] = [];

  register(processor: G2PProcessor): void {
    this.processors.set(processor.id, processor);
    if (!this.order.includes(processor)) {
      this.order.push(processor);
    }
  }

  unregister(id: string): boolean {
    const proc = this.processors.get(id);
    if (!proc) return false;
    this.processors.delete(id);
    this.order = this.order.filter((p) => p !== proc);
    return true;
  }

  getProcessor(id: string): G2PProcessor | undefined {
    return this.processors.get(id);
  }

  getProcessorsForLanguage(language: string): G2PProcessor[] {
    const exact: G2PProcessor[] = [];
    const parent: G2PProcessor[] = [];
    for (const p of this.order) {
      // Scan all tags; an exact match anywhere bumps the processor into
      // the exact bucket. Otherwise classify on the first parent-cover.
      let isExact = false;
      let isParent = false;
      for (const tag of p.supportedLanguages) {
        if (tag === language) {
          isExact = true;
          break;
        }
        if (tagCovers(tag, language)) isParent = true;
      }
      if (isExact) exact.push(p);
      else if (isParent) parent.push(p);
    }
    // Prefer exact dialect match (en-GB) over parent (en) match.
    return exact.concat(parent);
  }

  getAllProcessors(): G2PProcessor[] {
    return this.order.slice();
  }

  /**
   * Find the best processor for a given word and language. When a
   * language is provided, dialect-exact processors are tried first,
   * then parent-tag processors. With no language we fall back to the
   * first registered processor.
   */
  findBestProcessor(_word: string, language?: string): G2PProcessor | null {
    if (language) {
      const matches = this.getProcessorsForLanguage(language);
      if (matches.length > 0) return matches[0];
    }
    return this.order[0] ?? null;
  }

  predictPhonemes(
    word: string,
    language?: string,
    pos?: string,
  ): string | null {
    let lang = language;
    if (!lang) {
      const detected = detectLanguage(word);
      if (detected) lang = detected;
    }
    const processor = this.findBestProcessor(word, lang);
    if (!processor) return null;
    const result = processor.predict(word, lang, pos);
    return result && result.trim() ? result : null;
  }

  clear(): void {
    this.processors.clear();
    this.order = [];
  }

  getSupportedLanguages(): string[] {
    const set = new Set<string>();
    for (const p of this.order) {
      for (const lang of p.supportedLanguages) set.add(lang);
    }
    return Array.from(set);
  }
}

// === Default global registry (preserves simple `phonemize` API) ===

export const g2pRegistry = new G2PRegistry();

// === Language Detection ===

const CHINESE_CHARS = /[一-龥]/;
const JAPANESE_CHARS = /[぀-ヿ]/;
const KOREAN_CHARS = /[가-힯]/;
const RUSSIAN_CHARS = /[Ѐ-ӿ]/;
const GERMAN_CHARS = /[äöüÄÖÜß]/;
const ARABIC_CHARS = /[؀-ۿ]/;
const THAI_CHARS = /[฀-๿]/;

/**
 * Detect the language of the given text based on Unicode character ranges
 *
 * @param text - Text to detect language for
 * @returns Language code or null if not detected
 */
export function detectLanguage(text: string): string | null {
  if (CHINESE_CHARS.test(text)) return "zh";
  if (JAPANESE_CHARS.test(text)) return "ja";
  if (KOREAN_CHARS.test(text)) return "ko";
  if (RUSSIAN_CHARS.test(text)) return "ru";
  if (GERMAN_CHARS.test(text)) return "de";
  if (ARABIC_CHARS.test(text)) return "ar";
  if (THAI_CHARS.test(text)) return "th";

  return null;
}

// === Public API (default global registry wrappers) ===

/**
 * Register a G2P processor on the default global registry.
 *
 * For multi-instance setups, prefer `createPhonemizer()` from `./core`.
 */
export function useG2P(processor: G2PProcessor): void {
  g2pRegistry.register(processor);
}

export function getG2PProcessor(
  word: string,
  language?: string,
): G2PProcessor | null {
  return g2pRegistry.findBestProcessor(word, language);
}

export function predictPhonemes(
  word: string,
  language?: string,
  pos?: string,
): string | null {
  return g2pRegistry.predictPhonemes(word, language, pos);
}

export function getRegisteredProcessorIds(): string[] {
  return g2pRegistry.getAllProcessors().map((p) => p.id);
}

export function getProcessorsForLanguage(language: string): G2PProcessor[] {
  return g2pRegistry.getProcessorsForLanguage(language);
}

export function getSupportedLanguages(): string[] {
  return g2pRegistry.getSupportedLanguages();
}
