/**
 * Runtime lookup table for English G2P exceptions (P5 of redesign).
 *
 * The shipped exceptions.json is produced by `scripts/mine-exceptions.ts`
 * under the hybrid policy: every foreign-origin word in the dict, plus
 * native English words whose rule-pipeline prediction deviates from the
 * dict by edit distance ≥ N (default N=3). It's intended as a smaller
 * replacement for the 2.7MB `dict.json`:
 *
 *   - dict.json:        ~100K entries / 2.7 MB — exhaustive lookup
 *   - exceptions.json:  ~13K entries  / ~300 KB — only the words rules
 *                       can't predict (foreign borrowings + native
 *                       irregulars beyond a quality threshold)
 *
 * Combined with the rule pipeline, exceptions provide near-dict accuracy
 * at a fraction of the package size. See `docs/g2p-redesign.md` P5.
 */

import * as exceptionsJson from "../data/en/exceptions.json";
import { resolveJson } from "./utils";

const TABLE: Record<string, string> = resolveJson<Record<string, string>>(
  exceptionsJson
);

/**
 * Look up an English exception by lowercase word. Returns the stress-
 * marked IPA from the dict, or undefined if the word isn't an exception
 * (in which case the rule pipeline handles it).
 */
export function lookupException(word: string): string | undefined {
  return TABLE[word];
}

/** For introspection — count of entries in the shipped table. */
export function exceptionCount(): number {
  return Object.keys(TABLE).length;
}
