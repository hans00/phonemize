import { simplePOSTagger, inferVerbForm } from "../src/en/pos-tagger";
import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

it.each(["Can", "Will", "May", "Might", "Must", "Should", "Could", "Shall", "Would"])("retains the inverted subject in %s they freely present", modal => {
  const words = [modal, "they", "freely", "present", "?"];
  expect(simplePOSTagger.tagWord("present", ["freely", "?"], { words, index: 3 }).pos).toBe("V");
  expect(inferVerbForm({ words, index: 3 })).toBe("base");
});

it("applies to an unseen predicate with stacked adverbs", () => {
  const words = ["May", "we", "freely", "gladly", "zembriate", "?"];
  expect(simplePOSTagger.tagWord("zembriate", ["gladly", "?"], { words, index: 4 }).pos).toBe("V");
});

it("preserves an adjective and a noun beside the questioned verb", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const tokens = api.phonemize("Can they freely present the present record?", { language: "en-US", returnArray: true });
  expect(tokens.filter(t => ["present", "record"].includes(t.word)).map(t => t.phoneme))
    .toEqual(["pɹɪˈzɛnt", "ˈpɹɛzənt", "ˈɹɛkɝd"]);
});

it("retains nominal can, will and might frames", () => {
  for (const modal of ["can", "will", "might"]) {
    const words = ["The", "free", modal, "broadly", "present", "across", "cultures"];
    expect(simplePOSTagger.tagWord("present", ["broadly", "across"], { words, index: 4 }).pos).not.toBe("V");
  }
});
