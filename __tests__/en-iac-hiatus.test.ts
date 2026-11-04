import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");
const stripSecondary = (ipa: string | null | undefined) => ipa?.replace(/ˌ/g, "");

describe.each([false, true])("final -iac hiatus (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test.each([
    ["cardiac", "ˈkɑɹdiæk"], ["celiac", "ˈsiɫiæk"],
    ["iliac", "ˈɪɫiæk"], ["zodiac", "ˈzoʊdiæk"], ["insomniac", "ɪnˈsɑmniæk"],
  ])("keeps the full final vowel in %s across caller POS", (word, expected) => {
    for (const pos of [undefined, "N", "ADJ", "V"]) expect(stripSecondary(engine.predict(word, "en-US", pos))).toBe(expected);
  });

  test.each([
    ["The cardiac patient recovered.", "cardiac", "ˈkɑɹdiæk"],
    ["Celiac disease requires care.", "Celiac", "ˈsiɫiæk"],
    ["The zodiac is ancient.", "zodiac", "ˈzoʊdiæk"],
    ["The insomniac slept.", "insomniac", "ɪnˈsɑmniæk"],
  ])("preserves the reading in %s", (sentence, word, expected) => {
    expect(stripSecondary(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme)).toBe(expected);
  });

  test("keeps the same vowel in plural and prefixed forms", () => {
    expect(stripStress(engine.predict("celiacs", "en-US"))).toBe("siɫiæks");
    expect(stripStress(engine.predict("non-cardiac", "en-US"))).toMatch(/kɑɹdiæk$/);
  });

  test("preserves unrelated hiatus and a caller pronunciation", () => {
    expect(engine.predict("mosaic", "en-US")).toContain("eɪ");
    expect(engine.predict("diacritic", "en-US")).toContain("daɪ");
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("celiac", "Z AE1 P");
    expect(custom.predict("celiac", "en-US")).toBe("ˈzæp");
  });
});
