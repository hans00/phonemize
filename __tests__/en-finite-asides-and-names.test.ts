import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("finite asides and nominal labels, rules=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  it("retains agreement through an aside and numbered objects", () => {
    for (const sentence of [
      "His design, patented in 1820 and 1835, uses easy-to-handle planks arranged diagonally.",
      "NSA uses two serial protocols for key fill.",
      "The Japan Meteorological Agency uses 10-minute sustained winds.",
      "Cooper uses Dean Guitars and EMG pickups.",
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toBe("ˈjuzəz");
  });
  it("preserves noun lists, possessives and a separate finite predicate", () => {
    for (const sentence of [
      "The industrial uses guide is here.",
      "Cooper's uses for the device are clear.",
      "The guide, records, uses and permits are listed.",
    ]) {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "uses")?.phoneme).toBe("ˈjusəz");
    }
  });
});

it("does not infer present tense merely from a following cardinal object", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const sentence of [
    "During his first audition, Daggs read four scenes from the pilot.",
    "He read four scenes yesterday.",
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
});
