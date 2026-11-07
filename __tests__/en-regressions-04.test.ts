// Original suite: en-bounded-noun-phrase.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("bounded noun phrases (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    test.each([
      ["This swimming event uses medley swimming as a relay.", "uses"],
      ["The trading system uses low-voltage signals.", "uses"],
      ["This swimming event records medley swimming as a relay.", "records"],
    ])("recognizes the finite verb in %s", (sentence, word) => {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", "V"));
    });
  });

  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  test.each([
    ["The learning record was useful.", "record", "ˈɹɛkɝd"],
    ["Google wins record sales awards.", "record", "ˈɹɛkɝd"],
    ["The uses of data are clear.", "uses", "ˈjusəz"],
    ["The swimming event record was broken.", "record", "ˈɹɛkɝd"],
    ["The recording artist read that book yesterday.", "read", "ɹɛd"],
    ["They may read that book tomorrow.", "read", "ɹid"],
  ])("preserves the contrasting reading in %s", (sentence, word, ipa) => {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-ceipt-silent-p.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  // Cambridge: https://dictionary.cambridge.org/pronunciation/english/receipt
  // Only the ceipt rime owns silent p; other pt clusters retain both stops.
  test.each([false, true])("retains silent p through ceipt inflections (rules=%s)", disableDict => {
    const e = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(e, "dictionary") };
    for (const w of ["receipt", "receipts", "receipted", "receipting"]) delete dictionary[w];
    Reflect.set(e, "dictionary", dictionary);
    for (const [word, ending] of [["receipt", "sit"], ["receipts", "sits"], ["receipted", "sitɪd"], ["receipting", "sitɪŋ"]]) {
      expect(e.predict(word)).toMatch(new RegExp(ending + "$"));
      expect(e.predict(word)).not.toContain("p");
    }
    for (const w of ["captain", "script", "adept", "deceptive"]) expect(e.predict(w)).toContain("pt");
    for (const w of ["ceiling", "conceit", "deceit"]) expect(e.predict(w)).toContain("si");
    const api = createPhonemizer({ processors: [e] });
    for (const sentence of ["The receipt was short.", "They receipt the payment.", "The signed receipt arrived."]) {
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "receipt")?.phoneme).toMatch(/sit$/);
    }
  });
  test("keeps caller-owned stops", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("receipt", "ɹiˈsipt");
    expect(e.predict("receipt")).toBe("ɹiˈsipt");
    expect(e.predict("receipts")).toBe("ɹiˈsipts");
    expect(e.predict("receipted")).toBe("ɹiˈsiptɪd");
  });

})();

// Original suite: en-checked-o-and-final-ie.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("checked o and final ie (disableDict=%s)", (disableDict) => {
    const g = new EnglishG2P({ disableDict });
    const say = (word: string) => g.predict(word)!.replace(/[ˈˌ]/g, "");
    test("open o is checked before weak labial ert, non-rhotic ald and st+silent-e tails", () => {
      for (const word of ["robert", "donald", "ronald", "costume", "costumes", "costumed", "costuming", "costumer", "posture", "postures", "postured", "posturing"]) expect(say(word)).toMatch(/^[^ɑɔ]*[ɑɔ]/);
      for (const word of ["robert", "donald", "costume", "posture"]) for (const prefix of ["un", "non", "semi", "multi"])
        expect(say(prefix + word)).toMatch(/ɑ/);
      for (const word of ["covert", "overt", "postum", "poster", "noble"]) expect(say(word)).toMatch(/oʊ/);
      for (const word of ["torald", "thorald"]) expect(say(word)).toMatch(/ɔɹ/);
    });
    test("a single-sonorant oly root keeps its GOAT vowel through composition", () => {
      for (const word of ["holy", "holier", "holiest", "holiness", "holily", "moly", "unholy", "nonholy", "semiholy", "multiholy"]) expect(say(word)).toMatch(/oʊ/);
      for (const word of ["poly", "polymer", "holly", "molly"]) expect(say(word)).not.toMatch(/oʊ/);
    });
    test("open a before single-consonant ie keeps FACE, while checked and doubled roots stay lax", () => {
      for (const word of ["katie", "jamie", "gracie", "tracie", "davie"]) expect(say(word)).toMatch(/eɪ/);
      for (const word of ["katie", "jamie"]) for (const prefix of ["un", "non", "semi", "multi"])
        expect(say(prefix + word)).toMatch(/eɪ/);
      for (const word of ["jackie", "maggie", "hattie", "camel", "panel", "wagon", "rapid"]) expect(say(word)).not.toMatch(/eɪ/);
    });
  });

})();

// Original suite: en-checked-olid-and-weak-chard.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

  describe.each([false, true])("checked adjective and weak doubled-onset rimes (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const say = (word: string) => clean(g2p.predict(word)!);

    test("strong open o before weak -lid is checked, with a reduced final nucleus", () => {
      for (const word of ["solid", "stolid"])
        expect(say(word)).toMatch(/ɑɫəd$/);
      for (const word of ["polar", "solar"])
        expect(say(word)).toMatch(/oʊɫ/);
    });

    test("transparent suffixes and prefixes retain a rule-exact root after eviction", () => {
      for (const word of ["solids", "stolids", "solidly", "solider", "nonsolid", "semisolid", "multisolid"])
        expect(say(word)).toMatch(/s?tɑɫəd|sɑɫəd/);
      for (const word of ["richards", "richard's", "richarder", "nonrichard", "semirichard"])
        expect(say(word)).toMatch(/ɹɪtʃɝd/);
      expect(g2p.predict("semisolid")).toMatch(/[ˈˌ]sɑɫəd/);
    });

    test("weak English -chard retains its consonant and reduces its rhotic vowel", () => {
      for (const word of ["richard", "prichard", "blanchard", "echard"])
        expect(say(word)).toMatch(/tʃɝd$/);
      for (const word of ["diehard", "tryhard", "churchyard", "junkyard"])
        expect(say(word)).toMatch(/ɑɹd$/);
    });

    test("weak -ssia after a short u coalesces, preserving native inflection", () => {
      for (const word of ["russia", "prussia", "russian", "prussian"])
        expect(say(word)).toMatch(/[ʌə]ʃ[əɪ]/);
      for (const word of ["cassia", "quassia"])
        expect(say(word)).toMatch(/iə$/);
      expect(say("massive")).toMatch(/sɪv$/);
    });
  });

})();

// Original suite: en-checked-r-and-o.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("checked r and o (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("open o is checked in its consonant ending frame", () => {
      for (const word of ["model", "models", "modeled", "modeling", "modern", "novel", "novels", "gospel", "hostel", "hospital"])
        expect(g2p.predict(word)).toMatch(/[ɑɔ]/);
      for (const word of ["hotel", "motel", "poster", "posters", "host", "hostess"])
        expect(g2p.predict(word)).toContain("oʊ");
    });

    test("a prefixed word retains its checked root after eviction", () => {
      expect(g2p.predict("premodern")).toMatch(/m[ɑɔ]dɝn$/);
      for (const word of ["remodel", "remodeled", "remodeling"])
        expect(g2p.predict(word)).toContain("mɑd");
    });

    test("cover and shovel preserve STRUT through inflections", () => {
      for (const word of ["cover", "covered", "covering", "hover", "hovering", "shovel", "shoveled", "shoveling", "hovel"])
        expect(g2p.predict(word)).toMatch(/[ʌə]v/);
      for (const word of ["move", "movie", "prove", "groove"])
        expect(g2p.predict(word)).toContain("uv");
    });

    test("k/l+ost contrasts with the long h/p/m frame", () => {
      for (const word of ["cost", "costs", "costed", "costing", "coster", "lost"])
        expect(g2p.predict(word)).toMatch(/[ɑɔ]st/);
      for (const word of ["host", "post", "most", "ghost"])
        expect(g2p.predict(word)).toMatch(/oʊst/);
    });

    test("a complete ear rime stays intact in an agent noun", () => {
      for (const word of ["wearer", "bearer", "swearer"])
        expect(g2p.predict(word)).toMatch(/ɛɹɝ$/);
      for (const word of ["hearer", "fearer"])
        expect(g2p.predict(word)).toMatch(/[iɪ]ɹɝ$/);
    });

    test("initial stressed doubled r keeps its checked vowel", () => {
      expect(g2p.predict("mirror")).toMatch(/^ˈmɪɹ/);
      for (const word of ["terrace", "terrible", "territory"])
        expect(g2p.predict(word)).toMatch(/^ˈtɛɹ/);
      for (const word of ["hurry", "stirrup", "squirrel"])
        expect(g2p.predict(word)).toContain("ɝ");
      expect(g2p.predict("interracial")).toMatch(/ɪntɝˈɹ/);
      expect(g2p.predict("overrunning")).toMatch(/oʊvɝɹ/);
    });

    test("checked cor roots keep root stress and one coalesced r", () => {
      for (const word of ["correct", "corrected", "correcting", "correction", "corrective", "corrupt", "corruption"])
        expect(g2p.predict(word)).toMatch(/^kɝˈ[ɛʌə]/);
      expect(g2p.predict("correlate")).toMatch(/^ˈkɔɹ/);
    });

    test("a bound -ation root sees its complete -al frame", () => {
      expect(g2p.predict("national")).toMatch(/^ˈnæʃən/);
      expect(g2p.predict("rational")).toMatch(/^ˈɹæʃən/);
      expect(g2p.predict("stational")).toMatch(/^ˈsteɪʃən/);
      expect(g2p.predict("relational")).toMatch(/ˈɫeɪʃən/);
    });

    test("letter-spelled tokens cannot supply a suffix stem", () => {
      expect(g2p.predict("italy")).toMatch(/^ˈɪtə[lɫ]i$/);
      expect(g2p.predict("ITA")).toContain("aɪ");
      expect(g2p.predict("happily")).toMatch(/^ˈhæpə[lɫ]i$/);
      expect(g2p.predict("oddly")).toMatch(/[ɑɔ]d[lɫ]i$/);
    });
  });

  test("public API uses the corrected root nuclei", () => {
    expect(toIPA("model")).toContain("mɑ");
    expect(toIPA("modal")).toContain("moʊ");
    expect(toIPA("mirror")).toContain("mɪɹ");
    expect(toIPA("correct")).toMatch(/^kɝˈɛkt$/);
  });

})();

// Original suite: en-checked-rate-and-bile.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("checked rate and bile rimes (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("checked noun and adjective roots keep weak rate through neutral endings", () => {
      for (const word of ["accurate", "accurately", "corporate", "corporately", "doctorate", "doctorates", "temperate", "temperately", "obdurate"])
        expect(segments(word)).toMatch(/ɝət(?:s|ɫi)?$/);
    });

    test("a cluster onset and a bound prefix retain the verb's FACE", () => {
      for (const word of ["aspirate", "aspirated", "aspirating", "perforate", "perforated", "incorporate", "incorporated", "incorporating", "generate", "generated", "celebrate"])
        expect(segments(word)).toContain("eɪ");
      for (const word of ["restoration", "respiration", "declaration", "exploration"])
        expect(g2p.predict(word)).toMatch(/ˈeɪʃən$/);
    });

    test("negative prefixes preserve a rule-derived checked rate root", () => {
      for (const word of ["noncorporate", "nonaccurate", "nonobdurate", "nontemperate"])
        expect(segments(word)).toMatch(/ət$/);
    });

    test("open o and weak bile retain their nuclei across the plural boundary", () => {
      for (const word of ["mobile", "mobile's", "mobiles"])
        expect(segments(word)).toMatch(/moʊbəɫz?$/);
    });

    test("suffix stress keeps the full mobility root", () => {
      for (const word of ["mobility", "immobility"])
        expect(g2p.predict(word)).toMatch(/ˈbɪɫ/);

    });
  });

})();

// Original suite: en-checked-stian-rimes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("weak stian rimes, rules=%s", disableDict => {
    it("retains the root affricate after target eviction and through composition", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["christian", "christians", "unchristian", "nonchristian", "christianize"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      expect(engine.predict("christian")).toBe("ˈkɹɪstʃən");
      for (const word of ["christians", "unchristian", "nonchristian", "christianize"])
        expect(engine.predict(word)?.replace(/ˌ/g, "")).toMatch(/kɹɪstʃən/);
    });
    it("preserves u-root and stressed hiatus instead of merging them", () => {
      const engine = new EnglishG2P({ disableDict });
      // Only the suffix boundary is asserted; proper-name root vowels differ by route.
      for (const word of ["fustian", "proustian", ...(disableDict ? ["faustian"] : [])]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toMatch(/stiən$/);
      expect(engine.predict("christianna")).toBe("ˌkɹɪstiˈænə");
      for (const [word, ipa] of [["bastion", "ˈbæstʃən"], ["question", "ˈkwɛstʃən"], ["suggestion", "səˈdʒɛstʃən"]])
        expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps noun, adjective and verb controls in full sentences", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const sentence of ["The Christian reader is here.", "A Christian is here."])
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "Christian")?.phoneme).toBe("ˈkɹɪstʃən");
      expect(api.phonemize("They question the record.", { language: "en-US", returnArray: true }).find(t => t.word === "question")?.phoneme).toBe("ˈkwɛstʃən");
    });
  });

})();

// Original suite: en-checked-yl.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("checked final yl (disableDict=%s)", (disableDict) => {
    const g = new EnglishG2P({ disableDict });
    const plain = (word: string) => g.predict(word)!.replace(/[ˈˌ]/g, "");
    test("a second nucleus within a merged slot is weak", () => {
      for (const word of ["ethyl", "methyl", "beryl", "sibyl", "vinyl"])
        expect(plain(word)).toMatch(/ə[ɫl]$/);
      // Own only the weak ending: vinyl's independent PRICE gap stays open.
      for (const word of ["ethyls", "methyls", "beryls", "sibyls", "vinyls"])
        expect(plain(word)).toMatch(/ə[ɫl]z$/);
    });
    test("spelling guards preserve root KIT and genuine suffix reduction", () => {
      expect(plain("sibyl")).toMatch(/^sɪb/);
      expect(plain("gibble")).toMatch(/^dʒɪb/);

      for (const word of ["possible", "sensible", "eligible"])
        expect(plain(word)).toMatch(/ə[ɫl]$/);
      expect(plain("vantuyl")).not.toMatch(/əə/);
      expect(plain("style")).toMatch(/^staɪ/);
      for (const word of ["restyled", "deadwyler"]) expect(plain(word)).toMatch(/aɪ[ɫl]/);
    });
    test("geminate Cle roots keep their syllabic nucleus before plural s", () => {
      expect(plain("gibbles")).toMatch(/^dʒɪbə[ɫl]z$/);
      for (const word of ["cupples", "eccles", "ruggles", "bottles", "paddles", "riddles"])
        expect(plain(word)).toMatch(/ə[ɫl]z$/);
    });
    test("complete roots retain their weak tail in prefix and suffix composition", () => {
      for (const root of ["ethyl", "methyl", "sibyl", "vinyl"]) {
        for (const prefix of ["non", "semi", "multi"])
          expect(plain(prefix + root)).toMatch(/ə[ɫl]$/);
        for (const suffix of ["less", "ness"])
          expect(plain(root + suffix)).toMatch(/ə[ɫl]/);
      }
    });
  });

})();

// Original suite: en-chester-frame.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const predict = (word: string) => g.predict(word, "en")!;
    describe(`English -chester (${disableDict})`, () => {
      test("retains the affricate and root vowel through composition", () => {
        for (const root of ["rochester", "dorchester", "chichester", "winchester", "manchester"])
          for (const word of [root, root + "'s", root + "s", "non" + root])
            expect(predict(word)).toMatch(/tʃɛstɝ/);
      });
      test("retains velar Greek och and ordinary ger roots", () => {
        expect(predict("orchestra")).toMatch(/k/);
        expect(predict("hamburger")).toMatch(/bɝɡɝ$/);
        expect(predict("tiger")).toMatch(/taɪɡɝ$/);
      });
    });
  }

})();

// Original suite: en-choir-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the choir- spelling root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["choir", "ˈkwaɪɝ"],
      ["choirs", "ˈkwaɪɝz"],
      ["choirboy", "ˈkwaɪɝbɔɪ"],
      ["choirmaster", "ˈkwaɪɝmæstɝ"],
    ])("uses the /kwaɪr/ root in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("preserves neighboring ch readings", () => {
      expect(rules.predict("chair", "en-US")).toBe("ˈtʃɛɹ");
      expect(rules.predict("choice", "en-US")).toBe("ˈtʃɔɪs");
      expect(rules.predict("chord", "en-US")).toBe("ˈkɔɹd");
    });
  });

})();

// Original suite: en-chol-combining-form.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const engine = new EnglishG2P({ disableDict: true });
  it.each(["cholera", "choleric", "cholesterol", "cholestyramine", "choline", "cholic", "cholane", "cholecystectomy", "cholelithic"])("uses the Greek combining-form onset in %s", (word) => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^k/);
  });
  it.each(["cholet", "cholewa", "cholla", "chore", "chortle", "chocolate"])("preserves the unrelated affricate in %s", (word) => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^tʃ/);
  });

})();

// Original suite: en-ci-ate-reduction.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("weak ci in Latinate derivations (rules=%s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["anticipate", "ænˈtɪsəˌpeɪt"], ["decimate", "ˈdɛsəˌmeɪt"],
      ["oscillate", "ˈɑsəˌɫeɪt"], ["oscillator", "ˈɑsəˌɫeɪtɝ"],
      ["participate", "pɑɹˈtɪsəˌpeɪt"], ["vacillate", "ˈvæsəˌɫeɪt"],
    ])("reduces the unaccented ci of %s", (word, expected) => {
      expect(engine.predict(word)).toBe(expected);
    });
    it.each(["anticipates", "anticipated", "anticipating", "anticipation", "decimating", "oscillated", "oscillation", "participating", "participation", "vacillates"])("retains the weak root in %s", (word) => {
      expect(engine.predict(word)).toMatch(/sə/);
    });
    it.each([
      ["anticipater", "ænˈtɪsəˌpeɪtɝ"], ["anticipatable", "ænˈtɪsəˌpeɪtəbəɫ"],
      ["decimater", "ˈdɛsəˌmeɪtɝ"], ["decimatable", "ˈdɛsəˌmeɪtəbəɫ"],
      ["oscillater", "ˈɑsəˌɫeɪtɝ"], ["oscillatable", "ˈɑsəˌɫeɪtəbəɫ"],
      ["participater", "pɑɹˈtɪsəˌpeɪtɝ"], ["participatable", "pɑɹˈtɪsəˌpeɪtəbəɫ"],
      ["vacillater", "ˈvæsəˌɫeɪtɝ"], ["vacillatable", "ˈvæsəˌɫeɪtəbəɫ"],
    ])("preserves the composed root after lexical eviction in %s", (word, expected) => {
      expect(engine.predict(word)).toBe(expected);
    });
    it.each([["tacit", "ˈtæsɪt"], ["fanciful", "ˈfænsɪfəɫ"]])("preserves the neighboring full KIT of %s", (word, expected) => {
      expect(engine.predict(word)).toBe(expected);
    });
    it("preserves the noun and adjective beside the target verb", () => {

      const tokens = englishTokens(engine, "They anticipate a fanciful plan.");
      expect(tokens.find((token) => token.word === "anticipate")?.phoneme).toMatch(/sə/);
      expect(tokens.find((token) => token.word === "fanciful")?.phoneme).toBe("ˈfænsɪfəɫ");
      expect(tokens.find((token) => token.word === "plan")?.phoneme).toMatch(/pɫæn$/);
    });
  });
  it("preserves the earlier cid possessive control on the rule path", () => {
    expect(new EnglishG2P({ disableDict: true }).predict("placid's")).toBe("ˈpɫæsɪdz");
  });

})();

// Original suite: en-cialty-derivation.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("-cialty derivation", () => {
    const g2p = new EnglishG2P({ disableDict: true });

    it.each([
      ["specialty", "ˈspɛʃəɫti"],
      ["specialties", "ˈspɛʃəɫtiz"],
    ])("carries the -cial stem into %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["special", "ˈspɛʃəɫ"],
      ["specially", "ˈspɛʃəɫi"],
      ["spatial", "ˈspeɪʃəɫ"],
      ["racial", "ˈɹeɪʃəɫ"],
      ["official", "əˈfɪʃəɫ"],
    ])("preserves the neighboring -cial reading of %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-climb-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("climb root and inflections", () => {
    it.each([false, true])("preserves the long-I root across forms (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      for (const word of ["climb", "climbs", "climbed", "climbing", "climber"]) {
        expect(engine.predict(word, "en-US")).toContain("aɪm");
      }
      expect(engine.predict("limb", "en-US")).toBe("ˈɫɪm");
      expect(engine.predict("bomb", "en-US")).toBe("ˈbɑm");

      const tokens = englishTokens(engine, "They climbed the hill while the climber followed.");
      expect(tokens.find(token => token.word === "climbed")?.phoneme).toBe("kɫaɪmd");
      expect(tokens.find(token => token.word === "climber")?.phoneme).toBe("ˈkɫaɪmɝ");
    });
  });

})();

// Original suite: en-clipped-ing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test.each([false, true])("written in-apostrophe restores the ing base, rules=%s", disableDict => {
   const e = new EnglishG2P({ disableDict });
   for(const [clipped, ipa] of [["workin'", "ˈwɝkɪn"], ["runnin'", "ˈɹʌnɪn"], ["dancin'", "ˈdænsɪn"], ["rockin'", "ˈɹɑkɪn"], ["singin'", "ˈsɪŋɪn"], ["somethin'", "ˈsʌmθɪn"], ["nothin'", "ˈnʌθɪn"]]) {
    expect(e.predict(clipped)).toBe(ipa);
    expect(e.predict(clipped.replace("'", "’"))).toBe(ipa);
   }
   expect(e.predict("king'")).toBe(e.predict("king"));
   expect(e.predict("cousins'")).toBe(e.predict("cousins"));
   e.addPronunciation("working", "ˈtɛstɪŋ"); expect(e.predict("workin'")).toBe("ˈtɛstɪn");
   e.addPronunciation("workin'", "ˈtɛst"); expect(e.predict("workin'")).toBe("ˈtɛst");
   const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
   for(const sentence of ["They are workin' here.", "The workin' crew arrived.", "Workin' was difficult."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "workin'")?.phoneme).toMatch(/ɪn$/);
  });

})();

// Original suite: en-cluster-ere-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/phonotactics") = require("../src/en/phonotactics");
  const { applyPhonotactics } = __suiteModule1;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;

  test("a final -ere after an s-obstruent cluster retains its rhotic vowel", () => {
    expect(applyPhonotactics("ˈætməsfɪɹ", "atmosphere")).toBe("ˈætməsfɪɹ");
    expect(applyPhonotactics("ˈɔstɪɹ", "austere")).toBe("ˈɔstɪɹ");
    expect(applyPhonotactics("ˈbaɪoʊsfɪɹz", "biosphere's")).toBe("ˈbaɪoʊsfɪɹz");
    expect(applyPhonotactics("ˈmæstɪɹ", "master")).toBe("ˈmæstɝ");
    expect(applyPhonotactics("ˈɫæmfɪɹ", "lamphere")).toBe("ˈɫæmfɝ");
  });

  test.each([false, true])( "compound root and nearby rime controls, disableDict=%s", disableDict => {
    const g = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(g.predict("atmosphere", "en-US", pos)).toMatch(/s[ˌ]?fɪɹ$/);
      expect(g.predict("biosphere", "en-US", pos)).toMatch(/s[ˌ]?fɪɹ$/);
      expect(g.predict("austere", "en-US", pos)).toMatch(/stɪɹ$/);
      expect(g.predict("master", "en-US", pos)).toBe("ˈmæstɝ");
      for (const word of ["atmospheres", "atmosphere's", "biospheres", "biosphere's", "stratospheres", "stratosphere's", "telespheres", "telesphere's"])
        expect(g.predict(word, "en-US", pos)).toMatch(/s?fɪɹz$/);
    }
    expect(g.predict("astrosphere", "en-US")).toMatch(/s[ˌ]?fɪɹ$/);
    expect(g.predict("astrospheres", "en-US")).toMatch(/s[ˌ]?fɪɹz$/);
    expect(g.predict("masteres", "en-US")).toBe("ˈmæstɝz");
    expect(g.predict("transferes", "en-US")).toBe("ˈtɹænsfɝz");
    const p = createPhonemizer({ processors: [g] });
    const tokens = p.phonemize("The atmosphere surrounds the biosphere, and the master is austere.", { language: "en-US", returnArray: true });
    for (const word of ["atmosphere", "biosphere"]) expect(tokens.find(t => t.word === word)?.phoneme).toMatch(/s[ˌ]?fɪɹ$/);
    expect(tokens.find(t => t.word === "master")?.phoneme).toBe("ˈmæstɝ");
    expect(tokens.find(t => t.word === "austere")?.phoneme).toMatch(/stɪɹ$/);
  });

})();

// Original suite: en-co-w-root-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("co before vouched polysyllabic w roots, rules=%s", disableDict => {
    it("retains the root consonants after whole-target eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["coworker", "coworkers", "cowriter", "cowriters"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [["coworker", "koʊwɝkɝ"], ["coworkers", "koʊwɝkɝz"], ["cowriter", "koʊɹaɪtɝ"], ["cowriters", "koʊɹaɪtɝz"]] as const)
        expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toBe(ipa);
    });
    it("preserves ambiguous short co-w spellings and caller ownership", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("cowan")).toBe(disableDict ? "ˈkoʊən" : "ˈkaʊən");
      expect(engine.predict("cowart")).toBe(disableDict ? "ˈkoʊɑɹt" : "ˈkaʊɑɹt");
      const owner = new EnglishG2P({ disableDict });
      owner.addPronunciation("worker", "ˈzɛŋ");
      withoutDictionaryEntries(owner, ["coworker"]);
      expect(owner.predict("coworker")).toBe("ˌkoʊˈzɛŋ");
      owner.addPronunciation("coworker", "ˈkɛŋ");
      expect(owner.predict("coworker")).toBe("ˈkɛŋ");
    });
    it("keeps the root in complete noun and finite verb sentences", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ending] of [["The coworker records the song.", "coworker", /koʊwɝkɝ$/], ["The cowriter permits the change.", "cowriter", /koʊɹaɪtɝ$/]] as const)
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(ending);
    });
  });

})();

// Original suite: en-coal-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const g2p = new EnglishG2P({ disableDict: true });
  const defaultG2p = new EnglishG2P();

  describe("initial coa hiatus in the coal- / coalesc- root families", () => {
    it.each([
      ["coalition", "koʊəˈɫɪʃən"],
      ["coalitions", "ˌkoʊəˈɫɪʃənz"],
      ["coalesce", "koʊəˈɫɛs"],
      ["coalesced", "ˌkoʊəˈɫɛst"],
      ["coalescing", "ˌkoʊəˈɫɛsɪŋ"],
      ["coalescent", "koʊəˈɫɛsənt"],
      ["coalescence", "ˌkoʊəˈɫɛsəns"],
    ])("reads %s with the unstressed <a> nucleus", (word, expected) => {
      expect(g2p.predict(word)).toBe(expected);
      expect(defaultG2p.predict(word)).toBe(expected);
    });

    it("keeps the coal rime and ordinary co- vowel boundaries", () => {
      expect(g2p.predict("coal")).toBe("ˈkoʊɫ");
      expect(g2p.predict("coaling")).toBe("ˈkoʊɫɪŋ");
      expect(g2p.predict("coauthor")).toBe("ˈkoʊəθɝ");
      expect(g2p.predict("cooperate")).toBe("ˈkupɝˌeɪt");
    });
  });

})();

// Original suite: en-combining-and-ify.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("combining forms and suffix context (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("merged -metry places the primary on its own nucleus", () => {
      expect(g2p.predict("geometry")).toContain("dʒiˈɑm");
      expect(g2p.predict("geography")).toContain("dʒiˈɑɡ");
    });

    test("auto- retains its first vowel under root primary stress", () => {
      for (const word of ["autonomy", "autonomous", "autocracy"])
        expect(g2p.predict(word)).toMatch(/^ˌ?ɔ/);
    });

    test("auto- keeps its component reading in compounds", () => {
      if (disableDict) {
        expect(g2p.predict("automotive")).toBe("ˌɔtəˈmoʊtɪv");
        expect(g2p.predict("automotives")).toBe("ˌɔtəˈmoʊtɪvz");
        expect(g2p.predict("autoeurope")).toBe("ˌɔtoʊˈjʊɹəp");
        expect(g2p.predict("autopilot")).toBe("ˈɔtoʊˌpaɪɫət");
        expect(g2p.predict("autopacific")).toBe("ˌɔtoʊpəˈsɪfɪk");
        expect(g2p.predict("non-automotive")).toBe("nɑnˈˌɔtəmoʊtɪv");
      }
    });

    test("-ify establishes the root in its antepenult frame", () => {
      for (const word of ["solidify", "solidifies", "solidified", "solidifying"])
        expect(g2p.predict(word)).toContain("ˈɫɪd");
      expect(g2p.predict("electrify")).toContain("ˈɫɛktɹ");
      expect(g2p.predict("dignify")).toContain("dɪɡn");
      expect(g2p.predict("signify")).toContain("sɪɡn");
      expect(g2p.predict("verify")).toContain("vɛɹ");
      expect(g2p.predict("purify")).toContain("pjʊɹ");
      for (const word of ["deify", "edify", "unify"])
        expect(g2p.predict(word)).toMatch(/faɪ$/);
      expect(g2p.predict("dehumidify")).toContain("hjuˈmɪd");
      expect(g2p.predict("demystify")).toContain("ˈmɪst");
    });

    test("weak -im/-il before -ize reduces without changing -ic/-ive bases", () => {
      for (const word of ["minimize", "minimizes", "minimized", "minimizing", "optimize"])
        expect(g2p.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("əmaɪz");
      expect(g2p.predict("utilize")?.replace(/[ˈˌ]/g, "")).toContain("təɫaɪz");
      expect(g2p.predict("criticize")).toContain("tɪ");
      expect(g2p.predict("publicize")).toContain("ɫɪ");
      expect(g2p.predict("collectivize")).toContain("tɪ");
    });
  });

})();

// Original suite: en-combining-meter.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens, withoutDictionaryEntries } = __suiteModule1;

  // Collins: https://www.collinsdictionary.com/dictionary/english-pronunciations/thermometer
  // Combining -meter carries root stress; a unit such as nanometer stays a compound.
  describe.each([false, true])("combining meter, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["thermometer", "θɝˈmɑmətɝ"],
      ["thermometers", "θɝˈmɑmətɝz"],
      ["micrometer", "maɪˈkɹɑmətɝ"],
      ["spectrometer", "spɛkˈtɹɑmətɝ"],
      ["nanometer", "ˈnænoʊˌmitɝ"],
    ])("keeps the root and neighboring unit: %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves caller-owned tail and whole-target priority", () => {
      const own = new EnglishG2P({ disableDict });
      Reflect.set(own, "dictionary", { ...Reflect.get(own, "dictionary"), thermometer: "θɝˈmɑmətɝ" });
      own.addPronunciation("meter", "ˈzɛŋ");
      expect(own.predict("thermometer")).toBe(disableDict ? "ˈθɝmoʊˌzɛŋ" : "θɝˈmɑmətɝ");
      own.addPronunciation("thermometer", "ˈfɔɹm");
      expect(own.predict("thermometer")).toBe("ˈfɔɹm");
    });
    it("uses a caller-owned tail after the whole target is evicted", () => {
      const own = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(own, ["thermometer"]);
      own.addPronunciation("meter", "ˈzɛŋ");
      expect(own.predict("thermometer")).toBe("ˈθɝmoʊˌzɛŋ");
    });
    it("retains surrounding noun, adjective and verb readings", () => {

      const tokens = englishTokens(engine, "They record a kind minder beside the thermometer.");
      expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
      expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
      expect(tokens.find(t => t.word === "thermometer")?.phoneme).toBe("θɝˈmɑmətɝ");
      if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
    });
  });

})();
