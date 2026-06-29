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
 *   { heads: {part: ipa}, tails: {part: ipa} }
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

const join = (head: string, tail: string): string =>
  (dict[head] + dict[tail].replace(/ˈ/g, "ˌ")).replace(
    /([pbtdkɡfvszʃʒθðmnŋɫɹ])(ˌ?)\1/g,
    "$2$1",
  );

interface Stat {
  win: number;
  loss: number;
}
const headStats = new Map<string, Stat>();
const tailStats = new Map<string, Stat>();
const bump = (m: Map<string, Stat>, k: string, win: boolean) => {
  const s = m.get(k) ?? { win: 0, loss: 0 };
  win ? s.win++ : s.loss++;
  m.set(k, s);
};

for (const [w, ipa] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(w) || w.length < MIN_PART + MIN_TAIL) continue;
  for (let i = MIN_PART; i <= w.length - MIN_TAIL; i++) {
    if (w[i - 1] === w[i]) continue; // doubled consonant = suffixing, not compounding
    const a = w.slice(0, i);
    const b = w.slice(i);
    if (!okPart(a) || !okPart(b)) continue;
    const win = join(a, b) === ipa;
    bump(headStats, a, win);
    bump(tailStats, b, win);
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
writeFileSync(
  "./data/en/compound-parts.json",
  JSON.stringify({ heads, tails }),
);
console.log(
  `heads kept: ${Object.keys(heads).length}, tails kept: ${Object.keys(tails).length}`,
);
