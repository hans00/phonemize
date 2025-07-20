import { G2PProcessor } from "./g2p";

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
};

class JapaneseG2PModel implements G2PProcessor {
  readonly id = "ja-g2p";
  readonly name = "Japanese G2P Processor";
  readonly supportedLanguages = ["ja"];

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
export default JapaneseG2PModel; 