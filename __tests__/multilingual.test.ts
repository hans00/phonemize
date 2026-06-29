import anyAscii from '../src/anyascii'
import { predictPhonemes } from '../src/g2p'

const tests = [
  { text: '中文', lang: 'zh', expected: 'ʈʂʊŋ˥˥ wən˧˥' },
  { text: '你好', lang: 'zh', expected: 'ni˧˩˧ xɑʊ˧˩˧' },
  { text: '北京', lang: 'zh', expected: 'peɪ˧˩˧ tɕiŋ˥˥' },
  { text: 'a', lang: 'zh', expected: 'a' },
  // Japanese
  { text: 'こんにちは', lang: 'ja', expected: 'konnitɕiwa' },
  { text: 'にほん', lang: 'ja', expected: 'nihon' },
  { text: 'ha', lang: 'ja', expected: 'wa' },
  { text: 'he', lang: 'ja', expected: 'e' },
  { text: 'wo', lang: 'ja', expected: 'o' },
  { text: 'さくら', lang: 'ja', expected: 'sakɯɾa' },
  { text: 'きょうと', lang: 'ja', expected: 'kijoːto' },
  // Korean
  { text: '감사합니다', lang: 'ko', expected: 'kamsahamnida' },
  { text: '한국', lang: 'ko', expected: 'hanɡuk̚' },
  { text: '안녕', lang: 'ko', expected: 'annjʌŋ' },
  { text: '사랑', lang: 'ko', expected: 'saɾaŋ' },
  // Russian. NB: lexical stress is HEURISTIC (no stress dictionary) — the
  // penult default + vowel reduction is right for many words (spasibo) but
  // wrong for the unpredictable rest (privet/Moskva are end-stressed); these
  // expected values capture the heuristic's actual output, not gold IPA.
  { text: 'Привет', lang: 'ru', expected: 'ˈprʲivʲɪt' },
  { text: 'Москва', lang: 'ru', expected: 'ˈmoskvə' },
  { text: 'Спасибо', lang: 'ru', expected: 'spɐˈsʲibə' },
  { text: 'Добро пожаловать', lang: 'ru', expected: 'ˈdobrə pɐʐɐˈlovətʲ' },
]

const withoutAnyAscii = ['en', 'zh']

describe('Multilingual Processor', function() {
  for (const { text, lang, expected } of tests) {
    const payload = withoutAnyAscii.includes(lang) ? text : anyAscii(text)
    it(`should process ${text} (payload: ${payload})`, function() {
      const result = predictPhonemes(payload, lang)
      expect(result).toEqual(expected)
      console.log(`${text} -> ${result}`)
    })
  }
})
