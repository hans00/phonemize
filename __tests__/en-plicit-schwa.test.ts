import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("unstressed -plicit suffix", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["explicit", "ɪksˈpɫɪsət"],
    ["explicitly", "ɪksˈpɫɪsətɫi"],
    ["complicit", "kəmˈpɫɪsət"],
  ])("centralizes the final vowel in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("matches implicit's stress-stripped pronunciation despite secondary-stress conventions", () => {
    expect(rules.predict("implicit", "en-US")?.replace(/[ˈˌ]/g, "")).toBe("ɪmpɫɪsət");
  });

  it.each([
    ["duplicity", "duˈpɫɪsəti"],
    ["simplicity", "sɪmˈpɫɪsəti"],
    ["multiplicity", "ˌmʌɫtəˈpɫɪsəti"],
  ])("leaves related -plicity in %s unchanged", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["The clause was explicit.", "explicit", "ɪksˈpɫɪsət"],
    ["He was complicit in it.", "complicit", "kəmˈpɫɪsət"],
    ["The meaning stayed implicit.", "implicit", "ɪmˈpɫɪsət"],
    ["They spoke explicitly.", "explicitly", "ɪksˈpɫɪsətɫi"],
  ])("preserves the contextual reading in %s", (sentence, word, ipa) => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
    const token = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find((item) => item.word === word);
    expect(token?.phoneme).toBe(ipa);
  });
});
