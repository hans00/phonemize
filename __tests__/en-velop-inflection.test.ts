import EnglishG2P from "../src/en/g2p";

describe("regular inflections of -velop verbs", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["developed", "dɪˈvɛɫəpt"],
    ["developing", "dɪˈvɛɫəpɪŋ"],
    ["undeveloped", "ˌʌndɪˈvɛɫəpt"],
    ["enveloped", "ɪnˈvɛɫəpt"],
    ["enveloping", "ɪnˈvɛɫəpɪŋ"],
  ])("preserves the verb stem vowel in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("uses the corrected developed forms in the shipped pipeline", () => {
    const shipped = new EnglishG2P();
    expect(shipped.predict("developed", "en-US")).toBe("dɪˈvɛɫəpt");
    expect(shipped.predict("developing", "en-US")).toBe("dɪˈvɛɫəpɪŋ");
  });

  it.each([
    ["envelope", "ˈɛnvəˌɫoʊp"],
    ["development", "dɪˈvɛɫəpmənt"],
    ["hoped", "ˈhoʊpt"],
    ["hopping", "ˈhɑpɪŋ"],
  ])("preserves neighboring spelling and suffix classes in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
