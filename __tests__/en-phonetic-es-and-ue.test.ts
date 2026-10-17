import EnglishG2P from "../src/en/g2p";
import { parseIpa } from "../scripts/context-ipa";
import { createPhonemizer } from "../src/core";
test.each([false,true])("composes es by the final phone and preserves ue stems (rules=%s)",disableDict=>{
 const e=new EnglishG2P({disableDict}),d={...Reflect.get(e,"dictionary")};for(const w of ["hues","hughes","hughes'","values'","leagues'","boxes","buses","gases","dishes","roses"])delete d[w];Reflect.set(e,"dictionary",d);
 for(const [word,ipa]of [["hues","ˈhjuz"],["Hughes","ˈhjuz"],["Hughes'","ˈhjuz"],["values'","ˈvæljuz"],["leagues'","ˈliɡz"],["cayes","ˈkeɪz"]])expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
 expect(e.predict("gases")).toMatch(/ɡæs[ɪə]z$/);
 expect(e.predict("muses")).toMatch(/mjuz[ɪə]z$/);expect(e.predict("ruses")).toMatch(/ɹuz[ɪə]z$/);
 expect(e.predict("heroes")).toMatch(/oʊz$/);expect(e.predict("echoes")).toMatch(/oʊz$/);
 for(const w of ["boxes","buses","gases"])expect(e.predict(w)).toMatch(/s[ɪə]z$/);expect(e.predict("dishes")).toMatch(/ʃ[ɪə]z$/);expect(e.predict("roses")).toMatch(/z[ɪə]z$/);
 // Foreign names retain their lexical reading on the default route.
 if(!disableDict)expect(parseIpa(e.predict("Antilles")!)).toEqual(parseIpa("ænˈtɪliz"));
 const api=createPhonemizer({processors:[e]});expect(api.phonemize("The hues of the boxes were clear.",{language:"en-US",returnArray:true}).find(t=>t.word==="hues")?.phoneme.replace(/[ˈˌ]/g,"")).toBe("hjuz");
});
test("keeps caller ownership through restored es and y plurals",()=>{
 const e=new EnglishG2P({disableDict:true});e.addPronunciation("hero","ˈdju");expect(e.predict("heroes")).toBe("ˈdjuz");e.addPronunciation("Hugh","ˈnju");expect(e.predict("Hughes")).toBe("ˈnjuz");e.addPronunciation("hue","ˈzɛmp");expect(e.predict("hues")).toBe("ˈzɛmps");e.addPronunciation("hues","ˈtɛst");expect(e.predict("hues")).toBe("ˈtɛst");
});
