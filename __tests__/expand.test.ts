import { expect } from 'chai'
import { expandNumbers, expandAbbreviations, expandText } from '../src/expand'

describe('Expand', function() {
  describe('expandNumbers', function() {
    it('should expand currency', function() {
      expect(expandNumbers('$5')).to.include('five dollars')
      expect(expandNumbers('$1')).to.include('one dollar')
      expect(expandNumbers('$1.50')).to.include('one dollar and fifty cents')
      expect(expandNumbers('$0.01')).to.include('one cent')
      expect(expandNumbers('$0.05')).to.include('five cents')
      expect(expandNumbers('$100')).to.include('one hundred dollars')
      expect(expandNumbers('$1,000')).to.include('one thousand dollars')
      expect(expandNumbers('$1,234.56')).to.include('one thousand two hundred thirty four dollars and fifty six cents')
      expect(expandNumbers('$0.00')).to.include('zero dollars')
    })

    it('should expand years', function() {
      expect(expandNumbers('1985')).to.include('nineteen eighty five')
      expect(expandNumbers('2005')).to.include('twenty oh five')
      expect(expandNumbers('2000')).to.include('twenty hundred')
      expect(expandNumbers('2015')).to.include('twenty fifteen')
      expect(expandNumbers('1800')).to.include('eighteen oh zero')
      expect(expandNumbers('1905')).to.include('nineteen oh five')
      expect(expandNumbers('1999')).to.include('nineteen ninety nine')
      expect(expandNumbers('2099')).to.include('twenty ninety nine')
    })

    it('should expand times', function() {
      expect(expandNumbers('3:30')).to.include('three thirty')
      expect(expandNumbers('12:00')).to.include('twelve o\'clock')
      expect(expandNumbers('1:05')).to.include('one oh five')
      expect(expandNumbers('11:45')).to.include('eleven forty five')
      expect(expandNumbers('1:30 AM')).to.include('one thirty a m')
      expect(expandNumbers('11:45 PM')).to.include('eleven forty five p m')
      expect(expandNumbers('12:30 am')).to.include('twelve thirty a m')
      expect(expandNumbers('6:15 pm')).to.include('six fifteen p m')
    })

    it('should expand ordinals', function() {
      expect(expandNumbers('1st')).to.be.equal('first')
      expect(expandNumbers('2nd')).to.be.equal('second')
      expect(expandNumbers('3rd')).to.be.equal('third')
      expect(expandNumbers('4th')).to.be.equal('fourth')
      expect(expandNumbers('5th')).to.be.equal('fifth')
      expect(expandNumbers('8th')).to.be.equal('eighth')
      expect(expandNumbers('9th')).to.be.equal('ninth')
      expect(expandNumbers('21st')).to.be.equal('twenty first')
      expect(expandNumbers('22nd')).to.be.equal('twenty second')
      expect(expandNumbers('23rd')).to.be.equal('twenty third')
      expect(expandNumbers('11th')).to.be.equal('eleventh')
      expect(expandNumbers('12th')).to.be.equal('twelveth')
      expect(expandNumbers('13th')).to.be.equal('thirteenth')
    })

    it('should expand phone numbers', function() {
      expect(expandNumbers('555-1234')).to.include('five hundred fifty five')
      expect(expandNumbers('(555) 123-4567')).to.include('five hundred fifty five')
    })

    it('should expand decimals', function() {
      expect(expandNumbers('3.14')).to.be.equal('three point one four')
      expect(expandNumbers('0.5')).to.be.equal('zero point five')
      expect(expandNumbers('123.456')).to.be.equal('one hundred twenty three point four five six')
      expect(expandNumbers('0.0')).to.be.equal('zero point zero')
    })

    it('should expand percentages', function() {
      expect(expandNumbers('50%')).to.be.equal('fifty percent')
      const result = expandNumbers('3.5%')
      expect(result).to.include('three point five')
      expect(expandNumbers('100%')).to.be.equal('one hundred percent')
      expect(expandNumbers('0.1%')).to.include('zero point one')
    })

    it('should expand regular numbers', function() {
      expect(expandNumbers('123')).to.be.equal('one hundred twenty three')
      expect(expandNumbers('1000')).to.be.equal('one thousand')
      expect(expandNumbers('1000000')).to.be.equal('one million')
      expect(expandNumbers('1000000000')).to.be.equal('one billion')
      expect(expandNumbers('1000000000000')).to.be.equal('one trillion')
      expect(expandNumbers('0')).to.be.equal('zero')
    })

    it('should handle negative numbers', function() {
      const result1 = expandNumbers('-5')
      expect(result1).to.include('five')
      const result2 = expandNumbers('-100')
      expect(result2).to.include('one hundred')
    })

    it('should handle mixed content', function() {
      expect(expandNumbers('I have $5 and 3 apples')).to.include('five dollars')
      expect(expandNumbers('I have $5 and 3 apples')).to.include('three')
      expect(expandNumbers('Call me at 555-1234')).to.include('five hundred fifty five')
    })
  })

  describe('expandAbbreviations', function() {
    it('should expand titles', function() {
      expect(expandAbbreviations('Mr. Smith')).to.be.equal('mister Smith')
      expect(expandAbbreviations('Mrs. Johnson')).to.be.equal('missus Johnson')
      expect(expandAbbreviations('Ms. Brown')).to.be.equal('miss Brown')
      expect(expandAbbreviations('Dr. House')).to.be.equal('doctor House')
      expect(expandAbbreviations('Prof. Wilson')).to.be.equal('professor Wilson')
      expect(expandAbbreviations('Sr. Jones')).to.be.equal('senior Jones')
      expect(expandAbbreviations('Jr. Davis')).to.be.equal('junior Davis')
    })

    it('should expand time abbreviations', function() {
      expect(expandAbbreviations('10 AM')).to.be.equal('10 a m')
      expect(expandAbbreviations('11 PM')).to.be.equal('11 p m')
      expect(expandAbbreviations('12 am')).to.be.equal('12 a m')
      expect(expandAbbreviations('1 pm')).to.be.equal('1 p m')
    })

    it('should expand common abbreviations', function() {
      expect(expandAbbreviations('etc.')).to.be.equal('etcetera')
      expect(expandAbbreviations('vs.')).to.be.equal('versus')
      expect(expandAbbreviations('Inc.')).to.be.equal('incorporated')
      expect(expandAbbreviations('Corp.')).to.be.equal('corporation')
      expect(expandAbbreviations('Ltd.')).to.be.equal('limited')
      expect(expandAbbreviations('Co.')).to.be.equal('company')
    })

    it('should expand address abbreviations', function() {
      expect(expandAbbreviations('Main St.')).to.be.equal('Main street')
      expect(expandAbbreviations('Oak Ave.')).to.be.equal('Oak avenue')
      expect(expandAbbreviations('Sunset Blvd.')).to.be.equal('Sunset boulevard')
      expect(expandAbbreviations('First Rd.')).to.be.equal('First road')
      expect(expandAbbreviations('Apt. 5')).to.be.equal('apartment 5')
    })

    it('should expand organization abbreviations', function() {
      expect(expandAbbreviations('Dept.')).to.be.equal('department')
      expect(expandAbbreviations('Gov.')).to.be.equal('government')
      expect(expandAbbreviations('Org.')).to.be.equal('organization')
      expect(expandAbbreviations('Edu.')).to.be.equal('education')
      expect(expandAbbreviations('Com.')).to.be.equal('commercial')
      expect(expandAbbreviations('Net.')).to.be.equal('network')
      expect(expandAbbreviations('Info.')).to.be.equal('information')
    })

    it('should handle abbreviations without periods', function() {
      expect(expandAbbreviations('Mr Smith')).to.be.equal('mister Smith')
      expect(expandAbbreviations('Dr House')).to.be.equal('doctor House')
      expect(expandAbbreviations('etc')).to.be.equal('etcetera')
      expect(expandAbbreviations('vs')).to.be.equal('versus')
    })

    it('should preserve case for non-abbreviated words', function() {
      expect(expandAbbreviations('Hello Mr. Smith')).to.be.equal('Hello mister Smith')
      expect(expandAbbreviations('Meeting at 3 PM')).to.be.equal('Meeting at 3 p m')
    })

    it('should handle multiple abbreviations', function() {
      expect(expandAbbreviations('Dr. Smith vs. Prof. Johnson')).to.be.equal('doctor Smith versus professor Johnson')
      expect(expandAbbreviations('Inc. and Corp.')).to.be.equal('incorporated and corporation')
    })
  })

  describe('expandText', function() {
    it('should expand both abbreviations and numbers', function() {
      expect(expandText('Dr. Smith has $50')).to.include('doctor')
      expect(expandText('Dr. Smith has $50')).to.include('fifty dollars')
      expect(expandText('Meet at 3:30 PM')).to.include('three thirty')
      expect(expandText('Meet at 3:30 PM')).to.include('p m')
    })

    it('should clean up extra spaces', function() {
      expect(expandText('Dr.    Smith   has   $50')).to.not.include('  ')
      expect(expandText('  Hello   world  ')).to.be.equal('Hello world')
    })

    it('should handle complex mixed content', function() {
      const result = expandText('Dr. Smith called at 3:30 PM about the $1,500 payment due on the 15th.')
      expect(result).to.include('doctor')
      expect(result).to.include('three thirty')
      expect(result).to.include('p m')
      expect(result).to.include('one thousand five hundred dollars')
      expect(result).to.include('fif')
    })

    it('should handle empty and edge cases', function() {
      expect(expandText('')).to.be.equal('')
      expect(expandText('   ')).to.be.equal('')
      expect(expandText('No abbreviations or numbers here')).to.be.equal('No abbreviations or numbers here')
    })

    it('should preserve punctuation', function() {
      expect(expandText('Hello, Mr. Smith!')).to.include('Hello, mister Smith!')
      expect(expandText('Is it 5th?')).to.include('Is it fifth?')
    })
  })
}) 