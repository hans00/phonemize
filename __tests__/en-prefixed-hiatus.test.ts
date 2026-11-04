import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("Prefixed open roots before -ing (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it.each([
    ["ongoing", "ˈɑnˌɡoʊɪŋ"], ["misdoing", "ˌmɪsˈduɪŋ"],
    ["reseeing", "ˌɹiˈsiɪŋ"], ["onseeing", "ˈɑnˌsiɪŋ"],
    ["outdoing", "ˌaʊtˈduɪŋ"], ["redoings", "ɹiˈduɪŋz"],
  ])("preserves the hiatus in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it("does not invent a we prefix for wellbeing", () => {
    expect(engine.predict("wellbeing")).toMatch(/^[ˈˌ]?wɛɫ/);
  });

  it("keeps the complete noun stem in an OOV inflection", () => {
    expect(engine.predict("mangoing")).toBe("ˈmæŋɡoʊɪŋ");
  });

  it("retains the original open roots", () => {
    expect(engine.predict("doing")).toBe("ˈduɪŋ");
    expect(engine.predict("seeing")).toBe("ˈsiɪŋ");
    expect(engine.predict("going")).toMatch(/^ˈɡoʊɪ[nŋ]$/);
  });

  it("preserves adjective, noun and verb controls in a full sentence", () => {
    const tokens = englishTokens(engine, "The ongoing work is useful; they will work.");
    expect(tokens.find(t => t.word === "ongoing")?.phoneme).toBe("ˈɑnˌɡoʊɪŋ");
    expect(tokens.find(t => t.word === "useful")?.phoneme).toBe(engine.predict("useful", "en-US", "!V"));
    expect(tokens.filter(t => t.word === "work").map(t => t.phoneme)).toEqual(["wɝk", "wɝk"]);
  });
});
