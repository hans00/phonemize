import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("air before i (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test.each([
    ["prairie", "ˈpɹɛɹi"], ["airier", "ˈɛɹiɝ"], ["airiest", "ˈɛɹiəst"],
    ["fairies", "ˈfɛɹiz"], ["air", "ˈɛɹ"], ["airing", "ˈɛɹɪŋ"],
  ])("preserves the rhotic vowel in %s", (word, expected) => {
    expect(engine.predict(word, "en-US")).toBe(expected);
  });

  test.each([
    ["The prairie is wide.", "ðə ˈpɹɛɹi ɪz waɪd."],
    ["The airier room feels bright.", "ðə ˈɛɹiɝ ɹum fiɫz bɹaɪt."],
    ["They are airing the room.", "ðeɪ ɑɹ ˈɛɹɪŋ ðə ɹum."],
  ])("preserves the sentence %s", (sentence, expected) => {
    expect(api.phonemize(sentence, { language: "en-US" })).toBe(expected);
  });
});
