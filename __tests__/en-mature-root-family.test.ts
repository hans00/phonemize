import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const rules = new EnglishG2P({ disableDict: true });

describe("matur- stem stress and reflexes", () => {
  it.each([
    ["mature", "məˈtʃʊɹ"],
    ["immature", "ˌɪməˈtʃʊɹ"],
    ["matured", "məˈtʃʊɹd"],
    ["maturing", "məˈtʃʊɹɪŋ"],
    ["maturity", "məˈtʃʊɹəti"],
    ["immaturity", "ˌɪməˈtʃʊɹəti"],
    ["maturities", "məˈtʃʊɹətiz"],
    ["maturation", "ˌmætʃəɹˈeɪʃən"],
  ])("renders the verified root reading in %s", (word, expected) => {
    expect(rules.predict(word)).toBe(expected);
  });

  it.each([
    ["nature", "ˈneɪtʃɝ"],
    ["future", "ˈfjutʃɝ"],
    ["premature", "ˌpɹiməˈtʃʊɹ"],
    ["prematurely", "ˌpɹiməˈtʃʊɹɫi"],
    ["temperature", "ˈtɛmpɝətʃɝ"],
    ["stature", "ˈstætʃɝ"],
  ])("leaves neighboring -ture words intact: %s", (word, expected) => {
    expect(rules.predict(word)).toBe(expected);
  });

  it("keeps adjective, verb and noun readings stable in full-sentence context", () => {
    expect(rules.predict("mature", "en-US", "ADJ")).toBe("məˈtʃʊɹ");
    expect(rules.predict("mature", "en-US", "V")).toBe("məˈtʃʊɹ");
    expect(rules.predict("maturity", "en-US", "N")).toBe("məˈtʃʊɹəti");
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("The immature child will mature, and the fruit reaches maturity.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "immature")?.phoneme).toBe("ˌɪməˈtʃʊɹ");
    expect(tokens.find(token => token.word === "mature")?.phoneme).toBe("məˈtʃʊɹ");
    expect(tokens.find(token => token.word === "maturity")?.phoneme).toBe("məˈtʃʊɹəti");
  });
});
