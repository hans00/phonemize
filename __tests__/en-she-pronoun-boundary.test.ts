import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("standalone she rule boundary (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it.each([
    ["she", "ˈʃi"],
    ["shekel", "ˈʃɛkəɫ"],
    ["shepard", "ˈʃɛpɝd"],
    ["shepley", "ˈʃɛpɫi"],
    ["sheba", "ˈʃibə"],
  ])("preserves the right reading in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it("keeps pronoun and noun readings distinct in a sentence", () => {

    const tokens = englishTokens(engine, "She said the shekel is gone.");
    expect(tokens.find(t => t.word.toLowerCase() === "she")?.phoneme).toBe("ʃi");
    expect(tokens.find(t => t.word.toLowerCase() === "shekel")?.phoneme).toBe("ˈʃɛkəɫ");
  });

  if (!disableDict) it("retains the lexical /p/ of shepherd", () => {
    expect(engine.predict("shepherd")).toBe("ˈʃɛpɝd");
  });
});
