import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
describe.each([false, true])("weak e before a nasal affricate, disableDict=%s", disableDict => {
 const engine = new EnglishG2P({disableDict});
 it.each([["messenger","ˈmɛsəndʒɝ"],["passenger","ˈpæsəndʒɝ"]])("preserves %s and its inflections",(word,ipa)=>{
   expect(engine.predict(word)).toBe(ipa);
   expect(engine.predict(word+"s")).toBe(ipa+"z");
   expect(engine.predict(word+"'s")).toBe(ipa+"z");
   expect(engine.predict("non"+word)).toContain(ipa);
 });
 it("preserves stressed e and the adjacent verb",()=>{
   expect(engine.predict("send")).toBe("ˈsɛnd");
   expect(engine.predict("sensing")).toBe("ˈsɛnsɪŋ");
   const api=createPhonemizer({processors:[engine]});
   const tokens=api.phonemize("The sensible messenger sent a note to the passenger.",{language:"en-US",returnArray:true});
   expect(tokens.find(t=>t.word==="messenger")?.phoneme).toBe("ˈmɛsəndʒɝ");
   expect(tokens.find(t=>t.word==="passenger")?.phoneme).toBe("ˈpæsəndʒɝ");
   expect(tokens.find(t=>t.word==="sent")?.phoneme).toBe("sɛnt");
 });
 it("keeps caller-owned roots and explicit children",()=>{
   const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
   delete dictionary.messengers;Reflect.set(own,"dictionary",dictionary);
   own.addPronunciation("messenger","ˈzɛŋ");
   expect(own.predict("messengers")).toBe("ˈzɛŋz");
   expect(own.predict("messenger's")).toBe("ˈzɛŋz");
   own.addPronunciation("messengers","ˈkɛŋ");expect(own.predict("messengers")).toBe("ˈkɛŋ");
 });
});
