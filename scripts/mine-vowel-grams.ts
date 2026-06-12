/**
 * Mine ending-gram → vowel-quality statistics from the dict, for the
 * two highest-leverage positions:
 *   stressed — the vowel of the primary-stressed syllable
 *   final    — the vowel of the last syllable
 *
 * Same adoption test as mine-stress-grams.ts: support ≥5, modal vowel
 * ≥70%, and net-fixes ≥3 against the gram-free pipeline. The table is
 * reset before importing the pipeline so mining stays deterministic.
 *
 * Output: data/en/vowel-grams.json
 *   { stressed: {"4": {...}, "3": {...}}, final: {"4": {...}, "3": {...}} }
 */
import { readFileSync, writeFileSync } from "fs";

const OUT = "./data/en/vowel-grams.json";
const EMPTY = { stressed: { "4": {}, "3": {} }, final: { "4": {}, "3": {} } };
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
function vowelRuns(p: string): Array<[number, number]> {
  const r: Array<[number, number]> = [];
  for (let i = 0; i < p.length; ) {
    if (V.includes(p[i])) {
      const s = i;
      while (i < p.length && V.includes(p[i])) i++;
      r.push([s, i]);
    } else i++;
  }
  return r;
}
const stressedVowel = (p: string): string => {
  const pi = p.indexOf("ˈ");
  if (pi < 0) return "";
  for (const [s, e] of vowelRuns(p)) if (s > pi) return p.slice(s, e);
  return "";
};
const finalVowel = (p: string): string => {
  const r = vowelRuns(p);
  return r.length ? p.slice(r[r.length - 1][0], r[r.length - 1][1]) : "";
};

async function main() {
  const { default: EnglishG2P } = await import("../src/en-g2p");
  const g = new EnglishG2P({ disableDict: true });

  interface Rec {
    ps: string;
    ds: string;
    pf: string;
    df: string;
  }
  const byGram = new Map<string, Rec[]>();
  for (const [w, exp] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (FOREIGN.some((r) => r.test(w))) continue;
    const pred = g.predict(w, "en");
    if (!pred) continue;
    const rec = {
      ps: stressedVowel(pred),
      ds: stressedVowel(exp),
      pf: finalVowel(pred),
      df: finalVowel(exp),
    };
    for (const k of [w.slice(-4), w.slice(-3)]) {
      if (k.length < 3) continue;
      let a = byGram.get(k);
      if (!a) byGram.set(k, (a = []));
      a.push(rec);
    }
  }

  const mine = (
    get: (r: Rec) => [string, string],
  ): Record<string, Record<string, string>> => {
    const out: Record<string, Record<string, string>> = { "4": {}, "3": {} };
    for (const [k, recs] of byGram) {
      if (recs.length < 5) continue;
      const cnt = new Map<string, number>();
      for (const r of recs) {
        const [, d] = get(r);
        if (d) cnt.set(d, (cnt.get(d) ?? 0) + 1);
      }
      let mode = "";
      let mc = 0;
      for (const [v, c] of cnt)
        if (c > mc) {
          mc = c;
          mode = v;
        }
      if (!mode || mc / recs.length < 0.7) continue;
      let fixes = 0;
      let breaks = 0;
      for (const r of recs) {
        const [p, d] = get(r);
        if (p !== d && mode === d) fixes++;
        else if (p === d && mode !== d) breaks++;
      }
      if (fixes - breaks < 3) continue;
      out[String(k.length)][k] = mode;
    }
    return out;
  };

  const stressed = mine((r) => [r.ps, r.ds]);
  const final = mine((r) => [r.pf, r.df]);
  writeFileSync(OUT, JSON.stringify({ stressed, final }));
  console.log(
    `vowel grams adopted: stressed ${
      Object.keys(stressed["4"]).length + Object.keys(stressed["3"]).length
    }, final ${Object.keys(final["4"]).length + Object.keys(final["3"]).length}`,
  );
}

main();
