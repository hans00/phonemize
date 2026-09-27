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
const SUFFIX_RULES: Array<[RegExp, string]> = [
  [/^ge$/, "dʒ"],
  [/^[cs]e$/, "s"],
  [/^que$/, "k"],
  [/^the$/, "ð"],
  [/^sten$/, "sən"],
  [/^stion$/, "stʃən"],
  [/^t(?:ion|ian)$|^c[ei]an$/, "ʃən"], // -tion/-tian/-cian/-cean are always unstressed: technician/ocean
  [/^s(?:ion|ian)$/, "ʒən"], // -sion/-sian are always unstressed (asian/persian: 25 ʒ vs 9 i in dict; russian → sʒ → ʃ post-lexically)
  [/^lion$/, "ljən"], // -llion: million, billion, stallion (guard: syllableIndex > 0)
  [/^[ct]ial$/, "ʃəl"], // -cial/-tial (commercial, social, potential, partial)
  [/^cient$/, "ʃənt"],
  [/^scien$/, "ʃən"], // -cient: efficient/ancient; -scien: conscience (guard: idx>0)
  [/^ture$/, "tʃɝ"], // -ture (future, nature)
  [/^sure$/, "ʒɝ"], // -sure (measure, pleasure)
  [/^g[ei]ous$/, "dʒəs"], // -geous/-gious: gorgeous/contagious
  [/^[ct]ious$|^scious$|^ceous$/, "ʃəs"], // -cious/-tious/-scious/-ceous: delicious/conscious/crustaceous
  [/^kness$/, "knəs"], // -kness: darkness, frankness, weakness (k is pronounced, not silent)
  [/^ness$/, "nəs"], // -ness
  [/^ment$/, "mənt"],
  [/^less$/, "ləs"], // -ment / -less
  [/^ful$/, "fəl"],
  [/^ly$/, "li"], // -ful / -ly
  [/^er$/, "ɝ"],
  [/^ers$/, "ɝz"],
  [/^est$/, "əst"],
  [/^ing$/, "ɪŋ"],
  [/^ed$/, "d"],
  [/^ves$/, "vz"], // -ves plural (loaves/calves/wolves/selves)
  [/^e?s$/, "z"], // -es/-s (plural/3rd person)
  [/^age$/, "ɪdʒ"],
  [/^ism$/, "ɪzəm"],
  [/^ist$/, "ɪst"], // -ism/-ist
  [/^al$/, "əl"], // -ity / -al
  // -ic (economic, mathematic-); stress is handled separately by the
  // endsWith("ic") check in assignStress. The table's ipa is used
  // literally, so -ics needs its own entry (a "$1" here once shipped).
  [/^ic$/, "ɪk"],
  [/^ics$/, "ɪks"],
  [/^lity$/, "ləti"],
  [/^ty$/, "ti"],
  [/^[ae]ry$/, "ɛri"],
  [/^ory$/, "ɔri"],
  [/^y$/, "i"],
  [/^stein$/, "staɪn"],
  [/^ford$/, "fɝd"],
  [/^ward$/, "wɝd"],
  [/^more$/, "mɔɹ"],
  [/^b(?:erry|ury)$/, "bɛɹi"],
  [/^well$/, "wɛl"],
  [/^back$/, "bæk"],
  [/^beck$/, "bɛk"],
  [/^star$/, "stɑɹ"],
  [/^tel[l]?$/, "tɛl"],
  [/^te[ck]$/, "tɛk"],
  [/^cor[e]?$/, "kɔɹ"],
  [/^sto$/, "stoʊ"],
  [/^dale$/, "deɪl"],
  [/^twood$/, "twʊd"],
  [/^cle$/, "kəɫ"], // syllabic -cle ending: circle/barnacle/miracle/uncle
  [/^le$/, "əl"], // syllabic-l: battle/simple/table (guard in loop for ll-split)
];

// Context-sensitive phoneme rules with improved accuracy
const PHONEME_RULES: Array<[RegExp, string]> = [
  // German -auer is /aʊɝ/ (bauer, neubauer, schauer): 66 of 71 dict words
  // failed lenient on the English readings of <au>.
  [/^au(?=er$)/, "aʊ"],
  // German "haus" (house) is /haʊs/ wherever it's a whole syllable on its
  // own, word-initial or final (Hausfeld, Haussmann, backhaus, feldhaus,
  // neuhaus, steinhaus): rules-only dump, 14 strict wins : 0 losses. A
  // bare "-aus" ending without the h has no majority (claus/glaus → ɔ,
  // klaus/kraus → aʊ) and is left on the default `^a[uw]` → ɔ path.
  [/^haus$/, "haʊs"],
  // German -baum ("tree") is /baʊm/ as a compound-surname element
  // (rosenbaum, birnbaum, tannenbaum, apfelbaum): 46 of 49 dict words
  // spelling a whole "baum" syllable, like -auer/haus above. The bare
  // word "baum" is the elsewhere-regular English reading instead (dict
  // /bɔm/, as in the author L. Frank Baum) and is guarded out below
  // (syllableIndex === 0 && isLastSyllable, i.e. the whole word).
  [/^baum$/, "baʊm"],
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
  [/^o(?=nth)/, "ʌ"], // month, monthly: STRUT spelt o before -nth (9 : 1 in the dict)
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
  // Word-initial "scien" is /saɪən/ (science, scientific, scientology), not
  // the elsewhere-regular soft-c + ie-digraph reading /siən/: 8/8 dict
  // words. Guarded to syllableIndex 0 (in the loop below) so it doesn't
  // shadow the -scien$ SUFFIX_RULES entry conscience/conscious already use
  // at idx>0, a different (ʃən) reading of the same letters after "con".
  [/^scien/, "saɪən"],
  [/^s(?:ch|z)/, "ʃ"], // German sch (schmaltz/Schmidt) + Polish/Hungarian sz (szabo); school/schema live in dict
  [/^she$/, "ʃi"], // she (pronoun; anchored so it doesn't eat shed/shell)
  [/^he$/, "hi"], // he  (pronoun; anchored so it doesn't eat here/hen)
  [/^d[zg]/, "dʒ"], // Polish dz (dziedzic) + dg (bridge, judge, edge)
  [/^cz/, "tʃ"], // czech, czechoslovak, czar (Polish/Czech cz)
  [/^chr/, "kɹ"], // chrome, chronic, Christ (Greek ch before r)
  [/^chl/, "kl"], // chlorine, chlorinated (Greek ch before l)
  [/^ch/, "k"], // Greek ch in chem-/chor-/charact-/charis- (see GREEK_CH_ROOT; guarded in the loop below, off by default)
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
  // STRUT spelt ou before -ble/-ple, -ntr and -ng not -nge (double,
  // couple, country, young): 26 : 1, 10 : 1 and 19 : 0 in the dict; -ounge
  // is /aʊ/ (lounge).
  [/^ou(?=[bp]le|ntr|ng(?!e))/, "ʌ"],
  [/^oup/, "up"], // group, soup, coup, croup (ou+p → /u/)
  // "jour" is French /ʒuʁ/ ("day") nativised as /dʒɝ/ wherever it's a whole
  // syllable — journal, journey, journalist, adjourn, sojourn: 100% of the
  // dict words spelling a bare jour syllable (the general ^o(u|w) rule
  // below would otherwise read it as /dʒaʊɹ/). Same shape as ^wor above.
  [/^jour/, "dʒɝ"],
  // "our" before s/t/c within the same syllable (not followed by a vowel,
  // so court/fourth themselves, not courier/tourist) is the THOUGHT/FORCE
  // vowel, not the general ou-diphthong the rule below would give it:
  // court, fourth. course/source/resource want the same vowel but the
  // silent e gives them their own syllable ("cour"·"se"), so they're
  // covered by the nextSyllable-based check above instead, not this
  // in-syllable lookahead. Measured over the dict: t 35 ɔɹ : 8 ɝ
  // (courtesy's family) : 2 ʊɹ; s 20 : 8 : 2; c 16 : 1 : 3. The ɝ
  // minority (courtesy, courteous, courtier) stays wrong either way — it
  // was never matched by the general rule below — so this is a pure win
  // on the c/s/t majority with no new loss.
  [/^our(?=[cst])/, "ɔɹ"],
  [/^o(?:u|w(?=[snmk]))/, "aʊ"], // house, about, cloud; cow, down, brown (before consonants)
  [/^ow/, "oʊ"], // show, blow, know (at word end typically)
  [/^o[yi]/, "ɔɪ"], // boy/toy (oy) and coin/voice (oi)
  [/^a[uw]/, "ɔ"], // caught/sauce (au) and saw/draw (aw)
  [/^air/, "ɛɹ"], // hair, fair, chair, stair (must precede ^ai)
  [/^a[iy]/, "eɪ"], // rain, main, paid; day, say, way
  [/^eau[x]?/, "oʊ"], // plateau/beau + beaux/bordeaux: French eau(x) → /oʊ/ (x silent)
  [/^ealth/, "ɛlθ"], // health, wealth, stealth (ea+lth → /ɛ/)
  [/^ead/, "ɛd"], // head, bread, dead, spread, instead, deadline (ea+d closing the syllable: 106 ɛ vs 16 i in dict; the /i/ bases lea|der/rea|ding move the d to the next syllable and never reach here)
  [/^ear(?=[nlcr]|th)/, "ɝ"], // learn, earn, earth, pearl, search, earl (ear before n/l/c/r: 63:9, before th 19:2 in dict; d/t/s stay ɪɹ/ɑɹ)
  [/^e[ae]/, "i"], // read, seat, beat; see, tree, free (default long)
  // e before o is hiatus: the e is its own tense nucleus and the o keeps its
  // own value (geography, neoclassic, theocracy, creosote, cleo, rodeo).
  // 179 i : 43 other over the dict words whose first syllable spells it,
  // with -eor- already excluded — that exclusion drops the 21 ɔɹ of
  // george/georgia and costs the 6 i of reorganize-.
  [/^e(?=o(?!r))/, "i"],
  [/^iew/, "ju"],
  [/^ier$/, "iɝ"], // -iew (view/review) → ju; -ier word-final → iɝ (guard: isLastSyllable)
  [/^ie/, "i"], // piece, field, believe
  [/^cei/, "si"], // receive, ceiling, conceive (i before e after c)
  [/^ey$/, "i"], // honey, abbey, valley, turkey (unstressed final -ey; guard skips when stressed)
  [/^e[iy]/, "eɪ"], // vein, weight, eight; they, grey, obey (stressed -ey)
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
    // — except a + w + a/o, where the w is the next onset (a·ward, a·way,
    // a·ware, dela·ware): 181 w-onset : 5 in the dict.
    if (
      nucleus.length > 0 &&
      nucleus[nucleus.length - 1] !== "y" &&
      i < chars.length &&
      chars[i] === "w" &&
      i + 1 < chars.length &&
      VOWELS.has(chars[i + 1]) &&
      !(nucleus[nucleus.length - 1] === "a" && /[ao]/.test(chars[i + 1]))
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
  // A syllable exactly two after the primary, immediately before a
  // word-final -ture/-ure tail (temperature, literature, caricature,
  // musculature, tabulature), is a genuine reduced medial rather than a
  // rhythmic secondary when it is open with a single-consonant onset: the
  // dict never marks it there, 5:0 over the words that reach this slot.
  // The same position with a complex onset (legislature, nomenclature) or
  // a closed syllable (architecture, agriculture, acupuncture,
  // bonaventure, horticulture, superstructure) keeps the secondary and its
  // full vowel, 10:0 (the lone exception, telepicture, is a double-primary
  // compound that isLikelyCompound already routes to primary 0 above and
  // never reaches assignStress's -ture branch this pairs with).
  const lastSyl = syllables[syllables.length - 1];
  const tureMedial =
    after + 1 === syllables.length - 1 &&
    (lastSyl === "ture" || lastSyl === "ure") &&
    isOpen(after) &&
    !/^[^aeiouy]{2}/.test(syllables[after] ?? "");
  if (
    after <= last &&
    (after < last || FINAL_BEAT_RIME.test(syllables[after])) &&
    !tureMedial
  )
    out.add(after);
  return out;
}

const GERMANIC_NAME_ENDING = /(?:berger|inger|enger|ermann?|heimer|meyer|meier|hofer|felder|baum)$/;
const ITALIAN_ENDING = /(?:ino|ano|ini|oni|elli|etti|ello|etto|ucci|acci|ola)$/;
// French loanword/surname endings that keep the primary on the final
// syllable at exactly two slots (chateau, giroux, voltaire): -eau/-eaux,
// -oux, -aire measured 141:11 final over the true two-syllable-branch
// dict population (syllabify().length===2, restricted to dict words that
// are themselves 2 real syllables). The 11 losses are single-morpheme
// Anglicised names that took the ending as their whole root (bureau,
// juneau, decaire) — no orthographic discriminator separates them from
// the rest of the class. -elle was measured in the same set and dropped:
// 20 of the 23 two-slot -elle words are dict MONOsyllables (belle, elle,
// welle — the "le" is a syllabic-l spelling, not a second vowel), so
// stressing slot 1 voices a vowel the word doesn't have (belle → bəˈɫ).
const FRENCH_FINAL_ENDING = /(?:eaux|eau|oux|aire)$/;
// A doubled consonant right before word-final "one" (cannone, bottone,
// pallone): the Italian surname reading of "one", not the native English
// or Greek-compound one (see assignStress and syllableToIPA).
const DOUBLED_ONE_ENDING = /([b-df-hj-np-tv-z])\1one$/;
// Polish surname suffixes -wicz/-wich (markiewicz) and -czak (adamczak).
// -czyk rarely reaches three slots, since y is no nucleus here.
const PATRONYMIC_ENDING = /(?:[aeiouy]wi(?:cz|ch)|czak)$/;
// Word-initial Greek ch = /k/ in three bound roots the syllabifier can't
// see as a unit (the "ch" and its following letter share one slot — che,
// cho, cha — so the discriminating material sits in the NEXT slot or
// beyond; matched here against the whole word instead). Measured over
// data/en/dict.json by the first IPA segment after word-initial ch/tch
// (excluding the already-/k/ chr/chl clusters): chor- is 12 k : 5 tʃ once
// the native "chore"/"chortle" family is carved back out — not by
// re-listing chor- derivatives, but by two negative lookaheads that name
// the two attested native English words sharing the prefix (chore/chores
// are "a household task", chortle is chuckle+snort, neither Greek); the
// one remaining loss, chorney, is a surname with no orthographic split
// from chorus/choral/chord/choreograph. charact-/charis- (character,
// characterize, characteristic, charisma, charismatic) is clean, 12 k :
// 0. chem- is 15 k : 10 tʃ unrestricted (dump/compare: strict 9 win : 6
// loss, lenient 16 : 8 — technically still net-positive, but real
// words take real losses: chemfix, chemie, chemins, chemerinsky), so the
// root is scoped to the three suffixes real chem- words actually take:
// -ic (chemical), -ist (chemist), -o (chemo) — each a productive English
// suffix attaching to many other roots, unlike the prefix here. A
// bare-word anchor for "chem" and "chemi" alone was measured too (each
// is exactly one dict word, unrestricted 9:6 above included both as
// wins) and dropped: a $-anchored branch matching only its own literal
// string is a whole-word entry wearing a regex, not a root, and house
// style (the -graphy/-nomy set above) generalises a suffix across many
// words rather than hardcoding one. GREEK_CH_ROOT's own rule-diff yield
// after that trim (chor-/charact-/charis-/chem- only — NOT the separate
// tryCompoundSplit guard in g2p.ts, whose astrological/ecological/
// psychological wins land in the combined total reported at the
// definition's call site): strict 4 win (choral, chorba, choric,
// chorus) : 1 loss (chorney), lenient 10 : 1. chem- and charis- clear
// the consonant but not the whole word — chemical/chemistry/chemo/
// charisma only reach lenient, because each carries an unrelated vowel-
// or stress-rule gap elsewhere in the same word (chemical's own -ical
// depth, chemo's tense o, charisma's stressed /ɪ/) that this rule
// doesn't touch, so they were never candidates for a strict win.
// chimerical was measured too and left out: the dict's own "chimera" is
// tʃ, so there is no orthographic signal for the one word that differs
// from its own root. Open: chorizo (Spanish, tʃ) is not in the dict to
// measure but would wrongly reach /k/ here — no orthographic split from
// choral/chorus without one.
const GREEK_CH_ROOT = /^ch(?:em(?:ic|ist|o)|arac|aris|or(?!e$|es$|tl))/;
// Latin hiatus endings that pull the primary onto the syllable right
// before them and (see the syllableToIPA use site) tense an open vowel
// there: -ia (malaria), -ian (canadian), -ious (curious), -eous
// (spontaneous). -ia/-ian take an optional plural -s (cafeterias,
// canadians, jordanians): the maximal-onset syllabifier glues it onto the
// same last slot, so a trailing-s word never reaches this rule without it.
// Shared between assignStress and the tensing rule so the two stay in sync.
const LATIN_HIATUS_ENDING = /^[^aeiouy]+(?:[iy]an?s?|eous|ious)$/;
const FINAL_BEAT_RIME = /[aiouy][bcdfgkpstxz]$|e[bcdfgkptxz]$/;
const FINAL_OBSTRUENT_E = /e[^aeiouylmnrwh]*[bcfgjkpqvz][^aeiouylmnrwh]*$|e[ln]d$/;
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

  // Specific suffix stress patterns
  if (
    lowerWord.endsWith("tion") ||
    lowerWord.endsWith("sion") ||
    lowerWord.endsWith("cial") ||
    lowerWord.endsWith("tial")
  ) {
    return Math.max(0, syllables.length - 2);
  }

  // -ity pulls the primary onto the syllable right before it (activity,
  // abnormality, accessibility). The syllabifier keeps consonant + ity as
  // one final slot (ac·ti·vity), so that syllable is length - 2. -iety
  // (society, anxiety) is a different frame and is left out.
  if (/[^aeiouy]ity$/.test(lowerWord)) return Math.max(0, syllables.length - 2);
  // -ial does the same at 3+ slots (adversarial, editorial, material); at
  // two the <i> is itself the stressed vowel (denial, trial).
  if (/[^aeiouy]ial$/.test(lowerWord) && syllables.length >= 3)
    return syllables.length - 2;
  // -ental/-antal likewise (accidental, fundamental, environmental).
  if (/[ae]ntal$/.test(lowerWord) && syllables.length >= 3) return syllables.length - 2;
  // -ate puts the primary two syllables before its own /eɪt/ (abdicate,
  // accelerate, anticipate, and the adjectives accurate, delicate). The
  // syllabifier writes it as C+a · te, so that is slot length - 4, or
  // length - 3 when the C+a slot is a hiatus that already holds two
  // syllables (appre·cia·te, eva·lua·te, gra·dua·te). Two-syllable words
  // (debate, rotate, create) have fewer than four slots and are left out.
  if (/[^aeiouy]ate$/.test(lowerWord) && syllables.length >= 3) {
    const hiatus = /[iu]a$/.test(syllables[syllables.length - 2]);
    if (hiatus) return Math.max(0, syllables.length - 3);
    if (syllables.length >= 4) return syllables.length - 4;
  }

  // -ator stresses like -ate, its verb (generator, indicator,
  // administrator): C+a · tor, so slot length - 4, or length - 3 over a hiatus.
  if (/[^aeiouy]ator$/.test(lowerWord) && syllables.length >= 3) {
    if (/[iu]a$/.test(syllables[syllables.length - 2])) return Math.max(0, syllables.length - 3);
    if (syllables.length >= 4) return syllables.length - 4;
  }

  // -ia/-ian/-ious/-eous stress the syllable before them (india, malaria,
  // cafeteria, canadian, barbarian, various, curious, spontaneous); the
  // syllabifier keeps consonant + suffix as the last slot.
  if (syllables.length >= 2 && LATIN_HIATUS_ENDING.test(syllables[syllables.length - 1]))
    return syllables.length - 2;

  // A word-final "que" is the French spelling of a bare /k/ (antique,
  // critique, boutique, mystique, martinique): "qu" starts with a vowel
  // letter, so it never trips SILENT_E_SLOT and the syllabifier gives it
  // its own slot (an|ti|que), but phonetically it closes the syllable
  // before it, which is the one that actually carries the stress.
  // Excluded: -esque, a suffix in its own right whose stress is the free
  // root's, not this gram's (kafkaesque, picturesque, statuesque);
  // burlesque/grotesque don't need the exclusion; their penult is already
  // closed (les-) and self-stresses through the heaviness fallback below.
  // 33 penult : 7 elsewhere over the dict words this reaches (82.5%); the
  // losses are idiosyncratic loans/names with no further orthographic
  // split (albuquerque, barbeque, communique, discotheque).
  if (
    syllables.length >= 3 &&
    syllables[syllables.length - 1] === "que" &&
    !lowerWord.endsWith("esque")
  )
    return syllables.length - 2;

  // Germanic compound surname elements leave the primary on the first
  // syllable (aldinger, ackerman, bamberger, oppenheimer), as English
  // words that share them do (fisherman, harbinger). -ington is left out:
  // it is an English place-name element, and American usage varies there
  // (ellington is heard with the second syllable stressed). -baum joins
  // the set at 3+ syllables (rosenbaum, tannenbaum, mandelbaum): 28/28 in
  // the dict. Excluded at 2 syllables, where -baum itself keeps the beat
  // (erlbaum) rather than the element before it. -enger joins it too
  // (ballenger, messenger, passenger, clevenger): 9/9 at 3+ syllables.
  // This whole-word check only reaches surnames where the -er
  // morphological handler in g2p.ts found no real "-enge" verb to build
  // from (messeng+e is not a word); challenger/scavenger resolve there
  // first, from the pinned exception-table stress of challenge/scavenge.
  // avenger has no such pin (the rules already got it right without one)
  // and would otherwise be the one loss: its "a-" is the genuine
  // unstressed prefix of avenge (a·veng·er), not a Germanic surname
  // element, so it is excluded the same way the weak-a-prefix rules
  // elsewhere in this function key off a bare "a" first syllable.
  if (
    GERMANIC_NAME_ENDING.test(lowerWord) &&
    syllables.length >= 3 &&
    !(lowerWord.endsWith("enger") && syllables[0] === "a")
  )
    return 0;

  // Italian name endings take the penult (albano, agostini, capelli,
  // baldacci): -ino/-ano/-ini/-oni/-elli/-etti/-ello/-etto/-ucci/-acci.
  if (ITALIAN_ENDING.test(lowerWord) && syllables.length >= 3)
    return syllables.length - 2;

  // A doubled consonant + "one" is the same Italian surname pattern (see
  // syllableToIPA for the matching final-e vowel): cannone, bottone,
  // pallone. Unlike the endings above, "one" also occurs after a SINGLE
  // consonant in native English words (atone, alone — handled by the a-
  // prefix rule) and in Greek-compound scientific terms (acetone, ketone,
  // telephone), which stay initial-stressed by the default below, so the
  // doubling is the load-bearing signal. 22 penult : 4 initial at exactly
  // 3 syllables (doggone, giannone, spallone, yannone are the exceptions);
  // left out at 4+ syllables, where the split is only 4:2.
  if (DOUBLED_ONE_ENDING.test(lowerWord) && syllables.length === 3)
    return 1;
  // Polish -wicz/-wich/-czak stress the syllable two in from the suffix
  // (markiewicz mɑɹˈkəvɪtʃ, filipowicz fɪˈɫɪpəvɪtʃ, adamczak ˈɑdəmtʃæk):
  // the maximal-onset syllabifier keeps -wicz/-wich's swallowed w with
  // its linking vowel as one slot ("kiew", "pow") ahead of the isolated
  // "icz" slot, and -czak is itself always the last slot, so either way
  // the target is 3 slots from the end. 45 of 49 -wicz/-wich words and
  // all 6 -czak words that reach 3+ slots; the -wicz/-wich losses keep
  // the linking vowel stressed (waszkiewicz, rosewicz) or read cz as
  // /ts/ (balcerowicz, sawicz).
  if (PATRONYMIC_ENDING.test(lowerWord) && syllables.length >= 3)
    return syllables.length - 3;

  // A word ending in a single vowel letter a/o/i after a consonant is a
  // Romance/Japanese-type loan or name with penult stress (banana, tornado,
  // kawasaki, lasagna): over 3-slot words the dict has the penult 90% (-a),
  // 93% (-o) and 96% (-i) of the time, and 88-96% at 4 slots.
  // Latin/Greek -ica/-ula/-ema/-ico and a few more grams stay antepenult
  // (africa, america, formula, cinema, mexico): each is under 70% penult.
  if (
    /[^aeiouy][aoi]$/.test(lowerWord) &&
    !/(?:ic|ul|em|or|ac|om|ig)[aoi]$/.test(lowerWord) &&
    syllables.length >= 3 &&
    /^[^aeiouy]+[aoi]$/.test(syllables[syllables.length - 1])
  )
    return syllables.length - 2;

  // Greek -graphy/-nomy/-sophy/-scopy/-pathy/-gamy/-cracy likewise
  // (photography, economy, philosophy, democracy): the ending is one slot.
  if (/(?:graph|nom|soph|scop|path|gam|crac)y$/.test(lowerWord) && syllables.length >= 3)
    return syllables.length - 2;

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
    if (syllables.length === 3) return 0;
    // At four slots the stem is one syllable longer and the split is
    // carried by that syllable's weight: a closed second slot means a
    // stressed stem (acceptance, abundance, admittance — 39 of 45 want
    // slot 1), an open one a Latin bound root that leaves the primary at
    // the front (conference, difference, competence, evidence — 68 of 124).
    if (syllables.length === 4 && /[aeiouy]$/.test(syllables[1])) return 0;
    return 1;
  }

  if (lowerWord.endsWith("ic") && syllables.length > 1) {
    return Math.max(0, syllables.length - 2);
  }

  // Name-forming -man/-son/-ton (Addleman, Abelson, Appleton): the suffix
  // is a reduced, unstressed /mən sən tən/ that keeps the root's own
  // initial stress instead of falling through to the prefix loop or the
  // heaviness fallback below. This has to run ahead of both: over the dict
  // words that reach this branch (3+ syllables), -man is 460/490 (93.9%)
  // initial-stressed, -son 511/542 (94.3%), -ton 282/310 (91.0%) — and the
  // subset that also happens to start with a listed prefix below (Abelson,
  // Adelman, Congressman, Denison) is STILL majority initial (13/18, 19/24,
  // 12/16), because "ab-"/"ad-"/"con-"/"de-" there is a name's spelling,
  // not a real prefix. The minority is genuine prefix+word compounds
  // (inhuman, subhuman, unbutton, repairman, pre-season), outvoted by the
  // surnames. Word-initial regardless of length, not an antepenult offset:
  // at 4 syllables the dict is still word-initial for -man (16:3) and -ton
  // (11:1) and roughly split for -son (11:10), so the fixed slot never
  // loses to the length-3 alternative and wins outright for the other two
  // (businessman, forewoman, haliburton). -ington is left out, as in
  // GERMANIC_NAME_ENDING: American usage varies there (ellington).
  if (
    syllables.length >= 3 &&
    /^(?:man|son|ton)$/.test(syllables[syllables.length - 1]) &&
    !lowerWord.endsWith("ington")
  ) {
    return 0;
  }
  // Name-forming -ville (Aldenville, Andersonville, Bartlesville) is the
  // same reduced-suffix pattern, but the syllabifier splits it "vil·le"
  // (two slots) rather than one, so it needs its own whole-word check:
  // 149/163 (91.4%) initial over the dict words at 3+ syllables. The
  // minority is short French-origin roots that keep their own stress
  // (Seville, Deville, Douville, Courville) and Mc-/Mac- surnames.
  if (syllables.length >= 3 && lowerWord.endsWith("ville")) return 0;

  // A 3-syllable Latinate -ary word (secretary, legendary, commentary,
  // corollary) keeps its primary word-initial even when a closed middle
  // syllable would otherwise pull the heaviness fallback onto it
  // (momentary, sedentary, commissary) or the word happens to start with
  // a string the loop below treats as an unstressed prefix (adversary,
  // dispensary): 57 initial : 7 elsewhere (89.1%) over the 3-slot dict
  // population, checked ahead of both the prefix loop and the heaviness
  // fallback so it isn't shadowed by either. The consonant-before-"ary"
  // requirement already excludes the -iary/-uary hiatus variant (auxiliary,
  // fiduciary, judiciary, pecuniary), where the extra vowel is itself the
  // stressed syllable; the residual losses are proprietary/reactionary/
  // exemplary/infirmary, whose own stem is independently stressed past the
  // first syllable, and maxillary, a minority Latin loan. -ory/-ery are
  // deliberately left to the existing fallback: unlike -ary, their
  // closed-middle-syllable subset genuinely favors the adjacent stress the
  // fallback already gives it (accessory, directory, artillery, dysentery
  // — 7 initial : 17 elsewhere at 3 slots with a closed middle), so the
  // same override would trade a real win for a real loss instead of only
  // fixing one.
  if (syllables.length === 3 && /[^aeiouy]ary$/.test(lowerWord)) return 0;

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
    if (firstSyl === "com" && laxRoot) return 0;
    // Onset maximisation hides the ex- prefix before a vowel: the <x> goes
    // to the following onset, so `exist` arrives here as e|xist and the
    // "ex" entry above can never match it (only ex+consonant words —
    // ex|pect, ex|port — reach it spelt whole). Restore the prefix for the
    // lookup; the dict wants final stress on 11 of the 16 true two-syllable
    // ex+vowel words (exact, exam, exempt, exert, exist against exile,
    // exit). `isPrefix` is vacuously true here — the letter after <ex> is
    // the root vowel, never a second <x>.
    const prefixSyl = firstSyl === "e" && lowerWord[1] === "x" ? "ex" : firstSyl;
    if (PREFIXES_2SYL.includes(prefixSyl)) return isPrefix(prefixSyl) ? 1 : 0;
    // The bare a- prefix is only weak when the root behind it is a tense
    // rime: about, abroad, again, agree, aboard, around, amount, aloud.
    // A light root keeps initial stress (acid, adam, atom, arab), so the
    // orthographic vowel digraph is the discriminator — the flat split is
    // 295 initial : 198 final in the dict, the digraph subset 37 : 66.
    // `oi` is a tense rime that the shared VOWEL_DIGRAPHS list omits, and it
    // votes the same way: a root containing it is 6 final : 1 initial
    // (avoid, anoint, adroit, alois against aloi). It is added here rather
    // than to VOWEL_DIGRAPHS so `isSyllableHeavy` and the com-/pro- laxRoot
    // test keep their measured behaviour.
    // A word-final -ey/-ie is the unstressed /i/ ending (abbey, amie), not
    // a tense rime, so it is excluded. RHOTIC_VOWEL_RE (adore, ashore,
    // aspire) is measured over the same bare-a and assimilated-ad branches
    // below at 13 final : 4 initial (the losses are amore, ashare, astore,
    // azure — lexical minorities of the same shape).
    const tenseRoot =
      (DIGRAPH_RIME.test(syllables[1]) || syllables[1].includes("oi") ||
        RHOTIC_VOWEL_RE.test(syllables[1])) &&
      !/(?:ey|ie)$/.test(syllables[1]);
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
    // Non-assimilated ad-/in-/mis-/out- over the same rhotic rime (adhere,
    // admire, acquire, inquire, inspire, insure, misfire, outscore): the
    // doubling test above can't fire without a doubled consonant, but the
    // dict is still 8:1 final over this specific rime (the loss, inshore,
    // is a real compound "in shore"). ab- was measured in the same set and
    // dropped — its one hit, abshire, is a surname compound with no win to
    // offset it. con- was measured and dropped too: conspire is final but
    // conjure and confrere are not, a 1:2 split.
    if (
      RHOTIC_VOWEL_RE.test(syllables[1]) &&
      ["ad", "ac", "in", "mis", "out"].includes(firstSyl)
    )
      return 1;
    // -ureau is initial in both dict words that have it (bureau,
    // lamoureaux): the u + r is the English CURE reading, not French.
    if (FRENCH_FINAL_ENDING.test(lowerWord) && !/ureau$/.test(lowerWord))
      return 1;
    // -oon is the French/Spanish loan suffix (balloon, baboon, cartoon,
    // bassoon): 94.9% final (37:2) over the two-syllable population,
    // unlike the wider oo+consonant family it sits inside (mostly English
    // compounds — allwood, ashbrook — only 18% final), so it is scoped to
    // this one gram rather than the digraph generally.
    if (/oon$/.test(lowerWord)) return 1;
    // A bare -een that is not the Scandinavian surname suffix -deen
    // (lindeen, hedeen — 40% final, 4:6) or a bare -teen word (canteen,
    // preteen against osteen, umpteen — 62.5% final, too mixed to add to
    // the rule, and the cardinal-number compounds eighteen/fifteen are
    // majority initial on their own, 0:5) is a French/Irish loan or place
    // name with final stress (aileen, baleen, between, canteen, careen):
    // 83.3% final (45:9) over the rest.
    if (/een$/.test(lowerWord) && !/(?:deen|teen)$/.test(lowerWord)) return 1;
    return 0;
  }

  // For 3+ syllables, use improved stress assignment
  if (syllables.length >= 3) {
    // Check for compound words (typically have primary stress on first part)
    if (isLikelyCompound(lowerWord, syllables)) {
      return 0; // First syllable gets primary stress in compounds
    }

    // A word-final -ture/-ure syllable is the reduced /tʃɝ/ or /jɝ/ tail
    // (PHONEME_RULES' ^ture$/^ure$ entries), never a real nucleus of its
    // own, so at exactly 4 syllables the primary stays on the root's first
    // syllable rather than falling to the heaviness fallback below
    // (literature, temperature, architecture): 16 initial : 6 elsewhere
    // in the dict at this length. This runs after the compound
    // check and the unstressedPrefixes loop above, so the 6 losses — real
    // prefix+word or compound formations whose stem keeps its own stress
    // (manufacture, misadventure, divestiture, investiture, expenditure) —
    // are already routed to the right answer before reaching here and stay
    // untouched; the loop's own "in-" entry also still (mis)handles
    // infrastructure exactly as before this rule existed.
    // Excludes a closed, single-consonant-onset <u> syllable right before
    // the tail (agriculture, acupuncture, horticulture): PHONEME_RULES
    // reads that <u> as /ʌ/ (^u → ʌ), and /ʌ/ is deliberately left out of
    // FULL_NUCLEI in postlex.ts (see the comment there), so the syllable
    // this rule vacates never receives the secondary mark that would
    // protect it from reduction to /ə/ once it stops being the primary —
    // and, ipa-dict itself writing STRUT as /ə/, a stress-stripped-exact
    // rule output then evicts the word from the exception table and ships
    // the now-/ə/ reading (measured: agriculture regresses top-5000
    // segment accuracy against CMUdict). Left on the old (mis-stressed but
    // vowel-correct) fallback until FULL_NUCLEI carries /ʌ/ for this
    // position specifically.
    if (
      syllables.length === 4 &&
      (syllables[3] === "ture" || syllables[3] === "ure") &&
      !/^[^aeiouy]*u[^aeiouy]+$/.test(syllables[2])
    )
      return 0;

    // The weak a- prefix again, over a magic-e root. The orthographic
    // syllabifier splits the silent e off as its own syllable (a|lo|ne,
    // a|ma|ze, as|su|me, ap|pro|ve), so the two-syllable branch never sees
    // these and `DIGRAPH_RIME` has no rime left to test. Over the three-slot
    // words this reaches, the dict puts the primary on slot 1 by 30:9 for a
    // bare a- (alone, amaze, alive, arise) and 15:4 for the assimilated form
    // (assume, approve, arrive, alliance).
    if (
      syllables.length === 3 &&
      /^[^aeiouy]e$/.test(syllables[2]) &&
      (syllables[0] === "a" ||
        (/^a[bcdfglmnprstvz]$/.test(syllables[0]) &&
          syllables[1][0] === syllables[0][1]))
    )
      return 1;

    // A word-final syllable that is nothing but a silent-e coda (te, se,
    // ve, de, ge, ce, ne...) is not a real syllable for stress-counting
    // purposes — the same fact `secondaryStressIndices` already relies on
    // via this same SILENT_E_SLOT test. The maximal-onset syllabifier still
    // gives that e its own slot ("fa·vo·ri·te", not "fa·vo·rite"), so a
    // whole family of 4-slot words is one syllable shorter than the array
    // below says: favorite's real stress is on "fa", the first of its
    // three syllables (fa-vo-rite), but the raw array has four slots and
    // both the gram lookup and the penult/antepenult test undercount by
    // one. This generalizes what was previously a narrower fold limited to
    // -ive (active, negative, cumulative...): every trailing silent-e slot
    // gets the same treatment (favorite, heritage, medicine, episode,
    // enterprise, hurricane, magazine, merchandise, valentine, coverage,
    // average, absolute, attribute). Fold the trailing pair back into the
    // syllable it actually is before applying the fallback rules below;
    // every earlier return in this function (compounds, the a-/assimilated-
    // prefix magic-e case just above, the unstressed-prefix loop) already
    // lands on the right slot on its own and is unaffected; this only
    // touches words that reach the gram/heaviness fallback. Restricted to
    // an original 4+ slots: at 3 slots this would collapse the word to two
    // real syllables, where a final-stressed French/Greek loan (parade,
    // machine, cascade, epitome, anemone) is a genuinely different,
    // pronounced-final-e population, not a silent one. Measured over the
    // whole rules-only dict dump (`yarn rule-diff compare`): strict
    // +130/-43, lenient +237/-76, top-5000 +1/-0. Most of the strict losses
    // are a single interaction: the -ed/-ing morphology handler probes a
    // fabricated "base+e" string (uncollect+e, mismanage+e) through the
    // rule path to test for a magic-e stem, and this fold changes that
    // fabricated word's stress the same way it changes a real one
    // (uncollected, mismanaged, unperturbed) — a pre-existing quirk of
    // that probe surfacing on a non-word, not a stress-position rule
    // this family owns. None of it reaches the top-5000 list. The -ive
    // subset alone was already +21/-2 strict; its two known losses carry
    // over unchanged (a "non+motive" compound, and a knock-on vowel-
    // reduction mismatch on an unrelated syllable in distributive, not a
    // stress-position regression) via the same `.motive$` exclusion.
    const silentEFold =
      syllables.length >= 4 &&
      SILENT_E_SLOT.test(syllables[syllables.length - 1]) &&
      // A compound on the free word "motive" keeps its stress there
      // (automotive, locomotive).
      !/.motive$/.test(lowerWord) &&
      // The syllabifier groups a genuine vowel-vowel hiatus into one slot
      // (af·fi·lia·te, appro·pria·te, asso·cia·te — the same grouping
      // geo·graphy relies on), so the slot right before the silent-e coda
      // there is really TWO syllables (i + eɪt), not one light "Ce" pair.
      // Folding it in on top of that undercounts by a second syllable and
      // over-retracts the primary (affiliate loses its dict-correct
      // əˈfɪɫiˌeɪt to ˈæfɪɫiˌeɪt). Excluding a hiatus antepenult leaves the
      // true silent-e family (favorite, heritage, medicine) untouched,
      // since a single-vowel slot like "ri" or "ta" isn't a hiatus.
      !isHiatusSlot(syllables[syllables.length - 2]) &&
      // A digraph nucleus right before the silent-e coda (believe,
      // conceive, perceive — "ie"/"ei") is already heavy on its own and
      // self-stresses correctly through the ordinary heaviness test below
      // without folding: disbelieve and misconceive need the primary on
      // "lieve"/"ceive" itself (the word-attaching prefix loop already
      // routes a 4+-slot dis-/mis- stem here expecting that), which this
      // fold — capped at penult/antepenult — can never produce. The old,
      // narrower -ive-only fold never touched this population, because
      // "believe"/"conceive" end in "eve", not "ive".
      !DIGRAPH_RIME.test(syllables[syllables.length - 2]);
    const stressSyllables = silentEFold
      ? [
          ...syllables.slice(0, -2),
          syllables[syllables.length - 2] + syllables[syllables.length - 1],
        ]
      : syllables;

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
    if (gram !== undefined && stressSyllables.length - 1 - gram >= 0)
      return stressSyllables.length - 1 - gram;

    const penult = stressSyllables[stressSyllables.length - 2];
    // Once collapsed, a light -ive penult is still a coin flip: -ative/
    // -itive words retract further (alternative, negative, sensitive —
    // the reduced "a"/"i" of an -ate/-it- stem never carries its own
    // stress), but -sive/-cive/-xive stay on the penult even when it's
    // orthographically light (elusive, erosive, pervasive, collusive —
    // this is the same "-d/-t+ive" Latin participle family as the heavy
    // set below, not the trisyllabic-laxing -ative one, and covers the
    // bare/assimilated a- prefix case too — abrasive, abusive, allusive
    // are all -sive). Light-penult -sive/-cive/-xive words split 24
    // penult : 1 antepenult (effusive) in the dict, and folding this in on
    // top of the plain collapse fix recovers 10 more strict wins with 0
    // added losses on the full rules-only dump.
    const sivePenult = silentEFold && /(?:sive|cive|xive)$/.test(lowerWord);
    if (isSyllableHeavy(penult) || sivePenult) {
      return stressSyllables.length - 2; // Stress the penult if heavy
    } else {
      return Math.max(0, stressSyllables.length - 3); // Stress the antepenult if penult is light
    }
  }

  return 0; // Default fallback
}

// Vowel digraphs that make a syllable heavy (long nucleus).
const VOWEL_DIGRAPHS = "aa ai au aw ay ea ee ei eu ey ie oa oo ou ow oy ue ui".split(" ");
const DIGRAPH_RIME = new RegExp(VOWEL_DIGRAPHS.join("|"));
// A full rhotic-diphthong rime: a vowel directly before a word-final "re"
// (adore, ashore, aspire, assure), unlike a bare consonant-cluster + re that
// never had a vowel between the onset and the r (acre, genre, theatre) or
// the syllabic -Cle merge. See assignStress's 2-syllable branch.
const RHOTIC_VOWEL_RE = /[aeiouy]re$/;

// Vowel pairs that already reduce to ONE phoneme downstream — not a
// hiatus. Most are PHONEME_RULES digraphs (a single glide/monophthong
// rule consumes both letters). "ae" and "oe" are different: PHONEME_RULES
// emits each letter as its own phoneme (æ+ɛ, oʊ+ɛ), but a later
// unstressed-hiatus pass already elides the first vowel against a
// lexicon that never keeps it — German-name "oe" for /ø/ (boeckel
// ˈboʊkəɫ, goebel ˈɡoʊbəɫ, 201 dict words) as well as "ae" (aetna ˈɛtnə,
// daedalus ˈdɛdəɫəs). That elision pass keys off the mark sitting before
// both vowels, so treating either as hiatus here would move the mark in
// a way that stops it from firing. "y" is excluded from the nucleus
// match entirely: a vowel + y is a glide onset for a following syllable
// (canyon, beyond) or the syllabic-y ending, never the geography-class
// hiatus this targets.
const HIATUS_DIGRAPHS = new Set([
  "ae", "ai", "ay", "au", "aw", "ea", "ee", "ei", "eu", "ey", "ie",
  "oa", "oe", "oo", "ou", "ow", "oy", "oi", "ue", "ui", "uy",
]);

/**
 * True when `slot` is a genuine two-vowel-letter hiatus — the orthographic
 * syllabifier's maximal-onset split keeps both vowels in one slot (geo,
 * bio, prio, rio, lia) instead of splitting them, though syllableToIPA
 * still emits two phonemes for them. Excludes known digraphs (one
 * phoneme), a doubled letter (aa — name-heavy, and phonemically one long
 * vowel, not two nuclei), and eo directly before r (george, georgia — the
 * o keeps ^e(?=o(?!r)) from tensing the e, so it never becomes two
 * nuclei there).
 */
export function isHiatusSlot(slot: string): boolean {
  const m = slot.match(/^[^aeiou]*([aeiou]{2})[^aeiou]*$/);
  if (!m) return false;
  if (m[1][0] === m[1][1] || HIATUS_DIGRAPHS.has(m[1])) return false;
  if (m[1] === "eo" && /^[^aeiou]*eor/.test(slot)) return false;
  // After g/q the <u> is part of the consonant (gu·ar·dian, qua·lity), not
  // a first vowel.
  if (m[1][0] === "u" && /[gq]u[aeiou]/.test(slot)) return false;
  return true;
}

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

// Greek/Latin combining forms whose i is lexically tense and stays tense
// when the word's stress moves off it (microbiology, biochemical,
// diagnostic, isolation). Measured as the first dict nucleus: micro 67 aɪ
// : 1, bio 41 : 1, dia 44 : 0, iso 22 : 4. Every general frame these might
// have fallen out of loses on the dict's Italian and Slavic names —
// an i + one or two consonants + o opening a word is 1238 ɪ : 235 aɪ
// (255 : 62 with no onset at all), an open stressed i before a
// Cl/Cr onset 149 ɪ : 93 aɪ, and a syllable-final `ia` 61 aɪ : 54 i — so
// the morpheme is the discriminator. bi- (39 ɪ : 30 aɪ), di- (492 : 58),
// tri- (18 : 17) and nitro- (4 : 5) are not tense forms and are not here.
const TENSE_I_FORMS = /^(?:micro|bio|dia|iso)/;

// Second syllables that signal a magic-e base in a two-syllable word
// (bake+r, take+n, make+ing, base+is, fine+al, silent, vacant, matrix).
const TENSE_ENDINGS =
  /^[^aeiouy]+(?:e[rdsn]|ers|est|ing|ings|or|ors|al|als|ent|ents|ant|ants|us|is|ix)$/;

// The `a`-only half of that frame: second syllables that license a tense a
// but that TENSE_ENDINGS either omits or cannot reach. Measured as dict
// eɪ : everything else over the two-syllable words whose stressed open first
// syllable is an a — -Cey 75:21 (haley, casey, bakey), -Cier(s) 23:10
// (glacier, brazier, crazier), -Cer(y|ies) 10:4 (bakery, slavery, drapery),
// -Cies 6:2 (ladies, babies, rabies), and s+stop+e 14:3 (haste, waste,
// paste, chaste), which TENSE_ENDINGS does spell but `nextIsLaxCluster`
// blocks. An r-initial ending is excluded for the same reason as in the
// shared frame: carey and barey are ɛɹ, not eɪ. Two-consonant onsets are
// excluded too — they drop -Cey to 55% (bagley, bakley) and -Can to 56%.
// A single-consonant -Can (caban, pagan, satan) is 44:2 tense, but it was
// left out: one loss is alan, a top-5000 word, against no common win.
const A_TENSE_ENDINGS = /^(?:[^aeiouyr](?:ey|iers?|er(?:y|ies)|ies)|s[ktp]e)$/;

// Word-final -ine, unstressed by the rule engine's own stress assignment
// (isStressed/isSecondary both false on this syllable): the magic-e diphthong
// default is right for the Germanic/Latin-adjective class (alpine, canine,
// feline) but wrong for two other classes that share the same shape — a
// truly reduced suffix (engine, examine, discipline, jasmine) and a French
// loan that keeps a tense, undiphthongized vowel under stress the rule
// engine places elsewhere (machine, magazine, marine, augustine). Both
// want a short /ɪ/ here, not /aɪ/, so one exclusion serves both. Measured
// over data/en/dict.json by the consonant(s) immediately before -ine
// (not-aɪn : aɪn): a lone r 41:2 (marine, corzine — excludes -rline/-rdine/
// -rmine/-rtine, tabulated separately), -stine 19:4, -chine 5:0 (machine,
// vaccine's -ccine reaches -cine below), -cine 9:1, -sine 9:1, -rmine 7:1,
// -rtine 7:0, -zine 6:2, a lone t 7:2 (routine; excludes -ntine/-ltine,
// which measure under 60%). -line/-mine/-dine/-ntine/-vine/-pine were also
// measured and left on the default aɪn path: each is majority-aɪn or a
// near-even split (-line 30:40, -mine 20:11, -ntine 14:12), so no rule
// wins there.
const FRENCH_INE_GRAM =
  /(?:cine|chine|sine|zine|rmine|rtine|stine)$|[aeiouy](?:rine|tine)$/;

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

// Final vowel group of a word whose penult <i> is the pretonic-to-the-suffix
// slot: -y and its inflections. See the use site in `syllableToIPA`.
const Y_FINAL_GROUP = /^(?:y|ies|ied)$/;

// The same slot before an unstressed Latinate ending (criminal, animal,
// capital, condiment, luminous, contaminant).
const LATINATE_FINAL_GROUP = /^(?:als?|ous|ants?|ents?)$/;

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
  // Orthographic head of the word before this syllable.
  head = "",
  // True when the immediately preceding syllable carries the primary
  // stress (accessory, directory: the syllable right after "cess"/"rec").
  prevStressed = false,
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
  // Word-final unstressed -cia/-sia (single onset consonant) is one
  // syllable, not the i-ə hiatus the general vowel handling gives it: the
  // intervocalic s voices (ambrosia, amnesia, indonesia — 29 ʒə : 15 siə,
  // the losses mostly names: aloisia, dambrosia, nicosia), and c (already
  // /s/ before i/e/y) stays voiceless (patricia, marcia, acacia — 36 ʃə :
  // 5, the losses foreign place/first names: garcia, galicia, pharmacia).
  // A doubled onset (boccia, cassia) is the Italian -ccia ending and stays
  // on the hiatus path.
  if (
    (remaining === "sia" || remaining === "cia") &&
    isLastSyllable &&
    !isStressed &&
    prevSyllable?.[prevSyllable.length - 1] !== remaining[0]
  )
    return (remaining === "sia" && /[aeiouy]$/.test(prevSyllable ?? "") ? "ʒ" : "ʃ") + "ə";
  for (const [pattern, ipa] of SUFFIX_RULES) {
    const src = pattern.source;
    if (!isLastSyllable && FINAL_ONLY_SUFFIXES.has(src)) continue;
    if (NON_INITIAL_SUFFIXES.has(src) && syllableIndex === 0) continue;
    if (src === "^sto$" && nextSyllable !== "ne") continue;
    if (src === "^the$" && (syllableIndex === 0 || !isLastSyllable)) continue;
    // A bare "er" syllable right before another syllable starting with r
    // (error, terror's medial, erratic) is not the reduced word-final -er
    // suffix this rule targets (teacher, baker) — the second r belongs to
    // the NEXT syllable, spelled onto this one by gemination/assimilation,
    // so this syllable's own vowel is a plain checked nucleus, not the
    // agentive schwa. See the doubled-r rime skip below, which this
    // mirrors for the (rarer) case where "er" is a whole syllable with no
    // onset consonant of its own and so never reaches the main loop.
    if (src === "^er$" && nextSyllable?.[0] === "r") continue;
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
    (syllableIndex > 0 || /[aeiouy]/.test(syllable.slice(0, -1))) &&
    // Nor is it silent in the Italian doubled-one surname (cannone,
    // bottone): see the eFire clause below, which needs the "e" left in
    // `remaining` to reach the guarded ^e$ rule.
    !(syllableIndex === 2 && syllable === "ne" && DOUBLED_ONE_ENDING.test(head + syllable));

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
  // Same window, `a`-only endings, and exempt from nextIsLaxCluster — the
  // s+stop onset it blocks is the silent-e coda of haste/waste, not the
  // cu|stom cluster it was written for.
  const aTwoSylTense =
    syllableIndex === 0 && isNextLastSyllable && isStressed &&
    !!nextSyllable && A_TENSE_ENDINGS.test(nextSyllable);
  const nextIsMagicE =
    isNextLastSyllable &&
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
  // An inflection is not part of the base the depth is counted on
  // (no·ti·ces, like notice, keeps its tense o).
  const tailSyls = vowelGroups(
    t.replace(/(?:es|ed|ing)$/, "e").replace(/([^aeiouyl])e$/, "$1"),
  );
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
  // The word opens with a tense-i combining form (see TENSE_I_FORMS).
  const isTenseIForm =
    syllableIndex === 0 && TENSE_I_FORMS.test(syllable + t);
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
    //   (cut, sun). A mid-word unstressed open u after a coronal onset
    //   (t d s z n l r) reduces to a bare ə (accuracy's "ra"-onset next
    //   syllable aside — see the branch below); after a non-coronal
    //   onset (p b k ɡ m f v) it keeps the glide instead (see the next
    //   branch), and a u+a/o hiatus keeps a full glide+u regardless of
    //   stress depth (the branch after that).
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
    // Word-initial gu + a: guar- keeps the u silent (guard, guarantee,
    // guardian — 32 ɡ : 2 ɡw in the dict), any other gua- is the Spanish
    // /ɡw/ (guam, guatemala, guacamole — 31 ɡw : 6 ɡ).
    if (syllableIndex === 0 && phonemes.length === 0 && /^gua/.test(remaining)) {
      const silentU = /^guar/.test(remaining + (tail ?? ""));
      emit("gu", silentU ? "ɡ" : "ɡw", "phoneme:^gu(?=a)");
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
        (!isLastSyllable && !endsWithSilentE &&
          (isStressed || onset === undefined ||
            (syllableIndex === 0 && !nextSyllable?.startsWith("r") &&
              !(syllable === "su" && nextSyllable?.startsWith("b")))) &&
          !nextIsLaxCluster))
    ) {
      emit("u", longU(onset, nextSyllable?.startsWith("r")), "phoneme:^u$");
      break;
    }
    // A mid-word unstressed open u after a single yod-taking (non-coronal)
    // consonant onset keeps the glide even though the vowel itself reduces
    // off-stress: accuracy kjɝ (a following r onset then colors the
    // reduced vowel through the existing unstressed-r merge, the same as
    // any other ə+r), ambulance bjə, amputate pjə, amulet mjə, ammunition
    // mjə. Measured over data/en/dict.json on the C+u+C+V mid-word frame
    // (dict-has-a-j-anywhere proxy, noisy — the real gate is the rule-diff
    // win/loss dump): p 90%, f 92%, c/k 89% (the letter c; the letter k
    // alone is a smaller, noisier 31%), ɡ 78%, m 81%, b 53%, all well
    // above the coronal population this excludes (t 6%, d 7%, s 8%, l 9%,
    // r 5%, z 3%; h was measured too, at 22%, and also left out), which
    // drops the glide instead and falls to the plain ^u rule below. The
    // rule-diff gate, with the next-syllable-s exclusion below already
    // applied: strict 61 : 4, lenient 41 : 13. A secondary-stressed
    // syllable keeps the full, un-reduced u.
    // A next syllable starting with s is excluded too: it is never a win
    // in the dict (0 of 60) and it is how a monosyllabic -Cus base
    // (campus, circus, Fergus, Markus — themselves already glide-less,
    // closed ^u$ syllables) resyllabifies under an -es/-on suffix
    // (campuses, ferguson): the coda s that made the base's u lax
    // reappears as the next syllable's onset, but the syllable is glide-
    // less by the base word's own lexical identity, not by this frame.
    // This one exclusion takes the strict count from 61 : 8 to 61 : 4 —
    // campuses, circuses, ferguson, markuson recovered, zero wins lost.
    if (
      remaining === "u" &&
      syllableIndex > 0 &&
      !isStressed &&
      !isLastSyllable &&
      !endsWithSilentE &&
      onset !== undefined &&
      /^[pbkɡmfv]$/.test(onset) &&
      !nextIsLaxCluster &&
      !nextSyllable?.startsWith("s")
    ) {
      emit("u", isSecondary ? "ju" : "jə", "phoneme:^u$-medial-yod");
      break;
    }
    // A mid-word unstressed u+a/o hiatus keeps a full, un-reduced glide+u
    // (continuous, ambiguous, tenuous, obituary, situate) instead of
    // reducing: the syllable isn't closed the way the bare-^u$ frame
    // above is, so the vowel that follows carries on being read by the
    // rules below (the suffix loop's ^ous$, the -ary hiatus branch, the
    // magic-e -ate). Over data/en/dict.json on this C+u+[ao] mid-word
    // frame the coronal stops palatalize with the glide (t → tʃ:
    // actuary, mortuary, sanctuary, statuary, gargantuan; d → dʒ:
    // arduous, deciduous, gradual). Known miss, not excepted by this code:
    // a handful of Spanish proper nouns sharing the same du+a shape keep
    // it plain instead (padua/anzaldua/basaldua/paduano), while the rest of
    // the frame's consonants keep the onset and insert a plain j
    // (ambiguous, conspicuous, contiguous, continuous, ingenuous,
    // january, manual, strenuous, vacuous). s is left out: the dict is
    // split three ways there with no single winning pattern (persuade
    // sw, sensuous ʃə, usually ʒə). Rule-diff gate over the whole dict:
    // strict 16 : 0, lenient 12 : 3 (the gu+a exclusion just below then
    // recovers one of those three lenient losses at no further cost).
    // gu+a is excluded: it is the same Spanish/"guard" silent-u digraph
    // the word-initial rule above treats as ɡw, just mid-word instead of
    // at syllableIndex 0 (jaguar, vanguard, nicaraguan, paraguay,
    // uruguay); gu+o (ambiguous, contiguous) is unaffected. Rule-diff
    // gate for the exclusion alone: strict 0 : 0, lenient +1 (castonguay).
    if (
      remaining.length > 2 &&
      remaining[0] === "u" &&
      /^[ao]/.test(remaining[1]) &&
      syllableIndex > 0 &&
      !isStressed &&
      onset !== undefined &&
      !(onset === "ɡ" && remaining[1] === "a")
    ) {
      if (/^[td]$/.test(onset)) {
        phonemes[phonemes.length - 1] = onset === "t" ? "tʃ" : "dʒ";
        emit("u", "u", "phoneme:^u-hiatus-coalesce");
        remaining = remaining.substring(1);
        continue;
      }
      if (/^[pbkɡmfnv]$/.test(onset)) {
        emit("u", "ju", "phoneme:^u-hiatus-yod");
        remaining = remaining.substring(1);
        continue;
      }
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
    // pleasant/peasant 12:2, -lou jealous/zealous 9:0, -su measure/
    // treasure/pleasure/countermeasure 20:1. An "eal" left open before
    // -th is the same boundary case for ^ealth, which needs the five
    // letters in one syllable and so misses heal|thier, weal|thiest,
    // steal|thier (8:1). The tails that keep the tense default stay out:
    // -son (season/reason 29:0), -der (leader/reader 14:4), -ter
    // (eater/theater 22:1).
    if (
      (remaining === "ea" && /^(?:ther|san|lou|su)/.test(tail ?? "")) ||
      (remaining === "eal" && /^th/.test(tail ?? ""))
    ) {
      emit("ea", "ɛ", "phoneme:^ea-lax");
      remaining = remaining.substring(2);
      continue;
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
    // Same closed-syllable frame, for a/o: a stressed single-consonant
    // coda before a bare -le syllable is tense (cradle, ladle; bodle,
    // knodle), where the doubled-coda case (paddle, apple; bottle,
    // coddle) stays lax by the syllable-closing default below. a: 10
    // eɪ : 6 other over the dict (cadle/cradle/ladle/radle/shadle/hazle/
    // mahle/stahle/strahle/vahle); o (w excluded — "-owle" is the /aʊ/
    // digraph, crowle/fowle/howle): 8 oʊ : 1 (aristotle, unstressed here).
    if (
      isStressed && isNextLastSyllable && nextSyllable === "le" &&
      /^[ao][^aeiouwylr]$/.test(remaining) &&
      !/([b-df-hj-np-tv-z])\1/.test(syllable)
    ) {
      emit(remaining[0], remaining[0] === "a" ? "eɪ" : "oʊ", "phoneme:^[ao](?=Cle)");
      remaining = remaining.substring(1);
      continue;
    }
    if (
      syllableIndex === 0 &&
      ((isStressed && /^i(?=o|a(?:[^aeiouyn]|n[^aeiouy]))/.test(remaining)) ||
        (isTenseIForm && /^i[ao]/.test(remaining)))
    ) {
      emit("i", "aɪ", "phoneme:^i-hiatus");
      remaining = remaining.substring(1);
      continue;
    }
    // "our" right before a NEXT syllable starting c/s/t is the same
    // THOUGHT/FORCE vowel as the in-syllable ^our(?=[cst]) PHONEME_RULES
    // entry below, for the two ways the boundary can fall short of that
    // entry's own lookahead: the silent-e syllable split (course, source,
    // resource, discourse — "cour"·"se", nothing left in THIS syllable's
    // remaining for the in-syllable check to see) and a genuine syllable
    // boundary before a vowel-initial next syllable (fourteen — "four"·
    // "teen").
    if (remaining === "our" && /^[cst]/.test(nextSyllable ?? "")) {
      emit("our", "ɔɹ", "phoneme:our(nextSyllable=[cst])");
      remaining = "";
      continue;
    }
    // Precompute the set of pattern sources to skip for this syllable
    // context. The inner per-rule loop becomes a single Set.has() check
    // instead of 13+ string comparisons per rule. Built once per
    // syllable; for a 5-syllable word that's 5 small allocations
    // instead of 13 × 150 × 5 = ~10K string ops.
    const aFire = (nextSyllable === "tion" || nextSyllable === "sion" || nextIsCle || nextIsMagicE ||
      (twoSylTense && /^[^aeiouy]*a$/.test(syllable) && !nextSyllable!.startsWith("r")) ||
      (aTwoSylTense && /^[^aeiouy]*a$/.test(syllable)));
    // See FRENCH_INE_GRAM: an unstressed word-final -ine syllable whose
    // preceding consonant(s) mark it as reduced-suffix or French-loan,
    // not the Germanic/Latin-adjective aɪn default.
    const ineReduces =
      !isStressed && !isSecondary && nextSyllable === "ne" &&
      /^[^aeiouy]*i$/.test(syllable) &&
      FRENCH_INE_GRAM.test((prevSyllable ?? "") + syllable + (tail ?? ""));
    const iFire = (nextIsMagicE || endsWithSilentE || (nextIsCle && isStressed) || isTenseIForm ||
      (twoSylTense && /^[^aeiouy]*i$/.test(syllable) && !/^(?:v|en$)/.test(nextSyllable!))) &&
      !ineReduces;
    const skip = new Set<string>();
    if (!hadDoubledL) skip.add("^al$");
    if (gFromDoubling) skip.add("^g(?=[eiy])");
    if (!hasVowelBeforeTerminalY) skip.add("^y$");
    if (!isLastSyllable && !isStressed && !nextIsMagicE) skip.add("^o$");
    if (triLax) skip.add("^o$");
    // A stressed open o before a lax-cluster onset (the same s+stop/sh/ch/
    // th/x set that already blocks a/e/i tensing) stays lax when the whole
    // word ends in the reduced -Con suffix: boston, bosman, coxon. Scoped
    // to that final "-n" shape specifically — the same cluster before an
    // -er/-or/-ar agent-noun ending or a full final vowel goes the other
    // way (poster, kosher, costar, bosko all keep oʊ), so a blanket gate on
    // any next syllable would trade those away. Measured over the -on
    // subset alone (open first syllable, single-consonant "Con" last
    // syllable): 89/94 (94.7%) of the non-cluster, non-r-onset population
    // is already oʊ by the default above, so this only needs to carve the
    // cluster cases back out to lax.
    if (
      nextIsLaxCluster && !nextIsCle &&
      isNextLastSyllable && nextSyllable!.endsWith("n")
    )
      skip.add("^o$");
    // Unlike the rest of nextIsLaxCluster, a next syllable starting with x
    // is lax regardless of what follows it (boxer, boxes, coxen, doxie,
    // epoxy, hypoxia, obnoxious, biloxi) — no -er/-ar/full-vowel ending
    // keeps it tense the way poster/kosher/costar do for the s+stop/sh/ch/
    // th members above. /ks/ is a genuine coda cluster wearing a single
    // letter, so it checks the vowel the way any other coda would: 111 : 0
    // in the dict, no exceptions found.
    if (nextSyllable?.startsWith("x")) skip.add("^o$");
    if (!isLastSyllable || isStressed) skip.add("^ous$");
    // The "leftover single-consonant" merge in `syllabify` also glues a
    // stressed a + single consonant + y into one chunk in the Greek
    // -alysis/-olysis family (pa·raly·sis, ana·lysis, dia·ly·sis,
    // hydro·lysis, thrombo·lysis) — there the -y is the suffix's own
    // thematic vowel (/ɪ/), continuing into a following bare "sis"
    // syllable, not this aCy → /eɪ/ frame (baby, lazy, navy, gravy, and a
    // "baby"-shaped chunk recurring non-finally in a compound: babysit,
    // babysitting). nextSyllable === "sis" is the discriminator, not
    // position: the merge can land this chunk at index 0 (dialysis) or
    // later (analysis, paralysis) depending on what precedes it.
    if (!isStressed || nextSyllable === "sis" || hasDoubledConsonantBeforeY) skip.add("^a(?=[^aeioun]y$)");
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
        /^(?:[^aeiouyrtd]als?|[^aeiouyr](?:es|us|ing|ed|est))$/.test(nextSyllable!)) ||
      // The Italian doubled-one surname (see assignStress): the word-final
      // "e" that is silent everywhere else is pronounced /i/ here (cannone,
      // bottone, pallone — 25 : 3, the losses barrone/stallone/varrone are
      // anglicised). syllableIndex 2 stands in for "exactly 3 syllables",
      // the same restriction assignStress's penult-stress rule uses.
      (isLastSyllable && syllableIndex === 2 && syllable === "ne" &&
        DOUBLED_ONE_ENDING.test(head + syllable));
    if (!eFire) skip.add("^e$");
    if (syllableIndex === 0 || isStressed) skip.add("^tur$");
    if (isLastSyllable || !nextSyllable?.startsWith("st")) skip.add("^y(?=$)");
    if (syllableIndex > 0) { skip.add("^x(?=[aeiouy])"); skip.add("^gil"); skip.add("^scien"); }
    if (syllableIndex === 0 && isLastSyllable) skip.add("^baum$");
    // Greek ch → /k/ (see GREEK_CH_ROOT): off everywhere else, since plain
    // word-initial ch defaults to tʃ (chair, church) far more often than
    // not.
    if (syllableIndex !== 0 || !GREEK_CH_ROOT.test(head + syllable + (tail ?? "")))
      skip.add("^ch");
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
    // A bare vowel+r rime (nothing else left in this syllable) right
    // before a syllable starting with r is the doubled/assimilated r at a
    // syllable boundary (ar·range, ar·rive, er·ror, mir·ror, car·ry,
    // bar·rel), not this syllable's own r-colored coda: the second r is
    // the next syllable's onset, spelled onto this one. ^ar/^[eiu]r would
    // otherwise fuse the vowel and r into one r-colored phoneme before the
    // /ɹ/ onset rule ever runs, which is wrong either way — stressed, the
    // dict wants the plain checked vowel (error ˈɛɹɝ, mirror ˈmɪɹɝ, not
    // ˈɝɹɝ); unstressed, it wants the vowel to reduce and coalesce with
    // the following /ɹ/ the same way the single-r case already does
    // (arise əˈɹaɪz → ɝˈaɪz via postlex's /əɹ/ → ɝ), which can only happen
    // if the vowel is left bare here for the reduction pass to reach.
    // Falling through lands on the plain ^a/^e/^i letter rules below
    // (æ/ɛ/ɪ), and the lone r is picked up by ^r on the next iteration.
    // u is excluded: hurry/current/curry split ɝ vs ɑɹ in the dict with no
    // orthographic discriminator, so ^[eiu]r's existing ɝ default is left
    // alone there. i is excluded too: it collides with the "ir" negative
    // prefix (irregular, irrational, irreversible), which the dict keeps
    // as ɪ + a SEPARATE ɹ under its own secondary stress, not a coalesced
    // ɝ, and with a handful of names (cirrus, mirra, mirren, pirro, sirri)
    // that keep ɪɹ stressed. Isolated (a/e-only vs a/e/i): strict 0 : 7,
    // so i stays out. Scoped to the word's last two syllables
    // (isNextLastSyllable): a 3+-syllable Spanish/Italian surname with the
    // doubled r earlier in the word (arriaga, barrera, carrasco, marrero)
    // keeps its open, unreduced vowel there — measured net-negative
    // without this restriction (many such surnames in the dict). Also
    // excluded: a head + this syllable spelling out a compounding prefix
    // (over·run, counter·revolution) — that "r" doubling is two real
    // morphemes colliding at a boundary, not gemination within one, and
    // degeminating it the same way drops the second root's own onset r
    // (overrun ˈoʊvɝɹən → ˈoʊvɝən). Same prefix set as the -Vce reduction
    // above, for the same reason.
    if (
      nextSyllable?.[0] === "r" &&
      remaining[0] !== "u" &&
      remaining[0] !== "i" &&
      isNextLastSyllable &&
      !/^(?:inter|over|under|counter|super)$/.test(head + syllable) &&
      (remaining === "ar" || /^[ei]r$/.test(remaining))
    ) {
      skip.add("^ar");
      skip.add("^[eiu]r");
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

  // STRUT spelt o after l/b before a final -ve slot (lo·ve, a·bo·ve,
  // glo·ve: 18 ʌ : 5 oʊ in the dict) and before -vern (go·vern: 26 : 3).
  if (
    (/[lb]o$/.test(syllable) && /^ve[sd]?$/.test(nextSyllable ?? "") && isNextLastSyllable) ||
    (/^[^aeiouy]*o$/.test(syllable) && /^vern/.test(nextSyllable ?? ""))
  ) {
    const i = sources.lastIndexOf("o");
    if (i >= 0) phonemes[i] = "ʌ";
  }

  // STRUT <ou> before a -ble/-ple slot (dou·ble, cou·ple, trou·ble); the
  // within-slot cases are PHONEME_RULES' ou(?=[bp]le|ntr|ng) entry.
  if (/ou$/.test(syllable) && /^[bp]les?$/.test(nextSyllable ?? "")) {
    const i = sources.lastIndexOf("ou");
    if (i >= 0) phonemes[i] = "ʌ";
  }

  // Open <o> before final -ther(s) is the STRUT vowel spelt o (other, mother,
  // brother, another, smother): 16 ʌ : 2 ɑ : 1 ɔ in the dict (bother).
  if (/o$/.test(syllable) && /^thers?$/.test(nextSyllable ?? "") && isNextLastSyllable) {
    const i = sources.lastIndexOf("o");
    if (i >= 0) phonemes[i] = "ʌ";
  }

  // The <a> of -ator is /eɪ/ as in -ate, stressed or not (gene·RA·tor).
  if (isNextLastSyllable && nextSyllable === "tor" && /^[^aeiouy]+a$/.test(syllable)) {
    const i = sources.lastIndexOf("a");
    if (i >= 0) phonemes[i] = "eɪ";
  }

  // An open stressed syllable before -ia/-ian/-ious/-eous is tense
  // (al·BA·nia /eɪ/, ar·ME·nia /i/, mon·GO·lia /oʊ/, ca·NA·dian /eɪ/,
  // spon·TA·neous /eɪ/): Latin lengthening before a hiatus. With the -ia
  // stress rule, rules-only: 86 strict wins : 19; <u> is left out (furia,
  // luria keep /ʊ/ in the dict).
  //
  // When the hiatus syllable's onset is /r/ the same lengthening gives the
  // r-colored SQUARE/NEAR vowel instead of the plain diphthong: the r
  // resyllabifies onto the suffix (bar·BAR·ian, vi·CAR·ious, al·GER·ian),
  // the same alternation the word-final ^are$/^ere$ rime rules already
  // spell out. <o> needs no branch here: the default open stressed o is
  // already /oʊ/, and postlex's oʊɹ→ɔɹ narrowing handles glo·ri·ous the
  // same way it narrows for/adore.
  //
  // An s+stop or ch onset keeps the lax vowel instead (ca·spi·an,
  // ba·sti·an, se·ba·sti·an, lan·ca·stri·an, appa·la·chia): 7:2 over the
  // dict. sh and x are not part of this exclusion — kar·da·shian and
  // a·ta·xia stay tense — nor is the general nextIsLaxCluster set, which
  // would also catch those two.
  const hiatusLaxOnset = /^(?:s[ptkc]|ch)/.test(nextSyllable ?? "");
  if (
    isStressed &&
    isNextLastSyllable &&
    !hiatusLaxOnset &&
    LATIN_HIATUS_ENDING.test(nextSyllable ?? "") &&
    /^[^aeiouy]*[aeo]$/.test(syllable)
  ) {
    const v = syllable[syllable.length - 1];
    const table: Record<string, string> = nextSyllable!.startsWith("r")
      ? { a: "ɛ", e: "ɪ" }
      : { a: "eɪ", e: "i", o: "oʊ" };
    const replacement = table[v];
    if (replacement) {
      const i = sources.lastIndexOf(v);
      if (i >= 0) phonemes[i] = replacement;
    }
  }

  // The stressed penult before an Italian name ending (see assignStress)
  // takes its Italian vowel, not the English checked/free one: bar·BA·no
  // /ɑ/, ca·SI·no /i/, capo·NE·tti /ɛ/.
  if (
    isStressed &&
    isNextLastSyllable &&
    // At two syllables -ini/-ola are English or anglicised (mini, nola);
    // the other endings are names there too (gino, gucci).
    (head !== "" || !/(?:ini|ola)$/.test(syllable + (tail ?? ""))) &&
    ITALIAN_ENDING.test(head + syllable + (tail ?? ""))
  ) {
    const v = /[aeiou](?=[^aeiou]*$)/.exec(syllable)?.[0];
    const i = v ? sources.lastIndexOf(v) : -1;
    if (i >= 0) phonemes[i] = ({ a: "ɑ", e: "ɛ", i: "i", o: "oʊ", u: "u" } as Record<string, string>)[v!];
  }

  // The stressed penult of any 3+-slot word ending in consonant + a/o/i (see
  // assignStress) takes the continental e /ɛ/, open o /oʊ/ (528 : 86) and u
  // /u/. <a> keeps the English value although the dict is /ɑ/ 1101 : 142
  // open: continental a won 166 more strict words but turned the top-5000
  // American place names alabama/alaska/colorado/montana (/æ/) into losses.
  // Open i is left English for the same reason (jessica, francisco).
  else if (
    isStressed &&
    isNextLastSyllable &&
    head !== "" &&
    /^[^aeiouy]+[aoi]$/.test(nextSyllable ?? "") &&
    !/[aeiou]{2}/.test(syllable)
  ) {
    const m = /([aeiou])([^aeiou]*)$/.exec(syllable);
    const closed = !!m?.[2];
    const table: Record<string, string> = closed ? { e: "ɛ", u: "u" } : { e: "ɛ", o: "oʊ", u: "u" };
    const i = m ? sources.lastIndexOf(m[1]) : -1;
    if (i >= 0 && table[m![1]]) phonemes[i] = table[m![1]];
  }

  // The rest of an Italian-ending name keeps full e/o/u (lo·ZA·no /loʊ/,
  // co·STA·no /koʊ/); <a> and <i> are anglicised there and reduce like any
  // other (a·LE·tti /ə/, bi·KI·ni /ɪ/). Applied after the reduction below.
  // Rules-only over the dict, against the stress rule alone: e/o/u 178
  // strict wins : 36; adding <i> 216 : 82, <a> 430 : 147 but loses casino.
  const italianWord =
    !isStressed && !isLastSyllable && head + syllable !== "" &&
    ITALIAN_ENDING.test(head + syllable + (tail ?? "")) &&
    vowelGroups(head + syllable + (tail ?? "")) >= 3;

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

  // A word-initial unstressed syllable closed by a single consonant keeps its
  // full vowel — the pretonic position English does not reduce (an·tenna,
  // ad·mission, mag·netic, trans·mission, at·lanta, fan·tastic). The doubled
  // consonant of an assimilated Latin prefix is the exception: there the
  // syllable is the prefix itself and it does reduce (ac·cession, ap·peal,
  // as·sail), so a coda letter repeated as the next syllable's onset is
  // excluded. Counted over data/en/dict.json on exactly the frame below the
  // lexicon has 633 æ (plus 55 ɔ from al-, which the ɔ row would flatten too)
  // against 82 ə; the doubled half of the frame is only 203 æ : 167 ə, which
  // is why it stays in the reduction path.
  const initialClosedA =
    syllableIndex === 0 &&
    /^[^aeiouy]*a[^aeiouy]+$/.test(syllable) &&
    syllable[syllable.length - 1] !== nextSyllable?.[0] &&
    // Latin abs-/ads- before the /s/ onset is the one sub-frame with no
    // majority — 7 æ (absentee, absolute) against 7 ə (absorbent, absurdity) —
    // so it stays in the reduction path.
    !(syllable.endsWith("b") && nextSyllable?.[0] === "s");

  // Same frame for <e>, which raises to /ɪ/ rather than reducing to /ə/:
  // sep·tember, bec·kerman, cen·tennial, en·tangle, em·bankment, del·gado.
  // Here the doubled coda is the strongest half, not the weakest (ɛ 231 : ɪ 8),
  // so it stays in. The one excluded coda is <x>, where the syllable is the
  // ex- prefix and the lexicon splits by what follows it (ex·pand 57 ɪ : 26 ɛ,
  // ex·ceed 30 : 28, ex·tant 46 ɛ : 22 ɪ) — 109 ɪ : 102 ɛ overall, no rule.
  // The rest of the frame is 645 ɛ : 52 ɪ over data/en/dict.json. An onsetless
  // <e> + sonorant before an /s/ onset is excluded too, but on thin evidence:
  // the whole frame is three words, ensconce/ensconced (ɪ) against enskilda
  // (ɛ). Keeping the exclusion holds the two and costs the one.
  const initialClosedE =
    syllableIndex === 0 &&
    /^[^aeiouy]*e[^aeiouyx]+$/.test(syllable) &&
    !(/^e[lmnr]$/.test(syllable) && nextSyllable?.[0] === "s");

  // Same frame for <o> (bom·bastic, cog·nition, dog·matic), minus the
  // Latin com-/con-/cor-/col-/ob- prefixes, which do reduce (community,
  // objective). Rules-only over the dict: 87 strict wins : 14, the losses
  // mostly Polish -owski surnames.
  const initialClosedO =
    syllableIndex === 0 &&
    /^[^aeiouy]*o[^aeiouy]+$/.test(syllable) &&
    !/^(?:co[mnlr]|o[bp]$)/.test(syllable) &&
    syllable[syllable.length - 1] !== nextSyllable?.[0];

  if (
    !isStressed &&
    !isSecondary &&
    !isLastSyllable &&
    !initialClosedA &&
    !initialClosedE &&
    !initialClosedO
  )
    applyReduction(reduceTable("ɪ"));
  if (italianWord) {
    for (let i = 0; i < phonemes.length; i++) {
      const it = ({ e: "ɛ", o: "oʊ", u: "u" } as Record<string, string>)[sources[i]];
      if (it) phonemes[i] = it;
    }
  }

  // The Greek -lysis suffix's thematic -y- reduces to /ə/ before the bare
  // "sis" continuation (paralysis, analysis, dialysis, hydrolysis,
  // electrolysis, urinalysis, psychoanalysis): 7 ə : 1 ɪ over the dict
  // (thrombolysis is the lone ɪ). `hasVowelBeforeTerminalY` is the
  // discriminator, not isStressed: the merge step glues "a"/"o" + this -y-
  // into ONE array slot (na·ly, dro·ly), so the slot as a whole carries the
  // word's primary on that FIRST vowel while -y- is its own, separate,
  // always-unstressed nucleus — unlike bare "lysis", where "ly" is the
  // sole vowel of its slot and stays the stressed /aɪ/.
  if (hasVowelBeforeTerminalY && nextSyllable === "sis" && /y$/.test(syllable)) {
    const i = sources.lastIndexOf("y");
    if (i >= 0) phonemes[i] = "ə";
  }

  // The final -is of the Greek -osis/-ysis suffix family reduces to /ə/ at
  // 3-4 orthographic vowel groups (osmosis, stenosis, cirrhosis, dialysis,
  // paralysis): -osis is 17 ə : 2 ɪ there, -ysis 4 : 1. Longer/compound
  // derivatives (actinomycosis, urinalysis) keep ɪ — the family flips to
  // majority ɪ at 5+ groups, so the depth cap matters, not just the ending.
  if (
    !isStressed &&
    isLastSyllable &&
    /(?:osis|ysis)$/.test(head + syllable) &&
    vowelGroups(head + syllable) >= 3 &&
    vowelGroups(head + syllable) <= 4
  ) {
    const i = phonemes.lastIndexOf("ɪ");
    if (i >= 0) phonemes[i] = "ə";
  }

  // An unstressed vowel before word-final silent-e -ce and its inflections
  // (pa·la·ce, no·ti·ce, ser·vi·ces, prac·ti·cing) reduces to /ə/: the magic-e does not lengthen it off the
  // stress. -se is left out: -ise/-ose/-use there are the stressed or
  // secondary suffixes (advertise, franchise, diffuse). After a two-syllable
  // compounding prefix the -Vce is a free root that keeps its vowel
  // (inter·face, inter·lace). Over data/en/dict.json: 26 strict wins, 6
  // losses, and 4 of the top-5000 fixed (notice, palace, practice, purchase).
  if (
    !isStressed &&
    !isSecondary &&
    syllableIndex > 0 &&
    !/^(inter|over|under|counter|super)$/.test(head) &&
    isNextLastSyllable &&
    /^c(?:e[sd]?|ing)$/.test(nextSyllable ?? "") &&
    /^[^aeiouy]*[aeiou]$/.test(syllable)
  ) {
    const i = phonemes.length - 1;
    if (i >= 0 && /^(eɪ|aɪ|oʊ|ɪ)$/.test(phonemes[i])) phonemes[i] = "ə";
  }

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
    ) &&
    // Independently of any prefix, a final <e> under an obstruent coda that is
    // not the inflectional one keeps /ɛ/: as·pect, ac·cept, am·dek, bob·eck,
    // ab·end, hirsch·feld. The coda has to carry a letter outside {d,s,t} —
    // one built only from those is the -ed/-es/-est/-ness ending, where the
    // same position is /ə/ or /ɪ/ (ab·led, ac·kles, aim·less, bas·ket) — or be
    // the -eld/-end rime, which is 82 ɛ : 8 on its own. Over data/en/dict.json
    // on exactly this frame the lexicon has 436 ɛ against 33 ə, and 125 ɪ that
    // the reduction misses either way; on the subset the dict also leaves
    // unstressed it is 157 ɛ : 32 ə : 124 ɪ.
    !FINAL_OBSTRUENT_E.test(syllable)
  ) {
    // A word-final <e> under a geminate t raises to /ɪ/ instead: over
    // data/en/dict.json -ett is 239 ɪ : 22 ə (the other 41 are the
    // stressed ɛ this branch never sees), against 153 ɪ : 154 ə for
    // single-t -et. The geminate is a surname rime — bartlett, beckett,
    // brackett — and does not flatten the way the native -et of planet
    // and bracket does. The parallel -eth rime is 45 ɪ : 8 ə but its two
    // exceptions are the only common words in the frame (elizabeth,
    // fellmeth), so it stays on the schwa path.
    if (!isSecondary)
      applyReduction(reduceTable(/ett$/.test(syllable) ? "ɪ" : "ə"));
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
    // -ory/-ary right after the stressed syllable: /ɔɹ|ɑɹ/ before /i/ →
    // /ɝ/ (memory/factory/salary at 2 slots; accessory/directory/advisory
    // at 3, where the primary is the stem's own, not the word-initial
    // default). Gated on adjacency to the primary, not a fixed slot
    // index, so it reaches both. Isolated from the rest of this family's
    // other changes (rule-diff with only this branch disabled, vs a true
    // pre-change baseline): 23 dict words are net-new over what the old
    // syllableIndex===1 check already reached at 2 slots — 3+-syllable
    // -ory (accessory, advisory, aleatory, compulsory, degregory,
    // desultory, excretory, inventory, peremptory, predatory,
    // promissory, repertory, unsavory) and -ary words whose primary
    // lands elsewhere in the stem, not on the word-initial syllable the
    // separate -ary rule above covers (alimentary, anniversary,
    // elementary, rudimentary, sedimentary, semilegendary, testamentary,
    // unnecessary — raw /ar/ is still /ɑɹ/ here; it only reduces once
    // adjacent to wherever -ental/-mentary's own stress actually lands).
    // -ery never reaches this branch, checked over the whole dict: its
    // vowel is /ɛɹ/ from the plain `^er(?=[aeiouwy])` rule, reduced to
    // /ɝ/ by the general unstressed-vowel merge regardless of stress
    // adjacency, so it never has the raw /ɔɹ|ɑɹ/ this test looks for. A
    // syllable NOT adjacent to the primary (secretary, category) is
    // untouched, matching the dict's kept /ˌɔɹi ˌɛɹi/. -ory 42 : 17 and
    // -ary 39 : 22 are dict-wide evidence that reduction is the right
    // default across the class; -ery 155 : 6 is the same evidence for a
    // suffix this branch doesn't touch at all. The -iary/-uary hiatus
    // (subsidiary, incendiary) is excluded: its extra vowel is a real
    // syllable the maximal-onset syllabifier still folds into this same
    // slot, so "adjacent to the primary" is true of the SLOT but not of
    // the "ary" nucleus itself, which stays the dict's full /ɛɹi/ —
    // without this exclusion the old 2-slot check already over-reduced
    // actuary, aviary, estuary, january, mortuary, sanctuary, statuary
    // and topiary; excluding it is the fix.
    if (
      prevStressed &&
      !isHiatusSlot(syllable) &&
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
  //   i in the penult group before a single consonant, where the final
  //     group is -y or one of its inflections (ability, cavity, gravity,
  //     amplify, gossipy) 520 : 245, and 51 : 10 over the top-5000
  //     frequency slice — the suffix, not the consonant, is what conditions
  //     this one: the <i> is the slot immediately before the -y suffix
  //     wherever the word's primary stress sits. Per consonant t 291 : 202,
  //     f 151 : 25, l 64 : 6; the rest are under the support floor.
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
        (after >= 2 && groups >= 5 && /^[fgmnz]$/.test(follow)) ||
        (after === 1 &&
          follow.length === 1 &&
          (Y_FINAL_GROUP.test(rest.slice(follow.length)) ||
            (/^[tnmp]$/.test(follow) &&
              LATINATE_FINAL_GROUP.test(rest.slice(follow.length)))))
      )
        phonemes[i] = "ə";
    }

    // The same retention for an initial <e> the syllabifier left open, with
    // the sonorant in the next onset (e|ncyclopedia, e|nzymatic): the closed
    // spelling of this frame is handled before the reduction runs, so what
    // reaches here is only the open split. A sonorant followed by /t/ or /s/
    // is excluded — there the lexicon splits the other way (entire, ensconce).
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
