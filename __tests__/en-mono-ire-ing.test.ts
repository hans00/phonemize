import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("rule-derived unprefixed -ire before -ing (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["hiring", "ˈhaɪɹɪŋ"], ["tiring", "ˈtaɪɹɪŋ"], ["wiring", "ˈwaɪɹɪŋ"],
    ["hire", "ˈhaɪɝ"], ["tire", "ˈtaɪɝ"], ["wire", "ˈwaɪɝ"],
    ["fired", "ˈfaɪɝd"], ["wired", "ˈwaɪɝd"],
  ])("keeps the owned inflection or unaffected citation in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([
    ["requiring", "ɹiˈkwaɪɝɪŋ"], ["retiring", "ɹiˈtaɪɝɪŋ"],
    ["rewiring", "ɹiˈwaɪɝɪŋ"],
  ])("preserves the independently supplied longer root in %s", (word, ipa) => {
    expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("retains the unrelated agent's rhotic nucleus", () => {
    expect(engine.predict("lawyering")).toMatch(/ɝɪŋ$/);
  });
  it.each(["hire", "hir", "wire", "wir"])("preserves caller-owned %s", root => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.hiring;
    delete access.dictionary.wiring;
    custom.addPronunciation(root, "ˈhaɪɝ");
    expect(custom.predict(root.endsWith("e") ? root.slice(0, -1) + "ing" : root + "ing")).toBe("ˈhaɪɝɪŋ");
  });
  it("preserves prefix stress and adverbs after root eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["hiring", "tiring", "wiring"]) delete access.dictionary[word];
    expect(evicted.predict("nonhiring")).toBe("nɑnˈhaɪɹɪŋ");
    expect(evicted.predict("nonwiring")).toBe("nɑnˈwaɪɹɪŋ");
    expect(evicted.predict("overhiring")).toBe("ˈoʊvɝˌhaɪɹɪŋ");
    for (const [word, ipa] of [
      ["hiringly", "ˈhaɪɹɪŋɫi"], ["tiringly", "ˈtaɪɹɪŋɫi"], ["wiringly", "ˈwaɪɹɪŋɫi"],
    ]) expect(evicted.predict(word)).toBe(ipa);
  });
  it("preserves adjective, noun and verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The tiring reader will work on wiring.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "tiring")?.phoneme).toBe("ˈtaɪɹɪŋ");
    expect(tokens.find(t => t.word === "wiring")?.phoneme).toBe("ˈwaɪɹɪŋ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});
