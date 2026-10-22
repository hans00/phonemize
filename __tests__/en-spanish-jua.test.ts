import EnglishG2P from "../src/en/g2p";

describe("internal Spanish-loan <jua>", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["marijuana", "ˌmɛɹɪˈwɑnə"],
    ["tijuana", "tɪˈwɑnə"],
  ])("uses /wɑ/ in the internal <jua> frame of %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["jua", "ˈdʒʌæ"],
    ["juan", "ˈdʒʌæn"],
    ["juana", "dʒəˈænə"],
    ["juanita", "dʒəəˈnitə"],
    ["juarez", "dʒəˈæɹɛz"],
    ["juang", "ˈdʒʌæŋ"],
    ["sanjuan", "ˈsændʒəən"],
    ["kajuahar", "ˈkædʒəəhɝ"],
  ])("preserves the contrasting <j> reading in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
