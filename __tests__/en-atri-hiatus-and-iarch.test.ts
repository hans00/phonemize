import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge atrium /eɪ/; Collins patriarch /peɪtriɑrk/.
// https://dictionary.cambridge.org/dictionary/chinese-traditional-english/心房
// https://www.dictionary.com/browse/patriarch
describe.each([false, true])("stressed a before tri hiatus and Greek -iarch, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["atrium", "ˈeɪtɹiəm"],
    ["compatriot", "kəmˈpeɪtɹiət"],
    ["patriot", "ˈpeɪtɹiət"],
    ["patriarch", "ˈpeɪtɹiɑɹk"],
    ["patriarch's", "ˈpeɪtɹiɑɹks"],
    ["matriarch", "ˈmeɪtɹiɑɹk"],
    ["matriarchy", "ˈmeɪtɹiɑɹki"],
    ["patriarchy", "ˈpeɪtɹiɑɹki"],
    ["repatriate", "ɹiˈpeɪtɹieɪt"],
  ])("keeps root, derivation and inflection segments: %s", (word, ipa) => {
    expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("does not broaden into front-vowel or nonhiatus neighbors", () => {
    expect(engine.predict("patrie")).toMatch(/^ˈpæt/);
    expect(engine.predict("patrician")).toMatch(/ˈtɹɪ/);
    expect(engine.predict("matrimony")).toMatch(/^ˈmæt/);
    expect(engine.predict("matrix")).toBe("ˈmeɪtɹɪks");
    expect(engine.predict("search")).toBe("ˈsɝtʃ");
    expect(engine.predict("cornstarch")).toMatch(/stɑɹtʃ$/);
    expect(engine.predict("overarching")).toContain("ɑɹtʃ");
  });
  it("applies the spelling class to OOV forms and honors a caller target", () => {
    expect(engine.predict("zatrium")).toBe("ˈzeɪtɹiəm");
    expect(engine.predict("diarch")).toMatch(/ɑɹk$/);
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("zatrium", "ˈzɛŋ");
    expect(own.predict("zatrium")).toBe("ˈzɛŋ");
  });
  it("preserves surrounding noun, adjective and verb controls", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("They record a kind minder following the patriarch.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
    expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
    expect(tokens.find(t => t.word === "patriarch")?.phoneme.replace(/ˌ/g, "")).toBe("ˈpeɪtɹiɑɹk");
    if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
  });
});
