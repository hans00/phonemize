import { expandNumbers, expandAbbreviations, expandText } from '../src/expand'

describe('Expand', function() {
  describe('expandNumbers', function() {
    it('should expand currency', function() {
      expect(expandNumbers('$5')).toContain('five dollars')
      expect(expandNumbers('$1')).toContain('one dollar')
      expect(expandNumbers('$1.50')).toContain('one dollar and fifty cents')
      expect(expandNumbers('$0.01')).toContain('one cent')
      expect(expandNumbers('$0.05')).toContain('five cents')
      expect(expandNumbers('$100')).toContain('one hundred dollars')
      expect(expandNumbers('$1,000')).toContain('one thousand dollars')
      expect(expandNumbers('$1,234.56')).toContain('one thousand two hundred thirty four dollars and fifty six cents')
      expect(expandNumbers('$0.00')).toContain('zero dollars')
    })

    it('should expand years', function() {
      expect(expandNumbers('1985')).toContain('nineteen eighty five')
      expect(expandNumbers('2005')).toContain('twenty oh five')
      expect(expandNumbers('2000')).toContain('twenty hundred')
      expect(expandNumbers('2015')).toContain('twenty fifteen')
      expect(expandNumbers('1800')).toContain('eighteen oh zero')
      expect(expandNumbers('1905')).toContain('nineteen oh five')
      expect(expandNumbers('1999')).toContain('nineteen ninety nine')
      expect(expandNumbers('2099')).toContain('twenty ninety nine')
    })

    it('should expand times', function() {
      expect(expandNumbers('3:30')).toContain('three thirty')
      expect(expandNumbers('12:00')).toContain('twelve o\'clock')
      expect(expandNumbers('1:05')).toContain('one oh five')
      expect(expandNumbers('11:45')).toContain('eleven forty five')
      expect(expandNumbers('1:30 AM')).toContain('one thirty a m')
      expect(expandNumbers('11:45 PM')).toContain('eleven forty five p m')
      expect(expandNumbers('12:30 am')).toContain('twelve thirty a m')
      expect(expandNumbers('6:15 pm')).toContain('six fifteen p m')
    })

    it('should expand ordinals', function() {
      expect(expandNumbers('1st')).toBe('first')
      expect(expandNumbers('2nd')).toBe('second')
      expect(expandNumbers('3rd')).toBe('third')
      expect(expandNumbers('4th')).toBe('fourth')
      expect(expandNumbers('5th')).toBe('fifth')
      expect(expandNumbers('8th')).toBe('eighth')
      expect(expandNumbers('9th')).toBe('ninth')
      expect(expandNumbers('21st')).toBe('twenty first')
      expect(expandNumbers('22nd')).toBe('twenty second')
      expect(expandNumbers('23rd')).toBe('twenty third')
      expect(expandNumbers('11th')).toBe('eleventh')
      expect(expandNumbers('12th')).toBe('twelveth')
      expect(expandNumbers('13th')).toBe('thirteenth')
    })

    it('should expand phone numbers', function() {
      expect(expandNumbers('555-1234')).toContain('five hundred fifty five')
      expect(expandNumbers('(555) 123-4567')).toContain('five hundred fifty five')
    })

    it('should expand decimals', function() {
      expect(expandNumbers('3.14')).toBe('three point one four')
      expect(expandNumbers('0.5')).toBe('zero point five')
      expect(expandNumbers('123.456')).toBe('one hundred twenty three point four five six')
      expect(expandNumbers('0.0')).toBe('zero point zero')
    })

    it('should expand percentages', function() {
      expect(expandNumbers('50%')).toBe('fifty percent')
      const result = expandNumbers('3.5%')
      expect(result).toContain('three point five')
      expect(expandNumbers('100%')).toBe('one hundred percent')
      expect(expandNumbers('0.1%')).toContain('zero point one')
    })

    it('should expand regular numbers', function() {
      expect(expandNumbers('123')).toBe('one hundred twenty three')
      expect(expandNumbers('1000')).toBe('one thousand')
      expect(expandNumbers('1000000')).toBe('one million')
      expect(expandNumbers('1000000000')).toBe('one billion')
      expect(expandNumbers('1000000000000')).toBe('one trillion')
      expect(expandNumbers('0')).toBe('zero')
    })

    it('should handle negative numbers', function() {
      const result1 = expandNumbers('-5')
      expect(result1).toContain('five')
      const result2 = expandNumbers('-100')
      expect(result2).toContain('one hundred')
    })

    it('should handle mixed content', function() {
      expect(expandNumbers('I have $5 and 3 apples')).toContain('five dollars')
      expect(expandNumbers('I have $5 and 3 apples')).toContain('three')
      expect(expandNumbers('Call me at 555-1234')).toContain('five hundred fifty five')
    })
  })

  describe('expandAbbreviations', function() {
    it('should expand titles', function() {
      expect(expandAbbreviations('Mr. Smith')).toBe('mister Smith')
      expect(expandAbbreviations('Mrs. Johnson')).toBe('missus Johnson')
      expect(expandAbbreviations('Ms. Brown')).toBe('miss Brown')
      expect(expandAbbreviations('Dr. House')).toBe('doctor House')
      expect(expandAbbreviations('Prof. Wilson')).toBe('professor Wilson')
      expect(expandAbbreviations('Sr. Jones')).toBe('senior Jones')
      expect(expandAbbreviations('Jr. Davis')).toBe('junior Davis')
    })

    it('should expand time abbreviations', function() {
      expect(expandAbbreviations('10 AM')).toBe('10 a m')
      expect(expandAbbreviations('11 PM')).toBe('11 p m')
      expect(expandAbbreviations('12 am')).toBe('12 a m')
      expect(expandAbbreviations('1 pm')).toBe('1 p m')
    })

    it('should expand common abbreviations', function() {
      expect(expandAbbreviations('etc.')).toBe('etcetera')
      expect(expandAbbreviations('vs.')).toBe('versus')
      expect(expandAbbreviations('Inc.')).toBe('incorporated')
      expect(expandAbbreviations('Corp.')).toBe('corporation')
      expect(expandAbbreviations('Ltd.')).toBe('limited')
      expect(expandAbbreviations('Co.')).toBe('company')
    })

    it('should expand address abbreviations', function() {
      expect(expandAbbreviations('Main St.')).toBe('Main street')
      expect(expandAbbreviations('Oak Ave.')).toBe('Oak avenue')
      expect(expandAbbreviations('Sunset Blvd.')).toBe('Sunset boulevard')
      expect(expandAbbreviations('First Rd.')).toBe('First road')
      expect(expandAbbreviations('Apt. 5')).toBe('apartment 5')
    })

    it('should expand organization abbreviations', function() {
      expect(expandAbbreviations('Dept.')).toBe('department')
      expect(expandAbbreviations('Gov.')).toBe('government')
      expect(expandAbbreviations('Org.')).toBe('organization')
      expect(expandAbbreviations('Edu.')).toBe('education')
      expect(expandAbbreviations('Com.')).toBe('commercial')
      expect(expandAbbreviations('Net.')).toBe('network')
      expect(expandAbbreviations('Info.')).toBe('information')
    })

    it('should handle abbreviations without periods', function() {
      expect(expandAbbreviations('Mr Smith')).toBe('mister Smith')
      expect(expandAbbreviations('Dr House')).toBe('doctor House')
      expect(expandAbbreviations('etc')).toBe('etcetera')
      expect(expandAbbreviations('vs')).toBe('versus')
    })

    it('should preserve case for non-abbreviated words', function() {
      expect(expandAbbreviations('Hello Mr. Smith')).toBe('Hello mister Smith')
      expect(expandAbbreviations('Meeting at 3 PM')).toBe('Meeting at 3 p m')
    })

    it('should handle multiple abbreviations', function() {
      expect(expandAbbreviations('Dr. Smith vs. Prof. Johnson')).toBe('doctor Smith versus professor Johnson')
      expect(expandAbbreviations('Inc. and Corp.')).toBe('incorporated and corporation')
    })
  })

  describe('expandText', function() {
    it('should expand both abbreviations and numbers', function() {
      expect(expandText('Dr. Smith has $50')).toContain('doctor')
      expect(expandText('Dr. Smith has $50')).toContain('fifty dollars')
      expect(expandText('Meet at 3:30 PM')).toContain('three thirty')
      expect(expandText('Meet at 3:30 PM')).toContain('p m')
    })

    it('should clean up extra spaces', function() {
      expect(expandText('Dr.    Smith   has   $50')).not.toContain('  ')
      expect(expandText('  Hello   world  ')).toBe('Hello world')
    })

    it('should handle complex mixed content', function() {
      const result = expandText('Dr. Smith called at 3:30 PM about the $1,500 payment due on the 15th.')
      expect(result).toContain('doctor')
      expect(result).toContain('three thirty')
      expect(result).toContain('p m')
      expect(result).toContain('one thousand five hundred dollars')
      expect(result).toContain('fif')
    })

    it('should handle empty and edge cases', function() {
      expect(expandText('')).toBe('')
      expect(expandText('   ')).toBe('')
      expect(expandText('No abbreviations or numbers here')).toBe('No abbreviations or numbers here')
    })

    it('should preserve punctuation', function() {
      expect(expandText('Hello, Mr. Smith!')).toContain('Hello, mister Smith!')
      expect(expandText('Is it 5th?')).toContain('Is it fifth?')
    })
  })
}) 