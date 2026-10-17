import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// MW Chinese and Maltese confirm the root vowels and suffix primary stress.
describe.each([false, true])("vouched weak-a demonyms, rules=%s", disableDict => {
  it("retains the last stressed root foot after target eviction", () => {
    for (const [word, base, ipa, root] of [
      ["chinese", "china", "tʃaɪˈniz", "ˈtʃaɪnə"],
      ["maltese", "malta", "mɔɫˈtiz", "ˈmɔɫtə"],
    ]) {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      engine.addPronunciation(base, root);
      expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    }
  });
  it("composes an OOV family and respects complete target overrides", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("xempa", "ˈzɛmpə");
    expect(engine.predict("xempese")).toBe("ˌzɛmˈpiz");
    engine.addPronunciation("xempese", "ˈkɛŋ");
    expect(engine.predict("xempese")).toBe("ˈkɛŋ");
  });
  it("keeps posttonic full vowels on the existing whole-word path", () => {
    const engine = new EnglishG2P({ disableDict });
    const before = engine.predict("xempese");
    engine.addPronunciation("xempa", "ˈzɛnoʊmə");
    expect(engine.predict("xempese")).toBe(before);
    engine.addPronunciation("xempa", "zəˈzɛmpə");
    expect(engine.predict("xempese")).toBe(before);
    expect(engine.predict("veronese")).toBe("ˌvɛɹəˈniz");
    expect(engine.predict("cheese")).toBe("ˈtʃiz");
    expect(engine.predict("these")).toBe("ˈðiz");
  });
  it("preserves noun, adjective and verb sentence readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ["They speak Chinese.", "Chinese", "tʃaɪˈniz"],
      ["The Chinese teacher is here.", "Chinese", "tʃaɪˈniz"],
      ["They play the game.", "play", "pɫeɪ"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });
});
