import anyAscii from "any-ascii";
import { predict } from "./g2p";
import { expandText } from "./expand";
import { simplePOSTagger, POSResult } from "./pos-tagger";
import { ARPABET_TO_IPA, IPA_STRESS_MAP, PUNCTUATION } from "./consts";
import { detectLanguage } from "./multilingual-processor";

export interface TokenizerOptions {
  homograph?: { [word: string]: string };
  stripStress?: boolean;
  format?: "ipa" | "arpabet";
  separator?: string;
  anyAscii?: boolean;
}

export interface PhonemeToken {
  phoneme: string;
  word: string;
  position: number;
}

function arpabetToIpa(arpabet: string): string {
  const stress = arpabet.match(/[012]$/)?.[0];
  const arpabetWithoutStress = arpabet.replace(/[012]$/, "");
  const ipa =
    ARPABET_TO_IPA[arpabetWithoutStress as keyof typeof ARPABET_TO_IPA];
  return stress ? `${IPA_STRESS_MAP[stress]}${ipa}` : ipa;
}

export class Tokenizer {
  protected options: TokenizerOptions;

  constructor(options: TokenizerOptions = {}) {
    this.options = {
      stripStress: false,
      format: "ipa",
      separator: " ",
      anyAscii: false,
      ...options,
    };
  }

  protected _preprocess(text: string): {
    text: string;
    languageMap: Record<string, string>;
  } {
    if (this.options.anyAscii) {
      const words = text.split(/(\s+)/);
      const languageMap: Record<string, string> = {};

      for (const word of words) {
        const trimmed = word.trim();
        if (trimmed && !PUNCTUATION.includes(trimmed)) {
          const detectedLang = detectLanguage(trimmed);
          if (detectedLang) {
            const asciiWord = anyAscii(trimmed);
            languageMap[asciiWord.toLowerCase()] = detectedLang;
          }
        }
      }

      return {
        text: anyAscii(text),
        languageMap,
      };
    }
    return {
      text,
      languageMap: {},
    };
  }

  protected _postProcess(arpabet: string): string {
    let phonemes = arpabet.split(" ").filter((p) => p);

    if (this.options.stripStress) {
      phonemes = phonemes.map((p) => p.replace(/[012]$/, ""));
    }

    if (this.options.format === "ipa") {
      return phonemes
        .map(arpabetToIpa)
        .join(this.options.separator === " " ? "" : this.options.separator);
    }

    return phonemes.join(this.options.separator);
  }

  public tokenize(text: string): string[] {
    const { text: processedText, languageMap } = this._preprocess(text);
    const expandedText = expandText(processedText);
    const words = expandedText.split(/([\s,.!"!?;:()])/g);

    // Get POS tags
    let posResults: POSResult[] = [];
    const cleanWords = words.filter(
      (w) => w.trim() && !PUNCTUATION.includes(w.trim()),
    );
    posResults = simplePOSTagger.tagWords(cleanWords);

    let cleanWordIndex = 0;
    return words.map((word) => {
      const trimmedWord = word.trim();
      if (!trimmedWord) return word;

      const lowerWord = trimmedWord.toLowerCase();
      if (this.options.homograph && this.options.homograph[lowerWord]) {
        return this._postProcess(this.options.homograph[lowerWord]);
      }

      if (PUNCTUATION.includes(trimmedWord)) return trimmedWord;

      // Get POS tag for this word
      const pos = posResults[cleanWordIndex]
        ? posResults[cleanWordIndex].pos
        : undefined;

      // Get detected language for this word
      const detectedLanguage = languageMap[lowerWord];

      const prediction = predict(trimmedWord, pos, detectedLanguage);
      cleanWordIndex++;
      return this._postProcess(prediction);
    });
  }

  public tokenizeToString(text: string): string {
    return this.tokenize(text).join("");
  }

  public tokenizeToTokens(text: string): PhonemeToken[] {
    const { text: processedText, languageMap } = this._preprocess(text);
    const expandedText = expandText(processedText);
    const parts = expandedText.split(/([ ,.!"!?;:()]+)/g);

    // Get POS tags
    let posResults: POSResult[] = [];
    const cleanWords = parts.filter(
      (p) => p.trim() && !PUNCTUATION.includes(p.trim()),
    );
    posResults = simplePOSTagger.tagWords(cleanWords);

    const tokens: PhonemeToken[] = [];
    let currentIndex = 0;
    let cleanWordIndex = 0;

    for (const part of parts) {
      const originalWord = part.trim();
      if (!originalWord) {
        currentIndex += part.length;
        continue;
      }

      // Find the start position of the trimmed word within the part
      const wordStartIndex = part.indexOf(originalWord) + currentIndex;

      if (PUNCTUATION.includes(originalWord)) {
        // Skip punctuation for token list
      } else {
        const lowerWord = originalWord.toLowerCase();
        let prediction: string;

        if (this.options.homograph && this.options.homograph[lowerWord]) {
          prediction = this._postProcess(this.options.homograph[lowerWord]);
        } else {
          // Get POS tag for this word
          const pos = posResults[cleanWordIndex]
            ? posResults[cleanWordIndex].pos
            : undefined;

          prediction = this._postProcess(
            predict(originalWord, pos, languageMap[lowerWord]),
          );
        }

        tokens.push({
          phoneme: prediction,
          word: originalWord,
          position: wordStartIndex,
        });
        cleanWordIndex++;
      }
      currentIndex += part.length;
    }
    return tokens;
  }
}

// Legacy functions for backward compatibility
export function tokenizeText(
  text: string,
  _g2pPredict: any, // No longer needed
  options: TokenizerOptions = {},
): PhonemeToken[] {
  const tokenizer = new Tokenizer(options);
  return tokenizer.tokenizeToTokens(text);
}

export function textToIPA(
  text: string,
  _g2pPredict: any,
  options: TokenizerOptions = {},
): string {
  const tokenizer = new Tokenizer({ ...options, format: "ipa" });
  return tokenizer.tokenizeToString(text);
}

export function textToARPABET(
  text: string,
  _g2pPredict: any,
  options: TokenizerOptions = {},
): string {
  const tokenizer = new Tokenizer({ ...options, format: "arpabet" });
  return tokenizer.tokenizeToString(text);
}
