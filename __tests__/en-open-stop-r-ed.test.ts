import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("unvouched open stop-r ed (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["sacred", "ˈseɪkɹəd"], ["hatred", "ˈheɪtɹəd"],
    ["hatreds", "ˈheɪtɹədz"], ["unsacred", "ənˈseɪkɹəd"],
    ["non-sacred", "nɑnˈseɪkɹəd"],
    ["mitred", "ˈmaɪtɝd"], ["metred", "ˈmitɝd"],
    ["barred", "ˈbɑɹd"], ["typed", "ˈtaɪpt"], ["hoped", "ˈhoʊpt"],
  ])("preserves the root frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains derived and prefixed roots after complete lexical eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["sacred", "hatred", "hatreds", "unsacred"]) delete access.dictionary[word];
    expect(evicted.predict("sacred")).toBe("ˈseɪkɹəd");
    expect(evicted.predict("hatreds")).toBe("ˈheɪtɹədz");
    expect(evicted.predict("unsacred")).toBe("ənˈseɪkɹəd");
  });
  it("honors an explicitly supplied otherwise unvouched stem", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary }; delete access.dictionary.sacred;
    custom.addPronunciation("sacr", "S AE1 K R");
    expect(custom.predict("sacred")).toBe("ˈsækɹd");
  });
  it("retains adjective, noun and finite verb controls in full prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The sacred reader will work without hatred.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "sacred")?.phoneme).toBe("ˈseɪkɹəd");
    expect(tokens.find(t => t.word === "hatred")?.phoneme).toBe("ˈheɪtɹəd");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});
