import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
it.each([
  ["She is a well-read woman.", "ɹɛd"],
  ["He wrote a much-read treatise.", "ɹɛd"],
  ["They are widely-read books.", "ɹɛd"],
  ["He was much read in Serbia.", "ɹɛd"],
  ["The book was well read by Alice.", "ɹɛd"],
  ["They can well read the notice.", "ɹid"],
  ["The read-only file is safe.", "ɹid"],
  ["They read well.", "ɹid"],
])("preserves participles and base controls in %s", (sentence, ipa) => {
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
});
