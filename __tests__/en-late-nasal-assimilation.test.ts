import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("late velar assimilation (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["anchor", "ˈæŋkɝ"], ["anchors", "ˈæŋkɝz"], ["anchor's", "ˈæŋkɝz"],
    ["anchored", "ˈæŋkɝd"], ["anchoring", "ˈæŋkɝɪŋ"],
    ["anchorages", "ˈæŋkɝədʒəz"],
    ["ranch", "ˈɹæntʃ"], ["rancher", "ˈɹæntʃɝ"], ["french", "ˈfɹɛntʃ"],
    ["include", "ɪnˈkɫud"], ["uncover", "ənˈkʌvɝ"], ["engage", "ɛnˈɡeɪdʒ"],
    ["conquest", "ˈkɑŋkwɛst"], ["engel", "ˈɛnɡəɫ"],
  ])("preserves the native root or boundary of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains the velar nasal in the derived age frame", () => {
    expect(engine.predict("anchorage")).toMatch(/^ˈæŋkɝ[əɪ]dʒ$/);
  });
  it("retains the nasal in con + qu", () => {
    expect(engine.predict("conquer")).toContain("ŋk");
  });
  it("keeps late assimilation in an OOV prefix composition", () => {
    expect(engine.predict("unanchor")).toContain("æŋkɝ");
  });
  it("preserves caller-owned roots and allomorphs", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("anchor", "ˈzɛŋ");
    for (const [word, ipa] of [["anchor", "ˈzɛŋ"], ["anchors", "ˈzɛŋz"],
      ["anchor's", "ˈzɛŋz"], ["anchored", "ˈzɛŋd"], ["anchoring", "ˈzɛŋɪŋ"]])
      expect(custom.predict(word)).toBe(ipa);
  });
  it("preserves other noun, adjective and verb readings in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work and anchor the boat.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["anchor", "ˈæŋkɝ"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
