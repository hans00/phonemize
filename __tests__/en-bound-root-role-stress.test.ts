import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { assignStress, syllabify } from "../src/en/syllabify";

// https://www.merriam-webster.com/dictionary/subject includes noun -jekt as well as -jikt.
// https://dictionary.cambridge.org/pronunciation/english/export
// https://dictionary.cambridge.org/us/pronunciation/english/convict
// These tests keep noun, adjective and verb roles separate from ambiguous !V.
describe("bound-root role stress", () => {
  const engine = new EnglishG2P({ disableDict: true });
  test.each([
    ["export", "N", "ˈɛkspɔɹt"], ["export", "V", "ɪksˈpɔɹt"],
    ["import", "N", "ˈɪmpɔɹt"], ["import", "V", "ɪmˈpɔɹt"],
    ["object", "N", "ˈɑbdʒɛkt"], ["object", "V", "əbˈdʒɛkt"],
    ["subject", "N", "ˈsʌbdʒɛkt"], ["subject", "V", "səbˈdʒɛkt"],
    ["conflict", "N", "ˈkɑnfɫɪkt"], ["conflict", "V", "kənˈfɫɪkt"],
    ["convict", "N", "ˈkɑnvɪkt"], ["convict", "V", "kənˈvɪkt"],
  ])("distinguishes %s %s", (word, pos, ipa) => {
    expect(engine.predict(word, "en-US", pos)).toBe(ipa);
  });
  test.each(["export", "import", "object", "subject"])("preserves ambiguous role for %s", word => {
    const slots = syllabify(word);
    // The candidate must not interpret !V as a gold noun annotation.
    const expected = word === "import" ? 0 : 1;
    expect(assignStress(slots, word, "!V")).toBe(expected);
    expect(assignStress(slots, word, "N")).toBe(0);
    expect(assignStress(slots, word, "V")).toBe(1);
  });
  test.each([
    ["The export is valuable.", "export", "ˈɛkspɔɹt"],
    ["The object is small.", "object", "ˈɑbdʒɛkt"],
    ["They will conflict with the plan.", "conflict", "kənˈfɫɪkt"],
    ["They will convict him.", "convict", "kənˈvɪkt"],
    ["Import the file.", "Import", "ɪmˈpɔɹt"],
    ["Export goods.", "Export", "ɪksˈpɔɹt"],
    ["Object to the plan.", "Object", "əbˈdʒɛkt"],
  ])("uses full sentence %s", (text, word, ipa) => {
    const tokens = createPhonemizer({ processors: [engine] }).phonemize(text, { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});

// Evicting the singular exception must preserve the inherited citation reading.
test.each([["exports", "ˈɛkspɔɹts", "ɪkˈspɔɹts"], ["objects", "ˈɑbdʒɛkts", "əbˈdʒɛkts"]])("keeps %s plural roles after stem eviction", (word, nominal, verbal) => {
  for (const disableDict of [false, true]) {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of ["N", "!V"]) expect(engine.predict(word, "en-US", pos)).toBe(nominal);
    expect(engine.predict(word, "en-US", "V")).toBe(verbal);
  }
});
