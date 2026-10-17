// Simple rule-based POS tagger for homograph disambiguation
import type { PredictionContext, VerbForm } from "../g2p";
import { isCardinalToken } from "./expand";

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

const ATTRIBUTIVE_SUFFIX = /(ical|ial|ous|ful|less|ible|able|ular|ic|al|m[ai]nent)$/;
const RELATIVE_PRONOUNS = ["that", "which", "who"];
const PREVERBAL_ADVERBS = ["also", "often", "never", "always", "usually", "still", "sometimes", "rarely", "seldom", "then", "now"];
const DEMONSTRATIVES = ["this", "that", "these", "those"];
const BE_FORMS = ["am", "is", "are", "was", "were", "be", "being", "been"];
const HAVE_FORMS = ["have", "has", "had", "having"];
const CONTRACTED_BE_HAVE = /^(?:(?:he|she|it|that|there|what|who)['‘’]s|i['‘’]m|(?:you|we|they)['‘’]re)$/;

function isNegatedBareAuxiliary(word: string): boolean {
  return word === "cannot" || /^(?:ca|wo|sha|would|should|could|may|might|must|need|dare|ought|do|does|did)n['‘’]t$/.test(word);
}

const OPEN_DELIMITER = /^["“«\[({]$/;
const CLOSE_DELIMITER = /^["”»\])}]$/;
export function precedingContextIndex({ words, index }: PredictionContext): number {
  let previous = OPEN_DELIMITER.test(words[index - 1] ?? "") && CLOSE_DELIMITER.test(words[index + 1] ?? "") ? index - 2 : index - 1;
  while (previous > 0 && index - previous <= 8 && /^[-‐‑]$/.test(words[previous] ?? "") && words[previous - 1]?.toLowerCase() === "re") previous -= 2;
  return previous;
}
function isQuotedPreviousWord(word: string, sentence?: PredictionContext): boolean {
  if (!sentence) return false;
  const index = precedingContextIndex(sentence);
  return CLOSE_DELIMITER.test(sentence.words[index] ?? "") &&
    sentence.words[index - 1]?.toLowerCase() === word && OPEN_DELIMITER.test(sentence.words[index - 2] ?? "");
}

function isVerbAdverb(word: string): boolean {
  return word === "not" || word === "just" || word === "already" || word === "well" || word === "much" || PREVERBAL_ADVERBS.includes(word) || /ly$/.test(word);
}
function isModalAdverb(word: string): boolean {
  return isVerbAdverb(word) || word === "rather" || word === "later";
}
function hasModalAdverbFrame({ words, index }: PredictionContext): boolean {
  const lower = (i: number) => (words[i] ?? "").toLowerCase().replace(/[‘’]/g, "'");
  let previous = precedingContextIndex({ words, index });
  if (!isModalAdverb(lower(previous))) return false;
  while (previous >= 0 && isModalAdverb(lower(previous))) previous--;
  const inverted = SUBJECT_PRONOUNS.includes(lower(previous));
  if (inverted) {
    previous--;
    // Extended preference/time adverbs before a subject may open a mandative clause.
    while (previous >= 0 && isVerbAdverb(lower(previous))) previous--;
  }
  const before = lower(previous - 1), object = lower(index + 1);
  // Lexically ambiguous modals need positive subject/object evidence, unlike noun free will.
  const finite = inverted || SUBJECT_PRONOUNS.includes(before) ||
    /[^s]s$/.test(before) && !FUNCTION_WORDS.has(before) || DETERMINERS.includes(object) ||
    /['’]s$/.test(object) || /[^s]s$/.test(object) && !FUNCTION_WORDS.has(object) ||
    lower(index + 2) === "to" && /^[a-z]{3,}$/.test(object) && !FUNCTION_WORDS.has(object);
  return (/^(?:would|should|could|shall)$/.test(lower(previous)) || MODAL_VERBS.includes(lower(previous)) && finite || isNegatedBareAuxiliary(lower(previous))) &&
    !DETERMINERS.includes(lower(previous - 1)) && !PREPOSITIONS.includes(lower(previous - 1)) && !/['’]s$|s['’]$/.test(lower(previous - 1));
}

// A nominal subject can end a subordinate clause without a following object.
function hasSubordinateFiniteSubject({ words, index }: PredictionContext): boolean {
  const lower = (i: number) => (words[i] ?? "").toLowerCase();
  if (lower(index + 1) !== "," || !/^[a-z]{3,}$/.test(lower(index)) || /[^s]s$|(?:ed|ing)$/.test(lower(index)) || FUNCTION_WORDS.has(lower(index))) return false;
  let subject = index - 1;
  while (subject >= Math.max(0, index - 4) && isVerbAdverb(lower(subject))) subject--;
  // A nominal of/with/in modifier follows its subject head.
  if ((DETERMINERS.includes(lower(subject - 1)) || /^(?:some|any|both|many|several|all|other)$/.test(lower(subject - 1))) && PREPOSITIONS.includes(lower(subject - 2))) subject -= 3;
  if ((!/[^s]s$/.test(lower(subject)) || /(?:us|is)$/.test(lower(subject))) && !NOUN_ENDINGS.some(ending => lower(subject).endsWith(ending)) || FUNCTION_WORDS.has(lower(subject))) return false;
  let marker = subject - 1;
  if (DETERMINERS.includes(lower(marker))) marker--;
  if (/^(?:whichever|whatever)$/.test(lower(marker - 1)) && /^[a-z]{3,}$/.test(lower(marker))) marker--;
  if (!/^(?:when|because|although|while|if|after|before|since|until|once|as|though|unless|whichever|whatever)$/.test(lower(marker))) return false;
  return lower(marker) !== "as" || marker === 0 || /^[,;:.!?]$/.test(lower(marker - 1)) || /^(?:and|or|but)$/.test(lower(marker - 1));
}

/** Bounded subject/object syntax; no target-word or pronunciation lexicon. */
export function hasFiniteObjectFrame({ words, index }: PredictionContext): boolean {
  const lower = (i: number) => (words[i] ?? "").toLowerCase();
  const plural = (w: string) => /[^s]s$/.test(w) && !/(?:us|is)$/.test(w);
  const target = lower(index);
  let subjectIndex = index - 1;
  if ((/e$/.test(target) || plural(target)) && lower(subjectIndex) === ",") {
    let opening = subjectIndex - 1;
    while (opening >= Math.max(0, subjectIndex - 20) && lower(opening) !== "," && !/^[;:.!?]$/.test(lower(opening))) opening--;
    if (lower(opening) === ",") subjectIndex = opening - 1;
  }
  let labelHead = subjectIndex;
  while (labelHead >= 0 && subjectIndex - labelHead < 4 && isCardinalToken(lower(labelHead))) labelHead--;
  if (labelHead < subjectIndex && !isCardinalToken(lower(labelHead)) && /^[a-z]{3,}$/.test(lower(labelHead)) && !FUNCTION_WORDS.has(lower(labelHead))) subjectIndex = labelHead;
  // A determined subject retains its head across a bounded of-phrase.
  let modifierStart = subjectIndex - 1;
  while (modifierStart >= Math.max(0, subjectIndex - 4) && (ATTRIBUTIVE_SUFFIX.test(lower(modifierStart)) || /^[A-Z][a-z]+$/.test(words[modifierStart] ?? "") && !FUNCTION_WORDS.has(lower(modifierStart)))) modifierStart--;
  if (plural(target) && DETERMINERS.includes(lower(modifierStart)) && lower(modifierStart - 1) === "of" &&
      !plural(lower(modifierStart - 2)) && DETERMINERS.includes(lower(modifierStart - 3)) &&
      (modifierStart === 3 || /^[,;:.!?]$/.test(lower(modifierStart - 4)) || CONJUNCTIONS.includes(lower(modifierStart - 4)))) subjectIndex = modifierStart - 2;
  const subject = lower(subjectIndex);
  const barePluralPredicate = words[index] === target && plural(subject) && !plural(target) && !/(?:ed|ing)$/.test(target);
  let objectIndex = index + 1;
  while (objectIndex < index + 4 && isVerbAdverb(lower(objectIndex))) objectIndex++;
  if (/^['‘"“]$/.test(lower(objectIndex))) objectIndex++;
  const object = lower(objectIndex);
  const cardinalObject = isCardinalToken(object);
  const quantified = (word: string) => /^(?:some|any|both|many|several|all|other|certain|few)$/.test(word);
  const quantifiedObject = quantified(object);
  let headIndex = objectIndex + 1;
  if (lower(headIndex) === "(") {
    let depth = 0, end = Math.min(words.length, headIndex + 12);
    do {
      const token = lower(headIndex++);
      if (token === "(") depth++;
      if (token === ")") depth--;
    } while (depth > 0 && headIndex < end);
    if (depth) return false;
  }
  const compoundObject = lower(headIndex) === "-";
  while (lower(headIndex) === "-" && /^[a-z]+$/.test(lower(headIndex + 1)) && headIndex < objectIndex + 7) headIndex += 2;
  while (ATTRIBUTIVE_SUFFIX.test(lower(headIndex)) && headIndex < objectIndex + 7) headIndex++;
  const head = lower(headIndex);
  const bareObject = (plural(object) || /(?:logy|graphy)$/.test(object) || NOUN_ENDINGS.some(ending => object.endsWith(ending))) && !FUNCTION_WORDS.has(object) && PREPOSITIONS.includes(head);
  if (!/^[a-z]+$/.test(target) || !(plural(target) || /e$/.test(target) && plural(subject) || barePluralPredicate && (quantifiedObject || cardinalObject || bareObject || /[a-z]{3,}ing$/.test(object))) || FUNCTION_WORDS.has(target) ||
      !/^[a-z]{3,}$/.test(subject) || FUNCTION_WORDS.has(subject)) return false;
  let determiner = subjectIndex - 1;
  while (determiner > subjectIndex - 4 && determiner >= 0 &&
      (ATTRIBUTIVE_SUFFIX.test(lower(determiner)) || /(?:ary|ory)$/.test(lower(determiner)) ||
       /e$/.test(target) && subjectIndex !== index - 1 && NOUN_ENDINGS.some(ending => lower(determiner).endsWith(ending)) ||
       /^[A-Z][a-z]+$/.test(words[determiner] ?? "") && !FUNCTION_WORDS.has(lower(determiner)) &&
         (plural(target) || subjectIndex !== index - 1))) determiner--;
  const clauseStart = determiner === 0 || /^[,;:.!?]$/.test(lower(determiner - 1)) || CONJUNCTIONS.includes(lower(determiner - 1));
  const determinedSubject = DETERMINERS.includes(lower(determiner)) && clauseStart;
  const properSubject = /^(?:[A-Z][a-z]+|[A-Z]{2,})$/.test(words[subjectIndex] ?? "") &&
    (subjectIndex === 0 || /^[,;:.!?]$/.test(lower(subjectIndex - 1)) || /^(?:and|or|but)$/.test(lower(subjectIndex - 1)));
  const bareSubject = plural(subject) && (subjectIndex === 0 || subjectIndex === 1 && /^(?:[A-Z][a-z]+|[A-Z]{2,})$/.test(words[0]) && !FUNCTION_WORDS.has(lower(0)) && !quantified(lower(0)) && (ATTRIBUTIVE_SUFFIX.test(lower(0)) || NOUN_ENDINGS.some(ending => lower(0).endsWith(ending))));
  const subjectFrame = determinedSubject ||
    /e$/.test(target) && plural(subject) && subjectIndex !== index - 1 && determiner === -1 || properSubject;
  const nominal = /(?:tion|sion|ment|ness|ity|ism|ogy|ing|ics)$/.test(subject);
  // Another finite predicate makes this a noun phrase; explicit subclauses are separate.
  let infinitiveObject = false;
  for (let i = bareObject ? objectIndex + 1 : headIndex; i < Math.min(words.length, headIndex + 12); i++) {
    const w = lower(i);
    if (w === "to" && i > objectIndex && (i > objectIndex + 1 || !/(?:ed|ing)$/.test(object)) && i <= objectIndex + 5 && /^[a-z]{3,}$/.test(lower(i + 1)) && !FUNCTION_WORDS.has(lower(i + 1)) &&
        words.slice(objectIndex, i).every(word => /^[a-z]{3,}$/i.test(word) && !FUNCTION_WORDS.has(word.toLowerCase()))) infinitiveObject = true;
    if (/^[,;:.!?()"“”]$/.test(w) || CONJUNCTIONS.includes(w) || /^(?:to|who(?:m|se)?|which|where|when)$/.test(w)) break;
    if (BE_FORMS.includes(w) || HAVE_FORMS.includes(w)) return false;
  }
  const adjective = (determinedSubject || compoundObject && subjectFrame && plural(target) !== plural(subject)) && (compoundObject || /[a-z]{3}ed$/.test(object)) || ATTRIBUTIVE_SUFFIX.test(object) || /(?:ive|ary|ory|ior)$/.test(object) || /[^e]er$/.test(object);
  const noun = !FUNCTION_WORDS.has(head) && (plural(head) || /[a-z]{3,}ing$/.test(head) || NOUN_ENDINGS.some(ending => head.endsWith(ending)));
  let afterPronoun = objectIndex + 1;
  while (afterPronoun < objectIndex + 4 && (isVerbAdverb(lower(afterPronoun)) || /^(?:here|there)$/.test(lower(afterPronoun)))) afterPronoun++;
  const closedPronounObject = object === "it" && (afterPronoun === words.length || /^[,;:.!?]$/.test(lower(afterPronoun)) || PREPOSITIONS.includes(lower(afterPronoun)));

  return words[index] === target && infinitiveObject && (subjectFrame || bareSubject) && plural(target) !== plural(subject) ||
    barePluralPredicate && (quantifiedObject || subjectFrame && /[a-z]{3,}ing$/.test(object) || determinedSubject && cardinalObject) ||
    ((quantifiedObject || cardinalObject) && determinedSubject || cardinalObject && subjectFrame && noun || words[index] === target && quantifiedObject && properSubject && ATTRIBUTIVE_SUFFIX.test(lower(objectIndex + 1))) && plural(target) && !plural(subject) ||
    words[index] === target && plural(target) && !plural(subject) && properSubject && closedPronounObject ||
    words[index] === target && plural(target) && !plural(subject) && subjectFrame && /^[A-Z][a-z]{2,}$/.test(words[objectIndex] ?? "") && !FUNCTION_WORDS.has(object) ||
    bareObject && (subjectFrame || nominal) || adjective && noun && subjectFrame ||
    plural(target) && !plural(subject) && plural(object) && !FUNCTION_WORDS.has(object) && subjectFrame;
}

/** Written re- prefixes do not separate an infinitive from its governing to. */
function hasPrefixedInfinitive({ words, index }: PredictionContext): boolean {
  const lower = (i: number) => (words[i] ?? "").toLowerCase();
  const target = lower(index);
  if (!/^[a-z]+$/.test(target) || /(?:ed|ing)$/.test(target) ||
      /[^s]s$/.test(target) && !/(?:us|is)$/.test(target) || lower(index + 1) === "of") return false;
  const before = precedingContextIndex({ words, index });
  return /^[-‐‑]$/.test(lower(index - 1)) && before < index - 1 && lower(before) === "to";
}

function hasCoordinatedPast(context: PredictionContext): boolean {
  const { words, index } = context;
  const lower = (i: number) => (words[i] ?? "").toLowerCase().replace(/[‘’]/g, "'");
  let previous = precedingContextIndex(context);
  while (previous >= 0 && isVerbAdverb(lower(previous))) previous--;
  // Shared-subject coordination inherits an explicit finite regular past, not an infinitive or a new clause.
  if (lower(previous) === "and" && lower(index - 1) !== "now" && !/(?:ing|ed|[^s]s)$/.test(lower(index)) &&
      (DETERMINERS.includes(lower(index + 1)) && !DEMONSTRATIVES.includes(lower(index + 1)) ||
       /^[A-Z][a-z]+$/.test(words[index + 1] ?? "") && PREPOSITIONS.includes(lower(index + 2)))) {
    let end = previous - 1;
    if (lower(end) === ",") end--;
    let properObject = true;
    for (let i = end; i >= Math.max(0, end - 24); i--) {
      const w = lower(i), subject = i - 1;
      if (properObject && /^[A-Z][a-z]+$/.test(words[i] ?? "") && !FUNCTION_WORDS.has(w)) continue;
      properObject = false;
      if (/^[a-z]{2,}(?:[^aeioubhlrw]|[aeiouy]r)ed$/.test(w)) {
        const personal = SUBJECT_PRONOUNS.includes(lower(subject));
        const named = /^[A-Z][a-z]+$/.test(words[subject] ?? "") && !FUNCTION_WORDS.has(lower(subject));
        if ((personal || named) && (subject === 0 || /^[,;:.!?]$/.test(lower(subject - 1)))) return true;
        if (subject >= 1 && /^[a-z]{3,}$/.test(lower(subject)) && !FUNCTION_WORDS.has(lower(subject)) &&
            DETERMINERS.includes(lower(subject - 1)) && (subject === 1 || /^[,;:.!?]$/.test(lower(subject - 2)))) return true;
      }
      if (/^[,;:.!?"“”]$/.test(w) || w === "to" || w === "now" || SUBJECT_PRONOUNS.includes(w) ||
          BE_FORMS.includes(w) || HAVE_FORMS.includes(w) || MODAL_VERBS.includes(w) ||
          CONJUNCTIONS.includes(w) && w !== "and" && w !== "or" ||
          /^[A-Z][a-z]+$/.test(words[i] ?? "") && !FUNCTION_WORDS.has(w)) break;
    }
  }
  return false;
}

/** Infer inflection separately from POS; no pronunciation or target-word table. */
export function inferVerbForm({ words, index }: PredictionContext): VerbForm | undefined {
  if (hasPrefixedInfinitive({ words, index })) return "base";
  const lower = (i: number) => (words[i] ?? "").toLowerCase().replace(/[‘’]/g, "'");
  // -only attaches to the base operation, not a passive participle.
  if (lower(index + 1) === "-" && lower(index + 2) === "only") return "base";
  // Hyphenated adverb + participle forms an adjective, unlike read-only.
  if (lower(index - 1) === "-" && isVerbAdverb(lower(index - 2))) return "participle";
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
  if (hasCoordinatedPast({ words, index })) return "past";
  // A quoted nominal followed by a named by-agent supplies a reduced passive.
  if (lower(index + 1) === "by" && CLOSE_DELIMITER.test(lower(previous)) && /^[A-Z][a-z]+$/.test(words[index + 2] ?? "")) return "participle";
  // BE one of the plural-head [adverb] participle by ... is a reduced passive,
  // unlike plural matrix subjects or zero object relatives with their own subject.
  if (lower(index + 1) === "by" && /[^s]s$/.test(subject) && !FUNCTION_WORDS.has(subject) &&
      DETERMINERS.includes(lower(previous - 1)) && lower(previous - 2) === "of" && lower(previous - 3) === "one" &&
      BE_FORMS.includes(lower(previous - 4))) return "participle";
  // Fronted locative adjuncts and object relatives still open finite clauses.
  // Dative addressees after to/for and explicit mandative clauses stay ambiguous.
  let fronted = false;
  if (/^(?:he|she|it)$/.test(subject)) {
    let proper = previous - 1;
    while (proper >= Math.max(0, previous - 4) && /^[A-Z][a-z]+$/.test(words[proper] ?? "") &&
        !PREPOSITIONS.includes(lower(proper)) && !CONJUNCTIONS.includes(lower(proper))) proper--;
    fronted = /^(?:in|at)$/.test(lower(proper)) &&
      (proper === 0 || CONJUNCTIONS.includes(lower(proper - 1)) || /^[,;:.!?]$/.test(lower(proper - 1)));
    if (PREPOSITIONS.includes(lower(index + 1)) || BE_FORMS.includes(lower(index + 1))) {
      for (let i = previous - 1; i >= Math.max(0, previous - 8); i--) {
        const w = lower(i);
        if (w === "whose") { fronted = true; break; }
        if (!/^[a-z]+$/.test(w) || /^(?:and|or|but|that|which|who|if|when)$/.test(w) || /[a-z]{2,}ed$/.test(w)) break;
      }
      if (BE_FORMS.includes(lower(index + 1)) && !FUNCTION_WORDS.has(lower(previous - 1)) && !/[a-z]{2,}ed$/.test(lower(previous - 1)))
        fronted ||= [2, 3, 4].some(distance => DETERMINERS.includes(lower(previous - distance)));
    }
  }
  // A finite third-person singular subject requires past for an uninflected verb.
  const namedSubject = /^[A-Z][a-z]+$/.test(words[previous] ?? "") && !FUNCTION_WORDS.has(subject) && !/s$/.test(subject) &&
    (previous === 0 || /^[,;:.!?]$/.test(lower(previous - 1)));
  const agreementPast = namedSubject || /^(?:he|she|it)$/.test(subject) && (fronted || previous === 0 || /^[,;:"“，；：。！？]$/.test(lower(previous - 1)) ||
      /^(?:where|when|because|although|while|if|after|before|since|until|once|as|though|unless)$/.test(lower(previous - 1)));
  // A clause-initial when adjunct shares an explicit past matrix predicate.
  if (SUBJECT_PRONOUNS.includes(subject) && lower(previous - 1) === "when" &&
      (previous === 1 || /^[,;:.!?]$/.test(lower(previous - 2)) || CONJUNCTIONS.includes(lower(previous - 2)))) {
    let boundary = index + 1;
    while (boundary < Math.min(words.length, index + 24) && !/^[,;:.!?"“”]$/.test(lower(boundary))) boundary++;
    if (lower(boundary) === "," && SUBJECT_PRONOUNS.includes(lower(boundary + 1))) {
      let predicate = boundary + 2;
      while (isVerbAdverb(lower(predicate))) predicate++;
      if (/^(?:kind|sort)$/.test(lower(predicate)) && lower(predicate + 1) === "of") predicate += 2;
      // Conservative past rimes exclude bare -eed/-bed/-led/-red and similar roots.
      if (/^(?:was|were|had|did)$/.test(lower(predicate)) || /^[a-z]{2,}[^aeioubhlrw]ed$/.test(words[predicate] ?? "")) return "past";
    }
  }
  for (const direction of [-1, 1]) {
    // Bound cue lookup so repeated ambiguous tokens cannot make a long
    // sentence quadratic. The complete sentence remains available to callers.
    for (let i = index + direction; i >= 0 && i < words.length && Math.abs(i - index) <= 32; i += direction) {
      const w = lower(i);
      if (/^[,;:.!?，；：。！？]$/.test(w) || /^(?:and|but|or|while|whereas)$/.test(w)) break;
      if (w === "yesterday" && !PREPOSITIONS.includes(lower(i - 1)) && !/^["“]$/.test(lower(i - 1))) return "past";
      if (w === "last" && /^(?:night|week|month|year)$/.test(lower(i + 1)) && !PREPOSITIONS.includes(lower(i - 1))) return "past";
    }
  }
  return agreementPast ? "past" : undefined;
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
  "until",
];

// Imperative indicators
const IMPERATIVE_INDICATORS = ["please", "don't", "do", "doesn't", "never"];

// Modal verbs that indicate following word is likely a verb
const MODAL_VERBS = [
  "shall",
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
  "for", "as", "if", "than", "that", "though", "although", "while",
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

const NEGATIVE_ADJECTIVAL_FORM = /^(?:in|im|il|ir|un|non)[a-z]+(?:id|al|ive|ous|able|ible)$/;

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
      const prevWord = sentence && sentence.words[sentence.index + 1]?.toLowerCase() !== "of" && /^[-‐‑]$/.test(sentence.words[sentence.index - 1] ?? "") && sentence.words[sentence.index - 2]?.toLowerCase() === "re"
        ? sentence.words[precedingContextIndex(sentence)]?.toLowerCase() : context[0]?.toLowerCase();
      const nextWord =
        context.length >= 2 ? context[1]?.toLowerCase() : undefined; // Second element is next word

      if (sentence && sentence.words[sentence.index]?.toLowerCase() === lowerWord && hasPrefixedInfinitive(sentence))
        return { word, pos: "V", confidence: 0.8 };

      // Enhanced detection patterns - highest priority first

      // A by-agent after an -ed form distinguishes a passive from a predicate adjective.
      if (sentence && /ed$/.test(lowerWord) && nextWord === "by") {
        let before = precedingContextIndex(sentence);
        while (before >= 0 && isVerbAdverb(sentence.words[before]?.toLowerCase() ?? "")) before--;
        if (BE_FORMS.includes(sentence.words[before]?.toLowerCase()))
          return { word, pos: "VBN", confidence: 0.9 };
      }


      // Pronoun contractions are auxiliaries, unlike a noun's possessive.
      if (prevWord && CONTRACTED_BE_HAVE.test(prevWord)) {
        return { word, pos: "!V", confidence: 0.8 };
      }

      // Possessive before the word -> noun (Hammond's postulate, Mengistu's overthrow)
      if (prevWord && /['’]s$|s['’]$/.test(prevWord)) {
        return { word, pos: "N", confidence: 0.9 };
      }

      // A determined noun phrase closes before a finite relative clause, not a demonstrative object.
      if (sentence && DETERMINERS.includes(sentence.words[sentence.index - 2]?.toLowerCase() ?? "") &&
          /^[a-z]{3,}$/.test(prevWord ?? "") && !FUNCTION_WORDS.has(prevWord ?? "") &&
          RELATIVE_PRONOUNS.includes(sentence.words[sentence.index + 1]?.toLowerCase() ?? "") &&
          (BE_FORMS.includes(sentence.words[sentence.index + 2]?.toLowerCase() ?? "") || HAVE_FORMS.includes(sentence.words[sentence.index + 2]?.toLowerCase() ?? "") ||
            /^[a-z]{2,}[^e]ed$/.test(sentence.words[sentence.index + 2]?.toLowerCase() ?? "") &&
            (PREPOSITIONS.includes(sentence.words[sentence.index + 3]?.toLowerCase() ?? "") || !sentence.words[sentence.index + 3] || /^[,;:.!?]$/.test(sentence.words[sentence.index + 3])))) return { word, pos: "N", confidence: 0.8 };

      // A copular degree phrase supplies adjective evidence; emphatic the very + noun stays out.
      if (sentence && /^(?:very|too|quite)$/.test(prevWord ?? "")) {
        let before = sentence.index - 2;
        while (before >= Math.max(0, sentence.index - 5) && isVerbAdverb(sentence.words[before]?.toLowerCase() ?? "")) before--;
        if (BE_FORMS.includes(sentence.words[before]?.toLowerCase())) return { word, pos: "ADJ", confidence: 0.85 };
      }

      // A named subject closes an object-relative clause after a determined antecedent.
      if (sentence && /^[a-z]{2,}[^s]s$/.test(lowerWord) &&
          /^[A-Z][a-z]+$/.test(sentence.words[sentence.index - 1] ?? "") &&
          /^(?:which|that|whom)$/.test(sentence.words[sentence.index - 2]?.toLowerCase() ?? "") &&
          /^[a-z]{3,}$/.test(sentence.words[sentence.index - 3]?.toLowerCase() ?? "") &&
          !FUNCTION_WORDS.has(sentence.words[sentence.index - 3]?.toLowerCase()) &&
          DETERMINERS.includes(sentence.words[sentence.index - 4]?.toLowerCase()) &&
          (BE_FORMS.includes(sentence.words[sentence.index + 1]?.toLowerCase()) || /^[,;:.!?]$/.test(sentence.words[sentence.index + 1] ?? "")))
        return { word, pos: "V", confidence: 0.75 };

      // Attributive adjective before the word -> noun (political intrigue,
      // violent overthrow). Only unambiguous adjective suffixes.
      if (prevWord && prevWord.length > 4 && (ATTRIBUTIVE_SUFFIX.test(prevWord) || sentence &&
          /ing$/.test(prevWord) && !/s$/.test(lowerWord) && !DETERMINERS.includes(nextWord ?? "") &&
          DETERMINERS.includes(sentence.words[sentence.index - (OPEN_DELIMITER.test(sentence.words[sentence.index - 2] ?? "") ? 3 : 2)]?.toLowerCase())) &&
          !(sentence && /^[A-Z][a-z]{2,}$/.test(sentence.words[sentence.index + 1] ?? "") &&
            (PREPOSITIONS.includes(sentence.words[sentence.index + 2]?.toLowerCase()) || sentence.words[sentence.index + 2]?.toLowerCase() === "as") && hasFiniteObjectFrame(sentence))) {
        return { word, pos: "N", confidence: 0.6 };
      }

      // Previous word is determiner -> likely noun (HIGHEST priority for structural patterns).
      // A demonstrative is as often a pronoun subject (these consist of …),
      // so it is not noun evidence.
      // A participial modifier inside a closed determined phrase supplies a nominal head; -eed nouns stay out.
      if (sentence && NEGATIVE_ADJECTIVAL_FORM.test(lowerWord) && /^[a-z]{2,}[^e]ed$/.test(prevWord ?? "") &&
          DETERMINERS.includes(sentence.words[sentence.index - 2]?.toLowerCase() ?? "") &&
          (!sentence.words[sentence.index + 1] || /^[,;:.!?]$/.test(sentence.words[sentence.index + 1]))) return { word, pos: "N", confidence: 0.8 };
      // A negative adjectival form modifies an acronym head inside a determined noun phrase.
      if (sentence && DETERMINERS.includes(prevWord ?? "") && NEGATIVE_ADJECTIVAL_FORM.test(lowerWord) &&
          /^[A-Z]{2,}$/.test(sentence.words[sentence.index + 1] ?? "")) return { word, pos: "ADJ", confidence: 0.75 };
      if (prevWord && DETERMINERS.includes(prevWord) && !DEMONSTRATIVES.includes(prevWord)) {
        return { word, pos: "N", confidence: 0.95 };
      }

      // An inflected s form after a preposition cannot be a bare infinitive.
      if (prevWord && PREPOSITIONS.includes(prevWord) && /[^s]s$/.test(lowerWord) &&
          !/(?:us|is)$/.test(lowerWord) && lowerWord.length > 3)
        return { word, pos: "N", confidence: 0.8 };

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

      if (sentence && sentence.words[sentence.index]?.toLowerCase() === lowerWord &&
          (prevWord === "and" || isVerbAdverb(prevWord ?? "")) && hasCoordinatedPast(sentence))
        return { word, pos: "V", confidence: 0.8 };

      // Subject pronoun + word -> likely verb (I read, he leads, etc.)
      if (prevWord && SUBJECT_PRONOUNS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.85 };
      }

      // A prepositional demonstrative phrase closes before another preposition.
      if (sentence && DEMONSTRATIVES.includes(prevWord ?? "") &&
          PREPOSITIONS.includes(sentence.words[sentence.index - 2]?.toLowerCase() ?? "") &&
          PREPOSITIONS.includes(sentence.words[sentence.index + 1]?.toLowerCase() ?? "")) return { word, pos: "N", confidence: 0.85 };

      // Relative pronoun + word -> verb of the relative clause (a method that
      // uses, those who refuse). A demonstrative "that" is not noun evidence
      // either way, so the relative reading decides.
      if (prevWord && RELATIVE_PRONOUNS.includes(prevWord)) {
        return { word, pos: "V", confidence: 0.72 };
      }

      // Pre-verbal adverb + word (he also conducts, never refuse). An -ly
      // adverb is not evidence: it modifies an adjective as often (55%).
      if (prevWord && PREVERBAL_ADVERBS.includes(prevWord) &&
          (!sentence || sentence.words[precedingContextIndex(sentence)] !== "-")) {
        if (sentence) {
          let before = precedingContextIndex(sentence);
          while (before >= 0 && isVerbAdverb(sentence.words[before].toLowerCase())) before--;
          if (BE_FORMS.includes(sentence.words[before]?.toLowerCase()) || DETERMINERS.includes(sentence.words[before]?.toLowerCase())) return { word, pos: "!V", confidence: 0.8 };
        }
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

      // A nominal subject and explicit object phrase supply finite third-person evidence.
      if (sentence && sentence.words[sentence.index]?.toLowerCase() === lowerWord && hasFiniteObjectFrame(sentence))
        return { word, pos: "V", confidence: 0.72 };

      if (sentence && hasSubordinateFiniteSubject(sentence))
        return { word, pos: "V", confidence: 0.75 };

      // A singular nominal subject opens a finite subordinate clause even without an object.
      if (sentence && /[^s]s$/.test(lowerWord) && sentence.words[sentence.index + 1] === "," &&
          NOUN_ENDINGS.some(ending => sentence.words[sentence.index - 1]?.toLowerCase().endsWith(ending)) &&
          /^(?:when|because|although|while|if|after|before|since|until|once|as|though|unless)$/.test(sentence.words[sentence.index - 2]?.toLowerCase() ?? ""))
        return { word, pos: "V", confidence: 0.75 };

      // Subject position: word + be/have/modal (the record was, the transform is)
      if (nextWord && (BE_FORMS.includes(nextWord) || HAVE_FORMS.includes(nextWord) || MODAL_VERBS.includes(nextWord))) {
        return { word, pos: "N", confidence: 0.65 };
      }

      // An article across a clause boundary is not an object; coordinated predicates
      // and ambiguous multiword names retain their existing route.
      // Word + determiner/article -> current word likely verb (read the, lead the, etc.)
      if (nextWord && DETERMINERS.includes(nextWord) &&
          (!sentence || /^(?:and|or|nor)$/.test(prevWord ?? "") ||
            /^[A-Z][a-z]+$/.test(word) && /^[A-Z][a-z]+$/.test(sentence.words[sentence.index - 1] ?? "") && !FUNCTION_WORDS.has(prevWord ?? "") ||
            !/^[,;:.!?]$/.test(sentence.words[sentence.index + 1] ?? "")) &&
          (!/[^s]s$/.test(lowerWord) || !sentence || sentence.words[sentence.index + 1]?.toLowerCase() === nextWord)) {
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
