/**
 * Runtime parity gate.
 *
 * `scripts/evaluate.ts` scores the rule path alone (disableDict=true).
 * Users never see that path in isolation: the shipped pipeline is
 * exceptions table + morphology + fallbacks + rules, and both bugs
 * reported against v2.0.x (#27 wind/solutions, #28 Seann) lived in that
 * composition, not in the rules. This script scores what ships — the
 * default EnglishG2P over every dict word — so a change to the table
 * miner, a lookup fallback or a morphology handler is measured where it
 * lands.
 *
 *   yarn test:parity                    # score + delta vs baseline
 *   yarn test:parity --update-baseline  # after a confirmed improvement
 *   yarn test:parity --dump <file>      # word\tipa lines, for diffing
 *
 * Strict = exact after stripping stress. Lenient = evaluate.ts's
 * definition (similar-phoneme canonicalization, Levenshtein ≤ 1) so the
 * two scripts are comparable. Strict is the number the goal in AGENTS.md
 * tracks.
 */
import EnglishG2P from "../src/en/g2p";
import dictionary from "../data/en/dict.json";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import levenshtein from "fast-levenshtein";

const BASELINE_PATH = join(__dirname, "parity-baseline.json");

interface Baseline {
  date: string;
  words: number;
  strictAccuracy: number;
  lenientAccuracy: number;
}

const SIMILAR_PHONEME_GROUPS: string[][] = [
  ["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"],
];
const strip = (s: string): string => s.replace(/[ˈˌ]/g, "");
function canon(s: string): string {
  let out = strip(s);
  for (const group of SIMILAR_PHONEME_GROUPS) {
    for (let i = 1; i < group.length; i++) out = out.split(group[i]).join(group[0]);
  }
  return out;
}

const argv = process.argv.slice(2);
const updateBaseline = argv.includes("--update-baseline") || argv.includes("-u");
const dumpAt = argv.indexOf("--dump");
const dumpPath = dumpAt >= 0 ? argv[dumpAt + 1] : undefined;

const dict = dictionary as Record<string, string>;
const g2p = new EnglishG2P();
let words = 0;
let strict = 0;
let lenient = 0;
const lines: string[] = [];
for (const word of Object.keys(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  words++;
  const predicted = g2p.predict(word, "en") ?? "";
  if (strip(predicted) === strip(dict[word])) strict++;
  if (levenshtein.get(canon(predicted), canon(dict[word])) <= 1) lenient++;
  if (dumpPath) lines.push(`${word}\t${predicted}`);
}
if (dumpPath) writeFileSync(dumpPath, lines.join("\n") + "\n");

const pct = (n: number): number => (n / words) * 100;
const result: Baseline = {
  date: new Date().toISOString().slice(0, 10),
  words,
  strictAccuracy: pct(strict),
  lenientAccuracy: pct(lenient),
};

const baseline: Baseline | null = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
  : null;
const delta = (now: number, was?: number): string => {
  if (was === undefined) return "";
  const d = now - was;
  const arrow = d > 0 ? "↑" : d < 0 ? "↓" : "=";
  return `  (${d >= 0 ? "+" : ""}${d.toFixed(2)} ${arrow})`;
};

console.log("--- Runtime parity (default EnglishG2P vs data/en/dict.json) ---");
if (baseline) console.log(`    baseline: ${baseline.date}`);
console.log(`Words evaluated: ${words}`);
console.log(`Strict  (stress-stripped exact): ${result.strictAccuracy.toFixed(2)}%${delta(result.strictAccuracy, baseline?.strictAccuracy)}`);
console.log(`Lenient (similar-phoneme canon): ${result.lenientAccuracy.toFixed(2)}%${delta(result.lenientAccuracy, baseline?.lenientAccuracy)}`);

if (updateBaseline) {
  writeFileSync(BASELINE_PATH, JSON.stringify(result, null, 2) + "\n");
  console.log(`Baseline updated: ${BASELINE_PATH}`);
} else if (baseline && result.strictAccuracy < baseline.strictAccuracy) {
  console.error("Strict parity fell below baseline.");
  process.exit(1);
}
