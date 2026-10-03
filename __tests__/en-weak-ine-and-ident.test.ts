import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak endings (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("-ident/-inent leaves the weak theme outside primary stress", () => {
    for (const word of ["confident", "continent", "prominent", "resident", "residents", "continents", "president", "incident", "abstinent", "provident"])
      expect(g2p.predict(word)).toMatch(/^ˈ/);
    expect(g2p.predict("nonresident")).toContain("ɹɛz");
    expect(g2p.predict("intransigent")).toContain("ns");
    expect(g2p.predict("overconfident")).toMatch(/^ˌ?oʊvɝ/);
    expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
    for (const word of ["consistent", "persistent", "insistence"])
      expect(g2p.predict(word)).not.toMatch(/^ˈ/);
  });

  test("bound weak -ine survives inflection after its stem leaves the table", () => {
    for (const word of ["engine", "engines", "engine's"])
      expect(g2p.predict(word)).toContain("dʒən");
    for (const word of ["discipline", "disciplines", "disciplined", "disciplining"])
      expect(g2p.predict(word)).toContain("pɫən");
    for (const word of ["doctrine", "doctrines"])
      expect(g2p.predict(word)).toContain("tɹən");
    for (const word of ["spline", "alkaline"]) expect(g2p.predict(word)).toContain("aɪn");
    for (const word of ["citrine", "latrine", "marine", "machine"])
      expect(g2p.predict(word)).toMatch(/[iɪ]n$/);
  });

  test("hard-ger correction requires g and leaves j soft", () => {
    for (const word of ["major", "majors", "major's"]) expect(g2p.predict(word)).toContain("dʒɝ");
    for (const word of ["eager", "eagerly", "tiger", "tigers", "bigger"])
      expect(g2p.predict(word)).toContain("ɡɝ");
  });
});
