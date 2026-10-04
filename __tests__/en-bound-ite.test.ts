import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("bound ite and free finite (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");

  test("bound finite retains two weak nuclei and root primary", () => {
    for (const word of ["definite", "definitely", "definiteness", "infinite", "infinitely", "infiniteness", "indefinite", "indefinitely"])
      expect(segments(word)).toContain("fənət");
    expect(g2p.predict("definite")).toMatch(/^ˈdɛ/);
    expect(g2p.predict("infinite")).toMatch(/^ˈɪn/);
    expect(g2p.predict("indefinite")).toContain("ˈdɛ");
  });

  test("finite keeps PRICE through transparent prefixing and neutral suffixing", () => {
    for (const word of ["finite", "finites", "finitely", "finiteness", "finitewise", "nonfinite", "unfinite", "semifinite", "semifinitely"])
      expect(segments(word)).toContain("faɪnaɪt");
    for (const word of ["transfinite", "semifinite", "cofinite"])
      expect(segments(word)).toMatch(/naɪt$/);
  });

  test("quisite retains weak voiced nuclei through its derivatives", () => {
    for (const word of ["requisite", "requisites", "requisitely", "requisiteness", "exquisite", "exquisitely", "prerequisite", "prerequisites", "perquisite"])
      expect(segments(word)).toMatch(/kw[əɪ]z[əɪ]t/);
    expect(g2p.predict("requisite")).toMatch(/^ˈɹɛ/);
    expect(g2p.predict("exquisite")).toMatch(/^ˈɛks/);
  });

  test("posite retains a weak final nucleus through plural and neutral suffixes", () => {
    for (const word of ["opposite", "opposites", "oppositely", "oppositeness", "apposite", "apposites", "appositely", "appositeness", "composite", "composites"])
      expect(segments(word)).toMatch(/p[ɑə]z[əɪ]t/);
  });

  test("weak bound roots retain their primary and vowels before wise", () => {
    for (const word of ["definitewise", "infinitewise"])
      expect(segments(word)).toContain("fənətwaɪz");
    expect(g2p.predict("oppositewise")).toMatch(/^ˈɑp/);
    expect(segments("exquisitewise")).toMatch(/kw[əɪ]z[əɪ]twaɪz$/);
  });

  test("consonantal qu participates in the existing intervocalic s voicing", () => {
    for (const word of ["acquisitive", "inquisitive", "inquisitor", "inquisitors"])
      expect(segments(word)).toContain("kwɪz");
    expect(segments("quips")).toMatch(/ps$/);
  });

  test("productive strong ite and ordinary silent-e roots keep their rimes", () => {
    for (const word of ["parasite", "appetite", "dynamite", "satellite", "ignite", "reunite"])
      expect(segments(word)).toMatch(/aɪt$/);
    for (const word of ["bite", "white", "polite"])
      expect(segments(word)).toMatch(/aɪt$/);
  });
});
