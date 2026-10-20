import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false,true])("assimilated c+qu prefix, disableDict=%s",disableDict=>{
  const cold=()=>{const e=new EnglishG2P({disableDict}),dictionary={...Reflect.get(e,"dictionary")};for(const w of ["acquit","acquits","acquitted","acquitting","acquittal","acquaint","acquaints","acquaintance","acquaintances"])delete dictionary[w];Reflect.set(e,"dictionary",dictionary);return e;};
  it.each([["acquit","əˈkwɪt"],["acquaint","əˈkweɪnt"]])("keeps root primary and weak prefix for %s",(w,ipa)=>{
    const e=cold();for(const pos of [undefined,"N","V"])expect(e.predict(w,"en-US",pos)).toBe(ipa);expect(e.predict(w.toUpperCase())).toBe(ipa);
  });
  it("preserves cold inflections and nominalization",()=>{
    const e=cold();expect(e.predict("acquitted")).toBe("əˈkwɪtɪd");expect(e.predict("acquitting")).toBe("əˈkwɪtɪŋ");expect(e.predict("acquittal")).toBe("əˈkwɪtəɫ");expect(e.predict("acquaints")).toBe("əˈkweɪnts");expect(e.predict("acquaintance")).toBe("əˈkweɪntəns");expect(e.predict("acquaintances")).toBe("əˈkweɪntənsəz");
  });
  it("restores neutral nominal plural boundaries beyond the prefix class",()=>{
    const e=cold();expect(e.predict("experiences")).toBe("ɪksˈpɪɹiənsəz");
    const api=createPhonemizer({processors:[e]}),pick=(sentence:string)=>api.phonemize(sentence,{language:"en-US",returnArray:true}).find(t=>t.word==="experiences")?.phoneme;
    expect(pick("The experiences were useful.")).toBe("ɪksˈpɪɹiənsəz");expect(pick("She experiences pain.")).toBe("ɪksˈpɪɹiənsəz");
  });
  it("retains secondary and hiatus-family prefix vowels",()=>{
    const e=cold();expect(e.predict("acquisition")).toMatch(/^ˌækw/);expect(e.predict("acquiesce")).toMatch(disableDict ? /^æˈkw/ : /^ˌækw/);expect(e.predict("acquiescent")).toMatch(disableDict ? /^æˈkw/ : /^ˌækw/);
  });
  it("preserves unrelated closed syllables and caller roots",()=>{
    const e=cold();expect(e.predict("antenna")).toBe("ænˈtɛnə");expect(e.predict("magnetic")).toBe("mæɡˈnɛtɪk");expect(e.predict("attic")).toBe("ˈætɪk");expect(e.predict("aquatic")).toBe("əˈkwætɪk");expect(e.predict("acquip")).toBe("əˈkwɪp");expect(e.predict("acquips")).toBe("əˈkwɪps");
    e.addPronunciation("acquit","ˈtɛst");expect(e.predict("ACQUIT")).toBe("ˈtɛst");expect(e.predict("acquitted")).toBe("ˈtɛstɪd");
  });
  it("keeps noun/adjective/verb and tense controls in full sentences",()=>{
    const api=createPhonemizer({processors:[cold()]});const pick=(s:string,w:string)=>api.phonemize(s,{language:"en-US",returnArray:true}).find(t=>t.word===w)?.phoneme;
    expect(pick("They acquaint the students with the work.","acquaint")).toBe("əˈkweɪnt");expect(pick("The acquittal was final.","acquittal")).toBe("əˈkwɪtəɫ");expect(pick("The acquired skill was useful.","acquired")).toMatch(/^əˈkw/);
    expect(pick("The records of blue notes are missing.","records")).toBe("ˈɹɛkɝdz");expect(pick("The musician records blue notes.","records")).toBe("ɹɪˈkɔɹdz");expect(pick("The viral infection spreads.","viral")).toBe("ˈvaɪɹəɫ");
    if(!disableDict){expect(pick("I read that book yesterday.","read")).toBe("ɹɛd");expect(pick("I will read it tomorrow.","read")).toBe("ɹid");}
  });
});
