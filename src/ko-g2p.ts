import { G2PProcessor } from "./g2p";

// === Korean G2P Processor ===

// A more structured approach for Korean G2P based on Jamo (consonant/vowel parts)
const KOREAN_CONSONANTS: { [key: string]: string } = {
  // Initials (初聲)
  'g': 'k', 'kk': 'k͈', 'k': 'kʰ',
  'n': 'n',
  'd': 't', 'tt': 't͈', 't': 'tʰ',
  'r': 'ɾ', 'l': 'l', // r/l are context-dependent
  'm': 'm',
  'b': 'p', 'pp': 'p͈', 'p': 'pʰ',
  's': 's', 'ss': 's͈',
  'j': 'tɕ', 'jj': 'tɕ͈', 'ch': 'tɕʰ',
  'h': 'h',
  'ng': 'ŋ', // Usually a final, but can be initial in 'eung'
  '': 'ʔ',  // Represents the silent initial 'ㅇ'
};

const KOREAN_VOWELS: { [key: string]: string } = {
  // Medials (中聲)
  'a': 'a', 'ae': 'ɛ', 'ya': 'ja', 'yae': 'jɛ',
  'eo': 'ʌ', 'e': 'e', 'yeo': 'jʌ', 'ye': 'je',
  'o': 'o', 'wa': 'wa', 'wae': 'wɛ', 'oe': 'we',
  'u': 'u', 'wo': 'wʌ', 'we': 'we', 'wi': 'wi',
  'eu': 'ɯ', 'ui': 'ɰi', // Note: ui is complex
  'i': 'i',
};

// Finals (終聲) - 7 representative sounds
const KOREAN_FINALS: { [key: string]: string } = {
    'g': 'k̚', 'k': 'k̚', 'kk': 'k̚',
    'n': 'n',
    'd': 't̚', 's': 't̚', 'ss': 't̚', 't': 't̚', 'j': 't̚', 'ch': 't̚',
    'l': 'l',
    'm': 'm',
    'b': 'p̚', 'p': 'p̚',
    'ng': 'ŋ',
};

interface KoreanSyllable {
  initial: string;
  medial: string;
  final: string;
  original: string;
}

class KoreanG2PModel implements G2PProcessor {
  readonly id = "ko-g2p";
  readonly name = "Korean G2P Processor";
  readonly supportedLanguages = ["ko"];

  predict(word: string, language?: string, pos?: string): string | null {
    // If language is specified and not Korean, return null
    if (language && language !== 'ko') {
      return null;
    }
    
    return this.processKorean(word);
  }

  public addPronunciation(word: string, pronunciation: string): void {
    // Korean G2P doesn't support custom pronunciations in the same way
    // This is a no-op implementation to satisfy the interface
  }

  private decomposeRomajaSyllable(syllable: string): KoreanSyllable {
    syllable = syllable.toLowerCase();
    let initial = '';
    let medial = '';
    let final = '';

    const vowelKeys = Object.keys(KOREAN_VOWELS).sort((a, b) => b.length - a.length);
    for (const v of vowelKeys) {
        const index = syllable.indexOf(v);
        if (index !== -1) {
            medial = v;
            initial = syllable.substring(0, index);
            final = syllable.substring(index + v.length);
            break;
        }
    }
    
    if (!medial) { // If no vowel found, it's not a valid syllable
        return { initial: '', medial: syllable, final: '', original: syllable };
    }

    return { initial, medial, final, original: syllable };
  }

  private processKorean(text: string): string {
    const syllables = text.match(/[A-Z][a-z]*/g) || [];
    if (syllables.length === 0) return text;

    let decomposed: KoreanSyllable[] = syllables.map(s => this.decomposeRomajaSyllable(s));

    // Apply Liaison (연음) and other linking rules
    for (let i = 0; i < decomposed.length - 1; i++) {
        const current = decomposed[i];
        const next = decomposed[i+1];

        // Liaison: final consonant moves to next empty initial
        if (current.final && !next.initial) {
            next.initial = current.final;
            current.final = '';
        }
    }

    // Generate IPA from decomposed syllables
    let ipaString = "";
    for (let i = 0; i < decomposed.length; i++) {
        const syl = decomposed[i];
        let initialIpa = KOREAN_CONSONANTS[syl.initial] || syl.initial;
        const medialIpa = KOREAN_VOWELS[syl.medial] || syl.medial;
        const finalIpa = KOREAN_FINALS[syl.final] || '';

        // Intervocalic voicing for g, d, b, j
        if (i > 0 && ['k', 't', 'p', 'tɕ'].includes(initialIpa)) {
            const prev = decomposed[i-1];
            if (KOREAN_VOWELS[prev.medial] || ['n', 'm', 'ŋ', 'l'].includes(KOREAN_FINALS[prev.final])) {
                const voiced: {[key: string]: string} = {'k': 'ɡ', 't': 'd', 'p': 'b', 'tɕ': 'dʑ'};
                initialIpa = voiced[initialIpa];
            }
        }
        
        ipaString += initialIpa + medialIpa + finalIpa;
    }

    return ipaString;
  }
}

// Default export for the Korean G2P Model
export default KoreanG2PModel; 