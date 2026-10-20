import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
function cold(disableDict: boolean) {
  const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
  for (const word of ["thin", "thief", "thigh", "thaw", "thug", "thud", "high", "sigh", "weigh", "sleigh", "neigh"]) delete dictionary[word];
  Reflect.set(engine, "dictionary", dictionary); return engine;
}
describe.each([false, true])("initial content th and vocalic gh roots after eviction, rules=%s", disableDict => {
  test("closed content rimes retain theta in citation and nonce forms", () => {
    const engine = cold(disableDict);
    for (const [word, ipa] of [["thin", "ˈθɪn"], ["thief", "ˈθif"], ["thigh", "ˈθaɪ"], ["thaw", "ˈθɔ"], ["thug", "ˈθʌɡ"], ["thud", "ˈθʌd"], ["thib", "ˈθɪb"]]) { expect(engine.predict(word)).toBe(ipa); expect(engine.predict(word.toUpperCase())).toBe(ipa); }
    for (const word of ["thinner", "thinnest", "thinly", "thinness", "thinned", "thinning", "thieflike", "thief's", "thawing", "thawed", "thuds", "thudded", "thibness"]) expect(engine.predict(word)).toMatch(/^ˈθ/);
  });
  test("vouched function/adverb words retain delta and boundary controls", () => {
    const engine = cold(disableDict);
    for (const word of ["then", "than", "them", "that", "their", "there", "this", "thus", "though", "thou", "thee", "thine", "thence"]) expect(engine.predict(word)).toMatch(/^ˈ?ð/);
    expect(engine.predict("through")).toMatch(/^ˈ?θ/);
    expect(engine.predict("THC")).toBe("ˈtiˈeɪtʃˈsi");
  });
  test("silent igh/eigh plurals use the real vowel coda, not written gh", () => {
    const engine = cold(disableDict);
    for (const [word, ipa] of [["highs", "ˈhaɪz"], ["sighs", "ˈsaɪz"], ["thighs", "ˈθaɪz"], ["weighs", "ˈweɪz"], ["sleighs", "ˈsleɪz"], ["zighs", "ˈzaɪz"]]) expect(engine.predict(word)).toBe(ipa.replace(/l/g, "ɫ"));
    for (const word of ["coughs", "laughs"]) expect(engine.predict(word)).toMatch(/fs$/);
    for (const word of ["rights", "lights"]) expect(engine.predict(word)).toMatch(/ts$/);
    for (const word of ["ice", "nice", "price"]) expect(engine.predict(word)).toMatch(/s$/);
    engine.addPronunciation("high", "ˈtɛst"); expect(engine.predict("highs")).toBe("ˈtɛsts");
  });
  test("noun, adjective and finite verb sentences preserve their own rimes", () => {
    const api = createPhonemizer({ processors: [cold(disableDict)] });
    for (const sentence of ["The thin thief felt a thud.", "They thin the crop.", "Then they thaw it.", "His thighs were sore.", "He sighs at the highs.", "She weighs the sleighs."]) {
      const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
      for (const token of out.filter(t => /^(thin|thief|thud|thaw|thighs)$/.test(t.word))) expect(token.phoneme).toMatch(/^ˈ?θ/);
      for (const token of out.filter(t => /^(sighs|highs|weighs|sleighs)$/.test(t.word))) expect(token.phoneme).toMatch(/z$/);
      for (const token of out.filter(t => t.word === "Then")) expect(token.phoneme).toMatch(/^ˈ?ð/);
    }
  });
});
test("default archaic and tense contrasts remain intact in full sentences", () => {
  const api = createPhonemizer({ processors: [cold(false)] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
  expect(pick("Thy thigh was sore.", "thy")).toBe("ðaɪ");
  expect(pick("Then she read the thin book yesterday.", "read")).toBe("ɹɛd");
  expect(pick("Then she will read the thin book.", "read")).toBe("ɹid");
});

// Decomposition may still need a lexical chunk even when that chunk is rule-exact.
test.each([false, true])("rebuilt dependencies preserve apostrophe clipping, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  expect(engine.predict("somethin'")?.replace(/[ˈˌ]/g, "")).toBe("sʌmθɪn");
  expect(engine.predict("somethin’")?.replace(/[ˈˌ]/g, "")).toBe("sʌmθɪn");
});

test("default phonetic spelling hints retain lexical uppercase chunks after rebuild", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const out = api.phonemize('Mr. Pastie ("PASS-tee") is a brand name pasty, a meat-and-potato turnover product.', { language: "en-US", returnArray: true });
  expect(out.find(token => token.word === "PASS")?.phoneme).toBe("pæs");
});

test("mid-vowel single-coda grammatical readings keep their voiced rule route", () => {
 const engine = new EnglishG2P({ disableDict: true });
 const api = createPhonemizer({ processors: [engine] });
 expect(engine.predict("thon")).toMatch(/^ˈ?ð/);
 expect(api.phonemize('Converse proposed the gender-neutral pronoun "Thon".', { language: "en-US", returnArray: true }).find(t => t.word === "Thon")?.phoneme).toMatch(/^ð/);
});
