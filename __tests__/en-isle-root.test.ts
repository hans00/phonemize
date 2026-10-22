import EnglishG2P from "../src/en/g2p";

describe("the isle spelling family", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["isle", "ˈaɪɫ"],
    ["island", "ˈaɪɫənd"],
    ["islet", "ˈaɪɫət"],
  ])("keeps the silent-s / PRICE root in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["Iceland", "ˈaɪsˌɫænd"],
    ["Islam", "ˈɪsɫəm"],
    ["Islamic", "ɪˈsɫæmɪk"],
  ])("does not extend the isle root into %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["islands", "ˈaɪɫəndz"],
    ["island's", "ˈaɪɫəndz"],
    ["islander", "ˈaɪɫəndɝ"],
    ["isles", "ˈaɪɫz"],
  ])("preserves the existing morphology route for %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
    expect(rules.trace(word, "en-US").path).toBe("morphology");
  });
});
