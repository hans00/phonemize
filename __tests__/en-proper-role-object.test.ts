import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

describe.each([false, true])("proper object with a following role, rules=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  it.each([
    ["Afterwards, Sable uses Venom as bait.", "uses", "ˈjuzəz"],
    ["The stable uses Mozart for its music.", "uses", "ˈjuzəz"],
    ["Stable uses remain important.", "uses", "ˈjusəz"],
    ["The usable records Mozart collected remain valuable.", "records", "ˈɹɛkɝdz"],
    ["The usable records Mozart collected were preserved.", "records", "ˈɹɛkɝdz"],
    ["Reliable records Mozart played remain clear.", "records", "ˈɹɛkɝdz"],
    ...(!disableDict ? [["Phylogenetic analyses demonstrates a common ancestry.", "analyses", "əˈnæɫəˌsiz"]] : []),
  ])("keeps the complete clause: %s", (sentence, word, ipa) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
it.each(["uses", "records", "permits"])("shares role-object syntax for %s", target => {
  const words = ["The", "stable", target, "Mozart", "for", "its", "music", "."];
  expect(new SimplePOSTagger().tagWord(target, ["stable", "Mozart"], { words, index: 2 }).pos).toBe("V");
});

it("keeps an adjective-modified noun before another predicate", () => {
  const words = ["Phylogenetic", "analyses", "demonstrates", "a", "common", "ancestry", "."];
  expect(new SimplePOSTagger().tagWord("analyses", ["Phylogenetic", "demonstrates"], { words, index: 1 }).pos).toBe("N");
});
