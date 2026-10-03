import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("open roots and inflection boundaries (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("checked pro nouns retain head stress and LOT", () => {
    for (const word of ["product", "products", "product's", "problem", "problems", "proper", "properly", "property", "properties", "prodigy", "prodigies", "prosody"])
      expect(g2p.predict(word)).toMatch(/^ˈpɹɑ/);
  });

  test("bound pro verbs keep their root stress and vowel", () => {
    for (const word of ["profess", "professed", "professing"])
      expect(g2p.predict(word)).toMatch(/^pɹəˈfɛs/);
    for (const word of ["propel", "propelled", "propelling"])
      expect(g2p.predict(word)).toMatch(/^pɹəˈpɛɫ/);
    expect(g2p.predict("protect")).toMatch(/^pɹəˈtɛkt/);
    expect(g2p.predict("proposal")).toMatch(/^pɹəˈpoʊ/);
  });

  test("i plus a weak ary or ory tail retains PRICE", () => {
    for (const word of ["binary", "binaries", "ivory", "ivories", "library", "libraries", "primary", "primaries"])
      expect(g2p.predict(word)).toMatch(/^ˈ[^aeiouæɑɔəɛɪʊʌɝ]*aɪ/);
    for (const word of ["library", "primary"])
      expect(segments(word)).toMatch(/ɛɹi$/);
    expect(segments("history")).toMatch(/^hɪ/);
    expect(segments("primarily")).toMatch(/^pɹaɪ/);
    expect(segments("family")).toMatch(/^fæ/);
  });

  test("merged consonant-y frames retain their root vowel in derivatives", () => {
    for (const word of ["pony", "ponies", "ponytail", "phony", "phonies", "nosy", "nosier", "cozy", "cozier"])
      expect(segments(word)).toContain("oʊ");
    for (const word of ["tiny", "tinier", "tiniest", "shiny", "shinier", "spiny", "spinier", "icy", "icier", "icily", "spicy", "spicier", "spicily", "pricy", "priciest"])
      expect(segments(word)).toContain("aɪ");
    for (const word of ["body", "copy", "poly"])
      expect(segments(word)).toMatch(/ɑ/);
    expect(segments("Pliny")).toMatch(/^pɫɪ/);
  });

  test("a bare primary open root centralizes sis without changing medial roots", () => {
    expect(segments("basis")).toMatch(/eɪsəs$/);
    expect(segments("crisis")).toMatch(/aɪsəs$/);
    expect(segments("thesis")).toBe("θisəs");
    expect(segments("prosthesis")).toMatch(/θɛsɪs$/);
    for (const word of ["nemesis", "parenthesis"])
      expect(segments(word)).toMatch(/sɪs$/);
  });

  test("vowel-final monosyllables keep their vowel across ing", () => {
    expect(segments("seeing")).toBe("siɪŋ");
    expect(segments("hoeing")).toBe("hoʊɪŋ");
    expect(segments("freeing")).toBe("fɹiɪŋ");
    expect(segments("cooing")).toBe("kuɪŋ");
    expect(segments("doing")).toBe("duɪŋ");
    expect(segments("planned")).toBe("pɫænd");
    expect(segments("stopped")).toBe("stɑpt");
  });

  test("prefix plus ion retains root stress", () => {
    expect(g2p.predict("provision")).toMatch(/^pɹəˈvɪʒən$/);
    expect(g2p.predict("indecision")).toMatch(/ˈsɪʒən$/);
    expect(g2p.predict("indigestion")).toMatch(/ˈdʒɛstʃən$/);
    expect(g2p.predict("indiscretion")).toMatch(/ˈkɹɛʃən$/);
  });
});

test("trace identifies compound joins that bypass syllable rules", () => {
  const g2p = new EnglishG2P({ disableDict: true });
  for (const word of ["foreword", "television"]) {
    const trace = g2p.trace(word);
    expect(trace.path).toBe("compound");
    expect(trace.ipa).toBe(g2p.predict(word));
    expect(trace.steps.every((step) => step.rule === "compound")).toBe(true);
  }
  expect(g2p.trace("provision").path).toBe("rules");
});

test("runtime retains noun and verb readings after the checked-root change", () => {
  const g2p = new EnglishG2P();
  for (const word of ["project", "progress", "prospect"]) {
    expect(g2p.predict(word, "en", "N")).toMatch(/^ˈpɹ/);
    expect(g2p.predict(word, "en", "V")).toMatch(/^[ˌ]?pɹ[əʌ]ˈ/);
  }
  expect(g2p.predict("invite", "en", "N")).toMatch(/^ˈɪn/);
  expect(g2p.predict("invite", "en", "V")).toMatch(/ˈvaɪt$/);
  expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
});
