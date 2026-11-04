import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("-sure before -able (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test.each([
    ["measurable", "ˈmɛʒɝəbəɫ"],
    ["pleasurable", "ˈpɫɛʒɝəbəɫ"],
    ["censurable", "ˈsɛnʃɝəbəɫ"],
    ["treasurable", "ˈtɹɛʒɝəbəɫ"],
  ])("retains the stem in %s", (word, expected) => {
    for (const pos of [undefined, "N", "ADJ", "V"]) expect(engine.predict(word, "en-US", pos)).toBe(expected);
    expect(engine.predict(word, "en-GB")).toContain(expected.includes("ʃ") ? "ʃ" : "ʒ");
    const phrase = `The ${word} result was recorded.`;
    expect(api.phonemize(phrase, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
    expect(api.phonemize(phrase, { language: "en-GB", returnArray: true }).find(token => token.word === word)?.phoneme)
      .toBe(engine.predict(word, "en-GB"));
  });

  test("retains neighboring -ure roots and derivations", () => {
    expect(engine.predict("measure")).toBe("ˈmɛʒɝ");
    expect(engine.predict("measured")).toBe("ˈmɛʒɝd");
    expect(engine.predict("measuring")).toBe("ˈmɛʒɝɪŋ");
    expect(engine.predict("measurably")).toBe("ˈmɛʒɝəbɫi");
    expect(engine.predict("measurability")).toMatch(/mɛʒɝəˈbɪɫəti$/);
    expect(engine.predict("unmeasurable")).toMatch(/mɛʒɝəbəɫ$/);
    expect(engine.predict("pleasure")).toBe("ˈpɫɛʒɝ");
    expect(engine.predict("insurable")).toMatch(/ʃʊɹəbəɫ$/);
    if (disableDict) expect(engine.predict("immeasurable")).toBe("ɪˈmɛʒɝəbəɫ");
  });

  test.each(["treasure", "treasur"])("preserves the supplied %s stem", root => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation(root, "ˈtʊɡ");
    expect(custom.predict("treasurable")).toBe("ˈtʊɡəbəɫ");
  });
  test.each(["measure", "measur"])("uses the supplied %s stem after eviction", root => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation(root, "ˈtʊɡ");
    expect(custom.predict("measurable")).toBe("ˈtʊɡəbəɫ");
    expect(custom.predict("measurably")).toBe("ˈtʊɡəbɫi");
  });
});
