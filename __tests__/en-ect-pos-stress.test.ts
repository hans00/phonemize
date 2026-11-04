import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { assignStress, syllabify } from "../src/en/syllabify";

// Collect's telephone adjective/adverb shares the verb reading; its prayer noun differs.
// https://dictionary.cambridge.org/us/dictionary/english/collect
// https://www.collinsdictionary.com/us/dictionary/english/collect
describe.each([false, true])("bound -ect stress with caller POS (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([
    ["N", "ˈkɑɫɛkt"], ["V", "kəˈɫɛkt"], ["ADJ", "kəˈɫɛkt"], ["ADV", "kəˈɫɛkt"],
  ])("distinguishes collect as %s", (pos, ipa) => {
    expect(engine.predict("collect", "en-US", pos)).toBe(ipa);
  });
  test.each(["connect", "confect"])("places primary on the verb root in %s", word => {
    expect(engine.predict(word, "en-US", "V")).toBe(word === "connect" ? "kəˈnɛkt" : "kənˈfɛkt");
  });
  test("preserves noun, adjective and verb neighbors in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The collect is short. They will collect stamps and connect wires. The active artist will print reports.", { language: "en-US", returnArray: true });
    expect(tokens.filter(t => t.word === "collect").map(t => t.phoneme)).toEqual(["ˈkɑɫɛkt", "kəˈɫɛkt"]);
    expect(tokens.find(t => t.word === "connect")?.phoneme).toBe("kəˈnɛkt");
    expect(tokens.find(t => t.word === "active")?.phoneme).toBe("ˈæktɪv");
    expect(tokens.find(t => t.word === "print")?.phoneme).toBe("pɹɪnt");
  });
  test("recognizes the noun before a regular past predicate", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Her favorite collect ended the service.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "collect")?.phoneme).toBe("ˈkɑɫɛkt");
  });
  test.each([["The report read shocked the committee.", "read", "ɹɛd"], ["The skill learned changed the course.", "learned", "ɫɝnd"]])("preserves the reduced passive in %s", (text, word, ipa) => {
    const tokens = createPhonemizer({ processors: [engine] }).phonemize(text, { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
  test("keeps noun-sense ambiguity distinct from a grammatical NP", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("His former lead formed the group.", { language: "en-US", returnArray: true });
    expect(engine.tagWord("lead", { prev: "former", next: "formed", sentence: { words: ["His", "former", "lead", "formed", "the", "group"], index: 2 } }).pos).toBe("!V");
    if (!disableDict) expect(tokens.find(t => t.word === "lead")?.phoneme).toBe("ɫid");
  });
  test("keeps the supplied reading above POS-sensitive spelling rules", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("collect", "ˈzɛŋ");
    expect(owned.predict("collect", "en-US", "N")).toBe("ˈzɛŋ");
    expect(owned.predict("collect", "en-US", "V")).toBe("ˈzɛŋ");
  });
  test("recovers prefixed roots after exception eviction", () => {
    expect(engine.predict("disconnect")?.replace(/ˌ/g, "")).toBe("dɪskəˈnɛkt");
    expect(engine.predict("uncollected")).toBe(disableDict ? "ˌʌnkəˈɫɛktɪd" : "ənkəˈɫɛktɪd");
  });
  test("recognizes a verb association inside a mixed POS entry", () => {
    expect(engine.predict("contents", "en-US", "V")).toBe("kənˈtɛnts");
    expect(engine.predict("contents", "en-US", "N")).toBe("ˈkɑntɛnts");
  });
  test.each([["She made a collect call.", "ADJ"], ["They call collect.", "ADV"]])("uses known %s POS without changing neighboring tokens", (text, pos) => {
    const known = new EnglishG2P({ disableDict }), tag = known.tagWord.bind(known);
    known.tagWord = (word, context) => word === "collect" ? { pos, confidence: 1 } : tag(word, context);
    const options = { language: "en-US", returnArray: true as const };
    const automatic = createPhonemizer({ processors: [engine] }).phonemize(text, options);
    const annotated = createPhonemizer({ processors: [known] }).phonemize(text, options);
    expect(annotated.find(t => t.word === "collect")?.phoneme).toBe("kəˈɫɛkt");
    expect(annotated.filter(t => t.word !== "collect")).toEqual(automatic.filter(t => t.word !== "collect"));
  });
});

test("applies the same stress distinction to novel bound-root spellings", () => {
  for (const word of ["conzect", "complect"]) {
    const slots = syllabify(word);
    expect(assignStress(slots, word, "N")).toBe(0);
    expect(assignStress(slots, word, "V")).toBe(1);
  }
});

test("preserves a fixed morphology stress instruction above caller POS", () => {
  const engine = new EnglishG2P({ disableDict: true });
  expect(engine.predict("connected")).toBe("kəˈnɛktɪd");
  expect(engine.predict("collecting")).toBe("kəˈɫɛktɪŋ");
  expect(engine.trace("collect", "en-US", "N").path).toBe("rules");
  expect(engine.trace("collect", "en-US", "V").path).toBe("rules");
});
