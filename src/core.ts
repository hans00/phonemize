/**
 * Phonemize Library - Main API
 *
 * A comprehensive text-to-phoneme conversion library supporting:
 * - IPA (International Phonetic Alphabet) output
 * - ARPABET phonetic notation
 * - Number and abbreviation expansion
 *
 * The default exports (`phonemize`, `useG2P`, `addPronunciation`, ...) read
 * and write a single global G2P registry, which is what `phonemize/index`
 * and `phonemize/all` populate. To run an isolated set of processors —
 * e.g. force English-only output, or stack two unrelated language
 * configurations in the same process — use `createPhonemizer()` instead.
 */

import { Tokenizer, TokenizerOptions, PhonemeToken } from "./tokenizer";
import {
  G2PRegistry,
  g2pRegistry as defaultRegistry,
  useG2P,
} from "./g2p";
import type { G2PProcessor } from "./g2p";

// Re-export core types and classes for public API
export type { TokenizerOptions, PhonemeToken };
export { Tokenizer, useG2P, G2PRegistry };

export type { G2PProcessor } from "./g2p";

/** Optional second-argument shorthand: bare string is treated as `language`. */
type PhonemizeArg =
  | true
  | string
  | (TokenizerOptions & { returnArray?: boolean });

function normalizeArg(
  arg: PhonemizeArg | undefined,
): TokenizerOptions & { returnArray?: boolean } {
  if (arg === undefined) return {};
  if (arg === true) return { returnArray: true };
  if (typeof arg === "string") return { language: arg };
  return arg;
}

/**
 * Convert text to phonetic representation
 */
export function phonemize(
  text: string,
  options: TokenizerOptions & { returnArray: true },
): PhonemeToken[];
export function phonemize(text: string, options?: TokenizerOptions): string;
export function phonemize(text: string, returnArray: true): PhonemeToken[];
/**
 * Shorthand: pass a language tag (e.g. `"en-GB"`) as the second argument
 * to bias dispatch toward processors matching that tag.
 */
export function phonemize(text: string, language: string): string;
export function phonemize(text: string, arg: PhonemizeArg = {}): string | PhonemeToken[] {
  const options = normalizeArg(arg);
  const tokenizer = new Tokenizer(options);
  return options.returnArray
    ? tokenizer.tokenizeToTokens(text)
    : tokenizer.tokenizeToString(text);
}

/**
 * Convert text to International Phonetic Alphabet (IPA) notation
 *
 * @example
 * ```typescript
 * toIPA("hello world") // "həloʊ wɝld"
 * toIPA("中文", { anyAscii: false }) // "ʈʂʊŋ˥˥ wən˧˥"
 * toIPA("hello", "en-GB") // RP-flavored output
 * ```
 */
export function toIPA(
  text: string,
  options?: Omit<TokenizerOptions, "format"> | string,
): string {
  const opts =
    typeof options === "string" ? { language: options } : options ?? {};
  const ipaOptions: TokenizerOptions = { ...opts, format: "ipa" };
  return new Tokenizer(ipaOptions).tokenizeToString(text);
}

/**
 * Convert text to ARPABET phonetic notation
 */
export function toARPABET(
  text: string,
  options?: Omit<TokenizerOptions, "format"> | string,
): string {
  const opts =
    typeof options === "string" ? { language: options } : options ?? {};
  const arpabetOptions: TokenizerOptions = { ...opts, format: "arpabet" };
  return new Tokenizer(arpabetOptions).tokenizeToString(text);
}

/**
 * Convert text to Zhuyin (Bopomofo) notation. Chinese characters are
 * converted to Zhuyin with tone numbers; non-Chinese characters fall
 * back to IPA.
 */
export function toZhuyin(
  text: string,
  options?: Omit<TokenizerOptions, "format"> | string,
): string {
  const opts =
    typeof options === "string" ? { language: options } : options ?? {};
  const zhuyinOptions: TokenizerOptions = { ...opts, format: "zhuyin" };
  return new Tokenizer(zhuyinOptions).tokenizeToString(text);
}

/**
 * Add a custom pronunciation to the default global registry's matching
 * processor. For multi-instance setups, use `Phonemizer#addPronunciation`.
 */
export function addPronunciation(
  word: string,
  pronunciation: string,
  language?: string,
): void {
  if (!word?.trim() || !pronunciation?.trim()) {
    throw new Error("Both word and pronunciation must be non-empty strings");
  }
  const processor = defaultRegistry.findBestProcessor(word, language);
  processor?.addPronunciation(word.toLowerCase(), pronunciation);
}

/**
 * Create a custom tokenizer instance with specific configuration. Useful
 * when you want to reuse the same options across many calls.
 */
export function createTokenizer(options: TokenizerOptions = {}): Tokenizer {
  return new Tokenizer(options);
}

// === Multi-instance API =====================================================

/**
 * Options for `createPhonemizer()`.
 */
export interface PhonemizerOptions {
  /**
   * Initial set of G2P processors. Equivalent to calling `useG2P()` for
   * each on a freshly created instance. The first registered processor
   * is the default fallback when no language is provided.
   */
  g2ps?: G2PProcessor[];
  /**
   * Default language tag applied to every call (overridable per-call).
   */
  language?: string;
}

/**
 * An isolated phonemizer with its own G2P registry. Use this when you
 * want to register a different set of languages per call site without
 * mutating the global registry — for example, a server that handles
 * one user request with English-only output and another with the full
 * multilingual stack.
 *
 * @example
 * ```ts
 * import { createPhonemizer, EnglishG2P } from "phonemize";
 *
 * const enOnly = createPhonemizer({ g2ps: [new EnglishG2P()] });
 * enOnly.phonemize("hello 中文"); // "həˈɫoʊ 中文"  (zh untouched)
 *
 * const rp = createPhonemizer({
 *   g2ps: [new EnglishG2P({ dialect: "en-GB" })],
 *   language: "en-GB",
 * });
 * rp.phonemize("doctor"); // RP transformation applied
 * ```
 */
export class Phonemizer {
  readonly registry: G2PRegistry;
  private readonly defaultLanguage?: string;

  constructor(options: PhonemizerOptions = {}) {
    this.registry = new G2PRegistry();
    if (options.g2ps) {
      for (const p of options.g2ps) this.registry.register(p);
    }
    this.defaultLanguage = options.language;
  }

  useG2P(processor: G2PProcessor): this {
    this.registry.register(processor);
    return this;
  }

  unregister(id: string): boolean {
    return this.registry.unregister(id);
  }

  private _resolve(
    arg?: PhonemizeArg,
  ): TokenizerOptions & { returnArray?: boolean } {
    const opts = normalizeArg(arg);
    return {
      ...opts,
      registry: this.registry,
      language: opts.language ?? this.defaultLanguage,
    };
  }

  phonemize(
    text: string,
    options: TokenizerOptions & { returnArray: true },
  ): PhonemeToken[];
  phonemize(text: string, options?: TokenizerOptions): string;
  phonemize(text: string, returnArray: true): PhonemeToken[];
  phonemize(text: string, language: string): string;
  phonemize(text: string, arg: PhonemizeArg = {}): string | PhonemeToken[] {
    const options = this._resolve(arg);
    const tokenizer = new Tokenizer(options);
    return options.returnArray
      ? tokenizer.tokenizeToTokens(text)
      : tokenizer.tokenizeToString(text);
  }

  toIPA(text: string, options?: Omit<TokenizerOptions, "format"> | string): string {
    const opts = typeof options === "string" ? { language: options } : options ?? {};
    return new Tokenizer({
      ...opts,
      format: "ipa",
      registry: this.registry,
      language: opts.language ?? this.defaultLanguage,
    }).tokenizeToString(text);
  }

  toARPABET(text: string, options?: Omit<TokenizerOptions, "format"> | string): string {
    const opts = typeof options === "string" ? { language: options } : options ?? {};
    return new Tokenizer({
      ...opts,
      format: "arpabet",
      registry: this.registry,
      language: opts.language ?? this.defaultLanguage,
    }).tokenizeToString(text);
  }

  toZhuyin(text: string, options?: Omit<TokenizerOptions, "format"> | string): string {
    const opts = typeof options === "string" ? { language: options } : options ?? {};
    return new Tokenizer({
      ...opts,
      format: "zhuyin",
      registry: this.registry,
      language: opts.language ?? this.defaultLanguage,
    }).tokenizeToString(text);
  }

  addPronunciation(word: string, pronunciation: string, language?: string): void {
    if (!word?.trim() || !pronunciation?.trim()) {
      throw new Error("Both word and pronunciation must be non-empty strings");
    }
    const processor = this.registry.findBestProcessor(
      word,
      language ?? this.defaultLanguage,
    );
    processor?.addPronunciation(word.toLowerCase(), pronunciation);
  }

  createTokenizer(options: TokenizerOptions = {}): Tokenizer {
    return new Tokenizer({
      ...options,
      registry: this.registry,
      language: options.language ?? this.defaultLanguage,
    });
  }
}

/**
 * Factory shorthand for `new Phonemizer(options)`.
 */
export function createPhonemizer(options: PhonemizerOptions = {}): Phonemizer {
  return new Phonemizer(options);
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
  useG2P,
  createPhonemizer,

  // === Classes ===
  Tokenizer,
  Phonemizer,
  G2PRegistry,
} as const;

export default phonemizer;
