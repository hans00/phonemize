// Original suite: en-research-s-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("re- + search root boundary (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");

    it("preserves the root-initial voiceless /s/ in research", () => {
      expect(stripStress(g2p.predict("research", "en-US"))).toBe("ɹisɝtʃ");
      if (disableDict) expect(g2p.trace("research", "en-US").path).toBe("rules");
    });

    it("keeps the other re-s voicing environments and root derivatives stable", () => {
      expect(stripStress(g2p.predict("researcher", "en-US"))).toBe("ɹisɝtʃɝ");
      expect(stripStress(g2p.predict("researching", "en-US"))).toBe("ɹisɝtʃɪŋ");
      expect(stripStress(g2p.predict("result", "en-US"))).toBe(disableDict ? "ɹizʌɫt" : "ɹɪzʌɫt");
      expect(stripStress(g2p.predict("reside", "en-US"))).toBe("ɹizaɪd");
      expect(stripStress(g2p.predict("reserve", "en-US"))).toBe("ɹizɝv");
      expect(stripStress(g2p.predict("present", "en-US"))).toBe(disableDict ? "pɹizɛnt" : "pɹɛzənt");
    });
  });

  it("keeps the research root reading in sentence context", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = api.phonemize("The research continued after the result was reviewed.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.find(token => token.word === "research")?.phoneme).toBe("ɹiˈsɝtʃ");
    expect(tokens.find(token => token.word === "result")?.phoneme).toBe("ɹiˈzʌɫt");
  });

})();

// Original suite: en-resign-resort-reference.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US: resign /rɪˈzaɪn/ and resort /rɪˈzɔːrt/.
  describe("lexical resign and resort", () => {
    const engine = new EnglishG2P();

    test.each([
      ["resign", "ɹɪˈzaɪn"], ["resigns", "ɹɪˈzaɪnz"],
      ["resigned", "ɹɪˈzaɪnd"], ["resigning", "ɹɪˈzaɪnɪŋ"],
      ["resort", "ɹɪˈzɔɹt"], ["resorts", "ɹɪˈzɔɹts"],
      ["resorted", "ɹɪˈzɔɹtɪd"], ["resorting", "ɹɪˈzɔɹtɪŋ"],
    ])("reads %s with its lexical onset", (word, expected) => {
      expect(engine.predict(word)).toBe(expected);
    });

    test("keeps the lexical readings in sentence context", () => {

      for (const [sentence, word, expected] of [
        ["They resign from the company.", "resign", "ɹɪˈzaɪn"],
        ["She resigned yesterday.", "resigned", "ɹɪˈzaɪnd"],
        ["The resort was busy.", "resort", "ɹɪˈzɔɹt"],
        ["They resorted to the courts.", "resorted", "ɹɪˈzɔɹtɪd"],
      ]) {
        const tokens = englishTokens(engine, sentence);
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(expected);
      }
    });

    test.each([false, true])("keeps explicit re- boundaries (rules=%s)", disableDict => {
      const e = new EnglishG2P({ disableDict });
      expect(e.predict("re-sign")).toContain("saɪn");
      expect(e.predict("re-sort")).toContain("sɔɹt");
    });
  });

})();

// Original suite: en-restored-y-and-bound-ology.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  describe.each([false, true])("restored y and bound suffix context (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test("supplied y stems retain their diphthong before vowel-initial suffixes", () => {
      for (const word of ["reliable", "reliance", "pliable", "justifiable", "verifiable", "identifiable"])
        expect(g2p.predict(word)).toMatch(/aɪ/);
      for (const word of ["variable", "variance"])
        expect(g2p.predict(word)).toMatch(/^ˈvɛɹi/);
    });
    test("bound i stems keep their independent hiatus or palatalization", () => {
      expect(g2p.predict("deviance")).toMatch(/ˈdivi/);
      expect(g2p.predict("invariable")).toMatch(/ˈvɛɹi/);
      expect(g2p.predict("conscience")).toMatch(/nʃəns$/);
      expect(g2p.predict("experience")).toMatch(/ˈpɪɹi/);
    });
    test("a pronounced restored e cannot supply an ance stem", () => {
      expect(g2p.predict("entrance")).toMatch(/^ˈɛntɹəns$/);
      expect(g2p.predict("continuance")).toMatch(/ˈtɪnjuəns$/);
      expect(g2p.predict("issuance")).toMatch(/^ˈɪʃuəns$/);
      expect(g2p.predict("allowance")).toMatch(/ˈ[lɫ]aʊəns$/);
    });
    test("pretonic o retains whole-word reduction before ology", () => {
      expect(g2p.predict("anthropology")).toMatch(/θɹəˈpɑ/);
      expect(g2p.predict("methodology")).toMatch(/mɛθəˈdɑ/);
      expect(g2p.predict("immunology")).toMatch(/m[ˌ]?juˈnɑ/);
      expect(g2p.predict("biology")).toMatch(/baɪˈɑ/);
    });
    test("short vowel-initial roots take -ology stress on the whole spelling", () => {
      expect(g2p.predict("apology")).toMatch(/^əˈpɑɫəˌ?dʒi$/);
      expect(g2p.predict("astrology")).toBe("əˈstɹɑɫədʒi");
      expect(g2p.predict("ecology")).toMatch(/^(?:ɪ|i)ˈkɑɫədʒi$/);
      for (const word of ["astrology", "ecology"]) {
        expect(g2p.predict(word, "en", "NN")).toBe(g2p.predict(word, "en"));
      }
    });
    test("keeps the -ology readings and neighboring controls in sentence context", () => {

      const tokens = englishTokens(g2p, "Ecology and astrology influence biology, technology, and psychology.");
      const ipa = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(ipa("ecology")).toMatch(/^(?:ɪ|i)ˈkɑɫədʒi$/);
      expect(ipa("astrology")).toBe("əˈstɹɑɫədʒi");
      expect(ipa("biology")).toBe("ˌbaɪˈɑɫədʒi");
      expect(ipa("technology")).toBe("ˌtɛknˈɑɫədʒi");
      expect(ipa("psychology")).toBe("ˌsaɪˈkɑɫədʒi");
    });
  });

  test("public suffix composition keeps the restored root and weak vowel", () => {
    expect(toIPA("reliable")).toMatch(/aɪ/);
    expect(toIPA("entrance")).toMatch(/ɛntɹəns/);
    expect(toIPA("methodology")).toMatch(/θəˈdɑ/);
  });

})();

// Original suite: en-rhotic-compounds-and-closure.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("vouched rhotic compounds and closure roots (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const access = engine as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["overall", "coverall", "enclosure"])
      for (const ending of ["", "s", "'s"]) delete access.dictionary[word + ending];

    it.each([
      ["overall", "ˈoʊvɝˌɔɫ"], ["coverall", "ˈkʌvɝˌɔɫ"], ["enclosure", "ɛnˈkɫoʊʒɝ"],
    ])("retains the root, plural and possessive in %s after eviction", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
      expect(engine.predict(word + "s")).toBe(ipa + "z");
      expect(engine.predict(word + "'s")).toBe(ipa + "z");
    });
    it.each([
      ["nonoverall", "oʊvɝˌɔɫ"], ["noncoverall", "kʌvɝˌɔɫ"], ["nonenclosure", "ɛnˈkɫoʊʒɝ"],
    ])("retains the complete root after a prefix in %s", (word, root) => {
      expect(engine.predict(word)).toContain(root);
    });
    it.each([
      ["pepperell", "ˈpɛpɝəɫ"], ["pickerell", "ˈpɪkɝəɫ"],
      ["witherell", disableDict ? "ˈwɪðɝəɫ" : "ˈwɪθɝəɫ"],
      ["foreclosure", "ˌfɔɹˈkɫoʊʒɝ"], ["closure", "ˈkɫoʊʒɝ"],
      // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/disclosure
      ["disclosure", "dɪˈskɫoʊʒɝ"], ["overarm", "ˌoʊvɝˈɑɹm"],
      ["overeat", "ˈoʊvɝˌit"],
      ["cynosure", disableDict ? "ˈsɪnəʒɝ" : "ˈsaɪnɔˌsɝ"],
      ["exposure", disableDict ? "ɪksˈpoʊʒɝ" : "ɪkˈspoʊʒɝ"],
    ])("preserves the frozen reading of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves caller-owned complete roots", () => {
      for (const word of ["overall", "enclosure"]) {
        const custom = new EnglishG2P({ disableDict });
        custom.addPronunciation(word, "ˈdɛmoʊ");
        expect(custom.predict(word)).toBe("ˈdɛmoʊ");
        expect(custom.predict("non" + word)).toBe("nɑnˈdɛmoʊ");
      }
    });
    it("preserves the existing lexical prefix variant in the plural", () => {
      const originalTables = new EnglishG2P({ disableDict });
      expect(originalTables.predict("enclosure")).toBe("ɛnˈkɫoʊʒɝ");
      expect(originalTables.predict("enclosures")).toBe(disableDict ? "ɛnˈkɫoʊʒɝz" : "ɪnˈkɫoʊʒɝz");
    });
    it("preserves noun, adjective and finite verb controls in a complete sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will harvest beside the enclosure.");
      for (const [word, ipa] of [["enclosure", "ɛnˈkɫoʊʒɝ"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["harvest", "ˈhɑɹvəst"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-rhotic-short-e-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("short rhotic e roots (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["carpet", "ˈkɑɹpət"], ["harvest", "ˈhɑɹvəst"],
      ["carmen", "ˈkɑɹmən"], ["sherbet", "ˈʃɝbət"],
      ["worsening", "ˈwɝsənɪŋ"], ["darkening", "ˈdɑɹkənɪŋ"],
      // Collins US bird reading: https://www.collinsdictionary.com/dictionary/english/barbet
      ["barbet", "ˈbɑɹbət"],
      ["pet", "ˈpɛt"], ["vest", "ˈvɛst"],
      ["barbell", "ˈbɑɹˌbɛɫ"], ["hairnet", "ˈhɛɹˌnɛt"], ["warhead", "ˈwɔɹˌhɛd"],
      ["martech", "ˈmɑɹˌtɛk"], ["spartech", "ˈspɑɹˌtɛk"],
      ["stardent", "ˈstɑɹˌdɛnt"], ["parsec", "ˈpɑɹˌsɛk"],
    ])("keeps the whole root or true compound in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps the independent directional tail full", () => {
      expect(engine.predict("farwest")?.replace(/[ˈˌ]/g, "")).toBe("fɑɹwɛst");
    });
    it("retains prefix, agent and plural readings after exception eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["carpet", "carmen", "harvest", "sherbet"]) delete access.dictionary[word];
      for (const [word, ipa] of [
        ["carpet", "ˈkɑɹpət"], ["harvest", "ˈhɑɹvəst"], ["carpets", "ˈkɑɹpəts"],
        ["harvester", "ˈhɑɹvəstɝ"], ["harvesters", "ˈhɑɹvəstɝz"],
        ["noncarpet", "nɑnˈkɑɹpət"], ["nonharvest", "nɑnˈhɑɹvəst"],
      ]) expect(evicted.predict(word)).toBe(ipa);
      expect(evicted.predict("carpeted")).toContain("kɑɹpət");
      expect(evicted.predict("harvested")).toContain("hɑɹvəst");
    });
    it("preserves caller-owned complete roots", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("carpet", "ˈkɑɹpɛt");
      expect(custom.predict("carpet")).toBe("ˈkɑɹpɛt");
      expect(custom.predict("noncarpet")).toMatch(/pɛt$/);
    });
    it("preserves noun, adjective and finite verb readings in full sentences", () => {

      const tokens = englishTokens(engine, "The clever reader will harvest beside the carpet.");
      expect(tokens.find(t => t.word === "harvest")?.phoneme).toBe("ˈhɑɹvəst");
      expect(tokens.find(t => t.word === "carpet")?.phoneme).toBe("ˈkɑɹpət");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    });
  });

})();

// Original suite: en-rhotic-syllable-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src") = require("../src");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  describe("rhotic cleanup respects lexical and syllable boundaries", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("composes around from its weak prefix and verified root, preserving vouched whole-word forms", () => {
      expect(rules.predict("around", "en-US")).toBe("əˈɹaʊnd");
      expect(rules.predict("arise", "en-US")).toBe("ɝˈaɪz");
      expect(rules.predict("arrange", "en-US")).toBe("ɝˈeɪndʒ");
      expect(rules.predict("arrive", "en-US")).toBe("ɝˈaɪv");
      expect(rules.predict("array", "en-US")).toBe("ɝˈeɪ");
    });

    it("keeps within-syllable rhotic vowels and the full sentence route", () => {
      expect(rules.predict("general", "en-US")).toBe("ˈdʒɛnɝəɫ");
      expect(rules.predict("different", "en-US")).toBe("ˈdɪfɝənt");


      const tokens = englishTokens(rules, "We walked around the park.");
      expect(tokens.find(token => token.word === "around")?.phoneme).toBe("əˈɹaʊnd");
    });
  });

})();

// Original suite: en-rhotic-urrent.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("rhotic vowel before the second r in -urrent/-urrant", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["current", "ˈkɝənt"],
      ["currant", "ˈkɝənt"],
      ["concurrent", "kənˈkɝənt"],
      ["recurrent", "ɹiˈkɝənt"],
      ["intercurrent", "ɪnˈtɝkɝənt"],
      ["undercurrent", "ˌʌndɝˈkɝənt"],
    ])("does not emit a duplicate /r/ in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["currency", "ˈkɝənsi"],
      ["curriculum", "kɝˈɪkjəɫəm"],
      ["burrito", "bɝˈɹitoʊ"],
      ["surreal", "ˈsɝɹiɫ"],
      ["overrun", "ˈoʊvɝɹən"],
      ["overreach", "ˈoʊvɝɹitʃ"],
    ])("preserves the neighboring %s rime", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("keeps word context and neighboring content words stable", () => {

      const tokens = englishTokens(rules, "The current rate and currant buns recur.");
      expect(tokens.find(token => token.word === "current")?.phoneme).toBe("ˈkɝənt");
      expect(tokens.find(token => token.word === "currant")?.phoneme).toBe("ˈkɝənt");
      expect(tokens.find(token => token.word === "rate")?.phoneme).toBe("ɹeɪt");
      expect(tokens.find(token => token.word === "recur")?.phoneme).toBe("ɹiˈkɝ");
    });

    it("uses Cambridge US current in the default dictionary route", () => {
      expect(new EnglishG2P().predict("current", "en-US")).toBe("kɝənt");
      expect(new EnglishG2P().predict("concurrent", "en-US")).toBe("kənˈkɝənt");
    });
  });

})();

// Original suite: en-root-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("root hiatus (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("creat- preserves both nuclei through neutral and shifting suffixes", () => {
      for (const word of ["create", "creative", "creator", "created", "creating", "creativity", "recreate"])
        expect(g2p.predict(word)).toMatch(/i[ˈˌ]?eɪ/);
      for (const word of ["create", "creative", "creator"])
        expect(g2p.predict(word)).toContain("iˈeɪ");
      expect(g2p.predict("creativity")).toContain("ˈtɪv");
      expect(g2p.predict("creation")).toContain("eɪʃən");
      for (const word of ["cream", "creature", "great", "treat"])
        expect(g2p.predict(word)).not.toContain("ieɪ");
    });

    test("-iety has a stressed diphthong followed by weak nuclei", () => {
      for (const word of ["piety", "society", "variety", "propriety", "impropriety", "sobriety", "varieties"])
        expect(g2p.predict(word)).toContain("aɪəti");
      expect(g2p.predict("society")).toMatch(/ˈsaɪ/);
      expect(g2p.predict("diet")).toContain("aɪət");
      expect(g2p.predict("niece")).toContain("nis");
      expect(g2p.predict("quiet")).toContain("aɪət");
    });

    test("initial who- contrasts with whole and the other wh+o rimes", () => {
      for (const word of ["who", "whom", "whose", "whoever", "whomever"])
        expect(g2p.predict(word)).toMatch(/^[ˈˌ]?hu/);
      expect(g2p.predict("whole")).toContain("oʊ");
      expect(g2p.predict("whorl")).toContain("ɔɹ");
      expect(g2p.predict("whopper")).toMatch(/[ɑɔ]/);
      expect(g2p.predict("whoosh")).toMatch(/[uʊ]/);
      expect(g2p.predict("lawhon")).not.toContain("hu");
    });
  });

})();

// Original suite: en-root-rimes-and-inflection-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("root rimes and inflection boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["feed", "need", "seed", "reed", "deed", "bleed", "breed", "tweed", "freed", "agreed", "proceed"])("%s retains its ee nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(/id$/);
    });
    test.each(["feeding", "feeder", "seeding", "seeded", "needed", "deeds"])("%s keeps the ee root in a derivative", word => {
      expect(g2p.predict(word, "en")).toMatch(/id/);
    });
    test.each(["died", "lied", "tied", "untied", "untried", "vied", "pied", "tried", "cried", "fried", "shied"])("%s preserves its ie/y nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(/aɪd$/);
    });
    test.each(["added", "quoted", "coated", "printed", "fitted"])("%s retains a real syllabic past ending", word => {
      expect(g2p.predict(word, "en")).toMatch(/[ɪə]d$/);
    });
    test.each(["angry", "hungry", "angrily", "hungrily"])("%s preserves the stop before internal r", word => {
      expect(g2p.predict(word, "en")).toMatch(/ŋɡɹ/);
    });
    test.each(["sing", "singing", "singer", "song", "springroll", "strongroom", "wingrail"])("%s keeps an ordinary or compound ng boundary", word => {
      expect(g2p.predict(word, "en")).toMatch(/ŋ/);
      expect(g2p.predict(word, "en")).not.toMatch(/ŋɡ/);
    });
    test.each(["header", "heading", "headed", "deaden", "threading"])("%s preserves the split ead nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɛd/);
    });
    test.each(["breast", "abreast", "breasts", "breastfeeding", "breasted", "breasting", "breaster"])("%s keeps lax ea before the fricative cluster", word => {
      expect(g2p.predict(word, "en")).toMatch(/bɹɛst/);
    });
    test.each(["beast", "feast", "east", "least"])("%s keeps the high ea vowel outside the lax onset frame", word => {
      expect(g2p.predict(word, "en")).toMatch(/ist/);
    });
    test.each(["bear", "pear", "bearing", "bearer", "bearable"])("%s preserves the initial labial ear nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɛɹ/);
    });
    test.each(["beard", "appear", "appearing", "fear", "hear", "spear"])("%s keeps the contrasting high ear nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɪɹ/);
    });
    test("pearl retains its coda-controlled rhotic nucleus", () => {
      expect(g2p.predict("pearl", "en")).toMatch(/ɝ/);
    });
  });

  test.each(["feed", "tied", "angry", "heading", "breast", "bearer", "bearing"])("%s has the corrected nucleus through the public API", word => {
    const expected = { feed: /id$/, tied: /aɪd$/, angry: /ŋɡɹ/, heading: /ɛd/, breast: /bɹɛst/, bearer: /ɛɹ/, bearing: /ɛɹ/ };
    expect(toIPA(word)).toMatch(expected[word as keyof typeof expected]);
  });

})();

// Original suite: en-rp-coronal-free-u.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])(
    "preserves the historical RP yod contrast (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      for (const [word, us, gb] of [
        ["newly", "ˈnuɫi", "ˈnjuɫi"],
        ["news", "ˈnuz", "ˈnjuz"],
        ["newspaper", "ˈnuzˌpeɪpɝ", "ˈnjuzˌpeɪpə"],
        ["newsletter", "ˈnuzˌɫɛtɝ", "ˈnjuzˌɫɛtə"],
        ["dues", "ˈduz", "ˈdjuz"],
        ["durable", "ˈdʊɹəbəɫ", "ˈdjʊɹəbəɫ"],
      ]) {
        expect(e.predict(word, "en-US")).toBe(us);
        expect(e.predict(word, "en-GB")).toBe(gb);
      }
      for (const word of ["dude", "duvet"])
        expect(e.predict(word, "en-GB")).not.toMatch(/^ˈ?dju/);
      e.addPronunciation("newly", "ˈzɛmp");
      expect(e.predict("newly", "en-GB")).toBe("ˈzɛmp");
    },
  );
  test("preserves explicit noun, adjective and verb controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const [sentence, word, ipa] of [
      ["The present moment matters.", "present", "ˈpɹɛzənt"],
      ["They present the award.", "present", "pɹɪˈzɛnt"],
      ["The record was clear.", "record", "ˈɹɛkɝd"],
    ])
      expect(
        api
          .phonemize(sentence, { language: "en-US", returnArray: true })
          .find((t) => t.word === word)?.phoneme,
      ).toBe(ipa);
  });

})();

// Original suite: en-rrow-prefix-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])(
    "owns the doubled-r ow root after eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const w of ["arrow", "arrows", "arrowed", "arrowing"]) delete d[w];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["arrow", "ˈæɹoʊ"],
        ["arrows", "ˈæɹoʊz"],
        ["arrowed", "ˈæɹoʊd"],
        ["arrowing", "ˈæɹoʊɪŋ"],
        ["narrow", "ˈnæɹoʊ"],
        ["barrow", "ˈbæɹoʊ"],
        ["aglow", "əˈɡɫoʊ"],
        ["arrive", "ɝˈaɪv"],
        ["array", "ɝˈeɪ"],
        ["arrange", "ɝˈeɪndʒ"],
      ])
        expect(e.predict(word)).toBe(ipa);
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("The arrow points toward a narrow opening.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "arrow")?.phoneme,
      ).toBe("ˈæɹoʊ");
    },
  );
  test("preserves supplied roots and targets", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("arrow", "ˈzɛmp");
    expect(e.predict("arrows")).toBe("ˈzɛmps");
    e.addPronunciation("arrowed", "ˈtɛst");
    expect(e.predict("arrowed")).toBe("ˈtɛst");
  });

})();

// Original suite: en-rry-age-derivation.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("-rry to -rriage stem derivation", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("retains the y-final root vowel in marriage and carriage", () => {
      expect(rules.predict("marriage", "en-US")).toBe("ˈmɛɹɪdʒ");
      expect(rules.predict("carriage", "en-US")).toBe("ˈkæɹɪdʒ");
      expect(rules.predict("remarriage", "en-US")).toBe("ɹiˈmɛɹɪdʒ");
    });

    it("does not apply the rry stem rule to neighboring non-roots", () => {
      expect(rules.predict("marry", "en-US")).toBe("ˈmɛɹi");
      expect(rules.predict("carry", "en-US")).toBe("ˈkɛɹi");
      expect(rules.predict("triage", "en-US")).toBe("tɹiˈeɪdʒ");
      expect(rules.predict("miscarriage", "en-US")).toBe("mɪˈskæɹɪdʒ");
      expect(rules.predict("intermarriage", "en-US")).toBe("ɪnˈtɝmɝɪdʒ");
    });

    it("keeps noun plurals and y-stem inflections on their own routes", () => {
      expect(rules.predict("marriages", "en-US")).toBe("ˈmɛɹɪdʒəz");
      expect(rules.predict("carriages", "en-US")).toBe("ˈkæɹɪdʒəz");
      expect(rules.predict("remarriages", "en-US")).toBe("ɹiˈmɛɹɪdʒəz");
      expect(rules.predict("married", "en-US")).toBe("ˈmɛɹid");
      expect(rules.predict("carried", "en-US")).toBe("ˈkæɹid");
    });
  });

})();

// Original suite: en-rule-a-reduction.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for the <a>/<e> reduction residue, the 2026-09-10
  // heuristic-learning pass. Each frame was counted over data/en/dict.json and
  // then measured as a win/loss list on the rules-only path before adoption.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("a word-initial unstressed closed <a> keeps /æ/", () => {
    it.each([
      ["magnetic", "mæɡˈnɛtɪk"],
      ["fantastic", "fænˈtæstɪk"],
      ["atlanta", "ætˈɫæntə"],
      ["athletic", "æθˈɫɛtɪk"],
      ["advantage", "ædˈvæntɪdʒ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("still reduces across an assimilated prefix's doubled consonant", () => {
      expect(rules("assail")).toBe("əˈseɪɫ");
      expect(rules("affair")).toBe("əˈfɛɹ");
    });

    it("still reduces in the abs-/ads- frame, which has no majority", () => {
      expect(rules("absurdity")).toBe("əbˈsɝdəti");
    });

    it("does not apply to an open initial syllable", () => {
      expect(rules("agenda")).toMatch(/^ə/);
    });
  });

  describe("a word-initial unstressed closed <e> keeps /ɛ/", () => {
    it.each([
      ["september", "sɛpˈtɛmbɝ"],
      ["entangle", "ɛnˈtæŋɡəɫ"],
      ["bendectin", "bɛnˈdɛktɪn"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps /ɛ/ under a doubled coda too", () => {
      expect(rules("centennial")).toMatch(/^sɛn/);
    });

    it("leaves the ex- prefix raised, where the lexicon has no majority", () => {
      expect(rules("expand")).toMatch(/^ɪk/);
    });

    it("leaves an onsetless sonorant coda before /s/ raised", () => {
      expect(rules("ensconce")).toBe("ɪnˈskɑns");
    });
  });

  describe("a final unstressed <e> under a non-inflectional obstruent coda keeps /ɛ/", () => {
    it.each([
      ["abend", "ˈæbɛnd"],
      ["hirschfeld", "ˈhɝʃfɛɫd"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps the vowel of a -ct/-ck coda", () => {
      expect(rules("accept")).toMatch(/sɛpt$/);
      expect(rules("handheld")).toMatch(/hɛɫd$/);
    });

    it("still reduces under an inflectional coda built from d/s/t", () => {
      expect(rules("aimless")).toBe("ˈeɪmɫəs");
      expect(rules("basket")).toBe("ˈbæskət");
    });
  });

})();

// Original suite: en-rule-a-tensing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule1;

  // Rule-path regressions for the two `a` classes taken in the 2026-09-10
  // pass. Each case is a rule, not a word; the words are class exemplars and
  // every frame was measured over the whole dict before adoption. Stress
  // cases pin the syllable index the rule decides rather than a full IPA
  // string, because a derived word's segments can move when build-dict
  // re-mines the table.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");
  const stress = (word: string) => assignStress(syllabify(word), word);

  describe("the weak a- prefix gives its stress to a tense root", () => {
    it.each(["avoid", "anoint", "adroit", "appoint"])(
      "an oi rime is tense, so %s stresses the root",
      (word) => expect(stress(word)).toBe(1),
    );

    it.each(["alone", "amaze", "alive", "alike", "arise", "apace"])(
      "a magic-e root split into its own syllable still counts: %s",
      (word) => expect(stress(word)).toBe(1),
    );

    it.each(["assume", "approve", "arrive", "allude", "apprise"])(
      "the assimilated form behaves the same: %s",
      (word) => expect(stress(word)).toBe(1),
    );

    it("reduces the prefix vowel once the primary has moved off it", () => {
      expect(rules("avoid")).toBe("əˈvɔɪd");
      expect(rules("alone")).toBe("əˈɫoʊn");
      expect(rules("assume")).toBe("əˈsum");
    });

    it("leaves a lax root with initial stress", () => {
      expect(stress("acid")).toBe(0);
      expect(stress("adam")).toBe(0);
      expect(stress("atom")).toBe(0);
    });
  });

  describe("two-syllable endings that tense an open a", () => {
    // The rule owns the stressed vowel, nothing after it: -ier(s) and -ies
    // words reach the morphology handlers, which read the mined table even
    // under disableDict, so only the segment under test is pinned.
    const firstVowel = (word: string) =>
      /^ˈ[^aeiouɪɛæəʌɑɔʊoɝɚ]*(eɪ|aɪ|aʊ|ɔɪ|oʊ|ɑɹ|ɔɹ|ɛɹ|ɪɹ|ɝ|ɚ|[iɪɛæəʌɑɔʊuo])/.exec(
        rules(word) ?? "",
      )?.[1];

    it.each([
      "haste", "waste", "taste", "chaste",
      "ladies", "babies", "gravies",
      "bakery", "slavery", "drapery",
      "glacier", "brazier", "crazier",
      "haley", "casey", "bakey",
    ])("%s keeps the tense vowel of its magic-e base", (word) =>
      expect(firstVowel(word)).toBe("eɪ"));

    it("spells the monomorphemic s+stop+e words in full", () => {
      expect(rules("haste")).toBe("ˈheɪst");
      expect(rules("waste")).toBe("ˈweɪst");
    });

    it("keeps an r-initial ending lax, as the shared frame does", () => {
      expect(firstVowel("carey")).not.toBe("eɪ");
      expect(firstVowel("baron")).not.toBe("eɪ");
    });

    it("does not reach a two-consonant onset on the ending", () => {
      expect(firstVowel("bagley")).not.toBe("eɪ");
    });
  });

})();

// Original suite: en-rule-back-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for the back-vowel classes fixed in the 2026-09
  // heuristic-learning pass: LOT vs THOUGHT before /ŋ/ and /f/, the /w/
  // rounding of a following a, the loan-word final a, and the weak a-
  // prefix. Every case is a rule, not a word — the word named is the class
  // exemplar, and each frame was measured over the whole dict before
  // adoption.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("LOT → THOUGHT before ŋ and f", () => {
    it.each([
      ["long", "ˈɫɔŋ"],
      ["song", "ˈsɔŋ"],
      ["strong", "ˈstɹɔŋ"],
      ["wrong", "ˈɹɔŋ"],
      ["belong", "bɪˈɫɔŋ"],
      ["strongly", "ˈstɹɔŋɫi"],
      ["songs", "ˈsɔŋz"],
      ["off", "ˈɔf"],
      ["offer", "ˈɔfɝ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("rounds the vowel across the split -ff- boundary too", () => {
      // office/officer/often/software split as of|fice, of|ten, sof|tware.
      for (const w of ["officer", "often", "software"])
        expect(rules(w)).toContain("ɔf");
      expect(rules("software")).toBe("ˈsɔftwɛɹ");
    });

    it("leaves the ost and non-ŋ nasal frames alone", () => {
      // ^ost$ is the older, separately measured oʊ frame; a plain o + n
      // keeps the /ɑ/ default (congress, monger split as con|gress).
      expect(rules("most")).toBe("ˈmoʊst");
      expect(rules("post")).toBe("ˈpoʊst");
      expect(rules("congress")).toContain("ɑŋ");
    });
  });

  describe("a after a /w/-final onset is LOT, not TRAP", () => {
    it.each([
      ["want", "ˈwɑnt"],
      ["watch", "ˈwɑtʃ"],
      ["wash", "ˈwɑʃ"],
      ["wander", "ˈwɑndɝ"],
      ["swan", "ˈswɑn"],
      ["swap", "ˈswɑp"],
      ["squad", "ˈskwɑd"],
      ["squash", "ˈskwɑʃ"],
      ["quantum", "ˈkwɑntəm"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps æ before c and g, where the dict majority is TRAP", () => {
      expect(rules("quack")).toBe("ˈkwæk");
      expect(rules("whack")).toBe("ˈhwæk");
      expect(rules("wag")).toBe("ˈwæɡ");
      expect(rules("swagger")).toBe("ˈswæɡɝ");
    });

    it("leaves the l rimes to their own rules", () => {
      expect(rules("wall")).toBe("ˈwɔɫ");
      expect(rules("walk")).toBe("ˈwɔk");
    });
  });

  describe("ar after a /w/-final onset is NORTH, not START", () => {
    it.each([
      ["war", "ˈwɔɹ"],
      ["warm", "ˈwɔɹm"],
      ["ward", "ˈwɔɹd"],
      ["quart", "ˈkwɔɹt"],
      ["quarter", "ˈkwɔɹtɝ"],
      ["quarrel", "ˈkwɔɹəɫ"],
      ["dwarf", "ˈdwɔɹf"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps the magic-e -are rime as SQUARE", () => {
      expect(rules("ware")).toBe("ˈwɛɹ");
      expect(rules("square")).toBe("ˈskwɛɹ");
    });

    it("keeps the unstressed -ward suffix reduced", () => {
      expect(rules("eastward")).toBe("ˈistwɝd");
      expect(rules("outward")).toBe("ˈaʊtwɝd");
    });
  });

  describe("a stressed word-final bare a is the loan-word ɑ", () => {
    it.each([
      ["la", "ˈɫɑ"],
      ["ma", "ˈmɑ"],
      ["pa", "ˈpɑ"],
      ["spa", "ˈspɑ"],
      ["bra", "ˈbɹɑ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves an unstressed final a reduced", () => {
      expect(rules("sofa")).toBe("ˈsoʊfə");
    });
  });

  // The a- + single r + vowel frame is split in the lexicon itself: around
  // əˈɹaʊnd but arise/arrived/aroused/originally all ɝ (59:13 for ɝ word-
  // initially). The rule path takes the majority, so this case asserts the
  // stress placement the prefix rule owns, not the vowel the lexicon splits.
  describe("the weak a- prefix before a single r", () => {
    it("stresses the root", () => {
      expect(rules("around")).toMatch(/^(?:əˈɹ|ɝˈ)aʊnd$/);
    });
  });

  describe("the weak a- prefix before a tense root", () => {
    it.each([
      ["about", "əˈbaʊt"],
      ["again", "əˈɡeɪn"],
      ["against", "əˈɡeɪnst"],
      ["agree", "əˈɡɹi"],
      ["amount", "əˈmaʊnt"],
      ["abroad", "əˈbɹɔd"],
      ["account", "əˈkaʊnt"],
      ["approach", "əˈpɹoʊtʃ"],
      ["appear", "əˈpɪɹ"],
      ["accrue", "əˈkɹu"],
      ["affair", "əˈfɛɹ"],
      ["assault", "əˈsɔɫt"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps initial stress when the root has no digraph rime", () => {
      expect(rules("adam")).toBe("ˈædəm");
      expect(rules("atom")).toBe("ˈætəm");
      expect(rules("arab")).toBe("ˈæɹəb");
      expect(rules("apple")).toBe("ˈæpəɫ");
      expect(rules("abbey")).toBe("ˈæbi");
    });
  });

})();

// Original suite: en-rule-ex-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule1;

  // The ex- prefix, rule path only. Each case pins the segment the rule
  // owns — the stress slot, or the /ɡz/ cluster and the mark that splits
  // it — not the whole IPA string, which can move when build-dict re-mines
  // the stems the morphology handlers look up.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("two-syllable ex- before a vowel takes final stress", () => {
    // Onset maximisation gives the <x> to the second syllable, so these
    // words reach assignStress as e|xist and the "ex" entry in
    // PREFIXES_2SYL cannot see the prefix. The dict wants final stress on
    // 11 of the 16 true two-syllable ex+vowel words.
    it.each(["exist", "exam", "exact", "exempt", "exert"])(
      "%s is stressed on the root",
      (word) => {
        expect(syllabify(word)).toEqual(["e", word.slice(1)]);
        expect(assignStress(syllabify(word), word)).toBe(1);
        expect(rules(word)).toMatch(/^ɪɡˈz/);
      },
    );

    it("ex+consonant words still reach the prefix table spelt whole", () => {
      expect(syllabify("expect")).toEqual(["ex", "pect"]);
      expect(assignStress(syllabify("expect"), "expect")).toBe(1);
    });
  });

  describe("the stress mark splits the /ɡz/ cluster", () => {
    // /ɡz/ is not a licit English onset: the dict writes the ɡ in the
    // preceding coda in all 112 entries that contain the cluster, and
    // never puts a stress mark in front of it.
    it.each(["exist", "example", "exotic", "exemption", "exude", "exhibit"])(
      "%s has no mark before the cluster",
      (word) => {
        const ipa = rules(word);
        expect(ipa).toContain("ɡˈz");
        expect(ipa).not.toMatch(/[ˈˌ]ɡz/);
      },
    );
  });

  describe("ex+h voices and drops the h when the prefix is reduced", () => {
    // 14:0 in the dict for a reduced prefix, 8:1 the other way for a full
    // /ɛ/ one — the split is the prefix vowel, not the spelling.
    it.each(["exhibit", "exhaust", "exhort", "exhilarate", "exhaustive"])(
      "%s is /ɡz/ with no h",
      (word) => {
        const ipa = rules(word);
        expect(ipa).toContain("ɡˈz");
        expect(ipa).not.toContain("h");
      },
    );

    it.each(["exhaled", "exhalation", "exhibition", "exhibitionist"])(
      "%s keeps the voiceless /ks/ behind a full ɛ",
      (word) => {
        const ipa = rules(word);
        expect(ipa).toContain("ɛks");
        expect(ipa).not.toContain("ɡz");
      },
    );
  });

})();

// Original suite: en-rule-g2p.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  const words = [
    'phonemize',
    'phonemizer',
    'knology',
    'aitch',
    'anachronism',
    'bramble',
    'syzygy',
    'dishes',
    'tested',
    'stopped',
    'running',
    'globally',
    'quickly',
    'readable',
  ]

  describe('G2P Rule based no error', () => {
    const g2p = new EnG2P({ disableDict: true });

    for (const word of words) {
      it(word, () => {
        const result = g2p.predict(word, 'en')
        expect(result).toBeDefined()
        console.log(`${word} -> ${result}`)
      });
    }
  });

  describe('G2P rule fixes', () => {
    const g2p = new EnG2P({ disableDict: true });

    it('ym before consonant → /ɪm/ (gym)', () => {
      expect(g2p.predict('gym', 'en')).toMatch(/ɪm/);
    });

    it('yn before consonant → /ɪn/ (syntax)', () => {
      expect(g2p.predict('syntax', 'en')).toMatch(/ɪn/);
    });

    it('sch → /ʃ/ (German default; English sch words like schema/school are in dict)', () => {
      // Rules now emit primary stress on monosyllables, hence the optional ˈ.
      expect(g2p.predict('schmaltz', 'en')).toMatch(/^ˈ?ʃ/);
      expect(g2p.predict('schmidt', 'en')).toMatch(/^ˈ?ʃ/);
    });

    it('^al$ only fires for doubled-l syllables (calculator has no /ɔl/)', () => {
      expect(g2p.predict('calculator', 'en')).not.toMatch(/ɔl/);
    });

    it('^al$ fires for genuine -all rime (ball)', () => {
      expect(g2p.predict('ball', 'en')).toMatch(/ɔɫ/);
    });

    it('word-final y → /i/ when syllable has prior vowel (city)', () => {
      expect(g2p.predict('city', 'en')).toMatch(/i$/);
      expect(g2p.predict('city', 'en')).not.toMatch(/aɪ/);
    });

    it('word-final y → /i/ for happy/novelty', () => {
      expect(g2p.predict('happy', 'en')).toMatch(/i$/);
      expect(g2p.predict('novelty', 'en')).toMatch(/i$/);
    });

    it('word-final y → /aɪ/ for monosyllables (by)', () => {
      expect(g2p.predict('by', 'en')).toMatch(/aɪ/);
    });

    it('chr → /kɹ/ (chrome)', () => {
      expect(g2p.predict('chrome', 'en')).toMatch(/kɹ/);
    });

    it('chl → /kl/ (chlorinated)', () => {
      expect(g2p.predict('chlorinated', 'en')).toMatch(/k[lɫ]/);
    });

    it('oor → /ɔɹ/ (door, floor)', () => {
      expect(g2p.predict('door', 'en')).toMatch(/ɔɹ/);
      expect(g2p.predict('floor', 'en')).toMatch(/ɔɹ/);
    });
  });

})();

// Original suite: en-rule-ie-tensing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for the tense i/e classes taken in the 2026-09-10
  // pass. Each case is a rule, not a word: the word named is the class
  // exemplar and every frame was measured over the whole dict before
  // adoption. The assertions pin only the segment the rule owns — a
  // rules-only prediction still consults the mined tables for stems, so a
  // full IPA string can move when `build-dict` re-mines.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string): string => g2p.predict(word, "en") ?? "";

  describe("e before o is a hiatus /i/", () => {
    it.each([
      ["geography", /^ˌ?ˈ?dʒi/],
      ["geodesic", /^ˌ?ˈ?dʒi/],
      ["neoclassic", /^ˌ?ˈ?ni/],
      ["theocracy", /^ˌ?ˈ?[ðθ]i/],
      ["cleo", /^ˌ?ˈ?kɫi/],
      ["creosote", /^ˌ?ˈ?kɹi/],
      ["eon", /^ˌ?ˈ?i/],
    ])("%s keeps the e tense", (word, re) => expect(rules(word)).toMatch(re));

    it("carries into a non-initial syllable", () => {
      expect(rules("video")).toContain("dio");
      expect(rules("stereo")).toContain("ɹio");
    });

    it("does not fire on -eor-, where the rime is ɔɹ", () => {
      expect(rules("george")).toContain("ɔɹdʒ");
      expect(rules("georgia")).toContain("ɔɹdʒ");
    });
  });

  describe("tense-i Greek/Latin combining forms survive destressing", () => {
    it.each([
      ["micro", /^ˌ?ˈ?maɪ/],
      ["microprocessor", /^ˌ?ˈ?maɪ/],
      ["microbiology", /^ˌ?ˈ?maɪ/],
      ["biographical", /^ˌ?ˈ?baɪ/],
      ["biochemical", /^ˌ?ˈ?baɪ/],
      ["diagnostic", /^ˌ?ˈ?daɪ/],
      ["diabetic", /^ˌ?ˈ?daɪ/],
      ["diagonal", /^ˌ?ˈ?daɪ/],
      ["isometric", /^ˌ?ˈ?aɪ/],
      ["isotope", /^ˌ?ˈ?aɪ/],
    ])("%s keeps /aɪ/", (word, re) => expect(rules(word)).toMatch(re));

    it("leaves the prefixes the dict votes lax alone", () => {
      expect(rules("bigotry")).toMatch(/^ˌ?ˈ?bɪ/);
      expect(rules("tribune")).toMatch(/^ˌ?ˈ?tɹɪ/);
      expect(rules("dilemma")).toMatch(/^ˌ?ˈ?dɪ/);
    });
  });

  describe("an open ea is lax before a -su tail and eal before -th", () => {
    it.each([
      ["measure", /^ˌ?ˈ?mɛ/],
      ["measuring", /^ˌ?ˈ?mɛ/],
      ["treasury", /^ˌ?ˈ?tɹɛ/],
      ["pleasurable", /^ˌ?ˈ?pɫɛ/],
      ["countermeasure", /ˌ?mɛʒ/],
      ["healthier", /^ˌ?ˈ?hɛ/],
      ["wealthiest", /^ˌ?ˈ?wɛ/],
      ["stealthier", /^ˌ?ˈ?stɛ/],
    ])("%s is lax", (word, re) => expect(rules(word)).toMatch(re));

    it("keeps the tense default on the tails measured tense", () => {
      expect(rules("season")).toMatch(/^ˌ?ˈ?si/);
      expect(rules("leader")).toMatch(/^ˌ?ˈ?ɫi/);
      expect(rules("eater")).toMatch(/^ˌ?ˈ?i/);
    });
  });

})();

// Original suite: en-rule-latin-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for the -ia/-ian/-ious/-eous Latin hiatus family
  // (`LATIN_HIATUS_ENDING`, used by both `assignStress` and the tensing rule
  // in `syllableToIPA`, src/en/syllabify.ts). None of these words go through
  // a morphological stem lookup, so the rules-only prediction does not shift
  // when data/en/exceptions.json is re-mined.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("-ian/-ious/-eous stress the syllable before them", () => {
    // Extends the existing -ia stress rule (india, malaria) to the -n and
    // -ous variants; previously these fell through to the penult/antepenult
    // heaviness fallback, which mis-stressed a light penult (mysterious,
    // spontaneous) and let a 2-syllable ob-/pre- prefix check misfire
    // (obvious, previous).
    it.each([
      ["canadian", "kəˈneɪdiən"],
      ["indian", "ˈɪndiən"],
      ["obvious", "ˈɑbviəs"],
      ["previous", "ˈpɹiviəs"],
      ["spontaneous", "spɑnˈteɪniəs"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("an open stressed vowel before the hiatus is tense", () => {
    // a→eɪ, e→i, o→oʊ (u is left out; furia/luria keep /ʊ/ in the dict).
    it.each([
      ["canadian", "kəˈneɪdiən"],
      ["akkadian", "əˈkeɪdiən"],
      ["albanian", "æɫˈbeɪniən"],
      ["avian", "ˈeɪviən"],
      ["asian", "ˈeɪʒən"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("an r-onset hiatus colors the open vowel instead of tensing it", () => {
    // The r resyllabifies onto the suffix (bar·BAR·ian, al·GER·ian), so it is
    // the same environment as the word-final ^are$/^ere$ rimes: a→ɛ (SQUARE),
    // e→ɪ (NEAR). o needs no table entry — the default open stressed o is
    // already /oʊ/, and postlex's oʊɹ→ɔɹ narrowing does the rest.
    it.each([
      ["barbarian", "bɑɹˈbɛɹiən"],
      ["various", "ˈvɛɹiəs"],
      ["vegetarian", "ˌvɛdʒəˈtɛɹiən"],
      ["algerian", "æɫˈdʒɪɹiən"],
      ["mysterious", "mɪˈstɪɹiəs"],
      ["glorious", "ˈɡɫɔɹiəs"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("-ia/-ian take a plural -s", () => {
    // The maximal-onset syllabifier glues a trailing -s onto the same last
    // slot (canadi·ans, not canadian·s), so the hiatus pattern needs the
    // optional s to still see it as -ian rather than falling through.
    it.each([
      ["canadians", "kəˈneɪdiənz"],
      ["jordanians", "dʒɔɹˈdeɪniənz"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  // guardian's <u> after g still surfaces as a vowel (a separate open issue),
  // so only the stress and the -ian rime this rule owns are pinned.
  it("guardian stresses the syllable before -ian", () => {
    expect(new EnG2P({ disableDict: true }).predict("guardian", "en")).toMatch(/^ˈɡ.*diən$/);
  });

})();

// Original suite: en-rule-primary-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for primary-stress placement (`assignStress` in
  // src/en/syllabify.ts) and for the reduction frame in `syllableToIPA` that
  // depends on it. Every case is a class exemplar, not a word; the frames and
  // their dict ratios live next to the rules themselves.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("com- keeps the primary over a lax root", () => {
    // 82% of the 34 lax, non-silent-e com- words in the dict are initial-
    // stressed (5 of the 6 that are in the top-5000 list).
    it.each([
      ["combat", "ˈkɑmbæt"],
      ["compact", "ˈkɑmpækt"],
      ["complex", "ˈkɑmpɫɛks"],
      ["compress", "ˈkɑmpɹɛs"],
      ["compost", "ˈkɑmpoʊst"],
      ["comsat", "ˈkɑmsæt"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("manufactur- keeps its bound-root stress and glide across derivatives", () => {
    it.each([
      ["manufacture", "ˌmænjəˈfæktʃɝ"],
      ["manufactured", "ˌmænjəˈfæktʃɝd"],
      ["manufacturing", "ˌmænjəˈfæktʃɝɪŋ"],
      ["manufacturable", "ˌmænjəˈfæktʃɝəbəɫ"],
      ["manufacturer", "ˌmænjəˈfæktʃɝɝ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it.each([
      ["manufactory", "ˌmænəˈfæktɝi"],
      ["manure", "ˈmænʊɹ"],
      ["factory", "ˈfæktɝi"],
    ])("leaves neighboring %s in its own frame", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("com- gives the primary away over a tense root", () => {
    // A vowel digraph or a silent-e in the root marks it as the stress
    // bearer, which is the unconditional behaviour of the other prefixes.
    it.each([
      ["compose", "kəmˈpoʊz"],
      ["compute", "kəmˈpjut"],
      ["compare", "kəmˈpɛɹ"],
      ["complete", "kəmˈpɫit"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("a root after im- keeps its full vowel before a pure obstruent coda", () => {
    it.each([
      ["impact", "ˈɪmpækt"],
      ["impress", "ˈɪmpɹɛs"],
      ["improv", "ˈɪmpɹɑv"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("a final vowel before /ŋ/ does not reduce (English has no /əŋ/)", () => {
    it.each([
      ["adlong", /ɔŋ$/],
      ["hongkong", /ɔŋ$/],
      ["diphthong", /ɔŋ$/],
      ["eubank", /æŋk$/],
      ["burbank", /æŋk$/],
      ["agribank", /æŋk$/],
    ])("%s keeps its full vowel", (word, rime) => {
      const out = rules(word) ?? "";
      expect(out).toMatch(rime);
      expect(out).not.toMatch(/ə[ŋ]/);
    });
  });

  describe("a word-attaching prefix on a long stem leaves the stress in the stem", () => {
    // un-/dis-/mis-/ab- attach to a whole word, so once the stem carries its
    // own stress the primary sits deeper than the root-initial syllable.
    it.each([
      ["disassemble", "ˌdɪsəˈsɛmbəɫ"],
      ["disincentive", "ˌdɪsɪnˈsɛntɪv"],
      ["misbegotten", "ˌmɪsbəˈɡɑtən"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
    it.each([
      ["disbelieve", /ˌdɪsbəˈɫiv$/],
      ["misconceive", /ˌmɪskənˈsiv$/],
    ])("%s puts the primary in the stem", (word, tail) => {
      expect(rules(word)).toMatch(tail);
    });
  });

  describe("-ance/-ence: a four-slot stem is split by its second slot", () => {
    // Closed second slot = a stressed stem (acceptance, assistance); open =
    // a Latin bound root that leaves the primary at the front. The -er verbs
    // retract too, because the undoubled consonant is the spelling's own
    // stress mark (occurrence keeps it, reference does not).
    it.each([
      ["difference", "ˈdɪfɝəns"],
      ["deference", "ˈdɛfɝəns"],
      ["residence", "ˈɹɛzɪdəns"],
      ["maintenance", "ˈmeɪntənəns"],
      ["consequence", "ˈkɑnsəkwəns"],
      ["reference", "ˈɹɛfɝəns"],
      ["conference", "ˈkɑnfɝəns"],
      ["preference", "ˈpɹɛfɝəns"],
      ["acceptance", "ækˈsɛptəns"],
      ["assistance", "əˈsɪstəns"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("a near-categorical word-final gram beats the heaviness fallback", () => {
    // FINAL_GRAM_STRESS: the primary's distance from the last slot. Each gram
    // has >=20 dict words, >=75% agreement, and >=3 agreeing top-5000 words.
    it.each([
      ["yesterday", "ˈjɛstɝdeɪ"],
      ["anderson", "ˈændɝsən"],
      ["jefferson", "ˈdʒɛfɝsən"],
      ["albertson", "ˈæɫbɝtsən"],
      ["ericsson", "ˈɛɹɪksən"],
      ["christina", "kɹɪˈstinə"],
      ["armenian", "ɑɹˈminiən"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("the prefix loop still owns three-syllable words", () => {
    // At three syllables "stress the root" beats the penult fallback for every
    // prefix in the list (1491/2394 vs 1217/2394 over the dict).
    it.each([
      ["deliver", "dɪˈɫɪvɝ"],
      ["consider", "kənˈsɪdɝ"],
      ["component", "kəmˈpoʊnənt"],
      ["competitive", "kəmˈpɛtətɪv"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  // -ation built from an -ate verb or a bare stem takes the primary on its
  // /eɪ/; the stem's primary demotes to secondary (2026-09-26).
  describe("-ation carries the primary on its own /eɪ/", () => {
    it.each([
      ["abdication", "ˈkeɪʃən"],
      ["activation", "ˈveɪʃən"],
      ["accommodation", "ˈdeɪʃən"],
      ["adaptation", "ˈteɪʃən"],
    ])("%s ends in %s", (word, tail) => expect(rules(word)).toMatch(new RegExp(`${tail}$`)));
  });

  // -ity and -ial (3+ slots) pull the primary onto the syllable right before
  // them; -ial words skip the stress-neutral -al morphology (2026-09-26).
  describe("-ity and -ial stress the syllable before them", () => {
    it.each([
      ["activity", /^ækˈtɪ/],
      ["abnormality", /ˈmæ/],
      ["accessibility", /ˈbɪ/],
      ["editorial", /ˈtɔɹ/],
      ["adversarial", /ɝˈs/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));

    it("keeps a one-syllable -ial stem on its own <i>", () => {
      expect(rules("trial")).toMatch(/^ˈtɹaɪ/);
    });
  });

  // -ental/-ential and the Greek -graphy/-nomy/-sophy/-cracy family stress
  // the syllable right before the ending (2026-09-26).
  describe("-ental, -ential and Greek -Cy endings stress the syllable before them", () => {
    it.each([
      ["accidental", /ˈdɛn/],
      ["confidential", /ˈdɛn/],
      ["photography", /ˈtɑ/],
      ["philosophy", /ˈɫɑ/],
      ["democracy", /ˈmɑ/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));
  });

  // -ate puts the primary two syllables before its /eɪt/ (2026-09-26).
  describe("-ate stresses two syllables before itself", () => {
    it.each([
      ["abdicate", /^ˈæb/],
      ["accelerate", /ˈsɛɫ/],
      ["anticipate", /ˈtɪ/],
      ["appreciate", /ˈpɹ/],
      ["demonstrate", /^ˈdɛ/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));

    it("leaves two-syllable -ate words alone", () => {
      expect(rules("debate")).toMatch(/ˈbeɪt$/);
    });

    // The mark is placed on the post-lexical string: degemination before it
    // (ac·com·mo·da·tion) must not shift it into the stressed vowel.
    it("keeps the mark on the onset after a post-lexical edit", () => {
      expect(rules("accommodation")).toMatch(/ˈdeɪʃən$/);
    });
  });

  // Italian name endings take the penult with its Italian vowel, and the
  // other e/o/u stay full (2026-09-26).
  describe("Italian name endings", () => {
    it.each([
      ["barbano", /ˈbɑnoʊ$/],
      ["casino", /ˈsinoʊ$/],
      ["lozano", /^ɫoʊˈ/],
      ["dicola", /ˈkoʊɫə$/],
      ["gucci", /^ˈɡutʃi$/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));

    it("leaves a two-syllable English -ini alone", () => {
      expect(rules("mini")).toMatch(/ɪ/);
    });
  });

  // -ia stresses the syllable before it and tenses an open a/e/o there;
  // -ator stresses like -ate and keeps its /eɪ/ (2026-09-26).
  describe("-ia and -ator", () => {
    it.each([
      ["albania", /ˈbeɪniə$/],
      ["media", /^ˈmidiə$/],
      ["mongolia", /ˈɡoʊɫiə$/],
      ["generator", /^ˈdʒɛn.*eɪtɝ$/],
      ["administrator", /ˈmɪn.*eɪtɝ$/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));
  });

  // Germanic compound surname elements keep initial stress; -ington is not
  // one of them (2026-09-26).
  describe("Germanic surname endings", () => {
    it.each([
      ["aldinger", /^ˈæɫ/],
      ["bamberger", /^ˈbæm/],
      ["oppenheimer", /^ˈɑp/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));
  });

  // Greek agent nouns keep the stress of their -y noun; German -auer is /aʊɝ/
  // (2026-09-26).
  describe("Greek agent nouns and -auer", () => {
    it.each([
      ["biologist", /ˈɑɫədʒɪst$/],
      ["photographer", /ˈtɑɡɹəfɝ$/],
      ["economist", /ˈkɑnəmɪst$/],
      ["neubauer", /baʊɝ$/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));
  });

  // -ive: the silent-e slot no longer shifts stress one syllable late
  // (2026-09-26); a compound on "motive" keeps its own stress.
  describe("-ive stress ignores the silent-e slot", () => {
    it.each([
      ["negative", /^ˈnɛɡ/],
      ["elusive", /ˈɫu/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));
  });

  describe("a two-vowel-letter hiatus slot puts the mark on its second nucleus", () => {
    // syllabify keeps geo/bio/prio/etc in one orthographic slot, but
    // syllableToIPA still emits two phonemes for it; hiatusMarkOffset moves
    // the primary off the slot's onset and onto that second nucleus.
    // Measured over data/en/dict.json: +52/−0 on the evaluate-strict
    // headline (rules-only, en-US phonemic) vs leaving the mark at the onset.
    it.each([
      ["geography", "dʒiˈɑɡɹəfi"],
      ["biography", "baɪˈɑɡɹəfi"],
      ["geographer", "dʒiˈɑɡɹəfɝ"],
      ["geology", "ˌdʒiˈɑɫədʒi"],
      ["priority", "pɹaɪˈɔɹəti"],
      ["briana", "bɹiˈænə"],
      ["indiana", "ˌɪndiˈænə"],
      ["idiotic", "ˌɪdiˈɑtɪk"],
      ["fiasco", "fiˈæskoʊ"],
      ["viagra", "viˈæɡɹə"],
      ["symbiotic", "ˌsɪmbiˈɑtɪk"],
      ["histrionic", "ˌhɪstɹiˈɑnɪk"],
      ["iona", "aɪˈoʊnə"],
      ["iola", "aɪˈoʊɫə"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("a hiatus slot keeps the onset — no shift", () => {
    // Two exclusions to the rule above, both regression guards:
    //  - a combining-form prefix (bio-/neo-/ke·o-) with an onset keeps its
    //    OWN stress when the second nucleus is the tense /oʊ/, against the
    //    onsetless -iona/-iola family above, where the shift is correct.
    //  - "ae"/"oe" (aetna, boeckel — 201 dict words) already elide their
    //    first vowel downstream; that pass keys off the mark sitting before
    //    both letters, so this slot is never treated as a hiatus at all.
    it.each([
      ["biome", "ˈbaɪoʊm"],
      ["keokuk", "ˈkioʊkək"],
      ["aetna", "ˈɛtnə"],
      ["boeckel", "ˈboʊkəɫ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  // -ation from a rule-exact two-syllable -ate verb keeps the verb's full
  // first vowel (2026-09-26).
  describe("-ation over a two-syllable -ate verb", () => {
    it.each([
      ["location", /^ˌ?ɫoʊˈkeɪʃən$/],
      ["rotation", /^ˌ?ɹoʊˈteɪʃən$/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));
  });

})();
