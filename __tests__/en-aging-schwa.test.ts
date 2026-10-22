import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak vowel in -aging forms (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it.each([
    ["damaging", "ˈdæmɪdʒɪŋ"],
    ["imaging", "ˈɪmɪdʒɪŋ"],
    ["messaging", "ˈmɛsɪdʒɪŋ"],
    ["mortgaging", "ˈmɔɹɡɪdʒɪŋ"],
    ["packaging", "ˈpækɪdʒɪŋ"],
    ["salvaging", "ˈsæɫvɪdʒɪŋ"],
    ["savaging", "ˈsævɪdʒɪŋ"],
  ])("uses KIT in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it.each([
    ["managing", "ˈmænədʒɪŋ"],
    ["staging", "ˈsteɪdʒɪŋ"],
    ["engaging", "ɛnˈɡeɪdʒɪŋ"],
    ["aging", "ˈeɪdʒɪŋ"],
  ])("preserves the neighboring pronunciation in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
});
