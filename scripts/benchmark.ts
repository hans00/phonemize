/**
 * Source-level performance benchmark (no build needed). Measures
 * EnglishG2P.predict() throughput across word categories so the
 * optimization pass has a baseline.
 */

import EnglishG2P from "../src/en-g2p";
import { phonemize } from "../src/index";

const g2p = new EnglishG2P();

interface Scenario {
  name: string;
  words: string[];
  iterations: number;
}

const scenarios: Scenario[] = [
  {
    name: "Common short (dict-hit)",
    words: ["hello", "world", "the", "and", "is", "of", "a", "to"],
    iterations: 5000,
  },
  {
    name: "Medium rule-predicted",
    words: ["phonemize", "testing", "performance", "evaluate", "complete"],
    iterations: 5000,
  },
  {
    name: "Long Latinate",
    words: ["abbreviation", "demonstration", "infrastructure", "responsibility"],
    iterations: 2000,
  },
  {
    name: "Foreign exceptions",
    words: ["kowalski", "yamamoto", "rodriguez", "schneider"],
    iterations: 2000,
  },
  {
    name: "Mixed paragraph (phonemize)",
    words: ["The quick brown fox jumps over the lazy dog repeatedly today"],
    iterations: 1000,
  },
];

function bench(label: string, fn: () => void, iterations: number) {
  // warmup
  for (let i = 0; i < 100; i++) fn();
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) fn();
  const ns = Number(process.hrtime.bigint() - start);
  const us = ns / 1000;
  const perCall = us / iterations;
  console.log(`  ${label.padEnd(30)}  ${perCall.toFixed(2).padStart(8)} µs/call  (${(iterations / (us / 1e6)).toFixed(0)} ops/sec)`);
}

console.log("=== EnglishG2P.predict() throughput ===");
for (const s of scenarios.slice(0, 4)) {
  bench(s.name, () => {
    for (const w of s.words) g2p.predict(w, "en");
  }, s.iterations);
}

console.log("\n=== phonemize() end-to-end ===");
for (const s of scenarios.slice(4)) {
  bench(s.name, () => {
    for (const w of s.words) phonemize(w);
  }, s.iterations);
}

console.log("\n=== Cold-instance construction ===");
bench("new EnglishG2P()", () => {
  new EnglishG2P();
}, 100);
