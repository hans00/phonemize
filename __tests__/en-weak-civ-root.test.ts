import EnglishG2P from "../src/en/g2p";

describe("weak initial vowel in the civil family", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["civilian", "səˈvɪɫjən"],
    ["civility", "səˈvɪɫəti"],
  ])("reduces the initial vowel in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["civil", "ˈsɪvəɫ"],
    ["civilization", "ˌsɪvəɫəˈzeɪʃən"],
  ])("preserves stress-bearing root vowel in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
