import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import EnglishG2P from "../src/en/g2p";
import { parityReferences, parityReferencesV4 } from "./parity-references";
import { compareParity } from "./parity-snapshot";
import baseline = require("./parity-baseline-v2.json");
import manifest = require("./parity-reference-historical-v5.json");
import manifestV6 = require("./parity-reference-historical-v6.json");

const hash = (data: Buffer | string): string => createHash("sha256").update(data).digest("hex");
const SCORER_SHA256 = "3ce6c8b45970ed30b534f8027be15b62fe62888b842044a356af0b459f493f2c";
const V2_BASELINE_SHA256 = "2e3f400bbc90e2463e4882807101f5cb3e7575ea53e9d75a132b38b27397fc8b";
type Variant = { from: string; to: string; source: string };

export function historicalV5References(word: string, original: string, variants: Record<string, Variant> = manifest.variants): string[] {
  const existing = parityReferencesV4(word, original);
  if (!Object.prototype.hasOwnProperty.call(variants, word)) return existing;
  const { from, to, source } = variants[word];
  if (original !== from || !to || !source.startsWith("https://")) throw new Error(`Historical v5 reference mismatch: ${word}`);
  return [...new Set([...existing, to])];
}

/**
 * Historical v6 corrects the one known false plural reference in v5.
 * All other v5 variants remain sourced alternatives. This is a reference
 * migration over the same frozen population, not a runtime pronunciation
 * change or a new baseline measured from current predictions.
 */
export function historicalV6References(
  word: string,
  original: string,
  variants: Record<string, Variant> = manifest.variants,
  replacement: Variant = manifestV6.hurricaneReplacement,
): string[] {
  const withoutHurricane = { ...variants };
  delete withoutHurricane.hurricane;
  const references = historicalV5References(word, original, withoutHurricane);
  if (word !== "hurricane") return references;
  const { from, to, source } = replacement;
  if (original !== from || !to || !source.startsWith("https://") || !references.includes(from))
    throw new Error(`Historical v6 replacement mismatch: ${word}`);
  return [...new Set(references.filter((ipa) => ipa !== from).concat(to))];
}

function verifiedInput(path: string, expected: string): Buffer {
  const data = readFileSync(path);
  if (hash(data) !== expected) throw new Error(`Historical input hash mismatch: ${path}`);
  return data;
}

if (require.main === module) {
  const [dictPath, snapshotPath, outputPath] = process.argv.slice(2);
  if (!dictPath || !snapshotPath || !outputPath || process.argv.length !== 5)
    throw new Error("usage: evaluate-parity-historical-v5 <historical-dict.json> <frozen-snapshot.tsv> <report.json>");
  if (hash(readFileSync(join(__dirname, "parity-snapshot.ts"))) !== SCORER_SHA256) throw new Error("Historical parity scorer changed");
  if (hash(readFileSync(join(__dirname, "parity-baseline-v2.json"))) !== V2_BASELINE_SHA256) throw new Error("Historical v2 baseline changed");
  const dictionary: Record<string, string> = JSON.parse(verifiedInput(dictPath, manifest.baseDictionarySha256).toString("utf8"));
  const snapshot = verifiedInput(snapshotPath, manifest.frozenSnapshotSha256).toString("utf8");
  const v2 = new Map<string, string>(), v5 = new Map<string, string>(), frozen = new Map<string, string>();
  for (const [word, ipa] of Object.entries(dictionary)) {
    if (!/^[a-z]+$/.test(word)) continue;
    v2.set(word, JSON.stringify(parityReferences(word, ipa)));
    v5.set(word, JSON.stringify(historicalV5References(word, ipa)));
  }
  for (const line of snapshot.split("\n")) {
    const fields = line.split("\t");
    if (fields.length !== 3 || fields[0] !== "dict" || !v2.has(fields[1])) continue;
    if (frozen.has(fields[1])) throw new Error(`Duplicate frozen word: ${fields[1]}`);
    frozen.set(fields[1], fields[2]);
  }
  for (const word of Object.keys(manifest.variants)) if (!v2.has(word)) throw new Error(`Missing v5 reference: ${word}`);
  const original = compareParity(frozen, frozen, v2);
  if (original.words !== baseline.words || original.before[0] !== baseline.strictCorrect || original.before[1] !== baseline.lenientCorrect)
    throw new Error("Recovered predictions do not reproduce the historical v2 floor");
  const g2p = new EnglishG2P(), current = new Map<string, string>();
  for (const word of v2.keys()) current.set(word, g2p.predict(word, "en") ?? "");
  const historicalV2 = compareParity(frozen, current, v2);
  const comparison = compareParity(frozen, current, v5);
  const references = [...v5].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  if (hash(JSON.stringify(references)) !== manifest.referenceSha256) throw new Error("Historical v5 references changed");
  const report = {
    referenceVersion: manifest.version, status: manifest.status,
    referenceSha256: hash(JSON.stringify(references)), manifestSha256: hash(JSON.stringify(manifest)),
    snapshotSha256: manifest.frozenSnapshotSha256, dictionarySha256: manifest.baseDictionarySha256,
    scorerSha256: SCORER_SHA256, v2BaselineSha256: V2_BASELINE_SHA256,
    originalV2: original.before, currentV2: historicalV2.after, ...comparison,
  };
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ words: comparison.words, originalV2: original.before, frozenV5: comparison.before, currentV5: comparison.after, referenceSha256: report.referenceSha256 }));
}
