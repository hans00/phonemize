import EnglishG2P from "../src/en/g2p";

describe("weak-vowel contrast in regular -icals plurals", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps the rule-supported vowel in chemicals after its stem leaves the table", () => {
    expect(rules.predict("chemicals", "en-US")).toBe("ˈkɛmɪkəɫz");
  });

  it.each([
    ["biologicals", "baɪəˈɫɑdʒɪkəɫz"],
    ["cyclicals", "ˈsaɪkɫɪkəɫz"],
    ["evangelicals", "ˌivænˈdʒɛɫɪkəɫz"],
    ["agrochemicals", "ˌæɡɹoʊˈkɛməkəɫz"],
  ])("preserves the existing reading of %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps dictionary-backed chemicals unchanged", () => {
    expect(new EnglishG2P().predict("chemicals", "en-US")).toBe("ˈkɛmɪkəɫz");
  });

  it("preserves the lexical stress pattern while correcting the weak vowel", () => {
    expect(new EnglishG2P().predict("hierarchicals", "en-US")).toBe("ˌhaɪˈɹɑɹkɪkəɫz");
  });
});
