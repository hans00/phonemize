import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
function cold(disableDict: boolean) {
  const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
  for (const word of ["high", "sigh", "weigh", "sleigh"]) delete dictionary[word];
  Reflect.set(engine, "dictionary", dictionary); return engine;
}
describe.each([false, true])("silent GH plural coda after root eviction, rules=%s", disableDict => {
  test("IGH/EIGH roots compose the regular vowel-final plural", () => {
    const engine = cold(disableDict);
    for (const [word, ipa] of [["highs", "ˈhaɪz"], ["sighs", "ˈsaɪz"], ["weighs", "ˈweɪz"], ["sleighs", "ˈsɫeɪz"], ["zighs", "ˈzaɪz"]]) {
      expect(engine.predict(word)).toBe(ipa); expect(engine.predict(word.toUpperCase())).toBe(ipa);
    }
    // Existing caller-owned roots retain their real coda and vowel.
    engine.addPronunciation("high", "ˈtɛst"); expect(engine.predict("highs")).toBe("ˈtɛsts");
    engine.addPronunciation("leigh", "ˈli"); expect(engine.predict("leighs")).toBe("ˈɫiz");
  });
  test("voiceless consonant and supplied lexical-root controls remain distinct", () => {
    const engine = cold(disableDict);
    for (const word of ["coughs", "laughs"]) expect(engine.predict(word)).toMatch(/fs$/);
    for (const word of ["rights", "lights"]) expect(engine.predict(word)).toMatch(/ts$/);
    for (const word of ["ice", "nice", "price"]) expect(engine.predict(word)).toMatch(/s$/);
    expect(engine.predict("thighs")).toBe("ˈθaɪz");
  });
  test("noun, adjective and finite-verb sentences retain the root vowel and plural coda", () => {
    const api = createPhonemizer({ processors: [cold(disableDict)] });
    const out = api.phonemize("He sighs at the highs. She weighs the sleighs. The high shelf holds bright lights.", { language: "en-US", returnArray: true });
    for (const token of out.filter(t => /^(sighs|highs|weighs|sleighs)$/.test(t.word))) expect(token.phoneme).toMatch(/(?:aɪ|eɪ)z$/);
    expect(out.find(t => t.word === "high")?.phoneme).toMatch(/haɪ/);
    expect(out.find(t => t.word === "lights")?.phoneme).toMatch(/ts$/);
  });
});
