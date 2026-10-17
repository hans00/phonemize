import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";
test.each([false, true])(
  "keeps weak acy root stress after eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict }),
      d = { ...Reflect.get(e, "dictionary") };
    delete d.advocacy;
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["advocacy", "ˈædvəkəsi"],
      ["advocacies", "ˈædvəkəsiz"],
      ["nonadvocacy", "nɑnˈædvəkəsi"],
    ])
      expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
    // The remaining weak i variants are separate errors; this class owns the root beat.
    for (const [word, primary] of [
      ["delicacy", 0],
      ["intricacy", 0],
      ["obstinacy", 0],
      ["indelicacy", 1],
      ["candidacy", 0],
      ["privacy", 0],
      ["democracy", 1],
    ] as const)
      expect(parseIpa(e.predict(word)!).primary).toBe(primary);
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("Their advocacy changed the policy.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "advocacy")?.phoneme,
    ).toBe("ˈædvəkəsi");
  },
);
test("preserves supplied noun roots and targets", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("advocacy", "ˈzɛmp");
  expect(e.predict("advocacies")).toBe("ˈzɛmps");
  expect(e.predict("nonadvocacy")).toBe("nɑnˈzɛmp");
  e.addPronunciation("nonadvocacy", "ˈtɛst");
  expect(e.predict("nonadvocacy")).toBe("ˈtɛst");
});
