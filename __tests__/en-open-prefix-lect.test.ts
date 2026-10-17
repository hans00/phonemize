import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])("keeps open-prefix lect roots after eviction (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const word of Object.keys(dictionary)) if (/(?:elect|neglect)/.test(word)) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary);
 for (const word of ["elect", "elects", "elected", "electing", "elector", "reelect", "reelected", "neglect", "neglects", "neglected", "neglecting", "neglectful", "nonneglectful"]) expect(e.predict(word)).toMatch(/ˈ[ɡɫl]*ɛkt/);
 for (const word of ["select", "selected", "reflect", "deflect", "belect"]) expect(e.predict(word)).toMatch(/ˈ[fɫl]*ɛkt/);
 expect(e.predict("collect", "en-US", "N")).toMatch(/^ˈkɑ/);
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["They elect the leader.", "The elect are here.", "The neglect was severe.", "They neglect the task."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^(?:elect|neglect)$/.test(t.word))?.phoneme).toMatch(/ˈ[ɡɫl]*ɛkt/);
 expect(api.phonemize("The collect was read.", { language: "en-US", returnArray: true }).find(t => t.word === "collect")?.phoneme).toMatch(/^ˈkɑ/);
 if (!disableDict) for (const word of ["dialect", "intellect"]) expect(e.predict(word)).toMatch(/^ˈ/);
});
test("retains an explicit lect root owner", () => {
 const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("elect", "ˈtɛst");
 expect(e.predict("elect")).toBe("ˈtɛst"); expect(e.predict("elects")).toBe("ˈtɛsts"); expect(e.predict("elected")).toBe("ˈtɛstɪd");
});
