import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Transparent adjectival in- allomorphs reuse their independently vouched roots.
describe.each([false, true])("assimilated negative adjective roots, rules=%s", disableDict => {
  it("keeps stress and complete roots through eviction and inflection", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["irrational", "illegal", "immoral", "immortal", "improbable"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [
      ["irrational", "ˌɪˈɹæʃənəɫ"], ["irrationally", "ˌɪˈɹæʃənəɫi"],
      ["illegal", "ˌɪˈɫiɡəɫ"], ["illegally", "ˌɪˈɫiɡəɫi"],
      ["immoral", "ˌɪˈmɔɹəɫ"], ["immortal", "ˌɪˈmɔɹtəɫ"],
      ["immortals", "ˌɪˈmɔɹtəɫz"], ["improbable", "ˌɪmˈpɹɑbəbəɫ"],
      ["improbably", "ˌɪmˈpɹɑbəbɫi"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves earlier weak-root and opaque-word controls", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("irresponsible")).toBe("ˌɪɹəˈspɑnsəbəɫ");
    expect(engine.predict("irreligious")).toBe("ˌɪɹəˈɫɪdʒəs");
    expect(engine.predict("immigrate")).toBe("ˈɪməˌɡɹeɪt");
    expect(engine.predict("irritable")).toMatch(/^ˈɪɹ[əɪ]təbəɫ$/);
    expect(engine.predict("improvisational")).toMatch(/ˈzeɪʃənəɫ$/);
  });
  it("accepts both complete independently vouched impious readings", () => {
    // Merriam-Webster lists both, so the older variant is not a bad expectation.
    expect(["ˈɪmpiəs", "ˌɪmˈpaɪəs"]).toContain(new EnglishG2P({ disableDict }).predict("impious"));
  });
  it("respects caller phonemic boundaries and whole children", () => {
    for (const [root, word, prefix] of [["rational", "irrational", "ˌɪɹ"], ["legal", "illegal", "ˌɪɫ"],
      ["moral", "immoral", "ˌɪm"], ["possible", "impossible", "ˌɪm"]]) {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      engine.addPronunciation(root, "ˈzɛŋ");
      expect(engine.predict(word)).toBe(prefix + "ˈzɛŋ");
      engine.addPronunciation(word, "ˈbɛŋ");
      expect(engine.predict(word)).toBe("ˈbɛŋ");
    }
  });
  it("retains caller weak vowels without applying lexical weakening", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.irreligious;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("religious", "ɹiˈzɛŋ");
    expect(engine.predict("irreligious")).toBe("ˌɪɹiˈzɛŋ");
  });
  it("preserves adjective, noun and verb controls in full prose", () => {
    const api = createPhonemizer({processors: [new EnglishG2P({ disableDict })]});
    const out = api.phonemize("The illegal reader read the improbable story yesterday.", {language: "en-US", returnArray: true});
    for (const [word, ipa] of [["illegal", "ˌɪˈɫiɡəɫ"], ["reader", "ˈɹidɝ"], ["read", "ɹɛd"], ["improbable", "ˌɪmˈpɹɑbəbəɫ"]]) {
      expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
    }
  });
});
