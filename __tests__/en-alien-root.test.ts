import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("alien lexical stress and hiatus", () => {
  it.each([false, true])("preserves the alienate reading while fixing alien and its plural (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("alien", "en-US", "NN")).toBe("ˈeɪɫiən");
    expect(engine.predict("alien", "en-US", "JJ")).toBe("ˈeɪɫiən");
    expect(engine.predict("aliens", "en-US", "NNS")).toBe("ˈeɪɫiənz");
    expect(engine.predict("alienate", "en-US", "VB")).toBe(disableDict ? "ˈeɪɫiəˌneɪt" : "ˈeɪɫjəˌneɪt");
    expect(engine.predict("alienated", "en-US", "VBD")).toBe("ˈeɪɫiəˌneɪtɪd");
    expect(engine.predict("alienates", "en-US", "VBZ")).toBe("ˈeɪɫiəˌneɪts");
    expect(engine.predict("alienating", "en-US", "VBG")).toBe("ˈeɪɫiəˌneɪtɪŋ");
    expect(engine.predict("alienation", "en-US", "NN")).toBe("ˌeɪɫiəˈneɪʃən");


    const tokens = englishTokens(engine, "An alien visitor met two aliens; the insult alienated and alienates people, causing alienation.");
    const readings = tokens.filter(token => ["alien", "aliens", "alienated", "alienates", "alienation"].includes(token.word.toLowerCase()));
    expect(readings.map(token => token.phoneme)).toEqual([
      "ˈeɪɫiən", "ˈeɪɫiənz", "ˈeɪɫiəˌneɪtɪd", "ˈeɪɫiəˌneɪts", "ˌeɪɫiəˈneɪʃən",
    ]);
  });
});
