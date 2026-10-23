import EnglishG2P from "../src/en/g2p";

const rules = new EnglishG2P({ disableDict: true });
const segmental = (word: string) => (rules.predict(word) ?? "").replace(/[ˈˌ]/g, "");

describe("hard g across a closed compound boundary before -in", () => {
  it.each([
    ["login", "ɫɔɡɪn"],
    ["plugin", "pɫʌɡɪn"],
    ["logins", "ɫɔɡɪnz"],
    ["plugins", "pɫʌɡɪnz"],
  ])("retains the free stem pronunciation in %s", (word, expected) => {
    expect(segmental(word)).toBe(expected);
  });

  it.each([
    ["begin", "bɪˈɡɪn"],
    ["virgin", "ˈvɝdʒɪn"],
    ["origin", "ˈɔɹɪdʒɪn"],
    ["margin", "ˈmɑɹdʒɪn"],
  ])("preserves the lexical soft-g reading of %s", (word, expected) => {
    expect(rules.predict(word)).toBe(expected);
  });
});
