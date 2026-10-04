import EnglishG2P from "../src/en/g2p";
import { assignStress, syllabify } from "../src/en/syllabify";

describe("two-nucleus io endings", () => {
  test("the slot before io owns the primary at three or more slots", () => {
    for (const word of ["portfolio", "scenario", "oratorio", "pistachio", "braggadocio", "antonio", "ontario"]) {
      const slots = syllabify(word);
      expect(assignStress(slots, word)).toBe(slots.length - 2);
    }
  });
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const predict = (word: string) => g.predict(word, "en")!;
    test(`preserves the root primary through regular noun composition (${disableDict})`, () => {
      for (const [word, primary] of [["portfolio", /ˈfoʊ/], ["scenario", /ˈnɛɹ/], ["oratorio", /ˈtɔɹ/]] as const) {
        for (const form of [word, word + "s", word + "'s", word + "wise", "non" + word])
          expect(predict(form)).toMatch(primary);
        expect(predict("multi" + word)).toMatch(new RegExp(primary.source.replace("ˈ", "[ˈˌ]")));
      }
    });
    test(`keeps short io roots and other Latin endings (${disableDict})`, () => {
      for (const word of ["radio", "patio", "ratio", "studio", "audio", "video"])
        expect(predict(word)).toMatch(/^ˈ/);
      for (const word of ["mexico", "formula", "cinema"])
        expect(predict(word)).toMatch(/^ˈ/);
      expect(predict("america")).toMatch(/ˈmɛɹ/);
      for (const word of ["biology", "microbiology", "bacteriology", "epidemiology"])
        expect(predict(word)).toMatch(/ˈɑ[lɫ]/);
    });
  }
});
