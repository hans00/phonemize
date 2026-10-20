import EnglishG2P from "../src/en/g2p";

describe("the choir- spelling root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["choir", "ˈkwaɪɝ"],
    ["choirs", "ˈkwaɪɝz"],
    ["choirboy", "ˈkwaɪɝbɔɪ"],
    ["choirmaster", "ˈkwaɪɝmæstɝ"],
  ])("uses the /kwaɪr/ root in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("preserves neighboring ch readings", () => {
    expect(rules.predict("chair", "en-US")).toBe("ˈtʃɛɹ");
    expect(rules.predict("choice", "en-US")).toBe("ˈtʃɔɪs");
    expect(rules.predict("chord", "en-US")).toBe("ˈkɔɹd");
  });
});
