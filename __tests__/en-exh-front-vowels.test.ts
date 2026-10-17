import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("exh front-vowel boundary, rules=%s", disableDict => {
  it("drops h after a full ex prefix before weak i without voicing ks", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("exhibition")).toMatch(/^ˌɛks[əɪ]ˈbɪʃən$/);
    expect(engine.predict("exhalation")).toBe("ˌɛkshəˈɫeɪʃən");
    expect(engine.predict("exhibit")).toBe("ɪɡˈzɪbɪt");
    expect(engine.predict("exhaust")).toBe("ɪɡˈzɔst");
    if (!disableDict) {
      expect(engine.predict("exhale")).toBe("ɛksˈheɪɫ");
      expect(engine.predict("exhume")).toBe("ɛksˈhjum");
    }
  });
  it("retains noun and verb sentence controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    expect(api.phonemize("The exhibition is here.", { language: "en-US", returnArray: true }).find(t => t.word === "exhibition")?.phoneme).toMatch(/^ˌɛks[əɪ]ˈbɪʃən$/);
    expect(api.phonemize("They exhibit the art.", { language: "en-US", returnArray: true }).find(t => t.word === "exhibit")?.phoneme).toBe("ɪɡˈzɪbɪt");
  });
});
