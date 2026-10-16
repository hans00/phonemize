import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("PRICE hiatus before -ary (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const access = engine as unknown as { dictionary: Record<string, string> };
  access.dictionary = { ...access.dictionary };
  for (const word of ["dietary", "proprietary"]) delete access.dictionary[word];

  it.each([
    ["dietary", "ˈdaɪəˌtɛɹi"], ["proprietary", "pɹəˈpɹaɪəˌtɛɹi"],
    ["dietaries", "ˈdaɪəˌtɛɹiz"], ["proprietaries", "pɹəˈpɹaɪəˌtɛɹiz"],
    ["dietarily", "ˈdaɪəˌtɛɹəɫi"], ["proprietarily", "pɹəˈpɹaɪəˌtɛɹəɫi"],
  ])("preserves both nuclei and root stress in %s after eviction", (word, ipa) => {
    delete access.dictionary[word];
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["nondietary", "antidietary", "nonproprietary", "antiproprietary"])(
    "retains the hiatus after a prefix in %s", word => {
      delete access.dictionary[word];
      expect(engine.predict(word)).toContain("ˈ");
      expect(engine.predict(word)).toContain("aɪəˌtɛɹi");
    },
  );
  it.each(["diet", "quiet", "client", "piety", "society", "propriety"])(
    "preserves the existing hiatus in %s", word => {
      expect(engine.predict(word)).toContain("aɪə");
    },
  );
  it.each(["niece", "field", "brief"])("preserves the FLEECE digraph in %s", word => {
    expect(engine.predict(word)).toContain("i");
    expect(engine.predict(word)).not.toContain("aɪə");
  });
  it("retains caller-owned complete roots", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("dietary", "ˈdɛtɝi");
    expect(custom.predict("dietary")).toBe("ˈdɛtɝi");
    expect(custom.predict("dietarily")).toBe("ˈdɛtɝəɫi");
  });
  it("preserves noun, adjective and finite verb readings in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will harvest dietary plants.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["dietary", "ˈdaɪəˌtɛɹi"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["harvest", "ˈhɑɹvəst"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
