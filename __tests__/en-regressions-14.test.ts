// Original suite: en-morph-pretonic.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/morph-parser") = require("../src/en/morph-parser");
  const { preservePretonicSchwa } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  // The schwa and primary stress agree with Cambridge US intellectual and continual.
  describe("inherited pretonic schwa", () => {
    test("keeps an aligned weak nucleus after the root stress moves", () => {
      expect(preservePretonicSchwa("ˌɪntɛˈlɛktʃuəl", "ˈɪntəˌɫɛktʃuəl")).toBe("ˌɪntəˈlɛktʃuəl");
    });
    test.each([
      ["ˈtɛl", "təl"],
      ["ˌtɛˈlɪk", "təlɪk"],
      ["paɪˈtɛl", "paəˈtɛl"],
      ["piɛˈta", "piəˈta"],
      ["ˌɪntɛˈrɛkt", "ˌɪntəˈlɛkt"],
      ["ˈtɛlɛ", "ˈtɛlə"],
      ["tɛl", "təl"],
    ])("preserves stress, hiatus/diphthongs and nonmatching roots in %s", (derived, inherited) => {
      expect(preservePretonicSchwa(derived, inherited)).toBe(derived);
    });
  });

  describe.each([false, true])("bound -ual composition (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([["intellectual", "ˌɪntəˈɫɛktʃuəɫ"], ["continual", "kənˈtɪnjuəɫ"], ["intellectually", "ˌɪntəˈɫɛktʃuəɫi"], ["continually", "kənˈtɪnjuəɫi"], ["intellectuals", "ˌɪntəˈɫɛktʃuəɫz"]])("retains the complete suffix frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test.each([["uncontinual", "kənˈtɪnjuəɫ"], ["nonintellectual", "ɪntəˈɫɛktʃuəɫ"]])("preserves the owned root under a productive prefix: %s", (word, tail) => {
      expect(engine.predict(word)?.endsWith(tail)).toBe(true);
    });
    test("places the owned individual root stress on vid", () => {
      expect(engine.predict("individual")).toContain("ˈvɪdʒ");
    });
    test("preserves adjective/noun contexts and unrelated verb controls", () => {

      const tokens = englishTokens(engine, "The intellectual is active. They face continual problems. We print books.");
      expect(tokens.find(token => token.word === "intellectual")?.phoneme).toBe("ˌɪntəˈɫɛktʃuəɫ");
      expect(tokens.find(token => token.word === "continual")?.phoneme).toBe("kənˈtɪnjuəɫ");
      expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
      expect(tokens.find(token => token.word === "print")?.phoneme).toBe("pɹɪnt");
    });
  });

  test("retains caller ownership of a supplied stem and complete adjective", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("contin", "ˈzɛŋ");
    expect(engine.predict("continual")).toMatch(/^ˈzɛŋ/);
    engine.addPronunciation("intellectual", "ˈkʌp");
    expect(engine.predict("intellectual")).toBe("ˈkʌp");
  });


  test("keeps both supplied components of a vowel-hiatus prefix formation", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("annual", "ˈzɛŋ");
    expect(engine.predict("biannual")).toBe("ˌbaɪˈzɛŋ");
    engine.addPronunciation("bi", "ˈkʌp");
    expect(engine.predict("biannual")).toBe("ˌkʌpˈzɛŋ");
  });

})();

// Original suite: en-motive-linking-vowel.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge US automotive/locomotive; Collins American thermomotive:
  // https://dictionary.cambridge.org/us/pronunciation/english/automotive
  // https://dictionary.cambridge.org/pronunciation/english/locomotive
  // https://www.collinsdictionary.com/dictionary/english/thermomotive
  // The weak linking vowel belongs to the two-syllable combining head;
  // a whole-word dictionary entry is not required for thermomotive.
  describe.each([false, true])("bound -motive composition (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["automotive", "ˌɔtəˈmoʊtɪv"],
      ["automotives", "ˌɔtəˈmoʊtɪvz"],
      ["automotive's", "ˌɔtəˈmoʊtɪvz"],
      ["automotively", "ˌɔtəˈmoʊtɪvɫi"],
      ["automotiveness", "ˌɔtəˈmoʊtɪvnəs"],
      ["thermomotive", "ˌθɝməˈmoʊtɪv"],
      ["thermomotive's", "ˌθɝməˈmoʊtɪvz"],
    ])("composes the complete root and suffixes in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });
    it("preserves the existing weak linking syllable in locomotive", () => {
      expect(engine.predict("locomotive")).toContain("kəˈmoʊtɪv");
    });
    it.each([
      ["auto", "ˈɔtoʊ"],
      ["autopilot", "ˈɔtoʊˌpaɪɫət"],
      ["autoeurope", "ˌɔtoʊˈjʊɹəp"],
      ["autopacific", "ˌɔtoʊpəˈsɪfɪk"],
      ["retroactive", "ˌɹɛtɹoʊˈæktɪv"],
      ["hypotension", "ˌhaɪpoʊˈtɛnʃən"],
      ["endoscopic", "ˌɛndoʊˈskɑpɪk"],
    ])("retains the independent component vowels in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each(["automotive", "thermomotive"])("keeps adjective, noun and verb context around %s", word => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize(`The ${word} device works.`, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(word === "automotive" ? "ˌɔtəˈmoʊtɪv" : "ˌθɝməˈmoʊtɪv");
      expect(tokens.filter(token => token.word !== word).map(token => token.phoneme)).toEqual(["ðə", "dɪˈvaɪs", "wɝks", "."]);
      expect(engine.predict(word, "en-US", "ADJ")).toBe(tokens.find(token => token.word === word)?.phoneme);
      const annotated = new EnglishG2P({ disableDict }), originalTag = annotated.tagWord.bind(annotated);
      annotated.tagWord = (target, context) => target === word ? { pos: "ADJ", confidence: 1 } : originalTag(target, context);
      expect(createPhonemizer({ processors: [annotated] }).phonemize(`The ${word} device works.`, { language: "en-US", returnArray: true })).toEqual(tokens);
    });
  });

  test("preserves a caller-owned compound component", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("motive", "ˈmoʊtɪv");
    expect(engine.predict("automotive")).toBe("ˌɔtoʊˈmoʊtɪv");
  });

  test("preserves the neighboring noun/adjective/verb readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize("The record is active. They record the signal.", { language: "en-US", returnArray: true });
    expect(tokens.filter(token => token.word === "record").map(token => token.phoneme)).toEqual(["ˈɹɛkɝd", "ɹɪˈkɔɹd"]);
    expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
  });

  // Table eviction must not erase the vouched inner compound after a prefix.
  test("preserves the full combining-head vowel under privative non-", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("nonautomotive")).toBe("nɑnˌɔtəˈmoʊtɪv");
  });

})();

// Original suite: en-named-subject-tense.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge: a singular name requires third-person -s in the present indicative.
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  describe("singular named subjects and finite tense", () => {
    it.each([
      ["Mary read the book.", "ɹɛd"],
      ["At the meeting, Mary read the report.", "ɹɛd"],
      ["Mary quickly read the report.", "ɹɛd"],
      ["Mary has read the book.", "ɹɛd"],
      ["Mary can read the book.", "ɹid"],
      ["They read the book daily.", "ɹid"],
      ["The Smiths read the book daily.", "ɹid"],
      ["I suggest Mary read the book.", "ɹid"],
      ["I insist that Mary read the book.", "ɹid"],
      ["For Mary read the next paragraph.", "ɹid"],
      ["Mary, read the next paragraph.", "ɹid"],
      ["Mary has a read of the book.", "ɹid"],
    ])("preserves the reading in %s", (sentence, ipa) => {
      const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(out.find(token => token.word === "read")?.phoneme).toBe(ipa);
    });
    it("preserves present agreement and neighboring adjective/noun readings", () => {
      const out = api.phonemize("Mary reads the elaborate record.", { language: "en-US", returnArray: true });
      expect(out.find(token => token.word === "reads")?.phoneme).toBe("ɹidz");
      expect(out.find(token => token.word === "elaborate")?.phoneme).toMatch(/ˈɫæb.*ət$/);
      expect(out.find(token => token.word === "record")?.phoneme).toBe("ˈɹɛkɝd");
    });
  });

})();

// Original suite: en-nano-combining-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("nano- combining prefix in rules-only composition", () => {
    const g2p = new EnglishG2P({ disableDict: true });

    it.each([
      ["nanotechnology", "ˌnænoʊtɛkˈnɑɫədʒi"],
      // The standard-source check covers the singular; keep the plural as a
      // morphology control so the combining-prefix branch does not capture it.
      ["nanotechnologies", "ˌnænoʊtɛkˈnɑɫədʒiz"],
      ["nanometer", "ˈnænoʊˌmitɝ"],
      ["nanosecond", "ˈnænoʊˌsɛkənd"],
    ])("composes %s without overriding inflection", (word, ipa) => {
      expect(g2p.predict(word)).toBe(ipa);
    });
  });

})();

// Original suite: en-narrative-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("narrative US root vowel", () => {
    it.each([false, true])("keeps the sourced US DRESS vowel in isolated and sentence routes (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const expected = disableDict ? "ˈnɛɹətɪv" : "ˈnæɹətɪv";
      expect(engine.predict("narrative", "en-US", "NN")).toBe(expected);
      expect(engine.predict("narrative", "en-US", "JJ")).toBe(expected);
      expect(engine.predict("narratives", "en-US", "NNS")).toBe(`${expected}z`);


      const tokens = englishTokens(engine, "The narrative includes several narratives.");
      expect(tokens.find(token => token.word.toLowerCase() === "narrative")?.phoneme).toBe(expected);
      expect(tokens.find(token => token.word.toLowerCase() === "narratives")?.phoneme).toBe(`${expected}z`);
    });
  });

})();

// Original suite: en-nasal-and-hard-g.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("nasal roots and hard g (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("STRUT before a nasal retains its root through suffixes", () => {
      for (const word of ["come", "comes", "coming", "become", "some", "done", "none", "honey", "money", "moneys", "color", "colour", "dozen", "oven", "onion"])
        expect(g2p.predict(word)).toMatch(/[ʌə][lɫmnvz]/);
      for (const word of ["home", "dome", "gnome", "cone", "bone", "tone", "phone", "chromosome"])
        expect(g2p.predict(word)).toContain("oʊ");
    });

    test("native come/some joins leave vowel-ending loan linkers alone", () => {
      expect(g2p.predict("welcome")).toMatch(/k[ʌə]m$/);
      expect(g2p.predict("threesome")).toMatch(/s[ʌə]m$/);
      expect(g2p.predict("chromosome")).toContain("oʊm");
      expect(g2p.predict("jacome")).toContain("oʊm");
      for (const word of ["over", "oval", "omen", "frozen"])
        expect(g2p.predict(word)).toContain("oʊ");
    });

    test("closed -oll roots contrast with medial doubled l and weak names", () => {
      for (const word of ["roll", "rolls", "rolled", "rolling", "roller", "poll", "polled", "polling", "toll", "scroll", "troll", "stroll"])
        expect(g2p.predict(word)).toContain("oʊ");
      for (const word of ["doll", "dollar", "pollen", "pollyanna", "trolley", "hollow"])
        expect(g2p.predict(word)).toMatch(/[ɑɔ][lɫ]/);
      expect(g2p.predict("carroll")).not.toContain("oʊ");
    });

    test("a primary-stressed transposed silent-e rime lengthens its root", () => {
      expect(g2p.predict("acre")).toContain("eɪ");
      expect(g2p.predict("fibre")).toContain("aɪ");
      expect(g2p.predict("sabre")).toContain("eɪ");
      expect(g2p.predict("massacre")).not.toContain("eɪ");
      expect(g2p.predict("litre")).not.toContain("aɪ");
      expect(g2p.predict("timbre")).not.toContain("aɪ");
    });

    test("the bound mit root yields primary stress after weak prefixes", () => {
      for (const word of ["admit", "commit", "submit"])
        expect(g2p.predict(word)).toMatch(/ˈmɪt$/);
      expect(g2p.predict("admit")).toMatch(/^əd/);
      expect(g2p.predict("permit")).toMatch(/^ˈpɝ/);
      for (const word of ["summit", "hermit", "vomit"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
    });

    test("trans- front-vowel voicing preserves m/back-vowel contrasts", () => {
      for (const word of ["transaction", "transit", "transistor", "transitory"])
        expect(g2p.predict(word)).toMatch(/n[ˈˌ]?z/);
      for (const word of ["transmission", "transom", "transport"])
        expect(g2p.predict(word)).toMatch(/n[ˈˌ]?s/);
    });

    test("native hard-g frames survive root eviction and doubled suffixes", () => {
      for (const word of ["get", "gets", "getting", "getter", "gear", "gears", "geek", "geeks", "gig", "gigs", "gigging", "giggle"])
        expect(g2p.predict(word)).toMatch(/^ˈ?ɡ/);
      for (const word of ["gem", "germ", "gentle", "general", "gesture", "giant", "giraffe"])
        expect(g2p.predict(word)).toMatch(/^ˈ?dʒ/);
    });

    test("giv- keeps short i at an opened syllable boundary", () => {
      for (const word of ["give", "gives", "given", "giving"])
        expect(g2p.predict(word)).toMatch(/^ˈ?ɡɪv/);
      expect(g2p.predict("thanksgiving")).toContain("ɡɪv");
      expect(g2p.predict("gift")).toMatch(/^ˈ?ɡɪft/);
      expect(g2p.predict("gibe")).toContain("dʒaɪb");
    });

    test("root sh+oe has GOOSE while medial and sch spellings stay distinct", () => {
      for (const word of ["shoe", "shoes", "shoed", "shoeing", "shoestring"])
        expect(g2p.predict(word)).toMatch(/^ˈ?ʃu/);
      expect(g2p.predict("washoe")).toContain("oʊ");
      expect(g2p.predict("poem")).toContain("oʊə");
    });

    test("a single-onset -ire root retains the careful rhotic nucleus", () => {
      for (const word of ["fire", "fires", "hire", "hired", "tire", "tired", "wire", "wired"])
        expect(g2p.predict(word)).toContain("aɪɝ");
      expect(g2p.predict("vampire")).toContain("aɪɹ");
      expect(g2p.predict("spire")).toContain("aɪɹ");
    });

    test("suffix reduction leaves complete stressed roots intact", () => {
      for (const word of ["less", "est", "fence", "dense", "hence", "tense", "expense", "dispense", "pretense"])
        expect(g2p.predict(word)).toContain("ɛ");
      for (const word of ["prince", "since", "mince", "rinse", "quince"])
        expect(g2p.predict(word)).toContain("ɪns");
      expect(g2p.predict("reference")).toContain("əns");
      expect(g2p.predict("careless")).toMatch(/[lɫ]əs$/);
      expect(g2p.predict("greatest")).toContain("əst");
    });

    test("th-/wh- SQUARE rimes leave other onsets alone", () => {
      for (const word of ["there", "where"])
        expect(g2p.predict(word)).toContain("ɛɹ");
      expect(g2p.predict("here")).toContain("ɪɹ");
      expect(g2p.predict("were")).not.toContain("ɛɹ");
    });

    test("verified inflected compounds beat invented silent-e stems", () => {
      expect(g2p.predict("caregiving")).toMatch(/kɛɹ.*ɡɪvɪŋ$/);
      expect(g2p.predict("lifesaving")).toContain("ɫaɪf");
      expect(g2p.predict("probed")).toMatch(/pɹoʊbd$/);
      expect(g2p.predict("proposed")).toMatch(/pɹəˈpoʊzd$/);
      expect(g2p.predict("downgrading")).toMatch(/ˈɡɹeɪdɪŋ$/);
      expect(g2p.predict("unfenced")).toMatch(/ˈfɛnst$/);
      for (const word of ["seething", "soothing", "teething", "farthing"])
        expect(g2p.predict(word)).toContain("ðɪŋ");
    });
  });

  test("public API retains root behavior and both invite readings", () => {
    expect(toIPA("get")).toMatch(/^ˈ?ɡɛt$/);
    expect(toIPA("shoe")).toContain("ʃu");
    // Cambridge US gives /ˈnuːˌkʌm.ɚ/, preserving the stressed STRUT vowel.
    expect(toIPA("newcomer")).toContain("kʌmɝ");
    expect(toIPA("polled")).toContain("poʊ");
    expect(toIPA("pony")).toContain("oʊ");
    expect(toIPA("transsexual")).toMatch(/n[ˈˌ]?s/);
    const g2p = new EnglishG2P();
    expect(g2p.predict("invite", "en", "N")).toMatch(/^ˈɪn/);
    expect(g2p.predict("invite", "en", "V")).toMatch(/ˈvaɪt$/);
    expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
  });

})();

// Original suite: en-nasal-ile-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  // MW juvenile, senile and penile independently attest the final PRICE reading.
  describe.each([false, true])("nasal ile roots, rules=%s", (disableDict) => {
    test.each([undefined, "N", "ADJ", "V"])("preserves the root for caller POS %s", (pos) => {
      const engine = new EnglishG2P({ disableDict });
      for (const word of ["juvenile", "penile", "senile"])
        expect(engine.predict(word, "en-US", pos)).toMatch(/naɪɫ$/);
    });

    test.each(["juvenile", "penile", "senile"])("composes after target eviction: %s", (root) => {
      const engine = new EnglishG2P({ disableDict });
      // Exercise removal by the exception miner without modifying generated tables.
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      delete dictionary[root];
      Object.defineProperty(engine, "dictionary", { value: dictionary });
      const bare = engine.predict(root);
      for (const suffix of ["s", "ness", "like"])
        expect(engine.predict(root + suffix)).toContain(bare);
      expect(engine.predict("non" + root)).toContain(bare);
    });

    test("retains caller-supplied root and target readings", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("vornil", "ˈvɔɹnɪl");
      engine.addPronunciation("juvenile", "ˈdʒuvənəl");
      expect(engine.predict("juvenile")).toBe("ˈdʒuvənəl");
      engine.addPronunciation("nonjuvenile", "ˈnɑndʒuvənəl");
      expect(engine.predict("nonjuvenile")).toBe("ˈnɑndʒuvənəl");
    });
  });

})();

// Original suite: en-near-superlatives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/phonotactics") = require("../src/en/phonotactics");
  const { applyPhonotactics } = __suiteModule1;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;

  describe.each([false, true])("NEAR superlatives, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([
      ["near", "ˈnɪɹ"], ["dear", "ˈdɪɹ"],
      ["nearest", "ˈnɪɹəst"], ["dearest", "ˈdɪɹəst"],
      ["sheerest", "ˈʃɪɹəst"], ["queerest", "ˈkwɪɹəst"],
      ["rarest", "ˈɹɛɹəst"],
    ])("retains the root vowel in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test("owns the root vowel independently of the weak suffix variant", () => {
      expect(engine.predict("clearest")).toMatch(/^ˈkɫɪɹ[əɪ]st$/);
      expect(engine.predict("fairest")).toMatch(/^ˈfɛɹ[əɪ]st$/);
      expect(engine.predict("surest")).toMatch(/^ˈʃʊɹ[əɪ]st$/);
      expect(engine.predict("bare")).toBe("ˈbɛɹ");
      expect(engine.predict("barest")).toBe("ˈbɛɹəst");
      expect(engine.predict("barer")).toBe("ˈbɛɹɝ");
      for (const word of ["dearestly", "dearestness", "dearest's"])
        expect(engine.predict(word)).toMatch(/^ˈdɪɹəst/);
    });
    test.each([
      ["forest", "ˈfɔɹəst"], ["harvest", "ˈhɑɹvəst"], ["honest", "ˈɑnəst"],
    ])("keeps lexical -est intact: %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test.each([
      ["The nearest shop is open.", "nearest", "ˈnɪɹəst"],
      ["This is my dearest friend.", "dearest", "ˈdɪɹəst"],
      ["She stood nearest to the door.", "nearest", "ˈnɪɹəst"],
      ["This is the rarest flower.", "rarest", "ˈɹɛɹəst"],
    ])("preserves adjective and adverb context in %s", (sentence, word, ipa) => {
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

  test("keeps other intervocalic r and incomplete morphology boundaries intact", () => {
    for (const [ipa, word] of [
      ["ˈhiɹɝ", "hearer"], ["ˈʃiɹɝ", "sheerer"],
      ["ˈhiɹoʊ", "hero"], ["ˈɹiɹəst", "rearrest"],
    ]) expect(applyPhonotactics(ipa, word)).toBe(ipa);
  });

  test("preserves neighboring verb and noun readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const target = (text: string, word: string) => api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    expect(target("They record the nearest station.", "record")).toBe("ɹɪˈkɔɹd");
    expect(target("The nearest record is here.", "record")).toBe("ˈɹɛkɝd");
  });

})();

// Original suite: en-negated-copular-controls.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  test("negated predicates preserve adjective, noun, passive and bare-verb readings", () => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)?.phoneme;
    expect(phone("The students are not content with the result.", "content")).toBe("kənˈtɛnt");
    expect(phone("The child is not upset with the teacher.", "upset")).toBe("əpˈsɛt");
    expect(phone("The teacher is not present in class.", "present")).toBe("ˈpɹɛzənt");
    expect(phone("The suitcase is not compact.", "compact")).toBe("kəmˈpækt");
    expect(phone("This is not abuse of power.", "abuse")).toBe("əˈbjus");
    expect(phone("The paper is not read in class.", "read")).toBe("ɹɛd");
    expect(phone("They do not read the book.", "read")).toBe("ɹid");
    expect(phone("The teacher does not present the lesson.", "present")).toBe("pɹɪˈzɛnt");
    expect(phone("This is not a record.", "record")).toBe("ˈɹɛkɝd");
    expect(engine.predict("upset", "en-US", "ADJ")).toBe("əpˈsɛt");
    expect(engine.predict("upset", "en-US", "N")).toBe("ˈʌpˌsɛt");
    expect(engine.predict("compact", "en-US", "ADJ")).toBe("kəmˈpækt");
    expect(engine.predict("compact", "en-US", "N")).toBe("ˈkɑmpækt");
    expect(engine.predict("compactly", "en-US")).toBe("kəmˈpæktɫi");
  });

})();

// Original suite: en-negative-adjective-acronym.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;
  test("recognizes a negative adjective before an acronym noun head", () => {
   const t = new SimplePOSTagger();
   for (const [word, acronym] of [["invalid", "ISBN"], ["unavailable", "TCP"], ["illegal", "PDF"], ["insensitive", "API"]]) expect(t.tagWord(word, ["an", acronym], { words: ["an", word, acronym], index: 1 }).pos).toBe("ADJ");
   for (const [word, following] of [["content", "CSV"], ["record", "JSON"], ["invalid", "employer"]]) expect(t.tagWord(word, ["a", following], { words: ["a", word, following], index: 1 }).pos).toBe("N");
  });
  test("keeps invalid adjective and patient-noun readings in full sentences", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   const ipa = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)!.phoneme;
   for (const sentence of ["It is an invalid ISBN.", "The invalid ID was rejected."]) expect(ipa(sentence, "invalid")).toMatch(/ˈvæ/);
   for (const sentence of ["The invalid employer spoke.", "He became a permanent invalid.", "He became a confirmed invalid, but he worked.", "He was a prominent invalid."]) expect(ipa(sentence, "invalid")).toMatch(/^ˈɪn/);
   for (const sentence of ["They declared a document invalid.", "They marked a component invalid.", "They deemed a president invalid.", "Was a document invalid?", "Why was a document invalid?", "They found a seed invalid.", "They found a breed invalid."]) expect(ipa(sentence, "invalid")).toMatch(/ˈvæ/);
   expect(ipa("A content CSV was saved.", "content")).toMatch(/^ˈkɑ/);
  });
  test("keeps repeated adjective and noun occurrences independent", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   const words = api.phonemize("They rejected an invalid ISBN and assisted a permanent invalid.", { language: "en-US", returnArray: true }).filter(t => t.word === "invalid");
   expect(words).toHaveLength(2);
   expect(words[0].phoneme).toMatch(/ˈvæ/);
   expect(words[1].phoneme).toMatch(/^ˈɪn/);
   expect(words[0].position).toBeLessThan(words[1].position);
  });

})();

// Original suite: en-negative-prefix-ed-allomorph.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("negative-prefix /tɪd/ ending, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it("restores the regular -ed vowel in un-, dis- and non- morphology", () => {
      for (const word of [
        "uncollected", "unlimited", "unexpected", "uncharted", "discontented", "disinvited",
      ]) expect(engine.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/tɪd$/);
    });

    it("preserves plain -ed controls and prefixed stems without a matching suffix", () => {
      for (const word of ["unwanted", "unlisted", "painted", "wanted"])
        expect(engine.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/tɪd$/);
    });

    it("keeps an evicted polysyllabic verb root available under un- + -ed", () => {
      expect(engine.predict("unheralded", "en")).toBe("ənˈhɛɹəɫdɪd");
    });
  });

  it("keeps negative-prefix -ed readings in complete sentences", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const sentence = "The unexpected storm left an unlimited flood and an uncollected notice.";
    const tokens = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true });
    for (const word of ["unexpected", "unlimited", "uncollected"])
      expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(/tɪd$/);
  });

})();

// Original suite: en-neutral-compound-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("neutral compound boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("wise and hood retain a silent-e root and restore adjective y", () => {
      for (const word of ["likewise", "likelihood", "likelihoods"])
        expect(g2p.predict(word)).toMatch(/^ˈɫaɪk/);
      for (const word of ["livelihood", "livelihoods"])
        expect(g2p.predict(word)).toMatch(/^ˈɫaɪv/);
      expect(g2p.predict("priesthood")!.replace(/[ˈˌ]/g, "")).toMatch(/sthʊd$/);
      expect(g2p.predict("anticlockwise")).toMatch(/ˈkɫɑk/);
      expect(g2p.predict("lengthwise")).toMatch(/ŋθ/);
    });

    test("a particle compound keeps its silent-e root across plural boundaries", () => {
      for (const word of ["makeup", "makeups"])
        expect(g2p.predict(word)).toMatch(/^ˈmeɪˌ?k/);
      for (const word of ["wakeup", "wakeups"])
        expect(g2p.predict(word)).toMatch(/^ˈweɪˌ?k/);
      for (const word of ["takeoff", "takeoffs", "takeout", "takeouts", "takeover", "takeovers"])
        expect(g2p.predict(word)).toMatch(/^ˈteɪˌ?k/);
      expect(g2p.predict("lacerate")).toMatch(/^ˈɫæs/);
      expect(g2p.predict("pageant")).toMatch(/^ˈpædʒ/);
    });

    test("a superlative ng retains the stop while soft nge and bound prefixes remain", () => {
      for (const word of ["longest", "strongest", "youngest"])
        expect(g2p.predict(word)).toMatch(/ŋɡəst$/);
      for (const word of ["strangest", "congest", "ingest"])
        expect(g2p.predict(word)).toContain("dʒ");
    });

    test("Greek arch endings stay distinct from a native arch", () => {
      expect(g2p.predict("hierarchy")).toMatch(/^ˈhaɪ/);
      for (const word of ["anarchy", "monarchy", "oligarchy", "hierarchical"])
        expect(g2p.predict(word)).not.toContain("tʃ");
      for (const word of ["research", "starchy", "archer"])
        expect(g2p.predict(word)).toContain("tʃ");
    });
  });

})();

// Original suite: en-neutral-sequent-liquid-ance.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])("bound sequent and liquid-ance frames survive root eviction (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const key of Object.keys(dictionary)) if (/sequent|fragra|vibra/.test(key)) delete dictionary[key];
   Reflect.set(e, "dictionary", dictionary);
   for (const word of ["subsequent", "subsequents", "subsequently"]) expect(e.predict(word)).toMatch(/^ˈsʌbsəkwənt/);
   expect(e.predict("consequent")).toBe("ˈkɑnsəkwənt");
   expect(e.predict("sequence")).toMatch(/^ˈsi/); expect(e.predict("frequent")).toMatch(/^ˈfɹi/);
   for (const word of ["fragrance", "fragrances", "fragrant", "plagrance"]) expect(e.predict(word)).toContain("eɪɡɹ");
   for (const word of ["vibrance", "vibrant"]) expect(e.predict(word)).toContain("vaɪbɹ");
   expect(e.predict("fragment")).toContain("fɹæɡ"); expect(e.predict("balance")).toContain("bæɫ");
   expect(e.predict("remembrance")).toContain("ˈmɛm"); expect(e.predict("resemblance")).toContain("ˈzɛm");
   const api = createPhonemizer({ processors: [e] });
   const out = api.phonemize("They follow subsequent events in sequence and enjoy a fragrant fragrance.", { language: "en-US", returnArray: true });
   expect(out.find(t => t.word === "subsequent")!.phoneme).toMatch(/^ˈsʌbsə/);
   for (const token of out.filter(t => /^(fragrant|fragrance)$/.test(t.word))) expect(token.phoneme).toContain("fɹeɪɡɹ");
   expect(out.find(t => t.word === "follow")!.phoneme).toContain("fɑ");
  });
  test("caller-owned fragrance roots retain plural ownership", () => {
   const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("fragrance", "ˈtɛst");
   expect(e.predict("fragrances")).toBe("ˈtɛsts");
  });

})();

// Original suite: en-new-us-yod.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  describe("AmE/BrE yod in new", () => {
    it("uses the AmE no-yod reading for new without changing its derived controls", () => {
      const enUS = new EnG2P();
      expect(enUS.predict("new", "en-US")).toBe("ˈnu");
      expect(enUS.predict("news", "en-US")).toBe("ˈnuz");
      expect(enUS.predict("newly", "en-US")).toBe("ˈnuɫi");
      expect(enUS.predict("renew", "en-US")).toBe("ɹɪˈnu");
      expect(enUS.predict("newcomer", "en-US")).toBe("ˈnuˌkʌmɝ");
      expect(enUS.predict("newcomers", "en-US")).toBe("ˈnuˌkʌmɝz");
    });

    it("retains British yod through the existing dialect transform", () => {
      const enGB = new EnG2P({ dialect: "en-GB" });
      expect(enGB.predict("new", "en-GB")).toBe("ˈnju");
      expect(enGB.predict("news", "en-GB")).toBe("ˈnjuz");
    });
  });

})();

// Original suite: en-nitroge-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("nitroge- keeps the nitrogen root's PRICE vowel", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["nitrogen", "ˈnaɪtɹədʒən"],
      ["nitrogenous", "naɪˈtɹɑdʒənəs"],
    ])("uses PRICE in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["nitro", "ˈnɪtɹoʊ"],
      ["nitrous", "ˈnɪtɹəs"],
      ["nitrocellulose", "ˌnɪtɹəˈsɛɫəˌɫoʊz"],
    ])("keeps other nitro- words unchanged: %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("preserves the noun and adjective readings in sentence context", () => {

      const tokens = englishTokens(rules, "Nitrogen supports nitrogenous compounds.");
      expect(tokens.find(token => token.word === "Nitrogen")?.phoneme).toBe("ˈnaɪtɹədʒən");
      expect(tokens.find(token => token.word === "nitrogenous")?.phoneme).toBe("naɪˈtɹɑdʒənəs");
    });

    it("preserves the dictionary-backed pronunciation", () => {
      expect(new EnglishG2P().predict("nitrogen", "en-US")).toBe("ˈnaɪtɹədʒən");
    });
  });

})();

// Original suite: en-nominal-base-form.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const sentences = [
    "The AGC had a 16-bit read bus and a 16-bit write bus.",
    "Not all email applications or services support read receipts, and users can generally disable the functionality if they so wish.",
    "Current DNA sequencing technologies, including NGS, are limited on the basis that genomes are much larger than any read length.",
    "TPMmuckraker has attempted to organize its readers to plow through and read document dumps by governmental entities engaging in cover-ups.",
    "Some skills can only be taken by certain classes, such as Read Lips or Animal Empathy.",
  ];
  it.each(sentences)("keeps a shared base/noun reading before a nominal head: %s", sentence => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word.toLowerCase() === "read")?.phoneme).toBe("ɹid");
  });
  it.each([
    ["They read books every day.", "ɹid"],
    ["They read books yesterday.", "ɹɛd"],
    ["She read documents yesterday.", "ɹɛd"],
    ["The books were read by Alex.", "ɹɛd"],
    ["The book was read during the show.", "ɹɛd"],
    ["The words are often read as names.", "ɹɛd"],
    ["She is a well-read guide.", "ɹɛd"],
  ])("preserves the finite and participle reading: %s", (sentence, ipa) => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => /(?:^|-)read$/i.test(segment.word))?.phoneme).toMatch(new RegExp(ipa + "$"));
  });
  it("does not infer a noun POS or override a caller-supplied pronunciation", () => {
    const engine = new EnglishG2P();
    const words = ["support", "read", "receipts"];
    expect(engine.tagWord("read", { prev: "support", next: "receipts", sentence: { words, index: 1 } }).pos).toBe("!V");
    engine.addPronunciation("read", "ˈzɛmp");
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("They support read receipts.", { language: "en-US", returnArray: true }).find(segment => segment.word === "read")?.phoneme).toBe("ˈzɛmp");
  });

})();

// Original suite: en-nominal-subject.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;

  const cases: Array<[string, string, string]> = [
    ["The organization uses engines to work.", "uses", "V"],
    ["The department records notes for students.", "records", "V"],
    ["The organization uses vary.", "uses", "!V"],
    ["The department records are missing.", "records", "N"],
    ["The development costs figures are wrong.", "costs", "!V"],
    ["The recording news stories are vivid.", "news", "!V"],
  ];
  it.each(cases)("uses the complete agreeing clause: %s", (text, word, expected) => {
    const words = text.replace(/\./g, "").split(" "), index = words.indexOf(word);
    expect(new SimplePOSTagger().tagWord(word, [words[index - 1], words[index + 1]], { words, index }).pos).toBe(expected);
  });
  it("keeps contrasting noun and verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const [text, word, ipa] of [
      [cases[0][0], "uses", "ˈjuzəz"],
      [cases[1][0], "records", "ɹɪˈkɔɹdz"],
      [cases[2][0], "uses", "ˈjusəz"],
      [cases[3][0], "records", "ˈɹɛkɝdz"],
    ]) expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-noun-list-frame.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("a determined noun list supplies noun evidence", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const say = (sentence: string, word: string) =>
      api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme;
    expect(say("They used an adhesive, laminate, plug, and sealant.", "laminate")).toBe("ˈɫæmənət");
    expect(say("They will laminate the paper.", "laminate")).toBe("ˈɫæməˌneɪt");
    expect(say("The laminate was wet.", "laminate")).toBe("ˈɫæmənət");
    expect(say("They will record the tape.", "record")).toBe("ɹɪˈkɔɹd");
  });

})();

// Original suite: en-now-finite-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  it.each([
    ["I now read the article every day.", "read", "ɹid"],
    ["It now read 'Haldimand House'.", "read", "ɹɛd"],
    ["They would now read the notice.", "read", "ɹid"],
    ["It is now read by Alice.", "read", "ɹɛd"],
    ["I now record the details.", "record", "ɹɪˈkɔɹd"],
    ["The now-record speed is impressive.", "record", "ˈɹɛkɝd"],
    ["The now present difficulties are clear.", "present", "ˈpɹɛzənt"],
    ["She can now present the report.", "present", "pɹɪˈzɛnt"],
    ['The title is now "Record".', "Record", "ˈɹɛkɝd"],
    ["They now close the gate.", "close", "kɫoʊz"],
    ["The shops are now close to the station.", "close", "kɫoʊs"],
    ["She now lives in Canada.", "lives", "ɫɪvz"],
    ["Their lives are interesting.", "lives", "ɫaɪvz"],
    ["They now converse in Urdu.", "converse", "kənˈvɝs"],
    ["The converse is true.", "converse", "ˈkɑnvɝs"],
    ["The always articulate speaker is here.", "articulate", "ɑɹˈtɪkjəɫət"],
    ["They now articulate their needs.", "articulate", "ɑɹˈtɪkjəɫeɪt"],
    ["They now produce the goods.", "produce", "pɹəˈdus"],
    ["The fresh produce is here.", "produce", "ˈpɹoʊdus"],
  ])("preserves full finite and nominal context in %s", (sentence, word, ipa) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });

})();

// Original suite: en-now-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("MOUTH in the temporal now root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("uses /aʊ/ in now and nowadays", () => {
      expect(rules.predict("now", "en-US")).toBe("ˈnaʊ");
      expect(rules.predict("nowadays", "en-US")).toBe("ˈnaʊədeɪz");
    });

    it("keeps GOAT in the distinct know/snow and nowhere frames", () => {
      expect(rules.predict("know", "en-US")).toBe("ˈnoʊ");
      expect(rules.predict("snow", "en-US")).toBe("ˈsnoʊ");
      expect(rules.predict("nowhere", "en-US")).toBe("ˈnoʊˌwɛɹ");
      expect(rules.predict("nowaday", "en-US")).toBe("ˈnaʊəˌdeɪ");
    });

    it("preserves both readings in sentence context", () => {

      const tokens = englishTokens(rules, "Now, nowadays we know why.");
      expect(tokens.find(token => token.word === "Now")?.phoneme).toBe("naʊ");
      expect(tokens.find(token => token.word === "nowadays")?.phoneme).toBe("ˈnaʊədeɪz");
      expect(tokens.find(token => token.word === "know")?.phoneme).toBe("noʊ");
    });
  });

})();
