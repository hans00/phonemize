import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("strong ier and merged io nuclei (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");

  test("bare stop-onset ier keeps NEAR, including layer-tier", () => {
    for (const word of ["bier", "pier", "tier"])
      expect(segments(word)).toMatch(/[iɪ]ɹ$/);
    expect(segments("premier")).toMatch(/mɪɹ$/);
  });

  test("PRICE agent stems and weak ier remain distinct", () => {
    for (const word of ["crier", "drier", "flier", "trier", "plier", "tyer"])
      expect(segments(word)).toContain("aɪ");
    for (const word of ["carrier", "happier", "healthier"])
      expect(segments(word)).toMatch(/iɝ$/);
  });

  test("a merged io slot weakens its second nucleus before a light l tail", () => {
    for (const word of ["violent", "violence", "violet", "violin"])
      expect(segments(word)).toContain("vaɪəl");
    for (const word of ["violent", "violence"])
      expect(g2p.predict(word)).toMatch(/^ˈvaɪ/);
  });

  test("transparent prefixes retain a rule-exact iol root", () => {
    for (const word of ["nonviolent", "nonviolence"]) {
      expect(segments(word)).toContain("vaɪəl");
      expect(g2p.predict(word)).toContain("ˈvaɪ");
    }
  });

  test("independent musical roots and longer tails retain their frames", () => {
    expect(segments("viol")).toMatch(/vaɪ[ɑo]l$/);
    for (const word of ["violate", "violated", "violating"])
      expect(segments(word)).toContain("leɪt");
    expect(segments("lion")).toContain("laɪ");
  });
});

test("runtime violin keeps lexical final primary through inflection", () => {
  const g2p = new EnglishG2P();
  for (const word of ["violin", "violins", "violinist", "violinists"])
    expect(g2p.predict(word)).toMatch(/ˈ[lɫ]ɪn/);
});
