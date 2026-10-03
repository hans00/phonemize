import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("consonant and -ule boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("x voices only at the start of a word", () => {
    for (const word of ["proxy", "sexy", "boxy", "foxy", "oxygen", "oxygenate"])
      expect(segments(word)).toContain("ks");
    expect(segments("xylophone")).toMatch(/^z/);
  });

  test("front suffixes coalesce the final sc cluster", () => {
    for (const word of ["fascist", "fascists", "fascism"])
      expect(segments(word)).toContain("fæʃ");
    expect(segments("criticize")).toContain("s");
    expect(segments("druggist")).toContain("ɡ");
  });

  test("a strong the syllable keeps its own vowel", () => {
    expect(segments("these")).toBe("ðiz");
    for (const word of ["hypothetical", "empathetic", "pathetic"])
      expect(segments(word)).toContain("θɛ");
    expect(segments("hypothesis")).toContain("θə");
  });

  test("long u survives in weak -ule and coalesces with t or d", () => {
    for (const word of ["module", "nodule"])
      expect(segments(word)).toMatch(/dʒuɫ$/);
    for (const word of ["molecule", "minuscule", "tubule", "vestibule"])
      expect(segments(word)).toMatch(/juɫ$/);
    expect(segments("overrule")).toMatch(/ɹuɫ$/);
    expect(segments("capsule")).toMatch(/səɫ$/);
    expect(segments("granule")).toMatch(/n[j]?əɫ$/);
  });
});
