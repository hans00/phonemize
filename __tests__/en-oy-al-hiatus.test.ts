import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("CHOICE before weak al", () => {
  it.each([false, true])("retains the root vowel with disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("royalty")).toBe("ˈɹɔɪəɫti");
    expect(engine.predict("loyalty")).toBe("ˈɫɔɪəɫti");
    const api = createPhonemizer({ processors: [engine] });
    const words = api.phonemize("The loyal reader discussed royalty and loyalty.", { language: "en-US", returnArray: true });
    expect(words.filter(t => /^(royalty|loyalty)$/.test(t.word)).map(t => t.phoneme)).toEqual(["ˈɹɔɪəɫti", "ˈɫɔɪəɫti"]);
  });
  it.each([false, true])("inherits custom roots but prioritizes explicit forms (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    for (const root of ["royalty", "loyalty"]) {
      engine.addPronunciation(root, "ˈzɛŋ");
      const plural = root.slice(0, -1) + "ies";
      expect(engine.predict(root)).toBe("ˈzɛŋ");
      expect(engine.predict(plural)).toBe("ˈzɛŋz");
      engine.addPronunciation(plural, "ˈkɛŋ");
      expect(engine.predict(plural)).toBe("ˈkɛŋ");
    }
  });

});
