import EnglishG2P from "../src/en/g2p";

describe("the <wol.f> rime", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["wolf", "ˈwʊɫf"],
    ["wolfish", "ˈwʊɫfɪʃ"],
    ["wolfishness", "ˈwʊɫfɪʃnəs"],
    ["wolfman", "ˈwʊɫfmən"],
    ["wolfram", "ˈwʊɫfɹəm"],
    ["wolf's", "ˈwʊɫfs"],
  ])("predicts the <wolf> root in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["wold", "ˈwoʊɫd"],
    ["golf", "ˈɡɑɫf"],
    ["wool", "ˈwʊɫ"],
    ["wood", "ˈwʊd"],
    ["woman", "ˈwʊmən"],
  ])("preserves the neighboring <wo>/<ol> rime in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
