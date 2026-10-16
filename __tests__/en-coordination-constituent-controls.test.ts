import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

const api = createPhonemizer({ processors: [new EnglishG2P()] });

it.each([
  ["bow", "Iron and steel will bend and bow.", "boʊ"],
  ["expatriate", "The school provides accreditation to local and expatriate students.", "ɛkˈspeɪtɹiət"],
  ["misuse", "He was dismissed on grounds of refusal to teach and misuse of university resources.", "mɪsˈjus"],
])("preserves the contextual reading of %s in a coordinated phrase", (word, sentence, expected) => {
  const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
  expect(tokens.find((token) => token.word === word)?.phoneme).toBe(expected);
});
