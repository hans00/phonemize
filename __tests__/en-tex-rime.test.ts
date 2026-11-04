import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("closed -tex rime, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test("preserves the vowel in citation forms and regular plurals", () => {
    for (const word of ["vertex", "vertexes", "cortex", "cortexes", "vortex", "vortexes"]) {
      expect(engine.predict(word, "en", "N")).toContain("tɛks");
    }
    expect(engine.predict("context", "en", "N")).toBe("ˈkɑntɛkst");
    expect(engine.predict("text", "en", "V")).toBe("tɛkst");
  });

  test("preserves the same pronunciation in sentences", () => {
    const tokens = api.phonemize("The vortexes surround the cortex.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word.toLowerCase() === "vortexes")?.phoneme).toContain("tɛks");
    expect(tokens.find(token => token.word.toLowerCase() === "cortex")?.phoneme).toContain("tɛks");
  });
});
