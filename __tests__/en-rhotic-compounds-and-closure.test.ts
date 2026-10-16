import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("vouched rhotic compounds and closure roots (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const access = engine as unknown as { dictionary: Record<string, string> };
  access.dictionary = { ...access.dictionary };
  for (const word of ["overall", "coverall", "enclosure"])
    for (const ending of ["", "s", "'s"]) delete access.dictionary[word + ending];

  it.each([
    ["overall", "ˈoʊvɝˌɔɫ"], ["coverall", "ˈkʌvɝˌɔɫ"], ["enclosure", "ɛnˈkɫoʊʒɝ"],
  ])("retains the root, plural and possessive in %s after eviction", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
    expect(engine.predict(word + "s")).toBe(ipa + "z");
    expect(engine.predict(word + "'s")).toBe(ipa + "z");
  });
  it.each([
    ["nonoverall", "oʊvɝˌɔɫ"], ["noncoverall", "kʌvɝˌɔɫ"], ["nonenclosure", "ɛnˈkɫoʊʒɝ"],
  ])("retains the complete root after a prefix in %s", (word, root) => {
    expect(engine.predict(word)).toContain(root);
  });
  it.each([
    ["pepperell", "ˈpɛpɝəɫ"], ["pickerell", "ˈpɪkɝəɫ"],
    ["witherell", disableDict ? "ˈwɪðɝəɫ" : "ˈwɪθɝəɫ"],
    ["foreclosure", "ˌfɔɹˈkɫoʊʒɝ"], ["closure", "ˈkɫoʊʒɝ"],
    ["disclosure", "dɪsˈkɫoʊʒɝ"], ["overarm", "ˌoʊvɝˈɑɹm"],
    ["overeat", "ˈoʊvɝˌit"],
    ["cynosure", disableDict ? "ˈsɪnəʒɝ" : "ˈsaɪnɔˌsɝ"],
    ["exposure", disableDict ? "ɪksˈpoʊʒɝ" : "ɪkˈspoʊʒɝ"],
  ])("preserves the frozen reading of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves caller-owned complete roots", () => {
    for (const word of ["overall", "enclosure"]) {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation(word, "ˈdɛmoʊ");
      expect(custom.predict(word)).toBe("ˈdɛmoʊ");
      expect(custom.predict("non" + word)).toBe("nɑnˈdɛmoʊ");
    }
  });
  it("preserves the existing lexical prefix variant in the plural", () => {
    const originalTables = new EnglishG2P({ disableDict });
    expect(originalTables.predict("enclosure")).toBe("ɛnˈkɫoʊʒɝ");
    expect(originalTables.predict("enclosures")).toBe(disableDict ? "ɛnˈkɫoʊʒɝz" : "ɪnˈkɫoʊʒɝz");
  });
  it("preserves noun, adjective and finite verb controls in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will harvest beside the enclosure.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["enclosure", "ɛnˈkɫoʊʒɝ"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["harvest", "ˈhɑɹvəst"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
