/**
 * Research-only learner for errors whose phones are emitted by an executed
 * morphology root. Candidate effects are replayed through the original
 * predict() call sequence; this script never updates runtime rules or gold.
 */
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import levenshtein from "fast-levenshtein";
import EnglishG2P from "../src/en/g2p";
import dictionary from "../data/en/dict.json";
import cohortV85 = require("./common-cohort-v85.json");
import cohortV86 = require("./common-cohort-v86.json");
import { commonGoldVariants, commonReferenceContract } from "./common-cohort-gold";
import { traceNestedCommon } from "./diagnose-nested-routes";
import { decompose } from "../src/en/suffixes";
import { secondaryStressIndices } from "../src/en/syllabify";
import { isForeign } from "./foreign-filter";

type TraceStep = { grapheme: string; phoneme: string; rule: string };
type Call = {
  word: string; forced: number | null; pos: string | null; dialect: string | null;
  syllables: string[]; stressedIdx: number; ipa: string[]; steps: TraceStep[];
};
type Row = { word: string; prediction: string; calls: Call[] };
type Span = { start: number; end: number; from: string; to: string };
type Event = {
  syllable: number; phoneStart: number; phoneEnd: number; step: TraceStep;
  stress: "primary" | "secondary" | "unstressed"; targetSuffix: string;
};
type Candidate = {
  grapheme: string; rule: string; from: string; to: string;
  stress: Event["stress"]; targetSuffix: string; edge: "span" | "before" | "after"; support: Set<string>;
};
type CallPlan = { before: string[]; after: string[] };

const argv = process.argv.slice(2), outArg = argv.indexOf("--out");
if (outArg < 0 || !argv[outArg + 1]) throw new Error("usage: node --require tsx/cjs scripts/learn-morph-root-corrections.ts --out NEW_REPORT.json [--cohort-v86]");
const cohort = argv.includes("--cohort-v86") ? cohortV86 : cohortV85;
const outPath = argv[outArg + 1];
const suffixAgnostic = argv.includes("--suffix-agnostic");
const STRESS = /[ˈˌ]/g;
const strip = (s: string) => s.replace(STRESS, "").replace(/ʌ/g, "ə");
// Dark-l phonotactics runs after ruleSyllables. Canonicalize this one-phone
// allophone only for offset-preserving root-span alignment, never for scoring.
const alignable = (s: string) => strip(s).replace(/ɫ/g, "l");
const SIMILAR = [["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"]];
function canon(s: string): string {
  let result = strip(s);
  for (const group of SIMILAR) for (let i = 1; i < group.length; i++) result = result.split(group[i]).join(group[0]);
  return result;
}
function strictOk(pred: string, gold: string[]): boolean { return gold.some(g => strip(g) === strip(pred)); }
function lenientOk(pred: string, gold: string[]): boolean { return gold.some(g => levenshtein.get(canon(g), canon(pred)) <= 1); }
function outerSuffix(word: string): string {
  const entry = decompose(word).steps[0]?.entry;
  return entry?.suffix ?? "none";
}
function errorSpans(prediction: string, gold: string[]): Span[] {
  const a = strip(prediction);
  let best: string | undefined, bestDistance = Infinity;
  for (const variant of gold) {
    const b = strip(variant), distance = levenshtein.get(a, b);
    if (distance < bestDistance) { best = b; bestDistance = distance; }
  }
  if (best === undefined || bestDistance === 0) return [];
  const b = best;
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
  type Op = { equal: boolean; from?: string; to?: string };
  const reversed: Op[] = [];
  let i = a.length, j = b.length;
  while (i || j) {
    if (i && j && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      reversed.push({ equal: true }); i--; j--; continue;
    }
    if (i && j && dp[i][j] === dp[i - 1][j - 1] + 1) { reversed.push({ equal: false, from: a[i - 1], to: b[j - 1] }); i--; j--; continue; }
    if (i && dp[i][j] === dp[i - 1][j] + 1) { reversed.push({ equal: false, from: a[i - 1] }); i--; continue; }
    reversed.push({ equal: false, to: b[j - 1] }); j--;
  }
  const spans: Span[] = [];
  let ai = 0, start = -1, from = "", to = "";
  const flush = () => { if (start >= 0 && (from || to)) spans.push({ start, end: start + from.length, from, to }); start = -1; from = ""; to = ""; };
  for (const op of reversed.reverse()) {
    if (op.equal) { flush(); ai++; continue; }
    if (start < 0) start = ai;
    if (op.from !== undefined) { from += op.from; ai++; }
    if (op.to !== undefined) to += op.to;
  }
  flush();
  return spans;
}
type RootSpan = { start: number; end: number };
function alignSurfaceSpanToRoot(root: string, surface: string, start: number, end: number): RootSpan | undefined {
  const m = root.length, n = surface.length;
  if (!m || start < 0 || end < start || end > n) return undefined;
  const forward = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(Infinity));
  const backward = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(Infinity));
  forward[0][0] = 0;
  for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
    const d = forward[i][j];
    if (!Number.isFinite(d)) continue;
    if (i < m) forward[i + 1][j] = Math.min(forward[i + 1][j], d + 1);
    if (j < n) forward[i][j + 1] = Math.min(forward[i][j + 1], d + 1);
    if (i < m && j < n) forward[i + 1][j + 1] = Math.min(forward[i + 1][j + 1], d + (root[i] === surface[j] ? 0 : 1));
  }
  backward[m][n] = 0;
  for (let i = m; i >= 0; i--) for (let j = n; j >= 0; j--) {
    if (i === m && j === n) continue;
    if (i < m) backward[i][j] = Math.min(backward[i][j], backward[i + 1][j] + 1);
    if (j < n) backward[i][j] = Math.min(backward[i][j], backward[i][j + 1] + 1);
    if (i < m && j < n) backward[i][j] = Math.min(backward[i][j], backward[i + 1][j + 1] + (root[i] === surface[j] ? 0 : 1));
  }
  const distance = forward[m][n];
  if (distance > 3) return undefined;
  const rootBoundaries = (surfaceBoundary: number): number[] => {
    const matches: number[] = [];
    for (let i = 0; i <= m; i++) if (forward[i][surfaceBoundary] + backward[i][surfaceBoundary] === distance) matches.push(i);
    return matches;
  };
  const starts = rootBoundaries(start), ends = rootBoundaries(end);
  if (starts.length !== 1 || ends.length !== 1) return undefined;
  if (start !== end && ends[0] <= starts[0]) return undefined;
  return { start: starts[0], end: ends[0] };
}
function traceEvents(call: Call, targetSuffix: string): Event[] {
  const spelling = call.word.toLowerCase();
  if (call.syllables.join("") !== spelling || call.steps.map(s => s.phoneme).join("") !== call.ipa.join("")) return [];
  const bounds: Array<[number, number]> = [];
  let letterAt = 0;
  for (const syllable of call.syllables) { bounds.push([letterAt, letterAt + syllable.length]); letterAt += syllable.length; }
  const secondary = new Set(secondaryStressIndices(call.syllables, call.stressedIdx));
  const events: Event[] = [];
  const phoneAt = Array(call.syllables.length).fill(0) as number[];
  let spellingAt = 0;
  for (const step of call.steps) {
    const grapheme = step.grapheme.toLowerCase();
    if (!grapheme) continue;
    const position = spelling.indexOf(grapheme, spellingAt);
    if (position < 0) return [];
    spellingAt = position + grapheme.length;
    const syllable = bounds.findIndex(([start, end]) => position >= start && position < end);
    if (syllable < 0) return [];
    const phoneStart = phoneAt[syllable];
    phoneAt[syllable] += step.phoneme.length;
    const stress = syllable === call.stressedIdx ? "primary" : secondary.has(syllable) ? "secondary" : "unstressed";
    events.push({ syllable, phoneStart, phoneEnd: phoneAt[syllable], step, stress, targetSuffix });
  }
  return events;
}
function candidateKey(c: Omit<Candidate, "support">): string {
  return [c.grapheme, c.rule, c.from, c.to, c.stress, c.targetSuffix, c.edge].join("\u0000");
}
function callKey(word: unknown, forced: unknown, pos: unknown, dialect: unknown): string {
  return JSON.stringify([word, typeof forced === "number" ? forced : null, typeof pos === "string" ? pos : null, typeof dialect === "string" ? dialect : null]);
}
function planCall(call: Call, targetSuffix: string, candidate: Candidate): string[] | undefined {
  const events = traceEvents(call, targetSuffix);
  if (!events.length) return undefined;
  const ipa = call.ipa.slice();
  let changed = false;
  for (const event of events) {
    if (event.step.grapheme.toLowerCase() !== candidate.grapheme || event.step.rule !== candidate.rule ||
        event.stress !== candidate.stress || (candidate.targetSuffix !== "*" && event.targetSuffix !== candidate.targetSuffix) ||
        (candidate.from !== "" && !strip(event.step.phoneme).includes(candidate.from))) continue;
    // The learner aligns after official stress/STRUT normalization, but offsets
    // are length-preserving in the raw IPA that the runtime hook receives.
    const offset = candidate.from === ""
      ? candidate.edge === "after" ? event.phoneEnd : event.phoneStart
      : strip(ipa[event.syllable]).indexOf(candidate.from, event.phoneStart);
    if (offset < 0 || offset + candidate.from.length > event.phoneEnd) continue;
    ipa[event.syllable] = ipa[event.syllable].slice(0, offset) + candidate.to + ipa[event.syllable].slice(offset + candidate.from.length);
    changed = true;
  }
  return changed ? ipa : undefined;
}

function main(): void {
  if (cohort.words.length !== cohort.n || new Set(cohort.words).size !== cohort.n) throw new Error("Fixed cohort mismatch");
  const { rows, grouping } = traceNestedCommon();
  const dict = dictionary as Record<string, string>;
  const gold = new Map<string, string[]>(), suffix = new Map<string, string>(), top = new Set(cohort.top5000);
  for (const word of cohort.words) { gold.set(word, commonGoldVariants(word, dict[word])); suffix.set(word, outerSuffix(word)); }
  const byWord = new Map(rows.map(row => [row.word, row]));
  const assignments = grouping.assignments;
  const familyFold = new Map(rows.map(row => [row.word, assignments.get(row.word)?.fold]));
  const foreign = new Set(cohort.words.filter(word => isForeign(word)));
  type AlignmentExample = {
    word: string; prediction: string; gold: string[]; span: Span;
    calls: Array<{ word: string; ipa: string; steps: TraceStep[] }>;
  };

  // Count why strict errors do not yield root-edit candidates. Keep this
  // separate from fold iteration so each cohort error is counted once.
  const alignmentAudit = {
    nonForeignStrictErrors: 0,
    noPhoneErrorSpans: 0,
    phoneErrorSpans: 0,
    noContainingRoot: 0,
    ambiguousRootAlignment: 0,
    noTraceEvent: 0,
    mappedTraceEvents: 0,
    examples: { noContainingRoot: [] as AlignmentExample[], ambiguousRootAlignment: [] as AlignmentExample[], noTraceEvent: [] as AlignmentExample[] },
  };
  for (const row of rows) {
    if (foreign.has(row.word)) continue;
    const variants = gold.get(row.word) ?? [];
    if (!variants.length || strictOk(row.prediction, variants)) continue;
    alignmentAudit.nonForeignStrictErrors++;
    const spans = errorSpans(row.prediction, variants);
    if (!spans.length) {
      alignmentAudit.noPhoneErrorSpans++;
      continue;
    }
    for (const span of spans) {
      alignmentAudit.phoneErrorSpans++;
      const output = alignable(row.prediction);
      const mappedCalls = row.calls.flatMap(call => {
        const root = alignable(call.ipa.join(""));
        const rootSpan = alignSurfaceSpanToRoot(root, output, span.start, span.end);
        return rootSpan ? [{ call, rootSpan }] : [];
      });
      const example = (): AlignmentExample => ({
        word: row.word, prediction: row.prediction, gold: variants, span,
        calls: row.calls.map(call => ({ word: call.word, ipa: alignable(call.ipa.join("")), steps: call.steps })),
      });
      if (mappedCalls.length === 0) {
        alignmentAudit.noContainingRoot++;
        if (alignmentAudit.examples.noContainingRoot.length < 25) alignmentAudit.examples.noContainingRoot.push(example());
        continue;
      }
      if (mappedCalls.length !== 1) {
        alignmentAudit.ambiguousRootAlignment++;
        if (alignmentAudit.examples.ambiguousRootAlignment.length < 25) alignmentAudit.examples.ambiguousRootAlignment.push(example());
        continue;
      }
      const { call, rootSpan } = mappedCalls[0];
      const events = traceEvents(call, suffix.get(row.word) ?? "none");
      const matchingEvents = events.filter(item => {
          const phoneStart = call.ipa.slice(0, item.syllable).join("").length + item.phoneStart;
          const phoneEnd = call.ipa.slice(0, item.syllable).join("").length + item.phoneEnd;
          return span.from
            ? rootSpan.start >= phoneStart && rootSpan.end <= phoneEnd
            : rootSpan.start === phoneStart || rootSpan.start === phoneEnd;
      });
      if (matchingEvents.length !== 1) {
        alignmentAudit.noTraceEvent++;
        if (alignmentAudit.examples.noTraceEvent.length < 25) alignmentAudit.examples.noTraceEvent.push(example());
      } else alignmentAudit.mappedTraceEvents++;
    }
  }

  // Precompute trace events once; these are the only root contexts a candidate may affect.
  const candidatesByFold: Array<{ fold: number; candidates: Candidate[]; mismatches: number }> = [];
  for (let fold = 0; fold < 10; fold++) {
    const pool = new Map<string, Candidate>();
    let mismatches = 0;
    for (const row of rows) {
      if (familyFold.get(row.word) === fold || foreign.has(row.word)) continue;
      const variants = gold.get(row.word) ?? [];
      if (!variants.length || strictOk(row.prediction, variants)) continue;
      mismatches++;
      const spans = errorSpans(row.prediction, variants);
      if (!spans.length) continue;
      const output = alignable(row.prediction);
      for (const span of spans) {
        const mappedCalls = row.calls.flatMap(call => {
          const root = alignable(call.ipa.join(""));
          const rootSpan = alignSurfaceSpanToRoot(root, output, span.start, span.end);
          return rootSpan ? [{ call, rootSpan }] : [];
        });
        if (mappedCalls.length !== 1) continue;
        const { call, rootSpan } = mappedCalls[0];
        const callEvents = traceEvents(call, suffix.get(row.word) ?? "none");
        const matchingEvents = callEvents.flatMap(event => {
          const phoneStart = call.ipa.slice(0, event.syllable).join("").length + event.phoneStart;
          const phoneEnd = call.ipa.slice(0, event.syllable).join("").length + event.phoneEnd;
          const edge = span.from ? "span" : rootSpan.start === phoneStart ? "before" : rootSpan.start === phoneEnd ? "after" : undefined;
          const covers = span.from ? rootSpan.start >= phoneStart && rootSpan.end <= phoneEnd : edge !== undefined;
          return covers ? [{ event, edge: edge ?? "span" as const }] : [];
        });
        if (matchingEvents.length !== 1) continue;
        const { event, edge } = matchingEvents[0];
        const keyData = { grapheme: event.step.grapheme.toLowerCase(), rule: event.step.rule, from: span.from, to: span.to, stress: event.stress, targetSuffix: suffixAgnostic ? "*" : suffix.get(row.word) ?? "none", edge };
        const key = candidateKey(keyData);
        let candidate = pool.get(key);
        if (!candidate) { candidate = { ...keyData, support: new Set() }; pool.set(key, candidate); }
        candidate.support.add(row.word);
      }
    }
    candidatesByFold.push({ fold, candidates: [...pool.values()].filter(c => c.support.size >= 2), mismatches });
  }

  // The isolated scorer is driven by the frozen trace plan, then runs all downstream
  // morphology/compound/postlex processing in the real public predict() path.
  const scorer = new EnglishG2P({ disableDict: true });
  for (const row of rows) {
    const baseline = scorer.predict(row.word, "en") ?? "";
    if (baseline !== row.prediction) throw new Error(`Uninstrumented scorer mismatch: ${row.word}`);
  }
  const original: unknown = Reflect.get(scorer, "ruleSyllables");
  if (typeof original !== "function") throw new Error("ruleSyllables hook missing");
  let currentTarget = "", currentPlans = new Map<string, CallPlan[]>();
  if (!Reflect.set(scorer, "ruleSyllables", (...args: unknown[]) => {
    const result = Reflect.apply(original, scorer, args) as { syllables: string[]; stressedIdx: number; ipa: string[] };
    const plans = currentPlans.get(callKey(args[0], args[1], args[3], args[4])) ?? [];
    const matching = plans.filter(plan => plan.before.length === result.ipa.length && plan.before.every((phone, i) => phone === result.ipa[i]));
    const afterVariants = new Map(matching.map(plan => [plan.after.join("\u0000"), plan.after]));
    if (afterVariants.size > 1) throw new Error(`Ambiguous root-call IPA plan for ${currentTarget}: ${String(args[0])}`);
    const after = [...afterVariants.values()][0];
    return after ? { ...result, ipa: after } : result;
  })) throw new Error("Unable to install isolated replay hook");

  const results = [] as Array<Record<string, unknown>>;
  for (const foldRun of candidatesByFold) {
    const reports = [] as Array<Record<string, unknown>>;
    for (const candidate of foldRun.candidates) {
      let trainFix = 0, trainBreak = 0, heldFix = 0, heldBreak = 0, trainAffected = 0, lenientDelta = 0, topFix = 0, topBreak = 0;
      const examplesFixed: string[] = [], examplesBroken: string[] = [];
      for (const row of rows) {
        const suffixValue = suffix.get(row.word) ?? "none";
        const planned = new Map<string, CallPlan[]>();
        for (const call of row.calls) {
          const after = planCall(call, suffixValue, candidate);
          if (!after) continue;
          const key = callKey(call.word, call.forced, call.pos, call.dialect), plans = planned.get(key) ?? [];
          plans.push({ before: call.ipa, after });
          planned.set(key, plans);
        }
        if (!planned.size) continue;
        const variants = gold.get(row.word) ?? [];
        if (!variants.length) continue;
        currentTarget = row.word; currentPlans = planned;
        const after = scorer.predict(row.word, "en") ?? "";
        const beforeStrict = strictOk(row.prediction, variants), afterStrict = strictOk(after, variants);
        const isTrain = familyFold.get(row.word) !== foldRun.fold;
        if (isTrain) {
          trainAffected++;
          lenientDelta += Number(lenientOk(after, variants)) - Number(lenientOk(row.prediction, variants));
          if (!beforeStrict && afterStrict) { trainFix++; if (examplesFixed.length < 8) examplesFixed.push(row.word); }
          if (beforeStrict && !afterStrict) { trainBreak++; if (examplesBroken.length < 8) examplesBroken.push(row.word); }
          if (top.has(row.word)) { if (!beforeStrict && afterStrict) topFix++; if (beforeStrict && !afterStrict) topBreak++; }
        } else {
          if (!beforeStrict && afterStrict) heldFix++;
          if (beforeStrict && !afterStrict) heldBreak++;
        }
      }
      reports.push({
        grapheme: candidate.grapheme, rule: candidate.rule, from: candidate.from, to: candidate.to,
        stress: candidate.stress, targetSuffix: candidate.targetSuffix, support: candidate.support.size,
        trainAffected, trainFix, trainBreak, trainStrictNet: trainFix - trainBreak, trainLenientDelta: lenientDelta,
        top5000Fix: topFix, top5000Break: topBreak, heldFix, heldBreak,
        examplesFixed, examplesBroken,
      });
    }
    reports.sort((a, b) => Number(b.trainStrictNet) - Number(a.trainStrictNet) || Number(b.trainFix) - Number(a.trainFix));
    results.push({ fold: foldRun.fold, trainN: rows.filter(r => familyFold.get(r.word) !== foldRun.fold && !foreign.has(r.word)).length,
      heldN: rows.filter(r => familyFold.get(r.word) === foldRun.fold && !foreign.has(r.word)).length,
      mismatches: foldRun.mismatches, candidateN: foldRun.candidates.length,
      positiveTrainNet: reports.filter(r => Number(r.trainStrictNet) > 0).length,
      legacyTrainFilterPass: reports.filter(r => {
        const changedStrict = Number(r.trainFix) + Number(r.trainBreak);
        return changedStrict >= 20 && Number(r.trainFix) / changedStrict >= 0.75 && Number(r.top5000Fix) >= 3;
      }).length,
      topCandidates: reports.slice(0, 30) });
  }
  const report = {
    diagnosticOnly: true, suffixAgnostic, commonReferenceContract, population: rows.length,
    folds: 10, familyGrouped: true, candidateReplay: "actual predict() call sequence with root-call IPA overrides",
    alignmentAudit,
    traceReportSha256: createHash("sha256").update(JSON.stringify(rows)).digest("hex"),
    sourceFingerprints: Object.fromEntries(["src/en/g2p.ts", "src/en/syllabify.ts", "scripts/diagnose-nested-routes.ts", "scripts/learn-morph-root-corrections.ts"].map(path => [path, createHash("sha256").update(readFileSync(path)).digest("hex")])),
    results,
  };
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ words: rows.length, folds: results.length, candidateCounts: results.map(r => r.candidateN), report: outPath }));
}

main();
