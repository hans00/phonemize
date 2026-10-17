import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const primary = (p: string | null) => p?.replace(/ˌ/g, "");
test.each([false, true])(
  "keeps weak French ou and silent ette noun roots after eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const word of ["roulette", "cassette"]) delete d[word];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["roulette", "ɹuˈɫɛt"],
      ["roulettes", "ɹuˈɫɛts"],
      ["roulette's", "ɹuˈɫɛts"],
      ["nonroulette", "nɑnɹuˈɫɛt"],
      ["cassette", "kəˈsɛt"],
      ["cassettes", "kəˈsɛts"],
      ["noncassette", "nɑnkəˈsɛt"],
      ["diskette", "dɪˈskɛt"],
    ])
      expect(primary(e.predict(word))).toBe(ipa);
    for (const [word, ipa] of [
      ["foul", "ˈfaʊɫ"],
      ["fouler", "ˈfaʊɫɝ"],
      ["foulest", "ˈfaʊɫəst"],
      ["fouled", "ˈfaʊɫd"],
      ["fouling", "ˈfaʊɫɪŋ"],
      ["foulness", "ˈfaʊɫnəs"],
      ["foully", "ˈfaʊɫi"],
    ])
      expect(e.predict(word)).toBe(ipa);
    const api = createPhonemizer({ processors: [e] });
    expect(
      primary(
        api
          .phonemize("The roulette wheel and the cassette are ready.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "roulette")?.phoneme ?? null,
      ),
    ).toBe("ɹuˈɫɛt");
  },
);
test("keeps custom root and target priority", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("roulette", "ˈzɛmp");
  expect(e.predict("roulettes")).toBe("ˈzɛmps");
  e.addPronunciation("roulettes", "ˈkɛmp");
  expect(e.predict("roulettes")).toBe("ˈkɛmp");
});
