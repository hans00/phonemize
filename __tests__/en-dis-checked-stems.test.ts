import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("checked roots after dis- (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["dispatch", /^dɪ(?:ˈs|sˈ)pætʃ$/],
    ["distract", /^dɪ(?:ˈs|sˈ)tɹækt$/],
    ["distend", /^dɪ(?:ˈs|sˈ)tɛnd$/],
  ])("preserves the root vowel and stressed nucleus in %s", (word, ipa) => {
    // Both mark placements identify the same stressed root nucleus.
    expect(engine.predict(word)).toMatch(ipa);
  });
  it.each([
    ["dispack", "dɪsˈpæk"], ["dismesh", "dɪsˈmɛʃ"], ["discheck", "dɪsˈtʃɛk"],
    ["discount", "ˈdɪskaʊnt"], ["distant", "ˈdɪstənt"], ["legal", "ˈɫiɡəɫ"],
  ])("renders the class or preserves a neighboring frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains roots in inflections after exception eviction", () => {
    const fresh = new EnglishG2P({ disableDict });
    const access = fresh as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["dispatch", "dispatches", "dispatched", "dispatching", "distract", "distracts", "distracting"]) delete access.dictionary[word];
    for (const word of ["dispatch", "dispatches", "dispatched", "dispatching"]) expect(fresh.predict(word)).toMatch(/pætʃ/);
    for (const word of ["distract", "distracts", "distracting"]) expect(fresh.predict(word)).toMatch(/tɹækt/);
  });
  it("preserves noun, adjective and verb readings in connected prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The distant reader will dispatch the letter.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "distant")?.phoneme).toBe("ˈdɪstənt");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "dispatch")?.phoneme).toMatch(/^dɪ(?:ˈs|sˈ)pætʃ$/);
    const noun = api.phonemize("The dispatch was clear.", { language: "en-US", returnArray: true });
    expect(noun.find(t => t.word === "dispatch")?.phoneme).toMatch(/^dɪ(?:ˈs|sˈ)pætʃ$/);
  });
});
