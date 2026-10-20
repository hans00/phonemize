import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
function cold(disableDict: boolean) {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for(const word of ["item", "idol", "itemize", "itemized", "itemizing", "itemizer", "idolize", "idolized", "idolizing"]) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary); return e;
}
describe.each([false, true])("open i and a weak stop-initial foot, rules=%s", disableDict => {
 test("citation roots and capital forms survive lexical eviction", () => {
  const e = cold(disableDict);
  for(const [word,ipa] of [["item", "ˈaɪtəm"], ["items", "ˈaɪtəmz"], ["idol", "ˈaɪdəɫ"], ["idols", "ˈaɪdəɫz"]]) {
   expect(e.predict(word)).toBe(ipa); expect(e.predict(word.toUpperCase())).toBe(ipa);
  }
  expect(e.predict("idol's")).toBe("ˈaɪdəɫz");
 });
 test("derived and nonce forms retain the owned initial vowel", () => {
  const e = cold(disableDict);
  for(const word of ["itemlike", "idollike", "itemize", "itemized", "itemizing", "itemization", "idolize", "idolized", "idolizing", "idolization", "itemer", "nonitem", "nonidol", "nonitemized", "nonidolized", "ipem", "ipems"]) expect(e.predict(word)?.replace(/ˌ/g, "")).toMatch(word.startsWith("non") ? /aɪ(?:təm|də)/ : /^[ˈˌ]?aɪ/);
 });
 test("Greek hiatus, short high-vowel tails and consonant onsets stay separate", () => {
  const e = cold(disableDict);
  for(const word of ["ibid", "idiom", "idiot", "image", "igloo"]) expect(e.predict(word)).toMatch(/^ˈɪ/);
  if(disableDict) expect(e.predict("imam")).toMatch(/^ˈɪ/);
  expect(e.predict("IBM")).toMatch(/aɪ.*bi.*ɛm/);
 });
 test("custom roots retain priority through inflection and compounding", () => {
  const e = cold(disableDict); e.addPronunciation("item", "ˈtɛst");
  expect(e.predict("ITEM")).toBe("ˈtɛst"); expect(e.predict("items")).toBe("ˈtɛsts");
  expect(e.predict("itemlike")).toMatch(/^ˈtɛst/);
 });
 test("noun, adjective and verb sentences retain their independent readings", () => {
  const api = createPhonemizer({ processors: [cold(disableDict)] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
  expect(pick("The item was new.", "item")).toBe("ˈaɪtəm");
  expect(pick("They item the costs.", "item")).toBe("ˈaɪtəm");
  expect(pick("The idle singer admired the idol.", "idol")).toBe("ˈaɪdəɫ");
  expect(pick("The idle singer admired the idol.", "idle")).toBe("ˈaɪdəɫ");
 });
});
test("past and modal reading controls remain distinct", () => {
 const api = createPhonemizer({ processors: [cold(false)] });
 for(const [sentence,ipa] of [["She read the item yesterday.", "ɹɛd"], ["She will read the item.", "ɹid"]]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
});
