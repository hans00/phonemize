import { LICIT_ONSETS } from "../utils";

export type IpaStatus = "compatible" | "marked" | "malformed" | "unsupported" | "undetermined";
export interface IpaIssue {
  readonly code: string;
  readonly start: number;
  readonly end: number;
  readonly message: string;
}
export interface IpaSyllable {
  readonly start: number;
  readonly end: number;
  readonly onset: string;
  readonly nucleus: string;
  readonly coda: string;
  readonly stress: "primary" | "secondary" | null;
}
export interface IpaReport {
  readonly status: IpaStatus;
  readonly dialect: "en-US" | "en-GB";
  readonly syllables: readonly IpaSyllable[];
  readonly issues: readonly IpaIssue[];
  readonly states: number;
}
interface Phone { symbol: string; start: number; end: number; nucleus: boolean }
interface Unit {
  phones: Phone[];
  boundaries: Set<number>;
  stresses: Map<number, "primary" | "secondary">;
}

export const ENGLISH_IPA_VOWELS = "ɑɒɔæəɚɜɝɛɪʊʌaeiou";
export const ENGLISH_IPA_CONSONANTS = "pbtdkɡgfvθðszʃʒhmnŋlɫɹrwjɾʔʍ";
const AFFRICATES = ["t͡ʃ", "d͡ʒ", "t͜ʃ", "d͜ʒ", "tʃ", "dʒ"];
// Raised PRICE/MOUTH remain one nucleus; this diagnoses IPA, not a word's reading.
export const ENGLISH_DIPHTHONGS = ["eɪ", "aɪ", "ɔɪ", "oʊ", "aʊ", "ʌɪ", "ʌʊ"];
export const ENGLISH_CENTERING_DIPHTHONGS = ["ɪə", "eə", "ɛə", "ʊə", "əʊ"];
const canonical = (symbol: string): string => symbol.replace(/[͜͡ːˑ̃ʰ]/g, "").replace(/ɫ/g, "l").replace(/r/g, "ɹ").replace(/g/g, "ɡ").replace(/[ɾʔ]/g, "t").replace(/ʍ/g, "w");
const onsetAllowed = (phones: readonly Phone[], nucleus: Phone, dialect: "en-US" | "en-GB", extended: boolean): boolean => {
  const onset = phones.map(p => canonical(p.symbol)).join("");
  // British coronal yod is licensed before GOOSE, not every vowel.
  return !onset || LICIT_ONSETS.has(onset) || onset === "sf" || extended && (onset === "skl" ||
    dialect === "en-GB" && /^(?:t|d|n)j$/.test(onset) && /^[uʊ]/.test(nucleus.symbol));
};
const sonority = (phone: Phone): number => /[lɹ]/.test(canonical(phone.symbol)) ? 4 : /[mnŋ]/.test(phone.symbol) ? 3 : /^[fvθðszʃʒ]/.test(phone.symbol) ? 2 : 1;
function codaAllowed(phones: readonly Phone[], extended: boolean, appendices = 0): boolean {
  if (phones.some(p => /[hwjʍ]/.test(p.symbol))) return false;
  if (phones.length <= 1) return true;
  if (extended && phones.length === 2 && phones.map(p => canonical(p.symbol)).join("") === "ɹl") return true;
  // Coronal appendices admit regular inflections and clusters such as /ksθs/.
  if (appendices < 3 && /^(?:t|d|s|z|θ|ð)$/.test(canonical(phones[phones.length - 1].symbol)) && codaAllowed(phones.slice(0, -1), extended, appendices + 1)) return true;
  return phones.every((p, i) => i === 0 || sonority(phones[i - 1]) > sonority(p));
}

/** Read-only phonotactic diagnosis; offsets are UTF-16 positions in the supplied IPA. */
export function inspectIpa(ipa: string, options: { dialect?: "en-US" | "en-GB"; maxStates?: number } = {}): IpaReport {
  const dialect = options.dialect ?? "en-US", maxStates = options.maxStates ?? 4096;
  if (!Number.isSafeInteger(maxStates) || maxStates < 1) throw new RangeError("maxStates must be a positive safe integer");
  if (dialect !== "en-US" && dialect !== "en-GB") throw new RangeError("Unsupported English dialect");
  const issues: IpaIssue[] = [], syllables: IpaSyllable[] = [], units: Unit[] = [];
  let malformed = false, unsupported = false, marked = false, truncated = false, states = 0;
  const issue = (code: string, start: number, end: number, message: string) => issues.push({ code, start, end, message });
  const fresh = (): Unit => ({ phones: [], boundaries: new Set(), stresses: new Map() });
  let unit = fresh(), start = 0, end = ipa.length, unsupportedCarrierEnd = -1;
  if (ipa.startsWith("/") || ipa.startsWith("[")) {
    const close = ipa[0] === "/" ? "/" : "]";
    if (ipa.length < 2 || !ipa.endsWith(close)) { malformed = true; issue("unclosed-transcription", 0, end, "Transcription delimiters do not match."); }
    else { start++; end--; }
  }
  const finish = () => {
    if (unit.phones.length && unit.boundaries.has(unit.phones.length)) {
      malformed = true; issue("empty-syllable", unit.phones[unit.phones.length - 1].end, end, "Boundary has no following syllable.");
    }
    for (const index of Array.from(unit.stresses.keys())) if (!unit.phones.slice(index).some(p => p.nucleus)) {
      malformed = true; issue("stress-without-nucleus", unit.phones[index]?.start ?? end, end, "Stress has no following nucleus in this word.");
    }
    if (unit.phones.length) units.push(unit);
    unit = fresh();
  };
  // A finite input limit also bounds work before the syllable search starts.
  if (ipa.length > 8192) return { status: "undetermined", dialect, syllables, states, issues: [{ code: "input-budget", start: 0, end, message: "IPA exceeds the diagnostic input budget." }] };
  for (let i = start; i < end;) {
    const ch = ipa[i], last = unit.phones[unit.phones.length - 1];
    if (/[\[\]\/]/.test(ch)) { malformed = true; issue("unexpected-delimiter", i, i + 1, "Unexpected transcription delimiter."); i++; continue; }
    if (/\s|[|‖]/.test(ch)) { finish(); i++; continue; }
    if (ch === ".") {
      if (!last || unit.boundaries.has(unit.phones.length)) { malformed = true; issue("empty-syllable", i, i + 1, "Empty explicit syllable."); }
      unit.boundaries.add(unit.phones.length); i++; continue;
    }
    if (ch === "ˈ" || ch === "ˌ") {
      const index = unit.phones.length;
      if (unit.stresses.has(index)) { malformed = true; issue("stacked-stress", i, i + 1, "Two stress marks precede the same syllable."); }
      unit.stresses.set(index, ch === "ˈ" ? "primary" : "secondary"); unit.boundaries.add(index); i++; continue;
    }
    if (unsupportedCarrierEnd === i && /[ːˑ̃ʰ\u0300-\u036f]/.test(ch)) {
      unsupportedCarrierEnd = i + 1;
      issue("unsupported-diacritic", i, i + 1, "The carrier is outside the implemented IPA inventory.");
      i++; continue;
    }
    if (ch === "̩") {
      if (!last || last.end !== i || last.nucleus) { malformed = true; issue("orphan-syllabicity", i, i + 1, "Syllabicity requires an adjacent consonant carrier."); }
      else { last.nucleus = true; last.symbol += ch; last.end = i + 1; }
      i++; continue;
    }
    if (/[ːˑ̃ʰ]/.test(ch)) {
      if (!last || last.end !== i) { malformed = true; issue("orphan-diacritic", i, i + 1, "Diacritic has no adjacent segment carrier."); }
      else { last.symbol += ch; last.end = i + 1; }
      i++; continue;
    }
    if (/[\u0300-\u036f]/.test(ch)) {
      if (!last || last.end !== i) { malformed = true; issue("orphan-diacritic", i, i + 1, "Diacritic has no adjacent segment carrier."); }
      else { last.end = i + 1; unsupported = true; issue("unsupported-diacritic", i, i + 1, "This IPA diacritic is not modeled by this diagnostic."); }
      i++; continue;
    }
    const choices = [...AFFRICATES, ...ENGLISH_DIPHTHONGS, ...(dialect === "en-GB" ? ENGLISH_CENTERING_DIPHTHONGS : [])];
    const symbol = choices.find(p => ipa.startsWith(p, i) && i + p.length <= end) ?? ch;
    if (!ENGLISH_IPA_VOWELS.includes(ch) && !ENGLISH_IPA_CONSONANTS.includes(ch)) {
      unsupported = true; issue("unsupported-symbol", i, i + symbol.length, "Symbol is outside the implemented English IPA inventory.");
      unsupportedCarrierEnd = i + symbol.length;
    } else {
      unit.phones.push({ symbol, start: i, end: i + symbol.length, nucleus: ENGLISH_IPA_VOWELS.includes(ch) });
      if (dialect === "en-US" && (ch === "ɒ" || ch === "ɜ") || dialect === "en-GB" && /[ɚɝ]/.test(ch)) {
        marked = true; issue("dialect-inventory", i, i + symbol.length, "Segment needs a different dialect or transcription convention.");
      }
    }
    i += symbol.length;
  }
  finish();
  if (!units.length && !unsupported) { malformed = true; issue("empty-transcription", start, end, "No IPA segments supplied."); }

  for (const current of units) {
    const phones = current.phones;
    const search = (extended: boolean): IpaSyllable[] | undefined => {
      const dp: Array<IpaSyllable[] | undefined> = Array(phones.length + 1); dp[0] = [];
      for (let a = 0; a < phones.length && !truncated; a++) {
        const prefix = dp[a];
        if (!prefix) continue;
        let nucleus = a;
        while (nucleus < phones.length && !phones[nucleus].nucleus) nucleus++;
        if (nucleus === phones.length || !onsetAllowed(phones.slice(a, nucleus), phones[nucleus], dialect, extended)) continue;
        let next = nucleus + 1;
        while (next < phones.length && !phones[next].nucleus) next++;
        for (let b = nucleus + 1; b <= next; b++) {
          if (++states > maxStates) { truncated = true; break; }
          if (Array.from(current.boundaries).some(boundary => a < boundary && boundary < b)) continue;
          if (!codaAllowed(phones.slice(nucleus + 1, b), extended)) continue;
          if (!dp[b]) dp[b] = [...prefix, {
            start: phones[a].start, end: phones[b - 1].end,
            onset: phones.slice(a, nucleus).map(p => p.symbol).join(""), nucleus: phones[nucleus].symbol,
            coda: phones.slice(nucleus + 1, b).map(p => p.symbol).join(""), stress: current.stresses.get(a) ?? null,
          }];
        }
      }
      return dp[phones.length];
    };
    // Keep an existing syllabification; the expanded profile is a fallback.
    const result = search(false) ?? (truncated ? undefined : search(true));
    if (result) syllables.push(...result);
    else if (!truncated) { marked = true; issue("no-native-syllabification", phones[0].start, phones[phones.length - 1].end, "No syllabification satisfies this native-English profile; boundaries or loan phonology may be needed."); }
  }
  if (truncated) issue("search-budget", start, end, "Syllable search reached its state budget.");
  return { status: malformed ? "malformed" : unsupported ? "unsupported" : truncated ? "undetermined" : marked ? "marked" : "compatible", dialect, syllables, issues, states };
}
