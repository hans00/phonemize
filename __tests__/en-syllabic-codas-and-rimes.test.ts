import EnglishG2P from "../src/en/g2p";
import { softenBaseFinal } from "../src/en/morph-parser";

describe.each([false, true])("syllabic codas and rimes (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

  test("single initial y retains GOOSE through contractions and suffixes", () => {
    for (const word of ["you", "you'd", "you'll", "you're", "you've", "youth", "youthful"])
      expect(segments(word)).toMatch(/^ju/);
    expect(segments("your")).toMatch(/^jɔɹ/);
    for (const word of ["young", "younger"])
      expect(segments(word)).toMatch(/^j[ʌə]ŋ/);
    for (const word of ["tryout", "buyout"])
      expect(segments(word)).toContain("aʊ");
  });

  test("w+ere and voiced-th/w+eir preserve distinct rhotic nuclei", () => {
    expect(segments("were")).toBe("wɝ");
    for (const word of ["where", "there", "their", "theirselves"])
      expect(segments(word)).toMatch(/^h?[wð]ɛɹ/);
    for (const word of ["weird", "weirdest", "weirdo"])
      expect(segments(word)).toMatch(/^wɪɹ/);
    expect(segments("here")).toBe("hɪɹ");
  });

  test("final sm has a weak nucleus and asm retains TRAP", () => {
    for (const word of ["prism", "spasm", "orgasm", "sarcasm", "cytoplasm"])
      expect(segments(word)).toMatch(/zəm$/);
    for (const word of ["orgasm", "sarcasm", "cytoplasm"])
      expect(segments(word)).toContain("æzəm");
    for (const word of ["abysmal", "baptismal"])
      expect(segments(word)).toMatch(/zmə[ɫl]$/);
    expect(segments("abysmal")).not.toContain("zəmə");
  });

  test("rithm/rhythm voices the dental and supplies the final nasal nucleus", () => {
    for (const word of ["algorithm", "logarithm", "rhythm"])
      expect(segments(word)).toContain("ðəm");
    expect(segments("rhythmic")).toContain("ðmɪk");
    expect(segments("arithmetic")).toContain("θm");
    expect(segments("thunder")).toContain("θ");
  });

  test("Latinate efy/sfy preserves PRICE and its weak thematic i", () => {
    for (const word of ["liquefy", "rarefy", "satisfy", "stupefy", "putrefy"])
      expect(segments(word)).toMatch(/faɪ$/);
    expect(segments("satisfy")).toContain("təsf");
    for (const word of ["dissatisfy", "dissatisfied"])
      expect(segments(word)).toMatch(/^dɪsætəsfaɪ/);
    expect(g2p.predict("dissatisfy")).toMatch(/^dɪˈsæt/);
    expect(segments("dissimilar")).toMatch(/^dɪsɪ/);
    for (const word of ["beefy", "fluffy", "stuffy"])
      expect(segments(word)).toMatch(/fi$/);
  });
});

test("the shared suffix join desyllabifies sm only before a vowel", () => {
  expect(softenBaseFinal("ˈtɛzəm", "tesm", "al")).toBe("ˈtɛzm");
  expect(softenBaseFinal("ˈtɛzəm", "tesm", "ic")).toBe("ˈtɛzm");
  expect(softenBaseFinal("ˈtɛzəm", "tesm", "less")).toBe("ˈtɛzəm");
  expect(softenBaseFinal("ˈtɛzəm", "tesem", "al")).toBe("ˈtɛzəm");
});

test("a consonant-only token does not acquire the final-sm nucleus", () => {
  expect(new EnglishG2P({ disableDict: true }).predict("sm")).not.toMatch(/[əʌ]/);
});
