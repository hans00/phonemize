import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("independent -lly nouns retain their vowel (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  test.each([["filly", "ˈfɪɫi"], ["fillies", "ˈfɪɫiz"], ["holly", "ˈhɑɫi"]])("keeps %s as a noun", (word, expected) => {
    expect(engine.predict(word, "en-US", "N")).toBe(expected);
  });
  test("keeps the noun and its plural in a complete sentence", () => {
    const tokens = api.phonemize("The filly joined the other fillies.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "filly")?.phoneme).toBe("ˈfɪɫi");
    expect(tokens.find(token => token.word === "fillies")?.phoneme).toBe("ˈfɪɫiz");
  });
});
