import EnG2P from "../src/en/g2p";

// Rule-path regressions for the tense i/e classes taken in the 2026-09-10
// pass. Each case is a rule, not a word: the word named is the class
// exemplar and every frame was measured over the whole dict before
// adoption. The assertions pin only the segment the rule owns — a
// rules-only prediction still consults the mined tables for stems, so a
// full IPA string can move when `build-dict` re-mines.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string): string => g2p.predict(word, "en") ?? "";

describe("e before o is a hiatus /i/", () => {
  it.each([
    ["geography", /^ˌ?ˈ?dʒi/],
    ["geodesic", /^ˌ?ˈ?dʒi/],
    ["neoclassic", /^ˌ?ˈ?ni/],
    ["theocracy", /^ˌ?ˈ?[ðθ]i/],
    ["cleo", /^ˌ?ˈ?kɫi/],
    ["creosote", /^ˌ?ˈ?kɹi/],
    ["eon", /^ˌ?ˈ?i/],
  ])("%s keeps the e tense", (word, re) => expect(rules(word)).toMatch(re));

  it("carries into a non-initial syllable", () => {
    expect(rules("video")).toContain("dio");
    expect(rules("stereo")).toContain("ɹio");
  });

  it("does not fire on -eor-, where the rime is ɔɹ", () => {
    expect(rules("george")).toContain("ɔɹdʒ");
    expect(rules("georgia")).toContain("ɔɹdʒ");
  });
});

describe("tense-i Greek/Latin combining forms survive destressing", () => {
  it.each([
    ["micro", /^ˌ?ˈ?maɪ/],
    ["microprocessor", /^ˌ?ˈ?maɪ/],
    ["microbiology", /^ˌ?ˈ?maɪ/],
    ["biographical", /^ˌ?ˈ?baɪ/],
    ["biochemical", /^ˌ?ˈ?baɪ/],
    ["diagnostic", /^ˌ?ˈ?daɪ/],
    ["diabetic", /^ˌ?ˈ?daɪ/],
    ["diagonal", /^ˌ?ˈ?daɪ/],
    ["isometric", /^ˌ?ˈ?aɪ/],
    ["isotope", /^ˌ?ˈ?aɪ/],
  ])("%s keeps /aɪ/", (word, re) => expect(rules(word)).toMatch(re));

  it("leaves the prefixes the dict votes lax alone", () => {
    expect(rules("bigotry")).toMatch(/^ˌ?ˈ?bɪ/);
    expect(rules("tribune")).toMatch(/^ˌ?ˈ?tɹɪ/);
    expect(rules("dilemma")).toMatch(/^ˌ?ˈ?dɪ/);
  });
});

describe("an open ea is lax before a -su tail and eal before -th", () => {
  it.each([
    ["measure", /^ˌ?ˈ?mɛ/],
    ["measuring", /^ˌ?ˈ?mɛ/],
    ["treasury", /^ˌ?ˈ?tɹɛ/],
    ["pleasurable", /^ˌ?ˈ?pɫɛ/],
    ["countermeasure", /ˌ?mɛʒ/],
    ["healthier", /^ˌ?ˈ?hɛ/],
    ["wealthiest", /^ˌ?ˈ?wɛ/],
    ["stealthier", /^ˌ?ˈ?stɛ/],
  ])("%s is lax", (word, re) => expect(rules(word)).toMatch(re));

  it("keeps the tense default on the tails measured tense", () => {
    expect(rules("season")).toMatch(/^ˌ?ˈ?si/);
    expect(rules("leader")).toMatch(/^ˌ?ˈ?ɫi/);
    expect(rules("eater")).toMatch(/^ˌ?ˈ?i/);
  });
});
