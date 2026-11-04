import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge US amend/append/contend and apprehend confirm the root's primary stress.
// https://dictionary.cambridge.org/pronunciation/english/amend
// https://dictionary.cambridge.org/dictionary/english/append
// https://dictionary.cambridge.org/us/dictionary/english/contend
// https://dictionary.cambridge.org/dictionary/english/apprehend
// Synthetic roots assert only the stressed -end segment and regular inflection.
describe.each([false, true])("closed end root after weak prefixes (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([
    ["append", /əˈpɛnd$/], ["appends", /əˈpɛndz$/],
    ["appended", /əˈpɛndɪd$/], ["appending", /əˈpɛndɪŋ$/],
    ["ascend", /əˈsɛnd$/], ["ascended", /əˈsɛndɪd$/],
    ["contend", /kənˈtɛnd$/], ["apprehend", /ˈhɛnd$/],
    ["apprehended", /ˈhɛndɪd$/], ["comprehend", /ˈhɛnd$/],
    ["comprehending", /ˈhɛndɪŋ$/], ["recommend", /ˈmɛnd$/],
    ["misspend", /ˈspɛnd$/], ["outspending", /ˈspɛndɪŋ$/], ["apzend", /ˈzɛnd$/],
    ["apzends", /ˈzɛndz$/], ["apzended", /ˈzɛndɪd$/],
    ["apzending", /ˈzɛndɪŋ$/],
  ])("keeps primary on the complete root in %s", (word, rime) => {
    expect(engine.predict(word)).toMatch(rime);
  });
  test.each(["addend", "legend", "weekend", "agent", "ament", "dividend"])("keeps the nominal head stress in %s", word => {
    expect(engine.predict(word)).toMatch(/^ˈ/);
  });
  test("keeps a caller-owned opaque root", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("apzend", "ˈzɛnd");
    expect(owned.predict("apzended")).toBe("ˈzɛndɪd");
    expect(owned.predict("apzending")).toBe("ˈzɛndɪŋ");
  });
  test("preserves the noun amends and verb/adjective controls in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("They make amends. They amend the careful record.", { language: "en-US", returnArray: true });
    for (const [word, pos] of [["amends", "N"], ["amend", "V"], ["careful", "ADJ"], ["record", "N"]])
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
  });
});

// The frozen lexical abend noun/acronym remains dictionary-owned after rebuild.
test("preserves the lexical abend reading and plural in the default pipeline", () => {
  const engine = new EnglishG2P();
  expect(engine.predict("abend")).toBe("ˈæbɛnd");
  expect(engine.predict("abends")).toMatch(/^ˈæb/);
});
