import EnG2P from "../src/en/g2p";

// Second pass over the unstressed-vowel residue (2026-09-10). The frames
// here are conditioned on the SUFFIX rather than on the following
// consonant and the word-end distance: the reduced slot is the one
// immediately before an unstressed suffix, wherever the primary sits.
// Each frame was counted over data/en/dict.json and then measured as a
// rules-only win/loss list before adoption.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("the penult <i> before a -y suffix reduces", () => {
  it.each([
    ["cavity", "ˈkævəti"],
    ["gravity", "ˈɡɹævəti"],
    ["entity", "ˈɛntəti"],
    ["equity", "ˈɛkwəti"],
    ["purity", "ˈpjʊɹəti"],
    ["policy", "ˈpɑɫəsi"],
    ["gossipy", "ˈɡɑsəpi"],
    ["mutiny", "ˈmjutəni"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("carries through the -ies/-ied inflections", () => {
    expect(rules("abilities")).toBe("əˈbɪɫətiz");
    expect(rules("amplifies")).toBe("ˈæmpɫəˌfaɪz");
  });

  it("leaves a stressed <i> in the same shape alone", () => {
    expect(rules("city")).toBe("ˈsɪti");
  });
});

// The -ly/-al/-ment handlers price the base without the suffix in view,
// so these assert only the segment the reduction owns: the stems come
// from the mined table and the rest of the string can move with it.
describe("the pre-suffix vowel of a -ly adverb reduces", () => {
  it.each([
    ["angrily", "ŋɡɹəɫi"],
    ["happily", "pəɫi"],
    ["easily", "zəɫi"],
    ["family", "məɫi"],
  ])("%s contains %s", (word, seg) => expect(rules(word)).toContain(seg));

  it("does not touch a -y base the suffix did not rewrite", () => {
    expect(rules("daily")).not.toContain("əɫi");
  });
});

describe("-bly reads its -ble base so the cluster rule can fire", () => {
  it.each([
    ["credibly", "dəbɫi"],
    ["possibly", "səbɫi"],
    ["forcibly", "səbɫi"],
    ["flexibly", "səbɫi"],
  ])("%s contains %s", (word, seg) => expect(rules(word)).toContain(seg));
});

describe("the vowel before an unstressed Latinate ending reduces", () => {
  it.each([
    ["luminous", "ˈɫumənəs"],
    ["ominous", "ˈɑmənəs"],
    ["militant", "ˈmɪɫətənt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it.each([
    ["animal", "nəməɫ"],
    ["capital", "pətəɫ"],
    ["terminal", "mənəɫ"],
    ["cardinal", "dənəɫ"],
    ["condiment", "dəmənt"],
  ])("%s contains %s", (word, seg) => expect(rules(word)).toContain(seg));
});

describe("a word-final <e> under a geminate t raises to /ɪ/", () => {
  it.each([
    ["bartlett", "ˈbɑɹtɫɪt"],
    ["beckett", "ˈbɛkɪt"],
    ["brackett", "ˈbɹækɪt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves the single-t rime on the schwa path", () => {
    expect(rules("bracket")).toBe("ˈbɹækət");
  });
});
