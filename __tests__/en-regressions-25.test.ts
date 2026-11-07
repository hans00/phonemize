// Original suite: en-ular-adverbs-and-ir-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("bound roots and weak ir (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const access = engine as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["irregular", "irregularly", "regularly", "particularly",
      "irrelevance", "irrepressible", "irrespective", "irresponsible", "irreverent"])
      delete access.dictionary[word];

    it.each([
      ["regularly", "ˈɹɛɡjəɫɝɫi"], ["particularly", "ˌpɑɹˈtɪkjəɫɝɫi"],
      ["irregular", "ˌɪˈɹɛɡjəɫɝ"], ["irregularly", "ˌɪˈɹɛɡjəɫɝɫi"],
    ])("preserves root phones and both stress marks in %s after eviction", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    // Collins US irreducible also starts with KIT; the rule owns that prefix only.
    // https://www.collinsdictionary.com/us/dictionary/english/irreducible
    it.each(["irrelevance", "irrepressible", "irrespective", "irresponsible", "irreverent", "irreducible"])(
      "retains KIT and one root onset in %s", word => {
        expect(engine.predict(word)).toMatch(/^ˌ?ɪ[ˈˌ]?ɹ/);
        expect(engine.predict(word)).not.toMatch(/^ˌ?ɝ/);
      },
    );
    it.each([
      ["singular", "ˈsɪŋɡjəɫɝ"], ["angular", "ˈæŋɡjəɫɝ"],
      ["triangular", disableDict ? "ˈtɹaɪæŋɡjəɫɝ" : "tɹaɪˈæŋɡjəɫɝ"],
      ["irrigation", "ˌɪɹəˈɡeɪʃən"],
      ["irritate", disableDict ? "ˈɪɹəˌteɪt" : "ˈɪɹɪˌteɪt"],
    ])("preserves the existing reading of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves caller-owned roots", () => {
      for (const root of ["regular", "particular"]) {
        const custom = new EnglishG2P({ disableDict });
        const data = custom as unknown as { dictionary: Record<string, string> };
        data.dictionary = { ...data.dictionary };
        delete data.dictionary[root + "ly"];
        custom.addPronunciation(root, "ˈɹoʊɡ");
        expect(custom.predict(root + "ly")).toBe("ˈɹoʊɡɫi");
      }
    });
    it("preserves noun, adjective and finite verb readings in a sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will work irregularly.");
      for (const [word, ipa] of [["irregularly", "ˌɪˈɹɛɡjəɫɝɫi"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-ulative-stress-and-linker.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])(
    "keeps the ulative root beat and weak linker after eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const word of [
        "cumulative",
        "speculative",
        "cumulatively",
        "speculatively",
      ])
        delete d[word];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["cumulative", "ˈkjumjəɫətɪv"],
        ["cumulatively", "ˈkjumjəɫətɪvɫi"],
        ["noncumulative", "nɑnˈkjumjəɫətɪv"],
        ["speculative", "ˈspɛkjəɫətɪv"],
        ["speculatively", "ˈspɛkjəɫətɪvɫi"],
        ["nonspeculative", "nɑnˈspɛkjəɫətɪv"],
      ])
        expect(e.predict(word)).toBe(ipa);
      expect(e.predict("alternative")).toBe("ɔɫˈtɝnətɪv");
      expect(e.predict("combative")?.replace(/ˌ/g, "")).toMatch(/ˈbætɪv$/);
      expect(e.predict("cumulus")).toBe("ˈkjumjəɫəs");
      expect(e.predict("speculate")?.replace(/ˌ/g, "")).toBe("ˈspɛkjəɫeɪt");
      expect(e.predict("speculator")?.replace(/ˌ/g, "")).toBe("ˈspɛkjəɫeɪtɝ");
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("The cumulative score supports a speculative model.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "cumulative")?.phoneme,
      ).toBe("ˈkjumjəɫətɪv");
    },
  );
  test("preserves supplied adjective roots and targets", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("cumulative", "ˈzɛmp");
    expect(e.predict("cumulatively")).toBe("ˈzɛmpɫi");
    expect(e.predict("noncumulative")).toBe("nɑnˈzɛmp");
    e.addPronunciation("cumulatively", "ˈkɛmp");
    expect(e.predict("cumulatively")).toBe("ˈkɛmp");
  });
  test.each([
    ["The present moment matters.", "present", "ˈpɹɛzənt"],
    ["They present the award.", "present", "pɹɪˈzɛnt"],
    ["The record was clear.", "record", "ˈɹɛkɝd"],
  ])(
    "preserves paired adjective, verb and noun controls: %s",
    (sentence, word, ipa) => {
      const api = createPhonemizer({ processors: [new EnglishG2P()] });
      expect(
        api
          .phonemize(sentence, { language: "en-US", returnArray: true })
          .find((t) => t.word === word)?.phoneme,
      ).toBe(ipa);
    },
  );

})();

// Original suite: en-ule-ular-morphology.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("-ule stems in monosyllabic -ular formations, rules=%s", disableDict => {
    const engine = () => new EnglishG2P({ disableDict });

    it.each([
      ["modular", "ˈmɑdʒəɫɝ"],
      ["nodular", "ˈnɑdʒəɫɝ"],
      ["titular", "ˈtɪtʃəɫɝ"],
      ["tubular", "ˈtubjəɫɝ"],
    ])("composes %s from its -ule stem", (word, ipa) => {
      expect(engine().predict(word)).toBe(ipa);
    });

    it("keeps lexical bases and longer -ular controls on their established readings", () => {
      const g2p = engine();
      expect(g2p.predict("module")).toBe("ˈmɑdʒuɫ");
      expect(g2p.predict("nodule")).toBe("ˈnɑdʒuɫ");
      expect(g2p.predict("tubule")).toBe("ˈtubjuɫ");
      expect(g2p.predict("molecular")).toBe("məˈɫɛkjəɫɝ");
      expect(g2p.predict("cellular")).toBe("ˈsɛɫjəɫɝ");
      if (disableDict) {
        expect(g2p.predict("consular")).toBe("ˈkɑnzjəɫɝ");
        expect(g2p.predict("insular")).toBe("ɪnˈsuɫɝ");
        expect(g2p.predict("jugular")).toBe("ˈdʒʌɡjəɫɝ");
      } else {
        expect(g2p.predict("consular")).toBe("ˈkɑnsəɫɝ");
        expect(g2p.predict("jugular")).toBe("ˈdʒuɡjəɫɝ");
      }
      expect(g2p.predict("regular")).toBe(disableDict ? "ˈɹɛɡjəɫɝ" : "ˈɹeɪɡjəɫɝ");
      expect(g2p.predict("triangular")).toBe(disableDict ? "ˈtɹaɪæŋɡjəɫɝ" : "tɹaɪˈæŋɡjəɫɝ");
    });

    it("keeps derived readings through a complete sentence", () => {
      const api = createPhonemizer({ processors: [engine()] });
      const tokens = api.phonemize("The modular device has a tubular and nodular design.", {
        language: "en-US",
        returnArray: true,
      });
      expect(tokens.filter(token => ["modular", "tubular", "nodular"].includes(token.word))
        .map(token => [token.word, token.phoneme])).toEqual([
          ["modular", "ˈmɑdʒəɫɝ"],
          ["tubular", "ˈtubjəɫɝ"],
          ["nodular", "ˈnɑdʒəɫɝ"],
        ]);
      expect(tokens.find(token => token.word === "device")?.phoneme).toBe("dɪˈvaɪs");
    });
  });

})();

// Original suite: en-un-adjective-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Un- preserves productive adjective roots (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });

    it("retains the necessary root and its stress", () => {
      expect(engine.predict("necessary")).toBe("ˈnɛsəˌsɛɹi");
      expect(engine.predict("unnecessary")).toBe("ənˈnɛsəˌsɛɹi");
    });

    it("preserves the derived adverb across root eviction", () => {
      expect(engine.predict("unnecessarily")).toBe("ənˈnɛsəˌsɛɹəɫi");
    });

    it.each(["unscientific", "unscientifically"])("preserves the complete sci root in %s", word => {
      expect(engine.predict(word)).toMatch(/saɪənˈtɪfɪk/);
    });

    it("preserves the adjective beyond the ary family", () => {
      expect(engine.predict("unwinnable")).toBe("ənˈwɪnəbəɫ");
      expect(engine.predict("undemocratic")).toMatch(/dɛməˈkɹætɪk$/);
    });

    it.each(["undulate", "undulated", "undulating"])("does not split the unrelated whole root %s", word => {
      expect(engine.predict(word)).toMatch(/^ˈʌnd[ʒj]/);
    });

    it.each([
      ["unnerve", "əˈnɝv"], ["unnerving", "əˈnɝvɪŋ"],
      ["unclassified", "ənˈkɫæsɪˌfaɪd"], ["undeniably", "ˌʌndɪˈnaɪəbɫi"],
    ])("retains the existing short/verb/adverb route in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it.each([
      ["Unnecessary work delays us.", "unnecessary", "ənˈnɛsəˌsɛɹi"],
      ["This work is unnecessary.", "unnecessary", "ənˈnɛsəˌsɛɹi"],
      ["He spoke unnecessarily.", "unnecessarily", "ənˈnɛsəˌsɛɹəɫi"],
      ["They unnerve me.", "unnerve", "əˈnɝv"],
      ["The undulating sea is calm.", "sea", "si"],
    ])("preserves noun/adjective/verb controls in %s", (sentence, word, ipa) => {
      const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word.toLowerCase() === word)!;
      expect(target.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-un-i-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // These controls own prefix boundaries, not every pre-existing stress/weak-vowel variant.
  describe.each([false, true])("un before an i-initial base (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each(["united", "unified", "unifying", "unionizing", "unionizable", "unitizing", "unifiable", "unilateral", "unicameral", "universal", "unilingual", "uniformed"])("retains the numerical or independently derived word %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^ju/);
    });
    test.each(["unimagined", "unimpeachable", "unimproved", "uninhabited", "uninspired", "uninsured", "unintended", "unidentified", "uninteresting", "unintelligible"])("keeps the negative prefix and base in %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^[ʌə]n/);
    });
    test("keeps an explicitly owned whole verb before regular inflection", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("unitate", "ˈjut");
      expect(owned.predict("unitated")).toBe("ˈjutɪd");
    });
    test("keeps the noun witness of an outer ify derivative", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("unity", "ˈzɛnəti");
      expect(owned.predict("unified")).toBe(owned.predict("unify") + "d");
    });
    test("lets an explicitly supplied i-initial base license an opaque suffix", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("ilingual", "ˈɪlɪŋɡwəl");
      expect(owned.predict("unilingual")?.replace(/[ˈˌ]/g, "")).toMatch(/^[ʌə]n/);
    });
    test("preserves noun, adjective and verb controls in a complete sentence", () => {

      const tokens = englishTokens(engine, "The unilingual speaker records an unintended event.");
      expect(tokens.find(token => token.word === "unilingual")?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(/^ju/);
      for (const [word, pos] of [["speaker", "N"], ["records", "V"], ["unintended", "ADJ"]])
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
    });
  });

  // A witnessed outer base owns productive suffixes before a negative un- parse.
  describe.each([false, true])("outer suffix ownership (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each(["unionable", "uniformable", "unionizeable"])("preserves the numerical prefix in %s", word => {
      expect(engine.predict(word)).toMatch(/^ˈju/);
    });
  });

})();

// Original suite: en-unal-root-controls.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("-al root controls (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    test("keeps the stress and weak vowel of independently pronounceable roots", () => {
      // Cambridge US shogun; shogun + -al is an attested derivation.
      expect(engine.predict("shogun", "en-US")).toBe("ˈʃoʊɡən");
      expect(engine.predict("shogunal", "en-US")).toBe("ˈʃoʊɡənəɫ");
      expect(engine.predict("faunal", "en-US")).toBe("ˈfɔnəɫ");
    });
  });

})();

// Original suite: en-univers-root-schwa.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("weak ni in the univers- root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["universe", "ˈjunəvɝs"],
      ["university", "ˌjunəˈvɝsəti"],
      ["universality", "ˌjunəvɝˈsæɫəti"],
    ])("centralizes the weak ni in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the same vowel in unrelated uni- words and preserves contextual forms", () => {
      expect(rules.predict("unilateral", "en-US")).toBe("ˌjunɪˈɫætɝəɫ");
      expect(rules.predict("unison", "en-US")).toBe("ˈjunɪsən");

      const tokens = englishTokens(rules, "The universe includes a university; its universality is debated.");
      expect(tokens.find(token => token.word === "universe")?.phoneme).toBe("ˈjunəvɝs");
      expect(tokens.find(token => token.word === "university")?.phoneme).toBe("ˌjunəˈvɝsəti");
      expect(tokens.find(token => token.word === "universality")?.phoneme).toBe("ˌjunəvɝˈsæɫəti");
    });
  });

})();

// Original suite: en-unmarked-subject.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("unmarked subject before infinitive (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const pos = (sentence: string, word: string) => {
      const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
      const index = words.findIndex(token => token.toLowerCase() === word.toLowerCase());
      return engine.tagWord(word, { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
    };
    test.each([
      "The men refuse to continue work until they are paid.",
      "The children refuse to leave the room.",
      "The fish refuse to accept food.",
      "The men refuse to be detained by police.",
    ])("recognizes the finite predicate in %s", sentence => {
      expect(pos(sentence, "refuse")).toBe("V");
      if (!disableDict) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ɹɪˈfjuz");
    });
    test.each([
      ["The shop produce to sell was fresh.", "produce"],
      ["The store produce to be sold was fresh.", "produce"],
      ["The defendant conduct to investigate surprised the jury.", "conduct"],
      ["The archive record to preserve remains intact.", "record"],
      ["The archive record to preserve during emergency remains intact.", "record"],
      ["The garden produce to sell, freshly harvested, tasted sweet.", "produce"],
      ["The government contract to purchase equipment expired.", "contract"],
      ["The factory produce to sell today rotted.", "produce"],
      ["The household refuse to recycle smelled.", "refuse"],
      ["The household refuse to recycle smells.", "refuse"],
      ["The Apostolic Delegate to Canada arrived.", "Delegate"],
    ])("preserves the nominal phrase in %s", (sentence, word) => {
      expect(pos(sentence, word)).not.toBe("V");
    });
  });

  test("explicit caller POS keeps the contrasting refuse readings", () => {
    const engine = new EnglishG2P();
    expect(engine.predict("refuse", "en-US", "N")).toBe("ˈɹɛfjus");
    expect(engine.predict("refuse", "en-US", "ADJ")).toBe("ˈɹɛfjus");
    expect(engine.predict("refuse", "en-US", "V")).toBe("ɹɪˈfjuz");
  });

})();

// Original suite: en-uth-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("monosyllabic -uth /u/ rime", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    const phonemizer = createPhonemizer({ processors: [g2p] });

    it.each([
      ["truth", "ˈtɹuθ"],
      ["Ruth", "ˈɹuθ"],
    ])("uses the long-U reading for %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["youth", "ˈjuθ"],
      ["sleuth", "ˈsɫuθ"],
      ["tooth", "ˈtuθ"],
      ["south", "ˈsaʊθ"],
      ["mouth", "ˈmaʊθ"],
      ["uncouth", "ənˈkaʊθ"],
      ["bismuth", "ˈbɪsməθ"],
      ["truthful", "ˈtɹuθfəɫ"],
      ["truths", "ˈtɹuθs"],
      ["ruths", "ˈɹuθs"],
      ["untruth", "ənˈtɹuθ"],
    ])("preserves the contrasting form %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps both readings intact in a sentence", () => {
      const tokens = phonemizer.phonemize("Ruth told the truth to the youth.", {
        language: "en-US",
        returnArray: true,
      });
      expect(tokens.find((token) => token.word === "Ruth")?.phoneme).toBe("ɹuθ");
      expect(tokens.find((token) => token.word === "truth")?.phoneme).toBe("tɹuθ");
      expect(tokens.find((token) => token.word === "youth")?.phoneme).toBe("juθ");
    });

    it("carries the long-U stem through possessive and name composition", () => {
      expect(g2p.predict("Ruth's", "en-US")).toBe("ˈɹuθs");
      expect(g2p.predict("Ruth-Ann", "en-US")).toBe("ɹuθˈæn");
    });
  });

})();

// Original suite: en-vehicle-front-vowel.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("stressed ve-hi in the vehicle family", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps the /i/ vowel in vehicle", () => {
      expect(rules.predict("vehicle", "en-US")).toBe("ˈvihɪkəɫ");
    });

    it.each([
      ["vehicles", "ˈvihɪkəɫz"],
      ["vehicle's", "ˈvihɪkəɫz"],
      ["vehicular", "vɪˈhɪkjəɫɝ"],
      ["even", "ˈivən"],
      ["evidence", "ˈɛvədəns"],
    ])("preserves the related form %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-velar-coda.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens, withoutDictionaryEntries } = __suiteModule1;

  describe.each([false, true])("final velar coda, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each(["length", "strength"])("bridges the final nasal-fricative in %s", word => {
      expect(engine.predict(word)).toMatch(/ŋkθ$/);
      expect(engine.predict(word + "s")).toMatch(/ŋkθs$/);
    });
    it("preserves medial and other nasal codas", () => {
      for (const word of ["lengthwise", "lengthways", "lengthy", "strengthen"])
        expect(engine.predict(word)).toMatch(/ŋθ/);
      expect(engine.predict("tenth")).toBe("ˈtɛnθ");
      expect(engine.predict("song")).toBe("ˈsɔŋ");
    });
    it("keeps caller root and direct child ownership", () => {
      const own = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(own, ["lengths"]);
      own.addPronunciation("length", "ˈzɛŋθ");
      expect(own.predict("length")).toBe("ˈzɛŋθ");
      expect(own.predict("lengths")).toBe("ˈzɛŋθs");
      own.addPronunciation("lengths", "ˈkɛŋ");
      expect(own.predict("lengths")).toBe("ˈkɛŋ");
    });
    it("retains noun/adjective and verb context", () => {

      const tokens = englishTokens(engine, "The lengthy report will strengthen their case with its length and strength.");
      expect(tokens.find(t => t.word === "length")?.phoneme).toMatch(/ŋkθ$/);
      expect(tokens.find(t => t.word === "strength")?.phoneme).toMatch(/ŋkθ$/);
      expect(tokens.find(t => t.word === "lengthy")?.phoneme).toMatch(/ŋθi$/);
      expect(tokens.find(t => t.word === "strengthen")?.phoneme).toMatch(/ŋθən$/);
    });
  });

})();

// Original suite: en-velop-inflection.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("regular inflections of -velop verbs", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["developed", "dɪˈvɛɫəpt"],
      ["developing", "dɪˈvɛɫəpɪŋ"],
      ["undeveloped", "ˌʌndɪˈvɛɫəpt"],
      ["enveloped", "ɪnˈvɛɫəpt"],
      ["enveloping", "ɪnˈvɛɫəpɪŋ"],
    ])("preserves the verb stem vowel in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("uses the corrected developed forms in the shipped pipeline", () => {
      const shipped = new EnglishG2P();
      expect(shipped.predict("developed", "en-US")).toBe("dɪˈvɛɫəpt");
      expect(shipped.predict("developing", "en-US")).toBe("dɪˈvɛɫəpɪŋ");
    });

    it.each([
      ["envelope", "ˈɛnvəˌɫoʊp"],
      ["development", "dɪˈvɛɫəpmənt"],
      ["hoped", "ˈhoʊpt"],
      ["hopping", "ˈhɑpɪŋ"],
    ])("preserves neighboring spelling and suffix classes in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-verb-form-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("Verb form stays independent of POS", () => {
    const engine = new EnglishG2P();
    const phonemizer = createPhonemizer({ processors: [engine] });
    const readings = (sentence: string) => phonemizer.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).filter(token => token.word.toLowerCase() === "read").map(token => token.phoneme);

    it.each([
      ["I read that book yesterday.", "ɹɛd"],
      ["He read the book.", "ɹɛd"],
      ["I have just read the book.", "ɹɛd"],
      ["I've read the book.", "ɹɛd"],
      ["The book was read aloud.", "ɹɛd"],
      ["I read that book last week.", "ɹɛd"],
      ["I read books every day.", "ɹid"],
      ["Did he read yesterday?", "ɹid"],
      ["He did not read yesterday.", "ɹid"],
      ["He could still read.", "ɹid"],
      ["He could barely read.", "ɹid"],
      ["The drives are read-only.", "ɹid"],
      ["I will read yesterday's notes.", "ɹid"],
      ["I read about yesterday.", "ɹid"],
      ["I recommend that he read the book.", "ɹid"],
      ["I recommend he read the book.", "ɹid"],
      ["Yesterday ended. I read books every day.", "ɹid"],
      ["Yesterday。I read books every day.", "ɹid"],
    ])("selects the form in %s", (sentence, ipa) => {
      expect(readings(sentence)).toEqual([ipa]);
    });

    it("uses the live verb vowel in past and participle sentence contexts", () => {
      const lived = (sentence: string) => phonemizer.phonemize(sentence, {
        language: "en-US", returnArray: true,
      }).filter(token => token.word.toLowerCase() === "lived").map(token => token.phoneme);
      const live = (sentence: string) => phonemizer.phonemize(sentence, {
        language: "en-US", returnArray: true,
      }).filter(token => token.word.toLowerCase() === "live").map(token => token.phoneme);
      expect(live("I live there.")).toEqual(["ɫɪv"]);
      expect(live("This is a live show.")).toEqual(["ɫaɪv"]);
      expect(lived("I lived there.")).toEqual(["ɫɪvd"]);
      expect(lived("They have lived here.")).toEqual(["ɫɪvd"]);
      expect(lived("The long-lived tortoise survived.")).toEqual(["ɫaɪvd"]);
    });

    it("preserves the separate adjective reading without a verbal context", () => {
      expect(engine.predict("lived", "en-US")).toBe("ˈɫaɪvd");
      expect(engine.predictWithContext("lived", { words: ["lived"], index: 0 }, "en-US", "ADJ"))
        .toBe("ɫaɪvd");
    });

    it("preserves duplicate occurrences and sentence boundaries", () => {
      expect(readings("I read books daily. He read yesterday.")).toEqual(["ɹid", "ɹɛd"]);
      expect(readings("He will read today, but I read yesterday.")).toEqual(["ɹid", "ɹɛd"]);
      expect(readings("He read yesterday。I read books every day.")).toEqual(["ɹɛd", "ɹid"]);
    });

    it("a known-POS override cannot erase inferred tense", () => {
      const engine = new EnglishG2P();
      const original = engine.tagWord.bind(engine);
      engine.tagWord = (word, context) => word.toLowerCase() === "read"
        ? { pos: "V", confidence: 1 } : original(word, context);
      const phonemizer = createPhonemizer({ processors: [engine] });
      expect(phonemizer.toIPA("I read that book yesterday.", "en-US")).toContain("ɹɛd");
    });

    it("retains an explicit custom pronunciation over contextual selection", () => {
      const engine = new EnglishG2P();
      engine.addPronunciation("read", "R AY1 D");
      const phonemizer = createPhonemizer({ processors: [engine] });
      expect(phonemizer.toIPA("I read it yesterday.", "en-US")).toContain("ɹaɪd");
    });

    it("does not apply context aligned to another token", () => {
      const engine = new EnglishG2P();
      expect(engine.predictWithContext("read", { words: ["Yesterday", "I", "read"], index: 1 }, "en-US", "V"))
        .toBe(engine.predict("read", "en-US", "V"));
    });

    it("does not add a whole-target homograph lookup to the rules path", () => {
      const engine = new EnglishG2P({ disableDict: true });
      const phonemizer = createPhonemizer({ processors: [engine] });
      const token = phonemizer.phonemize("I read books daily.", { language: "en-US", returnArray: true })
        .find(token => token.word === "read")!;
      expect(token.phoneme).toBe(engine.predict("read", "en-US", "V"));
    });

    it("leaves legacy processors on their three-argument API", () => {
      const predict = jest.fn((_word: string, _language?: string, _pos?: string) => "x");
      const phonemizer = createPhonemizer({ processors: [{
        id: "legacy", name: "Legacy", supportedLanguages: ["en"], predict,
        addPronunciation() {},
      }] });
      phonemizer.toIPA("hello world", "en");
      expect(predict).toHaveBeenCalledTimes(2);
      expect(predict.mock.calls.every(call => call.length === 3)).toBe(true);
    });
  });

})();

// Original suite: en-vocalic-gh-plural.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  function cold(disableDict: boolean) {
    const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["high", "sigh", "weigh", "sleigh"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary); return engine;
  }
  describe.each([false, true])("silent GH plural coda after root eviction, rules=%s", disableDict => {
    test("IGH/EIGH roots compose the regular vowel-final plural", () => {
      const engine = cold(disableDict);
      for (const [word, ipa] of [["highs", "ˈhaɪz"], ["sighs", "ˈsaɪz"], ["weighs", "ˈweɪz"], ["sleighs", "ˈsɫeɪz"], ["zighs", "ˈzaɪz"]]) {
        expect(engine.predict(word)).toBe(ipa); expect(engine.predict(word.toUpperCase())).toBe(ipa);
      }
      // Existing caller-owned roots retain their real coda and vowel.
      engine.addPronunciation("high", "ˈtɛst"); expect(engine.predict("highs")).toBe("ˈtɛsts");
      engine.addPronunciation("leigh", "ˈli"); expect(engine.predict("leighs")).toBe("ˈɫiz");
    });
    test("voiceless consonant and supplied lexical-root controls remain distinct", () => {
      const engine = cold(disableDict);
      for (const word of ["coughs", "laughs"]) expect(engine.predict(word)).toMatch(/fs$/);
      for (const word of ["rights", "lights"]) expect(engine.predict(word)).toMatch(/ts$/);
      for (const word of ["ice", "nice", "price"]) expect(engine.predict(word)).toMatch(/s$/);
      expect(engine.predict("thighs")).toBe("ˈθaɪz");
    });
    test("noun, adjective and finite-verb sentences retain the root vowel and plural coda", () => {
      const api = createPhonemizer({ processors: [cold(disableDict)] });
      const out = api.phonemize("He sighs at the highs. She weighs the sleighs. The high shelf holds bright lights.", { language: "en-US", returnArray: true });
      for (const token of out.filter(t => /^(sighs|highs|weighs|sleighs)$/.test(t.word))) expect(token.phoneme).toMatch(/(?:aɪ|eɪ)z$/);
      expect(out.find(t => t.word === "high")?.phoneme).toMatch(/haɪ/);
      expect(out.find(t => t.word === "lights")?.phoneme).toMatch(/ts$/);
    });
  });

})();

// Original suite: en-vocalic-log-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  function cold(disableDict: boolean) {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const key of Object.keys(dictionary)) if (/log/.test(key)) delete dictionary[key];
   Reflect.set(e, "dictionary", dictionary); return e;
  }
  test.each([false, true])("vocalic log/logue retains its unmerged vowel after root eviction (rules=%s)", rules => {
   const e = cold(rules);
   for (const word of ["log", "logs", "logged", "logging", "catalog", "catalogs", "catalogue", "catalogued", "cataloguing", "dialog", "dialogue", "dialogues", "analogue", "analog", "monologue", "xenologue", "zalogged"]) expect(e.predict(word)).toMatch(/[lɫ]ɔɡ/);
   for (const word of ["clog", "slog", "blog"]) expect(e.predict(word)).toMatch(/[lɫ]ɑɡ/);
   expect(e.predict("logical")).toMatch(/[lɫ]ɑdʒ/);
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["They catalog a logical dialogue.", "They log catalogues.", "The analog signal is clear."]) {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    for (const token of out.filter(t => /^(catalog|dialogue|log|catalogues|analog)$/.test(t.word))) expect(token.phoneme).toMatch(/[lɫ]ɔɡ/);
    for (const token of out.filter(t => t.word === "logical")) expect(token.phoneme).toMatch(/[lɫ]ɑdʒ/);
   }
  });
  test.each([false, true])("caller roots own -ue inflections and doubled consonant recovery (rules=%s)", rules => {
   const e = cold(rules); e.addPronunciation("catalogue", "ˈtɛst");
   expect(e.predict("catalogued")).toBe("ˈtɛstɪd"); expect(e.predict("cataloguing")).toBe("ˈtɛstɪŋ");
   e.addPronunciation("log", "ˈtɛst");
   expect(e.predict("logs")).toBe("ˈtɛsts"); expect(e.predict("logged")).toBe("ˈtɛstɪd"); expect(e.predict("logging")).toBe("ˈtɛstɪŋ");
  });

  test.each(["prologue", "tagalog"])("rebuilt default pipeline preserves the previous reading of %s", word => {
   const e = new EnglishG2P(); expect(e.predict(word)).toMatch(/[lɫ]ɑɡ$/);
  });

})();

// Original suite: en-vouched-a-ese-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // MW Chinese and Maltese confirm the root vowels and suffix primary stress.
  describe.each([false, true])("vouched weak-a demonyms, rules=%s", disableDict => {
    it("retains the last stressed root foot after target eviction", () => {
      for (const [word, base, ipa, root] of [
        ["chinese", "china", "tʃaɪˈniz", "ˈtʃaɪnə"],
        ["maltese", "malta", "mɔɫˈtiz", "ˈmɔɫtə"],
      ]) {
        const engine = new EnglishG2P({ disableDict });
        const dictionary = { ...Reflect.get(engine, "dictionary") };
        delete dictionary[word];
        Reflect.set(engine, "dictionary", dictionary);
        engine.addPronunciation(base, root);
        expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
      }
    });
    it("composes an OOV family and respects complete target overrides", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("xempa", "ˈzɛmpə");
      expect(engine.predict("xempese")).toBe("ˌzɛmˈpiz");
      engine.addPronunciation("xempese", "ˈkɛŋ");
      expect(engine.predict("xempese")).toBe("ˈkɛŋ");
    });
    it("keeps posttonic full vowels on the existing whole-word path", () => {
      const engine = new EnglishG2P({ disableDict });
      const before = engine.predict("xempese");
      engine.addPronunciation("xempa", "ˈzɛnoʊmə");
      expect(engine.predict("xempese")).toBe(before);
      engine.addPronunciation("xempa", "zəˈzɛmpə");
      expect(engine.predict("xempese")).toBe(before);
      expect(engine.predict("veronese")).toBe("ˌvɛɹəˈniz");
      expect(engine.predict("cheese")).toBe("ˈtʃiz");
      expect(engine.predict("these")).toBe("ˈðiz");
    });
    it("preserves noun, adjective and verb sentence readings", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ["They speak Chinese.", "Chinese", "tʃaɪˈniz"],
        ["The Chinese teacher is here.", "Chinese", "tʃaɪˈniz"],
        ["They play the game.", "play", "pɫeɪ"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
    });
  });

})();

// Original suite: en-vouched-ind-agents.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("vouched ind agents, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([["minder", "ˈmaɪndɝ"], ["winder", "ˈwaɪndɝ"]])("retains the vouched root in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
      expect(engine.predict(word + "s")?.replace(/ˌ/g, "")).toBe(ipa + "z");
    });
    it.each([["cinder", "ˈsɪndɝ"], ["hinder", "ˈhɪndɝ"], ["tinder", "ˈtɪndɝ"],
      ["heather", "ˈhɛðɝ"], ["breather", "ˈbɹiðɝ"], ["bather", "ˈbæðɝ"]])("preserves the complete word %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains an independently vouched root after lexical eviction in noun context", () => {
      const evicted = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(evicted, ["blind"]);
      const api = createPhonemizer({ processors: [evicted] });
      const tokens = api.phonemize("Early timber venetian blinds provide shade.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "blinds")?.phoneme).toBe("bɫaɪndz");
    });
    it("preserves caller-owned OOV roots and whole targets", () => {
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("zind", "ˈzɛŋ");
      expect(own.predict("zinder")).toBe("ˈzɛŋɝ");
      own.addPronunciation("zinder", "ˈkɛŋ");
      expect(own.predict("zinder")).toBe("ˈkɛŋ");
    });
    it("preserves noun, adjective and verb neighbours in full sentences", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The kind minder will hinder the winder.", { language: "en-US", returnArray: true });
      expect(tokens.filter(t => ["kind", "minder", "hinder", "winder"].includes(t.word)).map(t => t.phoneme))
        .toEqual(["kaɪnd", "ˈmaɪndɝ", "ˈhɪndɝ", "ˈwaɪndɝ"]);
    });
  });

})();

// Original suite: en-vouched-ish-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("vouched ish roots, rules=%s", disableDict => {
    it("retains complete roots and the suffix vowel after target eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["bluish", "boorish", "dovish", "feverish", "ghoulish", "moorish", "yellowish"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [
        ["bluish", "ˈbɫuɪʃ"], ["boorish", "ˈbʊɹɪʃ"], ["dovish", "ˈdʌvɪʃ"],
        ["feverish", "ˈfivɝɪʃ"], ["ghoulish", "ˈɡuɫɪʃ"], ["moorish", "ˈmʊɹɪʃ"], ["yellowish", "ˈjɛɫoʊɪʃ"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps lexicalized verbs and existing silent-e derivations", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["cherish", "ˈtʃɛɹɪʃ"], ["perish", "ˈpɛɹɪʃ"], ["refinish", "ɹiˈfɪnɪʃ"], ["finish", "ˈfɪnɪʃ"],
        ["banish", "ˈbænɪʃ"], ["fetish", "ˈfɛtɪʃ"], ["racist", "ˈɹeɪsɪst"], ["racism", "ˈɹeɪsɪzəm"],
        ["nudist", "ˈnudɪst"], ["nudism", "ˈnudɪzəm"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps caller root phones without front-suffix c/g softening", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [root, ipa] of [["civic", "ˈzɛk"], ["smog", "ˈzɛɡ"]]) {
        engine.addPronunciation(root, ipa);
        expect(engine.predict(root + "ish")).toBe(ipa + "ɪʃ");
      }
      withoutDictionaryEntries(engine, ["bluish"]);
      engine.addPronunciation("blue", "ˈzɛŋ");
      expect(engine.predict("bluish")).toBe("ˈzɛŋɪʃ");
      engine.addPronunciation("bluish", "ˈkɛŋ");
      expect(engine.predict("bluish")).toBe("ˈkɛŋ");
    });
    it("preserves noun, adjective and verb readings in full sentences", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ...(!disableDict ? [["The dove is here.", "dove", "dʌv"], ["They dove into the water.", "dove", "doʊv"]] : []),
        ["The fish is here.", "fish", "fɪʃ"], ["The dovish reader is here.", "dovish", "ˈdʌvɪʃ"],
        ["They cherish the child.", "cherish", "ˈtʃɛɹɪʃ"], ["They finish the task.", "finish", "ˈfɪnɪʃ"],
        ["The feverish reader read yesterday.", "read", "ɹɛd"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-vouched-ng-grades.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("vouched ng grades, rules=%s", disableDict => {
    it("uses the independently attested opposite grade after target eviction", () => {
      for (const [word, ipa, witness, witnessIpa] of [
        ["younger", "ˈjʌŋɡɝ", "youngest", "ˈjʌŋɡəst"],
        ["youngest", "ˈjʌŋɡəst", "younger", "ˈjʌŋɡɝ"],
        ["longer", "ˈɫɔŋɡɝ", "longest", "ˈɫɔŋɡəst"],
        ["longest", "ˈɫɔŋɡəst", "longer", "ˈɫɔŋɡɝ"],
        ["stronger", "ˈstɹɔŋɡɝ", "strongest", "ˈstɹɔŋɡəst"],
        ["strongest", "ˈstɹɔŋɡəst", "stronger", "ˈstɹɔŋɝ"],
      ]) {
        const engine = new EnglishG2P({ disableDict });
        const dictionary = { ...Reflect.get(engine, "dictionary") };
        delete dictionary[word];
        Reflect.set(engine, "dictionary", dictionary);
        engine.addPronunciation(witness, witnessIpa);
        expect(engine.predict(word)).toBe(ipa);
      }
    });
    it("preserves caller root phones and complete target overrides", () => {
      for (const [word, ending] of [["younger", "ɝ"], ["youngest", "əst"]]) {
        const engine = new EnglishG2P({ disableDict });
        const dictionary = { ...Reflect.get(engine, "dictionary") };
        delete dictionary[word];
        Reflect.set(engine, "dictionary", dictionary);
        engine.addPronunciation(word === "younger" ? "youngest" : "younger", word === "younger" ? "ˈjʌŋɡəst" : "ˈjʌŋɡɝ");
        engine.addPronunciation("young", "ˈzɛt");
        expect(engine.predict(word)).toBe("ˈzɛt" + ending);
        engine.addPronunciation(word, "ˈkɛŋ");
        expect(engine.predict(word)).toBe("ˈkɛŋ");
      }
    });
    it("keeps agent nouns and bound nge spellings out of the grade class", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("singer")).toBe("ˈsɪŋɝ");
      for (const word of ["congest", "ingest", "strangest"]) expect(engine.predict(word)).toContain("dʒ");
    });
    it("keeps noun, adjective and finite verb sentence controls", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [["The younger reader is here.", "younger", "ˈjʌŋɡɝ"], ["The youngest reader is here.", "youngest", "ˈjʌŋɡəst"], ["The singer reads the book.", "singer", "ˈsɪŋɝ"]])
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
      expect(api.phonemize("They congest the channel.", { language: "en-US", returnArray: true }).find(t => t.word === "congest")?.phoneme).toContain("dʒ");
    });
  });

})();

// Original suite: en-vouched-vowel-re.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;
  describe.each([false, true])("vouched closed vowel-initial roots after re, rules=%s", disableDict => {
    it("preserves complete roots through whole-word eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["react", "reaction", "reactive", "rearm", "readjust", "reenter"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [
        ["react", "ɹiˈækt"], ["reaction", "ɹiˈækʃən"], ["reactive", "ɹiˈæktɪv"],
        ["rearm", "ɹiˈɑɹm"], ["readjust", "ɹiəˈdʒʌst"], ["reenter", "ɹiˈɛntɝ"],
      ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
      for (const word of ["reacts", "reacted", "reacting", "reactivate", "reactivity"])
        expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^ɹiækt/);
      expect(engine.predict("reactivity")).toMatch(/ˈtɪv/);
    });
    it("retains nested negative-prefix roots after stem eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["reactive", "reactivity", "rearm", "unreactive", "nonreactive", "unreactiveness", "unreactivity", "unrearmable"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [
        ["unreactive", "ʌnɹiˈæktɪv"], ["nonreactive", "nɑnɹiˈæktɪv"],
        ["unreactiveness", "ʌnɹiˈæktɪvnəs"], ["unreactivity", "ʌnɹiækˈtɪvəti"],
        ["unrearmable", "ʌnɹiˈɑɹməbəɫ"],
      ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
      expect(engine.predict("rearm", "en-GB")?.replace(/ˌ/g, "")).toBe("ɹiˈɑːm");
      expect(engine.predict("reaction", "en-GB")?.replace(/ˌ/g, "")).toBe("ɹiˈækʃən");
    });
    it("keeps digraphs, ordinary ea roots and repeated-prefix controls", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["reach", "ˈɹitʃ"], ["reaches", "ˈɹitʃəz"], ["reeck", "ˈɹik"],
        ["really", "ˈɹiɫi"], ["realm", "ˈɹɛɫm"], ["reading", "ˈɹidɪŋ"],
        ["reason", "ˈɹizən"], ["reregister", "ɹiˈɹɛdʒɪstɝ"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves supplied prefix, root and complete-child readings", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["react","reaction"]);
      engine.addPronunciation("re", "ˈkɛŋ");
      engine.addPronunciation("act", "ˈzɛŋ");
      engine.addPronunciation("action", "ˈbɛŋ");
      expect(engine.predict("react")).toBe("ˌkɛŋˈzɛŋ");
      expect(engine.predict("reaction")).toBe("ˌkɛŋˈbɛŋ");
      engine.addPronunciation("react", "ˈdɛŋ");
      expect(engine.predict("react")).toBe("ˈdɛŋ");
    });
  });
  it("preserves noun/adjective/verb context controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const [sentence, word, ipa] of [
      ["They react to the news.", "react", "ɹiˈækt"],
      ["The reaction was quick.", "reaction", "ɹiˈækʃən"],
      ["The reactive material is safe.", "reactive", "ɹiˈæktɪv"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });

})();
