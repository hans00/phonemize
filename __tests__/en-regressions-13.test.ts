// Original suite: en-lexical-theta.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // MW thespian and the fixed common-cohort thesaurus reading, including stress.
  const readings = [["thespian", "ˈθɛspiən"], ["thesaurus", "θəˈsɔɹəs"]];
  const sentences = [
    "The thespian used a thesaurus.", "They blamed themselves.",
    "They blamed theirselves.", "They blamed theirself.", "They blamed themself.",
    "The answer is theirs.", "Their names are there.", "They went there before.",
    "They saw the theme.", "They will do that thereafter.",
  ];

  describe.each([false, true])("lexical theta and grammatical roots, rules=%s", disableDict => {
    test.each(readings)("keeps the complete %s reading across caller POS", (word, expected) => {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"]) expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });

    test.each([["Thelmas", "ˈθɛlməz"], ["Theklas", "ˈθɛkləz"]])("retains the vouched root in %s", (word, expected) => {
      const processor = new EnglishG2P({ disableDict });
      expect((processor.predict(word, "en-US", "N") ?? "").replace(/ɫ/g, "l")).toBe(expected);
      const tokens = createPhonemizer({ processors: [processor] }).phonemize(`The ${word} are here.`, { language: "en-US", returnArray: true });
      if (typeof tokens === "string") throw new Error("Expected token output");
      expect(tokens.filter(token => token.word === word).map(token => token.phoneme.replace(/ɫ/g, "l"))).toEqual([expected]);
    });

    test("preserves a caller-owned reading in isolation and prose", () => {
      const processor = new EnglishG2P({ disableDict });
      processor.addPronunciation("thespian", "ˈtɛspiən");
      for (const pos of [undefined, "N", "ADJ", "V"]) expect(processor.predict("thespian", "en-US", pos)).toBe("ˈtɛspiən");
      const tokens = createPhonemizer({ processors: [processor] }).phonemize("The thespian smiled.", { language: "en-US", returnArray: true });
      if (typeof tokens === "string") throw new Error("Expected token output");
      expect(tokens.filter(token => token.word === "thespian").map(token => token.phoneme)).toEqual(["ˈtɛspiən"]);
      // Morphology omits the redundant primary on a supplied monosyllable.
      for (const [root, plural] of [["ˈfɑ", "fɑz"], ["ˈfɑmə", "ˈfɑməz"]]) {
        processor.addPronunciation("thelma", root);
        expect(processor.predict("Thelmas", "en-US", "N")).toBe(plural);
      }
    });

    test.each(sentences)("preserves the grammatical boundary in %s", sentence => {
      const engine = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const tokens = engine.phonemize(sentence, { language: "en-US", returnArray: true });
      if (typeof tokens === "string") throw new Error("Expected token output");
      for (const token of tokens) {
        const word = token.word.toLowerCase();
        const reading = readings.find(([key]) => key === word);
        if (reading) expect(token.phoneme).toBe(reading[1]);
        else if (["the", "they", "their", "there", "thereafter", "theirs", "that", "themselves", "theirselves", "theirself", "themself"].includes(word))
          expect(token.phoneme).not.toMatch(/^[ˈˌ]*θ/);
      }
    });
  });

})();

// Original suite: en-linked-comparatives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("Fused comparative phrases (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it.each([
      ["nevertheless", "ˌnɛvɝðəˈɫɛs"], ["nonetheless", "ˌnʌnðəˈɫɛs"],
      ["allthemore", "ˌɔɫðəˈmɔɹ"], ["nonethemore", "ˌnʌnðəˈmɔɹ"],
    ])("retains the article and full comparative in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it.each(["heartless", "ruthless", "breathless", "worthless", "blitheless", "scatheless", "seetheless", "absintheless"])(
      "retains the weak adjective suffix in %s", word => {
        expect(engine.predict(word)).toMatch(/ɫ[əɪ]s$/);
        expect(engine.predict(word)).not.toContain("ðəˈɫɛs");
      });

    it("preserves noun, adjective and verb readings in a complete sentence", () => {
      const tokens = englishTokens(engine, "Nevertheless, the fearless reader will read the record.");
      expect(tokens.find(t => t.word === "Nevertheless")?.phoneme).toBe("ˌnɛvɝðəˈɫɛs");
      expect(tokens.find(t => t.word === "fearless")?.phoneme).toMatch(/ɫ[əɪ]s$/);
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "read")?.phoneme).toBe(engine.predict("read", "en-US", "V"));
      expect(tokens.find(t => t.word === "record")?.phoneme).toBe(engine.predict("record", "en-US", "N"));
    });
  });

})();

// Original suite: en-liquid-e-secondary.test.ts
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

  describe.each([false, true])("weak e before a closed liquid syllable (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["electronic", "ɪɫɛkˈtɹɑnɪk"], ["electronics", "ɪɫɛkˈtɹɑnɪks"],
      ["electrician", "ɪɫɛkˈtɹɪʃən"], ["electricians", "ɪɫɛkˈtɹɪʃənz"],
      ["electricity", "ɪɫɛkˈtɹɪsəti"], ["electricities", "ɪɫɛkˈtɹɪsətiz"],
    ])("retains the root vowel and stress in %s after rebuilding", (word, ipa) => {
      expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
    });
    it("preserves open second syllables and longer prefix controls", () => {
      const controls = disableDict
        ? ["ˌɛɫəˈmɛntɝi", "ˌɛpɪˈɫɛptɪk", "ˌɪɫəktɹɑməɡˈnɛtɪk"]
        : ["ˌɛɫəˈmɛntɝɹi", "ˌɛpəˈɫɛptɪk", "ˌɪˌɫɛktɹoʊmæɡˈnɛtɪk"];
      ["elementary", "epileptic", "electromagnetic"].forEach((word, i) => {
        expect(engine.predict(word)).toBe(controls[i]);
      });
    });
    it("keeps caller root pronunciations in unlisted plurals", () => {
      for (const root of ["electronic", "electrician", "electricity"]) {
        const custom = new EnglishG2P({ disableDict });
        custom.addPronunciation(root, "ˈzɛŋ");
        expect(reading(custom.predict(root + "s")!)).toEqual(reading("ˈzɛŋz"));
      }
    });
    it("handles noun and adjective targets in full prose", () => {
      const api = createPhonemizer({ processors: [engine] });
      const result = api.phonemize("The electrician will work with electronic equipment.", {
        language: "en-US", returnArray: true,
      });
      for (const [word, ipa] of [["electrician", "ɪɫɛkˈtɹɪʃən"], ["electronic", "ɪɫɛkˈtɹɑnɪk"]]) {
        expect(reading(result.find(token => token.word === word)!.phoneme)).toEqual(reading(ipa));
      }
      expect(result.find(token => token.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();

// Original suite: en-liquid-stem-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("liquid stem boundaries (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["sterling", "ˈstɝɫɪŋ"], ["starling", "ˈstɑɹɫɪŋ"], ["darling", "ˈdɑɹɫɪŋ"],
      ["curler", "ˈkɝɫɝ"], ["sampling", "ˈsæmpɫɪŋ"], ["trampling", "ˈtɹæmpɫɪŋ"],
      ["dumpling", "ˈdʌmpɫɪŋ"], ["curling", "ˈkɝɫɪŋ"], ["hurling", "ˈhɝɫɪŋ"],
      ["snarling", "ˈsnɑɹɫɪŋ"], ["curled", "ˈkɝɫd"], ["hurled", "ˈhɝɫd"],
      ["whirled", "ˈhwɝɫd"], ["purled", "ˈpɝɫd"],
    ])("retains the complete root in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([
      ["snarled", "ˈsnɑɹəɫd"], ["sampled", "ˈsæmpəɫd"], ["trampled", "ˈtɹæmpəɫd"],
      ["simpler", "ˈsɪmpəɫɝ"], ["eurosterling", "ˌjuɹoʊˈstɝɫɪŋ"], ["reader", "ˈɹidɝ"],
    ])("preserves the neighboring frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("recovers inflections after exception eviction", () => {
      const fresh = new EnglishG2P({ disableDict });
      const access = fresh as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["sampling", "samplings", "starling", "starlings", "starling's"]) delete access.dictionary[word];
      expect(fresh.predict("samplings")).toBe("ˈsæmpɫɪŋz");
      expect(fresh.predict("starlings")).toBe("ˈstɑɹɫɪŋz");
      expect(fresh.predict("starling's")).toBe("ˈstɑɹɫɪŋz");
    });
    it("retains noun, adjective and verb readings in a full sentence", () => {

      const tokens = englishTokens(engine, "The clever reader is sampling a dumpling.");
      for (const [word, ipa] of [["clever", "ˈkɫɛvɝ"], ["reader", "ˈɹidɝ"], ["sampling", "ˈsæmpɫɪŋ"], ["dumpling", "ˈdʌmpɫɪŋ"]]) {
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
      }
    });
  });

})();

// Original suite: en-lly-silent-e-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("independent -lly nouns retain their vowel (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    test.each([["filly", "ˈfɪɫi"], ["fillies", "ˈfɪɫiz"], ["holly", "ˈhɑɫi"]])("keeps %s as a noun", (word, expected) => {
      expect(engine.predict(word, "en-US", "N")).toBe(expected);
    });
    test("keeps the noun and its plural in a complete sentence", () => {
      const tokens = englishTokens(engine, "The filly joined the other fillies.");
      expect(tokens.find(token => token.word === "filly")?.phoneme).toBe("ˈfɪɫi");
      expect(tokens.find(token => token.word === "fillies")?.phoneme).toBe("ˈfɪɫiz");
    });
  });

})();

// Original suite: en-long-prefix-vowel-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { BORROWED_ROOT_FRAME } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  // Cambridge noun/adjective interim and noun/verb interest retain initial primary.
  // https://dictionary.cambridge.org/us/dictionary/english/interim
  // https://dictionary.cambridge.org/us/pronunciation/english/interest
  // https://www.dictionary.com/browse/interurban
  // https://dictionary.cambridge.org/us/pronunciation/english/interpersonal
  // https://dictionary.cambridge.org/us/dictionary/english/intergovernmental
  // Synthetic interam/interem probe the same resyllabified prefix boundary.
  describe.each([false, true])("long r-final prefix before a vowel (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each(["N", "V"])("keeps interest's lexical primary with %s", pos => {
      expect(engine.predict("interest", "en-US", pos)).toMatch(/^ˈɪnt/);
    });
    test.each(["N", "ADJ"])("keeps interim's lexical primary with %s", pos => {
      expect(engine.predict("interim", "en-US", pos)).toMatch(/^ˈɪntɝ[ɪə]m$/);
    });
    test.each(["interests", "interested", "interesting", "interestingly", "interestable", "interims", "interim's", "interam", "interams", "interem"])("retains the initial foot in %s", word => {
      expect(engine.predict(word)).toMatch(/^ˈɪnt/);
    });
    test.each(["interurban", "interurbans", "interurbanly", "interurbanness"])("retains the root primary in %s", word => {
      expect(engine.predict(word)).toMatch(/ˈɝbən(?:z|ɫi|nəs)?$/);
    });
    test("preserves verb/adjective roots and consonantal compound vowels", () => {
      expect(engine.predict("internal", "en-US", "ADJ")).toBe("ɪnˈtɝnəɫ");
      expect(engine.predict("interpret", "en-US", "V")).toMatch(/ɪnˈtɝpɹət$/);
      expect(engine.predict("interact", "en-US", "V")).toBe("ˌɪntɝˈækt");
      expect(engine.predict("intercompany")).not.toContain("kɑmp");
      expect(engine.predict("interpersonal")).toBe("ˌɪntɝˈpɝsənəɫ");
      expect(engine.predict("intergovernmental")).toMatch(/ˈmɛntəɫ$/);
    });
    test("preserves the full non- prefix after stem eviction", () => {
      expect(engine.predict("noninterest")).toMatch(/^nɑ/);
    });
    test("keeps a caller-owned root through its plural", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("interest", "ˈzɛnd");
      expect(owned.predict("interests")).toBe("ˈzɛndz");
    });
    test("preserves the noun, verb and adjective in complete sentences", () => {

      const tokens = englishTokens(engine, "Her interest in the internal report grew. The report will interest the careful reader. The interim leader read the record.");
      const interests = tokens.filter(token => token.word === "interest");
      expect(interests).toHaveLength(2);
      expect(interests[0].phoneme).toBe(engine.predict("interest", "en-US", "N"));
      expect(interests[1].phoneme).toBe(engine.predict("interest", "en-US", "V"));
      for (const [word, pos] of [["internal", "ADJ"], ["interim", "ADJ"], ["careful", "ADJ"], ["record", "N"]])
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
    });
  });

  test("a long prefix requires a separate root nucleus before borrowing", () => {
    for (const word of ["infrae", "intrae"]) expect(BORROWED_ROOT_FRAME.test(word)).toBe(false);
    for (const word of ["interest", "interim", "interurban"]) expect(BORROWED_ROOT_FRAME.test(word)).toBe(true);
  });

})();

// Original suite: en-ly-nonverbal-stem.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("nonverbal -ly base (rules=%s)", (disableDict) => {
    it.each([
      ["frequently", "ˈfɹikwəntɫi"],
      ["elaborately", "ɪˈɫæbɹətɫi"],
      ["intimately", "ˈɪntəmətɫi"],
      ["separately", "ˈsɛpɝətɫi"],
    ])("preserves the weak adjective reading in %s", (word, expected) => {
      expect(new EnglishG2P({ disableDict }).predict(word)).toBe(expected);
    });
  });
  it("preserves the existing primary stress when the phones already agree", () => {
    expect(new EnglishG2P({ disableDict: true }).predict("alternately")).toBe("ˈɔɫtɝnətɫi");
  });
  it("preserves explicit custom stem pronunciations", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("frequent", "ˈzɛŋ");
    expect(engine.predict("frequently")).toBe("ˈzɛŋɫi");
  });

})();

// Original suite: en-mature-root-family.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  const rules = new EnglishG2P({ disableDict: true });

  describe("matur- stem stress and reflexes", () => {
    it.each([
      ["mature", "məˈtʃʊɹ"],
      ["immature", "ˌɪməˈtʃʊɹ"],
      ["matured", "məˈtʃʊɹd"],
      ["maturing", "məˈtʃʊɹɪŋ"],
      ["maturity", "məˈtʃʊɹəti"],
      ["immaturity", "ˌɪməˈtʃʊɹəti"],
      ["maturities", "məˈtʃʊɹətiz"],
      ["maturation", "ˌmætʃəɹˈeɪʃən"],
    ])("renders the verified root reading in %s", (word, expected) => {
      expect(rules.predict(word)).toBe(expected);
    });

    it.each([
      ["nature", "ˈneɪtʃɝ"],
      ["future", "ˈfjutʃɝ"],
      ["premature", "ˌpɹiməˈtʃʊɹ"],
      ["prematurely", "ˌpɹiməˈtʃʊɹɫi"],
      ["temperature", "ˈtɛmpɝətʃɝ"],
      ["stature", "ˈstætʃɝ"],
    ])("leaves neighboring -ture words intact: %s", (word, expected) => {
      expect(rules.predict(word)).toBe(expected);
    });

    it("keeps adjective, verb and noun readings stable in full-sentence context", () => {
      expect(rules.predict("mature", "en-US", "ADJ")).toBe("məˈtʃʊɹ");
      expect(rules.predict("mature", "en-US", "V")).toBe("məˈtʃʊɹ");
      expect(rules.predict("maturity", "en-US", "N")).toBe("məˈtʃʊɹəti");

      const tokens = englishTokens(rules, "The immature child will mature, and the fruit reaches maturity.");
      expect(tokens.find(token => token.word === "immature")?.phoneme).toBe("ˌɪməˈtʃʊɹ");
      expect(tokens.find(token => token.word === "mature")?.phoneme).toBe("məˈtʃʊɹ");
      expect(tokens.find(token => token.word === "maturity")?.phoneme).toBe("məˈtʃʊɹəti");
    });
  });

})();

// Original suite: en-medicine-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak final vowel in the medicine compound root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["medicine", "ˈmɛdəsən"],
      ["medicine's", "ˈmɛdəsənz"],
      ["medicines", "ˈmɛdəsənz"],
      ["telemedicine", "ˌtɛɫəˈmɛdəsən"],
      ["telemedicines", "ˌtɛɫəˈmɛdəsənz"],
      ["genemedicine", "ˌdʒɛnəˈmɛdəsən"],
      ["genemedicines", "ˌdʒɛnəˈmɛdəsənz"],
    ])("keeps the final root vowel weak in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
      if (["medicine", "telemedicine", "genemedicine"].includes(word))
        expect(rules.trace(word, "en-US").path).toBe("rules");
      if (["medicines", "telemedicines", "genemedicines"].includes(word))
        expect(rules.trace(word, "en-US").path).toBe("morphology");
    });

    it.each([
      ["medicinal", "məˈdɪsənəɫ"],
      ["medic", "ˈmɛdɪk"],
      ["vaccine", "ˈvæksɪn"],
      ["plasticine", "ˈpɫæstɪsɪn"],
      ["biocine", "ˈbaɪoʊsɪn"],
    ])("preserves neighboring reading %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-ment-pos-source.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US distinguishes segment by vowel and torment by primary stress.
  // https://dictionary.cambridge.org/us/pronunciation/english/segment
  // https://dictionary.cambridge.org/pronunciation/english/torment
  const engine = new EnglishG2P();
  test.each([
    ["segment", "N", "ˈsɛɡmənt"],
    ["segment", "V", "ˈsɛɡmɛnt"],
    ["torment", "N", "ˈtɔɹˌmɛnt"],
    ["torment", "V", "tɔɹˈmɛnt"],
  ])("preserves the US %s reading for %s", (word, pos, ipa) => {
    expect(engine.predict(word, "en-US", pos)).toBe(ipa);
  });

  test("distinguishes nominal and verbal readings in complete sentences", () => {

    const tokens = englishTokens(engine, "The segment is short. They segment the market. The torment is severe. They torment the prisoners.");
    expect(tokens.filter(t => t.word === "segment").map(t => t.phoneme)).toEqual(["ˈsɛɡmənt", "ˈsɛɡmɛnt"]);
    expect(tokens.filter(t => t.word === "torment").map(t => t.phoneme)).toEqual(["ˈtɔɹˌmɛnt", "tɔɹˈmɛnt"]);
    expect(tokens.find(t => t.word === "short")?.phoneme).toBe("ʃɔɹt");
  });

})();

// Original suite: en-mental-composition.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge US: departmental, experimental, and regimental.
  // https://dictionary.cambridge.org/pronunciation/english/departmental
  // https://dictionary.cambridge.org/us/pronunciation/english/experimental
  // https://dictionary.cambridge.org/pronunciation/english/regimental
  const rules = new EnglishG2P({ disableDict: true });

  test.each([
    ["departmental", "dɪˌpɑɹtˈmɛntəɫ"],
    ["experimental", "ɪksˌpɛɹəˈmɛntəɫ"],
    ["regimental", "ˌɹɛdʒəˈmɛntəɫ"],
    ["developmental", "dɪˌvɛɫəpˈmɛntəɫ"],
    ["governmental", "ˌɡʌvɝnˈmɛntəɫ"],
  ])("composes -mental from an attested root: %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  test("preserves the base and the -ment adjective's -ly form", () => {
    expect(rules.predict("department", "en-US")).toBe("dɪˈpɑɹtmənt");
    expect(rules.predict("departmentally", "en-US")).toBe("dɪˌpɑɹtˈmɛntəɫi");
    expect(rules.predict("developmentally", "en-US")).toBe("dɪˌvɛɫəpˈmɛntəɫi");
  });

  test("keeps noun, verb, and adjective readings in sentence context", () => {

    const tokens = englishTokens(rules, "The department approved the departmental plan. They experiment with an experimental method.");
    expect(tokens.filter(token => ["department", "departmental", "experiment", "experimental"].includes(token.word.toLowerCase()))
      .map(token => [token.word.toLowerCase(), token.phoneme]))
      .toEqual([
        ["department", "dɪˈpɑɹtmənt"],
        ["departmental", "dɪˌpɑɹtˈmɛntəɫ"],
        ["experiment", "ɪksˈpɛɹəmənt"],
        ["experimental", "ɪksˌpɛɹəˈmɛntəɫ"],
      ]);
  });

})();

// Original suite: en-merged-vowel-slots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("merged vowel slots (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("front-vowel lm keeps its lateral; alm preserves its existing variants", () => {
      for (const word of ["film", "films", "filmed", "filming", "helm", "helms", "realm", "realms"])
        expect(g2p.predict(word)).toMatch(/ɫm/);
      for (const word of ["calm", "palm", "psalm"]) {
        expect(g2p.predict(word)).toMatch(/ɑɫ?m/);
        if (disableDict) expect(g2p.predict(word)).not.toMatch(/[lɫ]/);
      }
      for (const word of ["dealt", "realm", "health", "wealth"])
        expect(g2p.predict(word)).toContain("ɛɫ");
      for (const word of ["heath", "beneath", "fealty", "realty"])
        expect(g2p.predict(word)).not.toContain("ɛɫ");
    });

    test("terminal u and an open root before y retain their long vowel", () => {
      for (const word of ["flu", "gnu", "thru", "truly", "ruby", "judy", "lucy", "puny", "duly", "duty"])
        expect(g2p.predict(word)).toContain("u");
      for (const word of ["buddy", "sunny", "study"])
        expect(g2p.predict(word)).toContain("ʌ");
      expect(g2p.predict("bushy")).toContain("ʊ");
      for (const word of ["busy", "study", "hurry", "flurry", "bushy"])
        expect(g2p.predict(word)).not.toContain("u");
      for (const word of ["fury", "jury", "juries"])
        expect(g2p.predict(word)).toContain("ʊɹ");
      expect(g2p.predict("flurry")).toContain("ɝ");
    });

    test("bound ti+a palatalizes before -ate and -ative", () => {
      for (const word of ["initiate", "negotiate", "instantiate", "substantiate", "initiative"])
        expect(g2p.predict(word)).toMatch(/ʃ[ij]/);
      for (const word of ["patio", "pentium", "tritium", "auntie", "dirtier"])
        expect(g2p.predict(word)).not.toContain("ʃ");
    });

    test("off-stress e+a+r keeps both nuclei in -lear and -near", () => {
      for (const word of ["linear", "nuclear", "cochlear"])
        expect(g2p.predict(word)).toContain("iɝ");
      expect(g2p.predict("clear")).toContain("ɪɹ");
      expect(g2p.predict("fear")).toContain("ɪɹ");
    });

    test("weak bound-noun themes reduce without reducing full nuclei", () => {
      for (const word of ["ordinary", "ordinarily"]) expect(g2p.predict(word)).toContain("də");
      expect(g2p.predict("ordinance")).toContain("də");
      expect(g2p.predict("artificial")).toContain("tə");
      // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/litigate
      expect(g2p.predict("litigate")).toContain("tə");
      expect(g2p.predict("culinary")).toMatch(/[ɪə]ˌ?n/);
    });
  });

})();

// Original suite: en-micro-w-root-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("micro-w boundary, rules=%s", disableDict => {
    it("retains the vouched w root and head stress after target eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["microwave", "microwaves", "microwaved", "microwaving", "microwatt", "microwatts", "microwavable", "microwaveable"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [["microwave", "ˈmaɪkɹəˌweɪv"], ["microwaves", "ˈmaɪkɹəˌweɪvz"], ["microwaved", "ˈmaɪkɹəˌweɪvd"], ["microwaving", "ˈmaɪkɹəˌweɪvɪŋ"], ["microwatt", "ˈmaɪkɹəˌwɑt"], ["microwatts", "ˈmaɪkɹəˌwɑts"], ["microwavable", "ˈmaɪkɹəˌweɪvəbəɫ"], ["microwaveable", "ˈmaɪkɹəˌweɪvəbəɫ"]])
        expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves independent neighboring roots and caller phones", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("microbe")).toBe("ˈmaɪkɹoʊb");
      expect(engine.predict("microscope")).toBe("ˈmaɪkɹəˌskoʊp");
      withoutDictionaryEntries(engine, ["microwave"]);
      engine.addPronunciation("wave", "ˈzɛŋ");
      expect(engine.predict("microwave")).toBe("ˈmaɪkɹəˌzɛŋ");
      engine.addPronunciation("micro", "ˈkɛŋ");
      expect(engine.predict("microwave")).toBe("ˈkɛŋˌzɛŋ");
      engine.addPronunciation("microwave", "ˈbɛŋ");
      expect(engine.predict("microwave")).toBe("ˈbɛŋ");
    });
    it("keeps noun, attributive and finite verb sentence readings", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const sentence of ["The microwave is here.", "The microwave oven is here.", "They microwave the soup."])
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "microwave")?.phoneme).toBe("ˈmaɪkɹəˌweɪv");
    });
  });

})();

// Original suite: en-minister-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("minister weak second syllable", () => {
    it.each([false, true])("preserves noun/verb readings and ministry control (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("minister", "en-US", "NN")).toBe("ˈmɪnəstɝ");
      expect(engine.predict("minister", "en-US", "VB")).toBe("ˈmɪnəstɝ");
      expect(engine.predict("ministers", "en-US", "NNS")).toBe("ˈmɪnəstɝz");
      expect(engine.predict("ministry", "en-US", "NN")).toBe(disableDict ? "ˈmɪnɪstɹi" : "ˈmɪnəstɹi");


      const tokens = englishTokens(engine, "The minister served in the ministry.");
      expect(tokens.find(token => token.word.toLowerCase() === "minister")?.phoneme).toBe("ˈmɪnəstɝ");
      expect(tokens.find(token => token.word.toLowerCase() === "ministry")?.phoneme)
        .toBe(disableDict ? "ˈmɪnɪstɹi" : "ˈmɪnəstɹi");
    });
  });

})();

// Original suite: en-mobile-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { createPhonemizer } = __suiteModule1;

  describe("bound compound -mobile", () => {
    const rules = new EnglishG2P({ disableDict: true });

    test.each([
      ["automobile", "ˈɔtəmoʊˌbiɫ"],
      ["bookmobile", "ˈbʊkmoʊˌbiɫ"],
      ["snowmobile", "ˈsnoʊmoʊˌbiɫ"],
      ["automobiles", "ˈɔtəmoʊˌbiɫz"],
      ["bookmobiles", "ˈbʊkmoʊˌbiɫz"],
      ["snowmobiles", "ˈsnoʊmoʊˌbiɫz"],
    ])("composes %s from its head and bound mobile tail", (word, expected) => {
      expect(rules.predict(word)).toBe(expected);
    });

    test("retains full compound and suffix behavior in context", () => {
      const phonemizer = createPhonemizer({ processors: [rules] });
      expect(phonemizer.phonemize("The bookmobile followed the snowmobile.", "en-US"))
        .toBe("ðə ˈbʊkmoʊˌbiɫ ˈfɑɫoʊd ðə ˈsnoʊmoʊˌbiɫ.");
      expect(rules.predict("automobile", "en-US", "N")).toBe("ˈɔtəmoʊˌbiɫ");
      expect(rules.predict("snowmobile", "en-US", "N")).toBe("ˈsnoʊmoʊˌbiɫ");
    });

    test("does not treat free mobile or the im- prefix as compound -mobile", () => {
      expect(rules.predict("mobile")).toBe("ˈmoʊbəɫ");
      expect(rules.predict("immobile")).toBe("ˈɪməbɪɫ");
      expect(rules.predict("automotive")).toBe("ˌɔtəˈmoʊtɪv");
    });
  });

})();

// Original suite: en-modal-adverb-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { inferVerbForm, SimplePOSTagger } = __suiteModule2;

  it("retains the bare verb through adverbs after every modal", () => {
    for (const modal of ["can", "could", "will", "would", "may", "might", "must", "shall", "should"]) {
      const words = ["They", modal, "gladly", "read", "the", "book"];
      const context = { words, index: 3 };
      expect(new SimplePOSTagger().tagWord("read", ["gladly", "the"], context).pos).toBe("V");
      expect(inferVerbForm(context)).toBe("base");
    }
  });

  it("does not turn nominal or prepositional modal spellings into auxiliaries", () => {
    for (const words of [
      ["the", "will", "plainly", "invalid"],
      ["a", "can", "clearly", "invalid"],
      ["in", "May", "particularly", "invalid"],
      ["John's", "might", "plainly", "invalid"],
    ]) expect(new SimplePOSTagger().tagWord("invalid", [words[2]], { words, index: 3 }).pos).not.toBe("V");
  });

  it("preserves free-will noun phrases with and without a determiner", () => {
    for (const words of [
      ["Her", "choices", "reflect", "free", "will", "broadly", "present", "across", "cultures"],
      ["She", "values", "the", "free", "will", "broadly", "present", "across", "cultures"],
      ["Free", "will", "broadly", "present", "across", "cultures"],
    ]) {
      const index = words.indexOf("present");
      expect(new SimplePOSTagger().tagWord("present", ["broadly", "across"], { words, index }).pos).not.toBe("V");
    }
  });

  describe.each([false, true])("modal adverb sentences, rules=%s", disableDict => {
    it("keeps complete sentences and noun/adjective controls", () => {
      expect(new SimplePOSTagger().tagWord("invite", ["the", "is"]).pos).toBe("N");
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ["They might gladly invite people.", "invite", disableDict ? "ɪnˈvaɪt" : "ˌɪnˈvaɪt"],
        ["They may eventually record the song.", "record", disableDict ? "ɹiˈkɔɹd" : "ɹɪˈkɔɹd"],
        ["The book is here.", "book", "bʊk"],
        ["The valid record is here.", "valid", "ˈvæɫɪd"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-modal-be-composition.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("fused modal and be (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test("retains both complete words and their forms", () => {
      expect(engine.predict("maybe")).toBe("ˈmeɪbi");
      expect(engine.predict("maybes")).toBe("ˈmeɪbiz");
      expect(engine.predict("canbe")).toBe("ˈkænbi");
      expect(engine.predict("wouldbe")).toBe("ˈwʊdbi");
      for (const word of ["beam", "bean", "beat", "mayor"])
        expect(engine.predict(word)).not.toMatch(/bi$/);
    });
    test("retains caller-supplied components and explicit whole-word readings", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("can", "ˈzɛŋ");
      custom.addPronunciation("be", "ˈtu");
      expect(custom.predict("canbe")).toBe("ˈzɛŋtu");
      custom.addPronunciation("canbe", "ˈkɛŋ");
      expect(custom.predict("canbe")).toBe("ˈkɛŋ");
    });
    test("keeps the adverb and separate modal phrase in context", () => {
      const api = createPhonemizer({ processors: [engine] });
      for (const sentence of ["Maybe they will leave.", "It may be ready."]) {
        const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
        expect(tokens.length).toBeGreaterThan(1);
        if (sentence.startsWith("Maybe")) expect(tokens[0].phoneme).toBe("ˈmeɪbi");
        else expect(tokens.find(token => token.word === "may")?.phoneme).toBeTruthy();
      }
    });
    test.each([
      ["A record may be available.", "record", "N"],
      ["They may record the show.", "record", "V"],
      ["The present record may be available.", "present", "ADJ"],
    ])("preserves contextual %s", (sentence, word, pos) => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
    });
  });

})();

// Original suite: en-modal-coordination.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { inferVerbForm, simplePOSTagger } = __suiteModule2;

  const cases = [
    ["Lastly, players can form guilds and invite other players to join.", "invite"],
    ["They can discuss plans and use some tools to build.", "use"],
    ["They can review forms and permit other users to enter.", "permit"],
  ];
  it.each(cases)("inherits shared modal base: %s", (sentence, word) => {
    const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
    const index = words.indexOf(word);
    expect(simplePOSTagger.tagWord(word, [words[index - 1], words[index + 1]], { words, index }).pos).toBe("V");
    expect(inferVerbForm({ words, index })).toBe("base");
  });
  describe.each([false, true])("modal coordination, disableDict=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    it("selects verb contrasts", () => {
      expect(pick(cases[0][0], "invite")).toBe(disableDict ? "ɪnˈvaɪt" : "ˌɪnˈvaɪt");
      expect(pick(cases[1][0], "use")).toBe("juz");
    });
    it("keeps coordinated objects nominal", () => {
      expect(pick("They can buy a tool and use cases for discussion.", "use")).toBe("jus");
      expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
      expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
    });
    if (!disableDict) it("retains past, perfect and direct modal controls", () => {
      expect(pick("He worked hard and read some books yesterday.", "read")).toBe("ɹɛd");
      expect(pick("He could have trained and read some books to learn.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
    });
  });

})();

// Original suite: en-modal-paired-verbs.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { inferVerbForm } = __suiteModule2;

  describe.each([false, true])("modal with coordinated predicates (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    test("uses the verb reading before an object", () => {
      const tokens = api.phonemize("The animal could rend and tear flesh.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "tear")?.phoneme).toBe(engine.predict("tear", "en-US", "V"));
    });
    test.each([
      "They will read, record, and replay the tape.",
      "They can read, record, or replay a lecture.",
    ])("shares the modal with a comma-separated predicate in %s", sentence => {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "record")?.phoneme).toBe(engine.predict("record", "en-US", "V"));
    });
    test("does not treat the middle of a nominal object list as a verb", () => {
      const tokens = api.phonemize("They will buy fish, produce, and bread at the store.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "produce")?.phoneme).toBe(engine.predict("produce", "en-US", "N"));
    });
    test("also shares the modal with the final predicate", () => {
      const tokens = api.phonemize("They will read, record, and present the report.", { language: "en-US", returnArray: true });
      for (const word of ["record", "present"])
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", "V"));
    });
    test.each(["N", "ADJ", "V"])("preserves explicit %s in the three-predicate frame", pos => {
      const context = { words: ["They", "will", "read", ",", "record", ",", "and", "replay", "the", "tape", "."], index: 4 };
      expect(engine.predictWithContext("record", context, "en-US", pos)).toBe(engine.predict("record", "en-US", pos));
    });
    test.each(["N", "ADJ", "V"])("preserves supplied %s in the same context", pos => {
      const context = { words: ["The", "animal", "could", "rend", "and", "tear", "flesh", "."], index: 5 };
      expect(engine.predictWithContext("tear", context, "en-US", pos)).toBe(engine.predict("tear", "en-US", pos));
    });
    test.each(["They can pack fish and produce for winter.", "They can fish and produce when supplies are plentiful."])("keeps the food noun in %s", sentence => {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "produce")?.phoneme).toBe(engine.predict("produce", "en-US", "N"));
    });
    test.each([
      ["They could swim and present records were lost.", "present", "ADJ"],
      ["They could swim and present records will remain.", "present", "ADJ"],
      ["They could swim and present records remain intact.", "present", "ADJ"],
      ["They could swim and present records showed growth.", "present", "ADJ"],
      ["They could fish and produce mixes were sold.", "produce", "N"],
    ])("preserves a following noun phrase in %s", (sentence, word, pos) => {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
    });
  });

  test("the final predicate keeps the modal base form despite a past-time adverb", () => {
    const words = ["They", "would", "sign", ",", "present", ",", "and", "read", "the", "book", "yesterday", "."];
    expect(inferVerbForm({ words, index: 7 })).toBe("base");
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize(words.join(" "), { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "read")?.phoneme).toBe("ɹid");
  });

  test("a shared modal preserves verb voicing and the noun control for misuse", () => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    const verb = api.phonemize("There are allegations that he would distort and misuse data given to him.", { language: "en-US", returnArray: true });
    const noun = api.phonemize("The misuse of data was reported.", { language: "en-US", returnArray: true });
    expect(verb.find(token => token.word === "misuse")?.phoneme).toBe(engine.predict("misuse", "en-US", "V"));
    expect(noun.find(token => token.word === "misuse")?.phoneme).toBe(engine.predict("misuse", "en-US", "N"));
  });

})();

// Original suite: en-mono-ire-ing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("rule-derived unprefixed -ire before -ing (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["hiring", "ˈhaɪɹɪŋ"], ["tiring", "ˈtaɪɹɪŋ"], ["wiring", "ˈwaɪɹɪŋ"],
      ["hire", "ˈhaɪɝ"], ["tire", "ˈtaɪɝ"], ["wire", "ˈwaɪɝ"],
      ["fired", "ˈfaɪɝd"], ["wired", "ˈwaɪɝd"],
    ])("keeps the owned inflection or unaffected citation in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([
      ["requiring", "ɹiˈkwaɪɝɪŋ"], ["retiring", "ɹiˈtaɪɝɪŋ"],
      ["rewiring", "ɹiˈwaɪɝɪŋ"],
    ])("preserves the independently supplied longer root in %s", (word, ipa) => {
      expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("retains the unrelated agent's rhotic nucleus", () => {
      expect(engine.predict("lawyering")).toMatch(/ɝɪŋ$/);
    });
    it("keeps the stem rhotic separate from the agent suffix in acquirer", () => {
      expect(engine.predict("acquirer")).toBe("əˈkwaɪɹɝ");
    });
    it.each(["hire", "hir", "wire", "wir"])("preserves caller-owned %s", root => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      delete access.dictionary.hiring;
      delete access.dictionary.wiring;
      custom.addPronunciation(root, "ˈhaɪɝ");
      expect(custom.predict(root.endsWith("e") ? root.slice(0, -1) + "ing" : root + "ing")).toBe("ˈhaɪɝɪŋ");
    });
    it("preserves prefix stress and adverbs after root eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["hiring", "tiring", "wiring"]) delete access.dictionary[word];
      expect(evicted.predict("nonhiring")).toBe("nɑnˈhaɪɹɪŋ");
      expect(evicted.predict("nonwiring")).toBe("nɑnˈwaɪɹɪŋ");
      expect(evicted.predict("overhiring")).toBe("ˈoʊvɝˌhaɪɹɪŋ");
      for (const [word, ipa] of [
        ["hiringly", "ˈhaɪɹɪŋɫi"], ["tiringly", "ˈtaɪɹɪŋɫi"], ["wiringly", "ˈwaɪɹɪŋɫi"],
      ]) expect(evicted.predict(word)).toBe(ipa);
    });
    it("preserves adjective, noun and verb readings in full sentences", () => {

      const tokens = englishTokens(engine, "The tiring reader will work on wiring.");
      expect(tokens.find(t => t.word === "tiring")?.phoneme).toBe("ˈtaɪɹɪŋ");
      expect(tokens.find(t => t.word === "wiring")?.phoneme).toBe("ˈwaɪɹɪŋ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();
