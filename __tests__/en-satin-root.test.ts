import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("satin lexical weak vowel", () => {
  it.each([false, true])("preserves the weak final vowel across inflections and context (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("satin", "en-US", "NN")).toBe("ˈsætən");
    expect(engine.predict("satins", "en-US", "NNS")).toBe("ˈsætənz");
    expect(engine.predict("satiny", "en-US", "JJ")).toBe("ˈsætəni");
    expect(engine.predict("Latin", "en-US", "JJ")).toBe(disableDict ? "ˈɫætɪn" : "ˈɫætən");
    expect(engine.predict("captain", "en-US", "NN")).toBe("ˈkæptən");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The satin ribbon was softer than the captain.", {
      language: "en-US",
      returnArray: true,
    });
    const satin = tokens.find(token => token.word.toLowerCase() === "satin")?.phoneme;
    expect(satin).toBe("ˈsætən");
    expect(tokens.find(token => token.word.toLowerCase() === "captain")?.phoneme).toBe("ˈkæptən");
  });
});
