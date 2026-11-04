import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Oxford US reproductive /ˌriːprəˈdʌktɪv/ and reconstructive /ˌriːkənˈstrʌktɪv/:
// https://www.oxfordlearnersdictionaries.com/definition/english/reproductive
// https://www.oxfordlearnersdictionaries.com/definition/english/reconstructive
// Novel compounds assert only the root stress/rime this class owns.
describe.each([false, true])("prefixed act/duct + ive (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([
    ["reproductive", "ˌɹipɹəˈdʌktɪv"],
    ["reconstructive", "ˌɹikənˈstɹʌktɪv"],
  ])("keeps the bound root primary in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
    expect(engine.predict(word, "en-US", "ADJ")).toBe(ipa);
  });
  test.each([
    ["reproductively", "ˈdʌktɪv"], ["reproductiveness", "ˈdʌktɪv"],
    ["reconstructively", "ˈstɹʌktɪv"], ["reconstructiveness", "ˈstɹʌktɪv"],
    ["reinductive", "ˈdʌktɪv"], ["redeductive", "ˈdʌktɪv"],
  ])("retains root stress through composition: %s", (word, rime) => {
    expect(engine.predict(word)).toContain(rime);
  });
  test("preserves the neighboring nominal and adjectival ive readings", () => {
    expect(engine.predict("addictive", "en-US", "ADJ")).toBe("əˈdɪktɪv");
    expect(engine.predict("additive", "en-US", "N")).toBe("ˈædətɪv");
  });
  test("preserves full adjective, noun and verb sentence controls", () => {

    const tokens = englishTokens(engine, "The reproductive cycle is short. The surgeon performs reconstructive surgery. The additive is safe. The addictive substance is dangerous. They reproduce the report.");
    expect(tokens.find(t => t.word === "reproductive")?.phoneme).toBe("ˌɹipɹəˈdʌktɪv");
    expect(tokens.find(t => t.word === "reconstructive")?.phoneme).toBe("ˌɹikənˈstɹʌktɪv");
    expect(tokens.find(t => t.word === "additive")?.phoneme).toBe("ˈædətɪv");
    expect(tokens.find(t => t.word === "addictive")?.phoneme).toBe("əˈdɪktɪv");
    expect(tokens.find(t => t.word === "reproduce")?.phoneme).toBe(engine.predict("reproduce", "en-US", "V"));
  });
  test("keeps caller ownership of a vouched root", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("reproductive", "ˈzɛŋ");
    expect(owned.predict("reproductive")).toBe("ˈzɛŋ");
    expect(owned.predict("reproductively")).toBe("ˈzɛŋɫi");
  });
});
