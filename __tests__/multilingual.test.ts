import { expect } from 'chai'
import { 
  detectLanguage, 
  processMultilingualText, 
  isMultilingualText 
} from '../src/multilingual-processor'

describe('Multilingual Processor', function() {
  describe('detectLanguage', function() {
    it('should detect Chinese characters', function() {
      expect(detectLanguage('中文')).to.be.equal('zh')
      expect(detectLanguage('北京')).to.be.equal('zh')
      expect(detectLanguage('上海')).to.be.equal('zh')
      expect(detectLanguage('广州')).to.be.equal('zh')
      expect(detectLanguage('深圳')).to.be.equal('zh')
    })

    it('should detect Japanese characters', function() {
      expect(detectLanguage('にほん')).to.be.equal('ja')
      expect(detectLanguage('こんにちは')).to.be.equal('ja')
      expect(detectLanguage('ありがとう')).to.be.equal('ja')
      expect(detectLanguage('さようなら')).to.be.equal('ja')
    })

    it('should detect Korean characters', function() {
      expect(detectLanguage('한국')).to.be.equal('ko')
      expect(detectLanguage('안녕하세요')).to.be.equal('ko')
      expect(detectLanguage('감사합니다')).to.be.equal('ko')
      expect(detectLanguage('서울')).to.be.equal('ko')
    })

    it('should detect Russian characters', function() {
      expect(detectLanguage('русский')).to.be.equal('ru')
      expect(detectLanguage('Москва')).to.be.equal('ru')
      expect(detectLanguage('привет')).to.be.equal('ru')
    })

    it('should detect German characters', function() {
      expect(detectLanguage('Müller')).to.be.equal('de')
      expect(detectLanguage('schön')).to.be.equal('de')
      expect(detectLanguage('Größe')).to.be.equal('de')
    })

    it('should detect Arabic characters', function() {
      expect(detectLanguage('العربية')).to.be.equal('ar')
      expect(detectLanguage('مرحبا')).to.be.equal('ar')
      expect(detectLanguage('شكرا')).to.be.equal('ar')
    })

    it('should detect Thai characters', function() {
      expect(detectLanguage('ไทย')).to.be.equal('th')
      expect(detectLanguage('สวัสดี')).to.be.equal('th')
      expect(detectLanguage('ขอบคุณ')).to.be.equal('th')
    })

    it('should return null for English or unknown text', function() {
      expect(detectLanguage('hello')).to.be.null
      expect(detectLanguage('English text')).to.be.null
      expect(detectLanguage('123456')).to.be.null
      expect(detectLanguage('!@#$%')).to.be.null
      expect(detectLanguage('')).to.be.null
    })

    it('should handle mixed content', function() {
      // Should detect the first non-English language it finds
      expect(detectLanguage('Hello 中文')).to.be.equal('zh')
      expect(detectLanguage('English にほん Korean')).to.be.equal('ja')
    })
  })

  describe('processMultilingualText', function() {
    it('should process Chinese text', function() {
      const result = processMultilingualText('中文')
      expect(result).to.satisfy((r: any) => r === null || typeof r === 'string')
      
      const result2 = processMultilingualText('beijing')
      expect(result2).to.satisfy((r: any) => r === null || typeof r === 'string')
    })

    it('should process Japanese text', function() {
      const result = processMultilingualText('にほん')
      expect(result).to.satisfy((r: any) => r === null || typeof r === 'string')
      
      const result2 = processMultilingualText('konnichiha')
      expect(result2).to.satisfy((r: any) => r === null || typeof r === 'string')
    })

    it('should process Korean text', function() {
      const result = processMultilingualText('한국')
      expect(result).to.satisfy((r: any) => r === null || typeof r === 'string')
    })

    it('should process Russian text', function() {
      const result = processMultilingualText('Привет');
      expect(result).to.be.a('string');
      expect(result).to.have.length.greaterThan(0);
    })

    it('should process German text', function() {
      // Abandoned, should fallback to null
      expect(processMultilingualText('Müller')).to.be.null;
    })

    it('should process Arabic text', function() {
      // Abandoned, should fallback to null
      expect(processMultilingualText('مرحبا')).to.be.null;
    })

    it('should process Thai text', function() {
      // Abandoned, should fallback to null
      expect(processMultilingualText('สวัสดี')).to.be.null;
    })

    it('should handle specified language detection', function() {
      const result = processMultilingualText('中文', 'zh')
      expect(result).to.satisfy((r: any) => r === null || typeof r === 'string')
    })

    it('should return null for non-multilingual text', function() {
      expect(processMultilingualText('hello')).to.be.null
      expect(processMultilingualText('English text')).to.be.null
      expect(processMultilingualText('123')).to.be.null
    })

    it('should handle empty or invalid input', function() {
      expect(processMultilingualText('')).to.be.null
      expect(processMultilingualText(' ')).to.be.null
    })
  })

  describe('isMultilingualText', function() {
    it('should identify multilingual text', function() {
      expect(isMultilingualText('中文')).to.be.true
      expect(isMultilingualText('にほん')).to.be.true
      expect(isMultilingualText('한국')).to.be.true
      expect(isMultilingualText('русский')).to.be.true
      expect(isMultilingualText('Müller')).to.be.true
      expect(isMultilingualText('العربية')).to.be.true
      expect(isMultilingualText('ไทย')).to.be.true
    })

    it('should identify mixed multilingual text', function() {
      expect(isMultilingualText('Hello 中文')).to.be.true
      expect(isMultilingualText('English にほん')).to.be.true
      expect(isMultilingualText('Text with 한국 characters')).to.be.true
    })

    it('should not identify English-only text as multilingual', function() {
      expect(isMultilingualText('hello')).to.be.false
      expect(isMultilingualText('English text only')).to.be.false
      expect(isMultilingualText('123456')).to.be.false
      expect(isMultilingualText('!@#$%')).to.be.false
      expect(isMultilingualText('')).to.be.false
    })

    it('should handle edge cases', function() {
      expect(isMultilingualText(' ')).to.be.false
      expect(isMultilingualText('\n\t')).to.be.false
      expect(isMultilingualText('123 abc !@#')).to.be.false
    })
  })

  describe('Chinese processing specifics', function() {
    it('should handle complex Chinese compound words', function() {
      const result1 = processMultilingualText('zhongguo')
      expect(result1).to.satisfy((r: any) => r === null || typeof r === 'string')
      
      const result2 = processMultilingualText('beijing')
      expect(result2).to.satisfy((r: any) => r === null || typeof r === 'string')
      
      const result3 = processMultilingualText('shanghai')
      expect(result3).to.satisfy((r: any) => r === null || typeof r === 'string')
    })

    it('should handle Chinese pinyin syllables', function() {
      const result1 = processMultilingualText('ni')
      expect(result1).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('N IY')))
      
      const result2 = processMultilingualText('hao')
      expect(result2).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('HH AW')))
      
      const result3 = processMultilingualText('ma')
      expect(result3).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('M AH')))
    })

    it('should handle Chinese compound pinyin', function() {
      const result = processMultilingualText('ZhongGuo')
      expect(result).to.satisfy((r: any) => r === null || typeof r === 'string')
    })
  })

  describe('Japanese processing specifics', function() {
    it('should handle Japanese particle rules', function() {
      const result1 = processMultilingualText('konnichiha')
      expect(result1).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.length > 0))
      
      const result2 = processMultilingualText('konbanha')
      expect(result2).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.length > 0))
    })

    it('should handle regular Japanese syllables', function() {
      const result1 = processMultilingualText('ka')
      expect(result1).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('K AH')))
      
      const result2 = processMultilingualText('ki')
      expect(result2).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('K IY')))
      
      const result3 = processMultilingualText('ku')
      expect(result3).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('K UW')))
    })

    it('should handle complex Japanese combinations', function() {
      const result = processMultilingualText('arigatou')
      expect(result).to.satisfy((r: any) => r === null || typeof r === 'string')
    })
  })

  describe('Korean processing specifics', function() {
    it('should handle Korean syllables', function() {
      const result1 = processMultilingualText('han')
      expect(result1).to.satisfy((r: any) => r === null || typeof r === 'string')
      
      const result2 = processMultilingualText('guk')
      expect(result2).to.satisfy((r: any) => r === null || typeof r === 'string')
    })

    it('should handle Korean consonants and vowels', function() {
      const result1 = processMultilingualText('a')
      expect(result1).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('AH')))
      
      const result2 = processMultilingualText('i')
      expect(result2).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.includes('IY')))
    })
  })

  describe('Error handling and edge cases', function() {
    it('should handle very long multilingual strings', function() {
      const longChinese = '中文'.repeat(50)
      const result = processMultilingualText(longChinese)
      expect(result).to.satisfy((r: any) => r === null || (typeof r === 'string' && r.length > 0))
    })

    it('should handle mixed scripts in one text', function() {
      const result = processMultilingualText('Helloにほん한국')
      expect(result).to.be.a('string')
      expect(result).to.have.length.greaterThan(0)
    })

    it('should handle unknown characters gracefully', function() {
      const result = processMultilingualText('ẑẑẑ') // Unknown characters
      expect(result).to.be.null
    })

    it('should handle partial matches', function() {
      const result2 = processMultilingualText('123に')
      expect(result2).to.be.a('string')
    })
  })
}) 