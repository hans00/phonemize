import EnglishG2P from "../src/en/g2p";
import dictionary = require("../data/en/dict.json");

describe("Cambridge US common-word reference corrections", () => {
  const readings = [
    ["article", "ˈɑɹtɪkəl", "ˈɑɹtɪkəɫ"],
    ["presenting", "pɹɪˈzɛntɪŋ", "pɹɪˈzɛntɪŋ"],
  ] as const;

  it.each(readings)("stores and serves the Cambridge US reading for %s", (word, dictIpa, runtimeIpa) => {
    expect(dictionary[word]).toBe(dictIpa);
    expect(new EnglishG2P().predict(word, "en-US")).toBe(runtimeIpa);
  });

  it("preserves Cambridge's final /t/ in investment", () => {
    const stripStress = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");
    expect(stripStress(dictionary.investment)).toBe("ɪnvɛstmənt");
    expect(stripStress(new EnglishG2P().predict("investment", "en-US") ?? "")).toBe("ɪnvɛstmənt");
  });

  it.each([
    ["credit", "ˈkɹɛdɪt"],
    ["edit", "ˈɛdɪt"],
    ["editor", "ˈɛdɪtɝ"],
    ["edition", "ɪˈdɪʃən"],
  ] as const)("uses Cambridge US's /ɪ/ reading for %s", (word, expected) => {
    expect(dictionary[word]).toBe(expected);
    expect(new EnglishG2P().predict(word, "en-US")).toBe(expected);
  });
});
