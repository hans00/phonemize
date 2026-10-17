import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";
test("keeps a determined nominal head before a finite relative clause", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 for (const sentence of ["It was a school record that lasted until 1974.", "They broke a school record which was famous."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "record")?.phoneme).toMatch(/^ˈɹɛ/);
 for (const sentence of ["They saw a man record that speech.", "They saw a man record that gifted presenter."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "record")?.phoneme).toMatch(/ˈkɔɹd/);
 const tagger = new SimplePOSTagger();
 const words = ["a", "school", "record", "that", "lasted", "until", "1974", "."];
 expect(tagger.tagWord("record", ["school", "that"], { words, index: 2 }).pos).toBe("N");
});
test("uses a determined plural subject before a cardinal object with tense controls", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 for (const sentence of ["The labels read 1879.", "These labels read three lines.", "Although its labels read 1879, the distillery was founded in 1826."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹid");
 for (const sentence of ["The workers read three reports yesterday.", "They read three reports yesterday.", "During his first audition, James read four scenes."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
});
