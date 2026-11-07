// Original suite: en-temporal-function-words.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { inferVerbForm, simplePOSTagger } = __suiteModule2;

  // These words may also be adverbs; function status is not a POS noun cue.
  describe("Temporal and spatial function words", () => {
    it.each(["below", "above", "before", "after", "outside"])("does not force a noun after %s", previous => {
      expect(simplePOSTagger.tagWord("deviate", [previous, "from"]).pos).not.toBe("N");
    });

    it.each(["after", "before", "since", "until", "once", "as", "though", "unless"])(
      "recognizes singular agreement in a clause starting with %s", conjunction => {
        const words = [conjunction, "he", "read", "the", "letter"];
        expect(inferVerbForm({ words, index: 2 })).toBe("past");
        const api = createPhonemizer({ processors: [new EnglishG2P()] });
        const token = api.phonemize(words.join(" ") + ".", { language: "en-US", returnArray: true })
          .find(t => t.word === "read")!;
        expect(token.phoneme).toBe("ɹɛd");
      });

    it("preserves bare forms in mandatives and after auxiliaries", () => {
      expect(inferVerbForm({ words: ["I", "recommend", "he", "read"], index: 3 })).toBeUndefined();
      expect(inferVerbForm({ words: ["I", "recommend", "that", "he", "read"], index: 4 })).toBeUndefined();
      expect(inferVerbForm({ words: ["After", "he", "did", "read"], index: 3 })).toBe("base");
      expect(inferVerbForm({ words: ["After", "they", "read"], index: 2 })).toBeUndefined();
    });

    it("keeps inferred form independent of an explicit target POS", () => {
      const engine = new EnglishG2P();
      const original = engine.tagWord.bind(engine);
      engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : original(word, context);
      const api = createPhonemizer({ processors: [engine] });
      expect(api.toIPA("After he read the letter, the record was clear.", "en-US")).toContain("ɹɛd");
    });
  });

  describe.each([false, true])("Complete locative components (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["hereafter", /hɪ(?:ɹˈ|ˈɹ)æftɝ$/], ["thereafter", /ðɛˈɹæftɝ$/],
      ["whereupon", /hwɛɹəˈpɑn$/],
      ["hereunder", /hɪˈɹʌndɝ$/],
    ])("preserves the root and tail in %s", (word, ipa) => {
      expect(engine.predict(word)).toMatch(ipa);
    });
    it("retains therefore's head stress", () => {
      expect(engine.predict("therefore")).toBe("ˈðɛɹˌfɔɹ");
    });
    it("preserves adjective, noun and verb controls in a full sentence", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Thereafter, the fearless reader will work.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(t => t.word === "Thereafter")?.phoneme).toMatch(/ðɛˈɹæftɝ$/);
      expect(tokens.find(t => t.word === "fearless")?.phoneme).toMatch(/ɫ[əɪ]s$/);
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

  describe("Lexical stress and vowel controls", () => {
    const engine = new EnglishG2P();
    it.each([
      ["whereabouts", "ˈhwɛɹəˌbaʊts"], ["hereabout", "ˈhɪɹəˌbaʊt"],
      ["beforehand", "bɪˈfɔɹˌhænd"],
    ])("preserves the established reading of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
  });

})();

// Original suite: en-temporal-past-matrix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  it("uses an explicit past matrix after a clause-initial when adjunct", () => {
    for (const known of [false, true]) {
      const engine = new EnglishG2P();
      const tag = engine.tagWord.bind(engine);
      if (known) engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : tag(word, context);
      const api = createPhonemizer({ processors: [engine] });
      for (const sentence of ["When I read it, it changed everything.", "When I read it, it kind of changed everything.", "When we read it, they acted on the advice.", "When they read it, I was surprised.", "But when I read it, it moved me."])
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
    }
  });
  it("preserves present/future matrices and ambiguous bare ed roots", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const sentence of ["When I read it, it makes me happy.", "When I read it, it will be changed.", "When I read it, I need glasses.", "When I read it, I embed the notes.", "When I read it, I shred the notes.", "When I read it, I bobsled afterwards.", "I know when I read it, it changed everything."])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹid");
  });
  it("preserves explicit base-verb and noun controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const sentence of ["The wound was clear.", "I will wound it when necessary."])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "wound")?.phoneme).toBe("wund");
  });

})();

// Original suite: en-terminal-noun-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const plain = (word: string) => g.predict(word)!.replace(/[ˈˌ]/g, "");
    describe(`terminal noun frames (disableDict=${disableDict})`, () => {
      test("the merged weak dy noun tail retains antepenultimate primary", () => {
        for (const word of ["remedy", "remedies", "remedying", "remedywise", "remedier", "remediable"])
          expect(g.predict(word)).toMatch(/^ˈɹɛmədi/);
        for (const word of ["nonremedy", "unremedied"])
          expect(g.predict(word)).toMatch(/ˈɹɛmədi/);
      });
      test("other weak dy nouns and longer body compounds retain primary", () => {
        for (const word of ["comedy", "tragedy", "melody", "parody", "prosody"])
          expect(g.predict(word)).toMatch(/^ˈ/);
        expect(g.predict("antibody")).toMatch(/^ˈænt[ɪi]/);
      });
      test("nasal ngue has no final stop", () => {
        for (const word of ["tongue", "harangue", "meringue"])
          expect(plain(word)).toMatch(/ŋ$/);
        for (const word of ["tongues", "tongued", "tonguing"])
          expect(plain(word)).toMatch(/ŋ(?:z|d|ɪŋ)$/);
      });
      test("the other gue rimes retain their stop or sounded vowel", () => {
        for (const word of ["dengue", "league", "rogue", "vague"])
          expect(plain(word)).toMatch(/ɡ$/);
        expect(plain("argue")).toMatch(/ɡju$/);
      });
      test("the longer onnel loan rime and its neutral compositions retain final primary", () => {
        for (const word of ["personnel", "personnels", "nonpersonnel", "personnelwise"])
          expect(g.predict(word)).toMatch(/pɝsəˈnɛ[ɫl]/);
        for (const word of ["channel", "multichannel", "tunnel", "polytunnel"])
          expect(plain(word)).toMatch(/ə[ɫl]$/);
      });
      test("open-initial and doubled-final-l names keep their frame", () => {
        for (const word of ["odonnel", "o'donnel"]) expect(g.predict(word)).toMatch(/ˈdɑnə[ɫl]$/);
      });
      test("vowel tein retains its root primary and FLEECE", () => {
        for (const word of ["protein", "proteins", "nonprotein", "proteinlike"])
          expect(g.predict(word)).toMatch(/ˈpɹoʊˌ?tin/);
        for (const word of ["lipoprotein", "mucoprotein", "glycoprotein"])
          expect(g.predict(word)).toMatch(/ˈpɹoʊtin$/);
        expect(plain("chemoprotein")).toMatch(/^kimoʊpɹoʊtin$/);
        for (const word of ["stein", "bernstein"])
          expect(plain(word)).toMatch(/staɪn$/);
      });
    });
  }

})();

// Original suite: en-tex-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("closed -tex rime, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });


    test("preserves the vowel in citation forms and regular plurals", () => {
      for (const word of ["vertex", "vertexes", "cortex", "cortexes", "vortex", "vortexes"]) {
        expect(engine.predict(word, "en", "N")).toContain("tɛks");
      }
      expect(engine.predict("context", "en", "N")).toBe("ˈkɑntɛkst");
      expect(engine.predict("text", "en", "V")).toBe("tɛkst");
    });

    test("preserves the same pronunciation in sentences", () => {
      const tokens = englishTokens(engine, "The vortexes surround the cortex.");
      expect(tokens.find(token => token.word.toLowerCase() === "vortexes")?.phoneme).toContain("tɛks");
      expect(tokens.find(token => token.word.toLowerCase() === "cortex")?.phoneme).toContain("tɛks");
    });
  });

})();

// Original suite: en-th-cluster-y.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Oxford US thirsty /ˈθɜːrsti/, thirty /ˈθɜːrti/:
  // https://www.oxfordlearnersdictionaries.com/us/definition/english/thirsty
  // https://www.oxfordlearnersdictionaries.com/definition/english/thirty
  // Existing thirty reference/table flap and secondary stress are preserved.
  describe.each([false, true])("initial th with clustered y foot (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each(["thirsty", "thingy", "thirty", "thirky"])("retains voiceless th in %s", word => {
      expect(engine.predict(word)).toMatch(/^ˈθ/);
    });
    test.each(["thirstier", "thirstiest", "thirstily", "thirstiness", "thirty's"])("keeps theta through the actual derived route in %s", word => {
      expect(engine.predict(word)?.replace(/ˌ/g, "")).toMatch(/^ˈθ/);
    });
    test.each([["this", "ð"], ["that", "ð"], ["they", "ð"], ["their", "ð"], ["thirst", "θ"], ["third", "θ"], ["thick", "θ"]])("preserves the neighboring onset in %s", (word, onset) => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(new RegExp("^" + onset));
    });
    test("preserves adjective, noun and verb readings in complete sentences", () => {

      const tokens = englishTokens(engine, "They think that this thing is theirs. The thirsty child drinks water. Thirty children record the results.");
      expect(tokens.find(t => t.word === "thirsty")?.phoneme).toBe("ˈθɝsti");
      expect(tokens.find(t => t.word === "Thirty")?.phoneme).toMatch(/^ˈθ/);
      expect(tokens.find(t => t.word === "think")?.phoneme).toBe(engine.predict("think", "en-US", "V"));
      expect(tokens.find(t => t.word === "thing")?.phoneme).toBe(engine.predict("thing", "en-US", "N"));
      for (const word of ["They", "that", "this", "theirs"])
        expect(tokens.find(t => t.word === word)?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(/^ð/);
    });
    test("preserves a retained-y plural after the base leaves the table", () => {
      for (const base of ["Thirky", "Thursby"])
        expect(engine.predict(base + "s", "en-US", "N")).toBe(engine.predict(base, "en-US", "N") + "z");
    });
    test("retains caller ownership before a suffix", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("thirsty", "ˈzɛŋ");
      expect(owned.predict("thirsty")).toBe("ˈzɛŋ");
      expect(owned.predict("thirstier")).toBe("ˈzɛŋɝ");
    });
  });

})();

// Original suite: en-th-east-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  // Preserve the voiceless compound boundary before east, like think/thought.
  // Primary stress in isolated directional compounds remains a separate issue.
  test.each([false, true])("preserves th before east after eviction (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   const forms = ["southeast", "southeast's", "southeastern", "southeastern's", "southeasterly", "southeastward", "southeastness", "nonsoutheastern", "northeast", "northeastern"];
   for (const word of forms) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary);
   for (const word of forms) for (const pos of ["N", "ADJ"]) expect(e.predict(word, "en-US", pos)).toContain("θ");
   for (const word of ["southern", "southerly", "mother", "feather", "bother"]) expect(e.predict(word)).toContain("ð");
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["The southeast was quiet.", "The southeastern coast was quiet.", "The winds blew southeast."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^southeast/.test(t.word))?.phoneme).toContain("θ");
  });
  test("preserves an explicit directional root", () => {
   const e = new EnglishG2P({ disableDict: true });
   e.addPronunciation("southeast", "ˈwɑð");
   expect(e.predict("southeast")).toBe("ˈwɑð");
   expect(e.predict("southeastness")).toBe("ˈwɑðnəs");
  });

})();

// Original suite: en-th-plural-controls.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("unvoiced th controls (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([["maths", "mæθs"], ["faiths", "feɪθs"]])("%s", (word, expected) => {
      expect(engine.predict(word, "en-US", "N")).toBe(expected);
    });
  });

})();

// Original suite: en-thea-noun-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  function cold(disableDict: boolean) {
    const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of Object.keys(dictionary)) if (/theat/.test(word)) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary); return engine;
  }
  test.each([false, true])("Greek dental-rhotic noun tails preserve ea hiatus after eviction, rules=%s", disableDict => {
    const engine = cold(disableDict);
    for (const word of ["theater", "theatre"]) expect(engine.predict(word)).toBe("ˈθiətɝ");
    for (const word of ["theaters", "theatres", "theater's", "theatre's"]) expect(engine.predict(word)).toBe("ˈθiətɝz");
    for (const word of ["amphitheater", "amphitheatre", "xenotheater"]) expect(engine.predict(word)).toMatch(/θiətɝ$/);
    expect(engine.predict("theatreless")).toBe("ˈθiətɝɫəs");
    expect(engine.predict("theatreful")).toBe("ˈθiətɝfəɫ");
    expect(engine.predict("theatregoer")).toBe("ˈθiətɝˌɡoʊɝ");
    for (const word of ["they", "them", "these", "themselves", "therefore"]) expect(engine.predict(word)).toMatch(/^ˈ?ð/);
    expect(engine.predict("wheat")).toMatch(/it$/);
    for (const word of ["area", "urea"]) expect(engine.predict(word)).toMatch(/iə$/);
    const api = createPhonemizer({ processors: [engine] });
    const out = api.phonemize("They perform plays at the theater near the theatre.", { language: "en-US", returnArray: true });
    for (const t of out.filter(t => /^theat(?:er|re)$/.test(t.word))) expect(t.phoneme).toBe("ˈθiətɝ");
  });
  test("default adjective and finite verb controls retain their full readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const out = api.phonemize("They record a theatrical performance at the theater.", { language: "en-US", returnArray: true });
    expect(out.find(t => t.word === "record")!.phoneme).toContain("ˈkɔɹd");
    expect(out.find(t => t.word === "theatrical")!.phoneme).toBe("θiˈætɹɪkəɫ");
  });
  test.each([false, true])("caller-owned Greek noun roots retain their plural and possessive, rules=%s", disableDict => {
    const engine = cold(disableDict); engine.addPronunciation("theatre", "ˈtɛst");
    expect(engine.predict("theatres")).toBe("ˈtɛsts"); expect(engine.predict("theatre's")).toBe("ˈtɛsts");
    expect(engine.predict("theatreless")).toBe("ˈtɛstɫəs");
    expect(engine.predict("theatreful")).toBe("ˈtɛstfəɫ");
    expect(engine.predict("theatregoer")).toBe("ˈtɛstˌɡoʊɝ");
  });

})();

// Original suite: en-thematic-o-decomposition.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;

  const reading = (ipa: string) => {
    const { phones, primary } = parseIpa(ipa);
    return { phones, primary };
  };

  describe.each([false, true])("technical -o composition (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    // Collins / Merriam-Webster retain the adjective root's primary stress.
    it.each([
      ["viscoelastic", "vɪskoʊɪˈlæstɪk"],
      ["picoelastic", "pikoʊɪˈlæstɪk"],
    ])("preserves combining vowels and root stress in %s", (word, ipa) => {
      expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
    });
    it("retains the noun suffix stress and closed head vowel", () => {
      const result = reading(engine.predict("viscoelasticity")!);
      expect(result.phones.slice(0, 5)).toEqual(["v", "ɪ", "s", "k", "oʊ"]);
      expect(result.primary).toBe(4);
    });
    it.each(["visco", "pico"])("preserves caller-supplied %s instead of re-rendering it", root => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation(root, "ˈzɛŋ");
      expect(reading(custom.predict(root + "elastic")!)).toEqual(reading("zɛŋɪˈlæstɪk"));
    });
    it("keeps adjective and noun composition in complete sentences", () => {
      const api = createPhonemizer({ processors: [engine] });
      const result = api.phonemize("These viscoelastic materials work.", {
        language: "en-US", returnArray: true,
      });
      expect(reading(result.find(token => token.word === "viscoelastic")!.phoneme))
        .toEqual(reading("vɪskoʊɪˈlæstɪk"));
      expect(result.find(token => token.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();

// Original suite: en-tion-plural-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("-tion plural stem vowels (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test("retains the independently predicted singular vowel in context", () => {
      expect(engine.predict("negotiations", "en-US", "N")).toBe("nəˌɡoʊʃiˈeɪʃənz");
      expect(engine.predict("reductions", "en-US", "N")).toBe("ɹiˈdʌkʃənz");
      expect(engine.predict("reverberations", "en-US", "N")).toBe("ɹɪˌvɝbɝˈeɪʃənz");
      expect(api.phonemize("The careful negotiations require sharp reductions.", { language: "en-US" })).toBe("ðə ˈkɛɹfəɫ nəˌɡoʊʃiˈeɪʃənz ɹiˈkwaɪɝ ʃɑɹp ɹiˈdʌkʃənz.");
    });

    test("keeps transparent prefixes, vowel-initial forms and custom roots", () => {
      expect(engine.predict("destabilizations", "en-US", "N")).toBe("diˌsteɪbəɫəˈzeɪʃənz");
      expect(engine.predict("elations", "en-US", "N")).toBe("ɪˈɫeɪʃənz");
      expect(engine.predict("destabilizations", "en-GB", "N")).toBe("diˌsteɪbəɫəˈzeɪʃənz");
      expect(engine.predict("elations", "en-GB", "N")).toBe("ɪˈɫeɪʃənz");
      expect(engine.predict("emotions", "en-US", "N")).toBe(disableDict ? "ˈiˌmoʊʃənz" : "ˈimoʊʃənz");
      if (disableDict) {
        const custom = new EnglishG2P({ disableDict });
        custom.addPronunciation("negotiation", "nɪˌɡoʊʃiˈeɪʃən");
        expect(custom.predict("negotiations", "en-US", "N")).toBe("nɪˌɡoʊʃiˈeɪʃənz");
      }
    });
  });

})();

// Original suite: en-to-day-night-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak to- in temporal compounds", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([["today", "təˈdeɪ"], ["tonight", "təˈnaɪt"]])(
      "%s has weak to- and primary stress on its day/night root",
      (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
    );

    it.each([["todays", "təˈdeɪz"], ["tonights", "təˈnaɪts"]])(
      "keeps weak to- in the plural %s",
      (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
    );

    it.each(["total", "tonic", "tomorrow", "holiday"])(
      "leaves the neighboring %s frame unchanged",
      word => expect(rules.predict(word, "en-US")).toBe({
        total: "ˈtoʊtəɫ", tonic: "ˈtɑnɪk", tomorrow: "təˈmɔɹoʊ", holiday: "ˈhɑɫɪdeɪ",
      }[word]),
    );
  });

})();

// Original suite: en-to-infinitive-controls.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("to infinitive controls (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const tagged = (sentence: string, word: string) => {
      const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
      const index = words.findIndex(token => token.toLowerCase() === word);
      return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
    };

    test("preserves infinitives even when followed by of", () => {
      expect(tagged("The project due to consist of three parts is ready.", "consist")).toBe("V");
      expect(tagged("The speaker is almost due to speak of policy.", "speak")).toBe("V");
      expect(tagged("They came from London to dispose of furniture.", "dispose")).toBe("V");
      expect(tagged("She moved from refusing to speak of policy.", "speak")).toBe("V");
      expect(tagged("The collection was expected to consist of books.", "consist")).toBe("V");
    });

    test("does not extend an infinitive into a coordinated clause", () => {
      expect(tagged("She wants to act decisively and present policy matters.", "present")).not.toBe("V");
    });
  });

  test.each(["en-US", "en-GB"])("keeps the adjective reading across a coordinated clause in %s", language => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("She wants to act decisively and present policy matters.", { language, returnArray: true });
    expect(tokens.find(token => token.word === "present")?.phoneme).toBe(engine.predict("present", language, "ADJ"));
  });

})();

// Original suite: en-to-preposition-frame.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("compound prepositions ending in to (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const tagged = (sentence: string, word: string) => {
      const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
      const index = words.findIndex(token => token.toLowerCase() === word);
      return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
    };

    test("identifies closed nominal complements", () => {
      expect(tagged("Mortalities that occur prior to export are excluded.", "export")).toBe("N");
      expect(tagged("Owing to abuse of power, the team stopped.", "abuse")).toBe("N");
      expect(tagged("According to record, the meeting ended.", "record")).toBe("N");
      expect(tagged("Subsequent to use, the room closed.", "use")).toBe("N");
    });

    test("preserves verbal and adjective controls", () => {
      expect(tagged("They want to export goods.", "export")).toBe("V");
      expect(tagged("The team is due to present the plan.", "present")).toBe("V");
      expect(tagged("Due to read of the incident, the officer opened the report.", "read")).toBe("V");
      expect(tagged("The present rules are useful.", "present")).not.toBe("V");
    });

    test("keeps noun and verb readings in complete sentences", () => {
      if (disableDict) return;
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize("Mortalities that occur prior to export are excluded.", { language: "en-US" })).toContain("ˈɛkspɔɹt");
      expect(api.phonemize("They want to export goods.", { language: "en-US" })).toContain("ɪkˈspɔɹt");
    });
  });

})();

// Original suite: en-together-composition.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("-together composition in the English rules path", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const standard = new EnglishG2P();

    it.each([
      ["together", "təˈɡɛðɝ"],
      ["altogether", "ˌɔɫtəˈɡɛðɝ"],
    ])("renders %s from spelling rules", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it.each([
      ["today", "təˈdeɪ"],
      ["tonight", "təˈnaɪt"],
      ["toboggan", "təˈbɑɡən"],
      ["gather", "ˈɡæðɝ"],
      ["togetherness", "təˈɡɛðɝnəs"],
    ])("preserves the neighboring %s pattern", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it("retains the checked whole-word readings in the default API", () => {
      expect(standard.predict("together", "en")).toBe("təˈɡɛðɝ");
      expect(standard.predict("altogether", "en")).toBe("ˌɔɫtəˈɡɛðɝ");
    });

    it.each([
      ["get-together", "ˈɡɛttəˌɡɛðɝ"],
      ["air-conditioning", "ˈɛɹkənˌdɪʃənɪŋ"],
    ])("preserves the second component's weak syllable in %s", (word, expected) => {
      expect(standard.predict(word, "en")).toBe(expected);
    });
  });

})();

// Original suite: en-tory-plural-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const { EnglishG2P } = __suiteModule0;

  describe("rule-derived -tory plural stems", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps the reduced US root vowel in the rules and default routes", () => {
      expect(rules.predict("territories", "en")).toBe("ˈtɛɹəˌtɔɹiz");
      expect(new EnglishG2P().predict("territories", "en")).toBe("ˈtɛɹəˌtɔɹiz");
    });

    it.each([
      ["dormitories", "ˈdɔɹməˌtɔɹiz"],
      ["repositories", "ɹiˈpɑzəˌtɔɹiz"],
      ["histories", "ˈhɪstɝiz"],
      ["laboratories", "ˈɫæbɹəˌtɔɹiz"],
      ["ministries", "ˈmɪnəstɹiz"],
      ["densities", "ˈdɛnsətiz"],
      ["intensities", "ɪnˈtɛnsətiz"],
    ])("preserves neighboring reading for %s", (word, ipa) => {
      expect(rules.predict(word, "en")).toBe(ipa);
    });

    it("carries the rule-derived schwa root through propensities", () => {
      expect(rules.predict("propensity", "en")).toBe("pɹəˈpɛnsəti");
      expect(rules.predict("propensities", "en")).toBe("pɹəˈpɛnsətiz");
      expect(new EnglishG2P().predict("propensities", "en")).toBe("pɹəˈpɛnsətiz");
    });
  });

})();

// Original suite: en-toward-compound.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule2;

  describe("to-ward retains its second-syllable preposition stress", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["toward", "təˈwɔɹd", 1],
      ["towards", "təˈwɔɹdz", 1],
      ["untoward", "ˌʌntəˈwɔɹd", 2],
    ])("%s → %s", (word, ipa, stress) => {
      const slots = syllabify(word);
      expect(slots.slice(-2)).toEqual(["to", word === "towards" ? "wards" : "ward"]);
      expect(assignStress(slots, word)).toBe(stress);
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["backward", "ˈbækwɝd"],
      ["forward", "ˈfɔɹwɝd"],
      ["upward", "ˈʌpwɝd"],
      ["downward", "ˈdaʊnwɝd"],
      ["aboard", "əˈbɔɹd"],
      ["award", "əˈwɔɹd"],
      ["Howard", "ˈhaʊɝd"],
    ])("keeps neighboring %s in its established frame", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the independent <how> onset in howitzer", () => {
      expect(rules.predict("howitzer", "en-US")).toMatch(/^haʊ/);
    });

    it("keeps the already-supported toward derivations", () => {
      expect(rules.predict("towardly", "en-US")).toBe("təˈwɔɹdɫi");
      expect(rules.predict("towardness", "en-US")).toBe("təˈwɔɹdnəs");
    });

    it("keeps the preposition and neighboring noun/verb readings stable in sentences", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
      const prep = phonemizer.phonemize("She walked toward the door.", { language: "en-US", returnArray: true });
      expect(prep.find(token => token.word === "toward")?.phoneme).toBe("təˈwɔɹd");
      expect(prep.find(token => token.word === "walked")?.phoneme).toBe("wɔkt");
      expect(prep.find(token => token.word === "door")?.phoneme).toBe("dɔɹ");

      const noun = phonemizer.phonemize("The award was presented.", { language: "en-US", returnArray: true });
      expect(noun.find(token => token.word === "award")?.phoneme).toBe("əˈwɔɹd");
      expect(noun.find(token => token.word === "presented")?.phoneme).toBe("pɝˈzɛntɪd");
    });
  });

})();

// Original suite: en-trans-ation-rhotic-reduction.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak rhotic vowel after trans- before -ation", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });

    it.each([
      ["transformation", "ˌtɹænsfɝˈmeɪʃən"],
      ["transportation", "ˌtɹænspɝˈteɪʃən"],
      ["retransformation", "ɹiˌtɹænsfɝˈmeɪʃən"],
      ["retransportation", "ɹiˌtɹænspɝˈteɪʃən"],
    ])("reduces unstressed rhotic OR in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["transform", "ˈtɹænsfɔɹm"],
      ["transport", "ˈtɹænˌspɔɹt"],
      ["importation", "ˌɪmpɔɹˈteɪʃən"],
      ["deformation", "ˌdiˌfɔɹˈmeɪʃən"],
      ["formation", "ˌfɔɹˈmeɪʃən"],
      ["organization", "ˌɔɹɡənəˈzeɪʃən"],
      ["transformations", "ˌtɹænsfɝˈmeɪʃənz"],
      ["transformational", "ˌtɹænsfɝˈmeɪʃənəɫ"],
    ])("preserves the neighboring rime in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps noun and verb readings stable in sentences", () => {
      const tokens = phonemizer.phonemize(
        "They transform the material and transport it. The transformation changed transportation.",
        { language: "en-US", returnArray: true },
      );
      expect(tokens.find(token => token.word === "transform")?.phoneme).toBe("tɹænsˈfɔɹm");
      expect(tokens.find(token => token.word === "transport")?.phoneme).toBe("ˈtɹænspɔɹt");
      expect(tokens.find(token => token.word === "transformation")?.phoneme).toBe("ˌtɹænsfɝˈmeɪʃən");
      expect(tokens.find(token => token.word === "transportation")?.phoneme).toBe("ˌtɹænspɝˈteɪʃən");
    });
  });

})();

// Original suite: en-trochaic-ile.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // American weak readings: https://www.merriam-webster.com/dictionary/fragile
  // https://www.merriam-webster.com/dictionary/missile
  // https://www.merriam-webster.com/dictionary/hostile
  const readings = [
    ["agile", "ˈædʒəɫ"], ["docile", "ˈdɑsəɫ"], ["facile", "ˈfæsəɫ"],
    ["fertile", "ˈfɝtəɫ"], ["fissile", "ˈfɪsəɫ"], ["fragile", "ˈfɹædʒəɫ"],
    ["futile", "ˈfjutəɫ"], ["gracile", "ˈɡɹæsəɫ"], ["hostile", "ˈhɑstəɫ"],
    ["missile", "ˈmɪsəɫ"], ["sterile", "ˈstɛɹəɫ"], ["virile", "ˈvɪɹəɫ"],
  ];
  describe.each([false, true])("trochaic weak ile, rules=%s", disableDict => {
    const withoutRoots = () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const [word] of readings) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      return engine;
    };
    it.each(readings)("retains the weak root after eviction: %s", (word, ipa) => {
      expect(withoutRoots().predict(word)).toBe(ipa);
    });
    it.each([
      ["nonfragile", "nɑnˈfɹædʒəɫ"], ["nondocile", "nɑnˈdɑsəɫ"],
      ["nonsterile", "nɑnˈstɛɹəɫ"], ["nonhostile", "nɑnˈhɑstəɫ"],
      ["missiles", "ˈmɪsəɫz"], ["missile's", "ˈmɪsəɫz"],
    ])("preserves productive morphology: %s", (word, ipa) => {
      expect(withoutRoots().predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it.each([
      ["fragility", "fɹəˈdʒɪɫəti"], ["agility", "əˈdʒɪɫəti"],
      ["fertility", "fɝˈtɪɫəti"], ["futility", "fjuˈtɪɫəti"],
      ["mobile", "ˈmoʊbəɫ"], ["mobility", "moʊˈbɪɫəti"],
      ["gerbil", "ˈdʒɝbɪɫ"], ["daffodil", "ˈdæfədɪɫ"], ["hillbilly", "ˈhɪɫbɪɫi"],
    ])("keeps the stressed derivative and neighboring rime: %s", (word, ipa) => {
      expect(withoutRoots().predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("keeps custom roots and complete targets ahead of the class", () => {
      const engine = withoutRoots();
      engine.addPronunciation("fragile", "ˈkɛmp");
      expect(engine.predict("nonfragile")).toMatch(/ˈkɛmp$/);
      engine.addPronunciation("nonfragile", "ˈzɛmp");
      expect(engine.predict("nonfragile")).toBe("ˈzɛmp");
    });
    it.each([
      ["The fragile vase fell.", "fragile", "ˈfɹædʒəɫ"],
      ["They found a missile.", "missile", "ˈmɪsəɫ"],
      ["The missile interceptor works.", "missile", "ˈmɪsəɫ"],
      ["They remain hostile.", "hostile", "ˈhɑstəɫ"],
    ])("preserves the whole sentence: %s", (sentence, word, ipa) => {
      const api = createPhonemizer({ processors: [withoutRoots()] });
      const segments = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(segments.find(segment => segment.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-ui-ion-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

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

      const tokens = englishTokens(engine, "The clever reader will work toward fruition.");
      expect(tokens.find(t => t.word === "fruition")?.phoneme).toBe("fɹuˈɪʃən");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();

// Original suite: en-uity-and-silent-r-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("hiatus and silent rime boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("-uity retains the root vowel and a weak -ity nucleus", () => {
      for (const word of ["continuity", "ingenuity"]) expect(g2p.predict(word)).toContain("ˈnuə");
      expect(segments("annuity")).toContain("nuə");
      // The plural's lexical entry retains /uɪ/; the rule supplies /uə/.
      expect(segments("annuities")).toMatch(/nu[əɪ]tiz$/);
      expect(segments("ambiguity")).toContain("ɡjuə");
      expect(segments("acuity")).toContain("kjuə");
      expect(segments("promiscuity")).toContain("skjuə");
    });

    test("-uit + adjective y preserves its attested root in prefixed forms", () => {
      for (const word of ["fruity", "unfruity", "nonfruity", "superfruity", "fruitiness"])
        expect(segments(word)).toContain("fɹuti");
      for (const word of ["equity", "equities", "antiquity", "antiquities"])
        expect(segments(word)).toContain("kwə");
    });

    test("a silent-e coda does not hide a doubled-r boundary or move primary into its diphthong", () => {
      expect(g2p.predict("arrange")).toContain("ɝˈeɪn");
      for (const word of ["arranged", "arranging", "arranger", "prearrange"])
        expect(g2p.predict(word)).toContain("ɝˈeɪndʒ");
      expect(segments("dinger")).toContain("dɪŋɝ");
      expect(g2p.predict("arrive")).toContain("ɝˈaɪv");
      expect(g2p.predict("barrette")).toContain("bɝˈɛt");
      expect(g2p.predict("carriage")).toContain("kæɹ");
      expect(g2p.predict("deterrence")).toContain("tɝ");
      expect(segments("marrone")).toContain("mɑɹ");
    });

    test("contracted -riage has one weak nucleus", () => {
      for (const word of ["marriage", "remarriage", "carriage"])
        expect(g2p.predict(word)).toMatch(/ɹɪdʒ$/);
      expect(g2p.predict("beverage")).toMatch(/ɪdʒ$/);
      expect(g2p.predict("heritage")).toMatch(/[ɪə]dʒ$/);
    });
  });

})();
