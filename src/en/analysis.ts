import { inspectIpa, type IpaReport } from "./ipa-plausibility";

export interface WordPart {
  readonly spelling: string;
  /** UTF-16 range in the normalized word, before IPA post-processing. */
  readonly start: number;
  readonly end: number;
  readonly componentIpa: string;
}
/** Legacy decisions are recorded without asserting that a split is linguistically licensed. */
export type WordStructure =
  | { readonly kind: "opaque"; readonly route: string }
  | { readonly kind: "legacy-compound"; readonly left: WordPart; readonly right: WordPart; readonly stressOwner: "left" | "right"; readonly boundary: "unclassified" }
  | { readonly kind: "legacy-decomposition"; readonly parts: readonly WordPart[] };

export interface CompoundCandidate {
  readonly structure: Extract<WordStructure, { kind: "legacy-compound" }>;
  /** Before shared phonotactics, dialect conversion and contextual stress removal. */
  readonly componentIpa: string;
  readonly legacyScore: number;
}
export interface WordAnalysis {
  readonly word: string;
  readonly normalized: string;
  readonly scope: "legacy-compound-alternatives";
  readonly status: "enumerated" | "short-circuited" | "unsupported";
  readonly actual: { readonly ipa: string; readonly route: string };
  readonly candidates: readonly (
    | { readonly kind: "unsplit"; readonly componentIpa: string; readonly phonotactics: IpaReport }
    | { readonly kind: "compound"; readonly evidence: CompoundCandidate; readonly phonotactics: IpaReport }
  )[];
}

/** Preserve alternatives without treating independent part attestation as a licensed boundary. */
export function collectWordAnalysis(word: string, actual: WordAnalysis["actual"], unsplit: string | undefined, compounds: readonly CompoundCandidate[], shortCircuited = false): WordAnalysis {
  const candidates: WordAnalysis["candidates"][number][] = unsplit === undefined ? [] : [
    { kind: "unsplit", componentIpa: unsplit, phonotactics: inspectIpa(unsplit) },
    ...compounds.map(evidence => ({ kind: "compound", evidence, phonotactics: inspectIpa(evidence.componentIpa) } satisfies WordAnalysis["candidates"][number])),
  ];
  return { word, normalized: word.toLowerCase(), scope: "legacy-compound-alternatives", status: unsplit === undefined ? "unsupported" : shortCircuited ? "short-circuited" : "enumerated", actual, candidates };
}

type CompoundNodePayload =
  | { readonly kind: "whole"; readonly componentIpa: string; readonly origin: "direct-rules" | "attested-part" }
  | { readonly kind: "compound"; readonly componentIpa: string; readonly left: number; readonly right: number; readonly stressOwner: "left" | "right"; readonly legacyScore: number; readonly boundary: "unclassified" }
  | { readonly kind: "secondary-projection"; readonly componentIpa: string; readonly source: number }
  | { readonly kind: "choice"; readonly componentIpa: string | null; readonly alternatives: readonly number[] };
export type CompoundNode = CompoundNodePayload & { readonly id: number; readonly start: number; readonly end: number };
export type CompoundForest = {
  readonly scope: "legacy-compound-forest";
  readonly analysis: WordAnalysis;
  readonly nodes: readonly CompoundNode[];
  readonly states: number;
  readonly guardedSpans: number;
} & (
  | { readonly status: "complete"; readonly root: number }
  | { readonly status: "truncated" | "unsupported"; readonly root: number | null }
);

/** Keep parent IPA exact; secondary-mark projection is explicit, never a phone edit. */
export function buildCompoundForest(word: string, analyze: (word: string) => WordAnalysis, maxStates = 256): CompoundForest {
  if (!Number.isSafeInteger(maxStates) || maxStates < 1) throw new RangeError("maxStates must be a positive safe integer");
  const analysis = analyze(word), normalized = analysis.normalized, nodes: CompoundNode[] = [];
  const spans = new Map<string, WordAnalysis>(), choices = new Map<string, number>();
  let states = 0, truncated = false, guardedSpans = 0;
  spans.set(normalized, analysis);
  const step = (): boolean => {
    if (truncated) return false;
    if (++states > maxStates) { truncated = true; return false; }
    return true;
  };
  function add(start: number, end: number, payload: CompoundNodePayload): number | undefined {
    if (!step()) return undefined;
    const id = nodes.length;
    nodes.push(Object.freeze({ ...payload, id, start, end }));
    return id;
  }
  function visit(start: number, end: number, requiredIpa: string | null): number | undefined {
    const key = JSON.stringify([start, end, requiredIpa]), cached = choices.get(key);
    if (cached !== undefined) return cached;
    if (!step()) return undefined;
    const spelling = normalized.slice(start, end);
    let local = spans.get(spelling);
    if (!local) { local = analyze(spelling); spans.set(spelling, local); }
    const alternatives: number[] = [];
    const compatible = (ipa: string) => requiredIpa === null || ipa === requiredIpa || ipa.replace(/ˌ/g, "") === requiredIpa;
    const retain = (id: number | undefined, ipa: string) => {
      if (id === undefined) return;
      const adapted = requiredIpa !== null && ipa !== requiredIpa ? add(start, end, { kind: "secondary-projection", componentIpa: requiredIpa, source: id }) : id;
      if (adapted !== undefined) alternatives.push(adapted);
    };
    if (requiredIpa !== null) {
      const leaf = add(start, end, { kind: "whole", componentIpa: requiredIpa, origin: "attested-part" });
      if (leaf !== undefined) alternatives.push(leaf);
    }
    if (local.status === "short-circuited") guardedSpans++;
    for (const candidate of local.candidates) {
      if (truncated) break;
      if (candidate.kind === "unsplit") {
        if (!compatible(candidate.componentIpa)) continue;
        const leaf = add(start, end, { kind: "whole", componentIpa: candidate.componentIpa, origin: "direct-rules" });
        retain(leaf, candidate.componentIpa);
        continue;
      }
      const { structure, componentIpa, legacyScore } = candidate.evidence;
      if (local.status === "short-circuited" || !compatible(componentIpa)) continue;
      const { left, right, stressOwner } = structure;
      if (left.start !== 0 || !Number.isInteger(left.end) || left.end !== right.start || right.end !== spelling.length || left.end <= 0 || right.start >= right.end ||
          left.spelling !== spelling.slice(0, left.end) || right.spelling !== spelling.slice(right.start)) throw new RangeError("Compound parts must partition their word");
      const leftId = visit(start, start + left.end, left.componentIpa), rightId = visit(start + right.start, end, right.componentIpa);
      if (leftId === undefined || rightId === undefined) continue;
      const compound = add(start, end, { kind: "compound", componentIpa, left: leftId, right: rightId, stressOwner, legacyScore, boundary: "unclassified" });
      retain(compound, componentIpa);
    }
    if (!alternatives.length) return undefined;
    const id = add(start, end, { kind: "choice", componentIpa: requiredIpa, alternatives: Object.freeze(alternatives) });
    if (id !== undefined) choices.set(key, id);
    return id;
  }
  const root = analysis.status === "unsupported" ? undefined : visit(0, normalized.length, null);
  const common = { scope: "legacy-compound-forest", analysis, nodes: Object.freeze(nodes), states, guardedSpans } satisfies Omit<CompoundForest, "status" | "root">;
  if (truncated) return Object.freeze({ ...common, status: "truncated", root: root ?? null });
  return root === undefined ? Object.freeze({ ...common, status: "unsupported", root: null }) : Object.freeze({ ...common, status: "complete", root });
}
