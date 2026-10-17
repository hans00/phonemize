import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";
test.each([false, true])(
  "retains complete compound tails before inflection guessing (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict }),
      d = { ...Reflect.get(e, "dictionary") };
    for (const w of ["inbred", "thoroughbred"]) delete d[w];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["inbred", "ˈɪnbɹɛd"],
      ["inbreds", "ˈɪnbɹɛdz"],
      ["inbredness", "ˈɪnbɹɛdnəs"],
      ["noninbred", "nɑnˈɪnbɹɛd"],
      ["outbred", "ˈaʊtbɹɛd"],
      ["wellbred", "ˈwɛlbɹɛd"],
      ["thoroughbred", "ˈθɝoʊbɹɛd"],
      ["thoroughbreds", "ˈθɝoʊbɹɛdz"],
      ["nonthoroughbred", "nɑnˈθɝoʊbɹɛd"],
      ["fired", "ˈfaɪɝd"],
      ["centred", "ˈsɛntɹd"],
    ])
      expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
    const api = createPhonemizer({ processors: [e] });
    for (const sentence of [
      "The inbred line was healthy.",
      "The thoroughbred won the race.",
    ])
      expect(
        api
          .phonemize(sentence, { language: "en-US", returnArray: true })
          .find((t) => /^(inbred|thoroughbred)$/.test(t.word))?.phoneme,
      ).toContain("bɹɛd");
  },
);
test("keeps supplied compound roots and explicit forms", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("inbred", "ˈzɛmp");
  expect(e.predict("inbreds")).toBe("ˈzɛmps");
  expect(e.predict("noninbred")).toBe("nɑnˈzɛmp");
  e.addPronunciation("noninbred", "ˈtɛst");
  expect(e.predict("noninbred")).toBe("ˈtɛst");
});
