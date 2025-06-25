import { expect } from 'chai';
import { phonemize } from '../src';

const testCases = [
  { word: 'phonemize', expected: 'ˈfoʊnˈmaɪz' },
  { word: 'phonemizer', expected: 'ˈfoʊnˈmaɪzɝ' },
  { word: 'knology', expected: 'ˈnoʊloʊɡj' },
  { word: 'syzygy', expected: 'ˈsjzjɡj' },
];

describe('Rule-based G2P for OOV words', () => {
  for (const { word, expected } of testCases) {
    it(`should correctly phonemize ${word}`, () => {
      expect(phonemize(word)).to.equal(expected);
    });
  }
})
