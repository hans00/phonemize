import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("bound Latin suffix stress (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("long mentary adjectives own their root primary through suffixing", () => {
    for (const word of ["documentary", "documentaries", "documentaryness", "supplementary", "supplementaryness", "complementary", "complimentary"])
      expect(g2p.predict(word)).toContain("ˈmɛn");
    for (const word of ["commentary", "fragmentary", "momentary", "legendary", "planetary", "cometary"])
      expect(g2p.predict(word)).toMatch(/^ˈ/);
  });

  test("secute and stitute keep their retracted primary through inflection", () => {
    for (const word of ["execute", "executes", "executed", "executing", "executer", "executers", "executable"])
      expect(g2p.predict(word)).toMatch(/^ˈɛks/);
    expect((g2p.predict("executability") ?? "").replace(/[ˈˌ]/g, "")).toMatch(/^ɛksəkjutə/);
    for (const word of ["constitute", "constitutes", "constituted", "constituting", "constituter", "constituters"])
      expect(g2p.predict(word)).toMatch(/^ˈkɑn/);
    for (const word of ["institute", "institutes", "instituted", "instituting"])
      expect(g2p.predict(word)).toMatch(/^ˈɪn/);
    for (const word of ["substitute", "substitutes", "substituted", "substituting"])
      expect(g2p.predict(word)).toMatch(/^ˈs[ʌə]b/);
    for (const word of ["prosecute", "prosecutes", "prosecuted", "prosecuting", "prosecuter", "prosecuters"])
      expect(g2p.predict(word)).toMatch(/^ˈpɹɑ/);
  });

  test("stress-bearing derivational endings retain their own primary", () => {
    expect(g2p.predict("executive")).toContain("ˈzɛ");
    expect(g2p.predict("execution")).toMatch(/(?:ˈkj|kˈj)u/);
    expect(g2p.predict("constitution")).toContain("ˈtu");
    expect(g2p.predict("substitution")).toContain("ˈtu");
    expect(g2p.predict("institution")).toContain("ˈtu");
    expect(g2p.predict("prosecution")).toMatch(/(?:ˈkj|kˈj)u/);
  });

  test("other ex roots retain voicing before their own stressed vowel", () => {
    for (const word of ["exude", "exuded", "exuding", "examine", "examined", "examining", "exact"])
      expect(g2p.predict(word)).toContain("ɡˈz");
  });
});
