import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import levenshtein = require("fast-levenshtein");
import { join } from "path";
import { parityReferences, parityReferencesV3, parityReferencesV4 } from "./parity-references";
import parityReference = require("./parity-reference-v2.json");
import diagnosticReference = require("./parity-reference-v3.json");
import diagnosticReferenceV4 = require("./parity-reference-v4.json");

const strip = (s: string): string => s.replace(/[ˈˌ]/g, "");
const groups = [["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"]];
function canon(s: string): string {
  let out = strip(s);
  for (const [first, ...others] of groups) for (const other of others) out = out.split(other).join(first);
  return out;
}
const hash = (data: string): string => createHash("sha256").update(data).digest("hex");

export function parseRows(content: string): Map<string, string> {
  const rows = new Map<string, string>();
  for (const line of content.split("\n")) {
    if (!line) continue;
    const fields = line.split("\t");
    if (fields.length !== 2 || !/^[a-z]+$/.test(fields[0]) || rows.has(fields[0])) throw new Error(`Invalid or duplicate row: ${line}`);
    rows.set(fields[0], fields[1]);
  }
  return rows;
}

export function compareParity(before: Map<string, string>, after: Map<string, string>, references: Map<string, string>) {
  if (references.size === 0) throw new Error("Parity population is empty");
  if (before.size !== references.size || after.size !== references.size) throw new Error("Parity population size differs");
  const totals = { before: [0, 0], after: [0, 0] };
  const changes: { word: string; before: string; after: string; references: string[]; beforeCorrect: boolean[]; afterCorrect: boolean[] }[] = [];
  for (const [word, raw] of references) {
    const a = before.get(word), b = after.get(word);
    if (a === undefined || b === undefined) throw new Error(`Parity population differs at ${word}`);
    const refs: unknown = JSON.parse(raw);
    if (!Array.isArray(refs) || refs.length === 0 || refs.some(x => typeof x !== "string" || !x)) throw new Error(`Invalid references for ${word}`);
    const score = (p: string): boolean[] => [refs.some(r => strip(p) === strip(r)), refs.some(r => levenshtein.get(canon(p), canon(r)) <= 1)];
    const x = score(a), y = score(b);
    for (let i = 0; i < 2; i++) { totals.before[i] += Number(x[i]); totals.after[i] += Number(y[i]); }
    if (a !== b) changes.push({ word, before: a, after: b, references: refs, beforeCorrect: x, afterCorrect: y });
  }
  return { words: references.size, ...totals, changes };
}

if (require.main === module) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "freeze" && (args.length === 1 || args.length === 2 && ["--v3", "--v4"].includes(args[1]))) {
    const raw: unknown = JSON.parse(readFileSync(join(__dirname, "../data/en/dict.json"), "utf8"));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid parity dictionary");
    const dict: Record<string, string> = {};
    for (const [word, ipa] of Object.entries(raw)) {
      if (typeof ipa !== "string") throw new Error(`Invalid dictionary reference: ${word}`);
      dict[word] = ipa;
    }
    for (const word of Object.keys(parityReference.corrections)) parityReferences(word, dict[word] ?? "");
    const reference = args[1] === "--v4" ? parityReferencesV4 : args[1] === "--v3" ? parityReferencesV3 : parityReferences;
    if (args[1] === "--v3" || args[1] === "--v4") for (const word of Object.keys(diagnosticReference.variants)) reference(word, dict[word] ?? "");
    if (args[1] === "--v4") for (const word of Object.keys(diagnosticReferenceV4.variants)) reference(word, dict[word] ?? "");
    const rows = Object.entries(dict).filter(([word]) => /^[a-z]+$/.test(word)).map(([word, ipa]) => `${word}\t${JSON.stringify(reference(word, ipa))}`).join("\n") + "\n";
    writeFileSync(args[0], rows, { flag: "wx" });
    console.log(JSON.stringify({
      words: parseRows(rows).size,
      sha256: hash(rows),
      dictionarySha256: hash(readFileSync(join(__dirname, "../data/en/dict.json"), "utf8")),
      referenceVersion: args[1] === "--v4" ? diagnosticReferenceV4.version : args[1] === "--v3" ? diagnosticReference.version : parityReference.version,
      v2ManifestSha256: hash(JSON.stringify(parityReference)),
      ...(args[1] === "--v3" || args[1] === "--v4" ? { v3ManifestSha256: hash(JSON.stringify(diagnosticReference)) } : {}),
      ...(args[1] === "--v4" ? { v4ManifestSha256: hash(JSON.stringify(diagnosticReferenceV4)) } : {}),
      scorerSha256: hash(readFileSync(__filename, "utf8")),
      referenceImplementationSha256: hash(readFileSync(join(__dirname, "parity-references.ts"), "utf8")),
    }));
  } else if (mode === "compare" && args.length === 4) {
    const [referencePath, expectedHash, beforePath, afterPath] = args;
    const reference = readFileSync(referencePath, "utf8");
    if (hash(reference) !== expectedHash) throw new Error("Frozen parity reference hash differs");
    const result = compareParity(parseRows(readFileSync(beforePath, "utf8")), parseRows(readFileSync(afterPath, "utf8")), parseRows(reference));
    console.log(JSON.stringify({ referenceSha256: expectedHash, ...result }, null, 2));
    if (result.after.some((n, i) => n < result.before[i])) process.exitCode = 1;
  } else throw new Error("usage: parity-snapshot freeze <reference.tsv> [--v3|--v4] | compare <reference.tsv> <sha256> <before.tsv> <after.tsv>");
}
