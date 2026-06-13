/**
 * Mine ending-gram → primary-stress-position statistics from the dict.
 *
 * For every dict word, record the primary stress position counted from
 * the END of the word (1 = final syllable) for its last-4 and last-3
 * letter grams. A gram is adopted when
 *   - support ≥ 5 words,
 *   - the modal position covers ≥ 70% of them, and
 *   - applying the mode would NET-fix ≥ 3 words against the current
 *     pipeline (win/loss methodology at gram granularity: fixes where
 *     the pipeline misplaces stress minus breaks where it is right).
 *
 * Output: data/en/stress-grams.json  { "4": {gram: fromEnd}, "3": {…} }
 * Runtime: assignStress consults longest-gram-first before its
 * heuristics. The pipeline is imported dynamically AFTER seeding an
 * empty table so a fresh clone can bootstrap.
 */
import { readFileSync, writeFileSync } from "fs";

const ROUND2 = process.env.MINE_ROUND === "2";
const OUT = ROUND2
  ? "./data/en/stress-grams2.json"
  : "./data/en/stress-grams.json";
// Always reset the table before importing the pipeline: adoption is
// measured against the GRAM-FREE heuristics. Re-mining against a
// pipeline that already carries the table would un-adopt its own
// grams (their net contribution measures ~0 once they are live).
const EMPTY = {
  primary: { "4": {}, "3": {} },
  secondary: { "4": {}, "3": {} },
};
writeFileSync(OUT, JSON.stringify(EMPTY));

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8"),
);

const FOREIGN: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/,
  /(cz|sz|rz|szcz)/,
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/,
];

const V = "aeiouɑæɛɪɔʊʌəɝ";
function markFromEnd(ipa: string, mark: string): number {
  const pi = ipa.indexOf(mark);
  if (pi < 0) return mark === "ˌ" ? 0 : -1; // 0 = "no secondary"
  let total = 0;
  let before = 0;
  let inV = false;
  for (let i = 0; i < ipa.length; i++) {
    if (V.includes(ipa[i])) {
      if (!inV) {
        total++;
        if (i < pi) before++;
      }
      inV = true;
    } else inV = false;
  }
  return total - before;
}
const primaryFromEnd = (ipa: string): number => markFromEnd(ipa, "ˈ");
function sylCount(ipa: string): number {
  let n = 0;
  let inV = false;
  for (const c of ipa) {
    if (V.includes(c)) {
      if (!inV) n++;
      inV = true;
    } else inV = false;
  }
  return n;
}

async function main() {
  // Round 1 measures against the gram-free baseline; round 2 measures
  // against the round-1 pipeline (residual boosting).
  if (ROUND2) process.env.PHONEMIZE_NO_GRAMS2 = "1";
  else process.env.PHONEMIZE_NO_GRAMS = "1";
  const { default: EnglishG2P } = await import("../src/en-g2p");
  const g = new EnglishG2P({ disableDict: true });

  interface Rec {
    predFE: number;
    dictFE: number;
    predSE: number;
    dictSE: number;
  }
  const byGram = new Map<string, Rec[]>();
  const byInitGram = new Map<string, Rec[]>();
  for (const [w, exp] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (FOREIGN.some((r) => r.test(w))) continue;
    const pred = g.predict(w, "en");
    if (!pred) continue;
    const predFE = primaryFromEnd(pred);
    const dictFE = primaryFromEnd(exp);
    if (predFE < 1 || dictFE < 1) continue;
    const rec = {
      predFE,
      dictFE,
      predSE: markFromEnd(pred, "ˌ"),
      dictSE: markFromEnd(exp, "ˌ"),
    };
    // Keys carry the RUNTIME-visible syllable count (the pipeline's
    // own, not the dict's) so training matches inference.
    const ns = Math.min(sylCount(pred), 5);
    for (const k of [`${w.slice(-4)}|${ns}`, `${w.slice(-3)}|${ns}`]) {
      if (k.indexOf("|") < 3) continue;
      let a = byGram.get(k);
      if (!a) byGram.set(k, (a = []));
      a.push(rec);
    }
    // Prefix-keyed primary stress (abs-, mono-, …): the suffix tables
    // miss stress that the prefix governs. 6→3 char initial grams.
    for (const L of [6, 5, 4, 3]) {
      if (w.length < L) continue;
      const k = `${w.slice(0, L)}|${ns}`;
      let a = byInitGram.get(k);
      if (!a) byInitGram.set(k, (a = []));
      a.push(rec);
    }
  }

  const mine = (
    get: (r: Rec) => [number, number],
    grams: Map<string, Rec[]> = byGram,
    buckets: string[] = ["4", "3"],
  ): Record<string, Record<string, number>> => {
    const out: Record<string, Record<string, number>> = {};
    for (const b of buckets) out[b] = {};
    for (const [k, recs] of grams) {
      if (recs.length < 2) continue;
      const cnt = new Map<number, number>();
      for (const r of recs) {
        const [, d] = get(r);
        cnt.set(d, (cnt.get(d) ?? 0) + 1);
      }
      let mode = -1;
      let mc = 0;
      for (const [v, c] of cnt)
        if (c > mc) {
          mc = c;
          mode = v;
        }
      if (mc / recs.length < 0.7) continue;
      let fixes = 0;
      let breaks = 0;
      for (const r of recs) {
        const [p, d] = get(r);
        if (p !== d && mode === d) fixes++;
        else if (p === d && mode !== d) breaks++;
      }
      if (fixes - breaks < 2) continue;
      out[String(k.split("|")[0].length)][k] = mode;
    }
    return out;
  };

  const primary = mine((r) => [r.predFE, r.dictFE]);
  const secondary = mine((r) => [r.predSE, r.dictSE]);
  const primaryInit = mine(
    (r) => [r.predFE, r.dictFE],
    byInitGram,
    ["6", "5", "4", "3"],
  );
  writeFileSync(OUT, JSON.stringify({ primary, secondary, primaryInit }));
  const size = (t: Record<string, Record<string, number>>) =>
    Object.values(t).reduce((n, m) => n + Object.keys(m).length, 0);
  console.log(
    `stress grams adopted (round ${ROUND2 ? 2 : 1}): primary ${size(primary)}, secondary ${size(secondary)}, primaryInit ${size(primaryInit)}`,
  );
}

main();
