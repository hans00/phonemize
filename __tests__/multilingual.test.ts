import { expect } from 'chai'
import anyAscii from 'any-ascii'
import { predictPhonemes } from '../src/g2p'

const tests = [
  { text: '中文', lang: 'zh', expected: 'ʈʂʊŋ˥˥ wən˧˥' },
  { text: '你好', lang: 'zh', expected: 'ni˧˩˧ xɑʊ˧˩˧' },
  { text: '北京', lang: 'zh', expected: 'peɪ˧˩˧ tɕiŋ˥˥' },
  // Japanese
  { text: 'こんにちは', lang: 'ja', expected: 'konnitɕiwa' },
  { text: 'にほん', lang: 'ja', expected: 'nihon' },
  { text: 'ha', lang: 'ja', expected: 'wa' },
  { text: 'he', lang: 'ja', expected: 'e' },
  { text: 'wo', lang: 'ja', expected: 'o' },
  { text: 'さくら', lang: 'ja', expected: 'sakɯɾa' },
  { text: 'きょうと', lang: 'ja', expected: 'kijoɯto' },
  // Korean
  { text: '감사합니다', lang: 'ko', expected: 'kamsahap̚nida' },
  { text: '한국', lang: 'ko', expected: 'hanɡuk̚' },
  { text: '안녕', lang: 'ko', expected: 'ʔannjʌŋ' },
  { text: '사랑', lang: 'ko', expected: 'salaŋ' },
  // Russian
  { text: 'Привет', lang: 'ru', expected: 'prʲivʲet' },
  { text: 'Москва', lang: 'ru', expected: 'moskva' },
  { text: 'Спасибо', lang: 'ru', expected: 'spasʲibo' },
  { text: 'Добро пожаловать', lang: 'ru', expected: 'dobro pozhalovatʲ' },
]

const withoutAnyAscii = ['en', 'zh']

describe('Multilingual Processor', function() {
  for (const test of tests) {
    it(`should process ${test.text}`, function() {
      const { text, lang, expected } = test
      const result = predictPhonemes(
        withoutAnyAscii.includes(lang) ? text : anyAscii(text),
        lang,
      )
      expect(result).to.be.equal(expected)
    })
  }
})
