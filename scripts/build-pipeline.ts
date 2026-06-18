/**
 * Unified data-build pipeline (the single entry point behind
 * `yarn build-dict` / `prebuild`).
 *
 * Each step runs as its OWN child process — that is load-bearing, not
 * cosmetic:
 *   - The per-step env flags (PHONEMIZE_NO_GRAMS, MINE_ROUND) are read
 *     at module-load time by the runtime pipeline, so they must be set
 *     before the process starts.
 *   - en-g2p.ts caches its data tables at module load; a fresh process
 *     per step guarantees each miner sees the tables produced by the
 *     previous steps rather than a stale in-process cache.
 *
 * Order matters (see the comments inline). seed-data must run before
 * any step that imports the runtime pipeline so its static
 * `data/en/*.json` imports resolve on a clean checkout.
 */
import { spawnSync } from "child_process";
import { join } from "path";

const TSX = join("node_modules", ".bin", "tsx");

interface Step {
  script: string;
  args?: string[];
  env?: Record<string, string>;
}

const STEPS: Step[] = [
  // Generate the base dictionaries (en/zh/ja/anyascii) from src-data.
  { script: "build-dict.ts" },
  // Seed empty placeholders so the runtime pipeline can be imported by
  // the miners below before their real tables exist.
  { script: "seed-data.ts" },
  // Exception table: mined against the gram-free rule baseline for a
  // reproducible result regardless of any leftover gram tables.
  {
    script: "mine-exceptions.ts",
    args: ["--native-min", "1"],
    env: { PHONEMIZE_NO_GRAMS: "1" },
  },
  // Statistical compound head/tail table (helps decompose compounds).
  { script: "mine-compound-parts.ts" },
  // The stress-gram and vowel-gram miners are intentionally NOT run. They
  // were tuned to maximize dictionary-MATCH (the old eval standard), but
  // AI-eval measurements showed they net-HURT pronunciation quality on the
  // common high-frequency vocabulary — they override correct rule output
  // with the dictionary's modal n-gram guess, injecting errors
  // (floor→fɫʌɹ, morning→mɝˈnɪŋ, reached→ɹiˈtʃɛd, asked→ʌskt). seed-data.ts
  // leaves the gram tables as empty placeholders, so the (now removed) gram
  // application is a no-op. Compound parts stay — they help, not hurt.
];

for (const step of STEPS) {
  const envPrefix = step.env
    ? Object.entries(step.env)
        .map(([k, v]) => `${k}=${v} `)
        .join("")
    : "";
  const argSuffix = step.args?.length ? ` ${step.args.join(" ")}` : "";
  console.log(`\n▶ ${envPrefix}tsx scripts/${step.script}${argSuffix}`);

  const res = spawnSync(TSX, [join("scripts", step.script), ...(step.args ?? [])], {
    stdio: "inherit",
    env: { ...process.env, ...step.env },
  });

  if (res.status !== 0) {
    console.error(
      `\n✖ build pipeline failed at scripts/${step.script} (exit ${res.status ?? res.signal})`,
    );
    process.exit(typeof res.status === "number" ? res.status : 1);
  }
}

console.log("\n✓ build pipeline complete");
