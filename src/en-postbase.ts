/**
 * Post-base IPA transform table for English G2P.
 *
 * Replaces the 1600+ line `if (lowerWord.…) postBase = postBase.replace(…)`
 * chain that used to live inline in `EnglishG2P.predict()`. Each rule is
 * a `(guard, transform)` pair — the guard inspects both the original
 * word and the current IPA, the transform produces the new IPA. Rules
 * fire in array order; later rules see the output of earlier ones, so
 * ordering is significant (a rule that depends on a previous fix must
 * appear after it).
 *
 * The schema is deliberately permissive (predicate + transform are
 * arbitrary functions) so we can express the full historical set
 * without losing fidelity. Audits / consolidations / removals happen
 * by editing this table, not by re-architecting the framework.
 *
 * Sister modules:
 *   - en-suffixes.ts / en-stress.ts / en-reduce.ts / en-principled.ts
 *     handle morphologically principled cases. The rules here are the
 *     "everything else" — phonotactic adjustments, lexicalised
 *     irregularities, prefix-specific tweaks, compound-suffix overrides,
 *     etc. Many entries here are candidates for retirement as the
 *     principled pipeline expands; this file is meant to shrink over
 *     time.
 */

export interface PostBaseRule {
  /** Free-form note for human readers (often quoted from the original
   *  inline comment). Not used at runtime. */
  note?: string;
  /** Returns true when the rule should fire. `word` is the lowercased
   *  original orthography; `ipa` is the *current* IPA at this point in
   *  the chain (so guards can be IPA-sensitive too). */
  guard: (word: string, ipa: string) => boolean;
  /** Produces the new IPA. Receives both the current IPA and the word
   *  so nested-condition rules can be expressed inline without splitting
   *  into multiple table entries. */
  apply: (ipa: string, word: string) => string;
}

/**
 * Walk `rules` in order, applying each one whose guard passes against
 * the (possibly already-transformed) IPA. Returns the final IPA.
 */
export function applyPostBase(
  ipa: string,
  word: string,
  rules: readonly PostBaseRule[],
): string {
  let cur = ipa;
  for (const rule of rules) {
    if (rule.guard(word, cur)) cur = rule.apply(cur, word);
  }
  return cur;
}
