import EnglishG2P from "../src/en/g2p";
for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const predict = (word: string) => g.predict(word, "en")!;
  describe(`Greek medical roots (${disableDict})`, () => {
    test("stresses the PRICE nucleus through noun and agent composition", () => {
      for (const root of ["psychiatry", "podiatry", "psychiatrist", "podiatrist"])
        for (const word of [root, root + "'s", "non" + root])
          expect(predict(word)).toMatch(/ˈ[^aeiouɑæɛɪɔʊʌəɝ]*aɪə[ˌ]?[tθ]ɹ/);
      for (const word of ["psychiatrists", "podiatrists", "psychiatries", "podiatries"])
        expect(predict(word)).toMatch(/ˈ[^aeiouɑæɛɪɔʊʌəɝ]*aɪə/);
    });
    test("keeps psych PRICE and ordinary psyl KIT", () => {
      for (const word of ["psych", "psychs", "psyched", "psyching", "psychic", "psychics", "psychical", "psychically", "antipsychic", "semipsychical", "multipsychic", "neuropsych", "neuropsychiatrist", "neuropsychiatry"])
        expect(predict(word)).toMatch(/saɪ/);
      expect(predict("psyllium")).toMatch(/sɪ/);
      expect(predict("syllable")).toMatch(/sɪ/);
    });
    test("keeps adjective and other Greek suffix stress", () => {
      for (const word of ["psychiatric", "antipsychiatric", "semipsychiatric", "multipsychiatric", "neuropsychiatric"])
        expect(predict(word)).toMatch(/ˈæ[tθ]ɹɪk/);
      expect(predict("pediatric")).toMatch(/ˈæ[tθ]ɹɪk/);
      expect(predict("geometry")).toMatch(/ˈɑm/);
      expect(predict("symmetry")).toMatch(/^ˈsɪm/);
      expect(predict("patriotic")).toMatch(/ˈɑt/);
    });
  });
}
