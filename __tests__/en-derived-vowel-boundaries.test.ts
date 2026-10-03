import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("derived vowel boundaries, disableDict=%s", (disableDict) => {
  const g = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g.predict(word)!.replace(/[ˈˌ]/g, "");

  test("igh stays intact before comparative and superlative suffixes", () => {
    expect(segments("higher")).toBe("haɪɝ");
    expect(segments("highest")).toBe("haɪəst");
    expect(segments("bighearted")).toContain("ɡh");
  });

  test("final gion has one weak nucleus", () => {
    for (const word of ["region", "religion", "contagion", "legion"])
      expect(segments(word)).toMatch(/dʒən$/);
    expect(g.predict("region")).toMatch(/^ˈɹi/);
    for (const word of ["legionary", "legionaries"])
      expect(segments(word)).toMatch(/^ɫidʒənɛɹi/);
    expect(segments("reactionary")).toMatch(/^ɹiækʃənɛɹi/);
    expect(segments("ordinary")).toMatch(/^ɔɹ/);
  });

  test("eo before syllabic ple contracts without erasing neo's vowel", () => {
    expect(segments("people")).toBe("pipəɫ");
    expect(segments("neoplatonist")).toContain("nioʊ");
  });

  test("ued and uing recover a vowel-final ue stem", () => {
    expect(segments("argued")).toMatch(/ɡjud$/);
    expect(segments("arguing")).toMatch(/ɡjuɪŋ$/);
    expect(segments("continuing")).toMatch(/njuɪŋ$/);
    expect(segments("issued")).toMatch(/ʃud$/);
    expect(segments("rescuing")).toMatch(/kjuɪŋ$/);
    expect(segments("plaguing")).not.toContain("ɡju");
  });

  test("silent-e roots retain their vowels before ty and keep linking nuclei", () => {
    expect(segments("safety")).toBe("seɪfti");
    expect(segments("ninety")).toBe("naɪnti");
    expect(segments("subtlety")).toMatch(/təɫti$/);
    expect(segments("nicety")).toMatch(/s[əɪ]ti$/);
    expect(segments("surety")).toMatch(/ɹ[əɪ]ti$/);
    expect(segments("rickety")).toMatch(/k[əɪ]ti$/);
    expect(segments("velvety")).toMatch(/v[əɪ]ti$/);
  });

  test("short ual has a full u and a weak second nucleus", () => {
    expect(segments("dual")).toBe("duəɫ");
    expect(segments("quail")).toBe("kweɪɫ");
  });

  test("initial ide retains tense i while idi stays lax", () => {
    for (const word of ["identity", "identical", "ideology"])
      expect(segments(word)).toMatch(/^aɪ/);
    expect(g.predict("idea")).toMatch(/^aɪˈdiə$/);
    expect(g.predict("ideal")).toMatch(/^aɪˈdi/);
    expect(g.predict("ideas")).toBe("aɪˈdiəz");
    for (const word of ["idiot", "idiom", "idiotic"])
      expect(segments(word)).toMatch(/^ɪ/);
  });

  test("photo retains its first long vowel when it carries stress", () => {
    for (const word of ["photograph", "photographic", "photogenic"])
      expect(segments(word)).toMatch(/^foʊ/);
    expect(segments("photography")).toMatch(/^fə/);
  });

  test("weak assimilated por reduces without weakening free or roots", () => {
    expect(segments("opportunity")).toMatch(/^ɑpɝ/);
    expect(segments("immortality")).toContain("mɔɹ");
    expect(segments("importation")).toContain("pɔɹ");
  });

  test("strong sure and ward retain their root vowels", () => {
    for (const word of ["sure", "assure", "insure", "ensure"])
      expect(segments(word)).toMatch(/ʃʊɹ$/);
    expect(segments("award")).toMatch(/wɔɹd$/);
    expect(segments("measure")).toMatch(/ʒɝ$/);
    expect(segments("forward")).toMatch(/wɝd$/);
    expect(segments("entered")).toBe("ɛntɝd");
    expect(segments("entering")).toBe("ɛntɝɪŋ");
  });

  test("co retains a separate vowel before a longer rhotic root", () => {
    for (const word of ["coordinate", "coordinator"])
      expect(g.predict(word)).toMatch(/koʊˈɔɹdə/);
    expect(segments("terminator")).toContain("məneɪt");
    expect(segments("uncoordinated")).toContain("koʊɔɹdəneɪt");
    expect(segments("cooler")).toMatch(/^ku/);
    expect(segments("coastline")).toMatch(/^koʊst/);
  });
});
