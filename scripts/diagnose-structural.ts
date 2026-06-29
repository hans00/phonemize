/**
 * Categorize structural mismatches in the strict eval.
 *
 * For each word where prediction differs in length from expected by 1
 * segment, locate the (single) divergence and report what segment is
 * extra (in prediction) or missing (from prediction). Group by the
 * affected segment to surface dominant rule errors.
 */

import { readFileSync } from "fs";
import EnglishG2P from "../src/en/g2p";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

const STRESS = /[ˈˌ]/g;
const stripStress = (s: string) => s.replace(STRESS, "");

const FOREIGN: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/, /(cz|sz|rz|szcz)/,
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/,
  /(gli|gn[aeiou])/,
  /(eaux|aux|eau|oise|ois|aire|ette|elle|gne|ille|ique)$/,
  /(stein|berg|burg|mann|hoff|holz|brunn|heim|bach|wald|enstein)$/,
  /(sch|tsch|pf)/,
  /(ovich|evich|ovna|evna|insky|insk|ova|enko|sky)$/,
  /(opoulos|idis|akis)$/,
  /^(mc|mac|o')/,
];
function isForeign(w: string) {
  if (/^(scratch|scheme|schedule|sch|school)$/.test(w)) return false;
  return FOREIGN.some((p) => p.test(w) && w.length >= 5);
}

const g2p = new EnglishG2P({ disableDict: true });

interface Bucket { count: number; sample: string[]; }
const extra: Map<string, Bucket> = new Map(); // segment we have but shouldn't
const missing: Map<string, Bucket> = new Map(); // segment dict has but we don't

function record(map: Map<string, Bucket>, key: string, sample: string) {
  if (!map.has(key)) map.set(key, { count: 0, sample: [] });
  const b = map.get(key)!;
  b.count++;
  if (b.sample.length < 4) b.sample.push(sample);
}

let totalLen1 = 0;
for (const [word, expected] of Object.entries(dict)) {
  if (!/^[a-z]+$/.test(word)) continue;
  if (word.length < 3 || word.length > 12) continue;
  if (isForeign(word)) continue;
  const pred = g2p.predict(word, "en");
  if (typeof pred !== "string") continue;
  const p = stripStress(pred);
  const e = stripStress(expected);
  if (p === e) continue;
  if (p.length === e.length) continue;
  const delta = p.length - e.length;
  if (Math.abs(delta) !== 1) continue;
  totalLen1++;

  // Find the divergence position. Walk forward until mismatch, also
  // walk backward to handle middle insertions. The single differing
  // segment is the inserted/missing one.
  let head = 0;
  while (head < Math.min(p.length, e.length) && p[head] === e[head]) head++;
  let pTail = p.length - 1, eTail = e.length - 1;
  while (pTail >= head && eTail >= head && p[pTail] === e[eTail]) { pTail--; eTail--; }

  if (delta > 0) {
    // Extra segment in prediction at position [head..pTail]
    const seg = p.slice(head, pTail + 1);
    if (seg.length === 1) {
      const left = p[head - 1] ?? "^";
      const right = p[pTail + 1] ?? "$";
      record(extra, seg, `${word}: ${pred}  vs  ${expected}  [left=${left} right=${right}]`);
    }
  } else {
    const seg = e.slice(head, eTail + 1);
    if (seg.length === 1) {
      const left = e[head - 1] ?? "^";
      const right = e[eTail + 1] ?? "$";
      record(missing, seg, `${word}: ${pred}  vs  ${expected}  [left=${left} right=${right}]`);
    }
  }
}

console.log(`Single-segment structural mismatches: ${totalLen1}`);
console.log(`\n=== Top "extra segment" (we emit, dict doesn't) ===`);
for (const [seg, b] of Array.from(extra.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 12)) {
  console.log(`  ${seg.padEnd(3)} extra  ${b.count.toString().padStart(5)} words`);
  for (const s of b.sample.slice(0, 2)) console.log(`    ${s}`);
}
console.log(`\n=== Top "missing segment" (dict emits, we don't) ===`);
for (const [seg, b] of Array.from(missing.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 12)) {
  console.log(`  ${seg.padEnd(3)} missing ${b.count.toString().padStart(5)} words`);
  for (const s of b.sample.slice(0, 2)) console.log(`    ${s}`);
}
