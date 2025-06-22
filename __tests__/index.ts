import { expect } from 'chai'
import { phonemize, toARPABET, toIPA, addPronunciation, Tokenizer, createTokenizer } from '../src/index'

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
    addPronunciation('ML', 'ɛmɛl')
    expect(phonemize('ML')).to.be.equal('ɛmɛl')
    expect(phonemize('1 2 3')).to.be.equal('ˈwən ˈtu ˈθɹi')
    // test rule based
    expect(phonemize('buggie')).to.be.equal('bʌɡi')
  })

  it('toIPA', function() {
    expect(toIPA('Hello world!')).to.be.equal('həˈɫoʊ ˈwɝɫd!')
  })

  it('toARPABET', function() {
    expect(toARPABET('Hello world!')).to.be.equal('HH AX EL1 OW W1 ER EL D!')
  })

  it('rule based or compound word', function() {
    expect(phonemize('supercar')).to.be.equal('ˈsupɝˈkɑɹ')
    expect(phonemize('pneumonoultramicroscopicsilicovolcanoconiosis')).to.be.equal('ˈnumoʊnɑʌlˈtɹæmɪkɹɑˈskɑpɪkˈsɪɫɪkɑvɑlkænɑkɑnɪɑsɪs')
  })

  it('anyAscii', function() {
    expect(phonemize('中文', { anyAscii: true })).to.be.equal('ʒoʊŋʊən')
    expect(phonemize('にほんご', { anyAscii: true })).to.be.equal('nihoʊnɡoʊ')
    expect(phonemize('한국어', { anyAscii: true })).to.be.equal('hʌnɡʊɡʊ')
  })

  it('Japanese particle rules', function() {
    // Test Japanese particle は (ha) → wa pronunciation
    expect(phonemize('こんにちは', { anyAscii: true })).to.be.equal('koʊnnitʃiwʌ')
    expect(phonemize('こんばんは', { anyAscii: true })).to.be.equal('koʊnbʌnwʌ')
    
    // Test that regular 'ha' syllables are not affected
    expect(phonemize('はは', { anyAscii: true })).to.be.equal('hʌhʌ')
  })

  it('Options and configurations', function() {
    // Test returnArray option
    const result = phonemize('hello', { returnArray: true })
    expect(result).to.be.an('array')
    expect(result[0]).to.have.property('phoneme')
    expect(result[0]).to.have.property('word')
    expect(result[0]).to.have.property('position')

    // Test format option
    expect(phonemize('hello', { format: 'arpabet' })).to.be.equal('HH AX EL1 OW')
    expect(phonemize('hello', { format: 'ipa' })).to.be.equal('həˈɫoʊ')

    // Test stripStress option - removes stress markers
    expect(phonemize('hello', { stripStress: true })).to.be.equal('həɫoʊ')

    // Test separator option
    expect(phonemize('hello', { separator: '-' })).to.be.equal('h-ə-ˈɫ-oʊ')
  })

  it('Number processing', function() {
    expect(phonemize('123')).to.be.equal('ˈwən ˈhəndɝd ˈtwɛni ˈθɹi')
    expect(phonemize('1st')).to.be.equal('ˈfɝst')
    expect(phonemize('2nd')).to.be.equal('ˈsɛkənd')
    expect(phonemize('3rd')).to.be.equal('ˈθɝd')
    expect(phonemize('4th')).to.be.equal('ˈfɔɹθ')
  })

  it('Abbreviation expansion', function() {
    expect(phonemize('Dr. Smith')).to.be.equal('ˈdɑktɝ ˈsmɪθ')
    expect(phonemize('Mr. Johnson')).to.be.equal('ˈmɪstɝ ˈdʒɑnsən')
    expect(phonemize('Mrs. Brown')).to.be.equal('ˈmɪsɪz ˈbɹaʊn')
  })

  it('Tokenizer functionality', function() {
    const tokenizer = new Tokenizer()
    const tokens = tokenizer.tokenizeToTokens('Hello world!')
    
    expect(tokens).to.be.an('array')
    expect(tokens).to.have.length(2)
    expect(tokens[0]).to.have.property('phoneme')
    expect(tokens[0]).to.have.property('word', 'Hello')
    expect(tokens[0]).to.have.property('position', 0)
    expect(tokens[1]).to.have.property('word', 'world')
    expect(tokens[1]).to.have.property('position', 6)
  })

  it('Custom tokenizer creation', function() {
    const customTokenizer = createTokenizer({
      format: 'arpabet',
      stripStress: true,
      separator: '-'
    })
    
    const result = customTokenizer.tokenize('hello')
    expect(result).to.be.an('array')
    expect(result[0]).to.be.equal('HH-AX-EL-OW')
    expect(result[0]).to.not.include('1') // stress markers removed
  })

  it('Edge cases and error handling', function() {
    // Empty string
    expect(phonemize('')).to.be.equal('')
    
    // Only punctuation
    expect(phonemize('!!!')).to.be.equal('!!!')
    
    // Mixed case
    expect(phonemize('HeLLo')).to.be.equal('həˈɫoʊ')
    
    // Numbers with text
    expect(phonemize('I have 5 apples')).to.include('ˈfaɪv')
    
    // Special characters - test that it processes the text
    expect(phonemize('hello@world.com')).to.be.a('string')
    expect(phonemize('hello@world.com')).to.have.length.greaterThan(5)
  })

  it('Multilingual support coverage', function() {
    // Chinese variations
    expect(phonemize('北京', { anyAscii: true })).to.be.equal('ˌbeɪˈʒɪŋ')
    
    // Japanese variations  
    expect(phonemize('東京', { anyAscii: true })).to.be.equal('doʊŋdʒɪŋ')
    
    // Korean variations
    expect(phonemize('서울', { anyAscii: true })).to.be.equal('ˈsoʊɫ')
    
    // Mixed multilingual with English
    expect(phonemize('Hello 中文', { anyAscii: true })).to.include('həˈɫoʊ')
  })

  it('Compound word variations', function() {
    // Different compound patterns
    expect(phonemize('playground')).to.be.equal('ˈpɫeɪˌɡɹaʊn')
    expect(phonemize('superman')).to.be.equal('ˈsupɝˌmæn')
    expect(phonemize('overload')).to.be.equal('ˈoʊvɝˌɫoʊd')
    
    // Non-compound words that might be confused
    expect(phonemize('cookie')).to.be.equal('ˈkʊki')
    expect(phonemize('people')).to.be.equal('ˈpipəɫ')
  })

  it('Long word processing', function() {
    // Very long compound words
    expect(phonemize('supercalifragilisticexpialidocious')).to.include('ˈsupɝ')
    
    // Long technical terms
    expect(phonemize('antidisestablishmentarianism')).to.be.a('string')
    expect(phonemize('antidisestablishmentarianism')).to.have.length.greaterThan(10)
  })
})
