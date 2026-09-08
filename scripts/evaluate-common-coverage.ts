/**
 * Check whether sentence evaluation data covers common vocabulary.
 *
 * The frequency lists are intentionally external: they are a corpus-stratum
 * definition, not pronunciation gold. Each file is one ranked word per line;
 * the first line may be a language header. Example:
 *
 *   FREQ_DIR=/tmp/phonemize-frequency yarn test:common-coverage
 *   FREQ_DIR=/tmp/phonemize-frequency MIN_COVERAGE=80 yarn test:common-coverage
 */
import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

const DATA_DIR = resolve(process.env.DATA_DIR ?? join(__dirname, "eval-data"));
const FREQ_DIR = resolve(process.env.FREQ_DIR ?? join(__dirname, "eval-frequency"));
const TOP_N = Number.parseInt(process.env.TOP_N ?? "5000", 10);
const MIN_COVERAGE = process.env.MIN_COVERAGE
  ? Number.parseFloat(process.env.MIN_COVERAGE)
  : undefined;

interface LanguageConfig {
  frequencyFile: string;
  script: RegExp;
}

const LANGUAGES: Record<string, LanguageConfig> = {
  en: { frequencyFile: "en.txt", script: /^[a-z]+(?:['-][a-z]+)*$/i },
  zh: { frequencyFile: "zh-CN.txt", script: /^[\u3400-\u9fff]+$/ },
  ja: { frequencyFile: "ja.txt", script: /^[ぁ-ゟァ-ヿ一-龥々]+$/ },
  ko: { frequencyFile: "ko.txt", script: /^[가-힣]+$/ },
  ru: { frequencyFile: "ru.txt", script: /^[а-яё]+$/i },
};

function loadCase(filename: string): { lang: string; text: string } | null {
  const raw = readFileSync(join(DATA_DIR, filename), "utf8");
  const lang = raw.match(/^#\s*lang:\s*(\S+)/im)?.[1]?.toLowerCase() ?? "en";
  if (!LANGUAGES[lang]) return null;
  const text = raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { lang, text };
}

function loadFrequency(lang: string): Set<string> {
  const config = LANGUAGES[lang];
  const filename = join(FREQ_DIR, config.frequencyFile);
  const lines = readFileSync(filename, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
  const start = config.script.test(lines[0] ?? "") ? 0 : 1;
  return new Set(lines.slice(start, start + TOP_N));
}

function segmentWords(lang: string, text: string): string[] {
  const segmenter = new Intl.Segmenter(lang, { granularity: "word" });
  const script = LANGUAGES[lang].script;
  return [...segmenter.segment(text)]
    .filter((part) => part.isWordLike && script.test(part.segment))
    .map((part) => part.segment.toLowerCase());
}

interface Totals {
  files: number;
  tokens: number;
  hits: number;
  types: Set<string>;
}

const totals = new Map<string, Totals>();
const files = readdirSync(DATA_DIR).filter((file) => file.endsWith(".txt")).sort();

for (const filename of files) {
  const testCase = loadCase(filename);
  if (!testCase) continue;
  const frequency = loadFrequency(testCase.lang);
  const words = segmentWords(testCase.lang, testCase.text);
  const hits = words.filter((word) => frequency.has(word)).length;
  const current = totals.get(testCase.lang) ?? {
    files: 0,
    tokens: 0,
    hits: 0,
    types: new Set<string>(),
  };
  current.files++;
  current.tokens += words.length;
  current.hits += hits;
  words.forEach((word) => current.types.add(word));
  totals.set(testCase.lang, current);
  console.log(
    `${filename}\t${testCase.lang}\ttokens=${words.length}\t` +
      `top${TOP_N}=${hits}/${words.length} ${(100 * hits / words.length).toFixed(1)}%`,
  );
}

console.log("\nAggregate");
for (const [lang, total] of totals) {
  const coverage = (100 * total.hits) / total.tokens;
  console.log(
    `${lang}\tfiles=${total.files}\ttokens=${total.tokens}\ttypes=${total.types.size}\t` +
      `top${TOP_N}=${total.hits}/${total.tokens} ${coverage.toFixed(1)}%`,
  );
  if (MIN_COVERAGE !== undefined && coverage < MIN_COVERAGE) process.exitCode = 1;
}
