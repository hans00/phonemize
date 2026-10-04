import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("bound hiatus and neutral likeness (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");

  test("back-vowel and doubled-onset ean retain separate final nuclei", () => {
    for (const word of ["european", "europeans", "caribbean", "caribbeans", "korean", "koreans", "boolean", "booleans"])
      expect(segments(word)).toMatch(/iənz?$/);
    for (const word of ["european", "europeans", "cyclopean", "cyclopeans"])
      expect(g2p.predict(word)).toContain("ˈpiən");
  });

  test("rhotic ean keeps primary on the preceding root syllable", () => {
    for (const word of ["pythagorean", "pythagoreans", "hyperborean", "hyperboreans", "singaporean", "singaporeans"])
      expect(g2p.predict(word)).toMatch(/ˈ[^ˈˌ]*ɔɹiən/);
  });

  test("anean keeps its preceding FACE nucleus", () => {
    for (const word of ["mediterranean", "mediterraneans", "subterranean", "subterraneans"])
      expect(g2p.predict(word)).toMatch(/ˈɹ?eɪniən/);
  });

  test("native ea digraphs and bean compounds stay single nuclei", () => {
    for (const word of ["demean", "demeans", "clean", "cleans", "bluejean", "bluejeans", "bean", "beans", "soybean", "soybeans", "pintobean", "pintobeans", "cocobean"])
      expect(segments(word)).toMatch(/inz?$/);
    expect(g2p.predict("bluejeans")).toMatch(/^ˈ/);
    for (const word of ["guinea", "guineas", "ocean", "oceans"])
      expect(segments(word)).not.toContain("iən");
  });

  test("single-onset open a keeps FACE through ture inflection and prefixing", () => {
    for (const word of ["nature", "natures", "natured", "naturing", "naturelike", "denature", "denatures", "denatured", "denaturing", "unnatured"])
      expect(segments(word)).toContain("neɪtʃɝ");
    for (const word of ["stature", "statures"])
      expect(segments(word)).toContain("stætʃɝ");
  });

  test("like preserves silent-e roots and lexical noun stress", () => {
    expect(g2p.predict("naturelike")).toMatch(/^ˈneɪtʃɝ/);
    expect(segments("apelike")).toContain("eɪplaɪk");
    expect(segments("molelike")).toContain("moʊllaɪk");
    expect(segments("juicelike")).toContain("dʒuslaɪk");
    for (const word of ["mammallike", "weasellike", "needlelike", "zombielike", "goddesslike"])
      expect(g2p.predict(word)).toMatch(/^ˈ/);
  });

  test("linking a and words merely ending in like retain their complete frame", () => {
    expect(segments("lookalike")).toContain("lʊkəlaɪk");
    expect(segments("lookalikes")).toContain("lʊkəlaɪk");
    expect(g2p.predict("unlike")).toMatch(/ˈ[^ˈ]*[lɫ]aɪk$/);
    expect(g2p.predict("dislike")).toMatch(/ˈ[^ˈ]*[lɫ]aɪk$/);
  });
});
