import EnglishG2P from "../src/en/g2p";
for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const predict = (word: string) => g.predict(word, "en")!;
  describe(`English -chester (${disableDict})`, () => {
    test("retains the affricate and root vowel through composition", () => {
      for (const root of ["rochester", "dorchester", "chichester", "winchester", "manchester"])
        for (const word of [root, root + "'s", root + "s", "non" + root])
          expect(predict(word)).toMatch(/tʃɛstɝ/);
    });
    test("retains velar Greek och and ordinary ger roots", () => {
      expect(predict("orchestra")).toMatch(/k/);
      expect(predict("hamburger")).toMatch(/bɝɡɝ$/);
      expect(predict("tiger")).toMatch(/taɪɡɝ$/);
    });
  });
}
