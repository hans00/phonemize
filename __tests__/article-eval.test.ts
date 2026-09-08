import { contextEntries, parseVerdicts, scoreCase } from '../scripts/ai-eval-scoring';
import { expandText } from '../src/en/expand';
import { createPhonemizer } from '../src/core';
import EnglishG2P from '../src/en/g2p';

describe('article evaluation integrity', () => {
  const entries = [{ word: 'am', ipa: 'æm' }, { word: 'am', ipa: 'æm' }];
  it('aligns expanded words with their IPA and retains empty predictions', () => {
    expect(contextEntries([
      { word: 'twenty', phoneme: 'ˈtwɛnti' }, { word: 'one', phoneme: 'wʌn' },
      { word: ',', phoneme: ',' }, { word: 'cats', phoneme: '' },
    ])).toEqual([
      { word: 'twenty', ipa: 'ˈtwɛnti' }, { word: 'one', ipa: 'wʌn' }, { word: 'cats', ipa: '' },
    ]);
  });
  it('keeps repeated occurrences and missing verdicts in the denominator', () => {
    const rows = parseVerdicts('BEGIN_VERDICTS\n1 | OK | -\nEND_VERDICTS', entries);
    expect(scoreCase('article', 'en', rows)).toMatchObject({ total: 2, ok: 1, score: 50 });
    expect(rows[1].verdict).toBe('?');
  });
  it.each([
    '1 | OK | -',
    'BEGIN_VERDICTS\n1 | OK | -\n1 | OK | -\nEND_VERDICTS',
    'BEGIN_VERDICTS\n3 | OK | -\nEND_VERDICTS',
    '',
  ])('rejects incomplete or malformed response %s', content => {
    expect(parseVerdicts(content, entries).every(r => r.verdict === '?')).toBe(true);
  });
  it('scores complete responses without discarding minor errors', () => {
    const rows = parseVerdicts('BEGIN_VERDICTS\n1 | OK | -\n2 | MINOR | vowel\nEND_VERDICTS', entries);
    expect(scoreCase('article', 'en', rows).score).toBe(75);
  });
});

describe('ordinary words in English articles', () => {
  it.each([
    ['passed', 'pæst'], ['passing', 'pæsɪŋ'],
    ['shows', 'ʃoʊz'], ['yellows', 'jɛɫoʊz'], ['photos', 'foʊtoʊz'],
    ['reaching', 'ɹitʃɪŋ'], ['talking', 'tɔkɪŋ'], ['called', 'kɔɫd'],
  ])('preserves stem pronunciation in %s', (word, ipa) => {
    const g = new EnglishG2P();
    expect(g.predict(word)?.replace(/[ˈˌ]/g, '')).toBe(ipa);
  });
  it.each(['I am here.', 'Here I am.', 'The net is wet.', 'Send the info.', 'NET income'])('preserves %s', text => {
    expect(expandText(text)).toBe(text);
  });
  it.each(['9am', '9 AM', '9 a.m.', '9:30 pm'])('still expands time marker %s', text => {
    expect(expandText(text)).toMatch(/nine(?: thirty)? ?[ap] m$/);
  });
  it('pronounces am as a verb through the public sentence pipeline', () => {
    const p = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = p.phonemize('I am here.', { language: 'en-US', returnArray: true });
    // Sentence output uses the existing weak form of this auxiliary.
    expect(tokens.find(t => t.word === 'am')?.phoneme).toBe('əm');
  });
});
