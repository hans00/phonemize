import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("root hiatus (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("creat- preserves both nuclei through neutral and shifting suffixes", () => {
    for (const word of ["create", "creative", "creator", "created", "creating", "creativity", "recreate"])
      expect(g2p.predict(word)).toMatch(/i[ˈˌ]?eɪ/);
    for (const word of ["create", "creative", "creator"])
      expect(g2p.predict(word)).toContain("iˈeɪ");
    expect(g2p.predict("creativity")).toContain("ˈtɪv");
    expect(g2p.predict("creation")).toContain("eɪʃən");
    for (const word of ["cream", "creature", "great", "treat"])
      expect(g2p.predict(word)).not.toContain("ieɪ");
  });

  test("-iety has a stressed diphthong followed by weak nuclei", () => {
    for (const word of ["piety", "society", "variety", "propriety", "impropriety", "sobriety", "varieties"])
      expect(g2p.predict(word)).toContain("aɪəti");
    expect(g2p.predict("society")).toMatch(/ˈsaɪ/);
    expect(g2p.predict("diet")).toContain("aɪət");
    expect(g2p.predict("niece")).toContain("nis");
    expect(g2p.predict("quiet")).toContain("aɪət");
  });

  test("initial who- contrasts with whole and the other wh+o rimes", () => {
    for (const word of ["who", "whom", "whose", "whoever", "whomever"])
      expect(g2p.predict(word)).toMatch(/^[ˈˌ]?hu/);
    expect(g2p.predict("whole")).toContain("oʊ");
    expect(g2p.predict("whorl")).toContain("ɔɹ");
    expect(g2p.predict("whopper")).toMatch(/[ɑɔ]/);
    expect(g2p.predict("whoosh")).toMatch(/[uʊ]/);
    expect(g2p.predict("lawhon")).not.toContain("hu");
  });
});
