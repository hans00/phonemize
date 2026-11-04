import EnglishG2P from "../src/en/g2p";

describe("else + deictic adverb compounds", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["elsewhere", "ˈɛɫsˌwɛɹ"],
    ["elsewhen", "ˈɛɫsˌwɛn"],
  ])("keeps the deictic tail in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["else", "ˈɛɫs"],
    ["where", "ˈhwɛɹ"],
    ["when", "ˈhwɛn"],
    ["elsewise", "ˈɛɫsˌwaɪz"],
    ["somewhere", "ˈsʌmˌwɛɹ"],
  ])("preserves the neighboring %s frame", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
