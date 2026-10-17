import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
it.each([
  ["These methods permit preventing damage.", "permit", "pɝˈmɪt"],
  ["The rules permit recording conversations.", "permit", "pɝˈmɪt"],
  ["The camping permit hanging on the wall is expired.", "permit", "ˈpɝmɪt"],
  ["The parks permit hanging on the wall is expired.", "permit", "ˈpɝmɪt"],
  ["The Adams Extract building continued production.", "Extract", "ˈɛkstɹækt"],
  ["These permits are valid.", "permits", "ˈpɝmɪts"],
])("preserves finite and nominal frames in %s", (sentence, word, ipa) => {
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
});
