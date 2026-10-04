import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("neutral compound boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("wise and hood retain a silent-e root and restore adjective y", () => {
    for (const word of ["likewise", "likelihood", "likelihoods"])
      expect(g2p.predict(word)).toMatch(/^ˈɫaɪk/);
    for (const word of ["livelihood", "livelihoods"])
      expect(g2p.predict(word)).toMatch(/^ˈɫaɪv/);
    expect(g2p.predict("priesthood")!.replace(/[ˈˌ]/g, "")).toMatch(/sthʊd$/);
    expect(g2p.predict("anticlockwise")).toMatch(/ˈkɫɑk/);
    expect(g2p.predict("lengthwise")).toMatch(/ŋθ/);
  });

  test("a particle compound keeps its silent-e root across plural boundaries", () => {
    for (const word of ["makeup", "makeups"])
      expect(g2p.predict(word)).toMatch(/^ˈmeɪˌ?k/);
    for (const word of ["wakeup", "wakeups"])
      expect(g2p.predict(word)).toMatch(/^ˈweɪˌ?k/);
    for (const word of ["takeoff", "takeoffs", "takeout", "takeouts", "takeover", "takeovers"])
      expect(g2p.predict(word)).toMatch(/^ˈteɪˌ?k/);
    expect(g2p.predict("lacerate")).toMatch(/^ˈɫæs/);
    expect(g2p.predict("pageant")).toMatch(/^ˈpædʒ/);
  });

  test("a superlative ng retains the stop while soft nge and bound prefixes remain", () => {
    for (const word of ["longest", "strongest", "youngest"])
      expect(g2p.predict(word)).toMatch(/ŋɡəst$/);
    for (const word of ["strangest", "congest", "ingest"])
      expect(g2p.predict(word)).toContain("dʒ");
  });

  test("Greek arch endings stay distinct from a native arch", () => {
    expect(g2p.predict("hierarchy")).toMatch(/^ˈhaɪ/);
    for (const word of ["anarchy", "monarchy", "oligarchy", "hierarchical"])
      expect(g2p.predict(word)).not.toContain("tʃ");
    for (const word of ["research", "starchy", "archer"])
      expect(g2p.predict(word)).toContain("tʃ");
  });
});
