import EnglishG2P from "../src/en/g2p";

describe("the weak re- allomorph before the fresh root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["refresh", "ɹɪˈfɹɛʃ"],
    ["refreshed", "ɹɪˈfɹɛʃt"],
    ["refreshing", "ɹɪˈfɹɛʃɪŋ"],
    ["refreshes", "ɹɪˈfɹɛʃəz"],
    ["refresher", "ɹɪˈfɹɛʃɝ"],
    ["refreshment", "ɹɪˈfɹɛʃmənt"],
    ["refreshingly", "ɹɪˈfɹɛʃɪŋɫi"],
  ])("keeps /ɪ/ through %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["reflag", "ɹiˈfɫæɡ"],
    ["reflate", "ɹiˈfɫeɪt"],
    ["reflation", "ɹiˈfɫeɪʃən"],
    ["reflux", "ɹiˈfɫʌks"],
    ["reframe", "ɹiˈfɹeɪm"],
    ["rephrase", "ɹɛˈfɹeɪz"],
  ])("preserves the distinct %s form", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
