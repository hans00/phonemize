import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("combining forms and suffix context (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("merged -metry places the primary on its own nucleus", () => {
    expect(g2p.predict("geometry")).toContain("dʒiˈɑm");
    expect(g2p.predict("geography")).toContain("dʒiˈɑɡ");
  });

  test("auto- retains its first vowel under root primary stress", () => {
    for (const word of ["autonomy", "autonomous", "autocracy"])
      expect(g2p.predict(word)).toMatch(/^ˌ?ɔ/);
  });

  test("-ify establishes the root in its antepenult frame", () => {
    for (const word of ["solidify", "solidifies", "solidified", "solidifying"])
      expect(g2p.predict(word)).toContain("ˈɫɪd");
    expect(g2p.predict("electrify")).toContain("ˈɫɛktɹ");
    expect(g2p.predict("dignify")).toContain("dɪɡn");
    expect(g2p.predict("signify")).toContain("sɪɡn");
    expect(g2p.predict("verify")).toContain("vɛɹ");
    expect(g2p.predict("purify")).toContain("pjʊɹ");
    for (const word of ["deify", "edify", "unify"])
      expect(g2p.predict(word)).toMatch(/faɪ$/);
    expect(g2p.predict("dehumidify")).toContain("hjuˈmɪd");
    expect(g2p.predict("demystify")).toContain("ˈmɪst");
  });

  test("weak -im/-il before -ize reduces without changing -ic/-ive bases", () => {
    for (const word of ["minimize", "minimizes", "minimized", "minimizing", "optimize"])
      expect(g2p.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("əmaɪz");
    expect(g2p.predict("utilize")?.replace(/[ˈˌ]/g, "")).toContain("təɫaɪz");
    expect(g2p.predict("criticize")).toContain("tɪ");
    expect(g2p.predict("publicize")).toContain("ɫɪ");
    expect(g2p.predict("collectivize")).toContain("tɪ");
  });
});
