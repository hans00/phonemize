import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("the unstressed con|cen|tr frame", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const withoutSecondaryStress = (ipa: string) => ipa.replace(/ˌ/g, "");

  it.each([
    ["concentrate", "ˈkɑnsənˌtɹeɪt"],
    ["concentrator", "ˈkɑnsənˌtɹeɪtɝ"],
  ])("centralizes the weak <cen> in %s", (word, ipa) => {
    expect(withoutSecondaryStress(rules.predict(word, "en-US") ?? "")).toBe(withoutSecondaryStress(ipa));
    expect(rules.trace(word, "en-US").path).toBe("rules");
  });

  it.each([
    ["concentrates", "ˈkɑnsənˌtɹeɪts"],
    ["concentrated", "ˈkɑnsənˌtɹeɪtɪd"],
    ["concentrating", "ˈkɑnsənˌtɹeɪtɪŋ"],
    ["concentration", "ˌkɑnsənˈtɹeɪʃən"],
  ])("preserves the existing morphology reading of %s", (word, ipa) => {
    expect(withoutSecondaryStress(rules.predict(word, "en-US") ?? "")).toBe(withoutSecondaryStress(ipa));
    expect(rules.trace(word, "en-US").path).toBe("morphology");
  });

  it.each([
    ["concentric", "kənˈsɛntɹɪk"],
    ["concentrically", "kənˈsɛntɹɪkɫi"],
    ["eccentric", "ɛkˈsɛntɹɪk"],
    ["concern", "kənˈsɝn"],
  ])("keeps the distinct stressed or neighboring root in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the public sentence reading of concentrate", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = phonemizer.phonemize("Please concentrate on the task.", {
      language: "en-US",
      returnArray: true,
    });
    expect(withoutSecondaryStress(tokens.find(token => token.word === "concentrate")?.phoneme ?? ""))
      .toBe(withoutSecondaryStress("ˈkɑnsənˌtɹeɪt"));
  });
});
