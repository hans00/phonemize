import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge lists the disyllabic EDUCATED reading as an adjective.
describe("homograph readings shared across lexical POS", () => {
  it.each(["N", "ADJ"])("selects the educated reading for %s", pos => {
    expect(new EnglishG2P().predict("learned", "en-US", pos)).toBe("ˈɫɝnɪd");
  });
  it.each(["V", "VBD", "!V"])("preserves the complementary reading for %s", pos => {
    expect(new EnglishG2P().predict("learned", "en-US", pos)).toBe("ɫɝnd");
  });
  it("keeps the verb in full prose and the caller's direct override", () => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("They learned the lesson.", { language: "en-US", returnArray: true }).find(t => t.word === "learned")?.phoneme).toBe("ɫɝnd");
    engine.addPronunciation("learned", "ˈzɛŋ");
    expect(engine.predict("learned", "en-US", "ADJ")).toBe("ˈzɛŋ");
  });
});

it("keeps an independently sourced noun/base reading distinct from the participle", () => {
  const engine = new EnglishG2P();
  for (const pos of ["N", "V"]) expect(engine.predict("read", "en-US", pos)).toBe("ɹid");
  for (const pos of ["ADJ", "VBD"]) expect(engine.predict("read", "en-US", pos)).toBe("ɹɛd");
});
