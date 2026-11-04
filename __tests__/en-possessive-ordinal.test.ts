import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("possessive ordinal noun phrase (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  const tag = (sentence: string, word: string) => {
    const words = sentence.match(/[A-Za-z]+(?:['’]s)?|[^A-Za-z\s]/g) ?? [];
    const index = words.findIndex(token => token.toLowerCase() === word);
    return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
  };

  test("recognizes the noun after a possessive and ordinal", () => {
    expect(tag("Euclid's fifth postulate of geometry.", "postulate")).toBe("N");
    expect(tag("Euclid's second postulate.", "postulate")).toBe("N");
    expect(tag("Mary's first record of the event survived.", "record")).toBe("N");
    expect(tag("Mary's second permit for the project expired.", "permit")).toBe("N");
    if (!disableDict) expect(api.phonemize("Euclid's fifth postulate of geometry.", { language: "en-US" })).toContain("ˈpɑstʃəɫət");
  });

  test("retains verbs when the ordinal is the subject", () => {
    expect(tag("Mary's fifth leads the team.", "leads")).toBe("V");
    expect(tag("They will postulate the theory.", "postulate")).toBe("V");
    expect(tag("Mary's health permits travel.", "permits")).not.toBe("N");
    expect(tag("Mary's first separate account was closed.", "separate")).not.toBe("N");
    if (!disableDict) expect(api.phonemize("They will postulate the theory.", { language: "en-US" })).toContain("ˈpɑstʃəˌɫeɪt");
  });
});
