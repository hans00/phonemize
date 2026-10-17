import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])("stressed open e retains FLEECE before single s-ity (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const key of Object.keys(dictionary)) if (/obes/.test(key)) delete dictionary[key];
 Reflect.set(e, "dictionary", dictionary);
 for (const word of ["obesity", "obesities", "nonobesity"]) expect(e.predict(word)).toContain("ˈbis");
 expect(e.predict("mesity")).toMatch(/^ˈmis/);
 for (const word of ["necessity", "density", "intensity"]) expect(e.predict(word)).toContain("ɛ");
 const api = createPhonemizer({ processors: [e] });
 const out = api.phonemize("They avoid obesity in dense communities.", { language: "en-US", returnArray: true });
 expect(out.find(t => t.word === "obesity")!.phoneme).toContain("ˈbis");
 expect(out.find(t => t.word === "dense")!.phoneme).toContain("dɛns");
 expect(out.find(t => t.word === "avoid")!.phoneme).toContain("ˈvɔɪd");
});
