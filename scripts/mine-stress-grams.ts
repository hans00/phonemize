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
import { readFileSync, writeFileSync, existsSync } from "fs";

const OUT = "./data/en/stress-grams.json";
if (!existsSync(OUT)) writeFileSync(OUT, JSON.stringify({ "4": {}, "3": {} }));

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8"),
);

const FOREIGN: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/,
  /(cz|sz|rz|szcz)/,
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/,
];

const V = "aeiouɑæɛɪɔʊʌəɝ";
function primaryFromEnd(ipa: string): number {
  const pi = ipa.indexOf("ˈ");
  if (pi < 0) return -1;
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

async function main() {
  const { default: EnglishG2P } = await import("../src/en-g2p");
  const g = new EnglishG2P({ disableDict: true });

  interface Rec {
    predFE: number;
    dictFE: number;
  }
  const byGram = new Map<string, Rec[]>();
  for (const [w, exp] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (FOREIGN.some((r) => r.test(w))) continue;
    const pred = g.predict(w, "en");
    if (!pred) continue;
    const predFE = primaryFromEnd(pred);
    const dictFE = primaryFromEnd(exp);
    if (predFE < 1 || dictFE < 1) continue;
    for (const k of [w.slice(-4), w.slice(-3)]) {
      if (k.length < 3) continue;
      let a = byGram.get(k);
      if (!a) byGram.set(k, (a = []));
      a.push({ predFE, dictFE });
    }
  }

  const out: Record<string, Record<string, number>> = { "4": {}, "3": {} };
  let adopted = 0;
  for (const [k, recs] of byGram) {
    if (recs.length < 5) continue;
    const cnt = new Map<number, number>();
    for (const r of recs) cnt.set(r.dictFE, (cnt.get(r.dictFE) ?? 0) + 1);
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
      if (r.predFE !== r.dictFE && mode === r.dictFE) fixes++;
      else if (r.predFE === r.dictFE && mode !== r.dictFE) breaks++;
    }
    if (fixes - breaks < 3) continue;
    out[String(k.length)][k] = mode;
    adopted++;
  }
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`stress grams adopted: ${adopted}`);
}

main();
