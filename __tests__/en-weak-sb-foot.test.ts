import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Cambridge US husband, both noun and verb: /ˈhʌz.bənd/.
// https://dictionary.cambridge.org/dictionary/english/husband
// Synthetic roots assert only this rule's weak-foot voicing and composition.
describe.each([false, true])("singleton s before a weak b foot (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each(["husband", "husbands", "husband's", "visband", "visbands", "visbanded", "visbanding", "zisban", "zisbans", "zisbaned", "zisbaning"])("keeps the voiced weak foot through %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/zbən/);
  });
  test.each([
    ["gasband", /sˌbænd$/], ["gasbun", /sˌbʌn$/],
    ["foosball", /sbɔ[ɫl]$/], ["busboy", /sˌbɔɪ$/],
    ["visbend", /sbɛnd$/], ["visbind", /sbaɪnd$/],
    ["gasdom", /sdəm$/], ["bossdom", /sdəm$/],
  ])("preserves the full-vowel or other-stop control %s", (word, rime) => {
    expect(engine.predict(word)).toMatch(rime);
  });
  test("preserves final stress and caller-owned roots", () => {
    expect(engine.predict("disband")).toContain("sˈbænd");
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("visband", "ˈvɪsˌbænd");
    expect(owned.predict("visband")).toBe("ˈvɪsˌbænd");
    expect(owned.predict("visbands")).toBe("ˈvɪsˌbændz");
  });
  test("preserves noun, adjective and verb controls in full sentences", () => {

    const tokens = englishTokens(engine, "Her husband records the careful speech. They husband the resources.");
    for (const token of tokens.filter(token => token.word === "husband")) expect(token.phoneme).toBe(engine.predict("husband", "en-US", "V"));
    expect(tokens.find(token => token.word === "records")?.phoneme).toBe(engine.predict("records", "en-US", "V"));
    expect(tokens.find(token => token.word === "careful")?.phoneme).toBe(engine.predict("careful", "en-US", "ADJ"));
    expect(engine.predict("husband", "en-US", "N")).toBe(engine.predict("husband", "en-US", "V"));
  });
});

// Preserve the frozen dictionary contract for lexical /s/ variants on the default route.
// The normal exception miner must restore these after the rule changes.
test.each(["osbon", "osbun"])("keeps dictionary-owned s in %s", word => {
  const engine = new EnglishG2P();
  expect(engine.predict(word)).toBe("ˈɑsbən");
  expect(engine.predict(word + "s")).toBe("ˈɑsbənz");
});
