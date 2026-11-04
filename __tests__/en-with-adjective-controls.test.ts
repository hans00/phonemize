import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

test.each([
  ["Octavius intends to become more intimate with her and makes several advances, only to be rebuffed each time.", "intimate", "ˈɪntəmət"],
  ["The guests present with evidence departed.", "present", "ˈpɹɛzənt"],
  ["The guests present with evidence depart.", "present", "ˈpɹɛzənt"],
])("preserves the adjective reading in %s", (sentence, word, expected) => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
});

test("a closed with-complement identifies a plural subject's predicate", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const sentences = [
    ["The vapors combine with oxygen.", "combine", "kəmˈbaɪn"],
    ["In contrast, many common ions give insoluble salts, e.g. halides precipitate with silver, and sulphate precipitate with barium.", "precipitate", "pɹɪˈsɪpɪˌteɪt"],
  ];
  for (const [sentence, word, expected] of sentences) {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
  }
});
