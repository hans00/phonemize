import EnglishG2P from "../src/en/g2p";

describe("stressed ve-hi in the vehicle family", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps the /i/ vowel in vehicle", () => {
    expect(rules.predict("vehicle", "en-US")).toBe("ˈvihɪkəɫ");
  });

  it.each([
    ["vehicles", "ˈvihɪkəɫz"],
    ["vehicle's", "ˈvihɪkəɫz"],
    ["vehicular", "vɪˈhɪkjəɫɝ"],
    ["even", "ˈivən"],
    ["evidence", "ˈɛvədəns"],
  ])("preserves the related form %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
