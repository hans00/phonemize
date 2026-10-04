import EnglishG2P from "../src/en/g2p";

for (const disableDict of [false, true]) {
  const g = new EnglishG2P({ disableDict });
  const segments = (word: string) => g.predict(word, "en")!.replace(/[ˈˌ]/g, "");
  describe(`Unlicensed short syllables (${disableDict})`, () => {
    test("spells obstruent codas with letter names", () => {
      for (const [word, ipa] of [
        ["abc", "eɪbisi"], ["acm", "eɪsiɛm"], ["adsl", "eɪdiɛsɛɫ"],
        ["atm", "eɪtiɛm"], ["atp", "eɪtipi"], ["espn", "iɛspiɛn"],
        ["ibm", "aɪbiɛm"], ["isbn", "aɪɛsbiɛn"], ["usb", "juɛsbi"],
      ]) expect(segments(word)).toBe(ipa);
      expect(segments("abc's")).toBe("eɪbisiz");
    });
    test("keeps ordinary stops, sonorants and spelling digraphs", () => {
      for (const [word, ipa] of [["app", "æp"], ["egg", "ɛɡ"], ["ebb", "ɛb"],
        ["add", "æd"], ["ack", "æk"], ["act", "ækt"], ["apt", "æpt"],
        ["ask", "æsk"], ["asp", "æsp"], ["ism", "ɪzəm"]])
        expect(segments(word)).toBe(ipa);
      expect(segments("gas")).toBe("ɡæs");
    });
  });
}

test("traces the letter-spelling rule instead of an unused vowel rule", () => {
  const g = new EnglishG2P({ disableDict: true });
  for (const word of ["abc", "isbn", "usb", "fbi", "cpu"])
    expect(g.trace(word).steps).toEqual([
      { grapheme: word, phoneme: g.predict(word, "en"), rule: "initialism:letter-spelling" },
    ]);
});
