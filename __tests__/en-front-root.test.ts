import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("front as a productive English root", () => {
  const rules = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });

  it.each([
    ["front", "ˈfɹʌnt"],
    ["frontage", "ˈfɹʌntɪdʒ"],
    ["effrontery", "ɪˈfɹʌntɝi"],
  ])("keeps STRUT in %s", (word, expected) => {
    expect(rules.toIPA(word, "en-US")).toBe(expected);
  });

  it.each([
    ["frontz", "ˈfɹɑnts"],
    ["frontispiece", "ˌfɹɑntɪˈspis"],
    ["company", "ˈkɑmpəni"],
    ["London", "ˈɫɑndən"],
  ])("leaves the unrelated spelling control %s unchanged", (word, expected) => {
    expect(rules.toIPA(word, "en-US")).toBe(expected);
  });

  it("keeps the root vowel in noun and verb sentence contexts", () => {
    expect(rules.phonemize("The front porch faces the road. They fronted the band.", {
      language: "en-US",
    })).toBe("ðə fɹʌnt pɔɹtʃ ˈfeɪsəz ðə ɹoʊd. ðeɪ ˈfɹʌntɪd ðə bænd.");
  });
});
