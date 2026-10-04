/**
 * Compare actual dispatch decisions with their fallbacks, offline.
 * No runtime/source/baseline changes. Every instrumented baseline must equal
 * the unmodified public predict() result before alternatives are scored.
 * Return labels refer to the source hash in the report, not a guessed suffix.
 * All selected words (including already correct words) contribute wins/losses.
 * These are diagnosis scores, never permission to deploy a bypass wholesale.
 */
import { createHash } from "crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import Module = require("module");
import { dirname, join } from "path";
import * as ts from "typescript";
import levenshtein from "fast-levenshtein";
import EnglishG2P from "../src/en/g2p";
import dictionary from "../data/en/dict.json";
import { isForeign } from "./foreign-filter";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log("yarn diagnose:routes [--all] [--include-long] [--limit N] [--out DIR]");
  console.log("Default: full English subset; --all: full dictionary. Diagnosis only; no adoption or baseline updates.");
  process.exit(0);
}
function value(flag: string, fallback?: string): string | undefined {
  const at = argv.indexOf(flag);
  if (at < 0) return fallback;
  const next = argv[at + 1];
  if (!next || next.startsWith("--")) throw new Error(`${flag} requires a value`);
  return next;
}
const out = value("--out", "/tmp/phonemize-route-diagnosis")!;
const limit = value("--limit") === undefined ? Infinity : Number(value("--limit"));
if (limit !== Infinity && (!Number.isInteger(limit) || limit < 1)) throw new Error("--limit must be an integer >= 1");
const repo = join(__dirname, "..");
const filename = join(repo, "src/en/g2p.ts");
const source = readFileSync(filename, "utf8");
const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
const labels: Record<string, string> = {};
const methods = ["tryMorphologicalAnalysis", "tryCompoundSplit", "tryDecomposition"] as const;
type Method = typeof methods[number];
type Lab = {
  predict(word: string, language: string): string | undefined;
  __routeReturn(word: string, label: string, result: unknown): unknown;
} & Record<Method, (word: string, ...args: unknown[]) => unknown>;

// Compile an isolated copy with return observations. Skip nested functions:
// their returns are stem helpers, not the method's winning decision.
const transformed = ts.transform(sourceFile, [context => root => {
  const visit: ts.Visitor = node => {
    if (ts.isMethodDeclaration(node) && ["tryMorphologicalAnalysis", "predictInternal"].includes(node.name.getText(sourceFile))) {
      const method = node.name.getText(sourceFile);
      const observe: ts.Visitor = child => {
        if (ts.isFunctionLike(child)) return child;
        if (ts.isReturnStatement(child) && child.expression) {
          const line = sourceFile.getLineAndCharacterOfPosition(child.getStart(sourceFile)).line + 1;
          const label = `${method}:L${line}`;
          labels[label] = child.getText(sourceFile);
          return ts.factory.updateReturnStatement(child, ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "__routeReturn"), undefined,
            [ts.factory.createIdentifier("word"), ts.factory.createStringLiteral(label), child.expression],
          ));
        }
        return ts.visitEachChild(child, observe, context);
      };
      return ts.factory.updateMethodDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.questionToken,
        node.typeParameters, node.parameters, node.type, node.body ? ts.visitNode(node.body, observe) as ts.Block : undefined);
    }
    return ts.visitEachChild(node, visit, context);
  };
  return ts.visitNode(root, visit) as ts.SourceFile;
}]);
const code = ts.transpileModule(ts.createPrinter().printFile(transformed.transformed[0]), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
transformed.dispose();
const isolated = new Module(filename, module) as Module & { _compile(code: string, filename: string): void };
// Resolve imports relative to the actual source file without registering this
// constructor in require.cache or replacing any shared module.
isolated.filename = filename;
isolated.paths = (Module as unknown as { _nodeModulePaths(dir: string): string[] })._nodeModulePaths(dirname(filename));
isolated._compile(code, filename);
const Constructor = isolated.exports.default as new (options: { disableDict: boolean }) => Lab;
const lab = new Constructor({ disableDict: true });
const unmodified = new EnglishG2P({ disableDict: true });
let activeWord = "", observed: string | undefined;
lab.__routeReturn = (word, label, result) => {
  if (word.toLowerCase() === activeWord && result && !observed) observed = label;
  return result;
};
const originals = Object.fromEntries(methods.map(method => [method, lab[method]])) as Record<Method, Lab[Method]>;
const alternatives: Record<string, readonly Method[]> = {
  withoutMorphology: ["tryMorphologicalAnalysis"],
  unsplit: methods,
};
const strip = (ipa: string): string => ipa.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə");
function canon(ipa: string): string {
  let result = strip(ipa);
  for (const group of [["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"]])
    for (const variant of group.slice(1)) result = result.split(variant).join(group[0]);
  return result;
}
const score = (ipa: string, gold: string): number[] => [Number(strip(ipa) === strip(gold)), Number(levenshtein.get(canon(ipa), canon(gold)) <= 1)];
const frequencyPath = join(__dirname, ".common-accuracy-cache/frequency.txt");
const frequency = new Set(readFileSync(frequencyPath, "utf8").trim().split(/\s+/));
const words = Object.keys(dictionary).filter(word => /^[a-z']+$/i.test(word) && word.length >= 3 &&
  (argv.includes("--include-long") || word.length <= 12) && !/^([A-Z]\.?){2,8}$/.test(word) && /[aeiou]/i.test(word) &&
  (argv.includes("--all") || frequency.has(word.toLowerCase()) && !isForeign(word.toLowerCase()))).slice(0, limit);
type Row = { word: string; gold: string; baseline: string; alternative: string; delta: number[] };
type Group = { alternative: string; label: string; changed: number; strict: number[]; lenient: number[]; rows: Row[] };
const groups = new Map<string, Group>();
const totals: Record<string, number[]> = Object.fromEntries(["baseline", ...Object.keys(alternatives)].map(name => [name, [0, 0]]));
for (const word of words) {
  activeWord = word.toLowerCase(); observed = undefined;
  const baseline = lab.predict(word, "en") ?? "";
  if (baseline !== (unmodified.predict(word, "en") ?? "")) throw new Error(`Instrumentation changed ${word}`);
  const label = observed ?? "outside-predictInternal";
  const gold = (dictionary as Record<string, string>)[word], before = score(baseline, gold);
  before.forEach((count, i) => totals.baseline[i] += count);
  for (const [name, skipped] of Object.entries(alternatives)) {
    let alternative: string;
    for (const method of skipped) lab[method] = function (root, ...args) {
      return root.toLowerCase() === activeWord ? undefined : originals[method].call(this, root, ...args);
    };
    try { alternative = lab.predict(word, "en") ?? ""; }
    finally { for (const method of skipped) lab[method] = originals[method]; }
    const after = score(alternative, gold), delta = after.map((count, i) => count - before[i]);
    after.forEach((count, i) => totals[name][i] += count);
    if (alternative === baseline) continue;
    const key = `${name}:${label}`;
    const group = groups.get(key) ?? { alternative: name, label, changed: 0, strict: [0, 0], lenient: [0, 0], rows: [] };
    group.changed++;
    delta.forEach((count, i) => { if (count) (i === 0 ? group.strict : group.lenient)[count > 0 ? 0 : 1]++; });
    group.rows.push({ word, gold, baseline, alternative, delta }); groups.set(key, group);
  }
}
const sorted = [...groups.values()].sort((a, b) => (b.lenient[0] - b.lenient[1]) - (a.lenient[0] - a.lenient[1]));
const hash = (path: string): string => createHash("sha256").update(readFileSync(path)).digest("hex");
const fingerprints = Object.fromEntries(["scripts/diagnose-routes.ts", ...readdirSync(join(repo, "src/en")).filter(name => name.endsWith(".ts")).map(name => `src/en/${name}`),
  ...readdirSync(join(repo, "data/en")).filter(name => name.endsWith(".json")).map(name => `data/en/${name}`)].map(path => [path, hash(join(repo, path))]));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "report.json"), JSON.stringify({ scope: argv.includes("--all") ? "full dictionary" : "English subset", n: words.length,
  limit: Number.isFinite(limit) ? limit : null, includeLong: argv.includes("--include-long"), baselineVerified: words.length, totals,
  fingerprints, frequencyHash: hash(frequencyPath), labels, groups: sorted }, null, 2) + "\n");
console.log(`Verified ${words.length} baseline predictions; strict/lenient totals:`, totals);
for (const group of sorted) console.log(`${group.alternative} ${group.label}: changed ${group.changed}, strict +${group.strict[0]}/-${group.strict[1]}, lenient +${group.lenient[0]}/-${group.lenient[1]}`);
console.log(`Full win/loss evidence: ${join(out, "report.json")}`);
