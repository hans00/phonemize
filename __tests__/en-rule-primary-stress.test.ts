import EnG2P from "../src/en/g2p";

// Rule-path regressions for primary-stress placement (`assignStress` in
// src/en/syllabify.ts) and for the reduction frame in `syllableToIPA` that
// depends on it. Every case is a class exemplar, not a word; the frames and
// their dict ratios live next to the rules themselves.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("com- keeps the primary over a lax root", () => {
  // 82% of the 34 lax, non-silent-e com- words in the dict are initial-
  // stressed (5 of the 6 that are in the top-5000 list).
  it.each([
    ["combat", "ˈkɑmbæt"],
    ["compact", "ˈkɑmpækt"],
    ["complex", "ˈkɑmpɫɛks"],
    ["compress", "ˈkɑmpɹɛs"],
    ["compost", "ˈkɑmpoʊst"],
    ["comsat", "ˈkɑmsæt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("com- gives the primary away over a tense root", () => {
  // A vowel digraph or a silent-e in the root marks it as the stress
  // bearer, which is the unconditional behaviour of the other prefixes.
  it.each([
    ["compose", "kəmˈpoʊz"],
    ["compute", "kəmˈpjut"],
    ["compare", "kəmˈpɛɹ"],
    ["complete", "kəmˈpɫit"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("a root after im- keeps its full vowel before a pure obstruent coda", () => {
  it.each([
    ["impact", "ˈɪmpækt"],
    ["impress", "ˈɪmpɹɛs"],
    ["improv", "ˈɪmpɹɑv"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("a final vowel before /ŋ/ does not reduce (English has no /əŋ/)", () => {
  it.each([
    ["adlong", /ɔŋ$/],
    ["hongkong", /ɔŋ$/],
    ["diphthong", /ɔŋ$/],
    ["eubank", /æŋk$/],
    ["burbank", /æŋk$/],
    ["agribank", /æŋk$/],
  ])("%s keeps its full vowel", (word, rime) => {
    const out = rules(word) ?? "";
    expect(out).toMatch(rime);
    expect(out).not.toMatch(/ə[ŋ]/);
  });
});

describe("a word-attaching prefix on a long stem leaves the stress in the stem", () => {
  // un-/dis-/mis-/ab- attach to a whole word, so once the stem carries its
  // own stress the primary sits deeper than the root-initial syllable.
  it("disagreeable → ˌdɪsəˈɡɹiəbəɫ", () => {
    expect(rules("disagreeable")).toBe("ˌdɪsəˈɡɹiəbəɫ");
  });
  it.each([
    ["unemployment", /ˈpɫɔɪmənt$/],
    ["unconstitutional", /ˈtuʃənəɫ$/],
    ["misunderstanding", /ˈstændɪŋ$/],
  ])("%s puts the primary in the stem", (word, tail) => {
    expect(rules(word)).toMatch(tail);
  });
});

describe("-ance/-ence: a four-slot stem is split by its second slot", () => {
  // Closed second slot = a stressed stem (acceptance, assistance); open =
  // a Latin bound root that leaves the primary at the front. The -er verbs
  // retract too, because the undoubled consonant is the spelling's own
  // stress mark (occurrence keeps it, reference does not).
  it.each([
    ["difference", "ˈdɪfɝəns"],
    ["deference", "ˈdɛfɝəns"],
    ["residence", "ˈɹɛzɪdəns"],
    ["maintenance", "ˈmeɪntənəns"],
    ["consequence", "ˈkɑnsəkwəns"],
    ["reference", "ˈɹɛfɝəns"],
    ["conference", "ˈkɑnfɝəns"],
    ["preference", "ˈpɹɛfɝəns"],
    ["acceptance", "ækˈsɛptəns"],
    ["assistance", "əˈsɪstəns"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("a near-categorical word-final gram beats the heaviness fallback", () => {
  // FINAL_GRAM_STRESS: the primary's distance from the last slot. Each gram
  // has >=20 dict words, >=75% agreement, and >=3 agreeing top-5000 words.
  it.each([
    ["yesterday", "ˈjɛstɝdeɪ"],
    ["anderson", "ˈændɝsən"],
    ["jefferson", "ˈdʒɛfɝsən"],
    ["albertson", "ˈæɫbɝtsən"],
    ["ericsson", "ˈɛɹɪksən"],
    ["christina", "kɹɪˈstinə"],
    ["armenian", "ɑɹˈminiən"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("the prefix loop still owns three-syllable words", () => {
  // At three syllables "stress the root" beats the penult fallback for every
  // prefix in the list (1491/2394 vs 1217/2394 over the dict).
  it.each([
    ["remember", "ɹiˈmɛmbɝ"],
    ["deliver", "dɪˈɫɪvɝ"],
    ["consider", "kənˈsɪdɝ"],
    ["prevention", "pɹiˈvɛnʃən"],
    ["proposal", "pɹəˈpoʊzəɫ"],
    ["professor", "pɹəˈfɛsɝ"],
    ["submitted", "səbˈmɪtɪd"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});
