import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false,true])("uses stressed coronal AmE stems after target eviction (rules=%s)",disableDict=>{
 const e=new EnglishG2P({disableDict}),d={...Reflect.get(e,"dictionary")};for(const w of ["duties","tunas","fondues"])delete d[w];Reflect.set(e,"dictionary",d);
 expect(e.predict("duties")).toBe("ˈdutiz");expect(e.predict("tunas")).toBe("ˈtunəz");expect(e.predict("fondues")).toMatch(/duz$/);expect(e.predict("fondues")).not.toContain("dju");
 for(const w of ["continue","continuing","continued","annual","annually"])expect(e.predict(w)).toContain("nju");
 expect(e.predict("value")?.replace(/ɫ/g,"l")).toContain("lju");expect(e.predict("hues")).toContain("hju");
 const api=createPhonemizer({processors:[e]});expect(api.phonemize("Their duties include studying tunas.",{language:"en-US",returnArray:true}).find(t=>t.word==="duties")?.phoneme).toBe("ˈdutiz");
});
test.each([false,true])("keeps historical RP yod without changing loan controls (rules=%s)",disableDict=>{
 const e=new EnglishG2P({disableDict}),d={...Reflect.get(e,"dictionary")};delete d.duties;delete d.tunas;delete d.fondues;Reflect.set(e,"dictionary",d);
 expect(e.predict("duties","en-GB")).toMatch(/^ˈdju/);expect(e.predict("tunas","en-GB")).toMatch(/^ˈtju/);expect(e.predict("fondues","en-GB")).not.toContain("dju");
 for(const w of ["dude","duvet","Dutch"])expect(e.predict(w,"en-GB")).not.toContain("dju");expect(e.predict("tutu","en-GB")).not.toContain("tju");
});
test("keeps supplied yod-bearing roots and explicit targets",()=>{
 const e=new EnglishG2P({disableDict:true});e.addPronunciation("duty","ˈdjuti");e.addPronunciation("tuna","ˈtjunə");expect(e.predict("duties")).toBe("ˈdjutiz");expect(e.predict("tunas")).toBe("ˈtjunəz");e.addPronunciation("duties","ˈtɛst");expect(e.predict("duties")).toBe("ˈtɛst");
});
