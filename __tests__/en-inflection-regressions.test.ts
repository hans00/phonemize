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
