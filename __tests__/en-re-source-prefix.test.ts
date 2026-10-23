import EnglishG2P from "../src/en/g2p";

describe("the re- + source morpheme boundary", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("preserves the source root's voiceless s in resource", () => {
    expect(rules.predict("resource", "en-US")).toBe("ɹiˈsɔɹs");
  });

  it.each([
    ["research", "ɹiˈsɝtʃ"],
    ["resort", "ɹiˈzɔɹt"],
    ["result", "ɹiˈzʌɫt"],
    ["resupply", "ɹiˈzʌpɫi"],
    ["resources", "ˈɹisɔɹsəz"],
    ["resourceful", "ˈɹisɔɹsfəɫ"],
    ["source", "ˈsɔɹs"],
    ["sources", "ˈsɔɹsəz"],
  ])("preserves the neighboring %s route", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
