import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
describe.each([false,true])("complete doubled roots before agents, disableDict=%s",disableDict=>{
 const engine=new EnglishG2P({disableDict});
 it.each([["reseller","ɹiˈsɛɫɝ"],["putter","ˈpʌtɝ"],["rototiller","ˈɹoʊtəˌtɪɫɝ"]])("preserves the vouched root of %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
 it("preserves weak-el and suffix-induced doubling",()=>{
  expect(engine.predict("reveller")).toBe("ˈɹɛvəɫɝ");
  expect(engine.predict("jewellers")).toBe("ˈdʒuəɫɝz");
  expect(engine.predict("latter")).toBe("ˈɫætɝ");
  expect(engine.predict("bitter")).toBe("ˈbɪtɝ");
 });
 it("keeps the agent noun and its existing source verb in context",()=>{
  const api=createPhonemizer({processors:[engine]});
  const out=api.phonemize("The reseller was reselling a putter.",{language:"en-US",returnArray:true});
  expect(out.find(t=>t.word==="reseller")?.phoneme).toBe("ɹiˈsɛɫɝ");
  expect(out.find(t=>t.word==="reselling")?.phoneme).toBe("ɹiˈsɛɫɪŋ");
  expect(out.find(t=>t.word==="putter")?.phoneme).toBe("ˈpʌtɝ");
 });
 it("preserves caller-provided doubled roots and explicit children",()=>{
  const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
  for(const word of ["reseller","resellers","jeweller","jewelled","jewelling"])delete dictionary[word];
  Reflect.set(own,"dictionary",dictionary);own.addPronunciation("resell","ˈzɛŋ");
  expect(own.predict("reseller")).toBe("ˈzɛŋɝ");expect(own.predict("resellers")).toBe("ˈzɛŋɝz");
  own.addPronunciation("jewell","ˈbɛŋ");expect(own.predict("jeweller")).toBe("ˈbɛŋɝ");
  expect(own.predict("jewelled")).toBe("ˈbɛŋd");expect(own.predict("jewelling")).toBe("ˈbɛŋɪŋ");
  own.addPronunciation("reseller","ˈkɛŋ");expect(own.predict("reseller")).toBe("ˈkɛŋ");
 });
});
