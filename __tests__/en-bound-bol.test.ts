import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("bound Greek bol (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("longer bound roots keep the derivative's antepenultimate stress", () => {
    for (const word of ["metabolism", "metabolisms", "metabolize", "metabolizes", "metabolized", "metabolizing", "catabolism", "catabolize", "anabolism", "anabolize"])
      expect(g2p.predict(word)).toMatch(/ˈtæbə|ˈnæbə/);
  });

  test("productive plurals and agent nouns keep the corrected derivative after eviction", () => {
    for (const word of ["metabolisms", "catabolisms", "anabolisms"])
      expect(g2p.predict(word)).toMatch(/ˌ?ɫɪzəmz$/);
    for (const word of ["metabolizes", "catabolizes", "anabolizes", "metabolizer", "metabolizers", "catabolizer", "catabolizers"])
      expect(g2p.predict(word)).toMatch(/ˈ[tn]æbəˌ?ɫaɪz/);
  });

  test("short noun roots and stress-bearing ic keep their own frame", () => {
    for (const word of ["symbolism", "symbolize", "symbolized", "symbolizing"])
      expect(g2p.predict(word)).toMatch(/^ˈsɪm/);
    expect(g2p.predict("embolism")).toMatch(/^ˈɛm/);
    expect(g2p.predict("metabolic")).toContain("ˈbɑ");
    expect(g2p.predict("anabolic")).toContain("ˈbɑ");
    expect(g2p.predict("hyperbolic")).toContain("ˈbɑ");
  });
});
