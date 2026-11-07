// Original suite: en-weak-niv.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("weak niv vowel (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test.each([
      ["anniversary", "N", "ˌænəˈvɝsɝi"],
      ["carnival", "N", "ˈkɑɹnəvəɫ"],
      ["carnivores", "N", "ˈkɑɹnəˌvɔɹz"],
      ["carnivorous", "ADJ", "kɑɹˈnɪvɝəs"],
      ["snivel", "V", "ˈsnɪvəɫ"],
      ["percival", "N", "ˈpɝsɪvəɫ"],
    ])("preserves stress and vowel in %s", (word, pos, expected) => {
      expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });

    test("does not reduce the transparent mini- boundary", () => {
      expect(engine.predict("minivan", "en-US", "N")).not.toContain("nəv");
      expect(engine.predict("univas", "en-US", "N")).not.toContain("nəv");
    });

    test("retains the stem pronunciation in an OOV agent noun", () => {
      expect(engine.predict("carnivaler", "en-US", "N")).toBe("ˈkɑɹnəvəɫɝ");
    });

    test.each([
      ["The carnival marks our anniversary.", "ðə ˈkɑɹnəvəɫ mɑɹks aʊɝ ˌænəˈvɝsɝi."],
      ["Carnivorous animals snivel.", "kɑɹˈnɪvɝəs ˈænəməɫz ˈsnɪvəɫ."],
    ])("preserves full context: %s", (sentence, expected) => {
      expect(api.phonemize(sentence, { language: "en-US" })).toBe(expected);
    });
  });

})();

// Original suite: en-weak-nsw-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])(
    "keeps weak nsw inside its root after eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const w of [
        "answer",
        "answers",
        "answered",
        "answering",
        "answerable",
      ])
        delete d[w];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["answer", "ˈænsɝ"],
        ["answers", "ˈænsɝz"],
        ["answered", "ˈænsɝd"],
        ["answering", "ˈænsɝɪŋ"],
        ["answerable", "ˈænsɝəbəɫ"],
        ["unswerving", "ənˈswɝvɪŋ"],
        ["unswervingly", "ənˈswɝvɪŋɫi"],
        ["swerve", "ˈswɝv"],
        ["swear", "ˈswɛɹ"],
      ])
        expect(e.predict(word)).toBe(ipa);
      const api = createPhonemizer({ processors: [e] });
      for (const sentence of [
        "The answer was clear.",
        "They answer the question.",
      ])
        expect(
          api
            .phonemize(sentence, { language: "en-US", returnArray: true })
            .find((t) => t.word === "answer")
            ?.phoneme.replace(/[ˈˌ]/g, ""),
        ).toBe("ænsɝ");
    },
  );
  test("keeps supplied roots and targets", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("answer", "ˈzɛmp");
    expect(e.predict("answered")).toBe("ˈzɛmpt");
    e.addPronunciation("answerable", "ˈtɛst");
    expect(e.predict("answerable")).toBe("ˈtɛst");
  });

})();

// Original suite: en-weak-open-o-and-geminate-soft-codas.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

  describe.each([false, true])("weak open-o and geminate soft codas (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const say = (word: string) => clean(g2p.predict(word)!);
    test("initial non-stop o before labial/velar onsets keeps the attested full vowel", () => {
      for (const word of ["mobility", "momentum", "november", "romantic", "romania", "slovenia", "vocabulary"])
        expect(say(word)).toMatch(/^(?:[mnɹv]|sɫ)oʊ/);
      for (const word of ["mobility", "momentum", "november", "romantic", "vocabulary"])
        for (const prefix of ["un", "non", "semi", "multi"])
          expect(say(prefix + word)).toMatch(/oʊ/);
      expect(g2p.predict("vocabularies")).toMatch(/ˈkæbj/);
      expect(say("momentous")).toMatch(/ntəs$/);
      for (const word of ["moviegoer", "moviemaker", "moviemaking"]) expect(say(word)).toMatch(/^muvi/);
      expect(say("novelties")).toMatch(/^nɑvəl|^nɑvəɫ/);
      expect(say("novelistic")).toMatch(/^nɑ/);
      expect(say("rococo")).toMatch(/^ɹə/);
      expect(say("sobriety")).toMatch(/^sə/);
      expect(say("nominated")).toMatch(/neɪt/);
      expect(say("lovette")).not.toMatch(/^loʊ|^ɫoʊ/);
      expect(say("modification")).not.toMatch(/^moʊ/);
      expect(say("volunteer")).not.toMatch(/^voʊ/);
      expect(say("morocco")).not.toMatch(/^moʊ/);
    });
    test("geminate soft-coda nouns stress their real first syllable", () => {
      for (const word of ["challenge", "commerce"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
      expect(g2p.predict("divorce")).toMatch(/ˈvɔɹ/);
      expect(g2p.predict("enlarge")).toMatch(/ˈɫɑɹ/);
      expect(g2p.predict("enforce")).toMatch(/ˈfɔɹ/);
    });
  });

})();

// Original suite: en-weak-root-ous.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("weak disyllabic ous roots, rules=%s", disableDict => {
    it("recovers neutral adjectives after whole-target eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["poisonous", "perilous", "libelous"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [["poisonous", "ˈpɔɪzənəs"], ["perilous", "ˈpɛɹəɫəs"], ["libelous", "ˈɫaɪbəɫəs"]])
        expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves stress-shifting and vowel-final root environments", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["portentous", "pɔɹˈtɛntəs"], ["courageous", "kɝˈeɪdʒəs"], ["gelatinous", "dʒəˈɫætənəs"],
        ["gracious", "ˈɡɹeɪʃəs"], ["hideous", "ˈhɪdiəs"], ["various", "ˈvɛɹiəs"], ["phosphorous", "ˈfɑsfɝəs"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });
    it("retains supplied root and complete-child pronunciation ownership", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["poisonous"]);
      engine.addPronunciation("poison", "ˈzɛŋ");
      expect(engine.predict("poisonous")).toBe("ˈzɛŋəs");
      engine.addPronunciation("poisonous", "ˈkɛŋ");
      expect(engine.predict("poisonous")).toBe("ˈkɛŋ");
    });
  });
  it("preserves noun, adjective and verb sentence readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const [sentence, word, ipa] of [
      ["The poison is here.", "poison", "ˈpɔɪzən"], ["They poison the water.", "poison", "ˈpɔɪzən"],
      ["The poisonous substance is here.", "poisonous", "ˈpɔɪzənəs"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-weak-roots-and-prefixes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])(
    "weak roots and prefix boundaries (disableDict=%s)",
    (disableDict) => {
      const g2p = new EnglishG2P({ disableDict });
      const segments = (word: string): string =>
        g2p.predict(word)!.replace(/[ˈˌ]/g, "");

      test("the open re adjective frame differs from a two-syllable verb", () => {
        for (const word of ["relative", "relatives", "relatively"])
          expect(g2p.predict(word)).toMatch(/^ˈɹɛɫə/);
        for (const word of ["revive", "relive", "receptive", "reductive"])
          expect(g2p.predict(word)).toMatch(/^ɹiˈ/);
      });

      test("a stressed bare e lengthens before its bounded weak tail", () => {
        for (const word of ["even", "evil", "eden"])
          expect(g2p.predict(word)).toMatch(/^ˈi/);
        for (const word of ["evil", "evilly", "evilness"])
          expect(segments(word)).toContain("vəɫ");
      });

      test("a weak fricative il rime survives plural and agent composition", () => {
        for (const word of [
          "civil",
          "council",
          "fossil",
          "pencil",
          "vigil",
          "weevil",
          "anvil",
        ])
          expect(segments(word)).toMatch(/əɫ$/);
        for (const word of [
          "councils",
          "fossils",
          "pencils",
          "vigils",
          "weevils",
          "anvils",
        ])
          expect(segments(word)).toMatch(/əɫz$/);
        for (const word of [
          "penciled",
          "pencilled",
          "penciling",
          "pencilling",
          "penciler",
          "penciller",
        ])
          expect(g2p.predict(word)).toMatch(/^ˈpɛnsəɫ/);
      });

      test("strong or non-fricative il keeps its vowel", () => {
        for (const word of ["brazil", "tamil", "gerbil"])
          expect(segments(word)).toMatch(/ɪɫ$/);
        // The supplied stencil reading has IH; the rule's weak schwa is also
        // attested by Cambridge. This test does not change the scoring reference.
        expect(segments("stencil")).toMatch(/s[əɪ]ɫ$/);
      });

      test("real silent-e roots remain available to regular inflections", () => {
        for (const word of ["exiled", "reviled", "reconciled", "reconciling"])
          expect(segments(word)).toContain("aɪɫ");
        // A bound con+cil fragment must not acquire the free noun's weak rime.
        // This guards the boundary without claiming its existing stem is exact.
        expect(segments("irreconcilable")).not.toContain("nsəɫ");
      });

      test("a bound prefix is not a free verb before neutral ment", () => {
        for (const word of ["comment", "comments", "commenting"])
          expect(g2p.predict(word)).toMatch(/^ˈkɑm[əɛ]nt/);
        expect(segments("comment")).not.toContain("mm");
      });
    },
  );

})();

// Original suite: en-weak-sb-foot.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US husband, both noun and verb: /ˈhʌz.bənd/.
  // https://dictionary.cambridge.org/dictionary/english/husband
  // Synthetic roots assert only this rule's weak-foot voicing and composition.
  describe.each([false, true])("singleton s before a weak b foot (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each(["husband", "husbands", "husband's", "visband", "visbands", "visbanded", "visbanding", "zisban", "zisbans", "zisbaned", "zisbaning"])("keeps the voiced weak foot through %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/zbən/);
    });
    test.each([
      ["gasband", /sˌbænd$/], ["gasbun", /sˌbʌn$/],
      ["foosball", /sbɔ[ɫl]$/], ["busboy", /sˌbɔɪ$/],
      ["visbend", /sbɛnd$/], ["visbind", /sbaɪnd$/],
      ["gasdom", /sdəm$/], ["bossdom", /sdəm$/],
    ])("preserves the full-vowel or other-stop control %s", (word, rime) => {
      expect(engine.predict(word)).toMatch(rime);
    });
    test("preserves final stress and caller-owned roots", () => {
      expect(engine.predict("disband")).toContain("sˈbænd");
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("visband", "ˈvɪsˌbænd");
      expect(owned.predict("visband")).toBe("ˈvɪsˌbænd");
      expect(owned.predict("visbands")).toBe("ˈvɪsˌbændz");
    });
    test("preserves noun, adjective and verb controls in full sentences", () => {

      const tokens = englishTokens(engine, "Her husband records the careful speech. They husband the resources.");
      for (const token of tokens.filter(token => token.word === "husband")) expect(token.phoneme).toBe(engine.predict("husband", "en-US", "V"));
      expect(tokens.find(token => token.word === "records")?.phoneme).toBe(engine.predict("records", "en-US", "V"));
      expect(tokens.find(token => token.word === "careful")?.phoneme).toBe(engine.predict("careful", "en-US", "ADJ"));
      expect(engine.predict("husband", "en-US", "N")).toBe(engine.predict("husband", "en-US", "V"));
    });
  });

  // Preserve the frozen dictionary contract for lexical /s/ variants on the default route.
  // The normal exception miner must restore these after the rule changes.
  test.each(["osbon", "osbun"])("keeps dictionary-owned s in %s", word => {
    const engine = new EnglishG2P();
    expect(engine.predict(word)).toBe("ˈɑsbən");
    expect(engine.predict(word + "s")).toBe("ˈɑsbənz");
  });

})();

// Original suite: en-weak-scientific-y.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("weak thematic y in final scientific nouns (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["oxygen", "ˈɑksədʒən"], ["oxygens", "ˈɑksədʒənz"], ["oxygen's", "ˈɑksədʒənz"],
      ["polymer", "ˈpɑɫəmɝ"], ["polymer's", "ˈpɑɫəmɝz"],
      ["analysis", "əˈnæɫəsəs"], ["anonymous", "əˈnɑnəməs"],
      ["hydrogen", "ˈhaɪdɹədʒən"], ["halogen", "ˈhæɫədʒən"],
      // Cambridge gives the US reading /ˈnaɪ.trə.dʒən/ in both dictionary and rule paths.
      ["nitrogen", "ˈnaɪtɹədʒən"],
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

        const tokens = englishTokens(engine, `The clever reader will work with ${word}.`);
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

})();

// Original suite: en-weak-senger.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("weak e before a nasal affricate, disableDict=%s", disableDict => {
   const engine = new EnglishG2P({disableDict});
   it.each([["messenger","ˈmɛsəndʒɝ"],["passenger","ˈpæsəndʒɝ"]])("preserves %s and its inflections",(word,ipa)=>{
     expect(engine.predict(word)).toBe(ipa);
     expect(engine.predict(word+"s")).toBe(ipa+"z");
     expect(engine.predict(word+"'s")).toBe(ipa+"z");
     expect(engine.predict("non"+word)).toContain(ipa);
   });
   it("preserves stressed e and the adjacent verb",()=>{
     expect(engine.predict("send")).toBe("ˈsɛnd");
     expect(engine.predict("sensing")).toBe("ˈsɛnsɪŋ");

     const tokens = englishTokens(engine, "The sensible messenger sent a note to the passenger.");
     expect(tokens.find(t=>t.word==="messenger")?.phoneme).toBe("ˈmɛsəndʒɝ");
     expect(tokens.find(t=>t.word==="passenger")?.phoneme).toBe("ˈpæsəndʒɝ");
     expect(tokens.find(t=>t.word==="sent")?.phoneme).toBe("sɛnt");
   });
   it("keeps caller-owned roots and explicit children",()=>{
     const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
     delete dictionary.messengers;Reflect.set(own,"dictionary",dictionary);
     own.addPronunciation("messenger","ˈzɛŋ");
     expect(own.predict("messengers")).toBe("ˈzɛŋz");
     expect(own.predict("messenger's")).toBe("ˈzɛŋz");
     own.addPronunciation("messengers","ˈkɛŋ");expect(own.predict("messengers")).toBe("ˈkɛŋ");
   });
  });

})();

// Original suite: en-weak-shion-and-velar-ush.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { syllableToIPA } = __suiteModule2;

  // https://dictionary.cambridge.org/us/dictionary/english/fashion
  // https://dictionary.cambridge.org/pronunciation/english/cushion
  const family = ["fashion", "fashions", "fashioned", "fashioning", "fashionable", "refashion", "refashioning",
    "cushion", "cushions", "cushioned", "cushioning", "cushy", "recushion", "recushioning", "uncushioned", "cushey", "parishioner", "parishioners", "oldfashioned"];
  describe.each([false, true])("weak shion and vocalic velar ush, rules=%s", disableDict => {
    const withoutFamily = () => {
      const own = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(own, "dictionary") };
      for (const word of family) delete dictionary[word];
      Reflect.set(own, "dictionary", dictionary);
      return own;
    };
    it.each([
      ["fashion", "ˈfæʃən"], ["fashions", "ˈfæʃənz"], ["fashioned", "ˈfæʃənd"],
      ["fashioning", "ˈfæʃənɪŋ"], ["fashionable", "ˈfæʃənəbəɫ"],
      ["refashion", "ɹiˈfæʃən"], ["refashioning", "ɹiˈfæʃənɪŋ"],
      ["cushion", "ˈkʊʃən"], ["cushions", "ˈkʊʃənz"], ["cushioned", "ˈkʊʃənd"],
      ["cushioning", "ˈkʊʃənɪŋ"], ["cushy", "ˈkʊʃi"],
      ["cushey", "ˈkʊʃi"], ["noncushey", "nɑnˈkʊʃi"],
      ["noncushy", "nɑnˈkʊʃi"], ["noncushion", "nɑnˈkʊʃən"], ["nonfashion", "nɑnˈfæʃən"],
      ["nonparishioner", "nɑnpɝˈɪʃənɝ"], ["nonparishioners", "nɑnpɝˈɪʃənɝz"],
      ["parishioner", "pɝˈɪʃənɝ"], ["oldfashioned", "oʊɫdˈfæʃənd"],
      ["cushier", "ˈkʊʃiɝ"], ["cushiest", "ˈkʊʃiəst"],
      ["recushion", "ɹiˈkʊʃən"], ["recushioning", "ɹiˈkʊʃənɪŋ"], ["uncushioned", "ənˈkʊʃənd"],
    ])("keeps the root and suffix after eviction: %s", (word, ipa) => {
      expect(withoutFamily().predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("keeps the same root under productive and repeated prefixes", () => {
      const own = withoutFamily();
      for (const word of ["unrecushioning", "countercushioning", "overcushioning"])
        expect(own.predict(word)).toMatch(/ˈkʊʃənɪŋ$/);
    });
    it.each([
      ["bush", "ˈbʊʃ"], ["push", "ˈpʊʃ"], ["gush", "ˈɡʌʃ"], ["hush", "ˈhʌʃ"],
      ["rush", "ˈɹʌʃ"], ["brush", "ˈbɹʌʃ"], ["crush", "ˈkɹʌʃ"], ["plush", "ˈpɫʌʃ"],
      ["percussion", "pɝˈkʌʃən"], ["discussion", "dɪˈskʌʃən"],
      ["vision", "ˈvɪʒən"], ["passion", "ˈpæʃən"], ["mission", "ˈmɪʃən"],
    ])("preserves the neighboring onset and coalescence: %s", (word, ipa) => {
      expect(new EnglishG2P({ disableDict }).predict(word)).toBe(ipa);
    });
    it("preserves caller-owned roots and complete targets", () => {
      const own = withoutFamily();
      own.addPronunciation("fashion", "ˈzɛŋ");
      expect(own.predict("fashioning")).toBe("ˈzɛŋɪŋ");
      own.addPronunciation("fashioning", "ˈʃiən");
      expect(own.predict("fashioning")).toBe("ˈʃiən");
      own.addPronunciation("cushion", "ˈzɛŋ");
      expect(own.predict("cushioning")).toBe("ˈzɛŋɪŋ");
    });
    it.each([
      ["They fashion the badge for the kind minder.", "fashion", "ˈfæʃən"],
      ["The fashion was clear.", "fashion", "ˈfæʃən"],
      ["The fashionable badge was clear.", "fashionable", "ˈfæʃənəbəɫ"],
    ])("preserves noun, verb and adjective sentence controls: %s", (sentence, word, ipa) => {
      const api = createPhonemizer({ processors: [withoutFamily()] });
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });
  it("coalesces only a noninitial weak shion syllable", () => {
    expect(syllableToIPA("shion", 1, false, true, undefined, undefined, "fa")).toBe("ʃən");
    for (const [index, stressed, secondary] of [[0, false, false], [1, true, false], [1, false, true]] as const)
      expect(syllableToIPA("shion", index, stressed, true, undefined, undefined, "fa", false, undefined, secondary)).not.toBe("ʃən");
  });

})();

// Original suite: en-weak-sole.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { syllableToIPA } = __suiteModule1;

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

})();

// Original suite: en-weak-tia-and-latin-uum.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

  describe.each([false, true])("weak Latin hiatus and Greek -oic (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const say = (word: string) => clean(g2p.predict(word)!);

    test("weak -uum retains its long u and the licensed yod", () => {
      expect(say("continuum")).toMatch(/njuəm$/);
      expect(say("vacuum")).toMatch(/kju(?:ə)?m$/);
      for (const word of ["continuums", "vacuumed", "vacuuming"])
        expect(say(word)).toMatch(/ju/);
    });

    test("weak final -tia palatalizes in native Latin endings", () => {
      for (const word of ["militia", "scotia", "consortia", "inertia"])
        expect(say(word)).toMatch(/ʃə$/);
      expect(say("prestia")).toMatch(/^pɹɛs/);
      for (const word of ["tia", "poinsettia", "patio"])
        expect(say(word)).toMatch(/ti[əo]/);
    });

    test("transparent derivation retains the complete root after eviction", () => {
      for (const word of ["noncontinuum", "precontinuum", "uncontinuum", "continuumer"])
        expect(say(word)).toMatch(/kəntɪnjuəm/);
      for (const word of ["stoics", "stoical", "stoicer", "stoically", "nonstoic"])
        expect(say(word)).toMatch(/stoʊɪk/);
      for (const word of ["scotias", "scotialike", "consortiawise", "inertias"])
        expect(say(word)).toMatch(/ʃə/);
    });

    test("Greek -oic retains two nuclei with ordinary -ic root stress", () => {
      for (const word of ["stoic", "heroic", "mesozoic", "cenozoic"])
        expect(say(word)).toMatch(/oʊɪk$/);
      expect(g2p.predict("stoic")).toMatch(/^ˈstoʊɪk$/);
      expect(g2p.predict("heroic")).toMatch(/ˈɹoʊɪk$/);
      for (const word of ["coin", "voice", "choice", "voiced", "voicing", "choicer", "devoiced", "devoicing", "unvoiced", "revoiced", "revoicing"])
        expect(say(word)).toMatch(/ɔɪ/);
    });
  });

})();

// Original suite: en-weak-tual-adverbs.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("expanded /u/ in -tual adverbs", () => {
    it.each([
      ["actually", "ˈæktʃuəɫi"],
      ["perceptually", "pɝˈsɛptʃuəɫi"],
    ])("preserves the spelled /u/ in %s on the rule path", (word, ipa) => {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      // Cambridge US /ɪˈven.tʃu.ə.li/; corrects the old IPA-Dict onset-vowel reading.
      ["eventually", "ɪˈvɛntʃuəɫi"],
      ["factually", "ˈfæktʃuəɫi"],
      ["habitually", "həˈbɪtʃuəɫi"],
      ["virtually", "ˈvɝtʃuəɫi"],
    ])("preserves neighboring -tual readings: %s", (word, ipa) => {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-weak-tune.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("short weak postrhotic -tune (rules=%s)", disableDict => {
    it.each(["fortune", "fortunes", "fortune's"])("keeps dialect-specific nuclei in %s", word => {
      const e = new EnglishG2P({ disableDict }), plural = word !== "fortune" ? "z" : "";
      expect(e.predict(word, "en-US")).toBe("ˈfɔɹtʃən" + plural);
      expect(e.predict(word, "en-GB")).toBe("ˈfɔːtʃuːn" + plural);
    });
    it.each(["tune", "neptune", "opportune", "importune"])("retains the full nonmatching rime in %s", word => {
      expect(new EnglishG2P({ disableDict }).predict(word, "en-US")).toMatch(/tun$/);
    });
    it("composes the root in a new hyphenated prefix form", () => {
      const e = new EnglishG2P({ disableDict });
      expect(e.predict("post-fortune", "en-US")).toMatch(/fɔɹtʃən$/);
      expect(e.predict("post-fortune", "en-GB")).toMatch(/fɔːtʃuːn$/);
    });
    it("preserves caller roots and direct children", () => {
      const e = new EnglishG2P({ disableDict });
      e.addPronunciation("fortune", "ˈzɛŋ");
      expect(e.predict("fortunes")).toBe("ˈzɛŋz");
      expect(e.predict("fortune's", "en-GB")).toBe("ˈzɛŋz");
      e.addPronunciation("fortunes", "ˈkɛŋ");
      expect(e.predict("fortunes")).toBe("ˈkɛŋ");
    });
    it("retains the noun in full prose", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      expect(api.phonemize("The clever reader made a fortune.", { language: "en-US", returnArray: true }).find(t => t.word === "fortune")?.phoneme).toBe("ˈfɔɹtʃən");
    });
  });

})();

// Original suite: en-weak-tur-coalescence.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("weak open rhotic u (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["century", "ˈsɛntʃɝi"], ["centuries", "ˈsɛntʃɝiz"],
      ["century's", "ˈsɛntʃɝiz"], ["midcentury", "mɪdˈsɛntʃɝi"],
      ["saturn", "ˈsætɝn"], ["sturdy", "ˈstɝdi"], ["turn", "ˈtɝn"],
      ["turtle", "ˈtɝtəɫ"], ["centurion", "sɛnˈtʊɹiən"],
      ["maturity", "məˈtʃʊɹəti"],
      ["natural", "ˈnætʃɝəɫ"], ["future", "ˈfjutʃɝ"],
    ])("preserves the root or control of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each(["ventury", "zatury"])("coalesces the same weak open rime in OOV %s", word => {
      expect(engine.predict(word)).toMatch(/tʃɝi$/);
    });
    it("inherits caller roots through possessives and plurals", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("century", "ˈsɛŋ");
      expect(custom.predict("century")).toBe("ˈsɛŋ");
      expect(custom.predict("century's")).toBe("ˈsɛŋz");
      expect(custom.predict("centuries")).toBe("ˈsɛŋz");
    });
    it("preserves noun, adjective and verb controls in a complete sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will work for a century.");
      for (const [word, ipa] of [["century", "ˈsɛntʃɝi"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-weak-ure-and-closed-e.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("weak ure and closed e roots (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("weak tails preserve the glide and reduced rhotic through inflection", () => {
      for (const word of ["failure", "failures", "tenure", "tenures", "tenured"])
        expect(g2p.predict(word)).toMatch(/[ɫn]jɝ/);
      for (const word of ["procedure", "procedures"])
        expect(g2p.predict(word)).toContain("ˈsidʒɝ");
    });

    test("strong roots retain CURE rather than taking the weak tail", () => {
      for (const word of ["cure", "cures", "pure", "secure", "secured"])
        expect(g2p.predict(word)).toContain("jʊɹ");
      for (const word of ["manure", "manures", "inure", "inured", "allure", "alluring"])
        expect(g2p.predict(word)).toContain("ʊɹ");
    });

    test("an initial open e leaves the closed verb root stressed after eviction", () => {
      for (const word of ["eject", "ejects", "ejected", "ejecting"])
        expect(g2p.predict(word)).toContain("ˈdʒɛkt");
      for (const word of ["evict", "evicts", "evicted", "evicting"])
        expect(g2p.predict(word)).toContain("ˈvɪkt");
      for (const word of ["event", "events", "eventful"])
        expect(g2p.predict(word)).toContain("ˈvɛnt");
    });

    test("open and unrelated roots keep initial stress", () => {
      for (const word of ["even", "evil", "edit", "edict", "epic", "echo", "egret"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
    });
  });

})();

// Original suite: en-weak-urr-ri.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

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

})();

// Original suite: en-webpage-reference.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge and Oxford both retain PAGE's /eɪ/ in WEB PAGE.
  // https://dictionary.cambridge.org/us/pronunciation/english/web-page
  // https://www.oxfordlearnersdictionaries.com/definition/english/web-page
  // This corrects a source entry; the compound rule already has the right reading.
  describe.each([false, true])("verified webpage source reading (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test("retains the complete page component", () => {
      expect(engine.predict("webpage")).toBe("ˈwɛbˌpeɪdʒ");
    });
    test.each([["webpages", "ˈwɛbˌpeɪdʒəz"], ["webpage's", "ˈwɛbˌpeɪdʒɪz"]])("retains the corrected compound through %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test("preserves every occurrence in complete prose", () => {

      const tokens = englishTokens(engine, "The webpage is useful. Another webpage is useful.");
      expect(tokens.filter(token => token.word === "webpage").map(token => token.phoneme)).toEqual(["ˈwɛbˌpeɪdʒ", "ˈwɛbˌpeɪdʒ"]);
      expect(tokens.filter(token => token.word === "useful").map(token => token.phoneme)).toEqual(["ˈjusfəɫ", "ˈjusfəɫ"]);
    });
  });

})();

// Original suite: en-weigh-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  describe.each([false, true])("English weigh rime (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["weigh", "ˈweɪ"], ["weight", "ˈweɪt"], ["weighty", "ˈweɪˌti"],
      ["weights", "ˈweɪts"], ["weighed", "ˈweɪd"], ["weighing", "ˈweɪɪŋ"],
      ["weightless", "ˈweɪtɫəs"], ["weightlessness", "ˈweɪtɫəsnəs"],
      ["weighable", "ˈweɪəbəɫ"],
    ])("retains phones and primary in %s", (word, ipa) => {
      expect(parseIpa(engine.predict(word)!)).toEqual(parseIpa(ipa));
    });
    it.each(["weighted", "weightier", "overweight", "underweight", "weightlifting"])("retains the owned root vowel in %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("weɪt");
    });
    it.each([
      ["Weiss", "ˈwaɪs"], ["Weil", "ˈwaɪɫ"], ["Weinberg", "ˈwaɪnbɝɡ"],
      ["height", "ˈhaɪt"],
    ])("preserves the neighboring spelling class in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves noun, adjective and verb sentence controls", () => {

      const tokens = englishTokens(engine, "The clever reader will weigh the load.");
      expect(tokens.find(t => t.word === "weigh")?.phoneme).toBe("weɪ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "load")?.phoneme).toBe("ɫoʊd");
    });
  });

  it("preserves the supplied default surname reading", () => {
    expect(new EnglishG2P().predict("Weightman")).toBe("ˈwaɪtmən");
  });

})();

// Original suite: en-what-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("wh+a before written -t", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("uses the STRUT vowel in the productive what root", () => {
      expect(rules.predict("what", "en-US")).toBe("ˈhwʌt");
      expect(rules.predict("whats", "en-US")).toBe("ˈhwʌts");
      expect(rules.predict("whatnot", "en-US")).toBe("ˈhwʌtˌnɑt");
      expect(rules.predict("whatever", "en-US")).toBe("ˌhwʌˈtɛvɝ");
      expect(rules.predict("whatsoever", "en-US")).toBe("ˌhwʌtsoʊˈɛvɝ");
    });

    it("preserves neighboring wh+a rimes", () => {
      expect(rules.predict("wham", "en-US")).toBe("ˈhwɑm");
      expect(rules.predict("whack", "en-US")).toBe("ˈhwæk");
      expect(rules.predict("whale", "en-US")).toBe("ˈhweɪɫ");
      expect(rules.predict("wharf", "en-US")).toBe("ˈhwɔɹf");
      expect(rules.predict("whatley", "en-US")).toBe("ˈhwɑtɫi");
    });
  });

})();

// Original suite: en-with-adjective-controls.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  test.each([
    ["Octavius intends to become more intimate with her and makes several advances, only to be rebuffed each time.", "intimate", "ˈɪntəmət"],
    ["The guests present with evidence departed.", "present", "ˈpɹɛzənt"],
    ["The guests present with evidence depart.", "present", "ˈpɹɛzənt"],
  ])("preserves the adjective reading in %s", (sentence, word, expected) => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
  });

  test("a closed with-complement identifies a plural subject's predicate", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const sentences = [
      ["The vapors combine with oxygen.", "combine", "kəmˈbaɪn"],
      ["In contrast, many common ions give insoluble salts, e.g. halides precipitate with silver, and sulphate precipitate with barium.", "precipitate", "pɹɪˈsɪpɪˌteɪt"],
    ];
    for (const [sentence, word, expected] of sentences) {
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
    }
  });

})();
