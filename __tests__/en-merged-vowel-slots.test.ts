import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("merged vowel slots (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("front-vowel lm keeps its lateral; alm preserves its existing variants", () => {
    for (const word of ["film", "films", "filmed", "filming", "helm", "helms", "realm", "realms"])
      expect(g2p.predict(word)).toMatch(/ɫm/);
    for (const word of ["calm", "palm", "psalm"]) {
      expect(g2p.predict(word)).toMatch(/ɑɫ?m/);
      if (disableDict) expect(g2p.predict(word)).not.toMatch(/[lɫ]/);
    }
    for (const word of ["dealt", "realm", "health", "wealth"])
      expect(g2p.predict(word)).toContain("ɛɫ");
    for (const word of ["heath", "beneath", "fealty", "realty"])
      expect(g2p.predict(word)).not.toContain("ɛɫ");
  });

  test("terminal u and an open root before y retain their long vowel", () => {
    for (const word of ["flu", "gnu", "thru", "truly", "ruby", "judy", "lucy", "puny", "duly", "duty"])
      expect(g2p.predict(word)).toContain("u");
    for (const word of ["buddy", "sunny", "study"])
      expect(g2p.predict(word)).toContain("ʌ");
    expect(g2p.predict("bushy")).toContain("ʊ");
    for (const word of ["busy", "study", "hurry", "flurry", "bushy"])
      expect(g2p.predict(word)).not.toContain("u");
    for (const word of ["fury", "jury", "juries"])
      expect(g2p.predict(word)).toContain("ʊɹ");
    expect(g2p.predict("flurry")).toContain("ɝ");
  });

  test("bound ti+a palatalizes before -ate and -ative", () => {
    for (const word of ["initiate", "negotiate", "instantiate", "substantiate", "initiative"])
      expect(g2p.predict(word)).toMatch(/ʃ[ij]/);
    for (const word of ["patio", "pentium", "tritium", "auntie", "dirtier"])
      expect(g2p.predict(word)).not.toContain("ʃ");
  });

  test("off-stress e+a+r keeps both nuclei in -lear and -near", () => {
    for (const word of ["linear", "nuclear", "cochlear"])
      expect(g2p.predict(word)).toContain("iɝ");
    expect(g2p.predict("clear")).toContain("ɪɹ");
    expect(g2p.predict("fear")).toContain("ɪɹ");
  });

  test("weak bound-noun themes reduce without reducing full nuclei", () => {
    for (const word of ["ordinary", "ordinarily"]) expect(g2p.predict(word)).toContain("də");
    expect(g2p.predict("ordinance")).toContain("də");
    expect(g2p.predict("artificial")).toContain("tə");
    expect(g2p.predict("litigate")).toContain("tɪ");
    expect(g2p.predict("culinary")).toMatch(/[ɪə]ˌ?n/);
  });
});
