import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("rhotic ou before soft g (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["encourage", "ɛnˈkɝɪdʒ"],
    ["discourage", "dɪˈskɝɪdʒ"],
    ["courageous", "kɝˈeɪdʒəs"], ["scourge", "ˈskɝdʒ"],
  ])("retains the NURSE vowel and root stress in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["courage", "encouraged", "encouraging", "encouragement", "discouraged", "discouraging", "discouragement", "courageously", "uncourageous"])("retains the owned root rime in %s", word => {
    expect(engine.predict(word)).toMatch(/kɝ/);
    expect(engine.predict(word)).not.toMatch(/aʊ/);
  });
  it.each([
    ["scour", "ˈskaʊɝ"], ["scouring", "ˈskaʊɝɪŋ"], ["sour", "ˈsaʊɝ"],
    ["souring", "ˈsaʊɝɪŋ"], ["tour", "ˈtʊɹ"], ["touring", "ˈtʊɹɪŋ"],
    ["advantageous", "ˌædvənˈteɪdʒəs"], ["contagious", "kənˈteɪdʒəs"], ["outrageous", "aʊˈtɹeɪdʒəs"],
    ["court", "ˈkɔɹt"], ["course", "ˈkɔɹs"], ["forge", "ˈfɔɹdʒ"], ["tiger", "ˈtaɪɡɝ"],
  ])("preserves an unaffected rime in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves the root after lexical eviction", () => {
    const fresh = new EnglishG2P({ disableDict });
    const access = fresh as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const w of ["encourage", "encourages", "encouraged", "encouraging", "encouragement"]) delete access.dictionary[w];
    for (const w of ["encourage", "encourages", "encouraged", "encouraging", "encouragement"]) expect(fresh.predict(w)).toMatch(/kɝ/);
  });
  it("preserves the full vowel of a Greek root before plural s", () => {
    expect(engine.predict("macrophages")).toMatch(/feɪdʒ[əɪ]z$/);
    expect(engine.predict("phages")).toMatch(/feɪdʒ[əɪ]z$/);
  });
  it("retains the weak syllable in an evicted third-person verb", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("This encourages the exchange of many new ideas.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "encourages")?.phoneme).toBe("ɛnˈkɝɪdʒəz");
  });
  it("preserves full-sentence noun, adjective and verb controls", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The courageous reader will encourage the clever child against the scourge.", { language: "en-US", returnArray: true });
    for (const [word, ipa] of [["courageous", "kɝˈeɪdʒəs"], ["scourge", "skɝdʒ"], ["reader", "ˈɹidɝ"], ["encourage", "ɛnˈkɝɪdʒ"], ["clever", "ˈkɫɛvɝ"]]) expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
