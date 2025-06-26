import { expect } from 'chai';
import { g2pModel } from '../src/g2p';

const words = [
  'phonemize',
  'phonemizer',
  'knology',
  'aitch',
  'anachronism',
  'bramble',
  'syzygy',
  'dishes',
  'tested',
  'stopped',
  'running',
  'globally',
  'quickly',
  'readable',
]

describe('G2P Rule based no error', () => {
  for (const word of words) {
    it(word, () => {
      const result = g2pModel.predict(word, undefined, undefined, true)
      expect(result).to.be.a('string')
      console.log(result)
    });
  }
});
