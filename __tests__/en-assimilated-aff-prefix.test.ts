import EnglishG2P from "../src/en/g2p";

describe("weak assimilated ad- before fect, flict, and firm", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["affect", "əˈfɛkt"],
    ["affects", "əˈfɛkts"],
    ["afflict", "əˈfɫɪkt"],
    ["afflicts", "əˈfɫɪkts"],
    ["affirm", "əˈfɝm"],
    ["affirms", "əˈfɝmz"],
  ])("keeps the assimilated prefix weak in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["affix", "ˈæfɪks"],
    ["affable", "ˈæfəbəɫ"],
    ["affluent", "əˈfɫuənt"],
  ])("preserves the neighboring aff- class in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("preserves the noun and verb readings of affect", () => {
    const lexical = new EnglishG2P();
    expect(lexical.predict("affect", "en-US", "V")).toBe("əˈfɛkt");
    expect(lexical.predict("affect", "en-US", "N")).toBe("ˈæfɛkt");
  });
});
