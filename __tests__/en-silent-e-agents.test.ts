import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const restored = [
  ["cubist", "ˈkjubɪst"], ["cubism", "ˈkjubɪzəm"],
  ["nudist", "ˈnudɪst"], ["nudism", "ˈnudɪzəm"],
  ["purist", "ˈpjʊɹɪst"], ["racist", "ˈɹeɪsɪst"],
  ["typist", "ˈtaɪpɪst"], ["stylist", "ˈstaɪɫɪst"],
];

describe.each([false, true])("silent-e agent roots (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const access = engine as unknown as { dictionary: Record<string, string> };
  access.dictionary = { ...access.dictionary };
  for (const [word] of restored) {
    for (const ending of ["", "s", "'s"]) delete access.dictionary[word + ending];
  }
  it.each(restored)("restores the root of %s after exception eviction", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
    expect(engine.predict(word + "s")).toBe(ipa + (word.endsWith("ism") ? "z" : "s"));
    expect(engine.predict(word + "'s")).toBe(ipa + (word.endsWith("ism") ? "z" : "s"));
  });
  it.each([
    ["antiracist", "ˌæntɪˈɹeɪsɪst"], ["noncubist", "ˌnɑnˈkjubɪst"],
    ["antinudist", "ˌæntɪˈnudɪst"], ["nontypist", "ˌnɑnˈtaɪpɪst"],
  ])("preserves the derived root in %s", (word, ipa) => {
    for (const ending of ["", "s", "'s"]) {
      delete access.dictionary[word + ending];
      expect(engine.predict(word + ending)).toBe(ipa + (ending ? "s" : ""));
    }
  });
  it.each([
    ["monism", "ˈmɑnɪzəm"], ["nazism", "ˈnæzɪzəm"],
    ["lyrist", "ˈɫɪɹɪst"], ["tavist", "ˈtævɪst"],
    ["banister", "ˈbænɪstɝ"], ["metabolism", "məˈtæbəˌɫɪzəm"],
    ["minister", disableDict ? "ˈmɪnɪstɝ" : "ˈmɪnəstɝ"],
  ])("preserves the complete reading of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves caller-owned bare and restored roots", () => {
    for (const [root, ipa] of [["nud", "ˈnɛd"], ["cub", "ˈkɛb"], ["nude", "ˈnoʊd"]]) {
      const custom = new EnglishG2P({ disableDict });
      const customAccess = custom as unknown as { dictionary: Record<string, string> };
      customAccess.dictionary = { ...customAccess.dictionary };
      delete customAccess.dictionary[root.replace(/e$/, "") + "ist"];
      custom.addPronunciation(root, ipa);
      expect(custom.predict(root.replace(/e$/, "") + "ist")).toBe(ipa + "ɪst");
    }
  });
  it("keeps noun, adjective and finite verb readings in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever typist will harvest beside the carpet.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["typist", "ˈtaɪpɪst"], ["clever", "ˈkɫɛvɝ"],
      ["harvest", "ˈhɑɹvəst"], ["carpet", "ˈkɑɹpət"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
