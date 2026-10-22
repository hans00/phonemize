import EnglishG2P from "../src/en/g2p";

describe("-cialty derivation", () => {
  const g2p = new EnglishG2P({ disableDict: true });

  it.each([
    ["specialty", "ˈspɛʃəɫti"],
    ["specialties", "ˈspɛʃəɫtiz"],
  ])("carries the -cial stem into %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["special", "ˈspɛʃəɫ"],
    ["specially", "ˈspɛʃəɫi"],
    ["spatial", "ˈspeɪʃəɫ"],
    ["racial", "ˈɹeɪʃəɫ"],
    ["official", "əˈfɪʃəɫ"],
  ])("preserves the neighboring -cial reading of %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });
});
