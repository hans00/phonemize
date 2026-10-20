import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("stressed any/many roots", () => {
  const processor = new EnglishG2P({ disableDict: true });

  it.each([
    ["any", "ˈɛni"],
    ["many", "ˈmɛni"],
    ["manyfold", "ˈmɛniˌfoʊɫd"],
  ])("uses the checked vowel in %s", (word, ipa) => {
    expect(processor.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["company", "ˈkɑmpəni"],
    ["Germany", "ˈdʒɝməni"],
    ["Albany", "ˈæɫbəni"],
    ["Danny", "ˈdæni"],
    ["anywhere", "ˈɛniˌwɛɹ"],
    ["anyway", "ˈɛniˌweɪ"],
  ])("preserves the neighboring frame in %s", (word, ipa) => {
    expect(processor.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the reading in full sentence context", () => {
    const phonemizer = createPhonemizer({ processors: [processor] });
    const tokens = phonemizer.phonemize(
      "Any many people can choose manyfold options at the company in Germany.",
      { language: "en-US", returnArray: true },
    );
    for (const word of ["Any", "many", "manyfold"]) {
      expect(tokens.find((entry) => entry.word === word)?.phoneme).toMatch(/ɛ/);
    }
  });
});
