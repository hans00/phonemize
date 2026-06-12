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
const EMPTY = {
  stressed: { "4": {}, "3": {} },
  final: { "4": {}, "3": {} },
  initial: { "4": {}, "3": {} },
  coda: { "4": {}, "3": {} },
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
const initialVowel = (p: string): string => {
  const r = vowelRuns(p);
  return r.length ? p.slice(r[0][0], r[0][1]) : "";
};
const CODA_RE = new RegExp(`([^${V}ˈˌ]*)$`);
const finalCoda = (p: string): string => CODA_RE.exec(p)?.[1] ?? "";

async function main() {
  const { default: EnglishG2P } = await import("../src/en-g2p");
  const g = new EnglishG2P({ disableDict: true });

  interface Rec {
    ps: string;
    ds: string;
    pf: string;
    df: string;
    pi: string;
    di: string;
    pc: string;
    dc: string;
  }
  const byGram = new Map<string, Rec[]>();
  const byInitGram = new Map<string, Rec[]>();
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
      pi: initialVowel(pred),
      di: initialVowel(exp),
      pc: finalCoda(pred),
      dc: finalCoda(exp),
    };
    for (const k of [w.slice(-4), w.slice(-3)]) {
      if (k.length < 3) continue;
      let a = byGram.get(k);
      if (!a) byGram.set(k, (a = []));
      a.push(rec);
    }
    for (const k of [w.slice(0, 4), w.slice(0, 3)]) {
      if (k.length < 3) continue;
      let a = byInitGram.get(k);
      if (!a) byInitGram.set(k, (a = []));
      a.push(rec);
    }
  }

  const mine = (
    get: (r: Rec) => [string, string],
    grams: Map<string, Rec[]> = byGram,
    minConsistency = 0.7,
    minNet = 3,
  ): Record<string, Record<string, string>> => {
    const out: Record<string, Record<string, string>> = { "4": {}, "3": {} };
    for (const [k, recs] of grams) {
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
      if (!mode || mc / recs.length < minConsistency) continue;
      let fixes = 0;
      let breaks = 0;
      for (const r of recs) {
        const [p, d] = get(r);
        if (p !== d && mode === d) fixes++;
        else if (p === d && mode !== d) breaks++;
      }
      if (fixes - breaks < minNet) continue;
      out[String(k.length)][k] = mode;
    }
    return out;
  };

  const stressed = mine((r) => [r.ps, r.ds]);
  const final = mine((r) => [r.pf, r.df]);
  const initial = mine((r) => [r.pi, r.di], byInitGram);
  const coda = mine((r) => [r.pc, r.dc]);
  writeFileSync(OUT, JSON.stringify({ stressed, final, initial, coda }));
  const size = (t: Record<string, Record<string, string>>) =>
    Object.keys(t["4"]).length + Object.keys(t["3"]).length;
  console.log(
    `vowel grams adopted: stressed ${size(stressed)}, final ${size(final)}, initial ${size(initial)}, coda ${size(coda)}`,
  );
}

main();
