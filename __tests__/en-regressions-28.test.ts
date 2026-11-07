// Original suite: en-wolf-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the <wol.f> rime", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["wolf", "ˈwʊɫf"],
      ["wolfish", "ˈwʊɫfɪʃ"],
      ["wolfishness", "ˈwʊɫfɪʃnəs"],
      ["wolfman", "ˈwʊɫfmən"],
      ["wolfram", "ˈwʊɫfɹəm"],
      ["wolf's", "ˈwʊɫfs"],
    ])("predicts the <wolf> root in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["wold", "ˈwoʊɫd"],
      ["golf", "ˈɡɑɫf"],
      ["wool", "ˈwʊɫ"],
      ["wood", "ˈwʊd"],
      ["woman", "ˈwʊmən"],
    ])("preserves the neighboring <wo>/<ol> rime in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-woman-plural.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the woman/women inflection changes the <wo> vowel", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      // Merriam-Webster gives /ˈwʊmən/ and plural /ˈwɪmən/.
      ["woman", "ˈwʊmən"],
      ["women", "ˈwɪmən"],
    ])("uses the inflection-supported reading in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["womanly", "ˈwʊmənɫi"],
      ["womanhood", "ˈwʊmənˌhʊd"],
      ["chairwoman", "ˈtʃɛɹˌwʊmən"],
      ["chairwomen", "ˈtʃɛɹˌwɪmən"],
      ["fireman", "ˈfɪɹɪmən"],
      ["firemen", "ˈfaɪɝˌmɛn"],
    ])("preserves the neighboring morphology in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps singular and plural readings in sentence context", () => {
      const api = createPhonemizer({ processors: [rules] });
      expect(api.phonemize("The woman spoke to the women.", { language: "en-US" })).toBe(
        "ðə ˈwʊmən spoʊk tə ðə ˈwɪmən.",
      );
    });

    it("leaves the shipped dictionary readings unchanged", () => {
      const g2p = new EnglishG2P();
      expect(g2p.predict("woman", "en-US")).toBe("ˈwʊmən");
      expect(g2p.predict("women", "en-US")).toBe("ˈwɪmən");
    });
  });

})();

// Original suite: en-word-analysis.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("compound alternatives from the actual dispatcher", () => {
    test("retains competing boundaries and the unsplit alternative", () => {
      const engine = new EnglishG2P({ disableDict: true });
      const result = engine.analyzeWord("castaway");
      expect(result.candidates[0]).toMatchObject({ kind: "unsplit" });
      const compounds = result.candidates.flatMap(c => c.kind === "compound" ? [c.evidence] : []);
      expect(compounds.map(c => [c.structure.left.spelling, c.structure.right.spelling])).toEqual([["cast", "away"], ["casta", "way"]]);
      expect(compounds.map(c => c.legacyScore)).toEqual([4, 3]);
      expect(engine.trace("castaway").structure).toEqual(compounds[0].structure);
      expect(result.actual.ipa).toBe(engine.predict("castaway"));
    });

    test.each(["automotive", "webpage", "hypersonic", "autoeurope", "autopacific"])("preserves the unsplit reading and does not choose by IPA plausibility: %s", word => {
      const engine = new EnglishG2P({ disableDict: true });
      const result = engine.analyzeWord(word);
      expect(result.actual.ipa).toBe(engine.predict(word));
      for (const candidate of result.candidates) {
        if (candidate.kind !== "compound") continue;
        const { left, right, boundary } = candidate.evidence.structure;
        expect(left.spelling + right.spelling).toBe(word);
        expect([left.start, left.end, right.start, right.end]).toEqual([0, left.spelling.length, left.spelling.length, word.length]);
        expect(boundary).toBe("unclassified");
      }
    });

    test("keeps an explicit whole-word selection separate from hypothetical composition", () => {
      const engine = new EnglishG2P();
      engine.addPronunciation("automotive", "ˌɔtəˈmoʊtɪv");
      const result = engine.analyzeWord("automotive");
      expect(result.actual).toEqual({ ipa: "ˌɔtəˈmoʊtɪv", route: "dictionary" });
      expect(result.candidates[0]).toMatchObject({ kind: "unsplit", componentIpa: "ˌɔtəˈmoʊtɪv", phonotactics: { status: "compatible" } });
      expect(result.candidates[1]).toMatchObject({ kind: "compound", evidence: { componentIpa: "ˌɔtəˈmoʊtɪv" }, phonotactics: { status: "compatible" } });
    });

    test("reports terminal whole-word guards instead of claiming exhaustive enumeration", () => {
      const engine = new EnglishG2P({ disableDict: true });
      expect(engine.analyzeWord("inquire")).toMatchObject({ status: "short-circuited", candidates: [{ kind: "unsplit" }] });
      expect(engine.trace("inquire").structure).toEqual({ kind: "opaque", route: "compound-dispatch-unsplit" });
    });

    test("uses current instance component overrides without mutating another instance", () => {
      const engine = new EnglishG2P({ disableDict: true });
      engine.addPronunciation("page", "P AA1 ZH");
      const candidate = engine.analyzeWord("webpage").candidates.find(c => c.kind === "compound");
      expect(candidate).toMatchObject({ evidence: { structure: { right: { componentIpa: "ˈpɑʒ" } } } });
      expect(new EnglishG2P({ disableDict: true }).predict("webpage")).not.toBe(engine.predict("webpage"));
    });

    test.each(["a", "O’Reilly", "two words"])("preserves the legacy reading and marks unsupported morphology: %s", word => {
      const engine = new EnglishG2P();
      expect(engine.analyzeWord(word)).toMatchObject({ status: "unsupported", candidates: [], actual: { ipa: engine.predict(word) } });
    });
    test.each(["", "a".repeat(65)])("rejects unbounded input before rendering: %s", word => {
      expect(() => new EnglishG2P().analyzeWord(word)).toThrow(RangeError);
    });
  });

})();

// Original suite: en-wound-participle.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  const phone = (sentence: string, word = "wound") => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word.toLowerCase() === word)?.phoneme;

  test.each([
    ["He had wound the cable around a reel.", "waʊnd"],
    ["She has wound up the clock.", "waʊnd"],
    ["The cable was wound around a reel.", "waʊnd"],
    ["The spirally-wound roller was replaced.", "waʊnd"],
    ["They have wound care supplies.", "wund"],
    ["He has wound care.", "wund"],
    ["The patient has wound infection.", "wund"],
    ["They will wound the guard.", "wund"],
    ["He had a wound on his arm.", "wund"],
    ["They wound the cord yesterday.", "waʊnd"],
  ])("selects the reading in %s", (sentence, expected) => {
    expect(phone(sentence)).toBe(expected);
  });

  test("retains another homograph's participle and caller-specified readings", () => {
    expect(phone("They have read books.", "read")).toBe("ɹɛd");
    expect(engine.predict("wound", "en-US", "V")).toBe("waʊnd");
    expect(engine.predict("wound", "en-US", "N")).toBe("wund");
    expect(phone("He wounds the animal.", "wounds")).toBe("wundz");
    expect(phone("The wounds are deep.", "wounds")).toBe("wundz");
  });

})();

// Original suite: en-wow-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the <w>ow spelling frame", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["wow", "ˈwaʊ"],
      ["wowie", "ˈwaʊi"],
    ])("uses MOUTH in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["wowed", "ˈwaʊd"],
      ["wowing", "ˈwaʊɪŋ"],
      ["wows", "ˈwaʊz"],
    ])("preserves the morphology route for %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
      expect(rules.trace(word, "en-US").path).toBe("morphology");
    });

    it.each([
      ["mow", "ˈmoʊ"],
      ["mowed", "ˈmoʊd"],
      ["mowing", "ˈmoʊɪŋ"],
      ["tow", "ˈtoʊ"],
      ["toward", "təˈwɔɹd"],
      ["low", "ˈɫoʊ"],
      ["lower", "ˈɫoʊɝ"],
      ["know", "ˈnoʊ"],
      ["snow", "ˈsnoʊ"],
      ["show", "ˈʃoʊ"],
      ["slow", "ˈsɫoʊ"],
    ])("keeps GOAT in neighboring %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["flower", "ˈfɫaʊɝ"],
      ["tower", "ˈtaʊɝ"],
      ["shower", "ˈʃaʊɝ"],
      ["glower", "ˈɡɫaʊɝ"],
    ])("uses MOUTH in the productive -ower frame: %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-x-final-inflections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("x-final stem inflections, rules=%s", disableDict => {
    test("keeps the root vowel in regular past and -ing forms", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["fixed", "ˈfɪkst"], ["mixed", "ˈmɪkst"], ["taxed", "ˈtækst"],
        ["faxed", "ˈfækst"], ["waxed", "ˈwækst"], ["maxed", "ˈmækst"],
        ["flexed", "ˈfɫɛkst"], ["vexed", "ˈvɛkst"],
        ["fixing", "ˈfɪksɪŋ"], ["taxing", "ˈtæksɪŋ"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });

    test("retains coda, multi-syllable and caller-owned controls", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("boxed")).toBe("ˈbɑkst");
      expect(engine.predict("relaxed")).toBe("ɹiˈɫækst");
      engine.addPronunciation("fix", "ˈtɛst");
      expect(engine.predict("fixed")).toBe("ˈtɛstɪd");
    });
  });

})();

// Original suite: en-xual-coalescence.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("velar-sibilant before ual, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["sexual", "ˈsɛkʃuəɫ"], ["sexually", "ˈsɛkʃuəɫi"],
      ["sexuals", "ˈsɛkʃuəɫz"], ["nonsexual", "nɑnˈsɛkʃuəɫ"],
    ])("coalesces the composed boundary in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves other onsets and the independently stressed derivative", () => {
      expect(engine.predict("annual")).toBe("ˈænjuəɫ");
      expect(engine.predict("gradual")).toBe("ˈɡɹædʒuəɫ");
      expect(engine.predict("sexuality")).toBe("ˌsɛkʃuˈæɫəti");
    });
    it("preserves the adjective and past-tense verb in a complete sentence", () => {
      const api = createPhonemizer({ processors: [engine] });
      const out = api.phonemize("The sexual therapist read the notes yesterday.", {
        language: "en-US", returnArray: true,
      });
      expect(out.find(t => t.word === "sexual")?.phoneme).toBe("ˈsɛkʃuəɫ");
      expect(out.find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
    });
    it("composes caller roots and respects explicit children", () => {
      const own = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(own, ["sexual"]);
      own.addPronunciation("sex", "ˈzɛks");
      expect(own.predict("sexual")).toBe("ˈzɛkʃuəɫ");
      own.addPronunciation("sexual", "ˈkɛŋ");
      expect(own.predict("sexual")).toBe("ˈkɛŋ");
    });
  });

})();

// Original suite: en-y-boundaries-and-rhotic-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { syllabify } = __suiteModule1;
  const __suiteModule2: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule2;

  describe.each([false, true])("y nuclei and rhotic a- roots (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["acrylic", "analytic", "catalytic", "hemolytic", "patronymic"])("%s stresses the nucleus before -ic", word => {
      expect(g2p.predict(word, "en")).toMatch(/ˈ[^aeiouɑæɛɪɔʊʌəɝ]*ɪ[^aeiouɑæɛɪɔʊʌəɝ]*ɪk$/);
    });
    test.each(["analyze", "catalyze", "hydrolyze", "acolyte", "enzyme", "genotype", "gigabyte", "stereotype"])("%s keeps the silent-e y diphthong", word => {
      expect(g2p.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/aɪ[^aeiouɑæɛɪɔʊʌəɝ]+$/);
    });
    test.each(["alarm", "alert", "apart"])("%s gives stress to its closed rhotic root", word => {
      expect(g2p.predict(word, "en")).toMatch(/^əˈ/);
    });
    test.each(["acid", "atom", "agent", "analyst"])("%s retains its noun stress", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ˈ/);
    });
    test("analysis retains its established suffix boundary and stress", () => {
      expect(g2p.predict("analysis", "en")).toMatch(/^əˈnæ/);
    });
    test("community retains its established suffix boundary and stress", () => {
      expect(g2p.predict("community", "en")).toMatch(/ˈmju/);
    });
    test.each(["baby", "copy"])("%s keeps its weak final y", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ˈ.*i$/);
    });
  });

  test.each([
    ["acrylic", ["a", "cry", "lic"]],
    ["analyze", ["a", "na", "ly", "ze"]],
    ["enzyme", ["en", "zy", "me"]],
    ["analysis", ["a", "naly", "sis"]],
    ["community", ["com", "mu", "nity"]],
  ] as const)("%s exposes the nucleus boundary used for stress", (word, slots) => {
    expect(syllabify(word)).toEqual(slots);
    expect(syllabify(word.toUpperCase())).toEqual(slots);
  });

  test.each(["Acrylic", "enzyme", "catalyze"])("public API preserves the %s nucleus", word => {
    expect(toIPA(word)).toMatch(word === "Acrylic" ? /kɹɪ/ : /aɪ/);
  });

})();

// Original suite: en-y-nasal-coda.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;
  // Cambridge: https://dictionary.cambridge.org/us/pronunciation/english/hymn
  // Keep the nasal spelling available to the shared coda rules.
  test.each([false, true])("keeps nasal codas after y (rules=%s)", disableDict => {
    const e = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(e, "dictionary") };
    for (const w of ["hymn", "hymns", "hymned", "hymning"]) delete dictionary[w];
    Reflect.set(e, "dictionary", dictionary);
    for (const [word, ipa] of [["hymn", "ˈhɪm"], ["hymns", "ˈhɪmz"], ["hymned", "ˈhɪmd"], ["hymning", "ˈhɪmɪŋ"], ["gym", "ˈdʒɪm"], ["symbol", "ˈsɪmbəl"], ["cymbal", "ˈsɪmbəl"], ["nymph", "ˈnɪmf"], ["lynx", "ˈlɪŋks"]]) {
      expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
    }
    const api = createPhonemizer({ processors: [e] });
    for (const sentence of ["The hymn was short.", "They hymn the dawn.", "The short hymn ended."]) {
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "hymn")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("hɪm");
    }
  });
  test("preserves caller nasal codas and lexical derivations", () => {
    const e = new EnglishG2P();
    expect(parseIpa(e.predict("hymnal")!)).toEqual(parseIpa("ˈhɪmnəl"));
    e.addPronunciation("hymn", "ˈhɪmn");
    expect(e.predict("hymn")).toBe("ˈhɪmn");
    expect(e.predict("hymns")).toBe("ˈhɪmnz");
  });

})();

// Original suite: en-ye-inflection.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("vowel-final ye inflections (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word.toLowerCase() === word)?.phoneme;

    test.each([
      ["eyed", "ˈaɪd"], ["eyeing", "ˈaɪɪŋ"], ["eyes", "ˈaɪz"],
      ["dyed", "ˈdaɪd"], ["dyeing", "ˈdaɪɪŋ"],
      ["greyed", "ˈɡɹeɪd"], ["obeyed", "oʊˈbeɪd"], ["preyed", "ˈpɹeɪd"],
      ["prettying", "ˈpɹɪtiɪŋ"], ["prettied", "ˈpɹɪtid"], ["hying", "ˈhaɪɪŋ"],
    ])("preserves the vowel and ending in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    test("keeps the verb, passive and noun readings in sentences", () => {
      expect(phone("They eyed the prize.", "eyed")).toBe("aɪd");
      expect(phone("The dye was eyed by the artist.", "eyed")).toBe("aɪd");
      expect(phone("Greyed hair framed the eye.", "eye")).toBe("aɪ");
      expect(phone("Greyed hair framed the eye.", "greyed")).toBe("ɡɹeɪd");
    });
  });

  test("a supplied vowel-final root survives regular inflection", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("eye", "ˈzi");
    expect(engine.predict("eyed", "en-US")).toBe("ˈzid");
    expect(engine.predict("eyeing", "en-US")).toBe("ˈziɪŋ");
    expect(engine.predict("eyes", "en-US")).toBe("ˈziz");
  });

})();

// Original suite: en-yod-coda-ownership.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("closed-coda stem yod (disableDict=%s)", disableDict => {
    test("retains dialect through recursive stem composition", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("tubeless", "en-US")).toBe("ˈtubɫəs");
      expect(engine.predict("tubeless", "en-GB")).toBe("ˈtjubɫəs");
      expect(engine.predict("tubelessness", "en-US")).toBe("ˈtubɫəsnəs");
      expect(engine.predict("tubelessness", "en-GB")).toBe("ˈtjubɫəsnəs");
      expect(engine.predict("non-tubeless", "en-GB")).toBe("nɑnˈtjubɫəs");
      expect(engine.predict("tubes", "en-US", "N")).toBe("tubz");
      expect(engine.predict("tubes", "en-GB", "N")).toBe("tjubz");
    });

    test.each(["ˈtub", "ˈtjub"])("preserves caller-owned stem %s in both dialects", pronunciation => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("tube", pronunciation);
      for (const dialect of ["en-US", "en-GB"]) {
        expect(engine.predict("tubes", dialect)).toBe(pronunciation + "z");
        expect(engine.predict("tubeless", dialect)).toBe(pronunciation + "ɫəs");
        expect(engine.predict("tubelessness", dialect)).toBe(pronunciation + "ɫəsnəs");
      }
    });

    test("preserves the sentence's noun, adjective and verb controls", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const result = api.phonemize("The clear tubes carry water.", { language: "en-US" });
      expect(result).toContain("tubz");
      expect(result).not.toContain("tjubz");
    });
  });

})();

// Original suite: en-zine-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the multisyllabic final -zine rime", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const stripStress = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

    it.each([
      ["benzine", "bɛnzin"],
      ["hydrazine", "haɪdɹəzin"],
      ["magazine", "mæɡəzin"],
    ])("uses /i/ in the final -zine rime of %s", (word, phones) => {
      expect(stripStress(rules.predict(word, "en-US")!)).toBe(phones);
    });

    it("keeps the PRICE vowel in one-syllable zine", () => {
      expect(rules.predict("zine", "en-US")).toBe("ˈzaɪn");
    });

    it.each(["line", "airline", "baseline", "deadline", "decline"])(
      "does not change the unrelated -ine rime in %s",
      word => expect(rules.predict(word, "en-US")).not.toContain("zin"),
    );
  });

})();

// Original suite: en-zzes-inflection.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("double-z plural and 3sg suffix", () => {
    it.each([
      ["quiz", "quizzes", "ˈkwɪz", "ˈkwɪzɪz"],
      ["whizz", "whizzes", "ˈhwɪz", "ˈhwɪzɪz"],
      ["buzz", "buzzes", "ˈbʌz", "ˈbʌzɪz"],
      ["fizz", "fizzes", "ˈfɪz", "ˈfɪzɪz"],
      ["fuzz", "fuzzes", "ˈfʌz", "ˈfʌzɪz"],
      ["jazz", "jazzes", "ˈdʒæz", "ˈdʒæzɪz"],
    ])("composes %s + -es from the root and regular sibilant allomorph", (root, form, rootIPA, formIPA) => {
      const g2p = new EnglishG2P({ disableDict: true });
      expect(g2p.predict(root, "en-US")).toBe(rootIPA);
      expect(g2p.trace(form, "en-US").path).toBe("morphology");
      expect(g2p.predict(form, "en-US")).toBe(formIPA);
      expect(g2p.predict(form, "en-US", "V")).toBe(formIPA);
    });

    it("keeps the suffix pronunciation through full sentence tokenization", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
      const tokens = phonemizer.phonemize(
        "The quizzes were difficult. The beehive buzzes loudly. She whizzes past.",
        { language: "en-US", returnArray: true },
      );
      const outputs = tokens.map(token => [token.word.toLowerCase(), token.phoneme] as const);
      expect(outputs.filter(([word]) => ["quizzes", "buzzes", "whizzes"].includes(word))).toEqual([
        ["quizzes", "ˈkwɪzɪz"], ["buzzes", "ˈbʌzɪz"], ["whizzes", "ˈhwɪzɪz"],
      ]);
    });

    it.each([
      ["uses", "ˈjusəz"], ["cases", "ˈkeɪsəz"], ["buses", "ˈbʌsəz"],
      ["gases", "ˈɡæsəz"], ["dishes", "ˈdɪʃəz"], ["boxes", "ˈbɑksəz"],
    ])("leaves the neighboring -es class unchanged for %s", (word, expected) => {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(expected);
    });
  });

})();
