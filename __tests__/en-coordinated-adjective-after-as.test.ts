import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

const engine = new EnglishG2P();
const api = createPhonemizer({ processors: [engine] });
const sentenceWords = (sentence: string) => sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];

describe("adjectival coordination after as", () => {
  test("uses adjective agreement to resolve an ambiguous first conjunct", () => {
    const sentence = "The assembly was classified as learned and ignorant.";
    const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "learned");
    expect(engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos).toBe("ADJ");
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ˈɫɝnɪd");
  });

  test("preserves finite past and explicit passive controls", () => {
    expect(api.phonemize("They learned the lesson and taught the class.", { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ɫɝnd");
    expect(api.phonemize("He was learned by scholars.", { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ɫɝnd");
    expect(api.phonemize("He was very learned.", { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ˈɫɝnɪd");
  });

});
