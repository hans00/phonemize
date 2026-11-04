import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";
import { SimplePOSTagger } from "../src/en/pos-tagger";

const tagger = new SimplePOSTagger();
const tag = (words: string[], word: string) => {
  const index = words.indexOf(word);
  return tagger.tagWord(word, [words[index - 1], words[index + 1]], { words, index }, true).pos;
};

test("a plural subject remains available after a prepositional modifier", () => {
  expect(tag(["The", "vapors", "of", "the", "metal", "combine", "rapidly", "with", "oxygen", "."], "combine")).toBe("V");
  expect(tag(["The", "pages", "of", "the", "historical", "record", "list", "events", "."], "record")).toBe("N");
  expect(tag(["Rational", "analyses", "began", "to", "replace", "empiricism", "."], "analyses")).toBe("N");
  expect(tag(["The", "uses", "of", "the", "metal", "combine", "are", "varied", "."], "combine")).toBe("N");
});

test("the public pipeline preserves the verb and noun readings in complete sentences", () => {
  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true })
    .find(token => token.word === word)?.phoneme;
  expect(phone("The vapors of the metal combine rapidly with oxygen.", "combine")).toBe("kəmˈbaɪn");
  expect(phone("The uses of the metal combine are varied.", "combine")).toBe("ˈkɑmbaɪn");
  expect(phone("The pages of the historical record list events.", "record")).toBe("ˈɹɛkɝd");
  expect(engine.predict("combine", "en-US", "V")).toBe("kəmˈbaɪn");
  expect(engine.predict("combine", "en-US", "N")).toBe("ˈkɑmbaɪn");
});
