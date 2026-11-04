import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// These controls own prefix boundaries, not every pre-existing stress/weak-vowel variant.
describe.each([false, true])("un before an i-initial base (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each(["united", "unified", "unifying", "unionizing", "unionizable", "unitizing", "unifiable", "unilateral", "unicameral", "universal", "unilingual", "uniformed"])("retains the numerical or independently derived word %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^ju/);
  });
  test.each(["unimagined", "unimpeachable", "unimproved", "uninhabited", "uninspired", "uninsured", "unintended", "unidentified", "uninteresting", "unintelligible"])("keeps the negative prefix and base in %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^[ʌə]n/);
  });
  test("keeps an explicitly owned whole verb before regular inflection", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("unitate", "ˈjut");
    expect(owned.predict("unitated")).toBe("ˈjutɪd");
  });
  test("keeps the noun witness of an outer ify derivative", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("unity", "ˈzɛnəti");
    expect(owned.predict("unified")).toBe(owned.predict("unify") + "d");
  });
  test("lets an explicitly supplied i-initial base license an opaque suffix", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("ilingual", "ˈɪlɪŋɡwəl");
    expect(owned.predict("unilingual")?.replace(/[ˈˌ]/g, "")).toMatch(/^[ʌə]n/);
  });
  test("preserves noun, adjective and verb controls in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The unilingual speaker records an unintended event.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "unilingual")?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(/^ju/);
    for (const [word, pos] of [["speaker", "N"], ["records", "V"], ["unintended", "ADJ"]])
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
  });
});

// A witnessed outer base owns productive suffixes before a negative un- parse.
describe.each([false, true])("outer suffix ownership (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each(["unionable", "uniformable", "unionizeable"])("preserves the numerical prefix in %s", word => {
    expect(engine.predict(word)).toMatch(/^ˈju/);
  });
});
