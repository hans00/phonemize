import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("weak -imum vowel, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it("keeps the reduced vowel in the Latin superlative class", () => {
    for (const [word, ipa] of [
      ["maximum", "ˈmæksəməm"],
      ["optimum", "ˈɑptəməm"],
      ["minimum", "ˈmɪnəməm"],
      ["maximums", "ˈmæksəməmz"],
      ["optimums", "ˈɑptəməmz"],
    ]) expect(engine.predict(word, "en")).toBe(ipa);
    if (disableDict) expect(engine.predict("minimums", "en")).toBe("ˈmɪnəməmz");
  });

  it("leaves related vowel sequences outside -imum intact", () => {
    expect(engine.predict("premium", "en")).toBe("ˈpɹimiəm");
  });
});

it("keeps the weak -imum vowel in full sentences", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  for (const [sentence, word, ipa] of [
    ["The maximum value is unknown.", "maximum", "ˈmæksəməm"],
    ["Use the optimum setting.", "optimum", "ˈɑptəməm"],
    ["Set the minimum limit.", "minimum", "ˈmɪnəməm"],
  ]) {
    const tokens = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
  }
});
