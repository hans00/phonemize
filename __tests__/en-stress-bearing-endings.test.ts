import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("stress-bearing endings (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["career", "engineer", "pioneer", "volunteer"])("%s retains stressed NEAR in -eer", word => {
    expect(g2p.predict(word, "en")).toMatch(/ˈ[^ɑæɛiɪɔʊuəʌɝ]*ɪɹ$/);
  });
  test.each(["chinese", "japanese"])("%s stresses the -ese vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/ˈniz$/);
  });
  test("a novel -ese word uses the same suffix stress", () => {
    expect(g2p.predict("zorbese", "en")).toMatch(/ˈbiz$/);
  });
  test.each(["nebraska", "necessity", "nevada"])("%s centralizes weak ne", word => {
    expect(g2p.predict(word, "en")).toMatch(/^nə/);
  });
  test("cinema centralizes its medial weak ne", () => {
    expect(g2p.predict("cinema", "en")).toMatch(/nəmə$/);
  });
  test("genetic keeps its stressed ne vowel", () => {
    expect(g2p.predict("genetic", "en")).toMatch(/ˈnɛ/);
  });
  test("neutral -er still composes with its stem", () => {
    expect(g2p.predict("controller", "en")).toMatch(/oʊɫɝ$/);
  });
  test("a monosyllabic -eer rime keeps its nucleus", () => {
    expect(g2p.predict("deer", "en")).toMatch(/ɪɹ$/);
  });
});
