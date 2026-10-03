import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("silent-e suffix boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("open i remains tense before a weak -ence tail", () => {
    for (const word of ["silent", "silence", "licence"])
      expect(g2p.predict(word)).toContain("aɪ");
    for (const word of ["difference", "diligence", "incidence"])
      expect(g2p.predict(word)).not.toContain("aɪ");
    expect(g2p.predict("presence")).not.toContain("pri");
    expect(g2p.predict("balance")).not.toContain("eɪ");
    expect(g2p.predict("lawrence")).not.toContain("eɪ");
  });

  test("a supplied -uid-e root retains its diphthong before -ance", () => {
    for (const word of ["guide", "guidance", "guided"])
      expect(g2p.predict(word)).toContain("ɡaɪd");
    for (const word of ["residence", "presidence"])
      expect(g2p.predict(word)).not.toContain("zaɪd");
    expect(g2p.predict("fluid")).not.toContain("aɪ");
  });

  test("a short vowel-bearing -able root contrasts with a consonant fragment", () => {
    for (const word of ["liable", "viable", "pliable"])
      expect(g2p.predict(word)).toContain("aɪəb");
    expect(g2p.predict("doable")).toContain("duəb");
    for (const word of ["stable", "enable", "fable", "table"])
      expect(g2p.predict(word)).toContain("eɪb");
    expect(g2p.predict("variable")).not.toContain("aɪ");
    expect(g2p.predict("sociable")).not.toContain("aɪ");
  });
});
