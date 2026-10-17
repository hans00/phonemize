import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("velar-sibilant before ual, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["sexual", "ˈsɛkʃuəɫ"], ["sexually", "ˈsɛkʃuəɫi"],
    ["sexuals", "ˈsɛkʃuəɫz"], ["nonsexual", "nɑnˈsɛkʃuəɫ"],
  ])("coalesces the composed boundary in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves other onsets and the independently stressed derivative", () => {
    expect(engine.predict("annual")).toBe("ˈænjuəɫ");
    expect(engine.predict("gradual")).toBe("ˈɡɹædʒuəɫ");
    expect(engine.predict("sexuality")).toBe("ˌsɛkʃuˈæɫəti");
  });
  it("preserves the adjective and past-tense verb in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const out = api.phonemize("The sexual therapist read the notes yesterday.", {
      language: "en-US", returnArray: true,
    });
    expect(out.find(t => t.word === "sexual")?.phoneme).toBe("ˈsɛkʃuəɫ");
    expect(out.find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
  });
  it("composes caller roots and respects explicit children", () => {
    const own = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(own, "dictionary") };
    delete dictionary.sexual;
    Reflect.set(own, "dictionary", dictionary);
    own.addPronunciation("sex", "ˈzɛks");
    expect(own.predict("sexual")).toBe("ˈzɛkʃuəɫ");
    own.addPronunciation("sexual", "ˈkɛŋ");
    expect(own.predict("sexual")).toBe("ˈkɛŋ");
  });
});
