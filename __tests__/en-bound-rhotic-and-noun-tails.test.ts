import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("bound rhotic and noun tails (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const bare = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("weak ence and ency tails keep one rhotic nucleus after doubled ur", () => {
    for (const word of ["currency", "currencies", "occurrence", "occurrences", "concurrence", "recurrence", "recurrences"])
      expect(bare(word)).toMatch(/kɝəns/);
    expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
  });

  test("a nasal-coda prefix before form weakens with the stressed ation suffix", () => {
    for (const word of ["information", "information's", "informational", "misinformation", "disinformation"])
      expect(g2p.predict(word)).toContain("fɝˈmeɪ");
    expect(bare("deformation")).toContain("fɔɹmeɪ");
    expect(bare("formation")).toContain("fɔɹmeɪ");
    expect(bare("inform")).toContain("fɔɹm");
  });

  test("bound ernal and urnal adjectives retain their whole-word stress", () => {
    for (const word of ["maternal", "maternally", "paternal", "paternally", "fraternal", "eternal", "eternally", "internal", "internally", "nocturnal"])
      expect(g2p.predict(word)).toContain("ˈtɝ");
    expect(g2p.predict("journal")).toMatch(/^ˈdʒɝ/);
    expect(g2p.predict("lateral")).toMatch(/^ˈɫæ/);
  });

  test("gramme retains the gram noun boundary in its plural", () => {
    for (const word of ["programme", "programmes"])
      expect(g2p.predict(word)).toMatch(/^ˈpɹoʊ/);
    for (const word of ["kilogramme", "kilogrammes", "monogramme", "monogrammes"])
      expect(bare(word)).toMatch(/ɡɹæmz?$/);
  });

  test("the weak posttonic vate frame preserves neighbouring mate and ivate vowels", () => {
    for (const word of ["private", "privates", "privately"])
      expect(bare(word)).toMatch(/pɹaɪvət/);
    for (const word of ["primate", "primates", "motivate", "motivates", "activate", "activates", "cultivate"])
      expect(bare(word)).toMatch(/eɪt/);
  });
});

test("a silent trace step does not displace the following vowel's trace", () => {
  const trace = new EnglishG2P({ disableDict: true }).trace("currency");
  expect(trace.steps.find(step => step.rule === "phoneme:^rhotic-ence-double-r")?.phoneme).toBe("");
  expect(trace.steps.find(step => step.grapheme === "e")?.phoneme).toBe("ə");
  expect(trace.steps.find(step => step.grapheme === "n")?.phoneme).toBe("n");
});
