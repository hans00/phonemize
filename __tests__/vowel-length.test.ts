import { phonemize, toIPA, toARPABET, Tokenizer } from '../src/index'

describe('Vowel Length Marks', function() {
  describe('THOUGHT vowel (ɔː) - always long', function() {
    it('adds length mark to ɔ', function() {
      const result = phonemize('thought')
      expect(result).toContain('ɔː')
      expect(result).not.toMatch(/ɔ(?!ː)/)
    })
  })

  describe('PALM/LOT vowel (ɑː) - always long', function() {
    it('adds length mark to ɑ in "John"', function() {
      const result = phonemize('John')
      expect(result).toContain('ɑː')
      expect(result).not.toMatch(/ɑ(?!ː)/)
    })

    it('adds length mark to ɑ in "doctor"', function() {
      const result = phonemize('doctor')
      expect(result).toContain('ɑː')
      expect(result).not.toMatch(/ɑ(?!ː)/)
    })
  })

  describe('FLEECE vowel (iː) - only when stressed', function() {
    it('adds length mark to stressed i in "see"', function() {
      const result = phonemize('see')
      expect(result).toContain('iː')
    })

    it('adds length mark to stressed i in acronyms like "TTS"', function() {
      const result = phonemize('TTS')
      expect(result).toContain('iː')
    })

    it('does NOT add length mark to unstressed final i (happy)', function() {
      const result = phonemize('happy')
      // Should end with short i, not iː
      expect(result).toMatch(/i$/)
      expect(result).not.toMatch(/iː$/)
    })

    it('does NOT add length mark to unstressed final i (buggie)', function() {
      const result = phonemize('buggie')
      expect(result).toMatch(/i$/)
      expect(result).not.toMatch(/iː$/)
    })
  })

  describe('GOOSE vowel (uː) - only when stressed', function() {
    it('adds length mark to stressed u in "food"', function() {
      const result = phonemize('food')
      expect(result).toContain('uː')
    })

    it('adds length mark to stressed u in "supercar"', function() {
      const result = phonemize('supercar')
      expect(result).toContain('ˈsuː')
    })
  })

  describe('does not affect non-English languages', function() {
    it('Chinese IPA is not modified', function() {
      const result = phonemize('中文的抑揚頓挫')
      // Chinese ɑ should NOT get length marks
      expect(result).toContain('jɑŋ')
      expect(result).not.toContain('jɑːŋ')
    })
  })

  describe('does not affect ARPABET output', function() {
    it('ARPABET format has no length marks', function() {
      const result = toARPABET('Hello world!')
      expect(result).not.toContain('ː')
    })
  })

  describe('idempotency', function() {
    it('does not double-apply length marks', function() {
      const result = phonemize('see')
      expect(result).not.toContain('iːː')
    })
  })
})
