import EnglishG2P from "../src/en/g2p";

describe("anti- before an independently verified v-root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps the bound prefix /i/ and assigns stress to the known root", () => {
    expect(rules.predict("antivirus", "en-US")).toBe("ˌæntiˈvaɪɹəs");
    expect(rules.trace("antivirus", "en-US").path).toBe("compound");
    expect(rules.predict("antivirus", "en-US", "N")).toBe("ˌæntiˈvaɪɹəs");
  });

  it.each([
    ["anti", "ˈænti"],
    ["anticipated", "ænˈtɪsəˌpeɪtɪd"],
    ["antidote", "ˈæntɪˌdoʊt"],
    ["antimissile", "ˌænˌtaɪˈmɪsəɫ"],
  ])("preserves the unsplit control %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
