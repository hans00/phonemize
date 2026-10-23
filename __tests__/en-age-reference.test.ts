import dictionary = require("../data/en/dict.json");
import EnglishG2P from "../src/en/g2p";

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
});
