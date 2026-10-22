import EnglishG2P from "../src/en/g2p";

describe("weak patho- allomorph before -ology", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("uses the source-supported weak reading in pathology", () => {
    expect(rules.predict("pathology", "en-US")).toBe("pəˈθɑɫədʒi");
    expect(rules.predict("pathologies", "en-US")).toBe("pəˈθɑɫədʒiz");
  });

  it.each([
    ["path", "ˈpæθ"],
    ["pathos", "ˈpæθoʊz"],
    ["pathogenesis", "ˌpæθəˈdʒɛnəsɪs"],
    ["pathological", "ˌpæθəˈɫɑdʒɪkəɫ"],
  ])("preserves the full path- vowel in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
