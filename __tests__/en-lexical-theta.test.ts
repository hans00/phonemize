import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// MW thespian and the fixed common-cohort thesaurus reading, including stress.
const readings = [["thespian", "ˈθɛspiən"], ["thesaurus", "θəˈsɔɹəs"]];
const sentences = [
  "The thespian used a thesaurus.", "They blamed themselves.",
  "They blamed theirselves.", "They blamed theirself.", "They blamed themself.",
  "The answer is theirs.", "Their names are there.", "They went there before.",
  "They saw the theme.", "They will do that thereafter.",
];

describe.each([false, true])("lexical theta and grammatical roots, rules=%s", disableDict => {
  test.each(readings)("keeps the complete %s reading across caller POS", (word, expected) => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"]) expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });

  test.each([["Thelmas", "ˈθɛlməz"], ["Theklas", "ˈθɛkləz"]])("retains the vouched root in %s", (word, expected) => {
    const processor = new EnglishG2P({ disableDict });
    expect((processor.predict(word, "en-US", "N") ?? "").replace(/ɫ/g, "l")).toBe(expected);
    const tokens = createPhonemizer({ processors: [processor] }).phonemize(`The ${word} are here.`, { language: "en-US", returnArray: true });
    if (typeof tokens === "string") throw new Error("Expected token output");
    expect(tokens.filter(token => token.word === word).map(token => token.phoneme.replace(/ɫ/g, "l"))).toEqual([expected]);
  });

  test("preserves a caller-owned reading in isolation and prose", () => {
    const processor = new EnglishG2P({ disableDict });
    processor.addPronunciation("thespian", "ˈtɛspiən");
    for (const pos of [undefined, "N", "ADJ", "V"]) expect(processor.predict("thespian", "en-US", pos)).toBe("ˈtɛspiən");
    const tokens = createPhonemizer({ processors: [processor] }).phonemize("The thespian smiled.", { language: "en-US", returnArray: true });
    if (typeof tokens === "string") throw new Error("Expected token output");
    expect(tokens.filter(token => token.word === "thespian").map(token => token.phoneme)).toEqual(["ˈtɛspiən"]);
    // Morphology omits the redundant primary on a supplied monosyllable.
    for (const [root, plural] of [["ˈfɑ", "fɑz"], ["ˈfɑmə", "ˈfɑməz"]]) {
      processor.addPronunciation("thelma", root);
      expect(processor.predict("Thelmas", "en-US", "N")).toBe(plural);
    }
  });

  test.each(sentences)("preserves the grammatical boundary in %s", sentence => {
    const engine = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const tokens = engine.phonemize(sentence, { language: "en-US", returnArray: true });
    if (typeof tokens === "string") throw new Error("Expected token output");
    for (const token of tokens) {
      const word = token.word.toLowerCase();
      const reading = readings.find(([key]) => key === word);
      if (reading) expect(token.phoneme).toBe(reading[1]);
      else if (["the", "they", "their", "there", "thereafter", "theirs", "that", "themselves", "theirselves", "theirself", "themself"].includes(word))
        expect(token.phoneme).not.toMatch(/^[ˈˌ]*θ/);
    }
  });
});
