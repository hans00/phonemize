import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("silent pse and bound Greek nuclei (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("silent pse closes a short-vowel rime through inflection", () => {
    for (const word of ["lapse", "lapses", "lapsed", "lapsing", "lapser", "lapsers", "relapse", "relapses", "relapsed", "relapsing"])
      expect(g2p.predict(word)).toContain("ˈɫæps");
    for (const word of ["collapse", "collapses", "collapsed", "collapsing", "collapser", "collapsers"])
      expect(g2p.predict(word)).toContain("ˈɫæps");
    for (const word of ["glimpse", "glimpses", "glimpsed", "glimpsing", "glimpser", "glimpsers"])
      expect(g2p.predict(word)).toContain("ˈɡɫɪmps");
    for (const word of ["corpse", "corpses", "corpser"])
      expect(g2p.predict(word)).toContain("ˈkɔɹps");
    for (const word of ["traipse", "traipses", "traipsed", "traipsing", "traipser", "traipsers"])
      expect(g2p.predict(word)).toContain("ˈtɹeɪps");
  });

  test("Greek onymous stresses the first of the merged slot's two nuclei", () => {
    for (const word of ["anonymous", "anonymously", "anonymousness", "synonymous", "synonymously"])
      expect(g2p.predict(word)).toContain("ˈnɑn");
    for (const word of ["eponymous", "eponymously"])
      expect(g2p.predict(word)).toMatch(/ˈp[ɑɔ]/);
  });

  test("syn- stays short across an onset split while bare syne keeps PRICE", () => {
    for (const word of ["synod", "synaptic", "synodic", "synergism", "synergistic", "synergetic"])
      expect((g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "")).toMatch(/^sɪn/);
    expect(g2p.predict("syne")).toContain("saɪn");
  });

  test("chron- retains the Greek stop across a syllable boundary", () => {
    for (const word of ["synchronous", "asynchronous", "synchronic", "synchronicity"])
      expect((g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "")).toContain("ŋkɹ");
    expect((g2p.predict("anachronistic") ?? "").replace(/[ˈˌ]/g, "")).toContain("ækɹ");
    for (const word of ["churchroof", "ranchroad", "archrival"])
      expect((g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "")).toContain("tʃɹ");
  });

  test("a- is weak before a doubled coda and neighbouring light roots keep stress", () => {
    for (const word of ["amiss", "abuzz", "amass"])
      expect(g2p.predict(word)).toMatch(/^əˈ/);
    for (const word of ["acid", "atom", "agent", "analyst", "aspect"])
      expect(g2p.predict(word)).toMatch(/^ˈ/);
  });
});
