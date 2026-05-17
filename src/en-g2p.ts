import * as dictionary from "../data/en/dict.json";
import * as homographs from "../data/en/homographs.json";
import { arpabetToIpa, resolveJson } from "./utils";
import { LanguageProcessor } from "./g2p";
import { expandText } from "./expand-en";
import { simplePOSTagger } from "./pos-tagger";
import { transformAmericanToRP } from "./en-gb";

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
  path: 'dictionary' | 'morphology' | 'decomposition' | 'rules';
  syllables?: string[];
  steps: TraceStep[];
}

// --- Linguistics-based Constants ---

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz".split(""));

/**
 * Productive English prefixes that shift primary stress onto the
 * following stem when they lead a decomposed form. Limited to the
 * inseparable Latin/Anglo-Saxon prefixes that linguists generally treat
 * as bound morphemes — these almost always carry secondary (not primary)
 * stress.
 *
 * NOT in this list: super-, hyper-, ultra-, mega-, mini-, post-, mid-,
 * inter-, multi-, etc. — these behave as noun-compound heads in English
 * and keep primary stress on the leading element (ˈSUPERcar, ˈHYPERloop,
 * ˈULTRAviolet). Putting them here would mis-stress those words.
 */
const EN_PREFIXES = new Set([
  "a", "ab", "ad", "anti", "be", "com", "con", "contra", "counter", "de",
  "dis", "em", "en", "ex", "il", "im", "in", "ir", "mis", "non", "pre",
  "pro", "re", "un",
]);

// Valid English onsets (consonant clusters that can start a syllable)
const VALID_ONSETS = new Set(['b', 'bl', 'br', 'c', 'ch', 'cl', 'cr', 'd', 'dr', 'dw', 'f', 'fl', 'fr', 'g', 'gl', 'gr', 'gu', 'h', 'j', 'k', 'kl', 'kn', 'kr', 'l', 'm', 'n', 'p', 'ph', 'pl', 'pr', 'ps', 'qu', 'r', 'rh', 's', 'sc', 'sch', 'scr', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'sph', 'spl', 'spr', 'st', 'str', 'sv', 'sw', 't', 'th', 'thr', 'tr', 'ts', 'tw', 'v', 'w', 'wh', 'wr', 'x', 'y', 'z']);

// --- Phoneme Rules ---

// Improved stress-sensitive suffix rules
const SUFFIX_RULES: Array<[RegExp, string, boolean]> = [
  // [pattern, IPA, attracts_stress]
  [/^tion$/, 'ʃən', false],        // -tion is always unstressed
  [/^sion$/, 'ʒən', false],        // -sion is always unstressed
  [/^cian$/, 'ʃən', false],        // -cian (technician, electrician, musician)
  [/^cial$/, 'ʃəl', false],        // -cial (commercial, social)
  [/^tial$/, 'ʃəl', false],        // -tial (potential, partial)
  [/^ture$/, 'tʃɝ', false],        // -ture (future, nature)
  [/^sure$/, 'ʒɝ', false],         // -sure (measure, pleasure)
  [/^geous$/, 'dʒəs', false],      // -geous (gorgeous, advantageous)
  [/^cious$/, 'ʃəs', false],       // -cious (delicious, precious)
  [/^tious$/, 'ʃəs', false],       // -tious (ambitious, nutritious)
  [/^[ei]ous$/, 'iəs', false],      // -eous/-ious (miscellaneous, various, serious)
  [/^ous$/, 'əs', false],          // -ous (famous, nervous)
  [/^uous$/, 'juəs', false],       // -uous (continuous, ambiguous)
  [/^[ai]ble$/, 'əbəl', false],     // -able/-ible
  [/^[ae]nce$/, 'əns', false],      // -ance/-ence (dominance, presence)
  [/^ness$/, 'nəs', false],        // -ness
  [/^ment$/, 'mənt', false],       // -ment
  [/^less$/, 'ləs', false],        // -less
  [/^ful$/, 'fəl', false],         // -ful
  [/^ly$/, 'li', false],           // -ly
  [/^er$/, 'ɝ', false],            // -er (comparative, agentive)
  [/^ers$/, 'ɝz', false],          // -ers (plural of -er)
  [/^est$/, 'əst', false],         // -est (superlative)
  [/^ing$/, 'ɪŋ', false],          // -ing
  [/^ed$/, 'd', false],            // -ed (past tense base)
  [/^es$/, 'z', false],            // -es (plural/3rd person)
  [/^s$/, 'z', false],             // -s (plural/3rd person)
  [/^age$/, 'ɪdʒ', false],         // -age (package, marriage)
  [/^ive$/, 'ɪv', false],          // -ive (active, passive)
  [/^ism$/, 'ɪzəm', false],        // -ism
  [/^ist$/, 'ɪst', false],         // -ist  
  [/^ity$/, 'əti', false],         // -ity
  [/^al$/, 'əl', false],           // -al (normal, final)
  [/^ic$/, 'ɪk', true],            // -ic attracts stress (economic, systemic)
  [/^ics$/, 'ɪks', true],          // -ics attracts stress (mathematics, politics)
  [/^lity$/, 'ləti', false],       // -lity (quality, reality)  
  [/^ity$/, 'əti', false],         // -ity (other cases)
  [/^ty$/, 'ti', false],           // -ty (empty, sixty)
  [/^[ae]ry$/, 'ɛri', false],       // -ary/-ery (library, bakery)
  [/^ory$/, 'ɔri', false],         // -ory (history, category)
  [/^ry$/, 'ri', false],           // -ry (hungry, angry)
  [/^y$/, 'i', false],             // -y
  [/^le$/, 'əl', false],           // -le (simple, table)
];

// Context-sensitive phoneme rules with improved accuracy
const PHONEME_RULES: Array<[RegExp, string]> = [
  // Silent letter combinations
  [/^pn/, 'n'],                   // pneumonia, pneumatic
  [/^ps/, 's'],                   // psychology, psalm
  [/^pt/, 't'],                   // pterodactyl, ptomaine
  [/^kn/, 'n'],                   // knee, knife, know
  [/^gn/, 'n'],                   // gnome, gnat, gnu
  [/^m[bn]$/, 'm'],               // thumb/lamb/comb (^mb$) and column/autumn/condemn (^mn$): word-final silent stop/nasal
  [/^mn/, 'n'],                   // mnemonic, mnesic (silent initial m)
  [/^wr/, 'ɹ'],                   // write, wrong, wrist
  [/^bt$/, 't'],                  // debt, doubt, subtle (silent b in word/syllable-final bt)
  [/^rh/, 'ɹ'],                   // rhyme, rhino, rhythm, rhetoric (silent h after r)
  [/^sph/, 'sf'],                 // sphere, sphinx (Greek-origin /sf/)
  [/^ght/, 't'],                  // right, might, fight
  [/^gh$/, ''],                   // silent gh at word end (though, bough)
  [/^gh/, 'ɡ'],                   // ghost, ghetto (at start)
  [/^lm/, 'm'],                   // palm, calm, psalm

  // Rime-conditioned vowel patterns. English research (Hanna 1966,
  // Treiman, Sublexical Toolkit) consistently finds the rime (vowel +
  // coda) is the most predictive sub-syllable unit, more so than the
  // vowel alone. These full-rime rules match BEFORE generic onset-only
  // vowel rules and resolve the otherwise-irregular cases.
  [/^ought/, 'ɔt'],               // thought, bought, fought, sought, ought, nought
  [/^aught/, 'ɔt'],               // caught, taught, daughter, naughty, fraught
  [/^ough$/, 'ʌf'],               // rough, tough, enough (default; misses though/cough/through/bough)
  [/^alm$/, 'ɑm'],                // calm, palm, psalm (silent l + a→ɑ)
  [/^alk$/, 'ɔk'],                // walk, talk, chalk, stalk
  // Doubled consonants collapse before PHONEME_RULES iteration, so the
  // post-dedupe form for all/ball/call/… is "al" — anchor on that.
  [/^al$/, 'ɔl'],                 // all, ball, call, fall, hall, mall, tall, wall, small
  [/^ind$/, 'aɪnd'],              // kind, mind, find, bind, blind, behind, rewind
  [/^ild$/, 'aɪld'],              // mild, wild, child
  [/^old$/, 'oʊld'],              // old, cold, gold, fold, hold, mold, sold, told
  [/^olt$/, 'oʊlt'],              // bolt, colt, jolt, volt
  [/^ost$/, 'oʊst'],              // most, post, host (loses cost/lost; majority pattern wins)
  [/^ould$/, 'ʊd'],               // would, could, should (silent l, lax u — closed function-word family)
  
  // Improved digraph handling
  [/^tsch/, 'tʃ'],                // German loanwords
  [/^sch(?=[^aeiou])/, 'ʃ'],     // schmaltz, schnapps (German sch before consonant)
  [/^sch/, 'sk'],                 // schema, schematic (not German)
  [/^she$/, 'ʃi'],                // she (pronoun; anchored so it doesn't eat shed/shell)
  [/^he$/, 'hi'],                 // he  (pronoun; anchored so it doesn't eat here/hen)
  [/^cz/, 'tʃ'],                   // czech, czechoslovak, czar (Polish/Czech cz)
  [/^chr/, 'kɹ'],                  // chrome, chronic, Christ (Greek ch before r)
  [/^chl/, 'kl'],                  // chlorine, chlorinated (Greek ch before l)
  [/^ch/, 'tʃ'],                  // chair, church, much
  [/^ck/, 'k'],                   // back, pick, truck
  [/^ggi/, 'ɡi'],                 // double g before i (buggie) - prevent soft g
  [/^gge/, 'ɡe'],                 // double g before e (trigger) - prevent soft g
  [/^ggy/, 'ɡi'],                 // double g before y (muggy) - prevent soft g
  [/^gg/, 'ɡ'],                   // double g -> single g (buggy, trigger)
  [/^dg/, 'dʒ'],                  // bridge, judge, edge
  [/^ph/, 'f'],                   // phone, graph, elephant
  [/^sh/, 'ʃ'],                   // shoe, fish, wash
  [/^thr/, 'θɹ'],                 // th + r cluster is always voiceless: through, three
  [/^th(?=ink)/, 'θ'],            // voiceless: think, thinking
  [/^th(?=ing$)/, 'θ'],           // voiceless: thing (complete word)
  [/^th(?=ick)/, 'θ'],            // voiceless: thick, thicker
  [/^th(?=orn)/, 'θ'],            // voiceless: thorn, thorny
  [/^th(?=rough)/, 'θ'],          // voiceless: through (already handled above)
  [/^the/, 'ðə'],                 // the (definite article)
  [/^th(?=[aeiou])/, 'ð'],        // voiced before vowels: this, that, they
  [/^th/, 'θ'],                   // voiceless (default): path, math
  [/^tch/, 'tʃ'],                 // watch, match, catch
  [/^wh/, 'w'],                   // what, where, when
  [/^qu/, 'kw'],                  // queen, quick, quote
  [/^ng/, 'ŋ'],                   // sing, ring, king
  
  // Improved vowel teams with better quality distinctions
  [/^oor/, 'ɔɹ'],                 // door, floor, poor, moor (oo before r → /ɔɹ/)
  [/^ook/, 'ʊk'],                 // book, cook, look, hook, took (oo before k → /ʊ/)
  [/^oo/, 'uː'],                  // boot, moon, cool, moose (long u)
  [/^ou/, 'aʊ'],                  // house, about, cloud
  [/^ow(?=[snmk])/, 'aʊ'],        // cow, down, brown (before consonants)
  [/^ow/, 'oʊ'],                  // show, blow, know (at word end typically)
  [/^oy/, 'ɔɪ'],                  // boy, toy, joy  
  [/^oi/, 'ɔɪ'],                  // coin, join, voice
  [/^au/, 'ɔ'],                   // caught, sauce, because
  [/^aw/, 'ɔ'],                   // saw, law, draw
  [/^ay/, 'eɪ'],                  // day, say, way
  [/^air/, 'ɛɹ'],                 // hair, fair, chair, stair (must precede ^ai)
  [/^ai/, 'eɪ'],                  // rain, main, paid
  [/^ea/, 'i'],                   // read, seat, beat (default long)
  [/^ee/, 'i'],                   // see, tree, free
  [/^ie/, 'i'],                   // piece, field, believe  
  [/^ei/, 'eɪ'],                  // vein, weight, eight
  [/^ey/, 'eɪ'],                  // they, grey, key (at end)
  [/^ight/, 'aɪt'],               // night, right, knight (i+ght)
  [/^oa/, 'oʊ'],                  // boat, coat, road
  [/^ross/, 'ɹoʊs'],              // gross -> groʊs
  [/^oss/, 'ɔs'],                 // cross, loss (short o)
  [/^eur/, 'ɝ'],                  // connoisseur, entrepreneur (French -eur → /ɝ/)
  [/^eu/, 'ju'],                  // feud, neuter, Europe
  [/^ew/, 'u'],                   // few, new, threw
  [/^ue/, 'u'],                   // true, blue, glue (at end)
  [/^ui/, 'u'],                   // fruit, suit, cruise
  
  // R-controlled magic-e rimes — anchored at end of syllable. These run
  // BEFORE the generic ^ir/^ar/^or/^ur rules so the silent-e + r combo
  // produces the long-vowel + rhotic reading (care=kɛɹ, fire=faɪɹ,
  // more=mɔɹ, cure=kjʊɹ, here=hɪɹ) instead of collapsing the vowel.
  // The silent-e detection above keeps the trailing 'e' on these
  // syllables so the rules see the full -Vre pattern.
  [/^are$/, 'ɛɹ'],                // care, bare, share, prepare
  [/^ire$/, 'aɪɹ'],               // fire, hire, wire, tire
  [/^ore$/, 'ɔɹ'],                // more, sore, store, before
  [/^ure$/, 'jʊɹ'],               // cure, pure, secure
  [/^ere$/, 'ɪɹ'],                // here, mere, sphere

  // R-controlled vowels (rhotic)
  [/^arr/, 'æɹ'],                 // carry, marry, arrow
  [/^ar/, 'ɑɹ'],                  // car, far, start
  [/^er/, 'ɝ'],                   // her, term, serve
  [/^ir/, 'ɝ'],                   // bird, first, girl
  [/^or/, 'ɔɹ'],                  // for, port, storm
  [/^ur/, 'ɝ'],                   // fur, turn, hurt
  [/^ear/, 'ɪɹ'],                 // hear, clear, year
  [/^eer/, 'ɪɹ'],                 // deer, cheer, peer
  [/^ier/, 'ɪɹ'],                 // pier, tier
  [/^our/, 'aʊɹ'],                // hour, sour, flour
  
  // Context-dependent consonants
  [/^c(?=[eiy])/, 's'],           // soft c: cent, city, cycle
  [/^g(?=[eiy])/, 'dʒ'],          // soft g: gem, gin, gym (but not all cases)
  [/^s(?=[eiy])/, 's'],           // s before front vowels usually stays /s/
  
  // Improved consonant clusters
  [/^spr/, 'spɹ'],                // spring, spray, spread
  [/^str/, 'stɹ'],                // string, street, strong  
  [/^scr/, 'skɹ'],                // screen, script, scratch
  [/^spl/, 'spl'],                // split, splash, splice
  [/^squ/, 'skw'],                // square, squash, squeeze
  [/^shr/, 'ʃɹ'],                 // shrimp, shrink, shrewd
  [/^bl(?!e$)/, 'bl'],             // blue, black, blow (not -ble syllable)
  [/^br/, 'bɹ'],                  // brown, bring, bread
  [/^cl/, 'kl'],                  // clean, close, class
  [/^cr/, 'kɹ'],                  // create, cross, cream
  [/^dr/, 'dɹ'],                  // drive, dream, drop
  [/^fl(?!e$)/, 'fl'],             // fly, floor, flower (not -fle syllable)
  [/^fr/, 'fɹ'],                  // from, free, friend
  [/^gl(?!e$)/, 'ɡl'],             // glass, globe, glad (not -gle syllable)
  [/^gr/, 'ɡɹ'],                  // green, great, group
  [/^pl(?!e$)/, 'pl'],             // place, play, please (not -ple syllable)
  [/^pr/, 'pɹ'],                  // problem, provide, pretty
  [/^sl/, 'sl'],                  // slow, sleep, slide
  [/^sm/, 'sm'],                  // small, smile, smell
  [/^sn/, 'sn'],                  // snow, snake, snack
  [/^sp/, 'sp'],                  // speak, space, sport
  [/^st/, 'st'],                  // start, stop, study
  [/^sw/, 'sw'],                  // sweet, swim, switch
  [/^two/, 'tu'],                 // two (special case)
  [/^tr/, 'tɹ'],                  // tree, try, travel
  [/^tw/, 'tw'],                  // twelve, twenty
  
  // Basic consonants
  [/^b/, 'b'],
  [/^c/, 'k'],                    // hard c (default)
  [/^d/, 'd'],
  [/^f/, 'f'],
  [/^g/, 'ɡ'],                    // hard g (default)
  [/^h/, 'h'],
  [/^j/, 'dʒ'],
  [/^k/, 'k'],
  [/^le$/, 'əl'],                  // syllabic-l ending (-ble/-ple/-tle/-dle/-gle)
  [/^l/, 'l'],
  [/^m/, 'm'],
  [/^nk/, 'ŋk'],                  // bank, think, drink, sink, link, chunk
  [/^n/, 'n'],
  [/^p/, 'p'],
  [/^r/, 'ɹ'],                    // American English rhotic r
  [/^s/, 's'],
  [/^t/, 't'],
  [/^v/, 'v'],
  [/^w/, 'w'],
  [/^x/, 'ks'],                   // tax, fix, mix
  [/^ym(?![aeiou])/, 'ɪm'],       // gym, symbol, symptom (Greek short y before m)
  [/^yn(?![aeiou])/, 'ɪn'],       // syntax, synchronize (Greek short y before n)
  [/^y$/, 'i'],                   // city, happy, country — final y after prior vowel (guard in loop)
  [/^y(?=[aeiou])/, 'j'],         // yes, you, year (consonantal before vowels)
  [/^y/, 'aɪ'],                   // by, my, try (vowel in other positions)
  [/^z/, 'z'],
  
  // Default vowels (short/lax in closed syllables)
  [/^a$/, 'eɪ'],                  // nation/station/abrasion — open-syllable a before -tion/-sion (guard in loop)
  [/^a/, 'æ'],                    // cat, hat, bad
  [/^e/, 'ɛ'],                    // bed, red, get (but she -> ʃi handled above)
  [/^i/, 'ɪ'],                    // sit, hit, big
  [/^o$/, 'oʊ'],                  // piano, hero, zero, echo, cargo — word-final bare o (guard in loop)
  [/^o/, 'ɑ'],                    // cot, hot, dog (American English short o)
  [/^u$/, 'u'],                   // solution/confusion — open-syllable u before -tion/-sion (guard in loop)
  [/^u/, 'ʌ'],                    // cut, but, run
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

  // LanguageProcessor interface implementation
  readonly id = "en-g2p";
  readonly name = "English G2P Processor";
  /**
   * Accepts the bare `en` tag plus both major dialects. The same
   * instance can serve both — see `predict()` for per-call dispatch.
   */
  readonly supportedLanguages = ["en", "en-US", "en-GB"];

  constructor(options: { disableDict?: boolean; dialect?: EnglishDialect } = {}) {
    this.disableDict = options.disableDict || false;
    this.dialect = options.dialect ?? "en-US";
    this.dictionary = Object.assign(Object.create(null), resolveJson<EnDict>(dictionary));
    this.homographs = Object.assign(Object.create(null), resolveJson<HomographDict>(homographs));
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
  tagWord(word: string, context?: { prev?: string; next?: string }): { pos: string; confidence: number } {
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
      const primary = tag.indexOf("-") === -1 ? tag : tag.slice(0, tag.indexOf("-"));
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

    // Extract the region subtag from a BCP 47 tag. Skips an optional
    // 4-letter script (e.g. `en-Latn-US`) and stops at any extension
    // singleton (`-u-…`, `-x-…`). Matches alpha-2 (`gb`) or digit-3
    // (`419`) regions. So `en-US-x-foo`, `en-Latn-GB`, and `EN-GB-u-ca-gregory`
    // all surface their region correctly.
    const regionMatch = tag?.match(/^en(?:-[a-z]{4})?-([a-z]{2}|\d{3})(?:$|-)/);
    const region = regionMatch?.[1];
    const dialect: EnglishDialect =
      region === "gb" ? "en-GB" :
      region === "us" ? "en-US" :
      this.dialect;

    const base = this.predictInternal(word, pos, this.disableDict);
    if (!base) return base;

    return dialect === "en-GB" ? transformAmericanToRP(word, base) : base;
  }

  public trace(word: string, language?: string, pos?: string): TraceResult {
    const lowerWord = word.toLowerCase();
    const ipa = this.predict(word, language, pos) ?? lowerWord;

    if (!this.disableDict) {
      if (pos && Array.isArray(this.homographs[lowerWord])) {
        if (this.homographs[lowerWord].find((entry: HomographEntry) => this.matchPos(entry, pos)))
          return { word, ipa, path: 'dictionary', steps: [{ grapheme: word, phoneme: ipa, rule: 'homograph' }] };
      }
      if (this.customDict[lowerWord])
        return { word, ipa, path: 'dictionary', steps: [{ grapheme: word, phoneme: ipa, rule: 'custom-dict' }] };
      if (this.dictionary[lowerWord])
        return { word, ipa, path: 'dictionary', steps: [{ grapheme: word, phoneme: ipa, rule: 'dict' }] };
    }

    if (this.tryMorphologicalAnalysis(lowerWord))
      return { word, ipa, path: 'morphology', steps: [{ grapheme: word, phoneme: ipa, rule: 'morphology' }] };

    const decomp = this.tryDecomposition(lowerWord);
    if (decomp && decomp.length > 1) {
      const prons = decomp.map(p => this.wellKnown(p));
      if (prons.every(p => p))
        return {
          word, ipa, path: 'decomposition',
          steps: decomp.map((part, i) => ({ grapheme: part, phoneme: prons[i]!, rule: 'decomposition' })),
        };
    }

    const syllables = this.syllabify(lowerWord);
    const stressedIdx = this.assignStress(syllables, lowerWord);
    const traceSteps: TraceStep[] = [];
    syllables.forEach((syl, i) => {
      this.syllableToIPA(syl, i, i === stressedIdx, i === syllables.length - 1, i < syllables.length - 1 ? syllables[i + 1] : undefined, traceSteps);
    });

    return { word, ipa, path: 'rules', syllables, steps: traceSteps };
  }

  private predictInternal(
    word: string,
    pos?: string,
    disableDict?: boolean,
  ): string {
    const lowerWord = word.toLowerCase();

    // Priority 1: Handle hyphenated compounds (e.g., "recession-hit")
    if (lowerWord.includes('-')) {
      const parts = lowerWord.split('-');
      if (parts.length === 2) {
        const part1 = this.predictInternal(parts[0], pos, disableDict);
        const part2 = this.predictInternal(parts[1], pos, disableDict);
        if (part1 && part2) {
          // Remove stress from first part, add to second part for compound stress pattern
          const cleanPart1 = part1.replace(/ˈ/g, '');
          const cleanPart2 = part2.replace(/ˈ/g, '');
          return cleanPart1 + 'ˈ' + cleanPart2;
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
        const pronunciations = decomposition.map(part => this.wellKnown(part));
        if (pronunciations.every(p => p)) {
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
      const containsPeriods = word.includes('.');
      const letters = word.replace(/\./g, '').split('');
      const letterPronunciations = letters.map(letter => this.wellKnown(letter.toLowerCase()));
      if (letterPronunciations.every(p => p)) {
        if (containsPeriods) {
          // No stress for acronyms with periods like M.L.
          return letterPronunciations.map(p => p?.replace(/ˈ/g, '')).join('');
        } else {
          // Add stress for acronyms without periods like TTS
          return letterPronunciations.map(p => `ˈ${p?.replace(/ˈ/g, '')}`).join('');
        }
      }
    }

    // Priority 7: Improved syllabification and rule-based G2P
    const syllables = this.syllabify(lowerWord);
    const stressedSyllableIndex = this.assignStress(syllables, lowerWord);
    
    const syllableIPA = syllables.map((s, i) => {
      const isStressed = i === stressedSyllableIndex;
      const isLastSyllable = i === syllables.length - 1;
      return this.syllableToIPA(s, i, isStressed, isLastSyllable, i < syllables.length - 1 ? syllables[i + 1] : undefined);
    });

    if (syllableIPA.length > 0) {
      let result = syllableIPA.join('');

      // Deduplicate consecutive identical consonants across syllable boundaries
      // (balloon/collision/pollution: doubled spelling = single phoneme).
      result = result.replace(/([pbtdkɡfvszʃʒθðmnŋlɹhjw])\1/g, '$1');

      // Add stress marker
      if (syllables.length > 1 && stressedSyllableIndex >= 0) {
        // Insert primary stress marker before the stressed syllable
        let charIndex = 0;
        for (let i = 0; i < stressedSyllableIndex; i++) {
          charIndex += syllableIPA[i].length;
        }
        result = result.substring(0, charIndex) + 'ˈ' + result.substring(charIndex);
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

  private wellKnown(word: string, pos?: string, skipMorphology = false): string | undefined {
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
    
    // Try plural forms (-s, -es)
    if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && lowerWord.length > 2) {
      const singular = lowerWord.slice(0, -1);
      const basePron = this.wellKnown(singular);
      if (basePron) {
        const lastSound = basePron.slice(-1);
        if (["s", "z", "ʃ", "ʒ", "tʃ", "dʒ"].includes(lastSound)) {
          return basePron + 'ɪz';
        }
        if (["p", "t", "k", "f", "θ"].includes(lastSound)) {
          return basePron + 's';
        }
        return basePron + 'z';
      }
    }
    
    // Try possessive forms ('s) — accept ASCII or curly apostrophe.
    if (/[''‘’]s$/.test(lowerWord) && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      const basePron = this.wellKnown(base);
      if (basePron) {
        const lastSound = basePron.slice(-1);
        if (["s", "z", "ʃ", "ʒ", "tʃ", "dʒ"].includes(lastSound)) {
          return basePron + 'ɪz';
        }
        if (["p", "t", "k", "f", "θ"].includes(lastSound)) {
          return basePron + 's';
        }
        return basePron + 'z';
      }
    }
    
    // Try -es plural
    if (lowerWord.endsWith('es') && lowerWord.length > 3) {
      const singular = lowerWord.slice(0, -2);
      const basePron = this.wellKnown(singular);
      if (basePron) {
        return basePron + 'ɪz';
      }
    }
    
    // Try past tense (-ed)
    if (lowerWord.endsWith('ed') && lowerWord.length > 3) {
      const edPast = (basePron: string) => {
        const lastSound = basePron.slice(-1);
        if (['t', 'd'].includes(lastSound)) return basePron + 'ɪd';
        if (['p', 'k', 's', 'ʃ', 'tʃ', 'f', 'θ'].includes(lastSound)) return basePron + 't';
        return basePron + 'd';
      };
      const base = lowerWord.slice(0, -2);
      const basePron = this.wellKnown(base);
      if (basePron) return edPast(basePron);

      // Doubled-consonant base: "strutted" → "strut", "stopped" → "stop".
      // Mirrors the -ing fallback below.
      const baseShort = lowerWord.slice(0, -3);
      if (lowerWord.length > 4 && lowerWord.slice(-4, -3) === baseShort.slice(-1)) {
        const basePronShort = this.wellKnown(baseShort);
        if (basePronShort) return edPast(basePronShort);
      }
    }
    
    // Try present participle (-ing)
    if (lowerWord.endsWith('ing') && lowerWord.length > 4) {
      const base = lowerWord.slice(0, -3);
      const basePron = this.wellKnown(base);
      if (basePron) {
        return basePron + 'ɪŋ';
      }
      // Handle cases like "running" -> "run"
      const baseShort = lowerWord.slice(0, -4);
      if (lowerWord.length > 4 && lowerWord.slice(-4, -3) === baseShort.slice(-1)) {
        const basePronShort = this.wellKnown(baseShort);
        if (basePronShort) {
            return basePronShort + 'ɪŋ';
        }
      }
    }
    
    // Try -ally / -ly adverbs
    if (lowerWord.endsWith('ally') && lowerWord.length > 4) {
      // e.g., globally -> global
      const base = lowerWord.slice(0, -2);
      // Try to get pronunciation of the base word, either from dictionary or by recursive prediction.
      const basePron = this.wellKnown(base, undefined, true) || this.predictInternal(base, undefined, false);
      if (basePron) {
        // basePron for global is ˈɡloʊbəl. Just add 'i'
        return basePron.replace(/ə$/, '') + 'əli';
      }
    }
    if (lowerWord.endsWith('ly') && !lowerWord.endsWith('ally') && lowerWord.length > 2) {
      // e.g., "quickly" -> "quick"; require base ≥ 3 chars to avoid
      // treating "fly" (base "f") or "rely" (base "re") as -ly derivatives.
      const base = lowerWord.slice(0, -2);
      if (base.length >= 3) {
        const basePron = this.wellKnown(base, undefined, true) || this.predictInternal(base, undefined, false);
        if (basePron) {
          return basePron + 'li';
        }
      }
    }
    
    // Try -able suffix (base must be ≥ 3 chars, so word ≥ 7 chars)
    if (lowerWord.endsWith('able') && lowerWord.length > 6) {
      let base = lowerWord.slice(0, -4);
      let basePron = this.wellKnown(base, undefined, true) || this.predictInternal(base, undefined, false);
      if (basePron) {
        return basePron.replace(/ə$/, '') + 'əbəl';
      }
      base = lowerWord.slice(0, -3);
      basePron = this.wellKnown(base, undefined, true) || this.predictInternal(base, undefined, false);
      if (basePron) {
        return basePron + 'əbəl';
      }
    }
    
    // Try -logy suffix
    if (lowerWord.endsWith('logy') && lowerWord.length > 4) {
      const base = lowerWord.slice(0, -4);
      const basePron = this.wellKnown(base, undefined, true) || this.predictInternal(base, undefined, false);
      if (basePron) {
        return basePron.replace(/ə$/, '') + 'lədʒi';
      }
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
            if (dp[j] !== undefined && this.dictionary[chunk]) {
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

    const chars = word.toLowerCase().split('');
    const syllables: string[] = [];
    let currentSyllable = '';

    // 2. Iterate through the word, identifying vowel and consonant clusters.
    let i = 0;
    while (i < chars.length) {
        const i_before = i;
        // Find a vowel cluster (nucleus)
        let nucleus = '';
        while (i < chars.length && VOWELS.has(chars[i])) {
            nucleus += chars[i];
            i++;
        }

        // Find the following consonant cluster (coda + next onset)
        let consonants = '';
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

        if (nucleus) { // Found a vowel nucleus
            if (consonants.length === 0) { // Word ends in a vowel
                currentSyllable += nucleus;
                syllables.push(currentSyllable);
                currentSyllable = '';
            } else if (consonants.length === 1) { // VCV pattern, consonant starts next syllable
                currentSyllable += nucleus;
                syllables.push(currentSyllable);
                currentSyllable = consonants;
            } else { // VCCV, VCCCV, etc. patterns
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
        } else { // Word starts with a consonant cluster
            currentSyllable += consonants;
        }
    }
     if (currentSyllable) {
        syllables.push(currentSyllable);
    }
    
    // Post-processing: Handle silent 'e'
    // If the last syllable is a lone 'e' and the word is longer than one syllable,
    // merge it with the previous syllable.
    if (syllables.length > 1 && syllables[syllables.length - 1] === 'e') {
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
    if (syllables.length > 1 && syllables[syllables.length - 1] === 're') {
      const prev = syllables[syllables.length - 2];
      if (prev && VOWELS.has(prev[prev.length - 1])) {
        syllables.pop();
        syllables[syllables.length - 1] += 're';
      }
    }

    // Post-processing: Merge any leftover single-consonant syllables into the previous one.
    // This can happen with words like "apple" -> ap-ple, where current logic might give a-p-ple
     for (let j = syllables.length - 1; j > 0; j--) {
        if (syllables[j].split('').every(c => CONSONANTS.has(c))) {
             if (syllables[j-1]) {
                syllables[j - 1] += syllables[j];
                syllables.splice(j, 1);
             }
        }
    }

    return syllables.filter(s => s && s.length > 0);
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
    if (lowerWord.endsWith('tion') || lowerWord.endsWith('sion') || lowerWord.endsWith('cial') || lowerWord.endsWith('tial')) {
      return Math.max(0, syllables.length - 2);
    }
    
    // -ance/-ence words typically stress the antepenult (like dominance -> dəˈmɪnəns)
    if ((lowerWord.endsWith('ance') || lowerWord.endsWith('ence')) && syllables.length >= 3) {
      return 1; // Usually second syllable for these patterns
    }
    
    if (lowerWord.endsWith('ic') && syllables.length > 1) {
      return Math.max(0, syllables.length - 2);
    }
    
    // Common prefixes that don't usually take stress
    const unstressedPrefixes = ['un', 're', 'pre', 'dis', 'mis', 'over', 'under', 'out'];
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
      if (['be', 'de', 're', 'un', 'in', 'ex', 'pre'].some(prefix => firstSyl === prefix)) {
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
    
    const vowelDigraphs = ['aa', 'ai', 'au', 'aw', 'ay', 'ea', 'ee', 'ei', 'eu', 'ey', 'ie', 'oa', 'oo', 'ou', 'ow', 'oy', 'ue', 'ui'];
    
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
      /\w{4,}wide$/,    // worldwide, nationwide  
      /\w{3,}land$/,    // homeland, woodland
      /\w{3,}work$/,    // homework, network
      /\w{3,}time$/,    // sometime, longtime
      /\w{3,}way$/,     // highway, railway
      /\w{3,}ward$/,    // forward, backward
      /hundred/,        // hundred (often in compounds)
      /\w{3,}side$/,    // outside, inside
      /\w{3,}where$/,   // somewhere, anywhere
    ];
    
    return compoundPatterns.some(pattern => pattern.test(word));
  }

  // Enhanced syllable to IPA conversion with stress-sensitive vowel reduction
  private syllableToIPA(syllable: string, syllableIndex: number, isStressed: boolean, isLastSyllable: boolean, nextSyllable?: string, steps?: TraceStep[]): string {
    const stepsStart = steps?.length ?? 0;
    let phonemes: string[] = [];
    let remaining = syllable;

    // Check for suffix rules first
    for (const [pattern, ipa, ] of SUFFIX_RULES) {
      // ^le$ and ^al$ are word-ending patterns; skip on non-final syllables
      // where they are prefix/initial chunks (legionnaire, album, algebra).
      if ((pattern.source === '^le$' || pattern.source === '^al$') && !isLastSyllable) continue;
      if (remaining.match(pattern)) {
        steps?.push({ grapheme: remaining, phoneme: ipa, rule: `suffix:${pattern.source}` });
        return ipa;
      }
    }

    // Handle doubled consonants
    const hadDoubledL = /ll/i.test(syllable);
    // Word-final y → /i/ when the syllable has a prior non-y vowel (city, happy)
    // but stays /aɪ/ when y is the only vowel (by, fly) — guard checked in loop.
    const hasVowelBeforeTerminalY = isLastSyllable && /[aeiou]/i.test(syllable.replace(/y$/i, ''));
    remaining = remaining.replace(/([b-df-hj-np-tv-z])\1/g, '$1');

    // Silent 'e' detection (but exclude common function words like "the").
    // Vowel + r + e patterns (-are/-ere/-ire/-ore/-ure) are also excluded
    // — those are r-controlled magic-e rimes (care/here/fire/more/cure)
    // handled as full-rime rules below; stripping the 'e' first would let
    // the generic `^ar/^ir/^ur` rules collapse the vowel+r into /ɑɹ/ /ɝ/
    // /ɝ/ before the magic-e upgrade can fire, and the upgrade tables
    // can't disambiguate ir-source-ɝ (→ aɪɹ) from ur-source-ɝ (→ jʊɹ).
    const endsWithSilentE = isLastSyllable && syllable.length > 1 && syllable.endsWith('e') &&
      !syllable.endsWith('ee') && !syllable.endsWith('le') && !syllable.endsWith('he') &&
      !syllable.endsWith('tte') && !syllable.endsWith('ght') && !syllable.endsWith('se') &&
      !syllable.endsWith('are') && !syllable.endsWith('ere') &&
      !syllable.endsWith('ire') && !syllable.endsWith('ore') && !syllable.endsWith('ure') &&
      CONSONANTS.has(syllable[syllable.length - 2]);

    if (endsWithSilentE) {
        remaining = syllable.slice(0, -1);
    }

    // Apply phoneme rules
    while(remaining.length > 0) {
        let matchFound = false;
        for (const [pattern, ipa] of PHONEME_RULES) {
            // ^al$ is for the -all rime (all/ball/call); skip it when the
            // original syllable had no doubled-l (e.g. "cal" in "calculator").
            if (!hadDoubledL && pattern.source === '^al$') continue;
            // ^y$ → /i/ only when the syllable already has a prior vowel
            // (city/happy/novelty); skip for monosyllables like by/fly/try.
            if (!hasVowelBeforeTerminalY && pattern.source === '^y$') continue;
            // ^o$ → /oʊ/ only in the last syllable (piano/hero/zero); skip for
            // mid-word bare-o syllables like "to-" in tobacco (unstressed /ə/).
            if (!isLastSyllable && pattern.source === '^o$') continue;
            // ^a$ → /eɪ/ when next syllable is "tion"/"sion" (nation/abrasion) or a
            // consonant-cluster-le ending — open syllable: ta·ble→/teɪ/, sta·ble→/steɪ/.
            const nextIsCle = !!nextSyllable?.match(/^[bdfgkmnprstvz]le$/);
            if (nextSyllable !== 'tion' && nextSyllable !== 'sion' && !nextIsCle && pattern.source === '^a$') continue;
            // ^u$ → /uː/ when next syllable is "tion"/"sion" (solution/confusion/revolution).
            if (nextSyllable !== 'tion' && nextSyllable !== 'sion' && pattern.source === '^u$') continue;
            const match = remaining.match(pattern);
            if (match) {
                phonemes.push(ipa);
                steps?.push({ grapheme: match[0], phoneme: ipa, rule: `phoneme:${pattern.source}` });
                remaining = remaining.substring(match[0].length);
                matchFound = true;
                break;
            }
        }
        if (!matchFound) {
            steps?.push({ grapheme: remaining[0], phoneme: '', rule: 'unmatched' });
            remaining = remaining.substring(1);
        }
    }
    
    // Vowel reduction in unstressed syllables. Linguistically motivated:
    // English unstressed vowels collapse to /ə/ (or /ɪ/ in final closed
    // syllables); this is one of the strongest cross-cuts in English
    // pronunciation (Treiman et al.) and applies regardless of where in
    // the word the unstressed syllable sits — including position 0 in
    // initial-unstress words like "about" (ə·baut), "today" (tə·deɪ),
    // "potato" (pə·teɪ·toʊ). The previous gate of `syllableIndex > 0`
    // wrongly left position-0 vowels at their full quality.
    // Reduction-with-prefix-match: rime-conditioned rules above emit
    // composite phoneme strings ("ɔl", "aɪnd", "oʊld", …), so an
    // equality-only lookup misses the vowel buried at the front. We
    // strip a matching leading short vowel and substitute schwa,
    // preserving any trailing consonants.
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
        'æ': 'ə', 'ɛ': 'ə', 'ɑ': 'ə', 'ʌ': 'ə', 'ɔ': 'ə',
        // Keep ɪ — it's a common unstressed surface form in English.
        // Diphthongs preserved: they resist reduction in fast speech less
        // than short vowels (Treiman, Kessler — vowel weight).
      });
    }

    // Final unstressed syllables: same idea but ɛ keeps a slightly higher
    // realization /ɪ/ (e.g. "pocket" /ˈpɑkɪt/, "rocket" /ˈɹɑkɪt/) which
    // is the standard GA pattern for -et/-it/-id endings.
    if (!isStressed && isLastSyllable && syllableIndex > 0) {
      applyReduction({
        'æ': 'ə', 'ɛ': 'ɪ', 'ɑ': 'ə', 'ʌ': 'ə', 'ɔ': 'ə',
      });
    }
    
    // Magic 'e' rule for stressed syllables
    if (endsWithSilentE && isStressed && phonemes.length > 0) {
      const shortToLong: Record<string, string> = { 
        'æ': 'eɪ',   // cap -> cape
        'ɛ': 'i',    // met -> mete  
        'ɪ': 'aɪ',   // bit -> bite
        'ɑ': 'oʊ',   // hop -> hope
        'ʌ': 'ju'    // cut -> cute
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
        if (steps[si].phoneme !== '') steps[si].phoneme = phonemes[pi++] ?? steps[si].phoneme;
      }
    }

    return phonemes.join('');
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (!pronunciation.match(/^[A-Z0-9]+$/)) {
      pronunciation = arpabetToIpa(pronunciation);
    }
    this.customDict[word.toLowerCase()] = pronunciation;
  }
}

export default EnglishG2P;
