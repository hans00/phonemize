import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("inflection stem evidence (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["shed", "sting", "sting's"])("%s retains its whole-word nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(word === "shed" ? /ʃɛd/ : /stɪŋ/);
  });
  test.each(["producer", "producer's"])("%s derives from the verb reading", word => {
    expect(g2p.predict(word, "en")).toMatch(/əˈdusɝ/);
  });
  test("closer retains the unvoiced comparative reading", () => {
    expect(g2p.predict("closer", "en")).toMatch(/sɝ$/);
  });
  test("coated retains a monosyllabic root", () => {
    expect(g2p.predict("coated", "en")).toMatch(/koʊt[ɪə]d$/);
  });
  test.each(["skater", "created"])("%s preserves a genuine restored -ate stem", word => {
    expect(g2p.predict(word, "en")).toContain("eɪt");
  });
  test("coded restores silent e", () => {
    expect(g2p.predict("coded", "en")).toContain("koʊd");
  });
  test.each(["tried", "copying"])("%s still permits y-bearing stems", word => {
    expect(g2p.predict(word, "en")).toMatch(word === "tried" ? /tɹaɪd$/ : /kɑpiɪŋ$/);
  });
});
