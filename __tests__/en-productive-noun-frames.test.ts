import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("productive noun frames (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("-ability retains the adjective root and stresses -bil-", () => {
    for (const word of ["capability", "capabilities"]) expect(segments(word)).toContain("keɪpə");
    for (const word of ["liability", "liabilities", "reliability"]) expect(segments(word)).toContain("ɫaɪə");
    for (const word of ["capability", "liability", "reliability", "viability"])
      expect(g2p.predict(word)).toContain("ˈbɪɫ");
  });

  test("-ibility shares the weak suffix boundary with rule-exact adjective stems", () => {
    for (const word of ["flexibility", "possibility", "legibility", "feasibility"])
      expect(segments(word)).toMatch(/ə[b]ɪɫ[əɪ]ti$/);
    for (const word of ["ability", "stability", "instability", "disability"])
      expect(segments(word)).not.toContain("eə");
  });

  test("-uality retains both nuclei and its coalesced consonant", () => {
    for (const word of ["actuality", "mutuality", "punctuality", "spirituality"])
      expect(g2p.predict(word)).toContain("tʃuˈæ");
    expect(g2p.predict("sexuality")).toContain("kʃuˈæ");
    expect(g2p.predict("sensuality")).toContain("ʃuˈæ");
  });

  test("secondary stress counts a genuine hiatus while qu remains consonantal", () => {
    expect(segments("sexuality")).toContain("sɛkʃu");
    expect(g2p.predict("equality")).toMatch(/^ɪ/);
    expect(segments("quality")).toContain("kw");
  });
});
