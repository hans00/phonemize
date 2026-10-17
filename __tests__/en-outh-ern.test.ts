import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("dental ern rime, rules=%s", disableDict => {
  it("recovers the whole root with its target entry removed", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.southern;
    Reflect.set(engine, "dictionary", dictionary);
    expect(engine.predict("southern")).toBe("ˈsʌðɝn");
    expect(engine.predict("nonsouthern")?.replace(/ˌ/g, "")).toBe("nɑnˈsʌðɝn");
    expect(engine.predict("unsouthern")?.replace(/ˌ/g, "")).toBe("ənˈsʌðɝn");
    expect(engine.predict("southernmost")?.replace(/ˌ/g, "")).toBe("ˈsʌðɝnmoʊst");
  });
  it("retains independent vouched roots in agent derivations", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.southerner; delete dictionary.southerners;
    Reflect.set(engine, "dictionary", dictionary);
    expect(engine.predict("southerner")).toBe("ˈsʌðɝnɝ");
    expect(engine.predict("southerners")).toBe("ˈsʌðɝnɝz");
  });
  it("preserves agent er and directional word controls", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["mouther", "ˈmaʊðɝ"], ["mouthers", "ˈmaʊðɝz"], ["mouthing", "ˈmaʊðɪŋ"],
      ["south", "ˈsaʊθ"], ["southward", "ˈsaʊθwɝd"], ["southbound", "ˈsaʊθbaʊnd"],
      ["northern", "ˈnɔɹðɝn"],
    ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("preserves literal caller roots and complete children", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.southerner; delete dictionary.southerners;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("southern", "ˈzɛŋ");
    expect(engine.predict("southern")).toBe("ˈzɛŋ");
    expect(engine.predict("southerner")).toBe("ˈzɛŋɝ");
    expect(engine.predict("southerners")).toBe("ˈzɛŋɝz");
    engine.addPronunciation("southerner", "ˈkɛŋ");
    expect(engine.predict("southerner")).toBe("ˈkɛŋ");
  });
});
it("preserves full noun, adjective and verb contexts", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const [sentence, word, ipa] of [
    ["The southern border is clear.", "southern", "ˈsʌðɝn"],
    ["The southerner is here.", "southerner", "ˈsʌðɝnɝ"],
    ["They mouth the words.", "mouth", "maʊð"],
    ["His mouth is dry.", "mouth", "maʊθ"],
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
});
