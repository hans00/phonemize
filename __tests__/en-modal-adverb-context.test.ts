import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { inferVerbForm, SimplePOSTagger } from "../src/en/pos-tagger";

it("retains the bare verb through adverbs after every modal", () => {
  for (const modal of ["can", "could", "will", "would", "may", "might", "must", "shall", "should"]) {
    const words = ["They", modal, "gladly", "read", "the", "book"];
    const context = { words, index: 3 };
    expect(new SimplePOSTagger().tagWord("read", ["gladly", "the"], context).pos).toBe("V");
    expect(inferVerbForm(context)).toBe("base");
  }
});

it("does not turn nominal or prepositional modal spellings into auxiliaries", () => {
  for (const words of [
    ["the", "will", "plainly", "invalid"],
    ["a", "can", "clearly", "invalid"],
    ["in", "May", "particularly", "invalid"],
    ["John's", "might", "plainly", "invalid"],
  ]) expect(new SimplePOSTagger().tagWord("invalid", [words[2]], { words, index: 3 }).pos).not.toBe("V");
});

it("preserves free-will noun phrases with and without a determiner", () => {
  for (const words of [
    ["Her", "choices", "reflect", "free", "will", "broadly", "present", "across", "cultures"],
    ["She", "values", "the", "free", "will", "broadly", "present", "across", "cultures"],
    ["Free", "will", "broadly", "present", "across", "cultures"],
  ]) {
    const index = words.indexOf("present");
    expect(new SimplePOSTagger().tagWord("present", ["broadly", "across"], { words, index }).pos).not.toBe("V");
  }
});

describe.each([false, true])("modal adverb sentences, rules=%s", disableDict => {
  it("keeps complete sentences and noun/adjective controls", () => {
    expect(new SimplePOSTagger().tagWord("invite", ["the", "is"]).pos).toBe("N");
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ["They might gladly invite people.", "invite", disableDict ? "ɪnˈvaɪt" : "ˌɪnˈvaɪt"],
      ["They may eventually record the song.", "record", disableDict ? "ɹiˈkɔɹd" : "ɹɪˈkɔɹd"],
      ["The book is here.", "book", "bʊk"],
      ["The valid record is here.", "valid", "ˈvæɫɪd"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
