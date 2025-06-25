import dictionary from "../data/en/dict.json";
import homographs from "../data/en/homographs.json";
import {
  processMultilingualText,
  isMultilingualText,
} from "./multilingual-processor";
import { arpabetToIpa } from "./utils";
import { chineseG2P } from "./zh-g2p";

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

// Rules for letter-to-phoneme conversion.
// This is now split into two parts: SUFFIX_RULES and PHONEME_RULES.

// SUFFIX_RULES are applied to the whole syllable first. They must match the entire syllable.
const SUFFIX_RULES: Array<[RegExp, string]> = [
  [/^eye$/, 'aɪ'],            // "eye" as a word/morpheme
  [/^gical$/, 'dʒɪkəl'],
  [/^tion$/, 'ʃən'],
  [/^sion$/, 'ʒən'],
  [/^ture$/, 'tʃɝ'],         // e.g., juncture, future
  [/^sure$/, 'ʒɝ'],          // e.g., measure, pleasure
  [/^ism$/, 'ɪzəm'],          // e.g., anachronism
  [/^le$/, 'əl'],            // e.g., bramble
  [/^able$/, 'əbəl'],
  [/^ally$/, 'əli'],
  [/^fully$/, 'fəli'],
  [/^ness$/, 'nəs'],
  [/^ment$/, 'mənt'],
  [/^tes$/, "ts"],
  [/^ria$/, "iə"],
  [/^di$/, "dɪ"],
  [/^ch$/, "k"],
  [/^y$/, "i"],
  [/^a$/, "ə"],
];

// PHONEME_RULES are applied iteratively to the beginning of the remaining syllable part.
// ALL rules here MUST start with '^'.
const PHONEME_RULES: Array<[RegExp, string]> = [
  // --- Priority 1: Special cases and complex patterns ---
  [/^character/, 'kæɹəktɝ'], // special case for 'ch'
  [/^school/, 'skul'],      // another 'ch' exception

  // Silent letters at the beginning of words
  [/^pn/, "n"], // pneumonia
  [/^ps/, "s"], // psychology
  [/^kn/, "n"],
  [/^gn/, "n"],
  [/^wr/, "ɹ"],

  // Common digraphs
  [/^ck/, 'k'],
  [/^tsch/, 'tʃ'],
  [/^ch/, "tʃ"],
  [/^gh/, "ɡ"], // as in "ghost"
  [/^ph/, "f"],
  [/^sh/, "ʃ"],
  [/^th/, "θ"], // Unvoiced 'th' as a default
  [/^tch/, "tʃ"],
  [/^wh/, "w"],
  [/^qu/, "kw"],
  [/^ng/, "ŋ"],
  [/^sch/, "sk"], // as in "school" - Note: conflicts with school special case, but OK due to order.

  // --- Vowel Teams / Digraphs ---
  [/^ie/, "i"],   // as in "piece"
  [/^ei/, "eɪ"],  // as in "vein"
  [/^ey/, "i"],   // as in "key"
  [/^ay/, "eɪ"],
  [/^ai/, "eɪ"],
  [/^ea/, "i"],   // as in "read" (can also be /ɛ/)
  [/^ee/, "i"],
  [/^eu/, "ju"],
  [/^ew/, "ju"],
  [/^oa/, "oʊ"],
  [/^oi/, "ɔɪ"],
  [/^oo/, "u"],   // as in "boot" (can also be /ʊ/)
  [/^ou/, "aʊ"],  // as in "out"
  [/^ow/, "aʊ"],  // as in "cow"
  [/^oy/, "ɔɪ"],
  [/^au/, "ɔ"],
  [/^aw/, "ɔ"],
  [/^augh/, "ɔ"],
  [/^aught/, "ɔt"],

  // --- R-controlled vowels ---
  [/^ar/, "ɑɹ"],
  [/^er/, "ɝ"],
  [/^ir/, "ɝ"],
  [/^or/, "ɔɹ"],
  [/^ur/, "ɝ"],

  // --- Context-dependent 'c' and 'g' ---
  [/^c(?=[eiy])/, "s"], // soft c
  // [/^g(?=[eiy])/, "dʒ"], // soft g - This rule is too broad and causes issues with words like 'buggie'.

  // --- Basic Consonants ---
  [/^b/, "b"],
  [/^c/, "k"], // hard c
  [/^d/, "d"],
  [/^f/, "f"],
  [/^g/, "ɡ"], // hard g
  [/^h/, "h"],
  [/^j/, "dʒ"],
  [/^k/, "k"],
  [/^l/, "l"],
  [/^m/, "m"],
  [/^n/, "n"],
  [/^p/, "p"],
  [/^r/, "ɹ"],
  [/^s/, "s"],
  [/^t/, "t"],
  [/^v/, "v"],
  [/^w/, "w"],
  [/^x/, "ks"],
  [/^y/, "j"], // as a consonant
  [/^z/, "z"],

  // --- Default Vowels (for closed syllables) ---
  [/^a/, "æ"], // as in "cat"
  [/^e/, "ɛ"], // as in "bed"
  [/^i/, "ɪ"], // as in "sit"
  [/^o/, "ɑ"], // as in "cot"
  [/^u/, "ʌ"], // as in "cut"
];

// --- G2PModel Class ---

export class G2PModel {
  private dictionary: { [word: string]: string };
  private homographs: { [word: string]: any };

  constructor() {
    this.dictionary = dictionary as { [word: string]: string };
    this.homographs = homographs as HomographDict;
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
    if (this.homographs[word] && pos) {
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
      const basePron = this.wellKnown(base, undefined, true) || this.predict(base, undefined, undefined, false);
      if (basePron) {
        // basePron for global is ˈɡloʊbəl. Just add 'i'
        return basePron.replace(/ə$/, '') + 'əli';
      }
    }
    if (lowerWord.endsWith('ly') && !lowerWord.endsWith('ally') && lowerWord.length > 2) {
      // e.g., "quickly" -> "quick"
      const base = lowerWord.slice(0, -2);
      const basePron = this.wellKnown(base, undefined, true) || this.predict(base, undefined, undefined, false);
      if (basePron) {
        return basePron + 'li';
      }
    }
    
    // Try -able suffix
    if (lowerWord.endsWith('able') && lowerWord.length > 5) {
      let base = lowerWord.slice(0, -4);
      let basePron = this.wellKnown(base, undefined, true) || this.predict(base, undefined, undefined, false);
      if (basePron) {
        return basePron.replace(/ə$/, '') + 'əbəl';
      }
      base = lowerWord.slice(0, -3);
      basePron = this.wellKnown(base, undefined, true) || this.predict(base, undefined, undefined, false);
      if (basePron) {
        return basePron + 'əbəl';
      }
    }
    
    // Try -logy suffix
    if (lowerWord.endsWith('logy') && lowerWord.length > 4) {
      const base = lowerWord.slice(0, -4);
      const basePron = this.wellKnown(base, undefined, true) || this.predict(base, undefined, undefined, false);
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

    // 1. Define a set of valid English onsets (consonant clusters that can start a syllable).
    const VALID_ONSETS = new Set(['b', 'bl', 'br', 'c', 'ch', 'cl', 'cr', 'd', 'dr', 'dw', 'f', 'fl', 'fr', 'g', 'gl', 'gr', 'gu', 'h', 'j', 'k', 'kl', 'kn', 'kr', 'l', 'm', 'n', 'p', 'ph', 'pl', 'pr', 'ps', 'qu', 'r', 'rh', 's', 'sc', 'sch', 'scr', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'sph', 'spl', 'spr', 'st', 'str', 'sv', 'sw', 't', 'th', 'thr', 'tr', 'ts', 'tw', 'v', 'w', 'wh', 'wr', 'x', 'y', 'z']);

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

  private syllableToIPA(syllable: string, isLastSyllable: boolean): string {
    let phonemes: string[] = [];
    let remaining = syllable;
  
    // New, corrected logic: Check for a full syllable suffix match first, *before* any modifications.
    for (const [pattern, ipa] of SUFFIX_RULES) {
      if (remaining.match(pattern)) {
        return ipa;
      }
    }

    // Handle doubled consonants by only processing the first one.
    // This is a simplification. e.g., 'buggie' -> 'bugi' not 'buggi'
    remaining = remaining.replace(/([b-df-hj-np-tv-z])\1/g, '$1');

    const endsWithSilentE = isLastSyllable && syllable.length > 1 && syllable.endsWith('e') && !syllable.endsWith('ee') && VOWELS.has(syllable[syllable.length - 2]) === false;

    if (endsWithSilentE) {
        remaining = syllable.slice(0, -1);
    }

    // This loop is now for non-suffix syllables.
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
    
    // Magic 'e' rule: if the syllable ended with a silent e, change the preceding vowel to its long form.
    if (endsWithSilentE && phonemes.length > 0) {
      const shortToLong: Record<string, string> = { "æ": "eɪ", "ɛ": "i", "ɪ": "aɪ", "ɑ": "oʊ", "ʌ": "ju" };
      for (let i = phonemes.length - 1; i >= 0; i--) {
        if (shortToLong[phonemes[i]]) {
            phonemes[i] = shortToLong[phonemes[i]];
            break; 
        }
      }
    } else {
        // Handle open syllable pronunciation (ending with a vowel)
        if (VOWELS.has(syllable.slice(-1))) {
            const shortToLong: Record<string, string> = { "æ": "eɪ", "ɛ": "i", "ɪ": "aɪ", "ɑ": "oʊ", "ʌ": "u" }; // 'u' as in 'super'
             for (let i = phonemes.length - 1; i >= 0; i--) {
                if (shortToLong[phonemes[i]]) {
                    phonemes[i] = shortToLong[phonemes[i]];
                    break;
                }
            }
        }
    }
  
    return phonemes.join("");
  }

  public predict(
    word: string,
    pos?: string,
    detectedLanguage?: string,
    disableDict?: boolean,
  ): string {
    const lowerWord = word.toLowerCase();

    // Priority 1: Morphological analysis. This is rule-based and should run even if dict lookup is disabled for G2P part.
    const morphPron = this.tryMorphologicalAnalysis(lowerWord);
    if (morphPron) {
        return morphPron;
    }

    // Priority 2: Direct lookups (Dictionary, Homographs)
    if (!disableDict) {
      const knownPronunciation = this.wellKnown(lowerWord, pos, true); // Skip morphology here to avoid re-running
      if (knownPronunciation) {
        return knownPronunciation;
      }
    }

    // Priority 3: Language-specific G2P
    if (detectedLanguage === 'zh' || chineseG2P.isChineseText(word)) {
      const chineseResult = chineseG2P.textToIPA(word);
      if (chineseResult) return chineseResult;
    }
    if (detectedLanguage || isMultilingualText(word)) {
      const multilingualResult = processMultilingualText(word, detectedLanguage);
      if (multilingualResult) return multilingualResult;
    }

    // Priority 4: Attempt to decompose the word into known dictionary parts
    const decomposition = this.tryDecomposition(lowerWord);
    if (decomposition && decomposition.length > 1) {
        const pronunciations = decomposition.map(part => this.wellKnown(part)?.replace(/ˈ/g, ''));
        if (pronunciations.every(p => p)) {
            // Re-add stress markers between parts
            return 'ˈ' + pronunciations.join('ˈ');
        }
    }

    // Priority 5: Handle acronyms with or without periods, e.g., "TTS" or "M.L."
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

    // Priority 6: Syllabification and rule-based G2P for unknown English words
    const syllables = this.syllabify(lowerWord);
    const result = syllables.map((s, i) => this.syllableToIPA(s, i === syllables.length - 1)).join("");

    if (result) {
      // Add primary stress to the first syllable for longer words
      if (syllables.length > 1) {
        return "ˈ" + result;
      }
      return result;
    }

    // Final fallback: just spell it out (should be rare)
    return lowerWord;
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (!pronunciation.match(/^[A-Z0-9]+$/)) {
      pronunciation = arpabetToIpa(pronunciation);
    }
    this.dictionary[word.toLowerCase()] = pronunciation;
  }
}

export const g2pModel = new G2PModel();

export function predict(
  word: string,
  pos?: string,
  detectedLanguage?: string,
): string {
  return g2pModel.predict(word, pos, detectedLanguage);
}
