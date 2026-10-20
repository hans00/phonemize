import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("stressed consonantal -ye, disableDict=%s", disableDict => {
  const cold = () => {
    const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
    for (const w of ["bye", "dye", "lye", "rye", "dyes", "dyed", "dyeing"]) delete dictionary[w];
    Reflect.set(e, "dictionary", dictionary);return e;
  };
  it.each([["bye", "ˈbaɪ"], ["dye", "ˈdaɪ"], ["lye", "ˈɫaɪ"], ["rye", "ˈɹaɪ"]])("reads cold root %s", (w, ipa) => {
    const e=cold();expect(e.predict(w)).toBe(ipa);expect(e.predict(w.toUpperCase())).toBe(ipa);
  });
  it("preserves inflection with cold roots", () => {
    const e=cold();expect(e.predict("dyes")).toBe("ˈdaɪz");expect(e.predict("dyed")).toBe("ˈdaɪd");expect(e.predict("dyeing")).toBe("ˈdaɪɪŋ");
  });
  it("preserves prefixed inflections and extends a nonce root", () => {
    const e=cold();expect(e.predict("redyed")).toBe("ɹiˈdaɪd");expect(e.predict("redyeing")).toBe("ˌɹiˈdaɪɪŋ");expect(e.predict("tie-dye")).toBe("taɪˈdaɪ");expect(e.predict("dyer")).toBe("ˈdaɪɝ");expect(e.predict("dyeable")).toBe("ˈdaɪəbəɫ");expect(e.predict("grye")).toBe("ˈɡɹaɪ");
  });
  it("retains weak y, earlier vowel and caller controls", () => {
    const e=cold();for(const [w,ipa] of [["city","ˈsɪti"],["happy","ˈhæpi"],["edye","ˈɛdi"],["freddye","ˈfɹɛdi"],["jessye","ˈdʒɛsi"],["tevye","ˈtɛvi"]])expect(e.predict(w)).toBe(ipa);
    expect(e.predict("IBM")).toMatch(/aɪ.*bi.*ɛm/);e.addPronunciation("dye","ˈtɛst");expect(e.predict("DYE")).toBe("ˈtɛst");expect(e.predict("dyes")).toBe("ˈtɛsts");
  });
  it("preserves full sentence POS and tense controls", () => {
    const api=createPhonemizer({processors:[cold()]});const pick=(s:string,w:string)=>api.phonemize(s,{language:"en-US",returnArray:true}).find(t=>t.word===w)?.phoneme;
    expect(pick("The dye is blue.","dye")).toBe("daɪ");expect(pick("They dye the wool.","dye")).toBe("daɪ");expect(pick("The dyed wool is blue.","dyed")).toBe("daɪd");
    expect(pick("The records of blue notes are missing.","records")).toBe("ˈɹɛkɝdz");expect(pick("The musician records blue notes.","records")).toBe("ɹɪˈkɔɹdz");expect(pick("The viral infection spreads.","viral")).toBe("ˈvaɪɹəɫ");
    if(!disableDict){expect(pick("I read that book yesterday.","read")).toBe("ɹɛd");expect(pick("I will read it tomorrow.","read")).toBe("ɹid");}
  });
});
