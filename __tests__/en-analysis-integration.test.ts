import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import type { SentenceAnalysis } from "../src/g2p";

describe("shadow sentence analysis integration", () => {
  test("analyzes comma lists in the actual tokenizer without changing pronunciation", () => {
    const engine = new EnglishG2P({ analysis: "shadow" });
    const api = createPhonemizer({ processors: [engine] });
    const legacy = createPhonemizer({ processors: [new EnglishG2P()] });
    let analysis: SentenceAnalysis | undefined;
    const tag = engine.tagWord.bind(engine);
    engine.tagWord = (word, context) => {
      if (word === "record") analysis = context?.sentence?.analysis;
      return tag(word, context);
    };
    const sentence = "They will read, record, and replay the tape.";
    const options = { language: "en-US", returnArray: true } as const;
    expect(api.phonemize(sentence, options)).toEqual(legacy.phonemize(sentence, options));
    expect(analysis?.status).toBe("parsed");
    expect(analysis?.words).toEqual(["They", "will", "read", ",", "record", ",", "and", "replay", "the", "tape", "."]);
    expect(analysis?.tokens[4].tags).toContain("V");
  });
  test.each([false, true])("shares one immutable analysis per sentence, preserving occurrence hooks, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict, analysis: "shadow" });
    const api = createPhonemizer({ processors: [engine] });
    const legacy = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const calls: Array<{ word: string; index: number; analysis: SentenceAnalysis | undefined }> = [];
    const tag = engine.tagWord.bind(engine);
    engine.tagWord = (word, context) => {
      calls.push({ word, index: context?.sentence?.index ?? -1, analysis: context?.sentence?.analysis });
      return tag(word, context);
    };
    const sentence = "They record a record. I will read yesterday's notes.";
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true })).toEqual(legacy.phonemize(sentence, { language: "en-US", returnArray: true }));
    expect(calls.map(c => c.word)).toEqual(["They", "record", "a", "record", "I", "will", "read", "yesterday's", "notes"]);
    expect(calls.map(c => c.index)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 4]);
    expect(calls.every(c => c.analysis !== undefined)).toBe(true);
    expect(new Set(calls.slice(0, 4).map(c => c.analysis)).size).toBe(1);
    expect(new Set(calls.map(c => c.analysis)).size).toBe(2);
  });
  test("Known-POS changes only the selected occurrence and preserves other tokens", () => {
    const engine = new EnglishG2P({ analysis: "shadow" });
    const api = createPhonemizer({ processors: [engine] });
    const options: { language: string; returnArray: true } = { language: "en-US", returnArray: true };
    const before = api.phonemize("They record a record.", options);
    const tag = engine.tagWord.bind(engine);
    let seen = 0;
    engine.tagWord = (word, context) => word === "record" && ++seen === 2 ? { pos: "V", confidence: 1 } : tag(word, context);
    const after = api.phonemize("They record a record.", options);
    expect(after.slice(0, 3)).toEqual(before.slice(0, 3));
    expect(after[3].phoneme).not.toBe(before[3].phoneme);
    expect(after.slice(4)).toEqual(before.slice(4));
  });
  test("default and isolated citation paths keep the existing entry behavior", () => {
    expect(new EnglishG2P().analyzeSentence).toBeUndefined();
    const engine = new EnglishG2P({ analysis: "shadow" });
    const analyze = jest.spyOn(engine, "analyzeSentence");
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("for", { language: "en-US" })).toBe(createPhonemizer({ processors: [new EnglishG2P()] }).phonemize("for", { language: "en-US" }));
    expect(analyze).not.toHaveBeenCalled();
  });
});

test("trace records the actual legacy component choice without changing IPA", () => {
  const engine = new EnglishG2P({ disableDict: true });
  const trace = engine.trace("automotive");
  expect(trace.ipa).toBe(engine.predict("automotive"));
  expect(trace.structure).toMatchObject({ kind: "legacy-compound", left: { spelling: "auto", start: 0, end: 4 }, right: { spelling: "motive", start: 4, end: 10 }, stressOwner: "right", boundary: "unclassified" });
  expect(engine.trace("webpage").structure).toMatchObject({ kind: "legacy-compound", right: { spelling: "page", componentIpa: "ˈpeɪdʒ" } });
  const lexical = new EnglishG2P();
  lexical.addPronunciation("automotive", "ˌɔtəˈmoʊtɪv");
  expect(lexical.trace("automotive").structure).toMatchObject({ kind: "opaque", route: "custom-dict" });
});
