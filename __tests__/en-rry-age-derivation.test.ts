import EnglishG2P from "../src/en/g2p";

describe("-rry to -rriage stem derivation", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("retains the y-final root vowel in marriage and carriage", () => {
    expect(rules.predict("marriage", "en-US")).toBe("ˈmɛɹɪdʒ");
    expect(rules.predict("carriage", "en-US")).toBe("ˈkæɹɪdʒ");
    expect(rules.predict("remarriage", "en-US")).toBe("ɹiˈmɛɹɪdʒ");
  });

  it("does not apply the rry stem rule to neighboring non-roots", () => {
    expect(rules.predict("marry", "en-US")).toBe("ˈmɛɹi");
    expect(rules.predict("carry", "en-US")).toBe("ˈkɛɹi");
    expect(rules.predict("triage", "en-US")).toBe("tɹiˈeɪdʒ");
    expect(rules.predict("miscarriage", "en-US")).toBe("mɪˈskæɹɪdʒ");
    expect(rules.predict("intermarriage", "en-US")).toBe("ɪnˈtɝmɝɪdʒ");
  });

  it("keeps noun plurals and y-stem inflections on their own routes", () => {
    expect(rules.predict("marriages", "en-US")).toBe("ˈmɛɹɪdʒəz");
    expect(rules.predict("carriages", "en-US")).toBe("ˈkæɹɪdʒəz");
    expect(rules.predict("remarriages", "en-US")).toBe("ɹiˈmɛɹɪdʒəz");
    expect(rules.predict("married", "en-US")).toBe("ˈmɛɹid");
    expect(rules.predict("carried", "en-US")).toBe("ˈkæɹid");
  });
});
