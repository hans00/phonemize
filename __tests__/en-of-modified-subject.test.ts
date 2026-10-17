import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";
test("recovers the singular subject head across a bounded of phrase", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 for (const sentence of ["The Council of the European Union uses records.", "The union of the councils uses records.", "The council of a union uses records.", "The Council of the European Union uses 'Qualified majority voting'."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toContain("juz");
 const tagger = new SimplePOSTagger();
 for (const target of ["uses", "records", "presents"]) {
  const words = ["The", "council", "of", "the", "union", target, "records", "."];
  expect(tagger.tagWord(target, ["union", "records"], { words, index: 5 }).pos).toBe("V");
 }
});
test("keeps noun uses and plural head agreement controls", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 for (const sentence of ["The uses of the union are varied.", "The council of the union uses are varied.", "They discuss the council of the union uses."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toContain("jus");
});

test("keeps noun and finite readings in the same original sentence", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 const sentence = "The uses of the union are varied; the council of the union uses records.";
 const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true }).filter(t => t.word === "uses");
 expect(tokens).toHaveLength(2); expect(tokens[0].phoneme).toContain("jus"); expect(tokens[1].phoneme).toContain("juz"); expect(tokens[1].position).toBeGreaterThan(tokens[0].position);
});
