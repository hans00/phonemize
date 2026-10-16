import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("weak ci in Latinate derivations (rules=%s)", (disableDict) => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["anticipate", "ænˈtɪsəˌpeɪt"], ["decimate", "ˈdɛsəˌmeɪt"],
    ["oscillate", "ˈɑsəˌɫeɪt"], ["oscillator", "ˈɑsəˌɫeɪtɝ"],
    ["participate", "pɑɹˈtɪsəˌpeɪt"], ["vacillate", "ˈvæsəˌɫeɪt"],
  ])("reduces the unaccented ci of %s", (word, expected) => {
    expect(engine.predict(word)).toBe(expected);
  });
  it.each(["anticipates", "anticipated", "anticipating", "anticipation", "decimating", "oscillated", "oscillation", "participating", "participation", "vacillates"])("retains the weak root in %s", (word) => {
    expect(engine.predict(word)).toMatch(/sə/);
  });
  it.each([
    ["anticipater", "ænˈtɪsəˌpeɪtɝ"], ["anticipatable", "ænˈtɪsəˌpeɪtəbəɫ"],
    ["decimater", "ˈdɛsəˌmeɪtɝ"], ["decimatable", "ˈdɛsəˌmeɪtəbəɫ"],
    ["oscillater", "ˈɑsəˌɫeɪtɝ"], ["oscillatable", "ˈɑsəˌɫeɪtəbəɫ"],
    ["participater", "pɑɹˈtɪsəˌpeɪtɝ"], ["participatable", "pɑɹˈtɪsəˌpeɪtəbəɫ"],
    ["vacillater", "ˈvæsəˌɫeɪtɝ"], ["vacillatable", "ˈvæsəˌɫeɪtəbəɫ"],
  ])("preserves the composed root after lexical eviction in %s", (word, expected) => {
    expect(engine.predict(word)).toBe(expected);
  });
  it.each([["tacit", "ˈtæsɪt"], ["fanciful", "ˈfænsɪfəɫ"]])("preserves the neighboring full KIT of %s", (word, expected) => {
    expect(engine.predict(word)).toBe(expected);
  });
  it("preserves the noun and adjective beside the target verb", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("They anticipate a fanciful plan.", { language: "en-US", returnArray: true });
    expect(tokens.find((token) => token.word === "anticipate")?.phoneme).toMatch(/sə/);
    expect(tokens.find((token) => token.word === "fanciful")?.phoneme).toBe("ˈfænsɪfəɫ");
    expect(tokens.find((token) => token.word === "plan")?.phoneme).toMatch(/pɫæn$/);
  });
});
it("preserves the earlier cid possessive control on the rule path", () => {
  expect(new EnglishG2P({ disableDict: true }).predict("placid's")).toBe("ˈpɫæsɪdz");
});
