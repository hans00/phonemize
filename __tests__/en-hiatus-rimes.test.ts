import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("hiatus rimes (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("nasal gu keeps its glide across root and suffix boundaries", () => {
    for (const word of ["penguin", "penguins", "languid", "languidly"])
      expect(g2p.predict(word)).toMatch(/ŋɡwə[nd]/);
    for (const word of ["lingua", "linguistic", "linguistics", "monolingual", "monolingually"])
      expect(g2p.predict(word)!.replace(/[ˈˌ]/g, "")).toContain("ŋɡw");
    expect(g2p.predict("language")).toMatch(/ŋɡ?wɪdʒ$/);
  });

  test("a split ate tail retains the preceding u nucleus", () => {
    for (const word of ["situate", "situates", "actuate", "actuates", "punctuate"])
      expect(g2p.predict(word)).toContain("tʃu");
    for (const word of ["attenuate", "continuation", "insinuate"])
      expect(g2p.predict(word)).toContain("nju");
    for (const word of ["evaluate", "devaluate", "revaluation"])
      expect(g2p.predict(word)).toContain("ɫju");
  });

  test("a Latin eum coda retains its two vowel nuclei", () => {
    for (const word of ["museum", "museums", "mausoleum", "mausoleums", "lyceum", "petroleum"])
      expect(g2p.predict(word)).toMatch(/iəmz?$/);
    expect(g2p.predict("neuter")).not.toContain("iə");
    expect(g2p.predict("deuce")).not.toContain("iə");
  });
});

test("the nasal-gu frame preserves neighbouring silent-u and ine classes", () => {
  const g2p = new EnglishG2P({ disableDict: true });
  for (const word of ["sanguine", "linguine", "vanguard", "vanguilder", "unguile", "conguide"])
    expect(g2p.predict(word)).not.toContain("ɡw");
});
