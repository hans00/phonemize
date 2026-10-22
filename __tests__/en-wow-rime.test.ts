import EnglishG2P from "../src/en/g2p";

describe("the <w>ow spelling frame", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["wow", "ˈwaʊ"],
    ["wowie", "ˈwaʊi"],
  ])("uses MOUTH in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["wowed", "ˈwaʊd"],
    ["wowing", "ˈwaʊɪŋ"],
    ["wows", "ˈwaʊz"],
  ])("preserves the morphology route for %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
    expect(rules.trace(word, "en-US").path).toBe("morphology");
  });

  it.each([
    ["mow", "ˈmoʊ"],
    ["mowed", "ˈmoʊd"],
    ["mowing", "ˈmoʊɪŋ"],
    ["tow", "ˈtoʊ"],
    ["tower", "ˈtoʊɝ"],
    ["toward", "ˈtoʊɝd"],
    ["low", "ˈɫoʊ"],
    ["lower", "ˈɫoʊɝ"],
    ["know", "ˈnoʊ"],
    ["snow", "ˈsnoʊ"],
    ["show", "ˈʃoʊ"],
    ["slow", "ˈsɫoʊ"],
  ])("keeps GOAT in neighboring %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
