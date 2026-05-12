import { LanguageProcessor } from "./g2p";
import { expandKoreanText } from "./expand-ko";

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
  '': '',    // Silent initial ㅇ — careful speech may add [ʔ] but standard
             // IPA transcriptions drop it; emitting it broke every
             // vowel-initial syllable mid-word (e.g. 한국어 hanɡuʔʌ).
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

class KoreanG2P implements LanguageProcessor {
  readonly id = "ko-g2p";
  readonly name = "Korean G2P Processor";
  readonly supportedLanguages = ["ko"];

  preProcess(text: string): string {
    return expandKoreanText(text);
  }

  predict(word: string, language?: string, pos?: string): string | null {
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

    const decomposed: KoreanSyllable[] = syllables.map(s => this.decomposeRomajaSyllable(s));

    // Liaison (연음): a coda consonant migrates onto the next syllable
    // when that syllable starts with the silent ㅇ (empty initial).
    for (let i = 0; i < decomposed.length - 1; i++) {
      const current = decomposed[i];
      const next = decomposed[i + 1];
      if (current.final && !next.initial) {
        next.initial = current.final;
        current.final = '';
      }
    }

    // Cross-syllable phonological rules consume the boundary
    // (prev.final + curr.initial) and rewrite both sides in place. Order
    // matters: aspiration first (it's the only rule that *deletes* the
    // coda), then nasal assimilation, then liquid assimilation.
    for (let i = 1; i < decomposed.length; i++) {
      const prev = decomposed[i - 1];
      const curr = decomposed[i];

      // Aspiration (격음화): obstruent coda + ㅎ initial collapses into a
      // single aspirated onset. Also covers the reverse direction
      // (ㅎ coda + obstruent onset). 특히 → tʰɯkʰi, 좋다 → tɕotʰa.
      if (curr.initial === 'h' && ['g', 'k', 'd', 't', 'b', 'p', 'j', 'ch'].includes(prev.final)) {
        const asp: Record<string, string> = { g: 'k', k: 'k', d: 't', t: 't', b: 'p', p: 'p', j: 'ch', ch: 'ch' };
        curr.initial = asp[prev.final];
        prev.final = '';
      } else if (prev.final === 'h' && ['g', 'd', 'b', 'j'].includes(curr.initial)) {
        const asp: Record<string, string> = { g: 'k', d: 't', b: 'p', j: 'ch' };
        curr.initial = asp[curr.initial];
        prev.final = '';
      }

      // Nasal assimilation (비음화): obstruent coda before /n m/ assimilates
      // to the matching nasal. 입니다 → imnida, 합니다 → hamnida, 국민 → kuŋmin.
      if (['n', 'm'].includes(curr.initial) && ['g', 'k', 'd', 't', 'b', 'p', 's', 'ss', 'j', 'ch'].includes(prev.final)) {
        const nasal: Record<string, string> = {
          g: 'ng', k: 'ng',
          d: 'n', t: 'n', s: 'n', ss: 'n', j: 'n', ch: 'n',
          b: 'm', p: 'm',
        };
        prev.final = nasal[prev.final];
      }

      // Liquid assimilation (유음화): ㄴ + ㄹ or ㄹ + ㄴ → [ll]. 신라 → silla.
      if (prev.final === 'n' && curr.initial === 'l') prev.final = 'l';
      else if (prev.final === 'l' && curr.initial === 'n') curr.initial = 'l';
    }

    // Generate IPA from the rewritten syllables.
    let ipaString = "";
    for (let i = 0; i < decomposed.length; i++) {
      const syl = decomposed[i];
      let initialIpa = KOREAN_CONSONANTS[syl.initial] ?? syl.initial;
      const medialIpa = KOREAN_VOWELS[syl.medial] ?? syl.medial;
      const finalIpa = KOREAN_FINALS[syl.final] ?? '';

      // Intervocalic voicing for plain stops.
      if (i > 0 && ['k', 't', 'p', 'tɕ'].includes(initialIpa)) {
        const prev = decomposed[i - 1];
        const prevFinalIpa = KOREAN_FINALS[prev.final] ?? '';
        if (KOREAN_VOWELS[prev.medial] || ['n', 'm', 'ŋ', 'l'].includes(prevFinalIpa)) {
          const voiced: { [key: string]: string } = { k: 'ɡ', t: 'd', p: 'b', tɕ: 'dʑ' };
          initialIpa = voiced[initialIpa];
        }
      }

      // Intervocalic ㄹ surfaces as flap [ɾ]: when the onset is /l/ and the
      // previous syllable ended on a vowel (no coda), this is the bare
      // single-ㄹ between-vowels case. A doubled ㄹㄹ keeps [l] because
      // the previous syllable's final stays /l/ post-liquid-assimilation.
      if (i > 0 && initialIpa === 'l') {
        const prev = decomposed[i - 1];
        if (!prev.final) {
          initialIpa = 'ɾ';
        }
      }

      ipaString += initialIpa + medialIpa + finalIpa;
    }

    return ipaString;
  }
}

// Default export for the Korean G2P Model
export default KoreanG2P; 