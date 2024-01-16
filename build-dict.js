const fs = require('fs')

const ipaMap = {
	AA: 'ɑ',
	AE: 'æ',
	AH: 'ʌ',
	AO: 'ɔ',
	AW: 'aʊ',
	AY: 'aɪ',
	B: 'b',
	CH: 'tʃ',
	D: 'd',
	DH: 'ð',
	EH: 'ɛ',
	ER: 'ɝ',
	EY: 'eɪ',
	F: 'f',
	G: 'ɡ',
	HH: 'h',
	IH: 'ɪ',
	IY: 'i',
	JH: 'dʒ',
	K: 'k',
	L: 'l',
	M: 'm',
	N: 'n',
	NG: 'ŋ',
	OW: 'oʊ',
	OY: 'ɔɪ',
	P: 'p',
	R: 'ɹ',
	S: 's',
	SH: 'ʃ',
	T: 't',
	TH: 'θ',
	UH: 'ʊ',
	UW: 'u',
	V: 'v',
	W: 'w',
	Y: 'j',
	Z: 'z',
	ZH: 'ʒ',
}

const toIPA = (phones) => {
	let ipa = ''
	for (const phone of phones) {
		const stress = phone.match(/\d$/)
		const phoneStr = phone.replace(/\d$/, '')
		let stressStr = ''
		if (stress) {
			if (stress[0] === '0') {
				stressStr = ''
			} else if (stress[0] === '1') {
				stressStr = 'ˈ'
			} else if (stress[0] === '2') {
				stressStr = 'ˌ'
			} else {
				console.error('Unknown stress:', stress[0])
			}
		}
		ipa += stressStr + ipaMap[phoneStr]
	}
	return ipa
}

const build_en = async () => {
	const data = await fetch('https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict')
		.then((res) => res.text())
	const lines = data.split('\n')
	const maps = {}
	Object.setPrototypeOf(maps, null)
	for (const line of lines) {
		if (!line) continue
		let [word, ...phones] = line.split(' ')
		if (/\(\d\)$/.test(word)) {
			word = word.slice(0, -3)
		}
		if (maps[word]) {
			maps[word].push(toIPA(phones))
		} else {
			maps[word] = [toIPA(phones)]
		}
	}
	fs.writeFileSync('data/en.json', JSON.stringify(maps))
}

build_en()
