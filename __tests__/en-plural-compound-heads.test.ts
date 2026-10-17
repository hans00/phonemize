import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
describe.each([false,true])("vouched plural compound heads, disableDict=%s",disableDict=>{
 const engine=new EnglishG2P({disableDict});
 it.each([["trees","ˈtɹiz"],["sees","ˈsiz"],["fees","ˈfiz"],["bees","ˈbiz"],["toes","ˈtoʊz"],["stewards","ˈstuɝdz"]])("preserves an evicted literal stem in %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
 it("distinguishes the present verb from its unchanged neighboring noun",()=>{
  const api=createPhonemizer({processors:[engine]});
  const out=api.phonemize("The sailor sees the trees.",{language:"en-US",returnArray:true});
  expect(out.find(t=>t.word==="sees")?.phoneme).toBe("siz");
  expect(out.find(t=>t.word==="trees")?.phoneme).toBe("tɹiz");
  expect(engine.predict("say")).toBe("ˈseɪ");
 });
 it("retains a plural root before a full tail",()=>{
  expect(engine.predict("townspeople")).toBe("ˈtaʊnzˌpipəɫ");
  expect(engine.predict("woodspeople")).toBe("ˈwʊdzˌpipəɫ");
  expect(engine.predict("newspaper")).toMatch(/^ˈnj?uzˌpeɪpɝ$/);
  expect(engine.predict("newsletter")).toMatch(/^ˈnj?uzˌɫɛtɝ$/);
 });
 it.each([["airspace","ˈɛɹˌspeɪs"],["keystone","ˈkiˌstoʊn"],["joystick","ˈdʒɔɪˌstɪk"],["peasant","ˈpɛzənt"],["hausfeld","ˈhaʊsfɛɫd"],["moosman","ˈmusmən"]])("preserves the original boundary in %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
 it("retains full sentence roles and tense",()=>{
  const api=createPhonemizer({processors:[engine]});
  const out=api.phonemize("The kind townspeople read the newspaper yesterday.",{language:"en-US",returnArray:true});
  expect(out.find(t=>t.word==="townspeople")?.phoneme).toBe("ˈtaʊnzˌpipəɫ");
  expect(out.find(t=>t.word==="read")?.phoneme).toBe("ɹɛd");
 });
 it("preserves caller roots, heads, tails and whole-word overrides",()=>{
  const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};delete dictionary.townspeople;Reflect.set(own,"dictionary",dictionary);
  own.addPronunciation("town","ˈzɛŋ");expect(own.predict("townspeople")).toBe("ˈzɛŋzˌpipəɫ");
  own.addPronunciation("towns","ˈkɛŋ");expect(own.predict("townspeople")).toBe("ˈkɛŋˌpipəɫ");
  own.addPronunciation("people","ˈbɛŋ");expect(own.predict("townspeople")).toBe("ˈkɛŋˌbɛŋ");
  own.addPronunciation("townspeople","ˈdɛŋ");expect(own.predict("townspeople")).toBe("ˈdɛŋ");
 });
});
