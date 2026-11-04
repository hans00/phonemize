import EnglishG2P from "../src/en/g2p";

const rules = new EnglishG2P({ disableDict: true });

describe("legisl- derivational allomorph", () => {
  it.each([
    ["legislation", "ˌɫɛdʒəˈsɫeɪʃən"],
    ["legislative", "ˈɫɛdʒəˌsɫeɪtɪv"],
    ["legislator", "ˈɫɛdʒəˌsɫeɪtɝ"],
    ["legislature", "ˈɫɛdʒəˌsɫeɪtʃɝ"],
  ])("renders %s with the weak root vowel", (word, ipa) => {
    expect(rules.predict(word)).toBe(ipa);
  });

  it.each([
    ["legislate", "ˈɫɛdʒɪˌsɫeɪt"],
    ["legislates", "ˈɫɛdʒɪˌsɫeɪts"],
    ["legislations", "ˌɫɛdʒəˈsɫeɪʃənz"],
    ["legislatures", "ˈɫɛdʒəˌsɫeɪtʃɝz"],
    ["legislatives", "ˈɫɛdʒəˌsɫeɪtɪvz"],
  ])("preserves the neighboring %s route", (word, ipa) => {
    expect(rules.predict(word)).toBe(ipa);
  });
});

describe("rule-exact -ative plural stems", () => {
  it.each([
    ["alternatives", "ɔɫˈtɝnətɪvz"],
    ["negatives", "ˈnɛɡətɪvz"],
  ])("keeps the singular rule reading in %s", (word, ipa) => {
    expect(rules.predict(word)).toBe(ipa);
  });
});
