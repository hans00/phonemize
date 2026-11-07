// Original suite: en-prefixed-enge.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("prefixed enge verbs, disableDict=%s", disableDict => {
   const engine = new EnglishG2P({disableDict});
   it.each(["avenge", "revenge"])("keeps the soft coda of %s", root => {
     const ipa = engine.predict(root)!;
     expect(ipa).toMatch(/ndʒ$/);
     expect(engine.predict(root + "d")).toBe(ipa + "d");
     expect(engine.predict(root.slice(0,-1) + "ing")).toBe(ipa + "ɪŋ");
   });
   it("preserves hard nasal roots and supplied names", () => {
     expect(engine.predict("belonged")).toBe("bɪˈɫɔŋd");
     expect(engine.predict("belonging")).toBe("bɪˈɫɔŋɪŋ");
     expect(engine.predict("ginsenged")).toMatch(/ŋd$/);
     expect(engine.predict("beiswenger")).toBe("ˈbaɪswɪndʒɝ");
     expect(engine.predict("clevenger")).toBe("ˈkɫɛvɪndʒɝ");
   });
   it("retains the verb in full sentences", () => {

     const tokens = englishTokens(engine, "The reader avenged the victim while another reader was avenging a friend.");
     expect(tokens.find(t=>t.word==="avenged")?.phoneme).toBe("əˈvɛndʒd");
     expect(tokens.find(t=>t.word==="avenging")?.phoneme).toBe("əˈvɛndʒɪŋ");
   });
   it("keeps caller root and explicit child ownership",()=>{
     const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
     delete dictionary.avenged;delete dictionary.avenging;Reflect.set(own,"dictionary",dictionary);
     own.addPronunciation("avenge","ˈzɛŋ");
     expect(own.predict("avenged")).toBe("ˈzɛŋd");
     expect(own.predict("avenging")).toBe("ˈzɛŋɪŋ");
     own.addPronunciation("avenged","ˈkɛŋ");expect(own.predict("avenged")).toBe("ˈkɛŋ");
   });
  });

})();

// Original suite: en-prefixed-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("Prefixed open roots before -ing (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it.each([
      ["ongoing", "ˈɑnˌɡoʊɪŋ"], ["misdoing", "ˌmɪsˈduɪŋ"],
      ["reseeing", "ˌɹiˈsiɪŋ"], ["onseeing", "ˈɑnˌsiɪŋ"],
      ["outdoing", "ˌaʊtˈduɪŋ"], ["redoings", "ɹiˈduɪŋz"],
    ])("preserves the hiatus in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it("does not invent a we prefix for wellbeing", () => {
      expect(engine.predict("wellbeing")).toMatch(/^[ˈˌ]?wɛɫ/);
    });

    it("keeps the complete noun stem in an OOV inflection", () => {
      expect(engine.predict("mangoing")).toBe("ˈmæŋɡoʊɪŋ");
    });

    it("retains the original open roots", () => {
      expect(engine.predict("doing")).toBe("ˈduɪŋ");
      expect(engine.predict("seeing")).toBe("ˈsiɪŋ");
      expect(engine.predict("going")).toMatch(/^ˈɡoʊɪ[nŋ]$/);
    });

    it("preserves adjective, noun and verb controls in a full sentence", () => {
      const tokens = englishTokens(engine, "The ongoing work is useful; they will work.");
      expect(tokens.find(t => t.word === "ongoing")?.phoneme).toBe("ˈɑnˌɡoʊɪŋ");
      expect(tokens.find(t => t.word === "useful")?.phoneme).toBe(engine.predict("useful", "en-US", "!V"));
      expect(tokens.filter(t => t.word === "work").map(t => t.phoneme)).toEqual(["wɝk", "wɝk"]);
    });
  });

})();

// Original suite: en-prefixed-infinitive.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const cases: Array<[string, string, string]> = [
    ["They plan to re-invite Nakano.", "invite", "ˌɪnˈvaɪt"],
    ["They plan to re-record music.", "record", "ɹɪˈkɔɹd"],
    ["They plan to re-read the book.", "read", "ɹid"],
    ["They plan to re-wound the tissue.", "wound", "wund"],
    ["They tried to wound the tissue.", "wound", "wund"],
    ["The guide refers to re-use of equipment.", "use", "jus"],
    ["They discussed the re-record.", "record", "ˈɹɛkɝd"],
    ["They have wound care supplies.", "wound", "wund"],
    ["He wound the clock yesterday.", "wound", "waʊnd"],
  ];
  it.each(cases)("keeps an infinitive and its nominal/past controls: %s", (text, word, ipa) => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
  describe.each([false, true])("vouched verbal bases own morphology (rules=%s)", disableDict => {
    it("owns regular inflections and a new agent without a child exception", () => {
      const e = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(e, "dictionary") };
      for (const word of ["wounded", "wounding"]) delete dictionary[word];
      Reflect.set(e, "dictionary", dictionary);
      expect(e.predict("wounded")).toBe("ˈwundɪd");
      expect(e.predict("wounding")).toBe("ˈwundɪŋ");
      expect(e.predict("wounder")).toBe("ˈwundɝ");
      e.addPronunciation("wound", "ˈzɛŋ");
      expect(e.predict("wounded")).toBe("ˈzɛŋd");
      expect(e.predict("wounding")).toBe("ˈzɛŋɪŋ");
      expect(e.predict("wounder")).toBe("ˈzɛŋɝ");
      e.addPronunciation("wounding", "ˈkɛŋ");
      expect(e.predict("wounding")).toBe("ˈkɛŋ");
    });
  });

})();

// Original suite: en-prefixed-silent-v-stems.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("a verified prefixed silent-e stem composes across nominal and adjective suffixes", () => {
    const g = new EnglishG2P({ disableDict: true });
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(g.predict("removal", "en-US", pos)).toMatch(/ˈmuvəɫ$/);
      expect(g.predict("removable", "en-US", pos)).toMatch(/ˈmuvəbəɫ$/);
      expect(g.predict("immovable", "en-US", pos)).toMatch(/ɪˈmuvəbəɫ$/);
      expect(g.predict("inconceivable", "en-US", pos)).toMatch(/kənˈsivəbəɫ$/);
    }
    expect(g.predict("probable")).toBe("ˈpɹɑbəbəɫ");
    expect(g.predict("survival")).toBe("sɝˈvaɪvəɫ");
    expect(g.predict("unlivable")).toBe("ənˈɫɪvəbəɫ");
    const p = createPhonemizer({ processors: [g] });
    const tokens = p.phonemize("The removable panel requires removal before the immovable base is checked.", { language: "en-US", returnArray: true });
    for (const word of ["removable", "removal", "immovable"]) expect(tokens.find(t => t.word === word)?.phoneme).toMatch(/ˈmuv/);
  });

  test("a supplied lexical stem propagates through a prefixed out-of-dictionary derivative", () => {
    for (const disableDict of [false, true]) {
      const g = new EnglishG2P({ disableDict });
      g.addPronunciation("approve", "əˈtɛv");
      expect(g.predict("reapproval")).toBe("ɹiəˈtɛvəɫ");
      expect(g.predict("reapprovable")).toBe("ɹiəˈtɛvəbəɫ");
    }
  });

  test("ambiguous prefix analyses do not choose a caller stem arbitrarily", () => {
    for (const disableDict of [false, true]) {
      const g = new EnglishG2P({ disableDict });
      g.addPronunciation("move", "ˈmuv");
      g.addPronunciation("bmove", "ˈbɛv");
      for (const word of ["abmovable", "abmoval"]) {
        const result = g.predict(word);
        expect(result).not.toContain("muv");
        expect(result).not.toContain("bɛv");
      }
    }
  });

})();

// Original suite: en-prefixed-solv-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  // Prefixal stressed solv voices s; solute/solution and free solvent do not.
  test.each([false, true])("keeps prefixed solv voicing after eviction (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   const words = ["absolve", "absolves", "absolved", "absolving", "dissolve", "dissolves", "dissolved", "dissolving", "dissolvable", "dissolver", "nondissolving"];
   for (const w of words) delete dictionary[w];
   Reflect.set(e, "dictionary", dictionary);
   for (const w of words) expect(e.predict(w)).toMatch(/z[ɑɔ][lɫ]v/);
   for (const w of ["absolute", "absolution", "dissolute", "dissolution", "solvent", "insolvent"]) expect(e.predict(w)).toContain("s");
   expect(e.predict("resolve")).toMatch(/z[ɑɔ][lɫ]v/);
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["They dissolve the salt.", "The dissolved salt was clear.", "The dissolvable material was clear."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^dissolv/.test(t.word))?.phoneme).toMatch(/z[ɑɔ][lɫ]v/);
  });
  test("preserves a caller-owned solv root", () => {
   const e = new EnglishG2P({ disableDict: true });
   e.addPronunciation("dissolve", "ˈdɪsɑlv");
   expect(e.predict("dissolve")).toBe("ˈdɪsɑlv");
   expect(e.predict("dissolving")).toMatch(/^ˈdɪsɑ[lɫ]vɪŋ$/);
  });

})();

// Original suite: en-prefixed-tent-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("prefixed free root -tent", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps the checked root vowel in the rules-only noun reading", () => {
      expect(rules.predict("content", "en-US")).toBe("ˈkɑntɛnt");
    });

    it("preserves the root in derivatives and leaves similar weak endings alone", () => {
      expect(rules.predict("contents", "en-US")).toBe("ˈkɑntɛnts");
      expect(rules.predict("contentment", "en-US")).toBe("kənˈtɛntmənt");
      expect(rules.predict("intent", "en-US")).toBe("ˌɪnˈtɛnt");
      expect(rules.predict("extent", "en-US")?.replace(/[ˈˌ]/g, "")).toBe("ɪkstɛnt");
      expect(rules.predict("patent", "en-US")).toBe("ˈpeɪtənt");
      expect(rules.predict("potent", "en-US")).toBe("ˈpoʊtənt");
      expect(rules.predict("latent", "en-US")).toBe("ˈɫeɪtənt");
      expect(rules.predict("student", "en-US")).toBe("ˈstudənt");
    });

    it("keeps noun/adjective and verb homograph readings in sentence context", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P()] });
      const ipa = (sentence: string, target = "content") => api.phonemize(sentence, {
        language: "en-US", returnArray: true,
      }).find(token => token.word.toLowerCase() === target)?.phoneme;

      expect(ipa("The content was clear.")).toBe("ˈkɑntɛnt");
      expect(ipa("She is content with it.")).toBe("kənˈtɛnt");
      expect(ipa("They content themselves with little.")).toBe("kənˈtɛnt");
      expect(ipa("The present was announced.", "present")).toBe("ˈpɹɛzənt");
      expect(ipa("She is present today.", "present")).toBe("ˈpɹɛzənt");
    });
  });

})();

// Original suite: en-prepositional-subject-priority.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  const tagger = new SimplePOSTagger();
  const tag = (words: string[], word: string) => {
    const index = words.indexOf(word);
    return tagger.tagWord(word, [words[index - 1], words[index + 1]], { words, index }, true).pos;
  };

  test("a plural subject remains available after a prepositional modifier", () => {
    expect(tag(["The", "vapors", "of", "the", "metal", "combine", "rapidly", "with", "oxygen", "."], "combine")).toBe("V");
    expect(tag(["The", "pages", "of", "the", "historical", "record", "list", "events", "."], "record")).toBe("N");
    expect(tag(["Rational", "analyses", "began", "to", "replace", "empiricism", "."], "analyses")).toBe("N");
    expect(tag(["The", "uses", "of", "the", "metal", "combine", "are", "varied", "."], "combine")).toBe("N");
  });

  test("the public pipeline preserves the verb and noun readings in complete sentences", () => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)?.phoneme;
    expect(phone("The vapors of the metal combine rapidly with oxygen.", "combine")).toBe("kəmˈbaɪn");
    expect(phone("The uses of the metal combine are varied.", "combine")).toBe("ˈkɑmbaɪn");
    expect(phone("The pages of the historical record list events.", "record")).toBe("ˈɹɛkɝd");
    expect(engine.predict("combine", "en-US", "V")).toBe("kəmˈbaɪn");
    expect(engine.predict("combine", "en-US", "N")).toBe("ˈkɑmbaɪn");
  });

})();

// Original suite: en-pretonic-de-rhotic.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("pretonic de before stressed rhotic (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test.each([
      ["determined", "V", "dɪˈtɝmənd"],
      ["determined", "ADJ", "dɪˈtɝmənd"],
      ["determining", "V", "dɪˈtɝmənɪŋ"],
      ["determinable", "ADJ", "dɪˈtɝmənəbəɫ"],
      ["determinant", "N", "dɪˈtɝmənənt"],
      ["deter", "V", "dɪˈtɝ"],
      ["detection", "N", "dɪˈtɛkʃən"],
      ["debater", "N", "dəˈbeɪtɝ"],
    ])("keeps the reading of %s as %s", (word, pos, expected) => {
      expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });

    test("preserves the verb and adjective in full sentence context", () => {
      expect(api.phonemize("They determined the result.", { language: "en-US" })).toContain("dɪˈtɝmənd");
      expect(api.phonemize("The determined team can deter theft.", { language: "en-US" }))
        .toBe("ðə dɪˈtɝmənd tim kən dɪˈtɝ θɛft.");
    });
  });

})();

// Original suite: en-pretonic-pro-inflections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // MW proceed independently lists the weak prə- variant and regular inflections.
  describe.each([false, true])("weak pro- inflection roots, disableDict=%s", disableDict => {
    const cold = () => {
      const e = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(e, "dictionary") };
      for (const word of ["proceeded", "proceeding", "proceedings"]) delete dictionary[word];
      Reflect.set(e, "dictionary", dictionary);
      return e;
    };
    it("retains onset r in regular inflections and their plurals", () => {
      const e = cold();
      expect(e.predict("proceeded")).toBe("pɹəˈsidɪd");
      expect(e.predict("proceeding")).toBe("pɹəˈsidɪŋ");
      expect(e.predict("proceedings")).toBe("pɹəˈsidɪŋz");
    });
    it("applies the spelling class to an unseen inflection, preserving caller ownership", () => {
      const e = cold();
      Reflect.get(e, "dictionary").proglim = "pɝˈɡɫɪm";
      expect(e.predict("proglimmed")).toBe("pɹəˈɡɫɪmd");
      e.addPronunciation("proglim", "ˈtɛst");
      expect(e.predict("proglimmed")).toBe("ˈtɛstɪd");
      e.addPronunciation("proceed", "pɝˈsid");
      expect(e.predict("proceeding")).toBe("pɝˈsidɪŋ");
      e.addPronunciation("proceeding", "ˈkʌstəm");
      expect(e.predict("proceeding")).toBe("ˈkʌstəm");
    });
    it("preserves strong pro- and ordinary rhotic roots", () => {
      const e = cold();
      expect(e.predict("pro")).toBe("ˈpɹoʊ");
      expect(e.predict("perturbing")).toMatch(/^pɝˈtɝb/);
    });
    it("preserves full-sentence noun/adjective/verb and past/modal controls", () => {
      const api = createPhonemizer({ processors: [cold()] });
      const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
      expect(pick("Work is proceeding slowly.", "proceeding")).toBe("pɹəˈsidɪŋ");
      expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
      expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
      if (!disableDict) {
        expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
        expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
      }
    });
  });

})();

// Original suite: en-pretonic-rhotic-kit.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("pretonic rhotic KIT before a velar (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["curriculum", "kɝˈɪkjəɫəm"], ["curriculums", "kɝˈɪkjəɫəmz"], ["curriculum's", "kɝˈɪkjəɫəmz"],
      ["hurries", "ˈhɝiz"], ["flurries", "ˈfɫɝiz"], ["hurry", "ˈhɝi"],
      ["vidaurri", "vɪˈdɔɹi"],
    ])("preserves the root or unaffected frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each(["curricular", "curricularly"])("keeps primary stress and root phones in %s", word => {
      expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(word === "curricular" ? "kɝˈɪkjəɫɝ" : "kɝˈɪkjəɫɝɫi");
    });
    it.each(["curricula", "extracurricular", "intercurricular"])("retains the owned root in %s", word => {
      expect(engine.predict(word)).toMatch(/kɝˈɪkj/);
    });
    it.each(["overrun", "overrunning", "overrecurrent", "underrate", "underrated", "counterrevolution"])(
      "retains the separate r at a prefix boundary in %s", word => {
        expect(engine.predict(word)).toMatch(/ɝ[ˈˌ]?ɹ/);
      },
    );
    it("preserves the existing prefix vowel and unrelated weak ending", () => {
      expect(engine.predict("nonrecurring")).toMatch(/ɹɪ[ˈˌ]?kɝ/);
      expect(engine.predict("scurrilous")).toMatch(/ɫəs$/);
    });
    it("retains exact roots and prefix boundaries after target eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["curriculum", "curricular"]) delete access.dictionary[word];
      expect(evicted.predict("curriculum")).toBe("kɝˈɪkjəɫəm");
      expect(evicted.predict("noncurricular")).toMatch(/nɑnkɝˈɪkj/);
      expect(evicted.predict("overcurriculum")).toMatch(/kɝ[ˈˌ]ɪkj/);
    });
    it("retains caller-owned r in a root and its compositions", () => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["curriculum", "curricular"]) delete access.dictionary[word];
      custom.addPronunciation("curriculum", "kɝˈɹɪkjəɫəm");
      custom.addPronunciation("curricular", "kɝˈɹɪkjəɫɝ");
      expect(custom.predict("curriculum")).toBe("kɝˈɹɪkjəɫəm");
      expect(custom.predict("overcurriculum")).toMatch(/kɝ[ˈˌ]ɹɪkj/);
      expect(custom.predict("noncurricular")).toMatch(/nɑnkɝˈɹɪkj/);
    });
    it("preserves noun, adjective and finite verb controls in prose", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The clever reader will work with the curriculum.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "curriculum")?.phoneme).toBe("kɝˈɪkjəɫəm");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
      const adjective = api.phonemize("The curricular plan will work.", { language: "en-US", returnArray: true });
      expect(adjective.find(t => t.word === "curricular")?.phoneme.replace(/ˌ/g, "")).toBe("kɝˈɪkjəɫɝ");
      expect(adjective.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();

// Original suite: en-pretonic-yod-ation.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("pretonic yod reduction (rules=%s)", disableDict => {
    it("reduces before the -ation stress while keeping the verb vowel", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("compute")).toBe("kəmˈpjut");
      expect(engine.predict("computation")).toBe("ˌkɑmpjəˈteɪʃən");

      const tokens = englishTokens(engine, "They compute the result before the computation starts.");
      expect(tokens.find(t => t.word === "compute")?.phoneme).toContain("pjut");
      expect(tokens.find(t => t.word === "computation")?.phoneme).toContain("pjəˈteɪʃən");
    });
    it("preserves explicit caller pronunciations", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("computation", "ˈzɛŋ");
      expect(engine.predict("computation")).toBe("ˈzɛŋ");
    });
  });

})();

// Original suite: en-primary-eality-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule1;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;
  // Strong a in -eality has its own nucleus; weak -ealistic is a separate class.
  test.each([false, true])("retains primary eality hiatus after eviction (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const word of ["reality", "realities", "unreality", "unrealities"]) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary);
   for (const [word, ipa] of [["reality", "ɹiˈæləti"], ["realities", "ɹiˈælətiz"], ["unreality", "ənɹiˈæləti"], ["unrealities", "ənɹiˈælətiz"]]) expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
   expect(e.predict("unrealistically")).toContain("ɹiə");
   if (!disableDict) expect(e.predict("realistic")).toContain("ɹiə");
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["The reality was harsh.", "The virtual reality system was clear.", "They described reality."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "reality")?.phoneme).toContain("iˈæ");
  });
  test("keeps caller-owned strong eality nuclei", () => {
   const e = new EnglishG2P({ disableDict: true });
   e.addPronunciation("reality", "ˈtɛst");
   expect(e.predict("reality")).toBe("ˈtɛst");
   expect(e.predict("realities")).toBe("ˈtɛsts");
  });

})();

// Original suite: en-primary-yod-stems.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false,true])("uses stressed coronal AmE stems after target eviction (rules=%s)",disableDict=>{
   const e=new EnglishG2P({disableDict}),d={...Reflect.get(e,"dictionary")};for(const w of ["duties","tunas","fondues"])delete d[w];Reflect.set(e,"dictionary",d);
   expect(e.predict("duties")).toBe("ˈdutiz");expect(e.predict("tunas")).toBe("ˈtunəz");expect(e.predict("fondues")).toMatch(/duz$/);expect(e.predict("fondues")).not.toContain("dju");
   for(const w of ["continue","continuing","continued","annual","annually"])expect(e.predict(w)).toContain("nju");
   expect(e.predict("value")?.replace(/ɫ/g,"l")).toContain("lju");expect(e.predict("hues")).toContain("hju");
   const api=createPhonemizer({processors:[e]});expect(api.phonemize("Their duties include studying tunas.",{language:"en-US",returnArray:true}).find(t=>t.word==="duties")?.phoneme).toBe("ˈdutiz");
  });
  test.each([false,true])("keeps historical RP yod without changing loan controls (rules=%s)",disableDict=>{
   const e=new EnglishG2P({disableDict}),d={...Reflect.get(e,"dictionary")};delete d.duties;delete d.tunas;delete d.fondues;Reflect.set(e,"dictionary",d);
   expect(e.predict("duties","en-GB")).toMatch(/^ˈdju/);expect(e.predict("tunas","en-GB")).toMatch(/^ˈtju/);expect(e.predict("fondues","en-GB")).not.toContain("dju");
   for(const w of ["dude","duvet","Dutch"])expect(e.predict(w,"en-GB")).not.toContain("dju");expect(e.predict("tutu","en-GB")).not.toContain("tju");
  });
  test("keeps supplied yod-bearing roots and explicit targets",()=>{
   const e=new EnglishG2P({disableDict:true});e.addPronunciation("duty","ˈdjuti");e.addPronunciation("tuna","ˈtjunə");expect(e.predict("duties")).toBe("ˈdjutiz");expect(e.predict("tunas")).toBe("ˈtjunəz");e.addPronunciation("duties","ˈtɛst");expect(e.predict("duties")).toBe("ˈtɛst");
  });

})();

// Original suite: en-privative-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("Privative prefixes (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });

    it.each([
      ["uncertainty", /ˈsɝtənti$/],
      ["undefined", /ˈfaɪnd$/],
      ["unknown", /ˈnoʊn$/],
      ["nonprofit", /ˈpɹɑf[ɪə]t$/],
    ] as const)("preserves the attested root in %s", (word, expected) => {
      expect(g2p.predict(word)).toMatch(expected);
    });

    it("preserves the citation reading of a participial root", () => {
      expect(g2p.predict("unread")).toMatch(/ɹɛd$/);
    });

    it("uses a supplied root in a new non- formation", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("local", "L OW1 K AH0 L");
      expect(custom.predict("nonlocal")).toMatch(/ˈɫoʊkəɫ$/);
    });

    it.each([
      ["unanimous", /^juˈnæ/],
      ["universe", /^ˈju/],
      ["understand", /stænd$/],
    ] as const)("keeps a non-privative boundary in %s", (word, expected) => {
      expect(g2p.predict(word)).toMatch(expected);
    });
  });

})();

// Original suite: en-productive-adverb-and-root-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("productive adverb and root frames (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("closed-class ever compounds retain the head and stress ever", () => {
      for (const word of ["however", "whatever", "whenever", "whoever", "whomever", "whichever"])
        expect(g2p.predict(word)).toMatch(/ˈ[^ˈ]*ɛvɝ$/);
      expect(segments("however")).toContain("haʊ");
      expect(segments("forever")).toBe("fɝɛvɝ");
      for (const word of ["believer", "reliever", "cheever"])
        expect(segments(word)).toMatch(/ivɝ$/);
    });

    test("ulatory inherits its ulate root without moving primary to the linker", () => {
      expect(g2p.predict("regulatory")).toMatch(/^ˈɹɛɡjə/);
      expect(g2p.predict("articulatory")).toContain("ˈtɪkjə");
      expect(g2p.predict("ambulatory")).toMatch(/^ˈæmbjə/);
      for (const word of ["obligatory", "compensatory"])
        expect(g2p.predict(word)).toMatch(/ˈ[^ˈ]*(?:ɪɡ|ɛns)/);
    });

    test("thematic itative retains the itate verb while root digraphs stay intact", () => {
      for (const word of ["imitative", "meditative", "qualitative", "quantitative"])
        expect(segments(word)).toMatch(/eɪtɪv$/);
      expect(segments("exploitative")).toContain("ɔɪtətɪv");
    });

    test("inter and intra keep the full prefix and an independently vouched root", () => {
      expect(g2p.predict("interact")).toContain("ɪntɝˈækt");
      expect(g2p.predict("interactive")).toContain("ɪntɝˈæktɪv");
      expect(segments("internet")).toContain("ɪntɝnɛt");
      expect(segments("interwoven")).toContain("ɪntɝwoʊv");
      expect(segments("intraday")).toContain("ɪntɹədeɪ");
      expect(segments("interceded")).toMatch(/sidɪd$/);
    });

    test("qual+i retains its rounded root vowel and other qu rimes keep theirs", () => {
      for (const word of ["quality", "equality", "requalify", "qualitative"])
        expect(segments(word)).toContain("kwɑɫ");
      expect(segments("quail")).toContain("kweɪɫ");
      expect(segments("quarter")).toContain("kwɔɹ");
    });
  });

})();

// Original suite: en-productive-noun-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("productive noun frames (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("-ability retains the adjective root and stresses -bil-", () => {
      for (const word of ["capability", "capabilities"]) expect(segments(word)).toContain("keɪpə");
      for (const word of ["liability", "liabilities", "reliability"]) expect(segments(word)).toContain("ɫaɪə");
      for (const word of ["capability", "liability", "reliability", "viability"])
        expect(g2p.predict(word)).toContain("ˈbɪɫ");
    });

    test("-ibility shares the weak suffix boundary with rule-exact adjective stems", () => {
      for (const word of ["flexibility", "possibility", "legibility", "feasibility"])
        expect(segments(word)).toMatch(/ə[b]ɪɫ[əɪ]ti$/);
      for (const word of ["ability", "stability", "instability", "disability"])
        expect(segments(word)).not.toContain("eə");
    });

    test("-uality retains both nuclei and its coalesced consonant", () => {
      for (const word of ["actuality", "mutuality", "punctuality", "spirituality"])
        expect(g2p.predict(word)).toContain("tʃuˈæ");
      expect(g2p.predict("sexuality")).toContain("kʃuˈæ");
      expect(g2p.predict("sensuality")).toContain("ʃuˈæ");
    });

    test("secondary stress counts a genuine hiatus while qu remains consonantal", () => {
      expect(segments("sexuality")).toContain("sɛkʃu");
      expect(g2p.predict("equality")).toMatch(/^ɪ/);
      expect(segments("quality")).toContain("kw");
    });
  });

})();

// Original suite: en-pronominal-manner.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;

  test("personal subjects and manner adverbs select bare silent-e predicates", () => {
    expect(pick("They bluntly refuse.", "refuse")).toContain("ˈfjuz");
    expect(pick("They currently live here.", "live")).toBe("ɫɪv");
    expect(pick("They frequently use the record.", "use")).toBe("juz");
  });
  test("copular inversions and nominal objects preserve adjective and noun readings", () => {
    for (const sentence of ["They are unusually close.", "Were they unusually close?", "Weren't they unusually close?", "They have unusually close ties."]) {
      expect(pick(sentence, "close")).toBe("kɫoʊs");
    }
    expect(pick("The refuse is here.", "refuse")).toMatch(/^ˈɹɛ/);
    expect(pick("They examine the use.", "use")).toBe("jus");
    expect(pick("The live recording is clear.", "live")).toBe("ɫaɪv");
  });
  test("zero-change past and modal controls retain tense", () => {
    expect(pick("They quietly read the book yesterday.", "read")).toBe("ɹɛd");
    expect(pick("They will quietly read the book.", "read")).toBe("ɹid");
  });

})();

// Original suite: en-pronounced-mne.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("pronounced e after obstruent + nasal (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["acne", "ˈækni"], ["acnes", "ˈækniz"], ["acne's", "ˈækniz"],
      ["acme", "ˈækmi"], ["acmes", "ˈækmiz"], ["acme's", "ˈækmiz"],
      ["daphne", "ˈdæfni"], ["daphnes", "ˈdæfniz"], ["daphne's", "ˈdæfniz"],
      ["borne", "ˈbɔɹn"], ["anne", "ˈæn"], ["home", "ˈhoʊm"],
      ["plane", "ˈpɫeɪn"],
    ])("preserves the root or control of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps the same ending productive outside the dictionary", () => {
      expect(engine.predict("macne")).toBe("ˈmækni");
    });
    it("does not tense a medial e", () => {
      expect(engine.predict("cadnetix")).toBe(disableDict ? "ˈkædnətɪks" : "ˌkædˈnɛtɪks");
    });
    it.each(["acne", "acme", "daphne"])("preserves caller-owned %s and its inflections", root => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation(root, "ˈzɛŋ");
      expect(custom.predict(root)).toBe("ˈzɛŋ");
      expect(custom.predict(root + "s")).toBe("ˈzɛŋz");
      expect(custom.predict(root + "'s")).toBe("ˈzɛŋz");
    });
    it("preserves noun, adjective and verb controls in a full sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will work despite acne.");
      for (const [word, ipa] of [["acne", "ˈækni"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-proper-role-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  describe.each([false, true])("proper object with a following role, rules=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    it.each([
      ["Afterwards, Sable uses Venom as bait.", "uses", "ˈjuzəz"],
      ["The stable uses Mozart for its music.", "uses", "ˈjuzəz"],
      ["Stable uses remain important.", "uses", "ˈjusəz"],
      ["The usable records Mozart collected remain valuable.", "records", "ˈɹɛkɝdz"],
      ["The usable records Mozart collected were preserved.", "records", "ˈɹɛkɝdz"],
      ["Reliable records Mozart played remain clear.", "records", "ˈɹɛkɝdz"],
      ...(!disableDict ? [["Phylogenetic analyses demonstrates a common ancestry.", "analyses", "əˈnæɫəˌsiz"]] : []),
    ])("keeps the complete clause: %s", (sentence, word, ipa) => {
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });
  it.each(["uses", "records", "permits"])("shares role-object syntax for %s", target => {
    const words = ["The", "stable", target, "Mozart", "for", "its", "music", "."];
    expect(new SimplePOSTagger().tagWord(target, ["stable", "Mozart"], { words, index: 2 }).pos).toBe("V");
  });

  it("keeps an adjective-modified noun before another predicate", () => {
    const words = ["Phylogenetic", "analyses", "demonstrates", "a", "common", "ancestry", "."];
    expect(new SimplePOSTagger().tagWord("analyses", ["Phylogenetic", "demonstrates"], { words, index: 1 }).pos).toBe("N");
  });

})();

// Original suite: en-proper-subject-object-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const api = () => createPhonemizer({ processors: [new EnglishG2P()] });
  it.each([
    "Gout was associated with overindulgence in alcohol and rich food and Hogarth uses it here for that purpose.",
    "Handel uses both polyphonic and homophonic settings to illustrate the text best.",
    "Hogarth uses it.", "Hogarth uses it there.", "Hogarth uses it successfully.",
    "Hogarth uses it for painting.", "Handel uses all orchestral instruments.",
    "The artist works and Handel uses both orchestral and vocal settings.",
    "The artist works, but Handel uses it carefully.",
  ])("recognizes a proper finite subject and its object: %s", sentence => {
    expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === "uses")?.phoneme).toBe("ˈjuzəz");
  });
  it.each([
    ["Handel records both include a chorus.", "records"],
    ["Handel records both are damaged.", "records"],
    ["Handel records it makes include the aria.", "records"],
    ["The school records it sent include every event.", "records"],
    ["Handel Records Both Classical Covers.", "Records"],
  ])("preserves nominal relatives and title-case name frames: %s", (sentence, word) => {
    expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe("ˈɹɛkɝdz");
  });
  it.each([
    ["The record was clear.", "record", "ˈɹɛkɝd"],
    ["The present moment matters.", "present", "ˈpɹɛzənt"],
    ["They present the award.", "present", "pɹɪˈzɛnt"],
  ])("preserves noun, adjective and verb controls: %s", (sentence, word, ipa) => {
    expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme).toBe(ipa);
  });
  it("preserves caller-supplied target pronunciation", () => {
    const engine = new EnglishG2P();
    engine.addPronunciation("uses", "ˈzɛmp");
    const own = createPhonemizer({ processors: [engine] });
    expect(own.phonemize("Hogarth uses it here.", { language: "en-US", returnArray: true }).find(segment => segment.word === "uses")?.phoneme).toBe("ˈzɛmp");
  });

})();
