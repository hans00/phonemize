import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])(
  "owns the doubled-r ow root after eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const w of ["arrow", "arrows", "arrowed", "arrowing"]) delete d[w];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["arrow", "ˈæɹoʊ"],
      ["arrows", "ˈæɹoʊz"],
      ["arrowed", "ˈæɹoʊd"],
      ["arrowing", "ˈæɹoʊɪŋ"],
      ["narrow", "ˈnæɹoʊ"],
      ["barrow", "ˈbæɹoʊ"],
      ["aglow", "əˈɡɫoʊ"],
      ["arrive", "ɝˈaɪv"],
      ["array", "ɝˈeɪ"],
      ["arrange", "ɝˈeɪndʒ"],
    ])
      expect(e.predict(word)).toBe(ipa);
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("The arrow points toward a narrow opening.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "arrow")?.phoneme,
    ).toBe("ˈæɹoʊ");
  },
);
test("preserves supplied roots and targets", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("arrow", "ˈzɛmp");
  expect(e.predict("arrows")).toBe("ˈzɛmps");
  e.addPronunciation("arrowed", "ˈtɛst");
  expect(e.predict("arrowed")).toBe("ˈtɛst");
});
