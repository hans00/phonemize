import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
describe.each([false, true])("prefixed enge verbs, disableDict=%s", disableDict => {
 const engine = new EnglishG2P({disableDict});
 it.each(["avenge", "revenge"])("keeps the soft coda of %s", root => {
   const ipa = engine.predict(root)!;
   expect(ipa).toMatch(/ndʒ$/);
   expect(engine.predict(root + "d")).toBe(ipa + "d");
   expect(engine.predict(root.slice(0,-1) + "ing")).toBe(ipa + "ɪŋ");
 });
 it("preserves hard nasal roots and supplied names", () => {
   expect(engine.predict("belonged")).toBe("bɪˈɫɔŋd");
   expect(engine.predict("belonging")).toBe("bɪˈɫɔŋɪŋ");
   expect(engine.predict("ginsenged")).toMatch(/ŋd$/);
   expect(engine.predict("beiswenger")).toBe("ˈbaɪswɪndʒɝ");
   expect(engine.predict("clevenger")).toBe("ˈkɫɛvɪndʒɝ");
 });
 it("retains the verb in full sentences", () => {
   const api=createPhonemizer({processors:[engine]});
   const tokens=api.phonemize("The reader avenged the victim while another reader was avenging a friend.",{language:"en-US",returnArray:true});
   expect(tokens.find(t=>t.word==="avenged")?.phoneme).toBe("əˈvɛndʒd");
   expect(tokens.find(t=>t.word==="avenging")?.phoneme).toBe("əˈvɛndʒɪŋ");
 });
 it("keeps caller root and explicit child ownership",()=>{
   const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
   delete dictionary.avenged;delete dictionary.avenging;Reflect.set(own,"dictionary",dictionary);
   own.addPronunciation("avenge","ˈzɛŋ");
   expect(own.predict("avenged")).toBe("ˈzɛŋd");
   expect(own.predict("avenging")).toBe("ˈzɛŋɪŋ");
   own.addPronunciation("avenged","ˈkɛŋ");expect(own.predict("avenged")).toBe("ˈkɛŋ");
 });
});
