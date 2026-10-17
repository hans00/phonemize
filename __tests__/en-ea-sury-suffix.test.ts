import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])("keeps weak sure-to-sury palatalization after ea (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const w of ["treasury", "treasuries", "treasury's", "nontreasury", "treasuryless"]) delete dictionary[w];
 Reflect.set(e, "dictionary", dictionary);
 for (const w of ["treasury", "treasuries", "treasury's", "nontreasury", "treasuryless"]) expect(e.predict(w)).toContain("ʒɝi");
 for (const w of ["accessory", "nursery", "Esarey"]) expect(e.predict(w)).not.toContain("ʒ");
 expect(e.predict("insure")).toContain("ʃ");
 if (!disableDict) expect(e.predict("usury")).toContain("z");
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["The treasury was empty.", "The treasury official spoke."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "treasury")?.phoneme).toContain("ʒɝi");
});
test("keeps caller-owned sure-to-sury stems", () => {
 const e = new EnglishG2P({ disableDict: true });
 e.addPronunciation("treasury", "ˈtɛst");
 expect(e.predict("treasuries")).toBe("ˈtɛsts");
});
