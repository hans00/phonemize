import EnglishG2P from "../src/en/g2p";

describe("weak assimilated ex- in effect", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("gives the effect root second-syllable stress like its inflections", () => {
    expect(rules.predict("effect", "en-US")).toBe("ɪˈfɛkt");
    expect(rules.predict("effects", "en-US")).toBe("ɪˈfɛkts");
    expect(rules.predict("effected", "en-US")).toBe("ɪˈfɛktɪd");
    expect(rules.predict("effecting", "en-US")).toBe("ɪˈfɛktɪŋ");
    expect(rules.predict("effective", "en-US")).toBe("ɪˈfɛktɪv");
  });

  it("keeps neighboring ef- words and the lexical noun/verb reading intact", () => {
    expect(rules.predict("effort", "en-US")).toBe("ˈɛfɝt");
    expect(rules.predict("efface", "en-US")).toBe("ˈɛfəs");
    const lexical = new EnglishG2P();
    expect(lexical.predict("effect", "en-US", "N")).toBe("ɪˈfɛkt");
    expect(lexical.predict("effect", "en-US", "V")).toBe("ɪˈfɛkt");
  });
});
