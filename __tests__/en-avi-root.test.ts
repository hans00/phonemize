import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("the avi- root across stress and derivation", () => {
  const rules = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });

  it.each([
    ["aviation", "ˌeɪviˈeɪʃən"],
    ["aviator", "ˈeɪvieɪtɝ"],
    ["aviary", "ˈeɪviɛɹi"],
    ["avian", "ˈeɪviən"],
    ["avionics", "ˌeɪviˈɑnɪks"],
  ])("keeps FACE in %s when the avi- root is strong", (word, expected) => {
    expect(rules.toIPA(word, "en-US")).toBe(expected);
  });

  it.each([
    ["aviate", "əviˈeɪt"],
    ["aviated", "əviˈeɪtɪd"],
    ["aviating", "əviˈeɪtɪŋ"],
    ["avid", "ˈævɪd"],
    ["avidity", "əˈvɪdəti"],
  ])("preserves the unstressed or checked control %s", (word, expected) => {
    expect(rules.toIPA(word, "en-US")).toBe(expected);
  });

  it("keeps the root vowel in sentences across the noun and adjective controls", () => {
    const tokens = rules.phonemize("An avid aviator sits beside an aviary.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.filter(token => ["avid", "aviator", "aviary"].includes(token.word))
      .map(token => token.phoneme)).toEqual(["ˈævɪd", "ˈeɪvieɪtɝ", "ˈeɪviɛɹi"]);
  });
});
