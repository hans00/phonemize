import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const api = createPhonemizer({ processors: [new EnglishG2P()] });
const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;

test("personal subjects and manner adverbs select bare silent-e predicates", () => {
  expect(pick("They bluntly refuse.", "refuse")).toContain("ˈfjuz");
  expect(pick("They currently live here.", "live")).toBe("ɫɪv");
  expect(pick("They frequently use the record.", "use")).toBe("juz");
});
test("copular inversions and nominal objects preserve adjective and noun readings", () => {
  for (const sentence of ["They are unusually close.", "Were they unusually close?", "Weren't they unusually close?", "They have unusually close ties."]) {
    expect(pick(sentence, "close")).toBe("kɫoʊs");
  }
  expect(pick("The refuse is here.", "refuse")).toMatch(/^ˈɹɛ/);
  expect(pick("They examine the use.", "use")).toBe("jus");
  expect(pick("The live recording is clear.", "live")).toBe("ɫaɪv");
});
test("zero-change past and modal controls retain tense", () => {
  expect(pick("They quietly read the book yesterday.", "read")).toBe("ɹɛd");
  expect(pick("They will quietly read the book.", "read")).toBe("ɹid");
});
