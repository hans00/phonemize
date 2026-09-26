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
  it.each([
    ["disassemble", "ˌdɪsəˈsɛmbəɫ"],
    ["disincentive", "ˌdɪsɪnˈsɛntɪv"],
    ["misbegotten", "ˌmɪsbəˈɡɑtən"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  it.each([
    ["disbelieve", /ˌdɪsbəˈɫiv$/],
    ["misconceive", /ˌmɪskənˈsiv$/],
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
    ["deliver", "dɪˈɫɪvɝ"],
    ["consider", "kənˈsɪdɝ"],
    ["component", "kəmˈpoʊnənt"],
    ["competitive", "kəmˈpɛtətɪv"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

// -ation built from an -ate verb or a bare stem takes the primary on its
// /eɪ/; the stem's primary demotes to secondary (2026-09-26).
describe("-ation carries the primary on its own /eɪ/", () => {
  it.each([
    ["abdication", "ˈkeɪʃən"],
    ["activation", "ˈveɪʃən"],
    ["accommodation", "ˈdeɪʃən"],
    ["adaptation", "ˈteɪʃən"],
  ])("%s ends in %s", (word, tail) => expect(rules(word)).toMatch(new RegExp(`${tail}$`)));
});

// -ity and -ial (3+ slots) pull the primary onto the syllable right before
// them; -ial words skip the stress-neutral -al morphology (2026-09-26).
describe("-ity and -ial stress the syllable before them", () => {
  it.each([
    ["activity", /^ækˈtɪ/],
    ["abnormality", /ˈmæ/],
    ["accessibility", /ˈbɪ/],
    ["editorial", /ˈtɔɹ/],
    ["adversarial", /ɝˈs/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));

  it("keeps a one-syllable -ial stem on its own <i>", () => {
    expect(rules("trial")).toMatch(/^ˈtɹaɪ/);
  });
});

// -ental/-ential and the Greek -graphy/-nomy/-sophy/-cracy family stress
// the syllable right before the ending (2026-09-26).
describe("-ental, -ential and Greek -Cy endings stress the syllable before them", () => {
  it.each([
    ["accidental", /ˈdɛn/],
    ["confidential", /ˈdɛn/],
    ["photography", /ˈtɑ/],
    ["philosophy", /ˈɫɑ/],
    ["democracy", /ˈmɑ/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));
});

// -ate puts the primary two syllables before its /eɪt/ (2026-09-26).
describe("-ate stresses two syllables before itself", () => {
  it.each([
    ["abdicate", /^ˈæb/],
    ["accelerate", /ˈsɛɫ/],
    ["anticipate", /ˈtɪ/],
    ["appreciate", /ˈpɹ/],
    ["demonstrate", /^ˈdɛ/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));

  it("leaves two-syllable -ate words alone", () => {
    expect(rules("debate")).toMatch(/ˈbeɪt$/);
  });

  // The mark is placed on the post-lexical string: degemination before it
  // (ac·com·mo·da·tion) must not shift it into the stressed vowel.
  it("keeps the mark on the onset after a post-lexical edit", () => {
    expect(rules("accommodation")).toMatch(/ˈdeɪʃən$/);
  });
});

// Italian name endings take the penult with its Italian vowel, and the
// other e/o/u stay full (2026-09-26).
describe("Italian name endings", () => {
  it.each([
    ["barbano", /ˈbɑnoʊ$/],
    ["casino", /ˈsinoʊ$/],
    ["lozano", /^ɫoʊˈ/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));

  it("leaves a two-syllable English -ini alone", () => {
    expect(rules("mini")).toMatch(/ɪ/);
  });
});

// -ia stresses the syllable before it and tenses an open a/e/o there;
// -ator stresses like -ate and keeps its /eɪ/ (2026-09-26).
describe("-ia and -ator", () => {
  it.each([
    ["albania", /ˈbeɪniə$/],
    ["media", /^ˈmidiə$/],
    ["mongolia", /ˈɡoʊɫiə$/],
    ["generator", /^ˈdʒɛn.*eɪtɝ$/],
    ["administrator", /ˈmɪn.*eɪtɝ$/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));
});

// Germanic compound surname elements keep initial stress; -ington is not
// one of them (2026-09-26).
describe("Germanic surname endings", () => {
  it.each([
    ["aldinger", /^ˈæɫ/],
    ["bamberger", /^ˈbæm/],
    ["oppenheimer", /^ˈɑp/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));
});

// Greek agent nouns keep the stress of their -y noun; German -auer is /aʊɝ/
// (2026-09-26).
describe("Greek agent nouns and -auer", () => {
  it.each([
    ["biologist", /ˈɑɫədʒɪst$/],
    ["photographer", /ˈtɑɡɹəfɝ$/],
    ["economist", /ˈkɑnəmɪst$/],
    ["neubauer", /baʊɝ$/],
  ])("%s", (word, re) => expect(rules(word)).toMatch(re));
});
