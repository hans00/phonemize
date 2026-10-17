import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])("keeps strong assimilated-prefix ow and weak controls (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const word of Object.keys(dictionary)) if (/allow/.test(word)) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary);
 for (const word of ["allow", "allows", "allowed", "allowing", "allowance", "allowances", "disallow", "disallowed", "appow"]) expect(e.predict(word)).toContain("aʊ");
 for (const word of ["arrow", "arrowsmith", "fallow", "follow", "below", "slow"]) expect(e.predict(word)).toContain("oʊ");
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["They allow the change.", "The allowance was small.", "The allowed amount was small."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^allow/.test(t.word))?.phoneme).toContain("aʊ");
});
test("keeps the caller's ow root through inflection", () => {
 const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("allow", "ˈtɛst");
 expect(e.predict("allow")).toBe("ˈtɛst"); expect(e.predict("allows")).toBe("ˈtɛsts"); expect(e.predict("allowed")).toBe("ˈtɛstɪd");
});
