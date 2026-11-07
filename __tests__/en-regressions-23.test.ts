// Original suite: en-stressed-son-ton-rimes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("stressed monosyllabic -son/-ton rimes", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["son", "ˈsʌn"],
      ["ton", "ˈtʌn"],
    ])("uses STRUT in the stressed standalone %s rime", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it.each([
      ["proton", "pɹəˈtɑn"],
      ["exton", "ɪksˈtɑn"],
      ["tonic", "ˈtɑnɪk"],
      ["tonight", "təˈnaɪt"],
      ["person", "ˈpɝsən"],
      ["lesson", "ˈɫɛsən"],
      ["John", "ˈdʒɑn"],
      ["con", "ˈkɑn"],
      ["don", "ˈdɑn"],
    ])("preserves the neighboring %s environment", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it("keeps the rule readings in sentence context", () => {
      const phonemizer = createPhonemizer({ processors: [rules] });
      const tokens = phonemizer.phonemize("Her son weighed a ton tonight.", {
        language: "en-US",
        returnArray: true,
      });
      expect(tokens.find((token) => token.word === "son")?.phoneme).toBe("sʌn");
      expect(tokens.find((token) => token.word === "ton")?.phoneme).toBe("tʌn");
      expect(tokens.find((token) => token.word === "tonight")?.phoneme).toBe("təˈnaɪt");
    });
  });

})();

// Original suite: en-stressed-terminal-ye.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("stressed consonantal -ye, disableDict=%s", disableDict => {
    const cold = () => {
      const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
      for (const w of ["bye", "dye", "lye", "rye", "dyes", "dyed", "dyeing"]) delete dictionary[w];
      Reflect.set(e, "dictionary", dictionary);return e;
    };
    it.each([["bye", "ˈbaɪ"], ["dye", "ˈdaɪ"], ["lye", "ˈɫaɪ"], ["rye", "ˈɹaɪ"]])("reads cold root %s", (w, ipa) => {
      const e=cold();expect(e.predict(w)).toBe(ipa);expect(e.predict(w.toUpperCase())).toBe(ipa);
    });
    it("preserves inflection with cold roots", () => {
      const e=cold();expect(e.predict("dyes")).toBe("ˈdaɪz");expect(e.predict("dyed")).toBe("ˈdaɪd");expect(e.predict("dyeing")).toBe("ˈdaɪɪŋ");
    });
    it("preserves prefixed inflections and extends a nonce root", () => {
      const e=cold();expect(e.predict("redyed")).toBe("ɹiˈdaɪd");expect(e.predict("redyeing")).toBe("ˌɹiˈdaɪɪŋ");expect(e.predict("tie-dye")).toBe("taɪˈdaɪ");expect(e.predict("dyer")).toBe("ˈdaɪɝ");expect(e.predict("dyeable")).toBe("ˈdaɪəbəɫ");expect(e.predict("grye")).toBe("ˈɡɹaɪ");
    });
    it("retains weak y, earlier vowel and caller controls", () => {
      const e=cold();for(const [w,ipa] of [["city","ˈsɪti"],["happy","ˈhæpi"],["edye","ˈɛdi"],["freddye","ˈfɹɛdi"],["jessye","ˈdʒɛsi"],["tevye","ˈtɛvi"]])expect(e.predict(w)).toBe(ipa);
      expect(e.predict("IBM")).toMatch(/aɪ.*bi.*ɛm/);e.addPronunciation("dye","ˈtɛst");expect(e.predict("DYE")).toBe("ˈtɛst");expect(e.predict("dyes")).toBe("ˈtɛsts");
    });
    it("preserves full sentence POS and tense controls", () => {
      const api=createPhonemizer({processors:[cold()]});const pick=(s:string,w:string)=>api.phonemize(s,{language:"en-US",returnArray:true}).find(t=>t.word===w)?.phoneme;
      expect(pick("The dye is blue.","dye")).toBe("daɪ");expect(pick("They dye the wool.","dye")).toBe("daɪ");expect(pick("The dyed wool is blue.","dyed")).toBe("daɪd");
      expect(pick("The records of blue notes are missing.","records")).toBe("ˈɹɛkɝdz");expect(pick("The musician records blue notes.","records")).toBe("ɹɪˈkɔɹdz");expect(pick("The viral infection spreads.","viral")).toBe("ˈvaɪɹəɫ");
      if(!disableDict){expect(pick("I read that book yesterday.","read")).toBe("ɹɛd");expect(pick("I will read it tomorrow.","read")).toBe("ɹid");}
    });
  });

})();

// Original suite: en-strong-ate-adjectives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const predict = (word: string) => g.predict(word, "en")!;
    describe(`supplied geminate ate adjectives (${disableDict})`, () => {
      test("keeps the attested verb's strong thematic ate", () => {
        for (const root of ["innovative", "appreciative", "accumulative"])
          for (const ending of ["", "s", "ly"])
            expect(predict(root + ending)).toMatch(/eɪtɪv/);
        expect(predict("innovative")).toMatch(/^ˈɪn/);
      });
      test("keeps other adjective families weak", () => {
        for (const word of ["alternative", "affirmative", "illustrative", "accusative", "operative", "cumulative", "conservative"])
          expect(predict(word)).toMatch(/ətɪv$/);
      });
    });
  }

})();

// Original suite: en-strong-ier-and-io.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("strong ier and merged io nuclei (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");

    test("bare stop-onset ier keeps NEAR, including layer-tier", () => {
      for (const word of ["bier", "pier", "tier"])
        expect(segments(word)).toMatch(/[iɪ]ɹ$/);
      expect(segments("premier")).toMatch(/mɪɹ$/);
    });

    test("PRICE agent stems and weak ier remain distinct", () => {
      for (const word of ["crier", "drier", "flier", "trier", "plier", "tyer"])
        expect(segments(word)).toContain("aɪ");
      for (const word of ["carrier", "happier", "healthier"])
        expect(segments(word)).toMatch(/iɝ$/);
    });

    test("a merged io slot weakens its second nucleus before a light l tail", () => {
      for (const word of ["violent", "violence", "violet", "violin"])
        expect(segments(word)).toContain("vaɪəl");
      for (const word of ["violent", "violence"])
        expect(g2p.predict(word)).toMatch(/^ˈvaɪ/);
    });

    test("transparent prefixes retain a rule-exact iol root", () => {
      for (const word of ["nonviolent", "nonviolence"]) {
        expect(segments(word)).toContain("vaɪəl");
        expect(g2p.predict(word)).toContain("ˈvaɪ");
      }
    });

    test("independent musical roots and longer tails retain their frames", () => {
      expect(segments("viol")).toMatch(/vaɪ[ɑo]l$/);
      for (const word of ["violate", "violated", "violating"])
        expect(segments(word)).toContain("leɪt");
      expect(segments("lion")).toContain("laɪ");
    });
  });

  test("runtime violin keeps lexical final primary through inflection", () => {
    const g2p = new EnglishG2P();
    for (const word of ["violin", "violins", "violinist", "violinists"])
      expect(g2p.predict(word)).toMatch(/ˈ[lɫ]ɪn/);
  });

})();

// Original suite: en-strong-ould-and-weak-or.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

  describe.each([false, true])("native rhotic and agent frames (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const say = (word: string) => clean(g2p.predict(word)!);

    test("the second nucleus of merged prior/mayor rimes stays weak", () => {
      for (const word of ["prior", "priors", "prior's", "priory", "priories", "unpriory", "nonpriory", "semipriory", "multipriory", "priorly", "nonprior", "semiprior", "multiprior"])
        expect(say(word)).toMatch(/pɹaɪɝ/);
      for (const word of ["mayor", "mayors", "mayor's", "nonmayor", "semimayor", "multimayor"])
        expect(say(word)).toMatch(/meɪɝ/);
      expect(g2p.predict("priority")).toMatch(/ˈɔɹ/);
      expect(say("for")).toMatch(/ɔɹ$/);
    });

    test("native ould and oulder keep GOAT and l outside modal roots", () => {
      for (const word of ["mould", "moulds", "moulded", "moulding", "moulder", "smoulder", "smouldering", "boulder", "boulders", "shoulder", "shouldered", "shouldering", "unshouldered", "nonshoulder", "semishoulder", "multishoulder"])
        expect(say(word)).toMatch(/oʊ[lɫ]d/);
      for (const word of ["could", "should", "would"])
        expect(say(word)).toMatch(/ʊd$/);
      for (const word of ["wood", "woods", "wooden"])
        expect(say(word)).toMatch(/wʊd/);
    });

    test("rhotic agent roots use independently supplied verb readings", () => {
      expect(g2p.predict("recorder")).toMatch(/ˈkɔɹdɝ$/);
      expect(g2p.predict("exporter")).toMatch(/ˈspɔɹtɝ$/);
      expect(g2p.predict("importer")).toMatch(/ˈpɔɹtɝ$/);
      expect(g2p.predict("protester")).toMatch(/^ˈpɹoʊ/);
    });

    test("short os rimes are not fabricated plurals of two-letter bases", () => {
      for (const word of ["cos", "eos", "pos"])
        expect(say(word)).toMatch(/s$/);
      for (const word of ["shows", "photos", "zeros"])
        expect(say(word)).toMatch(/oʊz$/);
    });
  });

})();

// Original suite: en-strong-prefix-and-agent-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Strong prefix and agent roots (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });
    const phones = (word: string) => engine.predict(word, "en-US")!.replace(/[ˈˌ]/g, "");

    it.each([
      ["enhance", "ɛnˈhæns"], ["enrage", "ɛnˈɹeɪdʒ"],
      ["encase", "ɛnˈkeɪs"], ["restage", "ɹiˈsteɪdʒ"],
    ])("keeps root stress in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    it.each(["enhances", "enhancing", "enhancement", "enhancer"])(
      "preserves the checked root in %s", word => expect(phones(word)).toContain("hæns"),
    );
    it.each(["enrages", "enraged", "enraging"])(
      "preserves FACE before suffixes in %s", word => expect(phones(word)).toContain("ɹeɪdʒ"),
    );

    it.each([
      ["engine", "ˈɛndʒən"], ["average", "ˈævɝɪdʒ"],
      ["leverage", "ˈɫɛvɝɪdʒ"], ["garbage", "ˈɡɑɹbɪdʒ"],
    ])("preserves the unrelated noun %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    it.each(["reader", "readers", "readerless", "rereader"])(
      "takes the present verb root in %s", word => expect(phones(word)).toContain("ɹid"),
    );
    it.each([
      ["header", "hɛdɝ"], ["spreader", "spɹɛdɝ"],
      ["leader", "ɫidɝ"], ["closer", "kɫoʊsɝ"],
    ])("preserves neighboring agent/comparative %s", (word, ipa) => {
      expect(phones(word)).toBe(ipa);
    });

    it.each([
      ["They enhance the image.", "enhance", "ɛnˈhæns"],
      ["The new reader arrived.", "reader", "ˈɹidɝ"],
    ])("preserves the reading in %s", (sentence, word, ipa) => {
      const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word.toLowerCase() === word)!;
      expect(target.phoneme).toBe(ipa);
    });
  });

  // Oxford read_1: he/she/it reads /ri:dz/, past simple read /red/.
  // https://www.oxfordlearnersdictionaries.com/definition/english/read_1
  describe("Finite read controls", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
    it.each([
      ["She read books every day.", "ɹɛd"],
      ["They have read the book.", "ɹɛd"],
    ])("preserves %s", (sentence, ipa) => {
      expect(phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === "read")!.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-strong-to-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("strong to and compounds ending in -to", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([["to", "ˈtu"], ["into", "ˈɪntu"], ["onto", "ˈɑntu"]])(
      "uses /u/ in %s",
      (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
    );

    it.each([["photo", "ˈfoʊtoʊ"], ["pinto", "ˈpɪntoʊ"], ["tonto", "ˈtɑntoʊ"]])(
      "keeps ordinary final -to in %s",
      (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
    );

    it("keeps weak to in connected speech", () => {

      const tokens = englishTokens(rules, "I want to go into town.");
      expect(tokens.find(token => token.word === "to")?.phoneme).toBe("tə");
      expect(tokens.find(token => token.word === "into")?.phoneme).toBe("ˈɪntu");
    });
  });

})();

// Original suite: en-suffix-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("suffix boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["steal", "appeal", "reveal"])("%s keeps its ea vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/iɫ$/);
    });
    test.each(["coal", "goal", "shoal"])("%s keeps its oa vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/oʊɫ$/);
    });
    test("trial keeps its vowel-initial suffix boundary", () => {
      expect(g2p.predict("trial", "en")).toMatch(/aɪəɫ$/);
    });
    test("argument sees the medial u glide and reduction", () => {
      expect(g2p.predict("argument", "en")).toMatch(/ɡjəmənt$/);
    });
    test("document sees the medial u glide", () => {
      expect(g2p.predict("document", "en")).toMatch(/kjəm[əɛ]nt$/);
    });
    test("instrument reduces medial u after r without a glide", () => {
      expect(g2p.predict("instrument", "en")).toMatch(/ɹəmənt$/);
    });
    test.each([
      ["achievement", /ivmənt$/], ["basement", /eɪsmənt$/],
      ["grateful", /eɪtfəɫ$/], ["homeless", /oʊmɫəs$/],
    ] as const)("%s retains its free silent-e stem vowel", (word, ending) => {
      expect(g2p.predict(word, "en")).toMatch(ending);
    });
    test("an attested u-final root retains its supplied reading", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("fabu", "F AE1 B UW0");
      expect(custom.predict("fabument", "en")).toMatch(/bumənt$/);
    });
  });

})();

// Original suite: en-suggest-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("suggest lexical root on the rules route", () => {
    it.each([false, true])("preserves the dictionary reading and regular forms (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("suggest", "en-US", "VB")).toBe("səˈdʒɛst");
      expect(engine.predict("suggests", "en-US", "VBZ")).toBe("səˈdʒɛsts");
      expect(engine.predict("suggested", "en-US", "VBD")).toBe("səˈdʒɛstɪd");
      expect(engine.predict("suggesting", "en-US", "VBG")).toBe("səˈdʒɛstɪŋ");
      expect(engine.predict("suggestion", "en-US", "NN")).toBe("səˈdʒɛstʃən");
      expect(engine.predict("digest", "en-US", "NN")).toBe(disableDict ? "ˈdaɪdʒəst" : "ˈdaɪdʒɛst");


      const tokens = englishTokens(engine, "They suggest a change, then suggested it again.");
      const readings = tokens.filter(token => ["suggest", "suggested"].includes(token.word.toLowerCase()));
      expect(readings.map(token => token.phoneme)).toEqual(["səˈdʒɛst", "səˈdʒɛstɪd"]);
    });
  });

})();

// Original suite: en-suite-soul-comfort-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("sourced suite, soul, comfort, congress, and bother roots", () => {
    it.each([false, true])("keeps lexical root readings through inflection and sentence context (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("suite", "en-US", "NN")).toBe("swit");
      expect(engine.predict("suites", "en-US", "NNS")).toBe("swits");
      expect(engine.predict("soul", "en-US", "NN")).toBe("soʊɫ");
      expect(engine.predict("souls", "en-US", "NNS")).toBe("soʊɫz");
      expect(engine.predict("comfort", "en-US", "NN")).toBe("ˈkʌmfɝt");
      expect(engine.predict("comfort", "en-US", "VB")).toBe("ˈkʌmfɝt");
      expect(engine.predict("comfortable", "en-US", "JJ")).toBe("ˈkʌmfɝtəbəɫ");
      expect(engine.predict("congress", "en-US", "NN")).toBe(disableDict ? "ˈkɑŋɡɹɛs" : "ˈkɑŋɡɹəs");
      expect(engine.predict("congresses", "en-US", "NNS")).toBe("ˈkɑŋɡɹəsəz");
      expect(engine.predict("bother", "en-US", "NN")).toBe("ˈbɑðɝ");
      expect(engine.predict("bother", "en-US", "VB")).toBe("ˈbɑðɝ");
      expect(engine.predict("bothered", "en-US", "VBD")).toBe("ˈbɑðɝd");
      expect(engine.predict("bothering", "en-US", "VBG")).toBe("ˈbɑðɝɪŋ");

      expect(engine.predict("mother", "en-US", "NN")).toBe("ˈmʌðɝ");
      expect(engine.predict("brother", "en-US", "NN")).toBe("ˈbɹʌðɝ");
      expect(engine.predict("progress", "en-US", "NN")).toBe(disableDict ? "ˈpɹɑɡɹɛs" : "ˈpɹoʊɡɹɛs");
      expect(engine.predict("south", "en-US", "NN")).toBe("saʊθ");


      const tokens = englishTokens(engine, "The suite offered comfort to every bothered soul; Congress heard the complaint without a bother.");
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
      expect(reading("suite")).toBe("swit");
      expect(reading("comfort")).toBe("ˈkʌmfɝt");
      expect(reading("bothered")).toBe("ˈbɑðɝd");
      expect(reading("soul")).toBe("soʊɫ");
      expect(reading("Congress")).toBe(disableDict ? "ˈkɑŋɡɹɛs" : "ˈkɑŋɡɹəs");
    });
  });

})();

// Original suite: en-supplied-stem-priority.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  // Regular l-final stems take -s, not -es: https://advice.writing.utoronto.ca/revising/plurals/
  describe.each([false, true])("supplied consonant-final stem, rules=%s", (disableDict) => {
    test("preserves the supplied root in regular inflections", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("vornil", "ˈvɔɹnɪl");
      expect(engine.predict("vornil")).toBe("ˈvɔɹnɪl");
      expect(engine.predict("vornils")).toBe("ˈvɔɹnɪɫz");
      expect(engine.predict("vorniled")).toBe("ˈvɔɹnɪɫd");
      expect(engine.predict("vorniling")).toBe("ˈvɔɹnɪɫɪŋ");
      engine.addPronunciation("kit", "ˈkɪt");
      expect(engine.predict("kits")).toBe("ˈkɪts");
      expect(engine.predict("kites")).toBe("ˈkaɪts");
      engine.addPronunciation("vornile", "ˈvɔɹnaɪl");
      expect(engine.predict("vorniles")).toBe("ˈvɔɹnaɪɫz");
    });
  });

})();

// Original suite: en-supported-or-agents.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Oxford survivor/senator and Merriam-Webster narrator/radiator independently attest these roots.
  describe.each([false, true])("supported -or agents, disableDict=%s", disableDict => {
    const cold = () => {
      const en = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(en, "dictionary") };
      for (const stem of ["survivor", "senator", "narrator", "radiator", "vibrator", "mediator", "locator"]) {
        for (const word of [stem, stem + "s", stem + "'s", stem + "ship", "non" + stem]) delete dictionary[word];
      }
      Reflect.set(en, "dictionary", dictionary);
      return en;
    };
    it.each([
      ["survivor", "sɝˈvaɪvɝ"], ["senator", "ˈsɛnətɝ"], ["narrator", "ˈnɛɹeɪtɝ"],
      ["radiator", "ˈɹeɪdieɪtɝ"], ["vibrator", "ˈvaɪbɹeɪtɝ"], ["mediator", "ˈmidieɪtɝ"], ["locator", "ˈɫoʊkeɪtɝ"],
    ])("recovers %s with the primary stress of its actual stem", (word, ipa) => {
      const en = cold();
      for (const variant of [word, word.toUpperCase()]) {
        // Existing composition paths differ in optional secondary boundary marks; primary and phones remain exact.
        expect(en.predict(variant)?.replace(/ˌ/g, "")).toBe(ipa);
      }
    });
    it("preserves plurals and possessives after singular eviction", () => {
      const en = cold();
      expect(en.predict("survivors")).toBe("sɝˈvaɪvɝz");
      expect(en.predict("survivor's")).toBe("sɝˈvaɪvɝz");
      expect(en.predict("senators")).toBe("ˈsɛnətɝz");
      expect(en.predict("senator's")).toBe("ˈsɛnətɝz");
    });
    it("retains the recovered noun under prefixes and neutral derivation", () => {
      const en = cold();
      for (const [word, ipa] of [
        ["nonsurvivor", "nɑnsɝˈvaɪvɝ"], ["nonsenator", "nɑnˈsɛnətɝ"],
        ["nonnarrator", "nɑnˈnɛɹeɪtɝ"], ["nonradiator", "nɑnˈɹeɪdieɪtɝ"],
        ["survivorship", "sɝˈvaɪvɝʃɪp"], ["survivorhood", "sɝˈvaɪvɝhʊd"],
      ]) expect(en.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("honors explicit caller stem and whole-token ownership", () => {
      const en = cold();
      en.addPronunciation("survive", "ˈtɛst");
      expect(en.predict("survivor")).toBe("ˈtɛstɝ");
      expect(en.predict("survivors")).toBe("ˈtɛstɝz");
      en.addPronunciation("senate", "ˈtɛst");
      expect(en.predict("senator")).toBe("ˈtɛstɝ");
      en.addPronunciation("survivor", "ˈkʌstəm");
      expect(en.predict("survivor")).toBe("ˈkʌstəm");
      expect(en.predict("survivorship")).toBe("ˈkʌstəmˌʃɪp");
    });
    it("retains established weak nuclei rather than copying another stem variant", () => {
      const en = cold();
      for (const [word, ipa] of [
        ["arbitrator", "ˈɑɹbɪˌtɹeɪtɝ"], ["estimator", "ˈɛstɪˌmeɪtɝ"],
        ["replicator", "ˈɹɛpɫɪˌkeɪtɝ"], ["syndicator", "ˈsɪndɪˌkeɪtɝ"],
      ]) expect(en.predict(word)).toBe(ipa);
    });
    it("does not invent a silent-e derivation for ordinary nouns or names", () => {
      const en = cold();
      expect(en.predict("actor")).toBe("ˈæktɝ");
      expect(en.predict("cormac")).toBe("ˈkɔɹmək");
      expect(en.predict("sorbus")).toBe("ˈsɔɹbəs");
      expect(en.predict("motor")).toBe("ˈmoʊtɝ");
      expect(en.predict("Lafavor")).toBe("ˈɫæfəvɝ");
    });
    it("preserves full-sentence noun, adjective and verb controls", () => {
      const api = createPhonemizer({ processors: [cold()] });
      const out = api.phonemize("The viral infection spreads. They vibrate the panel. The senator records blue notes. The records of blue notes are missing. A survivor tells the story.", { language: "en-US", returnArray: true });
      expect(out.find(t => t.word === "viral")?.phoneme).toBe("ˈvaɪɹəɫ");
      expect(out.find(t => t.word === "vibrate")?.phoneme).toBe("ˈvaɪbɹeɪt");
      expect(out.find(t => t.word === "senator")?.phoneme).toBe("ˈsɛnətɝ");
      expect(out.find(t => t.word === "survivor")?.phoneme).toBe("sɝˈvaɪvɝ");
      expect(out.filter(t => t.word === "records").map(t => t.phoneme)).toEqual(["ɹɪˈkɔɹdz", "ˈɹɛkɝdz"]);
    });
  });

})();

// Original suite: en-sure-able-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("-sure before -able (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test.each([
      ["measurable", "ˈmɛʒɝəbəɫ"],
      ["pleasurable", "ˈpɫɛʒɝəbəɫ"],
      ["censurable", "ˈsɛnʃɝəbəɫ"],
      ["treasurable", "ˈtɹɛʒɝəbəɫ"],
    ])("retains the stem in %s", (word, expected) => {
      for (const pos of [undefined, "N", "ADJ", "V"]) expect(engine.predict(word, "en-US", pos)).toBe(expected);
      expect(engine.predict(word, "en-GB")).toContain(expected.includes("ʃ") ? "ʃ" : "ʒ");
      const phrase = `The ${word} result was recorded.`;
      expect(api.phonemize(phrase, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
      expect(api.phonemize(phrase, { language: "en-GB", returnArray: true }).find(token => token.word === word)?.phoneme)
        .toBe(engine.predict(word, "en-GB"));
    });

    test("retains neighboring -ure roots and derivations", () => {
      expect(engine.predict("measure")).toBe("ˈmɛʒɝ");
      expect(engine.predict("measured")).toBe("ˈmɛʒɝd");
      expect(engine.predict("measuring")).toBe("ˈmɛʒɝɪŋ");
      expect(engine.predict("measurably")).toBe("ˈmɛʒɝəbɫi");
      expect(engine.predict("measurability")).toMatch(/mɛʒɝəˈbɪɫəti$/);
      expect(engine.predict("unmeasurable")).toMatch(/mɛʒɝəbəɫ$/);
      expect(engine.predict("pleasure")).toBe("ˈpɫɛʒɝ");
      expect(engine.predict("insurable")).toMatch(/ʃʊɹəbəɫ$/);
      if (disableDict) expect(engine.predict("immeasurable")).toBe("ɪˈmɛʒɝəbəɫ");
    });

    test.each(["treasure", "treasur"])("preserves the supplied %s stem", root => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation(root, "ˈtʊɡ");
      expect(custom.predict("treasurable")).toBe("ˈtʊɡəbəɫ");
    });
    test.each(["measure", "measur"])("uses the supplied %s stem after eviction", root => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation(root, "ˈtʊɡ");
      expect(custom.predict("measurable")).toBe("ˈtʊɡəbəɫ");
      expect(custom.predict("measurably")).toBe("ˈtʊɡəbɫi");
    });
  });

})();

// Original suite: en-syllabic-codas-and-rimes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/morph-parser") = require("../src/en/morph-parser");
  const { softenBaseFinal } = __suiteModule1;

  describe.each([false, true])("syllabic codas and rimes (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("single initial y retains GOOSE through contractions and suffixes", () => {
      for (const word of ["you", "you'd", "you'll", "you're", "you've", "youth", "youthful"])
        expect(segments(word)).toMatch(/^ju/);
      expect(segments("your")).toMatch(/^jɔɹ/);
      for (const word of ["young", "younger"])
        expect(segments(word)).toMatch(/^j[ʌə]ŋ/);
      for (const word of ["tryout", "buyout"])
        expect(segments(word)).toContain("aʊ");
    });

    test("w+ere and voiced-th/w+eir preserve distinct rhotic nuclei", () => {
      expect(segments("were")).toBe("wɝ");
      for (const word of ["where", "there", "their", "theirselves"])
        expect(segments(word)).toMatch(/^h?[wð]ɛɹ/);
      for (const word of ["weird", "weirdest", "weirdo"])
        expect(segments(word)).toMatch(/^wɪɹ/);
      expect(segments("here")).toBe("hɪɹ");
    });

    test("final sm has a weak nucleus and asm retains TRAP", () => {
      for (const word of ["prism", "spasm", "orgasm", "sarcasm", "cytoplasm"])
        expect(segments(word)).toMatch(/zəm$/);
      for (const word of ["orgasm", "sarcasm", "cytoplasm"])
        expect(segments(word)).toContain("æzəm");
      for (const word of ["abysmal", "baptismal"])
        expect(segments(word)).toMatch(/zmə[ɫl]$/);
      expect(segments("abysmal")).not.toContain("zəmə");
    });

    test("rithm/rhythm voices the dental and supplies the final nasal nucleus", () => {
      for (const word of ["algorithm", "logarithm", "rhythm"])
        expect(segments(word)).toContain("ðəm");
      expect(segments("rhythmic")).toContain("ðmɪk");
      expect(segments("arithmetic")).toContain("θm");
      expect(segments("thunder")).toContain("θ");
    });

    test("Latinate efy/sfy preserves PRICE and its weak thematic i", () => {
      for (const word of ["liquefy", "rarefy", "satisfy", "stupefy", "putrefy"])
        expect(segments(word)).toMatch(/faɪ$/);
      expect(segments("satisfy")).toContain("təsf");
      for (const word of ["dissatisfy", "dissatisfied"])
        expect(segments(word)).toMatch(/^dɪsætəsfaɪ/);
      expect(g2p.predict("dissatisfy")).toMatch(/^dɪˈsæt/);
      expect(segments("dissimilar")).toMatch(/^dɪsɪ/);
      for (const word of ["beefy", "fluffy", "stuffy"])
        expect(segments(word)).toMatch(/fi$/);
    });
  });

  test("the shared suffix join desyllabifies sm only before a vowel", () => {
    expect(softenBaseFinal("ˈtɛzəm", "tesm", "al")).toBe("ˈtɛzm");
    expect(softenBaseFinal("ˈtɛzəm", "tesm", "ic")).toBe("ˈtɛzm");
    expect(softenBaseFinal("ˈtɛzəm", "tesm", "less")).toBe("ˈtɛzəm");
    expect(softenBaseFinal("ˈtɛzəm", "tesem", "al")).toBe("ˈtɛzəm");
  });

  test("a consonant-only token does not acquire the final-sm nucleus", () => {
    expect(new EnglishG2P({ disableDict: true }).predict("sm")).not.toMatch(/[əʌ]/);
  });

})();

// Original suite: en-syllabic-es-root-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US: estate /ɪˈsteɪt/, escape /ɪˈskeɪp/, establish
  // /ɪˈstæblɪʃ/. Their initial written e is a weak es- syllable, with primary
  // stress on the following lexical root.
  describe("weak initial es- before the estate/escape/establish roots", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["estate", "ɪˈsteɪt"],
      ["estates", "ɪˈsteɪts"],
      ["escape", "ɪˈskeɪp"],
      ["escaped", "ɪˈskeɪpt"],
      ["escaping", "ɪˈskeɪpɪŋ"],
      ["establish", "ɪˈstæbɫɪʃ"],
      ["established", "ɪˈstæbɫɪʃt"],
      ["establishing", "ɪˈstæbɫɪʃɪŋ"],
      ["establishment", "ɪˈstæbɫɪʃmənt"],
    ])("predicts %s with root stress", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("preserves contrasting initial-stress roots and -ade/-ee forms", () => {
      expect(rules.predict("escalate", "en-US")).toBe("ˈɛskəˌɫeɪt");
      expect(rules.predict("estimate", "en-US")).toBe("ˈɛstəˌmeɪt");
      expect(rules.predict("escapade", "en-US")).toBe("ˈɛskəˌpeɪd");
      expect(rules.predict("escapee", "en-US")).toBe("ˈɛskəpi");
    });

    it("keeps sentence tokenization and phrase context intact", () => {

      const tokens = englishTokens(rules, "They escaped the estate after officials established a plan.");
      expect(tokens.find(token => token.word === "escaped")?.phoneme).toBe("ɪˈskeɪpt");
      expect(tokens.find(token => token.word === "estate")?.phoneme).toBe("ɪˈsteɪt");
      expect(tokens.find(token => token.word === "established")?.phoneme).toBe("ɪˈstæbɫɪʃt");
    });

    it("uses the standard compound reading when a standalone root meets a lexicalized phrase", () => {
      const lexical = new EnglishG2P({ disableDict: true });
      lexical.addPronunciation("real-estate", "R IY1 L IH0 S T EY2 T");
      expect(lexical.predict("real-estate", "en-US")).toBe("ˈɹilɪˌsteɪt");
    });
  });

})();

// Original suite: en-syllabic-le-man.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("syllabic le before man or men, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test("preserves the lateral in compounds and inflections", () => {
      expect(engine.predict("gentleman", "en", "N")).toBe("ˈdʒɛntəɫmən");
      expect(engine.predict("rifleman", "en", "N")).toBe("ˈɹaɪfəɫmən");
      expect(engine.predict("riflemen", "en", "N")).toBe("ˈɹaɪfəɫmən");
      expect(engine.predict("cattlemen", "en", "N")).toBe("ˈkætəɫmən");
      expect(engine.predict("gentleman's", "en", "N")).toBe("ˈdʒɛntəɫmənz");
    });

    test("retains separate adjective and verb stems and avoids a vowel hiatus", () => {
      expect(engine.predict("gentle", "en", "ADJ")).toBe("ˈdʒɛntəɫ");
      expect(engine.predict("rifle", "en", "V")).toBe("ˈɹaɪfəɫ");
      expect(engine.predict("alleman", "en", "N")).not.toContain("æəɫ");
    });

    test("uses the forms in complete sentences", () => {
      expect(api.phonemize("The gentleman thanked the rifleman.", { language: "en-US" }))
        .toBe("ðə ˈdʒɛntəɫmən θæŋkt ðə ˈɹaɪfəɫmən.");
      expect(api.phonemize("The riflemen watched the cattlemen.", { language: "en-US" }))
        .toBe("ðə ˈɹaɪfəɫmən wɑtʃt ðə ˈkætəɫmən.");
    });
  });

  test("rebuilt exceptions preserve previously supported surname plurals", () => {
    const engine = new EnglishG2P();
    expect(engine.predict("beidlemans", "en")).toBe("ˈbaɪdəɫmənz");
    expect(engine.predict("rendlemans", "en")).toBe("ˈɹɛndəɫmənz");
  });

})();

// Original suite: en-syllable-initialisms.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const segments = (word: string) => g.predict(word, "en")!.replace(/[ˈˌ]/g, "");
    describe(`Unlicensed short syllables (${disableDict})`, () => {
      test("spells obstruent codas with letter names", () => {
        for (const [word, ipa] of [
          ["abc", "eɪbisi"], ["acm", "eɪsiɛm"], ["adsl", "eɪdiɛsɛɫ"],
          ["atm", "eɪtiɛm"], ["atp", "eɪtipi"], ["espn", "iɛspiɛn"],
          ["ibm", "aɪbiɛm"], ["isbn", "aɪɛsbiɛn"], ["usb", "juɛsbi"],
        ]) expect(segments(word)).toBe(ipa);
        expect(segments("abc's")).toBe("eɪbisiz");
      });
      test("keeps ordinary stops, sonorants and spelling digraphs", () => {
        for (const [word, ipa] of [["app", "æp"], ["egg", "ɛɡ"], ["ebb", "ɛb"],
          ["add", "æd"], ["ack", "æk"], ["act", "ækt"], ["apt", "æpt"],
          ["ask", "æsk"], ["asp", "æsp"], ["ism", "ɪzəm"]])
          expect(segments(word)).toBe(ipa);
        expect(segments("gas")).toBe("ɡæs");
      });
    });
  }

  test("traces registered initialisms separately from inferred letter spelling", () => {
    const g = new EnglishG2P({ disableDict: true });
    for (const word of ["abc", "isbn", "usb", "fbi", "cpu"])
      expect(g.trace(word).steps).toEqual([
        { grapheme: word, phoneme: g.predict(word, "en"), rule: "initialism:registered" },
      ]);
  });

})();

// Original suite: en-syntax-analysis.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const { analyzeEnglishSentence } = __suiteModule0;

  const analyze = (sentence: string, maxStates?: number) => analyzeEnglishSentence(sentence.split(" "), { maxStates });
  describe("bounded English feature chart", () => {
    test("preserves comma-separated predicate and nominal alternatives", () => {
      const predicates = analyze("They will read , record , and replay the tape .");
      expect(predicates.status).toBe("parsed");
      expect(predicates.tokens[3].tags).toEqual(["PUNCT"]);
      expect(predicates.tokens[4].tags).toEqual(["V"]);
      expect(predicates.tokens[4].verbForms).toContain("base");
      const nominals = analyze("They will buy fish , produce , and bread .");
      expect(nominals.status).toBe("parsed");
      expect(nominals.tokens[5].tags).toContain("N");
      expect(analyze("They are calm , kind , and ready .").status).toBe("parsed");
      expect(analyze("They buy fish , bread and cheese .").status).toBe("parsed");
      expect(analyze("However , many factors affect intelligence .").status).toBe("unparsed");
      expect(analyze("They will reads , record , and replay the tape .").status).toBe("unparsed");
    });
    test("retains infinitive and prepositional complements after a copula", () => {
      const infinitive = analyze("The goal is to develop and implement interactive programs .");
      expect(infinitive.status).toBe("parsed");
      expect(infinitive.forest.some(n => n.alternatives.some(d => d.rule === "copular-infinitive"))).toBe(true);
      expect(infinitive.tokens[3].tags).toEqual(expect.arrayContaining(["ADP", "PART"]));
      const location = analyze("They are in the garden .");
      expect(location.status).toBe("parsed");
      expect(location.forest.some(n => n.alternatives.some(d => d.rule === "copular-preposition"))).toBe(true);
      const ambiguous = analyze("The tribute is to war and record company executives .");
      expect(ambiguous.status).toBe("parsed");
      expect(ambiguous.tokens[3].tags).toEqual(expect.arrayContaining(["ADP", "PART"]));
      expect(ambiguous.tokens[6].tags).toContain("N");
      expect(analyze("They is in the garden .").status).toBe("unparsed");
    });
    test("modal selection preserves the base form across a possessive NP", () => {
      const report = analyze("I will read yesterday’s notes .");
      expect(report.status).toBe("parsed");
      expect(report.tokens[2].tags).toEqual(["V"]);
      expect(report.tokens[2].verbForms).toEqual(["base"]);
      expect(report.forest.some(n => n.alternatives.some(d => d.rule === "modal-base"))).toBe(true);
      expect(analyze("I will reads notes .").status).toBe("unparsed");
    });
    test("unifies explicit pronoun agreement and auxiliary-selected forms", () => {
      expect(analyze("They are reading .").status).toBe("parsed");
      expect(analyze("They is reading .").status).toBe("unparsed");
      expect(analyze("They was reading .").status).toBe("unparsed");
      expect(analyze("She has read notes .").status).toBe("parsed");
      expect(analyze("She have read notes .").status).toBe("unparsed");
      expect(analyze("I will have read notes .").status).toBe("parsed");
    });
    test("retains lexical and attachment hypotheses instead of claiming intent", () => {
      const duck = analyze("I saw her duck .");
      expect(duck.status).toBe("parsed");
      expect(duck.tokens[3].tags).toEqual(expect.arrayContaining(["N", "V"]));
      expect(duck.tokens[3].basis).toBe("shape");
      const produce = analyze("Stone offers produce boxes for delivery .");
      expect(produce.tokens[2].tags).toEqual(expect.arrayContaining(["N", "V"]));
      expect(produce.limitations.join(" ")).toContain("hypotheses");
    });
    test("retains adverb-modified adjectives alongside infinitive hypotheses", () => {
      const complement = analyze("They are highly articulate .");
      expect(complement.status).toBe("parsed");
      expect(complement.tokens[3].tags).toContain("ADJ");
      expect(complement.forest.some(n => n.alternatives.some(d => d.rule === "adjective-modifier"))).toBe(true);
      const phrase = analyze("They spoke to highly articulate students .");
      expect(phrase.status).toBe("parsed");
      expect(phrase.tokens[4].tags).toEqual(expect.arrayContaining(["ADJ", "V"]));
      const infinitive = analyze("They want to clearly articulate the problem .");
      expect(infinitive.status).toBe("parsed");
      expect(infinitive.tokens[4].tags).toContain("V");
      expect(analyze("They want to apply polish to the shoes .").tokens[4].tags).toContain("N");
    });
    test("preserves repeated occurrences and does not mutate the input", () => {
      const words = ["They", "record", "a", "record", "."];
      const report = analyzeEnglishSentence(words);
      expect(report.words).toEqual(words);
      expect(report.tokens).toHaveLength(words.length);
      expect(report.tokens[1].tags).toContain("V");
      expect(report.tokens[3].tags).toContain("N");
      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.tokens)).toBe(true);
      expect(words).toEqual(["They", "record", "a", "record", "."]);
    });
    test("keeps embedded finite predicates available after a complementizer", () => {
      const report = analyze("They state that Pythagoras learned mathematics .");
      expect(report.status).toBe("parsed");
      expect(report.tokens[4].tags).toContain("V");
      expect(report.forest.some(n => n.alternatives.some(d => d.rule === "finite-clause-complement"))).toBe(true);
      expect(analyze("They state that she are reading .").status).toBe("unparsed");
      expect(analyze("They state that she is reading .").status).toBe("parsed");
    });
    test("does not force number agreement from a title ending in s", () => {
      const report = analyze("The game Puzzle Pirates uses tools .");
      expect(report.status).toBe("parsed");
      expect(report.tokens[4].tags).toContain("V");
      expect(report.forest.some(n => n.alternatives.some(d => d.rule === "name-apposition"))).toBe(true);
      expect(analyze("They uses tools .").status).toBe("unparsed");
    });
    test("coordinates predicates while preserving auxiliary selection", () => {
      const report = analyze("They read and record notes .");
      expect(report.status).toBe("parsed");
      expect(report.tokens[2].tags).toEqual(["CCONJ"]);
      expect(report.tokens[3].tags).toContain("V");
      expect(analyze("They will read and record notes .").status).toBe("parsed");
      expect(analyze("They will read and records notes .").status).toBe("unparsed");
      expect(analyze("They are reading and recording .").status).toBe("parsed");
      const mixed = analyze("They are reading and record .");
      // Separate finite predicates are possible; this is not one shared progressive.
      expect(mixed.status).toBe("parsed");
      expect(mixed.forest.filter(n => n.start === 1 && n.end === 5).some(n => n.alternatives.some(d => d.rule === "be-participle"))).toBe(false);
    });
    test("coordinates subjects with number and case agreement", () => {
      expect(analyze("She and he are reading .").status).toBe("parsed");
      expect(analyze("She and he is reading .").status).toBe("unparsed");
      expect(analyze("I and her are reading .").status).toBe("unparsed");
      expect(analyze("I saw her and him .").status).toBe("parsed");
      expect(analyze("I saw her and he .").status).toBe("unparsed");
      expect(analyze("They or she is reading .").status).toBe("parsed");
    });
    test("keeps independent clause agreement and shared adjective predicates", () => {
      expect(analyze("She reads but they write .").status).toBe("parsed");
      expect(analyze("She reads but they writes .").status).toBe("unparsed");
      expect(analyze("They are quick and smart .").status).toBe("parsed");
      expect(analyze("They is quick and smart .").status).toBe("unparsed");
      expect(analyze("They read a book . and write notes .").status).toBe("unparsed");
    });
    test("retains title fragments and reduced relatives as competing analyses", () => {
      const title = analyze("The Medicinal Uses of Cannabis and Cannabinoids .");
      expect(title.status).toBe("parsed");
      expect(title.roots.map(id => title.forest[id].category)).toContain("NP");
      expect(title.tokens[2].tags).toContain("N");
      const relative = analyze("It was created after lessons learned in Afghanistan and Iraq .");
      expect(relative.status).toBe("parsed");
      expect(relative.tokens[5].tags).toContain("V");
      expect(relative.forest.some(n => n.alternatives.some(d => d.rule === "reduced-relative"))).toBe(true);
    });
    test("quantifiers constrain object boundaries without becoming unknown verbs", () => {
      const report = analyze("They decide on a small church and invite all family and friends .");
      expect(report.status).toBe("parsed");
      expect(report.tokens[7].tags).toContain("V");
      expect(report.tokens[8].basis).toBe("closed-class");
      expect(report.tokens[8].tags).toContain("DET");
      expect(report.tokens[8].tags).not.toContain("N");
      expect(report.tokens[8].tags).not.toContain("V");
      expect(analyze("Many are reading .").status).toBe("parsed");
      expect(analyze("Many is reading .").status).toBe("unparsed");
      expect(analyze("They are certain .").status).toBe("parsed");
    });
    test("missing coverage and pruning never become a certainty claim", () => {
      expect(analyze("你好 .").status).toBe("unparsed");
      expect(analyze("I saw her duck .", 1).status).toBe("truncated");
      expect(analyzeEnglishSentence(Array(65).fill("cat")).status).toBe("truncated");
      expect(() => analyze("I read .", 0)).toThrow(RangeError);
    });
  });

})();

// Original suite: en-syntax-finite-predicate-pos.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const tokens = (text: string) => createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] })
    .phonemize(text, { language: "en-US", returnArray: true });
  const tagAt = (engine: EnglishG2P, words: string[], index: number) => engine.tagWord(words[index], {
    prev: words[index - 1]?.toLowerCase(), next: words[index + 1]?.toLowerCase(), sentence: { words, index },
  });

  describe("syntax-supported finite predicate POS", () => {
    test("uses an independently tagged nominal subject to select a third-person verb", () => {
      const engine = new EnglishG2P({ disableDict: true });
      const words = ["The", "door", "closes", "slowly"];
      const pos = tagAt(engine, words, 2);

      expect(pos.pos).toBe("V");
      expect(engine.predictWithContext("closes", { words, index: 2 }, "en", pos.pos)).toBe("ˈkɫoʊzəz");
      expect(tokens("The door closes slowly.").find(token => token.word === "closes")?.phoneme).toBe("ˈkɫoʊzəz");
    });

    test("does not promote a plural noun in object position to a predicate", () => {
      const engine = new EnglishG2P({ disableDict: true });
      const words = ["The", "farmers", "operate", "combines"];
      expect(tagAt(engine, words, 3).pos).not.toBe("V");
      expect(tokens("The farmers operate combines.").find(token => token.word === "combines")?.phoneme).toBe("ˈkɑmbaɪnz");
    });

    test("does not use an adjective/verb hypothesis as the subject of a false clause", () => {
      const engine = new EnglishG2P({ disableDict: true });
      const words = "Integration enables lean uses of information for the creation of actionable knowledge".split(" ");
      expect(tagAt(engine, words, words.indexOf("uses")).pos).not.toBe("V");
      expect(engine.predictWithContext("uses", { words, index: words.indexOf("uses") }, "en", "N")).toBe("ˈjusəz");
    });

    test("does not promote a title-cased name compound", () => {
      const result = tokens("Handel Records Both Classical Covers.").find(token => token.word === "Records")?.phoneme;
      expect(result).toBe("ˈɹɛkɝdz");
    });
  });

})();

// Original suite: en-tariat-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("English -tariat stress", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each(["secretariat", "proletariat", "commentariat"])(
      "places primary stress on the -tar- syllable of %s",
      word => expect(rules.predict(word, "en-US")).toMatch(/ˈtɛɹiət/),
    );

    it("keeps the separate -ariat reading and inflects the suffix", () => {
      expect(rules.predict("lariat", "en-US")).toBe("ˈɫɛɹiət");
      expect(rules.predict("secretariats", "en-US")).toMatch(/ˈtɛɹiəts$/);
    });
  });

})();
