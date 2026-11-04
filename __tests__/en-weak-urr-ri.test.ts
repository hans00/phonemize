import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak open ri after a rhotic stem (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test("preserves the written vowel and British rhotic boundary", () => {
    if (disableDict) {
      expect(engine.predict("hurricane", "en-US")).toBe("ˈhɝɪkeɪn");
      expect(engine.predict("hurricane", "en-GB")).toBe("ˈhɜːɹɪˌkeɪn");
      expect(engine.predict("scurrilous", "en-US")).toBe("ˈskɝɪɫəs");
      expect(engine.predict("scurrilous", "en-GB")).toBe("ˈskɜːɹɪɫəs");
      expect(engine.predict("burrie", "en-US")).toBe("ˈbɝɹi");
      expect(engine.predict("non-hurricane", "en-US")).toBe("nɑnˈhɝɪkeɪn");
      const us = engine.trace("hurricane", "en-US"), gb = engine.trace("hurricane", "en-GB");
      expect(us.steps).toContainEqual(expect.objectContaining({ grapheme: "r", phoneme: "" }));
      expect(gb.steps).toContainEqual(expect.objectContaining({ grapheme: "r", phoneme: "ɹ" }));
      const defaultGb = new EnglishG2P({ disableDict: true, dialect: "en-GB" });
      expect(defaultGb.trace("hurricane").steps).toContainEqual(expect.objectContaining({ grapheme: "r", phoneme: "ɹ" }));
    }
    expect(engine.predict("hurricanes", "en-US")).toBe("ˈhɝəˌkeɪnz");
    expect(engine.predict("current", "en-US")).toBe(disableDict ? "ˈkɝənt" : "kɝənt");
  });

  test("leaves a caller-owned root untouched", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("hurricane", "ˈhɝɹɪˌkeɪn");
    for (const lang of ["en-US", "en-GB"]) {
      expect(custom.predict("hurricane", lang)).toBe("ˈhɝɹɪˌkeɪn");
      expect(custom.predict("hurricane's", lang)).toBe("ˈhɝɹɪˌkeɪnz");
    }
  });

  test("keeps noun, adjective and verb positions in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const result = api.phonemize("The hurricane caused scurrilous reports as people hurry.", { language: "en-US" });
    expect(result).toContain(disableDict ? "ˈhɝɪkeɪn" : "ˈhɝəˌkeɪn");
    expect(result).toContain(disableDict ? "ˈskɝɪɫəs" : "ˈskɝəɫəs");
    expect(result).toContain("ˈhɝi");
  });
});
