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

describe('G2P rule fixes', () => {
  const g2p = new EnG2P({ disableDict: true });

  it('ym before consonant → /ɪm/ (gym)', () => {
    expect(g2p.predict('gym', 'en')).toMatch(/ɪm/);
  });

  it('yn before consonant → /ɪn/ (syntax)', () => {
    expect(g2p.predict('syntax', 'en')).toMatch(/ɪn/);
  });

  it('sch before consonant → /ʃ/ (schmaltz)', () => {
    expect(g2p.predict('schmaltz', 'en')).toMatch(/^ʃ/);
  });

  it('sch before vowel → /sk/ (schema)', () => {
    expect(g2p.predict('schema', 'en')).toMatch(/sk/);
  });

  it('^al$ only fires for doubled-l syllables (calculator has no /ɔl/)', () => {
    expect(g2p.predict('calculator', 'en')).not.toMatch(/ɔl/);
  });

  it('^al$ fires for genuine -all rime (ball)', () => {
    expect(g2p.predict('ball', 'en')).toMatch(/ɔl/);
  });

  it('word-final y → /i/ when syllable has prior vowel (city)', () => {
    expect(g2p.predict('city', 'en')).toMatch(/i$/);
    expect(g2p.predict('city', 'en')).not.toMatch(/aɪ/);
  });

  it('word-final y → /i/ for happy/novelty', () => {
    expect(g2p.predict('happy', 'en')).toMatch(/i$/);
    expect(g2p.predict('novelty', 'en')).toMatch(/i$/);
  });

  it('word-final y → /aɪ/ for monosyllables (by)', () => {
    expect(g2p.predict('by', 'en')).toMatch(/aɪ/);
  });

  it('chr → /kɹ/ (chrome)', () => {
    expect(g2p.predict('chrome', 'en')).toMatch(/kɹ/);
  });

  it('chl → /kl/ (chlorinated)', () => {
    expect(g2p.predict('chlorinated', 'en')).toMatch(/kl/);
  });

  it('oor → /ɔɹ/ (door, floor)', () => {
    expect(g2p.predict('door', 'en')).toMatch(/ɔɹ/);
    expect(g2p.predict('floor', 'en')).toMatch(/ɔɹ/);
  });
});
