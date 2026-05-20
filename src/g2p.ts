/**
 * Per-language Processor abstraction.
 *
 * A `LanguageProcessor` bundles the work needed for one language:
 * text normalization (`preProcess`) and grapheme-to-phoneme prediction
 * (`predict`). The registry below dispatches by BCP 47 language tag with
 * script-based fallback.
 *
 * The exported `languageRegistry` and free functions wrap a default global
 * registry to preserve the simple `phonemize("hello")` API. To create
 * isolated registrations (so multiple language sets can coexist without
 * stepping on each other) use `new LanguageRegistry()` directly or the
 * higher-level `createPhonemizer()` factory in `core.ts`.
 */

// === Type Definitions ===

/**
 * A language-bound processor: text normalization plus grapheme-to-phoneme
 * prediction. Each implementation handles a single language's full
 * preProcess → predict pipeline; the registry dispatches per-segment.
 */
export interface LanguageProcessor {
  /**
   * Unique identifier for this processor
   */
  readonly id: string;

  /**
   * Human-readable name for this processor
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
   * Optional language-specific text normalization. Run before tokenization
   * on a slice of text identified as this processor's language; should
   * expand numbers, abbreviations, currency, dates, etc. into spoken form.
   *
   * Processors without language-specific normalization can leave this
   * undefined — the tokenizer treats the absence as a no-op.
   */
  preProcess?(text: string): string;

  /**
   * Optional per-token POS tag (mostly for homograph disambiguation).
   * The tokenizer routes each token to the matching processor's
   * `tagWord` (if any), then passes the returned `pos` into `predict`.
   * Context is the (optional) immediately neighboring tokens in original
   * surface form so taggers that need local cues — preceding determiner,
   * following particle, etc. — have access to them.
   *
   * Implementations that don't model POS should leave this undefined;
   * `predict` will then receive `undefined` for the `pos` argument.
   */
  tagWord?(
    word: string,
    context?: { prev?: string; next?: string },
  ): { pos: string; confidence: number } | null;

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
 * Normalize a BCP 47 tag for comparison. The spec defines tag matching
 * as case-insensitive, so we lowercase before any equality check.
 */
export function normalizeTag(tag: string): string {
  return tag.toLowerCase();
}

/**
 * True when `processorTag` covers `requestTag` under BCP 47 fallback:
 * exact match (case-insensitive), or processor's tag is a prefix of
 * the request.
 *
 *   "en"     covers "en", "en-US", "en-GB", "en-gb"
 *   "en-GB"  covers "en-GB" / "en-gb" only
 *   "en-US"  does NOT cover "en-GB"
 */
function tagCovers(processorTag: string, requestTag: string): boolean {
  const p = normalizeTag(processorTag);
  const r = normalizeTag(requestTag);
  if (p === r) return true;
  return r.startsWith(p + "-");
}

// === G2P Registry ===

export class LanguageRegistry {
  private processors: Map<string, LanguageProcessor> = new Map();
  /** Insertion order for stable "first registered wins" semantics. */
  private order: LanguageProcessor[] = [];

  register(processor: LanguageProcessor): void {
    // Re-registering the same id should swap the implementation in
    // place, not stack a stale clone behind the live one. We replace
    // the existing entry at its current position so dispatch order
    // is preserved across rolling upgrades.
    const existing = this.processors.get(processor.id);
    if (existing) {
      const idx = this.order.indexOf(existing);
      if (idx !== -1) this.order[idx] = processor;
      else this.order.push(processor);
    } else {
      this.order.push(processor);
    }
    this.processors.set(processor.id, processor);
  }

  unregister(id: string): boolean {
    const proc = this.processors.get(id);
    if (!proc) return false;
    this.processors.delete(id);
    // Remove every order-array reference, in case earlier code paths
    // ever left duplicates behind.
    this.order = this.order.filter((p) => p.id !== id);
    return true;
  }

  getProcessor(id: string): LanguageProcessor | undefined {
    return this.processors.get(id);
  }

  getProcessorsForLanguage(language: string): LanguageProcessor[] {
    // Compare on normalized tags so `en-GB` and `en-gb` match alike.
    const requestNorm = normalizeTag(language);
    const exact: LanguageProcessor[] = [];
    // Among parent matches, the most-specific prefix should win — so
    // for a request `en-US-x-foo` a processor declaring `en-US` must
    // outrank one declaring bare `en`. We track each parent's best
    // matching prefix length and stable-sort by it descending.
    const parentEntries: {
      proc: LanguageProcessor;
      matchLen: number;
      order: number;
    }[] = [];
    let idx = 0;
    for (const p of this.order) {
      let isExact = false;
      let bestParentLen = 0;
      for (const tag of p.supportedLanguages) {
        const tagNorm = normalizeTag(tag);
        if (tagNorm === requestNorm) {
          isExact = true;
          break;
        }
        if (tagCovers(tag, language) && tagNorm.length > bestParentLen) {
          bestParentLen = tagNorm.length;
        }
      }
      if (isExact) exact.push(p);
      else if (bestParentLen > 0) {
        parentEntries.push({ proc: p, matchLen: bestParentLen, order: idx });
      }
      idx++;
    }
    parentEntries.sort((a, b) => b.matchLen - a.matchLen || a.order - b.order);
    // Prefer exact dialect match (en-GB) over parent (en) match.
    return exact.concat(parentEntries.map((e) => e.proc));
  }

  getAllProcessors(): LanguageProcessor[] {
    return this.order.slice();
  }

  /**
   * Find the best processor for a given word and language. When a
   * language is provided, dialect-exact processors are tried first,
   * then parent-tag processors. With no language we fall back to the
   * first registered processor.
   */
  findBestProcessor(
    _word: string,
    language?: string,
  ): LanguageProcessor | null {
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

export const languageRegistry = new LanguageRegistry();

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

// === Script-based segmentation ===

/**
 * Classify a single code unit by script family. Returns an empty string for
 * "neutral" characters (digits, whitespace, ASCII punctuation, symbols) so
 * that callers can absorb them into adjacent script runs rather than
 * stranding them in their own segment.
 *
 * `hanLang` lets callers override how CJK Han chars are routed: `"zh"` (the
 * default) treats them as Chinese, but a document containing any kana
 * almost certainly uses Han as Japanese kanji, so `analyzeText` will pass
 * `"ja"` in that case.
 */
function classifyChar(code: number, hanLang: string = "zh"): string {
  // CJK Unified + Extension A + Compatibility Ideographs
  if (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0xf900 && code <= 0xfaff)
  )
    return hanLang;
  // Hiragana + Katakana
  if ((code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff))
    return "ja";
  // Hangul Syllables
  if (code >= 0xac00 && code <= 0xd7af) return "ko";
  // Cyrillic
  if (code >= 0x0400 && code <= 0x04ff) return "ru";
  // Arabic
  if (code >= 0x0600 && code <= 0x06ff) return "ar";
  // Thai
  if (code >= 0x0e00 && code <= 0x0e7f) return "th";
  // German-specific Latin diacritics — matches `detectLanguage`'s GERMAN_CHARS
  if (
    code === 0xe4 ||
    code === 0xf6 ||
    code === 0xfc ||
    code === 0xc4 ||
    code === 0xd6 ||
    code === 0xdc ||
    code === 0xdf
  )
    return "de";
  // ASCII letters
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a))
    return "en";
  // Latin-1 supplement + Latin extended (Spanish, French, Vietnamese, …)
  if (code >= 0xc0 && code <= 0x024f) return "en";
  return "";
}

/**
 * Whole-text analysis: identifies the dominant language by character share
 * and resolves the CJK Han ambiguity (`zh` vs `ja`).
 *
 * Han routing heuristic — only **hiragana cluster count** drives the
 * zh/ja decision:
 *
 *   `hanIsJa` is true when the text has **two or more** separate
 *   hiragana clusters — i.e. multiple grammatical particles or verb
 *   inflections (は・を・が・で・に・ます・です・ている・…) interleaved
 *   with non-hiragana chars, which is the structural signature of
 *   Japanese prose.
 *
 *   Why hiragana cluster *count* rather than length or katakana:
 *
 *   - Taiwan-Chinese text routinely embeds Japanese *loanwords* —
 *     usually katakana (ラーメン, コーヒー, ドラマ) but sometimes
 *     hiragana for food (うどん, おでん, やきとり). These appear as
 *     one isolated kana cluster surrounded by Han, so length-based
 *     rules misfire ("max contiguous hira ≥ 2" would flip `我超愛うどん`
 *     to ja). Counting *separate* clusters skips this class entirely:
 *     a single loanword contributes one cluster.
 *
 *   - Decorative single hiragana — overwhelmingly `の`, which academic
 *     surveys (Karen S. Chung, *Some Returned Loans*) treat as
 *     functionally identical to 之/的 in Taiwan Mandarin — also contribute
 *     one cluster, so they stay below the threshold.
 *
 *   - Real Japanese sentences almost always contain two or more
 *     separate hiragana clusters (subject-marker は + verb ending ます,
 *     or any combination of particles). Even short ones like 田中さんは
 *     trip the rule via `さん` + `は`.
 *
 *   Trade-offs:
 *     - Single-particle Japanese fragments (`今日は`, `頑張って`) and
 *       single-word Japanese (`私の本`) won't trip the flag — accepted
 *       as out-of-context ambiguity that needs `options.language: "ja"`
 *       to disambiguate.
 *     - Pure-katakana brand names (`スターバックス`) and kana-only
 *       words (`ねこ`, `こんにちは`) don't need hanIsJa anyway: they
 *       carry no Han to mis-dispatch, and the character-share count
 *       below still puts `ja` on top so neutral runs route correctly.
 *
 * Primary language is the bucket with the most characters after han→ja
 * reassignment, or undefined when the text has no non-neutral chars at all.
 */
export interface TextAnalysis {
  /** Dominant language by character share; undefined for pure-neutral text. */
  primary?: string;
  /** When true, Han chars in this text should be routed as Japanese. */
  hanIsJa: boolean;
}

export function analyzeText(text: string): TextAnalysis {
  let kana = 0,
    han = 0,
    hangul = 0,
    cyrillic = 0,
    arabic = 0,
    thai = 0,
    latin = 0;
  let inHira = false,
    hiraClusters = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const isHira = code >= 0x3040 && code <= 0x309f;
    const isKata = code >= 0x30a0 && code <= 0x30ff;
    if (isHira) {
      if (!inHira) {
        hiraClusters++;
        inHira = true;
      }
      kana++;
    } else {
      inHira = false;
      if (isKata) kana++;
    }
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff)
    )
      han++;
    else if (code >= 0xac00 && code <= 0xd7af) hangul++;
    else if (code >= 0x0400 && code <= 0x04ff) cyrillic++;
    else if (code >= 0x0600 && code <= 0x06ff) arabic++;
    else if (code >= 0x0e00 && code <= 0x0e7f) thai++;
    else if (
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a) ||
      (code >= 0xc0 && code <= 0x024f)
    )
      latin++;
  }

  const hanIsJa = hiraClusters >= 2;
  const buckets: Array<[string, number]> = [
    ["ja", kana + (hanIsJa ? han : 0)],
    ["zh", hanIsJa ? 0 : han],
    ["ko", hangul],
    ["ru", cyrillic],
    ["ar", arabic],
    ["th", thai],
    ["en", latin],
  ];
  let best: [string, number] = ["", 0];
  for (const entry of buckets) {
    if (entry[1] > best[1]) best = entry;
  }
  return { primary: best[1] > 0 ? best[0] : undefined, hanIsJa };
}

export interface ScriptRun {
  text: string;
  /** Detected language code; empty string when the run contains only neutrals. */
  lang: string;
}

/**
 * Split text into script-based runs. Neutral characters (digits, whitespace,
 * punctuation) attach to the surrounding non-neutral run instead of starting
 * a new one, so e.g. `"我有 3 本书"` stays one Chinese run rather than
 * fragmenting into `[zh, en-digit, zh]`.
 *
 * Pass `hanIsJa: true` (typically from a prior `analyzeText` call) to route
 * Han chars through the Japanese path instead of the default Chinese path —
 * essential for Japanese prose, which mixes kanji with kana.
 */
export function splitByScript(
  text: string,
  options: { hanIsJa?: boolean } = {},
): ScriptRun[] {
  const hanLang = options.hanIsJa ? "ja" : "zh";
  const runs: ScriptRun[] = [];
  let current: ScriptRun | null = null;
  for (let i = 0; i < text.length; i++) {
    const lang = classifyChar(text.charCodeAt(i), hanLang);
    const ch = text[i];
    if (!current) {
      current = { text: ch, lang };
    } else if (lang === "" || lang === current.lang) {
      current.text += ch;
    } else if (current.lang === "") {
      current.text += ch;
      current.lang = lang;
    } else {
      runs.push(current);
      current = { text: ch, lang };
    }
  }
  if (current) runs.push(current);
  return runs;
}

/**
 * Run each script-run through its language processor's `preProcess`.
 *
 * Resolution order for each run's effective language:
 * 1. The run's own detected script (zh/ja/ko/…)
 * 2. The caller-supplied `defaultLang` (e.g. `options.language`)
 * 3. The document's primary language inferred by `analyzeText`
 *
 * Step 3 ensures that pure-neutral inputs like `"123"` get the right
 * expansion when the surrounding context (or another part of the same
 * call) is non-English.
 */
export function preProcessByScript(
  text: string,
  registry: LanguageRegistry,
  defaultLang?: string,
): string {
  const analysis = analyzeText(text);
  // An explicit user-supplied `ja*` overrides the kana-cluster heuristic:
  // for short Japanese fragments like `待っている` (single hiragana cluster)
  // analyzeText conservatively keeps Han on the zh path, but a caller
  // who has already declared the language wants Han to follow that lead.
  const hanIsJa =
    analysis.hanIsJa || (defaultLang?.toLowerCase().startsWith("ja") ?? false);
  const fallback = defaultLang ?? analysis.primary;
  const runs = splitByScript(text, { hanIsJa });
  let out = "";
  for (const run of runs) {
    const lang = run.lang || fallback;
    const processor = registry.findBestProcessor(run.text, lang);
    out += processor?.preProcess?.(run.text) ?? run.text;
  }
  return out;
}

// === Public API (default global registry wrappers) ===

/**
 * Register a language processor on the default global registry.
 *
 * For multi-instance setups, prefer `createPhonemizer()` from `./core`.
 */
export function useProcessor(processor: LanguageProcessor): void {
  languageRegistry.register(processor);
}

export function findProcessor(
  word: string,
  language?: string,
): LanguageProcessor | null {
  return languageRegistry.findBestProcessor(word, language);
}

export function predictPhonemes(
  word: string,
  language?: string,
  pos?: string,
): string | null {
  return languageRegistry.predictPhonemes(word, language, pos);
}

export function getRegisteredProcessorIds(): string[] {
  return languageRegistry.getAllProcessors().map((p) => p.id);
}

export function getProcessorsForLanguage(
  language: string,
): LanguageProcessor[] {
  return languageRegistry.getProcessorsForLanguage(language);
}

export function getSupportedLanguages(): string[] {
  return languageRegistry.getSupportedLanguages();
}
