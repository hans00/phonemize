import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])(
  "owns single-s ium roots after eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const w of ["cesium", "magnesium", "symposium", "gymnasium"])
      delete d[w];
    Reflect.set(e, "dictionary", d);
    // This class owns primary stress, vowel quality and s/z; optional secondary and dark-l notation are unchanged.
    for (const [word, ipa] of [
      ["cesium", "ˈsiziəm"],
      ["magnesium", "mæɡˈniziəm"],
      ["symposium", "sɪmˈpoʊziəm"],
      ["gymnasium", "dʒɪmˈneɪziəm"],
      ["gymnasiums", "dʒɪmˈneɪziəmz"],
      ["nonmagnesium", "nɑnmæɡˈniziəm"],
      ["potassium", "pəˈtæsiəm"],
      ["calcium", "ˈkælsiəm"],
      ["stadium", "ˈsteɪdiəm"],
    ])
      expect(e.predict(word)?.replace(/ˌ/g, "").replace(/ɫ/g, "l")).toBe(ipa);
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("The gymnasium contains magnesium samples.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "gymnasium")?.phoneme,
    ).toBe("dʒɪmˈneɪziəm");
  },
);
test("preserves supplied roots and targets", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("gymnasium", "ˈzɛmp");
  expect(e.predict("gymnasiums")).toBe("ˈzɛmps");
  e.addPronunciation("magnesium", "ˈtɛst");
  expect(e.predict("magnesium")).toBe("ˈtɛst");
});
