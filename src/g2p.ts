import dictionary from "../data/dict.json";
import homographs from "../data/homographs.json";
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

// Rules for letter-to-phoneme conversion, organized by priority
const PHONEME_RULES: Array<[RegExp, string]> = [
  // --- Priority 1: Invariant and complex patterns ---
  // Silent letters at the beginning of words
  [/^pn/, "n"], // pneumonia
  [/^ps/, "s"], // psychology
  [/^kn/, "n"],
  [/^gn/, "n"],
  [/^wr/, "ɹ"],
  // Common digraphs
  [/^ch/, "tʃ"],
  [/^gh/, "f"], // as in "laugh"
  [/^ph/, "f"],
  [/^sh/, "ʃ"],
  [/^th/, "θ"], // Unvoiced 'th' as a default
  [/^tch/, "tʃ"],
  [/^wh/, "w"],
  [/^qu/, "kw"],
  [/^ng/, "ŋ"],
  [/^sch/, "sk"], // as in "school"

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

  private wellKnown(word: string, pos?: string): string | undefined {
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
    if (word.length <= 3) {
      return [word];
    }
  
    const syllables: string[] = [];
    let currentSyllable = "";
    let chars = word.split('');
  
    for (let i = 0; i < chars.length; i++) {
        let char = chars[i];
        currentSyllable += char;
  
        if (VOWELS.has(char)) {
            let next1 = chars[i + 1];
            let next2 = chars[i + 2];
            let next3 = chars[i + 3];
  
            // VCV pattern -> V-CV (e.g., ro-bot)
            if (CONSONANTS.has(next1) && VOWELS.has(next2)) {
                syllables.push(currentSyllable);
                currentSyllable = "";
            } 
            // VCCV pattern -> VC-CV (e.g., rab-bit)
            else if (CONSONANTS.has(next1) && CONSONANTS.has(next2) && VOWELS.has(next3)) {
                // Keep common consonant digraphs together in the second syllable
                const digraphs = new Set(['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'th', 'tr', 'tw', 'wh', 'wr']);
                if (!digraphs.has(next1 + next2)) {
                    currentSyllable += next1;
                    syllables.push(currentSyllable);
                    currentSyllable = "";
                    i++; // Skip next consonant as it's already added
                }
            }
        }
    }
    if (currentSyllable) {
        syllables.push(currentSyllable);
    }
  
    // Post-process to merge single-letter consonant syllables
    if (syllables.length > 1) {
        for (let i = syllables.length - 1; i > 0; i--) {
            if (syllables[i].length === 1 && CONSONANTS.has(syllables[i])) {
                syllables[i - 1] += syllables[i];
                syllables.splice(i, 1);
            }
        }
    }

    // Handle silent 'e' at the end, keep it with the last syllable
    if (syllables.length > 1 && syllables[syllables.length - 1] === 'e') {
        let lastSyllable = syllables.splice(syllables.length - 2, 2).join('');
        syllables.push(lastSyllable);
    }
    
    return syllables.filter(s => s.length > 0);
  }

  private syllableToIPA(syllable: string, isLastSyllable: boolean): string {
    let phonemes: string[] = [];
    let remaining = syllable;
  
    // Handle doubled consonants by only processing the first one.
    // This is a simplification. e.g., 'buggie' -> 'bugi' not 'buggi'
    remaining = remaining.replace(/([b-df-hj-np-tv-z])\1/g, '$1');

    const endsWithSilentE = isLastSyllable && syllable.length > 1 && syllable.endsWith('e') && !syllable.endsWith('ee') && VOWELS.has(syllable[syllable.length - 2]) === false;

    if (endsWithSilentE) {
        remaining = syllable.slice(0, -1);
    }

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
  ): string {
    const lowerWord = word.toLowerCase();
    // Priority 1: Direct lookups (Dictionary, Homographs, Morphology)
    const knownPronunciation = this.wellKnown(lowerWord, pos);
    if (knownPronunciation) {
      return knownPronunciation;
    }

    // Priority 2: Language-specific G2P
    if (detectedLanguage === 'zh' || chineseG2P.isChineseText(word)) {
      const chineseResult = chineseG2P.textToIPA(word);
      if (chineseResult) return chineseResult;
    }
    if (detectedLanguage || isMultilingualText(word)) {
      const multilingualResult = processMultilingualText(word, detectedLanguage);
      if (multilingualResult) return multilingualResult;
    }

    // Priority 3: Attempt to decompose the word into known dictionary parts
    const decomposition = this.tryDecomposition(lowerWord);
    if (decomposition && decomposition.length > 1) {
        const pronunciations = decomposition.map(part => this.wellKnown(part)?.replace(/ˈ/g, ''));
        if (pronunciations.every(p => p)) {
            // Re-add stress markers between parts
            return 'ˈ' + pronunciations.join('ˈ');
        }
    }

    // Priority 4: Handle acronyms with or without periods, e.g., "TTS" or "M.L."
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

    // Priority 5: Syllabification and rule-based G2P for unknown English words
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
