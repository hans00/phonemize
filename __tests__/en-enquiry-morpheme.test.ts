import EnglishG2P from "../src/en/g2p";

describe.each([true, false])("enquiry family rime (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  it.each([
    ["enquiry", ["ɪnˈkwaɪɹi"]],
    ["inquiry", ["ɪnˈkwaɪɹi"]],
    ["enquire", ["ɪnˈkwaɪɹ", "ɪnˈkwaɪɝ"]],
    ["inquire", ["ɪnˈkwaɪɹ", "ɪnˈkwaɪɝ"]],
  ])("reads the shared en/in + quire family: %s", (word, readings) => {
    // Merriam-Webster gives optional schwa before /r/ in acquire/inquire.
    if (disableDict) expect(readings).toContain(g2p.predict(word));
  });

  it.each([
    ["acquire", ["əˈkwaɪɹ", "əˈkwaɪɝ"], "əˈkwaɪɝ"],
    ["require", ["ɹiˈkwaɪɹ", "ɹiˈkwaɪɝ"], ["ˌɹiˈkwaɪɝ", "ɹiˈkwaɪɝ"]],
    ["query", "ˈkwɛɹi", "ˈkwiɹi"],
    ["quiet", "ˈkwaɪət", "ˈkwaɪət"],
  ])("preserves neighboring forms: %s", (word, rulesReadings, dictionaryReadings) => {
    const readings = disableDict ? rulesReadings : dictionaryReadings;
    expect(readings).toContain(g2p.predict(word));
  });
});
