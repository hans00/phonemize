import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const sentences = [
  "The AGC had a 16-bit read bus and a 16-bit write bus.",
  "Not all email applications or services support read receipts, and users can generally disable the functionality if they so wish.",
  "Current DNA sequencing technologies, including NGS, are limited on the basis that genomes are much larger than any read length.",
  "TPMmuckraker has attempted to organize its readers to plow through and read document dumps by governmental entities engaging in cover-ups.",
  "Some skills can only be taken by certain classes, such as Read Lips or Animal Empathy.",
];
it.each(sentences)("keeps a shared base/noun reading before a nominal head: %s", sentence => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word.toLowerCase() === "read")?.phoneme).toBe("ɹid");
});
it.each([
  ["They read books every day.", "ɹid"],
  ["They read books yesterday.", "ɹɛd"],
  ["She read documents yesterday.", "ɹɛd"],
  ["The books were read by Alex.", "ɹɛd"],
  ["The book was read during the show.", "ɹɛd"],
  ["The words are often read as names.", "ɹɛd"],
  ["She is a well-read guide.", "ɹɛd"],
])("preserves the finite and participle reading: %s", (sentence, ipa) => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => /(?:^|-)read$/i.test(segment.word))?.phoneme).toMatch(new RegExp(ipa + "$"));
});
it("does not infer a noun POS or override a caller-supplied pronunciation", () => {
  const engine = new EnglishG2P();
  const words = ["support", "read", "receipts"];
  expect(engine.tagWord("read", { prev: "support", next: "receipts", sentence: { words, index: 1 } }).pos).toBe("!V");
  engine.addPronunciation("read", "ˈzɛmp");
  const api = createPhonemizer({ processors: [engine] });
  expect(api.phonemize("They support read receipts.", { language: "en-US", returnArray: true }).find(segment => segment.word === "read")?.phoneme).toBe("ˈzɛmp");
});
