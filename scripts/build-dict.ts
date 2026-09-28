import * as fs from "fs";
import * as path from "path";
import * as json5 from "json5";
import { arpabetToIpa } from "../src/utils";

interface DictEntry {
  [word: string]: string;
}

// ---- Careful-vs-casual variant selection ----------------------------------
//
// ipa-dict/en_US.txt lists more than one pronunciation for 8,419 of its
// 125,927 entries, and variants[0] (the pick used everywhere below until
// this change) is frequently the CASUAL-SPEECH form: next ˈnɛks (not
// ˈnɛkst), accounted əˈkaʊnəd (not əˈkaʊntɪd). dict.json is both the
// runtime lexicon source and the reference evaluate.ts/evaluate-parity.ts/
// evaluate-common-accuracy.ts score against, so shipping the casual form
// teaches — and grades — a less standard pronunciation than a dictionary
// should.
//
// Measured over every multi-variant word (2026-09-28): 7,909 of the 8,419
// have exactly 2 unique variants (357 have 3, 153 have 4 — left on
// variants[0], the previous behaviour, since a clean two-way comparison
// doesn't generalise to them without guessing which pair to diff). Of the
// 7,909, 3,852 differ only by stress-mark position or a same-length vowel
// swap — a lexical axis (stress, vowel quality, or a heteronym's separate
// sense), never a register one, so those stay on variants[0] too: nothing
// below fires unless the two variants differ in segment COUNT.
//
// For the other 4,057, a Levenshtein edit script between the longer and
// shorter variant (both stress-stripped) is taken as a candidate casual
// deletion only when every inserted/deleted edit classifies as one of four
// documented English casual-speech processes — word-final t/d cluster
// simplification (acts ˈækts → ˈæks), t or d lost from /nt(d)/ (center
// ˈsɛntɝ → ˈsɛnɝ, playground -ɡɹaʊnd → -ɡɹaʊn), a reduced /ə/ syllable lost
// before a sonorant (battling ˈbætəɫɪŋ → ˈbætɫɪŋ), or a /j/ or /w/ glide
// lost (revenue ˈɹɛvənˌju → ˈɹɛvəˌnu) — optionally paired with an adjacent
// vowel reducing further to /ə/ as a direct consequence of the same
// deletion (accounted əˈkaʊntɪd → əˈkaʊnəd: dropping /t/ leaves the
// following /ɪ/ nothing to anchor against). Anything else (a genuinely
// different vowel, an unrelated cluster change) is left unclassified and
// the word stays on variants[0], unchanged from before this pass.
// That resolves 1,241 of the 4,057 as a recognised casual/careful pair;
// 451 of those actually differ from the old variants[0] pick. Checked
// against pinned CMUdict (scripts/.common-accuracy-cache/cmudict.dict) as
// a tie-breaker, as a secondary measurement only: 0 of the 451 make the
// pick worse (CMUdict very often lists both forms itself, e.g. "center"
// and "center(2)" — ties), 8 make it strictly better (proper nouns/brand
// names where CMUdict has only the fuller reading: debussy, cusip, uclaf),
// and the rest tie. CMUdict agreement added nothing the structural rule
// didn't already get right on its own, so it's not consulted at pick time
// — only used here to confirm the structural rule.
//
// Heteronyms are excluded from this override entirely: a homograph's two
// ipa-dict variants can encode a noun/verb SENSE split (e.g. a stress
// shift), not a register one, and picking by segment count must not be
// allowed to decide which sense ships as the citation form. build-dict's
// own homograph sources (upstream + custom + misaki) are checked, not a
// hand-written word list.
const VOWELS = new Set("aeiouɑæɛɪɔʊʌəɝ".split(""));

function stripStress(ipa: string): string {
  return ipa.replace(/[ˈˌ]/g, "");
}

type CasualCat = "final-td" | "nt-drop" | "reduced-vowel" | "glide" | null;

// Classify one deleted character (present in the longer variant L, absent
// from the shorter one) by its context in L.
function classifyDeletion(L: string, idx: number): CasualCat {
  const ch = L[idx];
  const prev = idx > 0 ? L[idx - 1] : "";
  if ((ch === "t" || ch === "d") && prev === "n") return "nt-drop";
  if ((ch === "t" || ch === "d") && prev && !VOWELS.has(prev)) {
    // A word-final consonant cluster: everything from the deleted char to
    // the end of L (its own position included) is non-vocalic, so the
    // deletion sits inside a coda cluster rather than before a vowel
    // (which "nt-drop" above already covers on its own terms).
    let restIsConsonantal = true;
    for (let k = idx + 1; k < L.length; k++) {
      if (VOWELS.has(L[k])) { restIsConsonantal = false; break; }
    }
    if (restIsConsonantal) return "final-td";
  }
  if (ch === "ə") return "reduced-vowel";
  if (ch === "j" || ch === "w") return "glide";
  return null;
}

// Minimal-edit alignment between the longer variant L and the shorter S
// (both already stress-stripped). Returns the classified deletions, or
// null if the pair isn't a clean "L minus some deletions (plus an
// optional adjacent ə-reduction) equals S" relation.
function classifyCasualPair(L: string, S: string): boolean {
  const n = L.length, m = S.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = L[i - 1] === S[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);

  const dels: number[] = [];
  const subs: { li: number; a: string; b: string }[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && L[i - 1] === S[j - 1] && dp[i][j] === dp[i - 1][j - 1]) { i--; j--; }
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { subs.push({ li: i - 1, a: L[i - 1], b: S[j - 1] }); i--; j--; }
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { dels.push(i - 1); i--; }
    else return false; // S has a segment L lacks -- not a pure "L minus deletions" relation
  }
  if (dels.length === 0) return false;
  if (dels.some((idx) => classifyDeletion(L, idx) === null)) return false;
  // A substitution is only allowed as the vowel-reduction half of an
  // adjacent accepted deletion, never a free-standing vowel swap.
  return subs.every((s) => s.b === "ə" && VOWELS.has(s.a) && dels.some((d) => Math.abs(d - s.li) <= 1));
}

function pickCarefulVariant(first: string, second: string): string {
  const a = stripStress(first), b = stripStress(second);
  if (a.length === b.length) return first; // stress/vowel-quality only, not this rule's call
  const [L, S, longerIsFirst] = a.length > b.length ? [a, b, true] : [b, a, false];
  return classifyCasualPair(L, S) ? (longerIsFirst ? first : second) : first;
}

// Dedupe a candidate pool and apply the careful-form pick only when it
// narrows to exactly two distinct readings and the word isn't a heteronym.
function selectVariant(pool: string[], isHeteronym: boolean): string {
  const unique = [...new Set(pool)];
  if (unique.length === 2 && !isHeteronym) return pickCarefulVariant(unique[0], unique[1]);
  return unique[0];
}

// ---- Multiple-primary-stress normalisation --------------------------------
//
// A standard IPA transcription has exactly one primary stress. ipa-dict
// leaves ~1,400 dict.json entries with 2+ ˈ marks instead — mostly
// compounds and prefixed derivatives it never reduced to primary+secondary
// (etcetera ˈɛtˈsɛtɝə, videotape ˈvɪdioʊˈteɪp, travelodge ˈtɹævəˈlɑdʒ,
// asynchronous ˈeɪˈsɪŋkɹənəs). Until now, scripts/mine-exceptions.ts simply
// refused to memorize these as exceptions when the rule path predicted a
// clean single primary, on the theory that the rule's output was the
// better pronunciation — but that leaves the word RELYING on the rule
// being right forever: any later rule change that regresses its stress
// has nothing to fall back on, and dict.json (the reference every eval
// script scores against) still carries the double-primary form, so a
// correct single-primary prediction was already being scored as wrong.
//
// Fix at the source instead: pick one of the ˈ marks as the true primary
// and demote the rest to ˌ, so dict.json itself becomes a normal
// single-primary reference, and mine-exceptions.ts can memorize it like
// any other word (shipping it if the rules don't already reproduce it).
//
// Measured 2026-09-28 which mark to keep, against pinned CMUdict
// (scripts/.common-accuracy-cache/cmudict.dict) over the double-primary
// dict.json words where CMUdict ITSELF commits to a single primary and
// the two transcriptions' syllable counts line up (n=36 — the largest
// clean sample available: CMUdict carries the identical unreduced-compound
// quirk on 94% of the rest, so it can't arbitrate those either). Keeping
// the LAST ˈ agrees with CMUdict's primary 24:9 over keeping the FIRST.
// The FIRST-agreeing minority is dominated by true N+N compounds and
// French-stressed surnames (dillard, luxembourg, nestle) that keep
// English's initial compound stress; the LAST-agreeing majority is
// prefix+root derivations and the -teen numbers, where English stresses
// the root/final element (unfair, predate, recessed, eighteen,
// asynchronous) — the larger and more general class. This also matches
// the hand-picked custom.dict entries already carrying this exact
// pattern (etcetera, videotape, travelodge all keep their LAST primary).
function normalizeMultiplePrimaryStress(ipa: string): string {
  const marks: number[] = [];
  for (let i = 0; i < ipa.length; i++) if (ipa[i] === "ˈ") marks.push(i);
  if (marks.length < 2) return ipa;
  const chars = [...ipa];
  for (let i = 0; i < marks.length - 1; i++) chars[marks[i]] = "ˌ";
  return chars.join("");
}

function parseDict(content: string, heteronymWords: Set<string>): DictEntry {
  const lines = content.split("\n");

  const dict: DictEntry = {};

  for (const line of lines) {
    if (line.startsWith(";;;") || line.startsWith("# ") || line.trim() === "")
      continue;

    const match = line.match(/^(.+)\t((?:\/.+\/)+)$/);
    if (!match) continue;

    let [, word, phonesStr] = match;

    // Parse all pronunciation variants (format: /vɑr1/, /vɔr2/, ...)
    const variants = [...phonesStr.matchAll(/\/([^\/]+)\//g)].map(m => m[1]);
    if (variants.length === 0) continue;

    // ipa-dict often lists both ɑ and ɔ variants for cot-caught merger
    // ambiguous words. For THOUGHT-class words (spelled with augh/ough/aw/au/
    // alk/alm/all/alt) the ɔ variant matches standard General American better.
    // For other words (LOT-class like "doctor", "lot", "hot") keep first
    // variant — choosing ɔ universally would mispronounce them.
    const lowerWord = word.toLowerCase();
    const isThoughtSpelling = /augh|ough|aw|au[a-z]|alk|alm|all|alt/.test(lowerWord);
    const pool = isThoughtSpelling && variants.some(v => v.includes("ɔ"))
      ? variants.filter(v => v.includes("ɔ"))
      : variants;
    const ipa = normalizeMultiplePrimaryStress(selectVariant(pool, heteronymWords.has(lowerWord)));
    dict[lowerWord] = ipa;
  }

  return dict;
}

function loadCmuDict(content: string): DictEntry {
  const lines = content.split("\n");

  const arpaDict: DictEntry = {};

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith(";") || line.trim() === "")
      continue;

    const match = line.match(/^([a-zA-Z']+(?:\((\d+)\))?)\s+(.+)$/);
    if (!match) continue;

    let [, word, variantNo, phonesStr] = match;
    if (!word || !phonesStr || variantNo) continue;

    // remove comment
    phonesStr = phonesStr.replace(/# .*$/, "").trim();

    const arpaPhones = phonesStr.trim().split(/\s+/);
    const arpaPhonemes = arpaPhones.join(" ");

    // Convert ARPABET to IPA using the unified function
    const ipaPhonemes = arpabetToIpa(arpaPhonemes);

    arpaDict[word.toLowerCase()] = ipaPhonemes;
  }

  return arpaDict;
}

function trimDictionary(dictionary: DictEntry): DictEntry {
  const trimmedDict = { ...dictionary };
  let totalRemoved = 0;

  // Rule 1: Remove predictable plural forms (-s, -es)
  Object.keys(dictionary).forEach(word => {
    // Simple plural -s
    if (word.endsWith('s') && word.length > 2 && !word.endsWith('ss')) {
      const singular = word.slice(0, -1);
      if (dictionary[singular]) {
        const singularPron = dictionary[singular];
        const pluralPron = dictionary[word];
        
        // If plural pronunciation is singular + s/z/ɪz, remove it (IPA format)
        if (pluralPron === singularPron + 's' || 
            pluralPron === singularPron + 'z' ||
            pluralPron === singularPron + 'ɪz') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
    
    // -es plural
    if (word.endsWith('es') && word.length > 3) {
      const singular = word.slice(0, -2);
      if (dictionary[singular]) {
        const singularPron = dictionary[singular];
        const pluralPron = dictionary[word];
        
        if (pluralPron === singularPron + 'ɪz') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
  });

  // Rule 2: Remove predictable past tense (-ed)
  Object.keys(dictionary).forEach(word => {
    if (word.endsWith('ed') && word.length > 3) {
      const base = word.slice(0, -2);
      if (dictionary[base]) {
        const basePron = dictionary[base];
        const pastPron = dictionary[word];
        
        // Check for regular past tense pronunciation (IPA format)
        if (pastPron === basePron + 'd' || 
            pastPron === basePron + 't' ||
            pastPron === basePron + 'ɪd') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
  });

  // Rule 3: Remove predictable present participle (-ing)
  Object.keys(dictionary).forEach(word => {
    if (word.endsWith('ing') && word.length > 4) {
      const base = word.slice(0, -3);
      if (dictionary[base]) {
        const basePron = dictionary[base];
        const presentPron = dictionary[word];
        
        // Check for regular present participle pronunciation (IPA format)
        if (presentPron === basePron + 'ɪŋ') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
  });

  console.log(`Removed ${totalRemoved} predictable word forms`);
  return trimmedDict;
}

function unescapeString(str: string): string {
  return str
    .replace(/\\u\{([0-9A-F]+)\}/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\(["'])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\f/g, "\f")
    .replace(/\\b/g, "\b")
    .replace(/\\a/g, "\a")
    .replace(/\\v/g, "\v")
}

// AnyAscii
function loadAnyAscii(sourceText: string): { [key: number]: string[] } {
  // parse, match 'case (\d+): return "..."'
  const regex = /case\s+(\d+):\s*return\s*"(.+)";?/g;
  const anyAsciiMap: { [key: number]: string[] } = {};
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(sourceText)) !== null) {
    const codePoint = parseInt(match[1], 10);
    const replacement = unescapeString(match[2]);
    anyAsciiMap[codePoint] = replacement.split("\t");
  }
  return anyAsciiMap;
}

async function main(): Promise<void> {
  console.log("Building phoneme dictionaries...");

  const projectRoot = process.cwd();
  const dataDir = path.join(projectRoot, "data");

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // mkdir en
  const enDir = path.join(dataDir, "en");
  if (!fs.existsSync(enDir)) {
    fs.mkdirSync(enDir, { recursive: true });
  }

  // Fetched once, up front, so the heteronym set (used by parseDict's
  // careful-form picker, above) is ready before dict.json is built; the
  // homograph-building block below reuses this same text instead of
  // fetching it again.
  const homographRes = await fetch(
    "https://raw.githubusercontent.com/Kyubyong/g2p/master/g2p_en/homographs.en",
  );
  const homographText = homographRes.ok ? await homographRes.text() : "";
  const customHomographsPath = new URL("../src-data/en/homographs-custom.txt", import.meta.url)
    .pathname;
  const misakiHomographsPath = new URL("../src-data/en/homographs-misaki.txt", import.meta.url)
    .pathname;
  const heteronymWords = new Set([
    ...Object.keys(parseHomographs(homographText)),
    ...Object.keys(parseHomographs(fs.readFileSync(customHomographsPath, "utf-8"))),
    ...Object.keys(parseHomographs(fs.readFileSync(misakiHomographsPath, "utf-8"))),
  ]);

  {
    // Parse Dictionary
    const res = await fetch(
      "https://raw.githubusercontent.com/open-dict-data/ipa-dict/refs/heads/master/data/en_US.txt",
    );
    const dict = parseDict(await res.text(), heteronymWords);
    console.log(`Loaded ${Object.keys(dict).length} entries from Dictionary`);

    // Load custom dictionary
    const customDictPath = new URL("../src-data/en/custom.dict", import.meta.url)
      .pathname;
    const customDict = loadCmuDict(fs.readFileSync(customDictPath, "utf-8"));
    console.log(
      `Loaded ${Object.keys(customDict).length} entries from custom dictionary`,
    );

    // Merge dictionaries (custom overrides CMU)
    const finalArpaDict = { ...dict, ...customDict };

    // Apply dictionary trimming
    console.log("\nApplying dictionary trimming...");
    const trimmedDict = trimDictionary(finalArpaDict);
    const originalSize = Object.keys(finalArpaDict).length;
    const trimmedSize = Object.keys(trimmedDict).length;
    const reduction = originalSize - trimmedSize;
    const reductionPercent = ((reduction / originalSize) * 100).toFixed(2);
    
    console.log(`Original size: ${originalSize}`);
    console.log(`Trimmed size: ${trimmedSize}`);
    console.log(`Reduced by: ${reduction} entries (${reductionPercent}%)`);

    // Save ARPABET dictionary (now trimmed)
    const arpaPath = path.join(enDir, "dict.json");
    fs.writeFileSync(arpaPath, JSON.stringify(trimmedDict));
    console.log(`Saved dictionary to: ${arpaPath}`);
    console.log(`Total entries: ${Object.keys(trimmedDict).length}`);
  }

  {
    // Parse homographs (already fetched above, for heteronymWords)
    let homographDict: HomographDict = {};
    if (homographRes.ok) {
      console.log(`Parsing homographs from: ${homographRes.url}`);
      homographDict = parseHomographs(homographText);
    }

    // Load custom homographs
    const customHomographs = parseHomographs(fs.readFileSync(customHomographsPath, "utf-8"));
    console.log(
      `Loaded ${Object.keys(customHomographs).length} entries from custom homographs`,
    );

    // misaki's POS-split readings fill words the upstream table lacks
    // (see scripts/import-misaki-homographs.ts).
    const misakiHomographs = parseHomographs(fs.readFileSync(misakiHomographsPath, "utf-8"));
    console.log(`Loaded ${Object.keys(misakiHomographs).length} entries from misaki homographs`);

    // Merge homographs: misaki < upstream < custom
    const finalHomographs = { ...misakiHomographs, ...homographDict, ...customHomographs };
    
    const homographsDestPath = path.join(enDir, "homographs.json");
    fs.writeFileSync(
      homographsDestPath,
      JSON.stringify(finalHomographs),
    );
    console.log(`Saved homographs to: ${homographsDestPath}`);
    console.log(`Total homograph entries: ${Object.keys(finalHomographs).length}`);
  }

  // mkdir zh
  const zhDir = path.join(dataDir, "zh");
  if (!fs.existsSync(zhDir)) {
    fs.mkdirSync(zhDir, { recursive: true });
  }
  // build json5 to json
  const json5Path = new URL("../src-data/zh/dict.json5", import.meta.url).pathname;
  const json5Content = fs.readFileSync(json5Path, "utf-8");
  const jsonContent = json5.parse(json5Content);
  fs.writeFileSync(path.join(zhDir, "dict.json"), JSON.stringify(jsonContent));
  console.log(`Saved dictionary to: ${path.join(zhDir, "dict.json")}`);
  console.log(`Total entries: ${Object.keys(jsonContent).length}`);

  // === Japanese kanji-readings + compound overrides ===
  {
    const jaDir = path.join(dataDir, "ja");
    if (!fs.existsSync(jaDir)) fs.mkdirSync(jaDir, { recursive: true });

    // Per-kanji map: store BOTH on'yomi and kun'yomi when present so the
    // ja-g2p preProcess can pick the right one based on context (an
    // immediately following hiragana = okurigana = verb/adjective stem
    // → kun; followed by another kanji or punctuation → likely compound
    // → on). Both are normalized katakana → hiragana so the downstream
    // ja-g2p (romaji-based after anyAscii) sees a uniform hiragana
    // stream regardless of which row the source listed.
    // Source: KEINOS/joyo2010 gist — a parsed JSON of the 2010 Japanese
    // Ministry of Education Jōyō kanji list (2,136 chars) with on/kun
    // readings derived from cjkvi-tables. We fetch rather than bundle to
    // keep src-data/ slim (the raw JSON is ~400 KB).
    const joyoUrl = "https://gist.githubusercontent.com/KEINOS/fb660943484008b7f5297bb627e0e1b1/raw/joyo2010.json";
    const joyoRes = await fetch(joyoUrl);
    const joyo = (await joyoRes.json()) as Record<string, {
      joyo_kanji: string;
      yomi: { on_yomi?: string[]; kun_yomi?: string[]; example_yomi?: string[] };
    }>;
    // Joyo katakana → hiragana shift (U+30A1..U+30F6 → U+3041..U+3096),
    // then strip example-reading suffix markers (`ひと-つ` → `ひと`).
    const normalize = (raw: string) =>
      raw.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
        .replace(/[-.・].*$/, "")
        .trim();
    const kanjiDict: Record<string, { o?: string; k?: string }> = {};
    for (const entry of Object.values(joyo)) {
      const on = entry.yomi.on_yomi?.[0];
      const kun = entry.yomi.kun_yomi?.[0];
      const e: { o?: string; k?: string } = {};
      if (on) {
        const n = normalize(on);
        if (n) e.o = n;
      }
      if (kun) {
        const n = normalize(kun);
        if (n) e.k = n;
      }
      if (e.o || e.k) kanjiDict[entry.joyo_kanji] = e;
    }
    fs.writeFileSync(path.join(jaDir, "kanji.json"), JSON.stringify(kanjiDict));
    console.log(`Saved kanji readings: ${path.join(jaDir, "kanji.json")} (${Object.keys(kanjiDict).length} entries)`);

    // Compound-word overrides: irregular readings (gikun, fossilized
    // compounds) that the per-kanji map can't derive correctly.
    const wordsPath = new URL("../src-data/ja/words.json5", import.meta.url).pathname;
    const wordsContent = fs.readFileSync(wordsPath, "utf-8");
    const wordsJson = json5.parse(wordsContent);
    fs.writeFileSync(path.join(jaDir, "words.json"), JSON.stringify(wordsJson));
    console.log(`Saved kanji compound overrides: ${path.join(jaDir, "words.json")} (${Object.keys(wordsJson).length} entries)`);
  }

  // Load and save AnyAscii
  {
    const res = await fetch("https://raw.githubusercontent.com/anyascii/anyascii/master/impl/js/block.js");
    const src = await res.text();
    const anyAsciiMap = loadAnyAscii(src);
    const anyAsciiPath = path.join(dataDir, "anyascii.json");
    fs.writeFileSync(anyAsciiPath, JSON.stringify(anyAsciiMap));
    console.log(`AnyAscii blocks: ${Object.keys(anyAsciiMap).length}`);
  }

  console.log("Dictionary build complete!");
}

interface HomographEntry {
  pronunciation: string;
  pos: string;
}

interface HomographDict {
  [word: string]: HomographEntry[];
}

function parseHomographs(content: string): HomographDict {
  const lines = content.split("\n");
  const homographDict: HomographDict = {};

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;

    const parts = line.split("|");
    if (parts.length !== 4) continue;

    const [word, pron1, pron2, pos] = parts;
    const lowerWord = word.toLowerCase();

    if (!homographDict[lowerWord]) {
      homographDict[lowerWord] = [];
    }

    // The logic is: use pron1 if the POS matches, otherwise use pron2.
    // We can store this as a condition. For simplicity, we store both with their POS triggers.
    // The runtime will decide which to use.
    homographDict[lowerWord].push({ pronunciation: arpabetToIpa(pron1), pos: pos });
    homographDict[lowerWord].push({ pronunciation: arpabetToIpa(pron2), pos: `!${pos}` }); // Representing "not POS"
  }

  return homographDict;
}

if (require.main === module) {
  main();
}
