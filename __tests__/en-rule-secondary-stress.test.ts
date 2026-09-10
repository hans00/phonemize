import EnG2P from "../src/en/g2p";

// Rule-path regressions for alternating (rhythmic) secondary stress:
// the beat two syllables from the primary keeps its full vowel instead
// of being flattened by the reduction pass. Every case is a class
// exemplar, not a word; the frames and their dict ratios live on
// `secondaryStressIndices` in src/en/syllabify.ts. Each expectation
// below is the dictionary's own pronunciation.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("pretonic beat two syllables before the primary keeps its vowel", () => {
  it.each([
    ["application", "ˌæpɫəˈkeɪʃən"],
    ["competition", "ˌkɑmpəˈtɪʃən"],
    ["combination", "ˌkɑmbəˈneɪʃən"],
    ["conservation", "ˌkɑnsɝˈveɪʃən"],
    ["academic", "ˌækəˈdɛmɪk"],
    ["economic", "ˌɛkəˈnɑmɪk"],
    ["expedition", "ˌɛkspəˈdɪʃən"],
    ["acrobatic", "ˌækɹəˈbætɪk"],
    ["alcoholic", "ˌæɫkəˈhɑɫɪk"],
    ["abolition", "ˌæbəˈɫɪʃən"],
    ["allegation", "ˌæɫəˈɡeɪʃən"],
    ["alphabetic", "ˌæɫfəˈbɛtɪk"],
    ["anaconda", "ˌænəˈkɑndə"],
  ])("%s → %s", (word, ipa) => {
    expect(rules(word)).toBe(ipa);
  });
});

describe("a medial linking vowel is not a beat", () => {
  it.each([
    ["fortification", "ˌfɔɹtəfəˈkeɪʃən"],
    ["organization", "ˌɔɹɡənəˈzeɪʃən"],
  ])("%s → %s", (word, ipa) => {
    expect(rules(word)).toBe(ipa);
  });
});

describe("post-tonic beat keeps its vowel only before an obstruent coda", () => {
  it.each([
    ["argonaut", "ˈɑɹɡəˌnɔt"],
    ["arthropod", "ˈɑɹθɹəˌpɑd"],
    ["alcatraz", "ˈæɫkəˌtɹæz"],
    ["armistead", "ˈɑɹmɪˌstɛd"],
    ["adaptaplex", "əˈdæptəˌpɫɛks"],
  ])("%s → %s", (word, ipa) => {
    expect(rules(word)).toBe(ipa);
  });

  // The inflectional -es syllable is not a beat.
  it.each([
    ["campuses", "ˈkæmpəsəz"],
    ["circuses", "ˈsɝkəsəz"],
  ])("%s → %s", (word, ipa) => {
    expect(rules(word)).toBe(ipa);
  });
});

// A secondary-stressed STRUT is written /ə/ in this lexicon, so the
// un- prefix stays reduced even when it lands on a beat. Asserted on
// the vowel, not the whole string: the ˌ mark on an initial schwa is a
// separate open question (dict ˌənɪmˈpɫɔɪmənt).
it("un- prefix beat stays schwa", () => {
  expect(rules("unemployment")).toMatch(/^ˌ?ənɪmˈpɫɔɪmənt$/);
});
