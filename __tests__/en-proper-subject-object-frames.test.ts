import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const api = () => createPhonemizer({ processors: [new EnglishG2P()] });
it.each([
  "Gout was associated with overindulgence in alcohol and rich food and Hogarth uses it here for that purpose.",
  "Handel uses both polyphonic and homophonic settings to illustrate the text best.",
  "Hogarth uses it.", "Hogarth uses it there.", "Hogarth uses it successfully.",
  "Hogarth uses it for painting.", "Handel uses all orchestral instruments.",
  "The artist works and Handel uses both orchestral and vocal settings.",
  "The artist works, but Handel uses it carefully.",
])("recognizes a proper finite subject and its object: %s", sentence => {
  expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === "uses")?.phoneme).toBe("ˈjuzəz");
});
it.each([
  ["Handel records both include a chorus.", "records"],
  ["Handel records both are damaged.", "records"],
  ["Handel records it makes include the aria.", "records"],
  ["The school records it sent include every event.", "records"],
  ["Handel Records Both Classical Covers.", "Records"],
])("preserves nominal relatives and title-case name frames: %s", (sentence, word) => {
  expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe("ˈɹɛkɝdz");
});
it.each([
  ["The record was clear.", "record", "ˈɹɛkɝd"],
  ["The present moment matters.", "present", "ˈpɹɛzənt"],
  ["They present the award.", "present", "pɹɪˈzɛnt"],
])("preserves noun, adjective and verb controls: %s", (sentence, word, ipa) => {
  expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme).toBe(ipa);
});
it("preserves caller-supplied target pronunciation", () => {
  const engine = new EnglishG2P();
  engine.addPronunciation("uses", "ˈzɛmp");
  const own = createPhonemizer({ processors: [engine] });
  expect(own.phonemize("Hogarth uses it here.", { language: "en-US", returnArray: true }).find(segment => segment.word === "uses")?.phoneme).toBe("ˈzɛmp");
});
