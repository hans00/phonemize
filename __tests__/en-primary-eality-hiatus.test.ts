import EnglishG2P from "../src/en/g2p";
import { parseIpa } from "../scripts/context-ipa";
import { createPhonemizer } from "../src/core";
// Strong a in -eality has its own nucleus; weak -ealistic is a separate class.
test.each([false, true])("retains primary eality hiatus after eviction (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const word of ["reality", "realities", "unreality", "unrealities"]) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary);
 for (const [word, ipa] of [["reality", "ɹiˈæləti"], ["realities", "ɹiˈælətiz"], ["unreality", "ənɹiˈæləti"], ["unrealities", "ənɹiˈælətiz"]]) expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
 expect(e.predict("unrealistically")).toContain("ɹiə");
 if (!disableDict) expect(e.predict("realistic")).toContain("ɹiə");
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["The reality was harsh.", "The virtual reality system was clear.", "They described reality."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "reality")?.phoneme).toContain("iˈæ");
});
test("keeps caller-owned strong eality nuclei", () => {
 const e = new EnglishG2P({ disableDict: true });
 e.addPronunciation("reality", "ˈtɛst");
 expect(e.predict("reality")).toBe("ˈtɛst");
 expect(e.predict("realities")).toBe("ˈtɛsts");
});
