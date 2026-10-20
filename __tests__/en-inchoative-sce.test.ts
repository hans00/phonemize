import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false,true])("inchoative -sce and nominal tails, disableDict=%s",disableDict=>{
  const cold=()=>{const e=new EnglishG2P({disableDict}),dictionary={...Reflect.get(e,"dictionary")};for(const w of Object.keys(dictionary))if(/^convalesc/.test(w)||w==="pesce")delete dictionary[w];Reflect.set(e,"dictionary",dictionary);return e;};
  it("renders a cold verb with root stress and a soft final c",()=>{
    const e=cold();for(const w of ["convalesce","CONVALESCE"])expect(e.predict(w)).toBe("ˌkɑnvəˈɫɛs");
  });
  it("keeps short and OOV uppercase roots on the word route",()=>{
    const e=cold();expect(e.predict("PESCE")).toBe("ˈpɛs");expect(e.predict("EVANESCE")).toBe("ˌɛvəˈnɛs");
  });
  it("preserves cold inflections, nouns and adjectives",()=>{
    const e=cold();expect(e.predict("convalesces")).toBe("ˌkɑnvəˈɫɛsəz");expect(e.predict("convalesced")).toBe("ˌkɑnvəˈɫɛst");expect(e.predict("convalescing")).toBe("ˌkɑnvəˈɫɛsɪŋ");expect(e.predict("convalescent")).toBe("ˌkɑnvəˈɫɛsənt");expect(e.predict("convalescence")).toBe("ˌkɑnvəˈɫɛsəns");
  });
  it("extends the phonological tail without a runtime lexicon",()=>{
    const e=cold();expect(e.predict("effervesce")).toBe("ˌɛfɝˈvɛs");expect(e.predict("evanesce")).toBe("ˌɛvəˈnɛs");expect(e.predict("homovalesce")).toMatch(/ˈɫɛs$/);expect(e.predict("preconvalesce")).toMatch(/ˈɫɛs$/);expect(e.predict("reminisce")).toMatch(/ˈnɪs$/);expect(e.predict("reminiscent")).toMatch(/ˈnɪsənt$/);
  });
  it("retains neighboring roots and caller ownership",()=>{
    const e=cold();expect(e.predict("scene")).toBe("ˈsin");expect(e.predict("descent")).toBe("dɪˈsɛnt");expect(e.predict("crescent")).toBe("ˈkɹɛsənt");expect(e.predict("quiet")).toBe("ˈkwaɪət");
    e.addPronunciation("convalesce","ˈtɛst");expect(e.predict("convalesce")).toBe("ˈtɛst");expect(e.predict("convalesces")).toBe("ˈtɛsts");expect(e.predict("convalesced")).toBe("ˈtɛstɪd");
  });
  it("preserves full-sentence noun, adjective, verb and tense controls",()=>{
    const api=createPhonemizer({processors:[cold()]});const pick=(s:string,w:string)=>api.phonemize(s,{language:"en-US",returnArray:true}).find(t=>t.word===w)?.phoneme;
    expect(pick("They convalesce at home.","convalesce")).toBe("ˌkɑnvəˈɫɛs");expect(pick("The convalescent patient rested.","convalescent")).toBe("ˌkɑnvəˈɫɛsənt");expect(pick("The convalescence was slow.","convalescence")).toBe("ˌkɑnvəˈɫɛsəns");
    expect(pick("The records of blue notes are missing.","records")).toBe("ˈɹɛkɝdz");expect(pick("The musician records blue notes.","records")).toBe("ɹɪˈkɔɹdz");expect(pick("The viral infection spreads.","viral")).toBe("ˈvaɪɹəɫ");
    if(!disableDict){expect(pick("I read that book yesterday.","read")).toBe("ɹɛd");expect(pick("I will read it tomorrow.","read")).toBe("ɹid");}
  });
});
