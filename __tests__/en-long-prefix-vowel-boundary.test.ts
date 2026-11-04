import EnglishG2P from "../src/en/g2p";
import { BORROWED_ROOT_FRAME } from "../src/en/syllabify";
import { englishTokens } from "./helpers/english";

// Cambridge noun/adjective interim and noun/verb interest retain initial primary.
// https://dictionary.cambridge.org/us/dictionary/english/interim
// https://dictionary.cambridge.org/us/pronunciation/english/interest
// https://www.dictionary.com/browse/interurban
// https://dictionary.cambridge.org/us/pronunciation/english/interpersonal
// https://dictionary.cambridge.org/us/dictionary/english/intergovernmental
// Synthetic interam/interem probe the same resyllabified prefix boundary.
describe.each([false, true])("long r-final prefix before a vowel (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each(["N", "V"])("keeps interest's lexical primary with %s", pos => {
    expect(engine.predict("interest", "en-US", pos)).toMatch(/^ˈɪnt/);
  });
  test.each(["N", "ADJ"])("keeps interim's lexical primary with %s", pos => {
    expect(engine.predict("interim", "en-US", pos)).toMatch(/^ˈɪntɝ[ɪə]m$/);
  });
  test.each(["interests", "interested", "interesting", "interestingly", "interestable", "interims", "interim's", "interam", "interams", "interem"])("retains the initial foot in %s", word => {
    expect(engine.predict(word)).toMatch(/^ˈɪnt/);
  });
  test.each(["interurban", "interurbans", "interurbanly", "interurbanness"])("retains the root primary in %s", word => {
    expect(engine.predict(word)).toMatch(/ˈɝbən(?:z|ɫi|nəs)?$/);
  });
  test("preserves verb/adjective roots and consonantal compound vowels", () => {
    expect(engine.predict("internal", "en-US", "ADJ")).toBe("ɪnˈtɝnəɫ");
    expect(engine.predict("interpret", "en-US", "V")).toMatch(/ɪnˈtɝpɹət$/);
    expect(engine.predict("interact", "en-US", "V")).toBe("ˌɪntɝˈækt");
    expect(engine.predict("intercompany")).not.toContain("kɑmp");
    expect(engine.predict("interpersonal")).toBe("ˌɪntɝˈpɝsənəɫ");
    expect(engine.predict("intergovernmental")).toMatch(/ˈmɛntəɫ$/);
  });
  test("preserves the full non- prefix after stem eviction", () => {
    expect(engine.predict("noninterest")).toMatch(/^nɑ/);
  });
  test("keeps a caller-owned root through its plural", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("interest", "ˈzɛnd");
    expect(owned.predict("interests")).toBe("ˈzɛndz");
  });
  test("preserves the noun, verb and adjective in complete sentences", () => {

    const tokens = englishTokens(engine, "Her interest in the internal report grew. The report will interest the careful reader. The interim leader read the record.");
    const interests = tokens.filter(token => token.word === "interest");
    expect(interests).toHaveLength(2);
    expect(interests[0].phoneme).toBe(engine.predict("interest", "en-US", "N"));
    expect(interests[1].phoneme).toBe(engine.predict("interest", "en-US", "V"));
    for (const [word, pos] of [["internal", "ADJ"], ["interim", "ADJ"], ["careful", "ADJ"], ["record", "N"]])
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
  });
});

test("a long prefix requires a separate root nucleus before borrowing", () => {
  for (const word of ["infrae", "intrae"]) expect(BORROWED_ROOT_FRAME.test(word)).toBe(false);
  for (const word of ["interest", "interim", "interurban"]) expect(BORROWED_ROOT_FRAME.test(word)).toBe(true);
});
