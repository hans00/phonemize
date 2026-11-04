import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak niv vowel (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test.each([
    ["anniversary", "N", "ˌænəˈvɝsɝi"],
    ["carnival", "N", "ˈkɑɹnəvəɫ"],
    ["carnivores", "N", "ˈkɑɹnəˌvɔɹz"],
    ["carnivorous", "ADJ", "kɑɹˈnɪvɝəs"],
    ["snivel", "V", "ˈsnɪvəɫ"],
    ["percival", "N", "ˈpɝsɪvəɫ"],
  ])("preserves stress and vowel in %s", (word, pos, expected) => {
    expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });

  test("does not reduce the transparent mini- boundary", () => {
    expect(engine.predict("minivan", "en-US", "N")).not.toContain("nəv");
    expect(engine.predict("univas", "en-US", "N")).not.toContain("nəv");
  });

  test("retains the stem pronunciation in an OOV agent noun", () => {
    expect(engine.predict("carnivaler", "en-US", "N")).toBe("ˈkɑɹnəvəɫɝ");
  });

  test.each([
    ["The carnival marks our anniversary.", "ðə ˈkɑɹnəvəɫ mɑɹks aʊɝ ˌænəˈvɝsɝi."],
    ["Carnivorous animals snivel.", "kɑɹˈnɪvɝəs ˈænəməɫz ˈsnɪvəɫ."],
  ])("preserves full context: %s", (sentence, expected) => {
    expect(api.phonemize(sentence, { language: "en-US" })).toBe(expected);
  });
});
