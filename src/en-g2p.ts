import * as dictionary from "../data/en/dict.json";
import * as homographs from "../data/en/homographs.json";
import { arpabetToIpa, resolveJson } from "./utils";
import { LanguageProcessor } from "./g2p";
import { expandText } from "./expand-en";
import { simplePOSTagger } from "./pos-tagger";
import { transformAmericanToRP } from "./en-gb";
import { predictPrincipled } from "./en-principled";
import { lookupException } from "./en-exceptions";

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
  [/^ce$/, "s", false],
  [/^se$/, "s", false],
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
  [/^tu$/, "tʃu", false], // tu before vowel-initial syllable → /tʃu/ (actual, factual, mutual)
  [/^ture$/, "tʃɝ", false], // -ture (future, nature)
  [/^sure$/, "ʒɝ", false], // -sure (measure, pleasure)
  [/^g[ei]ous$/, "dʒəs", false], // -geous/-gious: gorgeous/contagious
  [/^[ct]ious$|^scious$|^ceous$/, "ʃəs", false], // -cious/-tious/-scious/-ceous: delicious/conscious/crustaceous
  [/^[ei]ous$/, "iəs", false], // -eous/-ious (miscellaneous, various, serious)
  [/^uous$/, "juəs", false], // -uous (continuous, ambiguous)
  [/^[ai]ble$/, "əbəl", false], // -able/-ible
  [/^[ae]nce$/, "əns", false], // -ance/-ence (dominance, presence)
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
  [/^ive$/, "ɪv", false], // -age/-ive (package/active)
  [/^ism$/, "ɪzəm", false],
  [/^ist$/, "ɪst", false], // -ism/-ist
  [/^ity$/, "əti", false],
  [/^al$/, "əl", false], // -ity / -al
  [/^ic(s?)$/, "ɪk$1", true], // -ic/-ics attract stress (economic/mathematics)
  [/^lity$/, "ləti", false],
  [/^ty$/, "ti", false],
  [/^[ae]ry$/, "ɛri", false],
  [/^ory$/, "ɔri", false],
  [/^ry$/, "ri", false],
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
  [/^wr/, "ɹ"], // write, wrong, wrist
  [/^bt$/, "t"], // debt, doubt, subtle (silent b in word/syllable-final bt)
  [/^rh/, "ɹ"], // rhyme, rhino, rhythm, rhetoric (silent h after r)
  [/^sph/, "sf"], // sphere, sphinx (Greek-origin /sf/)
  [/^ght/, "t"], // right, might, fight
  [/^gh$/, ""], // silent gh at word end (though, bough)
  [/^gh/, "ɡ"], // ghost, ghetto (at start)
  [/^lm/, "m"], // palm, calm, psalm

  // Rime-conditioned patterns (rime is more predictive than onset-only; must precede generic vowel rules).
  [/^ought/, "ɔt"], // thought, bought, fought, sought, ought, nought
  [/^aught/, "ɔt"], // caught, taught, daughter, naughty, fraught
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
  [/^sch/, "ʃ"], // schmaltz/schnapps/Schmidt (German); English words like school/schema in dict
  [/^she$/, "ʃi"], // she (pronoun; anchored so it doesn't eat shed/shell)
  [/^he$/, "hi"], // he  (pronoun; anchored so it doesn't eat here/hen)
  [/^sz/, "ʃ"], // Polish/Hungarian sz (szabo, szymanowski)
  [/^dz/, "dʒ"], // Polish dz (dziedzic, dzierzinski)
  [/^cz/, "tʃ"], // czech, czechoslovak, czar (Polish/Czech cz)
  [/^chr/, "kɹ"], // chrome, chronic, Christ (Greek ch before r)
  [/^chl/, "kl"], // chlorine, chlorinated (Greek ch before l)
  [/^ch/, "tʃ"], // chair, church, much
  [/^ck/, "k"], // back, pick, truck
  [/^dg/, "dʒ"], // bridge, judge, edge
  [/^ph/, "f"], // phone, graph, elephant
  [/^sh/, "ʃ"], // shoe, fish, wash
  [/^thr/, "θɹ"], // th + r cluster is always voiceless: through, three
  [/^th(?=ink|ing$|ick|orn)/, "θ"], // voiceless: think/thing/thick/thorn (exceptions to voiced-before-vowel)
  [/^the$/, "ðə"], // the (definite article — anchored so it doesn't eat them/then/their)
  [/^th(?=[aeiou])/, "ð"], // voiced before vowels: this, that, they
  [/^th/, "θ"], // voiceless (default): path, math
  [/^tch/, "tʃ"], // watch, match, catch
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
  [/^ea/, "i"], // read, seat, beat (default long)
  [/^ee/, "i"], // see, tree, free
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
  [/^arr/, "æɹ"], // carry, marry, arrow
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
  [/^shr/, "ʃɹ"], // shrimp, shrink, shrewd
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

// --- Post-processing corrections (applied after syllabification, before stress marking) ---

const POST_PROC_RULES: Array<[RegExp, string]> = [
  [/([pbtdkɡfvszʃʒθðmnŋlɹhjwɫ])\1/g, "$1"],
  [/sʒ/g, "ʃ"],
  [/əɹ/g, "ɝ"],
  [/(?<=[^aeiouæɛɪɑɔʌʊ])ɪɹɝ$/, "ɝɝ"],
  [/n([kɡ])/g, "ŋ$1"],
  [/^mk/, "mək"],
  [/ɹɪtʃ$/, "ɹɪk"],
  [/ɡdʒ$/, "ɡ"],
  [/(?<=[aɑɔɛɪouəɝ])dʒɝ$/, "ɡɝ"],
  [/ətʃ$/, "ək"],
  [/([bdfɡhklmnpɹstzv])ə(ʃ|dʒ)əs$/, "$1eɪ$2əs"],
  [/([^w])əʃən$/, "$1eɪʃən"],
  [/oʊɹ/g, "ɔɹ"],
  [/[ɑə][ɛə]$/, "oʊ"],
  [/oʊ([ntplm])ɪk/g, "ɑ$1ɪk"],
  [/oʊnəm/g, "ɑnəm"],
  [/oʊmɪtɝ/g, "ɑmɪtɝ"],
  [/oʊɡɹəf([iɝ])/g, "ɑɡɹəf$1"],
  [/oʊmɪnən([ts])/g, "ɑmənən$1"],
  [/oʊdʒɪk$/, "ɑdʒɪk"],
  [/ənoʊ/g, "ɑnoʊ"],
  [/ætɪv$/, "ətɪv"],
  [/ɑɹi$/, "ɛɹi"],
  [/[æɪ]bli$/, "əbli"],
  [/ɑl([dtskp])/g, "oʊl$1"],
  [/əhl/g, "ɑl"],
  [/([pbtdkɡfvszʃθmnlhjwɫ])ɹoʊst/g, "$1ɹɑst"],
  [/bɹoʊd/g, "bɹɔd"],
  [/^ʌnɪ/, "junɪ"],
  [/([kɡdbptfvszʃʒmnlɹwj])əəs$/g, "$1uəs"],
  [/ksɪəs/g, "kʃəs"],
  [/stjʊɹ/g, "stʃɝ"],
  [/([tsn])aɪv$/g, "$1ɪv"],
  [/([^aeiouæɑɔɛɪuoəɝʌ])ɪtɪv$/g, "$1ətɪv"],
  [/ɡuʃ/g, "ɡwɪʃ"],
  [/mək(ɝ|ɪŋ)$/, "meɪk$1"],
  [/məstɝ$/, "mæstɝ"],
  [/ɪ([nlkfvmt])eɪʃən$/, "ə$1eɪʃən"],
  [/ɪ([nk])eɪt$/, "ə$1eɪt"],
  [/(s|dʒ)ɪbəl$/g, "$1əbəl"],
  [/ʌmɪnəs$/, "umənəs"],
  [/pənənt$/, "poʊnənt"],
  [/ɡɹɛɡeɪt$/, "ɡɹəɡeɪt"],
  [/tɪənɛɹi$/, "ʃənɛɹi"],
  [/ɝɹeɪʃən$/, "ɝeɪʃən"],
  [/ɪnɪti$/, "ɪnəti"],
  [/ɛntɛɹi$/, "əntɛɹi"],
  [/ɪtud$/, "ətud"],
  [/oʊleɪt$/, "ɑleɪt"],
  [/aʊɹ(?=[^aeiouæɛɪɑɔʌʊ])/g, "uɹ"], // French -our- before consonant (belcourt/bournonville)
  [/æ{2,}/g, "ɑ"], // double-a → ɑ (baalbek, baasch, baatz)
  [/ɪæ$/, "iə"], // word-final -ia: sɪnðɪæ→sɪnðiə (cynthia/sylvia)
  [/zjʊɹ$/, "ʒɝ"], // -zure: seizure/azure → ʒɝ
  [/nð$/, "nθ"], // word-final -nth: absinthe/labyrinth → nθ
  [/([lɹ])ð/g, "$1θ"], // -lth-/-rth- cluster: altherr/waltham/carthage → lθ/ɹθ
];

// --- EnglishG2P Class ---

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
  /**
   * Opt-in: consult the compact exceptions table (data/en/exceptions.json,
   * ~300 KB / 13K entries) for foreign-origin words and native English
   * irregulars whose rule predictions deviate far from the dict. Intended
   * as the eventual replacement for the 2.7 MB dict.json. Off by default
   * during the transition.
   */
  private useExceptions: boolean;

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
      useExceptions?: boolean;
    } = {},
  ) {
    this.disableDict = options.disableDict || false;
    this.dialect = options.dialect ?? "en-US";
    this.enablePrincipled = options.enablePrincipled || false;
    this.useExceptions = options.useExceptions || false;
    this.dictionary = Object.assign(
      Object.create(null),
      resolveJson<EnDict>(dictionary),
    );
    this.homographs = Object.assign(
      Object.create(null),
      resolveJson<HomographDict>(homographs),
    );
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
    // BCP 47 tags are case-insensitive — `en-gb`, `EN-GB`, `en-GB`
    // all mean the same dialect.
    const tag = language?.toLowerCase();

    // Reject non-English requests. We accept `en`, `en-us`, `en-gb`,
    // and any unspecified language (registry fallback uses us).
    if (tag) {
      const primary =
        tag.indexOf("-") === -1 ? tag : tag.slice(0, tag.indexOf("-"));
      if (primary !== "en") return null;
    }

    // User-supplied custom pronunciations short-circuit dialect
    // routing: if the caller explicitly set a pronunciation via
    // addPronunciation(), they presumably picked one that's right
    // for their use case. Don't run the RP transform over it.
    const lowerWord = word.toLowerCase();
    if (this.customDict[lowerWord]) {
      return this.customDict[lowerWord];
    }

    // Compact exceptions table (opt-in). Foreign-origin words and
    // native irregulars whose rules deviate from the dict — intended as
    // the shipping-time replacement for dict.json (~26% the size, same
    // lenient accuracy when paired with the rule pipeline). Independent
    // of `disableDict`: setting disableDict=true + useExceptions=true is
    // exactly the "no dict, just exceptions" production scenario.
    // For *pure rule* eval (no lookup at all), pass both to false.
    if (this.useExceptions) {
      const ex = lookupException(lowerWord);
      if (ex) return ex;
    }

    // Principled pipeline (opt-in). Decomposes the word into suffix +
    // base, looks up the base in dict, and rebuilds the IPA via stress
    // + reduction rules — skipping the postBase if-chain. Only fires
    // when the base resolves cleanly via dict. LTS-as-base regresses
    // eval by ~−6% even after native-only retraining; the right answer
    // for the "no-dict" path is the exceptions table (P4/P5), not LTS
    // as a base provider.
    if (this.enablePrincipled && !this.disableDict) {
      const principled = predictPrincipled(lowerWord, (w: string) => {
        if (this.customDict[w]) return this.customDict[w];
        return this.dictionary[w];
      });
      if (principled) return principled.ipa;
    }

    // Extract the region subtag from a BCP 47 tag. Skips an optional
    // 4-letter script (e.g. `en-Latn-US`) and stops at any extension
    // singleton (`-u-…`, `-x-…`). Matches alpha-2 (`gb`) or digit-3
    // (`419`) regions. So `en-US-x-foo`, `en-Latn-GB`, and `EN-GB-u-ca-gregory`
    // all surface their region correctly.
    const regionMatch = tag?.match(/^en(?:-[a-z]{4})?-([a-z]{2}|\d{3})(?:$|-)/);
    const region = regionMatch?.[1];
    const dialect: EnglishDialect =
      region === "gb" ? "en-GB" : region === "us" ? "en-US" : this.dialect;

    const base = this.predictInternal(word, pos, this.disableDict);
    if (!base) return base;

    // Word-level post-processing applied after all paths (syllabification + morphology + decomposition)
    let postBase = base;
    if (lowerWord.endsWith("icism"))
      postBase = postBase.replace(/kɪzəm$/, "sɪzəm");
    if (lowerWord.endsWith("lateral"))
      postBase = postBase.replace(/eɪtɝəl$/, "ætɝəl");
    if (lowerWord.endsWith("s") && /[bdɡvzʒðmdnŋlɹɾ]s$/.test(postBase))
      postBase = postBase.replace(/s$/, "z");
    // air- prefix: /ɪɹ/→/ɛɹ/ (airborne/airforce/airlifter)
    if (lowerWord.startsWith("air"))
      postBase = postBase.replace(/^ɪɹ/, "ɛɹ");
    // nth cluster: nð→nθ (anthem/panther/synthesis/Anthony)
    if (/nth/.test(lowerWord))
      postBase = postBase.replace(/nð/g, "nθ");
    // -etion (not -scretion): ɛʃən→iʃən (accretion/completion/deletion/secretion)
    if (lowerWord.endsWith("etion") && !lowerWord.endsWith("scretion"))
      postBase = postBase.replace(/ɛʃən$/, "iʃən");
    // -nality: nəl(ə/ɪ)ti→næliti (personality/criminality/originality); l→ɫ handled later
    if (lowerWord.endsWith("nality"))
      postBase = postBase.replace(/nəl[əɪ]ti$/, "næliti");
    // -icide: pre-cide ɪ is reduced to ə (homicide/fratricide/infanticide)
    if (lowerWord.endsWith("icide"))
      postBase = postBase.replace(/ɪsaɪd$/, "əsaɪd");
    // -ability: æ before -bility reduces to ə (ability/disability/availability/culpability)
    if (lowerWord.endsWith("ability"))
      postBase = postBase.replace(/æbɪlɪti$/, "əbɪlɪti").replace(/æbɪləti$/, "əbɪləti");
    // micro- prefix: open syllable mi.cro → /maɪkɹoʊ/ not /mɪkɹoʊ/; also restore oʊ when reduced
    if (lowerWord.startsWith("micro")) {
      postBase = postBase.replace(/^([ˈˌ]?)mɪ([ˈˌ]?)kɹ/, "$1maɪkɹ");
      postBase = postBase.replace(/maɪkɹ([ˈˌ]?)ə/, "maɪkɹ$1oʊ");
    }
    // -mental: elided /t/ in many derived forms (elemental/fundamental/departmental)
    if (lowerWord.endsWith("mental"))
      postBase = postBase.replace(/məntəl$/, "mɛnəl");
    // -some compound suffix: /soʊm/→/səm/ (fearsome/cumbersome/handsome/gruesome)
    // guard: not -osome (chromosome/liposome/ribosome from Greek soma)
    if (lowerWord.endsWith("some") && !lowerWord.endsWith("osome"))
      postBase = postBase.replace(/soʊm$/, "səm");
    // wa + consonant: /wæ/→/wɑ/ (water/watch/wash/want) — not in kw cluster (aquatic)
    postBase = postBase.replace(/(?<![kɡ])wæ([tʃn])/g, "wɑ$1");
    // super- prefix: open syllable su.per → /supɝ/ not /səpɝ|səpɛɹ|səpɪɹ/
    if (lowerWord.startsWith("super"))
      postBase = postBase.replace(/^([ˈˌ]?)sə([ˈˌ]?)p([ˈˌ]?)(ɝ|ɛ[ˈˌ]?ɹ|ɪ[ˈˌ]?ɹ)/, "$1su$2p$3ɝ");
    // -ause word-final: ɔs→ɔz (cause/clause/applause/pause/because)
    if (lowerWord.endsWith("ause") || lowerWord.endsWith("auze"))
      postBase = postBase.replace(/ɔs$/, "ɔz");
    // -eason/-oison: intervocalic s→z (reason/treason/season, poison)
    if (lowerWord.endsWith("eason")) postBase = postBase.replace(/isən$/, "izən");
    else if (lowerWord.endsWith("oison")) postBase = postBase.replace(/ɔɪsən$/, "ɔɪzən");
    // omni- prefix: stressed /ɑm/ not /əm/ (omnipotent/omnivorous)
    if (lowerWord.startsWith("omni"))
      postBase = postBase.replace(/^əm(ˈ?)n/, "ɑm$1n");
    // -tuate: t+schwa → tʃu before vowel (actuate/punctuate/situate/infatuate/effectuate)
    if (lowerWord.includes("tuat"))
      postBase = postBase.replace(/tə([eɪʃ])/g, "tʃu$1").replace(/tu([eɪəʃ])/g, "tʃu$1");
    // -tiate: tɪ/ti → ʃi before vowel (negotiate/initiate/differentiate)
    if (lowerWord.includes("tiat"))
      postBase = postBase.replace(/tɪ([eɪ])/g, "ʃi$1").replace(/ti([eɪ])/g, "ʃi$1");
    // -ciate: sɪ/si → ʃi (appreciate/depreciate/officiate); not [so]ciate or aciate
    if (lowerWord.includes("ciat") && !/(so|a)ciat/.test(lowerWord))
      postBase = postBase.replace(/sɪ([eɪ])/g, "ʃi$1").replace(/si([eɪ])/g, "ʃi$1");
    // abs-/an-/ag- initial: ə→æ
    if ((lowerWord.startsWith("abs") && !lowerWord.startsWith("absor") && !lowerWord.startsWith("absur")) ||
        (lowerWord.startsWith("an") && !/^an(em|aes|es|at|nu)/.test(lowerWord)) ||
        (lowerWord.startsWith("ag") && !/^ag(gl|ou)/.test(lowerWord)))
      postBase = postBase.replace(/^ə/, "æ");
    // -ification: vowel before -f- reduces to ə (amplification/classification/magnification)
    if (lowerWord.endsWith("ification"))
      postBase = postBase.replace(/ɪf/, "əf");
    // -ctory suffix: ɔɹi→ɝi (contradictory/directory/trajectory/perfunctory)
    if (lowerWord.endsWith("ctory"))
      postBase = postBase.replace(/ɔɹi$/, "ɝi");
    // -ative: ætɪv→ətɪv in unstressed suffix (contemplative/narrative/negative/relative)
    if (lowerWord.endsWith("ative"))
      postBase = postBase.replace(/ætɪv$/, "ətɪv");
    // -ience suffix: iəns not ins (experience/resilience/ambience)
    // -ience/-uence: [iu]ns→[iu]əns (experience/influence/resilience/affluence)
    if (lowerWord.endsWith("ience") || lowerWord.endsWith("uence"))
      postBase = postBase.replace(/([iu])ns$/, "$1əns");
    // e[bdghps]- prefix: ɪ→ɛ initial vowel (epidemic/educate/estimate/embark etc.)
    if (/^e[bdghps]/.test(lowerWord))
      postBase = postBase.replace(/^ɪ/, "ɛ");
    // th- initial ð→θ: content words use voiceless θ; guard voiced-ð function words
    if (lowerWord.startsWith("th") &&
        !lowerWord.startsWith("thenc") && !lowerWord.startsWith("thith") &&
        lowerWord !== "there" && lowerWord !== "these" &&
        lowerWord !== "theus" && lowerWord !== "themselves")
      postBase = postBase.replace(/^ð/, "θ");
    // -le compound junction: ClɪC→CəlC (battlefield, candlestick, bottleneck)
    // Guard: le[C] must start at index ≥ 4 to avoid initial Cle- clusters and short stems
    // Note: postBase still has plain l here; replace(/l/g,"ɫ") darkens it at return
    if (!lowerWord.endsWith("le") && /^.{4,}le[bcdfghjklmnpqrstvwxyz]/.test(lowerWord))
      postBase = postBase.replace(/([^aeiouæɛɪɑɔʌəɝ])lɪ([^aeiouæɛɪɑɔʌəɝ])/g, "$1əl$2");
    // -ead compound prefix: rules give ea→i but head/dead/bread/dread/stead/thread/tread/spread+
    // all have short-e /ɛ/ when used as the first morpheme of a compound
    if (/^(head|dead|bread|thread|dread|stead|tread|spread)./.test(lowerWord))
      postBase = postBase.replace(/^([^aeiouæɛɪɑɔʌuəɝ]*)id/, "$1ɛd");
    // uy digraph: ʌ[ji]→aɪ (buy/buyer/buyout/guy/guyer/guyett/stuyvesant)
    if (lowerWord.includes("uy"))
      postBase = postBase.replace(/ʌ[ji]/g, "aɪ");
    // -arity/-arison/-aration: æɹ→ɛɹ (clarity, disparity, parity, rarity, comparison)
    if (/(arity|arison|aration)$/.test(lowerWord))
      postBase = postBase.replace(/æɹ/g, "ɛɹ");
    // through/throughput/throughway: θɹ+ough gives ʌf but should give u
    if (lowerWord.startsWith("through"))
      postBase = postBase.replace(/θɹʌf/, "θɹu");
    // -nuation: nʌeɪʃ→njueɪʃ (continuation, discontinuation)
    if (lowerWord.endsWith("nuation"))
      postBase = postBase.replace(/nʌeɪʃ/, "njueɪʃ");
    // gui+C: u is silent in gu- digraph — guide/guidance/guise/guido give ɡu but need ɡaɪ
    if (lowerWord.startsWith("gui") && /^ɡu/.test(postBase))
      postBase = postBase.replace(/^ɡu/, "ɡaɪ");
    // -ign (not -eign): ɪn→aɪn for design/align/sign/benign (excludes reign/foreign/ensign)
    if (/[^e]ign$/.test(lowerWord) && lowerWord !== "ensign")
      postBase = postBase.replace(/ɪn$/, "aɪn");
    // aero- prefix: əɪɹ→ɛɹ (aerobic, aerospace, aerobatic)
    if (lowerWord.startsWith("aero"))
      postBase = postBase.replace(/^(ˈ?)əɪ(ˈ?)ɹ/, "$1ɛ$2ɹ");
    // -osis: əsɪs→oʊsɪs (prognosis/stenosis/thrombosis); ɪs→əs (cirrhosis/fibrosis/hypnosis)
    if (lowerWord.endsWith("osis")) {
      postBase = postBase.replace(/əsɪs$/, "oʊsɪs");
      postBase = postBase.replace(/ɪs$/, "əs");
    }
    // -graph: final ɡɹəf→ɡɹæf (telegraph, lithograph, reprograph)
    if (lowerWord.endsWith("graph"))
      postBase = postBase.replace(/ɡɹəf$/, "ɡɹæf");
    // -onomy: initial [æɛ]→ə (astronomy, agronomy)
    if (lowerWord.endsWith("onomy"))
      postBase = postBase.replace(/^([ˈˌ]?)([æɛ])/, "$1ə");
    // chron-ology: kɹoʊn→kɹɑn (chronology, chronological)
    if (lowerWord.includes("chron") && lowerWord.endsWith("ology"))
      postBase = postBase.replace(/kɹoʊn/, "kɹɑn");
    // di+vowel: dɪV→daɪV (diamond, diaper, dialect, diatribe, dioxide)
    if (/^di[aeiou]/.test(lowerWord))
      postBase = postBase.replace(/^(ˈ?)dɪ([aeiouæɛɑɔɝ])/, "$1daɪ$2");
    // bio- prefix: bɪoʊ→baɪoʊ (biogen, biohazard, biomet, biotech)
    if (lowerWord.startsWith("bio"))
      postBase = postBase.replace(/^(ˈ?)bɪoʊ/, "$1baɪoʊ");
    // dia+consonant: daɪæ→daɪə (diabase, diadem, diagnose, diagnosis, diagram, dialect, diamond)
    // di+vowel rule already fires first, converting dɪæ→daɪæ; we fix æ→ə here
    if (/^dia[^aeiou]/.test(lowerWord))
      postBase = postBase.replace(/^(ˈ?)daɪæ/, "$1daɪə");
    // -nsion suffix: nʒən→nʃən (apprehension, comprehension, declension)
    postBase = postBase.replace(/nʒən$/, "nʃən");
    // -stle suffix: silent t (epistle, thistle, greencastle)
    if (lowerWord.endsWith("stle"))
      postBase = postBase.replace(/stəl$/, "səl");
    // tur* words: tɝ before vowel → tʃɝ (naturalistic, adventurous, architectural, picturesque)
    if (/tur/.test(lowerWord))
      postBase = postBase.replace(/tɝ(?=[aeiouæɛɑɔɪəɝʊ])/g, "tʃɝ");
    // -atch/-etch: reverse ək misfire → ætʃ/ɛtʃ (dispatch, baywatch, outstretch)
    if (lowerWord.endsWith("atch") || lowerWord.endsWith("etch"))
      postBase = postBase.replace(/ək$/, lowerWord.endsWith("atch") ? "ætʃ" : "ɛtʃ");
    // -ore/-oor/-oar words: unstressed-final ɔɹ→ɝ fires incorrectly; restore ɔɹ (adore, ashore, bookstore, outdoor, uproar)
    if (lowerWord.endsWith("ore") || lowerWord.endsWith("oor") || lowerWord.endsWith("oar"))
      postBase = postBase.replace(/ɝ$/, "ɔɹ");
    // -worn: wor+n should produce wɔɹn not wɝn (worn, shopworn, careworn)
    if (lowerWord.endsWith("worn"))
      postBase = postBase.replace(/wɝn$/, "wɔɹn");
    // -buse words: b+u→bju (abuse, abusive, disabuse)
    if (lowerWord.endsWith("buse") || lowerWord.endsWith("busive") || lowerWord.endsWith("bused"))
      postBase = postBase.replace(/b([ʌu])s/, "bjus");
    // -ute magic-e: yod after [bkmp] before word-final ut (acute/commute/compute/tribute/persecute)
    if (lowerWord.endsWith("ute"))
      postBase = postBase.replace(/([bkmp])ut$/, "$1jut");
    // -fuse/-muse: yod + voicing ([fm]+us → [fm]+juz) (fuse, muse, confuse, amuse, defuse)
    if (lowerWord.endsWith("fuse") || lowerWord.endsWith("muse"))
      postBase = postBase.replace(/([fm])us$/, "$1juz");
    // -mune: yod insertion (immune, commune, autoimmune)
    if (lowerWord.endsWith("mune"))
      postBase = postBase.replace(/mun$/, "mjun");
    // future: f+ʌ→f+ju before tʃ in -ture words (future)
    if (lowerWord.startsWith("f") && lowerWord.endsWith("ture"))
      postBase = postBase.replace(/fʌ(tʃ)/, "fju$1");
    // avi-/ami- words: initial ɑ[mv]→eɪ[mv] (aviation, amiable, avis)
    if (/^a[mv]i/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)ɑ([ˈˌ]?)([mv])/, "$1eɪ$2$3");
    // -capable words: kæpəb→keɪpəb (capable, incapable)
    if (lowerWord.endsWith("capable"))
      postBase = postBase.replace(/kæpəb/, "keɪpəb");
    // cadence: kə(dəns)→keɪ(dəns) (cadence, decadence base)
    if (lowerWord.endsWith("cadence"))
      postBase = postBase.replace(/kə([ˈˌ]?)(dəns)$/, "keɪ$1$2");
    // ammunition: əm→æm at start (amm- prefix with short a)
    if (lowerWord.startsWith("amm"))
      postBase = postBase.replace(/^əm/, "æm");
    // -comparative: pɝ→pɛɹ (comparative)
    if (lowerWord.endsWith("parative"))
      postBase = postBase.replace(/pɝ([ˈˌ]?)(ətɪv)$/, "pɛɹ$1$2");
    // all-ation: əl→æl at start (allegation)
    if (lowerWord.startsWith("all") && lowerWord.endsWith("ation"))
      postBase = postBase.replace(/^əl/, "æl");
    // con-*-uous: kɑn→kən at start (conspicuous, contemptuous, contiguous, continuous)
    if (lowerWord.startsWith("con") && lowerWord.endsWith("uous"))
      postBase = postBase.replace(/^([ˈˌ]?)kɑn/, "$1kən");
    // -nuous: nuəs→njuəs at end (continuous, ingenuous, disingenuous)
    if (lowerWord.endsWith("nuous"))
      postBase = postBase.replace(/nuəs$/, "njuəs");
    // -duous: duəs→dʒuəs at end (deciduous)
    if (lowerWord.endsWith("duous"))
      postBase = postBase.replace(/duəs$/, "dʒuəs");
    // -ogue: final əɡ→ɑɡ (analogue, epilogue)
    if (lowerWord.endsWith("ogue"))
      postBase = postBase.replace(/əɡ$/, "ɑɡ");
    // -bicle/-ticle: kʌ[bt]→kju[bt] yod (cubicle, cuticle)
    if (/[bt]icle$/.test(lowerWord))
      postBase = postBase.replace(/kʌ([bt])/, "kju$1");
    // bur- prefix: bʌɹ→bjʊɹ yod (bureau, buran, buren)
    if (lowerWord.startsWith("bur"))
      postBase = postBase.replace(/bʌɹ/, "bjʊɹ");
    // -nostic: noʊ→nɑ short o (agnostic, diagnostic)
    if (lowerWord.endsWith("nostic"))
      postBase = postBase.replace(/noʊ(stɪk)$/, "nɑ$1");
    // -ocious: consonant+eɪ→oʊ before ʃəs (atrocious, ferocious)
    if (lowerWord.endsWith("ocious"))
      postBase = postBase.replace(/([ɹk])eɪ(ʃəs)$/, "$1oʊ$2");
    // astro- compound: reduce unstressed oʊ (astrology, astrological)
    if (lowerWord.startsWith("astro"))
      postBase = postBase.replace(/æstɹoʊ/, "æstɹə");
    // eco- compound: reduce unstressed oʊ (ecology, ecological)
    if (lowerWord.startsWith("eco"))
      postBase = postBase.replace(/ɛkoʊ/, "ɛkə");
    // cosm- words: koʊsm/kəsm→kɑzm (cosmetic, cosmetology, cosmonaut)
    if (lowerWord.startsWith("cosm"))
      postBase = postBase.replace(/k(?:oʊ|ə([ˈˌ]?))sm/, (_, m) => "kɑzm" + (m ?? ""));
    // -ological: oʊ→ə before stress+l+ɑdʒ (psychological, theological, sociological)
    if (lowerWord.endsWith("ological"))
      postBase = postBase.replace(/oʊ([ˈˌ]?)[lɫ](ɑdʒ)/, "ə$1l$2");
    // -ologist: ɡɪst→dʒɪst then oʊl[ɔɑ]dʒɪst→ɑlədʒɪst (cardiologist, physiologist, immunologist)
    if (lowerWord.endsWith("ologist")) {
      postBase = postBase.replace(/ɡɪst$/, "dʒɪst");
      postBase = postBase.replace(/oʊ[ˈˌ]?[lɫ][ɔɑ]dʒɪst$/, "ɑlədʒɪst");
    }
    // over- compound: vɪɹ→vɝ (overall, overact, overeat)
    if (lowerWord.startsWith("over"))
      postBase = postBase.replace(/oʊv([ˈˌ]?)ɪɹ/, "oʊv$1ɝ");
    // ov- initial: əv→oʊv (ovation, ovary, oviparous, ovulation, overreaction)
    if (lowerWord.startsWith("ov"))
      postBase = postBase.replace(/^([ˈˌ]?)əv/, "$1oʊv");
    // -over compound suffix: əvɝ→oʊvɝ (crossover, handover, turnover, leftover, andover)
    // exclude -cover (discover, hardcover) and reduced-vowel cases (lover, glover, etc.)
    if (lowerWord.endsWith("over") && !lowerWord.includes("cover") &&
        !["lover", "glover", "clover", "plover", "drover", "shover", "mover"].includes(lowerWord))
      postBase = postBase.replace(/əvɝ$/, "oʊvɝ");
    // under- compound: ndɛɹ→ndɝ (underarm, underachiever)
    if (lowerWord.startsWith("under"))
      postBase = postBase.replace(/ən([ˈˌ]?)dɛɹ/, "ən$1dɝ");
    // inter- prefix: ɪntɪɹ→ɪntɝ (interest, interaction, intercede, interfere)
    // not -erior words (interior, exterior) where r is prevocalic
    if (lowerWord.startsWith("inter") && !lowerWord.includes("erior"))
      postBase = postBase.replace(/^([ˈˌ]?)ɪnt([ˈˌ]?)ɪ([ˈˌ]?)ɹ/, "$1ɪnt$2ɝ$3");
    // retro- prefix: ɹɪtɹ→ɹɛtɹ (retroactive, retrovirus, retrofit, retrospective)
    if (lowerWord.startsWith("retro"))
      postBase = postBase.replace(/^([ˈˌ]?)ɹɪtɹ/, "$1ɹɛtɹ");
    // tele- prefix: tɪlɪ→tɛlɪ (telegenic, telemarketer, telecharge, telefunken)
    if (lowerWord.startsWith("tele"))
      postBase = postBase.replace(/^([ˈˌ]?)tɪl([ˈˌ]?)ɪ/, "$1tɛl$2ɪ");
    // psycho- prefix: saɪtʃ→saɪk (psychosis, psychotic, psychopath, psychosocial)
    if (lowerWord.startsWith("psycho"))
      postBase = postBase.replace(/^([ˈˌ]?)saɪtʃ/, "$1saɪk");
    // school- compounds: ʃul→skul; 'sch' rule gives ʃ but English school/school* uses /sk/
    if (lowerWord.startsWith("school"))
      postBase = postBase.replace(/^([ˈˌ]?)ʃul/, "$1skul");
    // -arian: ɝɪən→ɛɹiən (barbarian, contrarian, librarian, sectarian)
    if (lowerWord.endsWith("arian"))
      postBase = postBase.replace(/ɝ([ˈˌ]?)ɪən$/, "ɛɹ$1iən");
    // dox-/toxic-: oʊks→ɑks (doxology, toxic, toxicology)
    if (lowerWord.startsWith("dox") || lowerWord.startsWith("toxic"))
      postBase = postBase.replace(/oʊks/, "ɑks");
    // apol- words: eɪpiɑl→əpɑl (apology, apologetic)
    if (lowerWord.startsWith("apol"))
      postBase = postBase.replace(/^([ˈˌ]?)eɪp([ˈˌ]?)iɑ/, "$1əp$2ɑ");
    // -bution/-cution yod: [bk]uʃ→[bk]juʃ (attribution, distribution, electrocution, elocution)
    if (lowerWord.endsWith("bution") || lowerWord.endsWith("cution"))
      postBase = postBase.replace(/([bk])uʃ(ən)$/, "$1juʃ$2");
    // -uity: uti→uəti (ambiguity, annuity, continuity, ingenuity)
    if (lowerWord.endsWith("uity"))
      postBase = postBase.replace(/uti$/, "uəti");
    // -avery/-akery/-apery: æ[vkp]ɝi→eɪ[vkp]ɝi (bravery, slavery, bakery, drapery, papery)
    if (lowerWord.endsWith("avery") || lowerWord.endsWith("akery") || lowerWord.endsWith("apery"))
      postBase = postBase.replace(/æ([vkp])ɝi$/, "eɪ$1ɝi");
    // -nness: nnəs→nəs (cleanness, thinness — double-n reduced)
    if (lowerWord.endsWith("nness"))
      postBase = postBase.replace(/nn(əs)$/, "n$1");
    // ubi-/uti- yod: [ʌə][bt]→ju[bt] (ubiquity, ubiquitous, utility, utilize, utica)
    if (lowerWord.startsWith("ubi") || lowerWord.startsWith("uti"))
      postBase = postBase.replace(/^([ˈˌ]?)[ʌə]([bt])/, "$1ju$2");
    // profit: pɹoʊfɪt→pɹɑfɪt (profit, profitable, profiteer, unprofitable)
    if (lowerWord.includes("profit"))
      postBase = postBase.replace(/pɹoʊfɪt/, "pɹɑfɪt");
    // -akable magic-e: æk→eɪk (unshakable)
    if (lowerWord.endsWith("akable"))
      postBase = postBase.replace(/æk(əbəl)$/, "eɪk$1");
    // typic-: taɪpɪ→tɪpɪ (typical, typically, atypical)
    if (lowerWord.includes("typic"))
      postBase = postBase.replace(/taɪp([ˈˌ]?)ɪ/, "tɪp$1ɪ");
    // myth-: maɪ[θð]→mɪθ (mythic, mythology, mythological)
    if (lowerWord.startsWith("myth"))
      postBase = postBase.replace(/maɪ[θð]/, "mɪθ");
    // phys-: faɪs→fɪs (physics, physical, physiology, physiologic)
    if (lowerWord.startsWith("phys"))
      postBase = postBase.replace(/faɪs/, "fɪs");
    // sy- prefix: saɪ→sɪ (symbol, synonym, syllable, system, sycamore); not syph- (syphon=saɪfən)
    if (lowerWord.startsWith("sy") && !lowerWord.startsWith("syph"))
      postBase = postBase.replace(/^([ˈˌ]?)saɪ/, "$1sɪ");
    // cyl-: saɪl→sɪl (cylinder, cylindrical)
    else if (lowerWord.startsWith("cyl"))
      postBase = postBase.replace(/saɪl/, "sɪl");
    // rhyth-: ɹaɪθ→ɹɪð (rhythmic, rhythmical)
    if (lowerWord.startsWith("rhyth"))
      postBase = postBase.replace(/ɹaɪθ/, "ɹɪð");
    // obl-/obes-: oʊb→əb (oblique, oblong, oblivion, obese, obesity)
    if (lowerWord.startsWith("obl") || lowerWord.startsWith("obes"))
      postBase = postBase.replace(/^([ˈˌ]?)oʊb/, "$1əb");
    // geom-: dʒioʊm→dʒiɑm (geometry, geomorphology)
    if (lowerWord.startsWith("geom"))
      postBase = postBase.replace(/dʒioʊm/, "dʒiɑm");
    // colon- prefix (colony): koʊl→kɑl (colony, colonize, colonist); len>=6 guards vs 'colon' itself
    if (lowerWord.startsWith("colon") && lowerWord.length >= 6)
      postBase = postBase.replace(/^([ˈˌ]?)koʊl/, "$1kɑl");
    // coer-: kɑɝ→koʊɝ (coerce, coercive)
    if (lowerWord.startsWith("coer"))
      postBase = postBase.replace(/^([ˈˌ]?)kɑɝ/, "$1koʊɝ");
    // vocab-: vəkæb→voʊkæb (vocabulary)
    if (lowerWord.startsWith("vocab"))
      postBase = postBase.replace(/vəˈ?kæb/, "voʊkæb");
    // photo- excl photog-: foʊtə→foʊtoʊ (photocopy, photoshop, photovoltaics)
    if (lowerWord.startsWith("photo") && !lowerWord.startsWith("photog"))
      postBase = postBase.replace(/^(foʊt)ə/, "$1oʊ");
    // typo-: taɪp→tɪp (typography, typology); tyran- excl tyrant: taɪɹ→tɪɹ (tyranny, tyrannical)
    if (lowerWord.startsWith("typo"))
      postBase = postBase.replace(/^([ˈˌ]?)taɪp/, "$1tɪp");
    else if (lowerWord.startsWith("tyran") && !lowerWord.startsWith("tyrant"))
      postBase = postBase.replace(/^([ˈˌ]?)taɪɹ/, "$1tɪɹ");
    // chrys-: kɹaɪs→kɹɪs (chrysalis, chrysotile)
    if (lowerWord.startsWith("chrys"))
      postBase = postBase.replace(/kɹaɪs/, "kɹɪs");
    // echo-: ɛtʃ→ɛk (echo, echography)
    if (lowerWord.startsWith("echo"))
      postBase = postBase.replace(/^([ˈˌ]?)ɛtʃ/, "$1ɛk");
    // charact-: tʃɝ(ˈ?)ækt→kɛɹɪkt (character); stress mark may appear mid-word
    if (lowerWord.startsWith("charact"))
      postBase = postBase.replace(/^([ˈˌ]?)tʃɝ[ˈˌ]?ækt/, "$1kɛɹɪkt");
    // tech-: tɛtʃ→tɛk (technology, technique, technic)
    if (lowerWord.startsWith("tech"))
      postBase = postBase.replace(/^([ˈˌ]?)tɛtʃ/, "$1tɛk");
    // fore- compound: fix spurious ɪ or rhotacized vowel in prefix (forebear, forebode, forecast, forensic)
    if (lowerWord.startsWith("fore")) {
      postBase = postBase.replace(/^([ˈˌ]?)fɔɹɪ/, "$1fɔɹ");
      postBase = postBase.replace(/^([ˈˌ]?)fɝ[ˈˌ]?ɛ/, "$1fɔɹ");
    }
    // para-: pɝ→pɛɹ (parabolic, paramedic, parametric, parasite); excl parad/parab
    if (lowerWord.startsWith("para") && !lowerWord.startsWith("parad") && !lowerWord.startsWith("parab"))
      postBase = postBase.replace(/^([ˈˌ]?)pɝ/, "$1pɛɹ");
    // -acial/-acious: [æɑ]ʃ→eɪʃ (facial, racial, gracious, spacious, glacial)
    if (/acious$|acial$/.test(lowerWord))
      postBase = postBase.replace(/([æɑ])(ʃ(?:əl|əs))$/, "eɪ$2");
    // athe-: æðɪ→eɪθi (atheism, atheist)
    if (lowerWord.startsWith("athe"))
      postBase = postBase.replace(/^([ˈˌ]?)æðɪ/, "$1eɪθi");
    // anarch-: ɑɹtʃ→ɑɹk (anarchic, anarchism)
    if (lowerWord.startsWith("anarch"))
      postBase = postBase.replace(/ɑɹtʃ/, "ɑɹk");
    // -vious: ɪaʊs→iəs (devious, previous)
    if (lowerWord.endsWith("vious"))
      postBase = postBase.replace(/ɪaʊs$/, "iəs");
    // -urity: ɝɪti→jʊɹɪti (impurity, insecurity)
    if (lowerWord.endsWith("urity"))
      postBase = postBase.replace(/ɝɪti$/, "jʊɹɪti");
    // -graphy: əɡɹəfi→ɑɡɹəfi (cinematography, demography, mammography)
    if (lowerWord.endsWith("graphy"))
      postBase = postBase.replace(/əɡɹəfi$/, "ɑɡɹəfi");
    // trans-: restore full æ when reduced to ə (stress-split: tɹənˈs → tɹænˈs)
    if (lowerWord.startsWith("trans")) {
      postBase = postBase.replace(/^([ˈˌ]?)tɹən([ˈˌ]?)s/, "$1tɹæn$2s");
      postBase = postBase.replace(/^([ˈˌ]?)tɹ[əæ]ns([ˈˌ]?)([æɛɑɪ])/, "$1tɹænz$2$3");
    }
    // probl-/probab-/proph-/prosp-/proje-: pɹoʊ→pɹɑ (probably, problem, prophet, prospect, project)
    if (/^pro(?:bl|bab|ph|sp|je)/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)pɹoʊ/, "$1pɹɑ");
    // commun-: kɑm/kəm + [ʌəɑ]n → kəmjun (communal, community, communion, communicate, communicable)
    // excl. communis-/communiz- which keep kɑmjə (communism, communist, communize)
    if (lowerWord.startsWith("commun") && !lowerWord.startsWith("communis") && !lowerWord.startsWith("communiz"))
      postBase = postBase.replace(/^([ˈˌ]?)k[ɑə]m([ˈˌ]?)[ʌəɑ]n/, "$1kəmjun");
    // communis-: mənɪ→mjənɪ (communist, communism)
    if (lowerWord.startsWith("communis"))
      postBase = postBase.replace(/m([ˈˌ]?)[əʌ]nɪ/, "m$1jənɪ");
    // creat-: kɹit→kɹieɪt (create, creator, creative, creativity); excl. tʃ cluster (creature)
    if (lowerWord.startsWith("creat"))
      postBase = postBase.replace(/kɹi([ˈˌ]?)t(?!ʃ)/, "kɹi$1eɪt");
    // cogn-: kəɡ→kɑɡ (cognitive, cognizance)
    if (lowerWord.startsWith("cogn"))
      postBase = postBase.replace(/^([ˈˌ]?)kəɡ/, "$1kɑɡ");
    // decorat-: dɪkɝ→dɛkɹ (decorative, decoration)
    if (lowerWord.startsWith("decorat"))
      postBase = postBase.replace(/^([ˈˌ]?)dɪkɝ/, "$1dɛkɹ");
    // bene-: bɪnɪ→bɛnə (benediction, benefactor, benedetti)
    if (lowerWord.startsWith("bene"))
      postBase = postBase.replace(/^([ˈˌ]?)bɪnɪ/, "$1bɛnə");
    // derelict-: dɪɹɪ→dɛɹə (dereliction, derelict)
    if (lowerWord.startsWith("derelict"))
      postBase = postBase.replace(/^([ˈˌ]?)dɪɹɪ/, "$1dɛɹə");
    // attribut-: ə→æ at start (attribute, attribution)
    if (lowerWord.startsWith("attribut"))
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)tɹ/, "$1æ$2tɹ");
    // navig-: nəvɪ→nævə (navigate, navigator)
    if (lowerWord.startsWith("navig"))
      postBase = postBase.replace(/^([ˈˌ]?)nə([ˈˌ]?)vɪ/, "$1næ$2və");
    // moment-: məmɛ→moʊmɛ (momentum, momentous)
    if (lowerWord.startsWith("moment"))
      postBase = postBase.replace(/^([ˈˌ]?)mə([ˈˌ]?)mɛ/, "$1moʊ$2mɛ");
    // numer-: nəmɛ→numə (numerator)
    if (lowerWord.startsWith("numer"))
      postBase = postBase.replace(/^([ˈˌ]?)nə([ˈˌ]?)mɛ/, "$1nu$2mə");
    // necess-: nɪsɛ→nɛsə (necessary)
    if (lowerWord.startsWith("necess"))
      postBase = postBase.replace(/^([ˈˌ]?)nɪ([ˈˌ]?)sɛ/, "$1nɛ$2sə");
    // manufact-: mənə→mænjə (manufacture)
    if (lowerWord.startsWith("manufact"))
      postBase = postBase.replace(/^([ˈˌ]?)mə([ˈˌ]?)nə/, "$1mæ$2njə");
    // medic-: mɪdə→mɛdɪ (medicate)
    if (lowerWord.startsWith("medic"))
      postBase = postBase.replace(/^([ˈˌ]?)mɪ([ˈˌ]?)də/, "$1mɛ$2dɪ");
    // tele-: tɛlɪ→tɛlə (telecast, telecom); tɪɫɛ→tɛɫə (telephone, telescope); excl. teleol-
    if (lowerWord.startsWith("tele") && !lowerWord.startsWith("teleol")) {
      postBase = postBase.replace(/^([ˈˌ]?)tɛlɪ/, "$1tɛlə");
      postBase = postBase.replace(/^([ˈˌ]?)tɪ([ˈˌ]?)lɛ/, "$1tɛlə");
    }
    // corrup-/corros-/corrod-: kɔɹ→kɝ (corrupt, corrosion, corrode)
    if (lowerWord.startsWith("corrup") || lowerWord.startsWith("corros") || lowerWord.startsWith("corrod"))
      postBase = postBase.replace(/kɔɹ([ˈˌ]?)/, "kɝ$1");
    // cohes-: kə→koʊ before h (cohesion, cohesive)
    if (lowerWord.startsWith("cohes"))
      postBase = postBase.replace(/^([ˈˌ]?)kə([ˈˌ]?)h/, "$1koʊ$2h");
    // product-: pɹəd→pɝd + ʌk→ək (production, productive)
    if (lowerWord.startsWith("product"))
      postBase = postBase.replace(/^([ˈˌ]?)pɹə([ˈˌ]?)dʌk/, "$1pɝ$2dək");
    // relev-: ɹɪlɛv→ɹɛləv (relevant, relevance, relevancy)
    if (lowerWord.startsWith("relev"))
      postBase = postBase.replace(/^([ˈˌ]?)ɹɪ([ˈˌ]?)lɛv/, "$1ɹɛlə$2v");
    // resid-: ɹɪsɪd→ɹɛzɪd (resident, residence, residential)
    if (lowerWord.startsWith("resid"))
      postBase = postBase.replace(/^([ˈˌ]?)ɹɪ([ˈˌ]?)sɪd/, "$1ɹɛz$2ɪd");
    // demonstr-: dɪmɑns→dɛməns (demonstrate, demonstrator, demonstrable)
    if (lowerWord.startsWith("demonstr"))
      postBase = postBase.replace(/^([ˈˌ]?)dɪ([ˈˌ]?)mɑns/, "$1dɛ$2məns");
    // trouble: tɹaʊb→tɹəb (trouble, troubleshoot, troublemaker)
    if (lowerWord.startsWith("trouble"))
      postBase = postBase.replace(/^([ˈˌ]?)tɹaʊb/, "$1tɹəb");
    // extra-: ɪkstɹ→ɛkstɹ (extra, extradite, extravaganza)
    if (lowerWord.startsWith("extra"))
      postBase = postBase.replace(/^([ˈˌ]?)ɪks([ˈˌ]?)tɹ/, "$1ɛks$2tɹ");
    // opportun-: əpɔɹt→ɑpɝt (opportune, opportunism, opportunist, opportunistic)
    if (lowerWord.startsWith("opportun"))
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)p([ˈˌ]?)ɔɹt/, "$1ɑ$2p$3ɝt");
    // unc-: undo n→ŋ assimilation at un-C boundary (unclassify, uncollectable, uncomfortable)
    if (lowerWord.startsWith("unc"))
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)ŋ([ˈˌ]?)k/, "$1ə$2n$3k");
    // -alk prefix: extend silent-l rule to vowel-initial suffixes (talker, walker, stalker, etc.)
    if (lowerWord.startsWith("talk") || lowerWord.startsWith("walk") || lowerWord.startsWith("stalk"))
      postBase = postBase.replace(/^([ˈˌ]?)(t|w|st)[æɑə]([ˈˌ]?)l([ˈˌ]?)k/, "$1$2ɔ$4k");
    // domin-/nomin-/omin-/promin-: [əoʊ]mɪn → ɑmɪn (dominant, nominal, ominous, prominent)
    if (/^(domin|nomin|omin|promin)/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?(?:pɹ|[dn])?)([ˈˌ]?)[əoʊ]+([ˈˌ]?)mɪn/, "$1$2ɑ$3mɪn");
    // comed-: koʊm → kɑm (comedy, comedian)
    if (lowerWord.startsWith("comed"))
      postBase = postBase.replace(/^([ˈˌ]?)koʊ([ˈˌ]?)m/, "$1kɑ$2m");
    // nov-: noʊv → nɑv (novel, novelty, novice)
    if (/^nov(el|ic|elt)/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)noʊ([ˈˌ]?)v/, "$1nɑ$2v");
    // hospit-: hoʊspɪt → hɑspɪt (hospital, hospitable)
    if (lowerWord.startsWith("hospit"))
      postBase = postBase.replace(/^([ˈˌ]?)hoʊ([ˈˌ]?)spɪt/, "$1hɑ$2spɪt");
    // polish-: poʊlɪʃ → pɑlɪʃ (polish, polished, polisher)
    if (lowerWord.startsWith("polish"))
      postBase = postBase.replace(/^([ˈˌ]?)poʊ([ˈˌ]?)l([ˈˌ]?)ɪʃ/, "$1pɑ$2l$3ɪʃ");
    // oxid-: oʊks/əks → ɑks (oxide, oxidize, oxidation, oxidant)
    if (lowerWord.startsWith("oxid"))
      postBase = postBase.replace(/^([ˈˌ]?)[oʊə]+([ˈˌ]?)ks/, "$1ɑ$2ks");
    // process-/product-: pɹoʊ → pɹɑ (process, product, productive)
    if (lowerWord.startsWith("process") || lowerWord.startsWith("product"))
      postBase = postBase.replace(/^([ˈˌ]?)pɹoʊ/, "$1pɹɑ");
    // arriv-/aris-/aros-/arrang-: initial (æ|ɑ)ɹ → ɝ (arrive, arise, arose, arrange)
    if (lowerWord.startsWith("arriv") || lowerWord.startsWith("aris") ||
        lowerWord.startsWith("aros") || lowerWord.startsWith("arrang"))
      postBase = postBase.replace(/^([ˈˌ]?)[æɑ]([ˈˌ]?)ɹ/, "$1ɝ");
    // a- unstressed prefix: æ → ə (across, along, aloft, abolish, absorb, ahead, admire, adopt)
    if (lowerWord.startsWith("across") || lowerWord.startsWith("along") || lowerWord.startsWith("aloft") ||
        lowerWord.startsWith("abolish") || lowerWord.startsWith("absorb") || lowerWord.startsWith("ahead") ||
        lowerWord.startsWith("admire") || lowerWord.startsWith("adopt"))
      postBase = postBase.replace(/^([ˈˌ]?)æ/, "$1ə");

    // hetero- prefix: hiˈtɛɹ → hɛtɝ (heterodox, heterodyne, heterosis, heterozygous)
    if (lowerWord.startsWith("heter"))
      postBase = postBase.replace(/^([ˈˌ]?)hi([ˈˌ]?)tɛɹ/, "$1hɛ$2tɝ");

    // -entia suffix: nɪtə → nʃə (absentia, clementia, placentia, valentia)
    if (lowerWord.endsWith("entia"))
      postBase = postBase.replace(/n([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)ə$/, "n$1ʃ$2ə$3");

    // -[st]ionate: [st]+ɪoʊneɪt → ʃənɪt (passionate, compassionate, affectionate, proportionate)
    if (lowerWord.endsWith("ionate"))
      postBase = postBase.replace(/[st]([ˈˌ]?)ɪoʊn([ˈˌ]?)eɪt$/, "ʃ$1ən$2ət");

    // -brough/-rough place names: ɹəf → ɹoʊ (fambrough, scarbrough, burrough)
    if (lowerWord.endsWith("ough"))
      postBase = postBase.replace(/ɹəf$/, "ɹoʊ");

    // non- prefix: nən → nɑn (nonentity, nonbinding, nonferrous, nonacademic)
    if (lowerWord.startsWith("non"))
      postBase = postBase.replace(/^([ˈˌ]?)nən/, "$1nɑn");

    // ex- before vowel: ɪ(ˈ?)ks → ɪɡz (example, exact, examine, exacerbate)
    if (/^ex[aeiou]/.test(lowerWord) && !lowerWord.startsWith("exer"))
      postBase = postBase.replace(/^ɪ([ˈˌ]?)ks/, "ɪ$1ɡz");

    // rein- compound: ɹeɪn → ɹiɪn (reinforce, reinstall, reinstate, reinterpret)
    if (lowerWord.startsWith("rein") && lowerWord.length >= 8 && !lowerWord.startsWith("reind"))
      postBase = postBase.replace(/^([ˈˌ]?)ɹeɪn/, "$1ɹiɪn");

    // news- compound: nus → nuz (newscast, newspaper, newsman — but not newsflash which has /s/ before voiceless cluster)
    if (lowerWord.startsWith("news") && !lowerWord.startsWith("newsf"))
      postBase = postBase.replace(/^([ˈˌ]?)nus/, "$1nuz");

    // uni- unstressed: ənɪ → junɪ (unicorn, universe, unique, uniform)
    // Exclude uni[mns]- = un-im/un-in/un-is negative compounds
    if (lowerWord.startsWith("uni") && !/^uni[mns]/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)nɪ/, "$1ju$2nɪ");

    // ever-/aver-: vɪɹ → vɝ (everest, everett, averil — initial "ever" syllabified as e·ve·r)
    if (lowerWord.startsWith("ever") || lowerWord.startsWith("aver"))
      postBase = postBase.replace(/v([ˈˌ]?)ɪ([ˈˌ]?)ɹ/, "v$1ɝ$2");

    // van- prefix: vən → væn (vanderbilt, vandenberg, vanderburg — Dutch/Flemish names)
    if (lowerWord.startsWith("van"))
      postBase = postBase.replace(/^([ˈˌ]?)vən/, "$1væn");

    // del-/bel-/ben- Romance names: Cɪ → Cɛ before l/n (delancey, beland, benecke — stress-aware)
    if (/^[bd]el/.test(lowerWord) || lowerWord.startsWith("ben"))
      postBase = postBase.replace(/^([ˈˌ]?)([bd])ɪ([ˈˌ]?)([ln])/, "$1$2ɛ$3$4");

    // wal- prefix: wæl → wɑl (walcott, waldeck, waldorf — Germanic proper names)
    if (lowerWord.startsWith("wal"))
      postBase = postBase.replace(/^([ˈˌ]?)wæl/, "$1wɑl");

    // val- prefix: vəl → væl (valedictory, valentine, vallarta — stress-aware)
    if (lowerWord.startsWith("val"))
      postBase = postBase.replace(/^([ˈˌ]?)və([ˈˌ]?)l/, "$1væ$2l");

    // bal- prefix: bæl → bɑl (balboa, baldez, baldwin — not bala-/ball-)
    if (lowerWord.startsWith("bal") && !/^bal[al]/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)bæl/, "$1bɑl");

    // pal- prefix: pəl → pɑl (palladino, palmieri, palminteri — Spanish/Italian names)
    if (lowerWord.startsWith("pal"))
      postBase = postBase.replace(/^([ˈˌ]?)pəl/, "$1pɑl");

    // mc/mac+g names: məkɡ → məɡ (mcgarvey, macgowan, mcgaha — "c" silent before "g")
    if (/^m(?:c|ac)g/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)məkɡ/, "$1məɡ");

    // cam-/can-/cap-/cas- Italian/Spanish names: kə → kɑ before m/n/p/s (not cast-)
    if (/^ca[mnps]/.test(lowerWord) && !lowerWord.startsWith("cast"))
      postBase = postBase.replace(/^([ˈˌ]?)kə([ˈˌ]?)([mnps])/, "$1kɑ$2$3");

    // mas- prefix: məs → mɑs (masamilla, massucci — Italian/Japanese names)
    if (lowerWord.startsWith("mas"))
      postBase = postBase.replace(/^([ˈˌ]?)məs/, "$1mɑs");

    // cos- prefix (not cose/cosi): koʊs → kɑs (cosic, cosner, cosper, roscoe — short o)
    if (lowerWord.startsWith("cos") && !/^cos[ei]/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)koʊs/, "$1kɑs");

    // mon-/don- proper names (length>=6): XoʊnX → XɑnX (monaco, monahan, donald, donaghy, donahue)
    // Excludes mono-/moni- (Greek one-), donat- (donate)
    if (/^[dm]on/.test(lowerWord) && lowerWord.length >= 6 &&
        !lowerWord.startsWith("mono") && !lowerWord.startsWith("moni") && !lowerWord.startsWith("donat"))
      postBase = postBase.replace(/^([ˈˌ]?)([dm])oʊn/, "$1$2ɑn");

    // ros- proper names (length>=6, not rosa/rose/rosi): ɹoʊs → ɹɑs (roscoe, roskam, rosner, roslin)
    if (lowerWord.startsWith("ros") && lowerWord.length >= 6 && !/^ros[aei]/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)ɹoʊs/, "$1ɹɑs");

    // sok- Slavic names (length>=6): soʊk → sɑk (sokoloff, sokolov, sokolow, sokolin)
    if (lowerWord.startsWith("sok") && lowerWord.length >= 6)
      postBase = postBase.replace(/^([ˈˌ]?)soʊk/, "$1sɑk");

    // top- compound words (length>=6, not tope/topi): toʊp → tɑp (topology, topography, topsoil)
    if (lowerWord.startsWith("top") && lowerWord.length >= 6 && !/^top[ei]/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)toʊp/, "$1tɑp");

    // Italian/Spanish -ato/-ado/-amo suffix: əXoʊ → ɑXoʊ (amato, abbado, caccamo)
    if (/[admt]o$/.test(lowerWord))
      postBase = postBase.replace(/ə([dtm])oʊ$/, "ɑ$1oʊ");

    // Italian/Spanish -ano suffix: ænoʊ → ɑnoʊ (reitano, prezzano)
    if (lowerWord.endsWith("ano"))
      postBase = postBase.replace(/ænoʊ$/, "ɑnoʊ");

    // -ohl- Germanic names: ɑhl → oʊl (bohland, kohler, rohland — silent-h "oh" = /oʊ/)
    if (lowerWord.includes("ohl"))
      postBase = postBase.replace(/ɑhl/g, "oʊl");

    // -ahl- Germanic names: æhl → ɑl (stahl, dahl, ahlgren — silent-h "ah" = /ɑ/)
    if (lowerWord.includes("ahl"))
      postBase = postBase.replace(/æhl/g, "ɑl");

    // ober- names: əbɝ → oʊbɝ (oberbeck, oberlander, obermiller)
    if (lowerWord.startsWith("ober"))
      postBase = postBase.replace(/^([ˈˌ]?)əbɝ/, "$1oʊbɝ");

    // Xar- names: Xæɹ → Xɑɹ for b/f/h/m/n/r/t/v/w (baron, farago, haraway, maran, naron, tarheel, varon, warhurst)
    // Excludes bare/bari/mare/mari/vare/vari where native English /æɹ/ is correct
    if (/^[bfhmnrtvw]ar/.test(lowerWord) && !/^[bmv]ar[ei]/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)([bfhmnrtvw])æ([ˈˌ]?)ɹ/, "$1$2ɑ$3ɹ");

    // ex- before consonant: ɪks → ɛks (excellence, excavate, extant, exboyfriend)
    // Exclude exp- and exc+consonant (typically unstressed in those)
    if (lowerWord.startsWith("ex") && !/^ex[aeiou]/.test(lowerWord) &&
        !lowerWord.startsWith("exp") && (!lowerWord.startsWith("exc") || /^exc[aeiou]/.test(lowerWord)))
      postBase = postBase.replace(/^([ˈˌ]?)ɪks/, "$1ɛks");

    // tal-/ral- names: tæl → tɑl, ɹæl → ɹɑl (talula, talman, ralston — not tale/tali)
    if (lowerWord.startsWith("tal") && !/^tal[ei]/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)tæl/, "$1tɑl");
    if (lowerWord.startsWith("ral"))
      postBase = postBase.replace(/^([ˈˌ]?)ɹæl/, "$1ɹɑl");

    // -oni* Italian/Latin suffix: ənɪ(ə|ən|oʊ)? → oʊni(ə|ən|oʊ)?
    // -onian (andonian, estonian): ənɪən → oʊniən
    if (lowerWord.endsWith("onian"))
      postBase = postBase.replace(/ənɪən$/, "oʊniən");
    // -onio (antonio, petronio): ənɪoʊ → oʊnioʊ
    if (lowerWord.endsWith("onio"))
      postBase = postBase.replace(/ənɪoʊ$/, "oʊnioʊ");
    // -onia (antonia, ansonia, estonia): ənɪə → oʊniə
    if (lowerWord.endsWith("onia"))
      postBase = postBase.replace(/ənɪə$/, "oʊniə");
    // -oni (balboni, baroni, bertoni): ənɪ → oʊni
    if (lowerWord.endsWith("oni"))
      postBase = postBase.replace(/ənɪ$/, "oʊni");

    // Italian/Latin -o[consonant]i suffix: ə[C]ɪ → oʊ[C]i (oʊ preserved before single consonant)
    // -osi (kaposi, lugosi, cardosi): əsɪ → oʊsi
    if (lowerWord.endsWith("osi"))
      postBase = postBase.replace(/əsɪ$/, "oʊsi");
    // -omi (salomi, viscomi): əmɪ → oʊmi
    if (lowerWord.endsWith("omi"))
      postBase = postBase.replace(/əmɪ$/, "oʊmi");
    // -oti (livoti, sidoti): ətɪ → oʊti
    if (lowerWord.endsWith("oti"))
      postBase = postBase.replace(/ətɪ$/, "oʊti");
    // -oli (bartoli, bertoli, consoli): əlɪ → oʊli
    if (lowerWord.endsWith("oli"))
      postBase = postBase.replace(/əlɪ$/, "oʊli");
    // -olo (bartolo, consolo, dibartolo): əloʊ → oʊloʊ
    if (lowerWord.endsWith("olo"))
      postBase = postBase.replace(/əloʊ$/, "oʊloʊ");

    // Italian/Arabic -Xri suffix: ɝɪ → Xɹi (G2P treats -Xri as "-ary"-type rhotic)
    // -ari (ansari, atari, baccari, ferrari): ɝɪ → ɑɹi
    if (lowerWord.endsWith("ari"))
      postBase = postBase.replace(/ɝɪ$/, "ɑɹi");
    // -ori (kazunori, salvatori): ɝɪ → oʊɹi
    if (lowerWord.endsWith("ori"))
      postBase = postBase.replace(/ɝɪ$/, "oʊɹi");
    // -uri (arcuri, mercuri): ɝɪ → uɹi
    if (lowerWord.endsWith("uri"))
      postBase = postBase.replace(/ɝɪ$/, "uɹi");

    // Foreign -Xra suffix: ɝə → Xɹə (G2P treats -ra as rhotic; restore vowel+r)
    // -ara (mascara, carbonara, sahara): ɝə → ɑɹə
    if (lowerWord.endsWith("ara"))
      postBase = postBase.replace(/ɝə$/, "ɑɹə");
    // -ura (figura, collura, amdura): ɝə → uɹə
    if (lowerWord.endsWith("ura"))
      postBase = postBase.replace(/ɝə$/, "uɹə");
    // -era (avera, thera): ɝə → ɛɹə
    if (lowerWord.endsWith("era"))
      postBase = postBase.replace(/ɝə$/, "ɛɹə");

    // -ona Italian/Spanish suffix: ənə → oʊnə (barcelona, cremona, bivona — not winona/devona)
    if (lowerWord.endsWith("ona"))
      postBase = postBase.replace(/ənə$/, "oʊnə");

    // -ola Italian suffix: ələ → oʊlə (angola, agricola, amendola — not gondola/parabola)
    if (lowerWord.endsWith("ola"))
      postBase = postBase.replace(/ələ$/, "oʊlə");

    // colb- prefix: kɑlb → koʊlb (colbert, colbath, colbern, colburn)
    if (lowerWord.startsWith("colb"))
      postBase = postBase.replace(/^([ˈˌ]?)kɑlb/, "$1koʊlb");

    // German -eier/-eyer: eɪɝ → aɪɝ (altmeyer, beier, beckmeyer, billmeyer)
    if (/e[iy]er$/.test(lowerWord))
      postBase = postBase.replace(/eɪɝ$/, "aɪɝ");

    // Terminal -ai: eɪ → aɪ (altai, bandai, bonsai, barkai — not dalai/hyundai)
    if (lowerWord.endsWith("ai") && lowerWord.length >= 4)
      postBase = postBase.replace(/eɪ$/, "aɪ");

    // gian- Italian names: dʒɪæn → dʒɑn (gianni, giannini, giancarlo, giancola)
    if (lowerWord.startsWith("gian"))
      postBase = postBase.replace(/^([ˈˌ]?)dʒɪæn/, "$1dʒɑn");

    // bost- place names: boʊst → bɑst (boston, bostic, boster, bostrom — not bostick/bostock)
    if (lowerWord.startsWith("bost"))
      postBase = postBase.replace(/^([ˈˌ]?)boʊst/, "$1bɑst");

    // -owski/-ewski Polish names: oʊskɪ → ɔfski, uskɪ → ɛfski
    if (lowerWord.endsWith("owski"))
      postBase = postBase.replace(/oʊskɪ$/, "ɔfski");
    if (lowerWord.endsWith("ewski"))
      postBase = postBase.replace(/uskɪ$/, "ɛfski");

    // -owicz Polish names: oʊɪtʃ → əvɪtʃ (filipowicz, karpowicz, klimowicz)
    if (lowerWord.endsWith("owicz"))
      postBase = postBase.replace(/oʊɪtʃ$/, "əvɪtʃ");
    // -iewicz Polish names: juɪtʃ → əvɪtʃ (markiewicz, dutkiewicz, mazurkiewicz)
    if (lowerWord.endsWith("iewicz"))
      postBase = postBase.replace(/juɪtʃ$/, "əvɪtʃ");
    // -owitz Yiddish/Polish names: oʊɪts → əwɪts (berkowitz, horowitz, abramowitz)
    if (lowerWord.endsWith("owitz"))
      postBase = postBase.replace(/oʊɪts$/, "əwɪts");
    // -ucci Italian names: ʌtʃɪ → utʃi (gucci, balducci, gallucci, ferrucci)
    if (lowerWord.endsWith("ucci"))
      postBase = postBase.replace(/ʌtʃɪ$/, "utʃi");
    // eye- compound prefix: eɪɛ → aɪ (eyeball, eyebrow, eyecare, eyedrop, eyelash — eye=/aɪ/)
    if (lowerWord.startsWith("eye") && lowerWord.length >= 4)
      postBase = postBase.replace(/^([ˈˌ]?)eɪɛ/, "$1aɪ");
    // breath-/death- compounds: bɹiθ → bɹɛθ, diθ → dɛθ (breathtaking, deathwatch — ea=/ɛ/ before th)
    if (lowerWord.startsWith("breath"))
      postBase = postBase.replace(/bɹiθ/, "bɹɛθ");
    if (lowerWord.startsWith("death"))
      postBase = postBase.replace(/diθ/, "dɛθ");
    // -burgh surnames: restore final /ɡ/ (harrisburgh, rifenburgh, vanamburgh, aldeburgh)
    if (lowerWord.endsWith("burgh") && lowerWord.length >= 6)
      postBase = postBase.replace(/ɝ$/, "ɝɡ");
    // ah-C/ah$: æh[consonant] or word-final æh → ɑ (ahmad, brahman, fahd, blah — Arabic/Persian silent-h)
    if (/ah/.test(lowerWord))
      postBase = postBase.replace(/æh([bcdfgklmnpqrstvwxyz])/g, "ɑ$1").replace(/æh$/, "ɑ");
    // word-final əh → ə: silent h in Arabic/Hebrew names ending -ah (allah, abdallah, bismillah, mullah)
    if (lowerWord.endsWith("ah") && lowerWord.length >= 4)
      postBase = postBase.replace(/əh$/, "ə");
    // weigh-: waɪ → weɪ (weigh, weight, weightlifting — eigh silent gh)
    if (lowerWord.startsWith("weigh"))
      postBase = postBase.replace(/waɪ/, "weɪ");
    // aa- prefix: ɑɑɹ → ɑɹ (aardema, aardvark, aargh — Dutch/Afrikaans long-aa)
    if (lowerWord.startsWith("aa"))
      postBase = postBase.replace(/^([ˈˌ]?)ɑɑɹ/, "$1ɑɹ");
    // -bach German names: bæk|bək|bætʃ → bɑk (bach, steinbach, breitenbach, offenbach)
    if (lowerWord.endsWith("bach"))
      postBase = postBase.replace(/b(?:æk|ək|ætʃ)$/, "bɑk");
    // -auer German names: ɔɝ/əɝ → aʊɝ (bauer, brauer, bernauer, bierbauer)
    if (lowerWord.endsWith("auer"))
      postBase = postBase.replace(/[ɔə]ɝ$/, "aʊɝ");
    // -baum German compound: bəm → baʊm (birnbaum, elbaum, rosenbaum, feigenbaum)
    if (lowerWord.endsWith("baum") && lowerWord.length >= 5)
      postBase = postBase.replace(/bəm$/, "baʊm");
    // -haus German compound: həs → haʊs (backhaus, feldhaus, steinhaus, neuhaus)
    if (lowerWord.endsWith("haus") && lowerWord.length >= 5)
      postBase = postBase.replace(/həs$/, "haʊs");
    // -hoff/-hof German compound: həf → hɔf (birkhoff, mehlhoff, kirchhoff, schulhof)
    if (/hof{1,2}$/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/həf$/, "hɔf");
    // Italian -ell*: ɝ → ɔɹ (borelli, carelli, arabella, fiorello — Italian or/ar)
    if (/el{1,2}[ioa]$/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/ɝ/g, "ɔɹ");
    // Italian/Spanish -aro: ɝ → ɔɹ (alfaro, alvaro, amaro, arcaro — Spanish/Italian ar)
    if (lowerWord.endsWith("aro") && lowerWord.length >= 5)
      postBase = postBase.replace(/ɝ/g, "ɔɹ");
    // Italian/Spanish -oria/-orio/-orial/-orian/-ario/-oriander: ɝ([ˈˌ]?)ɪ → ɔɹ$1ɪ
    // (astoria, euphoria, memorial, editorial, historian, mario, rosario, coriander)
    if ((/ori[ao][ln]?$/.test(lowerWord) || lowerWord.endsWith("ario")
        || lowerWord.endsWith("oriander")) && lowerWord.length >= 6)
      postBase = postBase.replace(/ɝ([ˈˌ]?)ɪ/, "ɔɹ$1ɪ");
    // chia- Italian names: tʃɪ[ɝæəɑ] → kiɑ (chianti, chiarella, chiappetta, chiavetta)
    // Exclude: chiapas (Spanish), chiasso/chiasson (Swiss/French), chiang (Chinese), chiat
    if (lowerWord.startsWith("chia") && lowerWord.length >= 5
        && !/^(chiapas|chiass|chiang|chiat)/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)tʃɪ[ɝæəɑ]/, "$1kiɑ");
    // schia- Italian names: ʃɪæ → skiɑ (schiavo, schiavi, schiappa, schiavone)
    if (lowerWord.startsWith("schia"))
      postBase = postBase.replace(/^([ˈˌ]?)ʃɪæ/, "$1skiɑ");
    // ros- Italian/German names: ɹəs → ɹoʊz (rossetti, rosselli, rosenberger, roseville)
    if (lowerWord.startsWith("ros") && lowerWord.length >= 5)
      postBase = postBase.replace(/^([ˈˌ]?)ɹəs/, "$1ɹoʊz");
    // -oire French names: ɔɪɹə → wɑɹ (repertoire, armoire, victoire, gregoire)
    if (lowerWord.endsWith("oire") && lowerWord.length >= 5)
      postBase = postBase.replace(/ɔɪɹə$/, "wɑɹ");
    // -ero Spanish/Italian names: ɪɹoʊ → ɛɹoʊ (ferrero, herrero, calogero, ibero)
    // Exclude -hero (superhero) which uses /hɪɹoʊ/ not Spanish /ɛɹoʊ/
    if (lowerWord.endsWith("ero") && lowerWord.length >= 5 && !lowerWord.endsWith("hero"))
      postBase = postBase.replace(/ɪɹoʊ$/, "ɛɹoʊ");
    // Spanish -ez patronymics: final əz → ɛz (lopez, enriquez, alvidrez, avilez)
    if (lowerWord.endsWith("ez") && lowerWord.length >= 4)
      postBase = postBase.replace(/əz$/, "ɛz");
    // -ois French names: ɔɪs → wɑ (brisbois, gadbois, valois, salois)
    // Exclude -uois (iroquois → /kwɔɪs/ produces double-w artifact)
    if (lowerWord.endsWith("ois") && lowerWord.length >= 5 && !lowerWord.endsWith("uois"))
      postBase = postBase.replace(/ɔɪs$/, "wɑ");
    // -eux French names: juks → oʊ (lamoreux, leleux, mayeux, veilleux)
    if (lowerWord.endsWith("eux") && lowerWord.length >= 5)
      postBase = postBase.replace(/juks$/, "oʊ");
    // -dieux French names: iəks → joʊ (cadieux, gladieux)
    if (lowerWord.endsWith("dieux") && lowerWord.length >= 6)
      postBase = postBase.replace(/iəks$/, "joʊ");
    // -ieux French names (non-dieux): iəks → ju (lemieux, merieux)
    else if (lowerWord.endsWith("ieux") && lowerWord.length >= 5)
      postBase = postBase.replace(/iəks$/, "ju");
    // -where compound: hwɪɹ → wɛɹ (anywhere, elsewhere, everywhere, nowhere — wh→w in compounds)
    if (lowerWord.endsWith("where") && lowerWord.length >= 6)
      postBase = postBase.replace(/hwɪɹ$/, "wɛɹ");
    // -whelm compound: hwəm → wɛlm (overwhelm, underwhelm — wh→w in compounds)
    if (lowerWord.endsWith("whelm") && lowerWord.length >= 6)
      postBase = postBase.replace(/hwəm$/, "wɛlm");
    // -while compound: hwɪl → waɪl (awhile, meanwhile, worthwhile, erstwhile — wh→w in compounds)
    if (lowerWord.endsWith("while") && lowerWord.length >= 6)
      postBase = postBase.replace(/hwɪl$/, "waɪl");
    // -well compound names: uəl/wəl/oʊəl → wɛl (bakewell, bracewell, caldwell, honeywell)
    // Exclude: ho/lo/no/po/cr/mc/mac/ro-well (howell, lowell, nowell, powell, crowell, mcdowell)
    // and n/s/j/e-ewell (newell, sewell, jewell)
    if (lowerWord.endsWith("well") && lowerWord.length >= 6
        && !/^[nsje]ewell$/.test(lowerWord)
        && !/^(ho|lo|no|po|cr|mc|mac|ro)/.test(lowerWord))
      postBase = postBase.replace(/(?:uəl|wəl|oʊəl)$/, "wɛl");

    // bau[rmdl]- German surnames: bɔ/bəm → baʊ/baʊm (bauman, baumberger, baumgartner, bauder)
    if (/^bau[rmdl]/.test(lowerWord) && lowerWord.length >= 5) {
      postBase = postBase.replace(/^([ˈˌ]?)bɔ/, "$1baʊ");
      postBase = postBase.replace(/^([ˈˌ]?)bəm/, "$1baʊm");
    }
    // -thouse compound: ðaʊs → thaʊs (boathouse, lighthouse, outhouse, hothouse, guesthouse)
    if (lowerWord.endsWith("thouse") && lowerWord.length >= 7)
      postBase = postBase.replace(/ðaʊs$/, "thaʊs");
    // German -enstein: ɛnstaɪn → ənstaɪn (frankenstein, eisenstein, fleckenstein, grabenstein)
    if (lowerWord.endsWith("enstein") && lowerWord.length >= 8)
      postBase = postBase.replace(/ɛnstaɪn$/, "ənstaɪn");
    // -worth compound: tuɹθ → twɝθ (networth, wentworth, whitworth, atworth, klintworth)
    if (lowerWord.endsWith("worth") && lowerWord.length >= 6)
      postBase = postBase.replace(/tuɹθ$/, "twɝθ");
    // -sworth compound: swɝθ → zwɝθ (ellingsworth, hollingsworth, haynesworth, bloodsworth)
    if (lowerWord.endsWith("sworth") && lowerWord.length >= 7)
      postBase = postBase.replace(/swɝθ$/, "zwɝθ");
    // -enberry compound: ɛnbɛɹi → ənbɛɹi (christenberry, frankenberry, faulkenberry, eikenberry)
    if (lowerWord.endsWith("enberry") && lowerWord.length >= 8)
      postBase = postBase.replace(/ɛnbɛɹi$/, "ənbɛɹi");
    // German -en- schwa reduction: -enmann/-enfield/-enbach (eisenmann, battenfield, eisenbach)
    if (/en(?:mann|field|bach)$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/ɛn(mən|fild|bɑk)$/, "ən$1");
    // German -nberg/-enburg: ɪnbɝɡ → ənbɝɡ (eisenberg, greenberg, katzenberg; ellenburg, dillenburg)
    if ((lowerWord.endsWith("nberg") || lowerWord.endsWith("enburg")) && lowerWord.length >= 6)
      postBase = postBase.replace(/ɪnbɝɡ$/, "ənbɝɡ");
    // -eman compound: remove epenthetic ɪ before mən (bakeman, baseman, bergeman, bridgeman, addleman)
    if (lowerWord.endsWith("eman") && lowerWord.length >= 6)
      postBase = postBase.replace(/(tʃ|dʒ|[bdfɡhklmnpɹstvwzʃʒ])ɪmən$/, "$1mən");
    // -ville: remove epenthetic vowel before stressed vɪl (abbeville, belleville, charlotteville)
    if (lowerWord.endsWith("ville") && lowerWord.length >= 6)
      postBase = postBase.replace(/[ɪi]v([ˈˌ]?)ɪl$/, "v$1ɪl");
    // -lough: ɫ(ə|ʌ)f → ɫaʊ (fairclough, clough, blough, carlough; plough, lough)
    if (lowerWord.endsWith("lough") && lowerWord.length >= 4)
      postBase = postBase.replace(/l([ˈˌ]?)[əʌ]f$/, "l$1aʊ");
    // -rrett/-rett: ɹɪt → ɹɪt — final schwa → lax-I (barrett, garrett, berrett, marrett)
    if (/r{1,2}ett$/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/ɹ([ˈˌ]?)ət$/, "ɹ$1ɪt");
    // -ley compound: leɪ → li (begley, presley, barclay-style -ley names)
    if (lowerWord.endsWith("ley") && lowerWord.length >= 5)
      postBase = postBase.replace(/leɪ$/, "li");
    // -chester: tʃɪstɝ → tʃɛstɝ (manchester, winchester, chichester, dorchester)
    if (lowerWord.endsWith("chester") && lowerWord.length >= 8)
      postBase = postBase.replace(/tʃɪstɝ$/, "tʃɛstɝ");
    // -cester/-caster: sɪstɝ → stɝ (worcester, leicester, glocester)
    if (/c(?:e|a)ster$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/sɪstɝ$/, "stɝ");
    // -mouth place compound: maʊθ → məθ (dartmouth, portsmouth, falmouth, plymouth)
    if (lowerWord.endsWith("mouth") && lowerWord.length >= 7)
      postBase = postBase.replace(/maʊθ$/, "məθ");
    // -head compound: hid → hɛd (bridgehead, bullhead, conehead, horsehead, moosehead)
    if (lowerWord.endsWith("head") && lowerWord.length >= 6)
      postBase = postBase.replace(/hid$/, "hɛd");
    // -sberg: sbɝɡ → zbɝɡ (kanegsberg, kongsberg — voiced /zb/ cluster)
    if (lowerWord.endsWith("sberg") && lowerWord.length >= 7)
      postBase = postBase.replace(/sbɝɡ$/, "zbɝɡ");
    // -wick: oʊ[sd]wɪk → ɑ[sd]wɪk (goswick, joswick, lodwick)
    if (lowerWord.endsWith("wick") && lowerWord.length >= 7)
      postBase = postBase.replace(/oʊ([sd])wɪk$/, "ɑ$1wɪk");
    // short-ea compounds: id→ɛd (homestead, whitebread, widespread) and iθ→ɛθ (colebreath)
    if (/(?:bread|spread|stead)$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/id$/, "ɛd");
    if (lowerWord.endsWith("breath") && lowerWord.length >= 8)
      postBase = postBase.replace(/iθ$/, "ɛθ");
    // -woman compound: wəmən → wʊmən (councilwoman)
    if (lowerWord.endsWith("woman") && lowerWord.length >= 8)
      postBase = postBase.replace(/wəmən$/, "wʊmən");
    // German -ei[gnf]er surnames: eɪ→aɪ (geiger, kreiger, reiger; reiner; heifer, schleifer)
    if (/ei[gnf]er$/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/eɪ([ˈˌ]?)([ɡnf])ɝ$/, "aɪ$1$2ɝ");
    // German -inger surnames with ei stem: eɪ[ndm]ɪŋɝ→aɪ[ndm]ɪŋɝ (breininger, deininger, meidinger)
    if (lowerWord.endsWith("inger") && lowerWord.length >= 7)
      postBase = postBase.replace(/eɪ([ˈˌ]?)([ndm])ɪŋɝ$/, "aɪ$1$2ɪŋɝ");
    // German -eid- surnames: eɪd→aɪd (freidel, freidman, geidel, heidel, weidemann)
    if (/eid/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/eɪd/, "aɪd");
    // German -eib- surnames: eɪb→aɪb (deibel, deibert, geibel, kleiber, neibauer)
    if (/eib/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/eɪb/, "aɪb");
    // German -eis- surnames: eɪs→aɪs (beisel, deiss, feist, reiss, weiss)
    if (/eis/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/eɪs/, "aɪs");
    // German -reit- surnames: ɹeɪt→ɹaɪt (freitag, kreitzer, kreitman, reitan)
    if (/reit/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/ɹeɪt/, "ɹaɪt");
    // German -eig- surnames (not -eigh Irish or -eiga Romance): eɪɡ→aɪɡ (beigel, geigle, schweigert, lickteig)
    if (/eig/.test(lowerWord) && !/eigh/.test(lowerWord) && !/eiga/.test(lowerWord))
      postBase = postBase.replace(/eɪɡ/, "aɪɡ");
    // German -rein- surnames: ɹeɪn→ɹaɪn (amrein, breining, reindel, reinert, reinig)
    if (/rein/.test(lowerWord) && lowerWord.length >= 6 && !/reina/.test(lowerWord))
      postBase = postBase.replace(/ɹeɪn/, "ɹaɪn");
    // German -eil- surnames (not French -oleil / Irish -eill?ey / veil-): eɪl→aɪl (beilfuss, corbeil, kurzweil, marseille)
    if (/eil/.test(lowerWord) && lowerWord.length >= 5
        && !/oleil$/.test(lowerWord) && !/eill?[eo]?y$/.test(lowerWord) && !/veil/.test(lowerWord))
      postBase = postBase.replace(/eɪl/, "aɪl");
    // German -eim- surnames (not Japanese -eimi): eɪm→aɪm (beim, geimer, kleiman, kreimer, reiman, feimster)
    if (/eim/.test(lowerWord) && lowerWord.length >= 4 && !/eimi$/.test(lowerWord))
      postBase = postBase.replace(/eɪm/, "aɪm");
    // German -eith- surnames: eɪð→aɪð (either, neither, reither, seither)
    if (/eith/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/eɪð/, "aɪð");
    // German -ei[zv]- surnames: eɪ[zv]→aɪ[zv] (keizer, seivert)
    if (/ei[zv]/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/eɪ([zv])/, "aɪ$1");
    // German -eif- surnames: eɪf→aɪf (peiffer, seifert, schleif, zweifel)
    if (/eif/.test(lowerWord) && lowerWord.length >= 4)
      postBase = postBase.replace(/eɪf/, "aɪf");
    // German -eisch- surnames (not -eisha Japanese): eɪʃ→aɪʃ (fleisch, fleischer, breisch, deisher)
    if (/eisc?h/.test(lowerWord) && lowerWord.length >= 5 && !lowerWord.endsWith("a"))
      postBase = postBase.replace(/eɪʃ/, "aɪʃ");
    // German -eier- surnames: eɪɝ→aɪɝ (beierle, reierson)
    if (/eier/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/eɪɝ/, "aɪɝ");
    // German -eik- surnames (not Japanese -ki/-ko): eɪk→aɪk (deikel, schweikert, streiker)
    if (/eik/.test(lowerWord) && lowerWord.length >= 4 && !/k[io]$/.test(lowerWord))
      postBase = postBase.replace(/eɪk/, "aɪk");
    // German -eind- surnames: eɪnd→aɪnd (burfeind)
    if (/eind/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/eɪnd/, "aɪnd");
    // -iger surnames: hard /ɡ/ not soft (feiger, seiger)
    if (lowerWord.endsWith("iger") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)dʒɝ$/, "$1ɡɝ");
    // -ge[rs]on/en surnames: hard /ɡ/ not soft (borgeson, burgeson, fergeson, helgesen)
    if (/g[ei]s[eo]n$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/dʒ([ˈˌ]?)ɪs([əɪ])n$/, "ɡ$1ɪs$2n");
    // -lger surnames: hard /ɡ/ not soft (bilger, bulger, dilger, felger — not bolger/folger)
    if (lowerWord.endsWith("lger") && lowerWord.length >= 6)
      postBase = postBase.replace(/ldʒɝ$/, "lɡɝ");
    // German -wald: wəld→wɔld (edwald, gruenwald)
    if (/wald$/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/wə([ˈˌ]?)ld$/, "wɔ$1ld");
    // German -eit- surnames (not reit/feit/reitera/-a endings): eɪt→aɪt (deitch, deitrich, geitz, schweitzer)
    if (/eit/.test(lowerWord) && !/reit/.test(lowerWord) && !/feit/.test(lowerWord)
        && !/reitera/.test(lowerWord) && !lowerWord.endsWith("a") && lowerWord.length >= 4)
      postBase = postBase.replace(/eɪt/, "aɪt");
    // -elman compound surnames: ɛlmən→əlmən (adelman, appelman, bockelman, begelman)
    if (lowerWord.endsWith("elman") && lowerWord.length >= 7)
      postBase = postBase.replace(/ɛl([ˈˌ]?)mən$/, "əl$1mən");
    // -elmann compound surnames (German double-n): ɛlmən→əlmən (adelmann, kieselmann)
    if (lowerWord.endsWith("elmann") && lowerWord.length >= 8)
      postBase = postBase.replace(/ɛl([ˈˌ]?)mən$/, "əl$1mən");
    // -el[std]on/en surnames: ɛl→əl (adelson, hazelton, berthelsen, cannelton)
    if (/el[std](?:on|en)$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/ɛl([ˈˌ]?)([std])ən$/, "əl$1$2ən");
    // Scandinavian -[ae]nsen: [æɛ]nsən→ənsən (christiansen, clemensen, kristiansen)
    if (/[ae]nsen$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/[æɛ]nsən$/, "ənsən");
    // Greek -opolis: oʊpəɫɪs→ɑpəɫəs (acropolis, heliopolis, megalopolis)
    if (lowerWord.endsWith("opolis") && lowerWord.length >= 7)
      postBase = postBase.replace(/oʊpəl([ˈˌ]?)ɪs$/, "ɑpəl$1əs");
    // accu- (not accust-): ækə→ækju (accurate, accumulate, accuhealth)
    if (lowerWord.startsWith("accu") && !/^accust/.test(lowerWord))
      postBase = postBase.replace(/^([ˈˌ]?)æk([ˈˌ]?)ə/, "$1æk$2ju");
    // andro- Greek prefix: ændɹə→ændɹɑ before non-s/z/n/ɹ (androgynous, andrada, andropov)
    if (/andr/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/ændɹ([ˈˌ]?)ə([^szɹn])/, "ændɹ$1ɑ$2");
    // bren-/pren-/ren- Germanic names: ɹɪn→ɹɛn (brendlinger, prendergast, rensberger)
    if (/^[bp]?ren/.test(lowerWord) && lowerWord.length >= 5 && !/rene$|rena$/.test(lowerWord))
      postBase = postBase.replace(/([bp]?)ɹ([ˈˌ]?)ɪn/, "$1ɹ$2ɛn");
    // German -ager/-eger surnames: əɡɝ→eɪɡɝ (bontrager, borntrager, loudenslager)
    if (/[ae]ger$/.test(lowerWord) && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)ɡɝ$/, "$1eɪ$2ɡɝ");
    // German -feld surnames: əld→ɛld (neufeld, rubenfeld, meierfeld)
    if (lowerWord.endsWith("feld") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)ld$/, "$1ɛ$2ld");
    // -acey surnames: æsi→eɪsi (bracey, dacey, gracey, lacey)
    if (lowerWord.endsWith("acey") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)si$/, "$1eɪ$2si");
    // -aney surnames (not mc-): æni→eɪni (baney, blaney, chaney, franey)
    if (lowerWord.endsWith("aney") && lowerWord.length >= 5 && !/^mc/.test(lowerWord))
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)ni$/, "$1eɪ$2ni");
    // German/surname -eger/-rger/-lger/-uger/-oger: soft-dʒ→hard-ɡ (berger, bulger, auger, boger)
    if ((lowerWord.endsWith("eger")
        || (lowerWord.endsWith("rger") && !/(?:larger|charger|merger|barger|forger|gorger|sparger|urger)$/.test(lowerWord))
        || (lowerWord.endsWith("lger") && !lowerWord.endsWith("alger"))
        || (lowerWord.endsWith("uger") && !/(?:gauger|gouger)$/.test(lowerWord))
        || lowerWord.endsWith("oger"))
        && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)dʒ([ˈˌ]?)ɝ$/, "$1ɡ$2ɝ");
    // ge+specific initial: hard-g for gear*/gee[^z]*/geb[^bi]*/gecko (not gean/geez/gebbia/geck)
    if (/^ge(?:ar|e[^z]|b[^bi]|ck.)/.test(lowerWord) && lowerWord.length >= 4)
      postBase = postBase.replace(/^([ˈˌ]?)dʒ/, "$1ɡ");
    // German/surname -rgen/-agen/-ugen/-eigen: dʒ→ɡ (borgen, beagen, dagen, jurgen, mergen)
    if ((/rgen$/.test(lowerWord) || /(?:agen|ugen|eigen)$/.test(lowerWord))
        && lowerWord.length >= 5
        && !/(?:hydrogen|allergen|antigen|carcinogen|nitrogen|oxygen|estrogen|pathogen)$/.test(lowerWord))
      postBase = postBase.replace(/([ˈˌ]?)dʒ([ˈˌ]?)[əɛɪiuoʊæɑ]n$/, "$1ɡ$2ən");
    // German blech-/brech-/drech-/buch- compounds: ch=/k/ (blecher, brecher, buchwald, buchsbaum)
    if ((/^(?:blech[^a]|blech$|brech|drech|frech|grech)/.test(lowerWord) && lowerWord.length >= 5)
        || (/^buch/.test(lowerWord) && lowerWord.length >= 7 && !/^buchanan/.test(lowerWord)))
      postBase = postBase.replace(/tʃ/g, "k");
    // Polish -inski: dʒ→ɡ before ɪnski (baginski, roginski)
    if (lowerWord.endsWith("inski") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)dʒ([ˈˌ]?)[ɪi]([ˈˌ]?)nsk[iɪ]$/, "$1ɡ$2ɪ$3nskɪ");
    // German oh+consonant: silent-H long-O (bohn/blohm/rohde/lohse/kohtaro/rohwer)
    if (/oh[lmnsdtkfw]/.test(lowerWord) && lowerWord.length >= 5
        && !/^john/.test(lowerWord) && !/^johso/.test(lowerWord))
      postBase = postBase.replace(/([ˈˌ]?)ɑh([lmnsdtkfw])/g, "$1oʊ$2");
    // Italian -aldo: æɫdoʊ→ɑɫdoʊ (castaldo, cataldo, renaldo, reynaldo)
    if (lowerWord.endsWith("aldo") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)ldoʊ$/, "$1ɑ$2ldoʊ");
    // Polish/Slavic phoneme fixes for names ending in -ski/-ewski/-owski etc.
    if (/(?:ski|sky|wski|ewski|owski|anski|inski|ynski|arski|erski|orski|urski)$/.test(lowerWord)
        && lowerWord.length >= 7) {
      // j→/j/: orthographic 'j' is /j/ not /dʒ/ (jakubowski, bojarski, lijewski)
      if (lowerWord.includes("j")) {
        if (/^j/.test(lowerWord))
          postBase = postBase.replace(/^([ˈˌ]?)dʒ/, "$1j");
        postBase = postBase.replace(/([əɪiuoʊæɑɔɛeaɝɜ])([ˈˌ]?)dʒ([əɪiuoʊæɑɔɛeaɝɜ])/g, "$1$2j$3");
      }
      // sz→ʃ: Polish digraph 'sz' = /ʃ/; stress mark may split s and z in IPA output
      if (lowerWord.includes("sz"))
        postBase = postBase.replace(/s([ˈˌ]?)z/g, "$1ʃ");
      // -cinski: Polish 'ci' before '-nski' = /tʃ/ (kocinski, kapuscinski, rucinski)
      if (lowerWord.endsWith("cinski"))
        postBase = postBase.replace(/([ˈˌ]?)sɪ([ˈˌ]?)nsk/, "$1stʃɪ$2nsk");
      // cz→/tʃ/: Polish digraph (kaczorowski, malczewski, wilczewski)
      if (lowerWord.includes("cz"))
        postBase = postBase.replace(/k([ˈˌ]?)z/g, "tʃ");
      // ci-initial→/tʃɪ/: word-initial 'ci' in Polish = /tʃɪ/ (ciborowski, cisewski)
      if (/^ci/.test(lowerWord))
        postBase = postBase.replace(/^([ˈˌ]?)sɪ/, "$1tʃɪ");
      // aj→/aɪ/: Polish diphthong (gajewski, krajewski, majewski)
      if (lowerWord.includes("aj"))
        postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)j/g, "$1aɪ$2");
      // ej→/eɪ/: Polish diphthong (blazejewski, mierzejewski)
      if (lowerWord.includes("ej"))
        postBase = postBase.replace(/([ˈˌ]?)[ɪi]([ˈˌ]?)j/g, "$1eɪ$2");
    }
    // German bau- surnames: initial schwa-reduction corrected (baumeister, bauserman, baucum)
    if (/^bau/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/^([ˈˌ]?)bə/, "$1baʊ");
    // German au- initial (auk-/aus-/auz-): ə→aʊ in reduced first syllable (aukerman, ausherman)
    if (/^au[kszb]/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)ə/, "$1aʊ");
    // German -linger surnames: schwa before -lɪŋɝ→oʊ (bolinger, dolinger, solinger)
    if (lowerWord.endsWith("linger") && lowerWord.length >= 7 && !/^ol/.test(lowerWord))
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)lɪŋɝ$/, "$1oʊ$2lɪŋɝ");
    // German -stein with consonant+o start: initial ə→oʊ (bodenstein, doberstein, koberstein)
    if (lowerWord.endsWith("stein") && /^[bcdfgklmnpqrstvwxz]o(?!b{2})/.test(lowerWord) && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)([bcdfgkmnpqrstvwxzɡɹ])([ˈˌ]?)ə/, "$1$2$3oʊ");
    // German -enbach: initial vowel corrections (kallenbach→kæ, hollenbach→hɑ, aschenbach→æʃ)
    if (lowerWord.endsWith("enbach") && lowerWord.length >= 8) {
      if (/^ka/.test(lowerWord)) postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ə/, "$1k$2æ");
      else if (/^[rh]o/.test(lowerWord)) postBase = postBase.replace(/^([ˈˌ]?)([ɹh])([ˈˌ]?)ə/, "$1$2$3ɑ");
      else if (/^bo/.test(lowerWord)) postBase = postBase.replace(/^([ˈˌ]?)b([ˈˌ]?)ə/, "$1b$2ɑ");
      else if (/^asc/.test(lowerWord)) postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)ʃ/, "$1æ$2ʃ");
    }
    // -stair surnames: stɝ→stɛɹ (alistair, alastair, westair)
    if (lowerWord.endsWith("stair") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)stɝ$/, "$1stɛɹ");
    // aero-/euro-/retro- compound prefix: unstressed -o- = /oʊ/ not /ə/
    if (/^aero/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ɛ([ˈˌ]?)ɹə/, "$1ɛ$2ɹoʊ");
    if (/^euro/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)juɹə/, "$1juɹoʊ");
    if (/^retro/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/^([ˈˌ]?)ɹɛtɹə/, "$1ɹɛtɹoʊ");
    // Italian -osio names: ə before -sio suffix = /oʊ/ (ambrosio, agnosio, collosio)
    if (lowerWord.endsWith("osio") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)sɪoʊ$/, "$1oʊ$2sioʊ");
    // Spanish/Italian al+Ca initial: əl→ɑl (alcantara, almanza, altamira, albarado)
    if (/^al[bcdfgklmnpqrstvwxz]a/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)l/, "$1ɑ$2l");
    // Italian Co+C+etti/-elli: medial ə→oʊ before suffix consonant (bonetti, coletti, rosetti, bonelli, covelli)
    if (/[bcdfgklmnpqrstvwxz]o[bcdfgklmnpqrstvwxz]etti$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)(l|[bcdfgkmnpqrstvwxzɡɹ])([ˈˌ]?)ɛtɪ$/, "$1oʊ$2$3$4ɛti");
    if (/[bcdfgklmnpqrstvwxz]o[bcdfgklmnpqrstvwxz]elli$/.test(lowerWord) && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)(l|[bcdfgkmnpqrstvwxzɡɹ])([ˈˌ]?)ɛlɪ$/, "$1oʊ$2$3$4ɛli");
    // German -enberger/-enburger: medial ɪn→ən before -bɝɡɝ (brandenberger, eisenberger, frankenberger)
    if ((lowerWord.endsWith("enberger") || lowerWord.endsWith("enburger")) && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)bɝɡɝ$/, "$1ə$2n$3bɝɡɝ");
    // German -erich surnames: ɪɹɪk→ɝɪk (berberich, helmerich, emmerich, dieterich)
    if (lowerWord.endsWith("erich") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ɹɪk$/, "$1ɝ$2ɪk");
    // Italian o+C+ello/-ella: medial ə→oʊ before suffix consonant (bonello, covello, novello, rosella, donella)
    if (/o[bcdfgklmnpqrstvwxz]ello$/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)(l|[bcdfgkmnpqrstvwxzɡɹ])([ˈˌ]?)ɛloʊ$/, "$1oʊ$2$3$4ɛloʊ");
    if (/o[bcdfgklmnpqrstvwxz]ella$/.test(lowerWord) && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)(l|[bcdfgkmnpqrstvwxzɡɹ])([ˈˌ]?)ɛlə$/, "$1oʊ$2$3$4ɛlə");
    // Spanish/Italian -osa/-oso: penultimate o reduced to ə → oʊ (barbosa, formosa, cardoso, barroso)
    if (lowerWord.endsWith("osa") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)s([ˈˌ]?)ə$/, "$1oʊ$2s$3ə");
    if (lowerWord.endsWith("oso") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)s([ˈˌ]?)oʊ$/, "$1oʊ$2s$3oʊ");
    // -phone compound: pre-phone vowel reduces to ə (microphone, xylophone, megaphone, saxophone)
    if (lowerWord.endsWith("phone") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)(oʊ|ɑ|æ|ɛ)([ˈˌ]?)f([ˈˌ]?)oʊn$/, "$1ə$3f$4oʊn");
    // Italian -ione surnames: add final /i/ (campione, mangione, forgione, stanzione)
    if (lowerWord.endsWith("ione") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)oʊn$/, "$1i$2oʊni");
    // Italian -ori surnames: oʊɹi→ɔɹi (sartori, gregori, komori, hattori)
    if (lowerWord.endsWith("ori") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)ɹ([ˈˌ]?)i$/, "$1ɔ$3ɹ$4i");
    // Spanish/Italian -era surnames: ɪɹə→ɛɹə (carrera, ranchera, cabrera, herrera)
    if (lowerWord.endsWith("era") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)ə$/, "$1ɛ$2ɹ$3ə");
    // Italian -eri surnames: ɪɹɪ→ɛɹi (balistreri, guarneri, ferreri, palmeri)
    if (lowerWord.endsWith("eri") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)ɪ$/, "$1ɛ$2ɹ$3i");
    // Italian -iero suffix: iɹoʊ→iɛɹoʊ (alfiero, cafiero, financiero)
    if (lowerWord.endsWith("iero") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)i([ˈˌ]?)ɹ([ˈˌ]?)oʊ$/, "$1i$2ɛɹ$3oʊ");
    // French -eault surnames: drop final lt (breault, deneault, guilbeault, rheault)
    if (lowerWord.endsWith("eault") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)l([ˈˌ]?)t$/, "$1oʊ");
    // -oville compounds: restore oʊ before vɪl$ (coville, scoville, loville)
    if (lowerWord.endsWith("oville") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)v([ˈˌ]?)ɪl$/, "$1oʊ$2v$3ɪl");
    // -rine: reduce aɪn→in in unstressed final syllable (doctrine, ephedrine, figurine, fluorine, latrine)
    // Exclude -crine (endocrine, exocrine) where -crine carries stress and keeps /aɪn/
    if (lowerWord.endsWith("rine") && !lowerWord.endsWith("crine") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɹ([ˈˌ]?)aɪn$/, "$1ɹ$2in");
    // -stine: reduce taɪn→tin (clandestine, ernestine, philistine, predestine, bridenstine)
    if (lowerWord.endsWith("stine") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)t([ˈˌ]?)aɪn$/, "$1t$2in");
    // -adian demonyms: ə→eɪ before dɪən$ (arcadian, akkadian, canadian, circadian)
    if (lowerWord.endsWith("adian") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)ən$/, "$1eɪ$2d$3ɪ$4ən");
    // -anian demonyms: ə→eɪ before nɪən$ (albanian, romanian, jordanian, tanzanian)
    if (lowerWord.endsWith("anian") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)ɪ([ˈˌ]?)ən$/, "$1eɪ$2n$3ɪ$4ən");
    // -alian demonyms: əlɪən→eɪlɪən$ (australian, mammalian)
    if (lowerWord.endsWith("alian") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)l([ˈˌ]?)ɪ([ˈˌ]?)ən$/, "$1eɪ$2l$3ɪ$4ən");
    // -onian: initial ə→æ before m/p (amazonian, apollonian)
    if (lowerWord.endsWith("onian") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)(m|p)/, "$1æ$2$3");
    // -esian: sɪən→ʒən (artesian, cartesian, indonesian, polynesian, rhodesian)
    if (lowerWord.endsWith("esian") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)ən$/, "$1ʒ$2ən");
    // -atian demonyms: ətɪən→eɪʃən (alsatian, dalmatian, sarmatian)
    if (lowerWord.endsWith("atian") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)ən$/, "$1eɪ$2ʃ$3ən");
    // -sian demonyms: əsɪən→eɪʒən (caucasian)
    if (lowerWord.endsWith("sian") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)ən$/, "$1eɪ$2ʒ$3ən");
    // -urian: ɝɪən→ʊɹiən (arthurian, timurian, venturian)
    if (lowerWord.endsWith("urian") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɝ([ˈˌ]?)ɪ([ˈˌ]?)ən$/, "$1ʊɹ$2iən");
    // -sory: ɔɹi→ɝi (compulsory, extrasensory)
    if (lowerWord.endsWith("sory") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ɔ([ˈˌ]?)ɹi$/, "$1ɝi");
    // -ery: ɛri→ɝi when r is ASCII (brewery, drewery, towery, microbrewery)
    if (lowerWord.endsWith("ery") && lowerWord.length >= 5)
      postBase = postBase.replace(/ɛri$/, "ɝi");
    // -ationary: æʃ→eɪʃ (stationary, deflationary, inflationary)
    if (lowerWord.endsWith("ationary") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)ʃ([ˈˌ]?)ənɛɹi$/, "$1eɪ$2ʃ$3ənɛɹi");
    // -atiate: æʃi→eɪʃi (ingratiate)
    if (lowerWord.includes("atiat") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)ʃi/, "$1eɪ$2ʃi");
    // -usionary: ʌsɪənɛɹi→uʒənɛɹi (illusionary, exclusionary) — run before -sionary
    if (lowerWord.endsWith("usionary") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ʌ([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)ənɛɹi$/, "$1u$2ʒ$3ənɛɹi");
    // -sionary: sɪənɛɹi→ʃənɛɹi (concessionary, recessionary, expansionary, visionary)
    if (lowerWord.endsWith("sionary") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)ənɛɹi$/, "$1ʃ$2ənɛɹi");
    // -olutionary: ʌʃənɛɹi→uʃənɛɹi (evolutionary)
    if (lowerWord.endsWith("olutionary") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)ʌ([ˈˌ]?)ʃ([ˈˌ]?)ənɛɹi$/, "$1u$2ʃ$3ənɛɹi");
    // -ential: ənʃəl→ɛnʃəl (confidential, credential, sequential)
    if (lowerWord.endsWith("ential") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)nʃ([ˈˌ]?)əl$/, "$1ɛ$2nʃ$3əl");
    // -artial: ɝʃ→ɑɹʃ (impartial)
    if (lowerWord.endsWith("artial") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɝ([ˈˌ]?)ʃ/, "$1ɑɹ$2ʃ");
    // -estial: ɪstɪəl→ɛstʃəl (bestial, celestial)
    if (lowerWord.endsWith("estial") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)st([ˈˌ]?)ɪ([ˈˌ]?)əl$/, "$1ɛ$2st$3ʃ$4əl");
    // -ically: əkəli→ɪkli (radically, numerically, hypothetically, politically)
    if (lowerWord.endsWith("ically") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)[lɫ]([ˈˌ]?)i$/, "$1ɪ$2k$3ɫ$4i");
    // -aneous: ənuəs→eɪniəs (spontaneous, extraneous, miscellaneous, simultaneous)
    if (lowerWord.endsWith("aneous") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)u([ˈˌ]?)əs$/, "$1eɪ$2n$3i$4əs");
    // -onious: əniəs→oʊniəs (felonious, harmonious, parsimonious)
    if (lowerWord.endsWith("onious") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)iəs$/, "$1oʊ$2n$3iəs");
    // -orious: ɝiəs→ɔɹiəs (notorious, victorious, laborious)
    if (lowerWord.endsWith("orious") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɝ([ˈˌ]?)iəs$/, "$1ɔɹ$2iəs");
    // -arious: ɝiəs→ɛɹiəs (hilarious, nefarious, gregarious, vicarious)
    if (lowerWord.endsWith("arious") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɝ([ˈˌ]?)iəs$/, "$1ɛɹ$2iəs");
    // -acity: əsɪti→æsɪti (audacity, opacity, tenacity, overcapacity)
    if (lowerWord.endsWith("acity") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)s([ˈˌ]?)ɪti$/, "$1æ$2s$3ɪti");
    // -ocity: əsɪti→ɑsəti (velocity, atrocity)
    if (lowerWord.endsWith("ocity") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ə([ˈˌ]?)s([ˈˌ]?)ɪti$/, "$1ɑ$2s$3əti");
    // -culous: kələs→kjələs (meticulous)
    if (lowerWord.endsWith("culous") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)l([ˈˌ]?)əs$/, "$1kj$2ə$3l$4əs");
    // -pulous: ʌpələs→upjələs (scrupulous, unscrupulous)
    if (lowerWord.endsWith("pulous") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ʌ([ˈˌ]?)p([ˈˌ]?)ə([ˈˌ]?)l([ˈˌ]?)əs$/, "$1u$2p$3j$4ə$5ləs");
    // therap*: [ðθ]ɝ→θɛɹ (therapy, therapist, therapeutic, hydrotherapy, psychotherapy)
    if (lowerWord.includes("therap"))
      postBase = postBase.replace(/([ˈˌ]?)[ðθ]([ˈˌ]?)ɝ/, "$1θ$2ɛɹ");
    // -urious: ɝiəs→uɹiəs (injurious, penurious)
    if (lowerWord.endsWith("urious") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ɝ([ˈˌ]?)iəs$/, "$1uɹ$2iəs");
    // -ibility: bɪɫəti→bɪɫɪti (collectibility, fallibility, impossibility, sensibility)
    if (lowerWord.endsWith("ibility") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)b([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]([ˈˌ]?)ə([ˈˌ]?)ti$/, "$1b$2ɪ$3ɫ$4ɪ$5ti");
    // -erential: ɪɹɛnʃəɫ→ɝɛnʃəɫ (differential, deferential, inferential)
    if (lowerWord.endsWith("ential") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)ɛn([ˈˌ]?)ʃ([ˈˌ]?)ə([lɫ])$/, "$1ɝ$2ɛn$3ʃ$4ə$5$6");
    // -otient: tint→ʃənt (quotient)
    if (lowerWord.endsWith("otient") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)t([ˈˌ]?)i([ˈˌ]?)nt$/, "$1ʃ$2ənt");
    // -scient: sint→ʃənt (omniscient) — must precede -ient rule
    if (lowerWord.endsWith("scient") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)s([ˈˌ]?)i([ˈˌ]?)nt$/, "$1ʃ$2ənt");
    // -sient: sint→ʒənt (transient) — must precede -ient rule
    if (lowerWord.endsWith("sient") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)s([ˈˌ]?)i([ˈˌ]?)nt$/, "$1ʒ$2ənt");
    // -tience: tiəns→ʃəns (patience, impatience)
    if (lowerWord.endsWith("tience") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)t([ˈˌ]?)i([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1ʃ$2ə$3ns");
    // -ient: int→iənt (client, lenient, nutrient, expedient, recipient) — must follow specific -ient rules
    if (lowerWord.endsWith("ient") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)i([ˈˌ]?)nt$/, "$1i$2ənt");
    // -actual: ktuəɫ→kʃəɫ (actual)
    if (lowerWord.endsWith("actual") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)t([ˈˌ]?)u([ˈˌ]?)ə([ˈˌ]?)[lɫ]$/, "$1k$2ʃ$3ə$4ɫ");
    // -dual: duəɫ→dʒuəɫ (residual, gradual)
    if (lowerWord.endsWith("dual") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)u([ˈˌ]?)ə([ˈˌ]?)[lɫ]$/, "$1dʒ$2u$3ə$4ɫ");
    // -sual: suəɫ→ʒəwəɫ (casual, visual)
    if (lowerWord.endsWith("sual") && lowerWord.length >= 5)
      postBase = postBase.replace(/([ˈˌ]?)s([ˈˌ]?)u([ˈˌ]?)ə([ˈˌ]?)[lɫ]$/, "$1ʒ$2əwə$3ɫ");
    // -hibition: hɪbɪʃən→əbɪʃən (exhibition, inhibition)
    if (lowerWord.endsWith("hibition") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)h([ˈˌ]?)ɪ([ˈˌ]?)b([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)ən$/, "$1ə$2b$3ɪ$4ʃ$5ən");
    // -quisition: kwɪzɪʃən→kwəzɪʃən (acquisition, inquisition, requisition)
    if (lowerWord.endsWith("quisition") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)w([ˈˌ]?)ɪ([ˈˌ]?)z([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)ən$/, "$1k$2w$3ə$4z$5ɪ$6ʃ$7ən");
    // -efinition: ɪfɪnɪʃən→ɛfənɪʃən (definition, redefinition)
    if (lowerWord.endsWith("efinition") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)f([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)ən$/, "$1ɛ$2f$3ə$4n$5ɪ$6ʃ$7ən");
    // -etition: ɪpɪtɪʃən→ɛpətɪʃən (repetition)
    if (lowerWord.endsWith("etition") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)ən$/, "$1ɛ$2p$3ə$4t$5ɪ$6ʃ$7ən");
    // detriment: dɪtɹɪ→dɛtɹə at start (detriment, detrimental)
    if (lowerWord.startsWith("detri") && lowerWord.endsWith("ment") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)ɹ([ˈˌ]?)ɪ/, "$1d$2ɛ$3t$4ɹ$5ə");
    // -erate verbs: ɪɹeɪt→ɝeɪt (recuperate, regenerate, reverberate, remunerate, refrigerate)
    if (lowerWord.endsWith("erate") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)eɪt$/, "$1ɝ$2eɪt");
    // -anger: ændʒɝ→eɪndʒɝ (danger, endanger)
    if (lowerWord.endsWith("anger") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)n([ˈˌ]?)dʒ([ˈˌ]?)ɝ$/, "$1eɪ$2n$3dʒ$4ɝ");
    // -etitious: ɪpɛtɪʃəs→ɛpətɪʃəs (repetitious)
    if (lowerWord.endsWith("etitious") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)p([ˈˌ]?)ɛ([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)əs$/, "$1ɛ$2p$3ə$4t$5ɪ$6ʃ$7əs");
    // -editious: ɪkspɛdɪʃəs→ɛkspədɪʃəs (expeditious)
    if (lowerWord.endsWith("editious") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ks([ˈˌ]?)p([ˈˌ]?)ɛ([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)əs$/, "$1ɛ$2ks$3p$4ə$5d$6ɪ$7ʃ$8əs");
    // -tribution: tɹɪbjuʃən→tɹəbjuʃən (contribution, retribution)
    if (lowerWord.endsWith("tribution") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)t([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)bj([ˈˌ]?)uʃ([ˈˌ]?)ən$/, "$1t$2ɹ$3ə$4bj$5uʃ$6ən");
    // -stitution: stɪtuʃən→stətuʃən (constitution, destitution, prostitution); not restitution
    if (lowerWord.endsWith("stitution") && lowerWord.length >= 10 && !lowerWord.startsWith("re"))
      postBase = postBase.replace(/([ˈˌ]?)st([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)uʃ([ˈˌ]?)ən$/, "$1st$2ə$3t$4uʃ$5ən");
    // -mpetition: mpɪtɪʃən→mpətɪʃən (competition)
    if (lowerWord.endsWith("etition") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)m([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)ən$/, "$1m$2p$3ə$4t$5ɪ$6ʃ$7ən");
    // -idential: aɪdɛnʃəɫ→ədɛnʃəɫ (presidential)
    if (lowerWord.endsWith("idential") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)a([ˈˌ]?)ɪ([ˈˌ]?)d([ˈˌ]?)ɛ([ˈˌ]?)nʃ([ˈˌ]?)ə[lɫ]$/, "$1ə$2d$3ɛ$4nʃ$5əɫ");
    // -otential: poʊtɛnʃ→pətɛnʃ (potential)
    if (lowerWord.endsWith("otential") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)p([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)t([ˈˌ]?)ɛ([ˈˌ]?)nʃ([ˈˌ]?)ə[lɫ]$/, "$1p$2ə$3t$4ɛ$5nʃ$6əɫ");
    // -sonance: soʊnəns→sənəns (dissonance)
    if (lowerWord.endsWith("sonance") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)s([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1s$2ə$3n$4ə$5ns");
    // -minence: ɪmɪnəns→ɛmənəns (eminence)
    if (lowerWord.endsWith("minence") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)m([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1ɛ$2m$3ə$4n$5ə$6ns");
    // -vidence: ɪvɪdəns→ɛvədəns (evidence)
    if (lowerWord.endsWith("vidence") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)v([ˈˌ]?)ɪ([ˈˌ]?)d([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1ɛ$2v$3ə$4d$5ə$6ns");
    // -legance: ɪɫɛɡəns→ɛɫəɡəns (elegance)
    if (lowerWord.endsWith("legance") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]([ˈˌ]?)ɛ([ˈˌ]?)ɡ([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1ɛ$2ɫ$3ə$4ɡ$5ə$6ns");
    // -potence: oʊtəns→ətəns (impotence)
    if (lowerWord.endsWith("potence") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)t([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1ə$2t$3ə$4ns");
    // -fidence: kənfɪdəns→kɑnfədəns (confidence)
    if (lowerWord.endsWith("fidence") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)f([ˈˌ]?)ɪ([ˈˌ]?)d([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1k$2ɑ$3n$4f$5ə$6d$7ə$8ns");
    // -sequence: kənsɛkwəns→kɑnsəkwəns (consequence)
    if (lowerWord.endsWith("sequence") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)s([ˈˌ]?)ɛ([ˈˌ]?)k([ˈˌ]?)w([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1k$2ɑ$3n$4s$5ə$6k$7w$8ə$9ns");
    // -cadence: dɛkeɪdəns→dɛkədəns (decadence)
    if (lowerWord.endsWith("cadence") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)ɛ([ˈˌ]?)k([ˈˌ]?)eɪ([ˈˌ]?)d([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1d$2ɛ$3k$4ə$5d$6ə$7ns");
    // -enance: pɪnæns→pɛnəns (penance)
    if (lowerWord.endsWith("enance") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)æ([ˈˌ]?)ns$/, "$1p$2ɛ$3n$4ə$5ns");
    // -uminance: ɫəmɪnəns→ɫumənəns (luminance)
    if (lowerWord.endsWith("uminance") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)[lɫ]([ˈˌ]?)ə([ˈˌ]?)m([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1ɫ$2u$3m$4ə$5n$6ə$7ns");
    // -ficence: bɛnɛfɪsəns→bənɛfəsəns (beneficence)
    if (lowerWord.endsWith("ficence") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ɛ([ˈˌ]?)n([ˈˌ]?)ɛ([ˈˌ]?)f([ˈˌ]?)ɪ([ˈˌ]?)s([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1ə$2n$3ɛ$4f$5ə$6s$7ə$8ns");
    // -incidence: kɔɪn→koʊɪn (coincidence)
    if (lowerWord.endsWith("incidence") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)ɔ([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)s/, "$1k$2oʊ$3ɪ$4n$5s");
    // -mpetence: mpɪtəns→mpətəns (incompetence)
    if (lowerWord.endsWith("mpetence") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)m([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1m$2p$3ə$4t$5ə$6ns");
    // -ntinence: ntɪnəns→ntənəns (incontinence)
    if (lowerWord.endsWith("ntinence") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)n([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)ns$/, "$1n$2t$3ə$4n$5ə$6ns");
    // -ocility: doʊsɪɫ→dɑsɪɫ (docility)
    if (lowerWord.endsWith("ocility") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]/, "$1d$2ɑ$3s$4ɪ$5ɫ");
    // -erivative: dɪɹɪvətɪv→dɝɪvətɪv (derivative)
    if (lowerWord.endsWith("erivative") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)v([ˈˌ]?)ə([ˈˌ]?)t([ˈˌ]?)ɪv$/, "$1d$2ɝ$3ɪ$4v$5ə$6t$7ɪv");
    // -orrect: ɔɹɛk→ɝɛk (correction, corrective, incorrect)
    if (lowerWord.includes("orrect") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɔ([ˈˌ]?)ɹ([ˈˌ]?)ɛ([ˈˌ]?)k/, "$1ɝ$2ɛ$3k");
    // -ostility: hoʊst→hɑst (hostility)
    if (lowerWord.endsWith("ostility") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)h([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)st([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]/, "$1h$2ɑ$3st$4ɪ$5ɫ");
    // -acility: fæsɪɫəti→fəsɪɫɪti (facility)
    if (lowerWord.endsWith("acility") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)f([ˈˌ]?)æ([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]([ˈˌ]?)ə([ˈˌ]?)ti$/, "$1f$2ə$3s$4ɪ$5ɫ$6ɪ$7ti");
    // -mendation: kəmɛndeɪʃən→kɑməndeɪʃən (commendation)
    if (lowerWord.endsWith("mendation") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)m([ˈˌ]?)ɛ([ˈˌ]?)nd([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1k$2ɑ$3m$4ə$5nd$6eɪʃ$7ən");
    // -duration: dɝeɪʃən→dʊɹeɪʃən (duration)
    if (lowerWord.endsWith("duration") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)ɝ([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1d$2ʊɹ$3eɪʃ$4ən");
    // -giment: ɹɪdʒɪm→ɹɛdʒəm (regiment)
    if (lowerWord.endsWith("giment") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)dʒ([ˈˌ]?)ɪ([ˈˌ]?)m/, "$1ɹ$2ɛ$3dʒ$4ə$5m");
    // -ediment: mpɪdɪm→mpɛdəm (impediment)
    if (lowerWord.endsWith("ediment") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)m([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)m/, "$1m$2p$3ɛ$4d$5ə$6m");
    // -plement: pəɫm→pɫəm (complement, implement, supplement)
    if (lowerWord.endsWith("plement") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)p([ˈˌ]?)ə([ˈˌ]?)[lɫ]([ˈˌ]?)m/, "$1p$2ɫ$3ə$4m");
    // -xpedition: ɪkspɪdɪʃən→ɛkspədɪʃən (expedition)
    if (lowerWord.endsWith("edition") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ks([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)ʃ([ˈˌ]?)ən$/, "$1ɛ$2ks$3p$4ə$5d$6ɪ$7ʃ$8ən");
    // -aptation: ədæpt→ædəpt (adaptation)
    if (lowerWord.endsWith("aptation") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)d([ˈˌ]?)æ([ˈˌ]?)p([ˈˌ]?)t/, "$1æ$2d$3ə$4p$5t");
    // -demnation: kəndɛmeɪʃən→kɑndəmneɪʃən (condemnation)
    if (lowerWord.endsWith("demnation") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)d([ˈˌ]?)ɛ([ˈˌ]?)m([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1k$2ɑ$3n$4d$5ə$6mn$7eɪʃ$8ən");
    // -element: iɫm→ɛɫəm (element)
    if (lowerWord.endsWith("element") && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)i([ˈˌ]?)[lɫ]([ˈˌ]?)m/, "$1ɛ$2ɫ$3əm");
    // -xperiment: ɛkspɪɹɪm→ɪkspɛɹəm (experiment)
    if (lowerWord.endsWith("xperiment") && lowerWord.length >= 10)
      postBase = postBase.replace(/^([ˈˌ]?)ɛ([ˈˌ]?)ks([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)m/, "$1ɪ$2ks$3p$4ɛ$5ɹ$6ə$7m");
    // -emissary: ɪmɪ→ɛmə at start (emissary)
    if (lowerWord.startsWith("em") && lowerWord.endsWith("ary") && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)ɪ([ˈˌ]?)m([ˈˌ]?)ɪ/, "$1ɛ$2m$3ə");
    // -ategory/-ategorize: keɪtɪɡ→kætəɡ (category, categorize)
    if (lowerWord.includes("ategor") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)eɪ([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)ɡ/, "$1k$2æ$3t$4ə$5ɡ");
    // -aboratory: ɫəbɔɹ→ɫæbɹ (laboratory)
    if (lowerWord.endsWith("boratory") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)[lɫ]([ˈˌ]?)ə([ˈˌ]?)b([ˈˌ]?)ɔ([ˈˌ]?)ɹ/, "$1ɫ$2æ$3b$4ɹ");
    // -apillary: kɑpɪɫ→kæpəɫ (capillary)
    if (lowerWord.endsWith("pillary") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ɑ([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]/, "$1k$2æ$3p$4ə$5ɫ");
    // -ommissary: kəmɪ→kɑmə (commissary)
    if (lowerWord.endsWith("missary") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)m([ˈˌ]?)ɪ/, "$1k$2ɑ$3m$4ə");
    // -ometary: koʊmɪt→kɑmət (cometary)
    if (lowerWord.endsWith("metary") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)m([ˈˌ]?)ɪ([ˈˌ]?)t/, "$1k$2ɑ$3m$4ə$5t");
    // -isciplinary: dɪsɪpɫɪn→dɪsəpɫən (disciplinary)
    if (lowerWord.endsWith("sciplinary") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)p([ˈˌ]?)[lɫ]([ˈˌ]?)ɪ([ˈˌ]?)n/, "$1d$2ɪ$3s$4ə$5p$6ɫ$7ə$8n");
    // -dromedary: dɹoʊmɪd→dɹɑməd (dromedary)
    if (lowerWord.endsWith("omedary") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɹ([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)m([ˈˌ]?)ɪ([ˈˌ]?)d/, "$1d$2ɹ$3ɑ$4m$5ə$6d");
    // -olfactory: əɫfækt→oʊɫfækt (olfactory)
    if (lowerWord.endsWith("lfactory") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)[lɫ]([ˈˌ]?)f([ˈˌ]?)æ([ˈˌ]?)k([ˈˌ]?)t/, "$1oʊ$2ɫ$3f$4æ$5k$6t");
    // -derogatory: dɪɹoʊɡ→dɝɑɡ (derogatory)
    if (lowerWord.endsWith("ogatory") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)ɡ/, "$1d$2ɝ$3ɑ$4ɡ");
    // -colon*: koʊɫ→kɑɫ at start (colonize, colonist)
    if (lowerWord.startsWith("colon") && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)[lɫ]/, "$1k$2ɑ$3ɫ");
    // -botan*: boʊtən→bɑtən (botanist)
    if (lowerWord.startsWith("botan") && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)b([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)t([ˈˌ]?)ə([ˈˌ]?)n/, "$1b$2ɑ$3t$4ə$5n");
    // -aggrandize: æɡɹənd→əɡɹænd (aggrandize)
    if (lowerWord.endsWith("grandize") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)ɡ([ˈˌ]?)ɹ([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)d/, "$1ə$2ɡ$3ɹ$4æ$5n$6d");
    // -amortize: æmɔɹt→æmɝt (amortize)
    if (lowerWord.endsWith("mortize") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)m([ˈˌ]?)ɔ([ˈˌ]?)ɹ([ˈˌ]?)t/, "$1æ$2m$3ɝ$4t");
    // -crystallize: kɹaɪstɔɫ→kɹɪstəɫ (crystallize)
    if (lowerWord.endsWith("stallize") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)k([ˈˌ]?)ɹ([ˈˌ]?)aɪ([ˈˌ]?)st([ˈˌ]?)ɔ([ˈˌ]?)[lɫ]/, "$1k$2ɹ$3ɪ$4st$5ə$6ɫ");
    // -adjective: ədʒɛkt→ædʒɪkt (adjective)
    if (lowerWord.endsWith("jective") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)d([ˈˌ]?)ʒ([ˈˌ]?)ɛ([ˈˌ]?)k([ˈˌ]?)t/, "$1æ$2d$3ʒ$4ɪ$5k$6t");
    // -distributive: stɹɪbət→stɹɪbjut (distributive)
    if (lowerWord.endsWith("tributive") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)st([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)b([ˈˌ]?)ə([ˈˌ]?)t/, "$1st$2ɹ$3ɪ$4bj$5u$6t");
    // -combative: kəmbət→kɑmbæt (combative)
    if (lowerWord.endsWith("mbative") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)m([ˈˌ]?)b([ˈˌ]?)ə([ˈˌ]?)t/, "$1k$2ɑ$3m$4b$5æ$6t");
    // -admonitory: ədmoʊnɪ→ædmɔnɪ (admonitory)
    if (lowerWord.endsWith("dmonitory") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)d([ˈˌ]?)m([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)n/, "$1æ$2d$3m$4ɔ$5n");
    // -ambulatory: əmbʌɫ→æmbjəɫ (ambulatory)
    if (lowerWord.endsWith("mbulatory") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)m([ˈˌ]?)b([ˈˌ]?)ʌ([ˈˌ]?)[lɫ]/, "$1æ$2m$3bj$4ə$5ɫ");
    // -depository: dɪpoʊsɪ→dɪpɑzə (depository)
    if (lowerWord.endsWith("pository") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)p([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)s([ˈˌ]?)ɪ/, "$1d$2ɪ$3p$4ɑ$5z$6ə");
    // -oscillatory: əsɪɫ→ɑsəɫ (oscillatory)
    if (lowerWord.endsWith("scillatory") && lowerWord.length >= 10)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]/, "$1ɑ$2s$3ə$4ɫ");
    // -acrimonious: əkɹɪ→ækɹə at start (acrimonious)
    if (lowerWord.startsWith("acr") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)k([ˈˌ]?)ɹ([ˈˌ]?)ɪ/, "$1æ$2k$3ɹ$4ə");
    // -commodious: kɑməd→kəmoʊd (commodious)
    if (lowerWord.endsWith("modious") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ɑ([ˈˌ]?)m([ˈˌ]?)ə([ˈˌ]?)d/, "$1k$2ə$3m$4oʊ$5d");
    // -anomalous: ɑnoʊm→ənɑm (anomalous)
    if (lowerWord.endsWith("nomalous") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ɑ([ˈˌ]?)n([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)m/, "$1ə$2n$3ɑ$4m");
    // -advantageous: ədvænt→ædvənt (advantageous)
    if (lowerWord.endsWith("vantageous") && lowerWord.length >= 11)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)d([ˈˌ]?)v([ˈˌ]?)æ([ˈˌ]?)n([ˈˌ]?)t/, "$1æ$2d$3v$4ə$5n$6t");
    // -apocryphal: æpəkɹɪf→əpɑkɹəf (apocryphal)
    if (lowerWord.endsWith("pocryphal") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)p([ˈˌ]?)ə([ˈˌ]?)k([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)f/, "$1ə$2p$3ɑ$4k$5ɹ$6ə$7f");
    // -culinary: kʌɫɪn→kjʌɫɪn (culinary)
    if (lowerWord.endsWith("linary") && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ʌ([ˈˌ]?)[lɫ]([ˈˌ]?)ɪ([ˈˌ]?)n/, "$1k$2jʌ$3ɫ$4ɪ$5n");
    // -corollary: kɝɑɫ→kɔɹəɫ (corollary)
    if (lowerWord.endsWith("rollary") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ɝ([ˈˌ]?)ɑ([ˈˌ]?)[lɫ]/, "$1k$2ɔɹ$3ə$4ɫ");
    // -depositary: dɪpoʊsɪt→dəpɑzɪt (depositary)
    if (lowerWord.endsWith("positary") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)p([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)s([ˈˌ]?)ɪ([ˈˌ]?)t/, "$1d$2ə$3p$4ɑ$5z$6ɪ$7t");
    // -courageous: kaʊɹeɪdʒ→kɝeɪdʒ (courageous)
    if (lowerWord.endsWith("ourageous") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)aʊ([ˈˌ]?)ɹ([ˈˌ]?)eɪ([ˈˌ]?)d([ˈˌ]?)ʒ/, "$1k$2ɝ$3eɪ$4d$5ʒ");
    // -courteous: kuɹtuəs→kɝtiəs (courteous)
    if (lowerWord.endsWith("ourteous") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)u([ˈˌ]?)ɹ([ˈˌ]?)t([ˈˌ]?)u([ˈˌ]?)ə([ˈˌ]?)s$/, "$1k$2ɝ$3t$4i$5ə$6s");
    // -abdominal: mɪnəɫ→mənəɫ (abdominal)
    if (lowerWord.endsWith("dominal") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)m([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)[lɫ]$/, "$1m$2ə$3n$4ə$5ɫ");
    // -anecdotal: ænɛkdət→ænəkdoʊt (anecdotal)
    if (lowerWord.endsWith("anecdotal") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)n([ˈˌ]?)ɛ([ˈˌ]?)k([ˈˌ]?)d([ˈˌ]?)ə([ˈˌ]?)t/, "$1æ$2n$3ə$4k$5d$6oʊ$7t");
    // -aeronautical: ɛɹoʊnɑt→ɛɹənɑt (aeronautical)
    if (lowerWord.endsWith("eronautical") && lowerWord.length >= 11)
      postBase = postBase.replace(/^([ˈˌ]?)ɛ([ˈˌ]?)ɹ([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)n/, "$1ɛ$2ɹ$3ə$4n");
    // -apolitical: əpəɫɪt→eɪpəɫɪt (apolitical)
    if (lowerWord.endsWith("political") && lowerWord.startsWith("a") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)p([ˈˌ]?)ə([ˈˌ]?)[lɫ]([ˈˌ]?)ɪ([ˈˌ]?)t/, "$1eɪ$2p$3ə$4ɫ$5ɪ$6t");
    // -antithetical: æntaɪðət→æntəθɛt (antithetical)
    if (lowerWord.endsWith("ntithetical") && lowerWord.length >= 11)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)n([ˈˌ]?)t([ˈˌ]?)aɪ([ˈˌ]?)ð([ˈˌ]?)ə([ˈˌ]?)t/, "$1æ$2n$3t$4ə$5θ$6ɛ$7t");
    // -adrenal: ædɹən→ədɹin (adrenal)
    if (lowerWord.endsWith("drenal") && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)d([ˈˌ]?)ɹ([ˈˌ]?)ə([ˈˌ]?)n/, "$1ə$2d$3ɹ$4i$5n");
    // -allergist: æɫɝɡɪst→æɫɝdʒəst (allergist)
    if (lowerWord.endsWith("llergist") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)æ([ˈˌ]?)[lɫ]([ˈˌ]?)ɝ([ˈˌ]?)ɡ([ˈˌ]?)ɪ([ˈˌ]?)s([ˈˌ]?)t$/, "$1æ$2ɫ$3ɝ$4dʒ$5ə$6s$7t");
    // -anarchist: ænɑɹk→ænɝk (anarchist)
    if (lowerWord.endsWith("narchist") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)n([ˈˌ]?)ɑ([ˈˌ]?)ɹ([ˈˌ]?)k/, "$1æ$2n$3ɝ$4k");
    // -anatomist: ænətəm→ənætəm (anatomist)
    if (lowerWord.endsWith("natomist") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)t([ˈˌ]?)ə([ˈˌ]?)m/, "$1ə$2n$3æ$4t$5ə$6m");
    // -agronomist: æɡɹənəm→əɡɹɑnəm (agronomist)
    if (lowerWord.endsWith("gronomist") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)æ([ˈˌ]?)ɡ([ˈˌ]?)ɹ([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)m/, "$1ə$2ɡ$3ɹ$4ɑ$5n$6ə$7m");
    // -arity: ɝɪti→ɛɹəti (polarity, hilarity, barbarity, similarity, vulgarity)
    if (lowerWord.endsWith("arity") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ɝ([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)i$/, "$1ɛɹ$2ə$3t$4i");
    // -ority: ɝɪti→ɔɹəti (majority, minority)
    if (lowerWord.endsWith("ority") && lowerWord.length >= 6)
      postBase = postBase.replace(/([ˈˌ]?)ɝ([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)i$/, "$1ɔɹ$2ə$3t$4i");
    // -urity: ɪti→əti at end (security, obscurity — not in- prefix words)
    if (lowerWord.endsWith("urity") && lowerWord.length >= 6 && !lowerWord.startsWith("in"))
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)i$/, "$1ə$2t$3i");
    // -quality: ɛkwəɫ→ɪkwɑɫ (equality, inequality)
    if (lowerWord.endsWith("quality") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)ɛ([ˈˌ]?)k([ˈˌ]?)w([ˈˌ]?)ə([ˈˌ]?)[lɫ]/, "$1ɪ$2k$3w$4ɑ$5ɫ");
    // -priority: pɹɪɔɹ→pɹaɪɔɹ (priority)
    if (lowerWord.endsWith("priority") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)p([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)ɔ([ˈˌ]?)ɹ/, "$1p$2ɹ$3aɪ$4ɔ$5ɹ");
    // -predatory: pɹɪdæt→pɹɛdət (predatory)
    if (lowerWord.endsWith("predatory") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)p([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)d([ˈˌ]?)æ([ˈˌ]?)t/, "$1p$2ɹ$3ɛ$4d$5ə$6t");
    // -execut*: ɪɡz[ɪɛ]kj→ɛksəkj (execute, execution)
    if (lowerWord.startsWith("execut") && lowerWord.length >= 7)
      postBase = postBase.replace(/^([ˈˌ]?)ɪ([ˈˌ]?)ɡ([ˈˌ]?)z([ˈˌ]?)[ɪɛ]([ˈˌ]?)k([ˈˌ]?)j/, "$1ɛ$2k$3s$4ə$5k$6j");
    // -exemplary: ɛmpɫɛɹi→ɛmpɫɝi (exemplary)
    if (lowerWord.startsWith("exempl") && lowerWord.endsWith("ary"))
      postBase = postBase.replace(/([ˈˌ]?)[lɫ]([ˈˌ]?)ɛɹ([ˈˌ]?)i$/, "$1ɫ$2ɝ$3i");
    // -irmary: mɛɹi→mɝi at end (infirmary)
    if (lowerWord.endsWith("irmary") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)m([ˈˌ]?)ɛɹ([ˈˌ]?)i$/, "$1m$2ɝ$3i");
    // -nocence: ɪnoʊsəns→ɪnəsəns (innocence)
    if (lowerWord.endsWith("nocence") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)oʊ([ˈˌ]?)s/, "$1ɪ$2n$3ə$4s");
    // -oquence: ɪɫoʊkw→ɛɫəkw (eloquence)
    if (lowerWord.endsWith("oquence") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]([ˈˌ]?)oʊ([ˈˌ]?)k([ˈˌ]?)w/, "$1ɛ$2ɫ$3ə$4k$5w");
    // -rogance: ɑɹoʊɡ→ɛɹəɡ at start (arrogance)
    if (lowerWord.endsWith("rogance") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ɑ([ˈˌ]?)ɹ([ˈˌ]?)oʊ([ˈˌ]?)ɡ/, "$1ɛ$2ɹ$3ə$4ɡ");
    // -ndurance: ndjʊɹ→ndɝ (endurance)
    if (lowerWord.endsWith("ndurance") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)n([ˈˌ]?)djʊɹ/, "$1n$2dɝ");
    // -commence: kɑməns→kəmɛns (commence, commencement)
    if (lowerWord.startsWith("commenc") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ɑ([ˈˌ]?)m([ˈˌ]?)ə([ˈˌ]?)ns/, "$1k$2ə$3m$4ɛ$5ns");
    // -dependence: ɪndɛpɪnd→ɪndɪpɛnd (independence)
    if (lowerWord.endsWith("dependence") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)d([ˈˌ]?)ɛ([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)d/, "$1ɪ$2n$3d$4ɪ$5p$6ɛ$7n$8d");
    // -constance: kənstæns→kɑnstəns (constance)
    if (lowerWord.startsWith("const") && lowerWord.endsWith("ance") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)s([ˈˌ]?)t([ˈˌ]?)æ([ˈˌ]?)ns/, "$1k$2ɑ$3n$4s$5t$6ə$7ns");
    // -illiance: ɪɫɪæns→ɪɫjəns (brilliance)
    if (lowerWord.endsWith("illiance") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)[lɫ]([ˈˌ]?)ɪ([ˈˌ]?)æ([ˈˌ]?)ns$/, "$1ɪ$2ɫ$3j$4ə$5ns");
    // -voyance: ɔɪæns→ɔɪəns (clairvoyance)
    if (lowerWord.endsWith("voyance") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)ɔ([ˈˌ]?)ɪ([ˈˌ]?)æ([ˈˌ]?)ns$/, "$1ɔ$2ɪ$3ə$4ns");
    // -berance: bɪɹəns→bɝəns (exuberance, protuberance)
    if (lowerWord.endsWith("berance") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)bɪɹ([ˈˌ]?)əns$/, "$1bɝ$2əns");
    // -verence: vɪɹ→vɝ (reverence, irreverence)
    if (lowerWord.endsWith("verence") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)vɪɹ([ˈˌ]?)əns$/, "$1vɝ$2əns");
    // -ndifference: fɪɹ→fɝ (indifference)
    if (lowerWord.includes("ndifference"))
      postBase = postBase.replace(/([ˈˌ]?)fɪɹ([ˈˌ]?)əns$/, "$1fɝ$2əns");
    // -durable: dɝ→dʊɹ (durable, nondurable)
    if (lowerWord.endsWith("durable") && lowerWord.length >= 7)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)ɝ([ˈˌ]?)ə([ˈˌ]?)b([ˈˌ]?)ə([ˈˌ]?)[lɫ]/, "$1d$2ʊɹ$3ə$4b$5ə$6ɫ");
    // -quisitive: ɪŋkwɪsətɪv→ɪnkwɪzɪtɪv (inquisitive)
    if (lowerWord.endsWith("quisitive") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ŋ([ˈˌ]?)k([ˈˌ]?)w([ˈˌ]?)ɪ([ˈˌ]?)s([ˈˌ]?)ə([ˈˌ]?)t/, "$1ɪ$2n$3k$4w$5ɪ$6z$7ɪ$8t");
    // -fugitive: fəˈdʒ→ˈfjudʒ at start (fugitive)
    if (lowerWord.endsWith("fugitive") && lowerWord.length >= 8)
      postBase = postBase.replace(/^f([ˈˌ]?)ə([ˈˌ]?)d([ˈˌ]?)ʒ/, "ˈfjudʒ");
    // -positive: pəs→pɑz at start (positive)
    if (lowerWord.endsWith("positive") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)p([ˈˌ]?)ə([ˈˌ]?)s/, "$1p$2ɑ$3z");
    // -punitive: pən→pjun at start (punitive)
    if (lowerWord.endsWith("punitive") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)p([ˈˌ]?)ə([ˈˌ]?)n/, "$1p$2j$3un");
    // -prohibitive: pɹəhɪb→pɹoʊhɪb (prohibitive)
    if (lowerWord.endsWith("prohibitive") && lowerWord.length >= 11)
      postBase = postBase.replace(/^([ˈˌ]?)p([ˈˌ]?)ɹ([ˈˌ]?)ə([ˈˌ]?)h([ˈˌ]?)ɪ([ˈˌ]?)b/, "$1p$2ɹ$3oʊ$4h$5ɪ$6b");
    // -dispositive: poʊs→pɑz (dispositive)
    if (lowerWord.endsWith("dispositive") && lowerWord.length >= 11)
      postBase = postBase.replace(/([ˈˌ]?)p([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)s/, "$1p$2ɑ$3z");
    // -generative: dʒɪnɪɹ→dʒɛnɝ (generative, degenerative)
    if (lowerWord.endsWith("generative") && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)d([ˈˌ]?)ʒ([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)ɪ([ˈˌ]?)ɹ/, "$1d$2ʒ$3ɛ$4n$5ɝ");
    // -erative: ɪɹ→ɝ (operative, federative, recuperative, remunerative, inoperative)
    if (lowerWord.endsWith("erative") && lowerWord.length >= 8 && !lowerWord.startsWith("imp"))
      postBase = postBase.replace(/([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)ə([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)v$/, "$1ɝ$2ə$3t$4ɪ$5v");
    // -ligator: əɫɪɡ→æɫəɡ at start (alligator)
    if (lowerWord.endsWith("ligator") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)[lɫ]([ˈˌ]?)ɪ([ˈˌ]?)ɡ/, "$1æ$2ɫ$3ə$4ɡ");
    // -ctivator: əktɪv→æktəv at start (activator)
    if (lowerWord.endsWith("ctivator") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)k([ˈˌ]?)t([ˈˌ]?)ɪ([ˈˌ]?)v/, "$1æ$2k$3t$4ə$5v");
    // -locator: əɫoʊk→æɫək at start (allocator)
    if (lowerWord.endsWith("locator") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)[lɫ]([ˈˌ]?)oʊ([ˈˌ]?)k/, "$1æ$2ɫ$3ə$4k");
    // -plicator: əpɫɪk→æpɫək at start (applicator)
    if (lowerWord.endsWith("plicator") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)p([ˈˌ]?)[lɫ]([ˈˌ]?)ɪ([ˈˌ]?)k/, "$1æ$2p$3ɫ$4ə$5k");
    // -notator: ɑnoʊt→ænət at start (annotator)
    if (lowerWord.endsWith("notator") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ɑ([ˈˌ]?)n([ˈˌ]?)oʊ([ˈˌ]?)t/, "$1æ$2n$3ə$4t");
    // -mentator: kəmɛnt→kɑmənt at start (commentator)
    if (lowerWord.endsWith("mentator") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ə([ˈˌ]?)m([ˈˌ]?)ɛ([ˈˌ]?)n([ˈˌ]?)t/, "$1k$2ɑ$3m$4ə$5n$6t");
    // -detonator: dɪtoʊn→dɛtən at start (detonator)
    if (lowerWord.endsWith("detonator") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)t([ˈˌ]?)oʊ([ˈˌ]?)n/, "$1d$2ɛ$3t$4ə$5n");
    // -decorator: dɪkɔɹ→dɛkɝ at start (decorator)
    if (lowerWord.endsWith("decorator") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)k([ˈˌ]?)ɔɹ/, "$1d$2ɛ$3k$4ɝ");
    // -aborator: bɔɹeɪ→bɝeɪ (collaborator)
    if ((lowerWord.endsWith("oborator") || lowerWord.endsWith("aborator")) && lowerWord.length >= 10)
      postBase = postBase.replace(/([ˈˌ]?)b([ˈˌ]?)ɔɹ([ˈˌ]?)eɪ/, "$1b$2ɝ$3eɪ");
    // -spirator: spɪɹeɪt→spɪɹət (conspirator)
    if (lowerWord.endsWith("spirator") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)s([ˈˌ]?)p([ˈˌ]?)ɪ([ˈˌ]?)ɹ([ˈˌ]?)eɪ([ˈˌ]?)t/, "$1s$2p$3ɪ$4ɹ$5ə$6t");
    // -servator: veɪt→vət (conservator)
    if (lowerWord.endsWith("servator") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)v([ˈˌ]?)eɪ([ˈˌ]?)t([ˈˌ]?)ɝ$/, "$1v$2ə$3t$4ɝ");
    // -nominator: dɪnəmɪn→dɪnɑmən (denominator)
    if (lowerWord.endsWith("nominator") && lowerWord.length >= 10)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)m([ˈˌ]?)ɪ([ˈˌ]?)n/, "$1d$2ɪ$3n$4ɑ$5m$6ə$7n");
    // -locomotion: ɫəkoʊ→ɫoʊkoʊ at start (locomotion)
    if (lowerWord.startsWith("loc") && lowerWord.endsWith("otion") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)[lɫ]([ˈˌ]?)ə([ˈˌ]?)k/, "$1ɫ$2oʊ$3k");
    // -lotation: fɫəteɪʃ→fɫoʊteɪʃ (flotation)
    if (lowerWord.endsWith("lotation") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)[lɫ]([ˈˌ]?)ə([ˈˌ]?)t([ˈˌ]?)eɪʃ/, "$1ɫ$2oʊ$3t$4eɪʃ");
    // -ronation: kɝən→kɔɹən at start (coronation)
    if (lowerWord.endsWith("ronation") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)ɝ([ˈˌ]?)ə([ˈˌ]?)n/, "$1k$2ɔɹ$3ə$4n");
    // -olonization: koʊɫənəzeɪʃ→kɑɫənɪzeɪʃ (colonization)
    if (lowerWord.endsWith("olonization") && lowerWord.length >= 12)
      postBase = postBase.replace(/^([ˈˌ]?)k([ˈˌ]?)o([ˈˌ]?)ʊ([ˈˌ]?)[lɫ]([ˈˌ]?)ə([ˈˌ]?)n([ˈˌ]?)ə([ˈˌ]?)z([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1k$2ɑ$3ɫ$4ə$5n$6ɪ$7z$8eɪʃ$9ən");
    // -putation: pəteɪʃ→pjəteɪʃ (computation, disputation, reputation)
    if (lowerWord.endsWith("putation") && lowerWord.length >= 8)
      postBase = postBase.replace(/([ˈˌ]?)p([ˈˌ]?)ə([ˈˌ]?)t([ˈˌ]?)eɪʃ/, "$1p$2jə$3t$4eɪʃ");
    // -ppellation: əpɛɫeɪʃ→æpəɫeɪʃ (appellation)
    if (lowerWord.endsWith("pellation") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)ə([ˈˌ]?)p([ˈˌ]?)ɛ([ˈˌ]?)[lɫ]([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1æ$2p$3ə$4ɫ$5eɪʃ$6ən");
    // -adoration: ɑdɔɹeɪʃ→ædɝeɪʃ (adoration)
    if (lowerWord.startsWith("ad") && lowerWord.endsWith("doration") && lowerWord.length >= 8)
      postBase = postBase.replace(/^([ˈˌ]?)ɑ([ˈˌ]?)d([ˈˌ]?)ɔ([ˈˌ]?)ɹ([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1æ$2d$3ɝ$4eɪʃ$5ən");
    // -xcitation: ɛksəteɪʃ→ɛksaɪteɪʃ (excitation)
    if (lowerWord.endsWith("xcitation") && lowerWord.length >= 9)
      postBase = postBase.replace(/([ˈˌ]?)ɛ([ˈˌ]?)ks([ˈˌ]?)ə([ˈˌ]?)t([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1ɛ$2ks$3aɪ$4t$5eɪʃ$6ən");
    // -depredation: dɪpɹɪdeɪʃ→dɛpɹədeɪʃ (depredation)
    if (lowerWord.endsWith("predation") && lowerWord.length >= 9)
      postBase = postBase.replace(/^([ˈˌ]?)d([ˈˌ]?)ɪ([ˈˌ]?)p([ˈˌ]?)ɹ([ˈˌ]?)ɪ([ˈˌ]?)d([ˈˌ]?)eɪʃ([ˈˌ]?)ən$/, "$1d$2ɛ$3p$4ɹ$5ə$6d$7eɪʃ$8ən");

    const out = dialect === "en-GB" ? transformAmericanToRP(word, postBase) : postBase;
    return out.replace(/l/g, "ɫ");
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
    const lowerWord = word.toLowerCase();

    // Priority 1: Handle hyphenated compounds (e.g., "recession-hit")
    if (lowerWord.includes("-")) {
      const parts = lowerWord.split("-");
      if (parts.length === 2) {
        const part1 = this.predictInternal(parts[0], pos, disableDict);
        const part2 = this.predictInternal(parts[1], pos, disableDict);
        if (part1 && part2) {
          // Remove stress from first part, add to second part for compound stress pattern
          const cleanPart1 = part1.replace(/ˈ/g, "");
          const cleanPart2 = part2.replace(/ˈ/g, "");
          return cleanPart1 + "ˈ" + cleanPart2;
        }
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
      for (const [from, to] of POST_PROC_RULES)
        result = result.replace(from, to);
      if (lowerWord.startsWith("aa")) result = result.replace(/^æ+/, "ɑ");
      if (lowerWord.endsWith("erate") || lowerWord.length >= 9)
        result = result.replace(/[ɛɔ]ɹeɪt(ɝ?)$/, "ɝeɪt$1");
      if (syllables.length >= 3) result = result.replace(/eɪdʒ$/, "ɪdʒ");
      if (lowerWord.includes("asiv")) result = result.replace(/æsɪv/, "eɪsɪv");
      if (lowerWord.endsWith("ator"))
        result = result.replace(/([^w])ətɝ$/, "$1eɪtɝ");
      if (lowerWord.endsWith("mony") && syllables.length >= 3)
        result = result.replace(/məni$/, "moʊni");
      if (!lowerWord.endsWith("sense") && !lowerWord.endsWith("fense"))
        result = result.replace(/([ɪɛ])ns$/, "əns");
      if (lowerWord.endsWith("inger")) result = result.replace(/ndʒɝ$/, "ŋɝ");
      if (lowerWord.endsWith("unger") || lowerWord.endsWith("onger"))
        result = result.replace(/ndʒɝ$/, "ŋɡɝ");
      if (lowerWord === "ache" || (lowerWord.endsWith("ache") && lowerWord.length >= 7))
        result = result.replace(/[æə]tʃ[əɪ]?$/, "eɪk");
      if (lowerWord.endsWith("ard") && syllables.length >= 2 &&
          !/[yh]ard$/.test(lowerWord) && !/card$/.test(lowerWord) &&
          !/(?:(?<!g)gard|guard)$/.test(lowerWord) && !/bard$/.test(lowerWord))
        result = result.replace(/ɑɹd$/, "ɝd");
      // Latin-stem endings: schwa before final consonant cluster should be /ɛ/ not /ə/
      // -ect (connect/elect/affect), -ept (accept/concept), -end (amend/offend), -ext (subtext)
      if (/(?:ect|ept|ext)$/.test(lowerWord))
        result = result.replace(/ə([kp]t|kst)$/, "ɛ$1");
      if (lowerWord.endsWith("end") && syllables.length >= 2)
        result = result.replace(/ənd$/, "ɛnd");
      if (lowerWord.length >= 4 && lowerWord.endsWith("yl"))
        result = result.replace(/aɪl$/, "əl");
      if (lowerWord.endsWith("itis"))
        result = result.replace(/ɪtɪs$/, "aɪtɪs");
      // Polysyllabic -tice/-vice: unstressed final syllable should be /ɪs/ not /aɪs/
      // Guards protect entice(6)/advice(6)/device(6) via length, and service/crevice via -vice≥7
      if (
        (lowerWord.length >= 7 && lowerWord.endsWith("tice")) ||
        (lowerWord.length >= 7 && lowerWord.endsWith("vice"))
      )
        result = result.replace(/aɪs$/, "ɪs");
      // -ange → /eɪndʒ/ (change/range/strange/exchange); guard -lange (flange/phalange stay /æ/)
      if (lowerWord.endsWith("ange") && !lowerWord.endsWith("lange"))
        result = result.replace(/ændʒ$/, "eɪndʒ");
      // -erous/-arous/-orous/-urous: unstressed -er- is /ɝ/ (generous/cancerous/boisterous)
      if (/(?:erous|arous|orous|urous)$/.test(lowerWord))
        result = result.replace(/ɪɹəs$/, "ɝəs");
      // -ious/-eous: unstressed -i- before vowel cluster is /i/ not /ɪ/ (serious/obvious/furious)
      if (/(?:ious|eous)$/.test(lowerWord))
        result = result.replace(/ɪəs$/, "iəs");
      // Open-syllable long-a before sonorant-initial suffix (favor/raven/famous/savor/craven)
      if (/(?:aven|avor|avour)$/.test(lowerWord))
        result = result.replace(/æv(ɝ|ən)$/, "eɪv$1");
      if (lowerWord.endsWith("amous"))
        result = result.replace(/æm(əs)$/, "eɪm$1");
      // -ion (non-tion/-sion): unstressed -i- before -ən should be /i/ not /ɪ/ (carrion/clarion/ganglion)
      if (/ion$/.test(lowerWord) && !/(?:tion|sion)$/.test(lowerWord))
        result = result.replace(/ɪən$/, "iən");
      if (!lowerWord.endsWith("cission"))
        result = result.replace(/sɪʃən$/, "zɪʃən");
      if (lowerWord.length >= 9) result = result.replace(/ɪɹeɪʃən$/, "ɝeɪʃən");
      if (lowerWord.endsWith("iment"))
        result = result.replace(/ɪmənt$/, "əmənt");
      if (lowerWord.endsWith("ancy")) result = result.replace(/ænsi$/, "ənsi");
      if (lowerWord.endsWith("erage") || lowerWord.endsWith("erature"))
        result = result.replace(/ɛɹ/g, "ɝ");
      if (lowerWord.startsWith("mechan"))
        result = result.replace(/tʃ/, "k");
      if (lowerWord.startsWith("ei") && !/^ei(ght|ther)/.test(lowerWord))
        result = result.replace(/^eɪ/, "aɪ");
      if (/(?:berg|burg|stein(?:er)?|heim(?:er)?|bach|wald|feld|brand|mann|kamp|wein|bein|hoff|muth|dorf|tal|ler|ner|sen|born|mark|meier|eier|meister|eister|hardt|ardt|lein|heit|heid|meyer|eyer|weiser|eiser|ecker|decker|elman|eman|hein|eitel|itel|einl|eindl|indl|berger|egger|eiter|iter|wenger|enger|enson|itas|linger|fried|zig|eis|eiden|eider|hold|gold|zel|eineke|eincke|eineck|einke)$/.test(lowerWord) && lowerWord.includes("ei") && !lowerWord.includes("eight"))
        result = result.replace(/eɪ/g, "aɪ");
      if (lowerWord.includes("ei") &&
          (lowerWord.startsWith("klein") || lowerWord.startsWith("drei") || lowerWord.startsWith("breit") ||
           lowerWord.startsWith("mein") || lowerWord.startsWith("meio") || lowerWord.startsWith("wei") ||
           (lowerWord.startsWith("feig") && !lowerWord.startsWith("feigh")) ||
           (lowerWord.startsWith("hei") && !/^hei(?:nous|fer|r$|res|ress)/.test(lowerWord)) ||
           (lowerWord.startsWith("lei") && lowerWord.length >= 6 && !/^lei(?:sure|s$)/.test(lowerWord)) ||
           (lowerWord.startsWith("pf") && lowerWord.includes("ei"))))
        result = result.replace(/eɪ/g, "aɪ");
      if (lowerWord.includes("seism"))
        result = result.replace(/eɪ/g, "aɪ");
      if (lowerWord.includes("reif") && lowerWord.length >= 5)
        result = result.replace(/ɹeɪf/, "ɹaɪf");
      if (lowerWord.length >= 5 && /eidt?$/.test(lowerWord))
        result = result.replace(/eɪ([dt]?)$/, "aɪ$1");
      if (/(?:thet|theis|thesis|thesia|thentic|theon)/.test(lowerWord) && result.includes("ð"))
        result = result.replace(/ð/g, "θ");
      if (/ach(?:en|er)$/.test(lowerWord))
        result = result.replace(/tʃ([ɛəɪ])/, "k$1");
      if (/^g[ei]/.test(lowerWord) && /(?:berg|stein(?:er)?|heim(?:er)?|bach|wald|feld|brand|mann|kamp|wein|bein)$/.test(lowerWord))
        result = result.replace(/^dʒ/, "ɡ");
      if (/(?:berg|burg)$/.test(lowerWord) && (lowerWord.includes("ge") || lowerWord.includes("gi")) &&
          !lowerWord.includes("nge") && !lowerWord.includes("ngi"))
        result = result.replace(/dʒ/g, "ɡ");
      if ((lowerWord.startsWith("berg") && lowerWord.length >= 6 && !/(?:ey|y)$/.test(lowerWord)) ||
          (lowerWord.startsWith("mcg") && lowerWord.length >= 5 && !/orge$/.test(lowerWord)))
        result = result.replace(/dʒ/g, "ɡ");
      if (lowerWord.startsWith("beg") && lowerWord.length >= 5)
        result = result.replace(/^bɪdʒ/, "bɪɡ");
      if (
        (lowerWord.length >= 5 && (lowerWord.startsWith("gei") || /^gel[dbns]/.test(lowerWord) || lowerWord.startsWith("get"))) ||
        /^gi[dvm]/.test(lowerWord) ||
        (lowerWord.startsWith("gig") && lowerWord.length >= 4 && !/^gig(?:i$|lio|lia|lo|ot|ol)/.test(lowerWord)) ||
        (lowerWord.startsWith("ges") && lowerWord.length >= 5 && !/^gest(?:ure|iculat|ation|ural|at|alt|urin|al)/.test(lowerWord) && lowerWord !== "geske") ||
        (lowerWord.startsWith("geh") && lowerWord.length >= 5 && !/^geh(?:le|res|rke)$/.test(lowerWord))
      )
        result = result.replace(/^dʒ/, "ɡ");
      if (/(?:ingen|angen)$/.test(lowerWord) && lowerWord.length >= 7)
        result = result.replace(/dʒ([əɛɪ]n)$/, "ɡ$1");
      if (lowerWord.includes("eigen") || (lowerWord.includes("eig") && (lowerWord.startsWith("wei") || (lowerWord.startsWith("feig") && !lowerWord.startsWith("feigh")))))
        result = result.replace(/dʒ([əɛɪ])/g, "ɡ$1");
      if (lowerWord.endsWith("gel") && lowerWord.length >= 5 &&
          !/(?:cudgel|gudgel|kegel|nigel|rigel|bagel|angel|evangel|rangel|dgel)$/.test(lowerWord))
        result = result.replace(/dʒ([əɛɪ][lɫ]?)$/, "ɡ$1");
      if (lowerWord.endsWith("ger") && (
          (lowerWord.length >= 7 && /[bcdfghjklmnpqrstvwxyz]{2}ger$/.test(lowerWord)) ||
          (lowerWord.length >= 8 && !/(?:anger|inger|onger|enger|ager)$/.test(lowerWord))))
        result = result.replace(/dʒɝ$/, "ɡɝ");
      if (lowerWord.endsWith("gers") && lowerWord.length >= 7 && !/(?:[ao]ngers|agers|ingers|ungers)$/.test(lowerWord))
        result = result.replace(/dʒɝz$/, "ɡɝz");
      if (lowerWord.endsWith("gen") && lowerWord.length >= 7 && /[bcdfghjklmnpqrstvwxyz]{2}gen$/.test(lowerWord))
        result = result.replace(/dʒɛn$/, "ɡɛn").replace(/dʒən$/, "ɡən");
      if ((lowerWord.endsWith("ford") && lowerWord.length > 4) || /(?:worth|world|works?)$/.test(lowerWord))
        result = result.replace(/ɔɹ(d|θ|ld|ks?)$/, "ɝ$1");
      if (lowerWord.endsWith("fort") && lowerWord.length > 4)
        result = result.replace(/fɔɹt$/, "fɝt");
      if (lowerWord.includes("oe") && lowerWord.length >= 4)
        result = result.replace(/ɑɛ/g, "oʊ");
      if (lowerWord.includes("ae") && lowerWord.length >= 4)
        result = result.replace(/æɛ/g, "ɛ");
      if (lowerWord.includes("eo") && !lowerWord.includes("ae") && lowerWord.length >= 4)
        result = result.replace(/ɛoʊ/g, "ioʊ");
      if (lowerWord.endsWith("ouquet"))
        result = result.replace(/aʊkw[ɛə]t$/, "ukeɪ");
      if (lowerWord.endsWith("quet") && !lowerWord.endsWith("nquet") && !lowerWord.endsWith("mquet"))
        result = result.replace(/kw[ɛə]t$/, "keɪ");
      if (lowerWord.endsWith("ochet"))
        result = result.replace(/tʃ[ɛə]t$/, "ʃeɪ");
      if (lowerWord.endsWith("achet"))
        result = result.replace(/[ɛɪə]t$/, "eɪ");
      if (lowerWord.endsWith("alet"))
        result = result.replace(/[ɛɪə]t$/, "eɪ");
      if (lowerWord.endsWith("ette") && lowerWord.length >= 5)
        result = result.replace(/([^ɛɪæaouʊə])t$/, "$1ɛt");
      if (lowerWord.endsWith("oise") && lowerWord.length >= 7 &&
          !/^(?:noise|turquoise|vichyssoise|francoise|laframboise)/.test(lowerWord))
        result = result.replace(/ɔɪz$/, "əs");
      if (lowerWord.endsWith("augh") && lowerWord.length > 4)
        result = result.replace(/ə$/, "ɔ");
      if (lowerWord.endsWith("borough") && lowerWord.length > 7)
        result = result.replace(/[əʌ]f$/, "oʊ");
      if (lowerWord.endsWith("urious") && lowerWord.length >= 7)
        result = result.replace(/^([kf])ʌɹ/, "$1jʊɹ");
      if (/olumn|olemn/.test(lowerWord))
        result = result.replace(/oʊl([əm])/, "ɑl$1");
      if (lowerWord.startsWith("acou"))
        result = result.replace(/aʊ/, "u");
      if (lowerWord.endsWith("gue") && lowerWord.length >= 4 &&
          !/^(?:argue|ague|montague)$/.test(lowerWord))
        result = result.replace(/ɡu$/, "ɡ");
      if (lowerWord.endsWith("ois") && !lowerWord.endsWith("quois") && !lowerWord.endsWith("lois") && !lowerWord.endsWith("bois"))
        result = result.replace(/ɔɪs$/, "wɑ");
      if (lowerWord.endsWith("ais"))
        result = result.replace(/eɪs$/, "eɪ");
      if (lowerWord.endsWith("oir"))
        result = result.replace(/ɔɪɹ$/, "wɑɹ");
      if (lowerWord.endsWith("oux"))
        result = result.replace(/aʊks?$/, "u");
      if (lowerWord.includes("oup"))
        result = result.replace(/aʊp/g, "up");
      if (lowerWord.includes("oui") || lowerWord.includes("ouill"))
        result = result.replace(/aʊɪ/g, "ui");
      if (lowerWord.includes("ouv"))
        result = result.replace(/aʊv/g, "uv");
      if (lowerWord.endsWith("eau") && lowerWord.includes("ou"))
        result = result.replace(/aʊ/g, "u");
      if (lowerWord.endsWith("ou") && lowerWord !== "you" && lowerWord !== "thou")
        result = result.replace(/aʊ$/, "u");
      if (/[bmdvl]our$/.test(lowerWord) && lowerWord !== "devour" && lowerWord !== "flour")
        result = result.replace(/aʊɹ$/, "ɝ");
      if (lowerWord.endsWith("oussin"))
        result = result.replace(/aʊs/, "us");
      if (lowerWord.endsWith("ingham") && lowerWord.length >= 9)
        result = result.replace(/həm$/, "hæm");
      if (lowerWord.endsWith("tron"))
        result = result.replace(/tɹən$/, "tɹɑn");
      if (lowerWord.endsWith("gren"))
        result = result.replace(/ɡɹən$/, "ɡɹɛn");
      if (lowerWord.endsWith("craft") || lowerWord.endsWith("graft"))
        result = result.replace(/ɹ[əʌ]ft$/, "ɹæft");
      if (/(?:echt|icht)$/.test(lowerWord))
        result = result.replace(/tʃt$/, "kt");
      if (lowerWord.endsWith("hagen"))
        result = result.replace(/dʒ([ɛəɪ])n$/, "ɡ$1n");
      if (/(?:gerd|gert)$/.test(lowerWord))
        result = result.replace(/dʒɝ([dt])$/, "ɡɝ$1");
      if (lowerWord.startsWith("kh"))
        result = result.replace(/^kh/, "k");
      if (lowerWord.startsWith("dh"))
        result = result.replace(/^dh/, "d");
      if (lowerWord.startsWith("orch"))
        result = result.replace(/^ɔɹtʃ/, "ɔɹk");
      if (lowerWord.includes("chord"))
        result = result.replace(/tʃ([ɔɑɝ])/, "k$1");
      if (lowerWord.includes("anchor"))
        result = result.replace(/tʃ/, "k");
      if (lowerWord.includes("och") && !lowerWord.endsWith("och") && !lowerWord.endsWith("oche") && !/och[cfpt]/.test(lowerWord))
        result = result.replace(/[ɑɔ]tʃ/g, (m) => m[0] + "k");
      if (lowerWord.endsWith("och") && !lowerWord.endsWith("oach") && !lowerWord.endsWith("eoch"))
        result = result.replace(/[ɑɔ]tʃ$/, (m) => m[0] + "k");
      if (lowerWord.includes("acht") && !/(?:macht|nacht|wacht)/.test(lowerWord))
        result = result.replace(/[æɑ]tʃt/g, (m) => m[0] + "kt");
      if (lowerWord.includes("achen") || lowerWord.includes("achn"))
        result = result.replace(/[æɑ]tʃ([ɛəɪi]n|n)/, (m, s) => m[0] + "k" + s);
      if (/^arch[aeiou]/.test(lowerWord) && !lowerWord.startsWith("archen") && !/^arch(?:er|ery|es|ie|ies|ed)$/.test(lowerWord))
        result = result.replace(/^ɑɹtʃ/, "ɑɹk");
      if (lowerWord.endsWith("chter") && lowerWord.length >= 6)
        result = result.replace(/tʃtɝ$/, "ktɝ");
      if (lowerWord.endsWith("chner") && lowerWord.length >= 6 && !/tch(?:ner)$/.test(lowerWord))
        result = result.replace(/tʃ(?=[nɝ])/, "k");
      if (lowerWord.length >= 7 && /[bcdfghjklmnpqrstvwxyz](?:acher|icher)$/.test(lowerWord) &&
          !/(?:eacher|oocher|picher|spicher)$/.test(lowerWord) &&
          !/^(?:teacher|preacher|bleacher|reacher|poacher|beacher|beecher|breacher)/.test(lowerWord))
        result = result.replace(/tʃ(ɝ)$/, "k$1");
      if (lowerWord.endsWith("lich") && lowerWord.length >= 6 && !/[auo]lich$/.test(lowerWord))
        result = result.replace(/tʃ$/, "k");
      if (/(?:achel|ichel|echel)$/.test(lowerWord) && lowerWord.length >= 6 &&
          !/(?:rachel|michael|machel)$/.test(lowerWord))
        result = result.replace(/tʃ([əɛɪ][lɫ]?)$/, "k$1");
      if (lowerWord.includes("echt") && !/(?:echt|icht)$/.test(lowerWord) && !/echtl|echta/.test(lowerWord))
        result = result.replace(/ɛtʃt/g, "ɛkt");
      if (lowerWord.includes("ach") && !lowerWord.endsWith("ach") && !lowerWord.endsWith("ache") && !/ach[aeiou]/.test(lowerWord) && /ach[nblrm]/.test(lowerWord) && !lowerWord.includes("tach"))
        result = result.replace(/[æɑ]tʃ(?=[nblrm])/, (m) => m[0] + "k");
      if (lowerWord.includes("uch") && /uch[nblrm]/.test(lowerWord) && !/^(?:much|such|touch|vouch|pouch|couch|ouch|crouch|grouch|slouch)/.test(lowerWord) && !/^(?:bou|gou|lou|tou|vou)ch/.test(lowerWord) && !/uch[aeiou]$/.test(lowerWord))
        result = result.replace(/[ʌʊ]tʃ(?=[nblrm])/, (m) => m[0] + "k");
      if (lowerWord.includes("cchi"))
        result = result.replace(/ktʃ/g, "kk").replace(/tʃ/g, "k");
      if (/chet(?:ti|ta|to|te)$/.test(lowerWord) && lowerWord.length >= 6)
        result = result.replace(/tʃ/g, "k");
      if (/cci[oa]?$/.test(lowerWord))
        result = result.replace(/ks([ɪi]?)(oʊ|ə|ʊ|eɪ|a)?$/, "tʃ$1$2");
      if (lowerWord.includes("cci") && !/cci[oa]?$/.test(lowerWord)) {
        if (!/ccid|ccip|ccint|ccent/.test(lowerWord))
          result = result.replace(/ksɪ([ɑɔɛ])/g, "tʃ$1");
        if (/(?:ini|ino|elli|ello|illi|illo|iani|iano)$/.test(lowerWord))
          result = result.replace(/ksɪ/g, "tʃɪ");
      }
      if (lowerWord.includes("eich") && lowerWord.length >= 5) {
        result = result.replace(/eɪ/g, "aɪ");
        result = result.replace(/aɪtʃ/g, "aɪk");
      }

      // Add stress marker
      if (syllables.length > 1 && stressedSyllableIndex >= 0) {
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
      const baseShort = lowerWord.slice(0, -3);
      if (
        lowerWord.length > 4 &&
        lowerWord.slice(-4, -3) === baseShort.slice(-1)
      ) {
        const p = this.wellKnown(baseShort);
        if (p) return edPast(p);
      }
      const magicPron = this.wellKnown(base + "e");
      if (magicPron) return edPast(magicPron);
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

    // Common prefixes that don't usually take stress
    const unstressedPrefixes = [
      "un",
      "re",
      "pre",
      "dis",
      "mis",
      "under",
      "out",
    ];
    for (const prefix of unstressedPrefixes) {
      if (lowerWord.startsWith(prefix) && syllables.length > 2) {
        return 1; // Stress usually falls on the root, not the prefix
      }
    }

    // For 2-syllable words, generally stress the first syllable unless it's a weak prefix.
    // Check the first SYLLABLE (not the raw word) so that "bet·ter" doesn't
    // false-match the "be" prefix and stress the wrong syllable.
    if (syllables.length === 2) {
      const firstSyl = syllables[0];
      if (
        ["be", "de", "re", "un", "in", "ex", "pre"].some(
          (prefix) => firstSyl === prefix,
        )
      ) {
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
          pattern.source === "^ce$" ||
          pattern.source === "^se$" ||
          pattern.source === "^ge$") &&
        !isLastSyllable
      )
        continue;
      if (
        pattern.source === "^tu$" &&
        (isStressed || !nextSyllable?.match(/^[aeiou]/i))
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
      let matchFound = false;
      for (const [pattern, ipa] of PHONEME_RULES) {
        // ^al$ is for the -all rime (all/ball/call); skip it when the
        // original syllable had no doubled-l (e.g. "cal" in "calculator").
        if (!hadDoubledL && pattern.source === "^al$") continue;
        // g from doubled-gg (bigger/trigger/baggy/nugget) stays hard; skip soft-g rule.
        if (gFromDoubling && pattern.source === "^g(?=[eiy])") continue;
        // ^y$ → /i/ only when the syllable already has a prior vowel
        // (city/happy/novelty); skip for monosyllables like by/fly/try.
        if (!hasVowelBeforeTerminalY && pattern.source === "^y$") continue;
        // ^o$ → /oʊ/ for the last syllable (piano/hero/zero), stressed open syllables
        // (notion/vocal), and unstressed open syllables before magic-e (backbone/jawbone/alone).
        // Skip only when non-final, unstressed, AND not before magic-e.
        if (
          !isLastSyllable &&
          !isStressed &&
          !nextIsMagicE &&
          pattern.source === "^o$"
        )
          continue;
        // ^a$ fires only before tion/sion (nation), consonant-le (table), or magic-e (same/late).
        if ((!isLastSyllable || isStressed) && pattern.source === "^ous$")
          continue;
        if (
          (!isStressed || hasDoubledConsonantBeforeY) &&
          pattern.source === "^a(?=[^aeioun]y$)"
        )
          continue;
        if (
          nextSyllable !== "tion" &&
          nextSyllable !== "sion" &&
          !nextIsCle &&
          !nextIsMagicE &&
          pattern.source === "^a$"
        )
          continue;
        // ^u$ → /u/ for open-syllable u before tion/sion (solution) or magic-e (cute/tube/rude).
        if (
          nextSyllable !== "tion" &&
          nextSyllable !== "sion" &&
          !nextIsMagicE &&
          pattern.source === "^u$"
        )
          continue;
        // ^i$ → /aɪ/ in magic-e context or stressed before syllabic-l (bible/idle/rifle/title).
        if (
          !nextIsMagicE &&
          !endsWithSilentE &&
          (!nextIsCle || !isStressed) &&
          pattern.source === "^i$"
        )
          continue;
        if (!isLastSyllable && pattern.source === "^le$") continue; // ^le$: final only (legal/legend)
        if (isStressed && pattern.source === "^ey$") continue;
        if (!isLastSyllable && pattern.source === "^ier$") continue;
        // Word-initial-only rules (xylophone, gild vs agile).
        if (
          syllableIndex > 0 &&
          (pattern.source === "^x(?=[aeiouy])" || pattern.source === "^gil")
        )
          continue;
        // Greek-origin silent-p rules (psalm/pterodactyl/pneumonia) must fire at the very
        // start of the word only — not mid-syllable (lapse/accept/adept/script).
        if (
          (syllableIndex > 0 || phonemes.length > 0) &&
          (pattern.source === "^pt" || pattern.source === "^ps" || pattern.source === "^pn")
        )
          continue;
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
