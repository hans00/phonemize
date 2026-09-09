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

describe("trisyllabic laxing of a stressed open o/y", () => {
  it.each([
    ["poverty", "ˈpɑvɝti"],
    ["comedy", "ˈkɑmədi"],
    ["democracy", "dɪˈmɑkɹəsi"],
    ["holiday", "ˈhɑɫɪdeɪ"],
    ["monitor", "ˈmɑnɪtɝ"],
    ["tolerant", "ˈtɑɫɝənt"],
    ["photograph", "ˈfɑtəɡɹəf"],
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
    ["lozano", "ˈɫoʊzɑnoʊ"],
    ["molano", "ˈmoʊɫɑnoʊ"],
    ["historic", "hɪˈstɔɹɪk"],
    ["hydrogen", "ˈhaɪdɹədʒən"],
    ["cyclone", "ˈsaɪkɫoʊn"],
  ])("keeps the tense vowel: %s → %s", (word, ipa) =>
    expect(rules(word)).toBe(ipa));
});
