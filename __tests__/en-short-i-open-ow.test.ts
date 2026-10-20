import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Oxford window, widow, minnow and winnow independently preserve unstressed GOAT.
describe.each([false, true])("short KIT nasal feet before open -ow, disableDict=%s", disableDict => {
  const cold = () => {
    const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
    for (const word of ["window", "windows", "windowed", "windowing", "windowless", "windowlike", "nonwindow", "nonwindows"]) delete dictionary[word];
    Reflect.set(e, "dictionary", dictionary);
    return e;
  };
  it.each(["window", "Window", "WINDOW"])("retains word pronunciation and stress for %s", word => {
    const e = cold();
    for (const pos of [undefined, "N", "V"]) expect(e.predict(word, "en-US", pos)).toBe("ˈwɪndoʊ");
  });
  it("preserves inflections after singular eviction", () => {
    const e = cold();
    expect(e.predict("windows")).toBe("ˈwɪndoʊz");
    expect(e.predict("windowed")).toBe("ˈwɪndoʊd");
    expect(e.predict("windowing")).toBe("ˈwɪndoʊɪŋ");
    expect(e.predict("WINDOWS")).toBe("ˈwɪndoʊz");
  });
  it("retains root ownership under prefixes and adjective derivation", () => {
    const e = cold();
    expect(e.predict("nonwindow")?.replace(/ˌ/g, "")).toBe("nɑnˈwɪndoʊ");
    expect(e.predict("nonwindows")?.replace(/ˌ/g, "")).toBe("nɑnˈwɪndoʊz");
    expect(e.predict("windowless")).toBe("ˈwɪndoʊɫəs");
    expect(e.predict("windowlike")).toBe("ˈwɪndoʊˌɫaɪk");
  });
  it("preserves previously correct MOUTH names and closed compound rimes", () => {
    const e = cold();
    expect(e.predict("Bandow")).toBe("ˈbænˌdaʊ");
    expect(e.predict("Bandow's")).toBe("ˈbænˌdaʊz");
    expect(e.predict("sundown")).toBe("ˈsʌnˌdaʊn");
    expect(e.predict("browncow")).toBe("ˈbɹaʊnˌkaʊ");
    expect(e.predict("endowment")).toBe("ɛnˈdaʊmənt");
  });
  it("preserves neighboring native GOAT roots", () => {
    const e = cold();
    for (const [word, ipa] of [["widow", "ˈwɪdoʊ"], ["shadow", "ˈʃædoʊ"], ["minnow", "ˈmɪnoʊ"], ["winnow", "ˈwɪnoʊ"], ["rainbow", "ˈɹeɪnboʊ"]]) expect(e.predict(word)).toBe(ipa);
  });
  it("keeps caller root and whole-token overrides", () => {
    const e = cold();
    e.addPronunciation("window", "ˈtɛst");
    expect(e.predict("window", "en-US", "V")).toBe("ˈtɛst");
    expect(e.predict("windows")).toBe("ˈtɛsts");
    expect(e.predict("window's")).toBe("ˈtɛsts");
    e.addPronunciation("windows", "ˈkʌstəm");
    expect(e.predict("windows")).toBe("ˈkʌstəm");
  });
  it("preserves full-sentence noun, adjective, verb and tense controls", () => {
    const api = createPhonemizer({ processors: [cold()] });
    const pick = (s: string, w: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === w)?.phoneme;
    expect(pick("The window is open.", "window")).toBe("ˈwɪndoʊ");
    expect(pick("The windowed wall is open.", "windowed")).toBe("ˈwɪndoʊd");
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
    expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
    if (!disableDict) {
      expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
    }
  });
});
