import EnglishG2P from "../src/en/g2p";

describe.each([false, true])(
  "weak roots and prefix boundaries (disableDict=%s)",
  (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string =>
      g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("the open re adjective frame differs from a two-syllable verb", () => {
      for (const word of ["relative", "relatives", "relatively"])
        expect(g2p.predict(word)).toMatch(/^ˈɹɛɫə/);
      for (const word of ["revive", "relive", "receptive", "reductive"])
        expect(g2p.predict(word)).toMatch(/^ɹiˈ/);
    });

    test("a stressed bare e lengthens before its bounded weak tail", () => {
      for (const word of ["even", "evil", "eden"])
        expect(g2p.predict(word)).toMatch(/^ˈi/);
      for (const word of ["evil", "evilly", "evilness"])
        expect(segments(word)).toContain("vəɫ");
    });

    test("a weak fricative il rime survives plural and agent composition", () => {
      for (const word of [
        "civil",
        "council",
        "fossil",
        "pencil",
        "vigil",
        "weevil",
        "anvil",
      ])
        expect(segments(word)).toMatch(/əɫ$/);
      for (const word of [
        "councils",
        "fossils",
        "pencils",
        "vigils",
        "weevils",
        "anvils",
      ])
        expect(segments(word)).toMatch(/əɫz$/);
      for (const word of [
        "penciled",
        "pencilled",
        "penciling",
        "pencilling",
        "penciler",
        "penciller",
      ])
        expect(g2p.predict(word)).toMatch(/^ˈpɛnsəɫ/);
    });

    test("strong or non-fricative il keeps its vowel", () => {
      for (const word of ["brazil", "tamil", "gerbil"])
        expect(segments(word)).toMatch(/ɪɫ$/);
      // The supplied stencil reading has IH; the rule's weak schwa is also
      // attested by Cambridge. This test does not change the scoring reference.
      expect(segments("stencil")).toMatch(/s[əɪ]ɫ$/);
    });

    test("real silent-e roots remain available to regular inflections", () => {
      for (const word of ["exiled", "reviled", "reconciled", "reconciling"])
        expect(segments(word)).toContain("aɪɫ");
      // A bound con+cil fragment must not acquire the free noun's weak rime.
      // This guards the boundary without claiming its existing stem is exact.
      expect(segments("irreconcilable")).not.toContain("nsəɫ");
    });

    test("a bound prefix is not a free verb before neutral ment", () => {
      for (const word of ["comment", "comments", "commenting"])
        expect(g2p.predict(word)).toMatch(/^ˈkɑm[əɛ]nt/);
      expect(segments("comment")).not.toContain("mm");
    });
  },
);
