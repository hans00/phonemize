import * as dictionary from "../data/en/dict.json";
import * as homographs from "../data/en/homographs.json";
import { arpabetToIpa, resolveJson } from "./utils";
import { G2PProcessor } from "./g2p";

// --- Type Definitions ---

type EnDict = Record<string, string>;

export interface HomographEntry {
  pronunciation: string;
  pos: string;
}

export interface HomographDict {
  [word: string]: HomographEntry[];
}

// --- Linguistics-based Constants ---

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz".split(""));

// Valid English onsets (consonant clusters that can start a syllable)
const VALID_ONSETS = new Set(['b', 'bl', 'br', 'c', 'ch', 'cl', 'cr', 'd', 'dr', 'dw', 'f', 'fl', 'fr', 'g', 'gl', 'gr', 'gu', 'h', 'j', 'k', 'kl', 'kn', 'kr', 'l', 'm', 'n', 'p', 'ph', 'pl', 'pr', 'ps', 'qu', 'r', 'rh', 's', 'sc', 'sch', 'scr', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'sph', 'spl', 'spr', 'st', 'str', 'sv', 'sw', 't', 'th', 'thr', 'tr', 'ts', 'tw', 'v', 'w', 'wh', 'wr', 'x', 'y', 'z']);

// --- Phoneme Rules ---

// Improved stress-sensitive suffix rules
const SUFFIX_RULES: Array<[RegExp, string, boolean]> = [
  // [pattern, IPA, attracts_stress]
  [/^tion$/, 'ʃən', false],        // -tion is always unstressed
  [/^sion$/, 'ʒən', false],        // -sion is always unstressed  
  [/^cial$/, 'ʃəl', false],        // -cial (commercial, social)
  [/^tial$/, 'ʃəl', false],        // -tial (potential, partial)
  [/^ture$/, 'tʃɚ', false],        // -ture (future, nature)
  [/^sure$/, 'ʒɚ', false],         // -sure (measure, pleasure)
  [/^geous$/, 'dʒəs', false],      // -geous (gorgeous, advantageous)
  [/^cious$/, 'ʃəs', false],       // -cious (delicious, precious)
  [/^tious$/, 'ʃəs', false],       // -tious (ambitious, nutritious)
  [/^eous$/, 'iəs', false],        // -eous (aneous, miscellaneous)
  [/^ous$/, 'əs', false],          // -ous (famous, nervous)
  [/^ious$/, 'iəs', false],        // -ious (various, serious)
  [/^uous$/, 'juəs', false],       // -uous (continuous, ambiguous)
  [/^able$/, 'əbəl', false],       // -able
  [/^ible$/, 'əbəl', false],       // -ible  
  [/^ance$/, 'əns', false],        // -ance (dominance, balance)
  [/^ence$/, 'əns', false],        // -ence (presence, silence)
  [/^ness$/, 'nəs', false],        // -ness
  [/^ment$/, 'mənt', false],       // -ment
  [/^less$/, 'ləs', false],        // -less
  [/^ful$/, 'fəl', false],         // -ful
  [/^ly$/, 'li', false],           // -ly
  [/^er$/, 'ɚ', false],            // -er (comparative, agentive)
  [/^ers$/, 'ɚz', false],          // -ers (plural of -er)
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
  [/^ary$/, 'ɛri', false],         // -ary (library, military)  
  [/^ory$/, 'ɔri', false],         // -ory (history, category)
  [/^ery$/, 'ɛri', false],         // -ery (bakery, gallery)
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
  [/^wr/, 'ɹ'],                   // write, wrong, wrist
  [/^mb$/, 'm'],                  // thumb, lamb, comb (word-final)
  [/^ght/, 't'],                  // right, might, fight
  [/^gh$/, ''],                   // silent gh at word end (though, bough)
  [/^gh/, 'ɡ'],                   // ghost, ghetto (at start)
  [/^lm/, 'm'],                   // palm, calm, psalm
  
  // Improved digraph handling
  [/^tsch/, 'tʃ'],                // German loanwords
  [/^sch/, 'sk'],                 // schema, schematic (not German)
  [/^she/, 'ʃi'],                 // she (irregular vowel)
  [/^he/, 'hi'],                  // he (irregular vowel)
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
  [/^oo/, 'uː'],                  // boot, moon, cool, moose (long u)
  [/^ou/, 'aʊ'],                  // house, about, cloud
  [/^ow(?=[snmk])/, 'aʊ'],        // cow, down, brown (before consonants)
  [/^ow/, 'oʊ'],                  // show, blow, know (at word end typically)
  [/^oy/, 'ɔɪ'],                  // boy, toy, joy  
  [/^oi/, 'ɔɪ'],                  // coin, join, voice
  [/^au/, 'ɔ'],                   // caught, sauce, because
  [/^aw/, 'ɔ'],                   // saw, law, draw
  [/^ay/, 'eɪ'],                  // day, say, way
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
  [/^eu/, 'ju'],                  // feud, neuter, Europe
  [/^ew/, 'u'],                   // few, new, threw
  [/^ue/, 'u'],                   // true, blue, glue (at end)
  [/^ui/, 'u'],                   // fruit, suit, cruise
  
  // R-controlled vowels (rhotic)
  [/^arr/, 'æɹ'],                 // carry, marry, arrow
  [/^ar/, 'ɑɹ'],                  // car, far, start
  [/^er/, 'ɚ'],                   // her, term, serve (use ɚ for unstressed)
  [/^ir/, 'ɝ'],                   // bird, first, girl
  [/^or/, 'ɔɹ'],                  // for, port, storm
  [/^ur/, 'ɝ'],                   // fur, turn, hurt
  [/^ear/, 'ɪɹ'],                 // hear, clear, year
  [/^eer/, 'ɪɹ'],                 // deer, cheer, peer
  [/^ier/, 'ɪɹ'],                 // pier, tier
  [/^our/, 'aʊɹ'],                // hour, sour, flour
  [/^air/, 'ɛɹ'],                 // hair, fair, chair
  [/^are/, 'ɛɹ'],                 // care, share, prepare
  
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
  [/^bl/, 'bl'],                  // blue, black, blow
  [/^br/, 'bɹ'],                  // brown, bring, bread
  [/^cl/, 'kl'],                  // clean, close, class
  [/^cr/, 'kɹ'],                  // create, cross, cream
  [/^dr/, 'dɹ'],                  // drive, dream, drop
  [/^fl/, 'fl'],                  // fly, floor, flower
  [/^fr/, 'fɹ'],                  // from, free, friend
  [/^gl/, 'ɡl'],                  // glass, globe, glad
  [/^gr/, 'ɡɹ'],                  // green, great, group
  [/^pl/, 'pl'],                  // place, play, please
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
  [/^l/, 'l'],
  [/^m/, 'm'],
  [/^n/, 'n'],
  [/^p/, 'p'],
  [/^r/, 'ɹ'],                    // American English rhotic r
  [/^s/, 's'],
  [/^t/, 't'],
  [/^v/, 'v'],
  [/^w/, 'w'],
  [/^x/, 'ks'],                   // tax, fix, mix
  [/^y(?=[aeiou])/, 'j'],         // yes, you, year (consonantal before vowels)
  [/^y/, 'aɪ'],                   // by, my, try (vowel in other positions)
  [/^z/, 'z'],
  
  // Default vowels (short/lax in closed syllables)
  [/^a/, 'æ'],                    // cat, hat, bad
  [/^e/, 'ɛ'],                    // bed, red, get (but she -> ʃi handled above)
  [/^i/, 'ɪ'],                    // sit, hit, big
  [/^o/, 'ɑ'],                    // cot, hot, dog (American English short o)
  [/^u/, 'ʌ'],                    // cut, but, run
];

// --- G2PModel Class ---

export class G2PModel implements G2PProcessor {
  private dictionary: EnDict;
  private homographs: HomographDict;
  private disableDict: boolean;

  // G2PProcessor interface implementation
  readonly id = "en-g2p";
  readonly name = "English G2P Processor";
  readonly supportedLanguages = ["en"];

  constructor(options: { disableDict?: boolean } = {}) {
    this.disableDict = options.disableDict || false;
    this.dictionary = resolveJson<EnDict>(dictionary);
    this.homographs = resolveJson<HomographDict>(homographs);
  }

  predict(word: string, language?: string, pos?: string): string | null {
    // If language is specified and not English, return null
    if (language && language !== 'en') {
      return null;
    }
    
    // Use the existing predict method
    return this.predictInternal(word, pos, this.disableDict);
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
        const pronunciations = decomposition.map(part => this.wellKnown(part)?.replace(/ˈ/g, ''));
        if (pronunciations.every(p => p)) {
            // Re-add stress markers between parts
            return 'ˈ' + pronunciations.join('ˈ');
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
      return this.syllableToIPA(s, i, isStressed, isLastSyllable);
    });

    if (syllableIPA.length > 0) {
      let result = syllableIPA.join('');
      
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
    
    // Try possessive forms ('s)
    if (lowerWord.endsWith("'s") && lowerWord.length > 3) {
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
      const base = lowerWord.slice(0, -2);
      const basePron = this.wellKnown(base);
      if (basePron) {
        const lastSound = basePron.slice(-1);
        if (['t', 'd'].includes(lastSound)) {
          return basePron + 'ɪd';
        }
        if (['p', 'k', 's', 'ʃ', 'tʃ', 'f', 'θ'].includes(lastSound)) {
          return basePron + 't';
        }
        return basePron + 'd';
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
      // e.g., "quickly" -> "quick"
      const base = lowerWord.slice(0, -2);
      const basePron = this.wellKnown(base, undefined, true) || this.predictInternal(base, undefined, false);
      if (basePron) {
        return basePron + 'li';
      }
    }
    
    // Try -able suffix
    if (lowerWord.endsWith('able') && lowerWord.length > 5) {
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
    
    // For 2-syllable words, generally stress the first syllable unless it's a weak prefix
    if (syllables.length === 2) {
      // Check for weak prefixes
      if (['be', 'de', 're', 'un', 'in', 'ex', 'pre'].some(prefix => lowerWord.startsWith(prefix))) {
        return 1; // Stress the second syllable
      }
      return 0; // Default: stress first syllable
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
  private syllableToIPA(syllable: string, syllableIndex: number, isStressed: boolean, isLastSyllable: boolean): string {
    let phonemes: string[] = [];
    let remaining = syllable;
  
    // Check for suffix rules first
    for (const [pattern, ipa, ] of SUFFIX_RULES) {
      if (remaining.match(pattern)) {
        return ipa;
      }
    }

    // Handle doubled consonants
    remaining = remaining.replace(/([b-df-hj-np-tv-z])\1/g, '$1');

    // Silent 'e' detection (but exclude common function words like "the")
    const endsWithSilentE = isLastSyllable && syllable.length > 1 && syllable.endsWith('e') && 
      !syllable.endsWith('ee') && !syllable.endsWith('le') && !syllable.endsWith('he') && 
      !syllable.endsWith('tte') && !syllable.endsWith('ght') && !syllable.endsWith('se') &&
      CONSONANTS.has(syllable[syllable.length - 2]);

    if (endsWithSilentE) {
        remaining = syllable.slice(0, -1);
    }

    // Apply phoneme rules
    while(remaining.length > 0) {
        let matchFound = false;
        for (const [pattern, ipa] of PHONEME_RULES) {
            const match = remaining.match(pattern);
            if (match) {
                phonemes.push(ipa);
                remaining = remaining.substring(match[0].length);
                matchFound = true;
                break;
            }
        }
        if (!matchFound) {
            remaining = remaining.substring(1);
        }
    }
    
    // Apply conservative vowel modifications based on stress and position
    if (!isStressed && syllableIndex > 0 && !isLastSyllable) {
      // More conservative vowel reduction - only for clearly unstressed syllables
      for (let i = 0; i < phonemes.length; i++) {
        const vowelReductions: Record<string, string> = {
          'æ': 'ə',   // cat -> ə in unstressed (but not in final syllables)
          'ɛ': 'ə',   // bed -> ə in unstressed
          'ɪ': 'ɪ',   // keep ɪ - common in unstressed syllables
          'ɑ': 'ə',   // cot -> ə in unstressed  
          'ʌ': 'ə',   // cut -> ə in unstressed
          // Don't reduce diphthongs as aggressively
          'eɪ': 'eɪ', // keep in most cases
          'aɪ': 'aɪ', // keep in most cases  
          'ɔɪ': 'ɔɪ', // keep in most cases
          'oʊ': 'oʊ', // keep in most cases
          'aʊ': 'aʊ', // keep in most cases
        };
        
        if (vowelReductions[phonemes[i]]) {
          phonemes[i] = vowelReductions[phonemes[i]];
        }
      }
    }
    
    // Special handling for final unstressed syllables (less reduction)
    if (!isStressed && isLastSyllable && syllableIndex > 0) {
      for (let i = 0; i < phonemes.length; i++) {
        const finalSyllableReductions: Record<string, string> = {
          'æ': 'ə',   // cat -> ə 
          'ɛ': 'ɪ',   // bed -> ɪ in final position (like "pocket")
          'ɑ': 'ə',   // cot -> ə
          'ʌ': 'ə',   // cut -> ə
        };
        
        if (finalSyllableReductions[phonemes[i]]) {
          phonemes[i] = finalSyllableReductions[phonemes[i]];
        }
      }
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
  
    return phonemes.join('');
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (!pronunciation.match(/^[A-Z0-9]+$/)) {
      pronunciation = arpabetToIpa(pronunciation);
    }
    this.dictionary[word.toLowerCase()] = pronunciation;
  }
}

export default G2PModel;
