import EnglishG2P from "../src/en/g2p";

describe("-together composition in the English rules path", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const standard = new EnglishG2P();

  it.each([
    ["together", "təˈɡɛðɝ"],
    ["altogether", "ˌɔɫtəˈɡɛðɝ"],
  ])("renders %s from spelling rules", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it.each([
    ["today", "təˈdeɪ"],
    ["tonight", "təˈnaɪt"],
    ["toboggan", "təˈbɑɡən"],
    ["gather", "ˈɡæðɝ"],
    ["togetherness", "təˈɡɛðɝnəs"],
  ])("preserves the neighboring %s pattern", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it("retains the checked whole-word readings in the default API", () => {
    expect(standard.predict("together", "en")).toBe("təˈɡɛðɝ");
    expect(standard.predict("altogether", "en")).toBe("ˌɔɫtəˈɡɛðɝ");
  });

  it.each([
    ["get-together", "ˈɡɛttəˌɡɛðɝ"],
    ["air-conditioning", "ˈɛɹkənˌdɪʃənɪŋ"],
  ])("preserves the second component's weak syllable in %s", (word, expected) => {
    expect(standard.predict(word, "en")).toBe(expected);
  });
});
