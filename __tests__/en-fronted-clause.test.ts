import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const cases: Array<[string, string]> = [
  ["In Cambridge he read the paper.", "ɹɛd"],
  ["While in Oxford she read the report.", "ɹɛd"],
  ["Here is the book whose chapters he read for practice.", "ɹɛd"],
  ["The last book she read was old.", "ɹɛd"],
  ["The letter he read is important.", "ɹɛd"],
  ["They demanded that he read the report tomorrow.", "ɹid"],
  ["They suggested to John he read the report tomorrow.", "ɹid"],
  ["They demanded in Cambridge he read the report tomorrow.", "ɹid"],
  ["I would rather he quickly read.", "ɹɛd"],
  ["I would rather read.", "ɹid"],
  ["She read books every day.", "ɹɛd"],
  ["I read books every day.", "ɹid"],
];
it.each(cases)("preserves finite and mandative readings: %s", (text, ipa) => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
});
it("preserves two occurrences and their clause boundaries", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize("In Cambridge he read it; they read it daily.", { language: "en-US", returnArray: true })
    .filter(t => t.word === "read").map(t => t.phoneme)).toEqual(["ɹɛd", "ɹid"]);
});
