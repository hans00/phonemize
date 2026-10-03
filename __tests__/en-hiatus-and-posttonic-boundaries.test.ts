import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("hiatus and posttonic boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("uy retains its diphthong before an agent ending", () => {
    for (const word of ["buyer", "buyer's", "guyer"])
      expect(segments(word)).toMatch(/aɪɝ/);
    for (const word of ["buy", "guy"])
      expect(segments(word)).toMatch(/aɪ$/);
  });

  test("eo+r keeps the strong soft-g contraction and Greek hiatus", () => {
    for (const word of ["george", "georgia", "georgian"])
      expect(segments(word)).toMatch(/^dʒɔɹdʒ/);
    for (const word of ["theory", "theorist", "theorize"])
      expect(segments(word)).toMatch(/^θiɝ/);
  });

  test("checked l/r before a weak affricate contracts final ia", () => {
    for (const word of ["belgian", "borgia", "georgia"])
      expect(segments(word)).toMatch(/dʒə[nz]?$/);
    for (const word of ["collegial", "theologian", "hemiplegia"])
      expect(segments(word)).toContain("dʒiə");
  });

  test("tient coalesces without removing the diet/client hiatus", () => {
    for (const word of ["patient", "impatient", "quotient"])
      expect(segments(word)).toMatch(/ʃənt$/);
    expect(segments("patient")).toMatch(/^peɪ/);
    expect(segments("diet")).toContain("aɪət");
    expect(segments("client")).toContain("aɪənt");
  });

  test("posttonic ci/fi before d-vowel reduces without weakening a closed id", () => {
    for (const word of ["accident", "incidence", "incident"])
      expect(segments(word)).toContain("səd");
    for (const word of ["confidence", "confident"])
      expect(segments(word)).toContain("fəd");
    expect(segments("rancid")).toMatch(/sɪd$/);
    expect(segments("incidental")).toContain("sɪd");
  });

  test("posttonic d+i before cine keeps a weak medial nucleus", () => {
    for (const word of ["medicine", "medicine's", "genemedicine"])
      expect(segments(word)).toContain("dəs");
    expect(segments("judiciary")).toContain("dɪ");
  });

  test("r+ea retains a final weak nucleus while native digraphs stay single", () => {
    for (const word of ["area", "urea"])
      expect(segments(word)).toMatch(/iə$/);
    expect(segments("cream")).toMatch(/im$/);
    expect(segments("really")).toMatch(/iɫi$/);
  });

  test("a complete vowel+r+ly rime stays whole while y remains an onset", () => {
    expect(segments("early")).toBe("ɝɫi");
    for (const word of ["yearly", "nearly", "dearly", "clearly"])
      expect(segments(word)).toMatch(/ɪɹɫi$/);
    expect(segments("yearly")).toMatch(/^j/);
  });
});
