import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Un- preserves productive adjective roots (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });

  it("retains the necessary root and its stress", () => {
    expect(engine.predict("necessary")).toBe("ˈnɛsəˌsɛɹi");
    expect(engine.predict("unnecessary")).toBe("ənˈnɛsəˌsɛɹi");
  });

  it("preserves the derived adverb across root eviction", () => {
    expect(engine.predict("unnecessarily")).toBe("ənˈnɛsəˌsɛɹəɫi");
  });

  it.each(["unscientific", "unscientifically"])("preserves the complete sci root in %s", word => {
    expect(engine.predict(word)).toMatch(/saɪənˈtɪfɪk/);
  });

  it("preserves the adjective beyond the ary family", () => {
    expect(engine.predict("unwinnable")).toBe("ənˈwɪnəbəɫ");
    expect(engine.predict("undemocratic")).toMatch(/dɛməˈkɹætɪk$/);
  });

  it.each(["undulate", "undulated", "undulating"])("does not split the unrelated whole root %s", word => {
    expect(engine.predict(word)).toMatch(/^ˈʌnd[ʒj]/);
  });

  it.each([
    ["unnerve", "əˈnɝv"], ["unnerving", "əˈnɝvɪŋ"],
    ["unclassified", "ənˈkɫæsɪˌfaɪd"], ["undeniably", "ˌʌndɪˈnaɪəbɫi"],
  ])("retains the existing short/verb/adverb route in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it.each([
    ["Unnecessary work delays us.", "unnecessary", "ənˈnɛsəˌsɛɹi"],
    ["This work is unnecessary.", "unnecessary", "ənˈnɛsəˌsɛɹi"],
    ["He spoke unnecessarily.", "unnecessarily", "ənˈnɛsəˌsɛɹəɫi"],
    ["They unnerve me.", "unnerve", "əˈnɝv"],
    ["The undulating sea is calm.", "sea", "si"],
  ])("preserves noun/adjective/verb controls in %s", (sentence, word, ipa) => {
    const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word.toLowerCase() === word)!;
    expect(target.phoneme).toBe(ipa);
  });
});
