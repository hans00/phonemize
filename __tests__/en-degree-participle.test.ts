import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

test("determined degree phrases before noun heads license adjectives", () => {
  const tagger = new SimplePOSTagger();
  for (const [degree, adjective, head] of [["most", "learned", "scholars"], ["more", "skilled", "researcher"], ["most", "talented", "performers"]]) {
    const words = ["the", degree, adjective, head];
    expect(tagger.tagWord(adjective, [degree, head], { words, index: 2 }).pos).toBe("ADJ");
  }
});
test("degree adjectives retain stress and contrast with finite past and noun readings", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const reading = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)!.phoneme;
  expect(reading("He was one of the most learned monarchs of the time.", "learned")).toBe("ˈɫɝnɪd");
  expect(reading("He learned from the scholars.", "learned")).toBe("ɫɝnd");
  expect(reading("The most learned from their mistakes.", "learned")).toBe("ɫɝnd");
  expect(reading("The very record was clear.", "record")).toMatch(/^ˈɹɛ/);
});
