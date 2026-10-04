import EnglishG2P from "../src/en/g2p";

for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const predict = (word: string) => g.predict(word, "en")!;
  describe(`Stress-bearing -ee (${disableDict})`, () => {
    test("retains the terminal beat through noun and verb forms", () => {
      for (const root of ["guarantee", "absentee"])
        for (const word of [root, root + "s", root + "'s", "non" + root])
          expect(predict(word)).toMatch(/ˈti/);
      for (const word of ["guaranteed", "guaranteeing"])
        expect(predict(word)).toMatch(/ˈti/);
    });
    test("keeps the bound a-prefix weak", () => {
      expect(predict("appointee")).toMatch(/^ə/);
      if (disableDict) {
        expect(predict("appointee")).toMatch(/pɔɪnˈti$/);
        expect(predict("assentee")).toMatch(/^əsɛnˈti$/);
      }
    });
    test("preserves other ee roots and ordinary past forms", () => {
      expect(predict("coffee")).toMatch(/^ˈk[ɑɔ]fi$/);
      expect(predict("pedigree")).toMatch(/^ˈpɛ/);
      expect(predict("feed")).toMatch(/fid$/);
      expect(predict("need")).toMatch(/nid$/);
      expect(predict("agreed")).toMatch(/ˈɡɹid$/);
    });
  });
}
