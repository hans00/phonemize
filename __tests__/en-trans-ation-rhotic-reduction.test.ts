import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("weak rhotic vowel after trans- before -ation", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });

  it.each([
    ["transformation", "ˌtɹænsfɝˈmeɪʃən"],
    ["transportation", "ˌtɹænspɝˈteɪʃən"],
    ["retransformation", "ɹiˌtɹænsfɝˈmeɪʃən"],
    ["retransportation", "ɹiˌtɹænspɝˈteɪʃən"],
  ])("reduces unstressed rhotic OR in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["transform", "ˈtɹænsfɔɹm"],
    ["transport", "ˈtɹænˌspɔɹt"],
    ["importation", "ˌɪmpɔɹˈteɪʃən"],
    ["deformation", "ˌdiˌfɔɹˈmeɪʃən"],
    ["formation", "ˌfɔɹˈmeɪʃən"],
    ["organization", "ˌɔɹɡənəˈzeɪʃən"],
    ["transformations", "ˌtɹænsfɝˈmeɪʃənz"],
    ["transformational", "ˌtɹænsfɝˈmeɪʃənəɫ"],
  ])("preserves the neighboring rime in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps noun and verb readings stable in sentences", () => {
    const tokens = phonemizer.phonemize(
      "They transform the material and transport it. The transformation changed transportation.",
      { language: "en-US", returnArray: true },
    );
    expect(tokens.find(token => token.word === "transform")?.phoneme).toBe("tɹænsˈfɔɹm");
    expect(tokens.find(token => token.word === "transport")?.phoneme).toBe("ˈtɹænspɔɹt");
    expect(tokens.find(token => token.word === "transformation")?.phoneme).toBe("ˌtɹænsfɝˈmeɪʃən");
    expect(tokens.find(token => token.word === "transportation")?.phoneme).toBe("ˌtɹænspɝˈteɪʃən");
  });
});
