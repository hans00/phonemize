import EnglishG2P from "../src/en/g2p";

describe("language's velar stop", () => {
  const dictionary = new EnglishG2P();
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps /ɡ/ in the source dictionary reading and rule reading", () => {
    expect(dictionary.predict("language", "en-US")).toBe("ˈɫæŋɡwɪdʒ");
    expect(rules.predict("language", "en-US")).toBe("ˈɫæŋɡwɪdʒ");
  });

  it.each([
    ["languid", "ˈɫæŋɡwəd"],
    ["languish", "ˈɫæŋɡwɪʃ"],
  ])("preserves the neighboring <ngu> reading in %s", (word, expected) => {
    expect(dictionary.predict(word, "en-US")).toBe(expected);
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
