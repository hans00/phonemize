// Original suite: en-initial-th-content.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  function cold(disableDict: boolean) {
    const engine = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["thin", "thief", "thigh", "thaw", "thug", "thud", "high", "sigh", "weigh", "sleigh", "neigh"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary); return engine;
  }
  describe.each([false, true])("initial content th and vocalic gh roots after eviction, rules=%s", disableDict => {
    test("closed content rimes retain theta in citation and nonce forms", () => {
      const engine = cold(disableDict);
      for (const [word, ipa] of [["thin", "ˈθɪn"], ["thief", "ˈθif"], ["thigh", "ˈθaɪ"], ["thaw", "ˈθɔ"], ["thug", "ˈθʌɡ"], ["thud", "ˈθʌd"], ["thib", "ˈθɪb"]]) { expect(engine.predict(word)).toBe(ipa); expect(engine.predict(word.toUpperCase())).toBe(ipa); }
      for (const word of ["thinner", "thinnest", "thinly", "thinness", "thinned", "thinning", "thieflike", "thief's", "thawing", "thawed", "thuds", "thudded", "thibness"]) expect(engine.predict(word)).toMatch(/^ˈθ/);
    });
    test("vouched function/adverb words retain delta and boundary controls", () => {
      const engine = cold(disableDict);
      for (const word of ["then", "than", "them", "that", "their", "there", "this", "thus", "though", "thou", "thee", "thine", "thence"]) expect(engine.predict(word)).toMatch(/^ˈ?ð/);
      expect(engine.predict("through")).toMatch(/^ˈ?θ/);
      expect(engine.predict("THC")).toBe("ˈtiˈeɪtʃˈsi");
    });
    test("silent igh/eigh plurals use the real vowel coda, not written gh", () => {
      const engine = cold(disableDict);
      for (const [word, ipa] of [["highs", "ˈhaɪz"], ["sighs", "ˈsaɪz"], ["thighs", "ˈθaɪz"], ["weighs", "ˈweɪz"], ["sleighs", "ˈsleɪz"], ["zighs", "ˈzaɪz"]]) expect(engine.predict(word)).toBe(ipa.replace(/l/g, "ɫ"));
      for (const word of ["coughs", "laughs"]) expect(engine.predict(word)).toMatch(/fs$/);
      for (const word of ["rights", "lights"]) expect(engine.predict(word)).toMatch(/ts$/);
      for (const word of ["ice", "nice", "price"]) expect(engine.predict(word)).toMatch(/s$/);
      engine.addPronunciation("high", "ˈtɛst"); expect(engine.predict("highs")).toBe("ˈtɛsts");
    });
    test("noun, adjective and finite verb sentences preserve their own rimes", () => {
      const api = createPhonemizer({ processors: [cold(disableDict)] });
      for (const sentence of ["The thin thief felt a thud.", "They thin the crop.", "Then they thaw it.", "His thighs were sore.", "He sighs at the highs.", "She weighs the sleighs."]) {
        const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
        for (const token of out.filter(t => /^(thin|thief|thud|thaw|thighs)$/.test(t.word))) expect(token.phoneme).toMatch(/^ˈ?θ/);
        for (const token of out.filter(t => /^(sighs|highs|weighs|sleighs)$/.test(t.word))) expect(token.phoneme).toMatch(/z$/);
        for (const token of out.filter(t => t.word === "Then")) expect(token.phoneme).toMatch(/^ˈ?ð/);
      }
    });
  });
  test("default archaic and tense contrasts remain intact in full sentences", () => {
    const api = createPhonemizer({ processors: [cold(false)] });
    const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
    expect(pick("Thy thigh was sore.", "thy")).toBe("ðaɪ");
    expect(pick("Then she read the thin book yesterday.", "read")).toBe("ɹɛd");
    expect(pick("Then she will read the thin book.", "read")).toBe("ɹid");
  });

  // Decomposition may still need a lexical chunk even when that chunk is rule-exact.
  test.each([false, true])("rebuilt dependencies preserve apostrophe clipping, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("somethin'")?.replace(/[ˈˌ]/g, "")).toBe("sʌmθɪn");
    expect(engine.predict("somethin’")?.replace(/[ˈˌ]/g, "")).toBe("sʌmθɪn");
  });

  test("default phonetic spelling hints retain lexical uppercase chunks after rebuild", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const out = api.phonemize('Mr. Pastie ("PASS-tee") is a brand name pasty, a meat-and-potato turnover product.', { language: "en-US", returnArray: true });
    expect(out.find(token => token.word === "PASS")?.phoneme).toBe("pæs");
  });

  test("mid-vowel single-coda grammatical readings keep their voiced rule route", () => {
   const engine = new EnglishG2P({ disableDict: true });
   const api = createPhonemizer({ processors: [engine] });
   expect(engine.predict("thon")).toMatch(/^ˈ?ð/);
   expect(api.phonemize('Converse proposed the gender-neutral pronoun "Thon".', { language: "en-US", returnArray: true }).find(t => t.word === "Thon")?.phoneme).toMatch(/^ð/);
  });

})();

// Original suite: en-initialisms.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  describe("Dictionary-attested initialisms", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["c", "si"], ["h", "eɪtʃ"], ["q", "kju"],
      ["dvd", "dividi"], ["pdf", "pidiɛf"], ["bbc", "bibisi"],
      ["html", "eɪtʃtiɛmɛɫ"], ["usb", "juɛsbi"], ["cpu", "sipiju"],
    ])("reads %s as letter names", (word, expected) => {
      expect(phonemizer.toIPA(word).replace(/[ˈˌ\s]/g, "")).toBe(expected);
    });

    it.each([
      ["gas", "ˈɡæs"], ["disclosure", "dɪˈskɫoʊʒɝ"],
    ])("does not use initialisms as morphological parts of %s", (word, expected) => {
      expect(phonemizer.toIPA(word)).toBe(expected);
    });

    it.each([
      ["disclaim", "dɪˈskɫeɪm"], ["disclaimer", "dɪˈskɫeɪmɝ"],
      ["disclose", "dɪˈskɫoʊz"], ["disclosed", "dɪˈskɫoʊzd"],
      ["disclosing", "dɪˈskɫoʊzɪŋ"], ["disclosure", "dɪˈskɫoʊʒɝ"],
    ])("moves dis- /s/ into the /skl/ onset in %s", (word, expected) => {
      // Cambridge US gives disclosure /dɪˈskloʊʒɚ/; the class extends to the
      // same stressed discl- onset in the related verb and noun forms.
      expect(phonemizer.toIPA(word)).toBe(expected);
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it.each([
      ["hiv", "eɪtʃaɪvi"], ["irs", "aɪɑɹɛs"], ["usa", "juɛseɪ"],
      ["usda", "juɛsdi eɪ"], ["ins", "aɪɛnɛs"], ["api", "eɪpiaɪ"],
    ])("uses the registered spelling for rule-only %s", (word, expected) => {
      expect(rules.predict(word, "en")!.replace(/[ˈˌ]/g, "")).toBe(expected.replace(/ /g, ""));
      expect(rules.trace(word).steps[0].rule).toBe("initialism:registered");
    });

    it.each([
      ["aaa", "ˌtɹɪpəˈɫeɪ"], ["ieee", "ˌaɪˌtɹɪpɫəˈi"],
    ])("registers dictionary-backed triple-letter spelling %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
      expect(rules.trace(word).steps[0].rule).toBe("initialism:registered");
    });

    it("preserves triple-letter readings and neighboring lexical controls in a sentence", () => {

      const tokens = englishTokens(rules, "aaa and ieee work with gas and the app.");
      const phones = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");
      for (const [word, ipa] of [
        ["aaa", "ˌtɹɪpəˈɫeɪ"], ["ieee", "ˌaɪˌtɹɪpɫəˈi"],
        ["gas", "ˈɡæs"], ["app", "ˈæp"],
      ]) expect(phones(tokens.find(token => token.word === word)?.phoneme ?? "")).toBe(phones(ipa));
    });

    it.each([
      ["gas", "ˈɡæs"], ["app", "ˈæp"],
    ])("keeps unregistered lexical forms on spelling rules: %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it("reports the lexical path for an attested initialism", () => {
      expect(new EnglishG2P().trace("dvd").path).toBe("dictionary");
    });
  });

})();

// Original suite: en-inter-morph-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("inter/intra morphology (rules=%s)", disableDict => {
    it("keeps an existing adjectival root through the prefix", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("interracial")).toBe("ˌɪntɝˈɹeɪʃəɫ");
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize("The clever reader discussed interracial marriage.", { language: "en-US", returnArray: true }).find(t => t.word === "interracial")?.phoneme).toBe("ˌɪntɝˈɹeɪʃəɫ");
    });
    it("honors the caller root and explicit whole-word override", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("racial", "ˈzɛŋ");
      expect(engine.predict("interracial")).toContain("zɛŋ");
      engine.addPronunciation("interracial", "ˈkɛŋ");
      expect(engine.predict("interracial")).toBe("ˈkɛŋ");
    });
  });

})();

// Original suite: en-inverted-modal-adverbs.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { simplePOSTagger, inferVerbForm } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;

  it.each(["Can", "Will", "May", "Might", "Must", "Should", "Could", "Shall", "Would"])("retains the inverted subject in %s they freely present", modal => {
    const words = [modal, "they", "freely", "present", "?"];
    expect(simplePOSTagger.tagWord("present", ["freely", "?"], { words, index: 3 }).pos).toBe("V");
    expect(inferVerbForm({ words, index: 3 })).toBe("base");
  });

  it("applies to an unseen predicate with stacked adverbs", () => {
    const words = ["May", "we", "freely", "gladly", "zembriate", "?"];
    expect(simplePOSTagger.tagWord("zembriate", ["gladly", "?"], { words, index: 4 }).pos).toBe("V");
  });

  it("preserves an adjective and a noun beside the questioned verb", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize("Can they freely present the present record?", { language: "en-US", returnArray: true });
    expect(tokens.filter(t => ["present", "record"].includes(t.word)).map(t => t.phoneme))
      .toEqual(["pɹɪˈzɛnt", "ˈpɹɛzənt", "ˈɹɛkɝd"]);
  });

  it("retains nominal can, will and might frames", () => {
    for (const modal of ["can", "will", "might"]) {
      const words = ["The", "free", modal, "broadly", "present", "across", "cultures"];
      expect(simplePOSTagger.tagWord("present", ["broadly", "across"], { words, index: 4 }).pos).not.toBe("V");
    }
  });

})();

// Original suite: en-io-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule1;

  describe("two-nucleus io endings", () => {
    test("the slot before io owns the primary at three or more slots", () => {
      for (const word of ["portfolio", "scenario", "oratorio", "pistachio", "braggadocio", "antonio", "ontario"]) {
        const slots = syllabify(word);
        expect(assignStress(slots, word)).toBe(slots.length - 2);
      }
    });
    for (const disableDict of [false, true]) {
      const g = new EnglishG2P({ disableDict });
      const predict = (word: string) => g.predict(word, "en")!;
      test(`preserves the root primary through regular noun composition (${disableDict})`, () => {
        for (const [word, primary] of [["portfolio", /ˈfoʊ/], ["scenario", /ˈnɛɹ/], ["oratorio", /ˈtɔɹ/]] as const) {
          for (const form of [word, word + "s", word + "'s", word + "wise", "non" + word])
            expect(predict(form)).toMatch(primary);
          expect(predict("multi" + word)).toMatch(new RegExp(primary.source.replace("ˈ", "[ˈˌ]")));
        }
      });
      test(`keeps short io roots and other Latin endings (${disableDict})`, () => {
        for (const word of ["radio", "patio", "ratio", "studio", "audio", "video"])
          expect(predict(word)).toMatch(/^ˈ/);
        for (const word of ["mexico", "formula", "cinema"])
          expect(predict(word)).toMatch(/^ˈ/);
        expect(predict("america")).toMatch(/ˈmɛɹ/);
        for (const word of ["biology", "microbiology", "bacteriology", "epidemiology"])
          expect(predict(word)).toMatch(/ˈɑ[lɫ]/);
      });
    }
  });

})();

// Original suite: en-ion-derivative-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("ion derivative boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["practitioner", "partitioner", "positioner", "auctioner", "auctioneer"])("%s preserves palatal tion across the n onset", word => {
      expect(g2p.predict(word, "en")).toMatch(/ʃə[ˈˌ]?n/);
    });
    test.each(["missionary", "cessionary", "recessionary"])("%s preserves voiceless sion after s", word => {
      expect(g2p.predict(word, "en")).toMatch(/ʃə[ˈˌ]?n/);
    });
    test.each(["visionary", "illusionary", "exclusionary"])("%s preserves voiced sion", word => {
      expect(g2p.predict(word, "en")).toMatch(/ʒə[ˈˌ]?n/);
    });
    test.each(["stationery", "stationary"])("%s preserves the open-a root and strong final rime", word => {
      expect(g2p.predict(word, "en")).toMatch(/steɪʃəˌ?nɛɹi/);
    });
    test.each(["nutritionist", "revisionist", "conditioner", "dictionary", "functionary"])("%s preserves its existing ion reading", word => {
      expect(g2p.predict(word, "en")).toMatch(/[ʃʒ]ə[ˈˌ]?n/);
    });
  });

  test("a stressed io hiatus is not an unstressed ion ending", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict("cationic", "en")).not.toMatch(/ʃ/);
  });

  test("trace attributes the split suffix to its existing table rule", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    const trace = g2p.trace("practitioner");
    expect(trace.steps.some(step => step.grapheme === "tio" && step.phoneme === "ʃə" && step.rule.endsWith(":boundary"))).toBe(true);
  });

  test.each(["practitioner", "stationery"])("%s survives the public API", word => {
    expect(toIPA(word)).toMatch(/ʃə[ˈˌ]?n/);
  });

})();

// Original suite: en-ipa-plausibility.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const { inspectIpa } = __suiteModule0;

  describe("IPA-only English plausibility", () => {
    test.each(["ˈwɛbpɪdʒ", "ˈwɛbˌpeɪdʒ", "blɪk", "stɹɛŋkθs", "ˈbʌtn̩", "d͡ʒʌd͡ʒ", "kæts", "kæt dɔɡ"])("accepts an available structural reading of %s", ipa => {
      expect(inspectIpa(ipa).status).toBe("compatible");
    });
    test.each(["ʌɪ", "ʌʊ"])("raised diphthong %s stays one nucleus", diphthong => {
      const report = inspectIpa("ˈv" + diphthong);
      expect(report.status).toBe("compatible");
      expect(report.syllables.map(s => s.nucleus)).toEqual([diphthong]);
      expect(inspectIpa("ˈv" + diphthong + "ə").syllables).toHaveLength(2);
      expect(inspectIpa("ˈvɝi").syllables).toHaveLength(2);
    });
    test("retains IPA segments and stress without consulting spelling", () => {
      const report = inspectIpa("/ˈwɛbˌpeɪdʒ/");
      expect(report.syllables.map(s => [s.onset, s.nucleus, s.coda, s.stress])).toEqual([
        ["w", "ɛ", "b", "primary"], ["p", "eɪ", "dʒ", "secondary"],
      ]);
      expect(report.syllables.map(s => s.start)).toEqual([2, 6]);
    });
    test.each(["bnɪk", "ŋæ", "æh", "k.at"])("reports native-profile concerns, not malformed IPA: %s", ipa => {
      expect(inspectIpa(ipa).status).toBe("marked");
    });
    test.each(["", "ˈ", "̩n", "[kæt", "ˈˌkæt", "kæt.", "kæt/"])("reports malformed representation: %s", ipa => {
      expect(inspectIpa(ipa).status).toBe("malformed");
    });
    test("unsupported IPA remains distinct from malformed input", () => {
      expect(inspectIpa("xɑ").status).toBe("unsupported");
      expect(inspectIpa("n̥ɑ").status).toBe("unsupported");
    });
    test("diacritics cannot attach across a syllable or stress boundary", () => {
      for (const ipa of ["kæt.ːdɔɡ", "kætˈːdɔɡ", "kæt.̩dɔɡ", "kætˈ̩dɔɡ", "kæt.̃dɔɡ", "kæt.̥dɔɡ"]) {
        expect(inspectIpa(ipa).status).toBe("malformed");
      }
      expect(inspectIpa("kæːt.dɔɡ").status).toBe("compatible");
      expect(inspectIpa("ˈbʌtn̩").status).toBe("compatible");
      expect(inspectIpa("kæt.n̥ɑ").status).toBe("unsupported");
      expect(inspectIpa("n̥̥ɑ").status).toBe("unsupported");
      expect(inspectIpa("xːɑ").status).toBe("unsupported");
      expect(inspectIpa("x̩ɑ").status).toBe("unsupported");
      expect(inspectIpa("x.ːɑ").status).toBe("malformed");
    });
    test("uses the requested dialect and declares bounded search", () => {
      expect(inspectIpa("ˈbɒtəl", { dialect: "en-GB" }).status).toBe("compatible");
      expect(inspectIpa("ˈbɒtəl", { dialect: "en-US" }).status).toBe("marked");
      expect(inspectIpa("kætkætkæt", { maxStates: 1 }).status).toBe("undetermined");
      expect(() => inspectIpa("kæt", { maxStates: 0 })).toThrow(RangeError);
    });
    test("recognizes attested clusters without admitting unrelated onsets", () => {
      expect(inspectIpa("dɪˈskɫoʊz").status).toBe("compatible");
      expect(inspectIpa("ˈkɑɹɫ").status).toBe("compatible");
      expect(inspectIpa("ˈkɑɹɫz").status).toBe("compatible");
      expect(inspectIpa("ˈkɑɹɫ", { maxStates: 1 }).status).toBe("undetermined");
      expect(inspectIpa("ˈkɑɫɹ").status).toBe("marked");
      expect(inspectIpa("sknɪk").status).toBe("marked");
      expect(inspectIpa("ˈbɹɪskɫi").syllables.map(s => [s.onset, s.nucleus, s.coda])).toEqual([
        ["bɹ", "ɪ", "s"], ["kɫ", "i", ""],
      ]);
    });
    test("recognizes British coronal yod before GOOSE without changing the US profile", () => {
      for (const ipa of ["tjuːn", "djuː", "njuː"]) {
        expect(inspectIpa(ipa, { dialect: "en-GB" }).status).toBe("compatible");
        expect(inspectIpa(ipa, { dialect: "en-US" }).status).toBe("marked");
      }
      expect(inspectIpa("tjaɪ", { dialect: "en-GB" }).status).toBe("marked");
    });
  });

})();

// Original suite: en-isle-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the isle spelling family", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["isle", "ˈaɪɫ"],
      ["island", "ˈaɪɫənd"],
      ["islet", "ˈaɪɫət"],
    ])("keeps the silent-s / PRICE root in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["Iceland", "ˈaɪsˌɫænd"],
      ["Islam", "ˈɪsɫəm"],
      ["Islamic", "ɪˈsɫæmɪk"],
    ])("does not extend the isle root into %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["islands", "ˈaɪɫəndz"],
      ["island's", "ˈaɪɫəndz"],
      ["islander", "ˈaɪɫəndɝ"],
      ["isles", "ˈaɪɫz"],
    ])("preserves the existing morphology route for %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
      expect(rules.trace(word, "en-US").path).toBe("morphology");
    });
  });

})();

// Original suite: en-ist-reference-corrections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const dictionary = require("../data/en/dict.json");

  const corrected = [
    ["artist", "ˈɑɹtɪst"],
    ["tourist", "ˈtʊɹɪst"],
    ["specialist", "ˈspɛʃəɫɪst"],
    ["florist", "ˈfɫɔɹɪst"],
    ["florists", "ˈfɫɔɹɪsts"],
    ["baptist", "ˈbæptɪst"],
    ["terrorists", "ˈtɛɹɝɪsts"],
    ["journalist", "ˈdʒɝnəɫɪst"],
    ["dentists", "ˈdɛntɪsts"],
    ["communist", "ˈkɑmjənɪst"],
    ["therapist", "ˈθɛɹəpɪst"],
    ["chemists", "ˈkɛmɪsts"],
    ["tourists", "ˈtʊɹɪsts"],
    ["specialists", "ˈspɛʃəɫɪsts"],
    ["baptists", "ˈbæptɪsts"],
    ["baptists'", "ˈbæptɪsts"],
    ["communists", "ˈkɑmjənɪsts"],
    ["communists'", "ˈkɑmjənɪsts"],
    ["journalists", "ˈdʒɝnəɫɪsts"],
    ["journalists'", "ˈdʒɝnəɫɪsts"],
    ["specialists'", "ˈspɛʃəɫɪsts"],
  ] as const;

  describe("Cambridge US references for -ist words", () => {
    it.each(corrected)("%s follows the independently checked reference", (word, ipa) => {
      expect(dictionary[word]).toBe(ipa);
      expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
    });

    it.each(corrected.filter(([word]) => word !== "florists"))(
      "%s remains consistent with the general -ist rule path",
      (word, ipa) => {
        expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
      },
    );

    it.each([
      ["chemist", "ˈkɛmɪst"],
      ["scientist", "ˈsaɪəntɪst"],
      ["artists", "ˈɑɹtɪsts"],
    ])("preserves already-correct -ist controls: %s", (word, ipa) => {
      expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-ive-stem-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("-ivity retains a corresponding full vowel from the adjective without overriding reductions", () => {
    for (const disableDict of [false, true]) {
      const g = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"]) {
        expect(g.predict("festivity", "en-US", pos)).toMatch(/^fɛ/);
        expect(g.predict("relativity", "en-US", pos)).toMatch(/ɹɛ/);
        expect(g.predict("nativity", "en-US", pos)).toMatch(/^nə/);
        expect(g.predict("passivity", "en-US", pos)).toMatch(/^pə/);
      }
      expect(g.predict("festive")).toBe("ˈfɛstɪv");
      expect(g.predict("relative")).toBe("ˈɹɛɫətɪv");
      expect(g.predict("festivities")).toMatch(/^fɛ/);
      const p = createPhonemizer({ processors: [g] });
      for (const language of ["en-US", "en-GB"]) {
        const tokens = p.phonemize("Festivity and relativity invite festive and relative discussion.", { language, returnArray: true });
        expect(tokens.find(t => t.word === "Festivity")?.phoneme).toMatch(/^fɛ/);
        expect(tokens.find(t => t.word === "relativity")?.phoneme).toMatch(/ɹɛ/);
        expect(tokens.find(t => t.word === "festive")?.phoneme).toMatch(/fɛ/);
        expect(tokens.find(t => t.word === "relative")?.phoneme).toMatch(/ɹɛ/);
      }
    }
  });

  test("the adjective's caller-supplied vowel propagates through the aligned noun and plural", () => {
    for (const disableDict of [false, true]) {
      const g = new EnglishG2P({ disableDict });
      g.addPronunciation("festive", "ˈfɑstɪv");
      expect(g.predict("festivity")).toBe("fɑˈstɪvəti");
      expect(g.predict("festivities")).toBe("fɑˈstɪvətiz");
    }
  });

})();

// Original suite: en-ivity-schwa.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("-ivity composition preserves aligned root schwa", () => {
    const engine = new EnglishG2P({ disableDict: true });

    test("carries the weak nucleus through the sensitivity family", () => {
      expect(engine.predict("sensitive", "en-US")).toBe("ˈsɛnsətɪv");
      expect(engine.predict("sensitivity", "en-US")).toBe("ˌsɛnsəˈtɪvəti");
      expect(engine.predict("insensitivity", "en-US")).toBe("ˌɪnsɛnsəˈtɪvəti");
      expect(engine.predict("oversensitivity", "en-US")).toBe("ˌoʊvɝsɛnsəˈtɪvəti");
    });

    test("keeps lexical-base, stressed-vowel, and unrelated -ivity controls", () => {
      expect(engine.predict("hypersensitivity", "en-US")).toBe("ˌhaɪpɝsɛnsɪˈtɪvəti");
      expect(engine.predict("connectivity", "en-US")).toBe("ˌkɑnɛkˈtɪvəti");
      expect(engine.predict("productivity", "en-US")).toBe("ˌpɹɑdəkˈtɪvəti");
      expect(engine.predict("activity", "en-US")).toBe("ækˈtɪvəti");
    });

    test("keeps the corrected noun reading in full sentence contexts", () => {

      const cases = [
        ["Sensitivity is essential.", "sensitivity", "ˌsɛnsəˈtɪvəti"],
        ["The sensor’s sensitivity is high.", "sensitivity", "ˌsɛnsəˈtɪvəti"],
        ["They described oversensitivity and insensitivity.", "oversensitivity", "ˌoʊvɝsɛnsəˈtɪvəti"],
        ["They described oversensitivity and insensitivity.", "insensitivity", "ˌɪnsɛnsəˈtɪvəti"],
      ] as const;

      for (const [sentence, target, expected] of cases) {
        const tokens = englishTokens(engine, sentence);
        expect(tokens.find(token => token.word.toLowerCase() === target)?.phoneme).toBe(expected);
      }
    });
  });

})();

// Original suite: en-labial-ear.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("ear after a labial onset, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["wear", "ˈwɛɹ"], ["swear", "ˈswɛɹ"],
      ["wearing", "ˈwɛɹɪŋ"], ["swearing", "ˈswɛɹɪŋ"],
      ["wearer", "ˈwɛɹɝ"], ["wears", "ˈwɛɹz"],
      ["bear", "ˈbɛɹ"], ["pear", "ˈpɛɹ"],
      ["spear", "ˈspɪɹ"], ["shear", "ˈʃɪɹ"],
    ])("retains the inflection and contrasting onset: %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves the NEAR nucleus before an unrelated y ending", () => {
      expect(engine.predict("weary")).toMatch(/w[ɪi]ɹi$/);
    });
    it("honors whole-target caller pronunciation", () => {
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("swearable", "ˈzɛŋ");
      expect(own.predict("swearable")).toBe("ˈzɛŋ");
    });
    it.each([
      ["They wear the badge.", "wear", "wɛɹ"],
      ["Their wear was clear.", "wear", "wɛɹ"],
      ["She will swear before the judge.", "swear", "swɛɹ"],
    ])("keeps full sentence POS controls: %s", (sentence, word, ipa) => {
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-labial-rimes-and-sch.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("labial rimes and Greek sch (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test("labial ull/ush keeps short u across suffixes", () => {
      for (const word of ["bull", "bullet", "bullion", "bullish", "full", "fully", "pull", "pulled", "pulling", "push", "pushed", "pushing", "bush", "bushes"])
        expect(g2p.predict(word)).toMatch(/[bfp]ʊ/);
      for (const word of ["dull", "null", "skull", "brush", "blush"])
        expect(g2p.predict(word)).not.toContain("ʊ");
    });
    test("oo distinguishes long, short and unrounded labial rimes", () => {
      for (const word of ["food", "foods", "mood", "moody"])
        expect(g2p.predict(word)).toMatch(/[fm]u/);
      for (const word of ["blood", "bloody", "flood", "flooded", "flooding"])
        expect(g2p.predict(word)).toMatch(/[bf][lɫ][ʌə]/);
      for (const word of ["wood", "woods", "wooden", "wool", "woolen", "foot", "footage", "footed"])
        expect(g2p.predict(word)).toMatch(/[wf]ʊ/);
      for (const word of ["school", "pool", "tool", "boot", "root"])
        expect(g2p.predict(word)).toContain("u");
    });
    test("own contrasts with the diphthong in down and owd", () => {
      for (const word of ["own", "owned", "owning", "owner", "known", "grown", "shown", "thrown", "blown", "flown"])
        expect(g2p.predict(word)).toContain("oʊ");
      for (const word of ["down", "town", "brown", "crown", "frown", "crowd", "crowded", "powder"])
        expect(g2p.predict(word)).toContain("aʊ");
    });
    test("Greek sch preserves the Germanic spellings", () => {
      for (const word of ["school", "schools", "schooling", "scheme", "schemes", "scheming", "schema", "schematic", "scholar", "scholarly"])
        expect(g2p.predict(word)).toMatch(/^[ˈˌ]?sk/);
      for (const word of ["schmidt", "schmaltz", "scholl", "schook", "schoonover", "schemel", "scholten"])
        expect(g2p.predict(word)).toMatch(/^[ˈˌ]?ʃ/);
    });
    test("recognized prefix roots survive exception eviction", () => {
      expect(g2p.predict("unknown")).toMatch(/[ʌə]nˈnoʊn/);
      for (const word of ["preschool", "preschools", "preschooler", "preschooling", "reschool"])
        expect(g2p.predict(word)).toContain("sku");
    });
    test("restored fe plurals keep v-stem verbs distinct", () => {
      expect(g2p.predict("knives")).toMatch(/naɪvz/);
      expect(g2p.predict("wives")).toMatch(/waɪvz/);
      expect(g2p.predict("gives")).toMatch(/ɡɪvz/);
      expect(g2p.predict("hives")).toMatch(/haɪvz/);
    });
  });

  test("public API uses the same root rimes", () => {
    for (const [word, pattern] of [["school", /sku/], ["knives", /naɪvz/], ["blood", /b[lɫ][əʌ]/]] as const)
      expect(toIPA(word)).toMatch(pattern);
  });

})();

// Original suite: en-language-velar-stop.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("language's velar stop", () => {
    const dictionary = new EnglishG2P();
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps /ɡ/ in the source dictionary reading and rule reading", () => {
      expect(dictionary.predict("language", "en-US")).toBe("ˈɫæŋɡwɪdʒ");
      expect(rules.predict("language", "en-US")).toBe("ˈɫæŋɡwɪdʒ");
    });

    it.each([
      ["languid", "ˈɫæŋɡwəd"],
      ["languish", "ˈɫæŋɡwɪʃ"],
    ])("preserves the neighboring <ngu> reading in %s", (word, expected) => {
      expect(dictionary.predict(word, "en-US")).toBe(expected);
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-late-nasal-assimilation.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("late velar assimilation (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["anchor", "ˈæŋkɝ"], ["anchors", "ˈæŋkɝz"], ["anchor's", "ˈæŋkɝz"],
      ["anchored", "ˈæŋkɝd"], ["anchoring", "ˈæŋkɝɪŋ"],
      ["anchorages", "ˈæŋkɝədʒəz"],
      ["ranch", "ˈɹæntʃ"], ["rancher", "ˈɹæntʃɝ"], ["french", "ˈfɹɛntʃ"],
      ["include", "ɪnˈkɫud"], ["uncover", "ənˈkʌvɝ"], ["engage", "ɛnˈɡeɪdʒ"],
      ["conquest", "ˈkɑŋkwɛst"], ["engel", "ˈɛnɡəɫ"],
    ])("preserves the native root or boundary of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains the velar nasal in the derived age frame", () => {
      expect(engine.predict("anchorage")).toMatch(/^ˈæŋkɝ[əɪ]dʒ$/);
    });
    it("retains the nasal in con + qu", () => {
      expect(engine.predict("conquer")).toContain("ŋk");
    });
    it("keeps late assimilation in an OOV prefix composition", () => {
      expect(engine.predict("unanchor")).toContain("æŋkɝ");
    });
    it("preserves caller-owned roots and allomorphs", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("anchor", "ˈzɛŋ");
      for (const [word, ipa] of [["anchor", "ˈzɛŋ"], ["anchors", "ˈzɛŋz"],
        ["anchor's", "ˈzɛŋz"], ["anchored", "ˈzɛŋd"], ["anchoring", "ˈzɛŋɪŋ"]])
        expect(custom.predict(word)).toBe(ipa);
    });
    it("preserves other noun, adjective and verb readings in a full sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will work and anchor the boat.");
      for (const [word, ipa] of [["anchor", "ˈæŋkɝ"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-latinate-adjective-composition.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("Latinate adjective composition (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["separately", "adequately", "alternately", "deliberately", "moderately", "intimately", "disproportionately", "inordinately", "approximately"])("%s uses the weak adjective ending", word => {
      expect(g2p.predict(word, "en")).toMatch(/ətɫi$/);
    });
    test("appropriately retains a supplied weak-vowel variant", () => {
      expect(g2p.predict("appropriately", "en")).toMatch(disableDict ? /ətɫi$/ : /(?<![eaɔ])[əɪ]tɫi$/);
    });
    test.each(["innately", "ornately", "sedately", "lately", "stately"])("%s retains stressed or short ate", word => {
      expect(g2p.predict(word, "en")).toMatch(/eɪtɫi$/);
    });
    test.each(["original", "originally", "aboriginal"])("%s places stress in the extended word", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɝˈɪdʒənəɫ/);
    });
    test.each(["attitudinal", "latitudinal", "longitudinal"])("%s places primary stress on the long root", word => {
      expect(g2p.predict(word, "en")).toMatch(/ˈtudənəɫ$/);
    });
    test("intramarginal retains stress on the extended root", () => {
      expect(g2p.predict("intramarginal", "en")).toMatch(/ˈmɑɹdʒ[əɪ]nəɫ$/);
    });
    test("abdominal keeps the lax root vowel in its extended context", () => {
      expect(g2p.predict("abdominal", "en")).toMatch(/ˈdɑmənəɫ$/);
    });
    test.each(["retinal", "criminal", "terminal", "marginal"])("%s keeps the shorter root's initial stress", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ˈ/);
    });
    test.each(["crucial", "crucially"])("%s retains the high open u before cial", word => {
      expect(g2p.predict(word, "en")).toMatch(/kɹuʃəɫ/);
    });
    test.each([["racial", /ɹeɪʃəɫ/], ["special", /spɛʃəɫ/], ["initial", /ˈnɪʃəɫ/], ["martial", /mɑɹʃəɫ/]] as const)("%s keeps a contrasting suffix boundary", (word, owned) => {
      expect(g2p.predict(word, "en")).toMatch(owned);
    });
  });

  test.each([["separately", /ətɫi$/], ["originally", /ɝˈɪdʒənəɫ/], ["crucially", /kɹuʃəɫ/]] as const)("%s reaches the public API", (word, owned) => {
    expect(toIPA(word)).toMatch(owned);
  });

})();

// Original suite: en-legisl-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const rules = new EnglishG2P({ disableDict: true });

  describe("legisl- derivational allomorph", () => {
    it.each([
      ["legislation", "ˌɫɛdʒəˈsɫeɪʃən"],
      ["legislative", "ˈɫɛdʒəˌsɫeɪtɪv"],
      ["legislator", "ˈɫɛdʒəˌsɫeɪtɝ"],
      ["legislature", "ˈɫɛdʒəˌsɫeɪtʃɝ"],
    ])("renders %s with the weak root vowel", (word, ipa) => {
      expect(rules.predict(word)).toBe(ipa);
    });

    it.each([
      ["legislate", "ˈɫɛdʒɪˌsɫeɪt"],
      ["legislates", "ˈɫɛdʒɪˌsɫeɪts"],
      ["legislations", "ˌɫɛdʒəˈsɫeɪʃənz"],
      ["legislatures", "ˈɫɛdʒəˌsɫeɪtʃɝz"],
      ["legislatives", "ˈɫɛdʒəˌsɫeɪtɪvz"],
    ])("preserves the neighboring %s route", (word, ipa) => {
      expect(rules.predict(word)).toBe(ipa);
    });
  });

  describe("rule-exact -ative plural stems", () => {
    it.each([
      ["alternatives", "ɔɫˈtɝnətɪvz"],
      ["negatives", "ˈnɛɡətɪvz"],
    ])("keeps the singular rule reading in %s", (word, ipa) => {
      expect(rules.predict(word)).toBe(ipa);
    });
  });

})();

// Original suite: en-lexical-ed-adjectives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("lexical adjectives ending in -ed", () => {
    const shipped = new EnglishG2P();
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["naked", "ˈneɪkɪd"],
      ["wicked", "ˈwɪkɪd"],
      ["crooked", "ˈkɹʊkɪd"],
    ])("uses the standard lexical reading for %s", (word, expected) => {
      expect(shipped.predict(word, "en-US")).toBe(expected);
    });

    it("preserves the verb reading when caller POS selects it", () => {
      expect(shipped.predict("wicked", "en-US", "V")).toBe("wɪkt");
      expect(rules.predict("wicked", "en-US", "V")).toBe("wɪkt");
    });

    it.each([
      ["marked", "ˈmɑɹkt"],
      ["baked", "ˈbeɪkt"],
      ["asked", "ˈæskt"],
    ])("preserves the regular past-tense reading for %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-lexical-ind-stems.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("vouched -ind stems remain available to derivation (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([["finder", "ˈfaɪndɝ"], ["binder", "ˈbaɪndɝ"], ["grinder", "ˈɡɹaɪndɝ"], ["kinder", "ˈkaɪndɝ"], ["finds", "ˈfaɪndz"], ["binds", "ˈbaɪndz"], ["grinds", "ˈɡɹaɪndz"], ["kinds", "ˈkaɪndz"]])("retains its independent stem in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test.each([["hinder", "ˈhɪndɝ"], ["cinder", "ˈsɪndɝ"], ["tinder", "ˈtɪndɝ"]])("preserves an opaque -inder word: %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test("keeps explicit noun/adjective/verb readings separate", () => {
      expect(engine.predict("finder", "en-US", "N")).toBe("ˈfaɪndɝ");
      expect(engine.predict("kinder", "en-US", "ADJ")).toBe("ˈkaɪndɝ");
      expect(engine.predict("hinder", "en-US", "V")).toBe("ˈhɪndɝ");
    });
    test("preserves a complete noun subject and verb control", () => {

      const tokens = englishTokens(engine, "The finder is active. They hinder progress.");
      expect(tokens.find(token => token.word === "finder")?.phoneme).toBe("ˈfaɪndɝ");
      expect(tokens.find(token => token.word === "hinder")?.phoneme).toBe("ˈhɪndɝ");
      expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
    });
  });


  test("preserves caller ownership of an -ind root and a complete derived word", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("find", "ˈzɛŋ");
    expect(engine.predict("finder")).toBe("ˈzɛŋɝ");
    expect(new EnglishG2P({ disableDict: true }).predict("finder")).toBe("ˈfaɪndɝ");
    engine.addPronunciation("finder", "ˈkʌp");
    expect(engine.predict("finder")).toBe("ˈkʌp");
  });

})();

// Original suite: en-lexical-loanword-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("vouched lexical loanword roots", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["anime", "ˈænəmeɪ"],
      ["lingerie", "ˌɫɑnʒəˈɹeɪ"],
      ["karaoke", "ˌkɛɹiˈoʊki"],
      ["ballet", "bæˈɫeɪ"],
      ["debut", "deɪˈbju"],
      ["entrepreneur", "ˌɑntɹəpɹəˈnɝ"],
      ["tsunami", "tsuˈnɑmi"],
      ["safari", "səˈfɑɹi"],
      ["piano", "piˈænoʊ"],
      ["alumni", "əˈɫʌmˌnaɪ"],
      ["voyeur", "ˌvɔɪˈjuɹ"],
      ["encyclopedia", "ɪnˌsaɪkɫəˈpidiə"],
      ["memorabilia", "ˌmɛmɝəˈbiɫjə"],
    ])("uses the attested US lexical root for %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("preserves unrelated spelling controls", () => {
      expect(rules.predict("animal", "en-US")).toBe("ˈænəməɫ");
      expect(rules.predict("ball", "en-US")).toBe("ˈbɔɫ");
      expect(rules.predict("alumnus", "en-US")).toBe("əˈɫʌmnəs");
      expect(rules.predict("alumna", "en-US")).toBe("əˈɫumnə");
      expect(rules.predict("viewer", "en-US")).toBe("ˈvjuɝ");
      expect(rules.predict("voyeurism", "en-US")).not.toBe("ˈvɔɪɝɪzəm");
      expect(rules.predict("encyclopedias", "en-US")).toBe("ɪnˌsaɪkɫəˈpidiəz");
    });

    it("keeps each loanword reading through sentence tokenization", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
      const tokens = phonemizer.phonemize("The anime, ballet, lingerie, and karaoke are popular; the entrepreneur made her debut in the safari park after the tsunami warning. The piano recital welcomed alumni, and the encyclopedia displayed old memorabilia while a voyeur watched the viewer.", {
        language: "en-US", returnArray: true,
      });
      const expected: Record<string, string> = {
        anime: "ˈænəmeɪ",
        ballet: "bæˈɫeɪ",
        lingerie: "ˌɫɑnʒəˈɹeɪ",
        karaoke: "ˌkɛɹiˈoʊki",
        entrepreneur: "ˌɑntɹəpɹəˈnɝ",
        debut: "deɪˈbju",
        safari: "səˈfɑɹi",
        tsunami: "tsuˈnɑmi",
        piano: "piˈænoʊ",
        alumni: "əˈɫʌmˌnaɪ",
        voyeur: "ˌvɔɪˈjuɹ",
        encyclopedia: "ɪnˌsaɪkɫəˈpidiə",
        memorabilia: "ˌmɛmɝəˈbiɫjə",
      };
      for (const [word, ipa] of Object.entries(expected))
        expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
    });
  });

})();
