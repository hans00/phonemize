import EnglishG2P from "../src/en/g2p";

describe("voiced final -se in Greek phas-/phras- roots", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["phase", "ˈfeɪz"],
    ["phrase", "ˈfɹeɪz"],
    ["paraphrase", "ˈpɛɹəˌfɹeɪz"],
  ])("voices the root in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("voices the root in rephrase while retaining its separate prefix vowel", () => {
    expect(rules.predict("rephrase", "en-US")).toBe("ɹɛˈfɹeɪz");
  });

  it.each([
    ["alphased", "ˈæɫfeɪst"],
    ["alphasing", "ˈæɫfeɪsɪŋ"],
  ])("does not voice the unrelated alpha stem in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["case", "ˈkeɪs"],
    ["base", "ˈbeɪs"],
    ["chase", "ˈtʃeɪs"],
  ])("keeps homographic -ase voiceless in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
