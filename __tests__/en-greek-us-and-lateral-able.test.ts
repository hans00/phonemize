import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test.each([false, true])(
  "keeps productive voiced Greek roots after eviction (rules=%s)",
  (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(engine, "dictionary") };
    for (const w of ["music", "museum", "valuable", "invaluable"]) delete d[w];
    Reflect.set(engine, "dictionary", d);
    for (const [word, ipa] of [
      ["music", "ˈmjuzɪk"],
      ["musics", "ˈmjuzɪks"],
      ["music's", "ˈmjuzɪks"],
      ["nonmusic", "nɑnˈmjuzɪk"],
      ["allmusic", "ˈɔɫˌmjuzɪk"],
      ["allmusical", "ˈɔɫˌmjuzɪkəɫ"],
      ["musical", "ˈmjuzɪkəɫ"],
      ["musically", "ˈmjuzɪkɫi"],
      ["musicality", "ˌmjuzɪˈkæɫəti"],
      ["musician", "mjuˈzɪʃən"],
      ["musicians", "mjuˈzɪʃənz"],
      ["nonmuseum", "nɑnˈmjuziəm"],
      ["valuable", "ˈvæɫjəbəɫ"],
      ["valuables", "ˈvæɫjəbəɫz"],
      ["valuably", "ˈvæɫjəbɫi"],
      ["invaluable", "ˌɪnˈvæɫjəbəɫ"],
      ["invaluably", "ˌɪnˈvæɫjəbɫi"],
      ["nonvaluable", "nɑnˈvæɫjəbəɫ"],
    ])
      expect(engine.predict(word)).toBe(ipa);
    // Supplied surname rimes and other u-able allomorphs keep their prior phones.
    expect(engine.predict("musick")).toBe("ˈmjusɪk");
    expect(engine.predict("arguable")).toBe(
      disableDict ? "ˈɑɹɡuəbəɫ" : "ˈɑɹɡjuəbəɫ",
    );
    expect(engine.predict("issuable")).toBe(
      disableDict ? "ˈɪsuəbəɫ" : "ˈɪʃuəbəɫ",
    );
    const api = createPhonemizer({ processors: [engine] });
    expect(
      api
        .phonemize("They value valuable music.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "valuable")?.phoneme,
    ).toBe("ˈvæɫjəbəɫ");
  },
);
test("preserves caller root and target ownership", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("value", "ˈzɛmp");
  expect(e.predict("valuable")).toBe("ˈzɛmpəbəɫ");
  e.addPronunciation("valuable", "ˈkɛmp");
  expect(e.predict("valuable")).toBe("ˈkɛmp");
});
