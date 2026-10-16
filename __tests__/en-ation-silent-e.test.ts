import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Supplied silent-e roots before -ation (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  it.each([
    ["compilation", "ˌkɑmpəˈɫeɪʃən"], ["derivation", "ˌdɛɹəˈveɪʃən"],
    ["compilations", "ˌkɑmpəˈɫeɪʃənz"], ["derivations", "ˌdɛɹəˈveɪʃənz"],
    ["deprivation", "ˌdɛpɹəˈveɪʃən"],
  ])("keeps the noun's medial vowel in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it.each([
    ["examination", "ɪɡˌzæməˈneɪʃən"], ["imagination", "ɪˌmædʒəˈneɪʃən"],
    ["preservation", "ˌpɹɛzɝˈveɪʃən"], ["quotation", "ˌkwoʊˈteɪʃən"],
    ["inactivation", "ɪˌnæktɪˈveɪʃən"], ["univation", "ˌjunɪˈveɪʃən"],
    ["deprive", "dɪˈpɹaɪv"], ["deprived", "dɪˈpɹaɪvd"], ["depriving", "dɪˈpɹaɪvɪŋ"],
  ])("preserves neighboring root classes in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it("preserves the stem, verb and participial adjective in a full sentence", () => {
    const tokens = api.phonemize("We compile the compilation from compiled records.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "compile")?.phoneme).toBe("kəmˈpaɪɫ");
    expect(tokens.find(t => t.word === "compiled")?.phoneme).toBe("kəmˈpaɪɫd");
    expect(tokens.find(t => t.word === "compilation")?.phoneme).toBe("ˌkɑmpəˈɫeɪʃən");
  });

  it("keeps the verb's PRICE vowel in a paired derivation sentence", () => {
    const tokens = api.phonemize("They derive derivations from derived values.", {
      language: "en-US", returnArray: true,
    });
    for (const word of ["derive", "derived"]) {
      expect(tokens.find(t => t.word === word)?.phoneme).toMatch(/aɪv(?:d)?$/);
    }
    expect(tokens.find(t => t.word === "derivations")?.phoneme).toBe("ˌdɛɹəˈveɪʃənz");
  });

  it("uses the same noun frame for a supplied OOV prefixed root", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("recompile", "R IY0 K AH0 M P AY1 L");
    expect(custom.predict("recompilation")).toMatch(/mpəˈɫeɪʃən$/);
  });
});
