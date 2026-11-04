/**
 * Runtime parity gate over the frozen 100,816-word v6 cohort.
 *
 * The former live-dictionary gate compared 100,842 current words with a
 * 100,816-word v2 baseline and could not produce a valid delta. V6 preserves
 * the exact historical population, corrects the documented hurricane gold
 * error, and keeps the old v2 files unchanged for audit.
 */
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { gunzipSync, gzipSync } from "zlib";
import EnglishG2P from "../src/en/g2p";
import dictionary from "../data/en/dict.json";
import { compareParity, parseRows } from "./parity-snapshot";
import { parityReferences } from "./parity-references";
import { parityBeforeSnapshotRows, parityFellBelowBaseline, parityReferenceRowsSha256 } from "./parity-baseline-guard";
import manifest = require("./parity-reference-historical-v6.json");
import baseline = require("./parity-baseline-v6.json");
import oldBaseline = require("./parity-baseline-v2.json");
import v2Manifest = require("./parity-reference-v2.json");
import v3Manifest = require("./parity-reference-v3.json");
import v4Manifest = require("./parity-reference-v4.json");
import v5Manifest = require("./parity-reference-historical-v5.json");

const sha256 = (data: Buffer | string): string => createHash("sha256").update(data).digest("hex");
const REFERENCE_PATH = join(__dirname, "parity-historical-v6.tsv.gz");
const BASELINE_PATH = join(__dirname, "parity-baseline-v6.json");

function loadFrozenReferences(): Map<string, string> {
  const compressed = readFileSync(REFERENCE_PATH);
  if (sha256(compressed) !== manifest.rowsFileSha256)
    throw new Error("Historical v6 parity reference archive hash mismatch");
  const text = gunzipSync(compressed).toString("utf8");
  if (sha256(text) !== manifest.rowsSha256)
    throw new Error("Historical v6 parity reference rows hash mismatch");
  const rows = parseRows(text);
  if (rows.size !== manifest.population || rows.size !== baseline.words)
    throw new Error("Historical v6 parity population differs from its baseline");
  const parsed = [...rows].map(([word, raw]) => {
    const variants: unknown = JSON.parse(raw);
    if (!Array.isArray(variants) || variants.length === 0 || variants.some((x) => typeof x !== "string" || !x))
      throw new Error(`Invalid historical v6 references for ${word}`);
    return [word, variants as string[]] as const;
  });
  if (parityReferenceRowsSha256(parsed) !== manifest.referenceRowsSha256 ||
      baseline.referenceRowsSha256 !== manifest.referenceRowsSha256)
    throw new Error("Historical v6 reference contract hash mismatch");
  return rows;
}

function verifyMigrationProvenance(): void {
  const check = (name: string, value: unknown, expected: string): void => {
    if (sha256(JSON.stringify(value)) !== expected) throw new Error(`Historical v6 ${name} changed`);
  };
  if (sha256(readFileSync(join(__dirname, "parity-baseline-v2.json"))) !== manifest.historicalV2BaselineSha256)
    throw new Error("Historical v2 baseline changed");
  check("v2 reference manifest", v2Manifest, manifest.historicalV2ReferenceManifestSha256);
  check("v3 reference manifest", v3Manifest, manifest.v3ManifestSha256);
  check("v4 reference manifest", v4Manifest, manifest.v4ManifestSha256);
  check("v5 reference manifest", v5Manifest, manifest.v5ManifestSha256);
  if (baseline.referenceVersion !== manifest.version ||
      baseline.referenceRowsSha256 !== manifest.referenceRowsSha256 ||
      baseline.strictCorrect !== 94806 || baseline.lenientCorrect !== 100709)
    throw new Error("Historical v6 baseline does not match its migrated frozen floor");
}

const argv = process.argv.slice(2);
const updateBaseline = argv.includes("--update-baseline") || argv.includes("-u");
const dumpAt = argv.indexOf("--dump");
const dumpPath = dumpAt >= 0 ? argv[dumpAt + 1] : undefined;
const beforeAt = argv.indexOf("--before");
const beforePath = beforeAt >= 0 ? argv[beforeAt + 1] : undefined;
if (dumpAt >= 0 && (!dumpPath || dumpPath.startsWith("--"))) throw new Error("--dump requires a file path");
if (beforeAt >= 0 && (!beforePath || beforePath.startsWith("--"))) throw new Error("--before requires a frozen prediction TSV");
if (updateBaseline && !dumpPath) throw new Error("Updating parity requires --dump to retain the measured predictions");

verifyMigrationProvenance();
const references = loadFrozenReferences();
const g2p = new EnglishG2P();
const predictions = new Map<string, string>();
const dumpRows: string[] = [];
for (const word of references.keys()) {
  const predicted = g2p.predict(word, "en") ?? "";
  predictions.set(word, predicted);
  dumpRows.push(`${word}\t${predicted}`);
}
if (dumpPath) writeFileSync(dumpPath, dumpRows.join("\n") + "\n");

const current = compareParity(predictions, predictions, references).after;
let before: number[] | undefined;
if (beforePath) {
  const beforeText = readFileSync(beforePath, "utf8");
  const frozenRows = parityBeforeSnapshotRows(beforeText);
  const frozen = parseRows(frozenRows);
  const cohort = new Map<string, string>();
  for (const word of references.keys()) {
    const ipa = frozen.get(word);
    if (ipa === undefined) throw new Error(`Before-run snapshot is missing frozen cohort word: ${word}`);
    cohort.set(word, ipa);
  }
  before = compareParity(cohort, cohort, references).after;
}
const total = references.size;
const liveDictionary = dictionary as Record<string, string>;
const liveReferences = new Map<string, string>();
const livePredictions = new Map<string, string>();
for (const [word, ipa] of Object.entries(liveDictionary)) {
  if (!/^[a-z]+$/.test(word)) continue;
  liveReferences.set(word, JSON.stringify(parityReferences(word, ipa)));
  livePredictions.set(word, g2p.predict(word, "en") ?? "");
}
const live = compareParity(livePredictions, livePredictions, liveReferences).after;
const currentOnlyWords = [...liveReferences.keys()].filter((word) => !references.has(word));

console.log(`--- Runtime parity (fixed ${manifest.version} reference cohort) ---`);
console.log(`Words evaluated: ${total}`);
console.log(`Strict  (stress-stripped exact): ${current[0]}/${total} = ${(100 * current[0] / total).toFixed(2)}% (baseline ${baseline.strictCorrect})`);
console.log(`Lenient (similar-phoneme canon): ${current[1]}/${total} = ${(100 * current[1] / total).toFixed(2)}% (baseline ${baseline.lenientCorrect})`);
if (before) console.log(`Before-run snapshot: ${before[0]}/${total} strict; ${before[1]}/${total} lenient`);
console.log(`Historical v2 baseline preserved: ${oldBaseline.strictCorrect}/${oldBaseline.words} strict; ${oldBaseline.lenientCorrect}/${oldBaseline.words} lenient`);
console.log(`Live dictionary diagnostic only: ${live[0]}/${liveReferences.size} strict; ${live[1]}/${liveReferences.size} lenient; ${currentOnlyWords.length} words are outside the frozen v6 cohort`);

const fell = parityFellBelowBaseline(
  { strictCorrect: current[0], lenientCorrect: current[1] },
  { strictCorrect: baseline.strictCorrect, lenientCorrect: baseline.lenientCorrect },
);
const fellBefore = before !== undefined && current.some((n, i) => n < before![i]);
if (fell || fellBefore) {
  console.error(fell ? "Runtime parity fell below the migrated v6 frozen floor." : "Runtime parity regressed against the supplied before-run snapshot.");
  process.exitCode = 1;
}

if (updateBaseline) {
  if (fell) throw new Error("Cannot update a parity baseline below its frozen floor");
  const snapshot = Buffer.from(dumpRows.join("\n") + "\n");
  const snapshotSha256 = sha256(snapshot);
  const cacheDir = join(__dirname, ".prediction-cache");
  mkdirSync(cacheDir, { recursive: true });
  const archive = join(cacheDir, `parity-${snapshotSha256}.tsv.gz`);
  if (!existsSync(archive)) writeFileSync(archive, gzipSync(snapshot), { flag: "wx" });
  if (!gunzipSync(readFileSync(archive)).equals(snapshot)) throw new Error("Archived parity predictions do not match the measured snapshot");
  const priorProvenance = baseline.provenance ?? {};
  writeFileSync(BASELINE_PATH, JSON.stringify({
    ...baseline, date: new Date().toISOString().slice(0, 10), strictCorrect: current[0], lenientCorrect: current[1],
    strictAccuracy: 100 * current[0] / total, lenientAccuracy: 100 * current[1] / total,
    provenance: { ...priorProvenance, snapshotSha256, snapshot: archive },
  }, null, 2) + "\n");
  console.log(`Baseline updated: ${BASELINE_PATH}`);
}
