// Original suite: en-finite-vowel-final-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("finite predicates before vowel-final modifiers, disableDict=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    it("distinguishes a finite predicate from plural noun uses", () => {
      expect(pick("The Ashbory uses silicone rubber strings.", "uses")).toBe("ˈjuzəz");
      expect(pick("The novel uses of a tool are clear.", "uses")).toBe("ˈjusəz");
    });
    it("preserves contrastive stress on verb and noun records", () => {
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
      expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
    });
    it("does not turn past-time read into a present predicate", () => {
      if (!disableDict) {
        expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
        expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
      }
    });
  });

})();

// Original suite: en-for-participle.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US forgotten /fɚˈɡɑːtən/, forbidden /fɚˈbɪdən/;
  // its Academic Content entry also accepts full /fɔr-/ with root stress.
  describe.each([false, true])("native for- participles (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([["forgotten", "fɝˈɡɑtən"], ["forbidden", "fɝˈbɪdən"]])("retains root stress and a vouched prefix reading in %s", (word, ipa) => {
      const expected = word === "forbidden" && !disableDict ? "fɔɹˈbɪdən" : ipa;
      expect(engine.predict(word)).toBe(expected);
      expect(engine.predict(word, "en-US", "V")).toBe(expected);
      expect(engine.predict(word, "en-US", "ADJ")).toBe(expected);
    });
    test.each([["unforgotten", "ˌʌnfɝˈɡɑtən"], ["nonforgotten", "ˌnɑnfɝˈɡɑtən"], ["unforbidden", "ˌʌnfɔɹˈbɪdən"], ["forbiddenness", "fɔɹˈbɪdənnəs"], ["forbiddenly", "fɔɹˈbɪdənɫi"], ["forgottens", "fɝˈɡɑtənz"]])("preserves the stem reading in an OOV derivative: %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test.each([["forgabben", "fɝˈɡæbən"], ["forfadden", "fɝˈfædən"]])("applies the same checked participial frame to a novel form: %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test.each(["format", "formality", "formalities", "fortuitous", "forlenza", "fortuna", "forgo"])("preserves the full rime outside the participial boundary: %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^fɔɹ/);
    });
    test("preserves adjective and passive contexts plus unrelated noun/verb controls", () => {

      const tokens = englishTokens(engine, "The forgotten book is old. Smoking is forbidden here. They format reports.");
      expect(tokens.find(token => token.word === "forgotten")?.phoneme).toBe("fɝˈɡɑtən");
      expect(tokens.find(token => token.word === "forbidden")?.phoneme).toBe(disableDict ? "fɝˈbɪdən" : "fɔɹˈbɪdən");
      expect(tokens.find(token => token.word === "book")?.phoneme).toBe("bʊk");
      expect(tokens.find(token => token.word === "format")?.phoneme?.replace(/[ˈˌ]/g, "")).toMatch(/^fɔɹ/);
    });
  });

  test("retains caller ownership of a complete participle", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("forgotten", "ˈzɛŋ");
    expect(engine.predict("forgotten")).toBe("ˈzɛŋ");
    expect(engine.predict("unforgotten")).toBe("ənˈzɛŋ");
    expect(engine.predict("forgottens")).toBe("ˈzɛŋz");
  });

})();

// Original suite: en-foreign-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("Cambridge-attested foreign root", () => {
    it.each([false, true])("uses the standard US /ɑ/ alternative in isolation and context (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("foreign", "en-US")).toBe("ˈfɑɹən");

      // Keep the regular <eign> readings and a derived form stable.
      expect(engine.predict("reign", "en-US")).toBe("ˈɹeɪn");
      expect(engine.predict("deign", "en-US")).toBe("ˈdeɪn");
      expect(engine.predict("foreigner", "en-US")).toBe("ˈfɑɹənɝ");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Foreign policy affects foreign visitors.", {
        language: "en-US",
        returnArray: true,
      });
      expect(tokens.filter(token => token.word.toLowerCase() === "foreign").map(token => token.phoneme))
        .toEqual(["ˈfɑɹən", "ˈfɑɹən"]);
    });
  });

  describe("Cambridge-attested common pronunciation variants", () => {
    it("uses dictionary-attested rules-only readings without changing dictionary output", () => {
      const defaultEngine = new EnglishG2P();
      const rulesEngine = new EnglishG2P({ disableDict: true });

      expect(defaultEngine.predict("pizza", "en-US")).toBe("ˈpitsə");
      expect(rulesEngine.predict("pizza", "en-US")).toBe("ˈpitsə");
      expect(defaultEngine.predict("pizzas", "en-US")).toBe("ˈpitsəz");
      expect(rulesEngine.predict("pizzas", "en-US")).toBe("ˈpitsəz");
      expect(defaultEngine.predict("Halloween", "en-US")).toBe("ˌhæɫəˈwin");
      expect(rulesEngine.predict("Halloween", "en-US")).toBe("ˌhæɫəˈwin");
      expect(defaultEngine.predict("genuine", "en-US")).toBe("ˌdʒɛnˈjuˌwaɪn");
      expect(rulesEngine.predict("genuine", "en-US")).toBe("ˈdʒɛnjuɪn");
      expect(defaultEngine.predict("routine", "en-US")).toBe("ɹuˈtin");
      expect(rulesEngine.predict("routine", "en-US")).toBe("ɹuˈtin");
      expect(defaultEngine.predict("Italian", "en-US")).toBe("ɪˈtæɫjən");
      expect(rulesEngine.predict("Italian", "en-US")).toBe("ɪˈtæɫjən");
      expect(defaultEngine.predict("gourmet", "en-US")).toBe("ˈɡʊɹˌmeɪ");
      expect(rulesEngine.predict("gourmet", "en-US")).toBe("ɡʊɹˈmeɪ");
      expect(defaultEngine.predict("ratio", "en-US")).toBe("ˈɹeɪʃiˌoʊ");
      expect(rulesEngine.predict("ratio", "en-US")).toBe("ˈɹeɪʃiˌoʊ");
      expect(defaultEngine.predict("omega", "en-US")).toBe("oʊˈmeɪɡə");
      expect(rulesEngine.predict("omega", "en-US")).toBe("oʊˈmeɪɡə");

      expect(rulesEngine.predict("pita", "en-US")).toBe("ˈpitə");
      expect(rulesEngine.predict("sizzle", "en-US")).toBe("ˈsɪzəɫ");
      expect(rulesEngine.predict("routinely", "en-US")).toBe("ɹuˈtinɫi");
      expect(rulesEngine.predict("Italy", "en-US")).toBe("ˈɪtəɫi");
      expect(rulesEngine.predict("rational", "en-US")).toBe("ˈɹæʃənəɫ");
      expect(rulesEngine.predict("omelet", "en-US")).toBe("ˈɑməˌɫɛt");

      const api = createPhonemizer({ processors: [rulesEngine] });
      const tokens = api.phonemize("Pizza is popular on Halloween; the ratio uses omega.", {
        language: "en-US",
        returnArray: true,
      });
      expect(tokens.filter(token => ["pizza", "halloween", "ratio", "omega"].includes(token.word.toLowerCase())).map(token => token.phoneme))
        .toEqual(["ˈpitsə", "ˌhæɫəˈwin", "ˈɹeɪʃiˌoʊ", "oʊˈmeɪɡə"]);
    });
  });

})();

// Original suite: en-forget-paradigm-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("forget irregular paradigm roots", () => {
    it.each([false, true])("uses the sourced present and past forms without shifting derived controls (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("forget", "en-US", "VB")).toBe("fɝˈɡɛt");
      expect(engine.predict("forgets", "en-US", "VBZ")).toBe("fɝˈɡɛts");
      expect(engine.predict("forgetting", "en-US", "VBG")).toBe("fɝˈɡɛtɪŋ");
      expect(engine.predict("forgot", "en-US", "VBD")).toBe("fɝˈɡɑt");
      expect(engine.predict("forgotten", "en-US", "VBN")).toBe("fɝˈɡɑtən");
      expect(engine.predict("regret", "en-US", "VB")).toBe(disableDict ? "ɹiˈɡɹɛt" : "ɹəˈɡɹɛt");


      const tokens = englishTokens(engine, "I forget what I forgot, though I have not forgotten it.");
      const readings = tokens.filter(token => ["forget", "forgot", "forgotten"].includes(token.word.toLowerCase()));
      expect(readings.map(token => token.phoneme)).toEqual(["fɝˈɡɛt", "fɝˈɡɑt", "fɝˈɡɑtən"]);
    });
  });

})();

// Original suite: en-french-ette-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const primary = (p: string | null) => p?.replace(/ˌ/g, "");
  test.each([false, true])(
    "keeps weak French ou and silent ette noun roots after eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const word of ["roulette", "cassette"]) delete d[word];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["roulette", "ɹuˈɫɛt"],
        ["roulettes", "ɹuˈɫɛts"],
        ["roulette's", "ɹuˈɫɛts"],
        ["nonroulette", "nɑnɹuˈɫɛt"],
        ["cassette", "kəˈsɛt"],
        ["cassettes", "kəˈsɛts"],
        ["noncassette", "nɑnkəˈsɛt"],
        ["diskette", "dɪˈskɛt"],
      ])
        expect(primary(e.predict(word))).toBe(ipa);
      for (const [word, ipa] of [
        ["foul", "ˈfaʊɫ"],
        ["fouler", "ˈfaʊɫɝ"],
        ["foulest", "ˈfaʊɫəst"],
        ["fouled", "ˈfaʊɫd"],
        ["fouling", "ˈfaʊɫɪŋ"],
        ["foulness", "ˈfaʊɫnəs"],
        ["foully", "ˈfaʊɫi"],
      ])
        expect(e.predict(word)).toBe(ipa);
      const api = createPhonemizer({ processors: [e] });
      expect(
        primary(
          api
            .phonemize("The roulette wheel and the cassette are ready.", {
              language: "en-US",
              returnArray: true,
            })
            .find((t) => t.word === "roulette")?.phoneme ?? null,
        ),
      ).toBe("ɹuˈɫɛt");
    },
  );
  test("keeps custom root and target priority", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("roulette", "ˈzɛmp");
    expect(e.predict("roulettes")).toBe("ˈzɛmps");
    e.addPronunciation("roulettes", "ˈkɛmp");
    expect(e.predict("roulettes")).toBe("ˈkɛmp");
  });

})();

// Original suite: en-french-quette-velars.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])(
    "keeps silent-u quette roots through plural and prefix recovery (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const word of ["marquette", "briquette"]) delete d[word];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["briquette", "bɹɪˈkɛt"],
        ["briquettes", "bɹɪˈkɛts"],
        ["marquette", "mɑɹˈkɛt"],
        ["marquettes", "mɑɹˈkɛts"],
        ["nonmarquette", "nɑnmɑɹˈkɛt"],
        ["banquette", "bæŋˈkɛt"],
        ["banquet", "ˈbæŋkwət"],
      ])
        expect(e.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
      expect(e.predict("coquette")).toMatch(/ˈkɛt$/);
      expect(e.predict("coquette")).not.toContain("kw");
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("The briquettes are ready.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "briquettes")?.phoneme,
      ).toBe("bɹɪˈkɛts");
    },
  );
  test("preserves supplied quette targets", () => {
    const e = new EnglishG2P();
    e.addPronunciation("briquette", "ˈzɛmp");
    expect(e.predict("briquette")).toBe("ˈzɛmp");
  });

})();

// Original suite: en-friend-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("friend spelling-family vowel", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["friend", "ˈfɹɛnd"],
      ["befriend", "bɪˈfɹɛnd"],
      ["friendship", "ˈfɹɛndʃɪp"],
      ["befriended", "bɪˈfɹɛndɪd"],
      ["befriending", "bɪˈfɹɛndɪŋ"],
      ["befriender", "bɪˈfɹɛndɝ"],
      ["boyfriends", "ˈbɔɪfɹɛndz"],
    ])("keeps the short vowel across %s and its derivation", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["fiend", "ˈfind"],
      ["field", "ˈfiɫd"],
      ["piece", "ˈpis"],
      ["chief", "ˈtʃif"],
      ["believe", "bɪˈɫiv"],
    ])("preserves the ordinary /i/ reading in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-front-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("front as a productive English root", () => {
    const rules = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });

    it.each([
      ["front", "ˈfɹʌnt"],
      ["frontage", "ˈfɹʌntɪdʒ"],
      ["effrontery", "ɪˈfɹʌntɝi"],
    ])("keeps STRUT in %s", (word, expected) => {
      expect(rules.toIPA(word, "en-US")).toBe(expected);
    });

    it.each([
      ["frontz", "ˈfɹɑnts"],
      ["frontispiece", "ˌfɹɑntɪˈspis"],
      ["company", "ˈkʌmpəni"],
      ["London", "ˈɫʌndən"],
    ])("leaves the unrelated spelling control %s unchanged", (word, expected) => {
      expect(rules.toIPA(word, "en-US")).toBe(expected);
    });

    it("keeps the root vowel in noun and verb sentence contexts", () => {
      expect(rules.phonemize("The front porch faces the road. They fronted the band.", {
        language: "en-US",
      })).toBe("ðə fɹʌnt pɔɹtʃ ˈfeɪsəz ðə ɹoʊd. ðeɪ ˈfɹʌntɪd ðə bænd.");
    });
  });

})();

// Original suite: en-fronted-clause.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const cases: Array<[string, string]> = [
    ["In Cambridge he read the paper.", "ɹɛd"],
    ["While in Oxford she read the report.", "ɹɛd"],
    ["Here is the book whose chapters he read for practice.", "ɹɛd"],
    ["The last book she read was old.", "ɹɛd"],
    ["The letter he read is important.", "ɹɛd"],
    ["They demanded that he read the report tomorrow.", "ɹid"],
    ["They suggested to John he read the report tomorrow.", "ɹid"],
    ["They demanded in Cambridge he read the report tomorrow.", "ɹid"],
    ["I would rather he quickly read.", "ɹɛd"],
    ["I would rather read.", "ɹid"],
    ["She read books every day.", "ɹɛd"],
    ["I read books every day.", "ɹid"],
  ];
  it.each(cases)("preserves finite and mandative readings: %s", (text, ipa) => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
  });
  it("preserves two occurrences and their clause boundaries", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize("In Cambridge he read it; they read it daily.", { language: "en-US", returnArray: true })
      .filter(t => t.word === "read").map(t => t.phoneme)).toEqual(["ɹɛd", "ɹid"]);
  });

})();

// Original suite: en-function-word-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("function-word final s voicing, rules-only=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    it("voices the strong function word as", () => {
      expect(api.toIPA("as", "en-US")).toBe("ˈæz");
    });

    it.each(["gas", "mass", "us", "this"])("keeps the regular coda in %s", word => {
      expect(api.toIPA(word, "en-US")).toMatch(/s$/);
    });

    it("retains weak as in connected speech", () => {
      expect(api.phonemize("It is as good as that.", { language: "en-US", returnArray: true }).map(token => token.phoneme))
        .toContain("əz");
    });
  });

})();

// Original suite: en-gb.test.ts
(() => {
  const __suiteModule0: typeof import("../src/all") = require("../src/all");
  const { phonemize, toIPA, toARPABET, createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/en/gb") = require("../src/en/gb");
  const { transformAmericanToRP } = __suiteModule2;

  describe("en-GB (Received Pronunciation) transformation", () => {
    describe("non-rhotic transformation", () => {
      it("strips coda /ɹ/ and lengthens preceding vowel for START class", () => {
        expect(phonemize("car", "en-GB")).toBe("ˈkɑː");
        expect(phonemize("far", "en-GB")).toBe("ˈfɑː");
        expect(phonemize("start", "en-GB")).toBe("ˈstɑːt");
      });

      it("strips coda /ɹ/ and lengthens preceding vowel for NORTH/FORCE", () => {
        expect(phonemize("for", "en-GB")).toBe("ˈfɔː");
        expect(phonemize("more", "en-GB")).toBe("ˈmɔː");
      });

      it("turns SQUARE class into /ɛə/", () => {
        expect(phonemize("hair", "en-GB")).toBe("ˈhɛə");
        expect(phonemize("bear", "en-GB")).toBe("ˈbɛə");
      });

      it("turns NEAR class into /ɪə/", () => {
        expect(phonemize("near", "en-GB")).toBe("ˈnɪə");
      });

      it("turns CURE class into /ʊə/", () => {
        expect(phonemize("tour", "en-GB")).toBe("ˈtʊə");
      });

      it("turns FIRE / POWER diphthong+/ɹ/ into the /ə/ ending", () => {
        expect(phonemize("fire", "en-GB")).toBe("ˈfaɪə");
        expect(phonemize("hour", "en-GB")).toBe("ˈaʊə");
      });

      it("preserves onset /ɹ/ between vowels", () => {
        // ɹ in barrel / very is in onset (followed by a vowel) → must stay
        expect(phonemize("barrel", "en-GB")).toContain("ɹ");
        expect(phonemize("very", "en-GB")).toContain("ɹ");
        expect(phonemize("married", "en-GB")).toContain("ɹ");
      });
    });

    describe("NURSE vowel split", () => {
      it("converts stressed rhotacized schwa /ɝ/ to /ɜː/", () => {
        expect(phonemize("bird", "en-GB")).toBe("ˈbɜːd");
        expect(phonemize("word", "en-GB")).toBe("ˈwɜːd");
        expect(phonemize("nurse", "en-GB")).toBe("ˈnɜːs");
      });

      it("converts unstressed rhotacized schwa to plain /ə/ (commA-LETTER merger)", () => {
        expect(phonemize("doctor", "en-GB")).toBe("ˈdɑktə");
        expect(phonemize("letter", "en-GB")).toBe("ˈɫɛtə");
        expect(phonemize("teacher", "en-GB")).toContain("tʃə");
      });
    });

    describe("word-level RP overrides", () => {
      it("French /-age/ borrowings end in /ʒ/, not /dʒ/", () => {
        expect(phonemize("garage", "en-GB")).toContain("ʒ");
        expect(phonemize("massage", "en-GB")).toContain("ʒ");
        expect(phonemize("sabotage", "en-GB")).toContain("ʒ");
      });

      it("retains yod /j/ after /s/ where AmE drops it", () => {
        expect(phonemize("sue", "en-GB")).toBe("ˈsjuː");
        expect(phonemize("suit", "en-GB")).toBe("ˈsjuːt");
        expect(phonemize("super", "en-GB")).toBe("ˈsjuːpə");
      });

      it("yod rule does not fire on words like 'sushi' (next IPA is /ʃ/)", () => {
        expect(phonemize("sushi", "en-GB")).not.toContain("sj");
      });

      it("French /-age/ rule lengthens the final back vowel and drops /d/", () => {
        // garage and sabotage have stressed /ɑʒ/ — should lengthen to /ɑːʒ/
        expect(phonemize("garage", "en-GB")).toContain("ɑːʒ");
        expect(phonemize("sabotage", "en-GB")).toContain("ɑːʒ");
        // espionage has /ɑdʒ/ — should drop the /d/ and lengthen
        expect(phonemize("espionage", "en-GB")).toContain("ɑːʒ");
        expect(phonemize("espionage", "en-GB")).not.toContain("dʒ");
        // native English -age stays untouched (no false positive on
        // marriage / package / image / etc.)
        expect(phonemize("package", "en-GB")).toContain("dʒ");
      });

      it("preserves /ɔː/ in -ormation words", () => {
        // base AmE reduces this to /ɝ/ (rhotacized schwa)
        expect(phonemize("information", "en-GB")).toBe("ˌɪnfəˈmeɪʃən");
      });

      it("schedule uses initial /ʃ/ in RP", () => {
        expect(phonemize("schedule", "en-GB")).toContain("ʃ");
      });
    });

    describe("integration", () => {
      it("does not treat inherited object properties as RP dictionary entries", () => {
        expect(transformAmericanToRP("constructor", "kənˈstɹʌktɝ")).toBe("kənˈstɹʌktə");
        expect(transformAmericanToRP("__proto__", "ˈtu")).toBe("ˈtu");
        expect(phonemize("constructor", "en-GB")).toBe("kənˈstɹʌktə");
        expect(phonemize("A constructor builds it.", "en-GB")).toContain("kənˈstɹʌktə");
        expect(phonemize("constructor", "en-US")).toBe("kənˈstɹʌktɝ");
        expect(phonemize("A constructor builds it.", "en-US")).toContain("kənˈstɹʌktɝ");
      });

      it("keeps a caller-supplied stem in both dialects", () => {
        const processor = new EnglishG2P();
        processor.addPronunciation("tube", "ˈtub");
        expect(processor.predict("tubeless", "en-GB")).toBe("ˈtubɫəs");
        expect(processor.predict("tubeless", "en-US")).toBe("ˈtubɫəs");
      });

      it("does not change AmE output when no language is specified", () => {
        expect(phonemize("car")).toBe("ˈkɑɹ"); // baseline AmE
        expect(phonemize("bird")).toBe("ˈbɝd");
      });

      it("toIPA('text', 'en-GB') yields the RP form", () => {
        expect(toIPA("doctor", "en-GB")).toBe("ˈdɑktə");
      });

      it("EnglishG2P({ dialect: 'en-GB' }) instance defaults to RP without explicit tag", () => {
        const p = createPhonemizer({
          processors: [new EnglishG2P({ dialect: "en-GB" })],
        });
        expect(p.phonemize("car")).toBe("ˈkɑː");
      });

      it("explicit language tag overrides the instance dialect", () => {
        const p = createPhonemizer({
          processors: [new EnglishG2P({ dialect: "en-GB" })],
        });
        expect(p.phonemize("car", "en-US")).toBe("ˈkɑɹ");
      });
    });

    describe("ARPABET output for en-GB", () => {
      it("emits no 'undefined' tokens for words the RP transform touches", () => {
        // ɜ and ː are RP-only IPA symbols not in the canonical ARPABET
        // inventory; they should be mapped (ɜ → ER) or stripped (ː) so
        // ARPABET output is clean.
        const out = toARPABET("car", "en-GB");
        expect(out).not.toContain("undefined");
        expect(out).toContain("AA"); // car → AA1
      });

      it("NURSE words round-trip to ER in ARPABET", () => {
        expect(toARPABET("bird", "en-GB")).toContain("ER");
      });
    });

    describe("user customDict beats RP lexical override", () => {
      it("addPronunciation on a shibboleth still wins under en-GB", () => {
        // 'schedule' is in src-data/en-gb/lexical.json — without this
        // fix, calling addPronunciation('schedule', ...) would have no
        // effect for en-GB output.
        const p = createPhonemizer({ processors: [new EnglishG2P()] });
        p.addPronunciation("schedule", "ɛksɛkjuːʃən"); // arbitrary marker
        expect(p.phonemize("schedule", "en-GB")).toBe("ɛksɛkjuːʃən");
        expect(p.phonemize("schedule", "en-US")).toBe("ɛksɛkjuːʃən");
      });
    });

    describe("transformAmericanToRP unit tests", () => {
      it("is a pure function on word + AmE IPA", () => {
        expect(transformAmericanToRP("car", "ˈkɑɹ")).toBe("ˈkɑː");
        expect(transformAmericanToRP("doctor", "ˈdɑktɝ")).toBe("ˈdɑktə");
        expect(transformAmericanToRP("bird", "ˈbɝd")).toBe("ˈbɜːd");
      });

      it("lexical exception (en-gb/lexical.json) wins over rule-based transform", () => {
        // 'schedule' has no rule-derivable form (initial /sk/ → /ʃ/);
        // the JSON lookup short-circuits the rule pass.
        expect(transformAmericanToRP("schedule", "ˈskɛdʒuɫ")).toBe("ˈʃɛdjuːl");
      });
    });
  });

})();

// Original suite: en-geon-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US surgeon /ˈsɝː.dʒən/ and Oxford bludgeon/burgeon,
  // including the Oxford-listed -s/-ed/-ing forms:
  // https://dictionary.cambridge.org/pronunciation/english/surgeon
  // https://www.oxfordlearnersdictionaries.com/definition/english/bludgeon
  // https://www.oxfordlearnersdictionaries.com/us/definition/english/burgeon
  // Synthetic controls assert only the rime this rule owns.
  describe.each([false, true])("final geon rime (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each(["surgeon", "sturgeon", "bludgeon", "burgeon", "dungeon", "pigeon"])("coalesces the final weak nucleus in %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/dʒən$/);
    });
    test.each([
      ["surgeons", /dʒənz$/], ["surgeon's", /dʒənz$/],
      ["bludgeoned", /dʒənd$/], ["burgeoned", /dʒənd$/],
      ["bludgeoning", /dʒənɪŋ$/], ["burgeoning", /dʒənɪŋ$/],
      ["zurgeon", /dʒən$/], ["zurgeons", /dʒənz$/],
      ["zurgeoned", /dʒənd$/], ["zurgeoning", /dʒənɪŋ$/],
    ])("preserves the rime through the actual morphology route: %s", (word, rime) => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(rime);
    });
    test("retains initial and medial hiatus and the previous gion family", () => {
      expect(engine.predict("geon")).toBe("ˈdʒiɑn");
      expect(engine.predict("geonic")?.replace(/[ˈˌ]/g, "")).toContain("dʒi");
      for (const word of ["region", "religion", "contagion", "legion"])
        expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/dʒən$/);
    });
    test("preserves POS readings in full sentences", () => {

      const tokens = englishTokens(engine, "The surgeon records the event. They bludgeon the wall. The burgeoning town is quiet.");
      for (const [word, pos] of [["surgeon", "N"], ["bludgeon", "V"], ["burgeoning", "ADJ"]])
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
      expect(tokens.find(token => token.word === "records")?.phoneme).toBe(engine.predict("records", "en-US", "V"));
    });
    test("keeps caller-owned complete and derived readings", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("zurgeon", "ˈzɛŋ");
      expect(owned.predict("zurgeon")).toBe("ˈzɛŋ");
      expect(owned.predict("zurgeons")).toBe("ˈzɛŋz");
    });
  });

})();

// Original suite: en-gerund-subject-frame.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("gerund subject frame (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tagged = (sentence: string, word: string) => {
      const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
      const index = words.findIndex(token => token.toLowerCase() === word);
      return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
    };

    test("recognizes the modifier of a gerund subject", () => {
      expect(tagged("Laminate flooring is useful.", "laminate")).toBe("N");
      if (!disableDict) expect(api.phonemize("Laminate flooring is useful.", { language: "en-US" })).toBe("ˈɫæmənət ˈfɫɔɹɪŋ ɪz ˈjusfəɫ.");
    });

    test("retains verbal and adjectival controls", () => {
      expect(tagged("They laminate flooring for sale.", "laminate")).toBe("V");
      expect(tagged("They will laminate the material.", "laminate")).toBe("V");
      expect(tagged("Accurate accounting is important.", "accurate")).not.toBe("N");
      expect(tagged("Separate training is essential.", "separate")).not.toBe("N");
      if (!disableDict) {
        expect(api.phonemize("Live streaming is popular.", { language: "en-US" })).toBe("ɫaɪv ˈstɹimɪŋ ɪz ˈpɑpjəɫɝ.");
        expect(api.phonemize("Lead training is useful.", { language: "en-US" })).toBe("ɫid ˈtɹeɪnɪŋ ɪz ˈjusfəɫ.");
        expect(engine.predict("laminate", "en-US", "N")).toBe("ˈɫæmənət");
        expect(engine.predict("laminate", "en-US", "V")).toBe("ˈɫæməˌneɪt");
        expect(engine.predict("laminate", "en-US", "ADJ")).toBe("ˈɫæməˌneɪt");
      }
    });
  });

})();

// Original suite: en-gic-ics-batch.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("-ic derivative ownership (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each(["strategic", "strategically", "nonstrategic", "zategic"])("retains primary FLEECE in %s", word => {
      expect(engine.predict(word)).toContain("ˈtidʒɪk");
    });
    it("retains singular-root stress in the plural", () => {
      expect(engine.predict("strategics")).toBe("stɹəˈtidʒɪks");
    });
    it.each([["astrophysics", "ˌæstɹoʊˈfɪzɪks"], ["bishoprics", "ˈbɪʃəpɹɪks"]])("preserves %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves a lax neighboring suffix", () => {
      expect(engine.predict("genetic")).toMatch(/ˈnɛtɪk$/);
    });
    it("honors an explicitly supplied root in its unlisted plural", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("strategic", "ˈzɛŋ");
      expect(custom.predict("strategic")).toBe("ˈzɛŋ");
      expect(custom.predict("strategics")).toBe("ˈzɛŋz");
      expect(custom.predict("strategic's")).toBe("ˈzɛŋz");
    });
    it("preserves paired noun and verb controls in a sentence", () => {

      const tokens = englishTokens(engine, "The strategic reader will work.");
      for (const [word, ipa] of [["strategic", "stɹəˈtidʒɪk"], ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-grammatical-dental.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  function cold(disableDict: boolean) {
    const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.with; Reflect.set(engine, "dictionary", dictionary); return engine;
  }
  describe.each([false, true])("grammatical dental and uppercase recovery, rules=%s", disableDict => {
    test("the grammatical root remains voiced after eviction and in uppercase", () => {
      const engine = cold(disableDict);
      expect(engine.predict("with")).toBe("ˈwɪð"); expect(engine.predict("WITH")).toBe("ˈwɪð");
      for (const word of ["within", "without"]) expect(engine.predict(word)).toMatch(/ɪ[ˈˌ]?ð/);
      for (const word of ["myth", "pith", "Smith", "both", "forth", "beneath", "underneath"]) expect(engine.predict(word)).toMatch(/θ/);
      // Longer lexical stems are not the one-syllable grammatical compound tail.
      expect(engine.predict("withington")).toMatch(/θ/);
      expect(engine.predict("withith")).toMatch(/ð.*θ$/);
      expect(engine.predict("bothith")).not.toMatch(/ð/);
    });
    test("explicit initialisms and short-token spelling remain available", () => {
      const engine = cold(disableDict);
      expect(engine.predict("CPU")).toBe(disableDict ? "ˌsiˌpiˈju" : "ˈsiˈpiˈju"); expect(engine.predict("TTS")).toBe("ˈtiˈtiˈɛs");
      if (disableDict) { expect(engine.predict("US")).toBe("ˈjuˈɛs"); expect(engine.predict("IT")).toBe("ˈaɪˈti"); expect(engine.predict("WHO")).toBe("ˈdʌbəɫjuˈeɪtʃˈoʊ"); }
      engine.addPronunciation("with", "ˈtɛst");
      expect(engine.predict("WITH")).toBe("ˈtɛst"); expect(engine.predict("with's")).toBe("ˈtɛsts");
    });
    test("full-sentence noun, adjective and finite-verb controls stay distinct", () => {
      const api = createPhonemizer({ processors: [cold(disableDict)] });
      const out = api.phonemize("Smith reads a myth with her. The pithy author reads within the room without fear.", { language: "en-US", returnArray: true });
      for (const token of out.filter(t => /^(Smith|myth|pithy)$/.test(t.word))) expect(token.phoneme).toMatch(/θ/);
      for (const token of out.filter(t => /^(with|within|without)$/.test(t.word))) expect(token.phoneme).toMatch(/ɪ[ˈˌ]?ð/);
      expect(api.phonemize("WITH HER, they read it yesterday.", { language: "en-US", returnArray: true }).find(t => t.word === "WITH")?.phoneme).toMatch(/wɪð/);
    });
  });
  test("default spelling hints, apostrophe clipping and reading contrasts remain intact", () => {
    const api = createPhonemizer({ processors: [cold(false)] });
    const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    expect(pick('Mr. Pastie ("PASS-tee") is a brand name pasty.', "PASS")).toBe("pæs");
    expect(pick("She read with him yesterday.", "read")).toBe("ɹɛd");
    expect(pick("She will read with him.", "read")).toBe("ɹid");
    expect(cold(false).predict("somethin'")?.replace(/[ˈˌ]/g, "")).toBe("sʌmθɪn");
  });

})();

// Original suite: en-greek-and-neutral-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])(
    "Greek noun frames and Latin weak syllables (disableDict=%s)",
    (disableDict) => {
      const g2p = new EnglishG2P({ disableDict });
      const segments = (word: string): string =>
        g2p.predict(word)!.replace(/[ˈˌ]/g, "");

      test("a combining vowel keeps final gram full", () => {
        for (const word of [
          "histogram",
          "hologram",
          "kilogram",
          "monogram",
          "histograms",
          "holograms",
          "kilograms",
          "monograms",
        ])
          expect(segments(word)).toMatch(/ɡɹæmz?$/);
        expect(segments("pilgram")).toMatch(/ɡɹəm$/);
      });

      test("silent ue leaves the log noun's head stress intact", () => {
        for (const word of ["catalogue", "monologue", "catalogues", "monologues"])
          expect(g2p.predict(word)).toMatch(/^ˈ/);
        for (const word of ["prologue", "prologues"])
          expect(g2p.predict(word)).toMatch(/^ˈpɹoʊ/);
        for (const word of ["catalogue", "monologue", "dialogue"])
          expect(segments(word)).toMatch(/[ɑɔ]ɡ$/);
      });

      test("dia's weak second nucleus stays inside the stressed noun head", () => {
        for (const word of ["diagram", "dialogue", "diatribe"])
          expect(g2p.predict(word)).toMatch(/^ˈdaɪə/);
        for (const word of ["diagonal", "diameter"])
          expect(g2p.predict(word)).toMatch(/^daɪˈæ/);
      });

      test("final gm loses g while vowel-initial derivatives keep it", () => {
        for (const word of ["phlegm", "phlegms"])
          expect(segments(word)).toMatch(/ɛ[ɫl]?mz?$/);
        for (const word of ["paradigm", "paradigms"])
          expect(segments(word)).toMatch(/daɪmz?$/);
        for (const word of ["phlegmatic", "paradigmatic"])
          expect(segments(word)).toContain("ɡm");
      });

      test("logize uses the y noun frame through inflection", () => {
        for (const word of ["apologize", "apologized", "eulogize", "eulogized"])
          expect(segments(word)).toContain("ɫədʒaɪz");
        expect(g2p.predict("apologize")).toMatch(/^əˈpɑ/);
        expect(g2p.predict("eulogize")).toMatch(/^ˈju/);
        expect(segments("biologist")).toMatch(/ədʒɪst$/);
        expect(segments("photographer")).toMatch(/ɡɹəfɝ$/);
      });

      test("open re noun/adjective frames differ from hiatus and closed roots", () => {
        for (const word of [
          "relevant",
          "revenue",
          "redolent",
          "regimen",
          "reverent",
        ])
          expect(g2p.predict(word)).toMatch(/^ˈɹɛ/);
        for (const word of ["recipient", "resilient", "repellent", "remittent"])
          expect(g2p.predict(word)).toMatch(/^ɹ[əiɪ]ˈ/);
      });

      test("posttonic thematic vowels centralize in their bounded frames", () => {
        expect(segments("elegant")).toContain("ɫəɡ");
        expect(segments("elephant")).toContain("ɫəf");
        expect(segments("celebrant")).toContain("ɫəb");
        expect(segments("avenue")).toMatch(/^ævən/);
        for (const word of ["specimen", "specimens"])
          expect(segments(word)).toContain("səmən");
        for (const word of [
          "regimen",
          "regimens",
          "regiment",
          "regiments",
          "regimented",
        ])
          expect(segments(word)).toContain("dʒəm");
      });

      test("weak ance/ence prefixes yield to the root without moving hiatus", () => {
        expect(g2p.predict("advance")).toMatch(/ˈvæns$/);
        expect(g2p.predict("commence")).toMatch(/ˈmɛns$/);
        expect(g2p.predict("defence")).toMatch(/ˈfɛns$/);
        for (const word of ["deviance", "absence", "presence"])
          expect(g2p.predict(word)).toMatch(/^ˈ/);
      });

      test("mand/mend stress survives root eviction and regular inflections", () => {
        for (const word of ["command", "commands", "commander", "commanded"])
          expect(g2p.predict(word)).toMatch(/^kəˈmænd/);
        for (const word of ["commend", "commends"])
          expect(g2p.predict(word)).toMatch(/^kəˈmɛnd/);
        for (const word of ["comment", "common"])
          expect(g2p.predict(word)).toMatch(/^ˈkɑ/);
      });
    },
  );

  test("bare Logue is not mistaken for a longer silent-ue suffix", () => {
    expect(new EnglishG2P({ disableDict: true }).predict("logue")).toContain(
      "oʊ",
    );
  });

  test("a consonant-only abbreviation does not license silent Greek g", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict("pgm")).toBe("ˌpiˌdʒiˈɛm");
    expect(g2p.predict("mgm")).toContain("ɡ");
  });

})();

// Original suite: en-greek-iatr.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const predict = (word: string) => g.predict(word, "en")!;
    describe(`Greek medical roots (${disableDict})`, () => {
      test("stresses the PRICE nucleus through noun and agent composition", () => {
        for (const root of ["psychiatry", "podiatry", "psychiatrist", "podiatrist"])
          for (const word of [root, root + "'s", "non" + root])
            expect(predict(word)).toMatch(/ˈ[^aeiouɑæɛɪɔʊʌəɝ]*aɪə[ˌ]?[tθ]ɹ/);
        for (const word of ["psychiatrists", "podiatrists", "psychiatries", "podiatries"])
          expect(predict(word)).toMatch(/ˈ[^aeiouɑæɛɪɔʊʌəɝ]*aɪə/);
      });
      test("keeps psych PRICE and ordinary psyl KIT", () => {
        for (const word of ["psych", "psychs", "psyched", "psyching", "psychic", "psychics", "psychical", "psychically", "antipsychic", "semipsychical", "multipsychic", "neuropsych", "neuropsychiatrist", "neuropsychiatry"])
          expect(predict(word)).toMatch(/saɪ/);
        expect(predict("psyllium")).toMatch(/sɪ/);
        expect(predict("syllable")).toMatch(/sɪ/);
      });
      test("keeps adjective and other Greek suffix stress", () => {
        for (const word of ["psychiatric", "antipsychiatric", "semipsychiatric", "multipsychiatric", "neuropsychiatric"])
          expect(predict(word)).toMatch(/ˈæ[tθ]ɹɪk/);
        expect(predict("pediatric")).toMatch(/ˈæ[tθ]ɹɪk/);
        expect(predict("geometry")).toMatch(/ˈɑm/);
        expect(predict("symmetry")).toMatch(/^ˈsɪm/);
        expect(predict("patriotic")).toMatch(/ˈɑt/);
      });
    });
  }

})();

// Original suite: en-greek-ism-derivations.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // This class owns sm voicing; existing stress-placement errors are separate.
  describe("Greek ism before vocalic derivations", () => {
    test.each([false, true])(
      "preserves the root after lexical eviction (rules=%s)",
      (disableDict) => {
        const engine = new EnglishG2P({ disableDict });
        const dictionary = { ...Reflect.get(engine, "dictionary") };
        for (const word of [
          "charisma",
          "charismatic",
          "prismatic",
          "organismic",
          "blepharisma",
        ])
          delete dictionary[word];
        Reflect.set(engine, "dictionary", dictionary);
        for (const word of [
          "charisma",
          "charismas",
          "charisma's",
          "noncharisma",
          "charismatic",
          "charismatically",
          "noncharismatic",
          "prismatic",
          "nonprismatic",
          "organismic",
          "nonorganismic",
        ]) {
          expect(engine.predict(word)).toMatch(/ɪ[ˈˌ]?z[ˈˌ]?m/);
          expect(engine.predict(word)).not.toMatch(/ɪ[ˈˌ]?sm/);
        }
        expect(engine.predict("charisma")).toBe("kɝˈɪzmə");
        expect(engine.predict("prismatic")).toBe("pɹɪzˈmætɪk");
        expect(engine.predict("charismatic")?.replace(/ˌ/g, "")).toBe(
          "kɛɹɪzˈmætɪk",
        );
      },
    );
    test.each([false, true])(
      "preserves unrelated boundaries (rules=%s)",
      (disableDict) => {
        const engine = new EnglishG2P({ disableDict });
        expect(engine.predict("talisman")).toBe("ˈtæɫɪsmən");
        for (const word of [
          "antismoking",
          "dismay",
          "heisman",
          "chrisman",
          "naismith",
        ])
          expect(engine.predict(word)).not.toMatch(/ɪ[ˈˌ]?z[ˈˌ]?m/);
        const api = createPhonemizer({ processors: [engine] });
        expect(
          api
            .phonemize(
              "The charisma of the present speaker attracts attention.",
              { language: "en-US", returnArray: true },
            )
            .find((t) => t.word === "charisma")?.phoneme,
        ).toBe("kɝˈɪzmə");
        if (!disableDict)
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
      },
    );
    test("preserves custom target ownership", () => {
      const engine = new EnglishG2P();
      engine.addPronunciation("charisma", "ˈzɛmp");
      expect(engine.predict("charisma")).toBe("ˈzɛmp");
    });
  });

})();

// Original suite: en-greek-sm-yod.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Cambridge cosmic/seismic independently support these consonants.
  describe.each([false, true])("Greek sm roots, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([["cosmic", "ˈkɑzmɪk"], ["seismic", "ˈsaɪzmɪk"],
      ["seismology", "ˌsaɪzˈmɑɫədʒi"], ["cosmically", "ˈkɑzmɪkɫi"], ["cosmetics", "kɑzˈmɛtɪks"]])("renders %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves native /sm/ in the neighboring root", () => {
      expect(engine.predict("cosmosbasement")).toMatch(/beɪsmənt$/);
      expect(engine.predict("seismicbasement")).toMatch(/baɪsmənt$/);
      expect(engine.predict("dismiss")).toBe("dɪsˈmɪs");
      expect(engine.predict("dismantle")).toBe("dɪˈsmæntəɫ");
      expect(engine.predict("basement")).toBe("ˈbeɪsmənt");
    });
    it("preserves caller literal clusters and child overrides", () => {
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("cosmic", "ˈkɑsmɪk");
      expect(own.predict("cosmically")).toBe("ˈkɑsmɪkɫi");
      own.addPronunciation("cosmically", "ˈzɛŋ");
      expect(own.predict("cosmically")).toBe("ˈzɛŋ");
      own.addPronunciation("issue", "ˈɪsʃu");
      expect(own.predict("issue")).toBe("ˈɪsʃu");
    });
    it("keeps noun, adjective and verb controls in the same sentence", () => {
      const api = createPhonemizer({ processors: [engine] });
      const out = api.phonemize("The seismic reader read the notes yesterday.", {language: "en-US", returnArray: true});
      expect(out.find(token => token.word === "seismic")?.phoneme).toBe("ˈsaɪzmɪk");
      expect(out.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(out.find(token => token.word === "read")?.phoneme).toBe("ɹɛd");
    });
  });

  describe.each([false, true])("ex- root and coalesced geminate, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it("preserves the -ecute root before its -ution nominalization", () => {
      expect(engine.predict("execution")?.replace(/[ˈˌ]/g, "")).toBe("ɛksəkjuʃən");
      expect(engine.predict("executions")?.replace(/[ˈˌ]/g, "")).toBe("ɛksəkjuʃənz");
      expect(engine.predict("execute")).toBe("ˈɛksəkˌjut");
      expect(engine.predict("executive")).toBe("ɪɡˈzɛkjətɪv");
      expect(engine.predict("examination")).toBe("ɪɡˌzæməˈneɪʃən");
      expect(engine.predict("exemplary")).toMatch(/ɡ[ˈˌ]?z/);
    });
    it("coalesces the doubled fricative without crossing native boundaries", () => {
      expect(engine.predict("issue")).toBe("ˈɪʃu");
      expect(engine.predict("assure")).toBe("əˈʃʊɹ");
      expect(engine.predict("assurance")).toBe("əˈʃʊɹəns");
      if (disableDict) {
        expect(engine.predict("tissue")).toBe("ˈtɪʃu");
        expect(engine.predict("misshapen")).toContain("sʃ");
      }
    });
    it("keeps the correct onset after root eviction", () => {
      const own = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(own, ["seismology"]);
      expect(own.predict("seismology")).toBe("ˌsaɪzˈmɑɫədʒi");
    });
  });

})();

// Original suite: en-greek-them-and-open-cret.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])("Greek them+vowel keeps theta and open e before cret stays tense (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const key of Object.keys(dictionary)) if (/them|secret/.test(key)) delete dictionary[key];
   Reflect.set(e, "dictionary", dictionary);
   expect(e.predict("theme")).toBe("ˈθim");
   for (const word of ["themes", "themed", "theming", "thematic", "thematically"]) expect(e.predict(word)).toMatch(/^ˈ?θ/);
   for (const word of ["them", "themselves", "they"]) expect(e.predict(word)).toMatch(/^ˈ?ð/);
   for (const word of ["secret", "secrets", "secretly", "secretory"]) expect(e.predict(word)).toMatch(/^ˈsikɹ/);
   expect(e.predict("zecret")).toMatch(/^ˈzikɹ/);
   expect(e.predict("secretary")).toMatch(/^ˈsɛkɹ/); expect(e.predict("decrepit")).toContain("ˈkɹɛp");
   expect(e.predict("secretory")).toContain("ɔɹi");
   const api = createPhonemizer({ processors: [e] });
   const out = api.phonemize("They record a secret theme for themselves.", { language: "en-US", returnArray: true });
   expect(out.find(t => t.word === "theme")!.phoneme).toBe("θim");
   expect(out.find(t => t.word === "secret")!.phoneme).toMatch(/^ˈsikɹ/);
   expect(out.find(t => t.word === "record")!.phoneme).toContain("ˈkɔɹd");
   expect(out.find(t => t.word === "themselves")!.phoneme).toMatch(/^ð/);
  });
  test("caller theme roots own their inflections", () => {
   const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("theme", "ˈtɛst");
   expect(e.predict("themes")).toBe("ˈtɛsts"); expect(e.predict("themed")).toBe("ˈtɛstɪd");
  });

})();
