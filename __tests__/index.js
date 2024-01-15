const { phonemize } = require('../')

describe('Index', function() {
	it('Work Fine', function() {
		expect(phonemize('Hello world!')).to.be.equal('hʌlˈoʊ wˈɝld!')
		expect(phonemize('this is an apple.')).to.be.equal('ðˈɪs ˈɪz ˈæn ˈæpʌl.')
		expect(phonemize('John\'s package', false)).to.be.deep.equal([
			[ 'dʒˈɑnz' ],
			[ 'pˈækʌdʒ', 'pˈækɪdʒ' ],
		])
	})
})
