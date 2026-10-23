import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("weak open rhotic u (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["century", "ˈsɛntʃɝi"], ["centuries", "ˈsɛntʃɝiz"],
    ["century's", "ˈsɛntʃɝiz"], ["midcentury", "mɪdˈsɛntʃɝi"],
    ["saturn", "ˈsætɝn"], ["sturdy", "ˈstɝdi"], ["turn", "ˈtɝn"],
    ["turtle", "ˈtɝtəɫ"], ["centurion", "sɛnˈtʊɹiən"],
    ["maturity", "məˈtʃʊɹəti"],
    ["natural", "ˈnætʃɝəɫ"], ["future", "ˈfjutʃɝ"],
  ])("preserves the root or control of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["ventury", "zatury"])("coalesces the same weak open rime in OOV %s", word => {
    expect(engine.predict(word)).toMatch(/tʃɝi$/);
  });
  it("inherits caller roots through possessives and plurals", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("century", "ˈsɛŋ");
    expect(custom.predict("century")).toBe("ˈsɛŋ");
    expect(custom.predict("century's")).toBe("ˈsɛŋz");
    expect(custom.predict("centuries")).toBe("ˈsɛŋz");
  });
  it("preserves noun, adjective and verb controls in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work for a century.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["century", "ˈsɛntʃɝi"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
