import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])(
  "keeps silent-u quette roots through plural and prefix recovery (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const word of ["marquette", "briquette"]) delete d[word];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["briquette", "bɹɪˈkɛt"],
      ["briquettes", "bɹɪˈkɛts"],
      ["marquette", "mɑɹˈkɛt"],
      ["marquettes", "mɑɹˈkɛts"],
      ["nonmarquette", "nɑnmɑɹˈkɛt"],
      ["banquette", "bæŋˈkɛt"],
      ["banquet", "ˈbæŋkwət"],
    ])
      expect(e.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    expect(e.predict("coquette")).toMatch(/ˈkɛt$/);
    expect(e.predict("coquette")).not.toContain("kw");
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("The briquettes are ready.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "briquettes")?.phoneme,
    ).toBe("bɹɪˈkɛts");
  },
);
test("preserves supplied quette targets", () => {
  const e = new EnglishG2P();
  e.addPronunciation("briquette", "ˈzɛmp");
  expect(e.predict("briquette")).toBe("ˈzɛmp");
});
