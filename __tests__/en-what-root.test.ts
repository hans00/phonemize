import EnglishG2P from "../src/en/g2p";

describe("wh+a before written -t", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("uses the STRUT vowel in the productive what root", () => {
    expect(rules.predict("what", "en-US")).toBe("ˈhwʌt");
    expect(rules.predict("whats", "en-US")).toBe("ˈhwʌts");
    expect(rules.predict("whatnot", "en-US")).toBe("ˈhwʌtˌnɑt");
    expect(rules.predict("whatever", "en-US")).toBe("ˌhwʌˈtɛvɝ");
    expect(rules.predict("whatsoever", "en-US")).toBe("ˌhwʌtsoʊˈɛvɝ");
  });

  it("preserves neighboring wh+a rimes", () => {
    expect(rules.predict("wham", "en-US")).toBe("ˈhwɑm");
    expect(rules.predict("whack", "en-US")).toBe("ˈhwæk");
    expect(rules.predict("whale", "en-US")).toBe("ˈhweɪɫ");
    expect(rules.predict("wharf", "en-US")).toBe("ˈhwɔɹf");
    expect(rules.predict("whatley", "en-US")).toBe("ˈhwɑtɫi");
  });
});
