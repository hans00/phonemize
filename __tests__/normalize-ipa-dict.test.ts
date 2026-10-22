import { normalizeRegularEdAllomorph } from "../scripts/normalize-ipa-dict";

describe("normalizeRegularEdAllomorph", () => {
  test.each([
    ["added", "ˈædəd", "ˈædɪd"],
    ["needed", "ˈnidəd", "ˈnidɪd"],
    ["headed", "ˈhɛdəd", "ˈhɛdɪd"],
    ["counted", "ˈkaʊnəd", "ˈkaʊntɪd"],
    ["granted", "ˈɡɹænəd", "ˈɡɹæntɪd"],
    ["printed", "ˈpɹɪnəd", "ˈpɹɪntɪd"],
  ])("corrects the regular syllabic -ed allomorph for %s", (word, input, expected) => {
    expect(normalizeRegularEdAllomorph(word, input)).toBe(expected);
  });

  test.each([
    ["lightheaded", "ˈlaɪtˌhɛdəd"],
    ["muddleheaded", "ˌmʌdəlˈhɛdəd"],
    ["played", "ˈpleɪd"],
    ["naked", "ˈneɪkəd"],
    ["aged", "ˈeɪdʒəd"],
  ])("preserves unrelated or lexicalized ending in %s", (word, ipa) => {
    expect(normalizeRegularEdAllomorph(word, ipa)).toBe(ipa);
  });
});
