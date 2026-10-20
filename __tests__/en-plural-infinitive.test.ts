import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;

test("plural subjects license silent-e predicates governing infinitives", () => {
  for (const sentence of ["The monks refuse to capitulate.", "Both speakers refuse to talk.", "Many local restaurants refuse to host events."]) expect(pick(sentence, "refuse")).toContain("ˈfjuz");
  expect(pick("The neighbours live to entertain guests.", "live")).toBe("ɫɪv");
});
test("nominal, adjective and zero-change tense controls remain separate", () => {
  expect(pick("The refuse was collected.", "refuse")).toMatch(/^ˈɹɛ/);
  expect(pick("The neighbours are close to the house.", "close")).toBe("kɫoʊs");
  expect(pick("The neighbours read to the children yesterday.", "read")).toBe("ɹɛd");
  expect(pick("The neighbours will read to the children.", "read")).toBe("ɹid");
});
