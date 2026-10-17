import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge cosmic/seismic independently support these consonants.
describe.each([false, true])("Greek sm roots, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([["cosmic", "ˈkɑzmɪk"], ["seismic", "ˈsaɪzmɪk"],
    ["seismology", "ˌsaɪzˈmɑɫədʒi"], ["cosmically", "ˈkɑzmɪkɫi"], ["cosmetics", "kɑzˈmɛtɪks"]])("renders %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves native /sm/ in the neighboring root", () => {
    expect(engine.predict("cosmosbasement")).toMatch(/beɪsmənt$/);
    expect(engine.predict("seismicbasement")).toMatch(/baɪsmənt$/);
    expect(engine.predict("dismiss")).toBe("dɪsˈmɪs");
    expect(engine.predict("dismantle")).toBe("dɪˈsmæntəɫ");
    expect(engine.predict("basement")).toBe("ˈbeɪsmənt");
  });
  it("preserves caller literal clusters and child overrides", () => {
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("cosmic", "ˈkɑsmɪk");
    expect(own.predict("cosmically")).toBe("ˈkɑsmɪkɫi");
    own.addPronunciation("cosmically", "ˈzɛŋ");
    expect(own.predict("cosmically")).toBe("ˈzɛŋ");
    own.addPronunciation("issue", "ˈɪsʃu");
    expect(own.predict("issue")).toBe("ˈɪsʃu");
  });
  it("keeps noun, adjective and verb controls in the same sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const out = api.phonemize("The seismic reader read the notes yesterday.", {language: "en-US", returnArray: true});
    expect(out.find(token => token.word === "seismic")?.phoneme).toBe("ˈsaɪzmɪk");
    expect(out.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(out.find(token => token.word === "read")?.phoneme).toBe("ɹɛd");
  });
});

describe.each([false, true])("ex- root and coalesced geminate, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it("preserves the -ecute root before its -ution nominalization", () => {
    expect(engine.predict("execution")?.replace(/[ˈˌ]/g, "")).toBe("ɛksəkjuʃən");
    expect(engine.predict("executions")?.replace(/[ˈˌ]/g, "")).toBe("ɛksəkjuʃənz");
    expect(engine.predict("execute")).toBe("ˈɛksəkˌjut");
    expect(engine.predict("executive")).toBe("ɪɡˈzɛkjətɪv");
    expect(engine.predict("examination")).toBe("ɪɡˌzæməˈneɪʃən");
    expect(engine.predict("exemplary")).toMatch(/ɡ[ˈˌ]?z/);
  });
  it("coalesces the doubled fricative without crossing native boundaries", () => {
    expect(engine.predict("issue")).toBe("ˈɪʃu");
    expect(engine.predict("assure")).toBe("əˈʃʊɹ");
    expect(engine.predict("assurance")).toBe("əˈʃʊɹəns");
    if (disableDict) {
      expect(engine.predict("tissue")).toBe("ˈtɪʃu");
      expect(engine.predict("misshapen")).toContain("sʃ");
    }
  });
  it("keeps the correct onset after root eviction", () => {
    const own = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(own, "dictionary") };
    delete dictionary.seismology;
    Reflect.set(own, "dictionary", dictionary);
    expect(own.predict("seismology")).toBe("ˌsaɪzˈmɑɫədʒi");
  });
});
