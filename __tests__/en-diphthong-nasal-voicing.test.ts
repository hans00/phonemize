import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("diphthong before weak nasal, rules=%s", disableDict => {
  it("voices the licensed rimes and their inflections", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["poison", "ˈpɔɪzən"], ["poisons", "ˈpɔɪzənz"], ["poisoned", "ˈpɔɪzənd"], ["poisoning", "ˈpɔɪzənɪŋ"],
      ["raisin", "ˈɹeɪzɪn"],
    ]) expect(engine.predict(word)).toBe(ipa);
    for (const word of ["raisins", "raisin's", "raisins'"]) expect(engine.predict(word)).toMatch(/^ˈɹeɪz[əɪ]nz$/);
  });
  it("keeps the neighboring voiceless rimes", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const word of ["bison", "basin", "mason", "noisome"])
      expect(engine.predict(word)).toMatch(/s/);
  });
  it("preserves complete caller overrides", () => {
    for (const stem of ["poison", "raisin"]) {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      delete dictionary[stem + "s"];
      Reflect.set(engine, "dictionary", dictionary);
      engine.addPronunciation(stem, "ˈzɛŋ");
      expect(engine.predict(stem)).toBe("ˈzɛŋ");
      expect(engine.predict(stem + "s")).toBe("ˈzɛŋz");
    }
  });
  it("retains noun, adjective and verb sentence context", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ["The poison is here.", "poison", "ˈpɔɪzən"], ["They poison the water.", "poison", "ˈpɔɪzən"],
      ["The noisome air is here.", "noisome", "ˈnɔɪsəm"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
