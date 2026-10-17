import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])(
  "keeps the ulative root beat and weak linker after eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const word of [
      "cumulative",
      "speculative",
      "cumulatively",
      "speculatively",
    ])
      delete d[word];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["cumulative", "ˈkjumjəɫətɪv"],
      ["cumulatively", "ˈkjumjəɫətɪvɫi"],
      ["noncumulative", "nɑnˈkjumjəɫətɪv"],
      ["speculative", "ˈspɛkjəɫətɪv"],
      ["speculatively", "ˈspɛkjəɫətɪvɫi"],
      ["nonspeculative", "nɑnˈspɛkjəɫətɪv"],
    ])
      expect(e.predict(word)).toBe(ipa);
    expect(e.predict("alternative")).toBe("ɔɫˈtɝnətɪv");
    expect(e.predict("combative")?.replace(/ˌ/g, "")).toMatch(/ˈbætɪv$/);
    expect(e.predict("cumulus")).toBe("ˈkjumjəɫəs");
    expect(e.predict("speculate")?.replace(/ˌ/g, "")).toBe("ˈspɛkjəɫeɪt");
    expect(e.predict("speculator")?.replace(/ˌ/g, "")).toBe("ˈspɛkjəɫeɪtɝ");
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("The cumulative score supports a speculative model.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "cumulative")?.phoneme,
    ).toBe("ˈkjumjəɫətɪv");
  },
);
test("preserves supplied adjective roots and targets", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("cumulative", "ˈzɛmp");
  expect(e.predict("cumulatively")).toBe("ˈzɛmpɫi");
  expect(e.predict("noncumulative")).toBe("nɑnˈzɛmp");
  e.addPronunciation("cumulatively", "ˈkɛmp");
  expect(e.predict("cumulatively")).toBe("ˈkɛmp");
});
test.each([
  ["The present moment matters.", "present", "ˈpɹɛzənt"],
  ["They present the award.", "present", "pɹɪˈzɛnt"],
  ["The record was clear.", "record", "ˈɹɛkɝd"],
])(
  "preserves paired adjective, verb and noun controls: %s",
  (sentence, word, ipa) => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(
      api
        .phonemize(sentence, { language: "en-US", returnArray: true })
        .find((t) => t.word === word)?.phoneme,
    ).toBe(ipa);
  },
);
