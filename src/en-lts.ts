/**
 * P3.1: Runtime letter-to-sound lookup using the compiled LTS table.
 *
 * predictByLTS(word) walks the word left-to-right, at each position trying
 * the longest grapheme cluster known to the table and backing off through
 * context levels (full L+R → L-only → R-only → no-context) until a phoneme
 * mapping is found. If nothing matches even with single-letter no-context
 * lookup, that letter is dropped from the output (alignments allow silent
 * letters, so this is rare).
 *
 * Output IPA has no stress marks — stress comes from the principled
 * pipeline (en-principled).
 */

import * as lts from "../data/en/lts.json";
import { resolveJson } from "./utils";

interface LtsTable {
  full: Record<string, string>;
  leftCtx: Record<string, string>;
  rightCtx: Record<string, string>;
  noCtx: Record<string, string>;
}

const TABLE: LtsTable = resolveJson<LtsTable>(lts);

// Compute the set of known grapheme clusters and their max length up front.
const KNOWN_GRAPHEMES = new Set<string>(Object.keys(TABLE.noCtx));
let MAX_CLUSTER_LEN = 1;
Array.from(KNOWN_GRAPHEMES).forEach((g: string) => {
  if (g.length > MAX_CLUSTER_LEN) MAX_CLUSTER_LEN = g.length;
});

/**
 * Look up the phoneme realization of `grapheme` in context (`left`, `right`).
 * Tries full → leftCtx → rightCtx → noCtx. Returns undefined if no level
 * has an entry (in which case caller should try a shorter grapheme cluster).
 */
function lookup(grapheme: string, left: string, right: string): string | undefined {
  return (
    TABLE.full[`${left}|${grapheme}|${right}`] ??
    TABLE.leftCtx[`${left}|${grapheme}`] ??
    TABLE.rightCtx[`${grapheme}|${right}`] ??
    TABLE.noCtx[grapheme]
  );
}

/**
 * Predict an IPA realization of `word` using the LTS table. Returns null
 * only if the word contains a character the table has never seen.
 */
export function predictByLTS(word: string): string | null {
  const lower = word.toLowerCase();
  const out: string[] = [];
  let p = 0;
  while (p < lower.length) {
    const left = p === 0 ? "^" : lower[p - 1];
    let matched = false;
    // Try longest cluster first.
    for (let len = Math.min(MAX_CLUSTER_LEN, lower.length - p); len >= 1; len--) {
      const g = lower.slice(p, p + len);
      if (!KNOWN_GRAPHEMES.has(g)) continue;
      const right = p + len >= lower.length ? "$" : lower[p + len];
      const phon = lookup(g, left, right);
      if (phon !== undefined) {
        out.push(phon);
        p += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Single-letter fallback even when not in noCtx — skip the letter.
      // Returning null here would refuse rare letters like q in some words;
      // skipping is safer and matches alignment's "silent letter" outputs.
      p++;
    }
  }
  return out.join("");
}
