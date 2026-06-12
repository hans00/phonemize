/**
 * Rule-based syllable engine for English G2P.
 *
 * Pure functions + their data tables, extracted verbatim from
 * en-g2p.ts: Maximal-Onset syllabification, morphology/weight-driven
 * stress assignment, and per-syllable IPA conversion (SUFFIX_RULES /
 * PHONEME_RULES, first match wins — order is load-bearing).
 */
import type { TraceStep } from "./en-g2p";
import * as stressGramsJson from "../data/en/stress-grams.json";
import { resolveJson } from "./utils";

// Mined ending-gram → primary-stress-from-end table (see
// scripts/mine-stress-grams.ts). Longest gram wins; each entry
// net-fixes ≥3 words against the heuristics below.
const STRESS_GRAMS = resolveJson<Record<string, Record<string, number>>>(
  stressGramsJson,
);
const STRESS_GRAMS_4: Record<string, number> = Object.assign(
  Object.create(null),
  STRESS_GRAMS["4"],
);
const STRESS_GRAMS_3: Record<string, number> = Object.assign(
  Object.create(null),
  STRESS_GRAMS["3"],
);

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz".split(""));

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
  [/^wr/, "ɹ"], // write, wrong, wrist (silent w)
  [/^rh/, "ɹ"], // rhyme, rhino — Greek silent h; guarded in loop so compound-name r|h boundaries keep /h/ (bar|ham)
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

export function syllabify(word: string): string[] {
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
export function assignStress(syllables: string[], word: string): number {
  if (syllables.length <= 1) return 0;

  const lowerWord = word.toLowerCase();

  // Mined ending-gram override (longest gram first): the table maps a
  // spelling ending to the lexicon's modal stress position from the
  // word end (1 = final syllable).
  const fromEnd =
    STRESS_GRAMS_4[lowerWord.slice(-4)] ?? STRESS_GRAMS_3[lowerWord.slice(-3)];
  if (fromEnd !== undefined)
    return Math.max(0, Math.min(syllables.length - 1, syllables.length - fromEnd));

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
    if (isLikelyCompound(lowerWord, syllables)) {
      return 0; // First syllable gets primary stress in compounds
    }

    const penult = syllables[syllables.length - 2];
    if (isSyllableHeavy(penult)) {
      return syllables.length - 2; // Stress the penult if heavy
    } else {
      return Math.max(0, syllables.length - 3); // Stress the antepenult if penult is light
    }
  }

  return 0; // Default fallback
}

export function isSyllableHeavy(syllable: string): boolean {
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

export function isLikelyCompound(word: string, syllables: string[]): boolean {
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
export function syllableToIPA(
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
    // Greek silent-h ^rh only fires word-initially or in -rrh- (the
    // prior syllable ends in r: diarrhea, hemorrhage). A plain medial
    // r|h is a compound/name boundary where h is pronounced (barham).
    if (syllableIndex > 0 && !prevSyllable?.endsWith("r")) skip.add("^rh");
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
