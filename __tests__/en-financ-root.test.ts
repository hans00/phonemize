import EnglishG2P from "../src/en/g2p";

describe("the English financ- root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["finance", "ˈfaɪnæns"],
    ["financial", "faɪˈnænʃəɫ"],
  ])("uses the attested PRICE root in %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it.each([
    ["finances", "ˈfaɪˌnænsəz"],
    // Cambridge's AmE entry gives primary stress on /næn/ with no marked
    // secondary stress on /faɪ/: https://dictionary.cambridge.org/us/pronunciation/english/financially
    ["financially", "faɪˈnænʃəɫi"],
    ["financiera", "ˌfɪnənˈsiɹə"],
    ["financiero", "ˌfɪnənˈsiɹoʊ"],
    ["financo", "fɪˈnæŋkoʊ"],
  ])("preserves the neighboring reading of %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });
});
