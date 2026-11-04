import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("-ally derives from the personal root (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });


  it("keeps the rule-supported weak vowel in personally", () => {
    expect(engine.predict("personally", "en")).toBe("ˈpɝsənəɫi");
    expect(engine.predict("personal", "en", "ADJ")).toBe(disableDict ? "ˈpɝsənəɫ" : "ˈpɝsɪnəɫ");
    expect(engine.predict("person", "en", "N")).toBe("ˈpɝsən");
    expect(engine.predict("person", "en", "V")).toBe("ˈpɝsən");
  });

  it("preserves the reading in a full sentence with noun and adjective controls", () => {
    const tokens = englishTokens(engine, "The person spoke personally about the personal account.");
    expect(tokens.find(token => token.word === "person")?.phoneme).toBe("ˈpɝsən");
    expect(tokens.find(token => token.word === "personally")?.phoneme).toBe("ˈpɝsənəɫi");
    expect(tokens.find(token => token.word === "personal")?.phoneme).toBe(disableDict ? "ˈpɝsənəɫ" : "ˈpɝsɪnəɫ");
  });

  it("leaves neighboring -ally families on their own root readings", () => {
    expect(engine.predict("especially", "en")).toBe("əˈspɛʃəɫi");
    expect(engine.predict("eventually", "en")).toBe("ɪˈvɛntʃuəɫi");
    expect(engine.predict("continually", "en")).toBe("kənˈtɪnjuəɫi");
  });
});
