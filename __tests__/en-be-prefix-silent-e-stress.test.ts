import EnglishG2P from "../src/en/g2p";

describe("weak be- before an independently vouched silent-e root", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const ipa = (word: string) => rules.predict(word, "en-US");

  it.each([
    ["become", "bɪˈkʌm"],
    ["behave", "bɪˈheɪv"],
  ])("keeps root stress in supported form %s", (word, expected) => {
    expect(ipa(word)).toBe(expected);
  });

  it.each([
    ["beneke", "ˈbɛnək"],
    ["benites", "ˈbɛnaɪts"],
    ["berube", "ˈbɛɹub"],
    ["beside", "ˈbɛsaɪd"],
    ["betake", "ˈbɛteɪk"],
    ["betide", "ˈbɛtaɪd"],
    ["berate", "ˈbɛɹeɪt"],
    ["bespoke", "ˈbɛspoʊk"],
    ["bestrode", "ˈbɛstɹoʊd"],
  ])("does not infer a be- prefix in unsupported form %s", (word, expected) => {
    expect(ipa(word)).toBe(expected);
  });

  it.each([
    ["before", "bɪˈfɔɹ"],
    ["believe", "bɪˈɫiv"],
    ["betray", "bɪˈtɹeɪ"],
    ["bestow", "bɪˈstoʊ"],
    ["bedazzle", "bɪˈdæzəɫ"],
  ])("preserves the existing frame of %s", (word, expected) => {
    expect(ipa(word)).toBe(expected);
  });
});
