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

  // O'Reily is only an illustrative spelling here; the real company below is O'Reilly Media.
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

  it.each([false, true])("composes an unattested O' surname independent of casing (rules=%s)", disableDict => {
    const processor = new EnglishG2P({ disableDict });
    const name = processor.predict("O'Reily", "en-US")!;
    for (const spelling of ["O'Reily", "o'reily", "O’Reily", "o’reily"]) {
      expect(processor.predict(spelling, "en-US")).toBe(name);
    }
    for (const spelling of ["O'Reily's", "o'reily's", "O’Reily’s", "o’reily’s"]) {
      expect(processor.predict(spelling, "en-US")).toBe(`${name}z`);
    }
    expect(processor.trace("O'Reily", "en-US").path).toBe("rules");
    expect(processor.trace("o'reily", "en-US").path).toBe("rules");
    expect(processor.predict("O'Clair", "en-US")).toBe(processor.predict("o'clair", "en-US"));
    // The capitalized contraction must not be mistaken for the Irish prefix.
    expect(processor.predict("O'Clock", "en-US")).toBe(processor.predict("o'clock", "en-US"));
  });

  it("preserves O' names and possessives as sentence tokens", () => {
    const tokens = phonemizer.phonemize("We saw O'Reily's store beside O'Reilly's store.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "O'Reily's")?.phoneme).toBe("oʊˈɹiɫiz");
    expect(tokens.find(token => token.word === "O'Reilly's")?.phoneme).toBe("oʊˈɹaɪɫiz");
  });

  it("keeps issue #28 O'Brien and O'Reilly Media correct in sentences", () => {
    const tokens = phonemizer.phonemize("I met O'Brien yesterday. O'Reilly Media sells technical books.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "O'Brien")?.phoneme).toBe("oʊˈbɹaɪɪn");
    expect(tokens.find(token => token.word === "O'Reilly")?.phoneme).toBe("oʊˈɹaɪɫi");
    expect(tokens.find(token => token.word === "Media")?.phoneme).toBe("ˈmidiə");
  });

  it.each(["'", "‘", "’"])("keeps the O'Reilly brand and possessive together with apostrophe %s", apostrophe => {
    const brand = `O${apostrophe}Reilly`;
    const possessive = `${brand}${apostrophe}s`;
    const tokens = phonemizer.phonemize(`${brand} Media sells books. I bought ${possessive} book.`, {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === brand)?.phoneme).toBe("oʊˈɹaɪɫi");
    expect(tokens.find(token => token.word === "Media")?.phoneme).toBe("ˈmidiə");
    expect(tokens.find(token => token.word === possessive)?.phoneme).toBe("oʊˈɹaɪɫiz");
  });

  it.each([
    ["I'm", "ˈaɪm"], ["we'll", "ˈwil"], ["you've", "ˈjuv"],
    ["island's", "ˈaɪɫəndz"], ["dogs'", "ˈdɑɡz"],
  ])("preserves the existing clitic reading of %s", (word, ipa) => {
    expect(phonemizer.toIPA(word, "en-US")).toBe(ipa);
  });
});
