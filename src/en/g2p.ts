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
import { LanguageProcessor, type PredictionContext } from "../g2p";
import { expandText } from "./expand";
import { simplePOSTagger, isFunctionWord, reduceToWeakForm, inferVerbForm, hasFiniteObjectFrame, precedingContextIndex } from "./pos-tagger";
import { transformAmericanToRP } from "./gb";
import { predictPrincipled } from "./principled";
import { applyPhonotactics } from "./phonotactics";
import { applyPostLexical, applyPostStress, hiatusMarkOffset } from "./postlex";
import { tryStressNeutralSuffix, softenBaseFinal, preSuffixReduce } from "./morph-parser";
import {
  assignStress,
  LATIN_E_ROOT,
  isWeakLatinIte,
  FREE_I_NITE_ROOT,
  SILENT_HON_ROOT,
  SHORT_ANCY_ROOT,
  BORROWED_ROOT_FRAME,
  WEAK_RHOTIC_E_ROOT,
  PRICE_HIATUS_ARY_ROOT,
  MERGED_WEAK_DY_ROOT,
  VOWEL_TEIN_ROOT,
  isWeakThematicYRoot,
  URR_KIT_ROOT,
  FULL_INITIAL_O_FRAME,
  OPEN_I_WEAK_ROOT,
  secondaryStressIndices,
  syllabify,
  weakCheckedRate,
  syllableToIPA,
  EN_PREFIXES,
  PRO_CHECKED_ROOT,
  isHiatusSlot,
  KEEP_UNMERGED_AFTER_PREFIX,
} from "./syllabify";

export type EnglishDialect = "en-US" | "en-GB";

// --- Type Definitions ---

type EnDict = Record<string, string>;

export interface HomographEntry {
  pronunciation: string;
  pos: string;
  forms?: readonly string[];
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
  path: "dictionary" | "morphology" | "compound" | "decomposition" | "rules";
  syllables?: string[];
  steps: TraceStep[];
}

// Move the primary onto a word-final /eɪ/ (the -ation suffix syllable):
// every existing primary demotes to secondary, marks inside the consonant
// run before /eɪ/ are dropped, and the new mark goes before the longest
// licit onset of that run.
const VOWEL_CHAR = /[aeiouæɑɔəɛɪʊʌɝ]/;
function suffixPrimary(ipa: string): string {
  // A nasal-coda prefix before weak -form- centralizes FORCE when the
  // following -ation takes primary. Vowel-final prefixes retain FORCE.
  const s = ipa.replace(/ˈ/g, "ˌ").replace(/([nm]s?)(?:ˌ)?fɔɹ(?=meɪ$)/, "$1fɝ")
    .replace(/(?<=[td])ɪ(?=[ˈˌ]?[kɡ][ˈˌ]?eɪ$)|(?<=[ptk]j)u(?=[ˈˌ]?[td][ˈˌ]?eɪ$)/, "ə");
  let k = s.length - 2, v = k;
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
function copyLookup<T extends object>(table: T): T {
  return Object.assign(Object.create(null), table);
}
const DICTIONARY: EnDict = copyLookup(resolveJson<EnDict>(lookupTable));
// Spelled letter names are valid whole-token readings, not lexical stems
// for morphology or compound decomposition (GA must not become gas).
const INITIALISMS: EnDict = copyLookup(resolveJson<EnDict>(initialismTable));
function spellInitialism(word: string): string | undefined {
  if (!/^([A-Z]\.?){2,8}$/.test(word)) return undefined;
  const pronunciations = word.replace(/\./g, "").split("").map((letter) => INITIALISMS[letter.toLowerCase()]);
  if (!pronunciations.every(Boolean)) return undefined;
  const stress = word.includes(".") ? "" : "ˈ";
  return pronunciations.map((ipa) => stress + ipa.replace(/[ˈˌ]/g, "")).join("");
}

function spellSyllableInitialism(word: string, lowerWord: string, pos?: string): string | undefined {
  if (lowerWord.length === 1 && INITIALISMS[lowerWord] && (lowerWord !== "a" || pos === undefined || !isFunctionWord(lowerWord, pos))) return INITIALISMS[lowerWord];
  // Three-letter forms with an unlicensed onset are spelled (fbi/cpu),
  // using letter names. Native digraphs and borrowed onsets stay spoken.
  const onset = word === lowerWord && lowerWord.length === 3
    ? /^[bcdfghjklmnpqrstvwxz]{2,}(?=[aeiouy])/.exec(lowerWord)?.[0] : undefined;
  const unpronounceable = onset && !onset.includes("h") &&
    !/^(?:ng|sz|zs|vr|sr|[fsvz]{2}|([a-z])\1|[gkmp]n|wr|[pt]s|pt)$/.test(onset) &&
    !LICIT_ONSETS.has(onset.replace(/c/g, "k").replace(/g/g, "ɡ").replace(/r/g, "ɹ"));
  // A short vowel-letter head plus an impossible obstruent coda
  // cannot be an English citation syllable (ATM, IBM, USB, ISBN).
  // Keep native nasal-stop codas, silent digraphs and syllabic -sm spoken;
  // heterorganic nasal + voiced-stop codas cannot form these onsetless roots.
  const coda = word === lowerWord && /^[aeiou][bcdfghjklmnpqrstvwxz]{2,3}$/.test(lowerWord)
    ? lowerWord.slice(1).replace(/ck|c/g, "k").replace(/([a-z])\1/g, "$1") : undefined;
  const unlicensedCoda = coda && !/^([a-z])\1$/.test(coda) &&
    (/^(?:m[dg]|nb)$/.test(coda) ||
      /^[bdgkpt]m$/.test(coda) || /^[bcdfgkptsvz]{2}[lmn]$/.test(coda) ||
      /^[bdgkpt][bgkp]$/.test(coda) || /^s[bg]$/.test(coda));
  // Hummed forms, sh, and the ordinal -nth are phonological spellings, not letter sequences.
  return spellInitialism(word) ?? (/^[bcdfghjklmnpqrstvwxz]{2,}$/.test(lowerWord) && !/^(?:hm+|shh?|m{2,}|n+th)$/.test(lowerWord) && !/gm/.test(lowerWord) || unpronounceable || unlicensedCoda
    ? spellInitialism(word.toUpperCase())?.replace(/ˈ(?=.*ˈ)/g, "ˌ") : undefined);
}

const HOMOGRAPHS: HomographDict = copyLookup(resolveJson<HomographDict>(homographs));
// Statistically-verified compound parts (scripts/mine-compound-parts.ts):
// heads/tails that earn ≥10% join-accuracy against the lexicon when
// paired with any verified partner. Both sides must match for a split.
const COMPOUND_PARTS = resolveJson<{
  heads: EnDict;
  tails: EnDict;
  tailsReversed: EnDict;
}>(compoundParts);
const COMPOUND_HEADS: EnDict = copyLookup(COMPOUND_PARTS.heads);
const COMPOUND_TAILS: EnDict = copyLookup(COMPOUND_PARTS.tails);
// Tails verified ONLY via the tail keeping its own primary (never once via
// the ordinary head-primary convention) — see the matching comment in
// mine-compound-parts.ts. tryCompoundSplit joins these the other way
// around, so a word like overdone gets the dict's actual ˌoʊvɝˈdʌn instead
// of a segmentally-right but stress-backwards ˈoʊvɝˌdʌn.
const COMPOUND_TAILS_REVERSED: EnDict = copyLookup(COMPOUND_PARTS.tailsReversed);
const VERB_PARTICLE = /^(?:down|up|out|off|over|under|back)$/;
// Boundary degemination for compound joins (book+kayak style overlaps).
const COMPOUND_GEMINATE_RE = /([pbtdkɡfvszʃʒθðmnŋɫɹ])(ˌ?)\1/g;

// --- Linguistics-based Constants ---

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

// Shared spelling evidence for restored -able roots and vouched prefix tails.
const SHORT_SILENT_E_ROOT = /^[^aeiouy][aiou][bcdfghjklmnpqrstvz]e$/;

// True when the primary stress sits on the last vowel nucleus of `ipa`.
const FINAL_STRESS_RE = /ˈ[^aeiouɑæɛɪɔʊʌəɝ]*[aeiouɑæɛɪɔʊʌəɝ]+[^aeiouɑæɛɪɔʊʌəɝ]*$/;

// A restored silent-e candidate is only a real silent e when the resulting
// pronunciation still ends in a consonant; a vowel-final result means the
// hit is a pronounced-e loanword instead (passé, café), not a magic-e stem.
// Shared by every morphology handler below that restores a dropped -e.
const ENDS_IN_VOWEL_RE = /[aeiouɑæɛɪɔʊʌəɝ]$/;

// A recovered stem is usable as a morphology base when its
// pronunciation ends in a consonant — except a coda /ɝ/, which is the
// genuine outcome of a dropped silent-e -ire/-ure ending (desire,
// injure, measure) and carries its own glide/palatalization a bare
// no-e stem lacks, so it's exempted from the vowel check too. That
// exemption is withheld at 4+ syllables: caricature/caricatured is a
// genuine, isolated lexical exception (CMUdict shifts its primary onto
// the 2nd syllable, unlike capture/picture/feature/fracture/gesture),
// and the bare-stem fallback's own stress-assignment quirk on a
// 4-syllable, final-e-less word happens to already reproduce that
// exact shift — see the -ed/-ing and -s-plural call sites below for
// the measured win/loss evidence. Lexical and rule-derived stems use
// the same eligibility check.
const isUsableConsonantStem = (ipa: string, base: string): boolean =>
  !ENDS_IN_VOWEL_RE.test(ipa) || (ipa.endsWith("ɝ") && syllabify(base).length < 4);

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
// INTEGRATOR NARROWING (2026-09-28, merging worktree agent-aad1c09cb2c5d441b's
// de+si- voicing rule): a base ending in the silent-g "-ign/-aign" digraph
// (design, resign, align, campaign, benign) is excluded even when the
// bisyllabic allowance would otherwise admit it. That digraph is read by
// its own PHONEME_RULES entry (`^ign(?=s?$)`/`^[kg]n`), which depends on
// the cluster sitting at the literal end of the syllable; syllabify()
// resplits a fabricated "designe"/"campaigne" as de·sig·ne/cam·paig·ne,
// handing the "n" to the new fake "ne" syllable and leaving a bare
// "sig"/"paig" behind that reads with a hard /ɡ/ instead. This was
// invisible while every -ign/-aign word stayed a table hit (campaigned/
// campaigning still are: "campaign" itself remains in exceptions.json, so
// this fabricated-e branch is never reached), but the de+si- voicing rule
// makes bare "design" rule-exact for the first time, and its regular
// -ed/-ing/-s forms hit exactly this dormant path (designed → dɪˈzɪɡnd,
// not dɪˈzaɪnd). No real English word takes a genuine dropped-e spelling
// after this digraph, so the exclusion costs nothing the allowance was
// ever meant to cover.
// INTEGRATOR NARROWING (2026-09-28, dependency-aware-eviction booking
// regression): a base ending in "ook"/"ood" is excluded outright, the
// same shape as the gn$ exclusion above and for the identical reason.
// syllabify() strands that digraph open the same way it opens a real
// magic-e vowel (ho·pe, ba·ke): the coda consonant becomes the
// fabricated "e" syllable's onset, and ook/ood are rimes where the
// CLOSED digraph gets a different vowel than its open default (^ook/
// ^ood "ʊ" vs the open ^(?:ui|oo|ue) "u") — so the fabricated probe
// silently picks the open one: booking → "boo·ke" → /bukɪŋ/, not
// /bʊkɪŋ/ (also looking/looked, overbooked/overbooking). None of these
// -ing/-ed forms are dict.json headwords (ipa-dict doesn't list every
// inflection separately), so rule-diff over the exceptions-table
// comparison is a no-op here (0 changed both ways) — the real evidence
// is runtime: yarn test:common-accuracy word-diffed against the
// pre-fix report, +3/−0 (looking, looked, booking newly correct, zero
// regressions), and yarn test:parity/test:eval/evaluate-strict/
// test:homographs all held exactly flat, since none of the words this
// touches are in data/en/dict.json either.
//
// The identical mechanism also breaks "ead" (dreaded → "drea·de" →
// /dridɪd/, not /dɹɛdɪd/; also treaded, spearheaded/spearheading,
// overbooked's sibling "unleaded"), but ead is NOT excluded here: "lead"
// is a genuine heteronym (metal /lɛd/ vs verb /lid/, in the homographs
// table), and the open reading this bug produces for the fabricated
// probe happens to equal the correct DEFAULT verb reading for "leading"
// — "lead" alone, read by the plain rules with no homograph lookup
// (this internal fallback never passes a pos), gives the closed /lɛd/
// metal reading, so excluding ead flips "leading" ˈɫidɪŋ → ˈɫɛdɪŋ, a
// real common-word regression (dict ˈɫidɪŋ) for a net gain of one
// strict word (unleaded) elsewhere. Measured both ways: excluding ead
// scores strict 1 : 1, lenient 4 : 0, common strict 0 : 1 (leading) —
// a real regression on the metric that gates this fix, so left open.
// An -ear rime is complete without silent e. Restoring e can select
// another lexeme (beare), changing the real root vowel in bearing.
// A complete -sist root keeps its bound-root stress, rather than the
// different full-word frame of a fabricated assiste/persiste.
// Checked k/l+ost roots cannot be restored as the long-vowel loan/name
// -oste frame (costed must not take the supplied surname Coste).
// Longer -bol derivatives are bound Greek roots, including their
// neutral inflections; short symbol/embol nouns retain citation stress.
const isBoundBol = (word: string): boolean => /bol(?:ism|ize)$/.test(word) && syllabify(word).length >= 4;
// Matching compound roles keep these roots available after lexical eviction.
const vouchedIndRoot = (word: string): string | undefined =>
  /ind$/.test(word) && COMPOUND_HEADS[word] && COMPOUND_HEADS[word] === COMPOUND_TAILS[word] ? COMPOUND_HEADS[word] : undefined;

// Short -ost agents keep complete roots; longer bound Latin stems
// do not acquire an unrelated free post/host/most reading.
const NO_DROPPED_E = /(?:ocus|ear|sist|ia(?:l|s|nt|r)|uel|oe[mt]|[ckl]ost|^[hmp]ost|x)$/;

// Recover this open-vowel stem frame across inflection and prefix eviction.
const hasOpenStopRStem = (word: string, suffix = ""): boolean => word.endsWith(suffix) && /[aeiouy][bcdgkpt]r$/.test(word.slice(0, word.length - suffix.length));
// Open Cy/ary and weak eavy roots retain their boundary after eviction.
const OPEN_Y_ROOT = /eavy$|^[^aeiouy]*(?:o[nsz]y|i(?:[ncz]y|[mn]ary|brary|vory))$/;
// These complete weak sonorant rimes retain their bare-root frame.
// Prefix + strong -ile still restores a supplied silent-e stem.
const hasWeakSonorantRime = (b: string): boolean =>
  /eaven$/.test(b) || /^e[^aeiouyrx][ei][ln]$/.test(b) || /[cgsv]il$/.test(b) && syllabify(b).length > 1 && !EN_PREFIXES.has(syllabify(b)[0]);
const MAGIC_E_CANDIDATE = (base: string): boolean =>
  !/([bcdfgklmnprst])\1$/.test(base) &&
  !/(?:gn|ook|ood)$/.test(base) && !NO_DROPPED_E.test(base) &&
  !hasWeakSonorantRime(base) &&
  (/[aeiouy][bcdfghjklmnpqrstvwxz]$/.test(base) ||
    /[cgsvl]$/.test(base) ||
    /(?:st|th)$/.test(base) ||
    syllabify(base).length === 2);

// Preserve the ASCII-only lowercase gate without a duplicate character scanner.
// Irish O' surnames keep their prefix when input casing is inconsistent.
// O'clock is a separate contraction, not an O' + name compound.
const isIrishOPrefix = (word: string): boolean => /^o'[a-z]{2,}$/i.test(word) && !/^o'clock$/i.test(word);

// Exactly one contiguous vowel nucleus, including diphthongs.
const isMonosyllable = (ipa: string): boolean => /^[^aeiouɑæɛɪɔʊʌəɝ]*[aeiouɑæɛɪɔʊʌəɝ]+[^aeiouɑæɛɪɔʊʌəɝ]*$/.test(ipa);
const dropStemYod = (ipa: string): string => isMonosyllable(ipa) ? ipa.replace(/([tdnlszɹθðʃʒ])j(?=u$|ʊɹ$)/, "$1") : ipa.replace(/(ˈs?[tdnlszɹθðʃʒ])j(?=u|ʊɹ)/, "$1");

// Regular English -s allomorph based on the final phoneme of `ipa`:
//   /ɪz/ after a sibilant (s z ʃ ʒ tʃ dʒ),
//   /s/  after a voiceless obstruent (p t k f θ),
//   /z/  otherwise (voiced consonant or vowel).
// Used for possessive/plural -'s. `ipa` may carry a trailing dark /ɫ/.
function sAllomorph(ipa: string): string {
  const last = ipa[ipa.length - 1];
  // A sibilant affricate's last IPA char is already ʃ/ʒ, so no separate
  // two-char check is needed for tʃ/dʒ.
  return ["s", "z", "ʃ", "ʒ"].includes(last)
    ? "ɪz"
    : ["p", "t", "k", "f", "θ"].includes(last)
      ? "s"
      : "z";
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
  tagWord(word: string, context?: { prev?: string; next?: string; sentence?: PredictionContext }):
    { pos: string; confidence: number } {
    // Positional: [prev, next]. An empty prev must stay in its slot, or a
    // sentence-initial word would read its NEXT word as its previous one.
      const result = simplePOSTagger.tagWord(word, [context?.prev ?? "", context?.next ?? ""], context?.sentence), sentence = context?.sentence, index = sentence?.index ?? -1;
    // A final homograph after clause-level that is a demonstrative NP after a verb;
    // a noun antecedent still owns the relative-clause verb reading.
    if (result.pos.startsWith("V") && context?.prev?.toLowerCase() === "that" && sentence && !context.next &&
      this.homographs[word.toLowerCase()]?.some(({ pos }) => pos === "N" || pos.startsWith("!")) && index >= 2 &&
      simplePOSTagger.tagWord(sentence.words[index - 2], [sentence.words[index - 3] ?? "", sentence.words[index - 1] ?? ""],
        { ...sentence, index: index - 2 }).pos.startsWith("V")) return { pos: "N", confidence: 0.8 };
    return { pos: result.pos, confidence: result.confidence };
  }

  predictWithContext(word: string, context: PredictionContext, language?: string, pos?: string): string | null { return this.predict(word, language, pos, context); }

  predict(word: string, language?: string, pos?: string, context?: PredictionContext): string | null {
    // Language tag handling. Fast-path "en"/"en-us"/"en-gb" before
    // falling back to the BCP-47 regex parser. toLowerCase is needed
    // because tags are case-insensitive ("en-GB" must match "en-gb").
    let dialect: EnglishDialect = this.dialect;
    if (language !== undefined) {
      const tag = language.toLowerCase();
      if (tag !== "en") {
        if (!tag.startsWith("en-")) return null;
        const region = tag === "en-us" ? "us" : tag === "en-gb" ? "gb" : BCP47_REGION_RE.exec(tag)?.[1];
        if (region === "gb") dialect = "en-GB";
        else if (region === "us") dialect = "en-US";
      }
    }

    // User-supplied custom pronunciations short-circuit dialect
    // routing: if the caller explicitly set a pronunciation via
    // addPronunciation(), they presumably picked one that's right
    // for their use case. Don't run the RP transform over it.
    word = word.replace(/[‘’]/g, "'");
      const lowerWord = word.toLowerCase(), custom = this.customDict[lowerWord];
    if (custom !== undefined) return custom;

    // Clitic contractions and possessives: split at a trailing
    // apostrophe, predict the stem, and append the clitic's phonemes.
    // Without this the whole token ("island's", "I'm", "we'll") misses
    // every lookup and the rules mangle it (island's → /ɪˈsɫænds/,
    // I'm → /ɪm/, we'll → /wɛɫ/). The apostrophe (straight ' or curly ’)
    // must sit near the end, so word-internal ones (o'clock, y'all) are
    // left for the normal path. See CLITICS for the segments.
    let clipped: string | undefined;
    const aposAt = lowerWord.lastIndexOf("'");
    if (aposAt > 0 && aposAt >= lowerWord.length - 3) {
      const tail = lowerWord.slice(aposAt + 1), stem = lowerWord.slice(0, aposAt);
      // Written -in' restores an attested unstressed -ing base before nasal fronting.
      const full = !tail && /in$/.test(stem) && this.wellKnown(stem + "g", pos);
      if (full && /[aeiouɑɔæɛɪʊʌəɝ][^ˈˌ]*ɪŋ$/.test(full)) clipped = full.replace(/ŋ$/, "n");
      // A bare trailing apostrophe is the plural possessive (accountants',
      // dogs'): the stem already carries its -s and nothing is added.
      const clitic = CLITICS[tail];
      if (clitic !== undefined && !clipped) {
        // An apostrophe licenses letter names without changing bare a/i or lexical stems.
        const letter = tail && aposAt === 1 && this.customDict[stem] === undefined && INITIALISMS[stem];
        let stemIpa = letter ? applyPhonotactics(letter, stem) : this.predict(word.slice(0, aposAt), language, pos);
        if (letter && stemIpa) {
          if (dialect === "en-GB") stemIpa = transformAmericanToRP(stem, stemIpa);
          if (pos !== undefined && isMonosyllable(stemIpa)) stemIpa = stemIpa.replace(STRESS_PRIMARY, "");
        }
        if (stemIpa) return stemIpa + (tail === "s" ? sAllomorph(stemIpa) : clitic);
      }
    }

    const readings = this.homographs[lowerWord];
    // A shared base/noun form before a nominal head needs no past-tense reading.
    const form = !this.disableDict && context && readings?.some(entry => entry.forms) &&
      context.words[context.index]?.toLowerCase().replace(/[‘’]/g, "'") === lowerWord
      ? inferVerbForm(context) ?? (pos === "!V" && /^(?:[a-z]{2,}s|[a-z]+(?:tion|sion|ment|ness|ity|th))$/.test(context.words[context.index + 1]?.toLowerCase() ?? "") && !isFunctionWord(context.words[context.index + 1] ?? "") && readings.some(entry => entry.forms?.includes("base") && entry.pos.split(",").includes("N")) ? "base" : undefined) : undefined;
    const contextual = form && (form !== "past" || pos?.startsWith("V"))
      ? readings?.find(entry => entry.forms?.includes(form))?.pronunciation : undefined;

    // Principled pipeline (opt-in). See class field doc + P5 status.
    if (this.enablePrincipled && !this.disableDict && !contextual) {
      const principled = predictPrincipled(lowerWord, (w: string) => {
        return this.customDict[w] ?? this.dictionary[w];
      });
      if (principled) return principled.ipa;
    }

    const base =
      clipped ?? contextual ??
      this.geminateVariant(lowerWord, pos) ??
      this.predictInternal(word, pos, this.disableDict, context);
    if (!base) return base;

    // Universal phonotactic post-processing (en-phonotactics.ts).
    // Each rule self-guards with a cheap pre-check; the dispatcher
    // costs roughly O(rule-count) substring scans when nothing fires.
    const lexicalVelarED = !this.disableDict && /(?:k|ɡ)əd$/.test(this.customDict[lowerWord] ?? this.dictionary[lowerWord] ?? "");
    const postBase = applyPhonotactics(base, lowerWord, pos, lexicalVelarED);

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
      const lowerWord = word.toLowerCase(), ipa = this.predict(word, language, pos) ?? lowerWord;
    // Every non-rule path reports the whole word as one step, named by
    // the lookup that produced it.
    const via = (path: TraceResult["path"], rule: string): TraceResult => ({
      word,
      ipa,
      path,
      steps: [{ grapheme: word, phoneme: ipa, rule }],
    });

    if (!this.disableDict) {
      if (pos && Array.isArray(this.homographs[lowerWord]) &&
          this.homographs[lowerWord].some((entry: HomographEntry) => this.matchPos(entry, pos)))
        return via("dictionary", "homograph");
      if (this.customDict[lowerWord]) return via("dictionary", "custom-dict");
      if (this.dictionary[lowerWord] || INITIALISMS[lowerWord])
        return via("dictionary", "dict");
      if (this.geminateVariant(lowerWord, pos)) return via("dictionary", `geminate-stem:${lowerWord.slice(0, -1)}`);
    }
    if (isIrishOPrefix(word.replace(/[‘’]/g, "'"))) return via("rules", "irish-O-prefix");
    if (this.tryMorphologicalAnalysis(lowerWord)) return via("morphology", "morphology");

    // Trace the same compound priority as predictInternal, rather than
    // attributing a supplied compound IPA to rules that never rendered it.
    if (this.tryCompoundSplit(lowerWord)) return via("compound", "compound");
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

    if (spellSyllableInitialism(word, lowerWord)) return via("rules", "initialism:letter-spelling");

    const traceSteps: TraceStep[] = [];
    const { syllables } = this.ruleSyllables(lowerWord, undefined, traceSteps);
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
    if (this.disableDict || !FINAL_GEMINATE_RE.test(lowerWord) || this.wellKnown(lowerWord, pos, true) || INITIALISMS[lowerWord]) return undefined;
    return this.wellKnown(lowerWord.slice(0, -1), undefined, true);
  }

  private predictInternal(
    word: string,
    pos?: string,
    disableDict?: boolean,
    context?: PredictionContext,
  ): string {
    // Avoid re-allocating lowerWord when the caller already lowercased
    // (true for predict() which is the dominant entry point). Most words
    // arrive lowercase already, so toLowerCase would just create a copy.
    const lowerWord = /[A-Z]/.test(word) ? word.toLowerCase() : word;

    // Recursive renders retain caller-owned roots before morphology and hyphens.
    const custom = this.customDict[lowerWord];
    if (custom !== undefined) return custom;

    // Priority 1: Handle hyphenated compounds. Cheap indexOf gate before
    // allocating the split-array.
    const dashAt = lowerWord.indexOf("-");
    if (dashAt > 0 && dashAt < lowerWord.length - 1 &&
        lowerWord.indexOf("-", dashAt + 1) < 0) {
      const part1 = this.predictInternal(lowerWord.slice(0, dashAt), pos, disableDict), part2 = this.predictInternal(lowerWord.slice(dashAt + 1), pos, disableDict);
      // Both nonempty parts retain a spelling or a stress-marked rule rendering.
      return part1.replace(STRESS_PRIMARY, "") + "ˈ" + part2.replace(STRESS_PRIMARY, "");
    }

    // Priority 2: Direct lookups (Dictionary, Homographs) - check known words first
    if (!disableDict) {
      const knownPronunciation = this.wellKnown(lowerWord, pos, true); // Skip morphology here to avoid re-running
      if (knownPronunciation) return knownPronunciation; if (INITIALISMS[lowerWord]) return spellInitialism(word) ?? INITIALISMS[lowerWord];
    }

    // Three-slot be- forms can take stress on the lexical silent-e root
    // (be·have). Require an independently vouched root pronunciation;
    // compound-part membership alone also admits surname fragments.
    const beSlots = lowerWord.startsWith("be") ? syllabify(lowerWord) : [], beRoot = beSlots.length === 3 && beSlots[0] === "be" && /^[^aeiouy]*[^aeiouyl]e$/.test(beSlots[2]) ? lowerWord.slice(2) : undefined;
    if (beRoot && !beRoot.endsWith("s") && this.wellKnown(beRoot, pos, true)) return this.renderRuleForm(lowerWord, 1);

    if (isIrishOPrefix(word)) return `oʊ${this.predictInternal(word.slice(2), pos, disableDict)}`;

    // Priority 3: Morphological analysis - only for unknown words
    const morphPron = this.tryMorphologicalAnalysis(lowerWord,
      word === lowerWord && (lowerWord.endsWith("ing") || pos?.startsWith("V") === true),
      pos === "V" && context !== undefined && hasFiniteObjectFrame(context), pos === undefined || pos === "N");
    // Morphology also needs suffix secondary stress and the -ation shift.
    if (morphPron) return applyPostStress(morphPron, lowerWord);

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
      const thematicHead = decomposition.length === 2 && /o$/.test(decomposition[0]) && (/(?:ic(?:al(?:ly)?|it(?:y|ies))?|ian)s?$/.test(decomposition[1]) || BORROWED_ROOT_FRAME.test(decomposition[1]) && syllabify(decomposition[1])[0] === "ab");
      const pronunciations = decomposition.map((part, index) => this.wellKnown(part) ||
        (index === 1 && thematicHead || BORROWED_ROOT_FRAME.test(part)
          ? this.predictInternal(part, undefined, true)
          : FREE_I_NITE_ROOT.test(part) ? this.renderRuleForm(part) : undefined));
      if (pronunciations.every((p): p is string => !!p)) {
        // Stress in compounds and prefixed forms: exactly one primary
        // stress on the head, secondary on the rest. The head is the
        // semantic root — for noun compounds (light+house) that's the
        // first element, for prefix+stem (in+dispense, un+happy) it's
        // the stem (skip the prefix). Internal stress within the head
        // part is preserved verbatim; other parts have their ˈ demoted
        // to ˌ. This replaces the previous behavior of slapping
        // primary stress on every part, which produced multi-stress
        // outputs like ˈɪnˈdaɪˈspɛnsəbəl.
        // An -o combining head modifies the following technical adjective.
        const headIdx = EN_PREFIXES.has(decomposition[0]) || thematicHead ? 1 : 0;
        if (thematicHead && !this.customDict[decomposition[0]] && /[^aeiouy]{2}o$/.test(decomposition[0]))
          pronunciations[0] = this.renderRuleForm(decomposition[0]);
        return pronunciations
          .map((p, idx) => idx === headIdx ? p : p.replace(/ˈ/g, "ˌ"))
          .join("");
      }
    }

    // Priority 6: Handle acronyms with or without periods, e.g., "TTS" or "M.L."
    // Dental, open-KIT and consonantal -ye roots keep word readings after eviction; registered initialisms take priority.
    const rendered = (!(/^(?:th[aiu]|[bcdfghjklmnpqrstvwxz]+ye$|acqu(?!ie)[aeiouy].)/.test(lowerWord) || /[ei]sce$/.test(lowerWord) || OPEN_I_WEAK_ROOT.test(lowerWord) || /th$/.test(lowerWord) && isFunctionWord(lowerWord)) && spellSyllableInitialism(word, lowerWord, pos)) || this.renderRuleForm(lowerWord);
    // Finite monosyllabic -use verbs voice s; ambiguous to-nominals retain their route.
    return pos?.startsWith("V") && /^[bcdfghjklmnpqrstvwxz]*use$/.test(lowerWord) && isMonosyllable(rendered) &&
      (!context || context.words[precedingContextIndex(context)]?.toLowerCase() !== "to") ? rendered.replace(/us$/, "uz") : rendered;
  }

  private matchPos(entry: HomographEntry, pos: string): boolean {
    return entry.pos.replace(/^!/, "").split(",").includes(pos) !== entry.pos.startsWith("!");
  }

  private wellKnown(
    word: string,
    pos?: string,
    skipMorphology = false,
  ): string | undefined {
    const homograph = pos && Array.isArray(this.homographs[word])
      ? this.homographs[word].find(entry => this.matchPos(entry, pos)) : undefined;
    // POS readings retain priority; a lexical-only caller never re-enters morphology.
    return homograph ? homograph.pronunciation : this.customDict[word] || this.dictionary[word] ||
      vouchedIndRoot(word) || (/^[bcdfghjklmnpqrstvwxz]+ye$/.test(word) ? this.renderRuleForm(word) : undefined) ||
      (skipMorphology ? undefined : this.tryMorphologicalAnalysis(word));
  }

  private silentEAgentRoot(stem: string, lexicalOnly = false): string | undefined {
    if (!/^[^aeiouy]+[aiouy][bcdfghjklmnpqrstvz]$/.test(stem) || this.customDict[stem]) return undefined;
    const restored = this.wellKnown(stem + "e", undefined, true) || (!lexicalOnly ? COMPOUND_HEADS[stem + "e"] || COMPOUND_TAILS[stem + "e"] : undefined);
    if (restored && isUsableConsonantStem(restored, stem)) return restored;
    return !lexicalOnly && /^[^aeiouy]+u[bcdfghjklmnpqrstvz]$/.test(stem) && !this.wellKnown(stem, undefined, true) ? this.renderRuleForm(stem + "e") : undefined;
  }

  private tryMorphologicalAnalysis(word: string, preferVerbStem = false, finiteObject = false, nominal = true): string | undefined {
    // A stripped base is read from the lexicon (never re-decomposed, or
    // "chas" would morphologise to cha+s), and for most suffixes falls
    // back to its whole-word prediction.
    const lowerWord = word.toLowerCase(), lex = (b: string): string | undefined => this.customDict[b] || dropStemYod(this.wellKnown(b, undefined, true) ?? "") || undefined;
    // A final doubled z is still one sibilant phoneme in the singular;
    // compose the plural with the regular /ɪz/ allomorph instead of
    // syllabifying the artificial `-zze` stem (quiz → quizzes, buzz →
    // buzzes). Keep the root rule-derived so this covers the spelling
    // class without a per-word pronunciation entry.
    if (/zzes$/.test(lowerWord)) {
      const root = this.predictInternal(lowerWord.slice(0, -2), undefined, true);
      if (root.endsWith("z")) return root + sAllomorph(root);
    }
    // The productive -ident → -idential adjective family keeps the base's
    // vowels and moves its lexical stress to -ential (president,
    // resident, confident). Reuse the independently predicted base rather
    // than re-syllabifying the longer spelling, which weakens its root.
    const idential = /^(.+ident)ial$/.exec(lowerWord), identRoot = idential && (this.predictInternal(idential[1], undefined, true) || lex(idential[1])), identTail = identRoot?.match(/^(.*?)([ˈˌ]?d[əɛ]nt)$/); if (identTail) return identTail[1].replace(/ˈ/g, "ˌ") + "ˈdɛnʃəl";
    // A written y-final verb stem ending in <rry> changes y→i before -age:
    // carry→carriage, marry→marriage. Reuse the attested/rule-rendered stem
    // vowel so spelling the new suffix does not reset the root (carriage
    // retains CARRY's /æ/, while marriage retains MARRY's /ɛ/). Other
    // -riage words such as triage do not have an <rry> base and stay whole.
    const rryAgeRoot = /riage$/.test(lowerWord) ? lowerWord.slice(0, -4) + "y" : "", rryAgePron = rryAgeRoot.endsWith("rry") ? this.wellKnown(rryAgeRoot, undefined, true) || this.renderRuleForm(rryAgeRoot) : ""; if (rryAgePron.endsWith("ɹi") && !rryAgePron.includes("ˌ")) return rryAgePron.slice(0, -1) + "ɪdʒ";
    // Trochaic weak-a bases retain their root before -ese; longer feet need separate reduction.
    const ese = /^([a-z]{3,})ese$/.exec(lowerWord), eseRoot = ese && lex(ese[1] + "a");
    if (eseRoot?.startsWith("ˈ") && eseRoot.endsWith("ə") && isMonosyllable(eseRoot.slice(1, -1))) return suffixPrimary(eseRoot.slice(0, -1) + "iz");
    // Single-nucleus tails retain proto- head stress; regular plurals keep their singular route.
    const proto = !/[^s]s$/.test(lowerWord) && /^proto([^aeiouy]*[aeiouy][^aeiouy]+e?)$/.exec(lowerWord), protoTail = proto && (lex(proto[1]) || this.predictInternal(proto[1], undefined, true));
    if (protoTail && isMonosyllable(protoTail)) return (this.customDict["proto"] || COMPOUND_HEADS["proto"]) + protoTail.replace(/ˈ/g, "ˌ");
    // Keep ng's independent base guard; PRICE-ild must agree with its counterpart.
    const grade = /^(.*(?:ng|ild))(er|est)$/.exec(lowerWord), ngGrade = grade && /ng$/.test(grade[1]);
    const gradeBase = grade && (ngGrade ? this.dictionary[grade[1]] || COMPOUND_HEADS[grade[1]] : this.dictionary[grade[1]] || COMPOUND_HEADS[grade[1]] || COMPOUND_TAILS[grade[1]] || this.renderRuleForm(grade[1]));
    const alternate = grade && (ngGrade ? /ŋ$/.test(gradeBase || "") : /aɪ[ɫl]d$/.test(gradeBase || "")) && lex(grade[1] + (grade[2] === "er" ? "est" : "er"));
    const gradeMatch = alternate && (ngGrade ? /ŋɡ?(?:[əɪ]st|ɝ)$/ : /aɪ[ɫl]d(?:[əɪ]st|ɝ)$/).test(alternate);
    if (grade && alternate && gradeMatch) return (this.customDict[grade[1]] || alternate.replace(/(?:[əɪ]st|ɝ)$/, "").replace(/ŋ$/, "ŋɡ")) + (grade[2] === "er" ? "ɝ" : "əst");
    // -ed/-ing derive from a verb even when the result is an adjective.
    // Prefer an annotated base to a V-labelled irregular past. !N also
    // includes adjectives/adverbs and cannot vouch for a verb stem.
    // Caller overrides retain ownership of an independently vouched root.
    const verbReading = (b: string): string | undefined => {
      const entry = this.homographs[b]?.find(entry => entry.forms?.includes("base")) || this.homographs[b]?.find(entry => entry.pos.split(",").includes("V"));
      return entry ? this.customDict[b] || entry.pronunciation : undefined;
    };
    const verbStem = (b: string, skipMorphology = false): string | undefined => {
      const p = verbReading(b) || this.wellKnown(b, undefined, skipMorphology) ||
        (!skipMorphology && b.length === 5 ? this.tryCompoundSplit(b) : undefined) ||
        ((hasWeakSonorantRime(b) || skipMorphology && BORROWED_ROOT_FRAME.test(b)) ? this.predictInternal(b, undefined, true) : undefined);
      // The r in a weak written pro- onset precedes its vowel, rather than coloring it.
      return !this.customDict[b] && /^pro[^aeiouy]/.test(b) ? p?.replace(/^pɝ(?=ˈ)/, "pɹə") : p;
    };
    // In the <velop> verb family, the inflection attaches to the attested
    // bare root: develop + ed/ing, envelop + ed/ing. Treating the missing
    // final e as silent incorrectly invents *develope and turns /ə/ to /oʊ/.
    const velopInflection = /^(.*velop)(ed|ing)$/.exec(lowerWord);
    if (velopInflection) { const stem = verbStem(velopInflection[1], true) || this.predictInternal(velopInflection[1], undefined, true); if (stem) return stem + (velopInflection[2] === "ing" ? "ɪŋ" : /[td]$/.test(stem) ? "ɪd" : /[pksʃfθ]$/.test(stem) ? "t" : "d"); }
    // Keep liquid-final roots before vowel suffixes; only NURSE roots use this
    // before -ed, preserving START schwa and syllabic-l past-tense readings.
    const liquidStem = (b: string, sfx: "ed" | "ing" | "er"): string | undefined =>
      ((sfx === "ed" ? /[eiuy]rl$/ : /[aeiouy]rl$/).test(b) || sfx === "ing" && /mpl$/.test(b))
        ? verbStem(b, true) || this.predictInternal(b, undefined, true) : undefined;
    // A suffix-stripped stem ending in the French silent-e "cre"/"tre"/
    // "bre" rime (see syllabify.ts's ^cre$/^tre$/^bre$ PHONEME_RULES
    // entries, candidate c) is never a genuine free word once lex(b) has
    // already come up empty — "incre" (increment − ment), "cre" (creal −
    // al), "mccre" (mccreless − less) aren't English words, but
    // predictInternal's whole-word path wrongly treats their fabricated
    // final syllable as the true word-final "-cre"/"-tre"/"-bre" position
    // that rule is for (acre, centre, fibre). Reject the rule fallback
    // for that shape so the suffix handler falls through to its next
    // candidate instead.
    // An owned borrowed noun frame retains its complete silent-re root.
    const stemPron = (b: string): string | undefined => {
      const p = lex(b) || (/[cbt]re$/.test(b) && !BORROWED_ROOT_FRAME.test(b) ? undefined : this.predictInternal(b, undefined, false));
      // Letter names are whole tokens, never a lexical suffix base
      // (the supplied ITA spelling cannot explain Italy's -ly).
      return p?.replace(/[ˈˌ]/g, "") === spellInitialism(b.toUpperCase())?.replace(/[ˈˌ]/g, "") ? undefined : p;
    };
    // Before -able/-ance, restore a supplied -y stem or a short root
    // whose initial stress stays stable. Bound -ci- retains coalescence.
    // Retain supplied secondary stress when the verb has identical phones and primary stress.
    const deverbal = (b: string): string | undefined => { const v = verbReading(b), p = lex(b); return v && p && v.replace(/ˌ/g, "") === p.replace(/ˌ/g, "") ? p : v; };
    const restoreY = (stem: string): string | undefined => {
      if (!/[^aeiouy]i$/.test(stem) || /ci$/.test(stem)) return undefined;
        const base = stem.slice(0, -1) + "y", y = deverbal(base) || lex(base) || (MERGED_WEAK_DY_ROOT.test(base) ? stemPron(base) : undefined), slots = syllabify(stem);
      return y || (slots.length <= 2 && assignStress(slots, stem) === 0 ? this.predictInternal(stem.slice(0, -1) + "y", undefined, false) : undefined);
    };
    // Transparent privative prefixes keep the attested root's stress.
    // Vowel-initial adjectival/participial stems retain this boundary;
    // uni-/unus spellings stay on the whole-word path. Under- is a distinct
    // longer prefix. Short remnants are insufficient stem evidence.
    // Attested -uit + adjective -y is a single /ui/ nucleus (fruity).
    // Preserve the supplied/derived/compound root in prefixed adjectives;
    // Latin -uity nouns have no /ut/ base (annuit itself has /uɪt/).
      const uityBase = lowerWord.endsWith("uity") && lowerWord.slice(0, -1), uityRoot = uityBase && (lex(uityBase) || this.tryMorphologicalAnalysis(uityBase) || this.tryCompoundSplit(uityBase) || COMPOUND_TAILS[uityBase]);
    if (uityRoot && /ut$/.test(uityRoot)) return uityRoot + "i";
    // -able/-ible -> -ability/-ibility keeps the supplied or derived
    // adjective root, with primary on -bil-. Verified noun compounds
    // (in + stability) precede a fabricated adjective spelling.
    // A diphthong offglide is not the weak suffix vowel (able/stable).
    // Frozen batch: strict +11/-0, lenient +9/-4 across 105067 words.
    if (/(?:a|i)bility$/.test(lowerWord)) {
      const compound = this.tryCompoundSplit(lowerWord);
      if (compound) return compound;
      const b = lowerWord.slice(0, -5) + "le", p = lex(b) || this.predictInternal(b, undefined, false);
      if (p && /(?<![eaoɔˈ])[əɪ]b[əɪ]?[lɫ]$/.test(p)) return p.replace(/ˈ/g, "ˌ").replace(/(?<![eaoɔˈ])[əɪ]b[əɪ]?[lɫ]$/, "əˈbɪləti");
    }
    // Fused comparative phrases keep weak the and a full final word,
    // unlike the adjective suffix -less. Vouched consonantal heads
    // exclude silent-the roots and their fragments (blithe/scathe).
    const linked = /^([a-z]{3,})the(less|more)$/.exec(lowerWord);
    if (linked) {
      const head = lex(linked[1]) || COMPOUND_HEADS[linked[1]], article = lex("the"), tail = stemPron(linked[2]);
      if (head && article && tail && isUsableConsonantStem(head, linked[1]))
        return head.replace(/ˈ/g, "ˌ") + reduceToWeakForm(article) + tail;
    }
    // Deictic compounds keep complete function-word rimes. The about
    // family keeps its lexical head stress and stays on its old path.
    // Normalize the head before joining so its NEAR vowel stays lax.
    const locative = /^(here|there|where)([a-z]+)$/.exec(lowerWord);
    // Fused deictic + ever shares its boundary e (where + ever).
    if (locative?.[2] === "ver") locative[2] = "ever";
    const locativeTail = locative && /^(?:after|before|over|under|upon|ever)$/.test(locative[2]);
    if (locative && (isFunctionWord(locative[2]) || locativeTail)) {
      const head = stemPron(locative[1]), tail = stemPron(locative[2]);
      if (head && tail && (isMonosyllable(tail) || locativeTail)) {
        const base = applyPhonotactics(head, locative[1]);
        // Before an initially stressed longer tail, linking r is its
        // onset; the unstressed NEAR head must not coalesce into NURSE.
        if (!isMonosyllable(tail) && /^ˈ[aeiouɑæɛɪɔʊʌəɝ]/.test(tail) && base.endsWith("ɹ"))
          return base.replace(/[ˈˌ]/g, "").slice(0, -1) + tail.replace(/^ˈ/, "ˈɹ");
        return base.replace(/ˈ/g, "ˌ") + tail;
      }
    }
    // Closed-class + (so) + ever carries primary on ever.
    // Reuse function-word classification: a free beli/relie/chee fragment
    // must not turn believer/reliever into an ever compound.
    // Frozen whole dict: strict +7/-0, lenient +4/-0.
    if (lowerWord.endsWith("ever") && lowerWord.length > 6) {
      const prefix = lowerWord.slice(0, -4), head = prefix.replace(/so$/, "");
      const p = isFunctionWord(head) && lex(head), tail = stemPron("ever"), middle = prefix === head ? "" : stemPron("so");
      if (p && tail && middle !== undefined) return p.replace(/ˈ/g, "ˌ").replace(/[ɑɔ]ɹ/g, "ɝ") + middle.replace(/[ˈˌ]/g, "") + tail;
    }
    // -ulatory retains the -ulate root and weakens its final ate;
    // thematic -itative retains the -itate verb, including tense ate.
    // Vowel+i belongs to a root digraph (exploit+ative), not this suffix.
    // Broader -atory/ative reuse loses obligatory/compensatory and stays out.
    const ateBase = lowerWord.slice(0, -3) + "e";
    // Initial gemination plus a vouched -ate verb licenses this strong
    // adjective family. Cluster + -ative keeps its weak thematic vowel.
    // An independent -ated/-ating form can attest a rule-exact evicted root.
    const suppliedAte = /^[aeiouy]([^aeiouy])\1.*ative$/.test(lowerWord) &&
      !/[^aeiouy]{2}ative$/.test(lowerWord) &&
      (lex(ateBase) || /eɪt[əɪ]d$/.test(lex(ateBase.slice(0, -1) + "ed") || "") ||
        /eɪtɪŋ$/.test(lex(ateBase.slice(0, -1) + "ing") || ""));
    if (/ulatory$|[^aeiouy]itative$/.test(lowerWord) || suppliedAte) {
      const p = stemPron(ateBase);
      if (p && /eɪt$/.test(p)) {
        if (lowerWord.endsWith("ative")) return p + "ɪv";
        if (!FINAL_STRESS_RE.test(p)) return p.replace(/ˌ(?=[^ˈˌ]*eɪt$)/, "").replace(/eɪt$/, "əˌtɔɹi");
      }
    }
    // Co- retains its vowel before vouched long vowel- or w-initial roots;
    // short oo rimes and other ambiguous coo-/coast spellings stay whole.
    // Inter-/intra- are complete prefixes, not the weak in- plus ter-.
    // Reuse an independently vouched compound tail; unrestricted lexical
    // fragments also matched ceded/current and changed their weak vowels.
    // Relative -cture nouns and their neutral -al derivatives retain head stress.
    // Other vouched roots keep primary.
    const inter = /^(inter|intra|infra|supra|micro(?=w)|co(?=[aeiouw])|re(?=[aeiou][^aeiou]{2}|[aeiou][fg]?lect$)|re(?:re)*(?=re))(.{3,})$/.exec(lowerWord);
    if (inter && (inter[1] !== "re" || !/^[aeiou](?:([^aeiou])\1|[cspgt]h|ck)/.test(inter[2]))) {
      const base = inter[2], repeated = inter[1].startsWith("re") && !/^[aeiou]/.test(base);
      const headPrimary = /^(?:infra|supra)$/.test(inter[1]) && /ctur(?:e|al)$/.test(base) || /^micro$/.test(inter[1]);
      const p = repeated
        ? /[aeiou]{2}[^aeiou]*e[ds]?$/.test(base) && syllabify(base)[0] === "re" &&
          (this.customDict[base] || (preferVerbStem ? verbReading(base) : undefined) || stemPron(base))
        : inter[1] === "co" ? !Array.from(EN_PREFIXES).some(prefix => prefix.length > 2 && lowerWord.startsWith(prefix)) &&
          (/^w/.test(base) ? syllabify(base).length >= 2 && COMPOUND_TAILS[base] && stemPron(base) :
            syllabify(base).length >= 3 && (/^or[dt]/.test(base) || lex(base) || COMPOUND_TAILS[base]) && stemPron(base))
        : (COMPOUND_TAILS[base] || inter[1] === "re" && (/^ab/.test(base) || /lect$/.test(base)) && BORROWED_ROOT_FRAME.test(base) || /[ct]ial$/.test(base) || /^(?:infra|supra|re)$/.test(inter[1]) && COMPOUND_HEADS[base]) &&
          (lex(base) || COMPOUND_TAILS[base] || /^(?:infra|supra|re)$/.test(inter[1]) && COMPOUND_HEADS[base] || this.tryMorphologicalAnalysis(base) || (inter[1] === "re" && (/^ab/.test(base) || /lect$/.test(base)) && BORROWED_ROOT_FRAME.test(base) ? this.predictInternal(base, undefined, true) : undefined)) ||
          inter[1] === "re" && COMPOUND_TAILS[base.replace(/(?:ion|ivate|ivity)$/, "")] && (lex(base) || this.predictInternal(base, undefined, true));
      const head = !repeated && p ? this.customDict[inter[1]] || this.renderRuleForm(inter[1], 0) : "";
      if (p && headPrimary && /^micro$/.test(inter[1]) && !this.customDict[inter[1]]) return head.replace(/oʊ$/, "ə") + p.replace(/ˈ/g, "ˌ");
      if (p) return (repeated ? (p.includes("ˌ") ? "ɹi" : "ˌɹi").repeat(inter[1].length / 2) : head.replace(/ˈ/g, headPrimary ? "ˈ" : "ˌ")) +
        (repeated && !this.customDict[base] ? p.replace(/^ɹi(?=[^ˈ]*ˈ)/, "ɹɪ") : headPrimary ? p.replace(/ˈ/g, "ˌ") : p);
    }
    // A supplied or single-coda silent-e stem retains its vowel before
    // -ty (safety/ninety); checked -ety stems (rickety/velvety) stay whole.
    // Sibilant/rhotic bases retain a weak linking nucleus (nicety/surety).
    // The suffix -ty attaches after -cial (specialty, specialties); keep the
    // same /ɛʃəl/ base as special instead of re-syllabifying <cial> as /siəl/.
    const cialtyPlural = lowerWord.endsWith("cialties"), cialtyForm = cialtyPlural ? lowerWord.slice(0, -3) + "y" : lowerWord.endsWith("cialty") ? lowerWord : "", cialtyBase = cialtyForm && cialtyForm.slice(0, -2), cialtyRoot = cialtyBase && (lex(cialtyBase) || this.predictInternal(cialtyBase, undefined, true));
    if (cialtyRoot && /ʃəl$/.test(cialtyRoot)) return cialtyRoot + (cialtyPlural ? "tiz" : "ti");
    const etyBase = lowerWord.endsWith("ety") && lowerWord.slice(0, -2), etyRoot = etyBase && (lex(etyBase) || (/[aeiou][^aeiou]e$/.test(etyBase) ? this.predictInternal(etyBase, undefined, false) : undefined)); if (etyRoot && /[^ɑɔæɛɪiʊuʌəɝɚ]$/.test(etyRoot)) return etyRoot + (/[szʃʒɹ]$/.test(etyRoot) ? "əti" : "ti");
    const agentPrefix = /^(anti|non)([^aeiouy]+[aiouy][bcdfghjklmnpqrstvz])(ist|ism)$/.exec(lowerWord);
    const agentRoot = agentPrefix && this.silentEAgentRoot(agentPrefix[2]);
    if (agentPrefix && agentRoot) return this.renderRuleForm(agentPrefix[1], 0).replace(/ˈ/g, "ˌ") + agentRoot + (agentPrefix[3] === "ist" ? "ɪst" : "ɪzəm");
    // Assimilated iC- attaches only to a vouched adjectival root, not an invented fragment.
    const privative = /^(un(?!der)(?=[^aeiou]|(?=[aeou])[a-z]*(?:able|ible|ed|ing|ual|age)$)|non|dis|in(?=[a-z]*able$)|i[rlm](?=[a-z]*(?:ary|ory|ous|ic|al|able|ible)$))([a-z]{4,})$/.exec(lowerWord);
    const assimilated = privative && /^i[rlm]$/.test(privative[1]);
    if (privative && (!assimilated || privative[2][0] === privative[1][1] || privative[1] === "im" && privative[2][0] === "p") && (privative[1] !== "in" || SHORT_SILENT_E_ROOT.test(privative[2].slice(0, -4) + "e"))) {
      // Checked monosyllabic tails witness a dis- root after eviction;
      // full-vowel noun compounds retain their existing stress route.
      const base = privative[2], tail = COMPOUND_TAILS[base], prefixCoda = assimilated ? privative[1][1].replace("r", "ɹ") : "";
      // Outer un- composes with inflected bound con- verbs through the same
      // stem rules as the bare verb, preserving both prefix and root stress.
      const prefixedConVerb = privative[1] === "un" && /^con(?:cern|fess|firm|strain|sult)(?:s|ed|ing)$/.test(base) ? this.predictInternal(base, undefined, true) : undefined;
      // dis- can attach to a verb (disclose); an explicit V reading
      // takes priority over a noun citation form of the same stem.
      const known = prefixedConVerb || (privative[1] === "dis" ? verbReading(base) : undefined) ||
        // Rule-exact Latinate -efy/-sfy roots can leave the table;
        // retain their own stress when a transparent prefix attaches.
        (syllabify(base).length >= 2 && /(?:ef|sf)y$/.test(base) ? stemPron(base) : undefined) ||
        lex(base) || /(?:[aeiouy][a-z]*[cvst]or|ments)$/.test(base) && this.tryMorphologicalAnalysis(base) ||
        this.tryCompoundSplit(base, 0, "owned") || this.recoverConAtion(base) || this.strongAgeRoot(base) || (privative[1] !== "dis" || tail && isMonosyllable(tail) && (!/[aeiouɑɔɝ]/.test(tail) || SHORT_SILENT_E_ROOT.test(base)) ? tail : undefined) ||
        // Vowel-initial adjectives, co- + rhotic roots and vetted -ie
        // diminutives retain their analysis after leaving the table.
        // Nested re- roots survive eviction; their outer prefix supplies initial secondary stress.
        (privative[1] === "un" && /^(?:[aeou]|coor[dt])/.test(base) || /^re[aeiou][^aeiou]{2}/.test(base) ||
          base.endsWith("ie") || /osure$/.test(base) ? this.tryMorphologicalAnalysis(base)?.replace(/^ˌ(?=ɹi)/, "") : undefined) ||
        // Checked-root adjectives retain their weak -rate after table eviction.
        (weakCheckedRate(syllabify(base)) ? this.renderRuleForm(base) : undefined) ||
        // Rule-exact finite/weak ite, iol tails, Cied, -own, -ture and checked NC-ed roots can leave
        // the table; preserve their prefix composition (untied/unfenced).
        (/^[^aeiouy]+iol(?:ent|ence)$|^[^aeiouy]ied$|own$|ture(?:d)?$|^[^aeiouy]+[ei]n[cs]ed$/.test(base) || hasOpenStopRStem(base, "ed") || isWeakLatinIte(base) || FREE_I_NITE_ROOT.test(base) || SILENT_HON_ROOT.test(base) || SHORT_ANCY_ROOT.test(base) || BORROWED_ROOT_FRAME.test(base) ? this.predictInternal(base, undefined, true) : undefined) ||
        // Productive longer adjectives and short silent-e in- roots survive eviction;
        // arbitrary un- fragments and short bound roots stay whole.
        ((privative[1] === "un" || privative[1] === "in" || privative[1] === "non") && /(?:ary|ory|ous|ic|al|able|ible)$/.test(base) && syllabify(base).length >= 3 ? stemPron(base) : undefined);
      // dis- and an s-initial root share one surface s, including
      // roots whose primary follows it (dissimilar/dissatisfy).
      if (known) return (assimilated ? "ˌɪ" + (known.replace(/^[ˈˌ]/, "").replace(/ɫ/g, "l").startsWith(prefixCoda) ? "" : prefixCoda) : privative[1] === "in" ? "ˌɪn" : privative[1] === "un" ? "ʌn" : privative[1] === "dis" ? (/^[ˈˌ]?s/.test(known) ? "dɪ" : "dɪs") : "nɑn") + (assimilated && privative[1] === "ir" && !this.customDict[base] ? known.replace(/^ɹ[iɪ](?=[^ˈ]*ˈ)/, "ɹə") : known);
    }
    // A supplied -nges affricate also attests an assimilated ad- root:
    // a + doubled C + root (arrang -> rang -> ranges). The IPA guard
    // distinguishes /ndʒ/ from unrelated -es headwords; require a longer
    // agent base below, since dinger also has a separate dinge lexeme.
    // Frozen rebuilt-table probe: strict +4/-0, lenient +3/-0 over 105067.
    // In inflections, a weak prefixed -eng restores silent e; free -seng roots
    // and surname agent readings retain their independently supplied routes.
    const ngeStem = (b: string, inflected = false): boolean => /ng$/.test(b) && (inflected && /eng$/.test(b) && syllabify(b).length > 1 && EN_PREFIXES.has(syllabify(b)[0]) || /ndʒ[əɪ]z$/.test(
      lex(b + "es") || (/^a([bcdfghjklmnpqrstvwxz])\1/.test(b) ? lex(b.slice(2) + "es") : undefined) || ""));
    const bareSStem = (base: string): string | undefined => !isFunctionWord(base) && /s$/.test(COMPOUND_HEADS[base] ?? "") ? this.customDict[base] || COMPOUND_HEADS[base] : undefined;
    const sPlural = (p: string, base = lowerWord.slice(0, -1)): string => (this.customDict[base] ? p : dropStemYod(p)) + sAllomorph(p);
    // A doubled consonant right before a vowel-initial suffix is
    // orthographic gemination, not a real double letter to carry into the
    // stem lookup (control → controllable, refer → referral), as inflect()
    // separately tests for -ed/-ing. Shared by the -able and -al handlers.
    // Native monosyllabic ll/ss is part of the stem (poll/miss), not
    // suffix-induced doubling. Preserve it in inflections and agents.
    const keepsDouble = (base: string): boolean =>
      /(?:ll|ss)$/.test(base) && (base.match(/[aeiouy]+/g)?.length ?? 0) === 1;
    // British l-doubling preserves a weak -el root, not an unrelated
    // doubled spelling's lexical reading. Closed compound heads stay out.
    const weakElDouble = (base: string): string | undefined => {
      if (!base.endsWith("ell") || this.customDict[base]) return undefined;
      const root = base.slice(0, -1), slots = syllabify(root);
      if (slots.length !== 2 || !/^[^aeiouy]*[aeiouy]w?$/.test(slots[0])) return undefined;
      const p = verbStem(root, true) || stemPron(root);
      return p && /[əɪ][lɫ]$/.test(p) ? p : undefined;
    };
    const doubledConsonantLex = (stem: string): string | undefined =>
      stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]
        ? lex(stem.slice(0, -1))
        : undefined;
    // Indefinite pronouns and adverbs are a determiner + a free noun
    // (anyone, everything, somebody, nowhere): read both parts from the
    // lexicon and put a secondary on the second.
    // Vouched heads also compose with grammatical wh roots after lexical eviction.
    const indefinite = /^(any|every|some|no)(one|body|thing|where|how|way|time|place)(s?)$/.exec(lowerWord) ||
      /^([a-z]{3,})(wh[a-z]+?)(s?)$/.exec(lowerWord);
    if (indefinite &&
        (/^(?:any|every|some|no)$/.test(indefinite[1]) || this.customDict[indefinite[1]] || COMPOUND_HEADS[indefinite[1]]) &&
        (!/^wh/.test(indefinite[2]) || isFunctionWord(indefinite[2]))) {
      const head = stemPron(indefinite[1]), tailPron = stemPron(indefinite[2]);
      if (head && tailPron) {
        const joined = head + tailPron.replace(/ˈ/g, "ˌ").replace(/^(?!ˌ)/, "ˌ");
        return indefinite[3] ? sPlural(joined) : joined;
      }
    }
    // The agent noun of a Greek -y noun keeps its stress: biology →
    // biologist, photography → photographer, economy → economist. Read
    // the -y form and swap its final /i/ for the suffix. A -logize
    // verb shares the noun frame too (apology/apologize, eulogy/eulogize),
    // so its bound -log cannot acquire a free noun's full final vowel.
    const greekAgent = /(?:log|graph|nom|soph|iatr)(ist|er)$|log(ize)$/.exec(lowerWord);
    if (greekAgent) {
      greekAgent[1] ||= greekAgent[2];
      const yForm = stemPron(lowerWord.slice(0, -greekAgent[1].length) + "y");
      if (yForm && /i$/.test(yForm)) return yForm.slice(0, -1) + (greekAgent[1] === "ist" ? "ɪst" : greekAgent[1]==="er" ? "ɝ" : "aɪz");
    }
    const edPast = (p: string): string =>
      /[td]$/.test(p) ? p + "ɪd" : /[pksʃfθ]$/.test(p) ? p + "t" : p + "d";
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
      // A regular verb stem needs a nucleus; sh/st/dr are abbreviations
      // or interjections, not stems explaining shed/sting/dred.
      if (!/[aeiouy]/.test(base)) return undefined;
      const liquid = liquidStem(base, sfxLen === 3 ? "ing" : "ed");
      if (liquid) return this.tryCompoundSplit(lowerWord, sfxLen) || join(liquid);
      // Restoring silent e must not select a pronounced-e loanword
      // (pass → passé). Such a stem cannot explain dropped-e spelling.
      const silentE = () => {
        if (NO_DROPPED_E.test(base) || /([bcdfgklmnprst])\1$/.test(base)) return undefined;
        const p = verbStem(base + "e");
        // Silent-e restoration cannot add a syllable to a known
        // monosyllabic root (coat must not become the headword coate).
        const known = verbStem(base, true) || COMPOUND_TAILS[base];
        return p && !(known && isMonosyllable(known) && !isMonosyllable(p)) && isUsableConsonantStem(p, base) ? p : undefined;
      };
      const explicitVerb = preferVerbStem ? verbReading(base) : undefined;
      if (explicitVerb) return join(explicitVerb);
      const consonantSilent = /[aeiou]$/.test(base) ? undefined : silentE();
      if (consonantSilent) return join(consonantSilent);
      // A vouched monosyllabic cluster root keeps assimilated ad- weak
      // in verb inflections, even when the citation has initial stress.
      const ad = /^a([bcdfgklmnprst])\1[lr]/.test(base) && !this.customDict[base] && !verbReading(base) ? COMPOUND_TAILS[base.slice(2)] : undefined;
      if (ad && isMonosyllable(ad)) return join("ə" + ad);
      // skipMorphology: the base of an inflection must be a real lexicon
      // word, not a re-decomposition. Without this, wellKnown("chas")
      // morphologises to "cha"+s → /tʃɑz/, intercepting the magic-e
      // recovery and yielding chased→/tʃɑzd/ instead of /tʃeɪst/.
      // Restore a vowel-final -ue/-oe GOOSE root (argue/continue/shoe).
      // The actual GOOSE ending distinguishes it from silent gu/que.
      if (base.endsWith("u") || /^[^aeiouy]+o$/.test(base)) {
        const p=stemPron(base+"e");if(p && (this.customDict[base+"e"] || /(?<![ao])[uʊ]$/.test(p) || /[gq]u$/.test(base) && /[ɡk]$/.test(p))) return join(p);
      }
      const basePron = weakElDouble(base) || verbStem(base, true);
      if (basePron) return join(basePron);
      // Doubled-consonant base: the two chars before the suffix are
      // identical (stopped → stop, planned → plan).
      if (lowerWord.length > 4 && /[bcdfghjklmnpqrstvwxyz]$/.test(base) && base[base.length - 2] === base[base.length - 1]) {
        const undoubled = base.slice(0, -1);
        // A recovered -s must be lexical, not a newly inferred plural
        // (finessed must not become fines + d). Derived stems such as
        // pedal in pedalled still need the normal morphology lookup.
        const p = keepsDouble(base) ? stemPron(base) :
          verbStem(undoubled, undoubled.endsWith("s") || BORROWED_ROOT_FRAME.test(undoubled));
        if (p) return join(p);
      }
      const magicPron = /[aeiou]$/.test(base) ? silentE() : undefined;
      if (magicPron) return join(magicPron);
      // A prefixed open monosyllable keeps its hiatus before -ing.
      // Function words alone are not prefixes (we must not split wellbeing).
      if (sfxLen === 3 && /[eo]$/.test(base)) {
        for (let i = 2; i <= base.length - 2; i++) {
          const prefix = base.slice(0, i), root = base.slice(i);
          if (!EN_PREFIXES.has(prefix) && !VERB_PARTICLE.test(prefix) && !/^(?:on|fore)$/.test(prefix)) continue;
          const p = stemPron(root), head = EN_PREFIXES.has(prefix) ? this.renderRuleForm(prefix, 0) : stemPron(prefix);
          if (p && head && isMonosyllable(p) && ENDS_IN_VOWEL_RE.test(p))
            return join(EN_PREFIXES.has(prefix) ? head.replace(/ˈ/g, "ˌ") + p : head + p.replace(/ˈ/g, "ˌ"));
        }
      }
      // A single-nucleus vowel-final root keeps the inflection boundary
      // (see/hoe/go), rather than contracting o+ing into the oi digraph.
      // Longer apparent -do compounds need independent stem evidence.
      if (/[eo]$/.test(base) && (base.match(/[aeiouy]+/g)?.length ?? 0) === 1) return join(this.predictInternal(base, undefined, true));
      // A y-final stem keeps its vowel before -ing (try/copy/study,
      // buy/play/enjoy). Two-letter stems are excluded: dying/lying/tying/
      // vying restore -ie instead — rendering the bare 2-letter base
      // itself would read it through the general word-final -y rules
      // (city/happy's lax /i/, or a bare-monosyllable /aɪ/ with no
      // guarantee of which), neither of which is this closed class's
      // actual spelling change. This used to work by accident: lex(base)
      // a few lines up found "ly"/"dy"/"vy" as exceptions-table entries
      // whenever rules-only mispredicted them, before "ly"'s own /aɪ/
      // stress fix (see syllabify.ts's rely-class fix) made it rule-exact
      // and evicted it from the table, silently breaking "lying" — the
      // same rule-exact-eviction trap this file has hit before (see
      // AGENTS.md). Restoring the "ie" spelling directly and reading it
      // through the rules is table-independent either way.
      if (/^[bcdfghjklmnpqrstvwxz]y$/.test(base) || base.length > 2 && base.endsWith("y")) {
        return join(this.predictInternal(base.length === 2 ? base.slice(0, -1) + "ie" : base, undefined, true));
      }
      // These final clusters already close the stem; adding a fictitious
      // silent e changes its vowel (called), or decomposition splits a
      // consonant digraph (reaching). Keep the bare rule-derived stem —
      // except "ng", which is genuinely ambiguous: bring/sing/hang keep
      // a bare stem, but change/range/hinge dropped a silent e, and the
      // two shapes are orthographically identical (chang vs bring). No
      // vowel or letter-count test separates them (measured: an -ang
      // stem always tenses through the -ange postlex rule whether or not
      // the word is real, so "hange"/"bange" tense exactly like "change"
      // and a vowel-comparison test wrongly flips hang/bang/long/belong
      // too). The one signal that is exact: -nge's plural is spelled
      // -nges (changes, ranges), while a bare -ng plural never carries an
      // e (brings, hangs) — so a stem is restored only when the table
      // independently attests its -es form. Measured over every dict
      // -ed/-ing word with an "ng" stem: 5/5 stems with an -es hit are
      // genuine -nge words (chang→changes, exchang→exchanges,
      // rang→ranges, prearrang→prearranges, spong→sponges), 0 false
      // positives; the un-corroborated majority (27 stems, mostly other
      // real -nge verbs whose own -es form was never a dict headword)
      // falls through to the bare stem unchanged, same as before this
      // rule existed. hinge/cringe/binge are in that unresolved set —
      // open, see AGENTS.md.
      if (/[aeiou]/.test(base) && /(?:ll|ss|[cs]h|ck|ng|lk)$/.test(base)) {
        return join(this.predictInternal(ngeStem(base, true) ? base + "e" : base, undefined, true));
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
      // comment) AND isUsableConsonantStem says the restored e is
      // actually silent (see its comment for the /ɝ/ exemption and the
      // 4-syllable cutoff — configure/measure/gesture need it). For
      // sibilant-final stems the e is pronounced (distinguishe → …ʃi,
      // washe → …ʃi), which would wrongly attach the allomorph to a
      // vowel; fall back to the bare stem there so distinguished → …ʃt,
      // not …ʃid. Measured on the dict: unscoped strict 16:1 (loses
      // caricatured), scoped strict 14:0 but ALSO loses gestured/
      // gesturing (2 syllables, wrongly caught by an earlier blanket
      // "ends in tur" attempt) — the syllable-count cut in the shared
      // helper is what keeps both: 16:0.
      if (ruleFallback && /[aeiou]/.test(base) && !/[aeiou]$/.test(base)) {
        // Verified compounds precede fabricated +e or vowel-less stop-r stems.
        const compound = this.tryCompoundSplit(lowerWord, sfxLen) || sfxLen === 2 && /[bcdfgkpt]r$/.test(base) && this.tryCompoundSplit(lowerWord);
        if (compound) return compound;
        // A vouched compound with a complete sonorant coda keeps its root
        // before rule-based silent-e fabrication (halfhearted).
        const rootCompound = /[lr][^aeiouy]$/.test(base) ? this.tryCompoundSplit(base) : undefined;
        if (rootCompound) return join(rootCompound);
        const ruleBaseE = MAGIC_E_CANDIDATE(base)
          ? this.predictInternal(base + "e", undefined, true)
          : undefined;
        if (ruleBaseE && isUsableConsonantStem(ruleBaseE, base)) {
          // Lexical and caller-owned stems returned earlier keep their nuclei.
          const stem = sfxLen === 3 && /^[^aeiouy]+ir$/.test(base) ? ruleBaseE.replace(/aɪɝ$/, "aɪɹ") : ruleBaseE;
          return join(stem);
        }
        const ruleBase = this.predictInternal(base, undefined, true);
        // Keep an unvouched open-vowel + stop-r fragment inside its -Cred syllable.
        if (ruleBase && !(sfxLen === 2 && hasOpenStopRStem(base) && /[bdɡkpt]ɹ$/.test(ruleBase))) return join(ruleBase);
      }
      return undefined;
    };

    // Recursive stems still need this lookup; the trailing-apostrophe guard excludes -'s already.
    const barePossessive = /'$/.test(lowerWord) && lowerWord.length > 2 && this.wellKnown(lowerWord.replace(/'$/, ""));
    if (barePossessive) return barePossessive;
    if (
      lowerWord.endsWith("s") &&
      !lowerWord.endsWith("ss") &&
      // Greek -asis/-esis/-osis/-ysis nouns are not i-stem plurals.
      !/(?:as|es|os|ys)is$/.test(lowerWord) &&
      // Prefer an attested y base or a consonant-only Cy root to a
      // coincidental -ie headword (carry/Carrie, spy/spie). A protected
      // complete -ary root survives eviction too (vocabularies); broad
      // borrowed-y restoration misreads novelties and was rejected.
      !(lowerWord.endsWith("ies") &&
        (lex(lowerWord.slice(0, -3) + "y") || /(?:ar|iatr)y$/.test(lowerWord.slice(0, -3) + "y") && BORROWED_ROOT_FRAME.test(lowerWord.slice(0, -3) + "y") || SHORT_ANCY_ROOT.test(lowerWord.slice(0, -3) + "y") ||
          /^[bcdfghjklmnpqrstvwxz]{2,}$/.test(lowerWord.slice(0, -3)))) &&
      lowerWord.length > 2
    ) {
      // Independently supplied silent-e/f roots license -ves voicing
      // (knife/knives). Keep gives/hives on their existing v-stem path.
      if (lowerWord.endsWith("ves") && !(preferVerbStem && verbReading(lowerWord.slice(0, -1)))) {
        const fBase = lowerWord.slice(0, -3) + "fe";
        // Sonorant + f nouns keep their complete bare stem (calves/wolves).
        // Verified heads also preserve half after rule-exact eviction.
        const bare = fBase.slice(0, -1);
        const fStem = lex(fBase) || COMPOUND_TAILS[fBase] || /[lr]f$/.test(bare) && (lex(bare) || COMPOUND_TAILS[bare] || COMPOUND_HEADS[bare]);
        if (fStem && /f$/.test(fStem)) return sPlural(fStem.replace(/f$/, "v"));
      }
      // A one-syllable consonant+vowel stem (thi+s, hi+s, ha+s, ye+s)
      // is a lexical coincidence, not a plural: this/his/has/yes/gas
      // are whole words. -o stems (photos, videos) are real plurals.
      const stem = lowerWord.slice(0, -1);
      // A long loan stem with penult open o keeps its weak final a
      // before plural -s. Whole-word -as rendering loses that boundary
      // once the singular becomes rule-exact (canola/granola).
      const openOA = /[^aeiouy]o[^aeiouy]+a$/.test(stem) ? syllabify(stem) : undefined;
      // -sses spells the syllabic plural of -ss. A pronounced-e loan
      // (passé without its accent) must not intercept that regular base.
      // Consonant-final -sse lexemes (mousse/finesse) remain valid stems.
      // An attested cluster+i loan stem is a real plural base (ski);
      // h digraphs stay excluded so thi+s cannot intercept this.
      // A vouched verb base licenses -ings without borrowing a citation homograph.
      // Proven finite-object syntax also licenses other verb roots; uncertain POS guesses keep the prior path.
      // Marked base/past homograph stems supply the base before regular -s.
      // Weak nominal -ment and strong verbal -ment share initial primary stress; stress-shift pairs stay separate.
      const weakMent = /ment$/.test(stem) && /^ˈ.*mənt$/.test(this.wellKnown(stem, "N", true) || "") && /^ˈ.*mɛnt$/.test(verbReading(stem) || ""), lineCompoundPlural = lowerWord.endsWith("lines") && stem.slice(0, -4).endsWith("e");
      // A verified -line compound keeps its boundary before plural -s (guideline → guidelines).
      const basePron = /medicine$/.test(stem) ? this.predictInternal(stem, undefined, true) : ((/^(?:y|[^aeiouy])[^aeiouy]*[aeiuy]$/.test(stem) && !(/^[^aeiouyh]{2,}i$/.test(stem) && /i$/.test(lex(stem) || "")) ||
        /sse$/.test(stem) && ENDS_IN_VOWEL_RE.test(lex(stem) || ""))
        ? undefined
        : (/ings$/.test(lowerWord) && !this.customDict[stem] && !this.customDict[stem.slice(0, -3)] ? verbReading(stem.slice(0, -3)) : undefined)?.concat("ɪŋ") || ((preferVerbStem && (finiteObject || this.homographs[stem]?.some(entry => entry.pos === "V") || /[szv]$/.test(verbReading(stem) || "")) || this.homographs[stem]?.some(entry => entry.forms?.includes("past"))) ? verbReading(stem) : undefined) ||
        (!(/se$/.test(stem) && !this.customDict[stem] && !COMPOUND_HEADS[stem] && !COMPOUND_TAILS[stem] && bareSStem(stem.slice(0, -1))) && (this.customDict[stem] || this.wellKnown(stem, weakMent && (preferVerbStem || nominal) ? preferVerbStem ? "V" : "N" : undefined))) || this.tryCompoundSplit(stem, 0, true) || (lineCompoundPlural ? this.tryCompoundSplit(stem) : undefined) || (hasOpenStopRStem(stem, "ed") ? stemPron(stem) : undefined) ||
        // Particle nouns and short compounds retain their root after exception eviction.
        (stem.length === 5 || /(?:down|up|out|off|over|under|back)$/.test(stem) ? this.tryCompoundSplit(stem) : undefined) ||
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
          // r-colored ɝ ending regardless. A bare "n" extension of this
          // same idea was measured and rejected (2026-09-28, merging
          // worktree agent-aad1c09cb2c5d441b): forcing the rule path on
          // EVERY rule-exact n-final stem broke far more than it fixed
          // (baboons, clarins, cosens, defenses, responses, valens, the
          // rosecrans/rosencrans/rosenkrans family — 10 losses for the 1
          // designs win), because most n-final stems that fail wellKnown()
          // aren't cleanly rule-exact the way an r-final one always is;
          // they fall through to the later -tion/-sion/-es checks or the
          // whole-word fallback for good reason. The narrower fix is the
          // "-ign/-aign" digraph specifically (design, and any other
          // silent-g word that goes rule-exact): its syllable-boundary
          // dependency is the same one MAGIC_E_CANDIDATE's "gn$" exclusion
          // guards below, so it gets the identical, narrowly-scoped test.
          // A bare "-ion" ending is the same shape again, not the rejected
          // wide "n" extension: assignStress's new word-final -ion (not
          // -tion/-sion) penult rule (syllabify.ts) makes opinion, dominion,
          // battalion, communion, pavilion and their siblings rule-exact,
          // and none of their plurals were reachable through the existing
          // -tion/-sion `/[ts]ions$/` fallback below, whose test is scoped
          // to the letter right before "ion" and never matches an n-final
          // stem (opinions, dominions). Forcing the rule path on any
          // wellKnown()-miss "-ion" stem is the same safe shape as r/gn:
          // it only fires once the table lookup has already failed, so it
          // is either a genuine rule-exact eviction (the rules already
          // match the dict for the singular) or a novel word the whole-
          // word fallback would have mishandled anyway.
          // "ient$" joins the set for the same reason (client → clients):
          // the syllabify.ts monosyllabic ie+t/ie+nt hiatus rule made
          // "client" itself rule-exact, evicting it, and every OTHER
          // "-ient"-stem plural in the dict (patients, gradients, orients,
          // salients, …) is unaffected because each of those stems is
          // genuinely irregular and stays in the table regardless — this
          // branch is only ever reached once wellKnown(stem) has already
          // failed, so it can't misfire on them.
          // Reduced -tain becomes rule-exact too (mountain → mountains).
          // Recover its singular so plural s cannot hide the final rime.
          // o+del/vel has the same dependency (model → models): plural
          // s hides the checked-o frame once its root leaves the table.
          // -vie and Latin -ecie rimes can retain -ie before s.
          // An unvouched -ie requires the competing -y stress on the e nucleus.
          // Preserve independently attested y stems first; aCy has its
          // own lengthening (navies/gravies), so it stays on that path.
          (openOA && openOA.length >= 3 && /^[^aeiouy]+o$/.test(openOA[openOA.length - 2]) && assignStress(openOA, stem) === openOA.length - 2 ||
            ((/[eiou]vie$/.test(stem) ||
              /ecie$/.test(stem) && assignStress(syllabify(stem.slice(0, -2) + "y"), stem.slice(0, -2) + "y") === syllabify(stem).length - 2) && !lex(stem.slice(0, -2) + "y")) ||
            // Vouched monosyllabic digraph roots also license the regular plural.
            /[aeiouy][aeiouyw]/.test(stem) && COMPOUND_HEADS[stem] && isMonosyllable(COMPOUND_HEADS[stem]) ||
            // Final d+ea retains hiatus after rule-exact root eviction;
            // compose the voiced plural from that root (idea → ideas).
            // Silent -igh/-eigh roots retain their vowel coda before plural s.
            // Greek noun tails and palatal -imen need their singular boundary
            // after eviction too, including plurals absent from the dict.
          // Weak -ine roots retain their own reduction when plural s
          // hides the final silent-e boundary (discipline → disciplines,
          // medicine → medicines).
            // Bound weak -ite keeps its final root boundary after eviction.
            // Greek sth+m vowel-final roots retain their voiced root before plural s.
            // Exclude u: classical -us is a singular ending, not a free u-stem plural.
            // Bound -ean and neutral -like keep their final root boundary;
            // bean compounds and jean/mean keep their native single nucleus.
            /(?:r|gn|igh|ion|ient|tain|o[dv]el|ngine|trine|pline|dea|gram|[aeiouy][^aeiouy]*gm|logue|[cg]imen|[cgsv]il|urrence|[ae]nce|gramme|pse|sce|like|oic|sthm[aeio]|scle|medicine)$/.test(stem) || /(?:[ou](?!bean$)[^aeiouy]ean|([^aeiouy])\1ean|anean)$/.test(stem) && !/cean$/.test(stem) || isBoundBol(stem) || LATIN_E_ROOT.test(stem) || isWeakLatinIte(stem) || SILENT_HON_ROOT.test(stem) || BORROWED_ROOT_FRAME.test(stem) ||
            // A multi-syllable silent-e stem (device, virus is NOT this —
            // it has no e at all) has the identical problem one syllable
            // over: devices resyllabifies as de·vi·ces, and the extra
            // trailing "s" hides the "ce" magic-e slot from the syllable
            // before it, losing the tensing device/price/voice get on
            // their own. Scoped to 2+ syllables (syllabify(stem).length):
            // a 1-syllable stem is already covered by the dedicated
            // single-consonant-plus-"es" branch below and by the
            // sibilant-final-vowel branch two lines down, both of which
            // key off the shorter, unambiguous shape — reusing this
            // fallback there too risks the same gas/case ambiguity noted
            // on the -es branch. Single onset consonant only (device,
            // notice, license), excluding the same non-silent shapes
            // `endsWithSilentE` (syllabify.ts) excludes for the identical
            // reason — a digraph or geminate before "e" never marks a
            // real silent e, and syllabify() cannot tell a fabricated
            // stem from a real one (dishes → "di"+"she": "she" fits the
            // bare regex but its "e" is pronounced, not silent, which
            // `endsWithSilentE`'s own "he$" exclusion already knows).
            // A word ending in "-uses/-ises/-ixes" (viruses) is excluded
            // too — its base has no silent e (virus, not viruse), and
            // the fabricated stem here mis-syllabifies the same way the
            // whole word does; the dedicated -us/-is/-ix fallback on the
            // -es branch below owns that shape instead. "-ves" is
            // excluded outright: the irregular f→v plural (wife→wives,
            // life→lives, house is NOT this class) means the real
            // singular ends in f, not v, so this stem is never a real
            // word and syllabifies unpredictably (housewives → fabricated
            // "housewive" → "hou·sew·i·ve", not "house·wife"). Capped at
            // 3 syllables except retained-e -age roots (beverage), where
            // the final e is not an additional spoken syllable. A 4-syllable
            // fabricated stem (fugitive) can
            // disagree with the word's own already-correct whole-word
            // reading on trisyllabic-laxing depth, and every dict word
            // this fallback is meant for is 2–3 syllables. An x onset
            // (taxes, sexes) is excluded like the -ate frame above: /ks/
            // wearing one letter, not a genuine single silent-e trigger.
            // INTEGRATOR NARROWING (2026-09-28, merging worktree
            // agent-a89f5e0091d44882c): a stem ending in "nge" (change,
            // exchange, range, arrange, strange) is also excluded, though
            // it would otherwise pass every test above — `syllabify()`
            // gives ANY magic-e word its own trailing silent-e slot
            // (change → chan·ge, 2 slots), so this fallback's syllable
            // count can't actually tell a genuine 2-syllable stem
            // (device → de·vi·ce, 3 slots, 2 real syllables) from a
            // magic-e MONOSYLLABLE (change, 2 slots, 1 real syllable);
            // `exchange` (ex·chan·ge, 3 slots, 2 real syllables) is even
            // indistinguishable from `device` by count alone. The reason
            // -nge specifically needs its own carve-out rather than a
            // syllable-count fix: it's the class the "-nge inflections
            // pass" (see AGENTS.md) already protects through a DIFFERENT,
            // narrower mechanism — inflect()'s -ed/-ing handler restores
            // a stem's dropped e only when `wellKnown(base + "es")` finds
            // "changes" as a literal TABLE entry, and this fallback
            // making "changes" rule-exact (correctly derivable without
            // the table) evicts it from `exceptions.json` exactly like
            // the eviction traps document elsewhere in this file,
            // breaking that corroboration for changed/changing/exchanged/
            // exchanging/ranged/ranging. No -nge word was among this
            // package's own target examples (device/notice/license), so
            // the exclusion costs nothing intended.
            // A rule-exact -icle singular keeps its -cle syllable in plural forms (vehicle → vehicles).
            (/[^aeiouy]e$/.test(stem) &&
              (!/(?:ee|[^aeiou]le|he|tte|se|ves|xe|nge)$/.test(stem) || /icle$/.test(stem)) &&
              syllabify(stem).length > 1 &&
              (syllabify(stem).length <= 3 || stem.endsWith("age")) &&
              !/(?:us|is|ix)es$/.test(lowerWord))
              ? this.predictInternal(stem, undefined, true)
              : undefined) || (/st$/.test(stem) && syllabify(stem).length === 1 ? this.predictInternal(stem, undefined, true) : undefined));
      if (basePron) {
        // Match only final /ə/↔/ɪ/ differences; edit basePron to retain stress.
        const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l"), ruleStem = /icals$/.test(lowerWord) ? this.predictInternal(stem, undefined, true) : undefined, lexical = clean(basePron), regular = ruleStem && clean(ruleStem);
        return sPlural(regular && lexical.endsWith("əkəl") && regular.endsWith("ɪkəl") && lexical.slice(0, -4) === regular.slice(0, -4) ? basePron.replace(/ə(?=kəɫ?$)/, "ɪ") : basePron);
      }
      // Rule-derived stems are absent from the exception table. Preserve
      // -tion/-sion palatalization and monosyllabic silent-e vowels when
      // adding -s (solutions/names/bikes), the same way a rule-exact
      // -ate verb or -ial noun that has left the table needs the
      // rule-derived stem for ITS -s form (communicates, aggregates:
      // 8 : 0; tutorials, editorials) — one shared branch, since both
      // just rule-predict `stem` and require it to stay consonant-final.
      // Verify silent e via isUsableConsonantStem (shared with inflect()'s
      // -ed/-ing gate above: measures/figures/pressures restore their
      // stem's own -ure glide/palatalization the same way — this branch
      // measured as a no-op on the current dict either way, since no word
      // reaches it with a ɝ-final stem yet, kept for symmetry). Exclude
      // s/x, which instead introduce syllabic -es (buses/taxes), and
      // multi-vowel stems (housewives).
      if (
        /[ts]ions$|^[^aeiou]*[aeiou][bcdfghjklmnpqrtvz]es$/.test(lowerWord) ||
        (/(?:ate|ial|(?<!r)ic)s$/.test(lowerWord) && lowerWord.length > 5)
      ) {
        const p = this.predictInternal(stem, undefined, true);
        if (isUsableConsonantStem(p, stem))
          return /ics$/.test(lowerWord) && this.tryCompoundSplit(lowerWord) || sPlural(p);
      }
      // A final -s must not turn the stem's ow/o/ue ending into a closed
      // syllable (shows, yellows, photos). Preserve the stem vowel.
      // A two-letter spelling is not enough evidence for that plural
      // fallback (cos/eos/pos); frozen probe: strict +5/-0, lenient +9/-0.
      if (/(?:ow|o|ue)s$/.test(lowerWord) && stem.length >= 3) {
        return sPlural(this.predictInternal(lowerWord.slice(0, -1), undefined, true));
      }
    }
    // -ies is excluded here and left for the y-stem loop below, which
    // restores the -y the suffix replaced (vary → varies) before its own
    // lookup. Stripping just "es" instead (base "vari") can coincide with
    // an unrelated dict headword sharing that spelling (the name "Vari",
    // ˈvɑɹi) and silently return ITS pronunciation instead of the real
    // "vary" stem's: varies ˈvɑɹiɪz → ˈvɛɹiz, the one segment error the
    // ar+i/y SQUARE-vowel rule (syllabify.ts) can't reach through this
    // path. Measured over the dict: strict 12 : 1, lenient 9 : 1 — besides
    // varies, the same wrong-stem collision was silently mispronouncing
    // buries/centuries/gullies/hurries/liberties/mercies/mies/parodies/
    // rabies/shies/skies. The loss is alkalies, whose singular genuinely
    // ends in -i (alkali), not a restored -y: there's no spelling-only way
    // to tell that stem apart from the -y words this branch is for.
    if (lowerWord.endsWith("es") && !lowerWord.endsWith("ies") && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      // A one-syllable base ending in a single s is almost always a
      // magic-e stem plus -s (uses, cases, roses, houses, nurses), not
      // an -es plural (buses, gases); read it through the silent-e form.
      if (!NO_DROPPED_E.test(base) && /^[^aeiouy]*[aeiouy]+[^aeiouys]*s$/.test(base)) {
        const stem = bareSStem(base) || this.predictInternal(base + "e", undefined, true);
        if (stem && !ENDS_IN_VOWEL_RE.test(stem)) return sPlural(stem, base);
      }
      const basePron = this.wellKnown(base);
      if (basePron) return sPlural(basePron, base);
      // A rule-exact base ending in the -us/-is/-ix TENSE_ENDINGS suffix
      // (virus, iris, matrix) has also left the table, and resyllabifying
      // the whole inflected form moves its final consonant into the new
      // "-es" syllable's onset (vi·ru·ses, not vi·rus), losing exactly
      // the ending shape that tensed the stressed vowel on its own —
      // the same problem the r-final stem fix above solves for -s. Force
      // the rule path on the untouched base, where TENSE_ENDINGS still
      // sees it whole (viruses, irises; most -us/-is/-ix dict words are
      // one-syllable stems and are already caught by the single-vowel-
      // group branch just above, so this only adds the multi-syllable
      // remainder). Complete hiatus rimes also survive -es without a
      // fabricated silent-e stem (biases → bias, not biase).
      // "-ouses" is excluded — house's "ou" digraph plus a
      // bare "s" coincidentally spells the same four letters
      // (blockhouses, farmhouses), but it
      // is not the Latin -us suffix and is already handled above, at the
      // single-vowel-group branch this compound's prefix keeps it out of.
      if ((/(?:us|is|ix)es$/.test(lowerWord) && !/ouses$/.test(lowerWord)) ||
          (NO_DROPPED_E.test(base) && /s$/.test(base))) {
        const p = this.predictInternal(base, undefined, true);
        if (!ENDS_IN_VOWEL_RE.test(p)) return p + "ɪz";
      }
    }

    // y-stem family: restore the -y the suffix replaced (tried → try,
    // happiness → happy), read the stem, attach the allomorph. The stem may
    // be rule-derived, since a rule-exact base (dictionary) has left the
    // table: 118 strict : 4 (dictionaries, mercenaries, tapestries). -ier
    // stays lexicon-first: an unrestricted rule fallback loses on surnames
    // (32 : 60). Short strong Cy rimes survive eviction (spicy -> spicier).
    for (const [sfx, join] of [
      ["ied", edPast],
      ["ies", sPlural],
      ["ier", (p: string) => p + "ɝ"],
      ["iness", (p: string) => p + "nəs"],
      ["iest", (p: string) => p + "əst"],
    ] as [string, (p: string, base?: string) => string][]) {
      if (!lowerWord.endsWith(sfx) || lowerWord.length <= sfx.length + 1)
        continue;
      const stripped = lowerWord.slice(0, -sfx.length);
      const base = stripped + "y";
      // A vowelless remainder is no stem (priest is not pr + -iest).
      // A genuine Cy root has a y nucleus even without a/e/i/o/u
      // (shied <- shy). A remainder already containing y (stymied)
      // instead belongs to an -ie stem; keep its prior lexical-only test.
      const basePron =
        sfx === "ier"
          ? this.wellKnown(base) || (OPEN_Y_ROOT.test(base) || MERGED_WEAK_DY_ROOT.test(base) ? stemPron(base) : undefined)
          : !/[aeiou]/.test(stripped) && !(/^(?:ied|ies)$/.test(sfx) && /^[bcdfghjklmnpqrstvwxz]+$/.test(stripped))
            ? this.wellKnown(base)
            : stemPron(base);
      if (basePron) { const ruleRoot = sfx === "ies" && /ilities$/.test(lowerWord) ? this.predictInternal(base, undefined, true) : undefined, rulePhones = ruleRoot?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l"), lexicalPhones = basePron.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l"); return join(ruleRoot && rulePhones?.endsWith("ləti") && lexicalPhones.endsWith("lɪti") && rulePhones.slice(0, -4) === lexicalPhones.slice(0, -4) ? ruleRoot : basePron, base); }
    }

    // Supplied soft silent-e verbs also witness Latin -sor/-cor agents
    // and -sory/-cory adjectives. Short roots can be unrelated headwords
    // (once -> Oncor); keep them on the whole-word path.
    // The stressed -eer family (engineer, volunteer) is not neutral -er.
    // Weak or palatal medial nuclei retain their whole-word suffix policy.
    // Closed initial syllables exclude spurious open-prefix name roots; caller roots remain explicit.
    // Rule-only -ate stems need an open first syllable; closed-prefix stress stays on its whole-word route.
    const orStem = /[vt]or$/.test(lowerWord) ? lowerWord.slice(0, -2) + "e" : "";
    const orRoot = orStem && (verbReading(orStem) || lex(orStem) || /[aeiouy]$/.test(syllabify(orStem)[0]) && this.predictInternal(orStem, undefined, true));
    const neutralOr = orRoot && (this.customDict[orStem] || !isMonosyllable(orRoot) &&
      (/v$/.test(orRoot) ? /[^aeiouy]$/.test(syllabify(orStem)[0]) :
        /^ˈ/.test(orRoot) && /(?:eɪt|ət)$/.test(orRoot) && !/[əɝj]|[aeiouɑæɛɪɔʊʌəɝ]+[^aeiouɑæɛɪɔʊʌəɝ]+ɪ[^aeiouɑæɛɪɔʊʌəɝ]/.test(orRoot.replace(/(?:eɪt|ət)$|[ˈˌ]/g, ""))));
    const agentEnding = lowerWord.endsWith("er") ? "er" :
      lowerWord.endsWith("est") && /^[a-z]+$/.test(lowerWord) && keepsDouble(lowerWord.slice(0, -3)) && !isFunctionWord(lowerWord.slice(0, -3)) ? "est" :
      neutralOr ? "or" :
      /[cs]ory?$/.test(lowerWord) && lowerWord.replace(/ory?$/, "").length >= 4 && !isFunctionWord(lowerWord.replace(/ory?$/, "e")) && /[szʒ]$/.test(lex(lowerWord.replace(/ory?$/, "e")) || "") ? (lowerWord.endsWith("y") ? "ory" : "or") : undefined;
    if (agentEnding && !lowerWord.endsWith("eer") && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -agentEnding.length), agentSuffix = agentEnding === "est" ? "əst" : "ɝ";
      // A doubled final consonant on the base is orthographic gemination,
      // not a real letter to keep before adding "e" — the same skip
      // silentE() in inflect() already applies for -ed/-ing. Without it an
      // unrelated pronounced-e loanword sharing the doubled spelling
      // corrupts the derivation (bette → better, latte → latter, butte →
      // butter, passé → passer).
      const doubledBase = /([bcdfgklmnprst])\1$/.test(base);
      // A short base ending in "th" (bath, lath, math, rath, with) also
      // coincidentally matches an unrelated, obscure dict headword that
      // happens to be spelled the same as a genuine "-the" verb (bathe,
      // lathe, mathe, rathe, withe) — bather/lather/mather/rather/wither
      // are surnames and unrelated words (ˈbæðɝ, not "one who bathes"),
      // not real -the derivations, and there is no dict word for which
      // the short-base reading is correct. A LONGER "th" base is the
      // opposite case and must still go through this lookup: breath+e=
      // breathe is real, and breather (ˈbɹiðɝ) needs it. base.length <= 4
      // is the split (bath/lath/math/rath/with are the whole 4-letter
      // population found; breath is 6). Rule-diff over the whole dict:
      // strict 5 : 0, lenient 4 : 0 (bather, lather, mather, rather,
      // wither).
      // A polysyllabic restored-e stem supplies the verb reading to an
      // agent noun (produce → producer). Monosyllables can instead be
      // comparatives (closer), so preserve their citation reading.
      // A labelled -ate verb must retain its regular /eɪt/ ending.
      // A vouched naturally doubled root precedes undoubling; weak el
      // keeps its existing recovery and explicit caller roots keep ownership.
      // A complete digraph verb precedes a fabricated silent-e stem:
      // an unrelated name (reade) cannot supply an agent noun's root.
      const completeStem = liquidStem(base, "er") ||
        ((/ind$/.test(base) && this.customDict[base] || vouchedIndRoot(base)) ? this.customDict[base] || verbReading(base) || vouchedIndRoot(base) : undefined) ||
        (doubledBase ? this.customDict[base] || weakElDouble(base) || verbReading(base) || lex(base) : undefined) ||
        (/[aeiou]{2}(?:[^aeiou]|nd)$/.test(base) ? verbReading(base) : undefined);
      if (completeStem) return (base.endsWith("rl") ? this.tryCompoundSplit(lowerWord) : undefined) ||
        completeStem + agentSuffix;
      const restored = base + "e";
      const verb = verbReading(restored);
      const agentVerb = verb && !isMonosyllable(verb) &&
        (!restored.endsWith("ate") || /eɪt$/.test(verb)) ? verb : undefined;
      const rhoticIreAgent = agentEnding === "er" && restored.endsWith("ire") ? this.predictInternal(restored, undefined, true) : undefined;
      if (rhoticIreAgent && /aɪɝ$/.test(rhoticIreAgent))
        return rhoticIreAgent.replace(/aɪɝ$/, "aɪɹ") + agentSuffix;
      // Silent -pse roots preserve their short coda and root stress
      // after eviction; a bare -ps fragment can be a different lexeme.
      let magicPron = doubledBase || NO_DROPPED_E.test(base) || /^[aeiou]ng$/.test(base) || (base.length <= 4 && base.endsWith("th"))
        ? undefined
        : neutralOr ? orRoot : agentVerb || this.wellKnown(restored) || this.strongAgeRoot(restored) || (isBoundBol(restored) || /pse$/.test(restored) || LATIN_E_ROOT.test(restored) ? this.predictInternal(restored, undefined, true) : undefined) || (syllabify(restored).length > 2 && ngeStem(base) ? this.renderRuleForm(restored) : undefined);
      // A short base can also coincidentally match an unrelated headword
      // whose final e IS pronounced (ente "duck" → enter, mete → meter).
      // Reject a vowel-final hit unless the base ends in y/w/r, where that
      // vowel is a genuine offglide/rhotic the suffix attaches to cleanly
      // (flye→flyer, howe→hower, acquire→acquirer).
      if (magicPron && /[^aeiouyrw]$/.test(base) && ENDS_IN_VOWEL_RE.test(magicPron)) magicPron = undefined;
      if (magicPron) {
        const magicClean = magicPron.replace(/[ˈˌ]/g, '');
        if (magicClean.endsWith('ndʒ')) {
          const directPron = this.wellKnown(base);
          if (directPron) {
            const directClean = directPron.replace(/[ˈˌ]/g, '');
            const pc = (s: string) => s.replace(/ɔ/g, 'ɑ').replace(/ʌ/g, 'ə').replace(/ɪ/g, 'i');
            if (pc(magicClean.replace(/ndʒ$/, '')) === pc(directClean.replace(/ŋ$/, ''))) return directClean + agentSuffix;
          }
        }
        return magicPron + agentSuffix + (agentEnding === "ory" ? "i" : "");
      }
      // No magic-e stem. Try the base with a doubled final consonant
      // singled (better←bet, controller←control), then a bare base the
      // general syllabifier mispredicts in isolation on its own (grosser←
      // gross: ˈɡɹɑs not ˈɡɹoʊs in isolation), before falling through to
      // whole-word resyllabification. skipMorphology=true per the
      // chas→cha+s precedent above: a fragment must not be re-decomposed.
      // Monosyllabic ll/ss keeps the actual double letter (small/less),
      // unlike suffix-induced doubling (bigg/controll).
      // -ther is one morpheme (brother/bother/leather), not broth + -er.
      // Closed-class bases cannot license an agent (should+er loses shoulder's GOAT/l).
      // Protected complete rimes survive eviction. Rhotic -ord/-ort agents
      // inherit an independently supplied verb reading (recorder/exporter);
      // extending that preference to every -er stem was net-negative.
      const rootPron =
        doubledBase && (base.length >= 4 || agentEnding === "est")
          ? keepsDouble(base) ? stemPron(base) : weakElDouble(base) || verbStem(base.slice(0, -1), true)
          : !isFunctionWord(base) && ((base.length >= 5 && !base.endsWith("th")) || NO_DROPPED_E.test(base) || OPEN_I_WEAK_ROOT.test(base))
            ? (/or[dt]$/.test(base) ? verbStem(base, true) : this.wellKnown(base, undefined, true)) ||
              (NO_DROPPED_E.test(base) || hasWeakSonorantRime(base) || BORROWED_ROOT_FRAME.test(base) ? this.predictInternal(base, undefined, true) : undefined)
            : undefined;
      if (rootPron) return rootPron + agentSuffix;
    }

    // Keep the complete ee nucleus in -eed (feed/need/freed);
    // stripping -ed can invent an e stem and change that vowel.
    // Short -Cied keeps its ie nucleus (died/tied), rather than
    // accepting an unrelated two-letter i stem (di/ti).
    const regularInflection: [number, (p: string) => string] | undefined =
      lowerWord.endsWith("ed") && lowerWord.length > 3 && !/(?:eed$|^[^aeiouy]ied$)/.test(lowerWord) ? [2, edPast] :
      lowerWord.endsWith("ing") && lowerWord.length > 4 ? [3, (b: string) => b + "ɪŋ"] : undefined;
    const regularPron = regularInflection && inflect(regularInflection[0], regularInflection[1], true);
    if (regularPron) return lowerWord.endsWith("aging") && !lowerWord.endsWith("naging") ? regularPron.replace(/ədʒɪŋ$/, "ɪdʒɪŋ") : regularPron;

    if (lowerWord.endsWith("ally") && lowerWord.length > 6) {
      const base2 = lowerWord.slice(0, -2);
      // -al adjectives the rules already handle (final, total, general)
      // are not in the lexicon; read them by rule before falling back to
      // the -ic stem of -ically words (basically, typically).
      const baseLex = lex(base2), basePron = base2.endsWith("tual") && baseLex && !baseLex.includes("tʃu") ? this.predictInternal(base2, undefined, true) : (base2.endsWith("ical") ? baseLex : stemPron(base2)) || stemPron(lowerWord.slice(0, -4));
      if (basePron) return /[lɫ]$/.test(basePron) ? basePron + "i" : basePron.replace(/ə$/, "") + "əli";
    }
    // apply/comply/supply/imply/reply are the bound Latin root "ply"
    // (< plicare "to fold") after an assimilated ad-/com-/sub-/in-/re-
    // prefix, not a free root + the -ly adverb suffix — the stem this
    // handler would otherwise strip ("app", "comp", "supp", "imp", "rep")
    // isn't a real word, and the fabricated reading loses the suffix's
    // own final stress (ˈæpɫi, not əˈpɫaɪ). Routed instead to the plain
    // rule path (syllabify -> assignStress -> syllableToIPA), whose
    // 2-syllable prefix check now recognises this exact 4-prefix set (see
    // assignStress) and whose "re" case was already an existing
    // unstressed-prefix entry.
    //
    // This used to be a literal `^(?:ap|com|sup|im|re)ply$` alternation —
    // a whole-word list of exactly these 5 words wearing a regex, which
    // this project's rules forbid in code. Two structural alternatives
    // were measured. A stem-plausibility test (skip stripping when the
    // remaining stem is a doubled consonant, or ends in a cluster no
    // English word can) only half-works: "app"/"supp" are correctly
    // implausible, but "imp" and "rep" are themselves ordinary dict
    // headwords, so no stem-shape test can tell imply/reply's fabricated
    // stem apart from a genuine short word. What DOES generalise is
    // reusing KEEP_UNMERGED_AFTER_PREFIX (syllabify.ts) — the same
    // assimilated-prefix set that keeps these words' two syllables from
    // merging in the first place: a word is this bound root exactly when
    // it equals one of those prefixes plus literal "ply". Since "deply"
    // and "unply" aren't English words, that composition names precisely
    // the same 5 words the old regex did (confirmed by a byte-identical
    // rules-only dump before/after this substitution) — it is a morpheme
    // rule, not a lookup table, per the -ation/-ity precedent of reusing
    // general prefix/suffix composition elsewhere in this file.
    if (
      lowerWord.endsWith("ly") &&
      !lowerWord.endsWith("ally") &&
      lowerWord.length > 4 &&
      // A vowel+r+ly rime is intact (early), rather than ear + -ly;
      // consonantal y still permits year + -ly.
      !/^[aeiou]+rly$/.test(lowerWord) &&
      !(lowerWord.endsWith("ply") && KEEP_UNMERGED_AFTER_PREFIX.has(lowerWord.slice(0, -3)))
    ) {
      const stem = lowerWord.slice(0, -2);
      // A vouched compound's PRICE-y tail is not the adverb suffix;
      // supplied -ly/-le bases still take precedence (deeply/simply).
      const compound = !lex(stem) && !COMPOUND_HEADS[stem] && !lex(stem + "le") && this.tryCompoundSplit(lowerWord);
      if (compound && /aɪ$/.test(compound)) return compound;
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
      // Restore an attested adjective's y before -ily; the stripped
      // i fragment can have an unrelated tense vowel (heavily).
      // A short -ull root loses one l before -ly (full → fully).
      const llRoot = /^[^aeiouy]*ul$/.test(stem) ? lex(stem + "l") || COMPOUND_HEADS[stem + "l"] : undefined;
      const yBase = /[^aeiouy]i$/.test(stem) ? stem.slice(0, -1) + "y" : undefined;
      // Recover prefixed -ary/-ory through the same analyser after eviction.
      // Keep the bound -ular root before -ly, including supplied secondary stress.
      let ular = /ular$/.test(stem) && !this.customDict[stem] ? this.tryMorphologicalAnalysis(stem) : undefined;
      if (ular && lex(stem)?.startsWith("ˌ") && !ular.startsWith("ˌ")) ular = "ˌ" + ular;
      const withLy = (p: string): string => {
        if (/[lɫ]$/.test(p)) return p + "i";
        // A consonant+i stem is the -y adjective with its final letter
        // rewritten by the suffix (angry→angrily, easy→easily) or a
        // truncated Latinate stem (family, homily). Either way that /ɪ/ is
        // the slot before the suffix, which reduces: -ily is 64 ə : 6 ɪ in
        // data/en/dict.json. The stem is read without the suffix in view,
        // so the reduction has to be applied on the join.
        if (/[^aeiouy]i$/.test(stem))
          return p.replace(/[iɪ]$/, "ə") + "li";
        // A polysyllabic -ate adjective supplies weak /ət/ to -ately;
        // retain stressed -ate (innately) and shorter bound forms.
        if (lowerWord.endsWith("ately") &&
            (p.match(/eɪ|aɪ|aʊ|oʊ|ɔɪ|[aeiouɑæɛɪɔʊʌəɝ]/g)?.length ?? 0) >= 3 &&
            /ˈ[^ˈ]*[ɑɔæɛɪiʊuʌəɝɚ][^ˈ]*(?:eɪ|(?<![eaɔ])ɪ)t$/.test(p))
          return p.replace(/ˌ(?=[^ˈˌ]*(?:eɪ|ɪ)t$)/, "").replace(/(?:eɪ|ɪ)t$/, "ət") + "li";
        return p + "li";
      };
      const citation = stemPron(stem);
      const nonVerb = this.homographs[stem]?.find(entry => this.matchPos(entry, "ADJ"))?.pronunciation;
      const basePron = llRoot || ular || (yBase && (lex(yBase) ||
        (/^un.*(?:ary|ory)$/.test(yBase) ? this.tryMorphologicalAnalysis(yBase) : undefined) ||
        (OPEN_Y_ROOT.test(yBase) || PRICE_HIATUS_ARY_ROOT.test(yBase) || SILENT_HON_ROOT.test(yBase) ? stemPron(yBase) : undefined))) || this.customDict[stem] ||
        (citation && (nonVerb && withLy(nonVerb).replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l")) === withLy(citation).replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l") ? citation : nonVerb) || citation;
      if (basePron) return withLy(basePron);
    }

    // -able/-ible: magic-e derivation first (advisable→advise,
    // reproducible→reproduce), then the bare base. -ible needs a LONG
    // base (≥5) so short coincidental stems (poss→posse, vis→vise,
    // leg→lege) don't misfire — possible/visible/legible stay on the
    // normal path.
    // A short consonant-vowel root still supplies a real nucleus to -able
    // (do/lie/vie); consonant-only fragments cannot (st in stable).
    const able = lowerWord.endsWith("able") && (lowerWord.length > 6 || /^[^aeiouy][aeiou]able$/.test(lowerWord));
    if (able || lowerWord.endsWith("ible") && lowerWord.length > 7) {
      const base = lowerWord.slice(0, -4);
      const withAble = (p: string): string => (this.customDict[base] || this.customDict[base + "e"] ? p : dropStemYod(p)).replace(/ə$/, "").replace(/ju$/, /lu$/.test(base) ? "j" : "ju") + "əbəl";
      // Undoubled short a/i/o/u bases retain silent-e; short e stays ambiguous.
      const undoubledAble = able && SHORT_SILENT_E_ROOT.test(base + "e");
      if ((able || base.length >= 5) && (able && deverbal(base) || this.customDict[base + "e"] || undoubledAble || !/[aeiour]$/.test(base) && !lex(base))) {
        // A head-stressed compound can retain an evicted silent-e root; weak prefixes stay ambiguous.
        const m = (able && deverbal(base)) || this.customDict[base + "e"] || verbReading(base + "e") || lex(base + "e") || this.tryMorphologicalAnalysis(base + "e")?.match(/^ˈ.*$/)?.[0] ||
          (undoubledAble || LATIN_E_ROOT.test(base + "e") ? this.renderRuleForm(base + "e") : undefined);
        if (m) return withAble(m);
      }
      if (able) {
        // Restore the dropped e of a short long-i root before -able.
        // Whole-dict probe including the short-root window: strict/lenient +3/-0.
        if (/^[^aeiouy]+i$/.test(base)) {
          const ie = stemPron(base + "e");
          if (ie && /aɪ$/.test(ie)) return withAble(ie);
        }
        // A supplied final-stressed rhotic fragment can mask its real
        // silent-e root (desir/desire); initial-stressed bound roots stay.
        const rStem = lex(base);
        const silent = /r$/.test(base) && rStem && !isMonosyllable(rStem) && FINAL_STRESS_RE.test(rStem)
          ? lex(base + "e") : undefined;
        if (silent && isUsableConsonantStem(silent, base)) return withAble(silent);
        // Restore y before suffix-induced doubling (control → controllable,
        // regret → regrettable), then read the bare stem.
        const recovered = restoreY(base) || doubledConsonantLex(base) || stemPron(base);
        if (recovered) return withAble(recovered);
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
      // Keep pretonic -Co- in view: pricing the bound root alone makes
      // it tense, and loses the initial secondary stress (methodology).
      const slots = syllabify(lowerWord);
      if (lowerWord.endsWith("ology") && slots.length >= 4 &&
          slots.slice(-3, -1).every(slot => /^[^aeiouy]+o$/.test(slot)))
        return this.renderRuleForm(lowerWord, slots.length - 2);
      // The free path /pæθ/ has a weak bound allomorph in pathology:
      // Cambridge US gives /pəˈθɑːlədʒi/ (also /pæ-/), while the
      // productive pathological/pathogenesis compounds keep /pæθ/.
      // Drop secondary stress and centralize only this patho- stem before -ology.
      const stem = lowerWord.slice(0, -4), raw = stemPron(stem), bp = stem === "patho" && raw ? raw.replace(/^ˈ/, "").replace(/æ(?=θoʊ$)/, "ə") : raw;
      if (bp) return stem.endsWith("o") ? bp.replace(/ˈ/g, "ˌ").replace(/oʊ$/, "").replace(/[ˈˌ]$/, "") + "ˈɑlədʒi" : bp.replace(/ə$/, "") + "lədʒi";
    }
    if (
      (lowerWord.endsWith("cial") ||
        (!lowerWord.endsWith("stial") && lowerWord.endsWith("tial"))) &&
      lowerWord.length > 5
    ) {
      const stem = lowerWord.slice(0, -4);
      // -cial/-tial place stress before the suffix. A polysyllabic
      // bound stem priced alone loses that stress and vowel context
      // (beneficial, official); leave it to the whole-word rules.
      // Short open stems retain the a/e boundary correction below.
      const pp =
        (stem.match(/[aeiouy]+/g)?.length ?? 0) >= 2
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
              : stem.endsWith("u") ? pp.replace(/ʌ$/, "u") : pp) + "ʃəl"
        );
    }
    // -ation ← -ate verb or bare stem (abdication, adaptation). Like
    // -ization, the suffix takes the primary on its /eɪ/ and the stem's
    // primary demotes: keeping the stem's stress gave ˈæbdəˌkeɪʃən for
    // ˌæbdɪˈkeɪʃən (316 dict words with penult stress read otherwise).
    if (lowerWord.endsWith("ation") && lowerWord.length > 7) {
      const b = lowerWord.slice(0, -5),
        ate = lex(b + "ate"),
        // -mentation attaches to the existing -ment stem; inventing
        // an -ate verb changes its weak vowel after table eviction.
        src = lex(b) || (b.endsWith("ment") ? stemPron(b) : undefined), ruleMitStem = !ate && src && /mit$/.test(b) ? this.predictInternal(b, undefined, true) : undefined;
      if (ate) return suffixPrimary(ate.match(/eɪt$/) ? ate.slice(0, -1) : ate.replace(/[ɪə]t$/, "eɪ")) + "ʃən";
      // Recover short roots hidden by unrelated lexical heads, e.g. avi in aviation.
      if (!ate && b.length <= 3 && src) { const anForm = this.predictInternal(b + "an", undefined, true); if (anForm && /ən$/.test(anForm.replace(/[ˈˌ]/g, ""))) return anForm.replace(/ˈ/g, "ˌ").replace(/ən$/, "") + "ˈeɪʃən"; }
      // Preserve a rules-vouched KIT in weak -mit roots (limit → limitation).
      if (src) return this.recoverConAtion(lowerWord) || suffixPrimary((ruleMitStem && /t$/.test(ruleMitStem) && src.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l").replace(/ə(?=t$)/, "ɪ") === ruleMitStem.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l") ? ruleMitStem : src) + "eɪ") + "ʃən";
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
      // A supplied silent-e PRICE root before -ilation/-ivation needs
      // the noun's weak medial vowel, not a fabricated -ilate/-ivate.
      if (/aɪ[vɫl]$/.test(lex(b + "e") || "")) return this.renderRuleForm(lowerWord);
      if (!/ific$/.test(b)) {
        const ruleAte = this.predictInternal(b + "ate", undefined, false);
        if (ruleAte && /eɪt$/.test(ruleAte)) return suffixPrimary(ruleAte.slice(0, -1)) + "ʃən";
      }
    }
    // A supplied -ance noun independently witnesses the same -ant root.
    // Reuse the noun-ending handler and verified compound-tail readings;
    // absence of a noun keeps opaque roots (suppliant) on their own path.
    const weakNounEnding = /(?:[ae]nce|ant)$/.exec(lowerWord)?.[0];
    if (weakNounEnding && lowerWord.length > weakNounEnding.length + 3) {
      const b = lowerWord.slice(0, -weakNounEnding.length);
      if (weakNounEnding.endsWith("nt")) {
        const noun = lowerWord.slice(0, -1) + "ce";
        const supplied = lex(noun) || COMPOUND_TAILS[noun];
        if (supplied?.endsWith("əns")) return supplied.slice(0, -1) + "t";
      } else {
        // A bound double-nucleus iol root keeps its weak suffix context;
        // the independent musical viol has different vowel/stress behavior.
        if (/^[^aeiouy]+iol$/.test(b)) return undefined;
        const
          // A pronounced final e (entre) cannot explain silent-e deletion.
          // Vowel-final roots (continue/issue) keep their own valid hiatus.
          // A vouched -uid-e stem keeps its root diphthong (guide/guidance),
          // unlike checked -id stems in residence/presidence. Frozen strict +1/-0.
          magic = b.endsWith("id") && !/uid$/.test(b) ? undefined : lex(b + "e"),
          p =
            (lowerWord.endsWith("ance") ? restoreY(b) || deverbal(b) : undefined) ||
            lex(b) ||
            (b.endsWith("i") ? lex(b.slice(0, -1) + "y") : undefined) ||
            (magic && (/[aeiouy]$/.test(b) || isUsableConsonantStem(magic, b)) ? magic : undefined);
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
    }
    // Short -sual is a bound hiatus frame; a bare vis/cas/us stem hides
    // the intervocalic s and can accidentally select a function word.
    if (/[aeiouy]sual$/.test(lowerWord) && syllabify(lowerWord).length === 2) return this.renderRuleForm(lowerWord);
    if (
      lowerWord.endsWith("ual") &&
      !lowerWord.endsWith("gual") &&
      lowerWord.length > 5 &&
      !lowerWord.endsWith("tual")
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
        // mixed to rule (visual coalesces, consensual/asexual
        // don't, and the vowel that follows differs too: uə vs əwə).
        // A complete /ks/ root coalesces at this composed -ual boundary.
        // Ordinary /s/ retains its existing variable realization.
        return stem.replace(/([nl])$/, "$1j").replace(/d$/, "dʒ").replace(/ks$/, "kʃ") + "uəl";
      }
    }
    // The stress-neutral suffix family (-ify/-tual/-tuous/-ulation/
    // -ulator/-ulate/-ment/-ness/-less/-ful/-ize/-ist/-ism) is handled by
    // the declarative table in morph-table.ts/morph-parser.ts — see that
    // module's header for the shared composition logic and AGENTS.md's
    // 2026-09-30 note for the dict-wide measurements behind the split.
    // Placed here (after the -ual block, before the surviving -ular/-al
    // loop) so it keeps the exact same relative try-order those rows had
    // in the old single loop: any word not resolved by the table falls
    // through to -ular/-al below, matching the original ordering the
    // "actual"/"tual"-before-"al" substring overlap depends on.
    // An unattested Latinate stem ending in <u> before -ment is bound,
    // so word-final-u rules cannot price it as an independent word.
    // Render the suffix in view while retaining the stem's stress; only
    // reuse the result when the suffix has its regular pronunciation.
    // Latin sist- retains its root stress after a monosyllabic prefix;
    // it is not the stress-neutral English profession suffix -ist.
    if (/^(?:as|con|de|in|per|re|sub)sist(?:[ae]n(?:ce|cy|cies|t(?:s|ly)?)|ive|[eo]rs?|s)?$/.test(lowerWord)) return this.renderRuleForm(lowerWord, 1);
    // A weak Latin prefix before -tual yields to the complete-word
    // stress frame (conceptual/perpetual), unlike compound inter-.
    if (/^(?:con|per|in(?!ter)|ef).*tual$/.test(lowerWord) && syllabify(lowerWord).length >= 3) return this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 2);
    // A restored verb witnesses -osure; a verified compound retains its stress.
    if (/osure$/.test(lowerWord) && verbStem(lowerWord.slice(0, -3) + "e", true))
      return this.tryCompoundSplit(lowerWord) || this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 2);
    const tableResult = tryStressNeutralSuffix(lowerWord, (stem, suffix, suffixIpa) => {
      // Nominals retain the actual -ify root; keep the separate STRUT/CURE path for u roots.
      if (suffix === "ification") {
        const root = !/(?<!q)u/.test(stem) && stemPron(stem + "ify");
        return root && /[əɪ]ˌ?faɪ$/.test(root) ? root.replace(/ˈ/g, "ˌ").replace(/[əɪ]ˌ?faɪ$/, "") : undefined;
      }
      // A closed disyllabic root with a weak final nucleus licenses neutral -ous.
      if (suffix === "ous") {
        const root = !/[aeiouy]$|[aeiouy]{2}[^aeiouy]*$/.test(stem) && syllabify(stem).length === 2 && lex(stem);
        return root && (this.customDict[stem] || /^ˈ[^ˌ]*[əɝ][^aeiouɑɔæɛɪʊʌəɝ]*$/.test(root)) ? root : undefined;
      }
      // Productive -ish retains vouched roots; lexical-only restoration keeps lexicalized verbs whole.
      if (suffix === "ish") {
        const root = this.customDict[stem] ||
          (/(?:[aeiou][aeiouy]|ow)/.test(stem) || syllabify(stem).length >= 2 ? lex(stem) : undefined) ||
          (/u$/.test(stem) ? lex(stem + "e") : this.silentEAgentRoot(stem, true));
        return root && !isFunctionWord(stem) ? root : undefined;
      }
      // A complete silent-e root survives diminutive -let; short and
      // bound fragments keep their whole-word path (outlet/violet).
      // Vouched non-rhotic digraph roots keep their nucleus before diminutive -ie.
      if (suffix === "ie") return /[aeiouy]{2}[^aeiouyr]$/.test(stem) && COMPOUND_HEADS[stem] && isMonosyllable(COMPOUND_HEADS[stem]) ? stemPron(stem) : undefined;
      if (suffix === "let") {
        if (stem.length < 4 || !/[aeiou][^aeiouy]e$/.test(stem)) return undefined;
        const p = stemPron(stem);
        return p && isUsableConsonantStem(p, stem) ? p : undefined;
      }
      // A longer unattested Greek -bol root is bound: -ism/-ize retain
      // the whole derivative's antepenultimate stress, not a fabricated
      // free-stem citation stress. Short supplied symbol/embol roots stay.
      if ((suffix === "ism" || suffix === "ize") && isBoundBol(lowerWord) && !lex(stem)) return undefined;
      // Keep protected nasal-dental rimes intact (lengthwise), and an
      // unattested linking a inside the whole compound (lookalike).
      if (suffix === "wise" && (/ngth$/.test(stem) || syllabify(stem).length > 2 && !lex(stem) && !isWeakLatinIte(stem) && !FREE_I_NITE_ROOT.test(stem) && !BORROWED_ROOT_FRAME.test(stem) && !/oic$/.test(stem)) || suffix === "like" && stem.endsWith("a") && !lex(stem) && !BORROWED_ROOT_FRAME.test(stem)) return undefined;
      // The -hood spelling replaces a final adjective y with i.
      if (suffix === "hood" && /[^aeiouy]i$/.test(stem)) return stemPron(stem.slice(0, -1) + "y");
      // A bound prefix is not the free verb that neutral -ment requires.
      if (suffix === "ment" && EN_PREFIXES.has(stem)) return undefined;
      // Only -ion + ary is neutral; retain the root after eviction.
      // The final n becomes the onset of the secondary suffix syllable;
      // other -ary forms keep their existing stress-sensitive path.
      if (suffix === "ary") return stem.endsWith("ion") ? stemPron(stem)?.replace(/n$/, "ˌn") : undefined;
      // Keep bound -ple and a nucleus-less/vowel-initial -le frame
      // in word context; free silent-le stems keep their citation reading.
      const pleRoot = stem.endsWith("ple") && KEEP_UNMERGED_AFTER_PREFIX.has(stem.slice(0, -3));
      if (suffix === "ment" && (pleRoot || /^(?:[bcdfghjklmnpqrstvwxz]*|[aeiouy])le$/.test(stem))) {
        const contextual = this.renderRuleForm(lowerWord, pleRoot ? 0 : assignStress(syllabify(stem), stem)).replace(/ɪ(?=mənt$)/, "ə");
        if (contextual.endsWith(suffixIpa)) return contextual.slice(0, -suffixIpa.length);
      }
      // -ify and -ity share an antepenult root and a weak thematic i.
      // Render the same root in that frame rather than pricing its bound
      // fragment as a free word (solid/dign/ver); both pipeline paths
      // use this rule. An independent supplied -ity reading takes priority.
      if (suffix === "ify") {
        const root = /^de.{4,}$/.test(stem) ? this.tryMorphologicalAnalysis(stem.slice(2) + "ify") : undefined;
        if (root?.endsWith(suffixIpa)) return "dɪ" + root.slice(0, -suffixIpa.length);
        const noun = lex(stem + "ity") || this.renderRuleForm(stem + "ity");
        if (/[əɪ]ˌ?t[iɪ]$/.test(noun)) return noun.replace(/[əɪ]ˌ?t[iɪ]$/, "");
      }
      // Bound palatal -ci/-gi before -ment shares the -men noun frame
      // (regimen/regiment), retaining its stress after either root is evicted.
      const weakMenRoot = suffix === "ment" && /[cg]i$/.test(stem) && stemPron(stem + "men");
      if (weakMenRoot && weakMenRoot.endsWith("mən")) return weakMenRoot.slice(0, -3);
      // Paired nominalizations independently witness the bound root's vowels and stress.
      if (/^(?:ist|ism)$/.test(suffix) && /[aeiouy]/.test(stem) && !lex(stem) && !lex(stem + "e")) {
        const paired = lex(stem + (suffix === "ist" ? "ism" : "ist"))?.match(suffix === "ist" ? /^([\s\S]*)[əɪ]ˌ?zəm$/ : /^([\s\S]*)[əɪ]st$/);
        if (paired) {
          const root = paired[1].replace(/ˌ(?=[^aeiouɑɔæɛɪʊʌəɝ]*$)/, "");
          const prior = stemPron(stem);
          const phones = (ipa: string) => softenBaseFinal(ipa, stem, suffix).replace(/ɫ/g, "l").replace(/[əɪ]/g, "ə");
          if (!prior || phones(root) !== phones(prior)) return root;
        }
      }
      const base = (suffix === "ment" && deverbal(stem)) || (/^(?:ist|ism)$/.test(suffix) && this.silentEAgentRoot(stem)) || stemPron(stem);
      if (!base || suffix !== "ment" || !/[^q]u$/.test(stem) || lex(stem)) return base;
      const contextual = this.renderRuleForm(lowerWord, assignStress(syllabify(stem), stem));
      return contextual.endsWith(suffixIpa) ? contextual.slice(0, -suffixIpa.length) : base;
    });
    if (tableResult) return tableResult;
    for (const [sfx, ipa] of [
      ["ular", "jəlɝ"],
      ["al", "əl"],
    ] as [string, string][]) {
      if (!lowerWord.endsWith(sfx) || lowerWord.length <= sfx.length + 2)
        continue;
      const b = lowerWord.slice(0, -sfx.length);
      // Final -eal/-oal contains a vowel sequence, and -ual has its own
      // glide/coalescence context. Keep those endings in view. The
      // bound -eral frame also needs its full laxing context, rather
      // than a coincidental free stem (mineral is not miner + -al).
      // A single-onset -ation root takes lax a in its -al form
      // (nation/national); station keeps its multi-consonant onset.
      if (sfx === "al" && /^[^aeiouy]?ation$/.test(b)) return this.renderRuleForm(lowerWord);
      // Longer -inal formations take antepenultimate stress in word context
      // (origin/original); short roots retain citation stress (retinal).
      // Bound -ern/-urn roots need the whole adjective's stress too.
      if (sfx === "al" && (/[eou]$/.test(b) || /[eu]rnal$/.test(lowerWord) || lowerWord.endsWith("eral"))) continue;
      if (sfx === "al" && lowerWord.endsWith("inal") && (b.match(/[aeiouy]+/g)?.length ?? 0) >= 3)
        return this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 3);
      // -ical shifts a longer initial-stressed citation stem onto the
      // vowel before -ic (politic → political). Retain lexical segment
      // quality when the stem already carries its regular stress.
      if (sfx === "al" && b.endsWith("ic")) {
        const known = lex(b);
        if (known?.startsWith("ˈ") && (known.match(/[aeiouɑæɛɪɔʊʌəɝ]+/g)?.length ?? 0) >= 3)
          return this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 3);
      }
      const finish = (p: string): string =>
        softenBaseFinal(preSuffixReduce(p, lowerWord), b, sfx) + ipa;
      // Stripping a vowel-initial -al from an unknown one-syllable base
      // closes its syllable (fi|nal → fin, to|tal → tot) and loses the
      // tense vowel; leave those to the whole-word rule path.
      if (sfx === "al" && /^[^aeiouy]*[aeiouy]+[^aeiouy]+$/.test(b) && syllabify(b).length === 1 && !lex(b))
        continue;
      // -ial is not stress-neutral like -al: it pulls the primary onto the
      // syllable before it (adversary → adversarial, editor → editorial),
      // which the whole-word stress rule places.
      // A one-syllable stem is the stressed <i> itself (trial, dial). Same
      // for -al after a polysyllabic -ent/-ant/-ont stem: environmental,
      // accidental, fundamental stress the -en- the stem left unstressed.
      if (sfx === "al" && (b.endsWith("i") || /[aeo]nt$/.test(b)) && (b.match(/[aeiouy]+/g)?.length ?? 0) >= 2) continue;
      if (sfx === "al" && !lex(b)) {
        // A doubled consonant before -al is orthographic (refer → referral):
        // read the single-consonant stem, as inflect() does for -ed/-ing.
        const undoubled = doubledConsonantLex(b);
        if (undoubled) return finish(undoubled);
        // Silent-e stem (approve → approval, arrive → arrival): a table lookup
        // only, since rule-predicting base + e always yields something
        // (classic + e, addition + e). A base under five letters is left out,
        // where an unrelated entry is likeliest (anim + e is "anime").
        // An -ic stem before -al keeps its c; restoring e invents
        // a different soft-c headword (radic -> radice).
        if (b.length >= 5 && !/[aeiour]$/.test(b) && !b.endsWith("ic")) {
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

    // Outer suffixes resolve first: preference is not pre + ference.
    // Only an independently attested root licenses this pre- boundary.
    if (lowerWord.startsWith("pre") && lowerWord.length >= 7) {
      const b = lowerWord.slice(3), base = lex(b) || (BORROWED_ROOT_FRAME.test(b) ? this.predictInternal(b, undefined, true) : undefined) || (b.endsWith("nge") && ngeStem(b.slice(0, -1)) ? this.renderRuleForm(b) : undefined);
      if (base) return "pɹi" + base;
    }
    return undefined;
  }

  /**
   * syllabify → assignStress → per-syllable syllableToIPA, shared by
   * renderRuleForm (which needs the joined IPA array) and trace() (which
   * only needs the step log syllableToIPA writes via `steps`).
   * `forcedStress` lets a morphology handler render a bound stem with a
   * forced stress index (see the -ular handler above) instead of
   * `assignStress`'s free-word default.
   */
  private ruleSyllables(
    lowerWord: string,
    forcedStress?: number,
    steps?: TraceStep[],
  ): { syllables: string[]; stressedIdx: number; ipa: string[] } {
    // Greek noun -logue has the same nuclei as -log; its silent ue
    // must not create a further stress-counting slot. A bare logue name
    // retains its existing long-o rime.
    if (lowerWord.length > 5 && /logue$/.test(lowerWord)) lowerWord = lowerWord.slice(0, -2);
    const syllables = syllabify(lowerWord);
    const stressedIdx = forcedStress ?? assignStress(syllables, lowerWord);
    const secondary = secondaryStressIndices(syllables, stressedIdx);
    const ipa = syllables.map((s, i) =>
      syllableToIPA(
        s,
        i,
        i === stressedIdx,
        i === syllables.length - 1,
        i < syllables.length - 1 ? syllables[i + 1] : undefined,
        steps,
        i > 0 ? syllables[i - 1] : undefined,
        i === syllables.length - 2,
        syllables.slice(i + 1).join(""),
        secondary.has(i),
        syllables.slice(0, i).join(""),
        i > 0 && i - 1 === stressedIdx,
      ),
    );
    // One cross-syllable doubled g retains the soft allomorph once.
    const i = stressedIdx;
    if (i > 0 && syllables[i] === "ge" && syllables[i - 1].endsWith("g") &&
        ipa[i - 1].endsWith("ɡ") && ipa[i].startsWith("dʒ"))
      ipa[i - 1] = ipa[i - 1].slice(0, -1);
    return { syllables, stressedIdx, ipa };
  }

  /**
   * Priority-7's syllabify → assignStress → syllableToIPA → mark-insertion
   * pipeline.
   */
  private renderRuleForm(lowerWord: string, forcedStress?: number): string {
    const {
      syllables,
      stressedIdx: stressedSyllableIndex,
      ipa: syllableIPA,
    } = this.ruleSyllables(lowerWord, forcedStress);

    if (syllableIPA.length === 0) return lowerWord;
    const joined = syllableIPA.join("");
    let result = applyPostLexical(joined, lowerWord, syllables.length,
      syllableIPA.slice(stressedSyllableIndex + 1).every(p => !/[aeiouɑæɛɪɔʊʌəɝ]/.test(p)));

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
      if (result !== joined && tail && result.endsWith(tail) &&
          (tail === full || /[æɑɔəɛʌɝ]$/.test(result.substring(0, result.length - tail.length)))) {
        charIndex = result.length - tail.length;
        // Keep an ɪɹ/əɹ pair ahead of the mark, as applyPostStress's onset
        // pass does, so it can coalesce to ɝ (ballerina ˌbæɫɝˈinə).
        if (/[ɪə]$/.test(result.substring(0, charIndex)) && /^ɹ[aeiouæɑɔəɛɪʊʌ]/.test(result.substring(charIndex)))
          charIndex += 1;
      } else if (full.startsWith("ɹ")) {
        // A weak doubled-r boundary can coalesce while the stressed vowel
        // also changes (arrange). Its old tail is no longer a suffix of
        // the result; anchor after the prefix that actually survived.
        const prefix = joined.substring(0, charIndex).replace(/[əɪ]ɹ$/, "ɝ");
        if (result.startsWith(prefix)) charIndex = prefix.length;
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
      if (syllables.length > 1 && !/aɪə/.test(syllableIPA[stressedSyllableIndex]) && (isHiatusSlot(syllables[stressedSyllableIndex]) || /ieɪ/.test(syllableIPA[stressedSyllableIndex]) || /ealit(?:y|ies)$/.test(lowerWord) && /iæ/.test(syllableIPA[stressedSyllableIndex]))) {
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
  private tryCompoundSplit(word: string, inflectionLength = 0, headFilter: boolean | "owned" = false): string | undefined {
    if (word.length < 5) return undefined;
    let tail: string | undefined;
    let headReading: string | undefined;
    let bestScore = -1;
    for (let i = 2; i <= word.length - 2; i++) {
      if (word[i - 1] === word[i] && !/[aeiouy]/.test(word[i])) continue;
      const a = word.slice(0, i);
      const b = word.slice(i); if (/^(?:en|in)$/.test(a) && b === "quire") return this.renderRuleForm(word);
      // Keep a short KIT nasal foot on its weak -ow reading; owning the unsplit result also avoids acronym spelling.
      if (/ɪn$/.test(COMPOUND_HEADS[a] || "") && isMonosyllable(COMPOUND_HEADS[a] || "") && /^[^aeiouy]ow$/.test(b) &&
          /aʊ$/.test(COMPOUND_TAILS[b] || "") && COMPOUND_HEADS[b] !== COMPOUND_TAILS[b] && !EN_PREFIXES.has(a) && this.customDict[a] === undefined && this.customDict[b] === undefined) return this.renderRuleForm(word);
      // Derive only vouched short plural heads before a full polysyllabic tail;
      // a competing s-initial root preserves the original compound boundary.
      const pluralRoot = a.endsWith("s") ? a.slice(0, -1) : "";
      const pluralStem = !COMPOUND_HEADS[a] && pluralRoot.length >= 3 && /[aeiouy][aeiouyw]/.test(pluralRoot) &&
        !isFunctionWord(pluralRoot) && !EN_PREFIXES.has(pluralRoot) && !(COMPOUND_HEADS["s" + b] || COMPOUND_TAILS["s" + b]) &&
        (this.customDict[pluralRoot] || this.dictionary[pluralRoot] || COMPOUND_HEADS[pluralRoot]);
      // Owned silent-re nouns compose with independently verified agent tails.
      const headPron = COMPOUND_HEADS[a] ?? ((/[aeiouy][a-z]*[cvst]or$/.test(a) && COMPOUND_TAILS[b] ? this.wellKnown(a) : undefined) ||
        (BORROWED_ROOT_FRAME.test(a) && /[cbt]re$/.test(a) && /er$/.test(b) && COMPOUND_TAILS[b] ? this.customDict[a] || this.renderRuleForm(a) : pluralStem && isMonosyllable(pluralStem) && !isMonosyllable(COMPOUND_TAILS[b] ?? COMPOUND_HEADS[b] ?? "") ? this.wellKnown(a) : undefined));
      // Short compounds need a particle and an independently vouched monosyllable.
      if (word.length === 5 && (!(VERB_PARTICLE.test(a) || /^(?:in|on|by)$/.test(a)) ||
          !COMPOUND_TAILS[b] || !isMonosyllable(COMPOUND_TAILS[b]))) continue;
      // Verb prefixes keep their own stress policy; bed/thing are whole
      // tails, not vowel-bearing bases plus the apparent -ed/-ing ending.
      if (inflectionLength && (EN_PREFIXES.has(a) || VERB_PARTICLE.test(a) ||
          !/[aeiouy]/.test(b.slice(0, -inflectionLength)))) continue;
      // Merged silent-e rimes and verified monosyllabic tails keep the
      // root boundary. Bound/weak suffixes retain their existing routes.
      // -racetam is a bound INN drug stem, not the free words race + tam.
      const silentSlots = a.length >= 4 && /[aeiou][^aeiouy]e$/.test(a) ? syllabify(a).length : 0;
      const silentHead = silentSlots > 0 && silentSlots <= 2 && (VERB_PARTICLE.test(b) ||
        COMPOUND_HEADS[b] !== undefined && isMonosyllable(COMPOUND_HEADS[b]) &&
        !/(?:ate|ic|racetam)$/.test(word) && !/^(?:man|men|ward|some)$/.test(b) &&
        (silentSlots === 1 || !/^(?:ant|ent)$/.test(b)));
      // Back-vowel root rimes stay full; weak front-vowel name endings stay whole.
      const rhoticHead =
        /(?:ɝ|ɹ)$/.test(COMPOUND_HEADS[a] ?? "") && !isMonosyllable(COMPOUND_HEADS[a]) &&
        /^[aeiou]/.test(b) && (isFunctionWord(b) || /^[aou]([^aeiouy])\1$/.test(b)) &&
        COMPOUND_HEADS[b] && isMonosyllable(COMPOUND_HEADS[b]);
      if (headFilter && !rhoticHead && !(headFilter === "owned" && (pluralStem || /[bcdfgkpt]red$/.test(word))) ||
          headPron === undefined || (COMPOUND_TAILS[b] ?? (silentHead || rhoticHead || pluralStem ? COMPOUND_HEADS[b] : undefined)) === undefined) continue;
      // Weak rhotic e roots retain the complete word’s suffix environment.
      // Bound -stance after a prefix uses the whole word’s weak suffix.
      // A checked pro- noun or an inseparable prefix before head-primary
      // -ion is not a stress-neutral compound. Tail-primary attestation
      // retains the supplied inner root of indecision/indigestion.
      if (WEAK_RHOTIC_E_ROOT.test(word) || /^(?:anti|non)$/.test(a) && /(?:ist|ism)$/.test(b) && this.silentEAgentRoot(b.slice(0, -3)) ||
          (EN_PREFIXES.has(a) || a === "sub") && /^stances?$/.test(b) ||
          a === "pro" && PRO_CHECKED_ROOT.test(b) ||
          EN_PREFIXES.has(a) && /(?:tion|sion)$/.test(b) && COMPOUND_TAILS_REVERSED[b] === undefined) continue;
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
      // reached through the "-al" morphology handler. "-matic" joined the
      // exclusion 2026-09-28: it is the same Greek/Latin -atic adjectival
      // suffix (dogmatic, dramatic, systematic, aromatic, thematic,
      // traumatic), and once mine-compound-parts.ts's TAIL verification
      // also accepted a tail keeping its own primary (added the same day
      // so a legitimately-verified HEAD like over/some can pair with a
      // tail whose dict form happens to be tail-primary, e.g. overdone),
      // "matic" newly cleared the win-rate floor as a mined tail purely
      // from the same suffix-stress coincidence (2/9 either-convention,
      // 0/9 under the original single-convention test), and "dog" (an
      // ordinary, unexcluded compound head) broke a pinned test by giving
      // dogmatic the free-standing /dɔɡ/ instead of the initial-closed-o
      // frame's /dɑɡ/.
      // "pose" is the same trap from the other side: it newly verifies as
      // a tail (1/9, from impose — dict "im" and the "im-" prefix share
      // one vowel /ɪm/, so joinTailPrimary happens to reproduce impose's
      // real ˌɪmˈpoʊz exactly), but "pro" was ALREADY a legitimate
      // pre-existing compound head (14.6% under the original, unchanged
      // single-convention HEAD test, mostly from program) — an unrelated,
      // much larger win population this pass does not touch. The two
      // independently-earned parts combine wrongly on "propose", where
      // "pro" is a reduced, unstressed prefix (/prə/), not the free
      // word's full /proʊ/: broke a pinned test ("propose" → /prəˈpoʊz/).
      // -pose is a closed set of Latin/French bound verb roots (propose,
      // oppose, suppose, expose, dispose, compose, transpose) whose
      // prefix identity swings unpredictably between full-vowel and
      // reduced, so it is excluded outright rather than trying to save
      // "impose" specifically.
      if (/^(?:(?:log|graph|nom|soph|mat)ic|phony)$/.test(b) || /^pos(?:e|ition(?:al)?)$/.test(b) ||
          b === "meter" && /(?:[^aeiouy]{2}o|[^aeiouy]a)$/.test(a) && !this.customDict[b]) continue;
      const score = Math.min(a.length, b.length);
      if (score > bestScore) {
        bestScore = score;
        headReading = headPron;
        tail = b;
      }
    }
    if (tail === undefined || headReading === undefined) return undefined;
    const tailPron = this.customDict[tail] || COMPOUND_TAILS[tail] || COMPOUND_HEADS[tail];
    // A tail attested ONLY tail-primary (see COMPOUND_TAILS_REVERSED) keeps
    // its own primary; the head's demotes instead. Everything else keeps
    // the ordinary head-primary/tail-secondary convention.
    return (
      COMPOUND_TAILS_REVERSED[tail] !== undefined
        ? headReading.replace(/ˈ/g, "ˌ") + (this.customDict[tail] || COMPOUND_TAILS_REVERSED[tail])
        : headReading + tailPron.replace(/ˈ/g, "ˌ")
    ).replace(COMPOUND_GEMINATE_RE, "$2$1");
  }

  // Render noun stress/vowels, then retain the shared -ation rhotic coalescence.
  private recoverConAtion(noun: string): string | undefined {
    if (!/^con[^aeiouy].+ation$/.test(noun)) return undefined;
    const b = noun.slice(0, -5), src = this.wellKnown(b, undefined, true);
    return !this.wellKnown(b + "ate", undefined, true) && src && /^k[əɪ]n/.test(src) && syllabify(b).length === 2
      ? suffixPrimary(this.renderRuleForm(noun).replace(/ˈ|ʃən$/g, "")) + "ʃən" : undefined;
  }

  // Share strong prefixed -age recovery across agents and privatives after eviction.
  private strongAgeRoot(word: string): string | undefined {
    if (!word.endsWith("age") || !EN_PREFIXES.has(syllabify(word)[0]) || syllabify(word).length < 3) return undefined;
    const p = this.renderRuleForm(word);
    return FINAL_STRESS_RE.test(p) ? p : undefined;
  }

  private tryDecomposition(word: string): string[] | undefined {
    if (word.length < 8) return undefined; // Only try decomposition for reasonably long words

    // DP decomposition uses dictionary parts and the supported rule-derived tail.
    const dp: (string[] | undefined)[] = Array(word.length + 1).fill(undefined);
    dp[0] = [];

    for (let i = 1; i <= word.length; i++) {
      for (let j = 0; j < i; j++) {
        // A whole-target lexical hit is not a decomposition and must not hide a split.
        if (j === 0 && i === word.length) continue;
        // Prioritize longer chunks
        const chunk = word.substring(j, i);
        // A vouched two-part head can compose a rule-exact free finite
        // root after eviction; bound de-/in-finite remain whole.
        // Borrowed roots require a real prefix head; arbitrary pos+tpique
        // and other invented final-ique fragments must stay out. Greek -ic
        // adjectives retain the whole-word stress frame (semiphysical);
        // pretonic full-o roots retain their supplied root frame (semiromantic).
        // Psych- retains silent p and PRICE after neutral prefixes;
        // vouched neuro- is also a medical combining head.
        // Vouched vowel-final heads retain weak scientific roots after eviction;
        // the longer -tein class still requires its supplied long-o head.
        // Prefer fewer chunks; allocate only the selected decomposition.
        if (dp[j] !== undefined && chunk.length >= 3 && (this.customDict[chunk] || this.dictionary[chunk] ||
          i === word.length && dp[j]!.length === 1 && (FREE_I_NITE_ROOT.test(chunk) ||
            /o$/.test(dp[j]![0]) && /ic$/.test(chunk) && syllabify(chunk).length >= 3 ||
            (isWeakThematicYRoot(chunk) || URR_KIT_ROOT.test(chunk)) && ENDS_IN_VOWEL_RE.test(this.dictionary[dp[j]![0]] || "") || VOWEL_TEIN_ROOT.test(chunk) && /o$/.test(dp[j]![0]) && /oʊ$/.test(this.dictionary[dp[j]![0]] || "") || BORROWED_ROOT_FRAME.test(chunk) && (!/ic(?:al)?$/.test(chunk) || /usic$/.test(chunk) || FULL_INITIAL_O_FRAME.test(chunk) || /^psychic(?:al)?$/.test(chunk)) && (EN_PREFIXES.has(dp[j]![0]) ||
            /o$/.test(dp[j]![0]) && syllabify(chunk)[0] === "ab" || /^(?:semi|multi|meta)$/.test(dp[j]![0]) || dp[j]![0] === "all" && /us(?:ic|eum)$/.test(chunk) || dp[j]![0] === "neuro" && /^psych(?:ic(?:al)?|iatr(?:y|ist)s?)?$/.test(chunk)))) && (!dp[i] || dp[j]!.length + 1 < dp[i]!.length))
          dp[i] = [...dp[j]!, chunk];
      }
    }
    const result = dp[word.length];
    // Known whole words admit only a prefix plus an owned two-syllable root, not longer bound fragments.
    if (this.dictionary[word] && result && !(result.length === 2 && EN_PREFIXES.has(result[0]) && syllabify(result[1]).length === 2 && BORROWED_ROOT_FRAME.test(result[1]))) return undefined;
    // Bound -ary and coalescing -st+ian need the complete root frame; the complete
    // word owns suffix stress. Neutral -ionary resolves in morphology.
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
    if (result && ((result[result.length - 1] === "ary" || result[result.length - 1] === "ian" && /st$/.test(result[result.length - 2] ?? "")) || result.length >= 3 && result.some((p) => p.length < 4)))
      return undefined;
    return result;
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (!pronunciation.match(/^[A-Z0-9]+$/)) {
      pronunciation = arpabetToIpa(pronunciation);
    }
    this.customDict[word.toLowerCase().replace(/[‘’]/g, "'")] = pronunciation;
  }
}

export default EnglishG2P;
