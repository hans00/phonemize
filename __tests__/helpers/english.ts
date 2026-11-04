import { createPhonemizer } from "../../src/core";
import EnglishG2P from "../../src/en/g2p";

export const englishTokens = (processor: EnglishG2P, sentence: string) =>
  createPhonemizer({ processors: [processor] }).phonemize(sentence, {
    language: "en-US",
    returnArray: true,
  });

// Clone before eviction so each rule test forces the same table-fallback path.
export function withoutDictionaryEntries(processor: EnglishG2P, words: readonly string[]) {
  const dictionary = { ...Reflect.get(processor, "dictionary") };
  for (const word of words) delete dictionary[word];
  Reflect.set(processor, "dictionary", dictionary);
}
