import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("open vowels and suffix context (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each([
    ["equal", /ˈik/], ["sequence", /ˈsik/], ["frequency", /ˈfɹik/],
    ["meter", /ˈmit/], ["cedar", /ˈsid/],
  ] as const)("%s keeps its tense open e", (word, nucleus) => {
    expect(g2p.predict(word, "en")).toMatch(nucleus);
  });
  test.each(["move", "prove", "remove", "approve", "improve", "movie", "movies"])("%s takes GOOSE before the v ending", word => {
    expect(g2p.predict(word, "en")).toMatch(/uv/);
  });
  test.each(["probe", "prove"])("%s attaches stress to its nucleus, before the onset", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ˈpɹ/);
  });
  test.each(["native", "basic", "bacon", "dative"])("%s keeps tense a in its ending frame", word => {
    expect(g2p.predict(word, "en")).toContain("eɪ");
  });
  test.each(["changes", "exchanges", "ranges"])("%s retains the tense -ange vowel before the plural", word => {
    expect(g2p.predict(word, "en")).toMatch(/eɪndʒəz$/);
  });
  test("flanges keeps the lateral-onset lax vowel", () => {
    expect(g2p.predict("flanges", "en")).toMatch(/æ/);
  });
  test.each(["efficient", "efficiency"])("%s raises weak ef and stresses the following nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ɪˈfɪʃən/);
  });
  test.each(["efficiency", "deficiency", "proficiency", "sufficiency"])("%s coalesces the -ciency ending", word => {
    expect(g2p.predict(word, "en")).toMatch(/ʃənsi$/);
  });
  test("disclose composes with the verb's voiced close", () => {
    expect(g2p.predict("disclose", "en")).toMatch(/oʊz$/);
  });
  test("disable composes with able", () => {
    expect(g2p.predict("disable", "en")).toMatch(/^dɪˈseɪ/);
  });
  test("discover retains its root's STRUT vowel", () => {
    expect(g2p.predict("discover", "en")).toMatch(/[ʌə]vɝ$/);
  });
  test("prerequisite retains the known root's weak ending", () => {
    expect(g2p.predict("prerequisite", "en")).toMatch(/kwəzət$/);
  });
  test.each(["preference", "clever", "never", "equity"])("%s retains its lax e", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɛ/);
  });
  test("a novel -asic word follows the same open-a context", () => {
    expect(g2p.predict("tasic", "en")).toMatch(/eɪsɪk$/);
  });
  test("a longer -ative word retains the weak middle vowel", () => {
    expect(g2p.predict("sanative", "en")).toMatch(/nətɪv$/);
  });
  test.each(["navies", "gravies"])("%s retains aCy lengthening through its y stem", word => {
    expect(g2p.predict(word, "en")).toMatch(/eɪviz$/);
  });
  test("coffee's final vowel is pronounced", () => {
    expect(g2p.predict("coffee", "en")).toMatch(/fi$/);
  });
});
