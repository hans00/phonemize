import { expect } from 'chai'
import { phonemize, toARPABET, toIPA, toZhuyin, addPronunciation, Tokenizer } from '../src/index'

describe('Index', function() {
  it('Work Fine', function() {
    expect(phonemize('Hello world!')).to.be.equal('həˈɫoʊ ˈwɝɫd!')
    expect(phonemize('this is an apple.')).to.be.equal('ˈðɪs ˈɪz ˈæn ˈæpəɫ.')
    expect(phonemize('John\'s package', true)).to.be.deep.equal([
      {
        "phoneme": "ˈdʒɑnz",
        "position": 0,
        "word": "John's"
      },
      {
        "phoneme": "ˈpækədʒ",
        "position": 7,
        "word": "package"
      },
    ])
  })

  it('Custom Pronunciation', function() {
    addPronunciation('ML', 'ɛmɛl')
    expect(phonemize('ML')).to.be.equal('ɛmɛl')
  })

  it('toIPA', function() {
    expect(toIPA('Hello world!')).to.be.equal('həˈɫoʊ ˈwɝɫd!')
  })

  it('toARPABET', function() {
    expect(toARPABET('Hello world!')).to.be.equal('HH AX EL1 OW W1 ER EL D!')
  })

  it('rule based or compound word', function() {
    expect(phonemize('buggie')).to.be.equal('ˈbʌɡi')
    expect(phonemize('supercar')).to.be.equal('ˈsupɝˈkɑɹ')
    expect(phonemize('pneumonoultramicroscopicsilicovolcanoconiosis')).to.be.equal('ˈnumoʊˈnoʊˈəɫtɹəˈˌmaɪkɹəskɑpɪkˈsiˈɫikoʊˈvɑɫkeɪnoʊˈkɑnˈaɪoʊˈsɪs')
  })

  it('chinese', function() {
    expect(phonemize('中文 TTS')).to.be.equal('ʈʂʊŋ˥˥ wən˧˥ ˈtiˈtiˈɛs')
    expect(phonemize('中文的抑揚頓挫')).to.be.equal('ʈʂʊŋ˥˥ wən˧˥ tə˧ i˥˩ jɑŋ˧˥ tuən˥˩ tsʰuɔ˥˩')
    expect(phonemize('還原 還你 還是 還不是')).to.be.equal('xuan˧˥ juan˧˥ xuan˧˥ ni˧˩˧ xaɪ˧˥ ʂɨ˥˩ xaɪ˧˥ pu˥˩ ʂɨ˥˩')
  })

  it('chinese tone formats', function() {
    // Test default Unicode tone format
    expect(phonemize('中文', { toneFormat: 'unicode' })).to.include('˥˥')
    expect(phonemize('中文', { toneFormat: 'unicode' })).to.include('˧˥')
    
    // Test arrow tone format
    expect(phonemize('中文', { toneFormat: 'arrow' })).to.include('→')
    expect(phonemize('中文', { toneFormat: 'arrow' })).to.include('↗')
    
    // Test tone conversion for common patterns
    const unicodeResult = phonemize('還有', { toneFormat: 'unicode' })
    const arrowResult = phonemize('還有', { toneFormat: 'arrow' })
    expect(unicodeResult).to.not.equal(arrowResult)
    expect(arrowResult).to.not.include('˥')
    expect(arrowResult).to.not.include('˧')
    expect(arrowResult).to.not.include('˩')
  })

  it('zhuyin format', function() {
    // Test basic Zhuyin conversion
    const zhuyinResult = phonemize('中文', { format: 'zhuyin' })
    expect(zhuyinResult).to.be.equal('ㄓㄨㄥ1 ㄨㄣ2')
    
    // Test mixed Chinese and English
    const mixedResult = phonemize('中文 hello', { format: 'zhuyin' })
    expect(mixedResult).to.include('ㄓㄨㄥ1 ㄨㄣ2 həˈɫoʊ') // English IPA fallback
  })

  it('toZhuyin function', function() {
    // Test standalone toZhuyin function
    expect(toZhuyin('中文注音符號')).to.be.equal('ㄓㄨㄥ1 ㄨㄣ2 ㄓㄨ4 ㄧㄣ1 ㄈㄨ2 ㄏㄠ4')
    
    // Test with options
    const result = toZhuyin('hello 中文', { stripStress: true })
    expect(result).to.be.equal('həɫoʊ ㄓㄨㄥ1 ㄨㄣ2')
  })

  it('anyAscii', function() {
    // Japanese test (with particle rule)
    expect(phonemize('こんにちは', { anyAscii: true })).to.be.equal('konnitɕiwa')
    // Korean test (with liaison rule)
    expect(phonemize('한국어', { anyAscii: true })).to.be.equal('hanɡuɡʌ')
    // Russian test
    expect(phonemize('Привет', { anyAscii: true })).to.be.equal('prʲivʲet')
  })

  it('Options and configurations', function() {
    // Test various options
    expect(phonemize('hello', { stripStress: true })).to.be.equal('həɫoʊ')
    expect(phonemize('hello', { separator: '|' })).to.include('|')
    expect(phonemize('hello', { format: 'arpabet' })).to.be.equal('HH AX EL1 OW')
    
    // Test combination of options
    expect(phonemize('hello', { format: 'arpabet', stripStress: true })).to.be.equal('HH AX EL OW')
  })

  it('Number processing', function() {
    // Basic number expansion tests
    expect(phonemize('5')).to.be.equal('ˈfaɪv')
    expect(phonemize('123')).to.be.equal('ˈwən ˈhəndɝd ˈtwɛni ˈθɹi')
  })

  it('Abbreviation expansion', function() {
    // Basic abbreviation tests
    expect(phonemize('Mr. Smith')).to.include('ˈmɪstɝ')
    expect(phonemize('Dr. Johnson')).to.include('ˈdɑktɝ')
  })

  it('Custom tokenizer creation', function() {
    const customTokenizer = new Tokenizer({
      format: 'arpabet',
      stripStress: true,
      separator: '-'
    })
    
    const result = customTokenizer.tokenize('hello')
    expect(result).to.be.an('array')
    expect(result[0]).to.be.equal('HH-AX-EL-OW')
    expect(result[0]).to.not.include('1') // stress markers removed
  })

  it('Uppercase acronym processing', function() {
    expect(phonemize('TTS')).to.be.equal('ˈtiˈtiˈɛs')
    expect(phonemize('AI')).to.be.equal('ˈeɪaɪ')

    expect(phonemize('Xyz')).to.not.include('ˌɛks')
    expect(phonemize('abc')).to.not.include('ˌeɪ')
  })
})
