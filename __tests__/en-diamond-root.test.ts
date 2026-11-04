import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("diamond lexical stress", () => {
  it.each([false, true])("keeps the sourced noun/adjective root and derived compound (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("diamond", "en-US", "NN")).toBe("ˈdaɪmənd");
    expect(engine.predict("diamond", "en-US", "JJ")).toBe("ˈdaɪmənd");
    expect(engine.predict("diamonds", "en-US", "NNS")).toBe("ˈdaɪməndz");
    expect(engine.predict("diamondback", "en-US", "NN")).toBe("daɪəˈmɑndbæk");
    expect(engine.predict("diameter", "en-US", "NN")).toBe("daɪˈæmətɝ");
    expect(engine.predict("diary", "en-US", "NN")).toBe("ˈdaɪɝi");


    const tokens = englishTokens(engine, "The diamond has a diamond-shaped face.");
    expect(tokens.find(token => token.word.toLowerCase() === "diamond")?.phoneme).toBe("ˈdaɪmənd");
  });
});
