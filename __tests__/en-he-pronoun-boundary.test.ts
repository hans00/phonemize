import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("the he pronoun rule stays within its syllable context", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const phonemizer = createPhonemizer({ processors: [rules] });

  it.each([
    ["he", "ˈhi"],
    ["herald", "ˈhɛɹəɫd"],
    ["heron", "ˈhɛɹən"],
    ["heresy", "ˈhɛɹəsi"],
    ["hero", "ˈhiɹoʊ"],
    ["heroic", "hiˈɹoʊɪk"],
  ])("renders %s without borrowing the pronoun vowel", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("keeps the her- vowel in noun and verb sentence contexts", () => {
    const tokens = phonemizer.phonemize("A herald said that they heralded the heron.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.filter(token => ["herald", "heralded", "heron"].includes(token.word))
      .map(token => token.phoneme)).toEqual(["ˈhɛɹəɫd", "ˈhɛɹəɫdɪd", "ˈhɛɹən"]);
  });
});
