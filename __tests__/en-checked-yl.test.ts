import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("checked final yl (disableDict=%s)", (disableDict) => {
  const g = new EnglishG2P({ disableDict });
  const plain = (word: string) => g.predict(word)!.replace(/[ˈˌ]/g, "");
  test("a second nucleus within a merged slot is weak", () => {
    for (const word of ["ethyl", "methyl", "beryl", "sibyl", "vinyl"])
      expect(plain(word)).toMatch(/ə[ɫl]$/);
    // Own only the weak ending: vinyl's independent PRICE gap stays open.
    for (const word of ["ethyls", "methyls", "beryls", "sibyls", "vinyls"])
      expect(plain(word)).toMatch(/ə[ɫl]z$/);
  });
  test("spelling guards preserve root KIT and genuine suffix reduction", () => {
    expect(plain("sibyl")).toMatch(/^sɪb/);
    expect(plain("gibble")).toMatch(/^dʒɪb/);

    for (const word of ["possible", "sensible", "eligible"])
      expect(plain(word)).toMatch(/ə[ɫl]$/);
    expect(plain("vantuyl")).not.toMatch(/əə/);
    expect(plain("style")).toMatch(/^staɪ/);
    for (const word of ["restyled", "deadwyler"]) expect(plain(word)).toMatch(/aɪ[ɫl]/);
  });
  test("geminate Cle roots keep their syllabic nucleus before plural s", () => {
    expect(plain("gibbles")).toMatch(/^dʒɪbə[ɫl]z$/);
    for (const word of ["cupples", "eccles", "ruggles", "bottles", "paddles", "riddles"])
      expect(plain(word)).toMatch(/ə[ɫl]z$/);
  });
  test("complete roots retain their weak tail in prefix and suffix composition", () => {
    for (const root of ["ethyl", "methyl", "sibyl", "vinyl"]) {
      for (const prefix of ["non", "semi", "multi"])
        expect(plain(prefix + root)).toMatch(/ə[ɫl]$/);
      for (const suffix of ["less", "ness"])
        expect(plain(root + suffix)).toMatch(/ə[ɫl]/);
    }
  });
});
