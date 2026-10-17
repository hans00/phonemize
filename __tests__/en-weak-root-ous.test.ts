import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("weak disyllabic ous roots, rules=%s", disableDict => {
  it("recovers neutral adjectives after whole-target eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["poisonous", "perilous", "libelous"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [["poisonous", "ˈpɔɪzənəs"], ["perilous", "ˈpɛɹəɫəs"], ["libelous", "ˈɫaɪbəɫəs"]])
      expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves stress-shifting and vowel-final root environments", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["portentous", "pɔɹˈtɛntəs"], ["courageous", "kɝˈeɪdʒəs"], ["gelatinous", "dʒəˈɫætənəs"],
      ["gracious", "ˈɡɹeɪʃəs"], ["hideous", "ˈhɪdiəs"], ["various", "ˈvɛɹiəs"], ["phosphorous", "ˈfɑsfɝəs"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });
  it("retains supplied root and complete-child pronunciation ownership", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.poisonous;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("poison", "ˈzɛŋ");
    expect(engine.predict("poisonous")).toBe("ˈzɛŋəs");
    engine.addPronunciation("poisonous", "ˈkɛŋ");
    expect(engine.predict("poisonous")).toBe("ˈkɛŋ");
  });
});
it("preserves noun, adjective and verb sentence readings", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const [sentence, word, ipa] of [
    ["The poison is here.", "poison", "ˈpɔɪzən"], ["They poison the water.", "poison", "ˈpɔɪzən"],
    ["The poisonous substance is here.", "poisonous", "ˈpɔɪzənəs"],
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
});
