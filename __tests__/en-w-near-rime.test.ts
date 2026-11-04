import EnG2P from "../src/en/g2p";

const g2p = new EnG2P({ disableDict: true });
const lexicalG2P = new EnG2P();
const rules = (word: string) => g2p.predict(word, "en");

describe("/iɹ/ before a vowel after /w/ is NEAR", () => {
  it.each([
    ["queries", "ˈkwɪɹiz"],
    ["queried", "ˈkwɪɹid"],
    ["weary", "ˈwɪɹi"],
    ["wearisome", "ˈwɪɹɪsəm"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it.each([
    ["wary", "ˈwɛɹi"],
    ["we", "ˈwi"],
    ["serious", "ˈsɪɹiəs"],
  ])("leaves the neighboring pattern %s unchanged", (word, ipa) => {
    expect(rules(word)).toBe(ipa);
  });

  it("keeps the authoritative US near vowel in dictionary-backed query", () => {
    expect(lexicalG2P.predict("query", "en")).toBe("ˈkwɪɹi");
  });

  it("does not rewrite a dictionary-backed name through a rules-only vowel class", () => {
    expect(lexicalG2P.predict("quiram", "en")).toBe("ˈkwiɹəm");
  });
});
