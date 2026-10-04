/** Offline rule ablation. Replay the real pipeline before scoring removals. */
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import Module = require("module");
import { dirname, join } from "path";
import * as ts from "typescript";
import levenshtein from "fast-levenshtein";
import EnglishG2P from "../src/en/g2p";
import dictionary from "../data/en/dict.json";
import { isForeign } from "./foreign-filter";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log("yarn diagnose:postlex [--all] [--include-long] [--out DIR]");
  console.log("Default: English subset. Scores are diagnostic; rebuild and validate before adoption.");
  process.exit(0);
}
const outIndex = argv.indexOf("--out");
const out = outIndex < 0 ? "/tmp/phonemize-postlex-diagnosis" : argv[outIndex + 1];
if (!out || out.startsWith("--")) throw new Error("--out requires a directory");
const repo = join(__dirname, "..");
const filename = join(repo, "src/en/postlex.ts");
const source = readFileSync(filename, "utf8");
const replace = (text: string, needle: string, replacement: string): string => {
  if (!text.includes(needle)) throw new Error(`Instrumentation source changed: ${needle}`);
  return text.replace(needle, replacement);
};
let instrumented = source + `
export const __lab = {
  skip: -1, active: "", observe: true, touched: new Map<number, Set<string>>(),
  rows: [...POST_PROC_RULES.map(([re, sub]) => ({kind: "proc", re: String(re), sub})),
    ...POST_LEX_RULES.map(r => ({kind: "lex", re: String(r.re), when: String(r.when),
      sub: r.sub, fn: r.fn ? String(r.fn) : undefined}))],
};
function __touch(index: number, before: string, after: string): void {
  if (!__lab.observe || before === after) return;
  if (!__lab.touched.has(index)) __lab.touched.set(index, new Set());
  __lab.touched.get(index)!.add(__lab.active);
}
`;
instrumented = replace(instrumented,
  "for (const [from, to] of POST_PROC_RULES) out = out.replace(from, to);",
  `for (let index = 0; index < POST_PROC_RULES.length; index++) {
    if (__lab.skip === index) continue;
    const [from, to] = POST_PROC_RULES[index], before = out;
    out = out.replace(from, to); __touch(index, before, out);
  }`);
instrumented = replace(instrumented, "for (const rule of POST_LEX_RULES) {",
  `for (let index = 0; index < POST_LEX_RULES.length; index++) {
    const key = index + POST_PROC_RULES.length;
    if (__lab.skip === key) continue;
    const rule = POST_LEX_RULES[index], before = out;`);
const substitution = "out = rule.fn !== undefined ? out.replace(rule.re, rule.fn) : out.replace(rule.re, rule.sub!);";
instrumented = replace(instrumented, substitution, substitution + "\n    __touch(key, before, out);");

type Rule = { kind: string; re: string; when?: string; sub?: string; fn?: string };
type Control = { skip: number; active: string; observe: boolean; touched: Map<number, Set<string>>; rows: Rule[] };
function compile(file: string, text: string): Record<string, unknown> {
  const isolated = new Module(file, module) as Module & { _compile(text: string, file: string): void };
  isolated.filename = file;
  isolated.paths = (Module as unknown as { _nodeModulePaths(dir: string): string[] })._nodeModulePaths(dirname(file));
  isolated._compile(ts.transpileModule(text, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, file);
  return isolated.exports;
}
const custom = compile(filename, instrumented);
const control = custom.__lab as Control;
// Only the isolated constructor imports the instrumented postlex module.
// Restore the loader before prediction; leave require.cache untouched.
const loader = Module as unknown as { _load(request: string, parent: Module, ...args: unknown[]): unknown };
const originalLoad = loader._load;
let Constructor: typeof EnglishG2P;
try {
  loader._load = function(request, parent, ...args) {
    if (request === "./postlex" && parent.filename.startsWith(join(repo, "src/en/"))) return custom;
    return originalLoad.call(this, request, parent, ...args);
  };
  const g2pFile = join(repo, "src/en/g2p.ts");
  Constructor = compile(g2pFile, readFileSync(g2pFile, "utf8")).default as typeof EnglishG2P;
} finally {
  loader._load = originalLoad;
}
const frequencyFile = join(__dirname, ".common-accuracy-cache/frequency.txt");
const frequency = new Set(readFileSync(frequencyFile, "utf8").trim().split(/\s+/));
const inSubset = (word: string): boolean => frequency.has(word.toLowerCase()) && !isForeign(word.toLowerCase());
const common = (word: string): boolean => word.length <= 12 && inSubset(word);
const words = Object.keys(dictionary).filter(word => /^[a-z']+$/i.test(word) && word.length >= 3 &&
  word.length <= (argv.includes("--include-long") ? 40 : 12) && /[aeiou]/i.test(word) &&
  !/^([A-Z]\.?){2,8}$/.test(word) && (argv.includes("--all") || inSubset(word)));
const strip = (ipa: string): string => ipa.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə");
function canon(ipa: string): string {
  let value = strip(ipa);
  for (const group of [["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"]])
    for (const variant of group.slice(1)) value = value.split(variant).join(group[0]);
  return value;
}
const score = (ipa: string, gold: string): number[] => [Number(strip(ipa) === strip(gold)), Number(levenshtein.get(canon(ipa), canon(gold)) <= 1)];
const old = new EnglishG2P({ disableDict: true }), next = new Constructor({ disableDict: true });
const baseline = new Map<string, string>();
for (const word of words) {
  control.active = word;
  const before = old.predict(word), replayed = next.predict(word);
  if (!before || replayed !== before) throw new Error(`Instrumented replay differs: ${word}`);
  baseline.set(word, before);
}
control.observe = false;
type Row = { word: string; before: string; after: string; gold: string; delta: number[]; common: boolean };
const results = [...control.touched].map(([index, touched]) => {
  control.skip = index;
  const counts = { all: [0, 0], common: [0, 0] }, winsLosses = { all: [[0, 0], [0, 0]], common: [[0, 0], [0, 0]] };
  const rows: Row[] = [];
  // A removal can change a word only if that rule changed some input in
  // its original execution, including recursively rendered stem calls.
  for (const word of touched) {
    const before = baseline.get(word)!, after = next.predict(word);
    if (!after) throw new Error(`No ablated prediction: ${word}`);
    if (before === after) continue;
    const gold = dictionary[word as keyof typeof dictionary], b = score(before, gold);
    const delta = score(after, gold).map((value, i) => value - b[i]), isCommon = common(word);
    for (const scope of isCommon ? ["all", "common"] as const : ["all"] as const)
      delta.forEach((value, i) => { counts[scope][i] += value; if (value) winsLosses[scope][i][value > 0 ? 0 : 1]++; });
    rows.push({ word, before, after, gold, delta, common: isCommon });
  }
  return { index, rule: control.rows[index], affected: touched.size, changed: rows.length, counts, winsLosses, rows };
}).sort((a, b) => b.counts.common[1] - a.counts.common[1] || b.counts.common[0] - a.counts.common[0]);
mkdirSync(out, { recursive: true });
const hashes = Object.fromEntries(["src/en/postlex.ts", "src/en/g2p.ts", "src/en/syllabify.ts", "data/en/exceptions.json", "data/en/dict.json"].map(file =>
  [file, createHash("sha256").update(readFileSync(join(repo, file))).digest("hex")]));
writeFileSync(join(out, "results.json"), JSON.stringify({ n: words.length, options: argv, hashes, results }, null, 2) + "\n");
console.log(`Replayed ${words.length} words; ${results.length} rules fired. Removing a rule has the following diagnostic deltas:`);
console.table(results.map(result => ({ index: result.index, rule: result.rule.re,
  changed: result.changed, strict: result.counts.all[0], lenient: result.counts.all[1],
  commonStrict: result.counts.common[0], commonLenient: result.counts.common[1] })));
console.log(`Full win/loss rows: ${join(out, "results.json")}`);
