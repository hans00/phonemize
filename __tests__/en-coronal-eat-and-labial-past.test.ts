import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])("keeps singleton eat and labial past vowels after eviction (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const word of ["sweat", "sweats", "sweaty", "sweater", "sweating", "threat", "threats", "threaten", "threatened", "threatening", "dreamt", "leapt"]) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary);
 for (const word of ["sweat", "sweats", "sweaty", "sweater", "sweating"]) expect(e.predict(word)).toContain("swɛt");
 for (const word of ["threat", "threats", "threaten", "threatened", "threatening"]) expect(e.predict(word)).toContain("θɹɛt");
 expect(e.predict("dreamt")).toContain("dɹɛm"); expect(e.predict("leapt")).toMatch(/[lɫ]ɛpt/);
 for (const word of ["sweet", "sweeter", "sweatt", "sweatman", "treat", "threatt", "dream", "dreamed", "leap"]) expect(e.predict(word)).toContain("i");
 // The pinned dictionary selects the accepted short leaped variant on lexical hits.
 expect(e.predict("leaped")).toContain(disableDict ? "i" : "ɛ");
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["They treat the threat.", "The sweater was sweaty.", "They threaten the guard."]) {
  const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
  for (const token of out.filter(t => /^(?:threat|sweat)/.test(t.word))) expect(token.phoneme).toContain("ɛ");
 }
});
test("preserves an explicit eat root owner", () => {
 const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("threat", "ˈtɛst");
 expect(e.predict("threat")).toBe("ˈtɛst"); expect(e.predict("threats")).toBe("ˈtɛsts");
});
