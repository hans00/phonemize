import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge US: resign /rɪˈzaɪn/ and resort /rɪˈzɔːrt/.
describe("lexical resign and resort", () => {
  const engine = new EnglishG2P();

  test.each([
    ["resign", "ɹɪˈzaɪn"], ["resigns", "ɹɪˈzaɪnz"],
    ["resigned", "ɹɪˈzaɪnd"], ["resigning", "ɹɪˈzaɪnɪŋ"],
    ["resort", "ɹɪˈzɔɹt"], ["resorts", "ɹɪˈzɔɹts"],
    ["resorted", "ɹɪˈzɔɹtɪd"], ["resorting", "ɹɪˈzɔɹtɪŋ"],
  ])("reads %s with its lexical onset", (word, expected) => {
    expect(engine.predict(word)).toBe(expected);
  });

  test("keeps the lexical readings in sentence context", () => {
    const api = createPhonemizer({ processors: [engine] });
    for (const [sentence, word, expected] of [
      ["They resign from the company.", "resign", "ɹɪˈzaɪn"],
      ["She resigned yesterday.", "resigned", "ɹɪˈzaɪnd"],
      ["The resort was busy.", "resort", "ɹɪˈzɔɹt"],
      ["They resorted to the courts.", "resorted", "ɹɪˈzɔɹtɪd"],
    ]) {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(expected);
    }
  });

  test.each([false, true])("keeps explicit re- boundaries (rules=%s)", disableDict => {
    const e = new EnglishG2P({ disableDict });
    expect(e.predict("re-sign")).toContain("saɪn");
    expect(e.predict("re-sort")).toContain("sɔɹt");
  });
});
