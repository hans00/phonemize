import EnG2P from "../src/en/g2p";

// Rule-path regressions for the vowel classes fixed in the 2026-09
// heuristic-learning pass. Every case is a rule, not a word: the word
// named is the class exemplar. Measured on the full dict before adoption.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("open-syllable long u depends on the onset", () => {
  it.each([
    ["use", "ˈjus"],
    ["cute", "ˈkjut"],
    ["few", "ˈfju"],
    ["human", "ˈhjumən"],
    ["huge", "ˈhjudʒ"],
    ["student", "ˈstudənt"],
    ["tune", "ˈtun"],
    ["new", "ˈnu"],
    ["rule", "ˈɹuɫ"],
    ["curious", "ˈkjʊɹiəs"],
    ["value", "ˈvæɫju"],
    ["continue", "kənˈtɪnju"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps a closed-syllable u short, also before s+C and bl onsets", () => {
    expect(rules("custom")).toBe("ˈkʌstəm");
    expect(rules("public")).toBe("ˈpʌbɫɪk");
    expect(rules("cut")).toBe("ˈkʌt");
  });
});

describe("y as a nucleus after a consonant", () => {
  it.each([
    ["system", "ˈsɪstəm"],
    ["cycle", "ˈsaɪkəɫ"],
    ["type", "ˈtaɪp"],
    ["buy", "ˈbaɪ"],
    ["guy", "ˈɡaɪ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("two-syllable words with an inflection-shaped second syllable take the tense vowel", () => {
  it.each([
    ["paper", "ˈpeɪpɝ"],
    ["taken", "ˈteɪkən"],
    ["agent", "ˈeɪdʒənt"],
    ["tiger", "ˈtaɪɡɝ"],
    ["final", "ˈfaɪnəɫ"],
    ["total", "ˈtoʊtəɫ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves other endings, v-stems and prefixed a- lax", () => {
    expect(rules("magic")).toBe("ˈmædʒɪk");
    expect(rules("river")).toBe("ˈɹɪvɝ");
    expect(rules("about")).not.toMatch(/^ˈeɪ/);
  });
});

describe("rime and cluster rules", () => {
  it.each([
    ["be", "ˈbi"],
    ["me", "ˈmi"],
    ["we", "ˈwi"],
    ["learn", "ˈɫɝn"],
    ["search", "ˈsɝtʃ"],
    ["natural", "ˈnætʃɝəɫ"],
    ["guess", "ˈɡɛs"],
    ["guild", "ˈɡɪɫd"],
    ["guile", "ˈɡaɪɫ"],
    ["league", "ˈɫiɡ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("derived forms read their base by rule when it is not lexical", () => {
  it.each([
    ["finally", "ˈfaɪnəɫi"],
    ["totally", "ˈtoʊtəɫi"],
    ["driving", "ˈdɹaɪvɪŋ"],
    ["providing", "pɹəˈvaɪdɪŋ"],
    ["buying", "ˈbaɪɪŋ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("plural readings", () => {
  it("does not read this/his/has as plurals of a lexical stem", () => {
    expect(rules("this")).toBe("ˈðɪs");
    expect(rules("gas")).toBe("ˈɡæs");
  });
  it("reads -ses after a one-syllable stem as magic-e + s", () => {
    expect(rules("uses")).toMatch(/^ˈjus/);
    expect(rules("cases")).toMatch(/^ˈkeɪs/);
  });
});

describe("nasal assimilation stops at a prefix boundary", () => {
  it.each([
    ["include", "ɪnˈkɫud"],
    ["unclear", "ənˈkɫɪɹ"],
    ["conclude", "kənˈkɫud"],
    ["encase", "ˈɛnkeɪs"],
    ["encrypt", "ˈɛnkɹɪpt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("still assimilates word-internally", () => {
    expect(rules("think")).toBe("ˈθɪŋk");
  });
});

describe("word-initial <ex> before a vowel is /ɡz/", () => {
  it.each([
    ["example", "ɪˈɡzæmpəɫ"],
    ["exotic", "ɪˈɡzɑtɪk"],
    ["exemption", "ɪˈɡzɛmpʃən"],
    ["exude", "ɪˈɡzud"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("clusters that drop or devoice a segment", () => {
  it.each([
    ["castle", "ˈkæsəɫ"],
    ["wrestle", "ˈɹɛsəɫ"],
    ["bristle", "ˈbɹɪsəɫ"],
    ["bakowski", "bəˈkɔfski"],
    ["bobrowski", "bəˈbɹɔfski"],
    ["bacchi", "ˈbæki"],
    ["macchi", "ˈmæki"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("a front-vowel suffix keeps the base's final c/g soft", () => {
  it.each([
    ["criticize", "ˈkɹɪtɪˌsaɪz"],
    ["classicism", "ˈkɫæsɪˌsɪzəm"],
    ["specify", "ˈspɛsəˌfaɪ"],
    ["energize", "ˈɛnɝˌdʒaɪz"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves a doubled gg hard", () => {
    expect(rules("druggist")).toMatch(/ɡ[ɪə]st$/);
  });
});

describe("<wh> keeps its /hw/ onset word-initially", () => {
  it.each([
    ["which", "ˈhwɪtʃ"],
    ["white", "ˈhwaɪt"],
    ["whale", "ˈhweɪɫ"],
    ["wheel", "ˈhwiɫ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("resyllabifies to /w/ inside a compound", () => {
    expect(rules("cartwheel")).toBe("ˈkɑɹtwiɫ");
  });
});

describe("open e is tense in the magic-e frame and before -tion/-sion", () => {
  it.each([
    ["cede", "ˈsid"],
    ["scene", "ˈsin"],
    ["gene", "ˈdʒin"],
    ["compete", "kəmˈpit"],
    ["delete", "dɪˈɫit"],
    ["completion", "kəmˈpɫiʃən"],
    ["deletion", "dɪˈɫiʃən"],
    ["lesion", "ˈɫiʒən"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps e lax when the magic-e syllable is unstressed or non-final", () => {
    expect(rules("college")).toBe("ˈkɑɫɪdʒ");
    expect(rules("generous")).toBe("ˈdʒɛnɝəs");
    expect(rules("section")).toBe("ˈsɛkʃən");
  });
});

describe("stressed open e before consonant + i + vowel is tense", () => {
  it.each([
    ["medium", "ˈmidiəm"],
    ["premium", "ˈpɹimiəm"],
    ["tedious", "ˈtidiəs"],
    ["comedian", "kəˈmidiən"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps e lax before a lax cluster", () => {
    expect(rules("congestion")).toBe("kənˈdʒɛstʃən");
  });
});

describe("the unstressed re-/pre- prefix is /i/", () => {
  it.each([
    ["release", "ɹiˈɫis"],
    ["report", "ɹiˈpɔɹt"],
    ["prevent", "pɹiˈvɛnt"],
    ["precast", "pɹiˈkæst"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves the de-/be- prefixes reduced", () => {
    expect(rules("debate")).toMatch(/^d[ɪə]ˈbeɪt$/);
    expect(rules("begin")).toBe("bɪˈɡɪn");
  });
});

describe("final -ger keeps the hard g after a tense vowel", () => {
  it.each([
    ["eager", "ˈiɡɝ"],
    ["meager", "ˈmiɡɝ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});
// assignStress: the 2-syllable prefix rule used to send every ab/ad/con/in
// word to final stress. The dict majority for words whose first syllable is
// exactly the prefix is initial stress for those four.
describe("two-syllable prefixes with an initial-stress dict majority", () => {
  it.each([
    ["concept", "ˈkɑnsɛpt"],
    ["concert", "ˈkɑnsɝt"],
    ["conduct", "ˈkɑndəkt"],
    ["conflict", "ˈkɑnfɫɪkt"],
    ["context", "ˈkɑntɛkst"],
    ["convert", "ˈkɑnvɝt"],
    ["constant", "ˈkɑnstənt"],
    ["instant", "ˈɪnstənt"],
    ["industry", "ˈɪndəstɹi"],
    ["admin", "ˈædmɪn"],
    ["advert", "ˈædvɝt"],
    ["absent", "ˈæbsənt"],
    ["abject", "ˈæbdʒɛkt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("prefixes whose dict majority is final stress keep it", () => {
  it.each([
    ["begin", "bɪˈɡɪn"],
    ["believe", "bɪˈɫiv"],
    ["depend", "dɪˈpɛnd"],
    ["express", "ɪksˈpɹɛs"],
    ["promote", "pɹəˈmoʊt"],
    ["propose", "pɹəˈpoʊz"],
    ["compare", "kəmˈpɛɹ"],
    ["obtain", "əbˈteɪn"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("a root after a stress-bearing prefix keeps its vowel", () => {
  it("does not reduce an obstruent-coda root", () => {
    expect(rules("index")).toBe("ˈɪndɛks");
    expect(rules("contest")).toBe("ˈkɑntɛst");
  });
  it("still reduces a sonorant or open coda", () => {
    expect(rules("instant")).toBe("ˈɪnstənt");
    expect(rules("constant")).toBe("ˈkɑnstənt");
  });
});

describe("s after an unstressed re-/pre- prefix is voiced", () => {
  it.each([
    ["presume", /^pɹ[iɪ]ˈzum$/],
    ["resistor", /^ɹ[iɪ]ˈzɪstɝ$/],
    ["reservist", /^ɹ[iɪ]ˈzɝvɪst$/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));
});

describe("th voicing follows the Greek/Latin vs native split", () => {
  it.each([
    ["author", "ˈɔθɝ"],
    ["method", "ˈmɛθəd"],
    ["agatha", "ˈæɡəθə"],
    ["anthony", "ˈænθəni"],
    ["marathon", "ˈmæɹəθən"],
    ["panther", "ˈpænθɝ"],
    ["synthetic", "sɪnˈθɛtɪk"],
    ["strengthen", "ˈstɹɛŋθən"],
    ["thalamus", "ˈθæɫəməs"],
    ["thacker", "ˈθækɝ"],
    ["whether", "ˈwɛðɝ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps th+e voiced in native words and in monosyllabic function words", () => {
    for (const w of ["mother", "father", "weather", "another"])
      expect(rules(w)).toContain("ð");
    for (const w of ["this", "that", "than", "those"])
      expect(rules(w)).toContain("ð");
  });
});

describe("s voices in the contexts where the dict majority does", () => {
  it.each([
    ["user", "ˈjuzɝ"],
    ["composer", "kəmˈpoʊzɝ"],
    ["cause", "ˈkɔz"],
    ["clause", "ˈkɫɔz"],
    ["because", "bɪˈkɔz"],
    ["pause", "ˈpɔz"],
    ["easy", "ˈizi"],
    ["daisy", "ˈdeɪzi"],
    ["drowsy", "ˈdɹaʊzi"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps /s/ where the context does not voice", () => {
    expect(rules("house")).toBe("ˈhaʊs");
    expect(rules("fantasy")).toBe("ˈfæntəsi");
    expect(rules("basing")).toBe("ˈbeɪsɪŋ");
  });
});
