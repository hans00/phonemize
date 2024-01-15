# phonemize

English phonemizer using CMUdict.

## Installation

```bash
yard add phonemize
```

## Usage

```js
import { phonemize } from 'phonemize';

const text = 'Hello world!';
console.log(phonemize(text));
// hʌlˈoʊ wˈɝld!
console.log(phonemize(text, false));
// [ [ 'hʌlˈoʊ', 'hɛlˈoʊ' ], [ 'wˈɝld' ], [ '!' ] ]
```
