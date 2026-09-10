import EnG2P from "../src/en/g2p";
import { assignStress, syllabify } from "../src/en/syllabify";

// Rule-path regressions for the two `a` classes taken in the 2026-09-10
// pass. Each case is a rule, not a word; the words are class exemplars and
// every frame was measured over the whole dict before adoption. Stress
// cases pin the syllable index the rule decides rather than a full IPA
// string, because a derived word's segments can move when build-dict
// re-mines the table.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");
const stress = (word: string) => assignStress(syllabify(word), word);

describe("the weak a- prefix gives its stress to a tense root", () => {
  it.each(["avoid", "anoint", "adroit", "appoint"])(
    "an oi rime is tense, so %s stresses the root",
    (word) => expect(stress(word)).toBe(1),
  );

  it.each(["alone", "amaze", "alive", "alike", "arise", "apace"])(
    "a magic-e root split into its own syllable still counts: %s",
    (word) => expect(stress(word)).toBe(1),
  );

  it.each(["assume", "approve", "arrive", "allude", "apprise"])(
    "the assimilated form behaves the same: %s",
    (word) => expect(stress(word)).toBe(1),
  );

  it("reduces the prefix vowel once the primary has moved off it", () => {
    expect(rules("avoid")).toBe("əˈvɔɪd");
    expect(rules("alone")).toBe("əˈɫoʊn");
    expect(rules("assume")).toBe("əˈsum");
  });

  it("leaves a lax root with initial stress", () => {
    expect(stress("acid")).toBe(0);
    expect(stress("adam")).toBe(0);
    expect(stress("atom")).toBe(0);
  });
});

describe("two-syllable endings that tense an open a", () => {
  // The rule owns the stressed vowel, nothing after it: -ier(s) and -ies
  // words reach the morphology handlers, which read the mined table even
  // under disableDict, so only the segment under test is pinned.
  const firstVowel = (word: string) =>
    /^ˈ[^aeiouɪɛæəʌɑɔʊoɝɚ]*(eɪ|aɪ|aʊ|ɔɪ|oʊ|ɑɹ|ɔɹ|ɛɹ|ɪɹ|ɝ|ɚ|[iɪɛæəʌɑɔʊuo])/.exec(
      rules(word) ?? "",
    )?.[1];

  it.each([
    "haste", "waste", "taste", "chaste",
    "ladies", "babies", "gravies",
    "bakery", "slavery", "drapery",
    "glacier", "brazier", "crazier",
    "haley", "casey", "bakey",
  ])("%s keeps the tense vowel of its magic-e base", (word) =>
    expect(firstVowel(word)).toBe("eɪ"));

  it("spells the monomorphemic s+stop+e words in full", () => {
    expect(rules("haste")).toBe("ˈheɪst");
    expect(rules("waste")).toBe("ˈweɪst");
  });

  it("keeps an r-initial ending lax, as the shared frame does", () => {
    expect(firstVowel("carey")).not.toBe("eɪ");
    expect(firstVowel("baron")).not.toBe("eɪ");
  });

  it("does not reach a two-consonant onset on the ending", () => {
    expect(firstVowel("bagley")).not.toBe("eɪ");
  });
});
