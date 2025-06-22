import { g2pModel } from "./g2p";
import { Tokenizer, TokenizerOptions, PhonemeToken } from "./tokenizer";

// Re-export types
export { TokenizerOptions, PhonemeToken, Tokenizer };

// --- API Functions (Rule-based only) ---

// phonemize
export function phonemize(
  text: string,
  options: TokenizerOptions & { returnArray: true },
): PhonemeToken[];
export function phonemize(text: string, options?: TokenizerOptions): string;
export function phonemize(text: string, options: true): PhonemeToken[];
export function phonemize(
  text: string,
  options: true | (TokenizerOptions & { returnArray?: boolean }) = {},
): string | PhonemeToken[] {
  if (options === true) {
    options = { returnArray: true };
  }

  const tokenizer = new Tokenizer(options);
  if (options.returnArray) {
    return tokenizer.tokenizeToTokens(text);
  }
  return tokenizer.tokenizeToString(text);
}

// toIPA
export function toIPA(
  text: string,
  options?: Omit<TokenizerOptions, "format">,
): string {
  const ipaOptions: TokenizerOptions = { ...options, format: "ipa" };
  const tokenizer = new Tokenizer(ipaOptions);
  return tokenizer.tokenizeToString(text);
}

// toARPABET
export function toARPABET(
  text: string,
  options?: Omit<TokenizerOptions, "format">,
): string {
  const arpabetOptions: TokenizerOptions = { ...options, format: "arpabet" };
  const tokenizer = new Tokenizer(arpabetOptions);
  return tokenizer.tokenizeToString(text);
}

// --- Common ---

// Add custom pronunciations
export function addPronunciation(word: string, pronunciation: string): void {
  g2pModel.addPronunciation(word, pronunciation);
}

// Create custom tokenizers
export function createTokenizer(options: TokenizerOptions = {}): Tokenizer {
  return new Tokenizer(options);
}

// Default export for CommonJS compatibility
const phonemizer = {
  // Core functions
  phonemize,
  toIPA,
  toARPABET,

  // Common
  addPronunciation,
  createTokenizer,

  // Classes
  Tokenizer,
};

export default phonemizer;
