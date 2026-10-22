import EnglishG2P from "../src/en/g2p";

describe("friend spelling-family vowel", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["friend", "ˈfɹɛnd"],
    ["befriend", "bɪˈfɹɛnd"],
    ["friendship", "ˈfɹɛndʃɪp"],
    ["befriended", "bɪˈfɹɛndɪd"],
    ["befriending", "bɪˈfɹɛndɪŋ"],
    ["befriender", "bɪˈfɹɛndɝ"],
    ["boyfriends", "ˈbɔɪfɹɛndz"],
  ])("keeps the short vowel across %s and its derivation", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["fiend", "ˈfind"],
    ["field", "ˈfiɫd"],
    ["piece", "ˈpis"],
    ["chief", "ˈtʃif"],
    ["believe", "bɪˈɫiv"],
  ])("preserves the ordinary /i/ reading in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
