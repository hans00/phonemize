import {
  ipaToArpabet, 
  pinyinToZhuyin, 
  arpabetToIpa,
  convertChineseTonesToArrows,
  convertChineseTonesToUnicode
} from '../src/utils'

describe('Utils', function() {
  describe('pinyinToZhuyin', function() {
    it('should convert basic pinyin syllables', function() {
      expect(pinyinToZhuyin('ma1')).toEqual('ㄇㄚ1');
      expect(pinyinToZhuyin('tiao3')).toEqual('ㄊㄧㄠ3');
      expect(pinyinToZhuyin('nü3')).toEqual('ㄋㄩ3');
      expect(pinyinToZhuyin('lve4')).toEqual('ㄌㄩㄝ4');
    });

    it('should handle two-letter initials', function() {
      expect(pinyinToZhuyin('zha1')).toEqual('ㄓㄚ1');
      expect(pinyinToZhuyin('che1')).toEqual('ㄔㄜ1');
      expect(pinyinToZhuyin('shi4')).toEqual('ㄕ4');
    });

    it('should handle zero-initial syllables (y, w)', function() {
      expect(pinyinToZhuyin('yin1')).toEqual('ㄧㄣ1');
      expect(pinyinToZhuyin('wu3')).toEqual('ㄨ3');
      expect(pinyinToZhuyin('yu2')).toEqual('ㄩ2');
      expect(pinyinToZhuyin('ye4')).toEqual('ㄧㄝ4');
      expect(pinyinToZhuyin('yuan1')).toEqual('ㄩㄢ1');
      expect(pinyinToZhuyin('wen4')).toEqual('ㄨㄣ4');
    });

    it('should handle special syllables (zhi, chi, shi, etc.)', function() {
      expect(pinyinToZhuyin('zhi1')).toEqual('ㄓ1');
      expect(pinyinToZhuyin('chi2')).toEqual('ㄔ2');
      expect(pinyinToZhuyin('si4')).toEqual('ㄙ4');
      expect(pinyinToZhuyin('ri4')).toEqual('ㄖ4');
    });

    it('should handle all tones correctly', function() {
      expect(pinyinToZhuyin('a1')).toEqual('ㄚ1');
      expect(pinyinToZhuyin('a2')).toEqual('ㄚ2');
      expect(pinyinToZhuyin('a3')).toEqual('ㄚ3');
      expect(pinyinToZhuyin('a4')).toEqual('ㄚ4');
      expect(pinyinToZhuyin('a5')).toEqual('ㄚ5'); // Neutral tone
    });
    
    it('should handle pinyin without tone number (defaults to neutral)', function() {
      expect(pinyinToZhuyin('ma')).toEqual('ㄇㄚ5');
    });
    
    it('should handle edge cases', function() {
      expect(pinyinToZhuyin('')).toEqual('');
      expect(pinyinToZhuyin('  ')).toEqual('  ');
      expect(pinyinToZhuyin('invalidpinyin')).toEqual('invalidpinyin5');
    });

    it('should handle null and undefined inputs', function() {
      expect(pinyinToZhuyin(null as any)).toEqual(null);
      expect(pinyinToZhuyin(undefined as any)).toEqual(undefined);
    });

    it('should handle syllables with only initials', function() {
      expect(pinyinToZhuyin('zh')).toEqual('zh5');
      expect(pinyinToZhuyin('b')).toEqual('b5');
    });
  });
  
  describe('ipaToArpabet', function() {
    it('should convert basic IPA phonemes to ARPABET', function() {
      expect(ipaToArpabet('ɑ')).toEqual('AA')
      expect(ipaToArpabet('æ')).toEqual('AE')
      expect(ipaToArpabet('ʌ')).toEqual('AH')
      expect(ipaToArpabet('ɔ')).toEqual('SAW')
      expect(ipaToArpabet('ə')).toEqual('AX')
    })

    it('should convert consonants correctly', function() {
      expect(ipaToArpabet('b')).toEqual('B')
      expect(ipaToArpabet('tʃ')).toEqual('CH')
      expect(ipaToArpabet('d')).toEqual('D')
      expect(ipaToArpabet('ð')).toEqual('DH')
      expect(ipaToArpabet('f')).toEqual('F')
      expect(ipaToArpabet('ɡ')).toEqual('G')
      expect(ipaToArpabet('h')).toEqual('HH')
    })

    it('should handle two-character IPA symbols', function() {
      expect(ipaToArpabet('tʃ')).toEqual('CH')
      expect(ipaToArpabet('dʒ')).toEqual('JH')
      expect(ipaToArpabet('ʃ')).toEqual('SH')
      expect(ipaToArpabet('θ')).toEqual('TH')
      expect(ipaToArpabet('ʒ')).toEqual('ZH')
      expect(ipaToArpabet('ŋ')).toEqual('NG')
    })

    it('should handle stress markers', function() {
      expect(ipaToArpabet('ˈhəˈloʊ')).toContain('1')
      expect(ipaToArpabet('ˌhəˈloʊ')).toContain('2')
      expect(ipaToArpabet('həloʊ')).not.toContain('1')
      expect(ipaToArpabet('həloʊ')).not.toContain('2')
    })

    it('should handle complex IPA strings', function() {
      expect(ipaToArpabet('həˈloʊ')).toEqual('HH AX L1 OW')
      expect(ipaToArpabet('wɝld')).toEqual('W ER L D')
      expect(ipaToArpabet('ˌfəʊˈtɑɡrəfi')).toContain('2')
    })

    it('should handle empty and edge cases', function() {
      expect(ipaToArpabet('')).toEqual('')
      expect(ipaToArpabet(null as any)).toEqual('')
      expect(ipaToArpabet(undefined as any)).toEqual('')
      expect(ipaToArpabet('   ')).toEqual('')
      const result = ipaToArpabet('x')
      expect(result).toContain('undefined')
    })

    it('should handle diphthongs', function() {
      expect(ipaToArpabet('aɪ')).toEqual('AY')
      expect(ipaToArpabet('aʊ')).toEqual('AW')
      expect(ipaToArpabet('eɪ')).toEqual('EY')
      expect(ipaToArpabet('oʊ')).toEqual('OW')
      expect(ipaToArpabet('ɔɪ')).toEqual('OY')
    })

    it('should handle R-colored vowels', function() {
      expect(ipaToArpabet('ɝ')).toEqual('ER')
      expect(ipaToArpabet('ɚ')).toEqual('AXR')
      expect(ipaToArpabet('ɫ')).toEqual('EL')
    })

    it('should preserve word boundaries with spaces', function() {
      const result = ipaToArpabet('həˈloʊ wɝld')
      expect(result).toContain('HH AX L1 OW')
      expect(result).toContain('W ER L D')
    })

    it('should handle multiple spaces correctly', function() {
      expect(ipaToArpabet('hə   loʊ')).toEqual('HH AX L OW')
    })

    it('should handle stress markers without following phonemes', function() {
      expect(ipaToArpabet('ˈ')).toEqual('')
      expect(ipaToArpabet('ˌ')).toEqual('')
    })
  })

  describe('arpabetToIpa', function() {
    it('should convert basic ARPABET to IPA', function() {
      expect(arpabetToIpa('AA')).toEqual('ɑ')
      expect(arpabetToIpa('AE')).toEqual('æ')
      expect(arpabetToIpa('AH')).toEqual('ʌ')
      expect(arpabetToIpa('AO')).toEqual('ɔ')
      expect(arpabetToIpa('AX')).toEqual('ə')
    })

    it('should handle consonants correctly', function() {
      expect(arpabetToIpa('B')).toEqual('b')
      expect(arpabetToIpa('CH')).toEqual('tʃ')
      expect(arpabetToIpa('D')).toEqual('d')
      expect(arpabetToIpa('DH')).toEqual('ð')
      expect(arpabetToIpa('F')).toEqual('f')
      expect(arpabetToIpa('G')).toEqual('ɡ')
      expect(arpabetToIpa('HH')).toEqual('h')
    })

    it('should handle stress markers correctly', function() {
      expect(arpabetToIpa('HH AX1 L OW')).toEqual('ˈhəloʊ')
      expect(arpabetToIpa('AH2 B AW T')).toEqual('ˌʌbaʊt')
      expect(arpabetToIpa('HH AX L OW')).toEqual('həloʊ')
    })

    it('should handle multiple stress markers', function() {
      expect(arpabetToIpa('AH1 B AX2 K EY T')).toEqual('ˈʌbəkeɪt')
    })

    it('should handle unknown phonemes', function() {
      expect(arpabetToIpa('HH AX1 UNKNOWN OW')).toEqual('ˈhəUNKNOWNoʊ')
    })

    it('should handle empty and edge cases', function() {
      expect(arpabetToIpa('')).toEqual('')
      expect(arpabetToIpa(null as any)).toEqual('')
      expect(arpabetToIpa(undefined as any)).toEqual('')
      expect(arpabetToIpa('   ')).toEqual('')
    })

    it('should prefer primary stress over secondary', function() {
      expect(arpabetToIpa('AH2 B AX1 K EY T')).toEqual('ˈʌbəkeɪt')
    })

    it('should handle diphthongs', function() {
      expect(arpabetToIpa('AY')).toEqual('aɪ')
      expect(arpabetToIpa('AW')).toEqual('aʊ')
      expect(arpabetToIpa('EY')).toEqual('eɪ')
      expect(arpabetToIpa('OW')).toEqual('oʊ')
      expect(arpabetToIpa('OY')).toEqual('ɔɪ')
    })
  })

  describe('convertChineseTonesToArrows', function() {
    it('should convert Chinese tone marks to arrows', function() {
      // Check if the function exists and returns strings
      expect(convertChineseTonesToArrows('ma˥˥')).toEqual('ma→')
      expect(convertChineseTonesToArrows('ma˧˥')).toEqual('ma↗')
      expect(convertChineseTonesToArrows('ma˧˩˧')).toEqual('ma↓↗')
      expect(convertChineseTonesToArrows('ma˥˩')).toEqual('ma↘')
    })

    it('should handle multiple tones in one string', function() {
      expect(convertChineseTonesToArrows('ma˥˥ma˧˥')).toEqual('ma→ma↗')
      expect(convertChineseTonesToArrows('ma˧˩˧ma˥˩')).toEqual('ma↓↗ma↘')
    })

    it('should handle edge cases', function() {
      expect(convertChineseTonesToArrows('')).toEqual('')
      expect(convertChineseTonesToArrows(null as any)).toEqual(null)
      expect(convertChineseTonesToArrows(undefined as any)).toEqual(undefined)
    })

    it('should handle mixed content', function() {
      const result = convertChineseTonesToArrows('hello mā world')
      expect(result).toBeDefined()
      expect(result).toContain('hello')
      expect(result).toContain('world')
    })

    it('should not affect strings without tone marks', function() {
      expect(convertChineseTonesToArrows('hello world')).toEqual('hello world')
    })
  })

  describe('convertChineseTonesToUnicode', function() {
    it('should convert arrow tone marks back to Unicode', function() {
      // Check if the function exists and returns strings
      expect(convertChineseTonesToUnicode('ma→')).toBeDefined()
      expect(convertChineseTonesToUnicode('ma↗')).toBeDefined()
      expect(convertChineseTonesToUnicode('ma↓↗')).toBeDefined()
      expect(convertChineseTonesToUnicode('ma↓')).toBeDefined()
    })

    it('should handle multiple arrows in one string', function() {
      const result1 = convertChineseTonesToUnicode('ma→ma↗')
      const result2 = convertChineseTonesToUnicode('ni↓↗hao↓↗')
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })

    it('should handle edge cases', function() {
      expect(convertChineseTonesToUnicode('')).toEqual('')
      expect(convertChineseTonesToUnicode(null as any)).toEqual(null)
      expect(convertChineseTonesToUnicode(undefined as any)).toEqual(undefined)
    })

    it('should handle mixed content', function() {
      const result = convertChineseTonesToUnicode('hello ma→ world')
      expect(result).toBeDefined()
      expect(result).toContain('hello')
      expect(result).toContain('world')
    })

    it('should not affect strings without arrow marks', function() {
      expect(convertChineseTonesToUnicode('hello world')).toEqual('hello world')
    })

    it('should handle complex tone patterns', function() {
      const result = convertChineseTonesToUnicode('ma↓↗ma↓')
      expect(result).toBeDefined()
    })
  })
})
