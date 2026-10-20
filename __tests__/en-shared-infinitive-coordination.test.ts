import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";
import { hasFiniteObjectFrame, inferVerbForm, simplePOSTagger } from "../src/en/pos-tagger";

const sentenceWords = (sentence: string) => sentence.match(/[A-Za-z]+|[^\sA-Za-z]/g) ?? [];

describe("shared infinitive and quantified-subject verb frames", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
  const target = (sentence: string, word: string) => phonemizer.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word.toLowerCase() === word)?.phoneme;

  it("carries the infinitive reading across an or-coordinated predicate", () => {
    const sentence = "The possibility of free will to choose or reject God matters.";
    const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "reject");
    const context = { words, index };
    expect(simplePOSTagger.tagWord("reject", ["or", "God"], context).pos).toBe("V");
    expect(inferVerbForm(context)).toBe("base");
    expect(target(sentence, "reject")).toBe("ɹɪˈdʒɛkt");
  });

  it("uses a direct-object frame after bare quantifier all", () => {
    const sentence = "Though not all reject it entirely, some do.";
    const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "reject");
    expect(hasFiniteObjectFrame({ words, index })).toBe(true);
    expect(simplePOSTagger.tagWord("reject", ["all", "it"], { words, index }).pos).toBe("V");
    expect(target(sentence, "reject")).toBe("ɹɪˈdʒɛkt");
  });

  it("keeps coordinated noun phrases from inheriting a prepositional to", () => {
    const sentence = "They traveled to the store or market after lunch.";
    const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "market");
    expect(simplePOSTagger.tagWord("market", ["or", "after"], { words, index }).pos).not.toBe("V");
  });

  it("preserves the noun sense after all when no direct-object clause follows", () => {
    expect(target("Not all content is accurate.", "content")).toBe("ˈkɑntɛnt");
  });
});
