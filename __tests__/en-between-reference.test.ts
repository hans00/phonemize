import EnG2P from "../src/en/g2p";

describe("Cambridge US between reference", () => {
  it("uses the same /ɪ/ root vowel in between and its regular plural", () => {
    for (const disableDict of [false, true]) {
      const g2p = new EnG2P({ disableDict });
      expect(g2p.predict("between", "en-US")).toBe("bɪˈtwin");
      expect(g2p.predict("betweens", "en-US")).toBe("bɪˈtwinz");
    }
  });
});
