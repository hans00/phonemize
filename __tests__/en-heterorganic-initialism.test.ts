import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("onsetless heterorganic nasal codas (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["amd", "ˌeɪˌɛmˈdi"], ["amd's", "ˌeɪˌɛmˈdiz"],
    ["omg", "ˌoʊˌɛmˈdʒi"], ["anb", "ˌeɪˌɛnˈbi"],
    ["and", "ˈænd"], ["end", "ˈɛnd"], ["ink", "ˈɪŋk"],
    ["limb", "ˈɫɪm"], ["ism", "ˈɪzəm"],
  ])("handles %s without changing licensed native codas", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps caller-supplied pronunciation before letter spelling", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("amd", "ˈzɛŋ");
    expect(custom.predict("amd")).toBe("ˈzɛŋ");
    expect(custom.predict("amd's")).toBe("ˈzɛŋz");
  });
  it("preserves noun, adjective and verb controls in a sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const result = api.phonemize("The clever reader will work at amd.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["amd", "ˌeɪˌɛmˈdi"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
      expect(result.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
