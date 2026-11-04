import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge and Oxford both retain PAGE's /eɪ/ in WEB PAGE.
// https://dictionary.cambridge.org/us/pronunciation/english/web-page
// https://www.oxfordlearnersdictionaries.com/definition/english/web-page
// This corrects a source entry; the compound rule already has the right reading.
describe.each([false, true])("verified webpage source reading (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test("retains the complete page component", () => {
    expect(engine.predict("webpage")).toBe("ˈwɛbˌpeɪdʒ");
  });
  test.each([["webpages", "ˈwɛbˌpeɪdʒəz"], ["webpage's", "ˈwɛbˌpeɪdʒɪz"]])("retains the corrected compound through %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test("preserves every occurrence in complete prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The webpage is useful. Another webpage is useful.", { language: "en-US", returnArray: true });
    expect(tokens.filter(token => token.word === "webpage").map(token => token.phoneme)).toEqual(["ˈwɛbˌpeɪdʒ", "ˈwɛbˌpeɪdʒ"]);
    expect(tokens.filter(token => token.word === "useful").map(token => token.phoneme)).toEqual(["ˈjusfəɫ", "ˈjusfəɫ"]);
  });
});
