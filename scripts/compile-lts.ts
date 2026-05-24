/**
 * P3.0: Compile the alignment data into a runtime-shippable LTS table.
 *
 * Reads:  data/en/alignments.json  (per-word "g/p g/p ..." from scripts/align.ts)
 * Writes: data/en/lts.json         (compact letter-to-sound table)
 *
 * Output structure:
 *   {
 *     full:    { "L|g|R": "p" },   // most-likely phoneme with full L+R context
 *     leftCtx: { "L|g":   "p" },   // backoff when right context unknown
 *     rightCtx:{ "g|R":   "p" },   // backoff when left  context unknown
 *     noCtx:   { "g":     "p" }    // last-resort: pure grapheme→phoneme
 *   }
 *
 * Each level picks the most frequent phoneme observed for that key. Ties
 * are broken by preferring the longest phoneme cluster (more specific).
 *
 * "L" and "R" are single-letter contexts; "^" / "$" mark word boundaries.
 * "g" can be multi-letter (digraph, trigraph, etc.) — the set is whatever
 * appeared during alignment.
 */

import { readFileSync, writeFileSync } from "fs";

const aligned: Record<string, string> = JSON.parse(
  readFileSync("./data/en/alignments.json", "utf8")
);

// Filter to "native" English words only. Foreign borrowings retain
// source-language phonology; training the LTS on them contaminates
// English predictions (e.g., "in" → "æn" from a few French names
// poisoning every English -in word). The exception list handles
// foreign words at runtime, so the LTS only needs to do English well.
//
// Heuristics mirror scripts/mine-exceptions.ts ORIGIN_RULES — kept inline
// rather than imported to keep the compile step a leaf script.
const FOREIGN_PATTERNS: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/,                                  // Polish
  /(cz|sz|rz|szcz)/,                                                       // Polish clusters
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/,           // Italian
  /(gli|gn[aeiou])/,                                                       // Italian clusters (length-guarded below)
  /(eaux|aux|eau|oise|ois|aire|ette|elle|gne|ille|ique)$/,                // French
  /(beau|deau|reau|teau|mont|jean)/,                                       // French stems
  /(ez|os|illo|illa|ando|endo|ente)$/,                                     // Spanish (length-guarded)
  /(rodriguez|gonzalez|hernandez|sanchez|gomez|santos)/,                   // Spanish surname stems
  /(stein|berg|burg|mann|hoff|holz|brunn|heim|bach|wald|enstein)$/,       // German
  /(sch|tsch|pf)/,                                                         // German clusters
  /(ovich|evich|ovna|evna|insky|insk|ova|ev|ov|enko|sky)$/,                // Russian
  /(opoulos|idis|akis|opolous|antos|aros)$/,                               // Greek
  /(ahmed|hamed|hussein|hassan|abdul|mohammed|mohamed)/,                   // Arabic
  /^(mc|mac|o')/,                                                          // Celtic
  /(ough|llwyd|gwyn|aoibh)/,                                               // Celtic clusters
  /(tsuda|shima|moto|hara|yama|kawa|saki|naka|hashi|guchi|sato|suzuki|takaha)$/, // Japanese
  /^(nguyen|tran|huynh|wang|chen|liu|zhang|kim|lee|park|choi)$/,           // Asian
];
// Exclude common English words that happen to match foreign patterns.
const NATIVE_OVERRIDE = /^(scratch|scheme|schedule|sch|school)$/;
function isLikelyForeign(word: string): boolean {
  if (NATIVE_OVERRIDE.test(word)) return false;
  for (const p of FOREIGN_PATTERNS) {
    if (p.test(word) && word.length >= 5) return true;
  }
  return false;
}

// Counts: key → phoneme → count
type Counter = Map<string, Map<string, number>>;
const fullCtx: Counter = new Map();
const leftCtx: Counter = new Map();
const rightCtx: Counter = new Map();
const noCtx: Counter = new Map();

function bump(c: Counter, key: string, phoneme: string) {
  if (!c.has(key)) c.set(key, new Map());
  const m = c.get(key)!;
  m.set(phoneme, (m.get(phoneme) ?? 0) + 1);
}

let totalTriples = 0;
let nativeWords = 0;
let foreignSkipped = 0;
for (const [word, alignStr] of Object.entries(aligned)) {
  if (isLikelyForeign(word)) {
    foreignSkipped++;
    continue;
  }
  nativeWords++;
  const pairs = alignStr.split(" ").map((s: string): [string, string] => {
    const idx = s.indexOf("/");
    return [s.slice(0, idx), s.slice(idx + 1)];
  });
  let pos = 0;
  for (let i = 0; i < pairs.length; i++) {
    const [g, p] = pairs[i];
    const left = pos === 0 ? "^" : word[pos - 1];
    const right = pos + g.length >= word.length ? "$" : word[pos + g.length];
    bump(fullCtx, `${left}|${g}|${right}`, p);
    bump(leftCtx, `${left}|${g}`, p);
    bump(rightCtx, `${g}|${right}`, p);
    bump(noCtx, g, p);
    totalTriples++;
    pos += g.length;
  }
}

// Convert counter → flat record of (key → most-likely phoneme).
//
// minSupport is applied per-entry. Additionally, multi-char graphemes get
// a higher floor: clusters that fire rarely (e.g., "in"→"æn" from a
// handful of French proper nouns) are misleading because the aligner only
// emits them when the rare phon matches — English -in words go through
// "i"+"n" instead, so the cluster never sees its dominant realization.
// Dropping these forces the runtime to back off to single-letter lookup.
function compact(
  c: Counter,
  minSupport: number,
  isCluster: (key: string) => boolean = () => false,
  clusterMin = 100
): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(c.entries()).forEach(([key, phons]: [string, Map<string, number>]) => {
    const total = Array.from(phons.values()).reduce((a: number, b: number) => a + b, 0);
    const floor = isCluster(key) ? Math.max(minSupport, clusterMin) : minSupport;
    if (total < floor) return;
    // Pick most frequent; break ties by preferring longer phoneme cluster.
    let bestP = "";
    let bestN = -1;
    Array.from(phons.entries()).forEach(([p, n]: [string, number]) => {
      if (n > bestN || (n === bestN && p.length > bestP.length)) {
        bestN = n;
        bestP = p;
      }
    });
    out[key] = bestP;
  });
  return out;
}

// Multi-char grapheme detector — the grapheme part of the key is either
// the whole key (noCtx) or the middle segment for context-keyed tables.
const graphemeOf = (key: string): string => {
  const parts = key.split("|");
  return parts.length === 3 ? parts[1] : parts.length === 2 ? (parts[0].length === 1 ? parts[1] : parts[0]) : parts[0];
};
const isMultiCharCluster = (key: string) => graphemeOf(key).length >= 2;

const lts = {
  full: compact(fullCtx, 2, isMultiCharCluster, 30),
  leftCtx: compact(leftCtx, 2, isMultiCharCluster, 50),
  rightCtx: compact(rightCtx, 2, isMultiCharCluster, 50),
  noCtx: compact(noCtx, 1, isMultiCharCluster, 100),
};

const sizes = {
  full: Object.keys(lts.full).length,
  leftCtx: Object.keys(lts.leftCtx).length,
  rightCtx: Object.keys(lts.rightCtx).length,
  noCtx: Object.keys(lts.noCtx).length,
};

writeFileSync("./data/en/lts.json", JSON.stringify(lts), "utf8");

console.log(`Native words used:  ${nativeWords}`);
console.log(`Foreign skipped:    ${foreignSkipped}`);
console.log(`Triples emitted:    ${totalTriples}`);
console.log(`Compact table sizes:`);
console.log(`  full      (L|g|R): ${sizes.full}`);
console.log(`  leftCtx   (L|g):   ${sizes.leftCtx}`);
console.log(`  rightCtx  (g|R):   ${sizes.rightCtx}`);
console.log(`  noCtx     (g):     ${sizes.noCtx}`);

// Quick sanity: top 20 grapheme clusters
const sorted = Array.from(noCtx.entries())
  .map(([g, phons]: [string, Map<string, number>]): [string, number] => [g, Array.from(phons.values()).reduce((a: number, b: number) => a + b, 0)])
  .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
  .slice(0, 20);
console.log(`\nTop graphemes by usage:`);
for (const [g, n] of sorted) {
  const phons = noCtx.get(g)!;
  const best = Array.from(phons.entries()).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0];
  console.log(`  ${g.padEnd(6)} ${n.toString().padStart(6)}  most→ ${best[0] || "∅"} (${best[1]})`);
}
