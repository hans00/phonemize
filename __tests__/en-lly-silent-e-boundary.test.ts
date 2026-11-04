import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("independent -lly nouns retain their vowel (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  test.each([["filly", "ˈfɪɫi"], ["fillies", "ˈfɪɫiz"], ["holly", "ˈhɑɫi"]])("keeps %s as a noun", (word, expected) => {
    expect(engine.predict(word, "en-US", "N")).toBe(expected);
  });
  test("keeps the noun and its plural in a complete sentence", () => {
    const tokens = englishTokens(engine, "The filly joined the other fillies.");
    expect(tokens.find(token => token.word === "filly")?.phoneme).toBe("ˈfɪɫi");
    expect(tokens.find(token => token.word === "fillies")?.phoneme).toBe("ˈfɪɫiz");
  });
});
