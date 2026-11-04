import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("climb root and inflections", () => {
  it.each([false, true])("preserves the long-I root across forms (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    for (const word of ["climb", "climbs", "climbed", "climbing", "climber"]) {
      expect(engine.predict(word, "en-US")).toContain("aɪm");
    }
    expect(engine.predict("limb", "en-US")).toBe("ˈɫɪm");
    expect(engine.predict("bomb", "en-US")).toBe("ˈbɑm");

    const tokens = englishTokens(engine, "They climbed the hill while the climber followed.");
    expect(tokens.find(token => token.word === "climbed")?.phoneme).toBe("kɫaɪmd");
    expect(tokens.find(token => token.word === "climber")?.phoneme).toBe("ˈkɫaɪmɝ");
  });
});
