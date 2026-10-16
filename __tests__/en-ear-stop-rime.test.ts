import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("ear before a written stop (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["heart", "ˈhɑɹt"], ["hearts", "ˈhɑɹts"], ["heart's", "ˈhɑɹts"],
    ["hearty", "ˈhɑɹti"], ["heartier", "ˈhɑɹtiɝ"], ["heartiest", "ˈhɑɹtiəst"],
    ["earth", "ˈɝθ"], ["earthy", "ˈɝθi"], ["dearth", "ˈdɝθ"],
    ["care", "ˈkɛɹ"], ["bare", "ˈbɛɹ"], ["start", "ˈstɑɹt"],
    ["barren", "ˈbæɹən"], ["barring", "ˈbɑɹɪŋ"],
    ["hear", "ˈhɪɹ"], ["beard", "ˈbɪɹd"],
  ])("preserves the rime or neighboring frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["hearted", "heartening", "unhearted", "halfhearted", "heartthrob", "braveheart"])(
    "retains the owned root in %s without claiming the complete word", word => {
      expect(engine.predict(word)).toContain("hɑɹt");
    },
  );
  it("retains roots and plurals after target eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["heart", "hearts", "heart's", "hearty"]) delete access.dictionary[word];
    expect(evicted.predict("heart")).toBe("ˈhɑɹt");
    expect(evicted.predict("hearts")).toBe("ˈhɑɹts");
    expect(evicted.predict("hearty")).toBe("ˈhɑɹti");
  });
  it("honors a supplied root and plural", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("heart", "HH IH1 R T");
    expect(custom.predict("heart")).toBe("ˈhɪɹt");
    expect(custom.predict("hearts")).toBe("ˈhɪɹts");
  });
  it("preserves adjective, noun and finite verb controls in prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The hearty reader will start.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "hearty")?.phoneme).toBe("ˈhɑɹti");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "start")?.phoneme).toBe("stɑɹt");
  });
});

it.each([["Enyeart", "ˈɛnjɝt"], ["McBrearty", "məkˈbɹɪɹti"], ["hearten", "ˈhɑɹtən"]])(
  "preserves existing default source coverage in %s after rebuild", (word, ipa) => {
    expect(new EnglishG2P().predict(word)).toBe(ipa);
  },
);
