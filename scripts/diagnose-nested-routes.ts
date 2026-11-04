/** Offline trace and dependency-safe folds for the fixed common cohort. */
import { createHash } from "crypto";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import EnglishG2P from "../src/en/g2p";
import cohort = require("./common-cohort-v86.json");
import { commonReferenceContract } from "./common-cohort-gold";
import { nestedFamilyFolds } from "./nested-family-folds";
import type { StemDependency } from "./nested-family-folds";

interface SyllableCall {
  word: string;
  forced: number | null;
  pos: string | null;
  dialect: string | null;
  syllables: string[];
  stressedIdx: number;
  ipa: string[];
  steps: Array<{ grapheme: string; phoneme: string; rule: string }>;
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error("Invalid ruleSyllables argument");
  return value;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function captureCall(args: unknown[], result: unknown, newSteps: unknown[]): SyllableCall {
  if (typeof args[0] !== "string" || (args[1] !== undefined && typeof args[1] !== "number") || !result || typeof result !== "object")
    throw new Error("Invalid ruleSyllables result");
  const syllables: unknown = Reflect.get(result, "syllables"), ipa: unknown = Reflect.get(result, "ipa"), stressedIdx: unknown = Reflect.get(result, "stressedIdx");
  if (!isStringArray(syllables) || !isStringArray(ipa) ||
      syllables.length !== ipa.length || typeof stressedIdx !== "number" || !Number.isInteger(stressedIdx))
    throw new Error("Invalid ruleSyllables shape");
  const steps = newSteps.map(step => {
    if (!step || typeof step !== "object") throw new Error("Invalid ruleSyllables trace step");
    const grapheme = Reflect.get(step, "grapheme"), phoneme = Reflect.get(step, "phoneme"), rule = Reflect.get(step, "rule");
    if (typeof grapheme !== "string" || typeof phoneme !== "string" || typeof rule !== "string")
      throw new Error("Invalid ruleSyllables trace step");
    return { grapheme, phoneme, rule };
  });
  return { word: args[0], forced: typeof args[1] === "number" ? args[1] : null, pos: optionalString(args[3]), dialect: optionalString(args[4]), syllables: [...syllables], stressedIdx, ipa: [...ipa], steps };
}

export function traceNestedCommon() {
  if (cohort.words.length !== cohort.n || new Set(cohort.words).size !== cohort.n) throw new Error("Fixed common cohort mismatch");
  const baseline = new EnglishG2P({ disableDict: true }), observed = new EnglishG2P({ disableDict: true });
  const original: unknown = Reflect.get(observed, "ruleSyllables");
  if (typeof original !== "function") throw new Error("ruleSyllables hook unavailable");
  let calls: SyllableCall[] = [];
  if (!Reflect.set(observed, "ruleSyllables", (...args: unknown[]) => {
    const trace: unknown[] = Array.isArray(args[2]) ? args[2] as unknown[] : [];
    const traceStart = trace.length;
    args[2] = trace;
    const result: unknown = Reflect.apply(original, observed, args);
    calls.push(captureCall(args, result, trace.slice(traceStart)));
    return result;
  })) throw new Error("Unable to install isolated trace hook");
  const rows: { word: string; prediction: string; calls: SyllableCall[] }[] = [];
  const dependencies: StemDependency[] = [];
  for (const word of cohort.words) {
    calls = [];
    const expected = baseline.predict(word, "en") ?? "", actual = observed.predict(word, "en") ?? "";
    if (!expected || actual !== expected) throw new Error(`Instrumented baseline differs: ${word}`);
    rows.push({ word, prediction: expected, calls });
    for (const call of calls) if (call.word !== word) dependencies.push({ target: word, stem: call.word });
  }
  const grouping = nestedFamilyFolds(cohort.words, dependencies);
  return { rows, dependencies, grouping };
}

if (require.main === module) {
  const [output] = process.argv.slice(2);
  if (!output || process.argv.length !== 3) throw new Error("usage: diagnose-nested-routes <new-report.json>");
  const repo = join(__dirname, ".."), hash = (path: string) => createHash("sha256").update(readFileSync(join(repo, path))).digest("hex");
  const fingerprints = Object.fromEntries([
    "scripts/diagnose-nested-routes.ts", "scripts/nested-family-folds.ts", "scripts/common-cohort-gold.ts", "scripts/common-cohort-v86.json",
    ...readdirSync(join(repo, "src/en")).filter(name => name.endsWith(".ts")).sort().map(name => `src/en/${name}`),
    ...readdirSync(join(repo, "data/en")).filter(name => name.endsWith(".json")).sort().map(name => `data/en/${name}`),
  ].map(path => [path, hash(path)]));
  const { rows, dependencies, grouping } = traceNestedCommon();
  const assignments = [...grouping.assignments].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([word, group]) => ({ word, ...group }));
  const report = {
    diagnosticOnly: true, referenceContract: commonReferenceContract, fingerprints,
    words: rows.length, verified: rows.length, nestedWords: rows.filter(row => row.calls.some(call => call.word !== row.word)).length,
    dependencyCalls: dependencies.length, familyCount: grouping.familyCount, foldSizes: grouping.sizes,
    assignments, rows,
  };
  writeFileSync(resolve(output), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ words: report.words, verified: report.verified, nestedWords: report.nestedWords, dependencyCalls: report.dependencyCalls, familyCount: report.familyCount, foldSizes: report.foldSizes }));
}
