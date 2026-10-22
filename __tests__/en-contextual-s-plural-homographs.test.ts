import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("verb stems in contextual -s forms", () => {
  const processor = new EnglishG2P({ disableDict: true });
  const api = createPhonemizer({ processors: [processor] });
  const tokens = (sentence: string) => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  });

  it("uses the attested verb reading for explicitly tagged inflections", () => {
    expect(processor.predict("combines", "en-US", "V")).toBe("kəmˈbaɪnz");
    expect(processor.predict("consoles", "en-US", "V")).toBe("kənˈsoʊɫz");
    expect(processor.predict("produces", "en-US", "V")).toBe("pɹəˈdusəz");
  });

  it("selects finite verbs and preserves plural-noun readings in sentence context", () => {
    const verbTokens = tokens("The team combines their data. The program consoles the caller.");
    expect(verbTokens.find(token => token.word === "combines")?.phoneme).toBe("kəmˈbaɪnz");
    expect(verbTokens.find(token => token.word === "consoles")?.phoneme).toBe("kənˈsoʊɫz");

    const nounTokens = tokens("The farmers operate combines. The game consoles are popular.");
    expect(nounTokens.find(token => token.word === "combines")?.phoneme).toBe("ˈkɑmbaɪnz");
    expect(nounTokens.find(token => token.word === "consoles")?.phoneme).toBe("ˈkɑnsoʊɫz");
  });
});
