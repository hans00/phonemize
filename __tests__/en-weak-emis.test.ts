import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";
import { applyPostStress } from "../src/en/postlex";

describe.each([false, true])("weak emis in extended forms (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test.each([
    ["chemistry", "N", "ˈkɛməstɹi"], ["premises", "N", "ˈpɹɛməsəz"],
    ["chemist", "N", "ˈkɛmɪst"], ["chemists", "N", "ˈkɛmɪsts"],
    ["chemical", "ADJ", "ˈkɛmɪkəɫ"], ["remiss", "ADJ", "ɹiˈmɪs"],
  ])("preserves the appropriate vowel in %s", (word, pos, expected) => {
    expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });

  test.each([
    ["Chemistry explains the premises.", "ˈkɛməstɹi ɪksˈpɫeɪnz ðə ˈpɹɛməsəz."],
    ["The chemist is remiss.", "ðə ˈkɛmɪst ɪz ɹiˈmɪs."],
  ])("preserves sentence context: %s", (sentence, expected) => {
    expect(api.phonemize(sentence, { language: "en-US" })).toBe(expected);
  });

  test("keeps the verbal stem outside the reduction", () => {
    if (!disableDict) expect(api.phonemize("They premise their argument on facts.", { language: "en-US" })).toBe("ðeɪ ˈpɹɛmɪs ðəɹ ˈɑɹɡjəmənt ɑn fækts.");
  });
});

test("protects stressed m and sm onsets in the spelling environment", () => {
  expect(applyPostStress("ˈmɪsəz", "emises")).toBe("ˈmɪsəz");
  expect(applyPostStress("ˈsmɪstɹi", "semistry")).toBe("ˈsmɪstɹi");
});
