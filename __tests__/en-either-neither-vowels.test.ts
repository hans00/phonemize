import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("either/neither ei-before-th reading, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it("uses an attested US /aɪ/ variant in both paired forms", () => {
    expect(engine.predict("either", "en")).toBe("ˈaɪðɝ");
    expect(engine.predict("neither", "en")).toBe("ˈnaɪðɝ");
  });

  it("keeps other ei and th spellings in their established environments", () => {
    for (const [word, ipa] of [
      ["weight", "ˈweɪt"],
      ["height", "ˈhaɪt"],
      ["their", "ˈðɛɹ"],
      ["theory", "ˈθiɝi"],
    ]) expect(engine.predict(word, "en")).toBe(ipa);
  });
});

it("keeps the ei-before-ther reading in full sentences", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  for (const [sentence, word, ipa] of [
    ["Either route works.", "Either", "ˈaɪðɝ"],
    ["Neither option fits.", "Neither", "ˈnaɪðɝ"],
  ]) {
    const tokens = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme).toBe(ipa);
  }
});
