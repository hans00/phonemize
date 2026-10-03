import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("productive adverb and root frames (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("closed-class ever compounds retain the head and stress ever", () => {
    for (const word of ["however", "whatever", "whenever", "whoever", "whomever", "whichever"])
      expect(g2p.predict(word)).toMatch(/ˈ[^ˈ]*ɛvɝ$/);
    expect(segments("however")).toContain("haʊ");
    expect(segments("forever")).toBe("fɝɛvɝ");
    for (const word of ["believer", "reliever", "cheever"])
      expect(segments(word)).toMatch(/ivɝ$/);
  });

  test("ulatory inherits its ulate root without moving primary to the linker", () => {
    expect(g2p.predict("regulatory")).toMatch(/^ˈɹɛɡjə/);
    expect(g2p.predict("articulatory")).toContain("ˈtɪkjə");
    expect(g2p.predict("ambulatory")).toMatch(/^ˈæmbjə/);
    for (const word of ["obligatory", "compensatory"])
      expect(g2p.predict(word)).toMatch(/ˈ[^ˈ]*(?:ɪɡ|ɛns)/);
  });

  test("thematic itative retains the itate verb while root digraphs stay intact", () => {
    for (const word of ["imitative", "meditative", "qualitative", "quantitative"])
      expect(segments(word)).toMatch(/eɪtɪv$/);
    expect(segments("exploitative")).toContain("ɔɪtətɪv");
  });

  test("inter and intra keep the full prefix and an independently vouched root", () => {
    expect(g2p.predict("interact")).toContain("ɪntɝˈækt");
    expect(g2p.predict("interactive")).toContain("ɪntɝˈæktɪv");
    expect(segments("internet")).toContain("ɪntɝnɛt");
    expect(segments("interwoven")).toContain("ɪntɝwoʊv");
    expect(segments("intraday")).toContain("ɪntɹədeɪ");
    expect(segments("interceded")).toMatch(/sidɪd$/);
  });

  test("qual+i retains its rounded root vowel and other qu rimes keep theirs", () => {
    for (const word of ["quality", "equality", "requalify", "qualitative"])
      expect(segments(word)).toContain("kwɑɫ");
    expect(segments("quail")).toContain("kweɪɫ");
    expect(segments("quarter")).toContain("kwɔɹ");
  });
});
