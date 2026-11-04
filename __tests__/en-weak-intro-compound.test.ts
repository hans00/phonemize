import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("bound intro- before a stressed root (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it.each([
    ["introduce", "ˌɪntɹəˈdus"],
    ["introduced", "ˌɪntɹəˈdust"],
    ["introducing", "ˌɪntɹəˈdusɪŋ"],
    ["introduces", "ˌɪntɹəˈdusəz"],
    ["introduction", "ˌɪntɹəˈdʌkʃən"],
  ])("uses the weak combining form in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  it("preserves free intro-, head-stressed compounds, and related roots", () => {
    expect(engine.predict("intro", "en-US")).toBe("ˈɪntɹoʊ");
    expect(engine.predict("introvert", "en-US")).toBe("ˈɪntɹoʊˌvɝt");
    if (!disableDict) {
      expect(engine.predict("introspect", "en-US")).toBe("ˈɪntɹəˌspɛkt");
      expect(engine.predict("introspection", "en-US")).toBe("ˌɪntɹəˈspɛkʃən");
    }
  });

  it("preserves sentence tokens and POS controls", () => {
    const api = createPhonemizer({ processors: [engine] });
    const sentence = api.phonemize("I introduce a new concept.", { language: "en-US", returnArray: true });
    expect(sentence.map(token => token.phoneme)).toEqual(["aɪ", "ˌɪntɹəˈdus", "ə", "nu", "ˈkɑnsɛpt", "."]);
    expect(engine.predict("introduce", "en-US", "V")).toBe("ˌɪntɹəˈdus");
    expect(engine.predict("introduce", "en-US", "NN")).toBe("ˌɪntɹəˈdus");
  });
});
