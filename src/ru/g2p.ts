import { LanguageProcessor } from "../g2p";
import { expandRussianText } from "./expand";

// === Russian G2P Processor ===

/**
 * Single-char map for Latin-script Russian after anyAscii. Multi-char
 * sequences (zh/kh/ch/sh/shch/ts) are handled separately below via
 * longest-match digraph lookup — they live in this map only as a
 * structural reminder of what digraphs exist; processRussian consults
 * DIGRAPHS first, then falls through to single chars.
 */
const RUSSIAN_TO_PHONEME: { [key: string]: string } = {
  // Vowels (after anyAscii) — a, e, i, o, u, y
  a: "a",
  e: "e",
  i: "i",
  o: "o",
  u: "u",
  y: "ɨ",
  // Consonants
  b: "b",
  v: "v",
  g: "ɡ",
  d: "d",
  z: "z",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  p: "p",
  r: "r",
  s: "s",
  t: "t",
  f: "f",
  // Special characters from anyAscii passthrough
  "'": "ʲ", // Soft sign Ь
  '"': "", // Hard sign Ъ — silent, but blocks palatalization spread
};

const DIGRAPHS: Array<[string, string]> = [
  // Longest first so "shch" wins over "sh".
  ["shch", "ɕː"],
  ["zh", "ʐ"],
  ["kh", "x"],
  ["ts", "t͡s"],
  ["ch", "t͡ɕ"],
  ["sh", "ʂ"],
];

/** Consonant phonemes that do not palatalize (already palatal or affricate). */
const NON_PALATALIZING = new Set(["j", "ʃ", "ʒ", "t͡s", "ts", "ɕː", "ʂ"]);

/** Voiced obstruents → their voiceless counterparts (for final devoicing). */
const DEVOICE: Record<string, string> = {
  b: "p",
  d: "t",
  ɡ: "k",
  z: "s",
  v: "f",
  ʐ: "ʂ",
};

const VOWELS_LATIN = new Set(["a", "e", "i", "o", "u", "y"]);

class RussianG2P implements LanguageProcessor {
  readonly id = "ru-g2p";
  readonly name = "Russian G2P Processor";
  readonly supportedLanguages = ["ru"];

  preProcess(text: string): string {
    return expandRussianText(text);
  }

  predict(word: string, language?: string, pos?: string): string | null {
    return this.processRussian(word);
  }

  /**
   * Token-level G2P. Input is the post-anyAscii Latin transliteration:
   *
   * - digraphs (zh/kh/ch/sh/shch/ts) → real IPA, looked up longest-first
   *   so the bare `s`/`z`/`t`/`c`/`k`/`h` fallbacks never preempt them.
   * - "y" before a/o/u is the anyAscii rendering of я/ё/ю — when it
   *   follows a consonant it palatalizes that consonant and the `y` is
   *   absorbed; word-initially or after a vowel it surfaces as /j/.
   * - "e" and "i" after a consonant also palatalize.
   * - Final voiced obstruent → voiceless (final devoicing).
   *
   * This is a phonemic approximation only — Russian needs lexical stress
   * to do unstressed-vowel reduction (akan'e / ikan'e) properly, and we
   * don't have a stress dictionary, so vowel quality stays full.
   */
  private processRussian(text: string): string {
    text = text.toLowerCase();
    // Stress is per-word: if handed a multi-word string (e.g. predict()
    // called on a phrase), process each word independently and keep the
    // whitespace so each gets its own heuristic stress + reduction.
    if (/\s/.test(text))
      return text
        .split(/(\s+)/)
        .map((p) => (/^\s+$/.test(p) || p === "" ? p : this.processRussian(p)))
        .join("");
    const tokens: string[] = [];

    let i = 0;
    while (i < text.length) {
      // Longest-match digraph first.
      let digraphHit: { ipa: string; len: number } | null = null;
      for (const [seq, ipa] of DIGRAPHS) {
        if (text.startsWith(seq, i)) {
          digraphHit = { ipa, len: seq.length };
          break;
        }
      }

      if (digraphHit) {
        tokens.push(digraphHit.ipa);
        i += digraphHit.len;
        continue;
      }

      // Iotated vowels: y + {a,o,u} after a consonant palatalizes the
      // preceding consonant and emits just the bare vowel; elsewhere we
      // surface the /j/ glide.
      if (
        text[i] === "y" &&
        i + 1 < text.length &&
        "aou".includes(text[i + 1])
      ) {
        const vowel = text[i + 1];
        const prev = tokens[tokens.length - 1];
        if (
          prev &&
          !VOWELS_LATIN.has(prev[0]) &&
          !NON_PALATALIZING.has(prev) &&
          prev !== "j"
        ) {
          tokens[tokens.length - 1] = prev + "ʲ";
          tokens.push(vowel);
        } else {
          tokens.push("j", vowel);
        }
        i += 2;
        continue;
      }

      const ch = text[i];
      let phoneme = RUSSIAN_TO_PHONEME[ch] ?? ch;

      // Palatalization before "e"/"i" attaches to the preceding consonant.
      // The map already emitted the consonant in the previous iteration,
      // so patch it in-place rather than queuing on the vowel.
      if (ch === "e" || ch === "i") {
        const prev = tokens[tokens.length - 1];
        if (
          prev &&
          !VOWELS_LATIN.has(prev[0]) &&
          !NON_PALATALIZING.has(prev) &&
          prev !== "j" &&
          !prev.endsWith("ʲ")
        ) {
          tokens[tokens.length - 1] = prev + "ʲ";
        }
      }

      tokens.push(phoneme);
      i++;
    }

    // Final devoicing — applies to the last obstruent of the word.
    for (let j = tokens.length - 1; j >= 0; j--) {
      const t = tokens[j];
      if (!t) continue;
      if (DEVOICE[t]) {
        tokens[j] = DEVOICE[t];
        break;
      }
      // Skip trailing palatalization mark / soft sign attached to a stop.
      if (t === "ʲ") continue;
      // Stop at the first non-obstruent (vowel or sonorant).
      if (VOWELS_LATIN.has(t) || ["m", "n", "l", "r", "j"].includes(t)) break;
    }

    // Heuristic lexical stress + unstressed-vowel reduction (akan'e /
    // ikan'e). Russian stress is lexically unpredictable and we ship no
    // stress dictionary, so the position is a guess (monosyllable → its
    // vowel; otherwise the penult, the most common default) — but the
    // reduction it drives makes output markedly more Russian, and a
    // wrong-stress word is no worse off than the previous stress-less form.
    // Runs after devoicing so that pass still sees plain a/e/i/o/u vowels.
    this.applyStressAndReduction(tokens);

    return tokens.join("");
  }

  /**
   * Assign heuristic stress and apply unstressed-vowel reduction in place.
   * Vowel tokens are a/e/i/o/u/ɨ. Stressed vowel keeps full quality; for
   * unstressed: o,a → ɐ (first-pretonic or word-initial) else ə; e → ɪ;
   * i/u/ɨ stay. A ˈ mark is inserted at the stressed syllable's onset.
   */
  private applyStressAndReduction(tokens: string[]): void {
    const VOW = new Set(["a", "e", "i", "o", "u", "ɨ"]);
    const nuclei: number[] = [];
    for (let k = 0; k < tokens.length; k++) if (VOW.has(tokens[k])) nuclei.push(k);
    if (nuclei.length === 0) return;

    const sN = nuclei.length === 1 ? 0 : nuclei.length - 2; // monosyllable | penult
    const stressed = nuclei[sN];
    const pretonic = sN > 0 ? nuclei[sN - 1] : -1;

    // Stressed-syllable onset (walk back over consonants) — computed BEFORE
    // reduction, while the preceding vowel is still a plain a/e/i/o/u.
    let onset = stressed;
    while (onset > 0 && !VOW.has(tokens[onset - 1])) onset--;

    for (let n = 0; n < nuclei.length; n++) {
      const idx = nuclei[n];
      if (idx === stressed) continue;
      const v = tokens[idx];
      if (v === "o" || v === "a")
        tokens[idx] = idx === pretonic || n === 0 ? "ɐ" : "ə";
      else if (v === "e") tokens[idx] = "ɪ";
    }

    tokens.splice(onset, 0, "ˈ");
  }

  public addPronunciation(word: string, pronunciation: string): void {
    // Russian G2P doesn't support custom pronunciations in the same way
    // This is a no-op implementation to satisfy the interface
  }
}

// Default export for the Russian G2P Model
export default RussianG2P;
