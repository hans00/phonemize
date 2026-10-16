// Simple rule-based POS tagger for homograph disambiguation
import type { PredictionContext, VerbForm } from "../g2p";

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

const ATTRIBUTIVE_SUFFIX = /(ical|ial|ous|ful|less|ible|able|ular|ic|al)$/;
const RELATIVE_PRONOUNS = ["that", "which", "who"];
const PREVERBAL_ADVERBS = ["also", "often", "never", "always", "usually", "still", "sometimes", "rarely", "seldom", "then"];
const DEMONSTRATIVES = ["this", "that", "these", "those"];
const BE_FORMS = ["am", "is", "are", "was", "were", "be", "being", "been"];
const HAVE_FORMS = ["have", "has", "had", "having"];
const CONTRACTED_BE_HAVE = /^(?:(?:he|she|it|that|there|what|who)['‘’]s|i['‘’]m|(?:you|we|they)['‘’]re)$/;

function isNegatedBareAuxiliary(word: string): boolean {
  return word === "cannot" || /^(?:ca|wo|sha|would|should|could|may|might|must|need|dare|ought|do|does|did)n['‘’]t$/.test(word);
}

const OPEN_DELIMITER = /^["“«\[({]$/;
const CLOSE_DELIMITER = /^["”»\])}]$/;
function precedingContextIndex({ words, index }: PredictionContext): number {
  return OPEN_DELIMITER.test(words[index - 1] ?? "") && CLOSE_DELIMITER.test(words[index + 1] ?? "")
    ? index - 2 : index - 1;
}
function isQuotedPreviousWord(word: string, sentence?: PredictionContext): boolean {
  if (!sentence) return false;
  const index = precedingContextIndex(sentence);
  return CLOSE_DELIMITER.test(sentence.words[index] ?? "") &&
    sentence.words[index - 1]?.toLowerCase() === word && OPEN_DELIMITER.test(sentence.words[index - 2] ?? "");
}

function isVerbAdverb(word: string): boolean {
  return word === "not" || word === "just" || word === "already" || PREVERBAL_ADVERBS.includes(word) || /ly$/.test(word);
}
function isModalAdverb(word: string): boolean {
  return isVerbAdverb(word) || word === "rather" || word === "later";
}
function hasModalAdverbFrame({ words, index }: PredictionContext): boolean {
  const lower = (i: number) => (words[i] ?? "").toLowerCase().replace(/[‘’]/g, "'");
  let previous = precedingContextIndex({ words, index });
  if (!isModalAdverb(lower(previous))) return false;
  while (previous >= 0 && isModalAdverb(lower(previous))) previous--;
  if (SUBJECT_PRONOUNS.includes(lower(previous))) {
    previous--;
    // Extended preference/time adverbs before a subject may open a mandative clause.
    while (previous >= 0 && isVerbAdverb(lower(previous))) previous--;
  }
  return (/^(?:would|should|could|shall)$/.test(lower(previous)) || isNegatedBareAuxiliary(lower(previous))) &&
    !DETERMINERS.includes(lower(previous - 1)) && !/['’]s$|s['’]$/.test(lower(previous - 1));
}

/** Infer inflection separately from POS; no pronunciation or target-word table. */
export function inferVerbForm({ words, index }: PredictionContext): VerbForm | undefined {
  const lower = (i: number) => (words[i] ?? "").toLowerCase().replace(/[‘’]/g, "'");
  // -only attaches to the base operation, not a passive participle.
  if (lower(index + 1) === "-" && lower(index + 2) === "only") return "base";
  if (hasModalAdverbFrame({ words, index })) return "base";
  const adverb = isVerbAdverb;
  let previous = precedingContextIndex({ words, index });
  while (previous >= 0 && adverb(lower(previous))) previous--;
  const subject = lower(previous);
  let auxiliary = subject;
  if (SUBJECT_PRONOUNS.includes(subject)) {
    let beforeSubject = previous - 1;
    while (beforeSubject >= 0 && adverb(lower(beforeSubject))) beforeSubject--;
    auxiliary = lower(beforeSubject);
  }
  if (["to", "do", "does", "did", ...MODAL_VERBS].includes(auxiliary) || isNegatedBareAuxiliary(auxiliary)) return "base";
  if (HAVE_FORMS.includes(auxiliary) || BE_FORMS.includes(auxiliary) || CONTRACTED_BE_HAVE.test(auxiliary) || /^(?:have|has|had)n't$|'ve$/.test(auxiliary)) return "participle";
  // At a clause head, an uninflected verb after he/she/it is past.
  // Abstain after content words/'that': an embedded mandative may be base.
  const agreementPast = /^(?:he|she|it)$/.test(subject) && (previous === 0 || /^[,;:"“，；：。！？]$/.test(lower(previous - 1)) ||
      /^(?:where|when|because|although|while|if|after|before|since|until|once|as|though|unless)$/.test(lower(previous - 1)));
  let habitual = false;
  for (const direction of [-1, 1]) {
    // Bound cue lookup so repeated ambiguous tokens cannot make a long
    // sentence quadratic. The complete sentence remains available to callers.
    for (let i = index + direction; i >= 0 && i < words.length && Math.abs(i - index) <= 32; i += direction) {
      const w = lower(i);
      if (/^[,;:.!?，；：。！？]$/.test(w) || /^(?:and|but|or|while|whereas)$/.test(w)) break;
      // Habitual phrases alone do not establish tense; preserve the POS fallback.
      if (w === "every" && /^(?:day|week|month|year|morning|night|evening)$/.test(lower(i + 1))) habitual = true;
      if (w === "yesterday" && !PREPOSITIONS.includes(lower(i - 1)) && !/^["“]$/.test(lower(i - 1))) return "past";
      if (w === "last" && /^(?:night|week|month|year)$/.test(lower(i + 1)) && !PREPOSITIONS.includes(lower(i - 1))) return "past";
    }
  }
  return agreementPast && !habitual ? "past" : undefined;
}

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

// All personal/object/reflexive pronouns (used as a function-word
// indicator — they're unstressed in connected speech).
const PRONOUNS = [
  ...SUBJECT_PRONOUNS,
  "me", "him", "us", "them",
  "my", "your", "his", "her", "its", "our", "their",
  "myself", "yourself", "himself", "herself", "itself",
  "ourselves", "yourselves", "themselves",
];

// Coordinating + subordinating conjunctions
const CONJUNCTIONS = [
  "and", "but", "or", "nor", "so", "yet",
  "for", "as", "if", "than", "that", "though", "while",
  "because", "since", "unless", "until", "when", "where", "whether",
];

// Wh-words
const WH_WORDS = ["what", "who", "whom", "whose", "where", "when", "why", "how", "which"];

/**
 * Union of all closed-class / function-word categories: determiners,
 * pronouns, prepositions, auxiliaries, modals, conjunctions, wh-words.
 *
 * Used by EnglishG2P to drop primary stress in connected speech — these
 * words typically reduce when not in citation form.
 */
export const FUNCTION_WORDS: Set<string> = new Set([
  ...DETERMINERS,
  ...PRONOUNS,
  ...PREPOSITIONS,
  ...AUX_VERBS,
  ...MODAL_VERBS,
  ...CONJUNCTIONS,
  ...WH_WORDS,
]);

export function isFunctionWord(word: string, pos?: string): boolean {
  if (FUNCTION_WORDS.has(word.toLowerCase())) return true;
  // POS-based fallback for words my list might miss.
  if (pos && /^(DT|IN|CC|PRP|MD|AUX|WP|WDT|WRB|TO|EX)$/.test(pos)) return true;
  return false;
}

// Reduce a function word's IPA to its weak (connected-speech) form by
// centralizing the stressed nucleus — a general phonological rule, not a
// per-word table. In running speech a function word's full vowel
// ("for" /fɔɹ/, "and" /ænd/, "was" /wʌz/) centralizes to schwa
// ("for" /fɝ/, "and" /ənd/, "was" /wəz/).
//
// Two transforms, applied only to a MONOSYLLABIC nucleus (anchored so no
// second vowel exists — this protects diphthongs like /aʊ/ in "how" and
// /eɪ/ in "they", and polysyllables):
//   1. lone lax/low monophthong  æ ʌ ɛ ɔ ʊ  → ə   (and, was, but, would;
//      ɔ before a coda /ɹ/ too, so "for" → /fəɹ/ ≈ /fɚ/). /ɑ/ is NOT
//      reduced — it stays a full back vowel in "on" /ɑn/ and "are" /ɑɹ/,
//      which keep their citation vowel rather than collapsing to /ən/.
//   2. /Cu/ — a single plain-onset consonant + lone /u/ → /Cə/
//      (to → /tə/, do → /də/). The single-consonant constraint and the
//      /j h w/ exclusion keep "you", "who", and longer /Cːu/ prepositions
//      ("through" /θɹu/, "into") at /u/; only the most grammaticalized
//      monosyllables reduce.
// Tense /i/, /ɪ/, and diphthongs are left intact, so he/she/this/I/my/
// how/no/they keep their vowel. "a" (/eɪ/) is the one suppletive weak
// form the rule can't derive and is left at citation rather than listed.
const WEAK_MONO_RE = /^([^aeiouɑæɛɪɔʊʌəɝ]*)[æʌɛɔʊ]([^aeiouɑæɛɪɔʊʌəɝ]*)$/;
const WEAK_U_RE = /^([^aeiouɑæɛɪɔʊʌəɝjhw])u$/;
const WEAK_NUCLEUS_G = /[aeiouɑæɛɪɔʊʌəɝ]+/g;
export function reduceToWeakForm(ipa: string): string {
  // Only monosyllabic function words take a weak form. Polysyllabic ones
  // (over, after, under, about, into, around) keep their lexical stress
  // and full vowels — destressing "over" → /oʊvɝ/ is wrong. The anchored
  // WEAK_*_RE patterns already require a single nucleus, but the stress
  // strip below would still flatten a polysyllable, so bail out early.
  const nuclei = ipa.match(WEAK_NUCLEUS_G);
  if (!nuclei || nuclei.length > 1) return ipa;
  const s = ipa.replace(/[ˈˌ]/g, "");
  const m = s.replace(WEAK_MONO_RE, "$1ə$2");
  if (m !== s) return m;
  return s.replace(WEAK_U_RE, "$1ə");
}

// --- Interface ---

export interface POSResult {
  word: string;
  pos: string;
  confidence: number;
}

// --- SimplePOSTagger Class ---

export class SimplePOSTagger {
  /**
   * Tag a single word with its most likely POS
   */
  public tagWord(word: string, context?: string[], sentence?: PredictionContext): POSResult {
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

      // Pronoun contractions are auxiliaries, unlike a noun's possessive.
      if (prevWord && CONTRACTED_BE_HAVE.test(prevWord)) {
        return { word, pos: "!V", confidence: 0.8 };
      }

      // Possessive before the word -> noun (Hammond's postulate, Mengistu's overthrow)
      if (prevWord && /['’]s$|s['’]$/.test(prevWord)) {
        return { word, pos: "N", confidence: 0.9 };
      }

      // Attributive adjective before the word -> noun (political intrigue,
      // violent overthrow). Only unambiguous adjective suffixes.
      if (prevWord && prevWord.length > 4 && ATTRIBUTIVE_SUFFIX.test(prevWord)) {
        return { word, pos: "N", confidence: 0.6 };
      }

      // Previous word is determiner -> likely noun (HIGHEST priority for structural patterns).
      // A demonstrative is as often a pronoun subject (these consist of …),
      // so it is not noun evidence.
      if (prevWord && DETERMINERS.includes(prevWord) && !DEMONSTRATIVES.includes(prevWord)) {
        return { word, pos: "N", confidence: 0.95 };
      }

      // Imperative patterns: Please/Don't + word -> likely verb
      if (prevWord && IMPERATIVE_INDICATORS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.9 };
      }

      // Modal + word -> likely verb (can read, will lead, etc.)
      if (prevWord && (MODAL_VERBS.includes(prevWord) || isNegatedBareAuxiliary(prevWord) && !isQuotedPreviousWord(prevWord, sentence))) {
        return { word, pos: "V", confidence: 0.9 };
      }

      if (sentence && !isModalAdverb(lowerWord) && isModalAdverb(prevWord ?? "") && hasModalAdverbFrame(sentence))
        return { word, pos: "V", confidence: 0.8 };

      // Subject pronoun + word -> likely verb (I read, he leads, etc.)
      if (prevWord && SUBJECT_PRONOUNS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.85 };
      }

      // Relative pronoun + word -> verb of the relative clause (a method that
      // uses, those who refuse). A demonstrative "that" is not noun evidence
      // either way, so the relative reading decides.
      if (prevWord && RELATIVE_PRONOUNS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.72 };
      }

      // Pre-verbal adverb + word (he also conducts, never refuse). An -ly
      // adverb is not evidence: it modifies an adjective as often (55%).
      if (prevWord && PREVERBAL_ADVERBS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.7 };
      }

      // Negated verb: not + word (did not read, cannot refuse)
      if (prevWord === "not") {
        return { word, pos: "V", confidence: 0.75 };
      }

      // Infinitive marker: to + word -> likely verb (to read, to present)
      if (prevWord === "to") {
        return { word, pos: "V", confidence: 0.8 };
      }

      // After a form of be/have the word is a participle or a predicate
      // adjective (is present, was content, has read /ɹɛd/), never the bare
      // verb the V reading of a homograph stands for. Measured on the
      // WikipediaHomographData train split: V is right 12% of the time here.
      if (prevWord && (BE_FORMS.includes(prevWord) || HAVE_FORMS.includes(prevWord))) {
        return { word, pos: "!V", confidence: 0.8 };
      }

      // Previous word is another auxiliary (do/did/modal) -> bare verb
      if (prevWord && AUX_VERBS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.8 };
      }

      // Subject position: word + be/have/modal (the record was, the transform is)
      if (nextWord && (BE_FORMS.includes(nextWord) || HAVE_FORMS.includes(nextWord) || MODAL_VERBS.includes(nextWord))) {
        return { word, pos: "N", confidence: 0.65 };
      }

      // Word + determiner/article -> current word likely verb (read the, lead the, etc.)
      if (nextWord && DETERMINERS.includes(nextWord)) {
        return { word, pos: "V", confidence: 0.8 };
      }

      // Previous word is preposition -> likely noun
      if (prevWord && PREPOSITIONS.includes(prevWord)) {
        return { word, pos: "N", confidence: 0.7 };
      }

      // Unambiguous object pronouns supply a verb's object. Reflexives
      // also follow nouns (the organ console itself), so are not evidence.
      if (nextWord && /^(?:me|him|us|them)$/.test(nextWord) && !/^[A-Z]{2,}$/.test(context[1])) {
        return { word, pos: "V", confidence: 0.7 };
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
