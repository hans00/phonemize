import EnglishG2P from "../src/en/g2p";
import { syllableToIPA } from "../src/en/syllabify";

// MW independently attests GOAT in all four natural-word tails.
describe.each([false, true])("final sole nucleus, rules=%s", (disableDict) => {
  test.each([undefined, "N", "ADJ", "V"])("retains GOAT under caller POS %s", (pos) => {
    const engine = new EnglishG2P({ disableDict });
    for (const word of ["console", "camisole", "anisole", "levamisole", "vimssole"])
      expect(engine.predict(word, "en-US", pos)).toMatch(/soʊɫ$/);
  });

  test("preserves noun and independently attested verb controls", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("console", "en-US", "N")).toBe("ˈkɑnsoʊɫ");
    expect(engine.predict("console", "en-US", "V")).toBe("kənˈsoʊɫ");
    expect(engine.predict("consoled", "en-US", "V")).toBe("kənˈsoʊɫd");
    expect(engine.predict("consoling", "en-US", "V")).toBe("kənˈsoʊɫɪŋ");
  });

  test("composes the novel root through regular inflections", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("vimssoled", "en-US", "V")).toBe("ˈvɪmsoʊɫd");
    expect(engine.predict("vimssoling", "en-US", "V")).toBe("ˈvɪmsoʊɫɪŋ");
  });

  test("retains the owned root after lexical eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const stems = ["camisole", "anisole", "levamisole"];
    Object.defineProperty(engine, "dictionary", { value: {} });
    const normalize = (ipa: string | null) => (ipa ?? "").replace(/ˌ/g, "").replace(/ɫ/g, "l");
    for (const stem of stems) {
      const base = normalize(engine.predict(stem));
      expect(base).toMatch(/soʊl$/);
      expect(normalize(engine.predict(stem + "s"))).toBe(base + "z");
      expect(normalize(engine.predict(stem + "like"))).toBe(base + "laɪk");
    }
  });

  test("retains a caller-supplied root reading", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("vimssole", "ˈvɪmsəl");
    expect(engine.predict("vimssole")).toBe("ˈvɪmsəl");
  });
});

test("keeps neighboring weak rimes outside sole restoration", () => {
  for (const syllable of ["nole", "pole", "bole", "stole"])
    expect(syllableToIPA(syllable, 1, false, true)).not.toContain("oʊ");
  expect(syllableToIPA("sole", 1, true, true)).toBe("soʊl");
});
