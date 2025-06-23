// Simple rule-based POS tagger for homograph disambiguation
export interface POSResult {
  word: string;
  pos: string;
  confidence: number;
}

export class SimplePOSTagger {
  // Common verb endings
  private static readonly VERB_ENDINGS = [
    "ed",
    "ing",
    "es",
    "s",
    "en",
    "er",
    "ize",
    "ise",
    "fy",
    "ate",
  ];

  // Common noun endings
  private static readonly NOUN_ENDINGS = [
    "tion",
    "sion",
    "ness",
    "ment",
    "ity",
    "ty",
    "er",
    "or",
    "ist",
    "ian",
    "ism",
    "age",
    "ure",
    "ence",
    "ance",
  ];

  // Common adjective endings
  private static readonly ADJECTIVE_ENDINGS = [
    "able",
    "ible",
    "al",
    "ial",
    "ed",
    "en",
    "er",
    "est",
    "ful",
    "ic",
    "ish",
    "ive",
    "less",
    "ly",
    "ous",
    "y",
  ];

  // Common function words that indicate following word might be a noun
  private static readonly DETERMINERS = [
    "the",
    "a",
    "an",
    "this",
    "that",
    "these",
    "those",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
  ];

  // Common auxiliary verbs and modal verbs
  private static readonly AUX_VERBS = [
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "being",
    "been",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "will",
    "would",
    "shall",
    "should",
    "can",
    "could",
    "may",
    "might",
    "must",
  ];

  // Common prepositions that indicate following word might be a noun
  private static readonly PREPOSITIONS = [
    "in",
    "on",
    "at",
    "by",
    "for",
    "with",
    "from",
    "to",
    "of",
    "about",
    "under",
    "over",
    "through",
    "between",
    "among",
  ];

  /**
   * Tag a single word with its most likely POS
   */
  public tagWord(word: string, context?: string[]): POSResult {
    const lowerWord = word.toLowerCase();

    // Check if current word is determiner first
    if (SimplePOSTagger.DETERMINERS.includes(lowerWord)) {
      return { word, pos: "DT", confidence: 0.9 };
    }

    // Check context clues first (higher confidence)
    if (context && context.length >= 1) {
      const prevWord = context[context.length - 1]?.toLowerCase();
      const nextWord =
        context.length >= 2 ? context[1]?.toLowerCase() : undefined;

      // Previous word is determiner -> likely noun
      if (prevWord && SimplePOSTagger.DETERMINERS.includes(prevWord)) {
        return { word, pos: "!V", confidence: 0.8 };
      }

      // Previous word is preposition -> likely noun
      if (prevWord && SimplePOSTagger.PREPOSITIONS.includes(prevWord)) {
        return { word, pos: "!V", confidence: 0.7 };
      }

      // Previous word is auxiliary verb -> likely verb
      if (prevWord && SimplePOSTagger.AUX_VERBS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.8 };
      }

      // Word followed by 'to' -> likely verb (infinitive)
      if (nextWord === "to") {
        return { word, pos: "V", confidence: 0.7 };
      }
    }

    // Check word endings (medium confidence)
    for (const ending of SimplePOSTagger.VERB_ENDINGS) {
      if (lowerWord.endsWith(ending)) {
        // Special cases for ambiguous endings
        if (ending === "ed") {
          return { word, pos: "VBD", confidence: 0.6 }; // Past tense
        }
        if (ending === "ing") {
          return { word, pos: "V", confidence: 0.6 };
        }
        if (ending === "s" && lowerWord.length > 2) {
          // Could be verb (3rd person) or plural noun
          return { word, pos: "V", confidence: 0.4 };
        }
        return { word, pos: "V", confidence: 0.5 };
      }
    }

    for (const ending of SimplePOSTagger.NOUN_ENDINGS) {
      if (lowerWord.endsWith(ending)) {
        return { word, pos: "!V", confidence: 0.5 };
      }
    }

    for (const ending of SimplePOSTagger.ADJECTIVE_ENDINGS) {
      if (lowerWord.endsWith(ending)) {
        if (ending === "ly") {
          return { word, pos: "ADJ", confidence: 0.6 }; // Adverb, but we'll treat as adjective
        }
        return { word, pos: "!V", confidence: 0.5 };
      }
    }

    // Default fallback - assume noun (most common for homographs)
    return { word, pos: "!V", confidence: 0.3 };
  }

  /**
   * Tag multiple words in sequence with context
   */
  public tagWords(words: string[]): POSResult[] {
    const results: POSResult[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const context = [
        i > 0 ? words[i - 1] : "",
        i < words.length - 1 ? words[i + 1] : "",
      ].filter((w) => w);

      results.push(this.tagWord(word, context));
    }

    return results;
  }

  /**
   * Simple sentence-level POS tagging
   */
  public tagSentence(text: string): POSResult[] {
    // Simple tokenization - split by spaces and punctuation
    const words = text
      .toLowerCase()
      .split(/[\s,.!?;:()]+/)
      .filter((word) => word.length > 0);

    return this.tagWords(words);
  }
}

export const simplePOSTagger = new SimplePOSTagger();
