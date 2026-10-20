import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("tense i in pi-/pri- -acy relatives", () => {
  const processor = new EnglishG2P({ disableDict: true });

  it.each([
    ["privacy", "ˈpɹaɪvəsi"],
    ["piracy", "ˈpaɪɹəsi"],
    ["primacy", "ˈpɹaɪməsi"],
  ])("preserves the root vowel in %s", (word, ipa) => {
    expect(processor.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["literacy", "ˈɫɪtɝəsi"],
    ["accuracy", "ˈækjɝəsi"],
    ["prison", "ˈpɹɪsən"],
    ["privacies", "ˈpɹaɪvəsiz"],
    ["piracies", "ˈpaɪɹəsiz"],
  ])("preserves the neighboring frame in %s", (word, ipa) => {
    expect(processor.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the root vowel in sentence context", () => {
    const phonemizer = createPhonemizer({ processors: [processor] });
    const tokens = phonemizer.phonemize(
      "Privacy and piracy have primacy over privacy settings.",
      { language: "en-US", returnArray: true },
    );
    for (const word of ["Privacy", "piracy", "primacy", "privacy"]) {
      const token = tokens.find((entry) => entry.word.toLowerCase() === word.toLowerCase());
      expect(token?.phoneme).toMatch(/aɪ/);
    }
  });
});
