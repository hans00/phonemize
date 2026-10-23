import EnglishG2P from "../src/en/g2p";

describe("weak <i> in the -stin + -ation family", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("reduces the demoted root vowel in destination and its inflections", () => {
    expect(rules.predict("destination", "en-US")).toBe("ˌdɛstəˈneɪʃən");
    expect(rules.predict("destinations", "en-US")).toBe("ˌdɛstəˈneɪʃənz");
    expect(rules.predict("destinationist", "en-US")).toBe("ˌdɛstəˈneɪʃənɪst");
  });

  it("composes through pre- without changing the stem class", () => {
    expect(rules.predict("predestination", "en-US")).toContain("dɛstəˈneɪʃən");
  });

  it("preserves -ate-derived and unshifted controls", () => {
    expect(rules.predict("procrastination", "en-US")).toBe("pɹəˌkɹæstəˈneɪʃən");
    expect(rules.predict("destined", "en-US")).toBe("ˈdɛstɪnd");
  });
});
