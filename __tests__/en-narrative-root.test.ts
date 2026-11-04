import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("narrative US root vowel", () => {
  it.each([false, true])("keeps the sourced US DRESS vowel in isolated and sentence routes (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const expected = disableDict ? "ˈnɛɹətɪv" : "ˈnæɹətɪv";
    expect(engine.predict("narrative", "en-US", "NN")).toBe(expected);
    expect(engine.predict("narrative", "en-US", "JJ")).toBe(expected);
    expect(engine.predict("narratives", "en-US", "NNS")).toBe(`${expected}z`);


    const tokens = englishTokens(engine, "The narrative includes several narratives.");
    expect(tokens.find(token => token.word.toLowerCase() === "narrative")?.phoneme).toBe(expected);
    expect(tokens.find(token => token.word.toLowerCase() === "narratives")?.phoneme).toBe(`${expected}z`);
  });
});
