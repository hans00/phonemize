import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";
test("recognizes a negative adjective before an acronym noun head", () => {
 const t = new SimplePOSTagger();
 for (const [word, acronym] of [["invalid", "ISBN"], ["unavailable", "TCP"], ["illegal", "PDF"], ["insensitive", "API"]]) expect(t.tagWord(word, ["an", acronym], { words: ["an", word, acronym], index: 1 }).pos).toBe("ADJ");
 for (const [word, following] of [["content", "CSV"], ["record", "JSON"], ["invalid", "employer"]]) expect(t.tagWord(word, ["a", following], { words: ["a", word, following], index: 1 }).pos).toBe("N");
});
test("keeps invalid adjective and patient-noun readings in full sentences", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 const ipa = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)!.phoneme;
 for (const sentence of ["It is an invalid ISBN.", "The invalid ID was rejected."]) expect(ipa(sentence, "invalid")).toMatch(/ˈvæ/);
 for (const sentence of ["The invalid employer spoke.", "He became a permanent invalid.", "He became a confirmed invalid, but he worked.", "He was a prominent invalid."]) expect(ipa(sentence, "invalid")).toMatch(/^ˈɪn/);
 for (const sentence of ["They declared a document invalid.", "They marked a component invalid.", "They deemed a president invalid.", "Was a document invalid?", "Why was a document invalid?", "They found a seed invalid.", "They found a breed invalid."]) expect(ipa(sentence, "invalid")).toMatch(/ˈvæ/);
 expect(ipa("A content CSV was saved.", "content")).toMatch(/^ˈkɑ/);
});
test("keeps repeated adjective and noun occurrences independent", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 const words = api.phonemize("They rejected an invalid ISBN and assisted a permanent invalid.", { language: "en-US", returnArray: true }).filter(t => t.word === "invalid");
 expect(words).toHaveLength(2);
 expect(words[0].phoneme).toMatch(/ˈvæ/);
 expect(words[1].phoneme).toMatch(/^ˈɪn/);
 expect(words[0].position).toBeLessThan(words[1].position);
});
