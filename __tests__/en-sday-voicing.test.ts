import EnglishG2P from "../src/en/g2p";
import {createPhonemizer} from "../src/core";
describe("voiced sday tail and separate roots", () => {
  test.each([false, true])('sday voicing and voiceless neighbors (rules=%s)', disableDict => {
    const engine = new EnglishG2P({disableDict});
    for (const word of ['thursday', "thursday's", 'thursdays', 'doomsdays', 'newsdays', 'newsday', "newsday's", 'doomsday'])
      expect(engine.predict(word)).toMatch(/z[ˌˈ]?deɪz?$/);
    expect(engine.predict('sportsday')).toContain('tsdeɪ');
    expect(engine.predict('mopsday')).toContain('psdeɪ');
    expect(engine.predict('busday')).toMatch(/s[ˌˈ]?deɪ$/);
    expect(engine.predict('classday')).toMatch(/s[ˌˈ]?deɪ$/);
    expect(engine.predict('smallthursday')).toMatch(/^ˈ?sm.*z[ˌˈ]?deɪ$/);
  });
  test.each([false, true])('complete prose preserves noun and verb controls (rules=%s)', disableDict => {
    const phonemizer = createPhonemizer({processors:[new EnglishG2P({disableDict})]});
    const sentences=['They record the news on Thursday.', 'The Thursday record was useful.', 'They present a doomsday scenario.', 'The present schedule starts on Tuesday.'];
    for(const sentence of sentences){
      const rows=phonemizer.phonemize(sentence,{language:'en-US',returnArray:true});
      expect(rows.map(row => row.word).join(' ')).toBe(sentence.replace(/\.$/,' .'));
      const target=rows.find(row => /sday$/i.test(row.word));
      expect(target?.phoneme).toMatch(/z[ˌˈ]?deɪ$/);
    }
  });
});
