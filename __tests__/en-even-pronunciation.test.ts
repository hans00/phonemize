import EnglishG2P from "../src/en/g2p";

describe("standard even pronunciation", () => {
  it("uses the independently attested schwa reading in rules and the shipped dictionary", () => {
    expect(new EnglishG2P({ disableDict: true }).predict("even", "en-US")).toBe("ˈivən");
    expect(new EnglishG2P().predict("even", "en-US")).toBe("ˈivən");
  });

  it.each([
    ["evened", "ˈivənd"],
    ["evens", "ˈivənz"],
  ])("keeps the regular inflection of %s aligned across both routes", (word, ipa) => {
    expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
  });
});
