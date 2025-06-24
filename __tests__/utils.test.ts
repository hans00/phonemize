import { expect } from 'chai'
import { ipaToArpabet, pinyinToZhuyin } from '../src/utils'

describe('Utils', function() {
  describe('pinyinToZhuyin', function() {
    it('should convert basic pinyin syllables', function() {
      expect(pinyinToZhuyin('ma1')).to.equal('ㄇㄚ1');
      expect(pinyinToZhuyin('tiao3')).to.equal('ㄊㄧㄠ3');
      expect(pinyinToZhuyin('nü3')).to.equal('ㄋㄩ3');
      expect(pinyinToZhuyin('lve4')).to.equal('ㄌㄩㄝ4');
    });

    it('should handle two-letter initials', function() {
      expect(pinyinToZhuyin('zha1')).to.equal('ㄓㄚ1');
      expect(pinyinToZhuyin('che1')).to.equal('ㄔㄜ1');
      expect(pinyinToZhuyin('shi4')).to.equal('ㄕ4');
    });

    it('should handle zero-initial syllables (y, w)', function() {
      expect(pinyinToZhuyin('yin1')).to.equal('ㄧㄣ1');
      expect(pinyinToZhuyin('wu3')).to.equal('ㄨ3');
      expect(pinyinToZhuyin('yu2')).to.equal('ㄩ2');
      expect(pinyinToZhuyin('ye4')).to.equal('ㄧㄝ4');
      expect(pinyinToZhuyin('yuan1')).to.equal('ㄩㄢ1');
      expect(pinyinToZhuyin('wen4')).to.equal('ㄨㄣ4');
    });

    it('should handle special syllables (zhi, chi, shi, etc.)', function() {
      expect(pinyinToZhuyin('zhi1')).to.equal('ㄓ1');
      expect(pinyinToZhuyin('chi2')).to.equal('ㄔ2');
      expect(pinyinToZhuyin('si4')).to.equal('ㄙ4');
      expect(pinyinToZhuyin('ri4')).to.equal('ㄖ4');
    });

    it('should handle all tones correctly', function() {
      expect(pinyinToZhuyin('a1')).to.equal('ㄚ1');
      expect(pinyinToZhuyin('a2')).to.equal('ㄚ2');
      expect(pinyinToZhuyin('a3')).to.equal('ㄚ3');
      expect(pinyinToZhuyin('a4')).to.equal('ㄚ4');
      expect(pinyinToZhuyin('a5')).to.equal('ㄚ5'); // Neutral tone
    });
    
    it('should handle pinyin without tone number (defaults to neutral)', function() {
      expect(pinyinToZhuyin('ma')).to.equal('ㄇㄚ5');
    });
    
    it('should handle edge cases', function() {
      expect(pinyinToZhuyin('')).to.equal('');
      expect(pinyinToZhuyin('  ')).to.equal('  ');
      expect(pinyinToZhuyin('invalidpinyin')).to.equal('invalidpinyin5');
    });
  });
  
  describe('ipaToArpabet', function() {
    it('should convert basic IPA phonemes to ARPABET', function() {
      expect(ipaToArpabet('ɑ')).to.be.equal('AA')
      expect(ipaToArpabet('æ')).to.be.equal('AE')
      expect(ipaToArpabet('ʌ')).to.be.equal('AH')
      expect(ipaToArpabet('ɔ')).to.be.equal('SAW')
      expect(ipaToArpabet('ə')).to.be.equal('AX')
    })

    it('should convert consonants correctly', function() {
      expect(ipaToArpabet('b')).to.be.equal('B')
      expect(ipaToArpabet('tʃ')).to.be.equal('CH')
      expect(ipaToArpabet('d')).to.be.equal('D')
      expect(ipaToArpabet('ð')).to.be.equal('DH')
      expect(ipaToArpabet('f')).to.be.equal('F')
      expect(ipaToArpabet('ɡ')).to.be.equal('G')
      expect(ipaToArpabet('h')).to.be.equal('HH')
    })

    it('should handle two-character IPA symbols', function() {
      expect(ipaToArpabet('tʃ')).to.be.equal('CH')
      expect(ipaToArpabet('dʒ')).to.be.equal('JH')
      expect(ipaToArpabet('ʃ')).to.be.equal('SH')
      expect(ipaToArpabet('θ')).to.be.equal('TH')
      expect(ipaToArpabet('ʒ')).to.be.equal('ZH')
      expect(ipaToArpabet('ŋ')).to.be.equal('NG')
    })

    it('should handle stress markers', function() {
      expect(ipaToArpabet('ˈhəˈloʊ')).to.include('1')
      expect(ipaToArpabet('ˌhəˈloʊ')).to.include('2')
      expect(ipaToArpabet('həloʊ')).to.not.include('1')
      expect(ipaToArpabet('həloʊ')).to.not.include('2')
    })

    it('should handle complex IPA strings', function() {
      expect(ipaToArpabet('həˈloʊ')).to.be.equal('HH AX L1 OW')
      expect(ipaToArpabet('wɝld')).to.be.equal('W ER L D')
      expect(ipaToArpabet('ˌfəʊˈtɑɡrəfi')).to.include('2')
    })

    it('should handle empty and edge cases', function() {
      expect(ipaToArpabet('')).to.be.equal('')
      const result = ipaToArpabet('x')
      expect(result).to.include('undefined')
    })

    it('should handle diphthongs', function() {
      expect(ipaToArpabet('aɪ')).to.be.equal('AY')
      expect(ipaToArpabet('aʊ')).to.be.equal('AW')
      expect(ipaToArpabet('eɪ')).to.be.equal('EY')
      expect(ipaToArpabet('oʊ')).to.be.equal('OW')
      expect(ipaToArpabet('ɔɪ')).to.be.equal('OY')
    })

    it('should handle R-colored vowels', function() {
      expect(ipaToArpabet('ɝ')).to.be.equal('ER')
      expect(ipaToArpabet('ɚ')).to.be.equal('AXR')
      expect(ipaToArpabet('ɫ')).to.be.equal('EL')
    })

    it('should preserve word boundaries with spaces', function() {
      const result = ipaToArpabet('həˈloʊ wɝld')
      expect(result).to.include('HH AX L1 OW')
      expect(result).to.include('W ER L D')
    })
  })
}) 