# Phonemize

[![CI](https://github.com/hans00/phonemize/workflows/CI/badge.svg)](https://github.com/hans00/phonemize/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/hans00/phonemize/branch/main/graph/badge.svg)](https://codecov.io/gh/hans00/phonemize)
[![npm version](https://badge.fury.io/js/phonemize.svg)](https://badge.fury.io/js/phonemize)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/phonemize.svg)](https://nodejs.org/)

Fast phonemizer with rule-based G2P (Grapheme-to-Phoneme) prediction.
Pure JavaScript implementation with no native dependencies.

Inspired by [ttstokenizer](https://github.com/neuml/ttstokenizer)

## Features

- ⚡ **Lightning fast** - Pure rule-based processing, no ML overhead
- 🎯 **Intelligent compound word support** - Automatic decomposition of complex words
- 📚 **Comprehensive dictionary** - 125,000+ word pronunciations
- 🧠 **Smart rule-based G2P** - Advanced phonetic rules for unknown words
- 🌍 **Multiple formats** - IPA, ARPABET, and Zhuyin output
- 🌐 **Modular multilingual support** - G2P models are modularize load
- 💻 **Pure JavaScript** - No native dependencies, works everywhere
- 🔧 **Simple API** - Easy to integrate and use

## Installation

```bash
npm install phonemize
```

## Quick Start

```javascript
import { phonemize, toIPA, toARPABET } from 'phonemize'

// Default IPA output
console.log(phonemize('Hello world!'))
// Output: həˈɫoʊ ˈwɝɫd!

// ARPABET format
console.log(toARPABET('Hello world!'))
// Output: HH AX EL1 OW W1 ER EL D!
```

### Presets

For different language support needs, you can use preset modules:

```javascript
// Default: English only
import { phonemize } from 'phonemize'

// Chinese + English
import { phonemize } from 'phonemize/zh'

// All languages (English + Chinese + Japanese + Korean + Russian)
import { phonemize } from 'phonemize/all'

// Clean
```

## API Reference

### Basic Functions

#### `phonemize(text, options?)`
Convert text to phonemes.

```javascript
phonemize('Hello world!')                    // IPA string
phonemize('Hello world!', { returnArray: true })  // IPA array
```

**Options:**
- `returnArray` (boolean): Return array instead of string
- `format` ('ipa' | 'arpabet'): Output format
- `stripStress` (boolean): Remove stress markers
- `separator` (string): Phoneme separator (default: ' ')
- `anyAscii` (boolean): Enable multilingual support via anyAscii transliteration
- `language` (string): Preferred language tag (BCP 47, e.g. `'en-GB'`). Words written in unambiguously different scripts (CJK, Cyrillic, …) still go through their own processor.

**Language shorthand:** pass a string as the second argument to set `language` directly:

```javascript
phonemize('doctor', 'en-GB')   // "ˈdɑktə"  (RP)
phonemize('doctor', 'en-US')   // "ˈdɑktɝ"  (GA, default)
toIPA('car', 'en-GB')          // "ˈkɑː"
```

#### `toIPA(text, options?)`
Convert text to IPA phonemes.

```javascript
toIPA('Hello world!')  // "həˈɫoʊ ˈwɝɫd!"
```

#### `toARPABET(text, options?)`
Convert text to ARPABET phonemes.

```javascript
toARPABET('Hello world!')  // "HH AX L OW1 W ER1 L D!"
```

#### `toZhuyin(text, options?)`
Convert text to Zhuyin (Bopomofo / 注音) format.

This function is specifically designed for Chinese text. Non-Chinese text will be phonemized to IPA as a fallback.

**Note:** The output format is `Zhuyin + tone number` (e.g., `ㄓㄨㄥ1 ㄨㄣ2`), which is optimized for **Kokoro**.

```javascript
import { toZhuyin } from 'phonemize';

toZhuyin('中文'); // "ㄓㄨㄥ1 ㄨㄣ2"
toZhuyin('你好世界'); // "ㄋㄧ3 ㄏㄠ3 ㄕ4 ㄐㄧㄝ4"
toZhuyin('中文 and English'); // "ㄓㄨㄥ1 ㄨㄣ2 ænd ˈɪŋɡlɪʃ"
```

#### `useG2P(processor)`
Register a G2P processor for multilingual support.

```javascript
import { useG2P } from 'phonemize'
import ChineseG2P from 'phonemize/zh-g2p'
import JapaneseG2P from 'phonemize/ja-g2p'

// Register G2P processors
useG2P(new ChineseG2P())
useG2P(new JapaneseG2P())

// Now phonemize can handle Chinese and Japanese text
phonemize('你好')  // → ni˧˥ xɑʊ˨˩˦
phonemize('こんにちは', { anyAscii: true })  // → konnitɕiwa
```

### Custom Pronunciations

```javascript
import { addPronunciation } from 'phonemize'

// Add custom word pronunciation
addPronunciation('myword', 'ˈmaɪwərd') // Can be IPA or ARPABET
console.log(phonemize('myword'))  // "ˈmaɪwərd"
```

### English Dialects (en-US / en-GB)

The English G2P ships with American English (en-US) as default and a
rule-based RP (Received Pronunciation) post-processor for en-GB. No
separate dictionary is shipped — RP is derived from the AmE base via:

- non-rhotic conversion (drop coda /ɹ/, lengthen vowel: `car` → `ˈkɑː`)
- NURSE split (`bird` → `ˈbɜːd`, `doctor` → `ˈdɑktə`)
- SQUARE/NEAR/CURE diphthongs (`hair` → `ˈhɛə`, `near` → `ˈnɪə`)
- word-level overrides for `garage`, `sue`, `super`, `information`,
  `schedule`, …

```javascript
import { phonemize, createPhonemizer } from 'phonemize'
import EnglishG2P from 'phonemize/en-g2p'

phonemize('hello world', 'en-GB')  // "həˈɫoʊ ˈwɜːɫd"
phonemize('garage', 'en-GB')       // "ˈɡæɹɑːʒ"

// Or fix a Phonemizer instance to RP:
const rp = createPhonemizer({
  g2ps: [new EnglishG2P({ dialect: 'en-GB' })],
  language: 'en-GB',
})
rp.phonemize('information')        // "ˌɪnfəˈmeɪʃən"
```

### Multi-instance (`createPhonemizer`)

The default `phonemize()` and `useG2P()` work against a single shared
G2P registry — convenient, but if you need multiple isolated language
configurations in the same process, use `createPhonemizer()`:

```javascript
import { createPhonemizer } from 'phonemize'
import EnglishG2P from 'phonemize/en-g2p'
import ChineseG2P from 'phonemize/zh-g2p'

// English-only — won't see Chinese G2P even if registered globally
const enOnly = createPhonemizer({ g2ps: [new EnglishG2P()] })
enOnly.phonemize('hello 中文')   // "həˈɫoʊ 中文"  (zh untouched)

// Stack what you want
const full = createPhonemizer()
full.useG2P(new EnglishG2P()).useG2P(new ChineseG2P())

// addPronunciation only mutates this instance
enOnly.addPronunciation('myword', 'ˈmaɪwərd')
```

`Phonemizer` instances expose the same surface (`phonemize`, `toIPA`,
`toARPABET`, `toZhuyin`, `addPronunciation`, `createTokenizer`,
`useG2P`, `unregister`).

### Advanced Tokenization

```javascript
import { Tokenizer, createTokenizer } from 'phonemize'

// Create custom tokenizer
const tokenizer = createTokenizer({
  format: 'ipa',
  stripStress: true,
  separator: '-'
})

// Tokenize with detailed info
const tokens = tokenizer.tokenizeToTokens('Hello world!')
// [
//   { phoneme: "həɫoʊ", word: "Hello", position: 0 },
//   { phoneme: "wɝɫd", word: "world", position: 6 }
// ]
```

## Text Processing Features

### Number Expansion
Numbers are automatically converted to words:

```javascript
phonemize('I have 123 apples')
// "ˈaɪ ˈhæv ˈwən ˈhəndɝd ˈtwɛni ˈθɹi ˈæpəɫz"
```

### Abbreviation Expansion
Common abbreviations are expanded:

```javascript
phonemize('Dr. Smith and Mr. Johnson')
// "ˈdɑktɝ ˈsmɪθ ˈænd ˈmɪstɝ ˈdʒɑnsən"
```

### Currency and Dates
Special handling for currency and dates:

```javascript
phonemize('15 dollars in 2023')
// "ˈfɪfˈtin ˈdɑɫɝz ˈɪn ˈtwɛni ˈtwɛni ˈθɹi"
```

## Performance

- **Dictionary lookup**: O(1) - Instant for known words
- **Rule-based processing**: Extremely fast, no model loading
- **Compound decomposition**: Efficient balanced search algorithm
- **Memory efficient**: Compressed JSON dictionaries only
- **Zero startup time**: No model initialization required

Typical performance: **>10000 words/second** on modern hardware.

## Processing Pipeline

1. **Language Detection** - Detect language before anyAscii conversion (if enabled)
2. **anyAscii Transliteration** - Convert non-Latin scripts to ASCII (if enabled)
3. **Dictionary Lookup** - Check for exact word match
4. **Multilingual Processing** - Handle Chinese, Japanese, Korean, etc.
5. **Compound Detection** - Intelligent decomposition of compound words
6. **Multi-Compound Handling** - Special processing for very long compounds
7. **Rule-Based G2P** - Apply phonetic rules for unknown words

Note: The rule based G2P is LLM generated, may error generate. Best practice is use custom pronunciation for unknown words.

## Supported Phoneme Sets

### IPA (International Phonetic Alphabet)
Standard IPA symbols for English phonemes with stress marks.

### ARPABET  
CMU ARPABET phoneme set with stress numbers (0,1,2).

## Building from Source

```bash
# Install dependencies
yarn

# Compile TypeScript and dictionaries
yarn build

# Run tests
yarn test
```

## License

MIT
