import { normalizeRegularEdAllomorph, restoreNasalStopBeforeIng } from "../scripts/normalize-ipa-dict";

describe("normalizeRegularEdAllomorph", () => {
  test.each([
    ["added", "ˈædəd", "ˈædɪd"],
    ["needed", "ˈnidəd", "ˈnidɪd"],
    ["headed", "ˈhɛdəd", "ˈhɛdɪd"],
    ["counted", "ˈkaʊnəd", "ˈkaʊntɪd"],
    ["granted", "ˈɡɹænəd", "ˈɡɹæntɪd"],
    ["printed", "ˈpɹɪnəd", "ˈpɹɪntɪd"],
    ["mounted", "ˈmaʊnɪd", "ˈmaʊntɪd"],
    ["hinted", "ˈhɪnɪd", "ˈhɪntɪd"],
    ["jointed", "ˈdʒɔɪnɪd", "ˈdʒɔɪntɪd"],
    ["prevented", "pɹiˈvɛnɪd", "pɹiˈvɛntɪd"],
    ["segmented", "ˈsɛɡˌmɛnɪd", "ˈsɛɡˌmɛntɪd"],
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

describe("restoreNasalStopBeforeIng", () => {
  test.each([
    ["documenting", "ˈdɑkjəmənɪŋ", "ˈdɑkjəməntɪŋ"],
    ["preventing", "pɹiˈvɛnɪŋ", "pɹiˈvɛntɪŋ"],
    ["resenting", "ɹiˈzɛnɪŋ", "ɹiˈzɛntɪŋ"],
  ])("restores /t/ in %s", (word, input, expected) => {
    expect(restoreNasalStopBeforeIng(word, input)).toBe(expected);
  });

  test.each([
    ["painting", "ˈpeɪntɪŋ"],
    ["sunning", "ˈsənɪŋ"],
    ["documented", "ˈdɑkjəmɛntɪd"],
  ])("preserves unrelated or already careful form %s", (word, ipa) => {
    expect(restoreNasalStopBeforeIng(word, ipa)).toBe(ipa);
  });
});
