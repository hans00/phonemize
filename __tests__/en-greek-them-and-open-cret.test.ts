import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])("Greek them+vowel keeps theta and open e before cret stays tense (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const key of Object.keys(dictionary)) if (/them|secret/.test(key)) delete dictionary[key];
 Reflect.set(e, "dictionary", dictionary);
 expect(e.predict("theme")).toBe("ˈθim");
 for (const word of ["themes", "themed", "theming", "thematic", "thematically"]) expect(e.predict(word)).toMatch(/^ˈ?θ/);
 for (const word of ["them", "themselves", "they"]) expect(e.predict(word)).toMatch(/^ˈ?ð/);
 for (const word of ["secret", "secrets", "secretly", "secretory"]) expect(e.predict(word)).toMatch(/^ˈsikɹ/);
 expect(e.predict("zecret")).toMatch(/^ˈzikɹ/);
 expect(e.predict("secretary")).toMatch(/^ˈsɛkɹ/); expect(e.predict("decrepit")).toContain("ˈkɹɛp");
 expect(e.predict("secretory")).toContain("ɔɹi");
 const api = createPhonemizer({ processors: [e] });
 const out = api.phonemize("They record a secret theme for themselves.", { language: "en-US", returnArray: true });
 expect(out.find(t => t.word === "theme")!.phoneme).toBe("θim");
 expect(out.find(t => t.word === "secret")!.phoneme).toMatch(/^ˈsikɹ/);
 expect(out.find(t => t.word === "record")!.phoneme).toContain("ˈkɔɹd");
 expect(out.find(t => t.word === "themselves")!.phoneme).toMatch(/^ð/);
});
test("caller theme roots own their inflections", () => {
 const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("theme", "ˈtɛst");
 expect(e.predict("themes")).toBe("ˈtɛsts"); expect(e.predict("themed")).toBe("ˈtɛstɪd");
});
