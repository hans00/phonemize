import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

const withoutStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");

describe("contextual ough rimes", () => {
  it.each([false, true])("reads through and though across dictionary modes (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    expect(g2p.predict("through", "en-US")).toBe("ˈθɹu");
    expect(g2p.predict("though", "en-US")).toBe("ˈðoʊ");
    expect(withoutStress(g2p.predict("although", "en-US"))).toBe("ɔɫðoʊ");
  });

  it("preserves the distinct rough, tough and thought rimes", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict("rough", "en-US")).toBe("ˈɹʌf");
    expect(g2p.predict("tough", "en-US")).toBe("ˈtʌf");
    expect(g2p.predict("thought", "en-US")).toBe("ˈθɔt");
  });

  it("keeps the corrected rimes and neighbors in full sentences", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = phonemizer.phonemize("Although it was rough, we went through, though it was tough.", {
      language: "en-US", returnArray: true,
    });
    const ipa = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(withoutStress(ipa("although"))).toBe("ɔɫðoʊ");
    expect(withoutStress(ipa("through"))).toBe("θɹu");
    expect(withoutStress(ipa("though"))).toBe("ðoʊ");
    expect(withoutStress(ipa("rough"))).toBe("ɹʌf");
    expect(withoutStress(ipa("tough"))).toBe("tʌf");
  });
});
