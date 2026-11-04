import EnglishG2P from "../src/en/g2p";
import { applyPhonotactics } from "../src/en/phonotactics";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("NEAR superlatives, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([
    ["near", "ˈnɪɹ"], ["dear", "ˈdɪɹ"],
    ["nearest", "ˈnɪɹəst"], ["dearest", "ˈdɪɹəst"],
    ["sheerest", "ˈʃɪɹəst"], ["queerest", "ˈkwɪɹəst"],
    ["rarest", "ˈɹɛɹəst"],
  ])("retains the root vowel in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test("owns the root vowel independently of the weak suffix variant", () => {
    expect(engine.predict("clearest")).toMatch(/^ˈkɫɪɹ[əɪ]st$/);
    expect(engine.predict("fairest")).toMatch(/^ˈfɛɹ[əɪ]st$/);
    expect(engine.predict("surest")).toMatch(/^ˈʃʊɹ[əɪ]st$/);
    expect(engine.predict("bare")).toBe("ˈbɛɹ");
    expect(engine.predict("barest")).toBe("ˈbɛɹəst");
    expect(engine.predict("barer")).toBe("ˈbɛɹɝ");
    for (const word of ["dearestly", "dearestness", "dearest's"])
      expect(engine.predict(word)).toMatch(/^ˈdɪɹəst/);
  });
  test.each([
    ["forest", "ˈfɔɹəst"], ["harvest", "ˈhɑɹvəst"], ["honest", "ˈɑnəst"],
  ])("keeps lexical -est intact: %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test.each([
    ["The nearest shop is open.", "nearest", "ˈnɪɹəst"],
    ["This is my dearest friend.", "dearest", "ˈdɪɹəst"],
    ["She stood nearest to the door.", "nearest", "ˈnɪɹəst"],
    ["This is the rarest flower.", "rarest", "ˈɹɛɹəst"],
  ])("preserves adjective and adverb context in %s", (sentence, word, ipa) => {
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});

test("keeps other intervocalic r and incomplete morphology boundaries intact", () => {
  for (const [ipa, word] of [
    ["ˈhiɹɝ", "hearer"], ["ˈʃiɹɝ", "sheerer"],
    ["ˈhiɹoʊ", "hero"], ["ˈɹiɹəst", "rearrest"],
  ]) expect(applyPhonotactics(ipa, word)).toBe(ipa);
});

test("preserves neighboring verb and noun readings", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const target = (text: string, word: string) => api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  expect(target("They record the nearest station.", "record")).toBe("ɹɪˈkɔɹd");
  expect(target("The nearest record is here.", "record")).toBe("ˈɹɛkɝd");
});
