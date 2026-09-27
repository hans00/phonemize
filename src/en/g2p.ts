// The lookup table is the curated exceptions list (mined by
// scripts/mine-exceptions.ts, ~26K entries / 700 KB). It covers
// foreign-origin words and native English irregulars whose rule
// predictions deviate from the canonical dict. The legacy
// data/en/dict.json (2.7 MB) is no longer shipped or loaded — the rule
// pipeline plus this table reproduces the dict's lenient accuracy at
// ~26% of the size. See docs/g2p-redesign.md P5.
import * as lookupTable from "../../data/en/exceptions.json";
import * as initialismTable from "../../data/en/initialisms.json";
import * as homographs from "../../data/en/homographs.json";
import * as compoundParts from "../../data/en/compound-parts.json";
import { arpabetToIpa, resolveJson, LICIT_ONSETS } from "../utils";
import { LanguageProcessor } from "../g2p";
import { expandText } from "./expand";
import { simplePOSTagger, isFunctionWord, reduceToWeakForm } from "./pos-tagger";
import { transformAmericanToRP } from "./gb";
import { predictPrincipled } from "./principled";
import { applyPhonotactics } from "./phonotactics";
import { applyPostLexical, applyPostStress, hiatusMarkOffset } from "./postlex";
import {
  assignStress,
  secondaryStressIndices,
  syllabify,
  syllableToIPA,
  isHiatusSlot,
} from "./syllabify";

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

// Move the primary onto a word-final /eɪ/ (the -ation suffix syllable):
// every existing primary demotes to secondary, marks inside the consonant
// run before /eɪ/ are dropped, and the new mark goes before the longest
// licit onset of that run.
const VOWEL_CHAR = /[aeiouæɑɔəɛɪʊʌɝ]/;
function suffixPrimary(ipa: string): string {
  const s = ipa.replace(/ˈ/g, "ˌ");
  const v = s.length - 2;
  let k = v;
  while (k > 0 && !VOWEL_CHAR.test(s[k - 1])) k--;
  const run = s.slice(k, v).replace(/[ˈˌ]/g, "").match(/tʃ|dʒ|./g) ?? [];
  let split = run.length;
  while (split > 0 && LICIT_ONSETS.has(run.slice(split - 1).join("").replace(/ɫ/g, "l"))) split--;
  // A bare /ɹ/ right after an unstressed /ɪ/ or /ə/ is a coalescing
  // rhotic (generate → generation), not a real onset consonant to pull
  // into the new syllable: maximizing it onto the suffix (…ɛnˈɹeɪʃən)
  // strands the mark BETWEEN /ɪ/ and /ɹ/, which permanently blocks the
  // later unstressed-/ɪɹ/→/ɝ/ phonotactic pass from ever rejoining them
  // (dict: …ɛnɝˈeɪʃən). Leaving the pair adjacent is the same convention
  // applyPostStress's own onset-maximization already keeps for the
  // whole-word path (postlex's ONSET_MAX_1_RE exception).
  if (split === 0 && k > 0 && run[0] === "ɹ" && /[ɪə]/.test(s[k - 1])) split = 1;
  if (k === 0) split = 0;
  return s.slice(0, k) + run.slice(0, split).join("") + "ˈ" + run.slice(split).join("") + s.slice(v);
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
// Spelled letter names are valid whole-token readings, not lexical stems
// for morphology or compound decomposition (GA must not become gas).
const INITIALISMS: EnDict = Object.assign(
  Object.create(null),
  resolveJson<EnDict>(initialismTable),
);
function spellInitialism(word: string): string | undefined {
  if (!/^([A-Z]\.?){2,8}$/.test(word)) return undefined;
  const letters = word.replace(/\./g, "").split("");
  const pronunciations = letters.map((letter) => INITIALISMS[letter.toLowerCase()]);
  if (!pronunciations.every(Boolean)) return undefined;
  const stress = word.includes(".") ? "" : "ˈ";
  return pronunciations.map((ipa) => stress + ipa.replace(/[ˈˌ]/g, "")).join("");
}
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
const EN_PREFIXES = new Set(
  "a ab ad anti be com con contra counter de dis em en ex il im in ir mis non pre pro re un".split(" "),
);

// --- EnglishG2P Class ---

// Pre-compiled regexes used in the hot predict() path. Defining them at
// module scope ensures the engine compiles each pattern exactly once
// and reuses the cached form across every call.
const BCP47_REGION_RE = /^en(?:-[a-z]{4})?-([a-z]{2}|\d{3})(?:$|-)/;
const PLAIN_L_RE = /l/g;
const STRESS_PRIMARY = /ˈ/g;
// Word-final doubled consonant whose single-consonant form is at least
// four letters (Seann → sean, Jonn → jon). See geminateVariant for why
// shorter stems are excluded.
// Clitic spellings and the segment each appends to the stem; -'s takes
// the plural allomorph instead of a fixed segment.
const CLITICS: Record<string, string> = {
  m: "m", ll: "l", ve: "v", d: "d", re: "ɝ", s: "", "": "",
};

const FINAL_GEMINATE_RE = /^[a-z]{3,}([bdfgklmnprstz])\1$/;

// True when the primary stress sits on the last vowel nucleus of `ipa`.
const FINAL_STRESS_RE = /ˈ[^aeiouɑæɛɪɔʊʌəɝ]*[aeiouɑæɛɪɔʊʌəɝ]+[^aeiouɑæɛɪɔʊʌəɝ]*$/;

/** The degeminated form of a word ending in a doubled consonant, else null. */
function geminateStem(word: string): string | null {
  return FINAL_GEMINATE_RE.test(word) ? word.slice(0, -1) : null;
}

// A restored silent-e candidate is only a real silent e when the resulting
// pronunciation still ends in a consonant; a vowel-final result means the
// hit is a pronounced-e loanword instead (passé, café), not a magic-e stem.
// Shared by every morphology handler below that restores a dropped -e.
const ENDS_IN_VOWEL_RE = /[aeiouɑæɛɪɔʊʌəɝ]$/;

// A stripped -ed/-ing base is only a PLAUSIBLE dropped-e spelling when its
// ending is one English silent e can actually follow. That's not just the
// classic single-consonant case (hop→hopped vs hope→hoped, so a bare
// "V+single-consonant" tail is a candidate): a handful of consonant
// CLUSTERS also carry a silent e productively — c/g/s/v soften or voice
// only before e (announce, abridge, cause, involve), a syllabic l needs it
// to spell the schwa (amble, crackle) and -st/-th are two more attested
// closed-cluster + e endings (paste, soothe). Every OTHER cluster — sk,
// ct, rm, rt, nt, nd, mp, pt, lt, ft, rd, … — has no silent-e spelling in
// English at all, so base+"e" there (aske, uncollecte, unconfirme) is pure
// fabrication.
// A second, orthogonal allowance: an exactly-bisyllabic base (con-vert,
// ad-dict, com-pact, con-duct) is also let through even when its cluster
// isn't in the list above. These are the classic Latinate noun/verb stress
// pairs (CONtract/conTRACT): the bare 2-syllable form defaults to initial
// (noun-like) stress, and the extra fake syllable happens to push the
// syllable-count-based stress heuristic onto the correct (verb) syllable —
// not silent-e reasoning, but real and common enough (converted is a
// top-5000 word) to keep. A 3+-syllable un-/mis- + root base (uncollect,
// unconfirm) doesn't have this noun/verb ambiguity to resolve, so it's
// excluded by the cluster+syllable-count test above either way.
// A doubled final consonant (kidnapp, sandbagg — its undoubled form isn't
// a table word, or the earlier doubled-consonant check above would already
// have returned) is excluded too: it's gemination, not a dropped e.
// Measured both ways: WITHOUT this exclusion, the doubled base is allowed
// through whichever disjunct below it happens to match, which nets one
// MORE strict win on the plain rule-diff count (22 : 5 vs 31 : 15) by
// recovering kidnapped/sandbagged-style cases — but it does so by giving
// up deferred/demurred/deterred/recurred-style doubled -r roots (whose
// undoubled form also isn't a table word), and those carry primary-stress
// placement that only evaluate-strict (which keeps the stress mark) can
// see: +13 there instead of +26. Since this project tracks stress
// placement as its own metric precisely because segment-only scores can't
// see it, the exclusion stays.
// Without this gate at all the probe fabricates ANY base+"e" string and
// runs it through the FULL rule pipeline as if it were a real word, so it
// inherits whatever closed-syllable vowel/stress rule fires for the shape
// it's handed: asked → "aske" → tensed /eɪsk/ → shipped /ˈeɪskt/ (dict
// /æskt/, not even a table word — a live bug on any -ed/-ing base this
// pattern hits and the table doesn't cover). uncollected/unconfirmed
// similarly picked up a spurious segment from the -ive silent-e stress
// fold reading the fake trailing "e" as a real syllable (both are now
// table entries, so the shipped pipeline doesn't see it, but the
// rules-only path still does).
// Measured over the whole dict (rule-diff, disableDict, before → after
// this gate): a first single-consonant-only version was strict 179 : 370,
// net negative against the unguarded probe (mostly the Cl/c/g/s/v/st/th
// clusters and the bisyllabic stress class, all rejected too broadly).
// With both allowances plus the doubled exclusion: strict 31 : 15, lenient
// 18 : 6, top-5000 0 : 0 (the sole top-5000 regression from the
// cluster-only version, converted, is exactly the case the bisyllabic
// allowance recovers), evaluate-strict headline +26. Remaining losses:
// kidnapped/sandbagged/backslapping/combatting/outmanned/wildcatting/
// clendenning/offsetting (the doubled-base trade-off above), gehring (a
// surname, not "gehr" + silent e), offspring (a monomorphemic noun the
// -ing strip never should have touched), overlapped/overlapping
// (3-syllable + doubled p, outside every allowance) and unprotected (the
// same 3+-syllable un- shape as uncollected/unconfirmed, still correctly
// excluded — its remaining stress error is unrelated, see assignStress's
// prefix rules).
const MAGIC_E_CANDIDATE = (base: string): boolean =>
  !/([bcdfgklmnprst])\1$/.test(base) &&
  (/[aeiouy][bcdfghjklmnpqrstvwxz]$/.test(base) ||
    /[cgsvl]$/.test(base) ||
    /(?:st|th)$/.test(base) ||
    syllabify(base).length === 2);

// The vowel before an unstressed Latinate ending is the slot the suffix
// reduces (anim+al, crimin+al, capit+al, condi+ment), but the suffix
// handlers price the base without the suffix in view, so its last /ɪ/
// stays full — the same join problem the -ily/-ibly adverbs have. On the
// frame below data/en/dict.json has 78 ə : 22 ɪ, and 9 : 1 over the
// top-5000 slice; the rule path reaches it in `syllableToIPA`.
const PRE_SUFFIX_ORTHO_RE = /i[tnmp](?:als?|ous|ants?|ents?)$/;
const preSuffixReduce = (ipa: string, word: string): string =>
  PRE_SUFFIX_ORTHO_RE.test(word)
    ? ipa.replace(/(?<![eaɔ])ɪ(?=[^ɑɔæɛɪiʊuʌəɝɚ]*$)/, "ə")
    : ipa;

// A front-vowel-initial suffix softens the base's final <c>/<g>
// (allerg+ist dʒ 62:4, critic+ize s). Priced alone the base ends the
// letter word-finally, where it always reads hard, so the suffix
// handlers have to put the softening back. Doubled gg/cc stays hard
// (druggist).
function softenBaseFinal(ipa: string, base: string, sfx: string): string {
  if (!/^[eiy]/.test(sfx)) return ipa;
  if (/(?:^|[^g])g$/.test(base)) return ipa.replace(/ɡ$/, "dʒ");
  if (/(?:^|[^c])c$/.test(base)) return ipa.replace(/k$/, "s");
  return ipa;
}

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
    // Positional: [prev, next]. An empty prev must stay in its slot, or a
    // sentence-initial word would read its NEXT word as its previous one.
    const result = simplePOSTagger.tagWord(word, [context?.prev ?? "", context?.next ?? ""]);
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
    // left for the normal path. See CLITICS for the segments.
    const aposAt = lowerWord.search(/['’]/);
    if (aposAt > 0 && aposAt >= lowerWord.length - 3) {
      const tail = lowerWord.slice(aposAt + 1);
      // A bare trailing apostrophe is the plural possessive (accountants',
      // dogs'): the stem already carries its -s and nothing is added.
      const clitic = CLITICS[tail];
      if (clitic !== undefined) {
        const stemIpa = this.predict(lowerWord.slice(0, aposAt), language, pos);
        if (stemIpa) return stemIpa + (tail === "s" ? sAllomorph(stemIpa) : clitic);
      }
    }

    // Principled pipeline (opt-in). See class field doc + P5 status.
    if (this.enablePrincipled && !this.disableDict) {
      const principled = predictPrincipled(lowerWord, (w: string) => {
        return this.customDict[w] ?? this.dictionary[w];
      });
      if (principled) return principled.ipa;
    }

    const base =
      this.geminateVariant(lowerWord, pos) ??
      this.predictInternal(word, pos, this.disableDict);
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
    // Every non-rule path reports the whole word as one step, named by
    // the lookup that produced it.
    const via = (path: TraceResult["path"], rule: string): TraceResult => ({
      word,
      ipa,
      path,
      steps: [{ grapheme: word, phoneme: ipa, rule }],
    });

    if (!this.disableDict) {
      if (pos && Array.isArray(this.homographs[lowerWord])) {
        if (
          this.homographs[lowerWord].find((entry: HomographEntry) =>
            this.matchPos(entry, pos),
          )
        )
          return via("dictionary", "homograph");
      }
      if (this.customDict[lowerWord]) return via("dictionary", "custom-dict");
      if (this.dictionary[lowerWord] || INITIALISMS[lowerWord])
        return via("dictionary", "dict");
      if (this.geminateVariant(lowerWord, pos))
        return via("dictionary", `geminate-stem:${geminateStem(lowerWord)}`);
    }

    if (this.tryMorphologicalAnalysis(lowerWord)) return via("morphology", "morphology");

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
    const secondary = secondaryStressIndices(syllables, stressedIdx);
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
        syllables.slice(i + 1).join(""),
        secondary.has(i),
        syllables.slice(0, i).join(""),
        i > 0 && i - 1 === stressedIdx,
      );
    });

    return { word, ipa, path: "rules", syllables, steps: traceSteps };
  }

  /**
   * Doubled-final-consonant variant of a lexical entry. Variant spellings
   * (mostly names) double the final consonant without changing the
   * pronunciation: Seann/Sean, Jonn/Jon, Robb/Rob. When the whole word is
   * unknown but its degeminated stem is, the stem's pronunciation beats
   * the rule path — on dict words with a lexical stem the stem wins
   * 188:62. Whole-word only: a doubled consonant before a suffix
   * (regrett-able, referr-al) is inflectional doubling, which the
   * morphology handlers own. Stems under four letters are excluded: there
   * the single form is usually a function word or abbreviation with its
   * own irregular pronunciation (off/of, ass/as, app/ap). The exception
   * miner's runtime-refinement pass pins every dict word whose stem
   * disagrees with it, so this never overrides a known word.
   */
  private geminateVariant(lowerWord: string, pos?: string): string | undefined {
    if (this.disableDict) return undefined;
    const stem = geminateStem(lowerWord);
    if (!stem) return undefined;
    if (this.wellKnown(lowerWord, pos, true) || INITIALISMS[lowerWord]) return undefined;
    return this.wellKnown(stem, undefined, true);
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
      if (INITIALISMS[lowerWord]) return spellInitialism(word) ?? INITIALISMS[lowerWord];
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
    const spelled = spellInitialism(word);
    if (spelled) return spelled;

    // Priority 7: Improved syllabification and rule-based G2P.
    return this.renderRuleForm(lowerWord);
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
    // A stripped base is read from the lexicon (never re-decomposed, or
    // "chas" would morphologise to cha+s), and for most suffixes falls
    // back to its whole-word prediction.
    const lex = (b: string): string | undefined => this.wellKnown(b, undefined, true);
    const stemPron = (b: string): string | undefined =>
      lex(b) || this.predictInternal(b, undefined, false);
    const sPlural = (p: string): string => p + sAllomorph(p);
    // A doubled consonant right before a vowel-initial suffix is
    // orthographic gemination, not a real double letter to carry into the
    // stem lookup (control → controllable, refer → referral), as inflect()
    // separately tests for -ed/-ing. Shared by the -able and -al handlers.
    const doubledConsonantLex = (stem: string): string | undefined =>
      stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]
        ? lex(stem.slice(0, -1))
        : undefined;
    // Indefinite pronouns and adverbs are a determiner + a free noun
    // (anyone, everything, somebody, nowhere): read both parts from the
    // lexicon and put a secondary on the second.
    const indefinite = /^(any|every|some|no)(one|body|thing|where|how|way|time|place)(s?)$/.exec(lowerWord);
    if (indefinite) {
      const head = stemPron(indefinite[1]), tailPron = stemPron(indefinite[2]);
      if (head && tailPron) {
        const joined = head + tailPron.replace(/ˈ/g, "ˌ").replace(/^(?!ˌ)/, "ˌ");
        return indefinite[3] ? sPlural(joined) : joined;
      }
    }
    // The agent noun of a Greek -y noun keeps its stress: biology →
    // biologist, photography → photographer, economy → economist. Read
    // the -y form and swap its final /i/ for the agent suffix.
    const greekAgent = /(?:log|graph|nom|soph)(ist|er)$/.exec(lowerWord);
    if (greekAgent) {
      const yForm = stemPron(lowerWord.slice(0, -greekAgent[1].length) + "y");
      if (yForm && /i$/.test(yForm)) return yForm.slice(0, -1) + (greekAgent[1] === "ist" ? "ɪst" : "ɝ");
    }
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
      // Restoring silent e must not select a pronounced-e loanword
      // (pass → passé). Such a stem cannot explain dropped-e spelling.
      const silentE = () => {
        if (/([bcdfgklmnprst])\1$/.test(base)) return undefined;
        const p = this.wellKnown(base + "e");
        return p && !ENDS_IN_VOWEL_RE.test(p) ? p : undefined;
      };
      if (!/[aeiou]$/.test(base)) {
        const m = silentE();
        if (m) return join(m);
      } // magic-e: coded→code, baking→bake
      // skipMorphology: the base of an inflection must be a real lexicon
      // word, not a re-decomposition. Without this, wellKnown("chas")
      // morphologises to "cha"+s → /tʃɑz/, intercepting the magic-e
      // recovery and yielding chased→/tʃɑzd/ instead of /tʃeɪst/.
      const basePron = lex(base);
      if (basePron) return join(basePron);
      // Doubled-consonant base: the two chars before the suffix are
      // identical (stopped → stop, planned → plan).
      if (
        lowerWord.length > 4 &&
        lowerWord.slice(-(sfxLen + 2), -(sfxLen + 1)) ===
          lowerWord.slice(-(sfxLen + 1), -sfxLen)
      ) {
        const undoubled = lowerWord.slice(0, -(sfxLen + 1));
        // A recovered -s must be lexical, not a newly inferred plural
        // (finessed must not become fines + d). Derived stems such as
        // pedal in pedalled still need the normal morphology lookup.
        const p = this.wellKnown(undoubled, undefined, undoubled.endsWith("s"));
        if (p) return join(p);
      }
      const magicPron = silentE();
      if (magicPron) return join(magicPron);
      // A y-final stem keeps its vowel before -ing (try/copy/study,
      // buy/play/enjoy). Two-letter stems are excluded: dying/lying/tying
      // restore -ie.
      if (base.length > 2 && base.endsWith("y")) {
        return join(this.predictInternal(base, undefined, true));
      }
      // These final clusters already close the stem; adding a fictitious
      // silent e changes its vowel (called), or decomposition splits a
      // consonant digraph (reaching). Keep the bare rule-derived stem.
      if (/[aeiou]/.test(base) && /(?:ll|ss|[cs]h|ck|ng|lk)$/.test(base)) {
        return join(this.predictInternal(base, undefined, true));
      }
      // Dict lookup failed for the stem because it is a regular word the
      // rules already handle, so it was never memorized as an exception
      // (ask, form, …). Rule-predict the stem and attach the allomorph —
      // this avoids the syllabifier mis-splitting the whole inflected
      // form (asked → [a][sked] → /æzd/). Guard: the stem must contain a
      // vowel and end in a consonant, so a root-final suffix with a
      // vowelless stem (bled, sped, fled) is left for the normal path.
      // Try the silent-e-restored stem first (advanced → advance,
      // placed → place) — but ONLY when MAGIC_E_CANDIDATE says the base's
      // ending could plausibly carry a real dropped-e spelling (see its
      // comment) AND the restored e is actually silent, i.e. the
      // prediction still ends in a consonant. For sibilant-final stems the
      // e is pronounced (distinguishe → …ʃi, washe → …ʃi), which would
      // wrongly attach the allomorph to a vowel; fall back to the bare
      // stem there so distinguished → …ʃt, not …ʃid.
      if (ruleFallback && /[aeiou]/.test(base) && !/[aeiou]$/.test(base)) {
        const ruleBaseE = MAGIC_E_CANDIDATE(base)
          ? this.predictInternal(base + "e", undefined, true)
          : undefined;
        if (ruleBaseE && !ENDS_IN_VOWEL_RE.test(ruleBaseE))
          return join(ruleBaseE);
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
      // A one-syllable consonant+vowel stem (thi+s, hi+s, ha+s, ye+s)
      // is a lexical coincidence, not a plural: this/his/has/yes/gas
      // are whole words. -o stems (photos, videos) are real plurals.
      const stem = lowerWord.slice(0, -1);
      const basePron = /^[^aeiouy]*[aeiuy]$/.test(stem)
        ? undefined
        : this.wellKnown(stem) ||
          // An r-final stem that's gone rule-exact (error, actor, author,
          // doctor, vendor, dollar) has left the exceptions table, so
          // wellKnown() no longer finds it and its plural was falling
          // through to whole-word rule syllabification of the INFLECTED
          // form instead — which mishandles a word-final -or/-ar rime
          // followed by the suffix's own consonant (errors, actors:
          // syllableToIPA's final-unstressed-vowel reduction only ever
          // checks the literal last phoneme, so the plural's trailing "s"
          // masks the "or"/"ar" nucleus it's meant to reduce to ɝ). Forcing
          // the rule path on just the stem sidesteps that: it's the one
          // shape whose SINGULAR the rules already predict correctly on
          // their own, and sPlural's sAllomorph voices correctly off its
          // r-colored ɝ ending regardless.
          (/r$/.test(stem) ? this.predictInternal(stem, undefined, true) : undefined);
      if (basePron) return sPlural(basePron);
      // Rule-derived stems are absent from the exception table. Preserve
      // -tion/-sion palatalization and monosyllabic silent-e vowels
      // when adding -s (solutions/names/bikes). Verify silent e by the
      // consonant-final prediction. Exclude s/x, which instead introduce
      // syllabic -es (buses/taxes), and multi-vowel stems (housewives).
      if (/[ts]ions$|^[^aeiou]*[aeiou][bcdfghjklmnpqrtvz]es$/.test(lowerWord)) {
        const stem = this.predictInternal(lowerWord.slice(0, -1), undefined, true);
        if (!ENDS_IN_VOWEL_RE.test(stem)) return sPlural(stem);
      }
      // A final -s must not turn the stem's final ow/o into a closed
      // syllable (shows, yellows, photos). Preserve the stem vowel.
      if (/(?:ow|o)s$/.test(lowerWord)) {
        return sPlural(this.predictInternal(lowerWord.slice(0, -1), undefined, true));
      }
      // A rule-exact -ate verb or -ial noun has left the table, so its -s
      // form needs the rule-derived stem (communicates, aggregates: 8 : 0;
      // tutorials, editorials).
      if (/(?:ate|ial)s$/.test(lowerWord) && lowerWord.length > 5) {
        const p = this.predictInternal(stem, undefined, true);
        if (p && !ENDS_IN_VOWEL_RE.test(p)) return sPlural(p);
      }
    }
    if (/['''']s$/.test(lowerWord) && lowerWord.length > 3) {
      const basePron = this.wellKnown(lowerWord.slice(0, -2));
      if (basePron) return sPlural(basePron);
    }
    if (lowerWord.endsWith("es") && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      // A one-syllable base ending in a single s is almost always a
      // magic-e stem plus -s (uses, cases, roses, houses, nurses), not
      // an -es plural (buses, gases); read it through the silent-e form.
      if (/^[^aeiouy]*[aeiouy]+[^aeiouys]*s$/.test(base)) {
        const stem = this.predictInternal(base + "e", undefined, true);
        if (stem && !ENDS_IN_VOWEL_RE.test(stem)) return sPlural(stem);
      }
      const basePron = this.wellKnown(base);
      if (basePron) return basePron + "ɪz";
    }

    // y-stem family: restore the -y the suffix replaced (tried → try,
    // happiness → happy), read the stem, attach the allomorph. The stem may
    // be rule-derived, since a rule-exact base (dictionary) has left the
    // table: 118 strict : 4 (dictionaries, mercenaries, tapestries). -ier
    // stays lexicon-only, where French/German surnames (grenier, dozier)
    // make the fallback 32 : 60.
    for (const [sfx, join] of [
      ["ied", edPast],
      ["ies", sPlural],
      ["ier", (p: string) => p + "ɝ"],
      ["iness", (p: string) => p + "nəs"],
      ["iest", (p: string) => p + "əst"],
    ] as [string, (p: string) => string][]) {
      if (!lowerWord.endsWith(sfx) || lowerWord.length <= sfx.length + 1)
        continue;
      const stripped = lowerWord.slice(0, -sfx.length);
      const base = stripped + "y";
      // A vowelless remainder is no stem (priest is not pr + -iest).
      const basePron =
        sfx === "ier" || !/[aeiou]/.test(stripped)
          ? this.wellKnown(base)
          : stemPron(base);
      if (basePron) return join(basePron);
    }

    if (lowerWord.endsWith("er") && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      // A doubled final consonant on the base is orthographic gemination,
      // not a real letter to keep before adding "e" — the same skip
      // silentE() in inflect() already applies for -ed/-ing. Without it an
      // unrelated pronounced-e loanword sharing the doubled spelling
      // corrupts the derivation (bette → better, latte → latter, butte →
      // butter, passé → passer).
      const doubledBase = /([bcdfgklmnprst])\1$/.test(base);
      let magicPron = doubledBase ? undefined : this.wellKnown(base + "e");
      // A short base can also coincidentally match an unrelated headword
      // whose final e IS pronounced (ente "duck" → enter, mete → meter).
      // Reject a vowel-final hit unless the base ends in y/w/r, where that
      // vowel is a genuine offglide/rhotic the suffix attaches to cleanly
      // (flye→flyer, howe→hower, acquire→acquirer).
      if (magicPron && /[^aeiouyrw]$/.test(base) && ENDS_IN_VOWEL_RE.test(magicPron)) {
        magicPron = undefined;
      }
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
      // No magic-e stem. Try the base with a doubled final consonant
      // singled (better←bet, controller←control), then a bare base the
      // general syllabifier mispredicts in isolation on its own (grosser←
      // gross: ˈɡɹɑs not ˈɡɹoʊs in isolation), before falling through to
      // whole-word resyllabification. skipMorphology=true per the
      // chas→cha+s precedent above: a fragment must not be re-decomposed.
      if (doubledBase && base.length >= 4) {
        const undoubled = this.wellKnown(base.slice(0, -1), undefined, true);
        if (undoubled) return undoubled + 'ɝ';
      // -ther is one morpheme (brother, bother, leather), not broth + -er.
      } else if (base.length >= 5 && !base.endsWith("th")) {
        const directPron = this.wellKnown(base, undefined, true);
        if (directPron) return directPron + 'ɝ';
      }
    }

    if (lowerWord.endsWith("ed") && lowerWord.length > 3) {
      const p = inflect(2, edPast, true);
      if (p) return p;
    }

    if (lowerWord.endsWith("ing") && lowerWord.length > 4) {
      const p = inflect(3, (b) => b + "ɪŋ", true);
      if (p) return p;
    }

    if (lowerWord.endsWith("ally") && lowerWord.length > 6) {
      const base2 = lowerWord.slice(0, -2);
      // -al adjectives the rules already handle (final, total, general)
      // are not in the lexicon; read them by rule before falling back to
      // the -ic stem of -ically words (basically, typically).
      let basePron = base2.endsWith("ical") ? lex(base2) : stemPron(base2);
      if (!basePron) basePron = stemPron(lowerWord.slice(0, -4));
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
      const stem = lowerWord.slice(0, -2);
      // y-restoration: a stem ending in vowel+i came from a base-final -y
      // the suffix replaced (daily→day, gaily→gay, oily→oy). Guarded to
      // vowel+i so consonant+i roots (family, homily, happily, bodily) are
      // NOT mis-restored. Try the -y base first.
      if (/[aeiou]i$/.test(stem)) {
        const yBase = stemPron(stem.slice(0, -1) + "y");
        if (yBase)
          return /[lɫ]$/.test(yBase) ? yBase + "i" : yBase + "li";
      }
      // -bly is the -ble adjective with the syllabic l re-onset by the
      // suffix (credible→credibly, notable→notably). Read the -ble base so
      // its own reduction applies to the vowel before the cluster, then
      // drop the syllabic schwa: -ibly is 26 ə : 4 ɪ in data/en/dict.json,
      // and the bare stem ("credib") has no cluster for that rule to see.
      if (lowerWord.endsWith("bly")) {
        const ble = stemPron(stem + "le");
        if (ble && /[lɫ]$/.test(ble)) return ble.replace(/ə([lɫ])$/, "$1") + "i";
      }
      const basePron = stemPron(stem);
      if (basePron) {
        if (/[lɫ]$/.test(basePron)) return basePron + "i";
        // A consonant+i stem is the -y adjective with its final letter
        // rewritten by the suffix (angry→angrily, easy→easily) or a
        // truncated Latinate stem (family, homily). Either way that /ɪ/ is
        // the slot before the suffix, which reduces: -ily is 64 ə : 6 ɪ in
        // data/en/dict.json. The stem is read without the suffix in view,
        // so the reduction has to be applied on the join.
        if (/[^aeiouy]i$/.test(stem))
          return basePron.replace(/ɪ$/, "ə") + "li";
        return basePron + "li";
      }
    }

    // -able/-ible: magic-e derivation first (advisable→advise,
    // reproducible→reproduce), then the bare base. -ible needs a LONG
    // base (≥5) so short coincidental stems (poss→posse, vis→vise,
    // leg→lege) don't misfire — possible/visible/legible stay on the
    // normal path.
    const able = lowerWord.endsWith("able") && lowerWord.length > 6;
    const ible = lowerWord.endsWith("ible") && lowerWord.length > 7;
    if (able || ible) {
      const base = lowerWord.slice(0, -4);
      const withAble = (p: string): string => p.replace(/ə$/, "") + "əbəl";
      if ((able || base.length >= 5) && !/[aeiour]$/.test(base) && !lex(base)) {
        const m = lex(base + "e");
        if (m) return withAble(m);
      }
      if (able) {
        // A doubled consonant before -able is orthographic (control →
        // controllable, regret → regrettable): read the single-consonant stem.
        const undoubled = doubledConsonantLex(base);
        if (undoubled) return withAble(undoubled);
        const bare = stemPron(base);
        if (bare) return withAble(bare);
        const short = stemPron(lowerWord.slice(0, -3));
        if (short) return short + "əbəl";
      }
    }

    // -ization ← -ize verb (prioritization→prioritize). The suffix carries
    // primary stress onto its own /ˈzeɪʃən/; the stem's former primary
    // demotes to secondary, and the -ize /aɪz/ becomes /əˈzeɪʃən/.
    if (lowerWord.endsWith("ization") && lowerWord.length > 9) {
      const stem = lowerWord.slice(0, -7);
      // stemPron (not lex): unlike -ification, "stem+ize" is ALWAYS the
      // real verb an -ization noun derives from (organization←organize,
      // specialization←specialize) — a rule-exact -ize verb leaving the
      // table used to fall straight to the plain-stem branch below and
      // lose the /aɪz/ syllable's own vowel (legalization → ˌɫɪɡəɫəˈzeɪʃən
      // instead of ˌɫiɡəɫəˈzeɪʃən).
      const ize = stemPron(stem + "ize");
      // demote the stem's primary to secondary, then turn the -ize
      // syllable (its onset's secondary mark + /aɪz/) into unstressed
      // /əˈzeɪʃən/ — the suffix carries the new primary.
      if (ize && /aɪz$/.test(ize))
        return ize.replace(/[ˈˌ]/g, "ˌ").replace(/ˌ?([^ˈˌ]*)aɪz$/, "$1əˈzeɪʃən");
      const b = stemPron(stem);
      if (b) return b.replace(/ˈ/g, "ˌ") + "əˌzeɪʃən";
    }

    if (lowerWord.endsWith("logy") && lowerWord.length > 6) {
      const bp = stemPron(lowerWord.slice(0, -4));
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
      const stem = lowerWord.slice(0, -4);
      // -ential/-antial move the primary onto the -en-/-an- before them
      // (confidential, residential); the stem's stress would stay put here,
      // so a 3+-syllable -en/-an stem goes to the whole-word rules.
      const pp =
        /[ae]n$/.test(stem) && (stem.match(/[aeiouy]+/g)?.length ?? 0) >= 3
          ? undefined
          : stemPron(stem);
      // The stem is scored as a standalone open monosyllable, which
      // takes the wrong default for a bare final a or e (ra → ɹɑ,
      // spe → spi). Before -cial/-tial the dict is unanimous: an open
      // a is tense (racial, facial, glacial, spatial, palatial — 11
      // eɪ : 0) and an open e is lax (special, especial — 2 ɛ : 0).
      if (pp && /[aeiouæɑɔɛɪʊʌɝə]/.test(pp))
        return (
          (stem.endsWith("a")
            ? pp.replace(/[ɑæ]$/, "eɪ")
            : stem.endsWith("e")
              ? pp.replace(/i$/, "ɛ")
              : pp) + "ʃəl"
        );
    }
    // -ation ← -ate verb or bare stem (abdication, adaptation). Like
    // -ization, the suffix takes the primary on its /eɪ/ and the stem's
    // primary demotes: keeping the stem's stress gave ˈæbdəˌkeɪʃən for
    // ˌæbdɪˈkeɪʃən (316 dict words with penult stress read otherwise).
    if (lowerWord.endsWith("ation") && lowerWord.length > 7) {
      const b = lowerWord.slice(0, -5),
        ate = lex(b + "ate"),
        src = lex(b);
      if (ate)
        return (
          suffixPrimary(ate.match(/eɪt$/) ? ate.slice(0, -1) : ate.replace(/[ɪə]t$/, "eɪ")) +
          "ʃən"
        );
      if (src) return suffixPrimary(src + "eɪ") + "ʃən";
      // Neither the -ate verb nor the bare stem is a table hit: the -ate
      // verb itself may simply be rule-exact (concatenate, generate,
      // operate, obliterate) and have left the exception table, at any
      // syllable count — the -ate stress rule (assignStress) already
      // places its primary correctly regardless of length, so the old
      // ≤3-syllable cap here was only ever a proxy for "is this really an
      // -ate verb", not the real test. That real test is orthographic:
      // -ification nouns (acidification, justification, qualification)
      // also end in "ation" but derive from an -ify verb, not -ate
      // ("acidificate" isn't a word), so they're excluded — the rule
      // pipeline never refuses a fabricated form, it just mis-syllabifies
      // it, and that garbage would otherwise outrank the correct
      // whole-word reading. Measured together with the matching -ization
      // fix below and the suffixPrimary rhotic-coalescing fix it depends
      // on (a rule-exact stem's raw /ɪɹ/ needs that fix to reform /ɝ/
      // once composed — see suffixPrimary's own comment): strict
      // 84 : 8, lenient 39 : 4, top-5000 9 : 0. The 8 losses are bare
      // stems that need a final silent -e this fallback doesn't try
      // (compile → compilation, derive → derivation, deprive →
      // deprivation, value → undervaluation), a genuine noun/verb
      // ambiguity in the -ate reading itself (intimate), a rare real
      // word whose isolated rule rendering picks a different doubled-r
      // syllable split than the whole word does (aberrate → aberration),
      // and two more -ify-shaped nouns -ification's suffix-final "if"
      // check doesn't catch (jubilate is real but not what "jubilation"
      // derives from; multiply → multiplication has no orthographic tie
      // to "multiplicate"). Left open: no purely orthographic test
      // separates these from the class this fix targets.
      if (!/ific$/.test(b)) {
        const ruleAte = this.predictInternal(b + "ate", undefined, false);
        if (ruleAte && /eɪt$/.test(ruleAte)) return suffixPrimary(ruleAte.slice(0, -1)) + "ʃən";
      }
    }
    if (
      (lowerWord.endsWith("ance") || lowerWord.endsWith("ence")) &&
      lowerWord.length > 7
    ) {
      const b = lowerWord.slice(0, -4),
        p =
          lex(b) ||
          (b.endsWith("i") ? lex(b.slice(0, -1) + "y") : undefined) ||
          (b.endsWith("id") ? undefined : lex(b + "e"));
      // An -er verb that carries its own primary on that final syllable
      // keeps it in the noun only when the spelling doubles the boundary
      // consonant (occurrence, deterrence); an undoubled one has retracted
      // it (refer → ˈɹɛfɝəns, likewise confer/defer/infer/prefer — 5 of 5
      // in the dict, against 0 of the 31 free stems ending in anything
      // else). Fall through to the rules, which front the primary here.
      // The final-stress test is what keeps ˈsɛvɝ/ˈʌtɝ (severance,
      // utterance) on the lookup path.
      const stem = lex(b);
      if (stem && /[^aeiou]er$/.test(b) && FINAL_STRESS_RE.test(stem))
        return undefined;
      if (p) return p + "əns";
    }
    if (
      lowerWord.endsWith("ual") &&
      !lowerWord.endsWith("gual") &&
      lowerWord.length > 5 &&
      !(lowerWord.endsWith("tual") && lowerWord.length > 6)
    ) {
      const p = stemPron(lowerWord.slice(0, -3));
      if (p) {
        const stem = p.replace(/[uʊ]$/, "");
        // The glide behaves like the ^ue digraph elsewhere in this file:
        // n/l keep a literal j (annual, manual, continual, semiannual —
        // 4/4 in the dict), a final d palatalizes with it (gradual,
        // residual, individual — 3/3). Known miss, not excepted by this
        // code: a handful of Spanish proper nouns sharing the same du+a
        // shape keep it plain (padua, anzaldua, basaldua). Every other
        // onset is left on the plain "uəl" this branch already returned
        // (accrual, menstrual's r) — the s-onset population measured too
        // mixed to rule (visual/sexual coalesce, consensual/asexual
        // don't, and the vowel that follows differs too: uə vs əwə).
        // Rule-diff gate: strict 3 : 0, lenient 1 : 1.
        if (/[nl]$/.test(stem)) return stem + "juəl";
        if (stem.endsWith("d")) return stem.slice(0, -1) + "dʒuəl";
        return stem + "uəl";
      }
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
      const b = lowerWord.slice(0, -sfx.length);
      const finish = (p: string): string =>
        softenBaseFinal(preSuffixReduce(p, lowerWord), b, sfx) + ipa;
      // Stripping a vowel-initial -al from an unknown one-syllable base
      // closes its syllable (fi|nal → fin, to|tal → tot) and loses the
      // tense vowel; leave those to the whole-word rule path.
      if (sfx === "al" && /^[^aeiouy]*[aeiouy]+[^aeiouy]+$/.test(b) && !lex(b))
        continue;
      // -ial is not stress-neutral like -al: it pulls the primary onto the
      // syllable before it (adversary → adversarial, editor → editorial),
      // which the whole-word stress rule places.
      // A one-syllable stem is the stressed <i> itself (trial, dial).
      if (sfx === "al" && b.endsWith("i") && (b.match(/[aeiouy]+/g)?.length ?? 0) >= 2) continue;
      // Same for -al after a polysyllabic -ent/-ant stem: environmental,
      // accidental, fundamental stress the -en- the stem left unstressed.
      if (sfx === "al" && /[ae]nt$/.test(b) && (b.match(/[aeiouy]+/g)?.length ?? 0) >= 2) continue;
      if (sfx === "al" && !lex(b)) {
        // A doubled consonant before -al is orthographic (refer → referral):
        // read the single-consonant stem, as inflect() does for -ed/-ing.
        const undoubled = doubledConsonantLex(b);
        if (undoubled) return finish(undoubled);
        // Silent-e stem (approve → approval, arrive → arrival): a table lookup
        // only, since rule-predicting base + e always yields something
        // (classic + e, addition + e). A base under five letters is left out,
        // where an unrelated entry is likeliest (anim + e is "anime").
        if (b.length >= 5 && !/[aeiour]$/.test(b)) {
          const magic = lex(b + "e");
          // A silent e leaves a consonant-final stem; a vowel-final hit is a
          // loan whose e is sounded (principe, cantone).
          if (magic && !ENDS_IN_VOWEL_RE.test(magic)) return finish(magic);
        }
      }
      // -ular pulls the primary onto the stem's OWN final syllable
      // (moLECular, parTICular, arTICular, aVUNcular), not wherever
      // `stemPron` would default an unknown bound root (molec, partic,
      // artic) predicted as a free word — which lands stress one syllable
      // too early whenever that root is 2+ syllables. Every -ular dict
      // word whose stripped stem is 2+ syllables agrees: 30/30 (molecular,
      // particular, avuncular, binocular, curricular, mandibular,
      // peninsular, rectangular, spectacular, testicular, vehicular,
      // ventricular, vernacular, vestibular, and every extra-/inter-/
      // intra-/semi-/cardio-/gastro- compound of them). A one-syllable
      // stem (vascular's "vasc", cellular's "cell") is unaffected — its
      // only syllable is already both first and last. Measured over the
      // rules-only dump: strict 7 wins : 1 loss. The loss is testicular:
      // rendering only the bare 2-syllable stem gives `secondaryStressIndices`
      // an array with the primary at index 1, so its `before` check
      // (primary - 2) is negative and the initial "tɛs" gets no secondary
      // — with none, it reduces like any other unstressed initial syllable,
      // where the dict keeps it full. Fixing that would need the FULL
      // word's syllable array for the secondary computation while still
      // rendering only the stem — the suffix's own "u·lar" can't just be
      // included in that render, since its /j/ glide is lexical to this
      // suffix, not a free reading of "u" the rule engine produces.
      const bSyllables = sfx === "ular" ? syllabify(b) : [];
      let p =
        sfx === "ular" && bSyllables.length >= 2
          ? lex(b) ?? this.renderRuleForm(b, bSyllables.length - 1)
          : stemPron(b);
      // A stem spelled with a final "ng" (angular, singular, rectangular,
      // triangular, equiangular) is silent-g word-finally, the reading
      // `stemPron`/`renderRuleForm` give it read as a free word, but the
      // /ɡ/ resurfaces once a vowel-initial suffix follows: 5/5 -ngular
      // dict words keep it (ˈæŋɡjəɫɝ, ˈsɪŋɡjəɫɝ, …).
      if (p && sfx === "ular" && b.endsWith("ng") && p.endsWith("ŋ")) p = p + "ɡ";
      if (p) return finish(p);
    }

    return undefined;
  }

  /**
   * Priority-7's syllabify → assignStress → syllableToIPA → mark-insertion
   * pipeline, factored out so a morphology handler can render a bound stem
   * with a forced stress index (see the -ular handler above) instead of
   * `assignStress`'s free-word default.
   */
  private renderRuleForm(lowerWord: string, forcedStress?: number): string {
    const syllables = syllabify(lowerWord);
    const stressedSyllableIndex = forcedStress ?? assignStress(syllables, lowerWord);
    const secondary = secondaryStressIndices(syllables, stressedSyllableIndex);

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
        syllables.slice(i + 1).join(""),
        secondary.has(i),
        syllables.slice(0, i).join(""),
        i > 0 && i - 1 === stressedSyllableIndex,
      );
    });

    if (syllableIPA.length === 0) return lowerWord;
    const joined = syllableIPA.join("");
    let result = applyPostLexical(joined, lowerWord, syllables.length);

    // Add primary-stress marker. Emit for monosyllables too — content
    // words like "world", "knight", "wood" have lexical stress (the
    // dict marks it for citation form). Function-word demotion happens
    // at the tokenizer level once we know we're in sentence context.
    if (syllables.length > 0 && stressedSyllableIndex >= 0) {
      let charIndex = 0;
      for (let i = 0; i < stressedSyllableIndex; i++) {
        charIndex += syllableIPA[i].length;
      }
      // The index is into the pre-post-lexical string; a post-lexical
      // edit before it (the degeminated kk of ac·com·mo·da·tion) would
      // shift the mark into the stressed vowel (əkɑmədeˈɪʃən). Anchor on
      // whichever side of the mark the post-lexical pass left intact.
      // An onset consonant the pass merged away (bə|ɹeɪ → bɝeɪ) is dropped
      // from the anchor until the rest matches.
      // Only when the result has a vowel right before the match (the onset
      // was absorbed, not rewritten: chord, gehrig keep their onset).
      const full = joined.substring(charIndex);
      let tail = full;
      while (tail && !result.endsWith(tail) && !/^[aeiouæɑɔəɛɪʊʌɝ]/.test(tail)) tail = tail.substring(1);
      const absorbed =
        tail !== full && /[æɑɔəɛʌɝ]$/.test(result.substring(0, result.length - tail.length));
      if (result !== joined && tail && result.endsWith(tail) && (tail === full || absorbed)) {
        charIndex = result.length - tail.length;
        // Keep an ɪɹ/əɹ pair ahead of the mark, as applyPostStress's onset
        // pass does, so it can coalesce to ɝ (ballerina ˌbæɫɝˈinə).
        if (/[ɪə]$/.test(result.substring(0, charIndex)) && /^ɹ[aeiouæɑɔəɛɪʊʌ]/.test(result.substring(charIndex)))
          charIndex += 1;
      }
      result =
        result.substring(0, charIndex) + "ˈ" + result.substring(charIndex);
      // A stressed slot that is a two-vowel hiatus (geo·graphy, bio·graphy,
      // prio·rity) puts the mark on its second nucleus, not its onset. A
      // one-slot word is excluded: a short name ending in an unstressed
      // hiatus (mia, tia, zia — dict ˈmiə, ˈtiə, ˈziə) stresses the FIRST
      // vowel and reduces the second, the opposite pattern, and syllabify
      // never splits a word that short into more than one slot to tell
      // the two apart. Relocated on `result` itself (after the mark was
      // just inserted there), not on the pre-postlexical syllableIPA
      // strings the charIndex prefix sum above uses — a postlexical rule
      // earlier in the word can change length and desync that sum from
      // where the mark actually landed. See isHiatusSlot / hiatusMarkOffset.
      if (syllables.length > 1 && isHiatusSlot(syllables[stressedSyllableIndex])) {
        const tail = result.slice(charIndex + 1);
        const shift = hiatusMarkOffset(tail);
        if (shift > 0) {
          result =
            result.slice(0, charIndex) +
            tail.slice(0, shift) +
            "ˈ" +
            tail.slice(shift);
        }
      }
    }

    // Stress-mark convention repair (onset maximization, suffix
    // secondary stress, -ation primary shift) — needs the mark, so
    // it runs after insertion. Rule-path only by construction.
    return applyPostStress(result, lowerWord);
  }

  /**
   * Two-part compound split using the mined head/tail tables. Picks
   * the split with the most balanced halves (longest minimum part).
   * A doubled consonant at the boundary signals suffixing rather than
   * compounding (abet|ting) and rejects the split point.
   */
  private tryCompoundSplit(word: string): string | undefined {
    if (word.length < 6) return undefined;
    let head: string | undefined;
    let tail: string | undefined;
    let bestScore = -1;
    for (let i = 2; i <= word.length - 3; i++) {
      if (word[i - 1] === word[i]) continue;
      const a = word.slice(0, i);
      const b = word.slice(i);
      if (COMPOUND_HEADS[a] === undefined || COMPOUND_TAILS[b] === undefined)
        continue;
      // "logic" mines as a verified compound tail (it is a free word on
      // its own), but the Greek -log-/-graph-/-nom-/-soph- family it
      // belongs to (the same set greekAgent above reads -ist/-er from) is
      // not a stress-neutral English compound: the suffix carries the
      // primary across the WHOLE word, not just its own tail. Splitting
      // still fires for any head that also happens to be a verified
      // compound head elsewhere (psycho-, eco-, astro-, socio- — from
      // psychopath, ecosystem, astronaut, sociopath), which wrongly
      // promotes the head's own stress: psychological/ecological/
      // astrological/sociological reach here as the "-al" handler's
      // stripped "-ologic" stem and come out ˈsaɪkoʊˌɫɑdʒɪk instead of the
      // dict's ˌsaɪkəˈɫɑdʒɪk. bio-, techno-, anthropo-, archaeo-, mytho-,
      // geo- and toxico- are unaffected only because they are not ALSO
      // mined compound heads, so the same words already land correctly
      // through the plain suffix-stress rule (assignStress's
      // endsWith("ic") case) — this exclusion just routes -logic there
      // too. Matched by family, not the literal string, since a future
      // build-dict re-mine could add -graphic/-nomic/-sophic as tails
      // with the identical bug. Measured on data/en/dict.json: one
      // stress-position win (analogic: ˈænəˌɫɑdʒɪk → ˌænəˈɫɑdʒɪk, already
      // stress-stripped-equal to dict either way) and one strict loss
      // (immulogic, a brand name whose head-stressed reading the dict
      // actually keeps); the real payoff is the "-ological" family
      // reached through the "-al" morphology handler.
      if (/^(?:log|graph|nom|soph)ic$/.test(b)) continue;
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
    const result = dp[word.length];
    // A 2-word split needs no further check: both halves cover most of
    // the word, so a coincidental short match is unlikely (breakfast,
    // shoebox). A 3+-word split with a bare 3-letter middle chunk is a
    // different risk — `this.dictionary` (the exceptions table) is
    // riddled with 3-4 letter fragments that are surname/word remnants
    // rather than real standalone words (tal, ary, eba, ugh, oft), and
    // the DP has no notion of morphology to prefer fund+ament+al over
    // fund+amen+tal. Measured on data/en/dict.json: rejecting a 3+-word
    // split with any chunk under 4 letters (falling through instead) is
    // strict 1 win : 3 loss on its own — the DP still finds SOME other
    // short-chunk decomposition for the words this would fix, so a
    // blanket minimum on every chunk is net negative. Scoped to just
    // the 3+-word case it is neutral on the measured dict (no strict or
    // lenient change either way) while fixing the flagged case
    // (fundamental/fundamentally: fund+amen+tal → the rule path's own
    // correctly-stressed ˌfʌndəˈmɛntəɫ).
    if (result && result.length >= 3 && result.some((p) => p.length < 4))
      return undefined;
    return result;
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (!pronunciation.match(/^[A-Z0-9]+$/)) {
      pronunciation = arpabetToIpa(pronunciation);
    }
    this.customDict[word.toLowerCase()] = pronunciation;
  }
}

export default EnglishG2P;
