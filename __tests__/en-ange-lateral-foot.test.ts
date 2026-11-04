import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Oxford American angel /ˈeɪndʒl/:
// https://www.oxfordlearnersdictionaries.com/definition/american_english/angel
// Synthetic forms assert only the vowel/rime owned by the rule.
describe.each([false, true])("ange lateral foot (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each(["angel", "angels", "angel's", "zangel", "zangels"])("preserves the tense vowel in %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/eɪndʒə[lɫ]z?$/);
  });
  test.each(["angelic", "evangel", "tangent", "tangible", "anger", "flange"])("retains the short vowel in %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("æ");
  });
  test.each(["angeled", "angeling", "angeler", "angelous"])("keeps the complete root after eviction: %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("eɪndʒə");
  });
  // Cambridge US: https://dictionary.cambridge.org/us/dictionary/english/larcenous
  test("keeps the weak nominal root before neutral -ous", () => {
    expect(engine.predict("larcenous")).toBe("ˈɫɑɹsənəs");
    expect(engine.predict("larcenously")).toContain("sənəs");
  });
  test("preserves caller-owned roots", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("zangel", "ˈzɛŋ");
    expect(owned.predict("zangel")).toBe("ˈzɛŋ");
    expect(owned.predict("zangels")).toBe("ˈzɛŋz");
  });
  test("preserves noun, adjective and verb readings in sentences", () => {

    const tokens = englishTokens(engine, "The angel records angelic voices. They anger the manager.");
    for (const [word, pos] of [["angel", "N"], ["angelic", "ADJ"], ["anger", "V"]])
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
    expect(tokens.find(token => token.word === "records")?.phoneme).toBe(engine.predict("records", "en-US", "V"));
  });
});
