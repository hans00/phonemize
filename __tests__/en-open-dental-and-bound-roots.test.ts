import EnglishG2P from "../src/en/g2p";

describe.each([false, true])(
  "open dental frames and bound roots (disableDict=%s)",
  (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string =>
      g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("open wa retains rounding through neutral derivatives", () => {
      for (const word of [
        "water",
        "watery",
        "waterish",
        "waterman",
        "watermen",
      ])
        expect(g2p.predict(word)).toMatch(/^ˈwɔtɝ/);
      for (const word of ["wattle", "wattage"])
        expect(g2p.predict(word)).toMatch(/^ˈwɑ/);
    });

    test("regular past endings retain their complete stem", () => {
      expect(segments("seemed")).toBe("simd");
      expect(segments("probed")).toBe("pɹoʊbd");
    });

    test("the bound tain verb differs from a weak noun rime", () => {
      for (const word of ["contain", "contains", "contained", "containing"])
        expect(g2p.predict(word)).toMatch(/^kənˈteɪn/);
      for (const word of ["maintain", "maintains", "maintained", "maintaining"])
        expect(g2p.predict(word)).toMatch(/^meɪnˈteɪn/);
      for (const word of ["pertain", "entertain"])
        expect(g2p.predict(word)).toMatch(/ˈteɪn$/);
      for (const word of ["certain", "captain", "curtain", "mountain"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
      expect(segments("captain")).toMatch(/tən$/);
    });

    test("bound sent has root stress while the absent adjective keeps its head", () => {
      for (const word of ["consent", "consents", "consented", "consenting"])
        expect(g2p.predict(word)).toMatch(/^kənˈsɛnt/);
      for (const word of ["dissent", "dissents", "dissented", "dissenting"])
        expect(g2p.predict(word)).toMatch(/^dɪˈsɛnt/);
      expect(g2p.predict("absent")).toMatch(/^ˈæb/);
    });

    test("the two-slot tr+ol root survives doubling and agent suffixes", () => {
      for (const word of [
        "control",
        "controls",
        "controlled",
        "controlling",
        "controller",
      ])
        expect(g2p.predict(word)).toMatch(/^kənˈtɹoʊɫ/);
      for (const word of [
        "patrol",
        "patrols",
        "patrolled",
        "patrolling",
        "patroller",
      ])
        expect(g2p.predict(word)).toMatch(/^pəˈtɹoʊɫ/);
      expect(segments("trolley")).toMatch(/^tɹɑɫ/);
      expect(g2p.predict("petrol")).toMatch(/^ˈpɛ/);
    });

    test("complex rhotic ow plus silent se retains its vowel and voicing", () => {
      for (const word of [
        "browse",
        "browses",
        "browsed",
        "browsing",
        "browser",
      ])
        expect(g2p.predict(word)).toMatch(/^ˈbɹaʊz/);
      for (const word of ["bowse", "rowse"])
        expect(segments(word)).toMatch(/oʊs$/);
    });
  },
);
