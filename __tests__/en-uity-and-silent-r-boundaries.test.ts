import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("hiatus and silent rime boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("-uity retains the root vowel and a weak -ity nucleus", () => {
    for (const word of ["continuity", "ingenuity"]) expect(g2p.predict(word)).toContain("ˈnuə");
    expect(segments("annuity")).toContain("nuə");
    // The plural's lexical entry retains /uɪ/; the rule supplies /uə/.
    expect(segments("annuities")).toMatch(/nu[əɪ]tiz$/);
    expect(segments("ambiguity")).toContain("ɡjuə");
    expect(segments("acuity")).toContain("kjuə");
    expect(segments("promiscuity")).toContain("skjuə");
  });

  test("-uit + adjective y preserves its attested root in prefixed forms", () => {
    for (const word of ["fruity", "unfruity", "nonfruity", "superfruity", "fruitiness"])
      expect(segments(word)).toContain("fɹuti");
    for (const word of ["equity", "equities", "antiquity", "antiquities"])
      expect(segments(word)).toContain("kwə");
  });

  test("a silent-e coda does not hide a doubled-r boundary or move primary into its diphthong", () => {
    expect(g2p.predict("arrange")).toContain("ɝˈeɪn");
    for (const word of ["arranged", "arranging", "arranger", "prearrange"])
      expect(g2p.predict(word)).toContain("ɝˈeɪndʒ");
    expect(segments("dinger")).toContain("dɪŋɝ");
    expect(g2p.predict("arrive")).toContain("ɝˈaɪv");
    expect(g2p.predict("barrette")).toContain("bɝˈɛt");
    expect(g2p.predict("carriage")).toContain("kæɹ");
    expect(g2p.predict("deterrence")).toContain("tɝ");
    expect(segments("marrone")).toContain("mɑɹ");
  });

  test("contracted -riage has one weak nucleus", () => {
    for (const word of ["marriage", "remarriage", "carriage"])
      expect(g2p.predict(word)).toMatch(/ɹɪdʒ$/);
    expect(g2p.predict("beverage")).toMatch(/ɪdʒ$/);
    expect(g2p.predict("heritage")).toMatch(/[ɪə]dʒ$/);
  });
});
