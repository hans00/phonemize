import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

test("bare plural subjects govern verbs before participial plural objects", () => {
  const tagger = new SimplePOSTagger();
  for (const [subject, verb, modifier, object] of [
    ["Residents", "construct", "themed", "scarecrows"],
    ["Engineers", "reconstruct", "damaged", "bridges"],
    ["Researchers", "record", "selected", "performances"],
  ]) expect(tagger.tagWord(verb, [subject, modifier], { words: [subject, verb, modifier, object, "."], index: 1 }).pos).toBe("V");
});
test("public API preserves verb/noun contrasts and unaffected nominal clauses", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const reading = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
  expect(reading("Residents construct themed scarecrows.", "construct")).toContain("ˈstɹʌkt");
  expect(reading("The construct was useful.", "construct")).toMatch(/^ˈkɑn/);
  expect(reading("Researchers record selected performances.", "record")).toContain("ˈkɔɹd");
  expect(reading("The record was clear.", "record")).toMatch(/^ˈɹɛ/);
  for (const sentence of ["The strongest winds hit Wales.", "Strong winds also uprooted trees."]) expect(reading(sentence, "winds")).toBe("wɪndz");
  expect(reading("Incorrect diagnoses include migraines.", "diagnoses")).toContain("oʊsiz");
  expect(reading("During his first audition, Daggs read four scenes from the pilot.", "read")).toBe("ɹɛd");
  expect(reading("Many people actually read such publications.", "read")).toBe("ɹid");
});
