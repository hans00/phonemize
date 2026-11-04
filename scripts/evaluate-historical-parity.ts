import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { gunzipSync } from "zlib";
import EnglishG2P from "../src/en/g2p";
import { compareParity, parseRows } from "./parity-snapshot";
import baseline = require("./parity-baseline-v2.json");
import manifest = require("./parity-reference-v2.json");

const REFERENCE_SHA256 = "c103cff3fd8c4bda9cc42ebddcdc878850e1cb2a60f2834f19bae1f2899c1c11";
const SCORER_SHA256 = "3ce6c8b45970ed30b534f8027be15b62fe62888b842044a356af0b459f493f2c";
const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

export function historicalReferences(compressed: Buffer): Map<string, string> {
  const text = gunzipSync(compressed).toString("utf8");
  if (sha256(text) !== REFERENCE_SHA256) throw new Error("Historical parity references do not match their frozen hash");
  if (baseline.referenceVersion !== manifest.version || baseline.referenceSha256 !== sha256(JSON.stringify(manifest)))
    throw new Error("Historical parity baseline does not match its reference manifest");
  const references = parseRows(text);
  if (references.size !== baseline.words || references.size !== manifest.population)
    throw new Error("Historical parity population differs from its baseline");
  return references;
}

if (require.main === module) {
  if (sha256(readFileSync(join(__dirname, "parity-snapshot.ts"), "utf8")) !== SCORER_SHA256)
    throw new Error("Historical parity scorer changed; preserve the old scorer or version the comparison");
  const references = historicalReferences(readFileSync(join(__dirname, "parity-historical-v2.tsv.gz")));
  const g2p = new EnglishG2P();
  const predictions = new Map<string, string>();
  for (const word of references.keys()) predictions.set(word, g2p.predict(word, "en") ?? "");
  const result = compareParity(predictions, predictions, references);
  console.log(`Historical reconstructed parity: ${result.after[0]}/${result.words} strict; ${result.after[1]}/${result.words} lenient`);
  console.log(`Recorded v2 floor: ${baseline.strictCorrect} strict; ${baseline.lenientCorrect} lenient`);
  console.log("Diagnostic only: this reference reconstruction predates recovery of the original snapshot and differs from the recovered dictionary; it is not baseline migration.");
  if (result.after[0] < baseline.strictCorrect || result.after[1] < baseline.lenientCorrect) process.exitCode = 1;
}
