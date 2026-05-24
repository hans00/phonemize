/**
 * Quality check: rules + exceptions vs rules-alone vs dict-only.
 *
 * Three configurations scored against the same dict:
 *   1. rules only       (disableDict=true, useExceptions=false) — current eval baseline
 *   2. rules + exceptions (disableDict=true, useExceptions=false but pre-loading exceptions)
 *      — actually we mirror the "no-dict-shipping" world by manually
 *      replacing dict lookup with exceptions lookup
 *   3. dict only (disableDict=false) — production today
 */

import EnglishG2P from "../src/en-g2p";
import { readFileSync } from "fs";
import * as levenshtein from "fast-levenshtein";
import { statSync } from "fs";
import { lookupException, exceptionCount } from "../src/en-exceptions";

const dict: Record<string, string> = JSON.parse(
  readFileSync("./data/en/dict.json", "utf8")
);

const SIMILAR: string[][] = [
  ["ə", "ʌ"], ["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"],
];
function norm(s: string): string { return s.replace(/[ˈˌ]/g, ""); }
function canon(s: string): string {
  let t = norm(s);
  SIMILAR.forEach((g: string[]) => {
    const c = g[0];
    for (let i = 1; i < g.length; i++) t = t.replace(new RegExp(g[i], "g"), c);
  });
  return t;
}

interface Scores { total: number; exact: number; lenient: number; }

function scoreRules(): Scores {
  // Pure rules — the current eval baseline
  const g2p = new EnglishG2P({ disableDict: true });
  let total = 0, exact = 0, lenient = 0;
  for (const [w, exp] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (w.length < 3 || w.length > 12) continue;
    const pred = g2p.predict(w, "en");
    if (!pred) continue;
    total++;
    if (norm(pred) === norm(exp)) exact++;
    if (levenshtein.get(canon(pred), canon(exp)) <= 1) lenient++;
  }
  return { total, exact, lenient };
}

function scoreRulesPlusExceptions(): Scores {
  // What a user gets when we ship rules + exceptions.json (NO dict).
  // We manually merge: exception lookup first, fall through to rules.
  const g2p = new EnglishG2P({ disableDict: true });
  let total = 0, exact = 0, lenient = 0;
  for (const [w, exp] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (w.length < 3 || w.length > 12) continue;
    const ex = lookupException(w);
    const pred = ex ?? g2p.predict(w, "en");
    if (typeof pred !== "string" || typeof exp !== "string") continue;
    total++;
    if (norm(pred) === norm(exp)) exact++;
    if (levenshtein.get(canon(pred), canon(exp)) <= 1) lenient++;
  }
  return { total, exact, lenient };
}

function scoreDict(): Scores {
  // Production today — full dict lookup.
  const g2p = new EnglishG2P({ disableDict: false });
  let total = 0, exact = 0, lenient = 0;
  for (const [w, exp] of Object.entries(dict)) {
    if (!/^[a-z]+$/.test(w)) continue;
    if (w.length < 3 || w.length > 12) continue;
    const pred = g2p.predict(w, "en");
    if (!pred) continue;
    total++;
    if (norm(pred) === norm(exp)) exact++;
    if (levenshtein.get(canon(pred), canon(exp)) <= 1) lenient++;
  }
  return { total, exact, lenient };
}

const fmt = (n: number, d: number) => ((n / d) * 100).toFixed(2) + "%";

console.log(`Shipped exceptions: ${exceptionCount()} entries`);
console.log();

const r = scoreRules();
console.log(`=== 1. Rules only (current eval baseline) ===`);
console.log(`   exact:   ${r.exact} (${fmt(r.exact, r.total)})`);
console.log(`   lenient: ${r.lenient} (${fmt(r.lenient, r.total)})`);

const e = scoreRulesPlusExceptions();
console.log(`\n=== 2. Rules + exceptions.json (~300 KB, proposed future) ===`);
console.log(`   exact:   ${e.exact} (${fmt(e.exact, e.total)})`);
console.log(`   lenient: ${e.lenient} (${fmt(e.lenient, e.total)})`);
console.log(`   Δ vs rules: exact ${e.exact - r.exact >= 0 ? "+" : ""}${e.exact - r.exact}  lenient ${e.lenient - r.lenient >= 0 ? "+" : ""}${e.lenient - r.lenient}`);

const d = scoreDict();
console.log(`\n=== 3. Full dict.json (2.7 MB, production today) ===`);
console.log(`   exact:   ${d.exact} (${fmt(d.exact, d.total)})`);
console.log(`   lenient: ${d.lenient} (${fmt(d.lenient, d.total)})`);

const dictSize = (statSync("./data/en/dict.json").size / 1024).toFixed(0);
const excSize = (statSync("./data/en/exceptions.json").size / 1024).toFixed(0);
console.log(`\n=== Size comparison ===`);
console.log(`   dict.json:        ${dictSize.padStart(4)} KB    lenient ${fmt(d.lenient, d.total)}`);
console.log(`   exceptions.json:  ${excSize.padStart(4)} KB    lenient ${fmt(e.lenient, e.total)}  (rules + exceptions)`);
console.log(`   (rules only):        0 KB    lenient ${fmt(r.lenient, r.total)}`);
