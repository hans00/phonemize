import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { inferVerbForm, simplePOSTagger } from "../src/en/pos-tagger";

// These words may also be adverbs; function status is not a POS noun cue.
describe("Temporal and spatial function words", () => {
  it.each(["below", "above", "before", "after", "outside"])("does not force a noun after %s", previous => {
    expect(simplePOSTagger.tagWord("deviate", [previous, "from"]).pos).not.toBe("N");
  });

  it.each(["after", "before", "since", "until", "once", "as", "though", "unless"])(
    "recognizes singular agreement in a clause starting with %s", conjunction => {
      const words = [conjunction, "he", "read", "the", "letter"];
      expect(inferVerbForm({ words, index: 2 })).toBe("past");
      const api = createPhonemizer({ processors: [new EnglishG2P()] });
      const token = api.phonemize(words.join(" ") + ".", { language: "en-US", returnArray: true })
        .find(t => t.word === "read")!;
      expect(token.phoneme).toBe("ɹɛd");
    });

  it("preserves bare forms in mandatives and after auxiliaries", () => {
    expect(inferVerbForm({ words: ["I", "recommend", "he", "read"], index: 3 })).toBeUndefined();
    expect(inferVerbForm({ words: ["I", "recommend", "that", "he", "read"], index: 4 })).toBeUndefined();
    expect(inferVerbForm({ words: ["After", "he", "did", "read"], index: 3 })).toBe("base");
    expect(inferVerbForm({ words: ["After", "they", "read"], index: 2 })).toBeUndefined();
  });

  it("keeps inferred form independent of an explicit target POS", () => {
    const engine = new EnglishG2P();
    const original = engine.tagWord.bind(engine);
    engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : original(word, context);
    const api = createPhonemizer({ processors: [engine] });
    expect(api.toIPA("After he read the letter, the record was clear.", "en-US")).toContain("ɹɛd");
  });
});

describe.each([false, true])("Complete locative components (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["hereafter", /hɪ(?:ɹˈ|ˈɹ)æftɝ$/], ["thereafter", /ðɛˈɹæftɝ$/],
    ["whereupon", /hwɛɹəˈpɑn$/],
    ["hereunder", /hɪˈɹʌndɝ$/],
  ])("preserves the root and tail in %s", (word, ipa) => {
    expect(engine.predict(word)).toMatch(ipa);
  });
  it("retains therefore's head stress", () => {
    expect(engine.predict("therefore")).toBe("ˈðɛɹˌfɔɹ");
  });
  it("preserves adjective, noun and verb controls in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Thereafter, the fearless reader will work.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "Thereafter")?.phoneme).toMatch(/ðɛˈɹæftɝ$/);
    expect(tokens.find(t => t.word === "fearless")?.phoneme).toMatch(/ɫ[əɪ]s$/);
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});

describe("Lexical stress and vowel controls", () => {
  const engine = new EnglishG2P();
  it.each([
    ["whereabouts", "ˈhwɛɹəˌbaʊts"], ["hereabout", "ˈhɪɹəˌbaʊt"],
    ["beforehand", "bɪˈfɔɹˌhænd"],
  ])("preserves the established reading of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
});
