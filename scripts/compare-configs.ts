/**
 * Quick deterministic comparison of EnglishG2P configurations on the
 * eval-with-ai test passage. Shows the IPA each config produces for each
 * word so we can see *exactly* where exceptions help (or don't).
 *
 * Configs compared:
 *   A. Pure rules           (disableDict=true, useExceptions=false)
 *   B. Rules + exceptions   (disableDict=true, useExceptions=true)   ← proposed
 *   C. Dict + exceptions    (disableDict=false, useExceptions=true)
 *   D. Dict only (today)    (disableDict=false, useExceptions=false)
 *
 * For each word: show A vs B vs D. Highlight words where B differs from D
 * (those are the cases where dropping the dict matters).
 */

import { readFileSync } from "fs";
import EnglishG2P from "../src/en-g2p";

const passage = readFileSync(
  "./scripts/eval-data/01-en-irregular-spellings.txt",
  "utf8"
)
  .split("\n")
  .filter((l) => !l.startsWith("#") && l.trim())
  .join(" ");

const a = new EnglishG2P({ disableDict: true, useExceptions: false });
const b = new EnglishG2P({ disableDict: true, useExceptions: true });
const d = new EnglishG2P({ disableDict: false, useExceptions: false });

const words = passage
  .toLowerCase()
  .replace(/[.,;:!?“”"'‘’()—–]/g, "")
  .split(/\s+/)
  .filter((w) => /^[a-z'’-]+$/.test(w));

const uniq = Array.from(new Set(words));

let mismatchAvD = 0;
let mismatchBvD = 0;
let aMatchedD = 0;
let bMatchedD = 0;

console.log(`${"word".padEnd(15)} ${"rules-only".padEnd(20)} ${"rules+exc".padEnd(20)} ${"dict".padEnd(20)} verdict`);
console.log("-".repeat(95));
for (const w of uniq) {
  const pa = a.predict(w, "en") ?? "";
  const pb = b.predict(w, "en") ?? "";
  const pd = d.predict(w, "en") ?? "";
  const aMatch = pa === pd;
  const bMatch = pb === pd;
  if (aMatch) aMatchedD++;
  if (bMatch) bMatchedD++;
  if (!aMatch) mismatchAvD++;
  if (!bMatch) mismatchBvD++;

  const verdict =
    aMatch && bMatch
      ? "ok"
      : !aMatch && bMatch
      ? "exc FIXED rule-miss"
      : aMatch && !bMatch
      ? "exc BROKE it"
      : "both off";
  // Only show interesting rows.
  if (!aMatch || !bMatch) {
    console.log(
      `${w.padEnd(15)} ${pa.padEnd(20)} ${pb.padEnd(20)} ${pd.padEnd(20)} ${verdict}`
    );
  }
}

const fmt = (n: number, d: number) => ((n / d) * 100).toFixed(1) + "%";
console.log("-".repeat(95));
console.log(`Total unique words: ${uniq.length}`);
console.log(`Rules-only matches dict:        ${aMatchedD} (${fmt(aMatchedD, uniq.length)})`);
console.log(`Rules+exceptions matches dict:  ${bMatchedD} (${fmt(bMatchedD, uniq.length)})`);
console.log(`Words exceptions fix vs rules:  ${bMatchedD - aMatchedD}`);
