import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("weak thematic y in final scientific nouns (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["oxygen", "ˈɑksədʒən"], ["oxygens", "ˈɑksədʒənz"], ["oxygen's", "ˈɑksədʒənz"],
    ["polymer", "ˈpɑɫəmɝ"], ["polymer's", "ˈpɑɫəmɝz"],
    ["analysis", "əˈnæɫəsəs"], ["anonymous", "əˈnɑnəməs"],
    ["hydrogen", "ˈhaɪdɹədʒən"], ["halogen", "ˈhæɫədʒən"],
    ["nitrogen", disableDict ? "ˈnɪtɹədʒən" : "ˈnaɪtɹədʒən"],
    ["polymeric", "pəɫiˈmɛɹɪk"], ["oxygenic", "əksiˈdʒɛnɪk"],
  ])("retains the thematic vowel or neighboring frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps h as a separate onset in opaque and unseen roots", () => {
    for (const word of ["Behymer", "dehymer", "rehymer"]) expect(engine.predict(word)).not.toContain("hə");
  });
  it("retains existing weak-vowel plural variants", () => {
    expect(engine.predict("polymers")).toMatch(/pɑɫ[əɪ]mɝz$/);
  });
  it("retains a complete root after source-target eviction in compounds", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["oxygen", "polymer"]) delete access.dictionary[word];
    expect(evicted.predict("oxygen")).toBe("ˈɑksədʒən");
    expect(evicted.predict("polymer")).toBe("ˈpɑɫəmɝ");
    expect(evicted.predict("trioxygen")).toContain("ɑksədʒən");
    expect(evicted.predict("biopolymer")).toContain("pɑɫəmɝ");
  });
  it("honors caller-owned roots in the word and a compound", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["oxygen", "polymer"]) delete access.dictionary[word];
    custom.addPronunciation("oxygen", "AA1 K S IY0 JH AH0 N");
    // A caller-supplied IPA lateral is preserved verbatim, without dictionary normalization.
    custom.addPronunciation("polymer", "ˈpɑɫimɝ");
    expect(custom.predict("oxygen")).toBe("ˈɑksidʒən");
    expect(custom.predict("trioxygen")).toContain("ɑksidʒən");
    expect(custom.predict("polymer")).toBe("ˈpɑɫimɝ");
    expect(custom.predict("biopolymer")).toContain("pɑɫimɝ");
  });
  it.each([["oxygen", "ˈɑksədʒən"], ["polymer", "ˈpɑɫəmɝ"]])(
    "retains noun, adjective and finite verb controls with %s", (word, ipa) => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize(`The clever reader will work with ${word}.`, { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    },
  );
});

it("preserves the existing default source reading of an opaque h-y name", () => {
  expect(new EnglishG2P().predict("Behymer")).toBe("ˈbɛˌhaɪmɝ");
});
