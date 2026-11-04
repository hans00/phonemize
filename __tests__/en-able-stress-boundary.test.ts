import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("weak -able root and stress controls (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  test.each(["interminable", "determinable"])("keeps the weak stem vowel of %s", word => {
    const phrase = `The ${word} debate continued.`;
    for (const pos of [undefined, "ADJ", "N", "V"]) {
      expect(engine.predict(word, "en-US", pos)).toMatch(/ˈtɝm[əɪ]nəbəɫ$/);
    }
    expect(api.phonemize(phrase, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme)
      .toMatch(/ˈtɝm[əɪ]nəbəɫ$/);
  });

  test("inherits the witnessed -ply root through in- without changing lexical -plicable roots", () => {
    const applicable = disableDict ? "əˈpɫɪkəbəɫ" : "ˈæpɫəkəbəɫ";
    const inapplicable = disableDict ? "ˌɪnəˈpɫɪkəbəɫ" : "ˌɪˈnæpɫɪkəbəɫ";
    for (const pos of [undefined, "ADJ", "N", "V"]) {
      expect(engine.predict("applicable", "en-US", pos)).toBe(applicable);
      expect(engine.predict("inapplicable", "en-US", pos)).toBe(inapplicable);
      expect(engine.predict("replicable", "en-US", pos)).toBe("ɹiˈpɫɪkəbəɫ");
      expect(engine.predict("relicable", "en-US", pos)).toBe("ˈɹɛɫɪkəbəɫ");
    }
    expect(engine.predict("invisible", "en-US")).toBe("ˌɪnˈvɪzəbəɫ");
    expect(engine.predict("inflexible", "en-US")).toBe("ˌɪnˈfɫɛksəbəɫ");

    for (const word of ["applicable", "inapplicable", "replicable"]) {
      const phrase = `An ${word} result was recorded.`;
      expect(api.phonemize(phrase, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme)
        .toBe(engine.predict(word, "en-US"));
    }
  });
});
