import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("bound roots and weak ir (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const access = engine as unknown as { dictionary: Record<string, string> };
  access.dictionary = { ...access.dictionary };
  for (const word of ["irregular", "irregularly", "regularly", "particularly",
    "irrelevance", "irrepressible", "irrespective", "irresponsible", "irreverent"])
    delete access.dictionary[word];

  it.each([
    ["regularly", "ˈɹɛɡjəɫɝɫi"], ["particularly", "ˌpɑɹˈtɪkjəɫɝɫi"],
    ["irregular", "ˌɪˈɹɛɡjəɫɝ"], ["irregularly", "ˌɪˈɹɛɡjəɫɝɫi"],
  ])("preserves root phones and both stress marks in %s after eviction", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  // Collins US irreducible also starts with KIT; the rule owns that prefix only.
  // https://www.collinsdictionary.com/us/dictionary/english/irreducible
  it.each(["irrelevance", "irrepressible", "irrespective", "irresponsible", "irreverent", "irreducible"])(
    "retains KIT and one root onset in %s", word => {
      expect(engine.predict(word)).toMatch(/^ˌ?ɪ[ˈˌ]?ɹ/);
      expect(engine.predict(word)).not.toMatch(/^ˌ?ɝ/);
    },
  );
  it.each([
    ["singular", "ˈsɪŋɡjəɫɝ"], ["angular", "ˈæŋɡjəɫɝ"],
    ["triangular", disableDict ? "ˈtɹaɪæŋɡjəɫɝ" : "tɹaɪˈæŋɡjəɫɝ"],
    ["irrigation", "ˌɪɹəˈɡeɪʃən"],
    ["irritate", disableDict ? "ˈɪɹəˌteɪt" : "ˈɪɹɪˌteɪt"],
  ])("preserves the existing reading of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves caller-owned roots", () => {
    for (const root of ["regular", "particular"]) {
      const custom = new EnglishG2P({ disableDict });
      const data = custom as unknown as { dictionary: Record<string, string> };
      data.dictionary = { ...data.dictionary };
      delete data.dictionary[root + "ly"];
      custom.addPronunciation(root, "ˈɹoʊɡ");
      expect(custom.predict(root + "ly")).toBe("ˈɹoʊɡɫi");
    }
  });
  it("preserves noun, adjective and finite verb readings in a sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work irregularly.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["irregularly", "ˌɪˈɹɛɡjəɫɝɫi"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
