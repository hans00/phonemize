import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
// Preserve the voiceless compound boundary before east, like think/thought.
// Primary stress in isolated directional compounds remains a separate issue.
test.each([false, true])("preserves th before east after eviction (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 const forms = ["southeast", "southeast's", "southeastern", "southeastern's", "southeasterly", "southeastward", "southeastness", "nonsoutheastern", "northeast", "northeastern"];
 for (const word of forms) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary);
 for (const word of forms) for (const pos of ["N", "ADJ"]) expect(e.predict(word, "en-US", pos)).toContain("θ");
 for (const word of ["southern", "southerly", "mother", "feather", "bother"]) expect(e.predict(word)).toContain("ð");
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["The southeast was quiet.", "The southeastern coast was quiet.", "The winds blew southeast."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^southeast/.test(t.word))?.phoneme).toContain("θ");
});
test("preserves an explicit directional root", () => {
 const e = new EnglishG2P({ disableDict: true });
 e.addPronunciation("southeast", "ˈwɑð");
 expect(e.predict("southeast")).toBe("ˈwɑð");
 expect(e.predict("southeastness")).toBe("ˈwɑðnəs");
});
