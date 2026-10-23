import EnglishG2P from "../src/en/g2p";

describe("re- before the flect root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["reflect", "ɹɪˈfɫɛkt"],
    ["reflection", "ɹɪˈfɫɛkʃən"],
    ["reflective", "ɹɪˈfɫɛktɪv"],
    ["reflector", "ɹɪˈfɫɛktɝ"],
    ["reflections", "ɹɪˈfɫɛkʃənz"],
    ["reflected", "ɹɪˈfɫɛktɪd"],
    ["reflecting", "ɹɪˈfɫɛktɪŋ"],
    ["reflectively", "ɹɪˈfɫɛktɪvɫi"],
    ["reflectiveness", "ɹɪˈfɫɛktɪvnəs"],
    ["reflectance", "ɹɪˈfɫɛktəns"],
    ["reflectable", "ɹɪˈfɫɛktəbəɫ"],
  ])("uses the weak re- vowel throughout %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["reflag", "ɹiˈfɫæɡ"],
    ["reflate", "ɹiˈfɫeɪt"],
    ["reflation", "ɹiˈfɫeɪʃən"],
    ["reflux", "ɹiˈfɫʌks"],
    ["reflex", "ɹiˈfɫɛks"],
    ["reflectone", "ɹiˈfɫɛktoʊn"],
  ])("preserves the neighboring %s reading", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
