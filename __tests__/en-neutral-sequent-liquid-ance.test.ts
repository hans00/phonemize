import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])("bound sequent and liquid-ance frames survive root eviction (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const key of Object.keys(dictionary)) if (/sequent|fragra|vibra/.test(key)) delete dictionary[key];
 Reflect.set(e, "dictionary", dictionary);
 for (const word of ["subsequent", "subsequents", "subsequently"]) expect(e.predict(word)).toMatch(/^ˈsʌbsəkwənt/);
 expect(e.predict("consequent")).toBe("ˈkɑnsəkwənt");
 expect(e.predict("sequence")).toMatch(/^ˈsi/); expect(e.predict("frequent")).toMatch(/^ˈfɹi/);
 for (const word of ["fragrance", "fragrances", "fragrant", "plagrance"]) expect(e.predict(word)).toContain("eɪɡɹ");
 for (const word of ["vibrance", "vibrant"]) expect(e.predict(word)).toContain("vaɪbɹ");
 expect(e.predict("fragment")).toContain("fɹæɡ"); expect(e.predict("balance")).toContain("bæɫ");
 expect(e.predict("remembrance")).toContain("ˈmɛm"); expect(e.predict("resemblance")).toContain("ˈzɛm");
 const api = createPhonemizer({ processors: [e] });
 const out = api.phonemize("They follow subsequent events in sequence and enjoy a fragrant fragrance.", { language: "en-US", returnArray: true });
 expect(out.find(t => t.word === "subsequent")!.phoneme).toMatch(/^ˈsʌbsə/);
 for (const token of out.filter(t => /^(fragrant|fragrance)$/.test(t.word))) expect(token.phoneme).toContain("fɹeɪɡɹ");
 expect(out.find(t => t.word === "follow")!.phoneme).toContain("fɑ");
});
test("caller-owned fragrance roots retain plural ownership", () => {
 const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("fragrance", "ˈtɛst");
 expect(e.predict("fragrances")).toBe("ˈtɛsts");
});
