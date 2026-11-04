import dictionary = require("../data/en/dict.json");
import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("Cambridge US weak -age references", () => {
  const words = [
    ["damage", "ˈdæmɪdʒ"],
    ["damages", "ˈdæmɪdʒɪz"],
    ["damaged", "ˈdæmɪdʒd"],
    ["usage", "ˈjusɪdʒ"],
    ["usages", "ˈjusɪdʒɪz"],
    ["courage", "ˈkɝɪdʒ"],
  ] as const;

  it.each(words)("stores the Cambridge US reading for %s", (word, ipa) => {
    expect(dictionary[word]).toBe(ipa);
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
  });

  it.each(words)("keeps the spelling-rule reading for %s", (word, ipa) => {
    expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["discouraged", "dɪˈskɝɪdʒd"],
    ["discouraging", "dɪˈskɝɪdʒɪŋ"],
  ])("stores the Cambridge-supported inflection for %s", (word, ipa) => {
    expect(dictionary[word as keyof typeof dictionary]).toBe(ipa);
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the independently listed STRUT prefix in undamaged", () => {
    expect(dictionary.undamaged).toBe("ˌʌnˈdæmɪdʒd");
    expect(new EnglishG2P().predict("undamaged", "en-US")).toBe("ˌʌnˈdæmɪdʒd");
  });

  it("keeps the full vowel in the teen+age compound", () => {
    expect(new EnglishG2P().predict("teenage", "en-US")).toBe("ˈtiˌneɪdʒ");
    expect(new EnglishG2P({ disableDict: true }).predict("teenage", "en-US")).toBe("ˈtineɪdʒ");
    for (const word of ["advantage", "cottage", "damage", "image"]) {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toMatch(/ɪdʒ$/);
    }
    expect(new EnglishG2P().predict("teenager", "en-US")).toBe("ˈtiˌneɪdʒɝ");
  });

  it("preserves the compound and weak-age controls in a sentence on the rules route", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = phonemizer.phonemize("The teenage actor saw a cottage as an advantage.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "teenage")?.phoneme).toBe("ˈtineɪdʒ");
    expect(tokens.find(token => token.word === "cottage")?.phoneme).toMatch(/ɪdʒ$/);
    expect(tokens.find(token => token.word === "advantage")?.phoneme).toMatch(/ɪdʒ$/);
  });
});
