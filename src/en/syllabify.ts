/**
 * Rule-based syllable engine for English G2P.
 *
 * Pure functions + their data tables, extracted verbatim from
 * en-g2p.ts: Maximal-Onset syllabification, morphology/weight-driven
 * stress assignment, and per-syllable IPA conversion (SUFFIX_RULES /
 * PHONEME_RULES, first match wins — order is load-bearing).
 */
import type { TraceStep } from "./g2p";

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz".split(""));

// Valid English onsets (consonant clusters that can start a syllable)
const VALID_ONSETS = new Set(
  "b bl br c ch cl cr d dr dw f fl fr g gl gr gu h j k kl kn kr l m n p ph pl pr ps q qu r rh s sc sch scr sh sk sl sm sn sp sph spl spr st str sv sw t th thr tr ts tw v w wh wr x y z".split(" "),
);

// --- Phoneme Rules ---

// Improved stress-sensitive suffix rules
const SUFFIX_RULES: Array<[RegExp, string, boolean]> = [
  [/^ge$/, "dʒ", false],
  [/^[cs]e$/, "s", false],
  [/^que$/, "k", false],
  [/^the$/, "ð", false],
  [/^sten$/, "sən", false],
  [/^stion$/, "stʃən", false],
  [/^t(?:ion|ian)$/, "ʃən", false], // -tion/-tian are always unstressed
  [/^s(?:ion|ian)$/, "ʒən", false], // -sion/-sian are always unstressed (asian/persian: 25 ʒ vs 9 i in dict; russian → sʒ → ʃ post-lexically)
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
  [/^ead/, "ɛd"], // head, bread, dead, spread, instead, deadline (ea+d closing the syllable: 106 ɛ vs 16 i in dict; the /i/ bases lea|der/rea|ding move the d to the next syllable and never reach here)
  [/^ear(?=[nlcr])/, "ɝ"], // learn, earn, early, pearl, search, earl (ear before n/l/c/r: 63:9 in dict; d/t/s stay ɪɹ/ɑɹ)
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
  [/^ign(?=s?$)/, "aɪn"], // sign, design, align, assign, benign, resign: syllable-final -ign is the silent-g rime (14 aɪn vs 1 in dict; the ɪɡn words dig|nity, sig|nal, ig|nore all move the n onto a following vowel). aign/eign never reach it — ^ai/^ei eat the vowel first.
  [/^oa/, "oʊ"], // boat, coat, road
  // LOT→THOUGHT frames. Doubled consonants are deduped before the rules
  // run, so the coda spellings here are single: `of` covers -off/-offC.
  // (That dedup is also why the ^oss rule these replace could never fire.)
  [/^ong/, "ɔŋ"], // long, song, strong, along, belong (123:13 in dict)
  [/^of$/, "ɔf"], // off, offer, office, often, software (242:60 in dict)
  [/^eur/, "ɝ"], // connoisseur, entrepreneur (French -eur → /ɝ/)
  [/^eu/, "ju"], // feud, neuter, Europe
  [/^ue/, "u"], // true, blue, glue (at end)
  [/^uy$/, "aɪ"], // buy, guy
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
  [/^tur$/, "tʃɝ"], // unstressed medial -tur-: natural, cultural, structural (guard: idx>0 && unstressed; 9:1 in dict)
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
  [/^s(?=ed$|ers?$|ing$)/, "z"], // -sed/-ser/-sing on a dropped silent-e base: used/adviser/closing (guard in loop; 191:119 in dict)
  [/^s/, "s"],
  [/^t/, "t"],
  [/^v/, "v"],
  [/^w/, "w"],
  [/^x(?=[aeiouy])/, "z"],
  [/^x/, "ks"], // word-initial x→z (xylophone) | x→ks (tax)
  [/^ym(?![aeiou])/, "ɪm"],
  [/^yn(?![aeiou])/, "ɪn"], // gym/symbol | syntax/synchronize
  [/^y(?=$)/, "ɪ"], // open y before an st onset: system, mystery, crystal, hysteria (39:6 in dict; guard in loop)
  [/^y$/, "i"], // city, happy, country — final y after prior vowel (guard in loop)
  [/^y(?=[aeiou])/, "j"], // yes, you, year (consonantal before vowels)
  [/^y(?=[^aeiouy]+$)/, "ɪ"], // y in closed syllable → ɪ (myth, glyph, crypt, physics, system)
  [/^y/, "aɪ"],
  [/^z/, "z"], // by/my/try | z
  // Default vowels (short/lax in closed syllables)
  [/^a(?=[^aeioun]y$)/, "eɪ"], // baby, lazy, navy, gravy, shady — aCy → long a
  [/^a$/, "eɪ"], // nation/station/abrasion — open-syllable a before -tion/-sion (guard in loop)
  [/^a/, "æ"], // cat, hat, bad
  [/^e$/, "i"], // be, me, we — open monosyllable (guard in loop)
  [/^e/, "ɛ"], // bed, red, get (but she -> ʃi handled above)
  [/^i$/, "aɪ"], // mine, vine, time, like — open-syllable i before magic-e (guard in loop)
  [/^i/, "ɪ"], // sit, hit, big
  [/^o$/, "oʊ"], // piano, hero, zero, echo, cargo — word-final bare o (guard in loop)
  [/^o/, "ɑ"], // cot, hot, dog (American English short o)
  [/^u/, "ʌ"], // cut, but, run
];

export function syllabify(word: string): string[] {
  // A more linguistically informed syllabification algorithm based on Maximal Onset Principle.
  // This is a complex problem, and this implementation is a heuristic approach.

  // 0. Pre-handle exceptions and very short words. A three-letter
  // vowel + consonant + e word (use, ace, ice, age, ate) is a magic-e
  // rime: split it like its longer relatives (u|se, ca|se) so the
  // open-syllable vowel and the -se/-ce/-ge suffix rules apply. r/l are
  // excluded because -re/-le are re-merged rimes below (are, ale); e is
  // excluded because open-syllable e has no tense rule (eve, eke).
  if (word.length <= 3) {
    return /^[aiou][bcdfgkmnpstvz]e$/.test(word) ? [word[0], word.slice(1)] : [word];
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
      nucleus[nucleus.length - 1] !== "y" &&
      i < chars.length &&
      chars[i] === "w" &&
      i + 1 < chars.length &&
      VOWELS.has(chars[i + 1])
    ) {
      nucleus += chars[i];
      i++;
    }

    // Find the following consonant cluster (coda + next onset). A y
    // after a consonant and not before a vowel is a nucleus (sy|stem,
    // ty|pi|cal, rhy|thm), not part of the cluster; y before a vowel
    // (yes, can|yon, be|yond) and word-initial y stay consonantal.
    let consonants = "";
    while (i < chars.length && CONSONANTS.has(chars[i])) {
      if (
        chars[i] === "y" &&
        consonants.length > 0 &&
        !VOWELS.has(chars[i + 1] ?? "")
      )
        break;
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

  // Post-processing: -Vre and -Vle magic-e rimes. Maximal onset splits
  // "fire" as ["fi", "re"] and "hole" as ["ho", "le"] because the lone
  // consonant starts a new onset, but each is one rime: the ^are/^ire/
  // ^ore/^ure/^ere rules need the whole pattern in one syllable, and the
  // 'l' of -Vle is a plain consonant, not the syllabic -Cle. Merge only
  // after a vowel, so syllabic "ble/ple/tle" (3+ chars) is unaffected.
  const last = syllables[syllables.length - 1];
  if (syllables.length > 1 && (last === "re" || last === "le")) {
    const prev = syllables[syllables.length - 2];
    if (prev && VOWELS.has(prev[prev.length - 1])) {
      syllables.pop();
      syllables[syllables.length - 1] += last;
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

/**
 * Alternating (rhythmic) secondary stress: the beat two syllables away
 * from the primary keeps its full vowel, which is exactly the vowel the
 * reduction pass in `syllableToIPA` was flattening (ˌæpɫəˈkeɪʃən, not
 * əpɫəˈkeɪʃən).
 *
 * Measured over the 100871 alphabetic single-primary entries of
 * data/en/dict.json, tabulating each nucleus by its distance from the
 * primary syllable:
 *
 *   d=-2  n=7202   full 70.5%  schwa 11.1%  ɪ 16.2%
 *   d=-1  n=28870  full 43.2%  schwa 32.8%  ɪ 17.2%
 *   d=+1  n=19731 (non-final)  full 15.8%  schwa 50.7%  ɪ 21.5%
 *   d=+2  n=2973  (non-final)  full 63.4%  schwa 19.6%  ɪ 12.3%
 *   d=+2  n=16758 (final)      full 48.7%  schwa 25.7%  ɪ 11.0%  ɝ 14.6%
 *
 * The ±2 beats are full-vowelled 3-6× more often than schwa while the
 * adjacent ±1 beats are not, so distance parity — not the ending — is
 * the rule. Two frames inside it are not beats:
 *
 *   - A pretonic open syllable whose follower is also open, word-medially:
 *     that is the thematic linking vowel of a stacked Latinate suffix
 *     (for·ti·fi·ca·tion, or·ga·ni·za·tion), which never carries a beat.
 *     The initial syllable is exempt from the exclusion — it is the
 *     default secondary site in English (ˌækəˈdɛmɪk) — and word-medially
 *     the d=-2 column splits 55.5% full : 24.9% schwa (n=1201) against
 *     73.6% : 8.3% (n=6001) word-initially.
 *   - A word-final beat without a single obstruent coda. Split by the coda
 *     of that final syllable, d=+2 final is 59.4% full : 17.6% schwa for a
 *     one-consonant obstruent (n=4046) but only 29.9% : 53.8% for a
 *     sonorant (n=5104), and the open 58.3% is really the 36.4% of -or/-ar
 *     rimes that the final syllable's own branch already turns into /ɝ/.
 *     Spelled <e> before s/d is the inflectional vowel (cam·pu·ses,
 *     -ed/-es), never a beat, so the obstruent set excludes s/d after <e>.
 */
export function secondaryStressIndices(
  syllables: string[],
  primary: number,
): Set<number> {
  const out = new Set<number>();
  if (primary < 0) return out;
  const isOpen = (i: number): boolean =>
    !!syllables[i] && VOWELS.has(syllables[i][syllables[i].length - 1]);
  const before = primary - 2;
  if (before >= 0 && !(before > 0 && isOpen(before) && isOpen(before + 1)))
    out.add(before);
  // A silent-e coda gets its own orthographic slot (ca·pa·ci·tan·ce) but
  // is not a syllable, so the last slot that bears a nucleus is the one
  // the word-final test has to apply to. Syllabic -Cle (ta·ble) is one.
  let last = syllables.length - 1;
  if (last > 0 && SILENT_E_SLOT.test(syllables[last])) last--;
  const after = primary + 2;
  if (after <= last && (after < last || FINAL_BEAT_RIME.test(syllables[after])))
    out.add(after);
  return out;
}

const FINAL_BEAT_RIME = /[aiouy][bcdfgkpstxz]$|e[bcdfgkptxz]$/;
const SILENT_E_SLOT = /^[^aeiouy]*[^aeiouyl]e$/;

// Word-final grams whose primary-stress slot, counted back from the last
// slot, is near-categorical in data/en/dict.json. See the use site in
// `assignStress` for the adoption test.
const FINAL_GRAM_STRESS: Record<string, number> = {
  ated: 3,
  son: 2, ina: 1, ian: 1, ies: 2, ied: 2, day: 2,
};

// Improved stress assignment based on morphological and phonological rules
export function assignStress(syllables: string[], word: string): number {
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

  // Greek/Latin scientific suffixes with fixed stress: uranium, samarium,
  // osmosis, diagnosis, arthritis, analysis, psoriasis. They pull the
  // primary onto the syllable before the suffix. The orthographic
  // syllabifier groups the trailing "-rium/-nosis/-lysis" as one chunk, so
  // that target is the penult of the syllable array (length - 2).
  if (
    (lowerWord.endsWith("ium") ||
      lowerWord.endsWith("osis") ||
      lowerWord.endsWith("itis") ||
      lowerWord.endsWith("ysis") ||
      lowerWord.endsWith("iasis")) &&
    syllables.length >= 2
  ) {
    return Math.max(0, syllables.length - 2);
  }

  // -ance/-ence is unstressed (162:31 əns:æns in dict, and that æns set
  // is final-stressed), and maximal onset splits it over two slots
  // ("dis|tan|ce"), so a 3-slot array is a monosyllabic stem: stress it
  // (distance ˈdɪstəns, balance ˈbæɫəns). Longer stems keep the
  // root-initial default (dominance ˈdɑmənəns, equivalence ɪˈkwɪvəɫəns).
  if (
    (lowerWord.endsWith("ance") || lowerWord.endsWith("ence")) &&
    syllables.length >= 3
  ) {
    return syllables.length === 3 ? 0 : 1;
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
  // A doubled consonant at the boundary (abbey, adder, common) means one
  // morpheme, not prefix + root.
  const isPrefix = (prefix: string): boolean =>
    lowerWord[prefix.length] !== prefix[prefix.length - 1];
  // Privative un-/in-/dis-/mis-/ab- attach to a whole word, so once the stem
  // is long enough to carry its own stress the primary sits deeper than the
  // root-initial slot (unbelievable, indispensable, misunderstanding). The
  // root-attaching Latin prefixes put it on slot 1 at every length. Over the
  // dict words that actually reach this loop: at 3 slots "slot 1" beats the
  // penult fallback for every prefix (1491/2394 vs 1217/2394); at 4+ slots
  // the word-attaching five lose to it (320/840 vs 466/840) while the rest
  // still win.
  const WORD_ATTACHING = /^(?:ab|dis|mis|un|under)$/;
  for (const prefix of unstressedPrefixes)
    // Stress falls on the root, not the prefix.
    if (
      lowerWord.startsWith(prefix) &&
      syllables.length > 2 &&
      isPrefix(prefix) &&
      !(syllables.length >= 4 && WORD_ATTACHING.test(prefix))
    )
      return 1;

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
  // Only prefixes whose dict majority is final stress belong here. ab
  // (17/25 initial), ad (24/33), con (100/141) and in (92/134) are majority
  // initial and are excluded; com (29/42) and pro (53/67) are majority
  // initial in the dict too but measured net-negative on full IPA, so they
  // stay.
  if (syllables.length === 2) {
    const firstSyl = syllables[0];
    const PREFIXES_2SYL = [
      "be", "com", "de", "dis", "ex", "ob", "pre", "pro", "re", "sub", "un",
    ];
    // com-/pro- only give the stress away to a *tense* root — one with a
    // vowel digraph (proceed, procure, compound) or a silent-e (promote,
    // compose). Over a lax root they keep the stress themselves: 89% of the
    // 64 lax pro- words in the dict are initial (13 of the 14 in the
    // top-5000 list), 82% of the 34 com- ones. The other prefixes stay
    // unconditional — be- (17% initial among common words), re- (35%),
    // pre- (40%) and ex- (33%) are genuinely final-stressed on lax roots.
    const laxRoot =
      !DIGRAPH_RIME.test(syllables[1]) && !/[^aeiouy]e$/.test(syllables[1]);
    if (/^(?:com)$/.test(firstSyl) && laxRoot) return 0;
    if (PREFIXES_2SYL.includes(firstSyl)) return isPrefix(firstSyl) ? 1 : 0;
    // The bare a- prefix is only weak when the root behind it is a tense
    // rime: about, abroad, again, agree, aboard, around, amount, aloud.
    // A light root keeps initial stress (acid, adam, atom, arab), so the
    // orthographic vowel digraph is the discriminator — the flat split is
    // 295 initial : 198 final in the dict, the digraph subset 37 : 66.
    // A word-final -ey/-ie is the unstressed /i/ ending (abbey, amie), not
    // a tense rime, so it is excluded.
    const tenseRoot =
      DIGRAPH_RIME.test(syllables[1]) && !/(?:ey|ie)$/.test(syllables[1]);
    if (firstSyl === "a" && tenseRoot) return 1;
    // Assimilated Latin ad-: account, approach, appear, allow. The doubled
    // consonant at the boundary is the assimilation, so `isPrefix` has to be
    // inverted here — it is a prefix precisely because the letter repeats.
    if (
      /^a[bcdfglmnprstvz]$/.test(firstSyl) &&
      syllables[1][0] === firstSyl[1] &&
      tenseRoot
    )
      return 1;
    return 0;
  }

  // For 3+ syllables, use improved stress assignment
  if (syllables.length >= 3) {
    // Check for compound words (typically have primary stress on first part)
    if (isLikelyCompound(lowerWord, syllables)) {
      return 0; // First syllable gets primary stress in compounds
    }

    // The heaviness test below is close to a coin flip on this population
    // (10587 of the 21827 dict words that reach it, against 9511 for a flat
    // always-penult), so a word-final gram whose stress position is
    // near-categorical is consulted first. Each entry is the distance of the
    // primary from the LAST slot; every one has ≥20 dict words behind it,
    // ≥75% agreement, and ≥3 top-5000 words agreeing too — that last test is
    // what keeps surname endings (-nger, -rman, -wicz, -oski) out, since a
    // gram carried only by names buys dictionary score and not English.
    const gram =
      FINAL_GRAM_STRESS[lowerWord.slice(-4)] ??
      FINAL_GRAM_STRESS[lowerWord.slice(-3)];
    if (gram !== undefined && syllables.length - 1 - gram >= 0)
      return syllables.length - 1 - gram;

    const penult = syllables[syllables.length - 2];
    if (isSyllableHeavy(penult)) {
      return syllables.length - 2; // Stress the penult if heavy
    } else {
      return Math.max(0, syllables.length - 3); // Stress the antepenult if penult is light
    }
  }

  return 0; // Default fallback
}

// Vowel digraphs that make a syllable heavy (long nucleus).
const VOWEL_DIGRAPHS = "aa ai au aw ay ea ee ei eu ey ie oa oo ou ow oy ue ui".split(" ");
const DIGRAPH_RIME = new RegExp(VOWEL_DIGRAPHS.join("|"));

export function isSyllableHeavy(syllable: string): boolean {
  // A syllable is heavy if it has:
  // 1. A long vowel (vowel digraph)
  // 2. A vowel followed by two or more consonants
  // 3. Ends in a consonant (closed syllable)

;

  for (const digraph of VOWEL_DIGRAPHS) {
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

// Second elements that mark a compound (worldwide, homeland, network,
// highway, forward, outside, somewhere), the over- prefix, and the
// Germanic -berg/-burg name elements. "hundred" is unanchored: it is
// almost always compounded (two hundred, hundredth).
const COMPOUND_RE =
  /\w{4,}wide$|\w{3,}(?:land|work|time|way|ward|side|where|berg|burg)$|hundred|^over[a-z]{2,}/;

export function isLikelyCompound(word: string, syllables: string[]): boolean {
  // Detect potential compound words based on patterns
  if (syllables.length < 2) return false;

  // Common compound patterns
  return COMPOUND_RE.test(word);
}

// Long u is /ju/ (music, cute, few, use) except after a coronal or liquid
// onset, where American English drops the yod (tune, rule, new, blue, chew).
// Before an r onset the nucleus is lax (curious kjʊɹ, during dʊɹ, rural).
// `onset` is the last phoneme emitted before the vowel, if any.
function longU(onset: string | undefined, beforeR = false): string {
  const yod = onset === undefined || !/(?:[tdnlszɹθðʃʒ]|tʃ|dʒ)$/.test(onset);
  return (yod ? "j" : "") + (beforeR ? "ʊ" : "u");
}

// In an unstressed -ue syllable the yod survives after a single l or n
// (value, continue) and coalesces with t and s (statue tʃu, issue ʃu);
// d keeps /du/ (residue, fondue). Returns the replacement onset, or null.
const COALESCE: Record<string, string> = { t: "tʃ", s: "ʃ" };
function coalesceOnset(onset: string): string | null {
  return COALESCE[onset] ?? null;
}

// Second syllables that signal a magic-e base in a two-syllable word
// (bake+r, take+n, make+ing, base+is, fine+al, silent, vacant, matrix).
const TENSE_ENDINGS =
  /^[^aeiouy]+(?:e[rdsn]|ers|est|ing|ings|or|ors|al|als|ent|ents|ant|ants|us|is|ix)$/;

// Enhanced syllable to IPA conversion with stress-sensitive vowel reduction
// Suffixes that only spell a suffix at the end of the word
// (legionnaire/album/algebra keep the plain letter values) and ones that
// are never word-initial (a lone "lion"/"ford"/"ward" is the noun).
const FINAL_ONLY_SUFFIXES = new Set(
  "^le$ ^cle$ ^twood$ ^al$ ^que$ ^sten$ ^[cs]e$ ^ge$ ^ty$ ^ly$".split(" "),
);
const NON_INITIAL_SUFFIXES = new Set("^lion$ ^scien$ ^ford$ ^ward$".split(" "));

// Orthographic vowel groups in a string — the syllable count the
// spelling implies, used by the depth tests below.
const vowelGroups = (s: string): number => s.match(/[aeiouy]+/g)?.length ?? 0;

const reduceTable = (eps: string): Record<string, string> => ({
  ɑɹ: "ɑɹ", ɔɹ: "ɔɹ", ɔɪ: "ɔɪ", æ: "ə", ɛ: eps, ɑ: "ə", ʌ: "ə", ɔ: "ə",
});

export function syllableToIPA(
  syllable: string,
  syllableIndex: number,
  isStressed: boolean,
  isLastSyllable: boolean,
  nextSyllable?: string,
  steps?: TraceStep[],
  prevSyllable?: string,
  isNextLastSyllable = false,
  // Orthographic remainder of the word after this syllable.
  tail?: string,
  // Rhythmic secondary stress (see secondaryStressIndices): the syllable
  // is unstressed for every vowel-choice rule below but keeps its full
  // vowel through the reduction pass.
  isSecondary = false,
): string {
  const stepsStart = steps?.length ?? 0;
  let phonemes: string[] = [];
  // Source grapheme of each emitted phoneme, kept parallel to `phonemes`
  // so a reduction can key on the letter that produced a vowel.
  const sources: string[] = [];
  let remaining = syllable;
  const emit = (grapheme: string, ipa: string, rule: string): void => {
    phonemes.push(ipa);
    sources.push(grapheme);
    steps?.push({ grapheme, phoneme: ipa, rule });
  };

  // Check for suffix rules first
  // belle→bel|le double-l split: /l/ so post-dedup collapses to bɛl.
  if (remaining === "le" && isLastSyllable && prevSyllable?.endsWith("l"))
    return "l";
  // -se after vowel-i/e/o syllable → /z/ (advise/cheese/close); magic-e 'a' → /s/ via ^se$ rule.
  // -au also voices (cause/pause/applause, 7:3 in dict); -ou/-oo do not (house/goose).
  // A consonant + open u voices only when u|se is the whole stem (fuse,
  // muse, ruse — 13:0 in dict); in a longer word the -use noun/adjective
  // keeps /s/ (abuse, excuse, profuse, abstruse) and onsetless u|se is
  // the noun "use".
  if (
    remaining === "se" &&
    isLastSyllable &&
    (prevSyllable?.match(/[ieo]$|au$/i) ||
      (syllableIndex === 1 && /[^aeiou]u$/i.test(prevSyllable ?? "")))
  )
    return "z";
  for (const [pattern, ipa] of SUFFIX_RULES) {
    const src = pattern.source;
    if (!isLastSyllable && FINAL_ONLY_SUFFIXES.has(src)) continue;
    if (NON_INITIAL_SUFFIXES.has(src) && syllableIndex === 0) continue;
    if (src === "^sto$" && nextSyllable !== "ne") continue;
    if (src === "^the$" && (syllableIndex === 0 || !isLastSyllable)) continue;
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
    !/(?:ee|[^aeiou]le|he|tte|se|[aeiou]re)$/.test(syllable) &&
    CONSONANTS.has(syllable[syllable.length - 2]) &&
    // be/me/we: in a one-syllable word the e is the nucleus, not silent
    (syllableIndex > 0 || /[aeiouy]/.test(syllable.slice(0, -1)));

  if (endsWithSilentE) {
    remaining = syllable.slice(0, -1);
  }

  const nextIsCle = !!nextSyllable?.match(/^[bdfgkmnprstvz]le$/);
  // Maximal onset opens the syllable before these (cu|stom, pu|blic,
  // fi|sher) but English keeps the vowel lax there.
  const nextIsLaxCluster = !!nextSyllable?.match(/^(?:s[bcdfgkmnpqtvz]|bl|sh|ch|th|x)/);
  // Stressed open first syllable of a two-syllable word whose second
  // syllable is an inflection-shaped ending (baker, paper, taken, making,
  // basis, final, silent, tiger): the vowel is the tense magic-e vowel of
  // the base. Other endings (magic, rapid, habit, cabin, panel, wagon,
  // image, finish) keep the lax default. Onsetless a before any other
  // ending is the unstressed prefix (about, alone); a before r and i
  // before v or -en/-ion are lax (baron, river, given, vision).
  const twoSylTense =
    syllableIndex === 0 && isNextLastSyllable && isStressed && !nextIsLaxCluster &&
    !!nextSyllable && TENSE_ENDINGS.test(nextSyllable);
  const nextIsMagicE =
    (isStressed || isNextLastSyllable) &&
    !!nextSyllable?.match(/^[^aeiou]e$/);
  // Trisyllabic laxing. A stressed open o/y keeps its tense vowel in the
  // penult (motion, hero, cycle) but goes lax two or more syllables from
  // the end (policy ɑ, monitor, comedy; pyramid ɪ, synergy) and before
  // stress-attracting -ic (topic, sardonic, cynic). The orthographic
  // syllabifier merges -Cy back into the previous syllable (po·licy), so
  // the depth is counted from `tail`, not from the syllable array; a
  // final silent e is not a syllable (do·na·te → "nat", 1).
  // Endings that keep the tense vowel: an ɔɹ rime (historic, chloride),
  // a final -o (lozano, molano), -ary/-ery (notary, grocery), -ency/-ence
  // (potency, cogency), the German -berg/-burg name element and the over-
  // prefix; y also stays tense before a Cl/Cr onset (hydrogen, cyclic).
  // Measured rules-only over the dict: 153 strict wins : 60 losses, of
  // which y contributes 10:7 and the -ic trigger 10:4.
  const t = tail ?? "";
  const tailSyls = vowelGroups(t.replace(/([^aeiouyl])e$/, "$1"));
  const laxDomain =
    isStressed &&
    (/^[^aeiouy]+ics?$/.test(t) ||
      (tailSyls >= 2 &&
        !/o$/.test(t) &&
        !/b[eu]rg$/.test(t) &&
        !/^[^aeiouy]?[ae]r(?:y|ies)$/.test(t) &&
        !/^[^aeiouy]+[ae]n(?:ce|cy)$/.test(t) &&
        !(syllable === "o" && t.startsWith("ver"))));
  const triLax =
    laxDomain && !t.startsWith("r") && /^[^aeiouy]*o$/.test(syllable);
  const triLaxY =
    laxDomain && !/^[^aeiouy][lr]/.test(t) && /^[^aeiouy]*y$/.test(syllable);
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
      emit("s", "z", "phoneme:^s");
      break;
    }
    // s after an unstressed Latin re-/de-/pre- prefix voices (result,
    // present, design, reserve): 79:60 in dict. ab-/ob-/de- split overall
    // (20:48 for ab-/ob-) but are unanimous before the -serv-/-sert-/-sorb-
    // stem (deserve, desertion, observe, absorb): 20:0 in dict.
    if (
      syllableIndex === 1 &&
      ((/^p?re$/.test(prevSyllable ?? "") && /^s[aeiouy]/.test(remaining)) ||
        (/^(?:[ao]b|de)$/.test(prevSyllable ?? "") &&
          /^s(?:er|orb)/.test(remaining)))
    ) {
      emit("s", "z", "phoneme:prefix-s");
      remaining = remaining.substring(1);
      continue;
    }
    // An s opening a non-initial syllable after an open one voices in the
    // frames where the dict votes for it. Measured z:s over the single-s
    // dict words each condition matches:
    //   Co|sen$/sey$/sie$  chosen, rosen, cosey, rosie       12:4
    //   ea|sel$/sant/son$/si$  reason, easel, peasant,
    //            feasible; the ea words that keep /s/ are the
    //            -ease/-easing/-easter/-easure tails, none of which
    //            reach this frame                              25:6
    //   digraph|sley$/sler$  the linking s of a -sley/-sler name
    //            after a front digraph (paisley, beasley, keesler)  20:2
    //   Ci/Co|si- before a -t/-b tail (visit, visitor, visible,
    //            depository)                                   14:2
    // A sixth frame, Cu|sic- (music), measured +4/-1 but the dict is 4:4
    // on it and every win is the one music/musical/musician family — a
    // per-word patch in frame clothing, so it is not here.
    if (
      syllableIndex > 0 &&
      phonemes.length === 0 &&
      ((isLastSyllable &&
        /[^aeiou]o$/.test(prevSyllable ?? "") &&
        /^s(?:en|ey|ie)$/.test(remaining)) ||
        (/ea$/.test(prevSyllable ?? "") &&
          /^s(?:el$|ant|on$|i(?:er)?$)/.test(remaining)) ||
        (isLastSyllable &&
          /(?:ea|ee|ie|ai|ui)$/.test(prevSyllable ?? "") &&
          /^sl(?:ey|er|ing|y)$/.test(remaining)) ||
        (/[^aeiou][io]$/.test(prevSyllable ?? "") &&
          (remaining === "sit" ||
            (remaining === "si" && /^(?:tor|b)/.test(nextSyllable ?? "")))))
    ) {
      emit("s", "z", "phoneme:onset-s");
      remaining = remaining.substring(1);
      continue;
    }
    // -sy on a one-syllable vowel base voices (busy, easy, noisy, rosy):
    // 14:7 in dict. Polysyllabic -sy (fantasy, heresy) keeps /s/.
    if (
      remaining === "sy" &&
      isLastSyllable &&
      syllableIndex === 0 &&
      !syllable.includes("ss") &&
      /[iɪeɛæɑɔoʊuʌəɝ]$/.test(phonemes[phonemes.length - 1] ?? "")
    ) {
      emit("s", "z", "phoneme:^s(?=y$)");
      remaining = "y";
      continue;
    }
    if (
      remaining === "le" &&
      phonemes.length > 0 &&
      /[iɪuʊɛæɑɔʌəɝ]$/.test(phonemes[phonemes.length - 1])
    ) {
      emit("le", "l", "phoneme:le");
      break;
    }
    // Long-u spellings whose yod depends on the onset (see longU):
    //   open u in a stressed or onsetless non-final syllable (mu|sic,
    //   stu|dent, u|nique) or before -tion/-sion/magic-e (so|lu|tion,
    //   u|se), ue (cue/due), ew (few/new). Closed-syllable u stays /ʌ/
    //   (cut, sun); unstressed open u after a consonant reduces (campus).
    //   Word-final -gue/-que keep their silent ue (league, plaque), and
    //   gu before e/i is hard g with a silent u (guess, guide, guitar).
    //   Maximal onset opens the syllable before s+C and bl clusters
    //   (cu|stom, pu|blic) but the vowel stays lax there.
    const onset = phonemes[phonemes.length - 1];
    if (
      (/^gu(?:e|i(?!l))/.test(remaining) || (endsWithSilentE && /^gui/.test(remaining))) &&
      !(remaining === "gue" && isLastSyllable) &&
      !(phonemes.length === 0 && prevSyllable?.endsWith("n"))
    ) {
      emit("gu", "ɡ", "phoneme:^gu(?=[ei])");
      remaining = remaining.substring(2);
      continue;
    }
    // A /w/-final onset (w, wh, qu, squ, sw) rounds a following closed-
    // syllable short a: want, wash, watch, swap, squad, wander, quantity.
    // Dict, single-`a` words with a w-final onset: 211 ɑ/ɔ vs 14 æ before
    // b/d/f/h/m/n/p/s/t. Before c and g the vowel stays æ (quack, whack,
    // wag, swagger); the l rimes are ^al$/^alk (wall, walk) and ar is the
    // NORTH branch just below.
    if (onset?.endsWith("w") && /^a[bdfhmnpst]/.test(remaining)) {
      emit("a", "ɑ", "phoneme:w+a");
      remaining = remaining.substring(1);
      continue;
    }
    // Same onset, r-controlled rime: NORTH, not START (war, warm, ward,
    // quarter, dwarf, thwart) — 123 ɔɹ vs 6 ɑɹ in the dict. Two exclusions:
    // the magic-e -are/-ary rimes are SQUARE (ware, square, wary), and an
    // unstressed -ward/-wart is the reduced suffix (edward, outward, which
    // maximal onset splits as e|dward, ou|tward, past the ^ward$ suffix).
    if (isStressed && onset?.endsWith("w") && /^ar(?![ey]$)/.test(remaining)) {
      emit("ar", "ɔɹ", "phoneme:w+ar");
      remaining = remaining.substring(2);
      continue;
    }
    // A stressed word-final bare `a` is the loan-word ɑ, not æ: la, ma, pa,
    // spa, bra, aha (dict: 28 ɑ vs 1 æ over stressed final C(C)a syllables).
    if (
      remaining === "a" &&
      isLastSyllable &&
      isStressed &&
      phonemes.length > 0 &&
      /^[^aeiouy]*a$/.test(syllable)
    ) {
      emit("a", "ɑ", "phoneme:^a$-loan");
      break;
    }
    if (remaining === "y" && triLaxY) {
      emit("y", "ɪ", "phoneme:^y$-lax");
      break;
    }
    if (
      remaining === "u" &&
      (nextSyllable === "tion" || nextSyllable === "sion" || nextIsMagicE ||
        (!isLastSyllable && !endsWithSilentE && (isStressed || onset === undefined) &&
          !nextIsLaxCluster))
    ) {
      emit("u", longU(onset, nextSyllable?.startsWith("r")), "phoneme:^u$");
      break;
    }
    if (
      /^(?:ue|ew)/.test(remaining) &&
      !(remaining === "ue" && isLastSyllable && onset !== undefined && /[ɡk]$/.test(onset) &&
        /[aeiouyn]$/.test(prevSyllable ?? ""))
    ) {
      let ipa = longU(onset);
      if (remaining.startsWith("ue") && !isStressed && onset !== undefined && phonemes.length === 1) {
        const merged = coalesceOnset(onset);
        if (merged) {
          phonemes[0] = merged;
          ipa = "u";
        } else if (/^[ln]$/.test(onset)) ipa = "ju";
      }
      emit(remaining.slice(0, 2), ipa, `phoneme:^${remaining.slice(0, 2)}`);
      remaining = remaining.substring(2);
      continue;
    }
    if (remaining === "the" && phonemes.length > 0) {
      emit("the", "ð", "phoneme:the-final");
      break;
    }
    // An open "ea" syllable is lax before these orthographic tails
    // (dict ɛ:i) — -ther feather/leather/weather 49:8, -san
    // pleasant/peasant 12:2, -lou jealous/zealous 9:0. The tails that
    // keep the tense default stay out: -son (season/reason 29:0),
    // -der (leader/reader 14:4), -ter (eater/theater 22:1).
    if (remaining === "ea" && /^(?:ther|san|lou)/.test(tail ?? "")) {
      emit("ea", "ɛ", "phoneme:^ea-lax");
      break;
    }
    // The same silent-g rime as ^ign, seen across a syllable boundary:
    // maximal onset moves the n onto a vowel-initial suffix (de|sig|ner,
    // un|sig|ned, sig|ners), leaving a bare "ig". 12 aɪn : 4 in the dict
    // — the losses are -igner names that keep the ɡ (brigner, tigner).
    // A suffix-shaped next syllable is required: sig|nal, dig|ni|ty and
    // sig|na|ture keep /ɪɡ/.
    if (remaining === "ig" && /^n(?:e[drs]|ers|ing|ment|ments|s)$/.test(nextSyllable ?? "")) {
      emit("ig", "aɪ", "phoneme:^ig(?=n-suffix)");
      break;
    }
    // Stressed i in hiatus with the next vowel is the tense /aɪ/ of an
    // open syllable, not the /i/ of the ie/ia digraphs. Frames measured
    // over the dict (aɪ : i): io anything — lion, riot, prior, ion — 22:5;
    // ia + a consonant that is not a bare final n — dial, giant, bias,
    // triad, liable — 24:6, while ia$ (mia, tia) is 2:15 and ian$ (ian,
    // cian) 3:7 and both stay lax; ie closing the syllable or before a
    // single s/d/r — die, lie, cries, cried, crier, drier — 52:11, the
    // -y verb inflections. Restricted to a stressed first syllable so
    // the -ier/-ion/-ial suffixes of car|ri|er, re|gion, mil|lion,
    // au|dio keep their unstressed /i/.
    if (isStressed && syllableIndex === 0 && isLastSyllable && /^ie[sdr]?$/.test(remaining)) {
      const coda = remaining.slice(2);
      emit(remaining, "aɪ" + (coda === "r" ? "ɝ" : coda), "phoneme:^ie$-hiatus");
      break;
    }
    // A single consonant before a syllabic -le belongs to the -le
    // syllable phonologically (ti|tle, i|dle), but tl/dl are not valid
    // onsets so the syllabifier leaves a closed tit/id and the vowel
    // never reaches the open-syllable ^i$ rule. When the next syllable
    // is a bare "le" the coda must also be a single consonant in the
    // spelling — the doubled codas (litt|le, midd|le, drizz|le) dedupe
    // to the same shape but stay lax. i is tense in the single-coda
    // frame: 8 aɪ : 0 in the dict — title, entitle, subtitle, idle,
    // bridle, sidle.
    if (
      isStressed && isNextLastSyllable && nextSyllable === "le" &&
      /^i[^aeiouylr]$/.test(remaining) &&
      !/([b-df-hj-np-tv-z])\1/.test(syllable)
    ) {
      emit("i", "aɪ", "phoneme:^i(?=Cle)");
      remaining = remaining.substring(1);
      continue;
    }
    if (isStressed && syllableIndex === 0 && /^i(?=o|a(?:[^aeiouyn]|n[^aeiouy]))/.test(remaining)) {
      emit("i", "aɪ", "phoneme:^i-hiatus");
      remaining = remaining.substring(1);
      continue;
    }
    // Precompute the set of pattern sources to skip for this syllable
    // context. The inner per-rule loop becomes a single Set.has() check
    // instead of 13+ string comparisons per rule. Built once per
    // syllable; for a 5-syllable word that's 5 small allocations
    // instead of 13 × 150 × 5 = ~10K string ops.
    const aFire = (nextSyllable === "tion" || nextSyllable === "sion" || nextIsCle || nextIsMagicE ||
      (twoSylTense && /^[^aeiouy]*a$/.test(syllable) && !nextSyllable!.startsWith("r")));
    const iFire = (nextIsMagicE || endsWithSilentE || (nextIsCle && isStressed) ||
      (twoSylTense && /^[^aeiouy]*i$/.test(syllable) && !/^(?:v|en$)/.test(nextSyllable!)));
    const skip = new Set<string>();
    if (!hadDoubledL) skip.add("^al$");
    if (gFromDoubling) skip.add("^g(?=[eiy])");
    if (!hasVowelBeforeTerminalY) skip.add("^y$");
    if (!isLastSyllable && !isStressed && !nextIsMagicE) skip.add("^o$");
    if (triLax) skip.add("^o$");
    if (!isLastSyllable || isStressed) skip.add("^ous$");
    if (!isStressed || hasDoubledConsonantBeforeY) skip.add("^a(?=[^aeioun]y$)");
    if (!aFire) skip.add("^a$");
    if (!iFire) skip.add("^i$");
    if (!isLastSyllable) { skip.add("^le$"); skip.add("^ier$"); }
    if (isStressed) skip.add("^ey$");
    // Open "e" is tense in four frames (rule-path strict win:loss over the
    // dict): a stressed magic-e syllable across the boundary (cede, scene,
    // compete, 67:3; -ere excluded, it is ɪɹ/ɛɹ 76 vs i 11), before -tion/-sion
    // (completion, deletion, 6:2), the unstressed re-/pre- prefix (release,
    // prevent, 411:136; de-/be- measured negative), and before consonant + i +
    // vowel (medium, tedious, 17:5). Elsewhere open e stays lax (seven, level).
    const eFire =
      (syllableIndex === 0 && isLastSyllable && /^[^aeiouy]+e$/.test(syllable)) ||
      (isStressed && isNextLastSyllable && nextIsMagicE &&
        /^[^aeiouy]*e$/.test(syllable) && !nextSyllable!.startsWith("r")) ||
      nextSyllable === "tion" || nextSyllable === "sion" ||
      (syllableIndex === 0 && !isStressed && !isLastSyllable && /^p?re$/.test(syllable)) ||
      (isStressed && !nextIsLaxCluster && /^[^aeiouy]*e$/.test(syllable) &&
        /^[^aeiouyr]+i[aeou][a-z]/.test(nextSyllable ?? "")) ||
      // The two-syllable magic-e frame that already tenses a and i, for
      // the subset of inflection endings where the dict backs it (i : ɛ):
      // -es 18:5 (thebes, ceres, feces), -us 14:6 (fetus, genus, jesus),
      // -al 11:6 (legal, penal, renal), -ing 8:3 (ceding), -ed 4:1,
      // -est 2:2. The endings left out measure even or negative and are
      // deliberately excluded: -er is 44:35 but costs ever/never/clever/
      // lever, -en 14:16 (seven), -is 6:15, -ent 7:10, -or 1:15, -ant 1:4.
      // Within the subset, a t/d before -al is lax (metal, medal, pedal,
      // petal 5 ɛ : 1) and so is an r-initial ending (feral, cerus); the
      // onset must be a single consonant, the shape of an open syllable.
      (twoSylTense && /^[^aeiouy]*e$/.test(syllable) &&
        /^(?:[^aeiouyrtd]als?|[^aeiouyr](?:es|us|ing|ed|est))$/.test(nextSyllable!));
    if (!eFire) skip.add("^e$");
    if (syllableIndex === 0 || isStressed) skip.add("^tur$");
    if (isLastSyllable || !nextSyllable?.startsWith("st")) skip.add("^y(?=$)");
    if (syllableIndex > 0) { skip.add("^x(?=[aeiouy])"); skip.add("^gil"); }
    // Greek silent-h ^rh only fires word-initially or in -rrh- (the
    // prior syllable ends in r: diarrhea, hemorrhage). A plain medial
    // r|h is a compound/name boundary where h is pronounced (barham).
    if (syllableIndex > 0 && !prevSyllable?.endsWith("r")) skip.add("^rh");
    if (syllableIndex > 0 || phonemes.length > 0) {
      skip.add("^pt"); skip.add("^ps"); skip.add("^pn");
    }
    // The -sed/-ser(s)/-sing suffix voices only on a base whose last vowel
    // is a plain i/e/o/u, ai/au or the oe/ey/oo of a Dutch/German name
    // (used, closing, appraiser, users, loeser, heyser, hooser — the
    // oe/ey/oo class is 16:3 in dict). Other digraphs keep /s/: ou
    // (houser), ei/ie (Germanic names beiser/rieser).
    if (
      !isLastSyllable ||
      !/(?:[^aeiou][ieou]|^[ieou]|a[iu]|oe|ey|oo)$/.test(prevSyllable ?? "")
    )
      skip.add("^s(?=ed$|ers?$|ing$)");
    // th before a/i/o/u is the Greek/Latin θ (author, method, marathon,
    // thalamus): 300:30 medially, 268:15 word-initially in dict. The ð
    // exceptions are all monosyllabic function words (this/that/thou), so
    // a one-syllable first syllable keeps the voiced default.
    if (
      /^th[aiou]/.test(remaining) &&
      (syllableIndex > 0 || (!isLastSyllable && !nextIsMagicE))
    )
      skip.add("^th(?=[aeiou])");
    // th+e is voiceless too when the previous syllable closes in a
    // consonant (anthem, esthete, mythic, naphtha): 226:32 in dict.
    // r is excluded — that cluster is voiced (further, northern, worthy);
    // w/y close a vowel digraph (lawther, blythe) and t a geminate (matthey).
    if (
      syllableIndex > 0 &&
      /^the/.test(remaining) &&
      /[^aeiouyrwt]$/.test(prevSyllable ?? "")
    ) {
      skip.add("^th(?=[aeiou])");
      skip.add("^the$");
    }

    let matchFound = false;
    for (const [pattern, ruleIpa] of PHONEME_RULES) {
      if (skip.has(pattern.source)) continue;
      let ipa = ruleIpa;
      const match = remaining.match(pattern);
      if (match) {
        // Fixed-yod rules (^ure$ jʊɹ, ^eu ju) drop the yod after a
        // coronal onset like every other long u (sure, neuter, deuce).
        // -ture/-dure keep it: the yod palatalizes (gesture tʃɝ) or the
        // lexicon writes dj (endure).
        const onset = phonemes[phonemes.length - 1];
        if (
          /^j[uʊ]/.test(ipa) && longU(onset) === "u" &&
          !(pattern.source === "^ure$" && /[td]$/.test(onset ?? ""))
        )
          ipa = ipa.slice(1);
        emit(match[0], ipa, `phoneme:${pattern.source}`);
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
  // The ɑɹ/ɔɹ/ɔɪ rows are identity guards so the bare ɑ/ɔ rows below them
  // can't strip the r/glide off a composite rime.
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

  if (!isStressed && !isSecondary && !isLastSyllable)
    applyReduction(reduceTable("ɪ"));

  if (
    !isStressed &&
    isLastSyllable &&
    syllableIndex > 0 &&
    !/all$/i.test(syllable) &&
    !/[aeiouy]n[gk]s?$/i.test(syllable) &&
    // A root after a stress-bearing prefix keeps its full vowel when its coda
    // is a pure obstruent (index, contest, contact); sonorant or open codas do
    // reduce (constant, condor, contra), so they stay in the reduction path.
    !(
      syllableIndex === 1 &&
      /^(ab|ad|be|com|con|de|dis|ex|im|in|mis|ob|out|pre|pro|re|sub|un|under)$/.test(
        prevSyllable ?? "",
      ) &&
      /[aeiouy][^aeiouylmnrw]+$/.test(syllable)
    )
  ) {
    if (!isSecondary) applyReduction(reduceTable("ə"));
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

  // Unstressed <i>/<e> that still has a vowel group after it lowers to /ə/.
  // Ratios come from aligning every dict word's orthographic vowel groups to
  // its IPA nuclei (85.8k words align 1:1); the frames below are the ones
  // that also measured net-positive on the rules-only win/loss harness.
  // Each ratio below is counted over exactly the frame the code tests:
  //   i before bl/pl/gr (accessible, principle, emigrant) 129 ə : 27 ɪ
  //   i before a single t in a 4+-group word, next letters not "ti"
  //     (ability, military, capacitance) 341 : 242 — the guard drops the
  //     -itious/-iti- words, where the i is the stressed one
  //   i two+ groups from the end of a 5+-group word before f/g/m/n/z
  //     (organization, abomination, investigate) 236 : 93, per consonant
  //     n 105 : 24, f 46 : 11, z 46 : 38, m 23 : 10, g 14 : 7; s is 2 : 3,
  //     below the support floor, so it is left out
  //   e two+ groups from the end, follow not r- or n+C (ceremony,
  //     secretary, disintegrate) 474 : 174
  // Everything else keeps ɪ: ng (0 ə : 532), sh, ck, k, ns, st, v, c, and an
  // empty follow (-ial/-ion/-ious), where the ɪ feeds the later -i+vowel
  // rules. A word-initial group also keeps it (invite, imagine, believe).
  if (!isStressed && !isSecondary) {
    for (let i = 0; i < phonemes.length; i++) {
      if (phonemes[i] !== "ɪ" || !/^[ie]$/.test(sources[i])) continue;
      if (syllableIndex === 0 && !/[aeiouy]/.test(sources.slice(0, i).join("")))
        continue;
      const rest = sources.slice(i + 1).join("") + (tail ?? "");
      const follow = rest.match(/^[^aeiouy]*/)![0];
      if (follow.length === 0) continue;
      const after = vowelGroups(rest.slice(follow.length));
      if (sources[i] === "e") {
        if (after >= 2 && !/^r|^n./.test(follow)) phonemes[i] = "ə";
        continue;
      }
      // Vowel-group depth of the word, approximating one group per preceding
      // syllable.
      const groups = syllableIndex + 1 + after;
      if (
        /^(?:[bp]l|gr)$/.test(follow) ||
        (follow === "t" && groups >= 4 && !/^ti/.test(rest)) ||
        (after >= 2 && groups >= 5 && /^[fgmnz]$/.test(follow))
      )
        phonemes[i] = "ə";
    }

    // Word-initial unstressed <e> closed by a sonorant keeps its full /ɛ/
    // instead of raising to /ɪ/: embargo, endorse, enforce, ellington.
    // The coda has to be a sonorant followed by another consonant — an
    // open initial syllable reduces (election, eleven, erosion), and so
    // does a sonorant followed by /t/ or /s/, where the lexicon splits the
    // other way (entire, ensure). Counted over data/en/dict.json on exactly
    // the frame the code tests — word-initial <e> + [lmnr] + a consonant
    // other than t/s, first syllable unstressed — the lexicon has 185 ɛ
    // against 103 ɪ; the change scores 64:10 strict on the rules-only
    // win/loss harness.
    if (
      syllableIndex === 0 &&
      phonemes[0] === "ɪ" &&
      sources[0] === "e" &&
      /^e[lmnr][^aeiouyts]/.test(syllable + (tail ?? ""))
    )
      phonemes[0] = "ɛ";
  }

  // Magic 'e' rule for stressed syllables
  if (endsWithSilentE && isStressed && phonemes.length > 0) {
    const shortToLong: Record<string, string> = {
      æ: "eɪ", // cap -> cape
      ɛ: "i", // met -> mete
      ɪ: "aɪ", // bit -> bite
      ɑ: "oʊ", // hop -> hope
      ʌ: "ju", // cut -> cute (tun -> tune: yod dropped after coronals, see longU)
    };

    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (shortToLong[phonemes[i]]) {
        phonemes[i] =
          phonemes[i] === "ʌ" ? longU(phonemes[i - 1]) : shortToLong[phonemes[i]];
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
