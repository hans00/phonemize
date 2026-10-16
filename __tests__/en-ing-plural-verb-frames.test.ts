import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("verbal ing frames (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["readings", "ˈɹidɪŋz"],
    ["recordings", "ɹɪˈkɔɹdɪŋz"],
    ["winding", "ˈwaɪndɪŋ"], ["windings", "ˈwaɪndɪŋz"],
    ["breading", "ˈbɹɛdɪŋ"], ["breeding", "ˈbɹidɪŋ"],
    ["leading", "ˈɫidɪŋ"], ["buildings", "ˈbɪɫdɪŋz"],
    ["reader", "ˈɹidɝ"], ["addressing", "əˈdɹɛsɪŋ"],
  ])("preserves the supported root in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves a supplied custom ing stem in its plural", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.recordings;
    custom.addPronunciation("recording", "R OW1 K ER0 D IH0 NG");
    expect(custom.predict("recordings")).toBe("ˈɹoʊkɝdɪŋz");
  });
  it("keeps noun, adjective and finite verb controls in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader keeps recordings while they work.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "recordings")?.phoneme).toBe("ɹɪˈkɔɹdɪŋz");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    const place = api.phonemize("They travelled to Reading.", { language: "en-US", returnArray: true });
    expect(place.find(t => t.word === "Reading")?.phoneme).toBe("ˈɹɛdɪŋ");
  });
});
