import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("the compan- root keeps its source-checked STRUT vowel", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/company
    ["company", "ˈkʌmpəni"],
    // Cambridge US: https://dictionary.cambridge.org/pronunciation/english/accompany
    ["accompany", "əˈkʌmpəni"],
    ["companion", "kəmˈpænjən"],
    ["companies", "ˈkʌmpəˌniz"],
    ["accompanied", "əˈkʌmpənid"],
    ["accompanying", "əˈkʌmpəniɪŋ"],
    ["companionship", "kəmˈpænjənˌʃɪp"],
  ])("keeps the expected reading for %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["Germany", "ˈdʒɝməni"],
    ["compare", "kəmˈpɛɹ"],
    ["community", "kəˈmjunəti"],
    ["communal", "ˈkɑmənəɫ"],
    ["companionable", "kəmˈpænjənəbəɫ"],
  ])("preserves the neighboring reading for %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("keeps the readings in sentence context", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize(
      "The company will accompany its companion to Germany.",
      { language: "en-US", returnArray: true },
    );
    for (const [word, ipa] of [
      ["company", "ˈkʌmpəni"],
      ["accompany", "əˈkʌmpəni"],
      ["companion", "kəmˈpænjən"],
      ["germany", "ˈdʒɝməni"],
    ])
      expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
  });
});
