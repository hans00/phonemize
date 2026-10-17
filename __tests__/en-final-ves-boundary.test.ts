import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])(
  "keeps medial ves vocalic after root eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict }),
      d = { ...Reflect.get(e, "dictionary") };
    for (const w of ["vessel", "vessels"]) delete d[w];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["vessel", "ˈvɛsəl"],
      ["vessels", "ˈvɛsəlz"],
      ["nonvessel", "nɑnˈvɛsəl"],
      ["loaves", "ˈloʊvz"],
      ["selves", "ˈsɛlvz"],
      ["wolves", "ˈwʊlvz"],
    ])
      expect(e.predict(word)?.replace(/ɫ/g, "l")).toBe(ipa);
    expect(e.predict("eavesdrop")).toBe(disableDict ? "iˈvzdɹʌp" : "ˈivzˌdɹɑp");
    expect(e.predict("ArchivesThe")).toBe("ˈɑɹkɪvzð");
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("The vessel carries several loaves.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "vessel")
        ?.phoneme.replace(/ɫ/g, "l"),
    ).toBe("ˈvɛsəl");
  },
);
test("preserves supplied roots and targets", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("vessel", "ˈzɛmp");
  expect(e.predict("vessels")).toBe("ˈzɛmps");
  e.addPronunciation("vessels", "ˈtɛst");
  expect(e.predict("vessels")).toBe("ˈtɛst");
});
