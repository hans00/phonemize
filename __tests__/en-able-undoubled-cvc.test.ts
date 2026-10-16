import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("undoubled roots before -able (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["capable", "ˈkeɪpəbəɫ"], ["curable", "ˈkjʊɹəbəɫ"],
    ["notable", "ˈnoʊtəbəɫ"], ["potable", "ˈpoʊtəbəɫ"],
    ["salable", "ˈseɪɫəbəɫ"], ["ridable", "ˈɹaɪdəbəɫ"],
    ["ratable", "ˈɹeɪtəbəɫ"], ["datable", "ˈdeɪtəbəɫ"],
  ])("retains the restored silent-e vowel in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([
    ["livable", "ˈɫɪvəbəɫ"], ["unlivable", "ənˈɫɪvəbəɫ"],
    ["tenable", "ˈtɛnəbəɫ"], ["untenable", "ənˈtɛnəbəɫ"],
    ["taxable", "ˈtæksəbəɫ"], ["fixable", "ˈfɪksəbəɫ"], ["mixable", "ˈmɪksəbəɫ"],
    ["cappable", "ˈkæpəbəɫ"], ["rattable", "ˈɹætəbəɫ"], ["hoppable", "ˈhɑpəbəɫ"],
    ["excusable", "ɪkˈskjuzəbəɫ"], ["combinable", "kəmˈbaɪnəbəɫ"],
  ])("preserves spelling contrasts or a verb reading in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps roots available to outer morphology after eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["capable", "notable", "curable"]) delete access.dictionary[word];
    for (const [word, ipa] of [
      ["capably", "ˈkeɪpəbɫi"], ["notably", "ˈnoʊtəbɫi"],
      ["uncurable", "ənˈkjʊɹəbəɫ"], ["noncapable", "nɑnˈkeɪpəbəɫ"],
    ]) expect(evicted.predict(word)).toBe(ipa);
  });
  it("preserves prefix stress after a vouched silent-e root leaves the table", () => {
    for (const word of ["dislike", "disliked", "dislikes", "disliking"]) {
      expect(engine.predict(word)).toMatch(/^dɪ(?:sˈ|ˈs)ɫaɪk(?:t|s|ɪŋ)?$/);
    }
    expect(engine.predict("discount")).toBe("ˈdɪskaʊnt");
  });
  // Cambridge US: /dɪˈfjuː.zə.bəl/, https://dictionary.cambridge.org/dictionary/english/diffusible
  it("uses the voiced verb stem in diffusible", () => {
    expect(engine.predict("diffusible")).toBe("dɪˈfjuzəbəɫ");
  });
  it("preserves caller-owned silent-e stems", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("cure", "ˈkjʊɹ");
    custom.addPronunciation("live", "ˈɫɪv");
    expect(custom.predict("curable")).toBe("ˈkjʊɹəbəɫ");
    expect(custom.predict("livable")).toBe("ˈɫɪvəbəɫ");
  });
  it("preserves noun, adjective and finite verb controls in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The capable reader will work with a livable plan.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "capable")?.phoneme).toBe("ˈkeɪpəbəɫ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    expect(tokens.find(t => t.word === "livable")?.phoneme).toBe("ˈɫɪvəbəɫ");
  });
});

it("retains the existing source pronunciation of Valable on the default path", () => {
  expect(new EnglishG2P().predict("Valable")).toBe("ˈvæɫəbəɫ");
  expect(new EnglishG2P().predict("Dismore")).toBe("ˈdɪsmɔɹ");
});
