import EnglishG2P from "../src/en/g2p";

describe.each([true, false])("enquiry family rime (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  it.each([
    ["enquiry", "ɪnˈkwaɪɹi"],
    ["inquiry", "ɪnˈkwaɪɹi"],
    ["enquire", "ɪnˈkwaɪɹ"],
    ["inquire", "ɪnˈkwaɪɹ"],
  ])("reads the shared en/in + quire family: %s", (word, ipa) => {
    if (disableDict) expect(g2p.predict(word)).toBe(ipa);
  });

  it.each([
    ["acquire", "əˈkwaɪɹ", "əˈkwaɪɝ"],
    ["require", "ɹiˈkwaɪɹ", "ˌɹiˈkwaɪɝ"],
    ["query", "ˈkwɛɹi", "ˈkwiɹi"],
    ["quiet", "ˈkwaɪət", "ˈkwaɪət"],
  ])("preserves neighboring forms: %s", (word, rulesIpa, dictionaryIpa) => {
    const ipa = disableDict ? rulesIpa : dictionaryIpa;
    expect(g2p.predict(word)).toBe(ipa);
  });
});
