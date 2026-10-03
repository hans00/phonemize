import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("our and posttonic rimes (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("single-onset FORCE and CURE roots survive regular inflections", () => {
    for (const word of ["four", "fours", "fourth", "fourths", "pour", "pours", "poured", "pouring"])
      expect(segments(word)).toMatch(/^[fp]ɔɹ/);
    for (const word of ["tour", "toured", "touring", "tournament"])
      expect(segments(word)).toMatch(/^tʊɹ/);
    // Supplied tours/tournaments entries attest different rhotic vowels.
    expect(segments("tours")).toMatch(disableDict ? /^tʊɹ/ : /^t[ʊɔ]ɹ/);
    expect(segments("tournaments")).toMatch(disableDict ? /^tʊɹ/ : /^t(?:ʊɹ|ɝ)/);
    for (const word of ["mourn", "mourns", "mourned", "mourning", "mourner", "mournful"])
      expect(segments(word)).toMatch(/^mɔɹ/);
  });

  test("MOUTH and medial NURSE rimes retain their vowels", () => {
    for (const word of ["hour", "hours", "flour", "flours", "sour", "soured", "scour", "scouring", "devour", "devoured"])
      expect(segments(word)).toContain("aʊ");
    for (const word of ["journal", "journals", "journey", "journeys", "adjourn", "adjourned"])
      expect(segments(word)).toContain("dʒɝ");
  });

  test("checked weak dental and lateral tails centralize thematic i", () => {
    for (const word of ["difficult", "difficulty", "difficulties"])
      expect(segments(word)).toContain("fəkəɫ");
    for (const word of ["evidence", "evidences", "evidencing", "evident", "evidently"])
      expect(segments(word)).toMatch(/^ɛvəd/);
    expect(segments("evidenced")).toMatch(disableDict ? /^ɛvəd/ : /^ɛv[əɪ]d/);
    for (const word of ["magnificent", "magnificently", "magnificence"])
      expect(segments(word)).toContain("nɪfəs");
  });

  test("a full ficant or root after a bound prefix retains KIT", () => {
    for (const word of ["significant", "significance"])
      expect(segments(word)).toContain("nɪfɪk");
    expect(segments("dividend")).toMatch(/^dɪvɪ/);
    expect(segments("provident")).toMatch(/^pɹɑvɪ/);
    expect(segments("envisage")).toContain("vɪ");
  });

  test("nasal um tails centralize without changing a stressed i", () => {
    expect(segments("minimum")).toMatch(/^mɪnəm/);
    expect(segments("minimums")).toMatch(disableDict ? /^mɪnəm/ : /^mɪn[əɪ]m/);
    for (const word of ["aluminum", "aluminum's"])
      expect(segments(word)).toContain("ɫumənəm");
    expect(segments("intimidate")).toContain("tɪmɪ");
  });
});
