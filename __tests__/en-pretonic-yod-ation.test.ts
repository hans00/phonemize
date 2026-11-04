import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("pretonic yod reduction (rules=%s)", disableDict => {
  it("reduces before the -ation stress while keeping the verb vowel", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("compute")).toBe("kəmˈpjut");
    expect(engine.predict("computation")).toBe("ˌkɑmpjəˈteɪʃən");

    const tokens = englishTokens(engine, "They compute the result before the computation starts.");
    expect(tokens.find(t => t.word === "compute")?.phoneme).toContain("pjut");
    expect(tokens.find(t => t.word === "computation")?.phoneme).toContain("pjəˈteɪʃən");
  });
  it("preserves explicit caller pronunciations", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("computation", "ˈzɛŋ");
    expect(engine.predict("computation")).toBe("ˈzɛŋ");
  });
});
