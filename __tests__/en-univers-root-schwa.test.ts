import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("weak ni in the univers- root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["universe", "ˈjunəvɝs"],
    ["university", "ˌjunəˈvɝsəti"],
    ["universality", "ˌjunəvɝˈsæɫəti"],
  ])("centralizes the weak ni in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the same vowel in unrelated uni- words and preserves contextual forms", () => {
    expect(rules.predict("unilateral", "en-US")).toBe("ˌjunɪˈɫætɝəɫ");
    expect(rules.predict("unison", "en-US")).toBe("ˈjunɪsən");
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize(
      "The universe includes a university; its universality is debated.",
      { language: "en-US", returnArray: true },
    );
    expect(tokens.find(token => token.word === "universe")?.phoneme).toBe("ˈjunəvɝs");
    expect(tokens.find(token => token.word === "university")?.phoneme).toBe("ˌjunəˈvɝsəti");
    expect(tokens.find(token => token.word === "universality")?.phoneme).toBe("ˌjunəvɝˈsæɫəti");
  });
});
