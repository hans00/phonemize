/** Independent evaluation phones; never call runtime IPA converters/phonotactics. */
import { PHONES } from "./evaluate-common-accuracy";

export const NORMALIZER = "en-US-phones-v1";
export type Pronunciation = { phones: string[]; primary: number | null; nuclei: number };
export type Variant = { arpabet: string; entry: string | null; protected: number[] | null };
export type Reference = {
  family: string; upos: string | null; posScope: string; features: Record<string, string>;
  variants: Variant[]; evidence: string; review: string;
};
const VOWELS = new Set("ɑ æ ʌ ɔ aʊ aɪ ɛ ɝ eɪ ɪ i oʊ ɔɪ ʊ u ə".split(" "));
const PHONE = /^(?:tʃ|dʒ|aɪ|aʊ|ɔɪ|eɪ|oʊ|[ɑæʌɔɛɝɪiʊuəbdðfɡhjklmnŋpɹsʃtθvwzʒ])/u;

export function parseIpa(ipa: string): Pronunciation {
  let s = ipa.normalize("NFC").trim();
  if (s.startsWith("/") && s.endsWith("/")) s = s.slice(1, -1);
  s = s.replace(/t͡ʃ|ʧ/g, "tʃ").replace(/d͡ʒ|ʤ/g, "dʒ")
    .replace(/ɫ/g, "l").replace(/r/g, "ɹ").replace(/g/g, "ɡ").replace(/ɚ/g, "ɝ");
  const phones: string[] = [];
  let primary: number | null = null, nuclei = 0, pending = false, marks = 0;
  while (s) {
    if (/^[\sˌ]/u.test(s)) { s = s.slice(1); continue; }
    if (s.startsWith("ˈ")) {
      if (++marks > 1) throw new Error("Multiple primary stresses");
      pending = true; s = s.slice(1); continue;
    }
    const match = PHONE.exec(s);
    if (!match) throw new Error(`Unsupported IPA at ${s}`);
    const phone = match[0]; phones.push(phone); s = s.slice(phone.length);
    if (s.startsWith("ː")) s = s.slice(1); // US noncontrastive length, after a phone only.
    if (VOWELS.has(phone)) {
      if (pending) { primary = nuclei; pending = false; }
      nuclei++;
    }
  }
  if (!phones.length || !nuclei || pending) throw new Error("Empty IPA or primary without nucleus");
  // Only stressed schwa uses the STRUT notation convention; weak vowels stay distinct.
  if (primary !== null) {
    let n = 0;
    for (let i = 0; i < phones.length; i++) if (VOWELS.has(phones[i])) {
      if (n++ === primary && phones[i] === "ə") phones[i] = "ʌ";
    }
  }
  return { phones, primary, nuclei };
}

export function parseArpabet(arpa: string): Pronunciation {
  const phones: string[] = []; let primary: number | null = null, nuclei = 0;
  for (const token of arpa.split(/\s+/)) {
    const base = token.replace(/[012]$/, ""), phone = token === "AH0" ? "ə" : PHONES[base];
    if (!phone || VOWELS.has(phone) !== /[012]$/.test(token)) throw new Error(`Invalid ARPABET ${token}`);
    phones.push(phone);
    if (VOWELS.has(phone)) {
      if (token.endsWith("1")) {
        if (primary !== null) throw new Error("Multiple ARPABET primaries");
        primary = nuclei;
      }
      nuclei++;
    }
  }
  if (!nuclei || primary === null) throw new Error("Reference requires primary stress");
  return { phones, primary, nuclei };
}

/** Protected indices refer to reference phones. No protected insertion/deletion/substitution. */
export function phoneDistance(actual: string[], expected: string[], protectedIndices: number[] = []): number {
  const protectedSet = new Set(protectedIndices);
  let prev = [0, ...expected.map((_, j) => protectedSet.has(j) ? Infinity : j + 1)];
  for (let j = 1; j < prev.length; j++) prev[j] = protectedSet.has(j - 1) ? Infinity : prev[j - 1] + 1;
  for (let i = 1; i <= actual.length; i++) {
    const cur = [prev[0] + (protectedSet.has(0) ? Infinity : 1)];
    for (let j = 1; j <= expected.length; j++) {
      cur[j] = Math.min(
        prev[j - 1] + (actual[i - 1] === expected[j - 1] ? 0 : protectedSet.has(j - 1) ? Infinity : 1),
        cur[j - 1] + (protectedSet.has(j - 1) ? Infinity : 1),
        prev[j] + (protectedSet.has(j - 1) || protectedSet.has(j) ? Infinity : 1),
      );
    }
    prev = cur;
  }
  return prev[expected.length];
}

const sameStress = (p: Pronunciation, r: Pronunciation): boolean =>
  p.nuclei === 1 && r.nuclei === 1 || p.primary !== null && p.primary === r.primary;

export function scoreIpa(ipa: string, gold: string, references: Record<string, Reference>) {
  const expected = references[gold].variants.map(v => ({ ...v, parsed: parseArpabet(v.arpabet) }));
  let p: Pronunciation;
  try { p = parseIpa(ipa); } catch {
    return { strict: false, lenient: false, readingCorrect: false, stressCorrect: false, segmentsCorrect: false,
      reading: "(invalid)", reason: "invalid-or-missing-ipa", phoneEdits: expected[0].parsed.phones.length,
      referencePhones: expected[0].parsed.phones.length };
  }
  const distances = Object.entries(references).map(([id, r]) => ({ id, distance: Math.min(...r.variants.map(v => {
    const q = parseArpabet(v.arpabet);
    if (q.nuclei > 1 && p.primary === null) return Infinity;
    return phoneDistance(p.phones, q.phones) + (sameStress(p, q) ? 0 : 2);
  })) })).sort((a, b) => a.distance - b.distance);
  const selected = !Number.isFinite(distances[0].distance) ? "(missing-stress)"
    : distances[1] && distances[0].distance === distances[1].distance ? "(tie)" : distances[0].id;
  const readingCorrect = selected === gold;
  const scored = expected.map(v => ({ ...v, distance: phoneDistance(p.phones, v.parsed.phones), stress: sameStress(p, v.parsed) }));
  const strict = readingCorrect && scored.some(v => v.distance === 0 && v.stress);
  const lenient = strict || readingCorrect && scored.some(v => v.stress && v.protected !== null &&
    phoneDistance(p.phones, v.parsed.phones, v.protected) <= 1);
  const nearest = [...scored].sort((a, b) => a.distance - b.distance)[0];
  return { strict, lenient, readingCorrect, stressCorrect: scored.some(v => v.stress),
    segmentsCorrect: scored.some(v => v.distance === 0), reading: selected,
    reason: strict ? "correct" : !readingCorrect ? selected.startsWith("(") ? selected.slice(1, -1) : "wrong-reading"
      : !scored.some(v => v.stress) ? "wrong-primary" : "phone-mismatch",
    phoneEdits: nearest.distance, referencePhones: nearest.parsed.phones.length };
}

export function summarize(rows: Array<{ word: string; gold: string; family: string; score: ReturnType<typeof scoreIpa> }>) {
  const count = (key: "strict" | "lenient" | "readingCorrect" | "stressCorrect" | "segmentsCorrect") =>
    rows.filter(r => r.score[key]).length;
  const rate = (xs: typeof rows) => xs.length ? xs.filter(r => r.score.strict).length / xs.length : 0;
  const means = (key: "word" | "gold") => {
    const keys = [...new Set(rows.map(r => r[key]))];
    return keys.length ? keys.reduce((s, k) => s + rate(rows.filter(r => r[key] === k)), 0) / keys.length : 0;
  };
  const counts = (key: "family" | "gold") => Object.fromEntries([...new Set(rows.map(r => r[key]))].sort().map(k => {
    const xs = rows.filter(r => r[key] === k);
    return [k, { n: xs.length, strict: xs.filter(r => r.score.strict).length, lenient: xs.filter(r => r.score.lenient).length }];
  }));
  return { n: rows.length, strict: count("strict"), lenient: count("lenient"), reading: count("readingCorrect"),
    stress: count("stressCorrect"), segments: count("segmentsCorrect"), macro: means("word"), balanced: means("gold"),
    phoneErrors: rows.reduce((s, r) => s + r.score.phoneEdits, 0), referencePhones: rows.reduce((s, r) => s + r.score.referencePhones, 0),
    slices: counts("family"), readings: counts("gold") };
}
