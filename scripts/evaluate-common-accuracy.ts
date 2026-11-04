/**
 * Fixed top-5,000 English frequency benchmark against all CMUdict variants,
 * plus independently verified Cambridge US variants in the versioned reference contract.
 * This is segment-match accuracy, not a stress/context or held-out score.
 * Missing references remain in the denominator and never count as correct.
 *
 * yarn test:common-accuracy --download   # fetch pinned, hash-checked inputs
 * yarn test:common-accuracy              # offline, default public API
 * yarn test:common-accuracy --rules      # public API with disableDict=true
 */
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";
import sources = require("./common-accuracy-sources.json");
import referenceV6 = require("./common-accuracy-reference-v7.json");
import baselineV6 = require("./common-accuracy-baseline-v7.json");

// Independent reference conversion: do not share the runtime converter or
// phonotactics, since their bugs must remain visible to this benchmark.
export const PHONES: Record<string, string> = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ",
  B: "b", CH: "tʃ", D: "d", DH: "ð", EH: "ɛ", ER: "ɝ",
  EY: "eɪ", F: "f", G: "ɡ", HH: "h", IH: "ɪ", IY: "i",
  JH: "dʒ", K: "k", L: "l", M: "m", N: "n", NG: "ŋ",
  OW: "oʊ", OY: "ɔɪ", P: "p", R: "ɹ", S: "s", SH: "ʃ",
  T: "t", TH: "θ", UH: "ʊ", UW: "u", V: "v", W: "w",
  Y: "j", Z: "z", ZH: "ʒ",
};

export function normalizeSegments(ipa: string): string {
  return ipa.replace(/[ˈˌː\s]/g, "").replace(/ɫ/g, "l").replace(/g/g, "ɡ");
}

export function parseCmu(text: string): Map<string, string[]> {
  const entries = new Map<string, string[]>();
  for (const line of text.split(/\r?\n/)) {
    const content = line.split("#")[0].trim();
    if (!content || content.startsWith(";;;")) continue;
    const [head, ...phones] = content.split(/\s+/);
    if (!phones.length) throw new Error(`Missing pronunciation: ${head}`);
    const word = head.replace(/\(\d+\)$/, "").toLowerCase();
    const ipa = phones.map((phone) => {
      if (phone === "AH0") return "ə";
      const symbol = PHONES[phone.replace(/[012]$/, "")];
      if (!symbol) throw new Error(`Unknown CMU phone ${phone} in ${word}`);
      return symbol;
    }).join("");
    const variants = entries.get(word) ?? [];
    if (!variants.includes(ipa)) variants.push(ipa);
    entries.set(word, variants);
  }
  return entries;
}

export function applyReferenceCorrections(
  reference: Map<string, string[]>,
  corrections: Partial<Record<string, { retain: string[]; add: string[]; source: string }>> = referenceV6.corrections,
): Map<string, string[]> {
  const corrected = new Map([...reference].map(([word, variants]) => [word, [...variants]]));
  for (const [word, correction] of Object.entries(corrections)) {
    if (!correction) throw new Error(`Invalid reference correction: ${word}`);
    const variants = corrected.get(word);
    if (!variants || !correction.retain.every(ipa => variants.includes(ipa)))
      throw new Error(`Reference correction does not match pinned CMU entry: ${word}`);
    if (correction.add.some(ipa => !ipa || variants.includes(ipa)))
      throw new Error(`Invalid or duplicate accepted variant for ${word}`);
    variants.push(...correction.add);
  }
  return corrected;
}

if (baselineV6.metric !== referenceV6.version ||
    baselineV6.frequencySha256 !== sources.frequency.sha256 ||
    baselineV6.cmudictSha256 !== sources.reference.sha256 ||
    baselineV6.referenceCorrections !== "common-accuracy-reference-v7.json" ||
    createHash("sha256").update(JSON.stringify(referenceV6)).digest("hex") !== baselineV6.referenceCorrectionsSha256)
  throw new Error("Common API accuracy baseline does not match its pinned source contract");

export function scoreWords(
  words: string[],
  reference: Map<string, string[]>,
  predict: (word: string) => string,
) {
  const results = words.map((word, i) => {
    const expected = reference.get(word) ?? [];
    const predicted = predict(word);
    return {
      rank: i + 1, word, predicted, expected,
      status: !expected.length ? "missing" :
        expected.some((ipa) => normalizeSegments(ipa) === normalizeSegments(predicted))
          ? "correct" : "mismatch",
    };
  });
  const correct = results.filter((r) => r.status === "correct").length;
  const missing = results.filter((r) => r.status === "missing").length;
  return {
    total: words.length, correct, missing,
    mismatches: words.length - correct - missing,
    accuracy: words.length ? 100 * correct / words.length : 0,
    results,
  };
}

async function main() {
  const cache = resolve(process.env.COMMON_BENCHMARK_DIR ?? "scripts/.common-accuracy-cache");
  const download = process.argv.includes("--download");
  const disableDict = process.argv.includes("--rules");
  const inputs: string[] = [];
  for (const source of [sources.frequency, sources.reference]) {
    const path = join(cache, source.file);
    if (!existsSync(path)) {
      if (!download) throw new Error(`Missing ${path}; run with --download first`);
      const response = await fetch(source.url);
      if (!response.ok) throw new Error(`Download failed: ${response.status} ${source.url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (createHash("sha256").update(bytes).digest("hex") !== source.sha256)
        throw new Error(`Source checksum mismatch: ${source.url}`);
      mkdirSync(cache, { recursive: true });
      writeFileSync(path, bytes);
    }
    const bytes = readFileSync(path);
    if (createHash("sha256").update(bytes).digest("hex") !== source.sha256)
      throw new Error(`Source checksum mismatch: ${path}`);
    inputs.push(bytes.toString("utf8"));
  }

  // Take ranks BEFORE consulting pronunciation coverage. Do not remove hard
  // words, initials, abbreviations, or missing references to raise the score.
  // US spelling conversion introduced duplicates (color/favorite/etc.).
  // Deduplicate in rank order so each word receives exactly one vote.
  const words = [...new Set(inputs[0].trim().split(/\s+/))].slice(0, 5000);
  if (words.length !== 5000 || new Set(words).size !== 5000)
    throw new Error("Expected exactly 5,000 unique ranked items");
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const cmu = parseCmu(inputs[1]);
  if (words.length !== referenceV6.population) throw new Error("Reference version population mismatch");
  const report = scoreWords(words, applyReferenceCorrections(cmu, referenceV6.corrections), (word) => phonemizer.toIPA(word, "en-US"));
  const output = join(cache, disableDict ? "rules-report.json" : "default-report.json");
  writeFileSync(output, JSON.stringify({
    metric: referenceV6.version, sources, referenceCorrections: referenceV6.corrections,
    mode: disableDict ? "disableDict" : "default", ...report,
  }, null, 2) + "\n");
  console.log(`Mode: ${disableDict ? "disableDict" : "default"}; public toIPA API, en-US`);
  console.log(`Segment accuracy: ${report.correct}/${report.total} = ${report.accuracy.toFixed(2)}%`);
  console.log(`Mismatches: ${report.mismatches}; missing references (not correct): ${report.missing}`);
  console.log(`Report: ${output}`);
  const baselineCorrect = disableDict ? baselineV6.rules.correct : baselineV6.default.correct;
  console.log(`No-regression baseline: ${baselineCorrect}/${report.total} (${report.correct >= baselineCorrect ? "PASS" : "FAIL"})`);
  if (report.correct < baselineCorrect) process.exitCode = 1;
  console.log(`90% gate: ${report.accuracy >= 90 ? "PASS" : "FAIL"}`);
  if (report.accuracy < 90) process.exitCode = 1;
}

if (require.main === module) main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
