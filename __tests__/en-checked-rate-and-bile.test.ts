import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("checked rate and bile rimes (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("checked noun and adjective roots keep weak rate through neutral endings", () => {
    for (const word of ["accurate", "accurately", "corporate", "corporately", "doctorate", "doctorates", "temperate", "temperately", "obdurate"])
      expect(segments(word)).toMatch(/ɝət(?:s|ɫi)?$/);
  });

  test("a cluster onset and a bound prefix retain the verb's FACE", () => {
    for (const word of ["aspirate", "aspirated", "aspirating", "perforate", "perforated", "incorporate", "incorporated", "incorporating", "generate", "generated", "celebrate"])
      expect(segments(word)).toContain("eɪ");
    for (const word of ["restoration", "respiration", "declaration", "exploration"])
      expect(g2p.predict(word)).toMatch(/ˈeɪʃən$/);
  });

  test("negative prefixes preserve a rule-derived checked rate root", () => {
    for (const word of ["noncorporate", "nonaccurate", "nonobdurate", "nontemperate"])
      expect(segments(word)).toMatch(/ət$/);
  });

  test("open o and weak bile retain their nuclei across the plural boundary", () => {
    for (const word of ["mobile", "mobile's", "mobiles"])
      expect(segments(word)).toMatch(/moʊbəɫz?$/);
  });

  test("suffix stress keeps the full mobility root", () => {
    for (const word of ["mobility", "immobility"])
      expect(g2p.predict(word)).toMatch(/ˈbɪɫ/);

  });
});
