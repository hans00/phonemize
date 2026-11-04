// The lookup table is the curated exceptions list (mined by
// scripts/mine-exceptions.ts, ~26K entries / 700 KB). It covers
// foreign-origin words and native English irregulars whose rule
// predictions deviate from the canonical dict. The legacy
// data/en/dict.json (2.7 MB) is no longer shipped or loaded — the rule
// pipeline plus this table reproduces the dict's lenient accuracy at
// ~26% of the size. See docs/g2p-redesign.md P5.
import * as lookupTable from "../../data/en/exceptions.json";
import * as customTable from "../../data/en/rule-path-exceptions.json";
import * as initialismTable from "../../data/en/initialisms.json";
import * as homographs from "../../data/en/homographs.json";
import * as compoundParts from "../../data/en/compound-parts.json";
import { arpabetToIpa, resolveJson, LICIT_ONSETS } from "../utils";
import { LanguageProcessor, type PredictionContext } from "../g2p";
import { expandText } from "./expand";
import { simplePOSTagger, isFunctionWord, reduceToWeakForm, inferVerbForm, hasFiniteObjectFrame, precedingContextIndex, BE_FORMS, MODAL_VERBS } from "./pos-tagger";
import { transformAmericanToRP } from "./gb";
import { predictPrincipled } from "./principled";
import { applyPhonotactics } from "./phonotactics";
import { applyPostLexical, applyPostStress, hiatusMarkOffset } from "./postlex";
import { tryStressNeutralSuffix, softenBaseFinal, preSuffixReduce, preservePretonicSchwa, preserveAryDiphthongs } from "./morph-parser";
import { analyzeEnglishSentence, tagEnglishWord } from "./syntax";
import { buildCompoundForest, collectWordAnalysis, type WordStructure, type WordAnalysis, type CompoundCandidate, type CompoundForest } from "./analysis";
export type { WordAnalysis, CompoundCandidate, CompoundForest, CompoundNode } from "./analysis";
export { analyzeEnglishSentence } from "./syntax";
import { ENGLISH_DIPHTHONGS, ENGLISH_CENTERING_DIPHTHONGS, ENGLISH_IPA_VOWELS, ENGLISH_IPA_CONSONANTS } from "./ipa-plausibility";
export { inspectIpa, type IpaReport, type IpaStatus, type IpaIssue, type IpaSyllable } from "./ipa-plausibility";

import {
  assignStress, LATIN_E_ROOT, isWeakLatinIte, FREE_I_NITE_ROOT, SILENT_HON_ROOT, SHORT_ANCY_ROOT, BORROWED_ROOT_FRAME, BOUND_ECT_ROOT, BOUND_IO_VERB_ROOT, BOUND_NOMINAL_ROOT, WEAK_RHOTIC_E_ROOT, PRICE_HIATUS_ARY_ROOT,
  MERGED_WEAK_DY_ROOT, VOWEL_TEIN_ROOT, isWeakThematicYRoot, URR_KIT_ROOT, FULL_INITIAL_O_FRAME, OPEN_I_WEAK_ROOT, secondaryStressIndices, syllabify, weakCheckedRate, syllableToIPA, EN_PREFIXES, PREFIX_WEAK_LE_ROOT, COMPLETE_C_LE_ROOT, PRO_CHECKED_ROOT, isHiatusSlot, KEEP_UNMERGED_AFTER_PREFIX,
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
  structure?: WordStructure;
}

// Move the primary onto a word-final /eɪ/ (the -ation suffix syllable):
// every existing primary demotes to secondary, marks inside the consonant
// run before /eɪ/ are dropped, and the new mark goes before the longest
// licit onset of that run.
const VOWEL_CHAR = /[aeiouæɑɔəɛɪʊʌɝ]/, splitOnset = (run: string[]): number => { let split = run.length; while (split > 0 && LICIT_ONSETS.has(run.slice(split - 1).join("").replace(/ɫ/g, "l"))) split--; return split; };
function suffixPrimary(ipa: string): string {
  // A nasal-coda prefix before weak -form- centralizes FORCE when the
  // following -ation takes primary. Vowel-final prefixes retain FORCE.
  const s = ipa.replace(/ˈ/g, "ˌ").replace(/([nm]s?)(?:ˌ)?fɔɹ(?=meɪ$)/, "$1fɝ")
    .replace(/(?<=[td])ɪ(?=[ˈˌ]?[kɡ][ˈˌ]?eɪ$)|(?<=[ptk]j)u(?=[ˈˌ]?[td][ˈˌ]?eɪ$)/, "ə");
  let k = s.length - 2, v = k;
  while (k > 0 && !VOWEL_CHAR.test(s[k - 1])) k--;
  const run = s.slice(k, v).replace(/[ˈˌ]/g, "").match(/tʃ|dʒ|./g) ?? []; let split = splitOnset(run);
  // A bare /ɹ/ right after an unstressed /ɪ/ or /ə/ is a coalescing
  // rhotic (generate → generation), not a real onset consonant to pull
  // into the new syllable: maximizing it onto the suffix (…ɛnˈɹeɪʃən)
  // strands the mark BETWEEN /ɪ/ and /ɹ/, which permanently blocks the
  // later unstressed-/ɪɹ/→/ɝ/ phonotactic pass from ever rejoining them
  // (dict: …ɛnɝˈeɪʃən). Leaving the pair adjacent is the same convention
  // applyPostStress's own onset-maximization already keeps for the
  // whole-word path (postlex's ONSET_MAX_1_RE exception).
  if (split === 0 && k > 0 && run[0] === "ɹ" && /[ɪə]/.test(s[k - 1])) split = 1; if (k === 0) split = 0;
  return s.slice(0, k) + run.slice(0, split).join("") + "ˈ" + run.slice(split).join("") + s.slice(v);
}

// Shared lookup tables, re-keyed once onto null-prototype objects so
// that Object.prototype names ("constructor", "toString", "valueOf",
// …) can't leak through `dict[word]` when the word itself isn't an
// entry. Module-level so the copy happens once per process, keeping
// instance construction allocation-free.
const copyLookup = <T extends object>(table: T): T => Object.assign(Object.create(null), table);
// Spelled letter names are valid whole-token readings, not lexical stems
// for morphology or compound decomposition (GA must not become gas).
const DICTIONARY: EnDict = copyLookup(resolveJson<EnDict>(lookupTable)), CURATED_CUSTOM: EnDict = copyLookup(resolveJson<EnDict>(customTable)), INITIALISMS: EnDict = copyLookup(resolveJson<EnDict>(initialismTable));
function spellInitialism(word: string): string | undefined {
  if (!/^([A-Z]\.?){2,8}$/.test(word)) return undefined; const pronunciations = word.replace(/\./g, "").split("").map((letter) => INITIALISMS[letter.toLowerCase()]);
  if (!pronunciations.every(Boolean)) return undefined; const stress = word.includes(".") ? "" : "ˈ";
  return pronunciations.map((ipa) => stress + ipa.replace(/[ˈˌ]/g, "")).join("");
}

function spellSyllableInitialism(word: string, lowerWord: string, pos?: string): string | undefined {
  if (lowerWord.length === 1 && INITIALISMS[lowerWord] && (lowerWord !== "a" || pos === undefined || !isFunctionWord(lowerWord, pos))) return INITIALISMS[lowerWord];
  // Three-letter forms with an unlicensed onset are spelled (fbi/cpu),
  // using letter names. Native digraphs and borrowed onsets stay spoken.
  const onset = word === lowerWord && lowerWord.length === 3
    ? /^[bcdfghjklmnpqrstvwxz]{2,}(?=[aeiouy])/.exec(lowerWord)?.[0] : undefined, unpronounceable = onset && !onset.includes("h") &&
    !/^(?:ng|sz|zs|vr|sr|[fsvz]{2}|([a-z])\1|[gkmp]n|wr|[pt]s|pt)$/.test(onset) &&
    !LICIT_ONSETS.has(onset.replace(/c/g, "k").replace(/g/g, "ɡ").replace(/r/g, "ɹ"));
  // A short vowel-letter head plus an impossible obstruent coda
  // cannot be an English citation syllable (ATM, IBM, USB, ISBN).
  // Keep native nasal-stop codas, silent digraphs and syllabic -sm spoken;
  // heterorganic nasal + voiced-stop codas cannot form these onsetless roots.
    const coda = word === lowerWord && /^[aeiou][bcdfghjklmnpqrstvwxz]{2,3}$/.test(lowerWord)
    ? lowerWord.slice(1).replace(/ck|c/g, "k").replace(/([a-z])\1/g, "$1") : undefined, unlicensedCoda = coda && /^(?!([a-z])\1$)(?:m[dg]|nb|[bdgkpt]m|[bcdfgkptsvz]{2}[lmn]|[bdgkpt][bgkp]|s[bg])$/.test(coda);
  // Hummed forms, sh, and the ordinal -nth are phonological spellings, not letter sequences.
  return spellInitialism(word) ?? (/^[bcdfghjklmnpqrstvwxz]{2,}$/.test(lowerWord) && !/^(?:hm+|shh?|m{2,}|n+th)$/.test(lowerWord) && !/gm/.test(lowerWord) || unpronounceable || unlicensedCoda
    ? spellInitialism(word.toUpperCase())?.replace(/ˈ(?=.*ˈ)/g, "ˌ") : undefined);
}

const usesSpokenSrOnset = (lowerWord: string): boolean =>
  // `sr` is deliberately admitted as a spoken loan onset by the short-token
  // classifier below; keep that same rule when the dictionary also supplies
  // an initialism reading (SRI).
  /^[bcdfghjklmnpqrstvwxz]{2,}(?=[aeiouy])/.exec(lowerWord)?.[0] === "sr";

function rulePathInitialism(lowerWord: string, pos?: string): string | undefined {
  const ipa = INITIALISMS[lowerWord];
  return ipa && !(lowerWord === "a" && pos !== undefined && isFunctionWord(lowerWord, pos)) &&
    !usesSpokenSrOnset(lowerWord) ? ipa : undefined;
}

const HOMOGRAPHS: HomographDict = copyLookup(resolveJson<HomographDict>(homographs));
// Statistically-verified compound parts (scripts/mine-compound-parts.ts):
// heads/tails that earn ≥10% join-accuracy against the lexicon when
// paired with any verified partner. Both sides must match for a split.
const COMPOUND_PARTS = resolveJson<{
  heads: EnDict;
  tails: EnDict;
  tailsReversed: EnDict;
}>(compoundParts), COMPOUND_HEADS: EnDict = copyLookup(COMPOUND_PARTS.heads), COMPOUND_TAILS: EnDict = copyLookup(COMPOUND_PARTS.tails);
// The bound combining form intro- has a weak /ə/ allomorph before a stressed root.
const BOUND_WEAK_O_HEADS = new Set(["intro"]);
// Tails verified ONLY via the tail keeping its own primary (never once via
// the ordinary head-primary convention) — see the matching comment in
// mine-compound-parts.ts. tryCompoundSplit joins these the other way
// around, so a word like overdone gets the dict's actual ˌoʊvɝˈdʌn instead
// of a segmentally-right but stress-backwards ˈoʊvɝˌdʌn.
const COMPOUND_TAILS_REVERSED: EnDict = copyLookup(COMPOUND_PARTS.tailsReversed), VERB_PARTICLE = /^(?:down|up|out|off|over|under|back)$/;
// Boundary degemination for compound joins (book+kayak style overlaps).
const COMPOUND_GEMINATE_RE = /([pbtdkɡfvszʃʒθðmnŋɫɹ])(ˌ?)\1/g;

// --- Linguistics-based Constants ---

// --- EnglishG2P Class ---

// Pre-compiled regexes used in the hot predict() path. Defining them at
// module scope ensures the engine compiles each pattern exactly once
// and reuses the cached form across every call.
const BCP47_REGION_RE = /^en(?:-[a-z]{4})?-([a-z]{2}|\d{3})(?:$|-)/, PLAIN_L_RE = /l/g, STRESS_PRIMARY = /ˈ/g;
// Word-final doubled consonant whose single-consonant form is at least
// four letters (Seann → sean, Jonn → jon). See geminateVariant for why
// shorter stems are excluded.
// Clitic spellings and the segment each appends to the stem; -'s takes
// the plural allomorph instead of a fixed segment.
const CLITICS: Record<string, string> = {
  m: "m", ll: "l", ve: "v", d: "d", re: "ɝ", s: "", "": "",
};

// Shared spelling evidence for geminate stems and restored silent-e roots.
const FINAL_GEMINATE_RE = /^[a-z]{3,}([bdfgklmnprstz])\1$/, SHORT_SILENT_E_ROOT = /^[^aeiouy][aiou][bcdfghjklmnpqrstvz]e$/;

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
const isUsableConsonantStem = (ipa: string, base: string): boolean => !ENDS_IN_VOWEL_RE.test(ipa) || (ipa.endsWith("ɝ") && syllabify(base).length < 4);

// A final -s analysis can hide a near-hiatus vowel in an -eries form
// (series: /ɛɹi/ from the fabricated serie stem, /ɪɹi/ from direct rules).
// Keep the morphological output unless both full phonotactic routes
// preserve stress and differ only at /ɛɹi/ → /ɪɹi/; unrelated differences
// in forms such as cranberries and festivities must retain their own paths.
function sameStressAndOnlyNearHiatusVowelDiffers(morph: string, direct: string): boolean {
  return Array.from(morph.matchAll(/ɛ(?=[ˈˌ]*ɹ[ˈˌ]*i)/g)).some(({ index }) =>
    morph.slice(0, index) + "ɪ" + morph.slice(index + 1) === direct);
}

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
const vouchedIndRoot = (word: string): string | undefined => /ind$/.test(word) && COMPOUND_HEADS[word] && COMPOUND_HEADS[word] === COMPOUND_TAILS[word] ? COMPOUND_HEADS[word] : undefined;

// Short -ost agents keep complete roots; longer bound Latin stems
// do not acquire an unrelated free post/host/most reading.
const NO_DROPPED_E = /(?:ocus|ear|sist|ia(?:l|s|nt|r)|uel|oe[mt]|[ckl]ost|^[hmp]ost|x)$/;

// Recover this open-vowel stem frame across inflection and prefix eviction.
const hasOpenStopRStem = (word: string, suffix = ""): boolean => word.endsWith(suffix) && /[aeiouy][bcdgkpt]r$/.test(word.slice(0, word.length - suffix.length));
// Open Cy/ary and weak eavy roots retain their boundary after eviction.
const OPEN_Y_ROOT = /eavy$|^[^aeiouy]*(?:o[nsz]y|i(?:[ncz]y|[mn]ary|brary|vory))$/;
// These complete weak sonorant rimes retain their bare-root frame.
// Prefix + strong -ile still restores a supplied silent-e stem.
const hasWeakSonorantRime = (b: string): boolean => /eaven$/.test(b) || /^e[^aeiouyrx][ei][ln]$/.test(b) || /[cgsv]il$/.test(b) && syllabify(b).length > 1 && !EN_PREFIXES.has(syllabify(b)[0]), MAGIC_E_CANDIDATE = (base: string): boolean => !/([bcdfgklmnprst])\1$/.test(base) && !/(?:gn|ook|ood)$/.test(base) && !NO_DROPPED_E.test(base) && !hasWeakSonorantRime(base) &&
  (/[aeiouy][bcdfghjklmnpqrstvwxz]$/.test(base) || /[cgsvl]$/.test(base) || /(?:st|th)$/.test(base) || syllabify(base).length === 2);

// Preserve the ASCII-only lowercase gate without a duplicate character scanner.
// Irish O' surnames keep their prefix when input casing is inconsistent.
// O'clock is a separate contraction, not an O' + name compound.
const isIrishOPrefix = (word: string): boolean => /^o'[a-z]{2,}$/i.test(word) && !/^o'clock$/i.test(word);

// Exactly one contiguous vowel nucleus, including diphthongs.
// Morphology retains its measured vowel-run heuristic; public stress counts phonemic nuclei.
const IPA_NUCLEUS_RE = [[], ENGLISH_CENTERING_DIPHTHONGS].map(extra => new RegExp([...ENGLISH_DIPHTHONGS, ...extra].join("|") + "|[" + ENGLISH_IPA_CONSONANTS + "]̩|[" + ENGLISH_IPA_VOWELS + "]", "g")), isMonosyllable = (ipa: string, dialect: EnglishDialect): boolean => (ipa.match(IPA_NUCLEUS_RE[dialect === "en-GB" ? 1 : 0])?.length ?? 0) === 1;
// Keep the British closed-coda yod while inflecting a non-custom stem;
// callers propagate dialect through recursive morphology before composition.
const hasSingleVowelRun = (ipa: string): boolean => /^[^aeiouɑæɛɪɔʊʌəɝ]*[aeiouɑæɛɪɔʊʌəɝ]+[^aeiouɑæɛɪɔʊʌəɝ]*$/.test(ipa), dropStemYod = (ipa: string, dialect?: EnglishDialect): string => hasSingleVowelRun(ipa) ? ipa.replace(dialect === "en-GB" ? /([tdnlszɹθðʃʒ])j(?=u$|ʊɹ$)/ : /([tdnlszɹθðʃʒ])j(?=u(?:[bdgkmnpstfɫlʃʒθðvz])?$|ʊɹ$)/, "$1") : ipa.replace(/(ˈs?[tdnlszɹθðʃʒ])j(?=u|ʊɹ)/, "$1");

// Regular English -s allomorph based on the final phoneme of `ipa`:
//   /ɪz/ after a sibilant (s z ʃ ʒ tʃ dʒ),
//   /s/  after a voiceless obstruent (p t k f θ),
//   /z/  otherwise (voiced consonant or vowel).
// Used for possessive/plural -'s. `ipa` may carry a trailing dark /ɫ/.
// An affricate's last IPA character is already ʃ/ʒ.
function sAllomorph(ipa: string): string { return /[szʃʒ]/.test(ipa.slice(-1)) ? "ɪz" : /[ptkfθ]/.test(ipa.slice(-1)) ? "s" : "z"; }
const edPast = (p: string): string =>
  /[td]$/.test(p) ? p + "ɪd" : /[pksʃfθ]$/.test(p) ? p + "t" : p + "d";

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
  readonly analyzeSentence?: LanguageProcessor["analyzeSentence"];

  constructor(
    options: {
      disableDict?: boolean;
      dialect?: EnglishDialect;
      enablePrincipled?: boolean;
      analysis?: "shadow";
    } = {},
  ) {
    this.disableDict = options.disableDict || false; this.dialect = options.dialect ?? "en-US";
    this.enablePrincipled = options.enablePrincipled || false;
    if (options.analysis === "shadow") this.analyzeSentence = words => analyzeEnglishSentence(words);
    // Share the module-level null-prototype tables across instances.
    // Both are read-only at runtime (writes go to this.customDict).
    this.dictionary = DICTIONARY; this.homographs = HOMOGRAPHS;
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
    return tagEnglishWord(word, context, this.homographs,
      (entry, pos) => this.matchPos(entry, pos), candidate => this.reVerbReading(candidate));
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
        if (!tag.startsWith("en-")) return null; const region = tag === "en-us" ? "us" : tag === "en-gb" ? "gb" : BCP47_REGION_RE.exec(tag)?.[1];
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
    let clipped: string | undefined; const aposAt = lowerWord.lastIndexOf("'");
    if (aposAt > 0 && aposAt >= lowerWord.length - 3) {
      const tail = lowerWord.slice(aposAt + 1), stem = lowerWord.slice(0, aposAt);
      // Written -in' restores an attested unstressed -ing base before nasal fronting.
      const full = !tail && /in$/.test(stem) && this.wellKnown(stem + "g", pos); if (full && /[aeiouɑɔæɛɪʊʌəɝ][^ˈˌ]*ɪŋ$/.test(full)) clipped = full.replace(/ŋ$/, "n");
      // A bare trailing apostrophe is the plural possessive (accountants',
      // dogs'): the stem already carries its -s and nothing is added.
      const clitic = CLITICS[tail];
      if (clitic !== undefined && !clipped) {
        // An apostrophe licenses letter names without changing bare a/i or lexical stems.
        const letter = tail && aposAt === 1 && this.customDict[stem] === undefined && INITIALISMS[stem]; let stemIpa = letter ? applyPhonotactics(letter, stem) : this.predict(word.slice(0, aposAt), language, pos);
        if (letter && stemIpa) {
          if (dialect === "en-GB") stemIpa = transformAmericanToRP(stem, stemIpa); if (pos !== undefined && isMonosyllable(stemIpa, dialect)) stemIpa = stemIpa.replace(STRESS_PRIMARY, "");
        }
        if (stemIpa) return stemIpa + (tail === "s" ? sAllomorph(stemIpa) : clitic);
      }
    }

    const readings = this.homographs[lowerWord];
    // A shared base/noun form before a nominal head needs no past-tense reading.
        const form = !this.disableDict && context && readings?.some(entry => entry.forms) &&
      context.words[context.index]?.toLowerCase().replace(/[‘’]/g, "'") === lowerWord
      ? inferVerbForm(context, readings) ?? (pos === "!V" && /^(?:[a-z]{2,}s|[a-z]+(?:tion|sion|ment|ness|ity|th))$/.test(context.words[context.index + 1]?.toLowerCase() ?? "") && !isFunctionWord(context.words[context.index + 1] ?? "") && readings.some(entry => entry.forms?.includes("base") && entry.pos.split(",").includes("N")) ? "base" : undefined) : undefined, contextual = form && (form !== "past" || pos?.startsWith("V"))
      ? readings?.find(entry => entry.forms?.includes(form))?.pronunciation : undefined,
      posReading = pos && (pos === "N" || pos === "ADJ")
        ? readings?.find(entry => !entry.forms && !entry.pos.startsWith("!") && this.matchPos(entry, pos))?.pronunciation
        : undefined;

    // Principled pipeline (opt-in). See class field doc + P5 status.
    if (this.enablePrincipled && !this.disableDict && !contextual) {
      const principled = predictPrincipled(lowerWord, (w: string) => {
        return this.customDict[w] ?? this.dictionary[w];
      });
      if (principled) return principled.ipa;
    }

    // Hand-reviewed src-data/en/custom.dict entries explicitly marked
    // disabling the broad generated dictionary.
    const curatedOverride = this.disableDict && !readings ? CURATED_CUSTOM[lowerWord] : undefined;
    const registeredInitialism = this.disableDict ? rulePathInitialism(lowerWord, pos) : undefined, base =
      clipped ?? contextual ??
      posReading ??
      curatedOverride ??
      this.geminateVariant(lowerWord, pos) ??
      registeredInitialism ??
      this.predictInternal(word, pos, this.disableDict, context, dialect);
    if (!base) return base;

    // Universal phonotactic post-processing (en-phonotactics.ts).
    // Each rule self-guards with a cheap pre-check; the dispatcher
    // costs roughly O(rule-count) substring scans when nothing fires.
    const lexicalVelarED = !this.disableDict && /(?:k|ɡ)əd$/.test(this.customDict[lowerWord] ?? this.dictionary[lowerWord] ?? ""), postBase = applyPhonotactics(base, lowerWord, pos, lexicalVelarED, !this.disableDict && this.dictionary[lowerWord] !== undefined);
    // A consonant plus word-final <i> is FLEECE (ski, Mississippi). Keep
    // this at the completed-word boundary: applying it while rendering a
    // derived stem also changes medial <i> in spiritual/experiment; adjacent
    // vowel spellings such as <ui> are a different grapheme environment.
    const finalI = /[^aeiouy]i$/.test(lowerWord) && postBase.endsWith("ɪ") &&
      !/(?:aɪ|aʊ|eɪ|oʊ|ɔɪ)$/.test(postBase);
    // Preserve FLEECE in the regular plural of a monosyllabic initial
    // consonant-cluster+i root (ski → skis). The whole-word shape keeps
    // this away from lexical -is names and Greek -sis nouns.
    const finalIPlural = !this.dictionary[lowerWord] && /^[^aeiouyh]{2}is$/.test(lowerWord) &&
      postBase.endsWith("ɪs");
    const finalIBase = finalI
      ? `${postBase.slice(0, -1)}i`
      : finalIPlural
        ? `${postBase.slice(0, -2)}iz`
        : postBase;
    let out = dialect === "en-GB" ? transformAmericanToRP(word, finalIBase) : finalIBase;
    // In discl- words, /s/ joins the stressed /skl/ onset. Apply after
    // phonotactics so its syllable-stress normalizer cannot split that cluster.
    if (/^discl/.test(lowerWord)) out = out.replace(/^dɪsˈkl/, "dɪˈskl");
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
      if (isMonosyllable(out, dialect)) return out.replace(STRESS_PRIMARY, "");
    }
    return out;
  }

  public analyzeWord(word: string): WordAnalysis {
    if (!word || word.length > 64) throw new RangeError("Word analysis requires 1–64 UTF-16 units");
    const lower = word.toLowerCase(), candidates: CompoundCandidate[] = [], trace = this.trace(word);
    if (!/^[a-z]{2,64}$/i.test(word)) return collectWordAnalysis(word, { ipa: trace.ipa, route: trace.path }, undefined, []);
    let shortCircuited = false; this.tryCompoundSplit(lower, 0, false, node => { shortCircuited = node.kind === "opaque"; }, candidate => { candidates.push(candidate); });
    return collectWordAnalysis(word, { ipa: trace.ipa, route: trace.path }, this.renderRuleForm(lower), candidates, shortCircuited);
  }

  public analyzeWordForest(word: string, maxStates = 256): CompoundForest { return buildCompoundForest(word, part => this.analyzeWord(part), maxStates); }

  public trace(word: string, language?: string, pos?: string): TraceResult {
      const lowerWord = word.toLowerCase(), ipa = this.predict(word, language, pos) ?? lowerWord, tag = language?.toLowerCase(), region = tag && tag !== "en" ? (tag === "en-us" ? "us" : tag === "en-gb" ? "gb" : BCP47_REGION_RE.exec(tag)?.[1]) : undefined, dialect = region === "gb" ? "en-GB" : region === "us" ? "en-US" : this.dialect;
    // Every non-rule path reports the whole word as one step, named by
    // the lookup that produced it.
    const via = (path: TraceResult["path"], rule: string): TraceResult => ({
      word, ipa, path,
      steps: [{ grapheme: word, phoneme: ipa, rule }],
      structure: { kind: "opaque", route: rule },
    });

    if (!this.disableDict) {
      if (pos && Array.isArray(this.homographs[lowerWord]) &&
          this.homographs[lowerWord].some((entry: HomographEntry) => this.matchPos(entry, pos)))
        return via("dictionary", "homograph");
      const lexical = this.customDict[lowerWord] ? "custom-dict" : this.dictionary[lowerWord] || INITIALISMS[lowerWord] ? "dict" : undefined;
      if (lexical) return via("dictionary", lexical);
      if (this.geminateVariant(lowerWord, pos)) return via("dictionary", `geminate-stem:${lowerWord.slice(0, -1)}`);
    }
    if (this.disableDict && rulePathInitialism(lowerWord, pos)) return via("rules", "initialism:registered"); if (isIrishOPrefix(word.replace(/[‘’]/g, "'"))) return via("rules", "irish-O-prefix");
    if (this.tryMorphologicalAnalysis(lowerWord, false, false, true, undefined, dialect)) return via("morphology", "morphology");

    // Trace the same compound priority as predictInternal, rather than
    // attributing a supplied compound IPA to rules that never rendered it.
    let structure: WordStructure = { kind: "opaque", route: "compound-dispatch-unsplit" };
    if (this.tryCompoundSplit(lowerWord, 0, false, node => { structure = node; }, undefined, dialect)) return { ...via("compound", "compound"), structure }; const decomp = this.tryDecomposition(lowerWord);
    if (decomp && decomp.length > 1) {
      const prons = decomp.map((p) => this.wellKnown(p));
      if (prons.every((p) => p)) {
        let offset = 0; const parts = decomp.map((part, i) => { const node = { spelling: part, start: offset, end: offset + part.length, componentIpa: prons[i]! }; offset += part.length; return node; });
        return { ...via("decomposition", "decomposition"), structure: { kind: "legacy-decomposition", parts }, steps: parts.map(part => ({ grapheme: part.spelling, phoneme: part.componentIpa, rule: "decomposition" })) };
      }
    }

    if (spellSyllableInitialism(word, lowerWord)) return via("rules", "initialism:letter-spelling");

    const traceSteps: TraceStep[] = [], { syllables } = this.ruleSyllables(lowerWord, undefined, traceSteps, pos, dialect); return { word, ipa, path: "rules", syllables, steps: traceSteps, structure: { kind: "opaque", route: "rules" } };
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
    if (this.disableDict || !FINAL_GEMINATE_RE.test(lowerWord) || this.wellKnown(lowerWord, pos, true) || INITIALISMS[lowerWord]) return undefined; return this.wellKnown(lowerWord.slice(0, -1), undefined, true);
  }

  private predictInternal(word: string, pos?: string, disableDict?: boolean, context?: PredictionContext, dialect?: EnglishDialect): string {
    // Avoid re-allocating lowerWord when the caller already lowercased
    // (true for predict() which is the dominant entry point). Most words
    // arrive lowercase already, so toLowerCase would just create a copy.
    const lowerWord = /[A-Z]/.test(word) ? word.toLowerCase() : word;

    // Recursive renders retain caller-owned roots before morphology and hyphens.
    const custom = this.customDict[lowerWord]; if (custom !== undefined) return custom;

    // Priority 1: Handle hyphenated compounds. Cheap indexOf gate before
    // allocating the split-array.
    const dashAt = lowerWord.indexOf("-");
    if (dashAt > 0 && dashAt < lowerWord.length - 1 &&
        lowerWord.indexOf("-", dashAt + 1) < 0) {
      const part1 = this.predictInternal(lowerWord.slice(0, dashAt), pos, disableDict, undefined, dialect), part2 = this.predictInternal(lowerWord.slice(dashAt + 1), pos, disableDict, undefined, dialect);
      // Reflexive self- is stress-neutral; its root keeps its own lexical stress.
      if (lowerWord.slice(0, dashAt) === "self") return part1.replace(STRESS_PRIMARY, "ˌ") + part2;
      // A weak syllable at the start of the second part keeps its own vowel
      // quality; moving the compound stress onto that syllable turns schwa
      // into STRUT (get-together, air-conditioning). Keep the head primary
      // and demote the second part's lexical stress instead.
      if (part2.indexOf("ˈ") > 0 && !EN_PREFIXES.has(lowerWord.slice(0, dashAt)))
        return part1 + part2.replace(STRESS_PRIMARY, "ˌ");
      // Both nonempty parts retain a spelling or a stress-marked rule rendering.
      return part1.replace(STRESS_PRIMARY, "") + "ˈ" + part2.replace(STRESS_PRIMARY, "");
    }

    // Priority 2: Direct lookups (Dictionary, Homographs) - check known words first
    // Irish O' compounds can have a pronunciation that differs from the
    // independent surname root. Prefer the attested compound entry when it
    // has the compound /aɪən/ ending, or compose that ending from the root.
    if (isIrishOPrefix(word)) {
      const compound = !disableDict ? this.wellKnown(lowerWord, pos, true, dialect) : undefined, plural = lowerWord.endsWith("s") && !lowerWord.endsWith("'s"), base = plural ? lowerWord.slice(0, -1) : lowerWord, surname = this.wellKnown(base.slice(2), undefined, true, dialect); if (compound?.endsWith("aɪɪn")) return compound.replace(/aɪɪn$/, "aɪən");
      if (surname?.endsWith("aɪɪn")) {
        const joined = surname.replace(/aɪɪn$/, "aɪən"); return `oʊ${joined}${plural ? sAllomorph(joined) : ""}`;
      }
      // Compose a listed O'-surname from its independently listed root when
      // the whole form agrees (or has no lexical compound entry). Some names
      // have compound-specific vowels, so a disagreeing whole-word reading
      // retains priority after the special -aɪən transformation above.
      if (surname) {
        const composed = `oʊ${surname}${plural ? sAllomorph(surname) : ""}`;
        if (!compound || composed === compound) return composed;
      }
    }
    if (lowerWord.startsWith("intro")) {
      let rightStressedIntroCompound = false;
      const plural = lowerWord.endsWith("s") && !lowerWord.endsWith("'s"), compoundWord = plural ? lowerWord.slice(0, -1) : lowerWord;
      const compound = this.tryCompoundSplit(compoundWord, 0, false, structure => {
        rightStressedIntroCompound = structure.kind === "legacy-compound" && structure.left.spelling === "intro" && structure.stressOwner === "right";
      });
      if (rightStressedIntroCompound && compound) return plural ? compound + sAllomorph(compound) : compound;
    }
    if (!disableDict) {
      const knownPronunciation = this.wellKnown(lowerWord, pos, true, dialect); // Skip morphology here to avoid re-running
      if (knownPronunciation) return knownPronunciation; if (INITIALISMS[lowerWord]) return spellInitialism(word) ?? INITIALISMS[lowerWord];
    }
    // Three-slot be- forms can take stress on the lexical silent-e root
    // (be·have). Require an independently vouched root pronunciation;
    // compound-part membership alone also admits surname fragments.
    const beSlots = lowerWord.startsWith("be") ? syllabify(lowerWord) : [], beRoot = beSlots.length === 3 && beSlots[0] === "be" && /^[^aeiouy]*[^aeiouyl]e$/.test(beSlots[2]) ? lowerWord.slice(2) : undefined; if (beRoot && !beRoot.endsWith("s") && this.wellKnown(beRoot, pos, true, dialect)) return this.renderRuleForm(lowerWord, 1, undefined, dialect);

    if (isIrishOPrefix(word)) {
      const surname = this.predictInternal(word.slice(2), pos, disableDict, undefined, dialect);
      // In Irish O' surnames, the independent Brien-like /aɪɪn/ reading
      // surfaces as /aɪən/ in the compound (O'Brien: Cambridge US).
      return `oʊ${surname.replace(/aɪɪn$/, "aɪən")}`;
    }

    // nano- is an independently verified combining head. Let an uninflected
    // nano+root compound reach the existing component composer before broad
    // morphology can absorb the whole spelling (nanotechnology). Inflected
    // forms stay on the morphology route, which already preserves their tail
    // stress (nanotechnologies).
    if (lowerWord.length > 4 && lowerWord.startsWith("nano") && !lowerWord.endsWith("s") && COMPOUND_HEADS.nano) {
      let nanoHead = false;
      const compound = this.tryCompoundSplit(lowerWord, 0, false, structure => {
        nanoHead = structure.kind === "legacy-compound" && structure.left.spelling === "nano";
      }, undefined, dialect);
      if (nanoHead && compound) return compound;
    }

    // Priority 3: Morphological analysis - only for unknown words
    const morphPron = this.tryMorphologicalAnalysis(lowerWord,
      word === lowerWord && (lowerWord.endsWith("ing") || pos?.startsWith("V") === true),
      pos === "V" && context !== undefined && hasFiniteObjectFrame(context), pos === undefined || pos === "N", pos, dialect);
    // Morphology also needs suffix secondary stress and the -ation shift.
    if (morphPron) return applyPostStress(morphPron, lowerWord, pos);

    // Priority 4: Language-specific G2P - removed as per new architecture

    // Priority 5a: Two-part compound split against the mined parts
    // tables. Both halves must be independently verified parts; the
    // join follows the lexicon's compound convention (head keeps ˈ,
    // tail's primary demotes to ˌ, boundary geminates collapse).
    const closedGIn = this.tryClosedGInCompound(lowerWord); if (closedGIn) return closedGIn;

    const compound = this.tryCompoundSplit(lowerWord, 0, false, undefined, undefined, dialect); if (compound) return compound;

    // Priority 5: Attempt to decompose the word into known dictionary parts
    const decomposition = this.tryDecomposition(lowerWord);
    if (decomposition && decomposition.length > 1) {
      // A prefixed plural can be decomposed incorrectly when its inflected
      // head is a dictionary entry (sub + standards). Recover the singular
      // prefixed stem first, then add regular -s; otherwise the decomposition
      // treats the plural head as a separate compound and assigns it stress.
      if (decomposition.length === 2 &&
          (EN_PREFIXES.has(decomposition[0]) || decomposition[0] === "sub") &&
          this.wellKnown(decomposition[0], undefined, true, dialect) &&
          decomposition[1].endsWith("s") &&
          this.predictInternal(decomposition[1].slice(0, -1), undefined, true, undefined, dialect)) {
        const stem = this.predictInternal(lowerWord.slice(0, -1), pos, true, undefined, dialect);
        if (stem && sAllomorph(stem) === "z") return stem + sAllomorph(stem);
      }
            const thematicHead = decomposition.length === 2 && /o$/.test(decomposition[0]) && (/(?:ic(?:al(?:ly)?|it(?:y|ies))?|ian)s?$/.test(decomposition[1]) || BORROWED_ROOT_FRAME.test(decomposition[1]) && syllabify(decomposition[1])[0] === "ab"), pronunciations = decomposition.map((part, index) => this.wellKnown(part, undefined, undefined, dialect) ||
        (index === 1 && thematicHead || BORROWED_ROOT_FRAME.test(part)
          ? this.predictInternal(part, undefined, true, undefined, dialect)
          : FREE_I_NITE_ROOT.test(part) ? this.renderRuleForm(part, undefined, undefined, dialect) : undefined));
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
          pronunciations[0] = this.renderRuleForm(decomposition[0], undefined, undefined, dialect);
        return pronunciations
          .map((p, idx) => idx === headIdx ? p : p.replace(/ˈ/g, "ˌ"))
          .join("");
      }
    }

    // Priority 6: Handle acronyms with or without periods, e.g., "TTS" or "M.L."
    // Dental, open-KIT and consonantal -ye roots keep word readings after eviction; registered initialisms take priority.
    const rendered = (!(/^(?:th[aiu]|[bcdfghjklmnpqrstvwxz]+ye$|acqu(?!ie)[aeiouy].)/.test(lowerWord) || /[ei]sce$/.test(lowerWord) || OPEN_I_WEAK_ROOT.test(lowerWord) || /th$/.test(lowerWord) && isFunctionWord(lowerWord)) && spellSyllableInitialism(word, lowerWord, pos)) || this.renderRuleForm(lowerWord, undefined, pos, dialect);
    // Finite monosyllabic -use verbs voice s; ambiguous to-nominals retain their route.
    return pos?.startsWith("V") && /^[bcdfghjklmnpqrstvwxz]*use$/.test(lowerWord) && hasSingleVowelRun(rendered) &&
      (!context || context.words[precedingContextIndex(context)]?.toLowerCase() !== "to") ? rendered.replace(/us$/, "uz") : rendered;
  }

  private matchPos(entry: HomographEntry, pos: string): boolean {
    return entry.pos.replace(/^!/, "").split(",").includes(pos) !== entry.pos.startsWith("!");
  }

  // Share base-verb evidence with the tagger; vouched inflections must compose from their own base.
  private reVerbReading(lowerWord: string): string | undefined {
        const root = /^re[a-z]{3,}$/.test(lowerWord) ? lowerWord.slice(2) : "", base = root.replace(/(?:es|s|ed|ing)$/, ""), entries = root === base || !this.homographs[base] && !this.homographs[base + "e"] ? this.homographs[root] : undefined, verb = root && this.customDict[root] === undefined && !/^[aeiou](?:([^aeiou])\1|[cspgt]h|ck)/.test(root) ? entries?.find(entry => entry.pos.split(",").includes("V") && (!entry.forms || entry.forms.includes("base"))) : undefined;
    return verb && !hasSingleVowelRun(verb.pronunciation) && entries?.some(entry => !entry.pos.split(",").includes("V") && entry.pronunciation !== verb.pronunciation) ? "ˌɹi" + verb.pronunciation.replace(/^ˌ/, "") : undefined;
  }

  private preferDirectPluralNearHiatus(plural: string, word: string, pos?: string): string {
        const direct = this.renderRuleForm(word), lexicalVelarED = !this.disableDict && /(?:k|ɡ)əd$/.test(this.customDict[word] ?? this.dictionary[word] ?? ""), finalForm = (ipa: string) => applyPhonotactics(applyPostStress(ipa, word, pos), word, pos, lexicalVelarED, !this.disableDict && this.dictionary[word] !== undefined);
    return sameStressAndOnlyNearHiatusVowelDiffers(finalForm(plural), finalForm(direct)) ? direct : plural;
  }

  private wellKnown(word: string, pos?: string, skipMorphology = false, dialect?: EnglishDialect): string | undefined {
    const homograph = pos && Array.isArray(this.homographs[word])
      ? this.homographs[word].find(entry => this.matchPos(entry, pos)) : undefined;
    // POS readings retain priority; owned rule roots do not re-enter morphology.
    return homograph ? homograph.pronunciation : this.customDict[word] || (this.disableDict ? CURATED_CUSTOM[word] : undefined) || this.dictionary[word] ||
      vouchedIndRoot(word) || (/^[bcdfghjklmnpqrstvwxz]+ye$/.test(word) ? this.renderRuleForm(word, undefined, undefined, dialect) : undefined) || this.recoverAryRoot(word) ||
      (skipMorphology ? undefined : this.tryMorphologicalAnalysis(word, undefined, undefined, undefined, undefined, dialect));
  }

  private recoverAryRoot(word: string, rendered?: string): string | undefined {
    if (!/^[a-z]{2,}arian$/.test(word)) return undefined;
    const base = word.slice(0, -3) + "y", original = rendered ?? this.renderRuleForm(word, assignStress(syllabify(word), word)), restored = preserveAryDiphthongs(original, this.wellKnown(base, undefined, true) || this.renderRuleForm(base));
    return restored !== original ? restored : undefined;
  }

  private silentEAgentRoot(stem: string, lexicalOnly = false): string | undefined {
    if (!/^[^aeiouy]+[aiouy][bcdfghjklmnpqrstvz]$/.test(stem) || this.customDict[stem]) return undefined; const restored = this.wellKnown(stem + "e", undefined, true) || (!lexicalOnly ? COMPOUND_HEADS[stem + "e"] || COMPOUND_TAILS[stem + "e"] : undefined);
    if (restored && isUsableConsonantStem(restored, stem)) return restored; return !lexicalOnly && /^[^aeiouy]+u[bcdfghjklmnpqrstvz]$/.test(stem) && !this.wellKnown(stem, undefined, true) ? this.renderRuleForm(stem + "e") : undefined;
  }

  private tryMorphologicalAnalysis(word: string, preferVerbStem = false, finiteObject = false, nominal = true, pos?: string, dialect?: EnglishDialect): string | undefined {
    // A stripped base is read from the lexicon (never re-decomposed, or
    // "chas" would morphologise to cha+s), and for most suffixes falls
    // back to its whole-word prediction.
        const lowerWord = word.toLowerCase(), lex = (b: string): string | undefined => this.customDict[b] || dropStemYod(this.wellKnown(b, undefined, true, dialect) ?? "", dialect) || undefined, prefixedSilentV = (stem: string): string | undefined => {
      if (!stem.endsWith("v")) return undefined;
      let selected: { prefix: string; pronunciation: string } | undefined;
      for (const prefix of Array.from(EN_PREFIXES)) {
        if (!stem.startsWith(prefix) || stem.length - prefix.length < 3) continue;
        const root = stem.slice(prefix.length) + "e", pronunciation = lex(root) || COMPOUND_TAILS[root];
        if (pronunciation) { if (selected) return undefined; selected = { prefix, pronunciation }; }
      }
      if (!selected) return undefined;
      let head = this.renderRuleForm(selected.prefix, 0, undefined, dialect).replace(/[ˈˌ]/g, "");
      const initial = selected.pronunciation.replace(/^[ˈˌ]/, "")[0];
      if (initial && head.endsWith(initial)) head = head.slice(0, -1);
      return head + selected.pronunciation;
    };
    // Transparent prefix + cover + nominal -y keeps the verb root intact
    // (discover/recover → discovery/recovery). Whole-word syllabification
    // can instead split dis·co·very and assign FACE to the medial <o>.
    // Compose only when an accepted prefix directly attaches to the
    // independently rendered cover root; unrelated -ery words stay whole.
    if (lowerWord.endsWith("covery")) {
      const stem = lowerWord.slice(0, -1), prefix = Array.from(EN_PREFIXES).find(candidate => stem === candidate + "cover");
      if (prefix) {
        const root = this.predictInternal(stem, pos, true, undefined, dialect);
        if (root.endsWith("ɝ")) return root + "i";
      }
    }
    // Retain an adjective vowel only when both renderings share its consonants.
    const ity = /^([a-z]{3,})(iv|ic)ity$/.exec(lowerWord), base = ity && (ity[1] + ity[2] + (ity[2] === "iv" ? "e" : "")), source = base && (lex(base) || this.renderRuleForm(base, undefined, undefined, dialect));
    if (ity && source && source.endsWith(ity[2] === "iv" ? "ɪv" : "ɪk")) {
      const sourceRoot = source.slice(0, -2), root = sourceRoot.replace(/[ˈˌ]/g, ""), rendered = this.renderRuleForm(lowerWord, undefined, pos, dialect), tail = (ity[2] === "iv" ? /ɪv[əɪ]ti$/ : /ɪs[əɪ]ti$/).exec(rendered);
      if (tail) {
        // -ivity can preserve a weak nucleus from its vouched -ive base
        // (sensitive → sensitivity). The rendered -ivity path assigns the
        // new primary stress; copy only an aligned pretonic schwa, and
        // leave unrelated vowel patterns untouched.
        if (ity[2] === "iv") {
          const schwaRestored = preservePretonicSchwa(rendered, source + "əti");
          if (schwaRestored !== rendered) return schwaRestored;
        }
        const head = rendered.slice(0, -tail[0].length), clean = head.replace(/[ˈˌ]/g, ""), consonants = (s: string) => s.replace(/[aeiouæɑɔəɛɪʊʌɝ]/g, ""), vowels = root.match(/[aeiouæɑɔəɛɪʊʌɝ]+/g) ?? [], targetVowels = clean.match(/[aeiouæɑɔəɛɪʊʌɝ]+/g) ?? [];
        if (consonants(root) === consonants(clean) && vowels.length === targetVowels.length && vowels.every(v => v.length === 1) && targetVowels.every(v => v.length === 1)) {
          // Prefer an agreeing -it analysis before treating -ic as a stem.
          if (ity[2] === "ic" && vowels.length === 1 && source.startsWith("ˈ") && targetVowels[0] === "ə" && this.renderRuleForm(lowerWord.slice(0, -1), undefined, pos, dialect) + "i" !== rendered) {
            const run = clean.slice(clean.lastIndexOf("ə") + 1).match(/tʃ|dʒ|./g) ?? []; let split = splitOnset(run);
            // Before this suffix, s + stop can keep s as the root coda.
            if (split === 0 && run[0] === "s" && /^[ptk]$/.test(run[1] ?? "")) split = 1;
            if (split > 0 && split < run.length) return clean.slice(0, clean.lastIndexOf("ə")) + vowels[0] + run.slice(0, split).join("") + "ˈ" + run.slice(split).join("") + tail[0];
          }
          if (ity[2] === "iv") {
            let i = 0, previous = 0;
            const stressed = Array.from(sourceRoot.matchAll(/[aeiouæɑɔəɛɪʊʌɝ]+/g), match => { const onset = sourceRoot.slice(previous, match.index); previous = match.index + match[0].length; return onset.includes("ˈ"); }), restored = head.replace(/[aeiouæɑɔəɛɪʊʌɝ]+/g, v => { const stemVowel = vowels[i]; return stressed[i++] && v !== "ə" && stemVowel !== "ə" ? stemVowel : v; }) + tail[0];
            if (restored !== rendered) return restored;
          }
        }
      }
    }
    // Quantity nouns in a transparent -cketful compound retain stressed
    // FOOT, while adjectival -ful remains weak (/fəl/, as in hopeful).
    // The supplied -cket stem plus the nominal compound suffix license this
    // class without turning every spelling ending in -ful into /fʊl/.
    const cketFul = /^(.+cket)ful(s?)$/.exec(lowerWord);
    if (cketFul) {
      const head = COMPOUND_TAILS[cketFul[1]] || COMPOUND_HEADS[cketFul[1]] || lex(cketFul[1]);
      if (head) {
        const noun = head + "ˌfʊɫ";
        return cketFul[2] ? noun + sAllomorph(noun) : noun;
      }
    }
    // A final doubled z is still one sibilant phoneme in the singular;
    // compose the plural with the regular /ɪz/ allomorph instead of
    // syllabifying the artificial `-zze` stem (quiz → quizzes, buzz →
    // buzzes). Keep the root rule-derived so this covers the spelling
    // class without a per-word pronunciation entry.
    if (/zzes$/.test(lowerWord)) {
      const root = this.predictInternal(lowerWord.slice(0, -2), undefined, true, undefined, dialect); if (root.endsWith("z")) return root + sAllomorph(root);
    }
    // The productive -ident → -idential adjective family keeps the base's
    // vowels and moves its lexical stress to -ential (president,
    // resident, confident). Reuse the independently predicted base rather
    // than re-syllabifying the longer spelling, which weakens its root.
    const idential = /^(.+ident)ial$/.exec(lowerWord), identRoot = idential && (this.predictInternal(idential[1], undefined, true, undefined, dialect) || lex(idential[1])), identTail = identRoot?.match(/^(.*?)([ˈˌ]?d[əɛ]nt)$/); if (identTail) return identTail[1].replace(/ˈ/g, "ˌ") + "ˈdɛnʃəl";
    // A written y-final verb stem ending in <rry> changes y→i before -age:
    // carry→carriage, marry→marriage. Reuse the attested/rule-rendered stem
    // vowel so spelling the new suffix does not reset the root (carriage
    // retains CARRY's /æ/, while marriage retains MARRY's /ɛ/). Other
    // -riage words such as triage do not have an <rry> base and stay whole.
    const rryAgeRoot = /riage$/.test(lowerWord) ? lowerWord.slice(0, -4) + "y" : "", rryAgePron = rryAgeRoot.endsWith("rry") ? this.wellKnown(rryAgeRoot, undefined, true, dialect) || this.renderRuleForm(rryAgeRoot, undefined, undefined, dialect) : ""; if (rryAgePron.endsWith("ɹi") && !rryAgePron.includes("ˌ")) return rryAgePron.slice(0, -1) + "ɪdʒ";
    // Trochaic weak-a bases retain their root before -ese; longer feet need separate reduction.
    const ese = /^([a-z]{3,})ese$/.exec(lowerWord), eseRoot = ese && lex(ese[1] + "a"); if (eseRoot?.startsWith("ˈ") && eseRoot.endsWith("ə") && hasSingleVowelRun(eseRoot.slice(1, -1))) return suffixPrimary(eseRoot.slice(0, -1) + "iz");
    // Single-nucleus tails retain proto- head stress; regular plurals keep their singular route.
    const proto = !/[^s]s$/.test(lowerWord) && /^proto([^aeiouy]*[aeiouy][^aeiouy]+e?)$/.exec(lowerWord), protoTail = proto && (lex(proto[1]) || this.predictInternal(proto[1], undefined, true, undefined, dialect)); if (protoTail && hasSingleVowelRun(protoTail)) return (this.customDict["proto"] || COMPOUND_HEADS["proto"]) + protoTail.replace(/ˈ/g, "ˌ");
    // Keep ng's independent base guard; PRICE-ild must agree with its counterpart.
        const grade = /^(.*(?:ng|ild))(er|est)$/.exec(lowerWord), ngGrade = grade && /ng$/.test(grade[1]), gradeBase = grade && (ngGrade ? this.dictionary[grade[1]] || COMPOUND_HEADS[grade[1]] : this.dictionary[grade[1]] || COMPOUND_HEADS[grade[1]] || COMPOUND_TAILS[grade[1]] || this.renderRuleForm(grade[1], undefined, undefined, dialect)), alternate = grade && (ngGrade ? /ŋ$/.test(gradeBase || "") : /aɪ[ɫl]d$/.test(gradeBase || "")) && lex(grade[1] + (grade[2] === "er" ? "est" : "er")), gradeMatch = alternate && (ngGrade ? /ŋɡ?(?:[əɪ]st|ɝ)$/ : /aɪ[ɫl]d(?:[əɪ]st|ɝ)$/).test(alternate);
    if (grade && alternate && gradeMatch) return (this.customDict[grade[1]] || alternate.replace(/(?:[əɪ]st|ɝ)$/, "").replace(/ŋ$/, "ŋɡ")) + (grade[2] === "er" ? "ɝ" : "əst");
    // -ed/-ing derive from a verb even when the result is an adjective.
    // Prefer an annotated base to a V-labelled irregular past. !N also
    // includes adjectives/adverbs and cannot vouch for a verb stem.
    // Caller overrides retain ownership of an independently vouched root.
        const verbReading = (b: string): string | undefined => {
      const entry = this.homographs[b]?.find(entry => entry.forms?.includes("base")) || this.homographs[b]?.find(entry => entry.pos.split(",").includes("V")); return entry ? this.customDict[b] || entry.pronunciation : undefined;
    }, repeated = pos === undefined || pos.startsWith("V") ? this.reVerbReading(lowerWord) : undefined; if (repeated) return repeated;
    const verbStem = (b: string, skipMorphology = false): string | undefined => {
      const bound = BOUND_IO_VERB_ROOT.test(b) && !lex(b.slice(0, -1)), p = verbReading(b) || this.wellKnown(b, undefined, skipMorphology || bound, dialect) ||
        (!skipMorphology && b.length === 5 ? this.tryCompoundSplit(b) : undefined) ||
        ((bound || hasWeakSonorantRime(b) || skipMorphology && BORROWED_ROOT_FRAME.test(b)) ? this.predictInternal(b, bound ? "V" : undefined, true, undefined, dialect) : undefined);
      // The r in a weak written pro- onset precedes its vowel, rather than coloring it.
      return !this.customDict[b] && /^pro[^aeiouy]/.test(b) ? p?.replace(/^pɝ(?=ˈ)/, "pɹə") : p;
    };
    // In the <velop> verb family, the inflection attaches to the attested
    // bare root: develop + ed/ing, envelop + ed/ing. Treating the missing
    // final e as silent incorrectly invents *develope and turns /ə/ to /oʊ/.
    const velopInflection = /^(.*velop)(ed|ing)$/.exec(lowerWord);
    if (velopInflection) { const stem = verbStem(velopInflection[1], true) || this.predictInternal(velopInflection[1], undefined, true, undefined, dialect); if (stem) return velopInflection[2] === "ing" ? stem + "ɪŋ" : edPast(stem); }
    // Keep liquid-final roots before vowel suffixes; only NURSE roots use this
    // before -ed, preserving START schwa and syllabic-l past-tense readings.
    const liquidStem = (b: string, sfx: "ed" | "ing" | "er"): string | undefined =>
      ((sfx === "ed" ? /[eiuy]rl$/ : /[aeiouy]rl$/).test(b) || sfx === "ing" && /mpl$/.test(b))
        ? verbStem(b, true) || this.predictInternal(b, undefined, true, undefined, dialect) : undefined;
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
      const p = lex(b) || (/[cbt]re$/.test(b) && !BORROWED_ROOT_FRAME.test(b) ? undefined : this.predictInternal(b, undefined, false, undefined, dialect));
      // Letter names are whole tokens, never a lexical suffix base
      // (the supplied ITA spelling cannot explain Italy's -ly).
      return p?.replace(/[ˈˌ]/g, "") === spellInitialism(b.toUpperCase())?.replace(/[ˈˌ]/g, "") ? undefined : p;
    };
    // Before -able/-ance, restore a supplied -y stem or a short root
    // whose initial stress stays stable. Bound -ci- retains coalescence.
    // Retain supplied secondary stress when the verb has identical phones and primary stress.
        const deverbal = (b: string): string | undefined => { const v = verbReading(b), p = lex(b); return v && p && v.replace(/ˌ/g, "") === p.replace(/ˌ/g, "") ? p : v; }, restoreY = (stem: string): string | undefined => {
      if (!/[^aeiouy]i$/.test(stem) || /ci$/.test(stem)) return undefined;
        const base = stem.slice(0, -1) + "y", y = deverbal(base) || lex(base) || (MERGED_WEAK_DY_ROOT.test(base) ? stemPron(base) : undefined), slots = syllabify(stem);
      return y || (slots.length <= 2 && assignStress(slots, stem) === 0 ? this.predictInternal(stem.slice(0, -1) + "y", undefined, false, undefined, dialect) : undefined);
    };
    // Transparent privative prefixes keep the attested root's stress.
    // Vowel-initial adjectival/participial stems retain this boundary;
    // uni-/unus spellings stay on the whole-word path. Under- is a distinct
    // longer prefix. Short remnants are insufficient stem evidence.
    // Attested -uit + adjective -y is a single /ui/ nucleus (fruity).
    // Preserve the supplied/derived/compound root in prefixed adjectives;
    // Latin -uity nouns have no /ut/ base (annuit itself has /uɪt/).
      const uityBase = lowerWord.endsWith("uity") && lowerWord.slice(0, -1), uityRoot = uityBase && (lex(uityBase) || this.tryMorphologicalAnalysis(uityBase, undefined, undefined, undefined, undefined, dialect) || this.tryCompoundSplit(uityBase) || COMPOUND_TAILS[uityBase]);
    if (uityRoot && /ut$/.test(uityRoot)) return uityRoot + "i";
    // -able/-ible -> -ability/-ibility keeps the supplied or derived
    // adjective root, with primary on -bil-. Verified noun compounds
    // (in + stability) precede a fabricated adjective spelling.
    // A diphthong offglide is not the weak suffix vowel (able/stable).
    // Frozen batch: strict +11/-0, lenient +9/-4 across 105067 words.
    if (/(?:a|i)bility$/.test(lowerWord)) {
      const compound = this.tryCompoundSplit(lowerWord); if (compound) return compound;
      const b = lowerWord.slice(0, -5) + "le", p = lex(b) || this.predictInternal(b, undefined, false, undefined, dialect);
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
    // A fused modal + be keeps the complete auxiliary vowel at the boundary.
    if (lowerWord.endsWith("be") && MODAL_VERBS.includes(lowerWord.slice(0, -2))) { const head = stemPron(lowerWord.slice(0, -2)), tail = stemPron("be"); if (head && tail) return head + tail.replace(/[ˈˌ]/g, ""); }
    // Deictic compounds keep complete function-word rimes. The about
    // family keeps its lexical head stress and stays on its old path.
    // Normalize the head before joining so its NEAR vowel stays lax.
    const locative = /^(here|there|where)([a-z]+)$/.exec(lowerWord);
    // Fused deictic + ever shares its boundary e (where + ever).
    if (locative?.[2] === "ver") locative[2] = "ever";
    const locativeTail = locative && /^(?:after|before|over|under|upon|ever)$/.test(locative[2]);
    if (locative && (isFunctionWord(locative[2]) || locativeTail)) {
      const head = stemPron(locative[1]), tail = stemPron(locative[2]);
      if (head && tail && (hasSingleVowelRun(tail) || locativeTail)) {
        const base = applyPhonotactics(head, locative[1]);
        // Before an initially stressed longer tail, linking r is its
        // onset; the unstressed NEAR head must not coalesce into NURSE.
        if (!hasSingleVowelRun(tail) && /^ˈ[aeiouɑæɛɪɔʊʌəɝ]/.test(tail) && base.endsWith("ɹ"))
          return base.replace(/[ˈˌ]/g, "").slice(0, -1) + tail.replace(/^ˈ/, "ˈɹ");
        return base.replace(/ˈ/g, "ˌ") + tail;
      }
    }
    // The free adverb else combines with deictic place/time words.  Keep the
    // complete tails rather than re-syllabifying their written e as a weak
    // linking vowel (elsewhere, elsewhen).
    const elseDeictic = /^else(where|when)$/.exec(lowerWord);
    if (elseDeictic) {
      const head = this.renderRuleForm("else", undefined, undefined, dialect), tail = stemPron(elseDeictic[1]);
      if (head && tail) return head + tail.replace(/ˈ/g, "ˌ");
    }
    // Closed-class + (so) + ever carries primary on ever.
    // Reuse function-word classification: a free beli/relie/chee fragment
    // must not turn believer/reliever into an ever compound.
    // Frozen whole dict: strict +7/-0, lenient +4/-0.
    if (lowerWord.endsWith("ever") && lowerWord.length > 6) {
      const prefix = lowerWord.slice(0, -4), head = prefix.replace(/so$/, ""), p = isFunctionWord(head) && lex(head), tail = stemPron("ever"), middle = prefix === head ? "" : stemPron("so");
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
        if (lowerWord.endsWith("ative")) return p + "ɪv"; if (!FINAL_STRESS_RE.test(p)) return p.replace(/ˌ(?=[^ˈˌ]*eɪt$)/, "").replace(/eɪt$/, "əˌtɔɹi");
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
            const base = inter[2], repeated = inter[1].startsWith("re") && !/^[aeiou]/.test(base), headPrimary = /^(?:infra|supra)$/.test(inter[1]) && /ctur(?:e|al)$/.test(base) || /^micro$/.test(inter[1]), p = repeated
        ? /[aeiou]{2}[^aeiou]*e[ds]?$/.test(base) && syllabify(base)[0] === "re" &&
          (this.customDict[base] || (preferVerbStem ? verbReading(base) : undefined) || stemPron(base))
        : inter[1] === "co" ? !Array.from(EN_PREFIXES).some(prefix => prefix.length > 2 && lowerWord.startsWith(prefix)) &&
          (/^w/.test(base) ? syllabify(base).length >= 2 && COMPOUND_TAILS[base] && stemPron(base) :
            syllabify(base).length >= 3 && (/^or[dt]/.test(base) || lex(base) || COMPOUND_TAILS[base]) && stemPron(base))
        : (COMPOUND_TAILS[base] || inter[1] === "re" && (/^ab/.test(base) || /lect$/.test(base)) && BORROWED_ROOT_FRAME.test(base) || /[ct]ial$/.test(base) || /^(?:infra|supra|re)$/.test(inter[1]) && COMPOUND_HEADS[base]) &&
          (lex(base) || COMPOUND_TAILS[base] || /^(?:infra|supra|re)$/.test(inter[1]) && COMPOUND_HEADS[base] || this.tryMorphologicalAnalysis(base, undefined, undefined, undefined, undefined, dialect) || (inter[1] === "re" && (/^ab/.test(base) || /lect$/.test(base)) && BORROWED_ROOT_FRAME.test(base) ? this.predictInternal(base, undefined, true, undefined, dialect) : undefined)) ||
          inter[1] === "re" && COMPOUND_TAILS[base.replace(/(?:ion|ivate|ivity)$/, "")] && (lex(base) || this.predictInternal(base, undefined, true, undefined, dialect)), head = !repeated && p ? this.customDict[inter[1]] || this.renderRuleForm(inter[1], 0, undefined, dialect).replace(/oʊ$/, /^micro$/.test(inter[1]) ? "ə" : "oʊ") : "";
      if (p) return (repeated ? (p.includes("ˌ") ? "ɹi" : "ˌɹi").repeat(inter[1].length / 2) : head.replace(/ˈ/g, headPrimary ? "ˈ" : "ˌ")) +
        (repeated && !this.customDict[base] ? p.replace(/^ɹi(?=[^ˈ]*ˈ)/, "ɹɪ") : headPrimary ? p.replace(/ˈ/g, "ˌ") : p);
    }
    // A supplied or single-coda silent-e stem retains its vowel before
    // -ty (safety/ninety); checked -ety stems (rickety/velvety) stay whole.
    // Sibilant/rhotic bases retain a weak linking nucleus (nicety/surety).
    // The suffix -ty attaches after -cial (specialty, specialties); keep the
    // same /ɛʃəl/ base as special instead of re-syllabifying <cial> as /siəl/.
    const cialtyPlural = lowerWord.endsWith("cialties"), cialtyForm = cialtyPlural ? lowerWord.slice(0, -3) + "y" : lowerWord.endsWith("cialty") ? lowerWord : "", cialtyBase = cialtyForm && cialtyForm.slice(0, -2), cialtyRoot = cialtyBase && (lex(cialtyBase) || this.predictInternal(cialtyBase, undefined, true, undefined, dialect));
    if (cialtyRoot && /ʃəl$/.test(cialtyRoot)) return cialtyRoot + (cialtyPlural ? "tiz" : "ti");
    const etyBase = lowerWord.endsWith("ety") && lowerWord.slice(0, -2), etyRoot = etyBase && (lex(etyBase) || (/[aeiou][^aeiou]e$/.test(etyBase) ? this.predictInternal(etyBase, undefined, false, undefined, dialect) : undefined)); if (etyRoot && /[^ɑɔæɛɪiʊuʌəɝɚ]$/.test(etyRoot)) return etyRoot + (/[szʃʒɹ]$/.test(etyRoot) ? "əti" : "ti");
    const agentPrefix = /^(anti|non)([^aeiouy]+[aiouy][bcdfghjklmnpqrstvz])(ist|ism)$/.exec(lowerWord), agentRoot = agentPrefix && this.silentEAgentRoot(agentPrefix[2]);
    if (agentPrefix && agentRoot) return this.renderRuleForm(agentPrefix[1], 0, undefined, dialect).replace(/ˈ/g, "ˌ") + agentRoot + (agentPrefix[3] === "ist" ? "ɪst" : "ɪzəm");
    // Assimilated iC- attaches only to a vouched adjectival root, not an invented fragment.
    const hasAttestedPlyRoot = (word: string): boolean => { const base = word.endsWith("able") ? word.slice(0, -4) : "", yRoot = base.endsWith("plic") && !lex(base) && !lex(base + "ate") ? stemPron(base.slice(0, -3) + "ly") : undefined; return !!yRoot && /aɪ$/.test(yRoot); };
    const privative = /^(un(?!der)(?=[^aeiou]|(?=[aeiou])[a-z]*(?:able|ible|ed|ing|ual|age)$)|non|dis|in(?=[a-z]*able$)|i[rlm](?=[a-z]*(?:ary|ory|ous|ic|al|able|ible)$))([a-z]{4,})$/.exec(lowerWord), assimilated = privative && /^i[rlm]$/.test(privative[1]), iPrivative = privative?.[1] === "un" && privative[2].startsWith("i");
    // A witnessed outer base or iz/ify nominal stem precedes an ambiguous un- boundary.
        const outerRegular = iPrivative ? /^(.*?)(ed|ing|able|ible)$/.exec(lowerWord) : null, outerStem = outerRegular?.[1], ownedOuterRegular = outerStem && [outerStem, outerStem + "e", outerStem.endsWith("i") ? outerStem.slice(0, -1) + "y" : ""].some(b => b && (lex(b) || COMPOUND_HEADS[b] || COMPOUND_TAILS[b])), outerNominal = iPrivative ? /^(.*?)(iz(?:ed|ing|e?able)|if(?:ied|ying|iable))$/.exec(lowerWord) : null, outerNoun = outerNominal && outerNominal[1] + (outerNominal[2].startsWith("if") ? "ity" : ""), ownedOuterNominal = outerNoun && (lex(outerNoun) || COMPOUND_HEADS[outerNoun] || COMPOUND_TAILS[outerNoun]);
    if (privative && (!assimilated || privative[2][0] === privative[1][1] || privative[1] === "im" && privative[2][0] === "p") && !(iPrivative && (ownedOuterRegular || ownedOuterNominal || /(?:ual|age)$/.test(privative[2]) && !(lex(privative[2]) || COMPOUND_HEADS[privative[2]] || COMPOUND_TAILS[privative[2]]))) && (privative[1] !== "in" || SHORT_SILENT_E_ROOT.test(privative[2].slice(0, -4) + "e") || hasAttestedPlyRoot(privative[2]))) {
      // Checked monosyllabic tails witness a dis- root after eviction;
      // full-vowel noun compounds retain their existing stress route.
      const base = privative[2], tail = COMPOUND_TAILS[base], prefixCoda = assimilated ? privative[1][1].replace("r", "ɹ") : "";
      // Outer un- composes with inflected bound con- verbs through the same
      // stem rules as the bare verb, preserving both prefix and root stress.
      const prefixedConVerb = privative[1] === "un" && /^con(?:cern|fess|firm|strain|sult)(?:s|ed|ing)$/.test(base) ? this.predictInternal(base, undefined, true, undefined, dialect) : undefined;
      // dis- can attach to a verb (disclose); an explicit V reading
      // takes priority over a noun citation form of the same stem.
      const known = prefixedConVerb ||
        ((privative[1] === "un" || privative[1] === "in" || privative[1] === "non") && hasAttestedPlyRoot(base)
          ? this.predictInternal(base, undefined, true, undefined, dialect)
          : undefined) || (privative[1] === "dis" ? verbReading(base) : undefined) ||
        // Rule-exact Latinate -efy/-sfy roots can leave the table;
        // retain their own stress when a transparent prefix attaches.
        (syllabify(base).length >= 2 && /(?:ef|sf)y$/.test(base) ? stemPron(base) : undefined) ||
        lex(base) || /(?:[aeiouy][a-z]*[cvst]or|ments)$/.test(base) && this.tryMorphologicalAnalysis(base, undefined, undefined, undefined, undefined, dialect) ||
        this.tryCompoundSplit(base, 0, "owned") || this.recoverConAtion(base) || this.strongAgeRoot(base) || (privative[1] !== "dis" || tail && hasSingleVowelRun(tail) && (!/[aeiouɑɔɝ]/.test(tail) || SHORT_SILENT_E_ROOT.test(base)) ? tail : undefined) ||
        // Vowel-initial adjectives, co- + rhotic roots and vetted -ie
        // diminutives retain their analysis after leaving the table.
        // Nested re- roots survive eviction; their outer prefix supplies initial secondary stress.
        (privative[1] === "un" && /^(?:[aeiou]|coor[dt])/.test(base) || /^re[aeiou][^aeiou]{2}/.test(base) ||
          base.endsWith("ie") || /osure$/.test(base) ? this.tryMorphologicalAnalysis(base, undefined, undefined, undefined, undefined, dialect)?.replace(/^ˌ(?=ɹi)/, "") : undefined) ||
        // Checked-root adjectives retain their weak -rate after table eviction.
        (weakCheckedRate(syllabify(base)) ? this.renderRuleForm(base, undefined, undefined, dialect) : undefined) ||
        // Rule-exact finite/weak ite, iol tails, Cied, -own, -ture and checked NC-ed roots can leave
        // the table; preserve their prefix composition (untied/unfenced).
        (/^[^aeiouy]+iol(?:ent|ence)$|^[^aeiouy]ied$|own$|ture(?:d)?$|^[^aeiouy]+[ei]n[cs]ed$/.test(base) || hasOpenStopRStem(base, "ed") || isWeakLatinIte(base) || FREE_I_NITE_ROOT.test(base) || SILENT_HON_ROOT.test(base) || SHORT_ANCY_ROOT.test(base) || BORROWED_ROOT_FRAME.test(base) || BOUND_ECT_ROOT.test(base.replace(/(?:ed|ing)$/, "")) ? this.predictInternal(base, undefined, true, undefined, dialect) : undefined) ||
        // Productive longer adjectives and short silent-e in- roots survive eviction;
        // arbitrary un- fragments and short bound roots stay whole.
        ((privative[1] === "un" || privative[1] === "in" || privative[1] === "non") && hasAttestedPlyRoot(base)
          ? this.predictInternal(base, undefined, true, undefined, dialect)
          : undefined) ||
        ((privative[1] === "un" || privative[1] === "in" || privative[1] === "non") && /(?:ary|ory|ous|ic|al|able|ible)$/.test(base) && syllabify(base).length >= 3 ? stemPron(base) : undefined);
      // dis- and an s-initial root share one surface s, including
      // roots whose primary follows it (dissimilar/dissatisfy).
      if (known) {
        // A checked sibilant root can share the stressed s-onset; vouched free tails keep their boundary.
        if (privative[1] === "dis" && !this.customDict[base] && !COMPOUND_TAILS[base] && /^ˈ(?:[pk]|t(?!ʃ)).*ns[td]?$/.test(known)) return "dɪˈs" + known.slice(1);
        return (assimilated ? "ˌɪ" + (known.replace(/^[ˈˌ]/, "").replace(/ɫ/g, "l").startsWith(prefixCoda) ? "" : prefixCoda) : privative[1] === "in" ? "ˌɪn" : privative[1] === "un" ? "ʌn" : privative[1] === "dis" ? (/^[ˈˌ]?s/.test(known) ? "dɪ" : "dɪs") : "nɑn") + (assimilated && privative[1] === "ir" && !this.customDict[base] ? known.replace(/^[ˈˌ]?ɹ[iɪ](?=[^ˈ]*ˈ)/, "ɹə") : known);
      }
    }
    // A supplied -nges affricate also attests an assimilated ad- root:
    // a + doubled C + root (arrang -> rang -> ranges). The IPA guard
    // distinguishes /ndʒ/ from unrelated -es headwords; require a longer
    // agent base below, since dinger also has a separate dinge lexeme.
    // Frozen rebuilt-table probe: strict +4/-0, lenient +3/-0 over 105067.
    // In inflections, a weak prefixed -eng restores silent e; free -seng roots
    // and surname agent readings retain their independently supplied routes.
        const ngeStem = (b: string, inflected = false): boolean => /ng$/.test(b) && (inflected && /eng$/.test(b) && syllabify(b).length > 1 && EN_PREFIXES.has(syllabify(b)[0]) || /ndʒ[əɪ]z$/.test(
      lex(b + "es") || (/^a([bcdfghjklmnpqrstvwxz])\1/.test(b) ? lex(b.slice(2) + "es") : undefined) || "")), bareSStem = (base: string): string | undefined => !isFunctionWord(base) && /s$/.test(COMPOUND_HEADS[base] ?? "") ? this.customDict[base] || COMPOUND_HEADS[base] : undefined, sPlural = (p: string, base = lowerWord.slice(0, -1)): string => (this.customDict[base] ? p : dropStemYod(p, dialect)) + sAllomorph(p);
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
    }, doubledConsonantLex = (stem: string): string | undefined =>
      stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]
        ? lex(stem.slice(0, -1))
        : undefined;
    // Indefinite pronouns and adverbs are a determiner + a free noun
    // (anyone, everything, somebody, nowhere): read both parts from the
    // lexicon and put a secondary on the second.
    // Vouched heads also compose with grammatical wh roots after lexical eviction.
    const indefinite = /^(any|every|some|no)(one|body|thing|where|how|way|time|place)(s?)$/.exec(lowerWord) ||
      /^(an)(other)(s?)$/.exec(lowerWord) ||
      /^([a-z]{3,})(wh[a-z]+?)(s?)$/.exec(lowerWord);
    if (indefinite &&
        (/^(?:any|every|some|no)$/.test(indefinite[1]) || indefinite[1] === "an" && indefinite[2] === "other" || this.customDict[indefinite[1]] || COMPOUND_HEADS[indefinite[1]]) &&
        (!/^wh/.test(indefinite[2]) || isFunctionWord(indefinite[2]))) {
      const noThing = indefinite[1] === "no" && indefinite[2] === "thing", anOther = indefinite[1] === "an" && indefinite[2] === "other", head = noThing ? "ˈnʌ" : anOther ? "ə" : stemPron(indefinite[1]), tailPron = stemPron(indefinite[2]);
      if (head && tailPron) {
        const joined = noThing ? head + tailPron.replace(/[ˈˌ]/g, "") : anOther ? head + "ˈn" + tailPron.replace(/[ˈˌ]/g, "") : head + tailPron.replace(/ˈ/g, "ˌ").replace(/^(?!ˌ)/, "ˌ");
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
        const p = hasOpenStopRStem(base) ? lex(base + "e") || verbStem(base + "e") : verbStem(base + "e");
        // Silent-e restoration cannot add a syllable to a known
        // monosyllabic root (coat must not become the headword coate).
        const known = verbStem(base, true) || COMPOUND_TAILS[base];
        // A final y can be the offglide of a vouched -ye root; honor caller roots too.
        return p && (hasOpenStopRStem(base) || !(known && hasSingleVowelRun(known) && !hasSingleVowelRun(p))) &&
          (isUsableConsonantStem(p, base) || base.endsWith("y") && (this.customDict[base + "e"] !== undefined || this.dictionary[base + "e"] !== undefined && p.includes("ˈ") && /aɪ$/.test(p)) || hasOpenStopRStem(base)) ? p : undefined;
      };
      // Reviewed rule-path roots must be available to ordinary morphology
      // after suffix stripping; otherwise the spelling rules can reinterpret
      // a valid base (touch → touching, sugar → sugary) before its inflection
      // is composed. This table contains only explicitly marked, unambiguous
      // source dictionary entries, never inferred target-word mappings.
      const curatedRoot = /^[a-z]+$/.test(base) ? CURATED_CUSTOM[base] : undefined;
      if (curatedRoot) return join(curatedRoot);
      if (preferVerbStem) { const explicitVerb = verbReading(base); if (explicitVerb) return join(explicitVerb); }
      let compoundStop = false; const compoundStem = /d$/.test(base) && !lex(base) && !verbReading(base) && !this.customDict[base + "e"] ? this.tryCompoundSplit(base, 0, false, node => { compoundStop = node.kind === "legacy-compound" && node.right.spelling.length >= 3 && /ɛd$/.test(node.right.componentIpa); }) : undefined; if (compoundStop && compoundStem) return join(compoundStem);
      const consonantSilent = /[aeiou]$/.test(base) ? undefined : silentE();
      if (consonantSilent) return join(consonantSilent);
      // Assimilated ad- before a vouched multisyllabic -it verb root keeps
      // its root vowel through regular inflection.
      const adRootMatch = /^a([bcdfgklmnprst])\1(.+)$/.exec(base), adRoot = adRootMatch && adRootMatch[1] + adRootMatch[2], adRootPron = adRoot && /it$/.test(adRoot) && (this.dictionary[adRoot] || this.customDict[adRoot] || COMPOUND_HEADS[adRoot]) && this.predictInternal(adRoot, undefined, true, undefined, dialect); if (adRootPron && syllabify(adRoot!).length > 1) return join("ə" + adRootPron);
      const ad = /^a([bcdfgklmnprst])\1[lr]/.test(base) && !this.customDict[base] && !verbReading(base) ? COMPOUND_TAILS[base.slice(2)] : undefined; if (ad && hasSingleVowelRun(ad)) return join("ə" + ad);
      // skipMorphology: the base of an inflection must be a real lexicon
      // word, not a re-decomposition. Without this, wellKnown("chas")
      // morphologises to "cha"+s → /tʃɑz/, intercepting the magic-e
      // recovery and yielding chased→/tʃɑzd/ instead of /tʃeɪst/.
      // Restore a vowel-final -ue/-oe GOOSE root (argue/continue/shoe).
      // The actual GOOSE ending distinguishes it from silent gu/que.
      if (base.endsWith("u") || /^[^aeiouy]+o$/.test(base)) {
        const p=stemPron(base+"e");if(p && (this.customDict[base+"e"] || /(?<![ao])[uʊ]$/.test(p) || /[gq]u$/.test(base) && /[ɡk]$/.test(p))) return join(p);
      }
      // Recover bare -ower and complete compound codas after eviction; a single final consonant still needs silent-e restoration.
      // A marked lexical root wins over the apparent doubled spelling made
      // by -ing/-ed (put + ing → putting). Otherwise `putt` can be read as
      // an unrelated headword and overwrite the verified root vowel.
      const markedDoubledRoot = /([bcdfghjklmnpqrstvwxyz])\1$/.test(base)
        ? CURATED_CUSTOM[base.slice(0, -1)]
        : undefined;
      const basePron = weakElDouble(base) || markedDoubledRoot || verbStem(base, true) || (/ower$/.test(base) ? this.predictInternal(base, undefined, true, undefined, dialect) : undefined) || (/[^aeiouy]{2}$/.test(base) ? this.tryCompoundSplit(base, 0, "silent-head") : undefined);
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
          const p = stemPron(root), head = EN_PREFIXES.has(prefix) ? this.renderRuleForm(prefix, 0, undefined, dialect) : stemPron(prefix);
          if (p && head && hasSingleVowelRun(p) && ENDS_IN_VOWEL_RE.test(p))
            return join(EN_PREFIXES.has(prefix) ? head.replace(/ˈ/g, "ˌ") + p : head + p.replace(/ˈ/g, "ˌ"));
        }
      }
      // A single-nucleus vowel-final root keeps the inflection boundary
      // (see/hoe/go), rather than contracting o+ing into the oi digraph.
      // Longer apparent -do compounds need independent stem evidence.
      if (/[eo]$/.test(base) && (base.match(/[aeiouy]+/g)?.length ?? 0) === 1) return join(this.predictInternal(base, undefined, true, undefined, dialect));
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
      if (/^[bcdfghjklmnpqrstvwxz]y$/.test(base) || base.length > 2 && base.endsWith("y")) return join(this.predictInternal(base.length === 2 ? base.slice(0, -1) + "ie" : base, undefined, true, undefined, dialect));
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
      if (/[aeiou]/.test(base) && /(?:ll|ss|[cs]h|ck|ng|lk)$/.test(base)) return join(this.predictInternal(ngeStem(base, true) ? base + "e" : base, undefined, true, undefined, dialect));
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
      if (/[aeiou]/.test(base) && !/[aeiou]$/.test(base)) {
        // Verified compounds precede fabricated +e or vowel-less stop-r stems.
        const compound = this.tryCompoundSplit(lowerWord, sfxLen) || sfxLen === 2 && /[bcdfgkpt]r$/.test(base) && this.tryCompoundSplit(lowerWord);
        if (compound) return compound;
        // A vouched compound with a complete sonorant coda keeps its root
        // before rule-based silent-e fabrication (halfhearted).
        const rootCompound = /[lr][^aeiouy]$/.test(base) ? this.tryCompoundSplit(base) : undefined;
        if (rootCompound) return join(rootCompound);
        const ruleBaseE = MAGIC_E_CANDIDATE(base)
          ? hasOpenStopRStem(base) ? lex(base + "e") || this.predictInternal(base + "e", undefined, true, undefined, dialect) : this.predictInternal(base + "e", undefined, true, undefined, dialect)
          : undefined;
        if (ruleBaseE && (isUsableConsonantStem(ruleBaseE, base) || hasOpenStopRStem(base))) {
          // Lexical and caller-owned stems returned earlier keep their nuclei.
          const stem = sfxLen === 3 && /^[^aeiouy]+ir$/.test(base) ? ruleBaseE.replace(/aɪɝ$/, "aɪɹ") : ruleBaseE;
          return join(stem);
        }
        const ruleBase = this.predictInternal(base, undefined, true, undefined, dialect);
        // Keep an unvouched open-vowel + stop-r fragment inside its -Cred syllable.
        if (ruleBase && !(sfxLen === 2 && hasOpenStopRStem(base) && /[bdɡkpt]ɹ$/.test(ruleBase))) return join(ruleBase);
      }
      return undefined;
    };

    // Recursive stems still need this lookup; the trailing-apostrophe guard excludes -'s already.
    const barePossessive = /'$/.test(lowerWord) && lowerWord.length > 2 && this.wellKnown(lowerWord.replace(/'$/, ""), undefined, undefined, dialect);
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
        const bare = fBase.slice(0, -1), fStem = lex(fBase) || COMPOUND_TAILS[fBase] || /[lr]f$/.test(bare) && (lex(bare) || COMPOUND_TAILS[bare] || COMPOUND_HEADS[bare]);
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
      // Regular -s on the bound -duce verb family is verbal even when its
      // bare headword also has a noun stress (produce → produces).
      // Weak nominal -ment and strong verbal -ment share initial primary stress; stress-shift pairs stay separate.
      const weakMent = /ment$/.test(stem) && /^ˈ.*mənt$/.test(this.wellKnown(stem, "N", true, dialect) || "") && /^ˈ.*mɛnt$/.test(verbReading(stem) || ""), lineCompoundPlural = lowerWord.endsWith("lines") && stem.slice(0, -4).endsWith("e");
      // Apply the same weak pro- onset normalization used by verbStem to
      // regular -s forms when the base has no competing !V citation reading.
      const proVerbPlural = lowerWord.endsWith("s") && !pos?.startsWith("N") && /^pro[^aeiouy]/.test(stem) &&
        !this.homographs[stem]?.some(entry => entry.pos.startsWith("!")) ? verbStem(stem) : undefined;
      // Preserve verified compound codas; -end, weak -land, dental fricatives and
      // verb-particle stress still require their existing plural paths.
      // Re-run the bound -mobile composition on regular -s forms after table rebuilds.
      const basePron = /medicine$/.test(stem) ? this.predictInternal(stem, undefined, true, undefined, dialect) : ((/^(?:y|[^aeiouy])[^aeiouy]*[aeiuy]$/.test(stem) && !(/^[^aeiouyh]{2,}i$/.test(stem) && /i$/.test(lex(stem) || "")) ||
        /sse$/.test(stem) && ENDS_IN_VOWEL_RE.test(lex(stem) || ""))
        ? undefined
        : (/ings$/.test(lowerWord) && !this.customDict[stem] && !this.customDict[stem.slice(0, -3)] ? verbReading(stem.slice(0, -3)) : undefined)?.concat("ɪŋ") || (((preferVerbStem || stem.endsWith("duce")) && (finiteObject || this.homographs[stem]?.some(entry => entry.pos.split(",").includes("V")) || /[szv]$/.test(verbReading(stem) || "")) || this.homographs[stem]?.some(entry => entry.forms?.includes("past"))) ? verbReading(stem) : undefined) ||
        proVerbPlural || (preferVerbStem && BOUND_IO_VERB_ROOT.test(stem) ? verbStem(stem, true) : undefined) || (stem.endsWith("mobile") ? this.tryCompoundSplit(stem) : undefined) || (!(/se$/.test(stem) && !this.customDict[stem] && !COMPOUND_HEADS[stem] && !COMPOUND_TAILS[stem] && bareSStem(stem.slice(0, -1))) && (this.customDict[stem] || this.tryClosedGInCompound(stem) || this.wellKnown(stem, weakMent && (preferVerbStem || nominal) ? preferVerbStem ? "V" : "N" : undefined, undefined, dialect))) || this.tryCompoundSplit(stem, 0, true) || this.tryCompoundSplit(stem, 0, "silent-head") || (lineCompoundPlural ? this.tryCompoundSplit(stem) : /ead$|[aeiou][bcdfghjklmnpqrstvwxz]{2}$/.test(stem) && !/(?:th|sh|ch|ph|land|end)$/.test(stem) ? (() => { let particle = false; const compound = this.tryCompoundSplit(stem, 0, false, node => { particle = node.kind === "legacy-compound" && VERB_PARTICLE.test(node.left.spelling); }); return particle ? undefined : compound; })() : undefined) || (hasOpenStopRStem(stem, "ed") ? stemPron(stem) : undefined) ||
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
            /[aeiouy][aeiouyw]/.test(stem) && COMPOUND_HEADS[stem] && hasSingleVowelRun(COMPOUND_HEADS[stem]) ||
            // Final d+ea retains hiatus after rule-exact root eviction;
            // compose the voiced plural from that root (idea → ideas).
            // Silent -igh/-eigh roots retain their vowel coda before plural s.
          // Greek noun tails and palatal -imen need their singular boundary
          // after eviction too, including plurals absent from the dict.
          // -ture plurals must render the singular's bound /tʃɝ/ as one unit
          // (legislature → legislatures), not resyllabify it as -tures.
          // Weak -ine roots retain their own reduction when plural s
          // hides the final silent-e boundary (discipline → disciplines,
          // medicine → medicines).
            // Bound weak -ite keeps its final root boundary after eviction.
            // Greek sth+m vowel-final roots retain their voiced root before plural s.
            // Exclude u: classical -us is a singular ending, not a free u-stem plural.
            // A supplied consonant-final stem outranks restoring an extra silent e.
            // Bound -ean and neutral -like keep their final root boundary;
            // bean compounds and jean/mean keep their native single nucleus.
            /(?:r|gn|igh|ion|ient|tain|o[dv]el|ngine|trine|pline|dea|gram|[aeiouy][^aeiouy]*gm|logue|[cg]imen|[cgsv]il|urrence|[ae]nce|gramme|pse|sce|like|oic|sthm[aeio]|scle|ture|medicine)$/.test(stem) || /(?:[ou](?!bean$)[^aeiouy]ean|([^aeiouy])\1ean|anean)$/.test(stem) && !/cean$/.test(stem) || isBoundBol(stem) || LATIN_E_ROOT.test(stem) || isWeakLatinIte(stem) || SILENT_HON_ROOT.test(stem) || BORROWED_ROOT_FRAME.test(stem) || COMPLETE_C_LE_ROOT.test(stem) && !lex(stem.slice(0, -1)) ||
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
              ? this.predictInternal(stem, undefined, true, undefined, dialect)
              : undefined) || (BOUND_NOMINAL_ROOT.test(stem) || /st$/.test(stem) && syllabify(stem).length === 1 ? this.predictInternal(stem, undefined, true, undefined, dialect) : undefined));
      if (basePron) {
        // Match only final /ə/↔/ɪ/ differences; edit basePron to retain stress.
        const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l").replace(/ʌ/g, "ə"), ruleStem = /(?:(?:ical|ic)s|[ts]ions)$/.test(lowerWord) ? this.predictInternal(stem, undefined, true, undefined, dialect) : undefined, lexical = clean(basePron), regular = ruleStem && clean(ruleStem);
        let plural = sPlural(regular && lexical.endsWith("əkəl") && regular.endsWith("ɪkəl") && lexical.slice(0, -4) === regular.slice(0, -4) ? basePron.replace(/ə(?=kəɫ?$)/, "ɪ") : regular && lexical.endsWith("ək") && regular.endsWith("ɪk") && lexical.slice(0, -2) === regular.slice(0, -2) ? basePron.replace(/ək$/, "ɪk") : basePron);
        // Preserve the rest of the stem and its stress; caller-owned and transparent de- roots win.
        if (/[ts]ions$/.test(lowerWord) && !this.customDict[stem] && !(stem.startsWith("de") && lex(stem.slice(2))) && ruleStem) {
          const opening = /^[^aeiouɑæɛɪɔʊʌəɝˈˌ]+([əɪi])/, norm = (ipa: string) => ipa.replace(/ɫ/g, "l").replace(/ʌ/g, "ə"), left = norm(basePron), right = norm(ruleStem), a = opening.exec(left), b = opening.exec(right); if (a && b && a[1] !== b[1] && left.replace(opening, m => m.slice(0, -1) + "@") === right.replace(opening, m => m.slice(0, -1) + "@")) plural = sPlural(basePron.replace(opening, m => m.slice(0, -1) + b[1])); }
        if (lowerWord.endsWith("eries")) return this.preferDirectPluralNearHiatus(plural, lowerWord, pos);
        return plural;
      }
      // Rule-derived stems are absent from the exception table. Preserve
      // -tion/-sion palatalization and monosyllabic silent-e vowels when
      // adding -s (solutions/names/bikes), the same way a rule-exact
      // rule-exact -ate, -ative or -ial stem that has left the table needs the
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
        (/(?:ative|ate|ial|(?<!r)ic)s$/.test(lowerWord) && lowerWord.length > 5)
      ) {
        const p = this.predictInternal(stem, undefined, true, undefined, dialect);
        if (isUsableConsonantStem(p, stem))
          return /ics$/.test(lowerWord) && this.tryCompoundSplit(lowerWord) || sPlural(p);
      }
      // A final -s must not turn the stem's ow/o/ue ending into a closed
      // syllable (shows, yellows, photos). Preserve the stem vowel.
      // A two-letter spelling is not enough evidence for that plural
      // fallback (cos/eos/pos); frozen probe: strict +5/-0, lenient +9/-0.
      if (/(?:ow|o|ue)s$/.test(lowerWord) && stem.length >= 3) return sPlural(this.predictInternal(lowerWord.slice(0, -1), undefined, true, undefined, dialect));
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
        // A voiced bare -ns root wins only without an independently vouched -nse root.
                const bare = /ns$/.test(base) && !COMPOUND_TAILS[base + "e"] && !COMPOUND_HEADS[base + "e"] && !this.dictionary[base + "e"] && !this.customDict[base + "e"] ? this.predictInternal(base, undefined, true, undefined, dialect) : undefined, stem = bareSStem(base) || (bare?.endsWith("nz") ? bare : undefined) || this.predictInternal(base + "e", undefined, true, undefined, dialect);
        if (stem && !ENDS_IN_VOWEL_RE.test(stem)) return sPlural(stem, base);
      }
      const basePron = (base === "do" && pos?.startsWith("N") ? this.wellKnown("doe", pos, undefined, dialect) || this.renderRuleForm("doe", undefined, undefined, dialect) : undefined) || this.wellKnown(base, undefined, undefined, dialect);
      if (basePron) return sPlural(base.endsWith("do") && /u$/.test(basePron) ? basePron.replace(/u$/, "ʌ") : basePron, base);
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
      // A complete -sh root survives re-syllabification before plural -es.
      if ((/(?:us|is|ix)es$/.test(lowerWord) && !/ouses$/.test(lowerWord)) || /shes$/.test(lowerWord) ||
          (NO_DROPPED_E.test(base) && /s$/.test(base))) {
        const p = this.predictInternal(base, undefined, true, undefined, dialect);
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
      const stripped = lowerWord.slice(0, -sfx.length), base = stripped + "y";
      // A vowelless remainder is no stem (priest is not pr + -iest).
      // A genuine Cy root has a y nucleus even without a/e/i/o/u
      // (shied <- shy). A remainder already containing y (stymied)
      // instead belongs to an -ie stem; keep its prior lexical-only test.
      const basePron =
        sfx === "ier"
          ? this.wellKnown(base, undefined, undefined, dialect) || (OPEN_Y_ROOT.test(base) || MERGED_WEAK_DY_ROOT.test(base) ? stemPron(base) : undefined)
          : !/[aeiou]/.test(stripped) && !(/^(?:ied|ies)$/.test(sfx) && /^[bcdfghjklmnpqrstvwxz]+$/.test(stripped))
            ? this.wellKnown(base, undefined, undefined, dialect)
            : stemPron(base);
      if (basePron) {
                const ruleRoot = sfx === "ies" && /(?:ilities|tories|nsities)$/.test(lowerWord) ? this.predictInternal(base, undefined, true, undefined, dialect) : undefined, rulePhones = ruleRoot?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l"), lexicalPhones = basePron.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l"), lexicalChars = lexicalPhones.split(""), ruleChars = (rulePhones ?? "").split(""), differing = lexicalChars.flatMap((phone, i) => phone === ruleChars[i] ? [] : [i]);
        // Preserve rule-root weak vowels in -tories and -nsities plurals.
                const weakSuffixRoot = sfx === "ies" && /(?:tories|nsities)$/.test(lowerWord) && lexicalChars.length === ruleChars.length && differing.length === 1 &&
          ((lexicalChars[differing[0]] === "ɪ" && ruleChars[differing[0]] === "ə") || (lexicalChars[differing[0]] === "ə" && ruleChars[differing[0]] === "ɪ")), keepRuleRoot = ruleRoot && (weakSuffixRoot || rulePhones?.endsWith("ləti") && lexicalPhones.endsWith("lɪti") && rulePhones.slice(0, -4) === lexicalPhones.slice(0, -4)), plural = join(keepRuleRoot ? ruleRoot : basePron, base);
        if (sfx === "ies" && lowerWord.endsWith("eries")) return this.preferDirectPluralNearHiatus(plural, lowerWord, pos);
        return plural;
      }
    }

    // Supplied soft silent-e verbs also witness Latin -sor/-cor agents
    // and -sory/-cory adjectives. Short roots can be unrelated headwords
    // (once -> Oncor); keep them on the whole-word path.
    // The stressed -eer family (engineer, volunteer) is not neutral -er.
    // Weak or palatal medial nuclei retain their whole-word suffix policy.
    // Closed initial syllables exclude spurious open-prefix name roots; caller roots remain explicit.
    // Rule-only -ate stems need an open first syllable; closed-prefix stress stays on its whole-word route.
        const orStem = /[vt]or$/.test(lowerWord) ? lowerWord.slice(0, -2) + "e" : "", orRoot = orStem && (verbReading(orStem) || lex(orStem) || /[aeiouy]$/.test(syllabify(orStem)[0]) && this.predictInternal(orStem, undefined, true, undefined, dialect)), neutralOr = orRoot && (this.customDict[orStem] || !hasSingleVowelRun(orRoot) &&
      (/v$/.test(orRoot) ? /[^aeiouy]$/.test(syllabify(orStem)[0]) :
        /^ˈ/.test(orRoot) && /(?:eɪt|ət)$/.test(orRoot) && !/[əɝj]|[aeiouɑæɛɪɔʊʌəɝ]+[^aeiouɑæɛɪɔʊʌəɝ]+ɪ[^aeiouɑæɛɪɔʊʌəɝ]/.test(orRoot.replace(/(?:eɪt|ət)$|[ˈˌ]/g, ""))));
    // Complete monosyllabic rhotic roots also take -est; lexical endings and function-word fragments stay whole.
    const agentEnding = lowerWord.endsWith("er") ? "er" :
      lowerWord.endsWith("est") && /^[a-z]+$/.test(lowerWord) && (keepsDouble(lowerWord.slice(0, -3)) || /^[^aeiouy]+(?:ear|eer|air|[aeiou]r)$/.test(lowerWord.slice(0, -3))) && !isFunctionWord(lowerWord.slice(0, -3)) ? "est" :
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
      // Reuse compound parts only when no complete root reading is supplied.
            const compoundAgent = /[aeiou]{2}(?:[^aeiou]|nd)$/.test(base) && !verbReading(base) && !lex(base) ? this.tryCompoundSplit(base) : undefined, completeStem = liquidStem(base, "er") ||
        (/ower$/.test(base) ? lex(base) || this.predictInternal(base, undefined, true, undefined, dialect) : undefined) ||
        ((/ind$/.test(base) && (this.customDict[base] || this.dictionary[base]) || vouchedIndRoot(base)) ? this.customDict[base] || verbReading(base) || this.dictionary[base] || vouchedIndRoot(base) : undefined) ||
        (doubledBase ? this.customDict[base] || weakElDouble(base) || verbReading(base) || lex(base) : undefined) ||
        (/(?:w|qu)ash$/.test(base) ? stemPron(base) : /[aeiou]{2}(?:[^aeiou]|nd)$/.test(base) ? verbReading(base) : undefined) || compoundAgent;
      if (completeStem) return (compoundAgent || base.endsWith("rl") ? this.tryCompoundSplit(lowerWord) : undefined) ||
        completeStem + agentSuffix;
      const restored = base + "e", verb = verbReading(restored), agentVerb = verb && !hasSingleVowelRun(verb) &&
        (!restored.endsWith("ate") || /eɪt$/.test(verb)) ? verb : undefined, rhoticIreAgent = agentEnding === "er" && restored.endsWith("ire") ? this.predictInternal(restored, undefined, true, undefined, dialect) : undefined;
      if (rhoticIreAgent && /aɪɝ$/.test(rhoticIreAgent))
        return rhoticIreAgent.replace(/aɪɝ$/, "aɪɹ") + agentSuffix;
      // Silent -pse roots preserve their short coda and root stress
      // after eviction; a bare -ps fragment can be a different lexeme.
      let magicPron = doubledBase || NO_DROPPED_E.test(base) || /^[aeiou]ng$/.test(base) || (base.length <= 4 && base.endsWith("th"))
        ? undefined
        : neutralOr ? orRoot : agentVerb || this.wellKnown(restored, undefined, undefined, dialect) || this.strongAgeRoot(restored) || (isBoundBol(restored) || /pse$/.test(restored) || LATIN_E_ROOT.test(restored) ? this.predictInternal(restored, undefined, true, undefined, dialect) : undefined) || (syllabify(restored).length > 2 && ngeStem(base) ? this.renderRuleForm(restored, undefined, undefined, dialect) : undefined);
      // A short base can also coincidentally match an unrelated headword
      // whose final e IS pronounced (ente "duck" → enter, mete → meter).
      // Reject a vowel-final hit unless the base ends in y/w/r, where that
      // vowel is a genuine offglide/rhotic the suffix attaches to cleanly
      // (flye→flyer, howe→hower, acquire→acquirer).
      if (magicPron && /[^aeiouyrw]$/.test(base) && ENDS_IN_VOWEL_RE.test(magicPron)) magicPron = undefined;
      if (magicPron) {
        const magicClean = magicPron.replace(/[ˈˌ]/g, '');
        if (magicClean.endsWith('ndʒ')) {
          const directPron = this.wellKnown(base, undefined, undefined, dialect);
          if (directPron) {
            const directClean = directPron.replace(/[ˈˌ]/g, ''), pc = (s: string) => s.replace(/ɔ/g, 'ɑ').replace(/ʌ/g, 'ə').replace(/ɪ/g, 'i');
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
            ? (/or[dt]$/.test(base) ? verbStem(base, true) : this.wellKnown(base, undefined, true, dialect)) ||
              (NO_DROPPED_E.test(base) || hasWeakSonorantRime(base) || BORROWED_ROOT_FRAME.test(base) ? this.predictInternal(base, undefined, true, undefined, dialect) : undefined)
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
    // A vouched DRESS-d tail is a complete word, not a regular -ed allomorph.
    let completeEd = false;
        const compoundEd = regularInflection?.[0] === 2 && !lex(lowerWord.slice(0, -2)) && !lex(lowerWord.slice(0, -2) + "e") ? this.tryCompoundSplit(lowerWord, 0, false, node => {
      completeEd = node.kind === "legacy-compound" && !VERB_PARTICLE.test(node.left.spelling) && node.right.spelling.length >= 3 && /ed$/.test(node.right.spelling) && !!COMPOUND_TAILS[node.right.spelling] && hasSingleVowelRun(node.right.componentIpa) && /ɛd$/.test(node.right.componentIpa);
    }) : undefined, regularPron = regularInflection && (completeEd && compoundEd || inflect(regularInflection[0], regularInflection[1]));
    if (regularPron) return lowerWord.endsWith("aging") && !lowerWord.endsWith("naging") ? regularPron.replace(/ədʒɪŋ$/, "ɪdʒɪŋ") : regularPron;

    if (lowerWord.endsWith("ally") && lowerWord.length > 6) {
      const base2 = lowerWord.slice(0, -2);
      // -al adjectives the rules already handle (final, total, general)
      // are not in the lexicon; read them by rule before falling back to
      // the -ic stem of -ically words (basically, typically).
      const baseLex = lex(base2), rulePersonal = base2.endsWith("personal") ? this.predictInternal(base2, undefined, true, undefined, dialect) : undefined, basePron = base2.endsWith("tual") && baseLex && !baseLex.includes("tʃu") ? this.predictInternal(base2, undefined, true, undefined, dialect) : rulePersonal || (base2.endsWith("ical") ? baseLex : stemPron(base2)) || stemPron(lowerWord.slice(0, -4));
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
      // A vouched -fly boundary outranks an incidental -f stem; caller
      // stems and supplied -le bases retain priority (deeply/simply).
      const compound = (!lex(stem) && !COMPOUND_HEADS[stem] || lowerWord.endsWith("fly") && COMPOUND_HEADS[lowerWord.slice(0, -3)] && !this.customDict[stem]) && !lex(stem + "le") && this.tryCompoundSplit(lowerWord);
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
      const llRoot = /^[^aeiouy]*ul$/.test(stem) ? lex(stem + "l") || COMPOUND_HEADS[stem + "l"] : undefined, yBase = /[^aeiouy]i$/.test(stem) ? stem.slice(0, -1) + "y" : undefined;
      // Recover prefixed -ary/-ory through the same analyser after eviction.
      // Keep the bound -ular root before -ly, including supplied secondary stress.
      let ular = /ular$/.test(stem) && !this.customDict[stem] ? this.tryMorphologicalAnalysis(stem, undefined, undefined, undefined, undefined, dialect) : undefined;
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
      }, citation = stemPron(stem), nonVerb = this.homographs[stem]?.find(entry => this.matchPos(entry, "ADJ"))?.pronunciation, basePron = llRoot || ular || (yBase && (lex(yBase) ||
        (/^un.*(?:ary|ory)$/.test(yBase) ? this.tryMorphologicalAnalysis(yBase, undefined, undefined, undefined, undefined, dialect) : undefined) ||
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
      const base = lowerWord.slice(0, -4), withAble = (p: string): string => (this.customDict[base] || this.customDict[base + "e"] ? p : dropStemYod(p, dialect)).replace(/ə$/, "").replace(/ju$/, /lu$/.test(base) ? "j" : "ju") + "əbəl";
      // -ply → -plicable can inherit the attested -y verb's stress and
      // first vowel (apply → applicable). The same spelling also occurs
      // in roots whose -ate verb supplies a different frame (replicate →
      // replicable), so prefer that complete lexical root when present.
      const yRoot = able && base.endsWith("plic") && !lex(base) && !lex(base + "ate") && !this.customDict[base]
        ? stemPron(base.slice(0, -3) + "ly") : undefined;
      if (yRoot && /aɪ$/.test(yRoot)) return withAble(yRoot.replace(/aɪ$/, "ɪk"));
      // Undoubled short a/i/o/u bases retain silent-e; short e stays ambiguous.
      const undoubledAble = able && SHORT_SILENT_E_ROOT.test(base + "e");
      if ((able || base.length >= 5) && (able && deverbal(base) || this.customDict[base + "e"] || undoubledAble || !/[aeiour]$/.test(base) && !lex(base))) {
        // A head-stressed compound can retain an evicted silent-e root; weak prefixes stay ambiguous.
        const m = (able && deverbal(base)) || this.customDict[base + "e"] || verbReading(base + "e") || lex(base + "e") || this.reVerbReading(base + "e") || this.tryMorphologicalAnalysis(base + "e", undefined, undefined, undefined, undefined, dialect)?.match(/^ˈ.*$/)?.[0] ||
          (undoubledAble || LATIN_E_ROOT.test(base + "e") ? this.renderRuleForm(base + "e", undefined, undefined, dialect) : prefixedSilentV(base));
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
        const rStem = lex(base), silent = /r$/.test(base) && rStem && !hasSingleVowelRun(rStem) && FINAL_STRESS_RE.test(rStem)
          ? lex(base + "e") : undefined;
        if (silent && isUsableConsonantStem(silent, base)) return withAble(silent);
        // Recover y, doubled stems and dropped -sure e before trying the bare stem.
        const recovered = restoreY(base) || doubledConsonantLex(base) || (/sur$/.test(base) && !lex(base) ? stemPron(base + "e") : undefined) || stemPron(base);
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
      // In short vowel-initial X-o-logy forms, the suffix takes primary
      // stress on the whole-word syllabification (apology, astrology,
      // ecology). Keep the separate Greek etho- root shape on its existing
      // path; its initial vowel does not follow this small class.
      if (lowerWord.endsWith("ology") && slots.length === 3 &&
          /^[ae]$/.test(slots[0]) && /^[^aeiouy]+o$/.test(slots[1]) &&
          !/^th/.test(slots[1]))
        return this.renderRuleForm(lowerWord, 1, undefined, dialect);
      if (lowerWord.endsWith("ology") && slots.length >= 4 &&
          slots.slice(-3, -1).every(slot => /^[^aeiouy]+o$/.test(slot)))
        return this.renderRuleForm(lowerWord, slots.length - 2, undefined, dialect);
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
    // -parison preserves the silent-e verb stem (compare → comparison).
    if (lowerWord.endsWith("parison") && lowerWord.length > 8) { const root = lowerWord.slice(0, -4) + "e", p = lex(root) || this.predictInternal(root, undefined, true, undefined, dialect); if (p) return p + "əsən"; }
    // -ation ← -ate verb or bare stem (abdication, adaptation). Like
    // -ization, the suffix takes the primary on its /eɪ/ and the stem's
    // primary demotes: keeping the stem's stress gave ˈæbdəˌkeɪʃən for
    // ˌæbdɪˈkeɪʃən (316 dict words with penult stress read otherwise).
    if (lowerWord.endsWith("ation") && lowerWord.length > 7) {
      const b = lowerWord.slice(0, -5),
        ate = lex(b + "ate"),
        // -vary + -ation drops y to i; use vary rather than an unrelated
        // i-final headword such as Vari. -mentation attaches to its existing
        // stem; inventing an -ate verb changes its weak vowel after table eviction.
        src = (/ari$/.test(b) ? stemPron(b.slice(0, -1) + "y") : undefined) ||
          lex(b) || (b.endsWith("ment") ? stemPron(b) : undefined),
        ruleMitStem = !ate && src && /mit$/.test(b) ? this.predictInternal(b, undefined, true, undefined, dialect) : undefined;
      // The derivational legisl- family has a weak /ə/ allomorph before
      // -ation; regular composition from legislate preserves the verb's KIT.
      if (b.endsWith("legisl")) return this.renderRuleForm(lowerWord, undefined, undefined, dialect);
      const maturRoot = b === "matur" && this.predictInternal(b, undefined, true, undefined, dialect);
      if (maturRoot) return suffixPrimary(maturRoot.replace(/ɝ$/, "əɹ") + "eɪ") + "ʃən";
      if (ate) return suffixPrimary(ate.match(/eɪt$/) ? ate.slice(0, -1) : ate.replace(/[ɪə]t$/, "eɪ")) + "ʃən";
      // Recover short roots hidden by unrelated lexical heads, e.g. avi in aviation.
      if (!ate && b.length <= 3 && src) { const anForm = this.predictInternal(b + "an", undefined, true, undefined, dialect); if (anForm && /ən$/.test(anForm.replace(/[ˈˌ]/g, ""))) return anForm.replace(/ˈ/g, "ˌ").replace(/ən$/, "") + "ˈeɪʃən"; }
      // Preserve a rules-vouched KIT in weak -mit roots (limit → limitation).
      // The -stin stem alternates KIT~schwa when -ation demotes its root stress (destin → destination), unlike unchanged destiny.
      if (src) return this.recoverConAtion(lowerWord) || suffixPrimary((/stin$/.test(b) ? src.replace(/ɪn$/, "ən") : ruleMitStem && /t$/.test(ruleMitStem) && src.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l").replace(/ə(?=t$)/, "ɪ") === ruleMitStem.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l") ? ruleMitStem : src) + "eɪ") + "ʃən";
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
      if (/aɪ[vɫl]$/.test(lex(b + "e") || "")) return this.renderRuleForm(lowerWord, undefined, undefined, dialect);
      if (!/ific$/.test(b)) {
        const ruleAte = this.predictInternal(b + "ate", undefined, false, undefined, dialect);
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
        const noun = lowerWord.slice(0, -1) + "ce", supplied = lex(noun) || COMPOUND_TAILS[noun];
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
    if (/[aeiouy]sual$/.test(lowerWord) && syllabify(lowerWord).length === 2) return this.renderRuleForm(lowerWord, undefined, undefined, dialect);
    if (
      lowerWord.endsWith("ual") &&
      !lowerWord.endsWith("gual") &&
      lowerWord.length > 5 &&
      !lowerWord.endsWith("tual")
    ) {
      const base = lowerWord.slice(0, -3), p = stemPron(base);
      // Vouched vowel-final heads retain their own rime before a geminate -ual root.
      const linked = /^(.+[aeiouy])([aeiouy]([dn])\3ual)$/.exec(lowerWord), head = linked && lex(linked[1]);
      if (head && !isFunctionWord(linked[1])) return head.replace(/ˈ/g, "ˌ") + (stemPron(linked[2]) || this.renderRuleForm(linked[2], 0, undefined, dialect));
      // A bound d/n stem needs the complete adjective's penultimate stress.
      if (!lex(base) && /[dn]ual$/.test(lowerWord)) return this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 2, undefined, dialect);
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
    if (/^(?:as|con|de|in|per|re|sub)sist(?:[ae]n(?:ce|cy|cies|t(?:s|ly)?)|ive|[eo]rs?|s)?$/.test(lowerWord)) return this.renderRuleForm(lowerWord, 1, undefined, dialect);
    // A weak Latin prefix before -tual yields to the complete-word
    // stress frame (conceptual/perpetual), unlike compound inter-.
    if (/^(?:con|per|in(?!ter)|ef).*tual$/.test(lowerWord) && syllabify(lowerWord).length >= 3) return preservePretonicSchwa(this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 2, undefined, dialect), (lex(lowerWord.slice(0, -3)) ?? "").replace(/t$/, "tʃuəl"));
    // A restored verb witnesses -osure; a verified compound retains its stress.
    if (/osure$/.test(lowerWord) && verbStem(lowerWord.slice(0, -3) + "e", true))
      return this.tryCompoundSplit(lowerWord) || this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 2, undefined, dialect);
    const tableResult = tryStressNeutralSuffix(lowerWord, (stem, suffix, suffixIpa) => {
      // Nominals retain the actual -ify root; keep the separate STRUT/CURE path for u roots.
      if (suffix === "ification") {
        const root = !/(?<!q)u/.test(stem) && stemPron(stem + "ify");
        return root && /[əɪ]ˌ?faɪ$/.test(root) ? root.replace(/ˈ/g, "ˌ").replace(/[əɪ]ˌ?faɪ$/, "") : undefined;
      }
      // A closed disyllabic root with a weak final nucleus licenses neutral -ous.
      if (suffix === "ous") {
        const root = !/[aeiouy]$|[aeiouy]{2}[^aeiouy]*$/.test(stem) && syllabify(stem).length === 2 && (lex(stem) || BORROWED_ROOT_FRAME.test(stem) && this.predictInternal(stem, undefined, true, undefined, dialect));
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
      if (suffix === "ie") return /[aeiouy]{2}[^aeiouyr]$/.test(stem) && COMPOUND_HEADS[stem] && hasSingleVowelRun(COMPOUND_HEADS[stem]) ? stemPron(stem) : undefined;
      if (suffix === "let") {
        if (stem.length < 4 || !/[aeiou][^aeiouy]e$/.test(stem)) return undefined;
        const p = stemPron(stem);
        return p && isUsableConsonantStem(p, stem) ? p : undefined;
      }
      // A longer unattested Greek -bol root is bound: -ism/-ize retain
      // the whole derivative's antepenultimate stress, not a fabricated
      // free-stem citation stress. Short supplied symbol/embol roots stay.

      // Keep protected nasal-dental rimes intact (lengthwise), and an
      // unattested linking a inside the whole compound (lookalike).
      if (((suffix === "ism" || suffix === "ize") && isBoundBol(lowerWord) && !lex(stem)) || (suffix === "wise" && (/ngth$/.test(stem) || syllabify(stem).length > 2 && !lex(stem) && !isWeakLatinIte(stem) && !FREE_I_NITE_ROOT.test(stem) && !BORROWED_ROOT_FRAME.test(stem) && !/oic$/.test(stem)) || suffix === "like" && stem.endsWith("a") && !lex(stem) && !BORROWED_ROOT_FRAME.test(stem))) return undefined;
      // The -hood spelling replaces a final adjective y with i.
      if (suffix === "hood" && /[^aeiouy]i$/.test(stem)) return stemPron(stem.slice(0, -1) + "y");
      // A bound prefix is not the free verb that neutral -ment requires.
      // Neither is an unvouched weak-le fragment; supplied roots retain ownership.
      if (suffix === "ment" && (EN_PREFIXES.has(stem) || PREFIX_WEAK_LE_ROOT.test(stem) && !lex(stem) && !COMPOUND_HEADS[stem] && !COMPOUND_TAILS[stem])) return undefined;
      // Only -ion + ary is neutral; retain the root after eviction.
      // The final n becomes the onset of the secondary suffix syllable;
      // other -ary forms keep their existing stress-sensitive path.
      if (suffix === "ary") return stem.endsWith("ion") ? stemPron(stem)?.replace(/n$/, "ˌn") : undefined;
      // Keep bound -ple and a nucleus-less/vowel-initial -le frame
      // in word context; free silent-le stems keep their citation reading.
      const pleRoot = stem.endsWith("ple") && KEEP_UNMERGED_AFTER_PREFIX.has(stem.slice(0, -3));
      if (suffix === "ment" && (pleRoot || /^(?:[bcdfghjklmnpqrstvwxz]*|[aeiouy])le$/.test(stem))) {
        const contextual = this.renderRuleForm(lowerWord, pleRoot ? 0 : assignStress(syllabify(stem), stem), undefined, dialect).replace(/ɪ(?=mənt$)/, "ə");
        if (contextual.endsWith(suffixIpa)) return contextual.slice(0, -suffixIpa.length);
      }
      // -ify and -ity share an antepenult root and a weak thematic i.
      // Render the same root in that frame rather than pricing its bound
      // fragment as a free word (solid/dign/ver); both pipeline paths
      // use this rule. An independent supplied -ity reading takes priority.
      if (suffix === "ify") {
        const root = /^de.{4,}$/.test(stem) ? this.tryMorphologicalAnalysis(stem.slice(2) + "ify", undefined, undefined, undefined, undefined, dialect) : undefined;
        if (root?.endsWith(suffixIpa)) return "dɪ" + root.slice(0, -suffixIpa.length);
        const nominal = lex(stem + "ity");
        if (nominal && /[əɪ]ˌ?t[iɪ]$/.test(nominal)) return nominal.replace(/[əɪ]ˌ?t[iɪ]$/, "");
                const witness = lex(stem + "ification")?.match(/^ˌ([^ˈˌ]+?)[əɪ]fəˈkeɪʃən$/), silentE = witness && hasSingleVowelRun(witness[1]) ? stemPron(stem + "e") : undefined;
        if (silentE && silentE.replace(/[ˈˌ]/g, "") === witness?.[1]) return "ˈ" + witness[1];
        const noun = this.renderRuleForm(stem + "ity", undefined, undefined, dialect);
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
          const root = paired[1].replace(/ˌ(?=[^aeiouɑɔæɛɪʊʌəɝ]*$)/, ""), prior = stemPron(stem), phones = (ipa: string) => softenBaseFinal(ipa, stem, suffix).replace(/ɫ/g, "l").replace(/[əɪ]/g, "ə");
          if (!prior || phones(root) !== phones(prior)) return root;
        }
      }
      const base = (suffix === "ment" && deverbal(stem)) || (/^(?:ist|ism)$/.test(suffix) && this.silentEAgentRoot(stem)) || stemPron(stem);
      if (!base || suffix !== "ment" || !/[^q]u$/.test(stem) || lex(stem)) return base;
      const contextual = this.renderRuleForm(lowerWord, assignStress(syllabify(stem), stem), undefined, dialect);
      return contextual.endsWith(suffixIpa) ? contextual.slice(0, -suffixIpa.length) : base;
    });
    if (tableResult) return tableResult;
    for (const [sfx, ipa] of [["ular", "jəlɝ"], ["al", "əl"]] as [string, string][]) {
      if (!lowerWord.endsWith(sfx) || lowerWord.length <= sfx.length + 2) continue;
      const b = lowerWord.slice(0, -sfx.length), known = sfx === "al" && b.endsWith("ic") ? lex(b) : undefined;
      // Final -eal/-oal contains a vowel sequence, and -ual has its own
      // glide/coalescence context. Keep those endings in view. The
      // bound -eral frame also needs its full laxing context, rather
      // than a coincidental free stem (mineral is not miner + -al).
      // A single-onset -ation root takes lax a in its -al form
      // (nation/national); station keeps its multi-consonant onset.
      if (sfx === "al" && /^[^aeiouy]?ation$/.test(b)) return this.renderRuleForm(lowerWord, undefined, undefined, dialect);
      // Longer -inal formations take antepenultimate stress in word context
      // (origin/original); short roots retain citation stress (retinal).
      // Bound -ern/-urn roots need the whole adjective's stress too.
      if (sfx === "al" && (/[eou]$/.test(b) || /[eu]rnal$/.test(lowerWord) || lowerWord.endsWith("eral"))) continue;
      // -ical shifts a longer initial-stressed citation stem onto the
      // vowel before -ic (politic → political). Retain lexical segment
      // quality when the stem already carries its regular stress.
      if (sfx === "al" && ((lowerWord.endsWith("inal") && (b.match(/[aeiouy]+/g)?.length ?? 0) >= 3) ||
        (known?.startsWith("ˈ") && (known.match(/[aeiouɑæɛɪɔʊʌəɝ]+/g)?.length ?? 0) >= 3)))
        return this.renderRuleForm(lowerWord, syllabify(lowerWord).length - 3, undefined, dialect);
      const finish = (p: string): string =>
        softenBaseFinal(preSuffixReduce(p, lowerWord), b, sfx) + ipa;
      // Stripping a vowel-initial -al from an unknown one-syllable base
      // closes its syllable (fi|nal → fin, to|tal → tot) and loses the
      // tense vowel; leave those to the whole-word rule path.
      // -ial is not stress-neutral like -al: it pulls the primary onto the
      // syllable before it (adversary → adversarial, editor → editorial),
      // which the whole-word stress rule places.
      // A one-syllable stem is the stressed <i> itself (trial, dial). Same
      // for -al after a polysyllabic -ent/-ant/-ont stem: environmental,
      // accidental, fundamental stress the -en- the stem left unstressed.
      const mentAlRoot = sfx === "al" && b.endsWith("ment") && this.trace(b).path !== "rules";
      if (sfx === "al" && !mentAlRoot && (/^[^aeiouy]*[aeiouy]+[^aeiouy]+$/.test(b) && syllabify(b).length === 1 && !lex(b) || (b.endsWith("i") || /[aeo]nt$/.test(b)) && (b.match(/[aeiouy]+/g)?.length ?? 0) >= 2)) continue;
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
          const magic = lex(b + "e") || prefixedSilentV(b);
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
      // Some monosyllabic -ular formations preserve the independently
      // attested -ule stem (module → modular, tubule → tubular). Reading
      // only the consonant skeleton (`mod`, `tub`) loses the stem vowel and,
      // after /dʒ/, invents a separate /j/. Try the compositional spelling
      // base + -ule through the normal lexical-stem/rule path; require its
      // two-syllable, initial-stress -ule frame so regular/triangular cannot
      // be mistaken for members of this class. Longer -ular stems retain the
      // stress-aware whole-suffix path below.
      // The -ugular family has its own /ʌɡ/ + /jʊ/ frame (jugular), not a
      // free -ugule stem, so a generated spelling there is not evidence.
      const uleSpelling = b + "ule", uleFrame = sfx === "ular" && !b.endsWith("g") &&
        bSyllables.length === 1 && syllabify(uleSpelling).length === 2;
      const lexicalUleRoot = uleFrame ? lex(uleSpelling) : undefined;
      const uleRoot = lexicalUleRoot ?? (uleFrame ? this.renderRuleForm(uleSpelling, undefined, undefined, dialect) : undefined);
      // A generated -ule form only licenses this boundary with its full-U
      // rime. Schwa-final guesses such as consule/insule/titule are not
      // evidence for a free base; a lexical stem may independently license
      // its established allomorph (granule → granular).
      const uleStem = uleRoot && (lexicalUleRoot || /u[lɫ]$/.test(uleRoot))
        ? uleRoot.match(/^(ˈ.*)(?:u|ə)[lɫ]$/)?.[1]
        : undefined;
      const uleSuffix = uleStem ? (/(?:j|dʒ|tʃ)$/.test(uleStem) ? "əlɝ" : "jəlɝ") : undefined;
      let p =
        uleStem && uleSuffix
          ? uleStem
          : sfx === "ular" && bSyllables.length >= 2
          ? lex(b) ?? this.renderRuleForm(b, bSyllables.length - 1, undefined, dialect)
          : stemPron(b);
      if (p && mentAlRoot) {
        const root = this.predictInternal(b, undefined, false, undefined, dialect);
        if (!root || !/mənt$/.test(root) || b.endsWith("nment") && !root.endsWith("nmənt")) continue;
        p = /ˈmənt$/.test(root)
          ? root.replace(/ˈmənt$/, "ˈmɛnt")
          : root.replace(/ˈ/g, "ˌ").replace(/mənt$/, "ˈmɛnt");
      }
      // A stem spelled with a final "ng" (angular, singular, rectangular,
      // triangular, equiangular) is silent-g word-finally, the reading
      // `stemPron`/`renderRuleForm` give it read as a free word, but the
      // /ɡ/ resurfaces once a vowel-initial suffix follows: 5/5 -ngular
      // dict words keep it (ˈæŋɡjəɫɝ, ˈsɪŋɡjəɫɝ, …).
      if (p && sfx === "ular" && b.endsWith("ng") && p.endsWith("ŋ")) p = p + "ɡ";
      if (p) {
        const composed = finish(p);
        return uleSuffix ? composed.slice(0, -ipa.length) + uleSuffix : composed;
      }
    }

    // Outer suffixes resolve first: preference is not pre + ference.
    // Lexical or complete C-le roots license this pre- boundary after suffix analysis.
    if (lowerWord.startsWith("pre") && lowerWord.length >= 7) {
      const b = lowerWord.slice(3), base = lex(b) || (BORROWED_ROOT_FRAME.test(b) || COMPLETE_C_LE_ROOT.test(b) ? this.predictInternal(b, undefined, true, undefined, dialect) : undefined) || (b.endsWith("nge") && ngeStem(b.slice(0, -1)) ? this.renderRuleForm(b, undefined, undefined, dialect) : undefined);
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
  private ruleSyllables(lowerWord: string, forcedStress?: number, steps?: TraceStep[], pos?: string, dialect?: EnglishDialect): { syllables: string[]; stressedIdx: number; ipa: string[] } {
    const sourceWord = lowerWord;
    // Greek noun -logue has the same nuclei as -log; its silent ue
    // must not create a further stress-counting slot. A bare logue name
    // retains its existing long-o rime.
    if (lowerWord.length > 5 && /logue$/.test(lowerWord)) lowerWord = lowerWord.slice(0, -2);
        const syllables = syllabify(lowerWord), stressedIdx = forcedStress ?? assignStress(syllables, lowerWord, pos), secondary = secondaryStressIndices(syllables, stressedIdx), ipa = syllables.map((s, i) =>
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
        sourceWord, dialect,
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
  private renderRuleForm(lowerWord: string, forcedStress?: number, pos?: string, dialect?: EnglishDialect): string {
    const { syllables, stressedIdx: stressedSyllableIndex, ipa: syllableIPA } = this.ruleSyllables(lowerWord, forcedStress, undefined, pos, dialect);

    if (syllableIPA.length === 0) return lowerWord;
    const arRoot = lowerWord.startsWith("arr") ? lowerWord.slice(2) : lowerWord.slice(1);
    const arRootIPA = this.customDict[arRoot] ?? DICTIONARY[arRoot] ?? COMPOUND_HEADS[arRoot] ?? COMPOUND_TAILS[arRoot];
    const preserveInitialAR = !DICTIONARY[lowerWord] && !this.customDict[lowerWord] && /^ar(?!e)/.test(lowerWord) && stressedSyllableIndex > 0 &&
      /^(?:a|ar)$/.test(syllables[0] ?? "") && !!arRootIPA && /^ɹ/.test(arRootIPA.replace(/[ˈˌ]/g, ""));
    const renderIPA = syllableIPA.slice();
    if (preserveInitialAR && renderIPA[0].endsWith("əɹ") && renderIPA[1]?.startsWith("ɹ")) renderIPA[0] = renderIPA[0].slice(0, -1);
    const joined = renderIPA.join(""); let result = applyPostLexical(joined, lowerWord, syllables.length,
      renderIPA.slice(stressedSyllableIndex + 1).every(p => !/[aeiouɑæɛɪɔʊʌəɝ]/.test(p)),
      { syllableIPA: renderIPA, preserveInitialAR });

    // Add primary-stress marker. Emit for monosyllables too — content
    // words like "world", "knight", "wood" have lexical stress (the
    // dict marks it for citation form). Function-word demotion happens
    // at the tokenizer level once we know we're in sentence context.
    if (syllables.length > 0 && stressedSyllableIndex >= 0) {
      let charIndex = renderIPA.slice(0, stressedSyllableIndex).join("").length;
      // The index is into the pre-post-lexical string; a post-lexical
      // edit before it (the degeminated kk of ac·com·mo·da·tion) would
      // shift the mark into the stressed vowel (əkɑmədeˈɪʃən). Anchor on
      // whichever side of the mark the post-lexical pass left intact.
      // An onset consonant the pass merged away (bə|ɹeɪ → bɝeɪ) is dropped
      // from the anchor until the rest matches.
      // Only when the result has a vowel right before the match (the onset
      // was absorbed, not rewritten: chord, gehrig keep their onset).
      const full = joined.substring(charIndex); let tail = full;
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
      result = result.substring(0, charIndex) + "ˈ" + result.substring(charIndex);
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
        const tail = result.slice(charIndex + 1), shift = hiatusMarkOffset(tail);
        if (shift > 0) result = result.slice(0, charIndex) + tail.slice(0, shift) + "ˈ" + tail.slice(shift);
      }
    }

    // Stress-mark convention repair (onset maximization, suffix
    // secondary stress, -ation primary shift) — needs the mark, so
    // it runs after insertion. Rule-path only by construction.
    if (forcedStress === undefined) result = this.recoverAryRoot(lowerWord, result) ?? result;
        const rendered = applyPostStress(result, lowerWord, pos), ending = /(?:ion|ive|or)$/.exec(lowerWord)?.[0], stem = ending && lowerWord.slice(0, -ending.length), source = stem && (this.customDict[stem] ?? this.dictionary[stem]);
    if (!stem || !source) return rendered;
        const phones = (value: string) => value.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə"), inflected = (word: string) => ["s", "es", "ed", "ing"].some(suffix => this.dictionary[word + suffix] !== undefined), unprefixed = stem.startsWith("re") ? stem.slice(2) : "", rootSource = this.dictionary[unprefixed];
    if (!this.customDict[stem] && !inflected(stem) && !(rootSource && phones(source) === "ɹi" + phones(rootSource) && inflected(unprefixed))) return rendered;
    const root = phones(source), output = phones(rendered), prefix = root.slice(0, -1);
    if ((/[^e]e$/.test(stem) && /[pbtdkɡfvθðszʃʒmnŋlɫɹ]$/.test(root)) || root.length < 4 || !/[pbtdkɡfvθðszʃʒmnŋlɫɹ]$/.test(root) || output.length < prefix.length) return rendered;
    const mismatches = Array.from(prefix).flatMap((phone, i) => phone === output[i] ? [] : [i]);
    if (mismatches.length !== 1) return rendered;
    const at = mismatches[0], pair = output[at] + prefix[at];
    if (!["sz", "fv", "θð", "ʃʒ", "pb", "td", "kɡ"].includes(pair)) return rendered;
    let phoneIndex = 0;
    return Array.from(rendered).map(phone => /[ˈˌ]/.test(phone) ? phone : phoneIndex++ === at ? prefix[at] : phone).join("");
  }

  /**
   * Two-part compound split using the mined head/tail tables. Picks
   * the split with the most balanced halves (longest minimum part).
   * A doubled consonant at the boundary signals suffixing rather than
   * compounding (abet|ting) and rejects the split point.
   */
  private tryClosedGInCompound(word: string): string | undefined {
    const root = word.slice(0, -2);
    if (!word.endsWith("in") || !/(?:o|u)g$/.test(root) || !(COMPOUND_HEADS[root] || COMPOUND_TAILS[root])) return undefined;
    const rootPronunciation = this.predictInternal(root, undefined, true);
    return rootPronunciation && hasSingleVowelRun(rootPronunciation) && rootPronunciation.endsWith("ɡ") ? rootPronunciation + "ɪn" : undefined;
  }

  private tryCompoundSplit(word: string, inflectionLength = 0, headFilter: boolean | "owned" | "silent-head" = false, explain?: (structure: WordStructure) => void, observe?: (candidate: CompoundCandidate) => void, dialect?: EnglishDialect): string | undefined {
    if (word.length < 5) return undefined;
    let tail: string | undefined, headReading: string | undefined, tailPrimary = false, bestScore = -1;
    for (let i = 2; i <= word.length - 2; i++) {
      if (word[i - 1] === word[i] && !/[aeiouy]/.test(word[i])) continue;
      // Bound en/in-quire and weak KIT + -ow retain the unsplit reading.
      const a = word.slice(0, i), b = word.slice(i); if (/^(?:en|in)$/.test(a) && b === "quire" || /ɪn$/.test(COMPOUND_HEADS[a] || "") && hasSingleVowelRun(COMPOUND_HEADS[a] || "") && /^[^aeiouy]ow$/.test(b) &&
          /aʊ$/.test(COMPOUND_TAILS[b] || "") && COMPOUND_HEADS[b] !== COMPOUND_TAILS[b] && !EN_PREFIXES.has(a) && this.customDict[a] === undefined && this.customDict[b] === undefined) { explain?.({ kind: "opaque", route: "compound-dispatch-unsplit" }); return this.renderRuleForm(word); }
      // Anti- before an independently known v-root keeps its prefix /i/;
      // in an unsplit open syllable the ordinary rule can turn it into /aɪ/.
      // Bound -mobile keeps its compositional /moʊˌbiɫ/ allomorph, unlike free mobile.
      const boundMobile = b === "mobile";
      const antiVRoot = a === "anti" && b.startsWith("v") && b.length >= 3 &&
        (COMPOUND_TAILS[b] !== undefined || this.wellKnown(b, undefined, true, dialect) !== undefined);
      // Derive only vouched short plural heads before a full polysyllabic tail;
      // a competing s-initial root preserves the original compound boundary.
      const pluralRoot = a.endsWith("s") ? a.slice(0, -1) : "", pluralStem = !COMPOUND_HEADS[a] && pluralRoot.length >= 3 && /[aeiouy][aeiouyw]/.test(pluralRoot) &&
        !isFunctionWord(pluralRoot) && !EN_PREFIXES.has(pluralRoot) && !(COMPOUND_HEADS["s" + b] || COMPOUND_TAILS["s" + b]) &&
        (this.customDict[pluralRoot] || this.dictionary[pluralRoot] || COMPOUND_HEADS[pluralRoot]);
      // Owned silent-re nouns compose with independently verified agent tails.
      let headPron = (VERB_PARTICLE.test(b) && this.customDict[a] ? this.customDict[a] : COMPOUND_HEADS[a]) ?? (antiVRoot ? this.predict(a, dialect) : undefined) ?? ((/[aeiouy][a-z]*[cvst]or$/.test(a) && COMPOUND_TAILS[b] ? this.wellKnown(a) : undefined) ||
        (BORROWED_ROOT_FRAME.test(a) && /[cbt]re$/.test(a) && /er$/.test(b) && COMPOUND_TAILS[b] ? this.customDict[a] || this.renderRuleForm(a) : pluralStem && hasSingleVowelRun(pluralStem) && !hasSingleVowelRun(COMPOUND_TAILS[b] ?? COMPOUND_HEADS[b] ?? "") ? this.wellKnown(a) : undefined));
      // Two-syllable -o combining heads weaken before bound -motive, unlike free noun compounds.
      if (headPron && a.endsWith("o") && /^(?:mobile|motive)$/.test(b) && syllabify(a).length === 2 && !this.customDict[a] && !this.customDict[b]) headPron = headPron.replace(/oʊ$/, "ə");
      if (headPron && BOUND_WEAK_O_HEADS.has(a) && COMPOUND_TAILS_REVERSED[b] !== undefined) headPron = headPron.replace(/oʊ$/, "ə");
      // Short compounds need a particle and an independently vouched monosyllable.
      const particleTail = VERB_PARTICLE.test(b) && hasSingleVowelRun(COMPOUND_HEADS[b] ?? "") && !!headPron && hasSingleVowelRun(headPron) && !EN_PREFIXES.has(a) && !isFunctionWord(a);
      if (word.length === 5 && !particleTail && (!(VERB_PARTICLE.test(a) || /^(?:in|on|by)$/.test(a)) ||
          !COMPOUND_TAILS[b] || !hasSingleVowelRun(COMPOUND_TAILS[b]))) continue;
      // Verb prefixes keep their own stress policy; bed/thing are whole
      // tails, not vowel-bearing bases plus the apparent -ed/-ing ending.
      if (inflectionLength && (EN_PREFIXES.has(a) || VERB_PARTICLE.test(a) ||
          !/[aeiouy]/.test(b.slice(0, -inflectionLength)))) continue;
      // Merged silent-e rimes and verified monosyllabic tails keep the
      // root boundary. Bound/weak suffixes retain their existing routes.
      // -racetam is a bound INN drug stem, not the free words race + tam.
      const silentSlots = a.length >= 4 && /[aeiou][^aeiouy]e$/.test(a) ? syllabify(a).length : 0, silentHead = silentSlots > 0 && silentSlots <= 2 && (VERB_PARTICLE.test(b) ||
        COMPOUND_HEADS[b] !== undefined && hasSingleVowelRun(COMPOUND_HEADS[b]) &&
        !/(?:ate|ic|racetam)$/.test(word) && !/^(?:man|men|ward|some)$/.test(b) &&
        (silentSlots === 1 || !/^(?:ant|ent)$/.test(b)));
      // Back-vowel root rimes stay full; weak front-vowel name endings stay whole.
      const rhoticHead =
        /(?:ɝ|ɹ)$/.test(COMPOUND_HEADS[a] ?? "") && !hasSingleVowelRun(COMPOUND_HEADS[a]) &&
        /^[aeiou]/.test(b) && (isFunctionWord(b) || /^[aou]([^aeiouy])\1$/.test(b)) &&
        COMPOUND_HEADS[b] && hasSingleVowelRun(COMPOUND_HEADS[b]);
      // Preserve silent-e compounds across inflection; -ies and alternating fricative plurals keep their own handlers.
      const stableTail = headFilter === "silent-head" ? this.customDict[b] || COMPOUND_TAILS_REVERSED[b] || COMPOUND_TAILS[b] || COMPOUND_HEADS[b] || "" : "", inflectedSilentHead = headFilter === "silent-head" && a.length >= 4 && /[aeiou][^aeiouy]e$/.test(a) && !EN_PREFIXES.has(a) && !isFunctionWord(a) && !word.endsWith("ie") && !(word.endsWith("e") && this.wellKnown(word.slice(0, -1), undefined, true)) &&
        hasSingleVowelRun(headPron ?? "") && !ENDS_IN_VOWEL_RE.test(headPron ?? "") && hasSingleVowelRun(stableTail) && !/[fsθ]$/.test(stableTail);
      // An independently vouched head retains its contextual allomorph inside a further prefix.
      if (headFilter && !rhoticHead && !(headFilter === "owned" && (pluralStem || COMPOUND_HEADS[a] !== undefined && headPron !== COMPOUND_HEADS[a] || /[bcdfgkpt]red$/.test(word))) && !inflectedSilentHead ||
          headPron === undefined || (!boundMobile && (COMPOUND_TAILS[b] ?? (silentHead || rhoticHead || pluralStem || particleTail ? COMPOUND_HEADS[b] : undefined) ?? (antiVRoot ? this.wellKnown(b, undefined, true, dialect) : undefined)) === undefined)) continue;
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
      const tailPron = boundMobile ? "ˈmoʊbiɫ" : this.customDict[b] || COMPOUND_TAILS_REVERSED[b] || COMPOUND_TAILS[b] || COMPOUND_HEADS[b] || (antiVRoot ? this.wellKnown(b, undefined, true, dialect) : undefined);
      if (!tailPron) continue;
      if (observe) observe({ structure: { kind: "legacy-compound", left: { spelling: a, start: 0, end: i, componentIpa: headPron }, right: { spelling: b, start: i, end: word.length, componentIpa: tailPron }, stressOwner: antiVRoot || COMPOUND_TAILS_REVERSED[b] !== undefined ? "right" : "left", boundary: "unclassified" }, componentIpa: antiVRoot && tailPron ? headPron.replace(/ˈ/g, "ˌ") + tailPron : this.composeCompound(headPron, b), legacyScore: score });
      if (score > bestScore) { bestScore = score; headReading = headPron; tail = b; tailPrimary = antiVRoot; }
    }
    if (tail === undefined || headReading === undefined) return undefined;
    const split = word.length - tail.length;
    const tailReading = tail === "mobile" ? "ˈmoʊbiɫ" : this.customDict[tail] || COMPOUND_TAILS_REVERSED[tail] || COMPOUND_TAILS[tail] || COMPOUND_HEADS[tail] || (tailPrimary ? this.wellKnown(tail, undefined, true, dialect) : undefined);
    if (!tailReading) return undefined;
    explain?.({ kind: "legacy-compound", left: { spelling: word.slice(0, split), start: 0, end: split, componentIpa: headReading }, right: { spelling: tail, start: split, end: word.length, componentIpa: tailReading }, stressOwner: tailPrimary || COMPOUND_TAILS_REVERSED[tail] !== undefined ? "right" : "left", boundary: "unclassified" });
    // A tail attested ONLY tail-primary (see COMPOUND_TAILS_REVERSED) keeps
    // its own primary; the head's demotes instead. Everything else keeps
    // the ordinary head-primary/tail-secondary convention.
    if (tailPrimary) {
      const tailPron = this.wellKnown(tail, undefined, true, dialect) || COMPOUND_TAILS[tail] || COMPOUND_HEADS[tail], prefixPron = headReading;
      if (tailPron && prefixPron) return prefixPron.replace(/ˈ/g, "ˌ") + tailPron;
    }
    return this.composeCompound(headReading, tail);
  }

  private composeCompound(headReading: string, tail: string): string {
    if (tail === "mobile") return (headReading + "moʊˌbiɫ").replace(COMPOUND_GEMINATE_RE, "$2$1");
    const tailPron = this.customDict[tail] || COMPOUND_TAILS[tail] || COMPOUND_HEADS[tail]; return (
      COMPOUND_TAILS_REVERSED[tail] !== undefined
        ? headReading.replace(/ˈ/g, "ˌ") + (this.customDict[tail] || COMPOUND_TAILS_REVERSED[tail])
        : headReading + tailPron.replace(/ˈ/g, VERB_PARTICLE.test(tail) && !COMPOUND_TAILS[tail] && hasSingleVowelRun(tailPron) && /ə/.test(tailPron) ? "" : "ˌ")
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
    if ((this.dictionary[word] && result && !(result.length === 2 && EN_PREFIXES.has(result[0]) && syllabify(result[1]).length === 2 && BORROWED_ROOT_FRAME.test(result[1]))) || (result && ((result[result.length - 1] === "ary" || result[result.length - 1] === "ian" && /st$/.test(result[result.length - 2] ?? "")) || result.length >= 3 && result.some((p) => p.length < 4)))) return undefined;
    return result;
  }

  public addPronunciation(word: string, pronunciation: string): void {
    this.customDict[word.toLowerCase().replace(/[‘’]/g, "'")] = pronunciation.match(/^[A-Z0-9]+$/) ? pronunciation : arpabetToIpa(pronunciation);
  }
}

export default EnglishG2P;
