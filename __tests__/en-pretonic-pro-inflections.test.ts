import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// MW proceed independently lists the weak prə- variant and regular inflections.
describe.each([false, true])("weak pro- inflection roots, disableDict=%s", disableDict => {
  const cold = () => {
    const e = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(e, "dictionary") };
    for (const word of ["proceeded", "proceeding", "proceedings"]) delete dictionary[word];
    Reflect.set(e, "dictionary", dictionary);
    return e;
  };
  it("retains onset r in regular inflections and their plurals", () => {
    const e = cold();
    expect(e.predict("proceeded")).toBe("pɹəˈsidɪd");
    expect(e.predict("proceeding")).toBe("pɹəˈsidɪŋ");
    expect(e.predict("proceedings")).toBe("pɹəˈsidɪŋz");
  });
  it("applies the spelling class to an unseen inflection, preserving caller ownership", () => {
    const e = cold();
    Reflect.get(e, "dictionary").proglim = "pɝˈɡɫɪm";
    expect(e.predict("proglimmed")).toBe("pɹəˈɡɫɪmd");
    e.addPronunciation("proglim", "ˈtɛst");
    expect(e.predict("proglimmed")).toBe("ˈtɛstɪd");
    e.addPronunciation("proceed", "pɝˈsid");
    expect(e.predict("proceeding")).toBe("pɝˈsidɪŋ");
    e.addPronunciation("proceeding", "ˈkʌstəm");
    expect(e.predict("proceeding")).toBe("ˈkʌstəm");
  });
  it("preserves strong pro- and ordinary rhotic roots", () => {
    const e = cold();
    expect(e.predict("pro")).toBe("ˈpɹoʊ");
    expect(e.predict("perturbing")).toMatch(/^pɝˈtɝb/);
  });
  it("preserves full-sentence noun/adjective/verb and past/modal controls", () => {
    const api = createPhonemizer({ processors: [cold()] });
    const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    expect(pick("Work is proceeding slowly.", "proceeding")).toBe("pɹəˈsidɪŋ");
    expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
    if (!disableDict) {
      expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
    }
  });
});
