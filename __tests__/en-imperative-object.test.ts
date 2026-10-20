import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

test("initial bare predicates govern closed modified plural objects", () => {
  const tagger = new SimplePOSTagger();
  for (const verb of ["Invite", "Record", "Reconstruct"]) {
    const words = [verb, "public", "officials", "."];
    expect(tagger.tagWord(verb, ["", "public"], { words, index: 0 }).pos).toBe("V");
  }
});
test("adjectival forms and unclosed noun fragments retain their previous route", () => {
  const tagger = new SimplePOSTagger();
  for (const word of ["Invalid", "Polish", "Learned"]) {
    const words = [word, "public", "officials", "."];
    expect(tagger.tagWord(word, ["", "public"], { words, index: 0 }).pos).not.toBe("V");
  }
  const words = ["Record", "public", "officials"];
  expect(tagger.tagWord("Record", ["", "public"], { words, index: 0 }).pos).not.toBe("V");
});
test("public API distinguishes imperative, nominal and past readings", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
  expect(pick("Invite public officials.", "invite")).toContain("ˈvaɪt");
  expect(pick("Record official responses.", "record")).toContain("ˈkɔɹd");
  expect(pick("Read public excerpts.", "read")).toBe("ɹid");
  expect(pick("The record was clear.", "record")).toMatch(/^ˈɹɛ/);
  expect(pick("He read public excerpts yesterday.", "read")).toBe("ɹɛd");
  expect(pick("He will read public excerpts.", "read")).toBe("ɹid");
});
