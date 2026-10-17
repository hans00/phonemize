import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { hasFiniteObjectFrame } from "../src/en/pos-tagger";
const frame = (sentence: string, target: string) => { const words = sentence.match(/[A-Za-z]+|[^\w\s]/g)!; return hasFiniteObjectFrame({ words, index: words.indexOf(target) }); };
test("recognizes an agreed predicate with a noun object before an infinitive", () => {
  for (const [sentence, target] of [["The formulation uses sodium deoxycholate to improve solubility.", "uses"], ["The device uses recycled materials to reduce waste.", "uses"], ["The scientist records electrical signals to detect faults.", "records"], ["The workers create electrical signals to detect faults.", "create"], ["Glider pilots use GNSS Flight Recorders to log data.", "use"]]) expect(frame(sentence, target)).toBe(true);
});
test("preserves nouns, finite following predicates and participles", () => {
  for (const [sentence, target] of [["Strong winds contributed to power outages.", "winds"], ["The device uses are documented.", "uses"], ["The record of events is clear.", "record"], ["The record entries were checked.", "record"], ["The uses of sodium to improve processing are documented.", "uses"], ["Stone offers produce boxes to deliver later.", "produce"]]) expect(frame(sentence, target)).toBe(false);
});
test("retains distinct use readings in full sentences", () => {
 const e = new EnglishG2P(), api = createPhonemizer({ processors: [e] });
 const segment = (sentence: string, target: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === target)!.phoneme;
 expect(segment("The formulation uses sodium deoxycholate to improve solubility.", "uses")).toMatch(/z[ɪə]z$/);
 expect(segment("The uses of sodium are documented.", "uses")).toMatch(/s[ɪə]z$/);
 expect(segment("Strong winds contributed to power outages.", "winds")).toContain("ɪ");
});
