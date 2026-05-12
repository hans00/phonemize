import * as kanjiDict from "../data/ja/kanji.json";
import * as kanjiWords from "../data/ja/words.json";
import { resolveJson } from "./utils";
import { LanguageProcessor } from "./g2p";
import { expandJapaneseText } from "./expand-ja";

interface KanjiReading { o?: string; k?: string }
const KANJI_READINGS = resolveJson<Record<string, KanjiReading>>(kanjiDict);
const KANJI_WORDS = resolveJson<Record<string, string>>(kanjiWords);

// Longest-first compound key list — used in preProcess so e.g. 今日 wins
// over 今 / 日 individual lookups during scanning.
const KANJI_WORD_KEYS = Object.keys(KANJI_WORDS).sort((a, b) => b.length - a.length);
const KANJI_RE = /[一-龥㐀-䶿豈-﫿]/;
const HIRA_RE = /[ぁ-ゟ]/;

// Palatalized digraphs (consonant + small ゃ/ゅ/ょ). anyAscii treats the
// small kana as a separate syllable, romanizing きょう as "kiyou" instead
// of Hepburn "kyou", which then mis-syllabifies in ja-g2p as ki+yo+u.
// We pre-emit these as Hepburn romaji so anyAscii passes them through
// and the ja-g2p syllable map matches the proper kyo/sho/cho/… rows.
const PALATAL_DIGRAPHS: Record<string, string> = {
  // Hiragana
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'じゃ': 'ja',  'じゅ': 'ju',  'じょ': 'jo',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'ぢゃ': 'ja',  'ぢゅ': 'ju',  'ぢょ': 'jo',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  // Katakana counterparts
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'ジャ': 'ja',  'ジュ': 'ju',  'ジョ': 'jo',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
};

// === Japanese G2P Processor ===

const JAPANESE_SYLLABLE_MAP: { [key: string]: string } = {
  // Basic syllables
  'a': 'a', 'i': 'i', 'u': 'ɯ', 'e': 'e', 'o': 'o',
  'ka': 'ka', 'ki': 'ki', 'ku': 'kɯ', 'ke': 'ke', 'ko': 'ko',
  'ga': 'ɡa', 'gi': 'ɡi', 'gu': 'ɡɯ', 'ge': 'ɡe', 'go': 'ɡo',
  'sa': 'sa', 'shi': 'ʃi', 'su': 'sɯ', 'se': 'se', 'so': 'so',
  'za': 'za', 'ji': 'dʑi', 'zu': 'zɯ', 'ze': 'ze', 'zo': 'zo',
  'ta': 'ta', 'chi': 'tɕi', 'tsu': 'tsɯ', 'te': 'te', 'to': 'to',
  'da': 'da', 'de': 'de', 'do': 'do', 'na': 'na', 'ni': 'ni',
  'nu': 'nɯ', 'ne': 'nɛ', 'no': 'no', 'ha': 'ha', 'hi': 'çi',
  'fu': 'ɸɯ', 'he': 'hɛ', 'ho': 'ho', 'ba': 'ba', 'bi': 'bi',
  'bu': 'bɯ', 'be': 'be', 'bo': 'bo', 'pa': 'pa', 'pi': 'pi',
  'pu': 'pɯ', 'pe': 'pe', 'po': 'po', 'ma': 'ma', 'mi': 'mi',
  'mu': 'mɯ', 'me': 'mɛ', 'mo': 'mo', 'ya': 'ja', 'yu': 'jɯ',
  'yo': 'jo', 'ra': 'ɾa', 'ri': 'ɾi', 'ru': 'ɾɯ', 'wa': 'wa',
  'wo': 'o', 'n': 'n', 'kya': 'kja', 'kyu': 'kjɯ', 'kyo': 'kjo',
  'gya': 'ɡja', 'gyu': 'ɡjɯ', 'gyo': 'ɡjo', 'sha': 'ʃa', 'shu': 'ʃɯ',
  'sho': 'ʃo', 'ja': 'dʑa', 'ju': 'dʑɯ', 'jo': 'dʑo', 'cha': 'tɕa',
  'chu': 'tɕɯ', 'cho': 'tɕo', 'nya': 'ɲa', 'nyu': 'ɲɯ', 'nyo': 'ɲo',
  'hya': 'ça', 'hyu': 'çɯ', 'hyo': 'ço', 'ryu': 'ɾjɯ'
};

const JAPANESE_LONG_VOWEL_RULES: { [key:string]: string } = {
  'aa': 'aː', 'ii': 'iː', 'uu': 'uː', 'ee': 'eː', 'oo': 'oː',
  // お段+う almost always realizes as long ō in kango compounds
  // (とうきょう = tōkyō, がっこう = gakkō). Over-lengthens a few native
  // verb forms (思う omou → omoː) but those are a tiny minority.
  'ou': 'oː',
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
    // Step 1: replace known irregular compounds (longest first) with their
    // canonical hiragana readings. This catches gikun like 今日 → きょう
    // that a per-kanji map cannot reconstruct from on/kun alone.
    for (const key of KANJI_WORD_KEYS) {
      if (text.includes(key)) {
        text = text.split(key).join(KANJI_WORDS[key]);
      }
    }
    // Step 1.5: palatalized digraphs → Hepburn romaji (see PALATAL_DIGRAPHS).
    for (const [key, val] of Object.entries(PALATAL_DIGRAPHS)) {
      if (text.includes(key)) text = text.split(key).join(val);
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
    return out;
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
    if (text === 'ha') {
      text = 'wa';
    } else if (text === 'he') {
      text = 'e';
    } else if (text === 'wo') {
      text = 'o';
    } else if (text === 'konnichiha') {
      text = 'konnichiwa';
    } else if (text === 'konbanha') {
      text = 'konbanwa';
    }
    
    // Sokuon (geminated consonants), excluding 'n'
    text = text.replace(/([bcdfghjklmpqrstvwxyz])\1/g, "っ$1");

    // Moraic nasal 'n' (撥音 ん) before a consonant
    text = text.replace(/n(?=[bcdfghjklmpqrstvwxyz])/g, "ん");

    // Long vowels
    for (const [key, value] of Object.entries(JAPANESE_LONG_VOWEL_RULES)) {
      text = text.replace(new RegExp(key, 'g'), value);
    }

    // Syllable mapping using the single unified map
    let result = "";
    let i = 0;
    while(i < text.length) {
      let matched = false;
      // Greedily match longest possible syllable
      for(let j = 3; j > 0; j--) {
          if (i + j <= text.length) {
              const sub = text.substring(i, i+j);
              if(JAPANESE_SYLLABLE_MAP[sub]) {
                  result += JAPANESE_SYLLABLE_MAP[sub];
                  i += j;
                  matched = true;
                  break;
              }
          }
      }
      if(!matched) {
          // Handle special characters like 'っ' and 'ん'
          if (text[i] === 'っ') {
              result += 'っ';
          } else if (text[i] === 'ん') {
              result += 'n';
          } else {
              result += text[i];
          }
          i++;
      }
    }

    // Final cleanup for sokuon representation
    return result.replace(/っ/g, '');
  }
}

// Default export for the Japanese G2P Model
export default JapaneseG2P; 