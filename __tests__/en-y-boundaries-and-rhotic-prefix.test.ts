import EnglishG2P from "../src/en/g2p";
import { syllabify } from "../src/en/syllabify";
import { toIPA } from "../src";

describe.each([false, true])("y nuclei and rhotic a- roots (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["acrylic", "analytic", "catalytic", "hemolytic", "patronymic"])("%s stresses the nucleus before -ic", word => {
    expect(g2p.predict(word, "en")).toMatch(/ˈ[^aeiouɑæɛɪɔʊʌəɝ]*ɪ[^aeiouɑæɛɪɔʊʌəɝ]*ɪk$/);
  });
  test.each(["analyze", "catalyze", "hydrolyze", "acolyte", "enzyme", "genotype", "gigabyte", "stereotype"])("%s keeps the silent-e y diphthong", word => {
    expect(g2p.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/aɪ[^aeiouɑæɛɪɔʊʌəɝ]+$/);
  });
  test.each(["alarm", "alert", "apart"])("%s gives stress to its closed rhotic root", word => {
    expect(g2p.predict(word, "en")).toMatch(/^əˈ/);
  });
  test.each(["acid", "atom", "agent", "analyst"])("%s retains its noun stress", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ˈ/);
  });
  test("analysis retains its established suffix boundary and stress", () => {
    expect(g2p.predict("analysis", "en")).toMatch(/^əˈnæ/);
  });
  test("community retains its established suffix boundary and stress", () => {
    expect(g2p.predict("community", "en")).toMatch(/ˈmju/);
  });
  test.each(["baby", "copy"])("%s keeps its weak final y", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ˈ.*i$/);
  });
});

test.each([
  ["acrylic", ["a", "cry", "lic"]],
  ["analyze", ["a", "na", "ly", "ze"]],
  ["enzyme", ["en", "zy", "me"]],
  ["analysis", ["a", "naly", "sis"]],
  ["community", ["com", "mu", "nity"]],
] as const)("%s exposes the nucleus boundary used for stress", (word, slots) => {
  expect(syllabify(word)).toEqual(slots);
  expect(syllabify(word.toUpperCase())).toEqual(slots);
});

test.each(["Acrylic", "enzyme", "catalyze"])("public API preserves the %s nucleus", word => {
  expect(toIPA(word)).toMatch(word === "Acrylic" ? /kɹɪ/ : /aɪ/);
});
