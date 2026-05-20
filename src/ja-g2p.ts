import * as kanjiDict from "../data/ja/kanji.json";
import * as kanjiWords from "../data/ja/words.json";
import { resolveJson } from "./utils";
import { LanguageProcessor } from "./g2p";
import { expandJapaneseText } from "./expand-ja";

interface KanjiReading {
  o?: string;
  k?: string;
}
const KANJI_READINGS = resolveJson<Record<string, KanjiReading>>(kanjiDict);
const KANJI_WORDS = resolveJson<Record<string, string>>(kanjiWords);

// Longest-first compound key list — used in preProcess so e.g. 今日 wins
// over 今 / 日 individual lookups during scanning.
const KANJI_WORD_KEYS = Object.keys(KANJI_WORDS).sort(
  (a, b) => b.length - a.length,
);
const KANJI_RE = /[一-龥㐀-䶿豈-﫿]/;
const HIRA_RE = /[ぁ-ゟ]/;

// Bigram kana → Hepburn romaji. Covers palatalized digraphs
// (consonant + small ゃ/ゅ/ょ) for both hiragana and katakana.
const KANA_DIGRAPH: Record<string, string> = {
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  ぢゃ: "ja",
  ぢゅ: "ju",
  ぢょ: "jo",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  キャ: "kya",
  キュ: "kyu",
  キョ: "kyo",
  ギャ: "gya",
  ギュ: "gyu",
  ギョ: "gyo",
  シャ: "sha",
  シュ: "shu",
  ショ: "sho",
  ジャ: "ja",
  ジュ: "ju",
  ジョ: "jo",
  チャ: "cha",
  チュ: "chu",
  チョ: "cho",
  ニャ: "nya",
  ニュ: "nyu",
  ニョ: "nyo",
  ヒャ: "hya",
  ヒュ: "hyu",
  ヒョ: "hyo",
  ビャ: "bya",
  ビュ: "byu",
  ビョ: "byo",
  ピャ: "pya",
  ピュ: "pyu",
  ピョ: "pyo",
  ミャ: "mya",
  ミュ: "myu",
  ミョ: "myo",
  リャ: "rya",
  リュ: "ryu",
  リョ: "ryo",
};

// Single-char kana → Hepburn romaji. Both hiragana (U+3040..U+309F) and
// katakana (U+30A0..U+30FF) covered so katakana foreign-word renderings
// (コーヒー / スターバックス) also flow through preProcess cleanly. anyAscii's
// per-char romanization mangles the small-kana digraphs (きょ → "kiyo"),
// so we replace its job for Japanese entirely.
const KANA_SINGLE: Record<string, string> = {
  // basic vowels
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  ア: "a",
  イ: "i",
  ウ: "u",
  エ: "e",
  オ: "o",
  // k / g
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  カ: "ka",
  キ: "ki",
  ク: "ku",
  ケ: "ke",
  コ: "ko",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ガ: "ga",
  ギ: "gi",
  グ: "gu",
  ゲ: "ge",
  ゴ: "go",
  // s / z
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  サ: "sa",
  シ: "shi",
  ス: "su",
  セ: "se",
  ソ: "so",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  ザ: "za",
  ジ: "ji",
  ズ: "zu",
  ゼ: "ze",
  ゾ: "zo",
  // t / d
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  タ: "ta",
  チ: "chi",
  ツ: "tsu",
  テ: "te",
  ト: "to",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ダ: "da",
  ヂ: "ji",
  ヅ: "zu",
  デ: "de",
  ド: "do",
  // n
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  ナ: "na",
  ニ: "ni",
  ヌ: "nu",
  ネ: "ne",
  ノ: "no",
  // h / b / p
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ハ: "ha",
  ヒ: "hi",
  フ: "fu",
  ヘ: "he",
  ホ: "ho",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  バ: "ba",
  ビ: "bi",
  ブ: "bu",
  ベ: "be",
  ボ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  パ: "pa",
  ピ: "pi",
  プ: "pu",
  ペ: "pe",
  ポ: "po",
  // m
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  マ: "ma",
  ミ: "mi",
  ム: "mu",
  メ: "me",
  モ: "mo",
  // y
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ヤ: "ya",
  ユ: "yu",
  ヨ: "yo",
  // r
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  ラ: "ra",
  リ: "ri",
  ル: "ru",
  レ: "re",
  ロ: "ro",
  // w (を → 'o' as particle; ヲ same)
  わ: "wa",
  ゐ: "wi",
  ゑ: "we",
  を: "o",
  ワ: "wa",
  ヰ: "wi",
  ヱ: "we",
  ヲ: "o",
  // moraic ん
  ん: "n",
  ン: "n",
  // small vowels (independent, sans preceding consonant)
  ぁ: "a",
  ぃ: "i",
  ぅ: "u",
  ぇ: "e",
  ぉ: "o",
  ァ: "a",
  ィ: "i",
  ゥ: "u",
  ェ: "e",
  ォ: "o",
  // small ゃゅょ alone (shouldn't normally occur — digraph table catches them)
  ゃ: "ya",
  ゅ: "yu",
  ょ: "yo",
  ャ: "ya",
  ュ: "yu",
  ョ: "yo",
};

/**
 * Convert a mixed hiragana/katakana/Latin string to lowercase Hepburn
 * romaji. Sokuon (っ/ッ) doubles the next consonant; chōonpu (ー) repeats
 * the preceding vowel; any chars we don't recognize pass through.
 */
function kanaToRomaji(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // Sokuon: peek at the next kana's romaji and double its initial consonant.
    if (ch === "っ" || ch === "ッ") {
      const next2 = i + 2 < text.length + 1 ? text.slice(i + 1, i + 3) : "";
      const next1 = text[i + 1] ?? "";
      const nextRomaji = KANA_DIGRAPH[next2] ?? KANA_SINGLE[next1] ?? "";
      if (nextRomaji && /^[bcdfghjklmpqrstvwxyz]/.test(nextRomaji)) {
        out += nextRomaji[0];
      }
      continue;
    }

    // Long-vowel mark: repeat the last vowel of the output so far.
    if (ch === "ー") {
      const last = out[out.length - 1];
      if (last && /[aeiou]/.test(last)) out += last;
      continue;
    }

    // Digraph first (palatalized consonant + small y).
    const bi = text.slice(i, i + 2);
    if (KANA_DIGRAPH[bi]) {
      out += KANA_DIGRAPH[bi];
      i++;
      continue;
    }

    // Single kana.
    if (KANA_SINGLE[ch]) {
      out += KANA_SINGLE[ch];
      continue;
    }

    // Unknown (Latin, punctuation, kanji we couldn't map, etc.).
    out += ch;
  }
  return out;
}

// === Japanese G2P Processor ===

const JAPANESE_SYLLABLE_MAP: { [key: string]: string } = {
  // Basic syllables
  a: "a",
  i: "i",
  u: "ɯ",
  e: "e",
  o: "o",
  ka: "ka",
  ki: "ki",
  ku: "kɯ",
  ke: "ke",
  ko: "ko",
  ga: "ɡa",
  gi: "ɡi",
  gu: "ɡɯ",
  ge: "ɡe",
  go: "ɡo",
  sa: "sa",
  shi: "ɕi",
  su: "sɯ",
  se: "se",
  so: "so",
  za: "za",
  ji: "dʑi",
  zu: "zɯ",
  ze: "ze",
  zo: "zo",
  ta: "ta",
  chi: "tɕi",
  tsu: "tsɯ",
  te: "te",
  to: "to",
  da: "da",
  de: "de",
  do: "do",
  na: "na",
  ni: "ni",
  nu: "nɯ",
  ne: "nɛ",
  no: "no",
  ha: "ha",
  hi: "çi",
  fu: "ɸɯ",
  he: "hɛ",
  ho: "ho",
  ba: "ba",
  bi: "bi",
  bu: "bɯ",
  be: "be",
  bo: "bo",
  pa: "pa",
  pi: "pi",
  pu: "pɯ",
  pe: "pe",
  po: "po",
  ma: "ma",
  mi: "mi",
  mu: "mɯ",
  me: "mɛ",
  mo: "mo",
  ya: "ja",
  yu: "jɯ",
  yo: "jo",
  ra: "ɾa",
  ri: "ɾi",
  ru: "ɾɯ",
  wa: "wa",
  wo: "o",
  n: "n",
  kya: "kja",
  kyu: "kjɯ",
  kyo: "kjo",
  gya: "ɡja",
  gyu: "ɡjɯ",
  gyo: "ɡjo",
  sha: "ɕa",
  shu: "ɕɯ",
  sho: "ɕo",
  ja: "dʑa",
  ju: "dʑɯ",
  jo: "dʑo",
  cha: "tɕa",
  chu: "tɕɯ",
  cho: "tɕo",
  nya: "ɲa",
  nyu: "ɲɯ",
  nyo: "ɲo",
  hya: "ça",
  hyu: "çɯ",
  hyo: "ço",
  rya: "ɾʲa",
  ryu: "ɾʲɯ",
  ryo: "ɾʲo",
};

const JAPANESE_LONG_VOWEL_RULES: { [key: string]: string } = {
  aa: "aː",
  ii: "iː",
  uu: "uː",
  ee: "eː",
  oo: "oː",
  // お段+う almost always realizes as long ō in kango compounds
  // (とうきょう = tōkyō, がっこう = gakkō). Over-lengthens a few native
  // verb forms (思う omou → omoː) but those are a tiny minority.
  ou: "oː",
  // え段+い is NOT added: while it's right for kango (英語 → ēgo), it
  // wrongly fuses the te-form/i-renyōkei pair across morpheme boundary
  // (待って+いる → mateːru instead of matte-iru), and the verb pattern
  // is overwhelmingly more frequent than the kango one.
};

class JapaneseG2P implements LanguageProcessor {
  readonly id = "ja-g2p";
  readonly name = "Japanese G2P Processor";
  readonly supportedLanguages = ["ja"];

  preProcess(text: string): string {
    text = expandJapaneseText(text);
    // Step 0.5: topic-particle は handling. は after a content-word
    // boundary (kanji / katakana / single-char hiragana particle) and
    // followed by another content boundary is almost always the topic
    // particle, pronounced /wa/. Rewriting it to わ here lets the
    // downstream kana converter pick up the right romaji without
    // misclassifying word-internal は (はじめる, はやい, …) which sit
    // inside hiragana sequences without those boundaries. Done before
    // kanji conversion so the kanji context is still intact.
    //
    // The preceding-char class includes ASCII Latin too: katakana
    // sometimes leaks through anyAscii as Latin, and "wikipediaは" or
    // "TikTokは" patterns should still flip to /wa/.
    // Boundary chars that signal a preceding word/particle has just ended:
    // kanji/katakana/Latin (clear lexical boundaries) plus the short
    // hiragana particles that frequently precede は (には, では, とは, やは,
    // もは). Word-internal は (はじめる, はやい, あはは, …) sits after a
    // generic hiragana char that isn't in this set, so it stays as /ha/.
    text = text.replace(/([一-龥ァ-ヶa-zA-Z0-9にでとやも])は/g, "$1わ");
    // Same idea for を: as object particle it's always /o/, never /wo/.
    // The single-char mapping below already handles this; kept as a
    // note to future maintainers.

    // Step 1: replace known irregular compounds (longest first) with their
    // canonical hiragana readings. This catches gikun like 今日 → きょう
    // that a per-kanji map cannot reconstruct from on/kun alone.
    for (const key of KANJI_WORD_KEYS) {
      if (text.includes(key)) {
        text = text.split(key).join(KANJI_WORDS[key]);
      }
    }
    // Step 2: per-kanji substitution with context-aware on/kun selection.
    //   - A kanji immediately followed by hiragana is acting as a verb or
    //     adjective stem (okurigana follows) → prefer kun reading.
    //     Example: 待っている → ま+っている (kun ま), not たい.
    //   - Otherwise (next char is another kanji, punctuation, or end of
    //     string) it is part of a compound → prefer on reading.
    //     Example: 待機 → たい+き (on たい).
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!KANJI_RE.test(ch)) {
        out += ch;
        continue;
      }
      const entry = KANJI_READINGS[ch];
      if (!entry) {
        out += ch;
        continue;
      }
      const nextIsHira = i + 1 < text.length && HIRA_RE.test(text[i + 1]);
      out += nextIsHira
        ? (entry.k ?? entry.o ?? ch)
        : (entry.o ?? entry.k ?? ch);
    }
    // Step 3: full kana → Hepburn romaji. anyAscii's per-char approach
    // misrenders palatalized digraphs and small-vowel combinations
    // (きょう → "kiyou" instead of "kyou"), so we do the conversion
    // ourselves and let the downstream tokenizer anyAscii pass become
    // an identity for Japanese.
    return kanaToRomaji(out);
  }

  predict(word: string, language?: string, pos?: string): string | null {
    return this.processJapanese(word);
  }

  public addPronunciation(word: string, pronunciation: string): void {
    // Japanese G2P doesn't support custom pronunciations in the same way
    // This is a no-op implementation to satisfy the interface
  }

  private processJapanese(text: string): string {
    text = text.toLowerCase();

    // Particle Rules: Handle specific cases for particles 'ha', 'he', 'wo'
    // which are pronounced differently from their romanization.
    if (text === "ha") {
      text = "wa";
    } else if (text === "he") {
      text = "e";
    } else if (text === "wo") {
      text = "o";
    } else if (text === "konnichiha") {
      text = "konnichiwa";
    } else if (text === "konbanha") {
      text = "konbanwa";
    }

    // Sokuon (geminated consonants), excluding 'n'
    text = text.replace(/([bcdfghjklmpqrstvwxyz])\1/g, "っ$1");

    // Moraic nasal 'n' (撥音 ん) before a consonant
    text = text.replace(/n(?=[bcdfghjklmpqrstvwxyz])/g, "ん");

    // Long vowels
    for (const [key, value] of Object.entries(JAPANESE_LONG_VOWEL_RULES)) {
      text = text.replace(new RegExp(key, "g"), value);
    }

    // Syllable mapping using the single unified map
    let result = "";
    let i = 0;
    while (i < text.length) {
      let matched = false;
      // Greedily match longest possible syllable
      for (let j = 3; j > 0; j--) {
        if (i + j <= text.length) {
          const sub = text.substring(i, i + j);
          if (JAPANESE_SYLLABLE_MAP[sub]) {
            result += JAPANESE_SYLLABLE_MAP[sub];
            i += j;
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        // Handle special characters like 'っ' and 'ん'
        if (text[i] === "っ") {
          result += "っ";
        } else if (text[i] === "ん") {
          result += "n";
        } else {
          result += text[i];
        }
        i++;
      }
    }

    // Sokuon → IPA gemination: copy the next phoneme's leading character
    // back onto the っ slot (matte = [mat:te] in linguistic literature is
    // commonly written 'matte' in IPA; we follow that convention). For
    // affricates like tɕ, the gemination falls on the stop element (t),
    // which is the standard Japanese sokuon realization.
    return result.replace(/っ(.)/g, "$1$1").replace(/っ/g, "");
  }
}

// Default export for the Japanese G2P Model
export default JapaneseG2P;
