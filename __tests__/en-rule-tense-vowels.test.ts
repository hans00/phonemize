import EnG2P from "../src/en/g2p";

// Rule-path regressions for the tense/lax readings of i and e fixed in
// the 2026-09 heuristic-learning pass. Every case is a rule, not a word:
// the word named is the class exemplar, and each class was measured as a
// win/loss list over the whole dictionary before adoption.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("ea is lax when a d closes the syllable", () => {
  it.each([
    ["head", "ˈhɛd"],
    ["bread", "ˈbɹɛd"],
    ["dead", "ˈdɛd"],
    ["spread", "ˈspɹɛd"],
    ["thread", "ˈθɹɛd"],
    ["ready", "ˈɹɛdi"],
    ["deadline", "ˈdɛdˌɫaɪn"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps the tense reading when the d opens the next syllable", () => {
    expect(rules("leader")).toBe("ˈɫidɝ");
  });
});

describe("ea is lax before the -ther/-san/-lou tails", () => {
  it.each([
    ["feather", "ˈfɛðɝ"],
    ["leather", "ˈɫɛðɝ"],
    ["weather", "ˈwɛðɝ"],
    ["jealous", "ˈdʒɛɫəs"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves -son and -ter tense", () => {
    expect(rules("season")).toMatch(/^ˈsi/);
  });
});

describe("syllable-final -ign is the silent-g /aɪn/ rime", () => {
  it.each([
    ["sign", "ˈsaɪn"],
    ["benign", "bɪˈnaɪn"],
    ["signer", "ˈsaɪnɝ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves ɡn intact when a vowel follows the n", () => {
    expect(rules("dignity")).toBe("ˈdɪɡnɪti");
  });
});

describe("stressed i in hiatus with the next vowel is tense", () => {
  it.each([
    ["lion", "ˈɫaɪɑn"],
    ["riot", "ˈɹaɪɑt"],
    ["giant", "ˈdʒaɪænt"],
    ["dial", "ˈdaɪæɫ"],
    ["bias", "ˈbaɪæs"],
    ["bio", "ˈbaɪoʊ"],
    ["die", "ˈdaɪ"],
    ["cries", "ˈkɹaɪz"],
    ["crier", "ˈkɹaɪɝ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves the unstressed -ier/-ion suffixes alone", () => {
    expect(rules("carrier")).toBe("ˈkæɹiɝ");
    expect(rules("million")).toBe("ˈmɪɫjən");
  });
});

describe("i is tense before a single-consonant coda plus syllabic -le", () => {
  it.each([
    ["title", "ˈtaɪtəɫ"],
    ["idle", "ˈaɪdəɫ"],
    ["bridle", "ˈbɹaɪdəɫ"],
    ["entitle", "ɛnˈtaɪtəɫ"], // the dict's own reading; the rules now match it
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps a doubled coda lax", () => {
    expect(rules("little")).toBe("ˈɫɪtəɫ");
    expect(rules("middle")).toBe("ˈmɪdəɫ");
  });
});

describe("-cial/-tial imposes its own stem vowel", () => {
  it.each([
    ["special", "ˈspɛʃəɫ"],
    ["racial", "ˈɹeɪʃəɫ"],
    ["facial", "ˈfeɪʃəɫ"],
    ["spatial", "ˈspeɪʃəɫ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("two-syllable open e tenses before the measured endings", () => {
  it.each([
    ["legal", "ˈɫiɡəɫ"],
    ["penal", "ˈpinəɫ"],
    ["fetus", "ˈfitəs"],
    ["genus", "ˈdʒinəs"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves the endings the dict does not back lax", () => {
    expect(rules("never")).toBe("ˈnɛvɝ");
    expect(rules("seven")).toBe("ˈsɛvən");
    expect(rules("metal")).toBe("ˈmɛtəɫ");
  });
});
