import EnglishG2P from "../src/en/g2p";

describe("the bound guarant- root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["guarantee", "ˌɡɛɹənˈti"],
    ["guaranteed", "ˌɡɛɹənˈtid"],
    ["guaranty", "ˈɡɛɹənti"],
  ])("uses the checked /ɛɹ/ vowel in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["guard", "ˈɡɑɹd"],
    ["guardian", "ˈɡɑɹdiən"],
  ])("preserves the /ɑɹ/ guard-family control %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
