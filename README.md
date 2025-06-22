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
- 🌍 **Multiple formats** - IPA and ARPABET output
- 🌐 **Multilingual support** - Chinese, Japanese, Korean and more via anyAscii
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

// Complex compound words
console.log(phonemize('supercalifragilisticexpialidocious'))
// Output: ˈsupɝˈkæɫɪfˈɹæɡɪlɪsˈtaɪskspɪæˈɫidoʊˌsiˌaɪˈoʊʌs

// Multilingual support (via anyAscii)
console.log(phonemize('中文', { anyAscii: true }))
// Output: ʒoʊŋʊən

// ARPABET format
console.log(toARPABET('Hello world!'))
// Output: HH AX EL1 OW W1 ER EL D!
```

## Smart Word Processing

### Compound Word Decomposition
Automatically detects and decomposes compound words:

```javascript
phonemize('supercar')    // → ˈsupɝˈkɑɹ (super + car)
phonemize('playground')  // → ˈpɫeɪˌɡɹaʊn (play + ground)  
phonemize('superman')    // → ˈsupɝˌmæn (super + man)
```

### Multi-Compound Words
Handles extremely long compound words intelligently:

```javascript
phonemize('supercalifragilisticexpialidocious')
phonemize('antidisestablishmentarianism')
phonemize('pneumonoultramicroscopicsilicovolcanoconiosss')
```


## Multilingual Support

Supports multiple languages through anyAscii transliteration:

```javascript
// Chinese
phonemize('你好世界', { anyAscii: true })  // → nihaʊʃidʒje
phonemize('北京', { anyAscii: true })      // → ˌbeɪˈʒɪŋ

// Japanese  
phonemize('こんにちは', { anyAscii: true }) // → koʊnitʃiwʌ
phonemize('東京', { anyAscii: true })      // → doʊŋdʒɪŋ

// Korean
phonemize('안녕하세요', { anyAscii: true }) // → ʌnnjɛoʊnɡhʌsɛjoʊ
phonemize('서울', { anyAscii: true })      // → ˈsoʊɫ

// And many more languages...
```

Note: anyascii only ensures an approximation and is likely not the correct pronunciation

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

### Custom Pronunciations

```javascript
import { addPronunciation } from 'phonemize'

// Add custom word pronunciation
addPronunciation('myword', 'M1 AY W ER D')
console.log(phonemize('myword'))  // "ˈmaɪwərd"
```

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
