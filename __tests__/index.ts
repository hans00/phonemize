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
    expect(phonemize('pneumonoultramicroscopicsilicovolcanoconiosis')).to.be.equal('ˈnumoʊnɑʌltɹæmɪˈkɹɔskɑpɪksɪlɪkɑvɑlkænɑkɑnɪɑsɪs')
  })

  it('anyAscii', function() {
    expect(phonemize('中文', { anyAscii: true })).to.be.equal('ʒoʊŋʊən')
    expect(phonemize('にほんご', { anyAscii: true })).to.be.equal('nihoʊnɡoʊ')
    expect(phonemize('한국어', { anyAscii: true })).to.be.equal('hʌnɡʊɡʊ')
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

  it('Long word processing', function() {
    // Very long compound words
    expect(phonemize('supercalifragilisticexpialidocious')).to.include('ˈsupɝ')
    
    // Long technical terms
    expect(phonemize('antidisestablishmentarianism')).to.be.a('string')
    expect(phonemize('antidisestablishmentarianism')).to.have.length.greaterThan(10)
  })

  it('Uppercase acronym processing', function() {
    expect(phonemize('TTS')).to.be.equal('ˈtiˈtiˈɛs')
    expect(phonemize('AI')).to.be.equal('ˈeɪˈaɪ')

    expect(phonemize('Xyz')).to.not.include('ˌɛks')
    expect(phonemize('abc')).to.not.include('ˌeɪ')
  })
})
