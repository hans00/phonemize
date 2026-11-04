import type { PredictionContext, SentenceAnalysis, SentenceTokenEvidence } from "../g2p";
import type { HomographDict, HomographEntry } from "./g2p";
import { BE_FORMS, DETERMINERS, FUNCTION_WORDS, HAVE_FORMS, MODAL_VERBS, PREPOSITIONS, PRONOUNS, SUBJECT_PRONOUNS, isVerbAdverb, quantified, simplePOSTagger } from "./pos-tagger";

type Category = "N" | "PROPN" | "NBAR" | "ADJ" | "ADV" | "PRON" | "DET" | "P" | "TO" | "C" | "CP" | "CC" | "NCOORD" | "VCOORD" | "SCOORD" | "ACOORD" | "M" | "H" | "B" | "D" | "V" | "NP" | "PP" | "VP" | "INF" | "S" | "PUNCT" | "COMMA";
type Form = "none" | "base" | "third" | "past" | "participle" | "progressive" | "finite";
interface Features { category: Category; form: Form; finite: boolean; agreement: number; head: number; case: "subject" | "object" | "both"; objects: number }
export interface SyntaxDerivation { readonly rule: string; readonly children: readonly number[] }
export interface SyntaxNode extends Readonly<Features> {
  readonly id: number;
  readonly start: number;
  readonly end: number;
  readonly alternatives: readonly SyntaxDerivation[];
}
export interface EnglishSentenceAnalysis extends SentenceAnalysis {
  readonly roots: readonly number[];
  readonly forest: readonly SyntaxNode[];
  readonly states: number;
  readonly limitations: readonly string[];
}
interface MutableNode extends Features { id: number; start: number; end: number; alternatives: SyntaxDerivation[] }

export function tagEnglishWord(
  word: string, context: { prev?: string; next?: string; sentence?: PredictionContext } | undefined,
  homographs: HomographDict,
  matchPos: (entry: HomographEntry, pos: string) => boolean,
  reVerbReading: (word: string) => string | undefined,
): { pos: string; confidence: number } {
  const lowerWord = word.toLowerCase(), sentence = context?.sentence, index = sentence?.index ?? -1;
  const result = simplePOSTagger.tagWord(word, [context?.prev ?? "", context?.next ?? ""], sentence,
    homographs[lowerWord]?.some(entry => !!entry.forms?.length || entry.pos.split(",").includes("N")) ?? false,
    homographs[lowerWord]?.some(entry => matchPos(entry, "V") && matchPos(entry, "ADJ")) ?? false,
    homographs[lowerWord]?.some(entry => matchPos(entry, "ADJ")) ?? false);
  if (result.pos === "!V" && sentence && /s$/.test(lowerWord) && sentence.words[index]?.toLowerCase() === lowerWord) {
    const evidence = sentenceVerbEvidence(sentence.words, index, lowerWord, (target, targetIndex, useHomographs, words) => {
      const lower = target.toLowerCase(), noun = useHomographs && homographs[lower]?.some(entry => !!entry.forms?.length || entry.pos.split(",").includes("N")) || false;
      const verbAdj = useHomographs && homographs[lower]?.some(entry => matchPos(entry, "V") && matchPos(entry, "ADJ")) || false;
      return simplePOSTagger.tagWord(target, [words[targetIndex - 1] ?? "", words[targetIndex + 1] ?? ""],
        { words, index: targetIndex }, noun, verbAdj,
        useHomographs && homographs[lower]?.some(entry => matchPos(entry, "ADJ")) || false).pos;
    });
    if (evidence === "subject") return result;
    if (evidence === "verb") return { pos: "V", confidence: 0.86 };
  }
  if (result.pos.startsWith("V") && /^[a-z]{2,}ally$/.test(lowerWord) && reVerbReading(context?.next?.toLowerCase() ?? "")) return { pos: "ADV", confidence: 0.8 };
  if (result.pos === "!V" && index > 0 && !BE_FORMS.includes(context?.next?.toLowerCase() ?? "") && reVerbReading(lowerWord)) return { pos: "V", confidence: 0.75 };
  if (result.pos.startsWith("V") && context?.prev?.toLowerCase() === "that" && sentence && !context.next &&
    homographs[lowerWord]?.some(({ pos }) => pos === "N" || pos.startsWith("!")) && index >= 2 &&
    simplePOSTagger.tagWord(sentence.words[index - 2], [sentence.words[index - 3] ?? "", sentence.words[index - 1] ?? ""],
      { ...sentence, index: index - 2 }).pos.startsWith("V")) return { pos: "N", confidence: 0.8 };
  return { pos: result.pos, confidence: result.confidence };
}

/** POS evidence for a sentence-final candidate that ends in written s. */
export function sentenceVerbEvidence(
  rawWords: readonly string[], rawTargetIndex: number, target: string,
  tagWord: (word: string, index: number, useHomographs: boolean, words: readonly string[]) => string,
): "subject" | "verb" | undefined {
  const words = rawWords.filter(token => !/^[.,;:!?]+$/.test(token));
  const targetIndex = rawWords.slice(0, rawTargetIndex).filter(token => !/^[.,;:!?]+$/.test(token)).length;
  if (words[targetIndex]?.toLowerCase() !== target) return undefined;
  const analysis = analyzeEnglishSentence(words);
  const subjectOfLaterClause = analysis.status === "parsed" && analysis.roots.some(rootId => {
    const root = analysis.forest[rootId];
    if (!root || root.category !== "S" || root.start !== 0 || root.end !== analysis.words.length || root.head <= targetIndex) return false;
    const laterPos = tagWord(words[root.head] ?? "", root.head, false, words);
    if (["N", "PROPN", "PRON", "DET", "ADJ", "ADV"].includes(laterPos)) return false;
    return root.alternatives.some(derivation => analysis.forest[derivation.children[0]]?.head === targetIndex);
  });
  if (subjectOfLaterClause) return "subject";
  const supportedPredicate = analysis.status === "parsed" && analysis.roots.some(rootId => {
    const root = analysis.forest[rootId];
    if (!root || root.category !== "S" || root.start !== 0 || root.end !== analysis.words.length ||
        root.head !== targetIndex || root.form !== "third" || !root.finite) return false;
    return root.alternatives.some(derivation => {
      const subject = analysis.forest[derivation.children[0]];
      if (!subject || subject.category !== "NP") return false;
      const subjectPos = tagWord(words[subject.head] ?? "", subject.head, true, words);
      return subjectPos === "N" || subjectPos === "PROPN" || subjectPos === "PRON";
    });
  });
  return supportedPredicate ? "verb" : undefined;
}

// Agreement bits: 1sg, 2sg, 3sg, 1pl, 2pl, 3pl. Unknown retains every value.
const ANY = 63, THIRD_SINGULAR = 4, PLURAL = 56;
const grammaticalTag = (category: Category): string => category === "M" || category === "H" || category === "B" || category === "D" ? "AUX" : category === "P" ? "ADP" : category === "TO" ? "PART" : category === "CC" ? "CCONJ" : category === "COMMA" ? "PUNCT" : category;

/** Bounded feature chart. Open-class categories are hypotheses, never adopted POS tags. */
export function analyzeEnglishSentence(words: readonly string[], options: { maxStates?: number } = {}): EnglishSentenceAnalysis {
  const maxStates = options.maxStates ?? 4096;
  if (!Number.isSafeInteger(maxStates) || maxStates < 1) throw new RangeError("maxStates must be a positive safe integer");
  const nodes: MutableNode[] = [], keys = new Map<string, number>(), chart = new Map<string, number[]>();
  const bases: SentenceTokenEvidence["basis"][] = words.map(() => "unsupported");
  const lexical: number[][] = words.map(() => []);
  let states = 0, truncated = words.length > 64;
  const at = (a: number, b: number): number[] => chart.get(a + ":" + b) ?? [];
  function add(a: number, b: number, features: Features, rule: string, children: readonly number[]): void {
    if (truncated) return;
    if (++states > maxStates) { truncated = true; return; }
    const key = [a, b, features.category, features.form, features.finite, features.agreement, features.head, features.case, features.objects].join(":");
    const old = keys.get(key);
    if (old !== undefined) {
      if (!nodes[old].alternatives.some(d => d.rule === rule && d.children.join(",") === children.join(","))) nodes[old].alternatives.push({ rule, children: [...children] });
      return;
    }
    const node: MutableNode = { ...features, id: nodes.length, start: a, end: b, alternatives: [{ rule, children: [...children] }] };
    keys.set(key, node.id); nodes.push(node);
    const bucket = at(a, b); if (!bucket.length) chart.set(a + ":" + b, bucket); bucket.push(node.id);
    if (features.category === "N" || features.category === "PROPN") add(a, b, { ...features, category: "NBAR" }, "nominal-head", [node.id]);
    if (features.category === "NBAR" || features.category === "PRON") add(a, b, { ...features, category: "NP" }, "nominal-phrase", [node.id]);
    if (features.category === "V") add(a, b, { ...features, category: "VP" }, "verb-phrase", [node.id]);
  }
  for (let i = 0; i < words.length && !truncated; i++) {
    const word = words[i].toLowerCase();
    const emit = (category: Category, form: Form = "none", agreement = ANY, grammaticalCase: Features["case"] = "both", finite = form === "third" || form === "past" || form === "finite") => {
      const before = nodes.length;
      add(i, i + 1, { category, form, finite, agreement, head: i, case: grammaticalCase, objects: 0 }, "lexical:" + grammaticalTag(category), []);
      for (let id = before; id < nodes.length; id++) if (nodes[id].alternatives[0]?.children.length === 0) lexical[i].push(id);
    };
    if (word === ",") { bases[i] = "closed-class"; emit("COMMA"); continue; }
    if (/^[.!?]+$/.test(word)) { bases[i] = "closed-class"; emit("PUNCT"); continue; }
    if (!/^[a-z]+(?:['’][a-z]+)?$/.test(word)) continue;
    const quantifier = quantified(word), closedQuantifier = quantifier && !/^(?:other|certain|such)$/.test(word);
    bases[i] = FUNCTION_WORDS.has(word) || closedQuantifier ? "closed-class" : "shape";
    if (DETERMINERS.includes(word) || quantifier || /['’]s$/.test(word)) emit("DET", "none", /^(?:a|an|this|that)$/.test(word) ? THIRD_SINGULAR : /^(?:these|those|both|many|several|few)$/.test(word) ? PLURAL : ANY);
    if (closedQuantifier) emit("PRON", "none", /^(?:both|many|several|few)$/.test(word) ? PLURAL : ANY);
    if (PRONOUNS.includes(word) && !/^(?:my|your|his|its|our|their)$/.test(word)) {
      const agreement = word === "i" ? 1 : word === "we" || word === "us" ? 8 : word === "they" || word === "them" ? 32 : word === "you" ? 18 : THIRD_SINGULAR;
      emit("PRON", "none", agreement, SUBJECT_PRONOUNS.includes(word) && word !== "you" ? "subject" : /^(?:me|him|her|us|them)$/.test(word) ? "object" : "both");
    }
    if (PREPOSITIONS.includes(word)) emit("P");
    if (word === "to") emit("TO");
    if (word === "that") emit("C");
    if (/^(?:and|or|but)$/.test(word)) emit("CC");
    if (MODAL_VERBS.includes(word)) emit("M", "finite");
    if (HAVE_FORMS.includes(word)) {
      emit("H", word === "has" ? "third" : word === "had" ? "past" : word === "having" ? "progressive" : "base", word === "has" ? THIRD_SINGULAR : word === "have" ? ANY & ~THIRD_SINGULAR : ANY, "both", word !== "having");
      if (word === "have") emit("H", "base");
      if (word === "had") emit("H", "participle");
    }
    if (BE_FORMS.includes(word)) emit("B", word === "been" ? "participle" : word === "being" ? "progressive" : word === "be" ? "base" : "finite", word === "is" ? THIRD_SINGULAR : word === "am" ? 1 : word === "was" ? 5 : word === "are" || word === "were" ? 58 : ANY);
    if (/^(?:do|does|did)$/.test(word)) {
      emit("D", word === "does" ? "third" : word === "did" ? "past" : "base", word === "does" ? THIRD_SINGULAR : word === "do" ? ANY & ~THIRD_SINGULAR : ANY, "both", true);
      if (word === "do") emit("D", "base");
    }
    if (isVerbAdverb(word) || /ly$/.test(word)) emit("ADV");
    if (!FUNCTION_WORDS.has(word) && !closedQuantifier) {
      emit("N", "none", /[^s]s$/.test(word) && !/(?:us|is)$/.test(word) ? PLURAL : ANY);
      // Capitalization licenses a name hypothesis, not a vouched name or number.
      if (i > 0 && /^[A-Z]/.test(words[i])) emit("PROPN");
      if (!/['’]s$/.test(word)) {
        emit("ADJ");
        if (/ing$/.test(word)) emit("V", "progressive");
        else if (/ed$/.test(word)) { emit("V", "past"); emit("V", "participle"); }
        else if (/[^s]s$/.test(word)) emit("V", "third", THIRD_SINGULAR);
        else {
          emit("V", "base", ANY & ~THIRD_SINGULAR, "both", true); emit("V", "base");
          // Unknown stems may have irregular past/participle forms; this is not lexical attestation.
          emit("V", "past"); emit("V", "participle");
        }
      }
    }
  }
  function combine(left: MutableNode, right: MutableNode): void {
    const a = left.category, b = right.category;
    const join = (features: Features, rule: string) => add(left.start, right.end, features, rule, [left.id, right.id]);
    if (a === "COMMA" && b === "CC" && words[right.head].toLowerCase() !== "but") join(right, "serial-comma");
    const serial = a === "COMMA" && words.slice(right.start, right.end).some(word => /^(?:and|or)$/i.test(word));
    if (serial && b === "NP") join({ ...right, category: "NCOORD", agreement: PLURAL }, "nominal-comma");
    if (serial && b === "VP") join({ ...right, category: "VCOORD" }, "verbal-comma");
    if (serial && b === "ADJ") join({ ...right, category: "ACOORD" }, "adjectival-comma");
    if (a === "CC") {
      if (b === "NP" && words[left.head].toLowerCase() !== "but") join({ ...right, category: "NCOORD", agreement: words[left.head].toLowerCase() === "and" ? PLURAL : right.agreement }, "nominal-conjunct");
      if (b === "VP") join({ ...right, category: "VCOORD" }, "verbal-conjunct");
      if (b === "S") join({ ...right, category: "SCOORD" }, "clausal-conjunct");
      if (b === "ADJ") join({ ...right, category: "ACOORD" }, "adjectival-conjunct");
    }
    if (a === "NP" && b === "NCOORD" && (left.case === right.case || left.case === "both" || right.case === "both"))
      join({ ...right, category: "NP", case: left.case === "both" ? right.case : left.case }, "nominal-coordination");
    if (a === "VP" && b === "VCOORD" && left.finite === right.finite && (left.finite || left.form === right.form) && (left.agreement & right.agreement))
      join({ ...left, agreement: left.agreement & right.agreement, objects: Math.max(left.objects, right.objects) }, "verbal-coordination");
    if (a === "S" && b === "SCOORD") join(left, "clausal-coordination");
    if (a === "ADJ" && b === "ACOORD") join(left, "adjectival-coordination");
    if ((a === "N" || a === "ADJ") && b === "NBAR") join({ ...right, category: "NBAR" }, "nominal-modifier");
    if (a === "NBAR" && b === "PROPN") join(left, "name-apposition");
    if (a === "NBAR" && b === "VP" && right.form === "participle" && !right.finite) join(left, "reduced-relative");
    if (a === "DET" && b === "NBAR" && (left.agreement & right.agreement)) join({ ...right, category: "NP", agreement: left.agreement & right.agreement }, "determined-noun");
    if (a === "P" && b === "NP" && right.case !== "subject") join({ ...right, category: "PP" }, "prepositional-phrase");
    if ((a === "NP" || a === "VP") && b === "PP") join(left, "prepositional-attachment");
    if (a === "VP" && b === "NP" && right.case !== "subject" && left.objects < 2) join({ ...left, objects: left.objects + 1 }, "object");
    if (a === "TO" && b === "VP" && right.form === "base" && !right.finite) join({ ...right, category: "INF" }, "to-infinitive");
    if (a === "VP" && b === "INF") join(left, "infinitival-complement");
    if (a === "C" && b === "S") join({ ...right, category: "CP" }, "finite-complementizer");
    if (a === "VP" && b === "CP") join(left, "finite-clause-complement");
    if (a === "ADV" && b === "VP") join(right, "preverbal-adverb");
    if (a === "ADV" && b === "ADJ") join(right, "adjective-modifier");
    if (a === "VP" && b === "ADV") join(left, "postverbal-adverb");
    if (a === "M" && b === "VP" && right.form === "base" && !right.finite) join({ ...right, form: "finite", finite: true, agreement: left.agreement }, "modal-base");
    if ((a === "H" && b === "VP" && right.form === "participle") || (a === "B" && b === "VP" && (right.form === "participle" || right.form === "progressive")) || (a === "D" && b === "VP" && right.form === "base" && !right.finite))
      join({ ...right, form: left.form, finite: left.finite, agreement: left.agreement }, a === "H" ? "perfect-participle" : a === "B" ? "be-participle" : "do-base");
    if (a === "B" && b === "ADJ") join({ ...right, category: "VP", form: left.form, finite: left.finite, agreement: left.agreement }, "copular-adjective");
    if (a === "B" && (b === "INF" || b === "PP")) join({ ...right, category: "VP", form: left.form, finite: left.finite, agreement: left.agreement }, b === "INF" ? "copular-infinitive" : "copular-preposition");
    // shortcut: unknown valency permits hypotheses; restrict when existing grammar evidence licenses a complement class.
    if (a === "VP" && b === "VP" && right.form === "base" && !right.finite) join(left, "unverified-bare-complement");
    if (a === "NP" && b === "VP" && right.finite && left.case !== "object" && (left.agreement & right.agreement))
      join({ ...right, category: "S", agreement: left.agreement & right.agreement }, "subject-predicate");
    if (right.end === words.length && b === "PUNCT") {
      if (a === "S") join(left, "sentence-punctuation");
      if (a === "NP") join(left, "fragment-punctuation");
    }
  }
  for (let length = 2; length <= words.length && !truncated; length++) {
    for (let a = 0; a + length <= words.length && !truncated; a++) {
      const b = a + length;
      for (let split = a + 1; split < b && !truncated; split++) {
        for (const left of at(a, split)) {
          for (const right of at(split, b)) { combine(nodes[left], nodes[right]); if (truncated) break; }
          if (truncated) break;
        }
      }
    }
  }
  const roots = at(0, words.length).filter(id => nodes[id].category === "S" || nodes[id].category === "NP"), reachable = new Set<number>();
  const visit = (id: number) => { if (reachable.has(id)) return; reachable.add(id); for (const d of nodes[id].alternatives) for (const child of d.children) visit(child); };
  if (!truncated) roots.forEach(visit);
  const tokens = words.map((_, i): SentenceTokenEvidence => {
    const ids = roots.length && !truncated ? lexical[i].filter(id => reachable.has(id)) : lexical[i];
    return Object.freeze({ basis: bases[i], tags: Object.freeze(Array.from(new Set(ids.map(id => grammaticalTag(nodes[id].category))))),
      verbForms: Object.freeze(Array.from(new Set(ids.filter(id => nodes[id].category === "V").map(id => nodes[id].form)))) });
  });
  const forest = nodes.map(n => Object.freeze({ ...n, alternatives: Object.freeze(n.alternatives.map(d => Object.freeze({ ...d, children: Object.freeze([...d.children]) }))) }));
  const limitations = ["Open-class POS, irregular forms and verb valency are hypotheses; this is not a complete English grammar."];
  if (tokens.some(t => t.basis === "unsupported")) limitations.push("Some tokens have no implemented lexical analysis.");
  if (truncated) limitations.push("Search is truncated; no uniqueness or complete-consensus claim is valid.");
  return Object.freeze({ mode: "shadow", processorId: "en-g2p", words: Object.freeze([...words]), status: truncated ? "truncated" : roots.length ? "parsed" : "unparsed",
    tokens: Object.freeze(tokens), roots: Object.freeze(roots), forest: Object.freeze(forest), states, limitations: Object.freeze(limitations) });
}
