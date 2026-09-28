/**
 * Mine a statistically-verified compound-parts table from the dict.
 *
 * For every dict word, try two-part splits whose halves are themselves
 * dict words (with junk filters). Join the halves the way the lexicon
 * writes compounds — head keeps its primary, tail's primary demotes to
 * secondary, boundary geminates collapse — and compare against the
 * word's own dict IPA. Accumulate win/loss per TAIL and per HEAD, then
 * keep parts whose measured win-rate clears a threshold.
 *
 * Output: data/en/compound-parts.json
 *   { heads: {part: ipa}, tails: {part: ipa}, tailsReversed: {part: ipa} }
 *   (tailsReversed is a subset of tails — see the comment above it)
 *
 * This is statistical generalization (a part earns its place by
 * working across many words), not per-word memorization — the runtime
 * still discovers splits itself.
 */
import { readFileSync, writeFileSync } from "fs";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8"),
);

// Thresholds swept against the dict (2026-06-12): requiring BOTH the
// head and the tail to be independently verified is the load-bearing
// filter; per-part win-rate adds little, so it is set permissively.
// minRate 0.1 measured net +3,965 exact (4,219 wins : 254 breaks).
const MIN_PART = 2;
const MIN_TAIL = 3;
const MIN_WINS = 1;
const MIN_RATE = 0.1;

const okPart = (w: string): boolean => {
  const ipa = dict[w];
  if (!ipa) return false;
  // Letter-spelled entries (aba → ˌeɪˌbiˈeɪ) and other junk: more than
  // one stress mark or implausibly long IPA for the spelling.
  if (ipa.replace(/[^ˈˌ]/g, "").length > 1) return false;
  if (ipa.length > 2.2 * w.length) return false;
  return true;
};

const geminateCollapse = (s: string): string =>
  s.replace(/([pbtdkɡfvszʃʒθðmnŋɫɹ])(ˌ?)\1/g, "$2$1");
const join = (head: string, tail: string): string =>
  geminateCollapse(dict[head] + dict[tail].replace(/ˈ/g, "ˌ"));
const joinTailPrimary = (head: string, tail: string): string =>
  geminateCollapse(dict[head].replace(/ˈ/g, "ˌ") + dict[tail]);

// TAIL verification also accepts the tail keeping its OWN primary, with
// the head's demoted instead (2026-09-28); HEAD verification stays on the
// single head-primary convention, unchanged from the original scheme.
// `join` (used at runtime by tryCompoundSplit) always applies head-
// primary/tail-secondary, so a verified HEAD must match that convention —
// but the runtime reuses a verified TAIL's raw dict entry regardless of
// which side of ITS OWN join test won, so a tail that only matches via
// joinTailPrimary still contributes the right SEGMENTS at runtime (see
// join in g2p.ts: it always demotes the tail's ˈ to ˌ, so the tail's own
// internal stress placement in COMPOUND_TAILS never actually reaches the
// output — only its phoneme sequence does).
//
// This was tried both ways. Loosening HEAD verification too (an earlier
// version of this pass) let bound Latin/Greek prefixes that are ALSO short
// free dict words — con (9.9% single-convention win rate → 12.4% either-
// convention), com (7.8% → 12.5%), ab (4.5% → 10.6%), im (6.0% → 67.5%) —
// clear the floor and hijack real prefix+root derivations BEFORE
// assignStress's own hand-measured prefix-stress rules ever ran
// (combat/compose/impress/disassemble/propose etc.), breaking 22 pinned
// regression tests. Excluding a hand-written prefix list from HEAD
// verification (also tried) fixed those but broke ANOTHER set —
// in/pro/counter were ALREADY legitimate verified heads under the
// original single-convention scheme (pro alone was 14.6%, over the 10%
// floor with no help from this change), so blocklisting them by name cost
// income/indoor/independence/profile/program/counteract/counterbalance,
// net lenient-negative. Restricting the loosened convention to TAILS only
// avoids both: a head still has to prove itself the ORIGINAL way, so
// nothing that passed before is newly excluded and nothing new is newly
// admitted as a head; only which TAILS can pair with an already-legitimate
// head expands. over/some (already-verified heads) gaining done/upon/such/
// abundance as newly-verified tails is exactly the target class
// (overdone/overabundance); where/none themselves never verify as heads
// either way (0% under both conventions, too few samples either side), so
// whereupon/nonesuch are not reached by this fix — open.
interface Stat {
  win: number;
  loss: number;
  headWin: number;
}
const headStats = new Map<string, Stat>();
const tailStats = new Map<string, Stat>();
const bump = (
  m: Map<string, Stat>,
  k: string,
  win: boolean,
  headWin: boolean,
) => {
  const s = m.get(k) ?? { win: 0, loss: 0, headWin: 0 };
  win ? s.win++ : s.loss++;
  if (headWin) s.headWin++;
  m.set(k, s);
};

for (const [w, ipa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(w) || w.length < MIN_PART + MIN_TAIL) continue;
  for (let i = MIN_PART; i <= w.length - MIN_TAIL; i++) {
    if (w[i - 1] === w[i]) continue; // doubled consonant = suffixing, not compounding
    const a = w.slice(0, i);
    const b = w.slice(i);
    if (!okPart(a) || !okPart(b)) continue;
    const headWin = join(a, b) === ipa;
    const tailWin = headWin || joinTailPrimary(a, b) === ipa;
    bump(headStats, a, headWin, headWin);
    bump(tailStats, b, tailWin, headWin);
  }
}

const keep = (m: Map<string, Stat>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [part, s] of m) {
    if (s.win >= MIN_WINS && s.win / (s.win + s.loss) >= MIN_RATE)
      out[part] = dict[part];
  }
  return out;
};

const heads = keep(headStats);
const tails = keep(tailStats);
// A tail that is kept ONLY because of tail-primary wins (never once won
// under the original head-primary convention across every word it was
// tested against) is emitted separately (2026-09-28). The runtime's join
// always demotes the tail's own ˈ to ˌ — correct for a tail like "coat"
// or "gram" that DOES sometimes win head-primary (measured: this
// conservatively keeps the original behavior for any tail with mixed
// evidence) but wrong for a tail like "done"/"upon"/"such"/"abundance"
// that is EXCLUSIVELY attested tail-primary in the dict (real English
// prefix/root formations: overdone, whereupon, nonesuch, overabundance —
// the root keeps its own stress, the head reduces to secondary). Without
// this, tryCompoundSplit forced head-primary on every verified tail
// regardless of which convention verified it, which got the SEGMENTS
// right (all the stress-insensitive gates: test:eval, test:parity,
// test:common-accuracy) but the STRESS wrong for this whole class,
// costing evaluate-strict.ts (which scores primary-stress position,
// disableDict) 112 words net negative (56.94% → 56.82% headline) before
// this split existed. With it: evaluate-strict 56.94% → 57.14% headline
// (+266/-116 vs the frozen baseline, up from +86/-25 with no
// compound-parts change at all), `yarn test:eval --subset common` strict
// 64.51%→64.64% full / 66.66%→66.77% top-5000 (both above main's
// 64.53%/66.69%), lenient 83.92%→83.95% full / 84.96%→84.96% top-5000
// (flat, not below main's 83.95%/84.99% inherited state), full-dict
// `yarn test:eval` flat, `yarn test:parity`/`yarn test:common-accuracy`/
// `yarn test:homographs` all flat (these words were never table hits in
// the shipped pipeline either way), `yarn test` 1117/1117.
const tailsReversed: Record<string, string> = {};
for (const [part, s] of tailStats) {
  if (tails[part] !== undefined && s.headWin === 0) tailsReversed[part] = tails[part];
}
writeFileSync(
  "./data/en/compound-parts.json",
  JSON.stringify({ heads, tails, tailsReversed }),
);
console.log(
  `heads kept: ${Object.keys(heads).length}, tails kept: ${Object.keys(tails).length}, tails reversed (tail-primary only): ${Object.keys(tailsReversed).length}`,
);
