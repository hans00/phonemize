import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("the free every root keeps its spoken /r/", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("uses the source-checked root reading on the default API", () => {
    expect(new EnglishG2P().predict("every")).toBe("ˈɛvɹi");
  });

  it("keeps the root reading in full sentence context", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize(
      "Every day, everyone reads everything everywhere.",
      { language: "en-US", returnArray: true },
    );
    for (const [word, ipa] of [
      ["Every", "ˈɛvɹi"],
      ["everyone", "ˈɛvɹiˌwʌn"],
      ["everything", "ˈɛvɹiˌθɪŋ"],
      ["everywhere", "ˈɛvɹiˌwɛɹ"],
    ])
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(ipa);
  });

  it.each([
    ["every", "ˈɛvɹi"],
    ["everyone", "ˈɛvɹiˌwʌn"],
    ["everybody", "ˈɛvɹiˌbɑdi"],
    ["everything", "ˈɛvɹiˌθɪŋ"],
    ["everywhere", "ˈɛvɹiˌwɛɹ"],
    ["everyplace", "ˈɛvɹiˌpɫeɪs"],
    ["everyday", "ˈɛvɹiˌdeɪ"],
    ["everywhere's", "ˈɛvɹiˌwɛɹz"],
  ])("renders %s from the rule path", (word, ipa) => {
    expect(rules.predict(word)).toBe(ipa);
  });

  it.each([
    ["very", "ˈvɛɹi"],
    ["verywell", "ˈvɛɹiˌwɛɫ"],
    ["several", "ˈsɛvɝəɫ"],
    ["cleverly", "ˈkɫɛvɝɫi"],
    ["delivery", "dɪˈɫɪvɝi"],
    ["reverie", "ɹiˈvɪɹi"],
    ["everydayness", "ˌɛvɹiˈdeɪnəs"],
  ])("preserves neighboring reading %s", (word, ipa) => {
    expect(rules.predict(word)).toBe(ipa);
  });
});
