/** Offline stress counterfactuals through the real public prediction path. */
import { strict as assert } from "assert";
import { createHash } from "crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import levenshtein from "fast-levenshtein";
import EnglishG2P from "../src/en/g2p";
import { EN_PREFIXES } from "../src/en/syllabify";
import dictionary from "../data/en/dict.json";
import { isForeign } from "./foreign-filter";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("yarn diagnose:stress [--all] [--include-long] [--out DIR]");
  console.log("Default: English subset. Diagnostic ranking only; rebuild and gate every proposed rule.");
  process.exit(0);
}
const at = args.indexOf("--out");
const out = at < 0 ? "/tmp/phonemize-stress-diagnosis" : args[at + 1];
if (!out || out.startsWith("--")) throw new Error("--out requires a directory");
const repo = join(__dirname, "..");
const frequencyPath = join(repo, "scripts/.common-accuracy-cache/frequency.txt");
const frequency = new Set(readFileSync(frequencyPath, "utf8").trim().split(/\s+/));
const all = args.includes("--all"), includeLong = args.includes("--include-long");
const words = Object.keys(dictionary).filter(w => /^[a-z']+$/i.test(w) &&
  w.length >= 3 && w.length <= (includeLong ? 40 : 12) && /[aeiou]/i.test(w) &&
  (all || frequency.has(w.toLowerCase()) && !isForeign(w.toLowerCase())));
const strip = (s: string): string => s.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə");
function canon(s: string): string {
  s = strip(s);
  for (const group of [["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"]])
    for (const phone of group.slice(1)) s = s.split(phone).join(group[0]);
  return s;
}
const score = (p: string, gold: string): number[] => [Number(strip(p) === strip(gold)),
  Number(levenshtein.get(canon(p), canon(gold)) <= 1)];
type Render = { syllables: string[]; stressedIdx: number; ipa: string[] };
type Lab = { predict: EnglishG2P["predict"]; ruleSyllables(w: string, stress?: number, ...rest: unknown[]): Render };
const files = ["scripts/diagnose-stress.ts", "src/utils.ts", ...readdirSync(join(repo, "src/en")).filter(f => f.endsWith(".ts")).map(f => `src/en/${f}`),
  "data/en/dict.json", "data/en/exceptions.json", "data/en/homographs.json", "data/en/compound-parts.json", "scripts/foreign-filter.ts", "scripts/.common-accuracy-cache/frequency.txt"];
const hash = (file: string): string => createHash("sha256").update(readFileSync(join(repo, file))).digest("hex");
const hashes = Object.fromEntries(files.map(file => [file, hash(file)]));
const original = new EnglishG2P({ disableDict: true });
const lab = new EnglishG2P({ disableDict: true }) as unknown as Lab;
const render = lab.ruleSyllables;
let active = "", forced: number | undefined, captured: Render | undefined;
// One isolated instance; no prototype, module, table or production edits.
// Keep all dispatch decisions and explicitly forced bound-root stress intact.
lab.ruleSyllables = function(w, stress, ...rest) {
  const own = w === active && stress === undefined;
  const result = render.call(this, w, own ? forced : stress, ...rest);
  if (own) captured = result;
  return result;
};
const modes: Record<string, (n: number) => number> = {
  initial: () => 0, second: () => 1, penult: n => n - 2, antepenult: n => n - 3,
};
const suffixes = "ate ary ery ory al ent ant ic ice ive ure ine ment ance ence er ia io ism um sis ity ous y a o".split(" ");
type Row = { word: string; slots: string[]; oldStress: number; target: number; before: string; after: string; gold: string; delta: number[] };
type Group = { mode: string; signature: string[]; support: number; changed: number; strict: number[]; lenient: number[]; rowIndices: number[] };
const groups = new Map<string, Group>();
const rows: Array<Row & { mode: string }> = [];
let inScope = 0;
for (const word of words) {
  active = word.toLowerCase(); forced = undefined; captured = undefined;
  const before = original.predict(word, "en")!, gold = dictionary[word as keyof typeof dictionary];
  assert.equal(lab.predict(word, "en"), before, `Baseline replay: ${word}`);
  // Morphology may never render the target itself, or may supply bound-root
  // stress explicitly. Those words are verified controls, not interventions.
  const baseline = captured as Render | undefined;
  if (!baseline) continue;
  inScope++;
  const slots = baseline.syllables, b = score(before, gold);
  const coda = (s: string): string => /[aeiouy]$/.test(s) ? "open" : "closed";
  const features = ["n=" + slots.length, "firstV=" + (slots[0]?.match(/[aeiouy]/)?.[0] ?? "-"),
    "firstCoda=" + coda(slots[0] ?? ""), "last=" + (/^[^aeiouy]*[^aeiouyl]e$/.test(slots.at(-1) ?? "") ? "silentE" : coda(slots.at(-1) ?? ""))];
  if (EN_PREFIXES.has(slots[0])) features.push("prefix=" + slots[0]);
  for (const suffix of suffixes) if (active.endsWith(suffix)) features.push("suffix=" + suffix);
  if (slots[1]) features.push("secondCoda=" + coda(slots[1]));
  const signatures = features.map(f => [f]);
  for (let i = 0; i < features.length; i++)
    for (let j = i + 1; j < features.length; j++) signatures.push([features[i], features[j]]);
  for (const [mode, position] of Object.entries(modes)) {
    const target = position(slots.length);
    if (target < 0 || target >= slots.length || !/[aeiouɑæɛɪɔʊʌəɝ]/.test(baseline.ipa[target] ?? "")) continue;
    forced = target;
    const after = lab.predict(word, "en")!, a = score(after, gold), delta = a.map((s, i) => s - b[i]);
    const rowIndex = before === after ? -1 : rows.push({ mode, word, slots, oldStress: baseline.stressedIdx, target, before, after, gold, delta }) - 1;
    for (const signature of signatures) {
      const key = mode + "|" + signature.join("&");
      if (!groups.has(key)) groups.set(key, { mode, signature, support: 0, changed: 0, strict: [0, 0], lenient: [0, 0], rowIndices: [] });
      const group = groups.get(key)!; group.support++;
      if (before === after) continue;
      group.changed++;
      for (let i = 0; i < 2; i++) {
        const metric = i === 0 ? group.strict : group.lenient;
        if (delta[i]) metric[delta[i] > 0 ? 0 : 1]++;
      }
      group.rowIndices.push(rowIndex);
    }
  }
}
const ranked = [...groups.values()].filter(g => g.support >= 5 && g.changed >= 3)
  .sort((a, b) => (b.lenient[0] - b.lenient[1]) - (a.lenient[0] - a.lenient[1]) ||
    (b.strict[0] - b.strict[1]) - (a.strict[0] - a.strict[1]));
for (const file of files) assert.equal(hash(file), hashes[file], `Input changed during diagnosis: ${file}`);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "results.json"), JSON.stringify({ scope: all ? "full dictionary" : "English subset", n: words.length,
  baselineVerified: words.length, inScope, includeLong, hashes, rows, ranked }, null, 2) + "\n");
console.log(`Verified ${words.length} public predictions; ${inScope} target renderings allow a stress intervention.`);
for (const g of ranked.slice(0, 30))
  console.log(`${g.mode}|${g.signature.join("&")}: n=${g.support}, changed=${g.changed}, strict +${g.strict[0]}/-${g.strict[1]}, lenient +${g.lenient[0]}/-${g.lenient[1]}`);
console.log(`Diagnosis only; full win/loss rows: ${join(out, "results.json")}`);
