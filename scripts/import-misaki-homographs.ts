/**
 * Regenerates src-data/en/homographs-misaki.txt from misaki's US lexicons
 * (hexgrad/misaki, Apache-2.0), pinned to one commit.
 *
 *   tsx scripts/import-misaki-homographs.ts
 *
 * misaki keys a word's readings by POS. Only the splits the runtime tagger
 * can act on are imported:
 *   {DEFAULT, VERB} → VERB when tagged V, else DEFAULT
 *   {DEFAULT, NOUN} → NOUN when tagged N, else DEFAULT
 * The tagger emits N only on noun evidence (a determiner or preposition
 * before the word), so without evidence a word keeps misaki's DEFAULT —
 * "consists" stays the verb, not the rare noun /ˈkɑnsɪsts/.
 * misaki decides which reading goes with which POS; CMUdict (the pinned copy
 * the top-5000 benchmark uses) vouches for the readings. A split is kept when
 * CMUdict attests one reading and the other is attested too or differs from
 * it only by one of the two regular English noun/verb alternations: a stress
 * shift, with the de-stressed vowel free to reduce (ˈɪnvɝt / ənˈvɝt), or
 * word-final -ate /ət/ ~ /eɪt/ (CMUdict
 * rarely lists the /ət/ noun of an -ate verb). A misaki typo (ˌɪlləʤˈɪɾəmət),
 * or an unattested reading (ˈɔɡməntᵻd) is dropped.
 * build-dict merges misaki < upstream homographs.en < homographs-custom.txt,
 * so this file only fills words the other two lack.
 */
import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { join } from "path";
import cmuSources = require("./common-accuracy-sources.json");

const COMMIT = "fba1236595f2d2bf21d414ba6e57d25256afada3";
const FILES = ["us_gold.json", "us_silver.json"];
const OUT = join(__dirname, "../src-data/en/homographs-misaki.txt");

const VOWELS: Record<string, string> = {
  A: "EY", I: "AY", O: "OW", W: "AW", Y: "OY", i: "IY", ɪ: "IH", ɛ: "EH", æ: "AE", ɑ: "AA",
  ɔ: "AO", ʌ: "AH", ə: "AH", ᵊ: "AH", ᵻ: "IH", ʊ: "UH", u: "UW",
};
const CONSONANTS: Record<string, string> = {
  b: "B", d: "D", f: "F", h: "HH", j: "Y", k: "K", l: "L", m: "M", n: "N", p: "P", s: "S",
  t: "T", v: "V", w: "W", z: "Z", ð: "DH", ŋ: "NG", ɡ: "G", ɹ: "R", ʃ: "SH", ʒ: "ZH",
  θ: "TH", ʤ: "JH", ʧ: "CH", ɾ: "T",
};

// misaki writes the stress mark immediately before the stressed vowel.
export function misakiToArpabet(ipa: string): string {
  const out: string[] = [];
  let stress = "0";
  const chars = [...ipa];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === "ˈ") { stress = "1"; continue; }
    if (c === "ˌ") { stress = "2"; continue; }
    // r-coloured vowel: ɜɹ always, ə/ʌ + ɹ when no vowel follows the ɹ.
    if ((c === "ɜ" || c === "ə" || c === "ʌ") && chars[i + 1] === "ɹ" && (c === "ɜ" || !VOWELS[chars[i + 2]])) {
      out.push(`ER${stress}`); stress = "0"; i++; continue;
    }
    if (VOWELS[c]) { out.push(`${VOWELS[c]}${stress}`); stress = "0"; continue; }
    if (CONSONANTS[c]) { out.push(CONSONANTS[c]); continue; }
    throw new Error(`Unknown misaki symbol "${c}" in ${ipa}`);
  }
  return out.join(" ");
}

// Compare readings on segments and primary stress only: secondary vs no
// stress, and the quality of an unstressed reduced vowel, are notation.
function key(arpabet: string): string {
  return arpabet.split(" ").map((p) => {
    const m = p.match(/^([A-Z]+)([012])$/);
    if (!m) return p;
    if (m[2] !== "1" && ["AH", "IH", "UH"].includes(m[1])) return "AX";
    return m[2] === "1" ? `${m[1]}1` : m[1];
  }).join(" ");
}

async function loadCmu(): Promise<Map<string, string[]>> {
  const res = await fetch(cmuSources.reference.url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} CMUdict`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== cmuSources.reference.sha256) throw new Error("CMUdict checksum mismatch");
  const cmu = new Map<string, string[]>();
  for (const line of bytes.toString("utf8").split(/\r?\n/)) {
    const m = line.split("#")[0].trim().match(/^([^\s(]+)(?:\(\d+\))?\s+(.+)$/);
    if (!m) continue;
    cmu.set(m[1], [...(cmu.get(m[1]) ?? []), m[2]]);
  }
  return cmu;
}

async function main() {
  const cmu = await loadCmu();
  const attested = (word: string, reading: string) => (cmu.get(word) ?? []).find((c) => key(c) === key(reading));
  const segments = (k: string) => k.replace(/1/g, "");
  const ateBase = (k: string) => segments(k).replace(/ (EY|AX) T$/, " ATE");
  const devoiced = (a: string) => segments(key(a)).replace(/\bZ\b/g, "S").replace(/\bDH\b/g, "TH").replace(/\bV\b/g, "F");
  // Stress shift: same phones, and where the stress differs the vowel may
  // also reduce (ˈɪnvɝt ~ ənˈvɝt) — a full vowel against AH/IH/UH there.
  const stressShift = (a: string, b: string) => {
    const x = a.split(" "), y = b.split(" ");
    if (x.length !== y.length) return false;
    return x.every((p, i) => {
      const [pb, ps] = [p.replace(/[012]$/, ""), p.match(/[012]$/)?.[0]];
      const [qb, qs] = [y[i].replace(/[012]$/, ""), y[i].match(/[012]$/)?.[0]];
      if (pb === qb) return true;
      const reduced = (v: string) => ["AH", "IH", "UH"].includes(v);
      return ps !== undefined && qs !== undefined && (ps === "1") !== (qs === "1") && (reduced(pb) || reduced(qb));
    });
  };
  const regularAlternation = (a: string, b: string) =>
    stressShift(a, b) || (/ (EY|AX) T$/.test(segments(key(a))) && ateBase(key(a)) === ateBase(key(b)));
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const file of FILES) {
    const res = await fetch(`https://raw.githubusercontent.com/hexgrad/misaki/${COMMIT}/misaki/data/${file}`);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${file}`);
    const lexicon: Record<string, string | Record<string, string | null>> = await res.json();
    for (const [word, entry] of Object.entries(lexicon)) {
      if (typeof entry !== "object" || entry === null || !entry.DEFAULT) continue;
      if (word !== word.toLowerCase() || !/^[a-z]+$/.test(word) || seen.has(word)) continue;
      const [pos, marked] = entry.VERB ? ["V", entry.VERB] : entry.NOUN ? ["N", entry.NOUN] : [];
      if (!pos || !marked) continue;
      const mRaw = misakiToArpabet(marked), dRaw = misakiToArpabet(entry.DEFAULT);
      let ma = attested(word, mRaw), da = attested(word, dRaw);
      if (!ma && da && regularAlternation(mRaw, da)) ma = mRaw;
      if (!da && ma && regularAlternation(dRaw, ma)) da = dRaw;
      if (!ma || !da || key(ma) === key(da)) continue;
      // English noun/verb voicing pairs voice the VERB (use, house, close). A
      // NOUN key that differs only by voicing is another lexeme (closer "one
      // who closes"), not the noun of this word, and would fire on every
      // determiner before the comparative.
      if (pos === "N" && segments(key(ma)) !== segments(key(da)) && devoiced(ma) === devoiced(da)) continue;
      seen.add(word);
      lines.push(`${word.toUpperCase()}|${ma}|${da}|${pos}`);
    }
  }
  lines.sort();
  writeFileSync(OUT, [
    `#Generated by scripts/import-misaki-homographs.ts from hexgrad/misaki@${COMMIT.slice(0, 7)}`,
    "#(us_gold.json + us_silver.json, Apache-2.0). Do not edit by hand: fix a reading in",
    "#homographs-custom.txt, which overrides this file.",
    "#HEADWORD|PRONUNCIATION1|PRONUNCIATION2|POS — PRONUNCIATION1 when the tag is POS, else PRONUNCIATION2",
    ...lines,
  ].join("\n") + "\n");
  console.log(`Wrote ${lines.length} entries to ${OUT}`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
