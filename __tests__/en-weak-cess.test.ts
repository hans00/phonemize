import EnglishG2P from "../src/en/g2p";

describe("weak -cess vowel in the rules path", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps /ɛ/ in unstressed checked -cess", () => {
    expect(rules.predict("access")).toBe("ˈæksɛs");
    expect(rules.predict("princess")).toBe("ˈpɹɪnsɛs");
    expect(rules.predict("reprocess")).toBe("ɹiˈpɹoʊsɛs");
  });

  it("preserves adjacent c and soft-c endings", () => {
    expect(rules.predict("accessible")).toBe("əkˈsɛsəbəɫ");
    expect(rules.predict("princes")).toBe("ˈpɹɪnsəz");
    expect(rules.predict("procession")).not.toContain("sɛs");
  });
});
