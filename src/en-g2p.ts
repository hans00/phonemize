// The lookup table is the curated exceptions list (mined by
// scripts/mine-exceptions.ts, ~26K entries / 700 KB). It covers
// foreign-origin words and native English irregulars whose rule
// predictions deviate from the canonical dict. The legacy
// data/en/dict.json (2.7 MB) is no longer shipped or loaded — the rule
// pipeline plus this table reproduces the dict's lenient accuracy at
// ~26% of the size. See docs/g2p-redesign.md P5.
import * as lookupTable from "../data/en/exceptions.json";
import * as homographs from "../data/en/homographs.json";
import * as compoundParts from "../data/en/compound-parts.json";
import { arpabetToIpa, resolveJson } from "./utils";
import { LanguageProcessor } from "./g2p";
import { expandText } from "./expand-en";
import { simplePOSTagger, isFunctionWord, reduceToWeakForm } from "./pos-tagger";
import { transformAmericanToRP } from "./en-gb";
import { predictPrincipled } from "./en-principled";
import { applyPhonotactics } from "./en-phonotactics";
import { applyPostLexical, applyPostStress } from "./en-postlex";
import { assignStress, syllabify, syllableToIPA } from "./en-syllabify";

export type EnglishDialect = "en-US" | "en-GB";

// --- Type Definitions ---

type EnDict = Record<string, string>;

export interface HomographEntry {
  pronunciation: string;
  pos: string;
}

export interface HomographDict {
  [word: string]: HomographEntry[];
}

export interface TraceStep {
  grapheme: string;
  phoneme: string;
  rule: string;
}

export interface TraceResult {
  word: string;
  ipa: string;
  path: "dictionary" | "morphology" | "decomposition" | "rules";
  syllables?: string[];
  steps: TraceStep[];
}

// Shared lookup tables, re-keyed once onto null-prototype objects so
// that Object.prototype names ("constructor", "toString", "valueOf",
// …) can't leak through `dict[word]` when the word itself isn't an
// entry. Module-level so the copy happens once per process, keeping
// instance construction allocation-free.
const DICTIONARY: EnDict = Object.assign(
  Object.create(null),
  resolveJson<EnDict>(lookupTable),
);
const HOMOGRAPHS: HomographDict = Object.assign(
  Object.create(null),
  resolveJson<HomographDict>(homographs),
);
// Statistically-verified compound parts (scripts/mine-compound-parts.ts):
// heads/tails that earn ≥10% join-accuracy against the lexicon when
// paired with any verified partner. Both sides must match for a split.
const COMPOUND_PARTS = resolveJson<{ heads: EnDict; tails: EnDict }>(
  compoundParts,
);
const COMPOUND_HEADS: EnDict = Object.assign(
  Object.create(null),
  COMPOUND_PARTS.heads,
);
const COMPOUND_TAILS: EnDict = Object.assign(
  Object.create(null),
  COMPOUND_PARTS.tails,
);
// Boundary degemination for compound joins (book+kayak style overlaps).
const COMPOUND_GEMINATE_RE = /([pbtdkɡfvszʃʒθðmnŋɫɹ])(ˌ?)\1/g;

// --- Linguistics-based Constants ---

// Inseparable Latin/Anglo-Saxon prefixes: carry secondary stress, not primary.
// Excludes compound-head prefixes (super-, hyper-, ultra-, inter-, multi-, etc.)
// which keep primary stress on the leading element (ˈSUPERcar, ˈHYPERloop).
const EN_PREFIXES = new Set([
  "a",
  "ab",
  "ad",
  "anti",
  "be",
  "com",
  "con",
  "contra",
  "counter",
  "de",
  "dis",
  "em",
  "en",
  "ex",
  "il",
  "im",
  "in",
  "ir",
  "mis",
  "non",
  "pre",
  "pro",
  "re",
  "un",
]);

// --- EnglishG2P Class ---

// Pre-compiled regexes used in the hot predict() path. Defining them at
// module scope ensures the engine compiles each pattern exactly once
// and reuses the cached form across every call.
const BCP47_REGION_RE = /^en(?:-[a-z]{4})?-([a-z]{2}|\d{3})(?:$|-)/;
const PLAIN_L_RE = /l/g;
const STRESS_PRIMARY = /ˈ/g;

// Fast check for "does this string contain any uppercase ASCII char?".
// Returns true iff toLowerCase would change the string. Avoids the
// .toLowerCase() copy in the common all-lowercase case.
function needsLowerCase(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 65 && c <= 90) return true;
  }
  return false;
}

// True iff `ipa` has exactly one vowel nucleus (one run of vowel chars).
const MONO_VOWELS = "aeiouɑæɛɪɔʊʌəɝ";
function isMonosyllable(ipa: string): boolean {
  let nuclei = 0;
  let inV = false;
  for (let i = 0; i < ipa.length; i++) {
    if (MONO_VOWELS.indexOf(ipa[i]) >= 0) {
      if (!inV) { nuclei++; if (nuclei > 1) return false; }
      inV = true;
    } else inV = false;
  }
  return nuclei === 1;
}

// Regular English -s allomorph based on the final phoneme of `ipa`:
//   /ɪz/ after a sibilant (s z ʃ ʒ tʃ dʒ),
//   /s/  after a voiceless obstruent (p t k f θ),
//   /z/  otherwise (voiced consonant or vowel).
// Used for possessive/plural -'s. `ipa` may carry a trailing dark /ɫ/.
function sAllomorph(ipa: string): string {
  const last = ipa[ipa.length - 1];
  const prev = ipa[ipa.length - 2];
  // Sibilant affricates surface as tʃ/dʒ — check the two-char tail.
  if (last === "s" || last === "z" || last === "ʃ" || last === "ʒ" ||
      (prev === "t" && last === "ʃ") || (prev === "d" && last === "ʒ")) {
    return "ɪz";
  }
  if (last === "p" || last === "t" || last === "k" || last === "f" || last === "θ") {
    return "s";
  }
  return "z";
}

export class EnglishG2P implements LanguageProcessor {
  private dictionary: EnDict;
  /**
   * Per-instance custom pronunciations. We keep these separate from
   * `this.dictionary` (which references the shared module-level JSON
   * object) so that `addPronunciation()` on one instance doesn't leak
   * to other instances created in the same process.
   */
  private customDict: EnDict = Object.create(null);
  private homographs: HomographDict;
  private disableDict: boolean;
  private dialect: EnglishDialect;
  /**
   * Opt-in: route through the principled pipeline (en-principled) when it
   * produces output. Off by default — the existing predictInternal +
   * postBase path is the well-tested production code. When this flag is
   * on, the principled pipeline runs FIRST for each word; if it returns
   * non-null, its output is used (skipping the legacy path entirely).
   */
  private enablePrincipled: boolean;

  // LanguageProcessor interface implementation
  readonly id = "en-g2p";
  readonly name = "English G2P Processor";
  /**
   * Accepts the bare `en` tag plus both major dialects. The same
   * instance can serve both — see `predict()` for per-call dispatch.
   */
  readonly supportedLanguages = ["en", "en-US", "en-GB"];

  constructor(
    options: {
      disableDict?: boolean;
      dialect?: EnglishDialect;
      enablePrincipled?: boolean;
    } = {},
  ) {
    this.disableDict = options.disableDict || false;
    this.dialect = options.dialect ?? "en-US";
    this.enablePrincipled = options.enablePrincipled || false;
    // Share the module-level null-prototype tables across instances.
    // Both are read-only at runtime (writes go to this.customDict).
    this.dictionary = DICTIONARY;
    this.homographs = HOMOGRAPHS;
  }

  /**
   * Expand numbers, abbreviations, currency, dates, times, etc. into
   * spoken English form before tokenization.
   */
  preProcess(text: string): string {
    return expandText(text);
  }

  /**
   * Per-word POS tagging for homograph disambiguation (read/lead/wind/…).
   * Delegates to the rule-based simplePOSTagger in pos-tagger.ts, which
   * is English-only by design — other languages plug in their own tagger
   * via LanguageProcessor.tagWord if they need POS.
   */
  tagWord(
    word: string,
    context?: { prev?: string; next?: string },
  ): { pos: string; confidence: number } {
    const ctx = [context?.prev ?? "", context?.next ?? ""].filter((w) => w);
    const result = simplePOSTagger.tagWord(word, ctx);
    return { pos: result.pos, confidence: result.confidence };
  }

  predict(word: string, language?: string, pos?: string): string | null {
    // Language tag handling. Fast-path "en"/"en-us"/"en-gb" before
    // falling back to the BCP-47 regex parser. toLowerCase is needed
    // because tags are case-insensitive ("en-GB" must match "en-gb").
    let dialect: EnglishDialect = this.dialect;
    if (language !== undefined) {
      const tag = language.toLowerCase();
      if (tag === "en") {
        // plain "en" — use instance default
      } else if (tag === "en-us") {
        dialect = "en-US";
      } else if (tag === "en-gb") {
        dialect = "en-GB";
      } else {
        const dashAt = tag.indexOf("-");
        if (dashAt < 0) {
          // Non-English single-tag → reject.
          return null;
        }
        const primary = tag.slice(0, dashAt);
        if (primary !== "en") return null;
        // Complex BCP-47 (e.g. en-Latn-GB, en-US-x-foo): regex parse.
        const regionMatch = BCP47_REGION_RE.exec(tag);
        const region = regionMatch?.[1];
        if (region === "gb") dialect = "en-GB";
        else if (region === "us") dialect = "en-US";
      }
    }

    // User-supplied custom pronunciations short-circuit dialect
    // routing: if the caller explicitly set a pronunciation via
    // addPronunciation(), they presumably picked one that's right
    // for their use case. Don't run the RP transform over it.
    const lowerWord = word.toLowerCase();
    const custom = this.customDict[lowerWord];
    if (custom !== undefined) return custom;

    // Clitic contractions and possessives: split at a trailing
    // apostrophe, predict the stem, and append the clitic's phonemes.
    // Without this the whole token ("island's", "I'm", "we'll") misses
    // every lookup and the rules mangle it (island's → /ɪˈsɫænds/,
    // I'm → /ɪm/, we'll → /wɛɫ/). The apostrophe (straight ' or curly ’)
    // must sit near the end, so word-internal ones (o'clock, y'all) are
    // left for the normal path.
    //   -'s → -s allomorph (possessive / is / has)   island's → …ndz
    //   -'m → /m/ (am)        I'm   → /aɪm/
    //   -'ll → /l/ (will)     we'll → /wil/
    //   -'ve → /v/ (have)     I've  → /aɪv/
    //   -'d → /d/ (would/had) I'd   → /aɪd/
    //   -'re → /ɝ/ (are)      you're → /juɝ/
    const aposAt = lowerWord.search(/['’]/);
    if (aposAt > 0 && aposAt >= lowerWord.length - 3) {
      const tail = lowerWord.slice(aposAt + 1);
      const stem = lowerWord.slice(0, aposAt);
      const clitic =
        tail === "m" ? "m" :
        tail === "ll" ? "l" :
        tail === "ve" ? "v" :
        tail === "d" ? "d" :
        tail === "re" ? "ɝ" :
        undefined;
      if (clitic !== undefined) {
        const stemIpa = this.predict(stem, language, pos);
        if (stemIpa) return stemIpa + clitic;
      }
      if (tail === "s") {
        const stemIpa = this.predict(stem, language, pos);
        if (stemIpa) return stemIpa + sAllomorph(stemIpa);
      }
      // Bare trailing apostrophe = plural possessive (accountants',
      // dogs'): the stem already carries its plural -s, and the
      // possessive adds no segment.
      if (tail === "") {
        const stemIpa = this.predict(stem, language, pos);
        if (stemIpa) return stemIpa;
      }
    }

    // Principled pipeline (opt-in). See class field doc + P5 status.
    if (this.enablePrincipled && !this.disableDict) {
      const principled = predictPrincipled(lowerWord, (w: string) => {
        return this.customDict[w] ?? this.dictionary[w];
      });
      if (principled) return principled.ipa;
    }

    const base = this.predictInternal(word, pos, this.disableDict);
    if (!base) return base;

    // Universal phonotactic post-processing (en-phonotactics.ts).
    // Each rule self-guards with a cheap pre-check; the dispatcher
    // costs roughly O(rule-count) substring scans when nothing fires.
    const postBase = applyPhonotactics(base, lowerWord);

    let out = dialect === "en-GB" ? transformAmericanToRP(word, postBase) : postBase;
    // Final dark-l replacement: the lexicon writes /l/ uniformly
    // velarized (ɫ) in every position, so both paths emit all-dark.
    // (An onset-cluster clear-l pass lived here briefly; it was an
    // ɫ↔l-equivalent notational choice that diverged from the lexicon
    // on ~5.4k words, so it was dropped when strict parity became the
    // target.) PLAIN_L_RE is module-level so the regex compiles once.
    if (out.indexOf("l") >= 0) out = out.replace(PLAIN_L_RE, "ɫ");

    // Connected-speech weak form for function words. `pos` is only
    // supplied by the tokenizer in multi-word context (it's left
    // undefined for isolated/citation lookups), so this reduces "for"
    // → /fɝ/ and "and" → /ənd/ inside a sentence while keeping the
    // citation /ˈfɔɹ/, /ˈænd/ for a lone word. reduceToWeakForm is a
    // no-op for words it can't reduce (he/you/this/diphthongs).
    //
    // Connected-speech prosody (only when `pos` is supplied, i.e. the
    // tokenizer is processing multi-word text; a lone/citation word keeps
    // its full marks).
    if (pos !== undefined) {
      // Function words reduce to their weak form ("for" → /fɝ/).
      if (isFunctionWord(lowerWord, pos)) return reduceToWeakForm(out);
      // Mark stress only where it is contrastive: a monosyllable has a
      // single syllable, so the primary-stress mark conveys no placement
      // information and just makes running text read as over-stressed.
      // Drop it in connected context. The content/function distinction
      // and homograph disambiguation survive in vowel quality (content
      // words keep full vowels /kæt/, /ɹid/ vs /ɹɛd/; function words
      // reduce /ðə/). Polysyllables keep their mark, where placement IS
      // contrastive (ˈɹɛkɔɹd vs ɹɪˈkɔɹd).
      if (isMonosyllable(out)) return out.replace(STRESS_PRIMARY, "");
    }
    return out;
  }

  public trace(word: string, language?: string, pos?: string): TraceResult {
    const lowerWord = word.toLowerCase();
    const ipa = this.predict(word, language, pos) ?? lowerWord;

    if (!this.disableDict) {
      if (pos && Array.isArray(this.homographs[lowerWord])) {
        if (
          this.homographs[lowerWord].find((entry: HomographEntry) =>
            this.matchPos(entry, pos),
          )
        )
          return {
            word,
            ipa,
            path: "dictionary",
            steps: [{ grapheme: word, phoneme: ipa, rule: "homograph" }],
          };
      }
      if (this.customDict[lowerWord])
        return {
          word,
          ipa,
          path: "dictionary",
          steps: [{ grapheme: word, phoneme: ipa, rule: "custom-dict" }],
        };
      if (this.dictionary[lowerWord])
        return {
          word,
          ipa,
          path: "dictionary",
          steps: [{ grapheme: word, phoneme: ipa, rule: "dict" }],
        };
    }

    if (this.tryMorphologicalAnalysis(lowerWord))
      return {
        word,
        ipa,
        path: "morphology",
        steps: [{ grapheme: word, phoneme: ipa, rule: "morphology" }],
      };

    const decomp = this.tryDecomposition(lowerWord);
    if (decomp && decomp.length > 1) {
      const prons = decomp.map((p) => this.wellKnown(p));
      if (prons.every((p) => p))
        return {
          word,
          ipa,
          path: "decomposition",
          steps: decomp.map((part, i) => ({
            grapheme: part,
            phoneme: prons[i]!,
            rule: "decomposition",
          })),
        };
    }

    const syllables = syllabify(lowerWord);
    const stressedIdx = assignStress(syllables, lowerWord);
    const traceSteps: TraceStep[] = [];
    syllables.forEach((syl, i) => {
      syllableToIPA(
        syl,
        i,
        i === stressedIdx,
        i === syllables.length - 1,
        i < syllables.length - 1 ? syllables[i + 1] : undefined,
        traceSteps,
        i > 0 ? syllables[i - 1] : undefined,
        i === syllables.length - 2,
      );
    });

    return { word, ipa, path: "rules", syllables, steps: traceSteps };
  }

  private predictInternal(
    word: string,
    pos?: string,
    disableDict?: boolean,
  ): string {
    // Avoid re-allocating lowerWord when the caller already lowercased
    // (true for predict() which is the dominant entry point). Most words
    // arrive lowercase already, so toLowerCase would just create a copy.
    const lowerWord = needsLowerCase(word) ? word.toLowerCase() : word;

    // Priority 1: Handle hyphenated compounds. Cheap indexOf gate before
    // allocating the split-array.
    const dashAt = lowerWord.indexOf("-");
    if (dashAt > 0 && dashAt < lowerWord.length - 1 &&
        lowerWord.indexOf("-", dashAt + 1) < 0) {
      const part1 = this.predictInternal(lowerWord.slice(0, dashAt), pos, disableDict);
      const part2 = this.predictInternal(lowerWord.slice(dashAt + 1), pos, disableDict);
      if (part1 && part2) {
        // Compound stress: strip primary from each part, add a single
        // primary at the joint.
        return part1.replace(STRESS_PRIMARY, "") + "ˈ" + part2.replace(STRESS_PRIMARY, "");
      }
    }

    // Priority 2: Direct lookups (Dictionary, Homographs) - check known words first
    if (!disableDict) {
      const knownPronunciation = this.wellKnown(lowerWord, pos, true); // Skip morphology here to avoid re-running
      if (knownPronunciation) {
        return knownPronunciation;
      }
    }

    // Priority 3: Morphological analysis - only for unknown words
    const morphPron = this.tryMorphologicalAnalysis(lowerWord);
    if (morphPron) {
      // Same stress-mark convention repair as the rule branch below —
      // morphology output joins a stem (dict- or rule-derived) with an
      // allomorph and can need suffix secondary stress / the -ation
      // primary shift too. All transforms are idempotent and no-op on
      // already-marked dict-derived stems.
      return applyPostStress(morphPron, lowerWord);
    }

    // Priority 4: Language-specific G2P - removed as per new architecture

    // Priority 5a: Two-part compound split against the mined parts
    // tables. Both halves must be independently verified parts; the
    // join follows the lexicon's compound convention (head keeps ˈ,
    // tail's primary demotes to ˌ, boundary geminates collapse).
    const compound = this.tryCompoundSplit(lowerWord);
    if (compound) return compound;

    // Priority 5: Attempt to decompose the word into known dictionary parts
    const decomposition = this.tryDecomposition(lowerWord);
    if (decomposition && decomposition.length > 1) {
      const pronunciations = decomposition.map((part) => this.wellKnown(part));
      if (pronunciations.every((p) => p)) {
        // Stress in compounds and prefixed forms: exactly one primary
        // stress on the head, secondary on the rest. The head is the
        // semantic root — for noun compounds (light+house) that's the
        // first element, for prefix+stem (in+dispense, un+happy) it's
        // the stem (skip the prefix). Internal stress within the head
        // part is preserved verbatim; other parts have their ˈ demoted
        // to ˌ. This replaces the previous behavior of slapping
        // primary stress on every part, which produced multi-stress
        // outputs like ˈɪnˈdaɪˈspɛnsəbəl.
        const headIdx =
          decomposition.length > 1 && EN_PREFIXES.has(decomposition[0]) ? 1 : 0;
        return pronunciations
          .map((p, idx) => {
            if (!p) return "";
            if (idx === headIdx) return p;
            return p.replace(/ˈ/g, "ˌ");
          })
          .join("");
      }
    }

    // Priority 6: Handle acronyms with or without periods, e.g., "TTS" or "M.L."
    const acronymMatch = word.match(/^([A-Z]\.?){2,8}$/);
    if (acronymMatch) {
      const containsPeriods = word.includes(".");
      const letters = word.replace(/\./g, "").split("");
      const letterPronunciations = letters.map((letter) =>
        this.wellKnown(letter.toLowerCase()),
      );
      if (letterPronunciations.every((p) => p)) {
        if (containsPeriods) {
          // No stress for acronyms with periods like M.L.
          return letterPronunciations.map((p) => p?.replace(/ˈ/g, "")).join("");
        } else {
          // Add stress for acronyms without periods like TTS
          return letterPronunciations
            .map((p) => `ˈ${p?.replace(/ˈ/g, "")}`)
            .join("");
        }
      }
    }

    // Priority 7: Improved syllabification and rule-based G2P
    const syllables = syllabify(lowerWord);
    const stressedSyllableIndex = assignStress(syllables, lowerWord);

    const syllableIPA = syllables.map((s, i) => {
      const isStressed = i === stressedSyllableIndex;
      const isLastSyllable = i === syllables.length - 1;
      return syllableToIPA(
        s,
        i,
        isStressed,
        isLastSyllable,
        i < syllables.length - 1 ? syllables[i + 1] : undefined,
        undefined,
        i > 0 ? syllables[i - 1] : undefined,
        i === syllables.length - 2,
      );
    });

    if (syllableIPA.length > 0) {
      let result = syllableIPA.join("");
      result = applyPostLexical(result, lowerWord, syllables.length);

      // Add primary-stress marker. Emit for monosyllables too — content
      // words like "world", "knight", "wood" have lexical stress (the
      // dict marks it for citation form). Function-word demotion happens
      // at the tokenizer level once we know we're in sentence context.
      if (syllables.length > 0 && stressedSyllableIndex >= 0) {
        let charIndex = 0;
        for (let i = 0; i < stressedSyllableIndex; i++) {
          charIndex += syllableIPA[i].length;
        }
        result =
          result.substring(0, charIndex) + "ˈ" + result.substring(charIndex);
      }

      // Stress-mark convention repair (onset maximization, suffix
      // secondary stress, -ation primary shift) — needs the mark, so
      // it runs after insertion. Rule-path only by construction.
      return applyPostStress(result, lowerWord);
    }

    // Final fallback: just spell it out (should be rare)
    return lowerWord;
  }

  private matchPos(entry: HomographEntry, pos: string): boolean {
    if (entry.pos === pos) {
      return true;
    }
    if (entry.pos.startsWith("!") && entry.pos.substring(1) !== pos) {
      return true;
    }
    return false;
  }

  private wellKnown(
    word: string,
    pos?: string,
    skipMorphology = false,
  ): string | undefined {
    if (pos && Array.isArray(this.homographs[word])) {
      const homograph = this.homographs[word].find((entry: HomographEntry) =>
        this.matchPos(entry, pos),
      );
      if (homograph) {
        return homograph.pronunciation;
      }
    }
    if (this.customDict[word]) {
      return this.customDict[word];
    }
    if (this.dictionary[word]) {
      return this.dictionary[word];
    }

    if (skipMorphology) {
      return undefined;
    }
    // Morphological analysis for common endings
    return this.tryMorphologicalAnalysis(word);
  }

  private tryMorphologicalAnalysis(word: string): string | undefined {
    const lowerWord = word.toLowerCase();
    const sPlural = (p: string): string => p + sAllomorph(p);
    const edPast = (p: string): string => {
      const last = p.slice(-1);
      return ["t", "d"].includes(last)
        ? p + "ɪd"
        : ["p", "k", "s", "ʃ", "f", "θ"].includes(last)
          ? p + "t"
          : p + "d";
    };
    /**
     * Shared lookup ladder for regular inflections (-ed/-ing): silent-e
     * stem (consonant-final bases only) → bare base → doubled-consonant
     * base (stopped→stop) → unconditional +e stem → optionally the
     * rule-predicted +e/bare stem. Each handler keeps its original
     * step order via this single sequence; `join` attaches the
     * allomorph.
     */
    const inflect = (
      sfxLen: number,
      join: (p: string) => string,
      ruleFallback: boolean,
    ): string | undefined => {
      const base = lowerWord.slice(0, -sfxLen);
      if (!/[aeiou]$/.test(base)) {
        const m = this.wellKnown(base + "e");
        if (m) return join(m);
      } // magic-e: coded→code, baking→bake
      const basePron = this.wellKnown(base);
      if (basePron) return join(basePron);
      // Doubled-consonant base: the two chars before the suffix are
      // identical (stopped → stop, planned → plan).
      if (
        lowerWord.length > 4 &&
        lowerWord.slice(-(sfxLen + 2), -(sfxLen + 1)) ===
          lowerWord.slice(-(sfxLen + 1), -sfxLen)
      ) {
        const p = this.wellKnown(lowerWord.slice(0, -(sfxLen + 1)));
        if (p) return join(p);
      }
      const magicPron = this.wellKnown(base + "e");
      if (magicPron) return join(magicPron);
      // Dict lookup failed for the stem because it is a regular word the
      // rules already handle, so it was never memorized as an exception
      // (ask, form, …). Rule-predict the stem and attach the allomorph —
      // this avoids the syllabifier mis-splitting the whole inflected
      // form (asked → [a][sked] → /æzd/). Guard: the stem must contain a
      // vowel and end in a consonant, so a root-final suffix with a
      // vowelless stem (bled, sped, fled) is left for the normal path.
      // Try the silent-e-restored stem first (advanced → advance,
      // placed → place); for stems with no silent e the +e form is
      // harmless ("aske" and "forme" predict the same /æsk/, /fɔɹm/).
      if (ruleFallback && /[aeiou]/.test(base) && !/[aeiou]$/.test(base)) {
        const ruleBaseE = this.predictInternal(base + "e", undefined, true);
        if (ruleBaseE) return join(ruleBaseE);
        const ruleBase = this.predictInternal(base, undefined, true);
        if (ruleBase) return join(ruleBase);
      }
      return undefined;
    };

    if (
      /['''']$/.test(lowerWord) &&
      lowerWord.length > 2 &&
      !/['''']s$/.test(lowerWord)
    ) {
      const basePron = this.wellKnown(lowerWord.replace(/['''']$/, ""));
      if (basePron) return basePron;
    }
    if (
      lowerWord.endsWith("s") &&
      !lowerWord.endsWith("ss") &&
      lowerWord.length > 2
    ) {
      const basePron = this.wellKnown(lowerWord.slice(0, -1));
      if (basePron) return sPlural(basePron);
    }
    if (/['''']s$/.test(lowerWord) && lowerWord.length > 3) {
      const basePron = this.wellKnown(lowerWord.slice(0, -2));
      if (basePron) return sPlural(basePron);
    }
    if (lowerWord.endsWith("es") && lowerWord.length > 3) {
      const basePron = this.wellKnown(lowerWord.slice(0, -2));
      if (basePron) return basePron + "ɪz";
    }

    // y-stem family: restore the -y the suffix replaced (tried → try,
    // happiness → happy), look the stem up, attach the allomorph.
    for (const [sfx, join] of [
      ["ied", edPast],
      ["ies", sPlural],
      ["ier", (p: string) => p + "ɝ"],
      ["iness", (p: string) => p + "nəs"],
      ["iest", (p: string) => p + "əst"],
    ] as [string, (p: string) => string][]) {
      if (!lowerWord.endsWith(sfx) || lowerWord.length <= sfx.length + 1)
        continue;
      const basePron = this.wellKnown(lowerWord.slice(0, -sfx.length) + "y");
      if (basePron) return join(basePron);
    }

    if (lowerWord.endsWith("er") && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      const magicPron = this.wellKnown(base + "e");
      if (magicPron) {
        const magicClean = magicPron.replace(/[ˈˌ]/g, '');
        if (magicClean.endsWith('ndʒ')) {
          const directPron = this.wellKnown(base);
          if (directPron) {
            const directClean = directPron.replace(/[ˈˌ]/g, '');
            const mb = magicClean.replace(/ndʒ$/, '');
            const db = directClean.replace(/ŋ$/, '');
            const pc = (s: string) => s.replace(/ɔ/g, 'ɑ').replace(/ʌ/g, 'ə').replace(/ɪ/g, 'i');
            if (pc(mb) === pc(db)) return directClean + 'ɝ';
          }
        }
        return magicPron + 'ɝ';
      }
    }

    if (lowerWord.endsWith("ed") && lowerWord.length > 3) {
      const p = inflect(2, edPast, true);
      if (p) return p;
    }

    if (lowerWord.endsWith("ing") && lowerWord.length > 4) {
      const p = inflect(3, (b) => b + "ɪŋ", false);
      if (p) return p;
    }

    if (lowerWord.endsWith("ally") && lowerWord.length > 6) {
      const base2 = lowerWord.slice(0, -2);
      let basePron = this.wellKnown(base2, undefined, true);
      if (!basePron) {
        const base4 = lowerWord.slice(0, -4);
        basePron =
          this.wellKnown(base4, undefined, true) ||
          this.predictInternal(base4, undefined, false);
      }
      if (basePron) {
        if (/[lɫ]$/.test(basePron)) return basePron + "i";
        return basePron.replace(/ə$/, "") + "əli";
      }
    }
    if (
      lowerWord.endsWith("ly") &&
      !lowerWord.endsWith("ally") &&
      lowerWord.length > 4
    ) {
      const basePron =
        this.wellKnown(lowerWord.slice(0, -2), undefined, true) ||
        this.predictInternal(lowerWord.slice(0, -2), undefined, false);
      if (basePron)
        return /[lɫ]$/.test(basePron) ? basePron + "i" : basePron + "li";
    }

    if (lowerWord.endsWith("able") && lowerWord.length > 6) {
      let base = lowerWord.slice(0, -4);
      if (!/[aeiour]$/.test(base) && !this.wellKnown(base, undefined, true)) {
        const m = this.wellKnown(base + "e", undefined, true);
        if (m) return m.replace(/ə$/, "") + "əbəl";
      } // magic-e: advisable→advise
      let basePron =
        this.wellKnown(base, undefined, true) ||
        this.predictInternal(base, undefined, false);
      if (basePron) return basePron.replace(/ə$/, "") + "əbəl";
      base = lowerWord.slice(0, -3);
      basePron =
        this.wellKnown(base, undefined, true) ||
        this.predictInternal(base, undefined, false);
      if (basePron) return basePron + "əbəl";
    }

    if (lowerWord.endsWith("logy") && lowerWord.length > 6) {
      const bp =
        this.wellKnown(lowerWord.slice(0, -4), undefined, true) ||
        this.predictInternal(lowerWord.slice(0, -4), undefined, false);
      if (bp)
        return lowerWord.slice(-5, -4) === "o"
          ? bp.replace(/ˈ/g, "ˌ").replace(/oʊ$/, "").replace(/[ˈˌ]$/, "") +
              "ˈɑlədʒi"
          : bp.replace(/ə$/, "") + "lədʒi";
    }
    if (
      (lowerWord.endsWith("cial") ||
        (!lowerWord.endsWith("stial") && lowerWord.endsWith("tial"))) &&
      lowerWord.length > 5
    ) {
      const bp = lowerWord.slice(0, -4),
        pp =
          this.wellKnown(bp, undefined, true) ||
          this.predictInternal(bp, undefined, false);
      if (pp && /[aeiouæɑɔɛɪʊʌɝə]/.test(pp)) return pp + "ʃəl";
    }
    if (lowerWord.endsWith("ization") && lowerWord.length > 9) {
      const b = this.wellKnown(lowerWord.slice(0, -7), undefined, true);
      if (b) return b.replace(/ˈ/g, "ˌ") + "əˌzeɪʃən";
    }
    if (lowerWord.endsWith("ation") && lowerWord.length > 7) {
      const b = lowerWord.slice(0, -5),
        ate = this.wellKnown(b + "ate", undefined, true),
        src = this.wellKnown(b, undefined, true);
      if (ate)
        return (
          (ate.match(/eɪt$/) ? ate.slice(0, -1) : ate.replace(/[ɪə]t$/, "eɪ")) +
          "ʃən"
        );
      if (src) return src + "eɪʃən";
    }
    if (
      (lowerWord.endsWith("ance") || lowerWord.endsWith("ence")) &&
      lowerWord.length > 7
    ) {
      const b = lowerWord.slice(0, -4),
        p =
          this.wellKnown(b, undefined, true) ||
          (b.endsWith("i")
            ? this.wellKnown(b.slice(0, -1) + "y", undefined, true)
            : undefined) ||
          (!b.endsWith("id")
            ? this.wellKnown(b + "e", undefined, true)
            : undefined);
      if (p) return p + "əns";
    }
    if (
      lowerWord.endsWith("ual") &&
      !lowerWord.endsWith("gual") &&
      lowerWord.length > 5 &&
      !(lowerWord.endsWith("tual") && lowerWord.length > 6)
    ) {
      const b = lowerWord.slice(0, -3),
        p =
          this.wellKnown(b, undefined, true) ||
          this.predictInternal(b, undefined, false);
      if (p) return p.replace(/[uʊ]$/, "") + "uəl";
    }
    for (const [sfx, ipa] of [
      ["ify", "əˌfaɪ"],
      ["tual", "tʃuəl"],
      ["tuous", "tʃuəs"],
      ["ulation", "jəleɪʃən"],
      ["ulator", "jəleɪtɝ"],
      ["ulate", "jəleɪt"],
      ["ular", "jəlɝ"],
      ["ment", "mənt"],
      ["ness", "nəs"],
      ["less", "ləs"],
      ["ful", "fəl"],
      ["ize", "aɪz"],
      ["ist", "ɪst"],
      ["ism", "ɪzəm"],
      ["al", "əl"],
    ] as [string, string][]) {
      if (!lowerWord.endsWith(sfx) || lowerWord.length <= sfx.length + 2)
        continue;
      const b = lowerWord.slice(0, -sfx.length),
        p =
          this.wellKnown(b, undefined, true) ||
          this.predictInternal(b, undefined, false);
      if (p) return p + ipa;
    }

    return undefined;
  }

  /**
   * Two-part compound split using the mined head/tail tables. Picks
   * the split with the most balanced halves (longest minimum part).
   * A doubled consonant at the boundary signals suffixing rather than
   * compounding (abet|ting) and rejects the split point.
   */
  private tryCompoundSplit(word: string): string | undefined {
    if (word.length < 7) return undefined;
    let head: string | undefined;
    let tail: string | undefined;
    let bestScore = -1;
    for (let i = 3; i <= word.length - 4; i++) {
      if (word[i - 1] === word[i]) continue;
      const a = word.slice(0, i);
      const b = word.slice(i);
      if (COMPOUND_HEADS[a] === undefined || COMPOUND_TAILS[b] === undefined)
        continue;
      const score = Math.min(a.length, b.length);
      if (score > bestScore) {
        bestScore = score;
        head = a;
        tail = b;
      }
    }
    if (head === undefined || tail === undefined) return undefined;
    return (
      COMPOUND_HEADS[head] + COMPOUND_TAILS[tail].replace(/ˈ/g, "ˌ")
    ).replace(COMPOUND_GEMINATE_RE, "$2$1");
  }

  private tryDecomposition(word: string): string[] | undefined {
    if (word.length < 8) return undefined; // Only try decomposition for reasonably long words

    // DP approach to find a valid decomposition into dictionary words.
    const dp: (string[] | undefined)[] = Array(word.length + 1).fill(undefined);
    dp[0] = [];

    for (let i = 1; i <= word.length; i++) {
      for (let j = 0; j < i; j++) {
        // Prioritize longer chunks
        const chunk = word.substring(j, i);
        if (dp[j] !== undefined && chunk.length >= 3 && this.dictionary[chunk]) {
          const newDecomposition = [...dp[j]!, chunk];
          // Prefer decompositions with fewer (longer) words.
          if (!dp[i] || newDecomposition.length < dp[i]!.length) {
            dp[i] = newDecomposition;
          }
        }
      }
    }
    return dp[word.length];
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (!pronunciation.match(/^[A-Z0-9]+$/)) {
      pronunciation = arpabetToIpa(pronunciation);
    }
    this.customDict[word.toLowerCase()] = pronunciation;
  }
}

export default EnglishG2P;
