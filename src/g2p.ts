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

// --- G2PModel Class ---

export class G2PModel {
  private dictionary: { [word: string]: string };
  private homographs: { [word: string]: any };

  constructor() {
    this.dictionary = dictionary as { [word: string]: string };
    this.homographs = homographs as HomographDict;
  }

  private wellKnown(word: string, pos?: string): string | undefined {
    if (this.homographs[word]) {
      const homograph = this.homographs[word].find(
        (h: HomographEntry) => h.pos === pos,
      );
      if (homograph) {
        return homograph.pronunciation;
      }
    }

    if (this.dictionary[word]) {
      return this.dictionary[word];
    }
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

    const rules: Array<[RegExp, string]> = [
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

    const phonemes: string[] = [];
    let remaining = lowerWord;

    while (remaining.length > 0) {
      let matchFound = false;
      for (const [pattern, replacement] of rules) {
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
    const clearPrefixes = [
      "super",
      "over",
      "under",
      "pre",
      "post",
      "anti",
      "counter",
    ];
    for (const prefix of clearPrefixes) {
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
    const commonWords = [
      "car",
      "man",
      "light",
      "house",
      "way",
      "day",
      "time",
      "work",
      "load",
      "ball",
    ];
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
    const nonCompoundSuffixes = [
      "ing",
      "ed",
      "er",
      "est",
      "ly",
      "ness",
      "ment",
      "tion",
      "sion",
    ];
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
    const knownPrefixes = [
      "super",
      "anti",
      "over",
      "under",
      "pre",
      "post",
      "auto",
      "counter",
    ];
    for (const prefix of knownPrefixes) {
      if (remaining.startsWith(prefix)) {
        const prefixPronunciation = this.wellKnown(prefix);
        if (prefixPronunciation) {
          parts.push(prefixPronunciation);
          remaining = remaining.substring(prefix.length);
          break;
        }
      }
    }

    // For the remaining part, try to find chunks that exist in dictionary
    while (remaining.length > 0) {
      let found = false;

      // Try progressively smaller chunks (8 down to 3 characters)
      for (
        let chunkSize = Math.min(8, remaining.length);
        chunkSize >= 3;
        chunkSize--
      ) {
        const chunk = remaining.substring(0, chunkSize);
        const chunkPronunciation = this.wellKnown(chunk);

        if (chunkPronunciation) {
          parts.push(chunkPronunciation);
          remaining = remaining.substring(chunkSize);
          found = true;
          break;
        }
      }

      // If no dictionary match found, take 3-4 characters and process with basic rules
      if (!found) {
        const fallbackSize = Math.min(4, remaining.length);
        const fallbackChunk = remaining.substring(0, fallbackSize);

        // Apply very basic letter-to-phoneme mapping
        const basicPhonemes = this.basicLetterMapping(fallbackChunk);
        if (basicPhonemes) {
          parts.push(basicPhonemes);
        }
        remaining = remaining.substring(fallbackSize);
      }
    }

    // Only return if we found at least 2 parts
    return parts.length >= 2 ? parts.join(" ") : undefined;
  }

  // Very basic letter-to-phoneme mapping for fallback
  private basicLetterMapping(chunk: string): string {
    const mapping: { [key: string]: string } = {
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

    return chunk
      .split("")
      .map((char) => mapping[char] || char.toUpperCase())
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
