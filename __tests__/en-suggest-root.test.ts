import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("suggest lexical root on the rules route", () => {
  it.each([false, true])("preserves the dictionary reading and regular forms (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("suggest", "en-US", "VB")).toBe("səˈdʒɛst");
    expect(engine.predict("suggests", "en-US", "VBZ")).toBe("səˈdʒɛsts");
    expect(engine.predict("suggested", "en-US", "VBD")).toBe("səˈdʒɛstɪd");
    expect(engine.predict("suggesting", "en-US", "VBG")).toBe("səˈdʒɛstɪŋ");
    expect(engine.predict("suggestion", "en-US", "NN")).toBe("səˈdʒɛstʃən");
    expect(engine.predict("digest", "en-US", "NN")).toBe(disableDict ? "ˈdaɪdʒəst" : "ˈdaɪdʒɛst");


    const tokens = englishTokens(engine, "They suggest a change, then suggested it again.");
    const readings = tokens.filter(token => ["suggest", "suggested"].includes(token.word.toLowerCase()));
    expect(readings.map(token => token.phoneme)).toEqual(["səˈdʒɛst", "səˈdʒɛstɪd"]);
  });
});
