import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge: arrowhead, spearhead, grandparent and wetlands pronunciations.
// https://dictionary.cambridge.org/us/pronunciation/english/arrowhead
// https://dictionary.cambridge.org/pronunciation/english/spearhead
// https://dictionary.cambridge.org/us/pronunciation/english/grandparent
// https://dictionary.cambridge.org/pronunciation/english/wetlands
describe.each([false, true])("compound plural boundaries, disableDict=%s", disableDict => {
  test("retains complete compound roots and caller readings", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(engine.predict("arrowheads", "en-US", pos)).toBe("ˈæɹoʊˌhɛdz");
      expect(engine.predict("spearheads", "en-US", pos)).toBe("ˈspɪɹˌhɛdz");
      expect(engine.predict("networks", "en-US", pos)).toBe("ˈnɛtˌwɝks");
      expect(engine.predict("wetlands", "en-US", pos)).toBe("ˈwɛtɫəndz");
      expect(engine.predict("comedies", "en-US", pos)).toBe("ˈkɑmədiz");
      expect(engine.predict("frogmouths", "en-US", pos)).toBe("ˈfɹɑɡˌmaʊðz");
      expect(engine.predict("limpets", "en-US", pos)).toBe("ˈɫɪmpəts");
    }
    engine.addPronunciation("arrowhead", "ˈzi");
    expect(engine.predict("arrowheads")).toBe("ˈziz");
    engine.addPronunciation("network", "ˈzæp");
    expect(engine.predict("networks")).toBe("ˈzæps");
    expect(engine.predict("protests", "en-US", "N")).toBe("ˈpɹoʊˌtɛsts");
    expect(engine.predict("protests", "en-US", "V")).toBe("pɹəˈtɛsts");
  });

  test("keeps noun, adjective and verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, expected] of [
      ["The arrowheads are sharp.", "arrowheads", "ˈæɹoʊˌhɛdz"],
      ["She spearheads the project.", "spearheads", "ˈspɪɹˌhɛdz"],
      ["The wetlands are beautiful.", "wetlands", "ˈwɛtɫəndz"],
      ["A newborn baby sleeps.", "newborn", "ˈnuˌbɔɹn"],
      ["She outperforms the team.", "outperforms", disableDict ? "aʊtˈpɝfɔɹmz" : "ˌaʊtpɝˈfɔɹmz"],
      ["The protests continue.", "protests", "ˈpɹoʊˌtɛsts"],
      ["She protests the decision.", "protests", "pɹəˈtɛsts"],
      ["Their grandparents' house is old.", "grandparents'", "ˈɡɹændˌpɛɹənts"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)?.phoneme).toBe(expected);
  });
});
