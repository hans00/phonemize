import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("MOUTH in the temporal now root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("uses /aʊ/ in now and nowadays", () => {
    expect(rules.predict("now", "en-US")).toBe("ˈnaʊ");
    expect(rules.predict("nowadays", "en-US")).toBe("ˈnaʊədeɪz");
  });

  it("keeps GOAT in the distinct know/snow and nowhere frames", () => {
    expect(rules.predict("know", "en-US")).toBe("ˈnoʊ");
    expect(rules.predict("snow", "en-US")).toBe("ˈsnoʊ");
    expect(rules.predict("nowhere", "en-US")).toBe("ˈnoʊˌwɛɹ");
    expect(rules.predict("nowaday", "en-US")).toBe("ˈnaʊəˌdeɪ");
  });

  it("preserves both readings in sentence context", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("Now, nowadays we know why.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "Now")?.phoneme).toBe("naʊ");
    expect(tokens.find(token => token.word === "nowadays")?.phoneme).toBe("ˈnaʊədeɪz");
    expect(tokens.find(token => token.word === "know")?.phoneme).toBe("noʊ");
  });
});
