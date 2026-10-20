import EnglishG2P from "../src/en/g2p";

describe("vowelless letter sequences", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["pm", "ˌpiˈɛm"], ["dvd", "ˌdiˌviˈdi"], ["cd", "ˌsiˈdi"],
    ["pc", "ˌpiˈsi"], ["tv", "ˌtiˈvi"],
  ])("spells the letters in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([["hm", "ˈhm"], ["hmm", "ˈhm"], ["hmmm", "ˈhm"], ["sh", "ˈʃ"], ["shh", "ˈʃ"], ["mm", "ˈm"], ["nth", "ˈnθ"]])(
    "keeps pronounceable consonant forms like %s intact",
    (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
  );

  it("leaves a consonantal syllable with a written vowel intact", () => {
    expect(rules.predict("rhythm", "en-US")).toBe("ˈɹɪðəm");
  });

  it("uses the custom dictionary reading for the ordinal in shipped mode", () => {
    expect(new EnglishG2P().predict("nth", "en-US")).toBe("ˈɛnθ");
  });
});
