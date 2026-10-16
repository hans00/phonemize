import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("-ic derivative ownership (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each(["strategic", "strategically", "nonstrategic", "zategic"])("retains primary FLEECE in %s", word => {
    expect(engine.predict(word)).toContain("ˈtidʒɪk");
  });
  it("retains singular-root stress in the plural", () => {
    expect(engine.predict("strategics")).toBe("stɹəˈtidʒɪks");
  });
  it.each([["astrophysics", "ˌæstɹoʊˈfɪzɪks"], ["bishoprics", "ˈbɪʃəpɹɪks"]])("preserves %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves a lax neighboring suffix", () => {
    expect(engine.predict("genetic")).toMatch(/ˈnɛtɪk$/);
  });
  it("honors an explicitly supplied root in its unlisted plural", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("strategic", "ˈzɛŋ");
    expect(custom.predict("strategic")).toBe("ˈzɛŋ");
    expect(custom.predict("strategics")).toBe("ˈzɛŋz");
    expect(custom.predict("strategic's")).toBe("ˈzɛŋz");
  });
  it("preserves paired noun and verb controls in a sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The strategic reader will work.", { language: "en-US", returnArray: true });
    for (const [word, ipa] of [["strategic", "stɹəˈtidʒɪk"], ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
