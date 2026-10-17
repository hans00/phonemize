import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
describe.each([false, true])("a- before a checked velar root, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it("keeps weak a- before the heavy root", () => {
    expect(engine.predict("along")).toBe("əˈɫɔŋ");
    expect(engine.predict("along", "en-GB")).toMatch(/^əˈ/);
  });
  it("preserves inflected and closed initial syllable controls", () => {
    expect(engine.predict("aging")).toBe("ˈeɪdʒɪŋ");
    expect(engine.predict("axing")).toBe("ˈæksɪŋ");
    expect(engine.predict("ankle")).toBe("ˈæŋkəɫ");
    expect(engine.predict("amber")).toBe("ˈæmbɝ");
  });
  it("preserves full sentence context and explicit custom output", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The aging reader will walk along the river.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "along")?.phoneme).toBe("əˈɫɔŋ");
    expect(tokens.find(t => t.word === "aging")?.phoneme).toBe("ˈeɪdʒɪŋ");
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("along", "ˈzɛŋ");
    expect(custom.predict("along")).toBe("ˈzɛŋ");
  });
});
