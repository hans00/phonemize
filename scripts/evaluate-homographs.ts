/**
 * Heteronym benchmark: Google's WikipediaHomographData (Gorman et al. 2018,
 * Apache-2.0) — 162 English homographs, Wikipedia sentences, each target
 * labelled by three annotators with the reading it takes in that sentence.
 * This measures the one thing the dict-parity and top-5000 benchmarks cannot:
 * whether the shipped pipeline picks the right reading IN CONTEXT.
 *
 * yarn test:homographs --download          # fetch pinned, hash-checked data
 * yarn test:homographs                     # score eval split + delta vs baseline
 * yarn test:homographs --split train       # diagnose on train (never tune on eval)
 * yarn test:homographs --update-baseline   # after a confirmed improvement
 *
 * A prediction is mapped to the nearest labelled reading of that homograph
 * (segments + primary-stress syllable), so transcription conventions never
 * decide the score — only which reading was chosen. A tie between readings
 * counts as wrong.
 */
import { createHash } from "crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

const source: { repo: string; commit: string; license: string; contentSha256: string } =
  JSON.parse(readFileSync(join(__dirname, "homograph-sources.json"), "utf8"));
const CACHE = resolve(process.env.HOMOGRAPH_BENCHMARK_DIR ?? "scripts/.homograph-cache");
const BASELINE_PATH = join(__dirname, "homograph-baseline.json");
const argv = process.argv.slice(2);
const splitAt = argv.indexOf("--split");
const split = splitAt >= 0 ? argv[splitAt + 1] : "eval";
if (split !== "eval" && split !== "train") throw new Error(`--split must be eval or train, got ${split}`);

// Stable content hash over every data file: path, NUL, bytes, NUL — sorted by path.
function contentHash(files: Array<[string, Buffer]>): string {
  const h = createHash("sha256");
  for (const [path, bytes] of [...files].sort((a, b) => (a[0] < b[0] ? -1 : 1))) h.update(path).update("\0").update(bytes).update("\0");
  return h.digest("hex");
}

function listCached(): Array<[string, Buffer]> {
  const out: Array<[string, Buffer]> = [];
  const walk = (rel: string) => {
    for (const e of readdirSync(join(CACHE, rel), { withFileTypes: true })) {
      const p = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p);
      else if (p.endsWith(".tsv")) out.push([p, readFileSync(join(CACHE, p))]);
    }
  };
  walk("");
  return out;
}

async function download(): Promise<void> {
  const tree = await fetch(`https://api.github.com/repos/${source.repo}/git/trees/${source.commit}?recursive=1`);
  if (!tree.ok) throw new Error(`Tree listing failed: ${tree.status}`);
  const paths: string[] = (await tree.json()).tree
    .filter((t: { type: string; path: string }) => t.type === "blob" && t.path.startsWith("data/") && t.path.endsWith(".tsv"))
    .map((t: { path: string }) => t.path.slice("data/".length));
  const files: Array<[string, Buffer]> = [];
  for (let i = 0; i < paths.length; i += 16) {
    await Promise.all(paths.slice(i, i + 16).map(async (p) => {
      const res = await fetch(`https://raw.githubusercontent.com/${source.repo}/${source.commit}/data/${p}`);
      if (!res.ok) throw new Error(`Download failed: ${res.status} ${p}`);
      files.push([p, Buffer.from(await res.arrayBuffer())]);
    }));
  }
  const got = contentHash(files);
  if (got !== source.contentSha256) throw new Error(`Source checksum mismatch (downloaded data): got ${got}`);
  for (const [p, bytes] of files) {
    mkdirSync(join(CACHE, p, ".."), { recursive: true });
    writeFileSync(join(CACHE, p), bytes);
  }
}

// Quoted TSV: every field is "…" with embedded quotes doubled.
function parseTsv(text: string): string[][] {
  return text.split(/\r?\n/).filter(Boolean).slice(1)
    .map((line) => line.split("\t").map((f) => f.replace(/^"|"$/g, "").replace(/""/g, '"')));
}

// Segments with notation-only differences removed, plus which nucleus carries
// primary stress. The source writes stress as an ASCII apostrophe, affricates as
// ligatures, and has stray digits in a few transcriptions.
const NUCLEUS = /aɪ|aʊ|ɔɪ|eɪ|oʊ|[aeiouæɑɔəɛɪʊʌɝ]/g;
function reading(ipa: string): { seg: string; stress: number } {
  const s = ipa.replace(/'/g, "ˈ").replace(/ʤ/g, "dʒ").replace(/ʧ/g, "tʃ").replace(/\d/g, "").replace(/ɫ/g, "l").replace(/ɚ/g, "ɝ").replace(/r/g, "ɹ").replace(/g/g, "ɡ")
    .replace(/ʌ/g, "ə").replace(/[ˌː\s]/g, "");
  const mark = s.indexOf("ˈ");
  const seg = s.replace(/ˈ/g, "");
  const nuclei = [...seg.matchAll(NUCLEUS)];
  return { seg, stress: mark < 0 || nuclei.length < 2 ? -1 : nuclei.findIndex((m) => m.index! >= mark) };
}
// Reduced-vowel quality (ə~ɪ) and tense/lax before r (i~ɪ) cost half a segment;
// a different primary-stress syllable costs one and a half — it is what tells
// most noun/verb pairs apart, so it must outweigh vowel-quality noise.
const CHEAP = new Set(["əɪ", "ɪə", "iɪ", "ɪi", "uʊ", "ʊu"]);
function lev(a: string, b: string): number {
  const x = [...a], y = [...b];
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      const sub = x[i - 1] === y[j - 1] ? 0 : CHEAP.has(x[i - 1] + y[j - 1]) ? 0.5 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + sub);
    }
    prev = cur;
  }
  return prev[y.length];
}
function nearest(predicted: string, readings: Map<string, string>): string {
  const p = reading(predicted);
  const scored = [...readings].map(([wordid, ipa]) => {
    const r = reading(ipa);
    return { wordid, d: lev(p.seg, r.seg) + (p.stress >= 0 && r.stress >= 0 && p.stress !== r.stress ? 1.5 : 0) };
  }).sort((a, b) => a.d - b.d);
  return scored.length > 1 && scored[0].d === scored[1].d ? "(tie)" : scored[0].wordid;
}

async function main() {
  if (argv.includes("--download")) await download();
  if (!existsSync(join(CACHE, "wordids.tsv"))) throw new Error(`Missing ${CACHE}; run with --download first`);
  const files = listCached();
  if (contentHash(files) !== source.contentSha256) throw new Error(`Source checksum mismatch: ${CACHE}`);
  const byPath = new Map(files);

  const readings = new Map<string, Map<string, string>>();
  for (const [homograph, wordid, , pron] of parseTsv(byPath.get("wordids.tsv")!.toString("utf8"))) {
    if (!readings.has(homograph)) readings.set(homograph, new Map());
    readings.get(homograph)!.set(wordid, pron);
  }
  // Majority reading per homograph on TRAIN: the floor any context model must beat.
  const majority = new Map<string, string>();
  for (const [p, bytes] of files) {
    if (!p.startsWith("train/")) continue;
    const counts = new Map<string, number>();
    for (const [, wordid] of parseTsv(bytes.toString("utf8"))) counts.set(wordid, (counts.get(wordid) ?? 0) + 1);
    const [h] = parseTsv(bytes.toString("utf8"))[0];
    majority.set(h, [...counts].sort((a, b) => b[1] - a[1])[0][0]);
  }

  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
  const rows: Array<{ homograph: string; gold: string; predicted: string; ipa: string; sentence: string }> = [];
  for (const [p, bytes] of files) {
    if (!p.startsWith(`${split}/`)) continue;
    for (const [homograph, gold, sentence, start, end] of parseTsv(bytes.toString("utf8"))) {
      const buf = Buffer.from(sentence, "utf8");
      const surface = buf.subarray(Number(start), Number(end)).toString("utf8");
      if (surface.toLowerCase() !== homograph) throw new Error(`Offset mismatch in ${p}: "${surface}" ≠ ${homograph}`);
      // Which occurrence of the word is the target, then the same occurrence among output tokens.
      const before = buf.subarray(0, Number(start)).toString("utf8");
      const esc = homograph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nth = (before.match(new RegExp(`(?<![\\p{L}'])${esc}(?![\\p{L}'])`, "giu")) ?? []).length;
      const tokens = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true }) as Array<{ word: string; phoneme: string }>;
      const hit = tokens.filter((t) => t.word.toLowerCase() === homograph)[nth];
      const ipa = hit?.phoneme.trim() ?? "";
      rows.push({ homograph, gold, sentence, ipa, predicted: ipa ? nearest(ipa, readings.get(homograph)!) : "(missing)" });
    }
  }

  const acc = (xs: typeof rows) => (xs.length ? (100 * xs.filter((r) => r.predicted === r.gold).length) / xs.length : 0);
  const accuracy = acc(rows);
  const majorityAcc = (100 * rows.filter((r) => majority.get(r.homograph) === r.gold).length) / rows.length;
  const perWord = [...new Set(rows.map((r) => r.homograph))].map((h) => {
    const xs = rows.filter((r) => r.homograph === h);
    return { homograph: h, n: xs.length, accuracy: acc(xs), majority: (100 * xs.filter((r) => majority.get(h) === r.gold).length) / xs.length };
  });
  const macro = perWord.reduce((a, w) => a + w.accuracy, 0) / perWord.length;
  const missing = rows.filter((r) => r.predicted === "(missing)").length;
  const ties = rows.filter((r) => r.predicted === "(tie)").length;

  const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")) : null;
  const delta = (now: number, was?: number) => (was === undefined ? "" : ` (${now - was >= 0 ? "+" : ""}${(now - was).toFixed(2)} vs baseline)`);
  console.log(`WikipediaHomographData @ ${source.commit.slice(0, 7)} — ${split} split, shipped pipeline (en-US)`);
  console.log(`Accuracy (micro):          ${accuracy.toFixed(2)}%  ${rows.filter((r) => r.predicted === r.gold).length}/${rows.length}${split === "eval" ? delta(accuracy, baseline?.eval) : ""}`);
  console.log(`Accuracy (macro, per word): ${macro.toFixed(2)}%  over ${perWord.length} homographs${split === "eval" ? delta(macro, baseline?.evalMacro) : ""}`);
  console.log(`Majority-reading floor:     ${majorityAcc.toFixed(2)}%  (always the most frequent train reading)`);
  console.log(`Unaligned: ${missing}; ties between readings: ${ties} (both count as wrong)`);
  console.log(`\nWorst homographs (${split}):`);
  for (const w of [...perWord].sort((a, b) => a.accuracy - b.accuracy || b.n - a.n).slice(0, 15))
    console.log(`  ${w.homograph.padEnd(14)} ${w.accuracy.toFixed(0).padStart(3)}%  (floor ${w.majority.toFixed(0)}%, n=${w.n})`);

  mkdirSync(CACHE, { recursive: true });
  const reportPath = join(CACHE, `${split}-report.json`);
  writeFileSync(reportPath, JSON.stringify({ metric: "wiki-homograph-v1", source, split, accuracy, macro, majorityAcc, perWord,
    failures: rows.filter((r) => r.predicted !== r.gold) }, null, 2) + "\n");
  console.log(`\nFailures: ${reportPath}`);

  if (split !== "eval") return;
  if (argv.includes("--update-baseline")) {
    writeFileSync(BASELINE_PATH, JSON.stringify({ date: new Date().toLocaleDateString("sv-SE"), sentences: rows.length, eval: accuracy, evalMacro: macro }, null, 2) + "\n");
    console.log(`Baseline updated: ${BASELINE_PATH}`);
  } else if (baseline && accuracy < baseline.eval) {
    console.error("Homograph accuracy fell below baseline.");
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
