import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("ear after a labial onset, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["wear", "ˈwɛɹ"], ["swear", "ˈswɛɹ"],
    ["wearing", "ˈwɛɹɪŋ"], ["swearing", "ˈswɛɹɪŋ"],
    ["wearer", "ˈwɛɹɝ"], ["wears", "ˈwɛɹz"],
    ["bear", "ˈbɛɹ"], ["pear", "ˈpɛɹ"],
    ["spear", "ˈspɪɹ"], ["shear", "ˈʃɪɹ"],
  ])("retains the inflection and contrasting onset: %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves the NEAR nucleus before an unrelated y ending", () => {
    expect(engine.predict("weary")).toMatch(/w[ɪi]ɹi$/);
  });
  it("honors whole-target caller pronunciation", () => {
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("swearable", "ˈzɛŋ");
    expect(own.predict("swearable")).toBe("ˈzɛŋ");
  });
  it.each([
    ["They wear the badge.", "wear", "wɛɹ"],
    ["Their wear was clear.", "wear", "wɛɹ"],
    ["She will swear before the judge.", "swear", "swɛɹ"],
  ])("keeps full sentence POS controls: %s", (sentence, word, ipa) => {
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
