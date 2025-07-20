import { expect } from 'chai'
import { predictPhonemes } from '../src/g2p'

describe('Multilingual Processor', function() {
  describe('predictPhonemes', function() {
    it('should process Chinese text', function() {
      const result = predictPhonemes('中文')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('beijing')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
    })

    it('should process Japanese text', function() {
      const result = predictPhonemes('にほん')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('konnichiha')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
    })

    it('should process Korean text', function() {
      const result = predictPhonemes('한국')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
    })

    it('should process Russian text', function() {
      const result = predictPhonemes('Привет');
      expect(result).to.be.a('string');
      expect(result).to.have.length.greaterThan(0);
    })

    it('should process English text', function() {
      const result = predictPhonemes('hello');
      expect(result).to.be.a('string');
      expect(result).to.have.length.greaterThan(0);
    })

    it('should handle specified language detection', function() {
      const result = predictPhonemes('中文', 'zh')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
    })

    it('should return null for unsupported text', function() {
      expect(predictPhonemes('')).to.be.null
      expect(predictPhonemes(' ')).to.be.null
    })
  })

  describe('Chinese processing specifics', function() {
    it('should handle complex Chinese compound words', function() {
      const result1 = predictPhonemes('zhongguo')
      expect(result1).to.be.a('string')
      expect(result1).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('beijing')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
      
      const result3 = predictPhonemes('shanghai')
      expect(result3).to.be.a('string')
      expect(result3).to.have.length.greaterThan(0)
    })

    it('should handle Chinese pinyin syllables', function() {
      const result1 = predictPhonemes('ni')
      expect(result1).to.be.a('string')
      expect(result1).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('hao')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
      
      const result3 = predictPhonemes('ma')
      expect(result3).to.be.a('string')
      expect(result3).to.have.length.greaterThan(0)
    })

    it('should handle Chinese compound pinyin', function() {
      const result = predictPhonemes('ZhongGuo')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
    })
  })

  describe('Japanese processing specifics', function() {
    it('should handle Japanese particle rules', function() {
      const result1 = predictPhonemes('konnichiha')
      expect(result1).to.be.a('string')
      expect(result1).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('konbanha')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
    })

    it('should handle regular Japanese syllables', function() {
      const result1 = predictPhonemes('ka')
      expect(result1).to.be.a('string')
      expect(result1).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('ki')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
      
      const result3 = predictPhonemes('ku')
      expect(result3).to.be.a('string')
      expect(result3).to.have.length.greaterThan(0)
    })

    it('should handle complex Japanese combinations', function() {
      const result = predictPhonemes('arigatou')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
    })
  })

  describe('Korean processing specifics', function() {
    it('should handle Korean syllables', function() {
      const result1 = predictPhonemes('han')
      expect(result1).to.be.a('string')
      expect(result1).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('guk')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
    })

    it('should handle Korean consonants and vowels', function() {
      const result1 = predictPhonemes('a')
      expect(result1).to.be.a('string')
      expect(result1).to.have.length.greaterThan(0)
      
      const result2 = predictPhonemes('i')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
    })
  })

  describe('Error handling and edge cases', function() {
    it('should handle very long multilingual strings', function() {
      const longChinese = '中文'.repeat(50)
      const result = predictPhonemes(longChinese)
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
    })

    it('should handle mixed scripts in one text', function() {
      const result = predictPhonemes('Helloにほん한국')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
    })

    it('should handle unknown characters gracefully', function() {
      const result = predictPhonemes('ẑẑẑ') // Unknown characters
      expect(result).to.be.null
    })

    it('should handle partial matches', function() {
      const result2 = predictPhonemes('123に')
      expect(result2).to.be.a('string')
      expect(result2).to.have.length.greaterThan(0)
    })
  })
}) 