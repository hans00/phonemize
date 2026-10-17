import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
it.each([
  ["These methods permit some of these measurements.", "permit", "pɝˈmɪt"],
  ["Accessories for typical multimeters permit some of these measurements.", "permit", "pɝˈmɪt"],
  ["The parks permit some people need is expensive.", "permit", "ˈpɝmɪt"],
  ["The permits some people need are expensive.", "permits", "ˈpɝmɪts"],
  ["He did no contest.", "contest", "ˈkɑntɛst"],
])("preserves finite and nominal readings in %s", (sentence, word, ipa) => {
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
});
