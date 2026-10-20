import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test.each([false, true])("written in-apostrophe restores the ing base, rules=%s", disableDict => {
 const e = new EnglishG2P({ disableDict });
 for(const [clipped, ipa] of [["workin'", "ˈwɝkɪn"], ["runnin'", "ˈɹʌnɪn"], ["dancin'", "ˈdænsɪn"], ["rockin'", "ˈɹɑkɪn"], ["singin'", "ˈsɪŋɪn"], ["somethin'", "ˈsʌmθɪn"], ["nothin'", "ˈnʌθɪn"]]) {
  expect(e.predict(clipped)).toBe(ipa);
  expect(e.predict(clipped.replace("'", "’"))).toBe(ipa);
 }
 expect(e.predict("king'")).toBe(e.predict("king"));
 expect(e.predict("cousins'")).toBe(e.predict("cousins"));
 e.addPronunciation("working", "ˈtɛstɪŋ"); expect(e.predict("workin'")).toBe("ˈtɛstɪn");
 e.addPronunciation("workin'", "ˈtɛst"); expect(e.predict("workin'")).toBe("ˈtɛst");
 const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
 for(const sentence of ["They are workin' here.", "The workin' crew arrived.", "Workin' was difficult."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "workin'")?.phoneme).toMatch(/ɪn$/);
});
