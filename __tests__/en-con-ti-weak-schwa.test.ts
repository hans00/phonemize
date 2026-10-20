import EnglishG2P from "../src/en/g2p";

describe("weak unprefixed con-ti-n syllables", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["continental", "ˌkɑntəˈnɛntəɫ"],
    ["continuity", "ˌkɑntəˈnuəti"],
  ])("centralizes the unstressed i in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["continue", "kənˈtɪnju"],
    ["continuous", "kənˈtɪnjuəs"],
    ["continuation", "kənˌtɪnjuˈeɪʃən"],
    ["subcontinent", "ˌsʌbˈkɑntənənt"],
  ])("preserves the existing contrast in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
