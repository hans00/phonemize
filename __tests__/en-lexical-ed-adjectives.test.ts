import EnglishG2P from "../src/en/g2p";

describe("lexical adjectives ending in -ed", () => {
  const shipped = new EnglishG2P();
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["naked", "ˈneɪkɪd"],
    ["wicked", "ˈwɪkɪd"],
    ["crooked", "ˈkɹʊkɪd"],
  ])("uses the standard lexical reading for %s", (word, expected) => {
    expect(shipped.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["marked", "ˈmɑɹkt"],
    ["baked", "ˈbeɪkt"],
    ["asked", "ˈæskt"],
  ])("preserves the regular past-tense reading for %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
