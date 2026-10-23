import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
function cold(disableDict: boolean) {
  const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
  delete dictionary.with; Reflect.set(engine, "dictionary", dictionary); return engine;
}
describe.each([false, true])("grammatical dental and uppercase recovery, rules=%s", disableDict => {
  test("the grammatical root remains voiced after eviction and in uppercase", () => {
    const engine = cold(disableDict);
    expect(engine.predict("with")).toBe("ˈwɪð"); expect(engine.predict("WITH")).toBe("ˈwɪð");
    for (const word of ["within", "without"]) expect(engine.predict(word)).toMatch(/ɪ[ˈˌ]?ð/);
    for (const word of ["myth", "pith", "Smith", "both", "forth", "beneath", "underneath"]) expect(engine.predict(word)).toMatch(/θ/);
    // Longer lexical stems are not the one-syllable grammatical compound tail.
    expect(engine.predict("withington")).toMatch(/θ/);
    expect(engine.predict("withith")).toMatch(/ð.*θ$/);
    expect(engine.predict("bothith")).not.toMatch(/ð/);
  });
  test("explicit initialisms and short-token spelling remain available", () => {
    const engine = cold(disableDict);
    expect(engine.predict("CPU")).toBe(disableDict ? "ˌsiˌpiˈju" : "ˈsiˈpiˈju"); expect(engine.predict("TTS")).toBe("ˈtiˈtiˈɛs");
    if (disableDict) { expect(engine.predict("US")).toBe("ˈjuˈɛs"); expect(engine.predict("IT")).toBe("ˈaɪˈti"); expect(engine.predict("WHO")).toBe("ˈdʌbəɫjuˈeɪtʃˈoʊ"); }
    engine.addPronunciation("with", "ˈtɛst");
    expect(engine.predict("WITH")).toBe("ˈtɛst"); expect(engine.predict("with's")).toBe("ˈtɛsts");
  });
  test("full-sentence noun, adjective and finite-verb controls stay distinct", () => {
    const api = createPhonemizer({ processors: [cold(disableDict)] });
    const out = api.phonemize("Smith reads a myth with her. The pithy author reads within the room without fear.", { language: "en-US", returnArray: true });
    for (const token of out.filter(t => /^(Smith|myth|pithy)$/.test(t.word))) expect(token.phoneme).toMatch(/θ/);
    for (const token of out.filter(t => /^(with|within|without)$/.test(t.word))) expect(token.phoneme).toMatch(/ɪ[ˈˌ]?ð/);
    expect(api.phonemize("WITH HER, they read it yesterday.", { language: "en-US", returnArray: true }).find(t => t.word === "WITH")?.phoneme).toMatch(/wɪð/);
  });
});
test("default spelling hints, apostrophe clipping and reading contrasts remain intact", () => {
  const api = createPhonemizer({ processors: [cold(false)] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  expect(pick('Mr. Pastie ("PASS-tee") is a brand name pasty.', "PASS")).toBe("pæs");
  expect(pick("She read with him yesterday.", "read")).toBe("ɹɛd");
  expect(pick("She will read with him.", "read")).toBe("ɹid");
  expect(cold(false).predict("somethin'")?.replace(/[ˈˌ]/g, "")).toBe("sʌmθɪn");
});
