/**
 * Build held-out AI-eval word lists from WikiPron (Wiktionary pronunciation
 * data) for en / zh / ja / ko / ru.
 *
 * WikiPron (https://github.com/CUNY-CL/wikipron) is independent of this
 * project's training source (open-dict-data/ipa-dict), so words NOT already
 * in the training dict measure GENERALISATION, not training recall.
 *
 * We emit only the orthographic words (no reference IPA): the AI rubric in
 * eval-with-ai.ts judges the system's OWN output and accepts any valid
 * variant, so WikiPron's transcription conventions (ʌ/ə, length marks,
 * segmentation) can't bias the score — which is the whole reason a raw
 * string-match against another dictionary was rejected.
 *
 * Output: <OUT>/wikipron-<lang>.txt (default scripts/eval-data-wikipron/),
 * each a "# lang: <lang>" header + COUNT space-joined sampled words. Score
 * them with the held-out benchmark:
 *
 *   yarn build-eval-set
 *   yarn test:ai-eval --provider codex --data-dir scripts/eval-data-wikipron
 *
 * Env: COUNT (words per language, default 120), OUT (output dir),
 * INCLUDE_TRAINING=1 to keep words that are in the training dict.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";

const TREE_API =
  "https://api.github.com/repos/CUNY-CL/wikipron/git/trees/master?recursive=1";
const RAW = (p: string) =>
  `https://raw.githubusercontent.com/CUNY-CL/wikipron/master/${p}`;

interface LangCfg {
  iso: string; // ISO 639-3 prefix of the WikiPron file
  script: RegExp; // accept only words written in the expected script
  prefer: RegExp[]; // file-name preference order (broad before narrow, etc.)
  dict?: string; // training dict to subtract for the held-out set
}

const LANGS: Record<string, LangCfg> = {
  en: {
    iso: "eng",
    script: /^[a-z][a-z'-]*[a-z]$/,
    prefer: [/eng_latn_us_broad/, /eng_latn_uk_broad/, /eng_latn.*broad/],
    dict: "data/en/dict.json",
  },
  zh: {
    iso: "cmn",
    script: /^[一-鿿]+$/,
    prefer: [/cmn_hani_standard_broad/, /cmn_hani.*broad/, /cmn_hani.*narrow/],
    dict: "data/zh/dict.json",
  },
  ja: {
    iso: "jpn",
    script: /^[぀-ヿ一-鿿]+$/,
    prefer: [/jpn_hira.*broad/, /jpn_hira.*narrow/, /jpn_.*broad/],
    dict: "data/ja/words.json",
  },
  ko: {
    iso: "kor",
    script: /^[가-힣]+$/,
    prefer: [/kor_hang.*broad/, /kor_hang.*narrow/, /kor_.*/],
  },
  ru: {
    iso: "rus",
    script: /^[а-яё]+$/,
    prefer: [/rus_cyrl.*narrow/, /rus_cyrl.*broad/, /rus_.*/],
  },
};

const COUNT = parseInt(process.env.COUNT || "120", 10);
const OUT = process.env.OUT || "scripts/eval-data-wikipron";
const CACHE = "scripts/.wikipron-cache";
const KEEP_TRAINING = process.env.INCLUDE_TRAINING === "1";

// Reproducible sampling: a small seeded PRNG so reruns produce the same set.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "phonemize-build-eval" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

// Frequency-stratified English set: a representative real-usage benchmark
// (the random WikiPron draw over-weights the rare/foreign long tail). Samples
// evenly across frequency bands of the 10k most-common US English words, run
// through the FULL system (dict + rules) — what users actually experience.
const FREQ_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt";

async function buildFrequencyEn() {
  const cachePath = `${CACHE}/google-10000-english-usa.txt`;
  const text = existsSync(cachePath)
    ? readFileSync(cachePath, "utf8")
    : await fetchText(FREQ_URL).then((t) => (writeFileSync(cachePath, t), t));
  // Real words only: the frequency list has corpus junk (il, wi, ge, bbc,
  // pty) — keep words that are real English (present in the dict).
  const real = existsSync("data/en/dict.json")
    ? (JSON.parse(readFileSync("data/en/dict.json", "utf8")) as Record<string, unknown>)
    : null;
  const ranked = text
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z]{3,}$/.test(w) && (!real || w in real));
  // Even sample across 4 rank bands (common → mid-frequency).
  const bands = [
    [0, 1000],
    [1000, 3000],
    [3000, 6000],
    [6000, ranked.length],
  ];
  const per = Math.ceil(COUNT / bands.length);
  const rng = mulberry32(0x5eed ^ "freq".charCodeAt(0));
  const picked = new Set<string>();
  for (const [lo, hi] of bands) {
    const band = ranked.slice(lo, hi);
    for (let k = 0; k < per && band.length; k++)
      picked.add(band[Math.floor(rng() * band.length)]);
  }
  const sample = [...picked].sort();
  const outPath = `${OUT}/freq-en.txt`;
  writeFileSync(outPath, `# lang: en\n${sample.join(" ")}\n`);
  console.log(`✓ freq-en: ${ranked.length} ranked words → ${sample.length} stratified → ${outPath}`);
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  if (process.env.FREQ === "1") {
    await buildFrequencyEn();
    return;
  }

  console.log("Fetching WikiPron file index…");
  const tree = JSON.parse(await fetchText(TREE_API));
  if (tree.truncated)
    console.warn("⚠ WikiPron git tree was truncated — file discovery may miss some languages");
  const tsv: string[] = (tree.tree as { path: string }[])
    .map((t) => t.path)
    .filter((p) => p.startsWith("data/scrape/tsv/") && p.endsWith(".tsv"));

  for (const [lang, cfg] of Object.entries(LANGS)) {
    let file: string | undefined;
    for (const pat of cfg.prefer) {
      file = tsv.find((p) => pat.test(p));
      if (file) break;
    }
    file ??= tsv.find((p) => p.includes(`/${cfg.iso}_`));
    if (!file) {
      console.warn(`✗ ${lang}: no WikiPron file found for "${cfg.iso}"`);
      continue;
    }

    const base = file.split("/").pop()!;
    const cachePath = `${CACHE}/${base}`;
    const text = existsSync(cachePath)
      ? readFileSync(cachePath, "utf8")
      : await fetchText(RAW(file)).then((t) => (writeFileSync(cachePath, t), t));

    // Unique, script-clean orthographic words.
    const words = new Set<string>();
    for (const line of text.split("\n")) {
      const w = line.split("\t")[0]?.trim().toLowerCase();
      if (w && cfg.script.test(w)) words.add(w);
    }
    let pool = [...words];
    const scraped = pool.length;

    // Held-out: subtract the training dict (where one exists).
    let dropped = 0;
    if (!KEEP_TRAINING && cfg.dict && existsSync(cfg.dict)) {
      const dict = JSON.parse(readFileSync(cfg.dict, "utf8")) as Record<string, unknown>;
      const before = pool.length;
      pool = pool.filter((w) => !(w in dict));
      dropped = before - pool.length;
    }

    // Seeded shuffle → take COUNT.
    const rng = mulberry32(0x5eed ^ cfg.iso.charCodeAt(0));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const sample = pool.slice(0, COUNT).sort();

    const outPath = `${OUT}/wikipron-${lang}.txt`;
    writeFileSync(outPath, `# lang: ${lang}\n${sample.join(" ")}\n`);
    console.log(
      `✓ ${lang}: ${base} — ${scraped} words` +
        (dropped ? `, −${dropped} in training dict` : "") +
        ` → ${sample.length} sampled → ${outPath}`,
    );
  }

  console.log(
    `\nDone. Score the held-out set with:\n  yarn test:ai-eval --provider codex --data-dir ${OUT}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
