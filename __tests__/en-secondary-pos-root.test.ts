import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
describe.each([false,true])("bound pos- derivatives, disableDict=%s",disableDict=>{
 const engine=new EnglishG2P({disableDict});
 it.each([["proposition","ˌpɹɑpəˈzɪʃən"],["propositions","ˌpɹɑpəˈzɪʃənz"],["propositional","ˌpɹɑpəˈzɪʃənəɫ"]])("retains the full derivational frame of %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
 it("preserves weak and primary-stressed controls",()=>{
  expect(engine.predict("propose")).toBe("pɹəˈpoʊz");
  expect(engine.predict("position")).toBe("pəˈzɪʃən");
  expect(engine.predict("proponent")).toBe("pɹəˈpoʊnənt");
  expect(engine.predict("propane")).toMatch(/^ˈpɹoʊ/);
 });
 it.each(["The proposition was clear.","They will proposition the group."])("preserves noun and verb context in %s",text=>{
  const api=createPhonemizer({processors:[engine]});
  expect(api.phonemize(text,{language:"en-US",returnArray:true}).find(t=>t.word==="proposition")?.phoneme).toBe("ˌpɹɑpəˈzɪʃən");
 });
 it("retains caller roots in owned derivations",()=>{
  const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
  delete dictionary.propositions;delete dictionary.propositional;Reflect.set(own,"dictionary",dictionary);
  own.addPronunciation("proposition","ˈzɛŋ");expect(own.predict("propositions")).toBe("ˈzɛŋz");
  expect(own.predict("propositional")).toBe("ˈzɛŋəɫ");
  own.addPronunciation("propositional","ˈkɛŋ");expect(own.predict("propositional")).toBe("ˈkɛŋ");
 });
});
