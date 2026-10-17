import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("micro-w boundary, rules=%s", disableDict => {
  it("retains the vouched w root and head stress after target eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["microwave", "microwaves", "microwaved", "microwaving", "microwatt", "microwatts", "microwavable", "microwaveable"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [["microwave", "ˈmaɪkɹəˌweɪv"], ["microwaves", "ˈmaɪkɹəˌweɪvz"], ["microwaved", "ˈmaɪkɹəˌweɪvd"], ["microwaving", "ˈmaɪkɹəˌweɪvɪŋ"], ["microwatt", "ˈmaɪkɹəˌwɑt"], ["microwatts", "ˈmaɪkɹəˌwɑts"], ["microwavable", "ˈmaɪkɹəˌweɪvəbəɫ"], ["microwaveable", "ˈmaɪkɹəˌweɪvəbəɫ"]])
      expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves independent neighboring roots and caller phones", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("microbe")).toBe("ˈmaɪkɹoʊb");
    expect(engine.predict("microscope")).toBe("ˈmaɪkɹəˌskoʊp");
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.microwave;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("wave", "ˈzɛŋ");
    expect(engine.predict("microwave")).toBe("ˈmaɪkɹəˌzɛŋ");
    engine.addPronunciation("micro", "ˈkɛŋ");
    expect(engine.predict("microwave")).toBe("ˈkɛŋˌzɛŋ");
    engine.addPronunciation("microwave", "ˈbɛŋ");
    expect(engine.predict("microwave")).toBe("ˈbɛŋ");
  });
  it("keeps noun, attributive and finite verb sentence readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const sentence of ["The microwave is here.", "The microwave oven is here.", "They microwave the soup."])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "microwave")?.phoneme).toBe("ˈmaɪkɹəˌweɪv");
  });
});
