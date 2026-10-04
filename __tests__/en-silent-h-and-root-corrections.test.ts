import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("borrowed onsets and strong ancy (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "");

  test("honor and honest keep a silent h and LOT through their derivatives", () => {
    for (const word of ["honest", "honestly", "honesty", "honor", "honors", "honored", "honoring", "honorable", "honorably", "honorarium", "honoraria", "honorific", "honorifics"])
      expect(segments(word)).toMatch(/^ɑn/);
    // Honour's unrelated final OUR rule gap remains open in rules-only mode.
    expect(segments("honour")).toMatch(/^ɑn/);
  });

  test("transparent prefixes recover the quiet root after exception eviction", () => {
    for (const word of ["dishonor", "dishonored", "dishonest", "dishonesty", "unhonest", "nonhonest", "unhonorable", "nonhonorable"])
      expect(segments(word)).toContain("ɑn");
    expect(g2p.predict("honorarily")).toMatch(/^ˈɑn/);
  });

  test("native hon spellings retain the pronounced h", () => {
    for (const word of ["honcho", "honda", "honey", "hone", "honk", "honing"])
      expect(segments(word)).toMatch(/^h/);
  });

  test("the US schedul root uses sk across prefix and inflection boundaries", () => {
    for (const word of ["schedule", "schedules", "scheduled", "scheduling", "scheduler", "reschedule", "rescheduled", "unscheduled"])
      expect(segments(word)).toContain("skɛdʒ");
    for (const word of ["schedler", "schiller", "schmidt"])
      expect(segments(word)).toMatch(/^ʃ/);
  });

  test("the echo combining root keeps k while nearby ch spellings stay distinct", () => {
    for (const word of ["echo", "echoes", "echoed", "echoing", "echoer", "echoers", "echolalia", "echographic", "echocardiography"])
      expect(segments(word)).toMatch(/k/);
    for (const word of ["echochamber", "echochambers", "echochime", "echochild"])
      expect(segments(word)).toMatch(/tʃ/);
    // The longer forms' separate vowel/stress gaps are outside this rule.
    for (const word of ["chew", "check", "chicken", "chortle"])
      expect(segments(word)).toMatch(/^tʃ/);
  });

  test("a short C+ancy root retains strong TRAP through transparent prefixing", () => {
    for (const word of ["fancy", "fancies", "fanciest", "fancier", "chancy", "nancy", "clancy", "unfancy", "nonfancy"])
      expect(segments(word)).toContain("æn");
    // Francies has a supplied weak-vowel name reading; own only its /s/ join.
    expect(segments("francies")).toMatch(/nsiz$/);
    for (const word of ["vacancy", "pregnancy", "occupancy", "buoyancy", "truancy"])
      expect(segments(word)).toMatch(/ənsi$/);
  });
});
