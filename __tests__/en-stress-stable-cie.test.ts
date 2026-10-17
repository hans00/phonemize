import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("stress-stable Latin cie, rules=%s", disableDict => {
  it("keeps the complete singular rime when species leaves the table", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.species;
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [
      ["specie", "ˈspiʃi"], ["species", "ˈspiʃiz"], ["species'", "ˈspiʃiz"], ["specie's", "ˈspiʃiz"],
      ["speciation", "spiʃiˈeɪʃən"],
    ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("preserves the existing y stress, vowel teams and ordinary names", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["prophecy", "ˈpɹɑfəsi"], ["prophecies", "ˈpɹɑfəsiz"],
      ["fleecies", "ˈfɫisiz"], ["leslie", "ˈɫɛsɫi"], ["lucie", "ˈɫusi"],
      ["policies", "ˈpɑɫəsiz"], ["agencies", "ˈeɪdʒənsiz"], ["mercies", "ˈmɝsiz"],
      ["specify", "ˈspɛsəfaɪ"], ["specimen", "ˈspɛsəmən"], ["specious", "ˈspiʃəs"],
    ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it.each(["specie", "specy"])("respects a supplied %s stem and full child", stem => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.species;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation(stem, "ˈzɛŋ");
    expect(engine.predict("species")).toBe("ˈzɛŋz");
    engine.addPronunciation("species", "ˈkɛŋ");
    expect(engine.predict("species")).toBe("ˈkɛŋ");
  });
  it("preserves noun, adjective and verb sentence controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const sentence of ["The species is rare.", "The species are rare.", "The report specifies the species.", "The species-specific result is clear."])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "species")?.phoneme).toBe("ˈspiʃiz");
    expect(api.phonemize("They specify the details.", { language: "en-US", returnArray: true }).find(t => t.word === "specify")?.phoneme.replace(/ˌ/g, "")).toBe("ˈspɛsəfaɪ");
  });
});
