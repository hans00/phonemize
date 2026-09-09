/**
 * Win/loss harness for rule changes on the rules-only path.
 *
 *   yarn rule-diff dump <out.tsv>                 # word\tipa for every dict word, disableDict
 *   yarn rule-diff compare <before.tsv> <after.tsv> [--show N] [--common <frequency.txt>]
 *
 * compare reports, for words whose prediction changed: strict (stress-
 * stripped exact) and lenient (evaluate.ts canon + Levenshtein ≤ 1) wins
 * and losses against data/en/dict.json, the same split restricted to the
 * top-5000 frequency list (scripts/.common-accuracy-cache/frequency.txt
 * after `yarn test:common-accuracy --download`), and samples of each.
 * A rule is adoptable when strict and common wins both exceed losses.
 */
import EnglishG2P from "../src/en/g2p";
import dictionary from "../data/en/dict.json";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import levenshtein from "fast-levenshtein";

const dict = dictionary as Record<string, string>;
const SIMILAR: string[][] = [
  ["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"],
];
const strip = (s: string): string => s.replace(/[ˈˌ]/g, "");
function canon(s: string): string {
  let out = strip(s);
  for (const g of SIMILAR) for (let i = 1; i < g.length; i++) out = out.split(g[i]).join(g[0]);
  return out;
}
const lenientOk = (p: string, d: string): boolean => levenshtein.get(canon(p), canon(d)) <= 1;

const [mode, ...rest] = process.argv.slice(2);

if (mode === "dump") {
  const out = rest[0];
  if (!out) throw new Error("usage: rule-diff dump <out.tsv>");
  const g2p = new EnglishG2P({ disableDict: true });
  const lines: string[] = [];
  for (const w of Object.keys(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    lines.push(`${w}\t${g2p.predict(w, "en") ?? ""}`);
  }
  writeFileSync(out, lines.join("\n") + "\n");
  console.log(`dumped ${lines.length} words to ${out}`);
} else if (mode === "compare") {
  const [before, after] = rest;
  if (!before || !after) throw new Error("usage: rule-diff compare <before.tsv> <after.tsv>");
  const showAt = rest.indexOf("--show");
  const show = showAt >= 0 ? parseInt(rest[showAt + 1], 10) : 25;
  const commonAt = rest.indexOf("--common");
  const commonPath = commonAt >= 0
    ? rest[commonAt + 1]
    : join(__dirname, ".common-accuracy-cache", "frequency.txt");
  const common = new Set(
    existsSync(commonPath)
      ? readFileSync(commonPath, "utf8").split("\n").slice(0, 5000).map((l) => l.split(/\s+/)[0].toLowerCase())
      : [],
  );
  const read = (f: string): Map<string, string> =>
    new Map(readFileSync(f, "utf8").split("\n").filter((l) => l.includes("\t")).map((l) => l.split("\t") as [string, string]));
  const b = read(before);
  const a = read(after);
  const n = { changed: 0, strictWin: 0, strictLoss: 0, lenientWin: 0, lenientLoss: 0, commonWin: 0, commonLoss: 0, commonLenientWin: 0, commonLenientLoss: 0 };
  type Row = [string, string, string, string];
  const wins: Row[] = [], losses: Row[] = [], cw: Row[] = [], cl: Row[] = [];
  for (const [w, pa] of a) {
    const pb = b.get(w);
    if (pb === undefined || pa === pb) continue;
    const d = dict[w];
    n.changed++;
    const sb = strip(pb) === strip(d), sa = strip(pa) === strip(d);
    const lb = lenientOk(pb, d), la = lenientOk(pa, d);
    const row: Row = [w, pb, pa, d];
    if (sa && !sb) { n.strictWin++; wins.push(row); if (common.has(w)) { n.commonWin++; cw.push(row); } }
    if (sb && !sa) { n.strictLoss++; losses.push(row); if (common.has(w)) { n.commonLoss++; cl.push(row); } }
    if (la && !lb) { n.lenientWin++; if (common.has(w)) n.commonLenientWin++; }
    if (lb && !la) { n.lenientLoss++; if (common.has(w)) n.commonLenientLoss++; }
  }
  const fmt = (rows: Row[]): string => rows.slice(0, show).map(([w, x, y, d]) => `  ${w}: ${x} → ${y} (dict ${d})`).join("\n");
  console.log(JSON.stringify(n));
  if (common.size === 0) console.log("(no frequency list found; common-word counts are zero)");
  console.log(`common strict wins (${cw.length}):\n${fmt(cw)}`);
  console.log(`common strict losses (${cl.length}):\n${fmt(cl)}`);
  console.log(`strict losses (${losses.length}):\n${fmt(losses)}`);
  console.log(`strict wins (${wins.length}):\n${fmt(wins)}`);
} else {
  throw new Error("usage: rule-diff dump <out> | compare <before> <after>");
}
