import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("in- before short silent-e -able roots (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["incapable", "ˌɪnˈkeɪpəbəɫ"], ["incurable", "ˌɪnˈkjʊɹəbəɫ"],
    ["inhalable", "ˌɪnˈheɪɫəbəɫ"], ["incapably", "ˌɪnˈkeɪpəbɫi"],
    ["incurably", "ˌɪnˈkjʊɹəbɫi"],
    ["capable", "ˈkeɪpəbəɫ"], ["curable", "ˈkjʊɹəbəɫ"],
    ["inextricable", "ɪˈnɛkstɹɪkəbəɫ"], ["inapplicable", "ɪˈnæpɫɪkəbəɫ"],
  ])("keeps the root or unaffected boundary in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves the unrelated irritable frame", () => {
    expect(engine.predict("irritable")).toBe(disableDict ? "ˈɪɹɪtəbəɫ" : "ˈɪɹətəbəɫ");
  });
  it("retains complete roots after exception eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["capable", "curable", "incapable", "incurable"]) delete access.dictionary[word];
    expect(evicted.predict("incapable")).toBe("ˌɪnˈkeɪpəbəɫ");
    expect(evicted.predict("incurable")).toBe("ˌɪnˈkjʊɹəbəɫ");
  });
  it("preserves a caller-owned root during composition", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.incapable;
    custom.addPronunciation("capable", "ˈkæpəbəɫ");
    expect(custom.predict("incapable")).toBe("ˌɪnˈkæpəbəɫ");
  });
  it("preserves adjective, noun and verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The incapable reader will work on an incurable problem.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "incapable")?.phoneme).toBe("ˌɪnˈkeɪpəbəɫ");
    expect(tokens.find(t => t.word === "incurable")?.phoneme).toBe("ˌɪnˈkjʊɹəbəɫ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});
