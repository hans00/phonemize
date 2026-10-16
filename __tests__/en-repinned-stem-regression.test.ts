import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("rebuilt stem dependency (rules=%s)", (disableDict) => {
  it("keeps the independently sourced silent-e stem in its derived reading", () => {
    expect(new EnglishG2P({ disableDict }).predict("robling")).toBe("ˈɹoʊbəɫɪŋ");
  });
  it("preserves the name and the neighboring verb in a complete sentence", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const tokens = api.phonemize("Robling was reading the report.", { language: "en-US", returnArray: true });
    expect(tokens.find((token) => token.word === "Robling")?.phoneme).toBe("ˈɹoʊbəɫɪŋ");
    expect(tokens.find((token) => token.word === "reading")?.phoneme).toBe("ˈɹidɪŋ");
  });
});
