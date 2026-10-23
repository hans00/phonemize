import EnglishG2P from "../src/en/g2p";

describe("comparison retains the productive compare stem", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("derives comparison from compare rather than re-syllabifying the whole word", () => {
    expect(rules.predict("comparison", "en-US")).toBe("kəmˈpɛɹəsən");
    expect(rules.predict("comparisons", "en-US")).toBe("kəmˈpɛɹəsənz");
  });

  it("leaves the verb paradigm and related -ison words on their own paths", () => {
    expect(rules.predict("compare", "en-US")).toBe("kəmˈpɛɹ");
    expect(rules.predict("compared", "en-US")).toBe("kəmˈpɛɹd");
    expect(rules.predict("compares", "en-US")).toBe("kəmˈpɛɹz");
    expect(rules.predict("comparing", "en-US")).toBe("kəmˈpɛɹɪŋ");
    expect(rules.predict("comparative", "en-US")).toBe("kəmˈpæɹətɪv");
    expect(rules.predict("prison", "en-US")).toBe("ˈpɹɪsən");
    expect(rules.predict("decision", "en-US")).toBe("dɪˈsɪʒən");
  });
});
