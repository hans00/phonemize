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

describe.each([false, true])("Verb-reading stems (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });

  it.each([
    ["used", /juzd$/],
    ["using", /juzɪŋ$/],
    ["closed", /kɫoʊzd$/],
    ["closing", /kɫoʊzɪŋ$/],
    ["living", /ɫɪvɪŋ$/],
    ["housing", /haʊzɪŋ$/],
  ] as const)("takes the explicit verb reading in %s", (word, ending) => {
    expect(g2p.predict(word)).toMatch(ending);
  });

  it("keeps citation stress when the table only specifies a non-noun reading", () => {
    expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ[ʌə]nɪŋ$/);
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

describe.each([false, true])("-nge verb inflections (disableDict=%s)", (disableDict) => {
  // inflect()'s closed-stem list ("ll|ss|ch|sh|ck|ng|lk") keeps a bare
  // rule-derived stem for a base ending in one of those clusters, because
  // adding a fictitious silent e usually changes the vowel wrongly
  // (call+ed, reach+ing). "ng" is the one cluster where that default is
  // sometimes wrong: change/range/hinge really did drop a silent e, and
  // bring/sing/hang never had one, but the two shapes are orthographically
  // identical (chang vs bring) and a vowel-tensing test can't tell them
  // apart either (see the comment at that branch in g2p.ts). The one exact
  // signal is the table's own -es plural: -nge is always spelled -nges
  // (changes, ranges), never -ngs, so a stem's -es form being a dict entry
  // is restored evidence a bare -ng plural can never produce by accident.
  const g2p = new EnglishG2P({ disableDict });
  const consonant = (word: string) => g2p.predict(word)?.match(/ndʒ|ŋ/)?.[0];

  it.each([
    "bringing", "singing", "longing", "hanging", "ringing", "belonging",
    "clinging", "swinging", "stinging", "winged", "hanged",
    // "banging" is deliberately excluded: "bange" (a rare surname) is a
    // genuine exceptions.json entry, so inflect()'s dict-based silentE()
    // step accepts it before this branch ever runs. That's a pre-existing
    // table collision upstream of this rule, out of scope here.
  ])("keeps the bare /ŋ/ coda in %s", (word) => {
    expect(consonant(word)).toBe("ŋ");
  });

  it.each([
    "changing", "changed", "ranging", "arranged", "exchanging",
    "challenged", "plunged", "lunging",
    // "hinged"/"cringing"/"binged" stay open: hing/cring/bing have no -es
    // dict entry (unlike chang/rang/exchang), and unlike the -ang stems
    // their vowel doesn't tense either way, so no signal distinguishes
    // them from bring/cling/... — see the -es corroboration comment above.
  ])("restores the silent e to /ndʒ/ in %s", (word) => {
    expect(consonant(word)).toBe("ndʒ");
  });
});
