import EnglishG2P from "../src/en/g2p";
for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const predict = (word: string) => g.predict(word, "en")!;
  const segments = (word: string) => predict(word).replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
  describe(`Independent native stems (${disableDict})`, () => {
    test("restores soft silent-e verbs in agents and adjectives", () => {
      for (const word of ["advisor", "advisors", "advisor's", "advisory"])
        expect(predict(word)).toMatch(/vaɪzɝ/);
      for (const word of ["licensor", "licensors", "licensor's"])
        expect(predict(word)).toMatch(/[ɫl]aɪsənsɝ/);
    });
    test("retains short unrelated roots and existing er agents", () => {
      expect(predict("oncor")).toMatch(/k/);
      expect(segments("censor")).toBe("sɛnsɝ");
      expect(predict("adviser")).toMatch(/vaɪzɝ$/);
      expect(predict("producer")).toMatch(/dusɝ$/);
    });
    test("retains an independently supplied ance root in ant forms", () => {
      for (const [word, ending] of [["compliant", "plaɪənt"], ["defiant", "faɪənt"], ["reliant", "laɪənt"]])
        expect(segments(word)).toMatch(new RegExp(ending + "$"));
      for (const word of ["noncompliant", "uncompliant", "anticompliant", "semicompliant"])
        expect(predict(word)).toMatch(/[ɫl]aɪənt/);
      expect(segments("cognizant")).toBe("kɑɡnəzənt");
      expect(segments("vigilant")).toBe("vɪdʒələnt");
    });
    test("keeps opaque and independently stressed roots", () => {
      expect(predict("suppliant")).toMatch(/^ˈsʌp[ɫl]iənt$/);
      expect(predict("valiant")).toMatch(/^ˈvæ[ɫl]jənt$/);
      expect(predict("brilliant")).toMatch(/^ˈbɹɪ[ɫl]jənt$/);
      if (disableDict) expect(predict("emergent")).toMatch(/^ɪˈmɝdʒənt$/);
    });
    test("contracts lian after a later stressed i", () => {
      for (const word of ["civilian", "civilians", "brazilian", "brazilians", "reptilian", "crocodilian", "crocodilianwise", "nonreptilian", "noncrocodilian"])
        expect(predict(word)).toMatch(/[ɫl]jən/);
    });
    test("retains shorter and other-vowel lian hiatus", () => {
      for (const word of ["julian", "mongolian", "aristotelian", "mammalian"])
        expect(predict(word)).toMatch(/[ɫl]iən/);
    });
  });
}
