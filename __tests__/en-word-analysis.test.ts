import EnglishG2P from "../src/en/g2p";

describe("compound alternatives from the actual dispatcher", () => {
  test("retains competing boundaries and the unsplit alternative", () => {
    const engine = new EnglishG2P({ disableDict: true });
    const result = engine.analyzeWord("castaway");
    expect(result.candidates[0]).toMatchObject({ kind: "unsplit" });
    const compounds = result.candidates.flatMap(c => c.kind === "compound" ? [c.evidence] : []);
    expect(compounds.map(c => [c.structure.left.spelling, c.structure.right.spelling])).toEqual([["cast", "away"], ["casta", "way"]]);
    expect(compounds.map(c => c.legacyScore)).toEqual([4, 3]);
    expect(engine.trace("castaway").structure).toEqual(compounds[0].structure);
    expect(result.actual.ipa).toBe(engine.predict("castaway"));
  });

  test.each(["automotive", "webpage", "hypersonic", "autoeurope", "autopacific"])("preserves the unsplit reading and does not choose by IPA plausibility: %s", word => {
    const engine = new EnglishG2P({ disableDict: true });
    const result = engine.analyzeWord(word);
    expect(result.actual.ipa).toBe(engine.predict(word));
    for (const candidate of result.candidates) {
      if (candidate.kind !== "compound") continue;
      const { left, right, boundary } = candidate.evidence.structure;
      expect(left.spelling + right.spelling).toBe(word);
      expect([left.start, left.end, right.start, right.end]).toEqual([0, left.spelling.length, left.spelling.length, word.length]);
      expect(boundary).toBe("unclassified");
    }
  });

  test("keeps an explicit whole-word selection separate from hypothetical composition", () => {
    const engine = new EnglishG2P();
    engine.addPronunciation("automotive", "ˌɔtəˈmoʊtɪv");
    const result = engine.analyzeWord("automotive");
    expect(result.actual).toEqual({ ipa: "ˌɔtəˈmoʊtɪv", route: "dictionary" });
    expect(result.candidates[0]).toMatchObject({ kind: "unsplit", componentIpa: "ˌɔtəˈmoʊtɪv", phonotactics: { status: "compatible" } });
    expect(result.candidates[1]).toMatchObject({ kind: "compound", evidence: { componentIpa: "ˌɔtəˈmoʊtɪv" }, phonotactics: { status: "compatible" } });
  });

  test("reports terminal whole-word guards instead of claiming exhaustive enumeration", () => {
    const engine = new EnglishG2P({ disableDict: true });
    expect(engine.analyzeWord("inquire")).toMatchObject({ status: "short-circuited", candidates: [{ kind: "unsplit" }] });
    expect(engine.trace("inquire").structure).toEqual({ kind: "opaque", route: "compound-dispatch-unsplit" });
  });

  test("uses current instance component overrides without mutating another instance", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("page", "P AA1 ZH");
    const candidate = engine.analyzeWord("webpage").candidates.find(c => c.kind === "compound");
    expect(candidate).toMatchObject({ evidence: { structure: { right: { componentIpa: "ˈpɑʒ" } } } });
    expect(new EnglishG2P({ disableDict: true }).predict("webpage")).not.toBe(engine.predict("webpage"));
  });

  test.each(["a", "O’Reilly", "two words"])("preserves the legacy reading and marks unsupported morphology: %s", word => {
    const engine = new EnglishG2P();
    expect(engine.analyzeWord(word)).toMatchObject({ status: "unsupported", candidates: [], actual: { ipa: engine.predict(word) } });
  });
  test.each(["", "a".repeat(65)])("rejects unbounded input before rendering: %s", word => {
    expect(() => new EnglishG2P().analyzeWord(word)).toThrow(RangeError);
  });
});
