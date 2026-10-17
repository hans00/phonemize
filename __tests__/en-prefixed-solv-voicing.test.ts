import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
// Prefixal stressed solv voices s; solute/solution and free solvent do not.
test.each([false, true])("keeps prefixed solv voicing after eviction (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 const words = ["absolve", "absolves", "absolved", "absolving", "dissolve", "dissolves", "dissolved", "dissolving", "dissolvable", "dissolver", "nondissolving"];
 for (const w of words) delete dictionary[w];
 Reflect.set(e, "dictionary", dictionary);
 for (const w of words) expect(e.predict(w)).toMatch(/z[ɑɔ][lɫ]v/);
 for (const w of ["absolute", "absolution", "dissolute", "dissolution", "solvent", "insolvent"]) expect(e.predict(w)).toContain("s");
 expect(e.predict("resolve")).toMatch(/z[ɑɔ][lɫ]v/);
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["They dissolve the salt.", "The dissolved salt was clear.", "The dissolvable material was clear."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^dissolv/.test(t.word))?.phoneme).toMatch(/z[ɑɔ][lɫ]v/);
});
test("preserves a caller-owned solv root", () => {
 const e = new EnglishG2P({ disableDict: true });
 e.addPronunciation("dissolve", "ˈdɪsɑlv");
 expect(e.predict("dissolve")).toBe("ˈdɪsɑlv");
 expect(e.predict("dissolving")).toMatch(/^ˈdɪsɑ[lɫ]vɪŋ$/);
});
