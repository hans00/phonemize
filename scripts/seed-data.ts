/**
 * Bootstrap empty placeholders for the generated data files that
 * `src/en-g2p.ts` (and its imports) load *statically*.
 *
 * The build pipeline mines several of these tables by importing the
 * runtime pipeline itself (mine-exceptions, mine-stress-grams,
 * mine-vowel-grams all `import EnglishG2P`). A static
 * `import * from "../data/en/*.json"` cannot be loaded until the file
 * exists, so on a clean checkout (data/ is gitignored) the very first
 * generator that imports en-g2p crashes before any of the others have
 * had a chance to run — a chicken-and-egg bootstrap.
 *
 * Seeding empty-but-valid placeholders up front breaks the cycle: each
 * real generator then overwrites its own file in any order. Existing
 * files are left untouched (incremental builds keep their real data
 * until their generator reruns).
 *
 * The bucket shapes here MUST mirror the `EMPTY` constants in the
 * miners and the bucket keys the runtime indexes (en-syllabify /
 * en-postlex), otherwise an empty lookup would throw instead of
 * returning undefined.
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";

mkdirSync("./data/en", { recursive: true });

const lenLong = { "8": {}, "7": {}, "6": {}, "5": {}, "4": {}, "3": {} };
const len43 = { "4": {}, "3": {} };

const PLACEHOLDERS: Record<string, unknown> = {
  "./data/en/exceptions.json": {},
  // lts.json is consumed only by the dead-code en-lts.ts (kept for the
  // validate-lts dev script); a placeholder keeps `tsc -b` happy on a
  // clean checkout without pulling the heavy aligner→compile-lts chain.
  "./data/en/lts.json": { full: {}, leftCtx: {}, rightCtx: {}, noCtx: {} },
  "./data/en/compound-parts.json": { heads: {}, tails: {} },
  "./data/en/stress-grams.json": {
    primary: len43,
    secondary: len43,
    primaryInit: { "6": {}, "5": {}, "4": {}, "3": {} },
  },
  "./data/en/stress-grams2.json": {
    primary: len43,
    secondary: len43,
    primaryInit: { "6": {}, "5": {}, "4": {}, "3": {} },
  },
  "./data/en/vowel-grams.json": {
    stressed: { "6": {}, "5": {}, "4": {}, "3": {} },
    final: { "6": {}, "5": {}, "4": {}, "3": {} },
    initial: { "6": {}, "5": {}, "4": {}, "3": {} },
    coda: { "6": {}, "5": {}, "4": {}, "3": {} },
    second: len43,
    penult: len43,
    tail: lenLong,
    head: lenLong,
  },
  "./data/en/vowel-grams2.json": {
    stressed: { "6": {}, "5": {}, "4": {}, "3": {} },
    final: { "6": {}, "5": {}, "4": {}, "3": {} },
    initial: { "6": {}, "5": {}, "4": {}, "3": {} },
    coda: { "6": {}, "5": {}, "4": {}, "3": {} },
    second: len43,
    penult: len43,
    tail: lenLong,
    head: lenLong,
  },
};

let seeded = 0;
for (const [path, shape] of Object.entries(PLACEHOLDERS)) {
  if (existsSync(path)) continue;
  writeFileSync(path, JSON.stringify(shape));
  seeded++;
}
console.log(
  `seed-data: ${seeded} placeholder(s) created, ${
    Object.keys(PLACEHOLDERS).length - seeded
  } already present`,
);
