import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("gerund subject frame (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  const tagged = (sentence: string, word: string) => {
    const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
    const index = words.findIndex(token => token.toLowerCase() === word);
    return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
  };

  test("recognizes the modifier of a gerund subject", () => {
    expect(tagged("Laminate flooring is useful.", "laminate")).toBe("N");
    if (!disableDict) expect(api.phonemize("Laminate flooring is useful.", { language: "en-US" })).toBe("ˈɫæmənət ˈfɫɔɹɪŋ ɪz ˈjusfəɫ.");
  });

  test("retains verbal and adjectival controls", () => {
    expect(tagged("They laminate flooring for sale.", "laminate")).toBe("V");
    expect(tagged("They will laminate the material.", "laminate")).toBe("V");
    expect(tagged("Accurate accounting is important.", "accurate")).not.toBe("N");
    expect(tagged("Separate training is essential.", "separate")).not.toBe("N");
    if (!disableDict) {
      expect(api.phonemize("Live streaming is popular.", { language: "en-US" })).toBe("ɫaɪv ˈstɹimɪŋ ɪz ˈpɑpjəɫɝ.");
      expect(api.phonemize("Lead training is useful.", { language: "en-US" })).toBe("ɫid ˈtɹeɪnɪŋ ɪz ˈjusfəɫ.");
      expect(engine.predict("laminate", "en-US", "N")).toBe("ˈɫæmənət");
      expect(engine.predict("laminate", "en-US", "V")).toBe("ˈɫæməˌneɪt");
      expect(engine.predict("laminate", "en-US", "ADJ")).toBe("ˈɫæməˌneɪt");
    }
  });
});
