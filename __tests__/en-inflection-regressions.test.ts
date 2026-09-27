import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src/index";

const regularInflections = [
  ["names", "ˈneɪmz"],
  ["games", "ˈɡeɪmz"],
  ["phones", "ˈfoʊnz"],
  ["homes", "ˈhoʊmz"],
  ["codes", "ˈkoʊdz"],
  ["dates", "ˈdeɪts"],
  ["cakes", "ˈkeɪks"],
  ["bikes", "ˈbaɪks"],
  ["likes", "ˈɫaɪks"],
  ["hopes", "ˈhoʊps"],
  ["notes", "ˈnoʊts"],
  ["smiles", "ˈsmaɪɫz"],
  ["waves", "ˈweɪvz"],
  ["times", "ˈtaɪmz"],
  ["trying", "ˈtɹaɪɪŋ"],
  ["spying", "ˈspaɪɪŋ"],
  ["copying", "ˈkɑpiɪŋ"],
  ["studying", "ˈstʌdiɪŋ"],
  ["worrying", "ˈwɝiɪŋ"],
  ["hurrying", "ˈhɝiɪŋ"],
];

describe.each([false, true])("Inflections with disableDict=%s", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });

  it.each(regularInflections)("preserves the stem pronunciation in %s", (word, ipa) => {
    expect(g2p.predict(word)).toBe(ipa);
  });
});

describe("Inflection boundaries", () => {
  it.each([
    ["taxes", "ˈtæksəz"],
    ["mixes", "ˈmɪksəz"],
    ["campuses", "ˈkæmpəsəz"],
    ["housewives", "ˈhaʊsˌwaɪvz"],
    ["finessed", "fɪˈnɛst"],
    ["professed", "pɹəˈfɛst"],
    ["pedalled", "ˈpɛdəɫd"],
    ["dying", "ˈdaɪɪŋ"],
    ["lying", "ˈɫaɪɪŋ"],
    ["tying", "ˈtaɪɪŋ"],
    ["buying", "ˈbaɪɪŋ"],
    ["saying", "ˈseɪɪŋ"],
  ])("does not misinterpret the stem of %s", (word, ipa) => {
    expect(toIPA(word)).toBe(ipa);
  });

  it("preserves silent-e vowels in connected speech", () => {
    expect(toIPA("names games")).toBe("neɪmz ɡeɪmz");
  });
});

describe("Silent-e probe gating (MAGIC_E_CANDIDATE)", () => {
  // inflect()'s -ed/-ing silent-e fallback fabricates base + "e" and runs
  // it through the full rule pipeline to test whether the base is a
  // dropped-e stem (advanced → advance). Unconditionally, that probe also
  // fires on bases whose ending has no silent-e spelling in English (ask,
  // mask, gasp, form), where it fabricated "aske"/"maske"/"gaspe"/"forme",
  // tensed the vowel through the magic-e rule, and shipped it: asked came
  // out /ˈeɪskt/ at runtime. asked/masked/formed aren't dict keys, so no
  // gate saw it. MAGIC_E_CANDIDATE now gates the probe to endings that can
  // plausibly carry a real silent e.
  const g2p = new EnglishG2P();

  it("keeps the lax vowel in asked", () => {
    expect(g2p.predict("asked")).toMatch(/^ˈæskt$/);
  });

  it.each([
    ["asking", /^ˈæskɪŋ$/],
    ["masked", /^ˈmæskt$/],
    ["gasped", /^ˈɡæspt$/],
    ["formed", /^ˈfɔɹmd$/],
  ] as const)("keeps the lax vowel in %s", (word, expected) => {
    expect(g2p.predict(word)).toMatch(expected);
  });
});
