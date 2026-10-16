import EnglishG2P from "../src/en/g2p";
describe("Greek asm voicing and neighboring roots", () => {
  test.each([['plasma', 'ˈpɫæzmə'], ['plasmas', 'ˈpɫæzməz'], ["plasma's", 'ˈpɫæzməz'], ['cytoplasmic', 'ˌsaɪtəˈpɫæzmɪk']])('%s retains voiced sm by rule', (word, ipa) => {
    expect(new EnglishG2P({disableDict: true}).predict(word)).toBe(ipa);
  });
  test('miasma voices sm without claiming its initial vowel is repaired', () => {
    expect(new EnglishG2P({disableDict: true}).predict('miasma')).toContain('æzm');
  });
  test.each([["cosmic", false, "ˈkɑzmɪk"], ["cosmos", false, "ˈkɑzmoʊs"], ["dismay", false, "dɪsˈmeɪ"], ["dismal", false, "ˈdɪzməɫ"], ["basement", false, "ˈbeɪsmənt"], ["small", false, "ˈsmɔɫ"], ["asthma", false, "ˈæzmə"], ["spasm", false, "ˈspæzəm"], ["spasms", false, "ˈspæsmz"], ["plasm", false, "ˈpɫæzəm"], ["cosmic", true, "ˈkɑsmɪk"], ["cosmos", true, "ˈkɔzmoʊz"], ["dismay", true, "ˈdɪsmeɪ"], ["dismal", true, "ˈdɪsməɫ"], ["basement", true, "ˈbeɪsmənt"], ["small", true, "ˈsmɔɫ"], ["asthma", true, "ˈæstmə"], ["spasm", true, "ˈspæzəm"], ["spasms", true, "ˈspæsmz"], ["plasm", true, "ˈpɫæzəm"]])('neighbor %s (rules=%s)', (word, disableDict, ipa) => {
    expect(new EnglishG2P({disableDict}).predict(word)).toBe(ipa);
  });
  test.each([false, true])('voices only the owned tail in a compound (rules=%s)', disableDict => {
    const engine = new EnglishG2P({disableDict});
    expect(engine.predict('smallplasma')).toMatch(/^sm.*zmə$/);
    expect(engine.predict('cosmosplasmic')).toMatch(/kɑsm.*zmɪk$/);
    expect(engine.predict('seismicplasma')).toMatch(/saɪsmɪk.*zmə$/);
  });

});
