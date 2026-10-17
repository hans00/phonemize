import { SimplePOSTagger } from "../src/en/pos-tagger";
import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const cases: Array<[string, string, string]> = [
  ["The organization uses engines to work.", "uses", "V"],
  ["The department records notes for students.", "records", "V"],
  ["The organization uses vary.", "uses", "!V"],
  ["The department records are missing.", "records", "N"],
  ["The development costs figures are wrong.", "costs", "!V"],
  ["The recording news stories are vivid.", "news", "!V"],
];
it.each(cases)("uses the complete agreeing clause: %s", (text, word, expected) => {
  const words = text.replace(/\./g, "").split(" "), index = words.indexOf(word);
  expect(new SimplePOSTagger().tagWord(word, [words[index - 1], words[index + 1]], { words, index }).pos).toBe(expected);
});
it("keeps contrasting noun and verb readings in full sentences", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const [text, word, ipa] of [
    [cases[0][0], "uses", "ˈjuzəz"],
    [cases[1][0], "records", "ɹɪˈkɔɹdz"],
    [cases[2][0], "uses", "ˈjusəz"],
    [cases[3][0], "records", "ˈɹɛkɝdz"],
  ]) expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
});
