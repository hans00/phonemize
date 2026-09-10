import EnG2P from "../src/en/g2p";

// Rule-path regressions for the <a>/<e> reduction residue, the 2026-09-10
// heuristic-learning pass. Each frame was counted over data/en/dict.json and
// then measured as a win/loss list on the rules-only path before adoption.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("a word-initial unstressed closed <a> keeps /æ/", () => {
  it.each([
    ["magnetic", "mæɡˈnɛtɪk"],
    ["fantastic", "fænˈtæstɪk"],
    ["atlanta", "ætˈɫæntə"],
    ["athletic", "æθˈɫɛtɪk"],
    ["advantage", "ædˈvæntɪdʒ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("still reduces across an assimilated prefix's doubled consonant", () => {
    expect(rules("assail")).toBe("əˈseɪɫ");
    expect(rules("affair")).toBe("əˈfɛɹ");
  });

  it("still reduces in the abs-/ads- frame, which has no majority", () => {
    expect(rules("absurdity")).toBe("əbˈsɝdəti");
  });

  it("does not apply to an open initial syllable", () => {
    expect(rules("alabama")).toMatch(/^ə/);
  });
});

describe("a word-initial unstressed closed <e> keeps /ɛ/", () => {
  it.each([
    ["september", "sɛpˈtɛmbɝ"],
    ["entangle", "ɛnˈtæŋɡəɫ"],
    ["bendectin", "bɛnˈdɛktɪn"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps /ɛ/ under a doubled coda too", () => {
    expect(rules("temperature")).toMatch(/^tɛm/);
  });

  it("leaves the ex- prefix raised, where the lexicon has no majority", () => {
    expect(rules("expand")).toMatch(/^ɪk/);
  });

  it("leaves an onsetless sonorant coda before /s/ raised", () => {
    expect(rules("ensconce")).toBe("ɪnˈskɑns");
  });
});

describe("a final unstressed <e> under a non-inflectional obstruent coda keeps /ɛ/", () => {
  it.each([
    ["abend", "ˈæbɛnd"],
    ["hirschfeld", "ˈhɝʃfɛɫd"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps the vowel of a -ct/-ck coda", () => {
    expect(rules("accept")).toMatch(/sɛpt$/);
    expect(rules("handheld")).toMatch(/hɛɫd$/);
  });

  it("still reduces under an inflectional coda built from d/s/t", () => {
    expect(rules("aimless")).toBe("ˈeɪmɫəs");
    expect(rules("basket")).toBe("ˈbæskət");
  });
});
