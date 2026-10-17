import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Oxford/MW infrastructure retain head stress; Cambridge infrared retains root stress.
describe.each([false, true])("relative prefixes and owned roots, rules=%s", disableDict => {
  it("preserves noun stress and neutral derivation after eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["infrastructure", "infrastructural"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    expect(engine.predict("infrastructure")).toBe("ˈɪnfɹəˌstɹʌktʃɝ");
    expect(engine.predict("infrastructural")).toBe("ˈɪnfɹəˌstɹʌktʃɝəɫ");
    expect(engine.predict("structure")).toBe("ˈstɹʌktʃɝ");
    expect(engine.predict("structural")).toBe("ˈstɹʌktʃɝəɫ");
  });
  it("preserves root-headed adjectives and existing vowel conventions", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("infrared")).toBe(disableDict ? "ˌɪnfɹəˈɹɛd" : "ˌɪnfɹɝˈɛd");
    expect(engine.predict("supranational")).toBe("ˌsupɹəˈnæʃənəɫ");
    expect(engine.predict("supranatural")).toBe("ˌsupɹəˈnætʃɝəɫ");
    expect(engine.predict("natural")).toBe("ˈnætʃɝəɫ");
  });
  it("keeps caller prefix/root and child ownership", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.infrared;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("infra", "ˈzɛŋ");
    engine.addPronunciation("red", "ˈkɛŋ");
    expect(engine.predict("infrared")).toBe("ˌzɛŋˈkɛŋ");
    engine.addPronunciation("infrared", "ˈbɛŋ");
    expect(engine.predict("infrared")).toBe("ˈbɛŋ");
  });
  it("preserves a full adjective, agent noun and finite verb sentence", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const out = api.phonemize("The supranational reader read the notes yesterday.", {language: "en-US", returnArray: true});
    expect(out.find(token => token.word === "supranational")?.phoneme).toBe("ˌsupɹəˈnæʃənəɫ");
    expect(out.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(out.find(token => token.word === "read")?.phoneme).toBe("ɹɛd");
  });
});
