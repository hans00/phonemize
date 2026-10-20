import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;

test("quantified plural subjects retain noun and adjective modifiers", () => {
 expect(pick("Many modern offset presses use computer-to-plate systems.", "use")).toBe("juz");
 expect(pick("Many competition production companies permit photography at events.", "permit")).toContain("ˈmɪt");
 expect(pick("These active cells produce collagenous fibers.", "produce")).toContain("ˈdus");
});
test("nominal uses and adjective readings remain distinct", () => {
 expect(pick("Many computer uses were documented.", "uses")).toBe("ˈjusəz");
 expect(pick("Many live recordings were released.", "live")).toBe("ɫaɪv");
 expect(pick("The permit was issued.", "permit")).toMatch(/^ˈpɝ/);
});
test("past and modal read retain their own tense", () => {
 expect(pick("Many modern students read reports at night yesterday.", "read")).toBe("ɹɛd");
 expect(pick("Many modern students will read reports at night.", "read")).toBe("ɹid");
});
