import { createPhonemizer } from "../src";
import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("rhotic cleanup respects lexical and syllable boundaries", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("composes around from its weak prefix and verified root, preserving vouched whole-word forms", () => {
    expect(rules.predict("around", "en-US")).toBe("əˈɹaʊnd");
    expect(rules.predict("arise", "en-US")).toBe("ɝˈaɪz");
    expect(rules.predict("arrange", "en-US")).toBe("ɝˈeɪndʒ");
    expect(rules.predict("arrive", "en-US")).toBe("ɝˈaɪv");
    expect(rules.predict("array", "en-US")).toBe("ɝˈeɪ");
  });

  it("keeps within-syllable rhotic vowels and the full sentence route", () => {
    expect(rules.predict("general", "en-US")).toBe("ˈdʒɛnɝəɫ");
    expect(rules.predict("different", "en-US")).toBe("ˈdɪfɝənt");


    const tokens = englishTokens(rules, "We walked around the park.");
    expect(tokens.find(token => token.word === "around")?.phoneme).toBe("əˈɹaʊnd");
  });
});
