import dictionary from "../data/dict.json";
import homographs from "../data/homographs.json";
import { ipaToArpabet } from "./utils";
import {
  processMultilingualText,
  isMultilingualText,
} from "./multilingual-processor";

export interface HomographEntry {
  pronunciation: string;
  pos: string;
}

export interface HomographDict {
  [word: string]: HomographEntry[];
}

// --- Shared Constants ---

// G2P rules for main pronunciation generation
export const G2P_RULES: Array<[RegExp, string]> = [
  // Suffixes and complex patterns
  [/^tion/, "SH AH N"],
  [/^sion/, "ZH AH N"],
  [/^cious/, "SH AH S"],
  [/^tious/, "SH AH S"],
  [/^dge/, "JH"],
  [/^tch/, "CH"],

  // Common "ough" patterns
  [/^through/, "TH R UW"],
  [/^enough/, "IY N AH F"],
  [/^cough/, "K AO F"],
  [/^rough/, "R AH F"],
  [/^tough/, "T AH F"],
  [/^bough/, "B AW"],
  [/^dough/, "D OW"],
  [/^ought/, "AO T"],
  [/^aught/, "AO T"],

  // Other multi-letter graphemes
  [/^aigh/, "EY"],
  [/^eigh/, "EY"],
  [/^igh/, "AY"],
  [/^ould/, "UH D"],
  [/^augh/, "AO"],

  // Consonant digraphs
  [/^ch/, "CH"],
  [/^sh/, "SH"],
  [/^th/, "TH"], // Note: This is ambiguous (voiced/unvoiced). TH is a simplification.
  [/^ng/, "NG"],
  [/^nk/, "NG K"],
  [/^ph/, "F"],
  [/^gh/, "F"], // Note: Often silent, but this is a simplification (e.g., laugh)
  [/^ck/, "K"],
  [/^qu/, "K W"],
  [/^wh/, "W"],

  // Vowel digraphs (highly simplified)
  [/^oo/, "UW"],
  [/^ee/, "IY"],
  [/^ea/, "IY"],
  [/^ai/, "EY"],
  [/^ay/, "EY"],
  [/^oa/, "OW"],
  [/^ow/, "OW"],
  [/^ou/, "AW"],
  [/^oi/, "OY"],
  [/^oy/, "OY"],
  [/^au/, "AO"],
  [/^aw/, "AO"],
  [/^ew/, "UW"],
  [/^ue/, "UW"],
  [/^ui/, "UW"],
  [/^ie/, "IY"],
  [/^ei/, "EY"],

  // Context-dependent consonants
  [/^c(?=[eiy])/, "S"], // c before e, i, or y
  [/^g(?=[eiy])/, "JH"], // g before e, i, or y

  // Silent letters (at word start)
  [/^kn/, "N"],
  [/^gn/, "N"],
  [/^wr/, "R"],

  // Final silent letters (simplified)
  [/^mb$/, "M"],
  [/^mn$/, "M"],

  // Double consonants -> single sound
  [/^([bdfgklmnprstz])\1/, "$1"],

  // Single Vowels (very simplified, context-independent)
  [/^a/, "AE"],
  [/^e/, "EH"],
  [/^i/, "IH"],
  [/^o/, "AA"],
  [/^u/, "AH"],
  [/^y/, "AY"],

  // Single Consonants
  [/^b/, "B"],
  [/^c/, "K"],
  [/^d/, "D"],
  [/^f/, "F"],
  [/^g/, "G"],
  [/^h/, "HH"],
  [/^j/, "JH"],
  [/^k/, "K"],
  [/^l/, "L"],
  [/^m/, "M"],
  [/^n/, "N"],
  [/^p/, "P"],
  [/^r/, "R"],
  [/^s/, "S"],
  [/^t/, "T"],
  [/^v/, "V"],
  [/^w/, "W"],
  [/^x/, "K S"],
  [/^z/, "Z"],
];

// Known prefixes for compound word decomposition
export const KNOWN_PREFIXES = [
  "super", "anti", "over", "under", "pre", "post", "auto", "counter",
  "pneumo", "micro", "ultra", "mega", "multi", "semi", "pseudo"
];

// Known suffixes for compound word decomposition  
export const KNOWN_SUFFIXES = ["osis", "itis", "ology", "graphy", "scopy", "phobia"];

// Common words for compound validation
export const COMMON_WORDS = [
  "car", "man", "light", "house", "way", "day", "time", "work", "load", "ball"
];

// Non-compound suffixes for early detection
export const NON_COMPOUND_SUFFIXES = [
  "ing", "ed", "er", "est", "ly", "ness", "ment", "tion", "sion"
];

// Clear prefixes for compound decomposition
export const CLEAR_PREFIXES = [
  "super", "over", "under", "pre", "post", "anti", "counter"
];

// Morpheme patterns for common word patterns
export const MORPHEME_PATTERNS = [
  // Greek/Latin roots
  { pattern: /^(scop)(e|ic|y)?/, baseForm: "scope", type: "root" },
  { pattern: /^(graph)(ic|y)?/, baseForm: "graph", type: "root" },
  { pattern: /^(phon)(e|ic)?/, baseForm: "phone", type: "root" },
  { pattern: /^(log)(ic|y)?/, baseForm: "log", type: "root" },
  { pattern: /^(bio)/, baseForm: "bio", type: "root" },
  { pattern: /^(geo)/, baseForm: "geo", type: "root" },
  { pattern: /^(tele)/, baseForm: "tele", type: "root" },
  { pattern: /^(auto)/, baseForm: "auto", type: "root" },
  { pattern: /^(photo)/, baseForm: "photo", type: "root" },
  { pattern: /^(chron)(o)?/, baseForm: "chrono", type: "root" },
  
  // Scientific/medical roots
  { pattern: /^(pneum)(o)?/, baseForm: "pneumo", type: "root" },
  { pattern: /^(cardio)/, baseForm: "cardio", type: "root" },
  { pattern: /^(gastro)/, baseForm: "gastro", type: "root" },
  { pattern: /^(neuro)/, baseForm: "neuro", type: "root" },
  { pattern: /^(psycho)/, baseForm: "psycho", type: "root" },
  { pattern: /^(thermo)/, baseForm: "thermo", type: "root" },
  { pattern: /^(hydro)/, baseForm: "hydro", type: "root" },
  
  // Common prefixes
  { pattern: /^(anti)/, baseForm: "anti", type: "prefix" },
  { pattern: /^(semi)/, baseForm: "semi", type: "prefix" },
  { pattern: /^(multi)/, baseForm: "multi", type: "prefix" },
  { pattern: /^(pseudo)/, baseForm: "pseudo", type: "prefix" },
  { pattern: /^(proto)/, baseForm: "proto", type: "prefix" },
  
  // Common suffixes
  { pattern: /^(osis)$/, baseForm: "osis", type: "suffix" },
  { pattern: /^(itis)$/, baseForm: "itis", type: "suffix" },
  { pattern: /^(ology)$/, baseForm: "ology", type: "suffix" },
  { pattern: /^(graphy)$/, baseForm: "graphy", type: "suffix" },
  { pattern: /^(scopy)$/, baseForm: "scopy", type: "suffix" },
  { pattern: /^(phobia)$/, baseForm: "phobia", type: "suffix" },
  { pattern: /^(ism)$/, baseForm: "ism", type: "suffix" },
  
  // Chemical/material roots  
  { pattern: /^(sili)(c|co)?/, baseForm: "silicon", type: "root" },
  { pattern: /^(carbon)/, baseForm: "carbon", type: "root" },
  { pattern: /^(oxygen)/, baseForm: "oxygen", type: "root" },
  
  // Geological terms
  { pattern: /^(volcan)/, baseForm: "volcano", type: "root" },
  { pattern: /^(seismo)/, baseForm: "seismo", type: "root" },
  
  // Size/measurement prefixes
  { pattern: /^(mega)/, baseForm: "mega", type: "prefix" },
  { pattern: /^(kilo)/, baseForm: "kilo", type: "prefix" },
  { pattern: /^(nano)/, baseForm: "nano", type: "prefix" },
  { pattern: /^(pico)/, baseForm: "pico", type: "prefix" }
];

// Simplified G2P rules for morpheme processing
export const MORPHEME_RULES: Array<[RegExp, string]> = [
  // Common morpheme patterns
  [/^ph/, "F"],
  [/^ch/, "CH"],
  [/^th/, "TH"],
  [/^sh/, "SH"],
  [/^qu/, "K W"],
  [/^tion$/, "SH AH N"],
  [/^sion$/, "ZH AH N"],
  [/^ology$/, "AA L AH JH IY"],
  [/^graphy$/, "G R AE F IY"],
  
  // Single vowels
  [/^a/, "AE"],
  [/^e/, "EH"],
  [/^i/, "IH"],
  [/^o/, "AA"],
  [/^u/, "AH"],
  [/^y/, "AY"],
  
  // Single consonants
  [/^b/, "B"],
  [/^c/, "K"],
  [/^d/, "D"],
  [/^f/, "F"],
  [/^g/, "G"],
  [/^h/, "HH"],
  [/^j/, "JH"],
  [/^k/, "K"],
  [/^l/, "L"],
  [/^m/, "M"],
  [/^n/, "N"],
  [/^p/, "P"],
  [/^q/, "K"],
  [/^r/, "R"],
  [/^s/, "S"],
  [/^t/, "T"],
  [/^v/, "V"],
  [/^w/, "W"],
  [/^x/, "K S"],
  [/^z/, "Z"],
];

// Basic letter-to-phoneme mapping
export const BASIC_LETTER_MAPPING: { [key: string]: string } = {
  a: "AE",
  e: "EH",
  i: "IH",
  o: "AA",
  u: "AH",
  b: "B",
  c: "K",
  d: "D",
  f: "F",
  g: "G",
  h: "HH",
  j: "JH",
  k: "K",
  l: "L",
  m: "M",
  n: "N",
  p: "P",
  r: "R",
  s: "S",
  t: "T",
  v: "V",
  w: "W",
  x: "K S",
  y: "AY",
  z: "Z",
};

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

    // Try morphological analysis for missing words
    return this.tryMorphologicalAnalysis(word);
  }

  private tryMorphologicalAnalysis(word: string): string | undefined {
    const lowerWord = word.toLowerCase();
    
    // Try plural forms (-s, -es)
    if (lowerWord.endsWith('s') && lowerWord.length > 2 && !lowerWord.endsWith('ss')) {
      const singular = lowerWord.slice(0, -1);
      if (this.dictionary[singular]) {
        const basePron = this.dictionary[singular];
        // Add appropriate plural sound
        if (basePron.endsWith('S') || basePron.endsWith('Z') || basePron.endsWith('SH') || 
            basePron.endsWith('ZH') || basePron.endsWith('CH') || basePron.endsWith('JH')) {
          return basePron + ' IH Z';
        } else if (basePron.endsWith('T') || basePron.endsWith('K') || basePron.endsWith('P') ||
                   basePron.endsWith('F') || basePron.endsWith('TH')) {
          return basePron + ' S';
        } else {
          return basePron + ' Z';
        }
      }
    }
    
    // Try -es plural
    if (lowerWord.endsWith('es') && lowerWord.length > 3) {
      const singular = lowerWord.slice(0, -2);
      if (this.dictionary[singular]) {
        return this.dictionary[singular] + ' IH Z';
      }
    }
    
    // Try past tense (-ed)
    if (lowerWord.endsWith('ed') && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      if (this.dictionary[base]) {
        const basePron = this.dictionary[base];
        // Add appropriate past tense sound
        if (basePron.endsWith('T') || basePron.endsWith('D')) {
          return basePron + ' IH D';
        } else if (basePron.endsWith('K') || basePron.endsWith('P') || basePron.endsWith('S') ||
                   basePron.endsWith('SH') || basePron.endsWith('CH') || basePron.endsWith('F') ||
                   basePron.endsWith('TH')) {
          return basePron + ' T';
        } else {
          return basePron + ' D';
        }
      }
    }
    
    // Try present participle (-ing)
    if (lowerWord.endsWith('ing') && lowerWord.length > 4) {
      const base = lowerWord.slice(0, -3);
      if (this.dictionary[base]) {
        return this.dictionary[base] + ' IH NG';
      }
    }
    
    return undefined;
  }

  public predict(
    word: string,
    pos?: string,
    detectedLanguage?: string,
  ): string {
    const lowerWord = word.toLowerCase();

    // Priority: Homograph -> Dictionary -> Multilingual Processing -> Compound Word Decomposition -> Multi-Compound -> Rules
    const pronunciation = this.wellKnown(lowerWord, pos);
    if (pronunciation) {
      return pronunciation;
    }

    // Check for multilingual text using detected language or fallback to detection
    if (detectedLanguage || isMultilingualText(word)) {
      const multilingualResult = processMultilingualText(
        word,
        detectedLanguage,
      );
      if (multilingualResult) {
        return multilingualResult;
      }
    }

    // Try compound word decomposition
    const compoundResult = this.tryCompoundDecomposition(lowerWord);
    if (compoundResult) {
      return compoundResult;
    }

    // For extremely long words (20+ chars), try simple multi-part decomposition
    if (word.length >= 20) {
      const multiResult = this.trySimpleMultiCompound(lowerWord);
      if (multiResult) {
        return multiResult;
      }
    }

    // Handle uppercase acronyms/abbreviations (2-8 characters, all uppercase)
    if (/^[A-Z]{2,8}$/.test(word)) {
      const letterPronunciations: string[] = [];
      for (const letter of word) {
        const letterPronunciation = this.wellKnown(letter.toLowerCase());
        if (letterPronunciation) {
          letterPronunciations.push(letterPronunciation);
        }
      }
      if (letterPronunciations.length === word.length) {
        return letterPronunciations.join(" ");
      }
    }

    const phonemes: string[] = [];
    let remaining = lowerWord;

    while (remaining.length > 0) {
      let matchFound = false;
      for (const [pattern, replacement] of G2P_RULES) {
        const match = remaining.match(pattern);
        if (match) {
          if (replacement) {
            if (replacement === "$1" && match[1]) {
              phonemes.push(match[1].toUpperCase());
            } else {
              phonemes.push(replacement);
            }
          }
          remaining = remaining.substring(match[0].length);
          matchFound = true;
          break;
        }
      }
      if (!matchFound) {
        remaining = remaining.substring(1);
      }
    }

    // Final cleanup: handle silent 'e' at the end of words (a very common case)
    if (word.endsWith("e") && !word.endsWith("ee") && phonemes.length > 1) {
      const lastPhoneme = phonemes[phonemes.length - 1];
      if (lastPhoneme === "EH") {
        // From the 'e' -> 'EH' rule
        phonemes.pop();
      }
    }

    const result = phonemes.join(" ").trim();

    if (!result) {
      return word.toUpperCase().split("").join(" ");
    }

    return result;
  }

  // Compound word decomposition method
  private tryCompoundDecomposition(word: string): string | undefined {
    // Be more strict about what constitutes a compound word
    if (word.length < 7) return undefined; // Increase minimum length further

    // Early exit for obvious non-compounds
    if (this.isObviouslyNotCompound(word)) {
      return undefined;
    }

    // First, try to find balanced splits (prefer splits closer to the middle)
    const midPoint = Math.floor(word.length / 2);
    const searchOrder: number[] = [];

    // Generate search order: middle outward
    const maxOffset = Math.max(midPoint - 3, word.length - midPoint - 3);
    for (let offset = 0; offset <= maxOffset; offset++) {
      if (midPoint - offset >= 3 && midPoint - offset <= word.length - 3) {
        searchOrder.push(midPoint - offset);
      }
      if (
        offset > 0 &&
        midPoint + offset >= 3 &&
        midPoint + offset <= word.length - 3
      ) {
        searchOrder.push(midPoint + offset);
      }
    }

    // Try balanced splits first - but only if both parts are substantial words
    for (const i of searchOrder) {
      const firstPart = word.substring(0, i);
      const secondPart = word.substring(i);

      // Both parts must be at least 3 characters and exist in dictionary
      if (firstPart.length >= 3 && secondPart.length >= 3) {
        const firstPronunciation = this.wellKnown(firstPart);
        const secondPronunciation = this.wellKnown(secondPart);

        if (firstPronunciation && secondPronunciation) {
          // Additional check: ensure this is a real compound
          if (this.isValidCompound(word, firstPart, secondPart)) {
            return `${firstPronunciation} ${secondPronunciation}`;
          }
        }
      }
    }

    // Try common prefixes (but be very selective)
    for (const prefix of CLEAR_PREFIXES) {
      if (word.startsWith(prefix) && word.length > prefix.length + 3) {
        const root = word.substring(prefix.length);
        const prefixPronunciation = this.wellKnown(prefix);
        const rootPronunciation = this.wellKnown(root);

        if (prefixPronunciation && rootPronunciation && root.length >= 4) {
          return `${prefixPronunciation} ${rootPronunciation}`;
        }
      }
    }

    return undefined;
  }

  // More strict compound validation
  private isValidCompound(
    word: string,
    firstPart: string,
    secondPart: string,
  ): boolean {
    // Must not be a diminutive or nickname
    if (word.endsWith("ie") || word.endsWith("y") || word.endsWith("gie")) {
      return false;
    }

    // Both parts should be meaningful words (not just fragments)
    if (firstPart.length < 3 || secondPart.length < 3) {
      return false;
    }

    // Check if this looks like a real compound (both parts are common words)
    const commonWords = COMMON_WORDS;
    const isFirstCommon = commonWords.includes(firstPart);
    const isSecondCommon = commonWords.includes(secondPart);

    // At least one part should be a common word for it to be a compound
    return isFirstCommon || isSecondCommon;
  }

  // Early detection of obvious non-compounds
  private isObviouslyNotCompound(word: string): boolean {
    // Words ending in diminutive suffixes
    if (word.endsWith("ie") || word.endsWith("gie") || word.endsWith("kie")) {
      return true;
    }

    // Words ending in common suffixes that are not compounds
    const nonCompoundSuffixes = NON_COMPOUND_SUFFIXES;
    if (nonCompoundSuffixes.some((suffix) => word.endsWith(suffix))) {
      return true;
    }

    return false;
  }

  // Simple multi-compound handling for extremely long words (20+ chars)
  private trySimpleMultiCompound(word: string): string | undefined {
    if (word.length < 20) return undefined;

    const parts: string[] = [];
    let remaining = word;

    // Try to find known prefixes first
    for (const prefix of KNOWN_PREFIXES) {
      if (remaining.startsWith(prefix)) {
        const prefixPronunciation = this.wellKnown(prefix);
        if (prefixPronunciation) {
          parts.push(prefixPronunciation);
          remaining = remaining.substring(prefix.length);
          break;
        }
      }
    }

    // Common suffixes that should be handled separately
    let suffix = "";
    let suffixPronunciation = "";
    
    for (const suf of KNOWN_SUFFIXES) {
      if (remaining.endsWith(suf)) {
        const sufPron = this.wellKnown(suf);
        if (sufPron) {
          suffix = suf;
          suffixPronunciation = sufPron;
          remaining = remaining.substring(0, remaining.length - suf.length);
          break;
        }
      }
    }

    // For the middle part, try to find chunks that exist in dictionary
    while (remaining.length > 0) {
      let found = false;

      // Try progressively smaller chunks, prioritizing longer meaningful segments
      for (
        let chunkSize = Math.min(8, remaining.length);
        chunkSize >= 3;
        chunkSize--
      ) {
        const chunk = remaining.substring(0, chunkSize);
        const chunkPronunciation = this.wellKnown(chunk);

        if (chunkPronunciation) {
          // Additional validation: prefer chunks that are likely word roots
          if (this.isLikelyWordRoot(chunk, remaining, chunkSize)) {
            parts.push(chunkPronunciation);
            remaining = remaining.substring(chunkSize);
            found = true;
            break;
          }
        }
      }

      // If no dictionary match found, try common word patterns
      if (!found) {
        const patternResult = this.tryCommonPatterns(remaining);
        if (patternResult) {
          parts.push(patternResult.pronunciation);
          remaining = remaining.substring(patternResult.length);
        } else {
          // Last resort: take a small chunk and use basic mapping
          const fallbackSize = Math.min(3, remaining.length);
          const fallbackChunk = remaining.substring(0, fallbackSize);
          const basicPhonemes = this.basicLetterMapping(fallbackChunk);
          if (basicPhonemes) {
            parts.push(basicPhonemes);
          }
          remaining = remaining.substring(fallbackSize);
        }
      }
    }

    // Add suffix if found
    if (suffixPronunciation) {
      parts.push(suffixPronunciation);
    }

    // Only return if we found at least 2 parts
    return parts.length >= 2 ? parts.join(" ") : undefined;
  }

  // Check if a chunk is likely a meaningful word root
  private isLikelyWordRoot(chunk: string, remaining: string, chunkSize: number): boolean {
    // Prefer longer chunks when available
    if (chunkSize >= 5) return true;
    
    // Avoid breaking in the middle of likely phoneme patterns
    if (chunkSize < remaining.length) {
      const nextChar = remaining[chunkSize];
      // Don't break before common consonant clusters
      if ((chunk.endsWith('c') && nextChar === 'h') ||
          (chunk.endsWith('s') && nextChar === 'h') ||
          (chunk.endsWith('t') && nextChar === 'h')) {
        return false;
      }
    }
    
    // Common root patterns
    const rootPatterns = /^(scop|volcan|sili|pneum|coni)/;
    if (rootPatterns.test(chunk)) {
      return true;
    }
    
    return chunkSize >= 4; // Default: prefer chunks of 4+ characters
  }

  // Try to match common word patterns
  private tryCommonPatterns(text: string): { pronunciation: string; length: number } | null {
    for (const { pattern, baseForm, type } of MORPHEME_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const matchedText = match[0];
        
        // Additional validation based on context and type
        if (this.isValidMorphemeMatch(matchedText, text, type)) {
          // Try to get pronunciation from dictionary first
          let pronunciation = this.getMorphemePronunciation(matchedText, baseForm, type);
          
          if (pronunciation) {
            return { pronunciation, length: matchedText.length };
          }
        }
      }
    }
    
    return null;
  }

  // Validate if a morpheme match makes sense in context
  private isValidMorphemeMatch(matched: string, fullText: string, type: string): boolean {
    // Don't match very short fragments unless they're complete morphemes
    if (matched.length < 3) return false;
    
    // For roots, ensure they're not at the very end of a long word (likely incomplete)
    if (type === "root" && matched.length < fullText.length && fullText.length - matched.length < 3) {
      return false;
    }
    
    // For suffixes, they should be at the end or near the end
    if (type === "suffix" && !fullText.endsWith(matched)) {
      return false;
    }
    
    return true;
  }

  // Get pronunciation for a morpheme using dictionary lookup or rules
  private getMorphemePronunciation(matched: string, baseForm: string, type: string): string | null {
    // Strategy 1: Direct dictionary lookup
    let pronunciation = this.wellKnown(matched);
    if (pronunciation) {
      return pronunciation;
    }
    
    // Strategy 2: Look up base form and adapt
    pronunciation = this.wellKnown(baseForm);
    if (pronunciation) {
      // For roots that match the base form, use as-is
      if (matched === baseForm) {
        return pronunciation;
      }
      
      // For partial matches, try to adapt the pronunciation
      return this.adaptMorphemePronunciation(matched, baseForm, pronunciation, type);
    }
    
    // Strategy 3: Try common alternative forms
    const alternatives = this.getAlternativeBaseforms(baseForm, type);
    for (const alt of alternatives) {
      pronunciation = this.wellKnown(alt);
      if (pronunciation) {
        return this.adaptMorphemePronunciation(matched, alt, pronunciation, type);
      }
    }
    
    // Strategy 4: Use rule-based pronunciation as fallback
    return this.generateRuleBased(matched);
  }

  // Get alternative base forms to look up in dictionary
  private getAlternativeBaseforms(baseForm: string, type: string): string[] {
    const alternatives: string[] = [];
    
    // For roots ending in 'o', try without 'o'
    if (baseForm.endsWith('o') && baseForm.length > 3) {
      alternatives.push(baseForm.slice(0, -1));
    }
    
    // For medical/scientific terms, try common variants
    if (type === "root") {
      switch (baseForm) {
        case "pneumo":
          alternatives.push("pneum", "pneuma");
          break;
        case "chrono":
          alternatives.push("chron", "chronic");
          break;
        case "silicon":
          alternatives.push("silica", "silicone");
          break;
        case "volcano":
          alternatives.push("volcanic", "volcanism");
          break;
        default:
          // Try adding common suffixes
          alternatives.push(baseForm + "ic", baseForm + "al", baseForm + "ism");
      }
    }
    
    return alternatives;
  }

  // Adapt pronunciation for partial morpheme matches
  private adaptMorphemePronunciation(matched: string, baseForm: string, basePronunciation: string, type: string): string {
    // If matched is shorter than base form, truncate pronunciation appropriately
    if (matched.length < baseForm.length) {
      // Simple heuristic: estimate how much of the pronunciation to keep
      const ratio = matched.length / baseForm.length;
      const phonemes = basePronunciation.split(' ');
      const keepCount = Math.max(1, Math.floor(phonemes.length * ratio));
      return phonemes.slice(0, keepCount).join(' ');
    }
    
    // If matched is same length or longer, use full pronunciation
    return basePronunciation;
  }

  // Generate rule-based pronunciation as final fallback
  private generateRuleBased(text: string): string {
    const phonemes: string[] = [];
    let remaining = text.toLowerCase();

    while (remaining.length > 0) {
      let matched = false;
      
      for (const [pattern, replacement] of MORPHEME_RULES) {
        const match = remaining.match(pattern);
        if (match) {
          phonemes.push(replacement);
          remaining = remaining.substring(match[0].length);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        remaining = remaining.substring(1);
      }
    }

    return phonemes.join(' ');
  }

  // Very basic letter-to-phoneme mapping for fallback
  private basicLetterMapping(chunk: string): string {
    return chunk
      .split("")
      .map((char) => BASIC_LETTER_MAPPING[char] || char.toUpperCase())
      .join(" ");
  }

  public addPronunciation(word: string, pronunciation: string): void {
    if (/^[A-Z0-9 ]+$/.test(pronunciation)) {
      this.dictionary[word.toLowerCase()] = pronunciation;
    } else {
      this.dictionary[word.toLowerCase()] = ipaToArpabet(pronunciation);
    }
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
