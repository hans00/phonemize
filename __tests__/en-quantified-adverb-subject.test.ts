import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
function reading(sentence: string, word: string) { return api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme; }
test.each(["Many people actually read such publications.", "Several people read such publications.", "They ask how many people actually read such publications."])("quantifiers supply plural agreement across adverbs: %s", sentence => {
 expect(reading(sentence, "read")).toBe("ɹid");
});
test("temporal cues and bare names retain past readings", () => {
 for (const sentence of ["Many people actually read such publications yesterday.", "James read four scenes.", "During his first audition, James read four scenes.", "Daggs read three reports yesterday."]) expect(reading(sentence, "read")).toBe("ɹɛd");
});
test("quantified object frames distinguish nouns and verbs", () => {
 expect(reading("Others contest such proposals.", "contest")).toContain("ˈtɛst");
 expect(reading("The contest was fair.", "contest")).toMatch(/^ˈkɑn/);
 expect(reading("Both players discard cards.", "discard")).toContain("ˈskɑɹd");
 expect(reading("The discard pile is large.", "discard")).toMatch(/^ˈdɪs/);
 expect(reading("The unit has a read bus.", "read")).toBe("ɹid");
 expect(reading("They rejected an invalid ISBN.", "invalid")).toContain("ˈvæ");
});
