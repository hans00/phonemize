import EnglishG2P from "../src/en/g2p";

describe("Greek criterion root PRICE vowel", () => {
  const g2p = new EnglishG2P({ disableDict: true });

  it.each([
    ["criterion", "kɹaɪˈtɪɹiən"],
    ["criteria", "kɹaɪˈtɪɹiə"],
    ["criterial", "kɹaɪˈtɪɹiəɫ"],
    ["criterium", "kɹaɪˈtɪɹiəm"],
  ])("retains the Greek root vowel in %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["crime", "ˈkɹaɪm"],
    ["critical", "ˈkɹɪtɪkəɫ"],
    ["cricket", "ˈkɹɪkət"],
    ["cried", "ˈkɹaɪd"],
  ])("preserves neighboring <cri> words: %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });
});
