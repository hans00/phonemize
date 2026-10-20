import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("weak ad- in disyllabic j-verbs", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["adjust", "əˈdʒʌst"],
    ["adjoin", "əˈdʒɔɪn"],
    ["adjourn", "əˈdʒɝn"],
    ["adjure", "əˈdʒʊɹ"],
  ])("stresses the root and weakens ad- in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps related nouns and longer words on their existing readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize("The adjunct instructor described the adjective in an adjusted form.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "adjunct")?.phoneme).toBe("ˈædʒəŋkt");
    expect(tokens.find(token => token.word === "adjective")?.phoneme).toBe("ˈædʒɪktɪv");
    expect(tokens.find(token => token.word === "adjusted")?.phoneme).toBe("əˈdʒʌstɪd");
    expect(rules.predict("adjunct", "en-US")).toBe("ˈædʒəŋkt");
  });
});
