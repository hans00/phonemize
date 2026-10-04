import EnglishG2P from "../src/en/g2p";

for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const predict = (word: string) => g.predict(word, "en")!;
  describe(`checked alf coda (${disableDict})`, () => {
    test("keeps the root vowel and silent lateral", () => {
      for (const word of ["half", "calf", "behalf", "half's", "calf's", "calfs"])
        expect(predict(word)).toMatch(/æf(?:s)?$/);
    });
    test("retains the supplied root in ordinary compositions", () => {
      for (const word of ["halves", "calves", "halfway", "halfback", "halfhearted", "halfheartedly", "halftime"])
        expect(predict(word)).not.toMatch(/æ[lɫ][fv]/);
    });
    test("keeps other ves endings and supplied sonorant-f roots", () => {
      for (const word of ["shelves", "wolves", "elves", "ourselves", "themselves"])
        expect(predict(word)).toMatch(/v[zʒ]?$/);
      for (const [word, ending] of [["cheves", /tʃivz$/], ["ives", /aɪvz$/], ["gives", /ɡɪvz$/], ["hives", /aɪvz$/], ["curves", /ɝvz$/]] as const)
        expect(predict(word)).toMatch(ending);
    });
    test("retains laterals in names and medial codas", () => {
      for (const word of ["alf", "ralf", "scalf", "alfred", "halfdan", "gandalf"])
        expect(predict(word)).toMatch(/[lɫ]f/);
      for (const word of ["film", "helm", "realm"])
        expect(predict(word)).toMatch(/[lɫ]m/);
    });
  });
}
