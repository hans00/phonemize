import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

it.each([false, true])("recognizes an explicit passive agent without changing used-to senses (%s)", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  for (const [sentence, expected] of [
    ["The car was used by Alice.", "juzd"],
    ["The car is now used by Alice.", "juzd"],
    ["The car was often used by Alice.", "juzd"],
    ...(!disableDict ? [["She is used to the noise.", "just"], ["She used to live here.", "just"]] : []),
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "used")?.phoneme.replace(/[ˈˌ]/g, "")).toBe(expected);
});
it("assigns a participle from syntax independently of the lemma", () => {
  const tagger = new SimplePOSTagger();
  for (const word of ["used", "painted", "dogged"]) {
    const words = ["It", "was", "often", word, "by", "Alice", "."];
    expect(tagger.tagWord(word, ["often", "by"], { words, index: 3 }).pos).toBe("VBN");
  }
});
