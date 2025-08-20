import { phonemize, toARPABET, toIPA, toZhuyin, addPronunciation, Tokenizer } from '../src/index'

describe('Index', function() {
  it('Work Fine', function() {
    expect(phonemize('Hello world!')).toEqual('həˈɫoʊ ˈwɝɫd!')
    expect(phonemize('this is an apple.')).toEqual('ˈðɪs ˈɪz ˈæn ˈæpəɫ.')
    expect(phonemize('John\'s package', true)).toEqual([
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
    expect(phonemize('ML')).toEqual('ɛmɛl')
  })

  it('toIPA', function() {
    expect(toIPA('Hello world!')).toEqual('həˈɫoʊ ˈwɝɫd!')
  })

  it('toARPABET', function() {
    expect(toARPABET('Hello world!')).toEqual('HH AX EL1 OW W1 ER EL D!')
  })

  it('rule based or compound word', function() {
    expect(phonemize('buggie')).toEqual('ˈbʌɡi')
    expect(phonemize('supercar')).toEqual('ˈsupɝˈkɑɹ')
    expect(phonemize('pneumonoultramicroscopicsilicovolcanoconiosis')).toEqual('ˈnumoʊˈnoʊˈəɫtɹəˈˌmaɪkɹəskɑpɪkˈsiˈɫikoʊˈvɑɫkeɪnoʊˈkɑnˈaɪoʊˈsɪs')
  })

  it('chinese', function() {
    expect(phonemize('中文 TTS')).toEqual('ʈʂʊŋ˥˥ wən˧˥ ˈtiˈtiˈɛs')
    expect(phonemize('中文的抑揚頓挫')).toEqual('ʈʂʊŋ˥˥ wən˧˥ tə˧ i˥˩ jɑŋ˧˥ tuən˥˩ tsʰuɔ˥˩')
    expect(phonemize('還原 還你 還是 還不是')).toEqual('xuan˧˥ juan˧˥ xuan˧˥ ni˧˩˧ xaɪ˧˥ ʂɨ˥˩ xaɪ˧˥ pu˥˩ ʂɨ˥˩')
  })

  it('chinese tone formats', function() {
    // Test default Unicode tone format
    expect(phonemize('中文', { toneFormat: 'unicode' })).toContain('˥˥')
    expect(phonemize('中文', { toneFormat: 'unicode' })).toContain('˧˥')
    
    // Test arrow tone format
    expect(phonemize('中文', { toneFormat: 'arrow' })).toContain('→')
    expect(phonemize('中文', { toneFormat: 'arrow' })).toContain('↗')
    
    // Test tone conversion for common patterns
    const unicodeResult = phonemize('還有', { toneFormat: 'unicode' })
    const arrowResult = phonemize('還有', { toneFormat: 'arrow' })
    expect(unicodeResult).not.toEqual(arrowResult)
    expect(arrowResult).not.toContain('˥')
    expect(arrowResult).not.toContain('˧')
    expect(arrowResult).not.toContain('˩')
  })

  it('zhuyin format', function() {
    // Test basic Zhuyin conversion
    const zhuyinResult = phonemize('中文', { format: 'zhuyin' })
    expect(zhuyinResult).toEqual('ㄓㄨㄥ1 ㄨㄣ2')
    
    // Test mixed Chinese and English
    const mixedResult = phonemize('中文 hello', { format: 'zhuyin' })
    expect(mixedResult).toContain('ㄓㄨㄥ1 ㄨㄣ2 həˈɫoʊ') // English IPA fallback
  })

  it('toZhuyin function', function() {
    // Test standalone toZhuyin function
    expect(toZhuyin('中文注音符號')).toEqual('ㄓㄨㄥ1 ㄨㄣ2 ㄓㄨ4 ㄧㄣ1 ㄈㄨ2 ㄏㄠ4')
    
    // Test with options
    const result = toZhuyin('hello 中文', { stripStress: true })
    expect(result).toEqual('həˈɫoʊ ㄓㄨㄥ1 ㄨㄣ2')
  })

  it('anyAscii', function() {
    // Japanese test (with particle rule)
    expect(phonemize('こんにちは', { anyAscii: true })).toEqual('konnitɕiwa')
    // Korean test (with liaison rule)
    expect(phonemize('한국어', { anyAscii: true })).toEqual('hanɡuɡʌ')
    // Russian test
    expect(phonemize('Привет', { anyAscii: true })).toEqual('prʲivʲet')
  })

  it('Options and configurations', function() {
    // Test various options
    expect(phonemize('hello', { stripStress: true })).toEqual('həɫoʊ')
    expect(phonemize('hello', { separator: '|', format: 'arpabet' })).toContain('|')
    expect(phonemize('hello', { format: 'arpabet' })).toEqual('HH AX EL1 OW')
    
    // Test combination of options
    expect(phonemize('hello', { format: 'arpabet', stripStress: true })).toEqual('HH AX EL OW')
  })

  it('Number processing', function() {
    // Basic number expansion tests
    expect(phonemize('5')).toEqual('ˈfaɪv')
    expect(phonemize('123')).toEqual('ˈwən ˈhəndɝd ˈtwɛni ˈθɹi')
  })

  it('Abbreviation expansion', function() {
    // Basic abbreviation tests
    expect(phonemize('Mr. Smith')).toContain('ˈmɪstɝ')
    expect(phonemize('Dr. Johnson')).toContain('ˈdɑktɝ')
  })

  it('Custom tokenizer creation', function() {
    const customTokenizer = new Tokenizer({
      format: 'arpabet',
      stripStress: true,
      separator: '-'
    })
    
    const result = customTokenizer.tokenize('hello')
    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toEqual('HH-AX-EL-OW')
    expect(result[0]).not.toContain('1') // stress markers removed
  })

  it('Uppercase acronym processing', function() {
    expect(phonemize('TTS')).toEqual('ˈtiˈtiˈɛs')
    expect(phonemize('AI')).toEqual('ˈeɪaɪ')

    expect(phonemize('Xyz')).not.toContain('ˌɛks')
    expect(phonemize('abc')).not.toContain('ˌeɪ')
  })
})
