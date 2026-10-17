import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("weak stian rimes, rules=%s", disableDict => {
  it("retains the root affricate after target eviction and through composition", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["christian", "christians", "unchristian", "nonchristian", "christianize"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    expect(engine.predict("christian")).toBe("ˈkɹɪstʃən");
    for (const word of ["christians", "unchristian", "nonchristian", "christianize"])
      expect(engine.predict(word)?.replace(/ˌ/g, "")).toMatch(/kɹɪstʃən/);
  });
  it("preserves u-root and stressed hiatus instead of merging them", () => {
    const engine = new EnglishG2P({ disableDict });
    // Only the suffix boundary is asserted; proper-name root vowels differ by route.
    for (const word of ["fustian", "proustian", ...(disableDict ? ["faustian"] : [])]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toMatch(/stiən$/);
    expect(engine.predict("christianna")).toBe("ˌkɹɪstiˈænə");
    for (const [word, ipa] of [["bastion", "ˈbæstʃən"], ["question", "ˈkwɛstʃən"], ["suggestion", "səˈdʒɛstʃən"]])
      expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps noun, adjective and verb controls in full sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const sentence of ["The Christian reader is here.", "A Christian is here."])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "Christian")?.phoneme).toBe("ˈkɹɪstʃən");
    expect(api.phonemize("They question the record.", { language: "en-US", returnArray: true }).find(t => t.word === "question")?.phoneme).toBe("ˈkwɛstʃən");
  });
});
