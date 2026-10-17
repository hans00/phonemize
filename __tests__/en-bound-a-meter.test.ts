import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("bound a+meter, rules=%s", disableDict => {
  const evicted = (...words: string[]) => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of words) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    return engine;
  };
  it.each([
    ["parameter", "pɝˈæmətɝ"], ["parameters", "pɝˈæmətɝz"],
    ["nonparameter", "nɑnpɝˈæmətɝ"], ["counterparameter", "kaʊntɝpɝˈæmətɝ"],
    ["pentameter", "pɛnˈtæmətɝ"], ["nanometer", "ˈnænoʊmitɝ"],
    ["thermometer", "θɝˈmɑmətɝ"],
  ])("keeps the bound and productive measurement frames: %s", (word, ipa) => {
    expect(evicted("parameter", "parameters").predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("preserves a caller-owned measurement tail and complete target", () => {
    const engine = evicted("parameter");
    engine.addPronunciation("meter", "ˈkɛmp");
    expect(engine.predict("parameter")).toMatch(/kɛmp$/);
    engine.addPronunciation("parameter", "ˈzɛmp");
    expect(engine.predict("parameter")).toBe("ˈzɛmp");
  });
  it.each([
    ["The parameter was clear.", "parameter", "pɝˈæmətɝ"],
    ["The parameter settings changed.", "parameter", "pɝˈæmətɝ"],
  ])("preserves noun/adjective/verb sentence controls: %s", (sentence, word, ipa) => {
    const api = createPhonemizer({ processors: [evicted(word)] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme).toBe(ipa);
  });
});
