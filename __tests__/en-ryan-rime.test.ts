import { EnglishG2P } from "../src/en/g2p";

describe("productive -ryan/-ryant name rime", () => {
  const rules = new EnglishG2P({ disableDict: true });

  test.each([
    ["Ryan", "ˈɹaɪən"],
    ["Bryan", "ˈbɹaɪən"],
    ["Bryant", "ˈbɹaɪənt"],
    ["Ryan's", "ˈɹaɪənz"],
    ["Bryan's", "ˈbɹaɪənz"],
    ["Bryant's", "ˈbɹaɪənts"],
    ["O'Bryan", "oʊˈbɹaɪən"],
  ])("renders %s with the standard /aɪən/ rime", (word, expected) => {
    expect(rules.predict(word)).toBe(expected);
  });

  it("leaves other -yan and derived readings on their own routes", () => {
    expect(rules.predict("Kenyan")).toBe("ˈkɛnjən");
    expect(rules.predict("Ryans")).toBe("ˈɹaɪənz");
    expect(rules.predict("Bryanism")).toBe("ˈbɹaɪənɪzəm");
  });
});
