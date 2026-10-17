import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";
test.each([false, true])(
  "keeps imacy root beat and weak linker after eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict }),
      d = { ...Reflect.get(e, "dictionary") };
    delete d.intimacy;
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["intimacy", "ˈɪntəməsi"],
      ["intimacies", "ˈɪntəməsiz"],
      ["nonintimacy", "nɑnˈɪntəməsi"],
    ])
      expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
    for (const [word, primary] of [
      ["legitimacy", 1],
      ["illegitimacy", 2],
      ["democracy", 1],
      ["privacy", 0],
    ] as const)
      expect(parseIpa(e.predict(word)!).primary).toBe(primary);
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("Their intimacy surprised the visitors.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "intimacy")?.phoneme,
    ).toBe("ˈɪntəməsi");
  },
);
test("keeps supplied roots and targets", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("intimacy", "ˈzɛmp");
  expect(e.predict("intimacies")).toBe("ˈzɛmps");
  expect(e.predict("nonintimacy")).toBe("nɑnˈzɛmp");
  e.addPronunciation("nonintimacy", "ˈtɛst");
  expect(e.predict("nonintimacy")).toBe("ˈtɛst");
});
