import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak ure and closed e roots (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("weak tails preserve the glide and reduced rhotic through inflection", () => {
    for (const word of ["failure", "failures", "tenure", "tenures", "tenured"])
      expect(g2p.predict(word)).toMatch(/[ɫn]jɝ/);
    for (const word of ["procedure", "procedures"])
      expect(g2p.predict(word)).toContain("ˈsidʒɝ");
  });

  test("strong roots retain CURE rather than taking the weak tail", () => {
    for (const word of ["cure", "cures", "pure", "secure", "secured"])
      expect(g2p.predict(word)).toContain("jʊɹ");
    for (const word of ["manure", "manures", "inure", "inured", "allure", "alluring"])
      expect(g2p.predict(word)).toContain("ʊɹ");
  });

  test("an initial open e leaves the closed verb root stressed after eviction", () => {
    for (const word of ["eject", "ejects", "ejected", "ejecting"])
      expect(g2p.predict(word)).toContain("ˈdʒɛkt");
    for (const word of ["evict", "evicts", "evicted", "evicting"])
      expect(g2p.predict(word)).toContain("ˈvɪkt");
    for (const word of ["event", "events", "eventful"])
      expect(g2p.predict(word)).toContain("ˈvɛnt");
  });

  test("open and unrelated roots keep initial stress", () => {
    for (const word of ["even", "evil", "edit", "edict", "epic", "echo", "egret"])
      expect(g2p.predict(word)).toMatch(/^ˈ/);
  });
});
