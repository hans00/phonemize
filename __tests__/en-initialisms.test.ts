import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("Dictionary-attested initialisms", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });

  it.each([
    ["c", "si"], ["h", "eɪtʃ"], ["q", "kju"],
    ["dvd", "dividi"], ["pdf", "pidiɛf"], ["bbc", "bibisi"],
    ["html", "eɪtʃtiɛmɛɫ"], ["usb", "juɛsbi"], ["cpu", "sipiju"],
  ])("reads %s as letter names", (word, expected) => {
    expect(phonemizer.toIPA(word).replace(/[ˈˌ\s]/g, "")).toBe(expected);
  });

  it.each([
    ["gas", "ˈɡæs"], ["disclosure", "dɪsˈkɫoʊʒɝ"],
  ])("does not use initialisms as morphological parts of %s", (word, expected) => {
    expect(phonemizer.toIPA(word)).toBe(expected);
  });

  it("reports the lexical path for an attested initialism", () => {
    expect(new EnglishG2P().trace("dvd").path).toBe("dictionary");
  });
});
