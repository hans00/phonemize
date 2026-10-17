import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("final velar coda, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each(["length", "strength"])("bridges the final nasal-fricative in %s", word => {
    expect(engine.predict(word)).toMatch(/ŋkθ$/);
    expect(engine.predict(word + "s")).toMatch(/ŋkθs$/);
  });
  it("preserves medial and other nasal codas", () => {
    for (const word of ["lengthwise", "lengthways", "lengthy", "strengthen"])
      expect(engine.predict(word)).toMatch(/ŋθ/);
    expect(engine.predict("tenth")).toBe("ˈtɛnθ");
    expect(engine.predict("song")).toBe("ˈsɔŋ");
  });
  it("keeps caller root and direct child ownership", () => {
    const own = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(own, "dictionary") };
    delete dictionary.lengths;
    Reflect.set(own, "dictionary", dictionary);
    own.addPronunciation("length", "ˈzɛŋθ");
    expect(own.predict("length")).toBe("ˈzɛŋθ");
    expect(own.predict("lengths")).toBe("ˈzɛŋθs");
    own.addPronunciation("lengths", "ˈkɛŋ");
    expect(own.predict("lengths")).toBe("ˈkɛŋ");
  });
  it("retains noun/adjective and verb context", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The lengthy report will strengthen their case with its length and strength.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "length")?.phoneme).toMatch(/ŋkθ$/);
    expect(tokens.find(t => t.word === "strength")?.phoneme).toMatch(/ŋkθ$/);
    expect(tokens.find(t => t.word === "lengthy")?.phoneme).toMatch(/ŋθi$/);
    expect(tokens.find(t => t.word === "strengthen")?.phoneme).toMatch(/ŋθən$/);
  });
});
