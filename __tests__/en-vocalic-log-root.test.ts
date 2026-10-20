import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
function cold(disableDict: boolean) {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const key of Object.keys(dictionary)) if (/log/.test(key)) delete dictionary[key];
 Reflect.set(e, "dictionary", dictionary); return e;
}
test.each([false, true])("vocalic log/logue retains its unmerged vowel after root eviction (rules=%s)", rules => {
 const e = cold(rules);
 for (const word of ["log", "logs", "logged", "logging", "catalog", "catalogs", "catalogue", "catalogued", "cataloguing", "dialog", "dialogue", "dialogues", "analogue", "analog", "monologue", "xenologue", "zalogged"]) expect(e.predict(word)).toMatch(/[lɫ]ɔɡ/);
 for (const word of ["clog", "slog", "blog"]) expect(e.predict(word)).toMatch(/[lɫ]ɑɡ/);
 expect(e.predict("logical")).toMatch(/[lɫ]ɑdʒ/);
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["They catalog a logical dialogue.", "They log catalogues.", "The analog signal is clear."]) {
  const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
  for (const token of out.filter(t => /^(catalog|dialogue|log|catalogues|analog)$/.test(t.word))) expect(token.phoneme).toMatch(/[lɫ]ɔɡ/);
  for (const token of out.filter(t => t.word === "logical")) expect(token.phoneme).toMatch(/[lɫ]ɑdʒ/);
 }
});
test.each([false, true])("caller roots own -ue inflections and doubled consonant recovery (rules=%s)", rules => {
 const e = cold(rules); e.addPronunciation("catalogue", "ˈtɛst");
 expect(e.predict("catalogued")).toBe("ˈtɛstɪd"); expect(e.predict("cataloguing")).toBe("ˈtɛstɪŋ");
 e.addPronunciation("log", "ˈtɛst");
 expect(e.predict("logs")).toBe("ˈtɛsts"); expect(e.predict("logged")).toBe("ˈtɛstɪd"); expect(e.predict("logging")).toBe("ˈtɛstɪŋ");
});

test.each(["prologue", "tagalog"])("rebuilt default pipeline preserves the previous reading of %s", word => {
 const e = new EnglishG2P(); expect(e.predict(word)).toMatch(/[lɫ]ɑɡ$/);
});
