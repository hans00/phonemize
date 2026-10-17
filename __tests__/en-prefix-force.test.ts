import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge accord/afford: primary FORCE survives the weak -ford suffix.
describe.each([false, true])("closed assimilated prefixes, disableDict=%s", disableDict => {
  it("preserves the root across eviction and derivation", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["accord", "afford", "affordable"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [
      ["accord", "əˈkɔɹd"], ["accords", "əˈkɔɹdz"],
      ["accordance", "əˈkɔɹdəns"], ["afford", "əˈfɔɹd"],
      ["affords", "əˈfɔɹdz"], ["affordable", "əˈfɔɹdəbəɫ"],
      ["affordance", "əˈfɔɹdəns"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves adjacent weak rhotic endings", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("allard")).toBe("ˈæɫɝd");
    expect(engine.predict("allert")).toBe("ˈæɫɝt");
    expect(engine.predict("stafford")).toBe("ˈstæfɝd");
    expect(engine.predict("counterman")).toBe(disableDict ? "ˈkaʊntɝmən" : "ˈkaʊntɝˌmæn");
    expect(engine.predict("cooper")).toBe("ˈkupɝ");
  });
  it("retains noun, adjective and verb context", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const out = api.phonemize("The accord was affordable and they can afford it.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["accord", "əˈkɔɹd"], ["affordable", "əˈfɔɹdəbəɫ"], ["afford", "əˈfɔɹd"]]) {
      expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
    }
  });
  it("preserves caller-owned roots and explicit derived words", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("afford", "ˈzɛŋ");
    expect(engine.predict("affords")).toBe("ˈzɛŋz");
    engine.addPronunciation("affords", "ˈkɛŋ");
    expect(engine.predict("affords")).toBe("ˈkɛŋ");
  });
});

// MW admits both strong and weak cooperative endings; compare the prefix only.
describe("vouched co- roots", () => {
  it("retains separate prefix vowels without stealing longer prefixes", () => {
    const engine = new EnglishG2P({ disableDict: true });
    expect(engine.predict("coefficient")).toBe("ˌkoʊɪˈfɪʃənt");
    expect(engine.predict("coarticulate")).toBe("ˌkoʊɑɹˈtɪkjəˌɫeɪt");
    expect(engine.predict("cooperative")).toMatch(/^ˌkoʊˈɑp/);
    expect(engine.predict("counterman")).toBe("ˈkaʊntɝmən");
    expect(engine.predict("cooper")).toBe("ˈkupɝ");
  });
  it.each([false, true])("respects caller prefix, root and child ownership (%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.coarticulate;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("co", "ˈzɛŋ");
    engine.addPronunciation("articulate", "ˈkɛŋ");
    expect(engine.predict("coarticulate")).toBe("ˌzɛŋˈkɛŋ");
    engine.addPronunciation("coarticulate", "ˈbɛŋ");
    expect(engine.predict("coarticulate")).toBe("ˈbɛŋ");
  });
});
