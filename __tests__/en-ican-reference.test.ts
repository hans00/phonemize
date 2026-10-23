import dictionary = require("../data/en/dict.json");
import EnglishG2P from "../src/en/g2p";

describe("Cambridge US -ican reference corrections", () => {
  it.each([
    ["american", "əˈmɛɹɪkən"],
    ["african", "ˈæfɹɪkən"],
  ])("stores the Cambridge US reference for %s", (word, ipa) => {
    expect(dictionary[word as keyof typeof dictionary]).toBe(ipa);
  });

  it.each([
    ["american", "əˈmɛɹɪkən"],
    ["african", "ˈæfɹɪkən"],
  ])("keeps the general rule-path reading of %s", (word, ipa) => {
    expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the -ican vowel in Vatican as a paired control", () => {
    expect(new EnglishG2P().predict("vatican", "en-US")).toBe("ˈvætɪkən");
    expect(new EnglishG2P({ disableDict: true }).predict("vatican", "en-US")).toBe("ˈvætɪkən");
  });
});
