import EnglishG2P from "../src/en/g2p";

describe("the multisyllabic final -zine rime", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const stripStress = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

  it.each([
    ["benzine", "bɛnzin"],
    ["hydrazine", "haɪdɹəzin"],
    ["magazine", "mæɡəzin"],
  ])("uses /i/ in the final -zine rime of %s", (word, phones) => {
    expect(stripStress(rules.predict(word, "en-US")!)).toBe(phones);
  });

  it("keeps the PRICE vowel in one-syllable zine", () => {
    expect(rules.predict("zine", "en-US")).toBe("ˈzaɪn");
  });

  it.each(["line", "airline", "baseline", "deadline", "decline"])(
    "does not change the unrelated -ine rime in %s",
    word => expect(rules.predict(word, "en-US")).not.toContain("zin"),
  );
});
