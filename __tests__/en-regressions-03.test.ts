// Original suite: en-bare-are-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("bare -are rime (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it("uses the strong AmE /ɑr/ only with no onset", () => {
      expect(engine.predict("are")).toBe("ˈɑɹ");
      if (disableDict) expect(engine.trace("are").path).toBe("rules");
    });

    it.each([
      ["care", "ˈkɛɹ"], ["bare", "ˈbɛɹ"], ["share", "ˈʃɛɹ"],
      ["prepare", "pɹiˈpɛɹ"], ["compare", "kəmˈpɛɹ"], ["square", "ˈskwɛɹ"],
    ])("preserves the onset-conditioned SQUARE in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it("keeps the full sentence reading distinct from onset-bearing rimes", () => {
      const phonemizer = createPhonemizer({ processors: [engine] });
      const tokens = phonemizer.phonemize("We are ready, and we care.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(token => token.word === "are")?.phoneme).toBe("ɑɹ");
      expect(tokens.find(token => token.word === "care")?.phoneme).toBe("kɛɹ");
    });
  });

})();

// Original suite: en-bare-nominal-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  it("uses a clause-initial plural subject with a bare nominal object", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const sentence = "Contractors extract tens of thousands of samples from the area.";
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "extract")?.phoneme).toBe("ɪkˈstɹækt");
    const tagger = new SimplePOSTagger();
    for (const verb of ["extract", "permit", "record"]) {
      const words = ["Contractors", verb, "tens", "of", "samples", "."];
      expect(tagger.tagWord(verb, ["Contractors", "tens"], { words, index: 1 }).pos).toBe("V");
    }
  });
  it("preserves adjective and noun objects following a finite s verb", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const [sentence, word, ipa] of [
      ["The method yields approximate values of the unknowns.", "approximate", "əˈpɹɑksəmət"],
      ["The machine automatically invites appropriate users to answer questions.", "appropriate", "əˈpɹoʊpɹiət"],
      ["The procedure replaces duplicate individuals in the population.", "duplicate", "ˈdupɫəkət"],
      ["The Indian diaspora includes expatriate residents of France.", "expatriate", "ɛkˈspeɪtɹiət"],
      ["The reaction involves conjugate additions of enolates.", "conjugate", "ˈkɑndʒəɡət"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-base-form-s-inflection.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  // Existing reading metadata distinguishes the base from same-spelled past.
  test.each([false, true])("uses a base-form stem before s (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const w of ["read", "reads"]) delete dictionary[w];
   Reflect.set(e, "dictionary", dictionary);
   expect(e.predict("reads")).toMatch(/ɹidz$/);
   const api = createPhonemizer({ processors: [e] });
   const mixed = api.phonemize("She reads the book, but they read it yesterday.", { language: "en-US", returnArray: true });
   expect(mixed.find(t => t.word === "reads")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("ɹidz");
   expect(mixed.find(t => t.word === "read")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("ɹɛd");
   for (const [sentence, word, reading] of [["The student reads each book.", "reads", "ɹidz"], ["The three reads were enough.", "reads", "ɹidz"], ["They read books yesterday.", "read", "ɹɛd"]]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/[ˈˌ]/g, "")).toBe(reading);
   // Uninflected present read remains a pre-existing error on the rules path.
   if (!disableDict) for (const sentence of ["They read books every day.", "The unit has a read bus."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("ɹid");
   expect(e.predict("uses", "en-US", "N")).toMatch(/s[ɪə]z$/);
   expect(e.predict("uses", "en-US", "V")).toMatch(/z[ɪə]z$/);
  });
  test("keeps caller ownership of an inflected temporal homograph", () => {
   const e = new EnglishG2P({ disableDict: true });
   e.addPronunciation("read", "ˈɹɛd");
   expect(e.predict("reads")).toBe("ˈɹɛdz");
   e.addPronunciation("reads", "ˈtɛst");
   expect(e.predict("reads")).toBe("ˈtɛst");
  });

})();

// Original suite: en-be-prefix-silent-e-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak be- before an independently vouched silent-e root", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const ipa = (word: string) => rules.predict(word, "en-US");

    it.each([
      ["become", "bɪˈkʌm"],
      ["behave", "bɪˈheɪv"],
    ])("keeps root stress in supported form %s", (word, expected) => {
      expect(ipa(word)).toBe(expected);
    });

    it.each([
      ["beneke", "ˈbɛnək"],
      ["benites", "ˈbɛnaɪts"],
      ["berube", "ˈbɛɹub"],
      ["beside", "ˈbɛsaɪd"],
      ["betake", "ˈbɛteɪk"],
      ["betide", "ˈbɛtaɪd"],
      ["berate", "ˈbɛɹeɪt"],
      ["bespoke", "ˈbɛspoʊk"],
      ["bestrode", "ˈbɛstɹoʊd"],
    ])("does not infer a be- prefix in unsupported form %s", (word, expected) => {
      expect(ipa(word)).toBe(expected);
    });

    it.each([
      ["before", "bɪˈfɔɹ"],
      ["believe", "bɪˈɫiv"],
      ["betray", "bɪˈtɹeɪ"],
      ["bestow", "bɪˈstoʊ"],
      ["bedazzle", "bɪˈdæzəɫ"],
    ])("preserves the existing frame of %s", (word, expected) => {
      expect(ipa(word)).toBe(expected);
    });
  });

})();

// Original suite: en-between-reference.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  describe("Cambridge US between reference", () => {
    it("uses the same /ɪ/ root vowel in between and its regular plural", () => {
      for (const disableDict of [false, true]) {
        const g2p = new EnG2P({ disableDict });
        expect(g2p.predict("between", "en-US")).toBe("bɪˈtwin");
        expect(g2p.predict("betweens", "en-US")).toBe("bɪˈtwinz");
      }
    });
  });

})();

// Original suite: en-bio-secondary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("secondary-stressed bio- retains its combining vowel", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/biomaterial
      ["biomaterial", "ˌbaɪoʊməˈtɪɹiəɫ"],
      // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/biodiversity
      ["biodiversity", "ˌbaɪoʊdɪˈvɝsəti"],
      ["biochemistry", "ˈbaɪoʊtʃəmɪstɹi"],
    ])("keeps the combining vowel in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["biology", "ˌbaɪˈɑɫədʒi"],
      ["biography", "baɪˈɑɡɹəfi"],
      ["biological", "baɪəˈɫɑdʒɪkəɫ"],
      ["biomedical", "baɪəˈmɛdɪkəɫ"],
      ["biopic", "baɪˈɑpɪk"],
    ])("preserves the separate vowel pattern in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("keeps secondary bio- vowels in sentence context", () => {

      const tokens = englishTokens(rules, "The biomaterial protects biodiversity while biology studies living systems.");
      expect(tokens.find(token => token.word === "biomaterial")?.phoneme).toBe("ˌbaɪoʊməˈtɪɹiəɫ");
      expect(tokens.find(token => token.word === "biodiversity")?.phoneme).toBe("ˌbaɪoʊdɪˈvɝsəti");
      expect(tokens.find(token => token.word === "biology")?.phoneme).toBe("ˌbaɪˈɑɫədʒi");
    });
  });

})();

// Original suite: en-bound-a-meter.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("bound a+meter, rules=%s", disableDict => {
    const evicted = (...words: string[]) => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of words) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      return engine;
    };
    it.each([
      ["parameter", "pɝˈæmətɝ"], ["parameters", "pɝˈæmətɝz"],
      ["nonparameter", "nɑnpɝˈæmətɝ"], ["counterparameter", "kaʊntɝpɝˈæmətɝ"],
      ["pentameter", "pɛnˈtæmətɝ"], ["nanometer", "ˈnænoʊmitɝ"],
      ["thermometer", "θɝˈmɑmətɝ"],
    ])("keeps the bound and productive measurement frames: %s", (word, ipa) => {
      expect(evicted("parameter", "parameters").predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("preserves a caller-owned measurement tail and complete target", () => {
      const engine = evicted("parameter");
      engine.addPronunciation("meter", "ˈkɛmp");
      expect(engine.predict("parameter")).toMatch(/kɛmp$/);
      engine.addPronunciation("parameter", "ˈzɛmp");
      expect(engine.predict("parameter")).toBe("ˈzɛmp");
    });
    it.each([
      ["The parameter was clear.", "parameter", "pɝˈæmətɝ"],
      ["The parameter settings changed.", "parameter", "pɝˈæmətɝ"],
    ])("preserves noun/adjective/verb sentence controls: %s", (sentence, word, ipa) => {
      const api = createPhonemizer({ processors: [evicted(word)] });
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-bound-ary-and-ute.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("bound Latin suffix stress (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("long mentary adjectives own their root primary through suffixing", () => {
      for (const word of ["documentary", "documentaries", "documentaryness", "supplementary", "supplementaryness", "complementary", "complimentary"])
        expect(g2p.predict(word)).toContain("ˈmɛn");
      for (const word of ["commentary", "fragmentary", "momentary", "legendary", "planetary", "cometary"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
    });

    test("secute and stitute keep their retracted primary through inflection", () => {
      for (const word of ["execute", "executes", "executed", "executing", "executer", "executers", "executable"])
        expect(g2p.predict(word)).toMatch(/^ˈɛks/);
      expect((g2p.predict("executability") ?? "").replace(/[ˈˌ]/g, "")).toMatch(/^ɛksəkjutə/);
      for (const word of ["constitute", "constitutes", "constituted", "constituting", "constituter", "constituters"])
        expect(g2p.predict(word)).toMatch(/^ˈkɑn/);
      for (const word of ["institute", "institutes", "instituted", "instituting"])
        expect(g2p.predict(word)).toMatch(/^ˈɪn/);
      for (const word of ["substitute", "substitutes", "substituted", "substituting"])
        expect(g2p.predict(word)).toMatch(/^ˈs[ʌə]b/);
      for (const word of ["prosecute", "prosecutes", "prosecuted", "prosecuting", "prosecuter", "prosecuters"])
        expect(g2p.predict(word)).toMatch(/^ˈpɹɑ/);
    });

    test("stress-bearing derivational endings retain their own primary", () => {
      expect(g2p.predict("executive")).toContain("ˈzɛ");
      expect(g2p.predict("execution")).toMatch(/(?:ˈkj|kˈj)u/);
      expect(g2p.predict("constitution")).toContain("ˈtu");
      expect(g2p.predict("substitution")).toContain("ˈtu");
      expect(g2p.predict("institution")).toContain("ˈtu");
      expect(g2p.predict("prosecution")).toMatch(/(?:ˈkj|kˈj)u/);
    });

    test("other ex roots retain voicing before their own stressed vowel", () => {
      for (const word of ["exude", "exuded", "exuding", "examine", "examined", "examining", "exact"])
        expect(g2p.predict(word)).toContain("ɡˈz");
    });
  });

  test("rules-only keeps the Cambridge US weak vowel in -stitution forms", () => {
    const rules = new EnglishG2P({ disableDict: true });
    // Cambridge US lists /ə/ in these entries; the pinned IPA-Dict gold for
    // institution instead has /ɪ/, so do not turn that reference mismatch into
    // a broad runtime rule.
    expect(rules.predict("institution")).toBe("ˌɪnstəˈtuʃən");
    expect(rules.predict("constitution")).toBe("ˌkɑnstəˈtuʃən");
    expect(rules.predict("substitution")).toBe("ˌsʌbstəˈtuʃən");
  });

})();

// Original suite: en-bound-bol.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("bound Greek bol (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("longer bound roots keep the derivative's antepenultimate stress", () => {
      for (const word of ["metabolism", "metabolisms", "metabolize", "metabolizes", "metabolized", "metabolizing", "catabolism", "catabolize", "anabolism", "anabolize"])
        expect(g2p.predict(word)).toMatch(/ˈtæbə|ˈnæbə/);
    });

    test("productive plurals and agent nouns keep the corrected derivative after eviction", () => {
      for (const word of ["metabolisms", "catabolisms", "anabolisms"])
        expect(g2p.predict(word)).toMatch(/ˌ?ɫɪzəmz$/);
      for (const word of ["metabolizes", "catabolizes", "anabolizes", "metabolizer", "metabolizers", "catabolizer", "catabolizers"])
        expect(g2p.predict(word)).toMatch(/ˈ[tn]æbəˌ?ɫaɪz/);
    });

    test("short noun roots and stress-bearing ic keep their own frame", () => {
      for (const word of ["symbolism", "symbolize", "symbolized", "symbolizing"])
        expect(g2p.predict(word)).toMatch(/^ˈsɪm/);
      expect(g2p.predict("embolism")).toMatch(/^ˈɛm/);
      expect(g2p.predict("metabolic")).toContain("ˈbɑ");
      expect(g2p.predict("anabolic")).toContain("ˈbɑ");
      expect(g2p.predict("hyperbolic")).toContain("ˈbɑ");
    });
  });

})();

// Original suite: en-bound-ean-and-like.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("bound hiatus and neutral likeness (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");

    test("back-vowel and doubled-onset ean retain separate final nuclei", () => {
      for (const word of ["european", "europeans", "caribbean", "caribbeans", "korean", "koreans", "boolean", "booleans"])
        expect(segments(word)).toMatch(/iənz?$/);
      for (const word of ["european", "europeans", "cyclopean", "cyclopeans"])
        expect(g2p.predict(word)).toContain("ˈpiən");
    });

    test("rhotic ean keeps primary on the preceding root syllable", () => {
      for (const word of ["pythagorean", "pythagoreans", "hyperborean", "hyperboreans", "singaporean", "singaporeans"])
        expect(g2p.predict(word)).toMatch(/ˈ[^ˈˌ]*ɔɹiən/);
    });

    test("anean keeps its preceding FACE nucleus", () => {
      for (const word of ["mediterranean", "mediterraneans", "subterranean", "subterraneans"])
        expect(g2p.predict(word)).toMatch(/ˈɹ?eɪniən/);
    });

    test("native ea digraphs and bean compounds stay single nuclei", () => {
      for (const word of ["demean", "demeans", "clean", "cleans", "bluejean", "bluejeans", "bean", "beans", "soybean", "soybeans", "pintobean", "pintobeans", "cocobean"])
        expect(segments(word)).toMatch(/inz?$/);
      expect(g2p.predict("bluejeans")).toMatch(/^ˈ/);
      for (const word of ["guinea", "guineas", "ocean", "oceans"])
        expect(segments(word)).not.toContain("iən");
    });

    test("single-onset open a keeps FACE through ture inflection and prefixing", () => {
      for (const word of ["nature", "natures", "natured", "naturing", "naturelike", "denature", "denatures", "denatured", "denaturing", "unnatured"])
        expect(segments(word)).toContain("neɪtʃɝ");
      for (const word of ["stature", "statures"])
        expect(segments(word)).toContain("stætʃɝ");
    });

    test("like preserves silent-e roots and lexical noun stress", () => {
      expect(g2p.predict("naturelike")).toMatch(/^ˈneɪtʃɝ/);
      expect(segments("apelike")).toContain("eɪplaɪk");
      expect(segments("molelike")).toContain("moʊllaɪk");
      expect(segments("juicelike")).toContain("dʒuslaɪk");
      for (const word of ["mammallike", "weasellike", "needlelike", "zombielike", "goddesslike"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
    });

    test("linking a and words merely ending in like retain their complete frame", () => {
      expect(segments("lookalike")).toContain("lʊkəlaɪk");
      expect(segments("lookalikes")).toContain("lʊkəlaɪk");
      expect(g2p.predict("unlike")).toMatch(/ˈ[^ˈ]*[lɫ]aɪk$/);
      expect(g2p.predict("dislike")).toMatch(/ˈ[^ˈ]*[lɫ]aɪk$/);
    });
  });

})();

// Original suite: en-bound-end-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US amend/append/contend and apprehend confirm the root's primary stress.
  // https://dictionary.cambridge.org/pronunciation/english/amend
  // https://dictionary.cambridge.org/dictionary/english/append
  // https://dictionary.cambridge.org/us/dictionary/english/contend
  // https://dictionary.cambridge.org/dictionary/english/apprehend
  // Synthetic roots assert only the stressed -end segment and regular inflection.
  describe.each([false, true])("closed end root after weak prefixes (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([
      ["append", /əˈpɛnd$/], ["appends", /əˈpɛndz$/],
      ["appended", /əˈpɛndɪd$/], ["appending", /əˈpɛndɪŋ$/],
      ["ascend", /əˈsɛnd$/], ["ascended", /əˈsɛndɪd$/],
      ["contend", /kənˈtɛnd$/], ["apprehend", /ˈhɛnd$/],
      ["apprehended", /ˈhɛndɪd$/], ["comprehend", /ˈhɛnd$/],
      ["comprehending", /ˈhɛndɪŋ$/], ["recommend", /ˈmɛnd$/],
      ["misspend", /ˈspɛnd$/], ["outspending", /ˈspɛndɪŋ$/], ["apzend", /ˈzɛnd$/],
      ["apzends", /ˈzɛndz$/], ["apzended", /ˈzɛndɪd$/],
      ["apzending", /ˈzɛndɪŋ$/],
    ])("keeps primary on the complete root in %s", (word, rime) => {
      expect(engine.predict(word)).toMatch(rime);
    });
    test.each(["addend", "legend", "weekend", "agent", "ament", "dividend"])("keeps the nominal head stress in %s", word => {
      expect(engine.predict(word)).toMatch(/^ˈ/);
    });
    test("keeps a caller-owned opaque root", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("apzend", "ˈzɛnd");
      expect(owned.predict("apzended")).toBe("ˈzɛndɪd");
      expect(owned.predict("apzending")).toBe("ˈzɛndɪŋ");
    });
    test("preserves the noun amends and verb/adjective controls in full sentences", () => {

      const tokens = englishTokens(engine, "They make amends. They amend the careful record.");
      for (const [word, pos] of [["amends", "N"], ["amend", "V"], ["careful", "ADJ"], ["record", "N"]])
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
    });
  });

  // The frozen lexical abend noun/acronym remains dictionary-owned after rebuild.
  test("preserves the lexical abend reading and plural in the default pipeline", () => {
    const engine = new EnglishG2P();
    expect(engine.predict("abend")).toBe("ˈæbɛnd");
    expect(engine.predict("abends")).toMatch(/^ˈæb/);
  });

})();

// Original suite: en-bound-graph-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("bound -graph rime (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    test.each([
      ["photograph", "ˈfoʊtəɡɹæf"],
      ["monograph", "ˈmɑnəɡɹæf"],
      ["lithograph", "ˈɫɪθəɡɹæf"],
      ["photographs", "ˈfoʊtəɡɹæfs"],
      ["monographs", "ˈmɑnəɡɹæfs"],
      ["graph", "ˈɡɹæf"],
    ])("retains TRAP in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")?.replace(/ˌ/g, "")).toBe(ipa);
    });

    test.each([
      ["photography", "fəˈtɑɡɹəfi"],
      ["photographic", "ˌfoʊtəˈɡɹæfɪk"],
      ["paragraph", disableDict ? "ˈpɛɹəˌɡɹæf" : "ˈpæɹəˌɡɹæf"],
      ["telegraph", "ˈtɛɫəˌɡɹæf"],
      ["autograph", disableDict ? "ˈɔtoʊˌɡɹæf" : "ˈɔtəˌɡɹæf"],
    ])("preserves the neighboring %s route", (word, ipa) =>
      expect(engine.predict(word, "en-US")).toBe(ipa),
    );

    test("retains TRAP through inflection and sentence context", () => {
      expect(engine.predict("photographed", "en-US")?.replace(/ˌ/g, "")).toMatch(/ɡɹæft$/);
      for (const pos of ["N", "V", "NN", "VB"])
        expect(engine.predict("photograph", "en-US", pos)?.replace(/ˌ/g, "")).toMatch(/ɡɹæf$/);

      const tokens = englishTokens(engine, "They photographed two monographs.");
      expect(tokens.find(token => token.word === "photographed")?.phoneme.replace(/ˌ/g, "")).toMatch(/ɡɹæft$/);
      expect(tokens.find(token => token.word === "monographs")?.phoneme.replace(/ˌ/g, "")).toMatch(/ɡɹæfs$/);
    });
  });

})();

// Original suite: en-bound-io-verb.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/postlex") = require("../src/en/postlex");
  const { applyPostLexical } = __suiteModule1;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;

  // MW verb entries independently place primary on the silent-e root.
  const verbs = [
    ["collide", "kəˈlaɪd", "They collide near the old bridge."],
    ["connive", "kəˈnaɪv", "They connive to deceive their rivals."],
    ["connote", "kəˈnoʊt", "They connote a sense of danger."],
    ["console", "kənˈsoʊl", "They console their friend."],
    ["conspire", "kənˈspaɪɝ", "They conspire against the plan."],
  ];
  const normalize = (ipa: string | null) => (ipa ?? "").replace(/ɫ/g, "l");

  describe.each([false, true])("caller-V bound i/o root, rules=%s", (disableDict) => {
    test.each(verbs)("retains the complete %s verb reading", (word, expected) => {
      expect(normalize(new EnglishG2P({ disableDict }).predict(word, "en-US", "V"))).toBe(expected);
    });

    test.each(verbs)("reads %s as a verb in its complete sentence", (word, expected, sentence) => {
      const engine = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const tokens = engine.phonemize(sentence, { language: "en-US", returnArray: true });
      if (typeof tokens === "string") throw new Error("Expected full token output");
      const targets = tokens.filter(token => token.word.toLowerCase() === word);
      expect(targets).toHaveLength(1);
      expect(normalize(targets[0]?.phoneme ?? null)).toBe(expected);
    });

    test("carries the verb root through inflections without lexical entries", () => {
      const engine = new EnglishG2P({ disableDict });
      Object.defineProperty(engine, "dictionary", { value: {} });
      for (const [word, base] of verbs) {
        expect(normalize(engine.predict(word, "en-US", "V"))).toBe(base);
        expect(normalize(engine.predict(word.slice(0, -1) + "ed", "en-US", "V"))).toBe(base + (/t$/.test(base) ? "ɪd" : /d$/.test(base) ? "ɪd" : "d"));
        expect(normalize(engine.predict(word.slice(0, -1) + "ing", "en-US", "V"))).toBe(base + "ɪŋ");
        expect(normalize(engine.predict(word + "s", "en-US", "V"))).toBe(base + (/t$/.test(base) ? "s" : "z"));
      }
    });

    test("keeps noun stress and existing verb controls", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(normalize(engine.predict("console", "en-US", "N"))).toBe("ˈkɑnsoʊl");
      expect(normalize(engine.predict("console", "en-US", "ADJ"))).toBe("ˈkɑnsoʊl");
      expect(normalize(engine.predict("compile", "en-US", "V"))).toBe("kəmˈpaɪl");
      expect(normalize(engine.predict("contrive", "en-US", "V"))).toBe("kənˈtɹaɪv");
    });

    test("keeps a known short root ahead of an invented silent-e root", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("conson", "ˈkɑnsən");
      expect(engine.predict("consoned", "en-US", "V")).toBe("ˈkɑnsənd");
      expect(engine.predict("consoning", "en-US", "V")).toBe("ˈkɑnsənɪŋ");
      engine.addPronunciation("consone", "kənˈsoʊn");
      expect(engine.predict("consoned", "en-US", "V")).toBe("kənˈsoʊnd");
      expect(engine.predict("consoning", "en-US", "V")).toBe("kənˈsoʊnɪŋ");
    });

    test("retains a caller-owned complete reading", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("console", "ˈkoʊnsoʊl");
      expect(engine.predict("console", "en-US", "V")).toBe("ˈkoʊnsoʊl");
    });
  });

  test("strong bound ive keeps PRICE while weak tails keep the original order", () => {
    expect(applyPostLexical("kənaɪv", "connive", 3, true)).toBe("kənaɪv");
    expect(applyPostLexical("kɑnaɪv", "connive", 3, false)).toBe("kɑnɪv");
    expect(applyPostLexical("neɪtaɪv", "native", 3, false)).toBe("neɪtɪv");
    expect(applyPostLexical("pɑzɪtaɪv", "positive", 4, false)).toBe("pɑzətɪv");
    expect(applyPostLexical("rɛstaɪv", "restive", 3, true)).toBe("rɛstɪv");
  });

})();

// Original suite: en-bound-ite.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("bound ite and free finite (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");

    test("bound finite retains two weak nuclei and root primary", () => {
      for (const word of ["definite", "definitely", "definiteness", "infinite", "infinitely", "infiniteness", "indefinite", "indefinitely"])
        expect(segments(word)).toContain("fənət");
      expect(g2p.predict("definite")).toMatch(/^ˈdɛ/);
      expect(g2p.predict("infinite")).toMatch(/^ˈɪn/);
      expect(g2p.predict("indefinite")).toContain("ˈdɛ");
    });

    test("finite keeps PRICE through transparent prefixing and neutral suffixing", () => {
      for (const word of ["finite", "finites", "finitely", "finiteness", "finitewise", "nonfinite", "unfinite", "semifinite", "semifinitely"])
        expect(segments(word)).toContain("faɪnaɪt");
      for (const word of ["transfinite", "semifinite", "cofinite"])
        expect(segments(word)).toMatch(/naɪt$/);
    });

    test("quisite retains weak voiced nuclei through its derivatives", () => {
      for (const word of ["requisite", "requisites", "requisitely", "requisiteness", "exquisite", "exquisitely", "prerequisite", "prerequisites", "perquisite"])
        expect(segments(word)).toMatch(/kw[əɪ]z[əɪ]t/);
      expect(g2p.predict("requisite")).toMatch(/^ˈɹɛ/);
      expect(g2p.predict("exquisite")).toMatch(/^ˈɛks/);
    });

    test("posite retains a weak final nucleus through plural and neutral suffixes", () => {
      for (const word of ["opposite", "opposites", "oppositely", "oppositeness", "apposite", "apposites", "appositely", "appositeness", "composite", "composites"])
        expect(segments(word)).toMatch(/p[ɑə]z[əɪ]t/);
    });

    test("weak bound roots retain their primary and vowels before wise", () => {
      for (const word of ["definitewise", "infinitewise"])
        expect(segments(word)).toContain("fənətwaɪz");
      expect(g2p.predict("oppositewise")).toMatch(/^ˈɑp/);
      expect(segments("exquisitewise")).toMatch(/kw[əɪ]z[əɪ]twaɪz$/);
    });

    test("consonantal qu participates in the existing intervocalic s voicing", () => {
      for (const word of ["acquisitive", "inquisitive", "inquisitor", "inquisitors"])
        expect(segments(word)).toContain("kwɪz");
      expect(segments("quips")).toMatch(/ps$/);
    });

    test("productive strong ite and ordinary silent-e roots keep their rimes", () => {
      for (const word of ["parasite", "appetite", "dynamite", "satellite", "ignite", "reunite"])
        expect(segments(word)).toMatch(/aɪt$/);
      for (const word of ["bite", "white", "polite"])
        expect(segments(word)).toMatch(/aɪt$/);
    });
  });

})();

// Original suite: en-bound-ment-and-singular-endings.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("bound roots and singular endings (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["element", "implement", "complement", "supplement"])("%s keeps the bound root's medial onset", word => {
      const ipa = g2p.predict(word, "en");
      expect(ipa).toMatch(word === "element" ? /^ˈɛ[lɫ]əmənt$/ : /p[lɫ]əmənt$/);
    });
    test.each(["battlement", "encirclement", "entanglement", "entitlement", "settlement"])("%s preserves a free silent-le stem", word => {
      expect(g2p.predict(word, "en")).toMatch(/ə[lɫ]mənt$/);
    });
    test.each(["achievement", "basement", "placement", "statement", "involvement"])("%s preserves its dropped-e derivation", word => {
      expect(g2p.predict(word, "en")).not.toMatch(/[ɪə]mənt$/);
    });
    test.each(["basis", "thesis", "crisis", "analysis", "oasis", "paralysis"])("%s remains a singular Greek noun", word => {
      expect(g2p.predict(word, "en")).toMatch(/[sɪə]s$/);
      expect(g2p.predict(word, "en")).not.toMatch(/iz$/);
    });
    test.each(["yogis", "antis", "nazis"])("%s retains its genuine i-stem plural", word => {
      expect(g2p.predict(word, "en")).toMatch(/z$/);
    });
    test.each(["radical", "helical", "magical", "practical"])("%s preserves the -ic c before -al", word => {
      expect(g2p.predict(word, "en")).toMatch(/kə[lɫ]$/);
    });
    test.each(["implementation", "instrumentation", "argumentation", "ornamentation"])("%s preserves the -ment stem before -ation", word => {
      const ipa = g2p.predict(word, "en");
      expect(ipa).toMatch(/m[əɛ]nˈteɪʃən$/);
      if (disableDict) expect(ipa).toMatch(/^ˌ/);
    });
    test.each(["approval", "arrival", "removal"])("%s still restores a genuine silent e", word => {
      expect(g2p.predict(word, "en")).toMatch(/və[lɫ]$/);
    });
  });

  test.each(["element", "implement", "complement", "supplement"])("%s reaches the public API", word => {
    expect(toIPA(word)).toMatch(/(?:ɛ[lɫ]|p[lɫ])əmənt/);
  });

})();

// Original suite: en-bound-phony.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Greek bound -phony versus free phony, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test("a bound sound suffix does not inherit the free adjective's GOAT vowel", () => {
      expect(engine.predict("symphony")).toBe("ˈsɪmfəni");
      expect(engine.predict("symphonies")).toBe("ˈsɪmfəniz");
      expect(engine.predict("phony")).toBe("ˈfoʊni");
      expect(engine.predict("phonies")).toBe("ˈfoʊniz");
      expect(engine.predict("symphonic")).toBe("ˌsɪmˈfɑnɪk");
    });
    test("noun and adjective readings retain their own stress in full sentences", () => {
      const api = createPhonemizer({ processors: [engine] });
      const out = api.phonemize("They perform a symphony with a phony conductor.", { language: "en-US", returnArray: true });
      expect(out.find(t => t.word === "symphony")!.phoneme).toBe("ˈsɪmfəni");
      expect(out.find(t => t.word === "phony")!.phoneme).toBe("ˈfoʊni");
    });
  });

})();

// Original suite: en-bound-rhotic-and-noun-tails.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("bound rhotic and noun tails (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const bare = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("weak ence and ency tails keep one rhotic nucleus after doubled ur", () => {
      for (const word of ["currency", "currencies", "occurrence", "occurrences", "concurrence", "recurrence", "recurrences"])
        expect(bare(word)).toMatch(/kɝəns/);
      expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
    });

    test("a nasal-coda prefix before form weakens with the stressed ation suffix", () => {
      for (const word of ["information", "information's", "informational", "misinformation", "disinformation"])
        expect(g2p.predict(word)).toContain("fɝˈmeɪ");
      expect(bare("deformation")).toContain("fɔɹmeɪ");
      expect(bare("formation")).toContain("fɔɹmeɪ");
      expect(bare("inform")).toContain("fɔɹm");
    });

    test("bound ernal and urnal adjectives retain their whole-word stress", () => {
      for (const word of ["maternal", "maternally", "paternal", "paternally", "fraternal", "eternal", "eternally", "internal", "internally", "nocturnal"])
        expect(g2p.predict(word)).toContain("ˈtɝ");
      expect(g2p.predict("journal")).toMatch(/^ˈdʒɝ/);
      expect(g2p.predict("lateral")).toMatch(/^ˈɫæ/);
    });

    test("gramme retains the gram noun boundary in its plural", () => {
      for (const word of ["programme", "programmes"])
        expect(g2p.predict(word)).toMatch(/^ˈpɹoʊ/);
      for (const word of ["kilogramme", "kilogrammes", "monogramme", "monogrammes"])
        expect(bare(word)).toMatch(/ɡɹæmz?$/);
    });

    test("the weak posttonic vate frame preserves neighbouring mate and ivate vowels", () => {
      for (const word of ["private", "privates", "privately"])
        expect(bare(word)).toMatch(/pɹaɪvət/);
      for (const word of ["primate", "primates", "motivate", "motivates", "activate", "activates", "cultivate"])
        expect(bare(word)).toMatch(/eɪt/);
    });
  });

  test("a silent trace step does not displace the following vowel's trace", () => {
    const trace = new EnglishG2P({ disableDict: true }).trace("currency");
    expect(trace.steps.find(step => step.rule === "phoneme:^rhotic-ur-double-r")?.phoneme).toBe("");
    expect(trace.steps.find(step => step.grapheme === "e")?.phoneme).toBe("ə");
    expect(trace.steps.find(step => step.grapheme === "n")?.phoneme).toBe("n");
  });

})();

// Original suite: en-bound-root-role-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule2;

  // https://www.merriam-webster.com/dictionary/subject includes noun -jekt as well as -jikt.
  // https://dictionary.cambridge.org/pronunciation/english/export
  // https://dictionary.cambridge.org/us/pronunciation/english/convict
  // These tests keep noun, adjective and verb roles separate from ambiguous !V.
  describe("bound-root role stress", () => {
    const engine = new EnglishG2P({ disableDict: true });
    test.each([
      ["export", "N", "ˈɛkspɔɹt"], ["export", "V", "ɪksˈpɔɹt"],
      ["import", "N", "ˈɪmpɔɹt"], ["import", "V", "ɪmˈpɔɹt"],
      ["object", "N", "ˈɑbdʒɛkt"], ["object", "V", "əbˈdʒɛkt"],
      ["subject", "N", "ˈsʌbdʒɛkt"], ["subject", "V", "səbˈdʒɛkt"],
      ["conflict", "N", "ˈkɑnfɫɪkt"], ["conflict", "V", "kənˈfɫɪkt"],
      ["convict", "N", "ˈkɑnvɪkt"], ["convict", "V", "kənˈvɪkt"],
    ])("distinguishes %s %s", (word, pos, ipa) => {
      expect(engine.predict(word, "en-US", pos)).toBe(ipa);
    });
    test.each(["export", "import", "object", "subject"])("preserves ambiguous role for %s", word => {
      const slots = syllabify(word);
      // The candidate must not interpret !V as a gold noun annotation.
      const expected = word === "import" ? 0 : 1;
      expect(assignStress(slots, word, "!V")).toBe(expected);
      expect(assignStress(slots, word, "N")).toBe(0);
      expect(assignStress(slots, word, "V")).toBe(1);
    });
    test.each([
      ["The export is valuable.", "export", "ˈɛkspɔɹt"],
      ["The object is small.", "object", "ˈɑbdʒɛkt"],
      ["They will conflict with the plan.", "conflict", "kənˈfɫɪkt"],
      ["They will convict him.", "convict", "kənˈvɪkt"],
      ["Import the file.", "Import", "ɪmˈpɔɹt"],
      ["Export goods.", "Export", "ɪksˈpɔɹt"],
      ["Object to the plan.", "Object", "əbˈdʒɛkt"],
    ])("uses full sentence %s", (text, word, ipa) => {
      const tokens = createPhonemizer({ processors: [engine] }).phonemize(text, { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

  // Evicting the singular exception must preserve the inherited citation reading.
  test.each([["exports", "ˈɛkspɔɹts", "ɪkˈspɔɹts"], ["objects", "ˈɑbdʒɛkts", "əbˈdʒɛkts"]])("keeps %s plural roles after stem eviction", (word, nominal, verbal) => {
    for (const disableDict of [false, true]) {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of ["N", "!V"]) expect(engine.predict(word, "en-US", pos)).toBe(nominal);
      expect(engine.predict(word, "en-US", "V")).toBe(verbal);
    }
  });

})();

// Original suite: en-bound-sist-and-ual.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("bound sist/ual and un- boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test("Latin sist keeps root stress, distinct from a profession suffix", () => {
      for (const word of ["assist", "consist", "desist", "insist", "persist", "resist", "subsist", "assistant", "persistent"])
        expect(g2p.predict(word, "en")).toMatch(/ˈ[sz]ɪst/);
      expect(g2p.predict("artist", "en")).toMatch(/^ˈɑɹt/);
      expect(g2p.predict("cellist", "en")).toMatch(/[ɪə]st$/);
    });
    test("inflections preserve the sist root after exception-table eviction", () => {
      for (const word of ["assisting", "assisted", "consists", "resisting", "persisted", "subsisting", "assister", "persister", "insister", "resister"])
        expect(g2p.predict(word, "en")).toMatch(/ˈ[sz]ɪst/);
    });
    test("vowel-initial adjectives and participles preserve un-", () => {
      for (const word of ["unable", "unavailable", "unexpected", "unusual"])
        expect(g2p.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/^[əʌ]n/);
      for (const word of ["universe", "unionize", "unison", "unanimous"])
        expect(g2p.predict(word, "en")).toMatch(/^[ˈˌ]?ju/);
    });
    test("an attested supplied vowel-initial adjective composes through un-", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("eavable", "IY1 V AH0 B AH0 L");
      expect(custom.predict("uneavable", "en")?.replace(/[ˈˌ]/g, "")).toMatch(/^[əʌ]niv/);
    });
    test("short sual sees intervocalic s and the complete hiatus", () => {
      for (const word of ["usual", "visual", "casual", "usually", "visually", "casually", "visuals", "casualness"])
        expect(g2p.predict(word, "en")).toMatch(/ʒə?wə/);
    });
    test("prefixed tual sees root stress in word context", () => {
      for (const word of ["conceptual", "contractual", "perpetual", "ineffectual", "intellectual"])
        expect(g2p.predict(word, "en")).toMatch(/ˈ[^ˈ]*[ɛæ]/);
      expect(g2p.predict("spiritual", "en")).toMatch(/^ˈspɪɹ/);
      expect(g2p.predict("ritual", "en")).toMatch(/^ˈɹɪ/);
    });
  });

  test("the public API retains the corrected bound-root and hiatus nuclei", () => {
    expect(toIPA("usual")).toMatch(/ʒə?wə/);
    expect(toIPA("consist")).toMatch(/ˈsɪst/);
    expect(toIPA("unavailable")).toMatch(/^[ˌˈ]?[əʌ]n/);
  });

})();

// Original suite: en-bound-stem-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("bound stem context (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each([
      ["beneficial", /ˈfɪ/], ["commercial", /ˈmɝ/],
      ["essential", /ˈsɛn/], ["official", /ˈfɪ/], ["potential", /ˈtɛn/],
    ] as const)("%s places stress before its palatal suffix", (word, owned) => {
      expect(g2p.predict(word, "en")).toMatch(owned);
    });
    test.each([
      ["facial", /eɪʃəɫ$/], ["racial", /eɪʃəɫ$/],
      ["spatial", /eɪʃəɫ$/], ["special", /ɛʃəɫ$/],
    ] as const)("%s retains the short open-stem vowel", (word, owned) => {
      expect(g2p.predict(word, "en")).toMatch(owned);
    });
    test("mutual retains yod coalescence across the bound stem", () => {
      expect(g2p.predict("mutual", "en")).toMatch(/mjutʃuəɫ$/);
    });
    test.each([
      ["heavily", /hɛvəɫi$/], ["readily", /ɹɛdəɫi$/],
      ["angrily", /æŋɡɹəɫi$/], ["hungrily", /ʌŋɡɹəɫi$/],
    ] as const)("%s restores its attested y adjective", (word, owned) => {
      expect(g2p.predict(word, "en")).toMatch(owned);
    });
    test("a novel y adjective supplies the vowel of its adverb", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("bravvy", "B R AE1 V IY0");
      expect(custom.predict("bravvily", "en")).toMatch(/bɹævəɫi$/);
    });
    test.each(["liberal", "mineral"])("%s retains bound-stem laxing", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɪˌ?[bn]/);
    });
    test.each(["essay", "essence"])("%s retains its initial es vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ˈɛˌ?s/);
    });
    test.each(["cats", "ages"])("%s retains its word-final inflection", word => {
      expect(g2p.predict(word, "en")).toMatch(/[sz]$/);
    });
  });

})();
