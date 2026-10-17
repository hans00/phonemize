import { inferVerbForm } from "../src/en/pos-tagger";
import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
describe("partitive reduced passive", () => {
  it("does not infer a participle from a noun followed by by", () => {
    const words = "It is a good read by a famous author".split(" ");
    expect(inferVerbForm({ words, index: 4 })).toBeUndefined();
  });
  it.each([
    ["It is one of the books still read by English speakers today.", "ɹɛd"],
    ["It will be one of the books read by Alice.", "ɹɛd"],
    ["The students still read by the window.", "ɹid"],
    ["Some of the students still read by the window.", "ɹid"],
    ["It is one of the books I read by candlelight.", "ɹid"],
  ])("preserves the reading in %s", (sentence, ipa) => {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(out.find(token => token.word === "read")?.phoneme).toBe(ipa);
  });
});
