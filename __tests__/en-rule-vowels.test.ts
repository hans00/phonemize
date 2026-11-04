import EnG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

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

describe("word-final suffix vowels", () => {
  it.each([
    ["distance", "ˈdɪstəns"],
    ["balance", "ˈbæɫəns"],
    ["absence", "ˈæbsəns"],
    ["sentence", "ˈsɛntəns"],
    ["persian", "ˈpɝʒən"],
    ["malaysian", "məˈɫeɪʒən"],
    ["martian", "ˈmɑɹʃən"],
    ["haitian", "ˈheɪʃən"],
    ["pension", "ˈpɛnʃən"],
    ["dimension", "dɪˈmɛnʃən"],
    ["audience", "ˈɔdiəns"],
    ["ambient", "ˈæmbiənt"],
    ["nutrient", "ˈnutɹiənt"],
    ["influence", "ˈɪnfɫuəns"],
    ["fluent", "ˈfɫuənt"],
    ["factory", "ˈfæktɝi"],
    ["trajectory", "tɹəˈdʒɛktɝi"],
    ["happiest", "ˈhæpiəst"],
    ["measure", "ˈmɛʒɝ"],
    ["pleasure", "ˈpɫɛʒɝ"],
    ["figure", "ˈfɪɡjɝ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves the non-suffix look-alikes alone", () => {
    expect(rules("priest")).toBe("ˈpɹist");
    expect(rules("nature")).toMatch(/tʃɝ$/);
    expect(rules("secure")).toMatch(/jʊɹ$/);
  });
});

describe("the final vowel in native -cket words", () => {
  it.each([
    ["packet", "ˈpækɪt"],
    ["jacket", "ˈdʒækɪt"],
    ["pocket", "ˈpɑkɪt"],
    ["ticket", "ˈtɪkɪt"],
    ["socket", "ˈsɑkɪt"],
    ["cricket", "ˈkɹɪkɪt"],
    ["rocket", "ˈɹɑkɪt"],
    ["bracket", "ˈbɹækɪt"],
    ["bucket", "ˈbʌkɪt"],
    ["becket", "ˈbɛkɪt"],
    ["docket", "ˈdɑkɪt"],
    ["picket", "ˈpɪkɪt"],
    ["racket", "ˈɹækɪt"],
    ["locket", "ˈɫɑkɪt"],
    ["thicket", "ˈθɪkɪt"],
    ["wicket", "ˈwɪkɪt"],
    ["sprocket", "ˈspɹɑkɪt"],
    ["jackets", "ˈdʒækɪts"],
    ["packets", "ˈpækɪts"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps similar -ket words with schwa", () => {
    expect(rules("basket")).toBe("ˈbæskət");
    expect(rules("market")).toBe("ˈmɑɹkət");
    expect(rules("blanket")).toBe("ˈbɫæŋkət");
  });
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
    ["encase", "ɛnˈkeɪs"],
    ["encrypt", "ˈɛnkɹɪpt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("still assimilates word-internally", () => {
    expect(rules("think")).toBe("ˈθɪŋk");
  });
});

describe("word-initial <ex> before a vowel is /ɡz/", () => {
  it.each([
    ["example", "ɪɡˈzæmpəɫ"],
    ["exotic", "ɪɡˈzɑtɪk"],
    ["exemption", "ɪɡˈzɛmpʃən"],
    ["exude", "ɪɡˈzud"],
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

describe("Latinate re-/de- before weak -cent", () => {
  it.each([
    ["recent", "ˈɹisənt"],
    ["decent", "ˈdisənt"],
    ["recently", "ˈɹisəntɫi"],
    ["recentness", "ˈɹisəntnəs"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps strong-root -cent controls out of the weak suffix frame", () => {
    expect(rules("accent")).toBe("ˈæksənt");
    expect(rules("percent")).toBe("pɝˈsɛnt");
    expect(rules("percentage")).toBe("pɝˈsɛntɪdʒ");
    expect(rules("percentile")).toBe("pɝˈsɛntɪɫ");
    expect(rules("cent")).toBe("ˈsɛnt");
    expect(rules("vincent")).toBe("ˈvɪnsənt");
  });

  it("keeps the compositional unit reading in sentence context", () => {
    const api = createPhonemizer({ processors: [new EnG2P({ disableDict: true })] });
    const tokens = api.phonemize(
      "Costs fell by ten percent. The recent report mentioned a decent rate and a clear accent.",
      { language: "en-US", returnArray: true },
    );
    const readings = tokens.filter(token => ["percent", "recent", "decent", "accent"].includes(token.word.toLowerCase()));
    expect(readings.map(token => [token.word.toLowerCase(), token.phoneme])).toEqual([
      ["percent", "pɝˈsɛnt"],
      ["recent", "ˈɹisənt"],
      ["decent", "ˈdisənt"],
      ["accent", "ˈæksənt"],
    ]);
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
    ["anthony", "ˈænθəni"],
    ["marathon", "ˈmæɹəθən"],
    ["panther", "ˈpænθɝ"],
    ["synthetic", "sɪnˈθɛtɪk"],
    ["strengthen", "ˈstɹɛŋθən"],
    ["thalamus", "ˈθæɫəməs"],
    ["thacker", "ˈθækɝ"],
    ["whether", "ˈhwɛðɝ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  // Its stress is lexical (-Vtha is 76% penult in the dict); the th is not.
  it("keeps th voiceless in agatha", () => expect(rules("agatha")).toMatch(/θə$/));

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

// Stressed photo retains /oʊ/; its contrasting family is covered in
// en-derived-vowel-boundaries.test.ts (Cambridge photograph pronunciation).
describe("trisyllabic laxing of a stressed open o/y", () => {
  it.each([
    ["poverty", "ˈpɑvɝti"],
    ["comedy", "ˈkɑmədi"],
    ["democracy", "dɪˈmɑkɹəsi"],
    ["holiday", "ˈhɑɫɪdeɪ"],
    ["monitor", "ˈmɑnɪtɝ"],
    ["tolerant", "ˈtɑɫɝənt"],
    ["pyramid", "ˈpɪɹəmɪd"],
    ["synergy", "ˈsɪnɝdʒi"],
    ["typical", "ˈtɪpɪkəɫ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it.each([
    ["topic", "ˈtɑpɪk"],
    ["sardonic", "sɑɹˈdɑnɪk"],
    ["cynic", "ˈsɪnɪk"],
  ])("stress-attracting -ic laxes the stem vowel: %s → %s", (word, ipa) =>
    expect(rules(word)).toBe(ipa));

  it.each([
    ["motion", "ˈmoʊʃən"],
    ["hero", "ˈhiɹoʊ"],
    ["donate", "ˈdoʊneɪt"],
    ["notary", "ˈnoʊtɝi"],
    ["overrun", "ˈoʊvɝɹən"],
    ["lozano", "ɫoʊˈzɑnoʊ"],
    ["molano", "moʊˈɫɑnoʊ"],
    ["historic", "hɪˈstɔɹɪk"],
    ["hydrogen", "ˈhaɪdɹədʒən"],
    ["cyclone", "ˈsaɪkɫoʊn"],
  ])("keeps the tense vowel: %s → %s", (word, ipa) =>
    expect(rules(word)).toBe(ipa));
});

// Open <o> before final -ther(s) is STRUT (other, mother, brother) —
// 16 ʌ : 2 ɑ in the dict (2026-09-26).
describe("-other spells STRUT", () => {
  it.each(["other", "mother", "brother"])("%s", (w) =>
    expect(new EnG2P({ disableDict: true }).predict(w, "en")).toMatch(/ʌðɝ$/));
});

// Word-initial gu + a: guar- has a silent u, other gua- is /ɡw/
// (2026-09-26, 32 : 2 and 31 : 6 in the dict).
describe("word-initial gua-", () => {
  const g = new EnG2P({ disableDict: true });
  it("guard has a silent u", () => expect(g.predict("guard", "en")).toBe("ˈɡɑɹd"));
  it("guam is /ɡw/", () => expect(g.predict("guam", "en")).toMatch(/^ˈɡw/));
});

// Indefinite pronouns/adverbs are determiner + free noun (2026-09-26).
describe("indefinite compounds", () => {
  const g = new EnG2P({ disableDict: true });
  it.each([
    ["anything", /^ˈɛniˌθɪŋ$/],
    ["nothing", /^ˈnʌθɪŋ$/],
    ["someone", /^ˈsʌmˌwʌn$/],
    ["somewhere", /ˌwɛɹ$/],
    ["nohow", /^ˈnoʊˌhaʊ$/],
    ["noone", /^ˈnoʊˌwʌn$/],
  ])("%s", (w, re) => expect(g.predict(w, "en")).toMatch(re));

  it("composes weak an with the stressed free word other", () => {
    expect(g.predict("another", "en")).toBe("əˈnʌðɝ");
  });

  it("keeps the composition in sentence tokenization and preserves other", () => {
    const api = createPhonemizer({ processors: [g] });
    const tokens = (sentence: string) => api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens("Another person arrived.").find(({ word }) => word.toLowerCase() === "another")?.phoneme).toBe("əˈnʌðɝ");
    expect(tokens("The other person arrived.").find(({ word }) => word.toLowerCase() === "other")?.phoneme).toBe("ˈʌðɝ");
  });

  it("carries the lexicalized nothing reading into regular derivatives", () => {
    expect(g.predict("nothingness", "en")).toBe("ˈnʌθɪŋnəs");
    expect(g.predict("nothings", "en")).toBe("ˈnʌθɪŋz");
    expect(g.predict("nohow", "en")).toBe("ˈnoʊˌhaʊ");
    expect(g.predict("noone", "en")).toBe("ˈnoʊˌwʌn");
  });
});

// a + w + a/o: the w is the next onset, not part of an aw digraph
// (2026-09-26, 181 : 5 in the dict).
describe("a·w·a splits before the w", () => {
  it("away", () => expect(new EnG2P({ disableDict: true }).predict("away", "en")).toBe("əˈweɪ"));
});

// STRUT spelt ou (double, country, young) and NURSE before th (earth)
// (2026-09-26).
describe("ou as STRUT, ear before th", () => {
  const g = new EnG2P({ disableDict: true });
  it.each([
    ["double", /^ˈdʌb/],
    ["country", /^ˈkʌn/],
    ["young", /^ˈjʌŋ$/],
    ["earth", /^ˈɝθ$/],
    ["lounge", /aʊ/],
  ])("%s", (w, re) => expect(g.predict(w, "en")).toMatch(re));
});

// STRUT spelt o: l/b + final -ve, -vern, -nth (2026-09-26).
describe("o as STRUT before -ve/-vern/-nth", () => {
  const g = new EnG2P({ disableDict: true });
  it.each([
    ["love", /^ˈɫʌv$/],
    ["above", /ˈbʌv$/],
    ["govern", /^ˈɡʌv/],
    ["month", /^ˈmʌnθ$/],
  ])("%s", (w, re) => expect(g.predict(w, "en")).toMatch(re));
});

describe("a bare -ic syllable", () => {
  // The suffix table's ipa is used literally; an "ɪk$1" entry once shipped
  // the text "$1" for these.
  it.each(["ickes", "lewicki"])("%s has no substitution residue", (w) =>
    expect(rules(w)).not.toContain("$"));
});

describe("word-final written <i> takes FLEECE in the rules path", () => {
  const engine = new EnG2P({ disableDict: true });
  it.each([
    ["ski", "ˈski"],
    ["Mississippi", "ˌmɪsɪsɪˈpi"],
    ["taxi", "ˈtæksi"],
    ["mini", "ˈmɪni"],
  ])("%s → %s", (word, ipa) => expect(engine.predict(word, "en-US")).toBe(ipa));

  it("preserves the final-i class and neighboring controls in a sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("A ski instructor from Mississippi took a taxi.", {
      language: "en-US", returnArray: true,
    });
    // Attributive ski is stressless in this noun compound; the vowel stays
    // FLEECE while the sentence-level stress controller owns the stress mark.
    expect(tokens.find(token => token.word === "ski")?.phoneme).toBe("ski");
    expect(tokens.find(token => token.word === "Mississippi")?.phoneme).toBe("ˌmɪsɪsɪˈpi");
    expect(tokens.find(token => token.word === "taxi")?.phoneme).toBe("ˈtæksi");
    expect(tokens.find(token => token.word === "instructor")?.phoneme).toBe(engine.predict("instructor", "en-US"));
  });
});
