import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("nasal roots and hard g (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("STRUT before a nasal retains its root through suffixes", () => {
    for (const word of ["come", "comes", "coming", "become", "some", "done", "none", "honey", "money", "moneys", "color", "colour", "dozen", "oven", "onion"])
      expect(g2p.predict(word)).toMatch(/[ʌə][lɫmnvz]/);
    for (const word of ["home", "dome", "gnome", "cone", "bone", "tone", "phone", "chromosome"])
      expect(g2p.predict(word)).toContain("oʊ");
  });

  test("native come/some joins leave vowel-ending loan linkers alone", () => {
    expect(g2p.predict("welcome")).toMatch(/k[ʌə]m$/);
    expect(g2p.predict("threesome")).toMatch(/s[ʌə]m$/);
    expect(g2p.predict("chromosome")).toContain("oʊm");
    expect(g2p.predict("jacome")).toContain("oʊm");
    for (const word of ["over", "oval", "omen", "frozen"])
      expect(g2p.predict(word)).toContain("oʊ");
  });

  test("closed -oll roots contrast with medial doubled l and weak names", () => {
    for (const word of ["roll", "rolls", "rolled", "rolling", "roller", "poll", "polled", "polling", "toll", "scroll", "troll", "stroll"])
      expect(g2p.predict(word)).toContain("oʊ");
    for (const word of ["doll", "dollar", "pollen", "pollyanna", "trolley", "hollow"])
      expect(g2p.predict(word)).toMatch(/[ɑɔ][lɫ]/);
    expect(g2p.predict("carroll")).not.toContain("oʊ");
  });

  test("a primary-stressed transposed silent-e rime lengthens its root", () => {
    expect(g2p.predict("acre")).toContain("eɪ");
    expect(g2p.predict("fibre")).toContain("aɪ");
    expect(g2p.predict("sabre")).toContain("eɪ");
    expect(g2p.predict("massacre")).not.toContain("eɪ");
    expect(g2p.predict("litre")).not.toContain("aɪ");
    expect(g2p.predict("timbre")).not.toContain("aɪ");
  });

  test("the bound mit root yields primary stress after weak prefixes", () => {
    for (const word of ["admit", "commit", "submit"])
      expect(g2p.predict(word)).toMatch(/ˈmɪt$/);
    expect(g2p.predict("admit")).toMatch(/^əd/);
    expect(g2p.predict("permit")).toMatch(/^ˈpɝ/);
    for (const word of ["summit", "hermit", "vomit"])
      expect(g2p.predict(word)).toMatch(/^ˈ/);
  });

  test("trans- front-vowel voicing preserves m/back-vowel contrasts", () => {
    for (const word of ["transaction", "transit", "transistor", "transitory"])
      expect(g2p.predict(word)).toMatch(/n[ˈˌ]?z/);
    for (const word of ["transmission", "transom", "transport"])
      expect(g2p.predict(word)).toMatch(/n[ˈˌ]?s/);
  });

  test("native hard-g frames survive root eviction and doubled suffixes", () => {
    for (const word of ["get", "gets", "getting", "getter", "gear", "gears", "geek", "geeks", "gig", "gigs", "gigging", "giggle"])
      expect(g2p.predict(word)).toMatch(/^ˈ?ɡ/);
    for (const word of ["gem", "germ", "gentle", "general", "gesture", "giant", "giraffe"])
      expect(g2p.predict(word)).toMatch(/^ˈ?dʒ/);
  });

  test("giv- keeps short i at an opened syllable boundary", () => {
    for (const word of ["give", "gives", "given", "giving"])
      expect(g2p.predict(word)).toMatch(/^ˈ?ɡɪv/);
    expect(g2p.predict("thanksgiving")).toContain("ɡɪv");
    expect(g2p.predict("gift")).toMatch(/^ˈ?ɡɪft/);
    expect(g2p.predict("gibe")).toContain("dʒaɪb");
  });

  test("root sh+oe has GOOSE while medial and sch spellings stay distinct", () => {
    for (const word of ["shoe", "shoes", "shoed", "shoeing", "shoestring"])
      expect(g2p.predict(word)).toMatch(/^ˈ?ʃu/);
    expect(g2p.predict("washoe")).toContain("oʊ");
    expect(g2p.predict("poem")).toContain("oʊə");
  });

  test("a single-onset -ire root retains the careful rhotic nucleus", () => {
    for (const word of ["fire", "fires", "hire", "hired", "tire", "tired", "wire", "wired"])
      expect(g2p.predict(word)).toContain("aɪɝ");
    expect(g2p.predict("vampire")).toContain("aɪɹ");
    expect(g2p.predict("spire")).toContain("aɪɹ");
  });

  test("suffix reduction leaves complete stressed roots intact", () => {
    for (const word of ["less", "est", "fence", "dense", "hence", "tense", "expense", "dispense", "pretense"])
      expect(g2p.predict(word)).toContain("ɛ");
    for (const word of ["prince", "since", "mince", "rinse", "quince"])
      expect(g2p.predict(word)).toContain("ɪns");
    expect(g2p.predict("reference")).toContain("əns");
    expect(g2p.predict("careless")).toMatch(/[lɫ]əs$/);
    expect(g2p.predict("greatest")).toContain("əst");
  });

  test("th-/wh- SQUARE rimes leave other onsets alone", () => {
    for (const word of ["there", "where"])
      expect(g2p.predict(word)).toContain("ɛɹ");
    expect(g2p.predict("here")).toContain("ɪɹ");
    expect(g2p.predict("were")).not.toContain("ɛɹ");
  });

  test("verified inflected compounds beat invented silent-e stems", () => {
    expect(g2p.predict("caregiving")).toMatch(/kɛɹ.*ɡɪvɪŋ$/);
    expect(g2p.predict("lifesaving")).toContain("ɫaɪf");
    expect(g2p.predict("probed")).toMatch(/pɹoʊbd$/);
    expect(g2p.predict("proposed")).toMatch(/pɹəˈpoʊzd$/);
    expect(g2p.predict("downgrading")).toMatch(/ˈɡɹeɪdɪŋ$/);
    expect(g2p.predict("unfenced")).toMatch(/ˈfɛnst$/);
    for (const word of ["seething", "soothing", "teething", "farthing"])
      expect(g2p.predict(word)).toContain("ðɪŋ");
  });
});

test("public API retains root behavior and both invite readings", () => {
  expect(toIPA("get")).toMatch(/^ˈ?ɡɛt$/);
  expect(toIPA("shoe")).toContain("ʃu");
  expect(toIPA("newcomer")).toContain("kəmɝ");
  expect(toIPA("polled")).toContain("poʊ");
  expect(toIPA("pony")).toContain("oʊ");
  expect(toIPA("transsexual")).toMatch(/n[ˈˌ]?s/);
  const g2p = new EnglishG2P();
  expect(g2p.predict("invite", "en", "N")).toMatch(/^ˈɪn/);
  expect(g2p.predict("invite", "en", "V")).toMatch(/ˈvaɪt$/);
  expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
});
