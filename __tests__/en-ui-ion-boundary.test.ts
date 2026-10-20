import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("ui before -ition (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["fruition", "fɹuˈɪʃən"],
    ["intuition", "ˌɪntuˈɪʃən"],
    ["intuitions", "ˌɪntuˈɪʃənz"],
    ["fruition's", "fɹuˈɪʃənz"],
  ])("keeps both nuclei and suffix stress in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["tuition", "tuitional", "intuitional", "intuitionism"])("keeps the hiatus in %s", word => {
    expect(engine.predict(word)).toMatch(/uˈɪʃ/);
  });
  it.each([
    ["fruit", "ˈfɹut"], ["fruity", "ˈfɹuti"], ["fruiting", "ˈfɹutɪŋ"],
    ["suit", "ˈsut"], ["cruise", "ˈkɹuz"],
    ["disquisition", "ˌdɪskwɪˈzɪʃən"],
  ])("preserves the unaffected frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("uses the standard weak acquisition vowel on both routes", () => {
    expect(engine.predict("acquisition")).toBe("ˌækwəˈzɪʃən");
  });
  it("preserves supplied roots and complete noun/adjective/verb context", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("fruition", "fɹuˈɪʃən");
    expect(custom.predict("fruition")).toBe("fɹuˈɪʃən");
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work toward fruition.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "fruition")?.phoneme).toBe("fɹuˈɪʃən");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});
