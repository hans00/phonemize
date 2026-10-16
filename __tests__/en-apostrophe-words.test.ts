import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("Issue #28: lexical apostrophes", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });

  // Readings independently attested in the pinned CMUdict benchmark source.
  it.each([
    ["O'Brien", "oʊˈbɹaɪɪn"],
    ["O'Reilly", "oʊˈɹaɪɫi"],
    ["O'Brien's", "oʊˈbɹaɪɪnz"],
    ["O'Neill", "oʊˈniɫ"],
    ["D'Angelo", "diˈændʒɪɫoʊ"],
    ["rock'n'roll", "ˌɹɑkənˈɹoʊɫ"],
    ["don't", "ˈdoʊnt"],
    ["o'clock", "əˈkɫɑk"],
  ])("retains the attested reading of %s across apostrophe styles", (word, ipa) => {
    for (const apostrophe of ["'", "‘", "’"]) {
      expect(phonemizer.toIPA(word.replace(/'/g, apostrophe), "en-US")).toBe(ipa);
    }
  });

  it.each(["O'Brien's", "O'Reily's", "O'Reilly's"])(
    "keeps %s in one contextual token", (word) => {
      const tokens = phonemizer.phonemize(`We saw ${word} logo.`, { language: "en-US", returnArray: true });
      expect(tokens.filter((token) => token.word === word)).toHaveLength(1);
    },
  );

  it("normalizes custom names and inflects their final possessive", () => {
    const processor = new EnglishG2P();
    processor.addPronunciation("O‘Reily", "OW0 R AY1 L IY0");
    expect(processor.predict("O’Reily's", "en-US")).toBe(processor.predict("O'Reily", "en-US") + "z");
  });

  it.each([
    ["I'm", "ˈaɪm"], ["we'll", "ˈwil"], ["you've", "ˈjuv"],
    ["island's", "ˈaɪɫəndz"], ["dogs'", "ˈdɑɡz"],
  ])("preserves the existing clitic reading of %s", (word, ipa) => {
    expect(phonemizer.toIPA(word, "en-US")).toBe(ipa);
  });
});
