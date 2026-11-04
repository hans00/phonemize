import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge US automotive/locomotive; Collins American thermomotive:
// https://dictionary.cambridge.org/us/pronunciation/english/automotive
// https://dictionary.cambridge.org/pronunciation/english/locomotive
// https://www.collinsdictionary.com/dictionary/english/thermomotive
// The weak linking vowel belongs to the two-syllable combining head;
// a whole-word dictionary entry is not required for thermomotive.
describe.each([false, true])("bound -motive composition (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["automotive", "ˌɔtəˈmoʊtɪv"],
    ["automotives", "ˌɔtəˈmoʊtɪvz"],
    ["automotive's", "ˌɔtəˈmoʊtɪvz"],
    ["automotively", "ˌɔtəˈmoʊtɪvɫi"],
    ["automotiveness", "ˌɔtəˈmoʊtɪvnəs"],
    ["thermomotive", "ˌθɝməˈmoʊtɪv"],
    ["thermomotive's", "ˌθɝməˈmoʊtɪvz"],
  ])("composes the complete root and suffixes in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });
  it("preserves the existing weak linking syllable in locomotive", () => {
    expect(engine.predict("locomotive")).toContain("kəˈmoʊtɪv");
  });
  it.each([
    ["auto", "ˈɔtoʊ"],
    ["autopilot", "ˈɔtoʊˌpaɪɫət"],
    ["autoeurope", "ˌɔtoʊˈjʊɹəp"],
    ["autopacific", "ˌɔtoʊpəˈsɪfɪk"],
    ["retroactive", "ˌɹɛtɹoʊˈæktɪv"],
    ["hypotension", "ˌhaɪpoʊˈtɛnʃən"],
    ["endoscopic", "ˌɛndoʊˈskɑpɪk"],
  ])("retains the independent component vowels in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["automotive", "thermomotive"])("keeps adjective, noun and verb context around %s", word => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize(`The ${word} device works.`, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === word)?.phoneme).toBe(word === "automotive" ? "ˌɔtəˈmoʊtɪv" : "ˌθɝməˈmoʊtɪv");
    expect(tokens.filter(token => token.word !== word).map(token => token.phoneme)).toEqual(["ðə", "dɪˈvaɪs", "wɝks", "."]);
    expect(engine.predict(word, "en-US", "ADJ")).toBe(tokens.find(token => token.word === word)?.phoneme);
    const annotated = new EnglishG2P({ disableDict }), originalTag = annotated.tagWord.bind(annotated);
    annotated.tagWord = (target, context) => target === word ? { pos: "ADJ", confidence: 1 } : originalTag(target, context);
    expect(createPhonemizer({ processors: [annotated] }).phonemize(`The ${word} device works.`, { language: "en-US", returnArray: true })).toEqual(tokens);
  });
});

test("preserves a caller-owned compound component", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("motive", "ˈmoʊtɪv");
  expect(engine.predict("automotive")).toBe("ˌɔtoʊˈmoʊtɪv");
});

test("preserves the neighboring noun/adjective/verb readings", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const tokens = api.phonemize("The record is active. They record the signal.", { language: "en-US", returnArray: true });
  expect(tokens.filter(token => token.word === "record").map(token => token.phoneme)).toEqual(["ˈɹɛkɝd", "ɹɪˈkɔɹd"]);
  expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
});

// Table eviction must not erase the vouched inner compound after a prefix.
test("preserves the full combining-head vowel under privative non-", () => {
  const rules = new EnglishG2P({ disableDict: true });
  expect(rules.predict("nonautomotive")).toBe("nɑnˌɔtəˈmoʊtɪv");
});
