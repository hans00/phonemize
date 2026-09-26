import EnG2P from "../src/en/g2p";

// Rule-path regressions for the -ia/-ian/-ious/-eous Latin hiatus family
// (`LATIN_HIATUS_ENDING`, used by both `assignStress` and the tensing rule
// in `syllableToIPA`, src/en/syllabify.ts). None of these words go through
// a morphological stem lookup, so the rules-only prediction does not shift
// when data/en/exceptions.json is re-mined.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("-ian/-ious/-eous stress the syllable before them", () => {
  // Extends the existing -ia stress rule (india, malaria) to the -n and
  // -ous variants; previously these fell through to the penult/antepenult
  // heaviness fallback, which mis-stressed a light penult (mysterious,
  // spontaneous) and let a 2-syllable ob-/pre- prefix check misfire
  // (obvious, previous).
  it.each([
    ["canadian", "kəˈneɪdiən"],
    ["indian", "ˈɪndiən"],
    ["obvious", "ˈɑbviəs"],
    ["previous", "ˈpɹiviəs"],
    ["spontaneous", "spɑnˈteɪniəs"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("an open stressed vowel before the hiatus is tense", () => {
  // a→eɪ, e→i, o→oʊ (u is left out; furia/luria keep /ʊ/ in the dict).
  it.each([
    ["canadian", "kəˈneɪdiən"],
    ["akkadian", "əˈkeɪdiən"],
    ["albanian", "æɫˈbeɪniən"],
    ["avian", "ˈeɪviən"],
    ["asian", "ˈeɪʒən"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("an r-onset hiatus colors the open vowel instead of tensing it", () => {
  // The r resyllabifies onto the suffix (bar·BAR·ian, al·GER·ian), so it is
  // the same environment as the word-final ^are$/^ere$ rimes: a→ɛ (SQUARE),
  // e→ɪ (NEAR). o needs no table entry — the default open stressed o is
  // already /oʊ/, and postlex's oʊɹ→ɔɹ narrowing does the rest.
  it.each([
    ["barbarian", "bɑɹˈbɛɹiən"],
    ["various", "ˈvɛɹiəs"],
    ["vegetarian", "ˌvɛdʒəˈtɛɹiən"],
    ["algerian", "æɫˈdʒɪɹiən"],
    ["mysterious", "mɪˈstɪɹiəs"],
    ["glorious", "ˈɡɫɔɹiəs"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("-ia/-ian take a plural -s", () => {
  // The maximal-onset syllabifier glues a trailing -s onto the same last
  // slot (canadi·ans, not canadian·s), so the hiatus pattern needs the
  // optional s to still see it as -ian rather than falling through.
  it.each([
    ["canadians", "kəˈneɪdiənz"],
    ["jordanians", "dʒɔɹˈdeɪniənz"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

// guardian's <u> after g still surfaces as a vowel (a separate open issue),
// so only the stress and the -ian rime this rule owns are pinned.
it("guardian stresses the syllable before -ian", () => {
  expect(new EnG2P({ disableDict: true }).predict("guardian", "en")).toMatch(/^ˈɡ.*diən$/);
});
