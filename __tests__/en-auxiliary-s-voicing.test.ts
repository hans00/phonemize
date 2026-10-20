import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("auxiliary citation s versus lexical codas, rules=%s", disableDict => {
  test("present auxiliaries retain voiced citation endings", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("has")).toBe("ˈhæz");
    expect(engine.predict("is")).toBe("ˈɪz");
    expect(engine.predict("his")).toBe("ˈhɪz");
    expect(engine.predict("its")).toMatch(/ts$/);
    expect(engine.predict("was")).toMatch(/z$/);
    for (const word of ["gas", "hiss", "this", "thus", "us"]) expect(engine.predict(word)).toMatch(/s$/);
  });
  test("full sentences preserve weak auxiliaries and ordinary nouns", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const out = api.phonemize("He has a gas stove. The record is clear.", { language: "en-US", returnArray: true });
    expect(out.find(t => t.word === "has")!.phoneme).toBe("həz");
    expect(out.find(t => t.word === "is")!.phoneme).toBe("ɪz");
    expect(out.find(t => t.word === "gas")!.phoneme).toMatch(/ɡæs$/);
  });
  test("caller-owned roots retain their supplied citation output", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const word of ["has", "is", "was"]) { engine.addPronunciation(word, "ˈtɛst"); expect(engine.predict(word)).toBe("ˈtɛst"); }
  });
});
test("the rules path voices the past auxiliary without imposing a citation vowel on does", () => {
  const engine = new EnglishG2P({ disableDict: true });
  expect(engine.predict("was")).toMatch(/z$/);
  expect(engine.predict("does")).toMatch(/z$/);
});
