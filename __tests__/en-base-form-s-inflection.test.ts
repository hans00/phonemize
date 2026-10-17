import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
// Existing reading metadata distinguishes the base from same-spelled past.
test.each([false, true])("uses a base-form stem before s (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const w of ["read", "reads"]) delete dictionary[w];
 Reflect.set(e, "dictionary", dictionary);
 expect(e.predict("reads")).toMatch(/ɹidz$/);
 const api = createPhonemizer({ processors: [e] });
 const mixed = api.phonemize("She reads the book, but they read it yesterday.", { language: "en-US", returnArray: true });
 expect(mixed.find(t => t.word === "reads")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("ɹidz");
 expect(mixed.find(t => t.word === "read")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("ɹɛd");
 for (const [sentence, word, reading] of [["The student reads each book.", "reads", "ɹidz"], ["The three reads were enough.", "reads", "ɹidz"], ["They read books yesterday.", "read", "ɹɛd"]]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/[ˈˌ]/g, "")).toBe(reading);
 // Uninflected present read remains a pre-existing error on the rules path.
 if (!disableDict) for (const sentence of ["They read books every day.", "The unit has a read bus."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("ɹid");
 expect(e.predict("uses", "en-US", "N")).toMatch(/s[ɪə]z$/);
 expect(e.predict("uses", "en-US", "V")).toMatch(/z[ɪə]z$/);
});
test("keeps caller ownership of an inflected temporal homograph", () => {
 const e = new EnglishG2P({ disableDict: true });
 e.addPronunciation("read", "ˈɹɛd");
 expect(e.predict("reads")).toBe("ˈɹɛdz");
 e.addPronunciation("reads", "ˈtɛst");
 expect(e.predict("reads")).toBe("ˈtɛst");
});
