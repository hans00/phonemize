import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Cambridge American Dictionary hurricane /ˈhɜr·əˌkeɪn/ and
// Cambridge US cyclone /ˈsaɪ.kloʊn/; regular inflections preserve these stems.
describe("verified storm dictionary readings", () => {
  const engine = new EnglishG2P();
  test.each([
    ["hurricane", "ˈhɝəˌkeɪn"],
    ["hurricanes", "ˈhɝəˌkeɪnz"],
    ["hurricane's", "ˈhɝəˌkeɪnz"],
    ["cyclone", "ˈsaɪkɫoʊn"],
    ["cyclones", "ˈsaɪkɫoʊnz"],
    ["cyclone's", "ˈsaɪkɫoʊnz"],
  ])("preserves the vouched reading in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
    expect(engine.predict(word, "en-US", "N")).toBe(ipa);
  });
  test("preserves full noun contexts and adjective/verb controls", () => {

    const tokens = englishTokens(engine, "The hurricane is strong. The cyclone is large. Cyclones move quickly.");
    expect(tokens.filter(token => /^(?:hurricane|cyclone|Cyclones)$/.test(token.word)).map(token => token.phoneme)).toEqual(["ˈhɝəˌkeɪn", "ˈsaɪkɫoʊn", "ˈsaɪkɫoʊnz"]);
    expect(tokens.find(token => token.word === "strong")?.phoneme).toBe("stɹɔŋ");
    expect(tokens.find(token => token.word === "move")?.phoneme).toBe("muv");
  });
});
