import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("nitroge- keeps the nitrogen root's PRICE vowel", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["nitrogen", "ˈnaɪtɹədʒən"],
    ["nitrogenous", "naɪˈtɹɑdʒənəs"],
  ])("uses PRICE in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["nitro", "ˈnɪtɹoʊ"],
    ["nitrous", "ˈnɪtɹəs"],
    ["nitrocellulose", "ˌnɪtɹəˈsɛɫəˌɫoʊz"],
  ])("keeps other nitro- words unchanged: %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("preserves the noun and adjective readings in sentence context", () => {

    const tokens = englishTokens(rules, "Nitrogen supports nitrogenous compounds.");
    expect(tokens.find(token => token.word === "Nitrogen")?.phoneme).toBe("ˈnaɪtɹədʒən");
    expect(tokens.find(token => token.word === "nitrogenous")?.phoneme).toBe("naɪˈtɹɑdʒənəs");
  });

  it("preserves the dictionary-backed pronunciation", () => {
    expect(new EnglishG2P().predict("nitrogen", "en-US")).toBe("ˈnaɪtɹədʒən");
  });
});
