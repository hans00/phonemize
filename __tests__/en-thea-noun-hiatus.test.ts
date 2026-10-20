import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
function cold(disableDict: boolean) {
  const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
  for (const word of Object.keys(dictionary)) if (/theat/.test(word)) delete dictionary[word];
  Reflect.set(engine, "dictionary", dictionary); return engine;
}
test.each([false, true])("Greek dental-rhotic noun tails preserve ea hiatus after eviction, rules=%s", disableDict => {
  const engine = cold(disableDict);
  for (const word of ["theater", "theatre"]) expect(engine.predict(word)).toBe("ˈθiətɝ");
  for (const word of ["theaters", "theatres", "theater's", "theatre's"]) expect(engine.predict(word)).toBe("ˈθiətɝz");
  for (const word of ["amphitheater", "amphitheatre", "xenotheater"]) expect(engine.predict(word)).toMatch(/θiətɝ$/);
  expect(engine.predict("theatreless")).toBe("ˈθiətɝɫəs");
  expect(engine.predict("theatreful")).toBe("ˈθiətɝfəɫ");
  expect(engine.predict("theatregoer")).toBe("ˈθiətɝˌɡoʊɝ");
  for (const word of ["they", "them", "these", "themselves", "therefore"]) expect(engine.predict(word)).toMatch(/^ˈ?ð/);
  expect(engine.predict("wheat")).toMatch(/it$/);
  for (const word of ["area", "urea"]) expect(engine.predict(word)).toMatch(/iə$/);
  const api = createPhonemizer({ processors: [engine] });
  const out = api.phonemize("They perform plays at the theater near the theatre.", { language: "en-US", returnArray: true });
  for (const t of out.filter(t => /^theat(?:er|re)$/.test(t.word))) expect(t.phoneme).toBe("ˈθiətɝ");
});
test("default adjective and finite verb controls retain their full readings", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const out = api.phonemize("They record a theatrical performance at the theater.", { language: "en-US", returnArray: true });
  expect(out.find(t => t.word === "record")!.phoneme).toContain("ˈkɔɹd");
  expect(out.find(t => t.word === "theatrical")!.phoneme).toBe("θiˈætɹɪkəɫ");
});
test.each([false, true])("caller-owned Greek noun roots retain their plural and possessive, rules=%s", disableDict => {
  const engine = cold(disableDict); engine.addPronunciation("theatre", "ˈtɛst");
  expect(engine.predict("theatres")).toBe("ˈtɛsts"); expect(engine.predict("theatre's")).toBe("ˈtɛsts");
  expect(engine.predict("theatreless")).toBe("ˈtɛstɫəs");
  expect(engine.predict("theatreful")).toBe("ˈtɛstfəɫ");
  expect(engine.predict("theatregoer")).toBe("ˈtɛstˌɡoʊɝ");
});
