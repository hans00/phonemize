import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("Verb form stays independent of POS", () => {
  const engine = new EnglishG2P();
  const phonemizer = createPhonemizer({ processors: [engine] });
  const readings = (sentence: string) => phonemizer.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).filter(token => token.word.toLowerCase() === "read").map(token => token.phoneme);

  it.each([
    ["I read that book yesterday.", "ɹɛd"],
    ["He read the book.", "ɹɛd"],
    ["I have just read the book.", "ɹɛd"],
    ["I've read the book.", "ɹɛd"],
    ["The book was read aloud.", "ɹɛd"],
    ["I read that book last week.", "ɹɛd"],
    ["I read books every day.", "ɹid"],
    ["Did he read yesterday?", "ɹid"],
    ["He did not read yesterday.", "ɹid"],
    ["He could still read.", "ɹid"],
    ["He could barely read.", "ɹid"],
    ["The drives are read-only.", "ɹid"],
    ["I will read yesterday's notes.", "ɹid"],
    ["I read about yesterday.", "ɹid"],
    ["I recommend that he read the book.", "ɹid"],
    ["I recommend he read the book.", "ɹid"],
    ["Yesterday ended. I read books every day.", "ɹid"],
    ["Yesterday。I read books every day.", "ɹid"],
  ])("selects the form in %s", (sentence, ipa) => {
    expect(readings(sentence)).toEqual([ipa]);
  });

  it("preserves duplicate occurrences and sentence boundaries", () => {
    expect(readings("I read books daily. He read yesterday.")).toEqual(["ɹid", "ɹɛd"]);
    expect(readings("He will read today, but I read yesterday.")).toEqual(["ɹid", "ɹɛd"]);
    expect(readings("He read yesterday。I read books every day.")).toEqual(["ɹɛd", "ɹid"]);
  });

  it("a known-POS override cannot erase inferred tense", () => {
    const engine = new EnglishG2P();
    const original = engine.tagWord.bind(engine);
    engine.tagWord = (word, context) => word.toLowerCase() === "read"
      ? { pos: "V", confidence: 1 } : original(word, context);
    const phonemizer = createPhonemizer({ processors: [engine] });
    expect(phonemizer.toIPA("I read that book yesterday.", "en-US")).toContain("ɹɛd");
  });

  it("retains an explicit custom pronunciation over contextual selection", () => {
    const engine = new EnglishG2P();
    engine.addPronunciation("read", "R AY1 D");
    const phonemizer = createPhonemizer({ processors: [engine] });
    expect(phonemizer.toIPA("I read it yesterday.", "en-US")).toContain("ɹaɪd");
  });

  it("does not apply context aligned to another token", () => {
    const engine = new EnglishG2P();
    expect(engine.predictWithContext("read", { words: ["Yesterday", "I", "read"], index: 1 }, "en-US", "V"))
      .toBe(engine.predict("read", "en-US", "V"));
  });

  it("does not add a whole-target homograph lookup to the rules path", () => {
    const engine = new EnglishG2P({ disableDict: true });
    const phonemizer = createPhonemizer({ processors: [engine] });
    const token = phonemizer.phonemize("I read books daily.", { language: "en-US", returnArray: true })
      .find(token => token.word === "read")!;
    expect(token.phoneme).toBe(engine.predict("read", "en-US", "V"));
  });

  it("leaves legacy processors on their three-argument API", () => {
    const predict = jest.fn((_word: string, _language?: string, _pos?: string) => "x");
    const phonemizer = createPhonemizer({ processors: [{
      id: "legacy", name: "Legacy", supportedLanguages: ["en"], predict,
      addPronunciation() {},
    }] });
    phonemizer.toIPA("hello world", "en");
    expect(predict).toHaveBeenCalledTimes(2);
    expect(predict.mock.calls.every(call => call.length === 3)).toBe(true);
  });
});
