import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("short rhotic e roots (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["carpet", "ˈkɑɹpət"], ["harvest", "ˈhɑɹvəst"],
    ["carmen", "ˈkɑɹmən"], ["sherbet", "ˈʃɝbət"],
    ["worsening", "ˈwɝsənɪŋ"], ["darkening", "ˈdɑɹkənɪŋ"],
    // Collins US bird reading: https://www.collinsdictionary.com/dictionary/english/barbet
    ["barbet", "ˈbɑɹbət"],
    ["pet", "ˈpɛt"], ["vest", "ˈvɛst"],
    ["barbell", "ˈbɑɹˌbɛɫ"], ["hairnet", "ˈhɛɹˌnɛt"], ["warhead", "ˈwɔɹˌhɛd"],
    ["martech", "ˈmɑɹˌtɛk"], ["spartech", "ˈspɑɹˌtɛk"],
    ["stardent", "ˈstɑɹˌdɛnt"], ["parsec", "ˈpɑɹˌsɛk"],
  ])("keeps the whole root or true compound in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps the independent directional tail full", () => {
    expect(engine.predict("farwest")?.replace(/[ˈˌ]/g, "")).toBe("fɑɹwɛst");
  });
  it("retains prefix, agent and plural readings after exception eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["carpet", "carmen", "harvest", "sherbet"]) delete access.dictionary[word];
    for (const [word, ipa] of [
      ["carpet", "ˈkɑɹpət"], ["harvest", "ˈhɑɹvəst"], ["carpets", "ˈkɑɹpəts"],
      ["harvester", "ˈhɑɹvəstɝ"], ["harvesters", "ˈhɑɹvəstɝz"],
      ["noncarpet", "nɑnˈkɑɹpət"], ["nonharvest", "nɑnˈhɑɹvəst"],
    ]) expect(evicted.predict(word)).toBe(ipa);
    expect(evicted.predict("carpeted")).toContain("kɑɹpət");
    expect(evicted.predict("harvested")).toContain("hɑɹvəst");
  });
  it("preserves caller-owned complete roots", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("carpet", "ˈkɑɹpɛt");
    expect(custom.predict("carpet")).toBe("ˈkɑɹpɛt");
    expect(custom.predict("noncarpet")).toMatch(/pɛt$/);
  });
  it("preserves noun, adjective and finite verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will harvest beside the carpet.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "harvest")?.phoneme).toBe("ˈhɑɹvəst");
    expect(tokens.find(t => t.word === "carpet")?.phoneme).toBe("ˈkɑɹpət");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
  });
});
