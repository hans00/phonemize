import EnglishG2P from "../src/en/g2p";

describe("English -tariat stress", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each(["secretariat", "proletariat", "commentariat"])(
    "places primary stress on the -tar- syllable of %s",
    word => expect(rules.predict(word, "en-US")).toMatch(/ˈtɛɹiət/),
  );

  it("keeps the separate -ariat reading and inflects the suffix", () => {
    expect(rules.predict("lariat", "en-US")).toBe("ˈɫɛɹiət");
    expect(rules.predict("secretariats", "en-US")).toMatch(/ˈtɛɹiəts$/);
  });
});
