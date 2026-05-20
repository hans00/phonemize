// Simple rule-based POS tagger for homograph disambiguation

// --- POS Tagging Constants ---

// Common verb endings
const VERB_ENDINGS = [
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
const NOUN_ENDINGS = [
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
const ADJECTIVE_ENDINGS = [
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
const DETERMINERS = [
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
const AUX_VERBS = [
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
const PREPOSITIONS = [
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

// Common nouns that don't follow typical patterns
const COMMON_NOUNS = [
  "way",
  "book",
  "books",
  "paper",
  "time",
  "people",
  "world",
  "life",
  "hand",
  "part",
  "child",
  "eye",
  "woman",
  "place",
  "work",
  "week",
  "case",
  "point",
  "company",
  "number",
  "group",
  "problem",
  "fact",
];

// Imperative indicators
const IMPERATIVE_INDICATORS = ["please", "don't", "do", "doesn't", "never"];

// Modal verbs that indicate following word is likely a verb
const MODAL_VERBS = [
  "can",
  "will",
  "would",
  "should",
  "could",
  "may",
  "might",
  "must",
];

// Subject pronouns that indicate following word is likely a verb
const SUBJECT_PRONOUNS = ["i", "you", "he", "she", "it", "we", "they"];

// --- Interface ---

export interface POSResult {
  word: string;
  pos: string;
  confidence: number;
}

// --- SimplePOSTagger Class ---

export class SimplePOSTagger {
  /**
   * Check if a word is likely a noun based on its endings
   */
  private isLikelyNoun(word: string): boolean {
    const lowerWord = word.toLowerCase();

    // Check common noun endings
    for (const ending of NOUN_ENDINGS) {
      if (lowerWord.endsWith(ending)) {
        return true;
      }
    }

    // Check common nouns that don't follow patterns
    return COMMON_NOUNS.includes(lowerWord);
  }

  /**
   * Tag a single word with its most likely POS
   */
  public tagWord(word: string, context?: string[]): POSResult {
    const lowerWord = word.toLowerCase();

    // Check if current word is determiner first
    if (DETERMINERS.includes(lowerWord)) {
      return { word, pos: "DT", confidence: 0.9 };
    }

    // Check context clues first (higher confidence)
    if (context && context.length >= 1) {
      const prevWord = context[0]?.toLowerCase(); // First element is previous word
      const nextWord =
        context.length >= 2 ? context[1]?.toLowerCase() : undefined; // Second element is next word

      // Enhanced detection patterns - highest priority first

      // Previous word is determiner -> likely noun (HIGHEST priority for structural patterns)
      if (prevWord && DETERMINERS.includes(prevWord)) {
        return { word, pos: "!V", confidence: 0.95 };
      }

      // Imperative patterns: Please/Don't + word -> likely verb
      if (prevWord && IMPERATIVE_INDICATORS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.9 };
      }

      // Modal + word -> likely verb (can read, will lead, etc.)
      if (prevWord && MODAL_VERBS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.9 };
      }

      // Subject pronoun + word -> likely verb (I read, he leads, etc.)
      if (prevWord && SUBJECT_PRONOUNS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.85 };
      }

      // Previous word is auxiliary verb -> likely verb
      if (prevWord && AUX_VERBS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.8 };
      }

      // Word + determiner/article -> current word likely verb (read the, lead the, etc.)
      if (nextWord && DETERMINERS.includes(nextWord)) {
        return { word, pos: "V", confidence: 0.8 };
      }

      // Word + noun -> current word likely verb/adjective
      if (nextWord && this.isLikelyNoun(nextWord)) {
        return { word, pos: "V", confidence: 0.75 };
      }

      // Word followed by 'to' -> likely verb (infinitive)
      if (nextWord === "to") {
        return { word, pos: "V", confidence: 0.7 };
      }

      // Previous word is preposition -> likely noun
      if (prevWord && PREPOSITIONS.includes(prevWord)) {
        return { word, pos: "!V", confidence: 0.7 };
      }
    }

    // Check word endings (medium confidence)
    for (const ending of VERB_ENDINGS) {
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

    for (const ending of NOUN_ENDINGS) {
      if (lowerWord.endsWith(ending)) {
        return { word, pos: "!V", confidence: 0.5 };
      }
    }

    for (const ending of ADJECTIVE_ENDINGS) {
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
