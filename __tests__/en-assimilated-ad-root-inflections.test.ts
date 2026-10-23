import EnglishG2P from "../src/en/g2p";

describe("inflections of assimilated ad- before a vouched verb root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["accredited", "əˈkɹɛdɪtɪd"],
    ["accrediting", "əˈkɹɛdɪtɪŋ"],
  ])("retains credit's short vowel in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("keeps suffix-specific reduction and neighboring doubled-consonant roots", () => {
    expect(rules.predict("accreditation", "en-US")).toBe("əˌkɹɛdəˈteɪʃən");
    expect(rules.predict("acclimated", "en-US")).toBe("ˈækɫəˌmeɪtɪd");
    expect(rules.predict("acclimating", "en-US")).toBe("ˈækɫəˌmeɪtɪŋ");
    expect(rules.predict("acceded", "en-US")).toBe("ækˈsidɪd");
    expect(rules.predict("accessed", "en-US")).toBe("ˈæksɛst");
    expect(rules.predict("acclaimed", "en-US")).toBe("əˈkɫeɪmd");
  });
});
