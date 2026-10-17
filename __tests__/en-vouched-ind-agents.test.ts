import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("vouched ind agents, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([["minder", "ˈmaɪndɝ"], ["winder", "ˈwaɪndɝ"]])("retains the vouched root in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
    expect(engine.predict(word + "s")?.replace(/ˌ/g, "")).toBe(ipa + "z");
  });
  it.each([["cinder", "ˈsɪndɝ"], ["hinder", "ˈhɪndɝ"], ["tinder", "ˈtɪndɝ"],
    ["heather", "ˈhɛðɝ"], ["breather", "ˈbɹiðɝ"], ["bather", "ˈbæðɝ"]])("preserves the complete word %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains an independently vouched root after lexical eviction in noun context", () => {
    const evicted = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(evicted, "dictionary") };
    delete dictionary.blind;
    Reflect.set(evicted, "dictionary", dictionary);
    const api = createPhonemizer({ processors: [evicted] });
    const tokens = api.phonemize("Early timber venetian blinds provide shade.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "blinds")?.phoneme).toBe("bɫaɪndz");
  });
  it("preserves caller-owned OOV roots and whole targets", () => {
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("zind", "ˈzɛŋ");
    expect(own.predict("zinder")).toBe("ˈzɛŋɝ");
    own.addPronunciation("zinder", "ˈkɛŋ");
    expect(own.predict("zinder")).toBe("ˈkɛŋ");
  });
  it("preserves noun, adjective and verb neighbours in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The kind minder will hinder the winder.", { language: "en-US", returnArray: true });
    expect(tokens.filter(t => ["kind", "minder", "hinder", "winder"].includes(t.word)).map(t => t.phoneme))
      .toEqual(["kaɪnd", "ˈmaɪndɝ", "ˈhɪndɝ", "ˈwaɪndɝ"]);
  });
});
