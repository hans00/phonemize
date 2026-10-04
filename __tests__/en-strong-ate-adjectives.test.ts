import EnglishG2P from "../src/en/g2p";
for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const predict = (word: string) => g.predict(word, "en")!;
  describe(`supplied geminate ate adjectives (${disableDict})`, () => {
    test("keeps the attested verb's strong thematic ate", () => {
      for (const root of ["innovative", "appreciative", "accumulative"])
        for (const ending of ["", "s", "ly"])
          expect(predict(root + ending)).toMatch(/eɪtɪv/);
      expect(predict("innovative")).toMatch(/^ˈɪn/);
    });
    test("keeps other adjective families weak", () => {
      for (const word of ["alternative", "affirmative", "illustrative", "accusative", "operative", "cumulative", "conservative"])
        expect(predict(word)).toMatch(/ətɪv$/);
    });
  });
}
