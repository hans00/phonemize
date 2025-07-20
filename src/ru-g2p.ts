import { G2PProcessor } from "./g2p";

// === Russian G2P Processor ===

const RUSSIAN_TO_PHONEME: { [key: string]: string } = {
  // Vowels (after anyascii) - a, e, i, o, u, y
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', 'y': 'ɨ',
  // Consonants
  'b': 'b', 'v': 'v', 'g': 'ɡ', 'd': 'd', 'zh': 'ʐ', 'z': 'z',
  'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
  'r': 'r', 's': 's', 't': 't', 'f': 'f', 'kh': 'x', 'ts': 'ts',
  'ch': 'tɕ', 'sh': 'ʂ', 'shch': 'ɕː',
  // Special characters
  '\'': 'ʲ', // Soft sign
  '"': '' // Hard sign is often unpronounced or causes a slight pause
};

class RussianG2PModel implements G2PProcessor {
  readonly id = "ru-g2p";
  readonly name = "Russian G2P Processor";
  readonly supportedLanguages = ["ru"];

  predict(word: string, language?: string, pos?: string): string | null {
    // If language is specified and not Russian, return null
    if (language && language !== 'ru') {
      return null;
    }
    
    return this.processRussian(word);
  }

  private processRussian(text: string): string {
    text = text.toLowerCase();
    let ipa = '';
    const softVowels = ['е', 'ё', 'и', 'ю', 'я'];
    const anyasciiSoftVowels = ['e', 'yo', 'i', 'yu', 'ya'];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i+1];
      
      let phoneme = RUSSIAN_TO_PHONEME[char] || char;

      // Palatalization rule for consonants
      if (RUSSIAN_TO_PHONEME[char] && !anyasciiSoftVowels.includes(char) && nextChar && anyasciiSoftVowels.includes(nextChar)) {
         if (!['j', 'ʃ', 'ʒ', 'ts'].includes(phoneme)) { // These don't get palatalized
            phoneme += 'ʲ';
         }
      }
      
      ipa += phoneme;
    }
    
    // We clean up some artifacts from the simple palatalization.
    return ipa.replace(/ʲj/g, 'j');
  }

  public addPronunciation(word: string, pronunciation: string): void {
    // Russian G2P doesn't support custom pronunciations in the same way
    // This is a no-op implementation to satisfy the interface
  }
}

// Default export for the Russian G2P Model
export default RussianG2PModel; 