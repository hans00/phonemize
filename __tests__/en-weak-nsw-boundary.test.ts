import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])(
  "keeps weak nsw inside its root after eviction (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const w of [
      "answer",
      "answers",
      "answered",
      "answering",
      "answerable",
    ])
      delete d[w];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["answer", "ˈænsɝ"],
      ["answers", "ˈænsɝz"],
      ["answered", "ˈænsɝd"],
      ["answering", "ˈænsɝɪŋ"],
      ["answerable", "ˈænsɝəbəɫ"],
      ["unswerving", "ənˈswɝvɪŋ"],
      ["unswervingly", "ənˈswɝvɪŋɫi"],
      ["swerve", "ˈswɝv"],
      ["swear", "ˈswɛɹ"],
    ])
      expect(e.predict(word)).toBe(ipa);
    const api = createPhonemizer({ processors: [e] });
    for (const sentence of [
      "The answer was clear.",
      "They answer the question.",
    ])
      expect(
        api
          .phonemize(sentence, { language: "en-US", returnArray: true })
          .find((t) => t.word === "answer")
          ?.phoneme.replace(/[ˈˌ]/g, ""),
      ).toBe("ænsɝ");
  },
);
test("keeps supplied roots and targets", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("answer", "ˈzɛmp");
  expect(e.predict("answered")).toBe("ˈzɛmpt");
  e.addPronunciation("answerable", "ˈtɛst");
  expect(e.predict("answerable")).toBe("ˈtɛst");
});
