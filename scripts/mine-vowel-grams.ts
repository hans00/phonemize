/**
 * Mine gram → segmental statistics from the dict for the positions the
 * rule engine misses most:
 *   stressed — vowel of the primary-stressed syllable   (ending gram)
 *   final    — vowel of the last syllable               (ending gram)
 *   initial  — vowel of the first syllable              (initial gram)
 *   coda     — final consonant coda                     (ending gram)
 *   second   — vowel of syllable #2                     (initial gram × syl count)
 *   penult   — vowel of the next-to-last syllable       (ending gram × syl count)
 *   tail     — whole IPA from the primary mark to the end (ending gram × syl count)
 *
 * Same adoption test as mine-stress-grams.ts: support ≥5, modal value
 * ≥70%, and net-fixes ≥3 against the gram-free pipeline. The table is
 * reset before importing the pipeline so mining stays deterministic.
 * Count-keyed tables use the RUNTIME-visible syllable count.
 */
import { readFileSync, writeFileSync } from "fs";

const ROUND = parseInt(process.env.MINE_ROUND || "1", 10);
const OUT =
  ROUND >= 2
    ? `./data/en/vowel-grams${ROUND}.json`
    : "./data/en/vowel-grams.json";
const EMPTY = {
  stressed: { "6": {}, "5": {}, "4": {}, "3": {} },
  final: { "6": {}, "5": {}, "4": {}, "3": {} },
  initial: { "6": {}, "5": {}, "4": {}, "3": {} },
  coda: { "6": {}, "5": {}, "4": {}, "3": {} },
  second: { "4": {}, "3": {} },
  penult: { "4": {}, "3": {} },
  tail: { "8": {}, "7": {}, "6": {}, "5": {}, "4": {}, "3": {} },
  head: { "8": {}, "7": {}, "6": {}, "5": {}, "4": {}, "3": {} },
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
const tailFromPrimary = (p: string): string => {
  const i = p.indexOf("ˈ");
  return i < 0 ? "" : p.slice(i);
};
const headToPrimary = (p: string): string => {
  const i = p.indexOf("ˈ");
  return i < 0 ? "" : p.slice(0, i);
};

async function main() {
  if (ROUND >= 2) process.env[`PHONEMIZE_NO_GRAMS${ROUND}`] = "1";
  else process.env.PHONEMIZE_NO_GRAMS = "1";
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
    p2: string;
    d2: string;
    pp: string;
    dp: string;
    pt: string;
    dt: string;
    ph: string;
    dh: string;
  }
  const byGram = new Map<string, Rec[]>();
  const byInitGram = new Map<string, Rec[]>();
  const byEndN = new Map<string, Rec[]>(); // ending gram | syl count (penult)
  const byInitN = new Map<string, Rec[]>(); // initial gram | syl count (second)
  const byEndN5 = new Map<string, Rec[]>(); // 5/4/3 ending gram | count (tail)
  const byEnd76 = new Map<string, Rec[]>(); // 7/6 ending gram, count-free (tail)
  const byInit76 = new Map<string, Rec[]>(); // 7/6 initial gram, count-free (head)
  const byInitN5 = new Map<string, Rec[]>(); // 5/4/3/2 initial gram | count (head)
  for (const [w, exp] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (FOREIGN.some((r) => r.test(w))) continue;
    const pred = g.predict(w, "en");
    if (!pred) continue;
    const pr = vowelRuns(pred);
    const dr = vowelRuns(exp);
    // medial positions only line up when both sides agree on count
    const sameCount = pr.length === dr.length && pr.length >= 3;
    const rec: Rec = {
      ps: stressedVowel(pred),
      ds: stressedVowel(exp),
      pf: finalVowel(pred),
      df: finalVowel(exp),
      pi: initialVowel(pred),
      di: initialVowel(exp),
      pc: finalCoda(pred),
      dc: finalCoda(exp),
      p2: sameCount ? pred.slice(pr[1][0], pr[1][1]) : "",
      d2: sameCount ? exp.slice(dr[1][0], dr[1][1]) : "",
      pp: sameCount
        ? pred.slice(pr[pr.length - 2][0], pr[pr.length - 2][1])
        : "",
      dp: sameCount ? exp.slice(dr[dr.length - 2][0], dr[dr.length - 2][1]) : "",
      pt: tailFromPrimary(pred),
      dt: tailFromPrimary(exp),
      ph: headToPrimary(pred),
      dh: headToPrimary(exp),
    };
    for (const k of [w.slice(-6), w.slice(-5), w.slice(-4), w.slice(-3)]) {
      if (k.length < 3) continue;
      let a = byGram.get(k);
      if (!a) byGram.set(k, (a = []));
      a.push(rec);
    }
    for (const k of [w.slice(0, 6), w.slice(0, 5), w.slice(0, 4), w.slice(0, 3)]) {
      if (k.length < 3) continue;
      let a = byInitGram.get(k);
      if (!a) byInitGram.set(k, (a = []));
      a.push(rec);
    }
    const ns = Math.min(pr.length, 5);
    if (sameCount) {
      for (const k of [`${w.slice(-4)}|${ns}`, `${w.slice(-3)}|${ns}`]) {
        if (k.indexOf("|") < 3) continue;
        let a = byEndN.get(k);
        if (!a) byEndN.set(k, (a = []));
        a.push(rec);
      }
      for (const k of [`${w.slice(0, 4)}|${ns}`, `${w.slice(0, 3)}|${ns}`]) {
        if (k.indexOf("|") < 3) continue;
        let a = byInitN.get(k);
        if (!a) byInitN.set(k, (a = []));
        a.push(rec);
      }
    }
    for (const k of [
      `${w.slice(-5)}|${ns}`,
      `${w.slice(-4)}|${ns}`,
      `${w.slice(-3)}|${ns}`,
    ]) {
      if (k.indexOf("|") < 3) continue;
      let a = byEndN5.get(k);
      if (!a) byEndN5.set(k, (a = []));
      a.push(rec);
    }
    for (const k of [w.slice(-8), w.slice(-7), w.slice(-6), w.slice(-5)]) {
      if (k.length < 5) continue;
      let a = byEnd76.get(k);
      if (!a) byEnd76.set(k, (a = []));
      a.push(rec);
    }
    for (const k of [w.slice(0, 8), w.slice(0, 7), w.slice(0, 6), w.slice(0, 5)]) {
      if (k.length < 5) continue;
      let a = byInit76.get(k);
      if (!a) byInit76.set(k, (a = []));
      a.push(rec);
    }
    for (const k of [
      `${w.slice(0, 5)}|${ns}`,
      `${w.slice(0, 4)}|${ns}`,
      `${w.slice(0, 3)}|${ns}`,
    ]) {
      if (k.indexOf("|") < 3) continue;
      let a = byInitN5.get(k);
      if (!a) byInitN5.set(k, (a = []));
      a.push(rec);
    }
  }

  const mine = (
    get: (r: Rec) => [string, string],
    grams: Map<string, Rec[]>,
    buckets: string[],
  ): Record<string, Record<string, string>> => {
    const out: Record<string, Record<string, string>> = {};
    for (const b of buckets) out[b] = {};
    for (const [k, recs] of grams) {
      if (recs.length < 2) continue;
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
      if (!mode || mc / recs.length < 0.65) continue;
      let fixes = 0;
      let breaks = 0;
      for (const r of recs) {
        const [p, d] = get(r);
        if (p !== d && mode === d) fixes++;
        else if (p === d && mode !== d) breaks++;
      }
      if (fixes - breaks < 1) continue;
      out[String(k.split("|")[0].length)][k] = mode;
    }
    return out;
  };

  const T43 = ["4", "3"];
  const stressed = mine((r) => [r.ps, r.ds], byGram, ["6","5","4","3"]);
  const final = mine((r) => [r.pf, r.df], byGram, ["6","5","4","3"]);
  const initial = mine((r) => [r.pi, r.di], byInitGram, ["6", "5", "4", "3"]);
  const coda = mine((r) => [r.pc, r.dc], byGram, ["6","5","4","3"]);
  const second = mine((r) => [r.p2, r.d2], byInitN, T43);
  const penult = mine((r) => [r.pp, r.dp], byEndN, T43);
  const tailN = mine((r) => [r.pt, r.dt], byEndN5, ["5", "4", "3"]);
  const tailF = mine((r) => [r.pt, r.dt], byEnd76, ["8", "7", "6", "5"]);
  const tail = {
    "8": tailF["8"], "7": tailF["7"], "6": tailF["6"],
    "5": { ...tailF["5"], ...tailN["5"] },
    "4": tailN["4"], "3": tailN["3"],
  };
  const headN = mine((r) => [r.ph, r.dh], byInitN5, ["5", "4", "3"]);
  const headF = mine((r) => [r.ph, r.dh], byInit76, ["8", "7", "6", "5"]);
  const head = {
    "8": headF["8"], "7": headF["7"], "6": headF["6"],
    "5": { ...headF["5"], ...headN["5"] },
    "4": headN["4"], "3": headN["3"],
  };
  writeFileSync(
    OUT,
    JSON.stringify({ stressed, final, initial, coda, second, penult, tail, head }),
  );
  const size = (t: Record<string, Record<string, string>>) =>
    Object.values(t).reduce((n, m) => n + Object.keys(m).length, 0);
  console.log(
    `vowel grams adopted (round ${ROUND}): stressed ${size(stressed)}, final ${size(final)}, initial ${size(initial)}, coda ${size(coda)}, second ${size(second)}, penult ${size(penult)}, tail ${size(tail)}, head ${size(head)}`,
  );
}

main();
