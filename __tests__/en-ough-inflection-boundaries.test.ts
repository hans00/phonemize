import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("ough at a vowel suffix boundary, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["roughest", "ˈɹʌfəst"],
    ["toughen", "ˈtʌfən"],
    ["toughest", "ˈtʌfəst"],
    ["toughie", "ˈtʌfi"],
    ["roughen", "ˈɹʌfən"],
    ["rougher", "ˈɹʌfɝ"],
    ["higher", "ˈhaɪɝ"],
    ["highest", "ˈhaɪəst"],
    ["ghost", "ˈɡoʊst"],
    ["bougher", "ˈbaʊɝ"],
  ])("preserves stems, derivations and neighboring rimes: %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("leaves a real g+h boundary sounded", () => {
    expect(engine.predict("bighearted")).toMatch(/bɪɡ[ˈˌ]hɑɹtɪd$/);
  });
  it("preserves whole-target caller priority", () => {
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("roughen", "ˈzɛŋ");
    expect(own.predict("roughen")).toBe("ˈzɛŋ");
  });
  it("retains full sentence noun, adjective and verb controls", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("They record the kind minder choosing the toughest protocol.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
    expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
    expect(tokens.find(t => t.word === "toughest")?.phoneme).toBe("ˈtʌfəst");
    expect(tokens.find(t => t.word === "protocol")?.phoneme).toBe("ˈpɹoʊtəˌkɑɫ");
    if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
  });
});
