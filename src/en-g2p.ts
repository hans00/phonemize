// The lookup table is the curated exceptions list (mined by
// scripts/mine-exceptions.ts, ~26K entries / 700 KB). It covers
// foreign-origin words and native English irregulars whose rule
// predictions deviate from the canonical dict. The legacy
// data/en/dict.json (2.7 MB) is no longer shipped or loaded — the rule
// pipeline plus this table reproduces the dict's lenient accuracy at
// ~26% of the size. See docs/g2p-redesign.md P5.
import * as lookupTable from "../data/en/exceptions.json";
import * as homographs from "../data/en/homographs.json";
import { arpabetToIpa, resolveJson } from "./utils";
import { LanguageProcessor } from "./g2p";
import { expandText } from "./expand-en";
import { simplePOSTagger, isFunctionWord, reduceToWeakForm } from "./pos-tagger";
import { transformAmericanToRP } from "./en-gb";
import { predictPrincipled } from "./en-principled";
import { applyPhonotactics } from "./en-phonotactics";
import { applyPostLexical } from "./en-postlex";

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

// --- Linguistics-based Constants ---

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz".split(""));

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

// Valid English onsets (consonant clusters that can start a syllable)
const VALID_ONSETS = new Set([
  "b",
  "bl",
  "br",
  "c",
  "ch",
  "cl",
  "cr",
  "d",
  "dr",
  "dw",
  "f",
  "fl",
  "fr",
  "g",
  "gl",
  "gr",
  "gu",
  "h",
  "j",
  "k",
  "kl",
  "kn",
  "kr",
  "l",
  "m",
  "n",
  "p",
  "ph",
  "pl",
  "pr",
  "ps",
  "q",
  "qu",
  "r",
  "rh",
  "s",
  "sc",
  "sch",
  "scr",
  "sh",
  "sk",
  "sl",
  "sm",
  "sn",
  "sp",
  "sph",
  "spl",
  "spr",
  "st",
  "str",
  "sv",
  "sw",
  "t",
  "th",
  "thr",
  "tr",
  "ts",
  "tw",
  "v",
  "w",
  "wh",
  "wr",
  "x",
  "y",
  "z",
]);

// --- Phoneme Rules ---

// Improved stress-sensitive suffix rules
const SUFFIX_RULES: Array<[RegExp, string, boolean]> = [
  [/^ge$/, "dʒ", false],
  [/^[cs]e$/, "s", false],
  [/^que$/, "k", false],
  [/^the$/, "ð", false],
  [/^sten$/, "sən", false],
  [/^stion$/, "stʃən", false],
  [/^tion$/, "ʃən", false], // -tion is always unstressed
  [/^sion$/, "ʒən", false], // -sion is always unstressed
  [/^c[ei]an$/, "ʃən", false], // -cian/-cean: technician/ocean
  [/^lion$/, "ljən", false], // -llion: million, billion, stallion (guard: syllableIndex > 0)
  [/^[ct]ial$/, "ʃəl", false], // -cial/-tial (commercial, social, potential, partial)
  [/^cient$/, "ʃənt", false],
  [/^scien$/, "ʃən", false], // -cient: efficient/ancient; -scien: conscience (guard: idx>0)
  [/^ture$/, "tʃɝ", false], // -ture (future, nature)
  [/^sure$/, "ʒɝ", false], // -sure (measure, pleasure)
  [/^g[ei]ous$/, "dʒəs", false], // -geous/-gious: gorgeous/contagious
  [/^[ct]ious$|^scious$|^ceous$/, "ʃəs", false], // -cious/-tious/-scious/-ceous: delicious/conscious/crustaceous
  [/^kness$/, "knəs", false], // -kness: darkness, frankness, weakness (k is pronounced, not silent)
  [/^ness$/, "nəs", false], // -ness
  [/^ment$/, "mənt", false],
  [/^less$/, "ləs", false], // -ment / -less
  [/^ful$/, "fəl", false],
  [/^ly$/, "li", false], // -ful / -ly
  [/^er$/, "ɝ", false],
  [/^ers$/, "ɝz", false],
  [/^est$/, "əst", false],
  [/^ing$/, "ɪŋ", false],
  [/^ed$/, "d", false],
  [/^ves$/, "vz", false], // -ves plural (loaves/calves/wolves/selves)
  [/^e?s$/, "z", false], // -es/-s (plural/3rd person)
  [/^age$/, "ɪdʒ", false],
  [/^ism$/, "ɪzəm", false],
  [/^ist$/, "ɪst", false], // -ism/-ist
  [/^al$/, "əl", false], // -ity / -al
  [/^ic(s?)$/, "ɪk$1", true], // -ic/-ics attract stress (economic/mathematics)
  [/^lity$/, "ləti", false],
  [/^ty$/, "ti", false],
  [/^[ae]ry$/, "ɛri", false],
  [/^ory$/, "ɔri", false],
  [/^y$/, "i", false],
  [/^stein$/, "staɪn", false],
  [/^ford$/, "fɝd", false],
  [/^ward$/, "wɝd", false],
  [/^more$/, "mɔɹ", false],
  [/^b(?:erry|ury)$/, "bɛɹi", false],
  [/^well$/, "wɛl", false],
  [/^back$/, "bæk", false],
  [/^beck$/, "bɛk", false],
  [/^star$/, "stɑɹ", false],
  [/^tel[l]?$/, "tɛl", false],
  [/^te[ck]$/, "tɛk", false],
  [/^cor[e]?$/, "kɔɹ", false],
  [/^sto$/, "stoʊ", false],
  [/^dale$/, "deɪl", false],
  [/^twood$/, "twʊd", false],
  [/^cle$/, "kəɫ", false], // syllabic -cle ending: circle/barnacle/miracle/uncle
  [/^le$/, "əl", false], // syllabic-l: battle/simple/table (guard in loop for ll-split)
];

// Context-sensitive phoneme rules with improved accuracy
const PHONEME_RULES: Array<[RegExp, string]> = [
  // Silent letter combinations
  [/^pn/, "n"],
  [/^ps/, "s"],
  [/^pt/, "t"], // Greek-origin silent initial consonant: pneumonia/psalm/pterodactyl
  [/^[kg]n/, "n"], // knee/know (kn) and gnome/gnu (gn)
  [/^m[bn]$/, "m"], // thumb/lamb/comb (^mb$) and column/autumn/condemn (^mn$): word-final silent stop/nasal
  [/^mn/, "n"], // mnemonic, mnesic (silent initial m)
  [/^(?:wr|rh)/, "ɹ"], // write, wrong, wrist; rhyme, rhino (silent h after r)
  [/^bt$/, "t"], // debt, doubt, subtle (silent b in word/syllable-final bt)
  [/^sph/, "sf"], // sphere, sphinx (Greek-origin /sf/)
  [/^ght/, "t"], // right, might, fight
  [/^gh$/, ""], // silent gh at word end (though, bough)
  [/^gh/, "ɡ"], // ghost, ghetto (at start)
  [/^lm/, "m"], // palm, calm, psalm

  // Rime-conditioned patterns (rime is more predictive than onset-only; must precede generic vowel rules).
  [/^[oa]ught/, "ɔt"], // thought, bought, fought; caught, taught, daughter
  [/^ough$/, "ʌf"], // rough, tough, enough (default; misses though/cough/through/bough)
  [/^alm$/, "ɑm"], // calm, palm, psalm (silent l + a→ɑ)
  [/^alk(?=[^aeiou]|$)/, "ɔk"], // walk, talk, chalk, stalk, balky, chalker
  [/^al$/, "ɔl"], // all, ball, call (doubled-l dedupes to "al" before this)
  [/^ind$/, "aɪnd"], // kind, mind, find, bind, blind, behind, rewind
  [/^ild$/, "aɪld"], // mild, wild, child
  [/^old$/, "oʊld"], // old, cold, gold, fold, hold, mold, sold, told
  [/^olt$/, "oʊlt"],
  [/^olk$/, "oʊk"], // bolt/colt/jolt + folk/yolk (silent l)
  [/^ost$/, "oʊst"], // most, post, host (loses cost/lost; majority pattern wins)
  [/^ould$/, "ʊd"], // would, could, should (silent l, lax u — closed function-word family)
  // Improved digraph handling
  [/^tsch/, "tʃ"], // German loanwords
  [/^s(?:ch|z)/, "ʃ"], // German sch (schmaltz/Schmidt) + Polish/Hungarian sz (szabo); school/schema live in dict
  [/^she$/, "ʃi"], // she (pronoun; anchored so it doesn't eat shed/shell)
  [/^he$/, "hi"], // he  (pronoun; anchored so it doesn't eat here/hen)
  [/^d[zg]/, "dʒ"], // Polish dz (dziedzic) + dg (bridge, judge, edge)
  [/^cz/, "tʃ"], // czech, czechoslovak, czar (Polish/Czech cz)
  [/^chr/, "kɹ"], // chrome, chronic, Christ (Greek ch before r)
  [/^chl/, "kl"], // chlorine, chlorinated (Greek ch before l)
  [/^t?ch/, "tʃ"], // chair, church, much; watch, match, catch
  [/^ck/, "k"], // back, pick, truck
  [/^ph/, "f"], // phone, graph, elephant
  [/^sh/, "ʃ"], // shoe, fish, wash
  [/^thr/, "θɹ"], // th + r cluster is always voiceless: through, three
  [/^th(?=ink|ing$|ick|orn)/, "θ"], // voiceless: think/thing/thick/thorn (exceptions to voiced-before-vowel)
  [/^the$/, "ðə"], // the (definite article — anchored so it doesn't eat them/then/their)
  [/^th(?=[aeiou])/, "ð"], // voiced before vowels: this, that, they
  [/^th/, "θ"], // voiceless (default): path, math
  [/^wor(?!e)/, "wɝ"], // word, work, world, worry, worse, worst, worm (not wore)
  [/^wh(?=o)/, "h"], // who, whole, whom, whose (silent w before o)
  [/^wh/, "hw"], // what, where, when, which, white
  [/^qu/, "kw"], // queen, quick, quote
  [/^ng/, "ŋ"], // sing, ring, king
  // Improved vowel teams with better quality distinctions
  [/^o[ao]r/, "ɔɹ"], // door/floor (oor) and board/soar/roar (oar) → /ɔɹ/
  [/^ook/, "ʊk"], // book, cook, look, hook, took (oo before k → /ʊ/)
  [/^ood/, "ʊd"], // wood, hood, good, stood (oo before d → /ʊ/)
  [/^oo/, "u"], // boot, moon, cool, moose (long u; dict uses /u/ not /uː/)
  [/^ous$/, "əs"], // -ous suffix: famous/nervous/dangerous (guarded: last+unstressed in loop)
  [/^oup/, "up"], // group, soup, coup, croup (ou+p → /u/)
  [/^ou/, "aʊ"], // house, about, cloud
  [/^ow(?=[snmk])/, "aʊ"], // cow, down, brown (before consonants)
  [/^ow/, "oʊ"], // show, blow, know (at word end typically)
  [/^o[yi]/, "ɔɪ"], // boy/toy (oy) and coin/voice (oi)
  [/^a[uw]/, "ɔ"], // caught/sauce (au) and saw/draw (aw)
  [/^ay/, "eɪ"], // day, say, way
  [/^air/, "ɛɹ"], // hair, fair, chair, stair (must precede ^ai)
  [/^ai/, "eɪ"], // rain, main, paid
  [/^eau[x]?/, "oʊ"], // plateau/beau + beaux/bordeaux: French eau(x) → /oʊ/ (x silent)
  [/^ealth/, "ɛlθ"], // health, wealth, stealth (ea+lth → /ɛ/)
  [/^e[ae]/, "i"], // read, seat, beat; see, tree, free (default long)
  [/^iew/, "ju"],
  [/^ier$/, "iɝ"], // -iew (view/review) → ju; -ier word-final → iɝ (guard: isLastSyllable)
  [/^ie/, "i"], // piece, field, believe
  [/^cei/, "si"], // receive, ceiling, conceive (i before e after c)
  [/^ei/, "eɪ"], // vein, weight, eight
  [/^ey$/, "i"], // honey, abbey, valley, turkey (unstressed final -ey; guard skips when stressed)
  [/^ey/, "eɪ"], // they, grey, obey (stressed -ey)
  [/^ight/, "aɪt"], // night, right, knight (i+ght)
  [/^igh/, "aɪ"],  // high, sigh, thigh — igh without following t
  [/^oa/, "oʊ"], // boat, coat, road
  [/^oss/, "ɔs"], // cross, loss (short o)
  [/^eur/, "ɝ"], // connoisseur, entrepreneur (French -eur → /ɝ/)
  [/^eu/, "ju"], // feud, neuter, Europe
  [/^ew/, "u"], // few, new, threw
  [/^ue/, "u"], // true, blue, glue (at end)
  [/^uil/, "ɪl"], // build, built, guild, guilt, guile (ɪ not u before l)
  [/^ui/, "u"], // fruit, suit, cruise
  // R-controlled magic-e rimes: must precede generic ^ar/^ir/^or/^ur rules.
  [/^are$/, "ɛɹ"], // care, bare, share, prepare
  [/^ire$/, "aɪɹ"], // fire, hire, wire, tire
  [/^ore$/, "ɔɹ"], // more, sore, store, before
  [/^ure$/, "jʊɹ"], // cure, pure, secure
  [/^ere$/, "ɪɹ"], // here, mere, sphere

  // R-controlled vowels (rhotic)
  [/^ar/, "ɑɹ"], // car, far, start
  [/^er(?=[aeiouwy])/, "ɛɹ"], // berry/cherry/merry: er before vowel → /ɛɹ/ not /ɝ/
  [/^[eiu]r/, "ɝ"], // her/bird/fur (er/ir/ur → /ɝ/)
  [/^or/, "ɔɹ"], // for, port, storm
  // Context-dependent consonants
  [/^c(?=[eiy])/, "s"], // soft c: cent, city, cycle
  [/^giv/, "gɪv"],
  [/^gif/, "gɪf"],
  [/^gir/, "gɝ"],
  [/^gil/, "ɡɪl"], // hard-g: give/gift/girl/gild (guard: skip non-first syllable in loop)
  [/^g(?=[eiy])/, "dʒ"], // soft g: gem, gin, gym (but not all cases)
  // Improved consonant clusters
  [/^spr/, "spɹ"], // spring, spray, spread
  [/^str/, "stɹ"], // string, street, strong
  [/^scr/, "skɹ"], // screen, script, scratch
  [/^spl/, "spl"], // split, splash, splice
  [/^squ/, "skw"], // square, squash, squeeze
  [/^bl(?!e$)/, "bl"], // blue, black, blow (not -ble syllable)
  [/^br/, "bɹ"], // brown, bring, bread
  [/^cl/, "kl"], // clean, close, class
  [/^cr/, "kɹ"], // create, cross, cream
  [/^dr/, "dɹ"], // drive, dream, drop
  [/^fl(?!e$)/, "fl"], // fly, floor, flower (not -fle syllable)
  [/^fr/, "fɹ"], // from, free, friend
  [/^gl(?!e$)/, "ɡl"], // glass, globe, glad (not -gle syllable)
  [/^gr/, "ɡɹ"], // green, great, group
  [/^pl(?!e$)/, "pl"], // place, play, please (not -ple syllable)
  [/^pr/, "pɹ"], // problem, provide, pretty
  [/^sl/, "sl"], // slow, sleep, slide
  [/^sm$/, "zm"], // -ism/-asm coda: organism, prism, spasm (post-vocalic sm → /zm/)
  [/^sm/, "sm"], // small, smile, smell
  [/^sn/, "sn"], // snow, snake, snack
  [/^sp/, "sp"], // speak, space, sport
  [/^st/, "st"], // start, stop, study
  [/^sw/, "sw"], // sweet, swim, switch
  [/^two/, "tu"], // two (special case)
  [/^tr/, "tɹ"], // tree, try, travel
  [/^tw/, "tw"], // twelve, twenty
  [/^tz/, "ts"], // waltz, pretzel (tz cluster → /ts/)

  // Basic consonants
  [/^b/, "b"],
  [/^c/, "k"], // hard c (default)
  [/^d/, "d"],
  [/^f/, "f"],
  [/^g/, "ɡ"], // hard g (default)
  [/^h/, "h"],
  [/^j/, "dʒ"],
  [/^k/, "k"],
  [/^le$/, "əl"], // syllabic-l in -ble/-dle/-tle (table→bəl, battle→tle→t+əl)
  [/^l/, "l"],
  [/^m/, "m"],
  [/^nk/, "ŋk"],
  [/^ns$/, "nz"], // bank/think | word-final ns→/nz/ (lens/adkins)
  [/^n/, "n"],
  [/^p/, "p"],
  [/^r/, "ɹ"], // American English rhotic r
  [/^s/, "s"],
  [/^t/, "t"],
  [/^v/, "v"],
  [/^w/, "w"],
  [/^x(?=[aeiouy])/, "z"],
  [/^x/, "ks"], // word-initial x→z (xylophone) | x→ks (tax)
  [/^ym(?![aeiou])/, "ɪm"],
  [/^yn(?![aeiou])/, "ɪn"], // gym/symbol | syntax/synchronize
  [/^y$/, "i"], // city, happy, country — final y after prior vowel (guard in loop)
  [/^y(?=[aeiou])/, "j"], // yes, you, year (consonantal before vowels)
  [/^y(?=[^aeiouy]+$)/, "ɪ"], // y in closed syllable → ɪ (myth, glyph, crypt, physics, system)
  [/^y/, "aɪ"],
  [/^z/, "z"], // by/my/try | z
  // Default vowels (short/lax in closed syllables)
  [/^a(?=[^aeioun]y$)/, "eɪ"], // baby, lazy, navy, gravy, shady — aCy → long a
  [/^a$/, "eɪ"], // nation/station/abrasion — open-syllable a before -tion/-sion (guard in loop)
  [/^a/, "æ"], // cat, hat, bad
  [/^e/, "ɛ"], // bed, red, get (but she -> ʃi handled above)
  [/^i$/, "aɪ"], // mine, vine, time, like — open-syllable i before magic-e (guard in loop)
  [/^i/, "ɪ"], // sit, hit, big
  [/^o$/, "oʊ"], // piano, hero, zero, echo, cargo — word-final bare o (guard in loop)
  [/^o/, "ɑ"], // cot, hot, dog (American English short o)
  [/^u$/, "u"], // solution/confusion — open-syllable u before -tion/-sion (guard in loop)
  [/^u/, "ʌ"], // cut, but, run
];

// --- EnglishG2P Class ---

// Pre-compiled regexes used in the hot predict() path. Defining them at
// module scope ensures the engine compiles each pattern exactly once
// and reuses the cached form across every call.
const BCP47_REGION_RE = /^en(?:-[a-z]{4})?-([a-z]{2}|\d{3})(?:$|-)/;
const PLAIN_L_RE = /l/g;
const STRESS_PRIMARY = /ˈ/g;
// Velarized /ɫ/ → clear /l/ in a stop/fricative + l onset cluster before a
// vowel (pl, bl, kl, ɡl, fl, sl). Keeps coda and word-initial /ɫ/ dark.
const CLUSTER_L_RE = /([pbkɡfs])ɫ(?=[ˈˌ]?[aeiouɑæɛɪɔʊʌəɝ])/g;

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
      if (tail === "s" || tail === "") {
        const stemIpa = this.predict(stem, language, pos);
        if (stemIpa) return stemIpa + sAllomorph(stemIpa);
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
    // Final dark-l replacement. PLAIN_L_RE is module-level so the
    // regex is compiled once.
    if (out.indexOf("l") >= 0) out = out.replace(PLAIN_L_RE, "ɫ");
    // Clear /l/ in a consonant-cluster onset (pl, bl, kl, gl, fl, sl):
    // /l/ is light, not velarized, before a vowel in these clusters —
    // please /pliz/, slice /slaɪs/, replied /ɹɪˈplaɪd/, glad /ɡlæd/.
    // Velarized /ɫ/ is kept word-initially (lead) and in coda (well,
    // milk), where AmE genuinely darkens it. Applies to dict/exception
    // output too (which stores all-dark), for consistency.
    if (out.indexOf("ɫ") >= 0) out = out.replace(CLUSTER_L_RE, "$1l");

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

    const syllables = this.syllabify(lowerWord);
    const stressedIdx = this.assignStress(syllables, lowerWord);
    const traceSteps: TraceStep[] = [];
    syllables.forEach((syl, i) => {
      this.syllableToIPA(
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
      return morphPron;
    }

    // Priority 4: Language-specific G2P - removed as per new architecture

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
    const syllables = this.syllabify(lowerWord);
    const stressedSyllableIndex = this.assignStress(syllables, lowerWord);

    const syllableIPA = syllables.map((s, i) => {
      const isStressed = i === stressedSyllableIndex;
      const isLastSyllable = i === syllables.length - 1;
      return this.syllableToIPA(
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

      return result;
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
    const sPlural = (p: string): string => {
      const last = p.slice(-1);
      return ["s", "z", "ʃ", "ʒ"].includes(last)
        ? p + "ɪz"
        : ["p", "t", "k", "f", "θ"].includes(last)
          ? p + "s"
          : p + "z";
    };
    const edPast = (p: string): string => {
      const last = p.slice(-1);
      return ["t", "d"].includes(last)
        ? p + "ɪd"
        : ["p", "k", "s", "ʃ", "f", "θ"].includes(last)
          ? p + "t"
          : p + "d";
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

    if (lowerWord.endsWith("ied") && lowerWord.length > 4) {
      const basePron = this.wellKnown(lowerWord.slice(0, -3) + "y");
      if (basePron) return edPast(basePron);
    }
    if (lowerWord.endsWith("ies") && lowerWord.length > 4) {
      const basePron = this.wellKnown(lowerWord.slice(0, -3) + "y");
      if (basePron) return sPlural(basePron);
    }
    if (lowerWord.endsWith("ier") && lowerWord.length > 4) {
      const basePron = this.wellKnown(lowerWord.slice(0, -3) + "y");
      if (basePron) return basePron + "ɝ";
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
      const base = lowerWord.slice(0, -2);
      if (!/[aeiou]$/.test(base)) {
        const m = this.wellKnown(base + "e");
        if (m) return edPast(m);
      } // magic-e: coded→code
      const basePron = this.wellKnown(base);
      if (basePron) return edPast(basePron);
      // Doubled-consonant past tense (stopped → stop, planned → plan):
      // word = base + doubledC + "ed". Detect by the two chars before
      // "ed" being identical (word[-3] === word[-4]). The previous check
      // compared word[-4] against baseShort's last char — which IS
      // word[-4] — so it was tautological and false-matched non-doubled
      // words like "asked" (→ "as" /æz/ → /æzd/).
      const baseShort = lowerWord.slice(0, -3);
      if (
        lowerWord.length > 4 &&
        lowerWord.slice(-4, -3) === lowerWord.slice(-3, -2)
      ) {
        const p = this.wellKnown(baseShort);
        if (p) return edPast(p);
      }
      const magicPron = this.wellKnown(base + "e");
      if (magicPron) return edPast(magicPron);
      // Dict lookup failed for the stem because it is a regular word the
      // rules already handle, so it was never memorized as an exception
      // (ask, form, …). Rule-predict the stem and attach the past-tense
      // allomorph — this avoids the syllabifier mis-splitting the whole
      // inflected form (asked → [a][sked] → /æzd/). Guard: the stem must
      // contain a vowel and end in a consonant, so a root-final -ed with
      // a vowelless stem (bled, sped, fled) is left for the normal path.
      if (/[aeiou]/.test(base) && !/[aeiou]$/.test(base)) {
        // Try the silent-e-restored stem first (advanced → advance
        // /ədvæns/, placed → place /pleɪs/), then the bare base. For
        // stems with no silent e the +e form is harmless — "aske" and
        // "forme" predict the same /æsk/, /fɔɹm/ as ask/form (the e is
        // silent after a coda cluster, no magic-e lengthening).
        const ruleBaseE = this.predictInternal(base + "e", undefined, true);
        if (ruleBaseE) return edPast(ruleBaseE);
        const ruleBase = this.predictInternal(base, undefined, true);
        if (ruleBase) return edPast(ruleBase);
      }
    }

    if (lowerWord.endsWith("ing") && lowerWord.length > 4) {
      const base = lowerWord.slice(0, -3);
      if (!/[aeiou]$/.test(base)) {
        const m = this.wellKnown(base + "e");
        if (m) return m + "ɪŋ";
      } // magic-e: baking→bake
      const basePron = this.wellKnown(base);
      if (basePron) return basePron + "ɪŋ";
      const baseShort = lowerWord.slice(0, -4);
      if (
        lowerWord.length > 4 &&
        lowerWord.slice(-4, -3) === baseShort.slice(-1)
      ) {
        const p = this.wellKnown(baseShort);
        if (p) return p + "ɪŋ";
      }
      const magicPron = this.wellKnown(base + "e");
      if (magicPron) return magicPron + "ɪŋ";
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
    if (lowerWord.endsWith("iness") && lowerWord.length > 6) {
      const p = this.wellKnown(lowerWord.slice(0, -5) + "y");
      if (p) return p + "nəs";
    }
    if (lowerWord.endsWith("iest") && lowerWord.length > 5) {
      const p = this.wellKnown(lowerWord.slice(0, -4) + "y");
      if (p) return p + "əst";
    }
    if (lowerWord.endsWith("ify") && lowerWord.length > 5) {
      const p =
        this.wellKnown(lowerWord.slice(0, -3), undefined, true) ||
        this.predictInternal(lowerWord.slice(0, -3), undefined, false);
      if (p) return p + "əˌfaɪ";
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

  private syllabify(word: string): string[] {
    // A more linguistically informed syllabification algorithm based on Maximal Onset Principle.
    // This is a complex problem, and this implementation is a heuristic approach.

    // 0. Pre-handle exceptions and very short words
    if (word.length <= 3) {
      return [word];
    }

    const chars = word.toLowerCase().split("");
    const syllables: string[] = [];
    let currentSyllable = "";

    // 2. Iterate through the word, identifying vowel and consonant clusters.
    let i = 0;
    while (i < chars.length) {
      const i_before = i;
      // Find a vowel cluster (nucleus)
      let nucleus = "";
      while (i < chars.length && VOWELS.has(chars[i])) {
        nucleus += chars[i];
        i++;
      }
      // Absorb trailing 'w' into nucleus when it precedes a vowel (ew digraph: brewer → brew.er)
      if (
        nucleus.length > 0 &&
        i < chars.length &&
        chars[i] === "w" &&
        i + 1 < chars.length &&
        VOWELS.has(chars[i + 1])
      ) {
        nucleus += chars[i];
        i++;
      }

      // Find the following consonant cluster (coda + next onset)
      let consonants = "";
      while (i < chars.length && CONSONANTS.has(chars[i])) {
        consonants += chars[i];
        i++;
      }

      // If 'i' has not advanced, it means we hit a character that is neither
      // a vowel nor a consonant (like an apostrophe).
      if (i === i_before) {
        // Skip apostrophes and other non-alphabetic characters for syllabification
        // but keep them for the final result
        if (chars[i] === "'" || chars[i] === "'" || chars[i] === "'") {
          // Just skip the apostrophe, don't add it to any syllable
          i++;
          continue;
        }
        // Append the character to the current syllable and advance the pointer.
        if (syllables.length > 0 && currentSyllable.length === 0) {
          syllables[syllables.length - 1] += chars[i];
        } else {
          currentSyllable += chars[i];
        }
        i++;
        continue;
      }

      if (nucleus) {
        // Found a vowel nucleus
        if (consonants.length === 0) {
          // Word ends in a vowel
          currentSyllable += nucleus;
          syllables.push(currentSyllable);
          currentSyllable = "";
        } else if (consonants.length === 1) {
          // VCV pattern, consonant starts next syllable
          currentSyllable += nucleus;
          syllables.push(currentSyllable);
          currentSyllable = consonants;
        } else {
          // VCCV, VCCCV, etc. patterns
          let splitPoint = 0;
          while (splitPoint < consonants.length) {
            const onsetCandidate = consonants.substring(splitPoint);
            if (VALID_ONSETS.has(onsetCandidate)) {
              break;
            }
            splitPoint++;
          }

          const coda = consonants.substring(0, splitPoint);
          const nextOnset = consonants.substring(splitPoint);

          currentSyllable += nucleus + coda;
          syllables.push(currentSyllable);
          currentSyllable = nextOnset;
        }
      } else {
        // Word starts with a consonant cluster
        currentSyllable += consonants;
      }
    }
    if (currentSyllable) {
      syllables.push(currentSyllable);
    }

    // Post-processing: Handle silent 'e'
    // If the last syllable is a lone 'e' and the word is longer than one syllable,
    // merge it with the previous syllable.
    if (syllables.length > 1 && syllables[syllables.length - 1] === "e") {
      const last = syllables.pop();
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += last;
      }
    }

    // Post-processing: r-controlled magic-e rimes. Maximal-onset syllabifies
    // "fire" as ["fi", "re"] because the lone consonant 'r' starts a new
    // onset; but linguistically -Vre is one r-controlled rime, and the
    // ^are/^ire/^ore/^ure/^ere rules in PHONEME_RULES need to see the
    // full pattern in one syllable. Merge when the last syllable is "re"
    // and the previous ends with a vowel.
    if (syllables.length > 1 && syllables[syllables.length - 1] === "re") {
      const prev = syllables[syllables.length - 2];
      if (prev && VOWELS.has(prev[prev.length - 1])) {
        syllables.pop();
        syllables[syllables.length - 1] += "re";
      }
    }

    // Post-processing: vowel-l-e magic-e rime. Maximal-onset splits "hole"
    // as ["ho", "le"], but the 'le' here is magic-e (the 'l' is a normal
    // consonant, not syllabic), not the syllabic-L pattern (-Cle).
    // Merge when last syllable is "le" and the previous syllable ends in a vowel.
    // (Syllabic-L syllables "ble/ple/tle" are 3+ chars and are unaffected.)
    if (syllables.length > 1 && syllables[syllables.length - 1] === "le") {
      const prev = syllables[syllables.length - 2];
      if (prev && VOWELS.has(prev[prev.length - 1])) {
        syllables.pop();
        syllables[syllables.length - 1] += "le";
      }
    }

    // Post-processing: Merge any leftover single-consonant syllables into the previous one.
    // This can happen with words like "apple" -> ap-ple, where current logic might give a-p-ple
    for (let j = syllables.length - 1; j > 0; j--) {
      if (syllables[j].split("").every((c) => CONSONANTS.has(c))) {
        if (syllables[j - 1]) {
          syllables[j - 1] += syllables[j];
          syllables.splice(j, 1);
        }
      }
    }

    return syllables.filter((s) => s && s.length > 0);
  }

  // Improved stress assignment based on morphological and phonological rules
  private assignStress(syllables: string[], word: string): number {
    if (syllables.length <= 1) return 0;

    const lowerWord = word.toLowerCase();

    // Check for stress-attracting suffixes (stress BEFORE the suffix)
    for (const [pattern, , attracts_stress] of SUFFIX_RULES) {
      if (attracts_stress && lowerWord.match(pattern)) {
        return Math.max(0, syllables.length - 2);
      }
    }

    // Specific suffix stress patterns
    if (
      lowerWord.endsWith("tion") ||
      lowerWord.endsWith("sion") ||
      lowerWord.endsWith("cial") ||
      lowerWord.endsWith("tial")
    ) {
      return Math.max(0, syllables.length - 2);
    }

    // -ance/-ence words typically stress the antepenult (like dominance -> dəˈmɪnəns)
    if (
      (lowerWord.endsWith("ance") || lowerWord.endsWith("ence")) &&
      syllables.length >= 3
    ) {
      return 1; // Usually second syllable for these patterns
    }

    if (lowerWord.endsWith("ic") && syllables.length > 1) {
      return Math.max(0, syllables.length - 2);
    }

    // Common prefixes that don't usually take stress. For 3+ syllable
    // words we use the orthographic prefix as a signal but rely on the
    // doubled-consonant guard to avoid false matches (e.g. "address"
    // wouldn't fire because "addr" has doubled d).
    const unstressedPrefixes = [
      "ab", "ad", "con", "com", "de", "dis", "ex", "in", "mis",
      "ob", "out", "pre", "pro", "re", "sub", "un", "under",
    ];
    for (const prefix of unstressedPrefixes) {
      if (!lowerWord.startsWith(prefix) || syllables.length <= 2) continue;
      const next = lowerWord[prefix.length];
      const last = prefix[prefix.length - 1];
      if (next === last) continue; // doubled boundary → single morpheme
      return 1; // Stress usually falls on the root, not the prefix
    }

    // For 2-syllable words, generally stress the first syllable unless
    // it's a weak Latin/Anglo-Saxon prefix on a productive root. Two
    // signals tell us a prefix-looking syllable is actually a prefix:
    //   1. The first syllable string equals one of the known prefixes
    //      exactly (not a substring; "be" matches "be·gin" not "bet·ter").
    //   2. The character right after the prefix in the orthography is
    //      *not* the prefix's own final consonant — i.e., no doubled
    //      consonant at the morpheme boundary. Doubled consonants
    //      (abbey, adder, addict-noun-form, common) signal a single
    //      morpheme keeping first-syllable stress.
    if (syllables.length === 2) {
      const firstSyl = syllables[0];
      const PREFIXES_2SYL = [
        "ab", "ad", "be", "con", "com", "de", "dis", "ex", "in",
        "ob", "pre", "pro", "re", "sub", "un",
      ];
      for (const prefix of PREFIXES_2SYL) {
        if (firstSyl !== prefix) continue;
        const next = lowerWord[prefix.length];
        const last = prefix[prefix.length - 1];
        if (next === last) break; // doubled consonant → not a prefix
        return 1;
      }
      return 0;
    }

    // For 3+ syllables, use improved stress assignment
    if (syllables.length >= 3) {
      // Check for compound words (typically have primary stress on first part)
      if (this.isLikelyCompound(lowerWord, syllables)) {
        return 0; // First syllable gets primary stress in compounds
      }

      const penult = syllables[syllables.length - 2];
      if (this.isSyllableHeavy(penult)) {
        return syllables.length - 2; // Stress the penult if heavy
      } else {
        return Math.max(0, syllables.length - 3); // Stress the antepenult if penult is light
      }
    }

    return 0; // Default fallback
  }

  private isSyllableHeavy(syllable: string): boolean {
    // A syllable is heavy if it has:
    // 1. A long vowel (vowel digraph)
    // 2. A vowel followed by two or more consonants
    // 3. Ends in a consonant (closed syllable)

    const vowelDigraphs = [
      "aa",
      "ai",
      "au",
      "aw",
      "ay",
      "ea",
      "ee",
      "ei",
      "eu",
      "ey",
      "ie",
      "oa",
      "oo",
      "ou",
      "ow",
      "oy",
      "ue",
      "ui",
    ];

    for (const digraph of vowelDigraphs) {
      if (syllable.includes(digraph)) return true;
    }

    // Count vowels and consonants after the vowel
    let vowelFound = false;
    let consonantCount = 0;

    for (const char of syllable) {
      if (VOWELS.has(char)) {
        vowelFound = true;
        consonantCount = 0; // Reset consonant count after vowel
      } else if (vowelFound && CONSONANTS.has(char)) {
        consonantCount++;
      }
    }

    return consonantCount >= 1; // Closed syllable
  }

  private isLikelyCompound(word: string, syllables: string[]): boolean {
    // Detect potential compound words based on patterns
    if (syllables.length < 2) return false;

    // Common compound patterns
    const compoundPatterns = [
      /\w{4,}wide$/, // worldwide, nationwide
      /\w{3,}land$/, // homeland, woodland
      /\w{3,}work$/, // homework, network
      /\w{3,}time$/, // sometime, longtime
      /\w{3,}way$/, // highway, railway
      /\w{3,}ward$/, // forward, backward
      /hundred/, // hundred (often in compounds)
      /\w{3,}side$/, // outside, inside
      /\w{3,}where$/, // somewhere, anywhere
      /^over[a-z]{2,}/, // overboard, overlay, overbuilt (over- prefix compounds)
      /\w{3,}berg$/, // goldberg, sandberg, gutenberg (Germanic -berg compounds)
      /\w{3,}burg$/, // hamburg, salzburg, gettysburg (Germanic -burg compounds)
    ];

    return compoundPatterns.some((pattern) => pattern.test(word));
  }

  // Enhanced syllable to IPA conversion with stress-sensitive vowel reduction
  private syllableToIPA(
    syllable: string,
    syllableIndex: number,
    isStressed: boolean,
    isLastSyllable: boolean,
    nextSyllable?: string,
    steps?: TraceStep[],
    prevSyllable?: string,
    isNextLastSyllable = false,
  ): string {
    const stepsStart = steps?.length ?? 0;
    let phonemes: string[] = [];
    let remaining = syllable;

    // Check for suffix rules first
    // belle→bel|le double-l split: /l/ so post-dedup collapses to bɛl.
    if (remaining === "le" && isLastSyllable && prevSyllable?.endsWith("l"))
      return "l";
    // -se after vowel-i/e/o syllable → /z/ (advise/cheese/close); magic-e 'a' → /s/ via ^se$ rule.
    if (remaining === "se" && isLastSyllable && prevSyllable?.match(/[ieo]$/i))
      return "z";
    for (const [pattern, ipa] of SUFFIX_RULES) {
      // Word-final-only suffixes: skip on non-final syllables (legionnaire/album/algebra).
      if (
        (pattern.source === "^le$" ||
          pattern.source === "^cle$" ||
          pattern.source === "^twood$" ||
          pattern.source === "^al$" ||
          pattern.source === "^que$" ||
          pattern.source === "^sten$" ||
          pattern.source === "^[cs]e$" ||
          pattern.source === "^ge$") &&
        !isLastSyllable
      )
        continue;
      if (pattern.source === "^sto$" && nextSyllable !== "ne") continue;
      if (
        (pattern.source === "^lion$" ||
          pattern.source === "^scien$" ||
          pattern.source === "^ford$" ||
          pattern.source === "^ward$") &&
        syllableIndex === 0
      )
        continue;
      if (pattern.source === "^the$" && (syllableIndex === 0 || !isLastSyllable))
        continue;
      if (remaining.match(pattern)) {
        steps?.push({
          grapheme: remaining,
          phoneme: ipa,
          rule: `suffix:${pattern.source}`,
        });
        return ipa;
      }
    }

    // Handle doubled consonants
    const hadDoubledL = /ll/i.test(syllable);
    // Word-final y → /i/ when the syllable has a prior non-y vowel (city, happy)
    // but stays /aɪ/ when y is the only vowel (by, fly) — guard checked in loop.
    const hasVowelBeforeTerminalY = /[aeiou]/i.test(
      syllable.replace(/y$/i, ""),
    );
    // Doubled consonant before terminal y signals short vowel (happy/abby/addy vs baby/lazy)
    const hasDoubledConsonantBeforeY = /([b-df-hj-np-tv-z])\1y$/i.test(
      syllable,
    );
    remaining = remaining.replace(/([b-df-hj-np-tv-z])\1/g, "$1");

    // Silent 'e' detection (but exclude common function words like "the").
    // Vowel + r + e patterns (-are/-ere/-ire/-ore/-ure) are also excluded
    // — those are r-controlled magic-e rimes (care/here/fire/more/cure)
    // handled as full-rime rules below; stripping the 'e' first would let
    // the generic `^ar/^ir/^ur` rules collapse the vowel+r into /ɑɹ/ /ɝ/
    // /ɝ/ before the magic-e upgrade can fire, and the upgrade tables
    // can't disambiguate ir-source-ɝ (→ aɪɹ) from ur-source-ɝ (→ jʊɹ).
    // Exclude "-Cle" endings (consonant + le: table/simple/castle) but allow
    // "-Vle" endings (vowel + le: hole/mole/pole/rule/pale) — those are magic-e.
    const endsWithSilentE =
      isLastSyllable &&
      syllable.length > 1 &&
      syllable.endsWith("e") &&
      !syllable.endsWith("ee") &&
      !/[^aeiou]le$/.test(syllable) &&
      !syllable.endsWith("he") &&
      !syllable.endsWith("tte") &&
      !syllable.endsWith("ght") &&
      !syllable.endsWith("se") &&
      !syllable.endsWith("are") &&
      !syllable.endsWith("ere") &&
      !syllable.endsWith("ire") &&
      !syllable.endsWith("ore") &&
      !syllable.endsWith("ure") &&
      CONSONANTS.has(syllable[syllable.length - 2]);

    if (endsWithSilentE) {
      remaining = syllable.slice(0, -1);
    }

    const nextIsCle = !!nextSyllable?.match(/^[bdfgkmnprstvz]le$/);
    const nextIsMagicE =
      (isStressed || isNextLastSyllable) &&
      !!nextSyllable?.match(/^[^aeiou]e$/);
    // Doubled-gg: either cross-syllable split (bigger/trigger) or within one syllable (baggy/foggy) → hard g
    const gFromDoubling =
      (prevSyllable?.endsWith("g") ?? false) || /gg[eiy]/i.test(syllable);
    // Apply phoneme rules
    while (remaining.length > 0) {
      if (
        remaining === "s" &&
        isLastSyllable &&
        /[iɝ]$/.test(phonemes[phonemes.length - 1])
      ) {
        phonemes.push("z");
        steps?.push({ grapheme: "s", phoneme: "z", rule: "phoneme:^s" });
        break;
      }
      if (
        remaining === "le" &&
        phonemes.length > 0 &&
        /[iɪuʊɛæɑɔʌəɝ]$/.test(phonemes[phonemes.length - 1])
      ) {
        phonemes.push("l");
        steps?.push({ grapheme: "le", phoneme: "l", rule: "phoneme:le" });
        break;
      }
      if (remaining === "the" && phonemes.length > 0) {
        phonemes.push("ð");
        steps?.push({
          grapheme: "the",
          phoneme: "ð",
          rule: "phoneme:the-final",
        });
        break;
      }
      // Precompute the set of pattern sources to skip for this syllable
      // context. The inner per-rule loop becomes a single Set.has() check
      // instead of 13+ string comparisons per rule. Built once per
      // syllable; for a 5-syllable word that's 5 small allocations
      // instead of 13 × 150 × 5 = ~10K string ops.
      const aFire = (nextSyllable === "tion" || nextSyllable === "sion" || nextIsCle || nextIsMagicE);
      const uFire = (nextSyllable === "tion" || nextSyllable === "sion" || nextIsMagicE);
      const iFire = (nextIsMagicE || endsWithSilentE || (nextIsCle && isStressed));
      const skip = new Set<string>();
      if (!hadDoubledL) skip.add("^al$");
      if (gFromDoubling) skip.add("^g(?=[eiy])");
      if (!hasVowelBeforeTerminalY) skip.add("^y$");
      if (!isLastSyllable && !isStressed && !nextIsMagicE) skip.add("^o$");
      if (!isLastSyllable || isStressed) skip.add("^ous$");
      if (!isStressed || hasDoubledConsonantBeforeY) skip.add("^a(?=[^aeioun]y$)");
      if (!aFire) skip.add("^a$");
      if (!uFire) skip.add("^u$");
      if (!iFire) skip.add("^i$");
      if (!isLastSyllable) { skip.add("^le$"); skip.add("^ier$"); }
      if (isStressed) skip.add("^ey$");
      if (syllableIndex > 0) { skip.add("^x(?=[aeiouy])"); skip.add("^gil"); }
      if (syllableIndex > 0 || phonemes.length > 0) {
        skip.add("^pt"); skip.add("^ps"); skip.add("^pn");
      }

      let matchFound = false;
      for (const [pattern, ipa] of PHONEME_RULES) {
        if (skip.has(pattern.source)) continue;
        const match = remaining.match(pattern);
        if (match) {
          phonemes.push(ipa);
          steps?.push({
            grapheme: match[0],
            phoneme: ipa,
            rule: `phoneme:${pattern.source}`,
          });
          remaining = remaining.substring(match[0].length);
          matchFound = true;
          break;
        }
      }
      if (!matchFound) {
        steps?.push({ grapheme: remaining[0], phoneme: "", rule: "unmatched" });
        remaining = remaining.substring(1);
      }
    }

    // Unstressed-vowel reduction; startsWith handles rime-conditioned composites ("ɔl", "aɪnd", …).
    // Applies at all positions including position-0 (about/today/potato).
    const applyReduction = (table: Record<string, string>) => {
      for (let i = 0; i < phonemes.length; i++) {
        for (const from of Object.keys(table)) {
          if (phonemes[i].startsWith(from)) {
            phonemes[i] = table[from] + phonemes[i].slice(from.length);
            break;
          }
        }
      }
    };

    if (!isStressed && !isLastSyllable) {
      applyReduction({
        ɑɹ: "ɑɹ",
        ɔɹ: "ɔɹ",
        ɔɪ: "ɔɪ",
        æ: "ə",
        ɛ: "ɪ",
        ɑ: "ə",
        ʌ: "ə",
        ɔ: "ə",
      });
    }

    if (
      !isStressed &&
      isLastSyllable &&
      syllableIndex > 0 &&
      !/all$/i.test(syllable)
    ) {
      applyReduction({
        ɑɹ: "ɑɹ",
        ɔɹ: "ɔɹ",
        ɔɪ: "ɔɪ",
        æ: "ə",
        ɛ: "ə",
        ɑ: "ə",
        ʌ: "ə",
        ɔ: "ə",
      });
      const lastIdx = phonemes.length - 1;
      if (
        lastIdx >= 0 &&
        (phonemes[lastIdx] === "ɔɹ" || phonemes[lastIdx] === "ɑɹ")
      )
        phonemes[lastIdx] = "ɝ";
      if (
        lastIdx >= 0 &&
        phonemes[lastIdx] === "əɹ" &&
        syllable.endsWith("are")
      )
        phonemes[lastIdx] = "ɛɹ"; // -are$ stays ɛɹ (compare/airfare)
      // -ent final syllable: /ɪ/ before "nt" → /ə/ (different, innocent, permanent)
      const len = phonemes.length;
      if (
        len >= 3 &&
        phonemes[len - 1] === "t" &&
        phonemes[len - 2] === "n" &&
        phonemes[len - 3] === "ɪ"
      ) {
        phonemes[len - 3] = "ə";
      }
      // -ory/-ary 2-syl: /ɔɹ|ɑɹ/ before /i/ → /ɝ/ (memory/factory/salary); 3-syl+ secondary-stressed → skip.
      if (
        syllableIndex === 1 &&
        len >= 2 &&
        phonemes[len - 1] === "i" &&
        (phonemes[len - 2] === "ɔɹ" || phonemes[len - 2] === "ɑɹ")
      ) {
        phonemes[len - 2] = "ɝ";
      }
    }

    // Magic 'e' rule for stressed syllables
    if (endsWithSilentE && isStressed && phonemes.length > 0) {
      const shortToLong: Record<string, string> = {
        æ: "eɪ", // cap -> cape
        ɛ: "i", // met -> mete
        ɪ: "aɪ", // bit -> bite
        ɑ: "oʊ", // hop -> hope
        ʌ: "ju", // cut -> cute
      };

      for (let i = phonemes.length - 1; i >= 0; i--) {
        if (shortToLong[phonemes[i]]) {
          phonemes[i] = shortToLong[phonemes[i]];
          break;
        }
      }
    }

    if (steps) {
      let pi = 0;
      for (let si = stepsStart; si < steps.length; si++) {
        if (steps[si].phoneme !== "")
          steps[si].phoneme = phonemes[pi++] ?? steps[si].phoneme;
      }
    }

    return phonemes.join("");
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (!pronunciation.match(/^[A-Z0-9]+$/)) {
      pronunciation = arpabetToIpa(pronunciation);
    }
    this.customDict[word.toLowerCase()] = pronunciation;
  }
}

export default EnglishG2P;
