import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("bound -stance after prefixes (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["instance", "ˈɪnstəns"], ["instances", "ˈɪnstənsəz"],
    ["substance", "ˈsʌbstəns"], ["substances", "ˈsʌbstənsəz"],
    ["stance", "ˈstæns"], ["instant", "ˈɪnstənt"],
    ["distance", "ˈdɪstəns"], ["distanced", "ˈdɪstənst"], ["distancing", "ˈdɪstənsɪŋ"],
  ])("keeps the suffix or independent root in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains roots and prefix stress after exception eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["instance", "substance"]) delete access.dictionary[word];
    expect(evicted.predict("instance")).toBe("ˈɪnstəns");
    expect(evicted.predict("substance")).toBe("ˈsʌbstəns");
    expect(evicted.predict("noninstance")).toBe("nɑˈnɪnstəns");
    expect(evicted.predict("noninstances")).toBe("nɑˈnɪnstənsəz");
    expect(evicted.predict("nonsubstance")).toBe("nɑnˈsʌbstəns");
  });
  it("preserves caller-owned complete roots", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("instance", "ˈɪnstæns");
    expect(custom.predict("instance")).toBe("ˈɪnstæns");
    expect(custom.predict("noninstance")).toMatch(/ɪnstæns$/);
  });
  it("preserves adjective, noun and verb context in complete sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The instant reader will work with this substance, for instance.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "substance")?.phoneme).toBe("ˈsʌbstəns");
    expect(tokens.find(t => t.word === "instance")?.phoneme).toBe("ˈɪnstəns");
    expect(tokens.find(t => t.word === "instant")?.phoneme).toBe("ˈɪnstənt");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});
