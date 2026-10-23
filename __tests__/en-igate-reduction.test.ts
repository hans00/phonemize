import EnglishG2P from "../src/en/g2p";

const rules = new EnglishG2P({ disableDict: true });
const inSentence = (word: string, sentence: string, pos: string) => {
  const words: string[] = sentence.toLowerCase().match(/[a-z']+/g) ?? [];
  return rules.predict(word, "en-US", pos, { words, index: words.indexOf(word) });
};

describe("weak i before final -gate", () => {
  it.each([
    ["castigate", "ˈkæstəˌɡeɪt"],
    ["fumigate", "ˈfjuməˌɡeɪt"],
    ["instigate", "ˈɪnstəˌɡeɪt"],
    ["irrigate", "ˈɪɹəˌɡeɪt"],
    ["litigate", "ˈɫɪtəˌɡeɪt"],
    ["mitigate", "ˈmɪtəˌɡeɪt"],
    ["navigate", "ˈnævəˌɡeɪt"],
    ["obligate", "ˈɑbɫəˌɡeɪt"],
  ])("reduces the weak <i> in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps stressed and complex-onset controls", () => {
    expect(rules.predict("frigate", "en-US")).toBe("ˈfɹaɪɡeɪt");
    expect(rules.predict("digate", "en-US")).toBe("ˈdaɪɡeɪt");
    expect(rules.predict("profligate", "en-US")).toBe("ˈpɹɑfɫɪˌɡeɪt");
  });

  it.each([
    ["castigates", "ˈkæstəˌɡeɪts"],
    ["castigated", "ˈkæstəˌɡeɪtɪd"],
    ["castigating", "ˈkæstəˌɡeɪtɪŋ"],
    ["navigates", "ˈnævəˌɡeɪts"],
    ["navigated", "ˈnævəˌɡeɪtɪd"],
    ["navigating", "ˈnævəˌɡeɪtɪŋ"],
  ])("preserves regular verb morphology in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("preserves sentence-context verbs and noun/adjective controls", () => {
    expect(inSentence("navigate", "They navigate the channel", "V")).toBe("ˈnævəˌɡeɪt");
    expect(inSentence("frigate", "The frigate crossed the bay", "N")).toBe("ˈfɹaɪɡeɪt");
    expect(inSentence("profligate", "The profligate policy wasted money", "A")).toBe("ˈpɹɑfɫɪˌɡeɪt");
  });

});
