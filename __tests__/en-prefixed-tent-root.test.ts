import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("prefixed free root -tent", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps the checked root vowel in the rules-only noun reading", () => {
    expect(rules.predict("content", "en-US")).toBe("ˈkɑntɛnt");
  });

  it("preserves the root in derivatives and leaves similar weak endings alone", () => {
    expect(rules.predict("contents", "en-US")).toBe("ˈkɑntɛnts");
    expect(rules.predict("contentment", "en-US")).toBe("kənˈtɛntmənt");
    expect(rules.predict("intent", "en-US")).toBe("ˌɪnˈtɛnt");
    expect(rules.predict("extent", "en-US")?.replace(/[ˈˌ]/g, "")).toBe("ɪkstɛnt");
    expect(rules.predict("patent", "en-US")).toBe("ˈpeɪtənt");
    expect(rules.predict("potent", "en-US")).toBe("ˈpoʊtənt");
    expect(rules.predict("latent", "en-US")).toBe("ˈɫeɪtənt");
    expect(rules.predict("student", "en-US")).toBe("ˈstudənt");
  });

  it("keeps noun/adjective and verb homograph readings in sentence context", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const ipa = (sentence: string, target = "content") => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word.toLowerCase() === target)?.phoneme;

    expect(ipa("The content was clear.")).toBe("ˈkɑntɛnt");
    expect(ipa("She is content with it.")).toBe("kənˈtɛnt");
    expect(ipa("They content themselves with little.")).toBe("kənˈtɛnt");
    expect(ipa("The present was announced.", "present")).toBe("ˈpɹɛzənt");
    expect(ipa("She is present today.", "present")).toBe("ˈpɹɛzənt");
  });
});
