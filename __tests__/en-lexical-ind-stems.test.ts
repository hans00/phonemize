import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("vouched -ind stems remain available to derivation (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([["finder", "ˈfaɪndɝ"], ["binder", "ˈbaɪndɝ"], ["grinder", "ˈɡɹaɪndɝ"], ["kinder", "ˈkaɪndɝ"], ["finds", "ˈfaɪndz"], ["binds", "ˈbaɪndz"], ["grinds", "ˈɡɹaɪndz"], ["kinds", "ˈkaɪndz"]])("retains its independent stem in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test.each([["hinder", "ˈhɪndɝ"], ["cinder", "ˈsɪndɝ"], ["tinder", "ˈtɪndɝ"]])("preserves an opaque -inder word: %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test("keeps explicit noun/adjective/verb readings separate", () => {
    expect(engine.predict("finder", "en-US", "N")).toBe("ˈfaɪndɝ");
    expect(engine.predict("kinder", "en-US", "ADJ")).toBe("ˈkaɪndɝ");
    expect(engine.predict("hinder", "en-US", "V")).toBe("ˈhɪndɝ");
  });
  test("preserves a complete noun subject and verb control", () => {

    const tokens = englishTokens(engine, "The finder is active. They hinder progress.");
    expect(tokens.find(token => token.word === "finder")?.phoneme).toBe("ˈfaɪndɝ");
    expect(tokens.find(token => token.word === "hinder")?.phoneme).toBe("ˈhɪndɝ");
    expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
  });
});


test("preserves caller ownership of an -ind root and a complete derived word", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("find", "ˈzɛŋ");
  expect(engine.predict("finder")).toBe("ˈzɛŋɝ");
  expect(new EnglishG2P({ disableDict: true }).predict("finder")).toBe("ˈfaɪndɝ");
  engine.addPronunciation("finder", "ˈkʌp");
  expect(engine.predict("finder")).toBe("ˈkʌp");
});
