import EnG2P from "../src/en/g2p";

// Rule-path regressions for unstressed-vowel quality (/ɪ/ vs /ə/), the
// 2026-09-10 heuristic-learning pass. Each case names a frame, not a word:
// the frame was counted over the whole dictionary and then measured as a
// win/loss list on the rules-only path before adoption.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("unstressed <i> before an obstruent + liquid reduces", () => {
  it.each([
    ["compatible", "kəmˈpætəbəɫ"],
    ["collectible", "kəˈɫɛktəbəɫ"],
    ["credible", "ˈkɹɛdəbəɫ"],
    ["principle", "ˈpɹɪnsəpəɫ"],
    ["emigrant", "ˈɛməɡɹənt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("unstressed <i> before a single t in a long word reduces", () => {
  it.each([
    ["absurdity", "əbˈsɝdəti"],
    ["capacitance", "kəˈpæsətəns"],
    ["military", "ˈmɪɫəˌtɛɹi"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("unstressed <i> two groups from the end reduces before f/g/m/n/s/z", () => {
  it.each([
    ["organization", "ˌɔɹɡənəˈzeɪʃən"],
    ["investigate", "ɪnˈvɛstəˌɡeɪt"],
    ["acidification", "əsɪdəfəˈkeɪʃən"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("unstressed <e> two groups from the end reduces", () => {
  it.each([
    ["secretary", "ˈsɛkɹəˌtɛɹi"],
    ["ceremony", "ˈsɛɹəˌmoʊni"],
    ["cinematic", "ˌsɪnəˈmætɪk"],
    ["desegregate", "dɪˈsɛɡɹəˌɡeɪt"],
    ["allegory", "ˈæɫəˌɡɔɹi"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("frames that keep /ɪ/", () => {
  it.each([
    // -ing: 0 ə vs 532 ɪ in the dict
    ["willing", "ˈwɪɫɪŋ"],
    // before c, which is ɪ-keeping (africa, republic, medical)
    ["africa", "ˈæfɹɪkə"],
    // a word-initial vowel group is not a reduction site
    ["invite", "ɪnˈvaɪt"],
    ["believe", "bɪˈɫiv"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("unstressed final -tain", () => {
  it.each(["certain", "captain", "mountain", "fountain", "curtain", "chieftain"])(
    "reduces the ending in %s", (word) => expect(rules(word)).toMatch(/tən$/),
  );

  it.each(["retain", "detain", "obtain", "stain"])(
    "keeps the stressed diphthong in %s", (word) => expect(rules(word)).toMatch(/teɪn$/),
  );
});

describe("-tain plurals after rule-exact stem eviction", () => {
  it.each(["mountains", "captains", "curtains", "fountains", "chieftains"])(
    "preserves the reduced stem in %s", (word) => expect(rules(word)).toMatch(/tənz$/),
  );
});
