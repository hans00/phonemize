import EnglishG2P from "../src/en/g2p";

describe.each([false, true])(
  "Greek noun frames and Latin weak syllables (disableDict=%s)",
  (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string =>
      g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("a combining vowel keeps final gram full", () => {
      for (const word of [
        "histogram",
        "hologram",
        "kilogram",
        "monogram",
        "histograms",
        "holograms",
        "kilograms",
        "monograms",
      ])
        expect(segments(word)).toMatch(/ɡɹæmz?$/);
      expect(segments("pilgram")).toMatch(/ɡɹəm$/);
    });

    test("silent ue leaves the log noun's head stress intact", () => {
      for (const word of ["catalogue", "monologue", "catalogues", "monologues"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
      for (const word of ["prologue", "prologues"])
        expect(g2p.predict(word)).toMatch(/^ˈpɹoʊ/);
      for (const word of ["catalogue", "monologue", "dialogue"])
        expect(segments(word)).toMatch(/[ɑɔ]ɡ$/);
    });

    test("dia's weak second nucleus stays inside the stressed noun head", () => {
      for (const word of ["diagram", "dialogue", "diatribe"])
        expect(g2p.predict(word)).toMatch(/^ˈdaɪə/);
      for (const word of ["diagonal", "diameter"])
        expect(g2p.predict(word)).toMatch(/^daɪˈæ/);
    });

    test("final gm loses g while vowel-initial derivatives keep it", () => {
      for (const word of ["phlegm", "phlegms"])
        expect(segments(word)).toMatch(/ɛ[ɫl]?mz?$/);
      for (const word of ["paradigm", "paradigms"])
        expect(segments(word)).toMatch(/daɪmz?$/);
      for (const word of ["phlegmatic", "paradigmatic"])
        expect(segments(word)).toContain("ɡm");
    });

    test("logize uses the y noun frame through inflection", () => {
      for (const word of ["apologize", "apologized", "eulogize", "eulogized"])
        expect(segments(word)).toContain("ɫədʒaɪz");
      expect(g2p.predict("apologize")).toMatch(/^əˈpɑ/);
      expect(g2p.predict("eulogize")).toMatch(/^ˈju/);
      expect(segments("biologist")).toMatch(/ədʒɪst$/);
      expect(segments("photographer")).toMatch(/ɡɹəfɝ$/);
    });

    test("open re noun/adjective frames differ from hiatus and closed roots", () => {
      for (const word of [
        "relevant",
        "revenue",
        "redolent",
        "regimen",
        "reverent",
      ])
        expect(g2p.predict(word)).toMatch(/^ˈɹɛ/);
      for (const word of ["recipient", "resilient", "repellent", "remittent"])
        expect(g2p.predict(word)).toMatch(/^ɹ[əiɪ]ˈ/);
    });

    test("posttonic thematic vowels centralize in their bounded frames", () => {
      expect(segments("elegant")).toContain("ɫəɡ");
      expect(segments("elephant")).toContain("ɫəf");
      expect(segments("celebrant")).toContain("ɫəb");
      expect(segments("avenue")).toMatch(/^ævən/);
      for (const word of ["specimen", "specimens"])
        expect(segments(word)).toContain("səmən");
      for (const word of [
        "regimen",
        "regimens",
        "regiment",
        "regiments",
        "regimented",
      ])
        expect(segments(word)).toContain("dʒəm");
    });

    test("weak ance/ence prefixes yield to the root without moving hiatus", () => {
      expect(g2p.predict("advance")).toMatch(/ˈvæns$/);
      expect(g2p.predict("commence")).toMatch(/ˈmɛns$/);
      expect(g2p.predict("defence")).toMatch(/ˈfɛns$/);
      for (const word of ["deviance", "absence", "presence"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
    });

    test("mand/mend stress survives root eviction and regular inflections", () => {
      for (const word of ["command", "commands", "commander", "commanded"])
        expect(g2p.predict(word)).toMatch(/^kəˈmænd/);
      for (const word of ["commend", "commends"])
        expect(g2p.predict(word)).toMatch(/^kəˈmɛnd/);
      for (const word of ["comment", "common"])
        expect(g2p.predict(word)).toMatch(/^ˈkɑ/);
    });
  },
);

test("bare Logue is not mistaken for a longer silent-ue suffix", () => {
  expect(new EnglishG2P({ disableDict: true }).predict("logue")).toContain(
    "oʊ",
  );
});

test("a consonant-only abbreviation does not license silent Greek g", () => {
  const g2p = new EnglishG2P({ disableDict: true });
  for (const word of ["pgm", "mgm"]) expect(g2p.predict(word)).toContain("ɡ");
});
