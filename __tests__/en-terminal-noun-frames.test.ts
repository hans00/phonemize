import EnglishG2P from "../src/en/g2p";

for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const plain = (word: string) => g.predict(word)!.replace(/[ˈˌ]/g, "");
  describe(`terminal noun frames (disableDict=${disableDict})`, () => {
    test("the merged weak dy noun tail retains antepenultimate primary", () => {
      for (const word of ["remedy", "remedies", "remedying", "remedywise", "remedier", "remediable"])
        expect(g.predict(word)).toMatch(/^ˈɹɛmədi/);
      for (const word of ["nonremedy", "unremedied"])
        expect(g.predict(word)).toMatch(/ˈɹɛmədi/);
    });
    test("other weak dy nouns and longer body compounds retain primary", () => {
      for (const word of ["comedy", "tragedy", "melody", "parody", "prosody"])
        expect(g.predict(word)).toMatch(/^ˈ/);
      expect(g.predict("antibody")).toMatch(/^ˈænt[ɪi]/);
    });
    test("nasal ngue has no final stop", () => {
      for (const word of ["tongue", "harangue", "meringue"])
        expect(plain(word)).toMatch(/ŋ$/);
      for (const word of ["tongues", "tongued", "tonguing"])
        expect(plain(word)).toMatch(/ŋ(?:z|d|ɪŋ)$/);
    });
    test("the other gue rimes retain their stop or sounded vowel", () => {
      for (const word of ["dengue", "league", "rogue", "vague"])
        expect(plain(word)).toMatch(/ɡ$/);
      expect(plain("argue")).toMatch(/ɡju$/);
    });
    test("the longer onnel loan rime and its neutral compositions retain final primary", () => {
      for (const word of ["personnel", "personnels", "nonpersonnel", "personnelwise"])
        expect(g.predict(word)).toMatch(/pɝsəˈnɛ[ɫl]/);
      for (const word of ["channel", "multichannel", "tunnel", "polytunnel"])
        expect(plain(word)).toMatch(/ə[ɫl]$/);
    });
    test("open-initial and doubled-final-l names keep their frame", () => {
      for (const word of ["odonnel", "o'donnel"]) expect(g.predict(word)).toMatch(/ˈdɑnə[ɫl]$/);
    });
    test("vowel tein retains its root primary and FLEECE", () => {
      for (const word of ["protein", "proteins", "nonprotein", "proteinlike"])
        expect(g.predict(word)).toMatch(/ˈpɹoʊˌ?tin/);
      for (const word of ["lipoprotein", "mucoprotein", "glycoprotein"])
        expect(g.predict(word)).toMatch(/ˈpɹoʊtin$/);
      expect(plain("chemoprotein")).toMatch(/^kimoʊpɹoʊtin$/);
      for (const word of ["stein", "bernstein"])
        expect(plain(word)).toMatch(/staɪn$/);
    });
  });
}
