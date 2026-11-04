import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("minister weak second syllable", () => {
  it.each([false, true])("preserves noun/verb readings and ministry control (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("minister", "en-US", "NN")).toBe("ˈmɪnəstɝ");
    expect(engine.predict("minister", "en-US", "VB")).toBe("ˈmɪnəstɝ");
    expect(engine.predict("ministers", "en-US", "NNS")).toBe("ˈmɪnəstɝz");
    expect(engine.predict("ministry", "en-US", "NN")).toBe(disableDict ? "ˈmɪnɪstɹi" : "ˈmɪnəstɹi");


    const tokens = englishTokens(engine, "The minister served in the ministry.");
    expect(tokens.find(token => token.word.toLowerCase() === "minister")?.phoneme).toBe("ˈmɪnəstɝ");
    expect(tokens.find(token => token.word.toLowerCase() === "ministry")?.phoneme)
      .toBe(disableDict ? "ˈmɪnɪstɹi" : "ˈmɪnəstɹi");
  });
});
