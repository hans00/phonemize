import EnG2P from '../src/en-g2p';

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
  const g2p = new EnG2P({ disableDict: true });

  for (const word of words) {
    it(word, () => {
      const result = g2p.predict(word, 'en')
      expect(result).toBeDefined()
      console.log(`${word} -> ${result}`)
    });
  }
});
