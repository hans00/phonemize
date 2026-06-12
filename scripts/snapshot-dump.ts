/**
 * Byte-identical refactor gate.
 *
 * Dumps `word\tipa` lines for every word in the dict across the code
 * paths a refactor of en-g2p.ts can touch, so that
 *
 *   tsx scripts/snapshot-dump.ts /tmp/snap-before.txt   (at parent commit)
 *   tsx scripts/snapshot-dump.ts /tmp/snap-after.txt    (after refactor)
 *   diff /tmp/snap-before.txt /tmp/snap-after.txt
 *
 * proves the change is output-preserving: identical predictions imply
 * identical eval scores. Configurations covered:
 *
 *   dict:  default EnglishG2P over all dict words (dict + phonotactics path)
 *   rule:  disableDict over the same words (syllabify/stress/post-lexical path)
 *   morph: dict-enabled predict() over derived forms (+s/+ed/+ing/+ly/…)
 *          not present in the dict — the only corpus that exercises
 *          tryMorphologicalAnalysis at scale
 *   pos:   eval-data tokens predicted with a pos tag — covers the
 *          weak-form / monosyllable-stress connected-speech branch
 */
import EnglishG2P from "../src/en-g2p";
import dictionary from "../data/en/dict.json";
import fs from "fs";
import { join } from "path";

const out = process.argv[2];
if (!out) {
  console.error("usage: tsx scripts/snapshot-dump.ts <output-file>");
  process.exit(1);
}

const dict = dictionary as Record<string, string>;
const words = Object.keys(dict).sort();

const g2pDict = new EnglishG2P();
const g2pRule = new EnglishG2P({ disableDict: true });

const lines: string[] = [];

for (const w of words) {
  lines.push(`dict\t${w}\t${g2pDict.predict(w, "en")}`);
}
for (const w of words) {
  lines.push(`rule\t${w}\t${g2pRule.predict(w, "en")}`);
}

// Derived forms: suffixed variants absent from the dict route through
// tryMorphologicalAnalysis (and the clitic splitter for 's).
const SUFFIXES = ["s", "es", "ed", "ing", "er", "ly", "ally", "ness", "able", "'s"];
for (const w of words) {
  for (const suf of SUFFIXES) {
    const form = w + suf;
    if (dict[form] !== undefined) continue;
    lines.push(`morph\t${form}\t${g2pDict.predict(form, "en")}`);
  }
}

// Connected-speech branch: pos supplied → weak forms + monosyllable
// stress drop. Tokens from the eval-data passages.
const evalDir = join(__dirname, "eval-data");
const tokens = new Set<string>();
for (const f of fs.readdirSync(evalDir).sort()) {
  if (!f.endsWith(".txt")) continue;
  const text = fs.readFileSync(join(evalDir, f), "utf8");
  for (const m of text.toLowerCase().matchAll(/[a-z']+/g)) tokens.add(m[0]);
}
for (const t of [...tokens].sort()) {
  lines.push(`pos:NN\t${t}\t${g2pDict.predict(t, "en", "NN")}`);
  lines.push(`pos:IN\t${t}\t${g2pDict.predict(t, "en", "IN")}`);
}

fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`${lines.length} predictions → ${out}`);
