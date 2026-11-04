import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("fused modal and be (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test("retains both complete words and their forms", () => {
    expect(engine.predict("maybe")).toBe("ˈmeɪbi");
    expect(engine.predict("maybes")).toBe("ˈmeɪbiz");
    expect(engine.predict("canbe")).toBe("ˈkænbi");
    expect(engine.predict("wouldbe")).toBe("ˈwʊdbi");
    for (const word of ["beam", "bean", "beat", "mayor"])
      expect(engine.predict(word)).not.toMatch(/bi$/);
  });
  test("retains caller-supplied components and explicit whole-word readings", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("can", "ˈzɛŋ");
    custom.addPronunciation("be", "ˈtu");
    expect(custom.predict("canbe")).toBe("ˈzɛŋtu");
    custom.addPronunciation("canbe", "ˈkɛŋ");
    expect(custom.predict("canbe")).toBe("ˈkɛŋ");
  });
  test("keeps the adverb and separate modal phrase in context", () => {
    const api = createPhonemizer({ processors: [engine] });
    for (const sentence of ["Maybe they will leave.", "It may be ready."]) {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.length).toBeGreaterThan(1);
      if (sentence.startsWith("Maybe")) expect(tokens[0].phoneme).toBe("ˈmeɪbi");
      else expect(tokens.find(token => token.word === "may")?.phoneme).toBeTruthy();
    }
  });
  test.each([
    ["A record may be available.", "record", "N"],
    ["They may record the show.", "record", "V"],
    ["The present record may be available.", "present", "ADJ"],
  ])("preserves contextual %s", (sentence, word, pos) => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
  });
});
