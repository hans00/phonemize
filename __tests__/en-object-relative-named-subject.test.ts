import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

describe.each([false, true])("object-relative named subjects, rules=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  it.each([
    ["The techniques which Batman uses are clear.", "uses", "ˈjuzəz"],
    ["We discussed the technique which Batman uses.", "uses", "ˈjuzəz"],
    ["Which Batman records are clear?", "records", "ˈɹɛkɝdz"],
    ["She knows which Batman records are available.", "records", "ˈɹɛkɝdz"],
    ["The city records local residents collected are archived.", "records", "ˈɹɛkɝdz"],
    ["The various uses require care.", "uses", "ˈjusəz"],
    ...(!disableDict ? [["The notes that Sable records are clear.", "records", "ɹɪˈkɔɹdz"]] : []),
  ])("preserves the clause and paired noun: %s", (sentence, word, ipa) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
it.each(["uses", "records", "permits", "winds"])("uses one relative-clause frame for %s", target => {
  const words = ["The", "notes", "which", "Sable", target, "are", "clear", "."];
  expect(new SimplePOSTagger().tagWord(target, ["Sable", "are"], { words, index: 4 }).pos).toBe("V");
});
