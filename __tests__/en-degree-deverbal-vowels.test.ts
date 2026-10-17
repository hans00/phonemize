import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

function cold(disableDict: boolean) {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const key of Object.keys(dictionary)) if (/residu|retinu|anemic|phonemic|beaut|small|full|tall|gross|alliance|readable|contentment|recordable|refundable/.test(key)) delete dictionary[key];
 Reflect.set(e, "dictionary", dictionary); return e;
}
test.each([false, true])("posttonic i-ue preserves stress and neighboring vowels (rules=%s)", rules => {
 const e = cold(rules);
 for (const w of ["residue", "residues"]) expect(e.predict(w)).toMatch(/^ˈɹɛzə/);
 expect(e.predict("retinue")).toMatch(/^ˈɹɛtən/);
 expect(e.predict("continue")).toContain("ˈtɪn"); expect(e.predict("revenue")).toMatch(/^ˈɹɛvən/);
 const api = createPhonemizer({ processors: [e] });
 const out = api.phonemize("The residue remains while they continue.", { language: "en-US", returnArray: true });
 expect(out.find(t => t.word === "residue")!.phoneme).toContain("ɹɛzə");
 expect(out.find(t => t.word === "continue")!.phoneme).toContain("ˈtɪn");
});
test.each([false, true])("noninitial stressed ne-mic has an open vowel (rules=%s)", rules => {
 const e = cold(rules);
 for (const w of ["anemic", "phonemic", "nonanemic", "zanemic"]) expect(e.predict(w)).toContain("ˈnim");
 for (const w of ["academic", "pandemic", "polemic"]) expect(e.predict(w)).toMatch(/ˈ[^ˈ]*ɛm/);
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["They rejected an anemic plan.", "The phonemic contrast matters."]) {
  const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
  expect(out.find(t => /^(anemic|phonemic)$/.test(t.word))!.phoneme).toContain("ˈnim");
 }
});
test.each([false, true])("English eau before weak t works across syllable boundaries (rules=%s)", rules => {
 const e = cold(rules);
 for (const w of ["beauty", "beauties", "beautiful", "beautifully", "beautify", "beauteous"]) expect(e.predict(w)).toMatch(/^ˈbju/);
 for (const w of ["beau", "bureau", "plateau"]) expect(e.predict(w)).toContain("oʊ");
 const api = createPhonemizer({ processors: [e] });
 const out = api.phonemize("They know the beauty of a beautiful day.", { language: "en-US", returnArray: true });
 for (const t of out.filter(t => /^(beauty|beautiful)$/.test(t.word))) expect(t.phoneme).toContain("bju");
 expect(out.find(t => t.word === "know")!.phoneme).toContain("noʊ");
});
test.each([false, true])("doubled monosyllabic superlatives share stem recovery (rules=%s)", rules => {
 const e = cold(rules);
 for (const w of ["smallest", "fullest", "tallest", "grossest", "frallest"]) expect(e.predict(w)).toMatch(/əst$/);
 expect(e.predict("smallest")).toContain("smɔ"); expect(e.predict("fullest")).toContain("fʊ");
 expect(e.predict("forest")).toMatch(/^ˈfɔɹ/); expect(e.predict("honest")).toMatch(/^ˈɑn/);
 const api = createPhonemizer({ processors: [e] });
 const out = api.phonemize("They fill the fullest cup beside the smallest bowl.", { language: "en-US", returnArray: true });
 for (const t of out.filter(t => /^(fullest|smallest)$/.test(t.word))) expect(t.phoneme).toMatch(/əst$/);
 expect(out.find(t => t.word === "fill")!.phoneme).toContain("fɪ");
});
test.each([false, true])("productive deverbal suffixes use vouched base readings (rules=%s)", rules => {
 const e = cold(rules);
 expect(e.predict("alliance")).toContain("ˈɫaɪ"); expect(e.predict("readable")).toContain("ˈɹid");
 expect(e.predict("upgradeable")).toContain("ʌpˈɡɹeɪd");
 expect(e.predict("contentment")).toContain("ˈtɛnt"); expect(e.predict("recordable")).toContain("ˈkɔɹd");
 expect(e.predict("refundable")).toContain("ˈfʌnd"); expect(e.predict("readment")).toContain("ɹidmənt");
 expect(e.predict("interchange", "en-US", "V")).toContain("ɪntɝˈtʃeɪndʒ");
 if (!rules) expect(e.predict("interchange", "en-US", "N")).toMatch(/^ˈɪnt/);
 expect(e.predict("interchangeable")).toContain("ɪntɝˈtʃeɪndʒ");
 const api = createPhonemizer({ processors: [e] });
 const out = api.phonemize("They read a readable record yesterday.", { language: "en-US", returnArray: true });
 expect(out.find(t => t.word === "read")!.phoneme).toBe("ɹɛd");
 expect(out.find(t => t.word === "readable")!.phoneme).toContain("ɹid");
});
test("explicit caller roots retain degree and deverbal suffix ownership", () => {
 const e = new EnglishG2P({ disableDict: true });
 e.addPronunciation("small", "ˈtɛst"); expect(e.predict("smallest")).toBe("ˈtɛstəst");
 e.addPronunciation("read", "ˈtɛst"); expect(e.predict("readable")).toBe("ˈtɛstəbəɫ");
 e.addPronunciation("ally", "ˈtɛst"); expect(e.predict("alliance")).toBe("ˈtɛstəns");
 const other = new EnglishG2P({ disableDict: true }); other.addPronunciation("reade", "ˈtɛst");
 expect(other.predict("readable")).toContain("ˈɹid");
});

test("prepositional demonstrative noun phrases keep noun readings", () => {
 const api = createPhonemizer({ processors: [new EnglishG2P()] });
 for (const sentence of ["It was proposed from that interchange to the park.", "They returned from that record to the report."]) {
  const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
  expect(out.find(t => /^(interchange|record)$/.test(t.word))!.phoneme).toMatch(/^ˈ/);
 }
 const out = api.phonemize("The methods that record to disk work.", { language: "en-US", returnArray: true });
 expect(out.find(t => t.word === "record")!.phoneme).toContain("ˈkɔɹd");
});
