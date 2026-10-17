import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";
test.each([false, true])("voices nx before a PRICE hiatus after eviction (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const word of Object.keys(dictionary)) if (/anxiet/.test(word)) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary);
 expect(parseIpa(e.predict("anxiety")!)).toEqual(parseIpa("æŋˈzaɪəti"));
 for (const word of ["anxieties", "antianxiety", "nonanxiety", "anxietylike", "enxiety"]) expect(e.predict(word)).toMatch(/ˈzaɪ/);
 for (const word of ["anxious", "anxiously", "anxiousness"]) expect(e.predict(word)).toContain("ŋkʃ");
 for (const word of ["lynx", "minx", "bronx"]) expect(e.predict(word)).toContain("ŋks");
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["Anxiety makes her anxious.", "They examine anxious patients."]) {
  const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
  for (const token of out.filter(t => t.word.toLowerCase() === "anxiety")) expect(token.phoneme).toMatch(/ˈzaɪ/);
  for (const token of out.filter(t => t.word === "anxious")) expect(token.phoneme).toContain("ŋkʃ");
  for (const token of out.filter(t => t.word === "examine")) expect(token.phoneme).toContain("ɡˈzæm");
 }
});
test("retains an explicit anxiety root through plural restoration", () => {
 const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("anxiety", "ˈtɛst");
 expect(e.predict("anxiety")).toBe("ˈtɛst"); expect(e.predict("anxieties")).toBe("ˈtɛsts");
});
