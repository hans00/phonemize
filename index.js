const dict = require('./data/en.json')

const isSymbol = (str) => str.match(/^\W$/)

exports.phonemize = (sentence, returnStr = true) => {
	const words = sentence
		.toLowerCase()
		.replace(/(\.|!|\?)\B/, ' $1') // xxx.
		.replace(/s'\B/, 's') // xxxs'
		.split(' ')
	let phonemes = []
	words.forEach((word) => {
		if (!word) return
		if (dict[word]) {
			phonemes.push(dict[word])
		} else if (word.endsWith('\'s') && dict[word.slice(0, -2)]) {
			phonemes.push(dict[word.slice(0, -2)])
			phonemes.push([dict['\'s']])
		} else {
			phonemes.push([word])
		}
	})
	if (!returnStr) {
		return phonemes
	} else {
		let out = ''
		phonemes.forEach(([phone], i) => {
			const pre = i > 0 && !isSymbol(phone) ? ' ' : ''
			out += pre + phone
		})
		return out
	}
}
