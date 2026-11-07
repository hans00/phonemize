// Original suite: en-any-many-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("stressed any/many roots", () => {
    const processor = new EnglishG2P({ disableDict: true });

    it.each([
      ["any", "ˈɛni"],
      ["many", "ˈmɛni"],
      ["manyfold", "ˈmɛniˌfoʊɫd"],
    ])("uses the checked vowel in %s", (word, ipa) => {
      expect(processor.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      // Cambridge US gives /ˈkʌm.pə.ni/.
      ["company", "ˈkʌmpəni"],
      ["Germany", "ˈdʒɝməni"],
      ["Albany", "ˈæɫbəni"],
      ["Danny", "ˈdæni"],
      ["anywhere", "ˈɛniˌwɛɹ"],
      ["anyway", "ˈɛniˌweɪ"],
    ])("preserves the neighboring frame in %s", (word, ipa) => {
      expect(processor.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the reading in full sentence context", () => {
      const phonemizer = createPhonemizer({ processors: [processor] });
      const tokens = phonemizer.phonemize(
        "Any many people can choose manyfold options at the company in Germany.",
        { language: "en-US", returnArray: true },
      );
      for (const word of ["Any", "many", "manyfold"]) {
        expect(tokens.find((entry) => entry.word === word)?.phoneme).toMatch(/ɛ/);
      }
    });
  });

})();

// Original suite: en-apostrophe-words.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("Issue #28: lexical apostrophes", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });

    // Readings are independently attested; O'Brien uses Cambridge US's surname entry.
    it.each([
      ["O'Brien", "oʊˈbɹaɪən"],
      ["O'Reilly", "oʊˈɹaɪɫi"],
      ["O'Brien's", "oʊˈbɹaɪənz"],
      ["O'Neill", "oʊˈniɫ"],
      ["D'Angelo", "diˈændʒɪɫoʊ"],
      ["rock'n'roll", "ˌɹɑkənˈɹoʊɫ"],
      ["don't", "ˈdoʊnt"],
      ["o'clock", "əˈkɫɑk"],
    ])("retains the attested reading of %s across apostrophe styles", (word, ipa) => {
      for (const apostrophe of ["'", "‘", "’"]) {
        expect(phonemizer.toIPA(word.replace(/'/g, apostrophe), "en-US")).toBe(ipa);
      }
    });

    // O'Reily is only an illustrative spelling here; the real company below is O'Reilly Media.
    it.each(["O'Brien's", "O'Reily's", "O'Reilly's"])(
      "keeps %s in one contextual token", (word) => {
        const tokens = phonemizer.phonemize(`We saw ${word} logo.`, { language: "en-US", returnArray: true });
        expect(tokens.filter((token) => token.word === word)).toHaveLength(1);
      },
    );

    it("normalizes custom names and inflects their final possessive", () => {
      const processor = new EnglishG2P();
      processor.addPronunciation("O‘Reily", "OW0 R AY1 L IY0");
      expect(processor.predict("O’Reily's", "en-US")).toBe(processor.predict("O'Reily", "en-US") + "z");
    });

    it.each([false, true])("composes an unattested O' surname independent of casing (rules=%s)", disableDict => {
      const processor = new EnglishG2P({ disableDict });
      const name = processor.predict("O'Reily", "en-US")!;
      for (const spelling of ["O'Reily", "o'reily", "O’Reily", "o’reily"]) {
        expect(processor.predict(spelling, "en-US")).toBe(name);
      }
      for (const spelling of ["O'Reily's", "o'reily's", "O’Reily’s", "o’reily’s"]) {
        expect(processor.predict(spelling, "en-US")).toBe(`${name}z`);
      }
      expect(processor.trace("O'Reily", "en-US").path).toBe("rules");
      expect(processor.trace("o'reily", "en-US").path).toBe("rules");
      expect(processor.predict("O'Clair", "en-US")).toBe(processor.predict("o'clair", "en-US"));
      // The capitalized contraction must not be mistaken for the Irish prefix.
      expect(processor.predict("O'Clock", "en-US")).toBe(processor.predict("o'clock", "en-US"));
    });

    it("preserves O' names and possessives as sentence tokens", () => {
      const tokens = phonemizer.phonemize("We saw O'Reily's store beside O'Reilly's store.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(token => token.word === "O'Reily's")?.phoneme).toBe("oʊˈɹiɫiz");
      expect(tokens.find(token => token.word === "O'Reilly's")?.phoneme).toBe("oʊˈɹaɪɫiz");
    });

    it("keeps issue #28 O'Brien and O'Reilly Media correct in sentences", () => {
      const tokens = phonemizer.phonemize("I met O'Brien yesterday. O'Reilly Media sells technical books.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(token => token.word === "O'Brien")?.phoneme).toBe("oʊˈbɹaɪən");
      expect(tokens.find(token => token.word === "O'Reilly")?.phoneme).toBe("oʊˈɹaɪɫi");
      expect(tokens.find(token => token.word === "Media")?.phoneme).toBe("ˈmidiə");
    });

    it("keeps Brien independent while applying the compound reading in O'Brien", () => {
      expect(phonemizer.toIPA("Brien", "en-US")).toBe("ˈbɹaɪɪn");
      for (const apostrophe of ["'", "‘", "’"]) {
        expect(phonemizer.toIPA(`O${apostrophe}Brien`, "en-US")).toBe("oʊˈbɹaɪən");
        expect(phonemizer.toIPA(`O${apostrophe}Briens`, "en-US")).toBe("oʊˈbɹaɪənz");
      }
      expect(phonemizer.toIPA("O'Neill", "en-US")).toBe("oʊˈniɫ");
      expect(phonemizer.toIPA("O'Reilly Media", "en-US")).toBe("oʊˈɹaɪɫi ˈmidiə");
      expect(phonemizer.toIPA("Brien", "en-US")).toBe("ˈbɹaɪɪn");
      for (const disableDict of [false, true]) {
        const processor = new EnglishG2P({ disableDict });
        expect(processor.predict("O'Brien", "en-US")).toBe("oʊˈbɹaɪən");
      }
    });

    it.each(["'", "‘", "’"])("keeps the O'Reilly brand and possessive together with apostrophe %s", apostrophe => {
      const brand = `O${apostrophe}Reilly`;
      const possessive = `${brand}${apostrophe}s`;
      const tokens = phonemizer.phonemize(`${brand} Media sells books. I bought ${possessive} book.`, {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(token => token.word === brand)?.phoneme).toBe("oʊˈɹaɪɫi");
      expect(tokens.find(token => token.word === "Media")?.phoneme).toBe("ˈmidiə");
      expect(tokens.find(token => token.word === possessive)?.phoneme).toBe("oʊˈɹaɪɫiz");
    });

    it.each([
      ["I'm", "ˈaɪm"], ["we'll", "ˈwil"], ["you've", "ˈjuv"],
      ["island's", "ˈaɪɫəndz"], ["dogs'", "ˈdɑɡz"],
    ])("preserves the existing clitic reading of %s", (word, ipa) => {
      expect(phonemizer.toIPA(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-arian-root-inheritance.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/morph-parser") = require("../src/en/morph-parser");
  const { preserveAryDiphthongs } = __suiteModule2;

  // https://www.oxfordlearnersdictionaries.com/definition/english/librarian
  // https://dictionary.cambridge.org/us/pronunciation/english/ovarian
  // Pin the inherited nucleus; secondary-stress conventions belong to the renderer.
  describe.each([false, true])("-ary/-arian root inheritance (disableDict=%s)", disableDict => {
    test.each([undefined, "N", "ADJ", "V"])("preserves root diphthongs with caller POS %s", pos => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("librarian", "en-US", pos)).toMatch(/^ɫaɪˈbɹɛ/);
      expect(engine.predict("ovarian", "en-US", pos)).toMatch(/^oʊˈvɛ/);
    });
    test.each(["librarians", "librarianlike", "librarianhood", "nonlibrarian"])("keeps the root through %s", word => {
      expect(new EnglishG2P({ disableDict }).predict(word)).toContain("ɫaɪˈbɹɛ");
    });
    test("honors a caller-owned complete pronunciation", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("librarian", "lɪˈbɹɛɹiən");
      expect(engine.predict("librarian")).toBe("lɪˈbɹɛɹiən");
    });
    test("inherits an aligned novel root without copying its weak vowels", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("pivary", "ˈpaɪvɝi");
      expect(engine.predict("pivarian")).toBe("paɪˈvɛɹiən");
    });
    test("rejects a supplied root with a different consonant skeleton", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("pivary", "ˈpaɪkɝi");
      expect(engine.predict("pivarian")).toBe("pɪˈvɛɹiən");
    });
    test("rejects a supplied root with a different number of nuclei", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("pivary", "ˈpaɪvɝ");
      expect(engine.predict("pivarian")).toBe("pɪˈvɛɹiən");
    });
    test("retains an evicted -arian root through outer composition", () => {
      const engine = new EnglishG2P({ disableDict });
      const stored: unknown = Reflect.get(engine, "dictionary");
      if (!stored || typeof stored !== "object") throw new Error("Missing dictionary");
      const table: Record<string, unknown> = { ...stored };
      delete table.librarian; delete table.ovarian;
      Object.defineProperty(engine, "dictionary", { value: table });
      for (const word of ["librarian", "librarians", "nonlibrarian", "librarianlike"])
        expect(engine.predict(word)).toContain("ɫaɪˈbɹɛ");
      for (const word of ["ovarian", "ovarians", "ovarianlike"])
        expect(engine.predict(word)).toMatch(/^oʊˈvɛ/);
    });
    test("composes a novel derived root before plural and privative boundaries", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("pivary", "ˈpaɪvɝi");
      expect(engine.predict("pivarians")).toBe("paɪˈvɛɹiənz");
      expect(engine.predict("nonpivarian")).toContain("paɪˈvɛɹiən");
    });
    test("reuses a proven novel stem before other productive suffixes", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("pivary", "ˈpaɪvɝi");
      expect(engine.predict("pivarianed")).toBe("paɪˈvɛɹiənd");
      expect(engine.predict("pivarianing")).toBe("paɪˈvɛɹiənɪŋ");
      expect(engine.predict("pivarianer")).toBe("paɪˈvɛɹiənɝ");
      expect(engine.predict("pivarianes")).toBe("paɪˈvɛɹiənz");
    });
    test("keeps an intact root whose apparent prefix has no proven -ary repair", () => {
      expect(new EnglishG2P({ disableDict }).predict("disciplinarian")).toMatch(/^ˌdɪs/);
    });
    test("preserves short roots and existing reduced vowels", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("marian")).toBe("ˈmɛɹiən");
      expect(engine.predict("agrarian")).toBe("əˈɡɹɛɹiən");
      expect(engine.predict("unitarian")).toBe("ˌjunəˈtɛɹiən");
      expect(engine.predict("riparian")).toBe("ɹɪˈpɛɹiən");
    });
    test("preserves the surrounding noun, adjective and verb", () => {
      const engine = new EnglishG2P({ disableDict });
      const tokens = createPhonemizer({ processors: [engine] }).phonemize(
        "The careful librarian records a review of ovarian development.",
        { language: "en-US", returnArray: true },
      );
      expect(tokens.find(t => t.word === "librarian")?.phoneme).toMatch(/^ɫaɪˈbɹɛ/);
      expect(tokens.find(t => t.word === "ovarian")?.phoneme).toMatch(/^oʊˈvɛ/);
      expect(tokens.find(t => t.word === "careful")?.phoneme).toBe("ˈkɛɹfəɫ");
      expect(tokens.find(t => t.word === "development")?.phoneme).toBe("dɪˈvɛɫəpmənt");
      expect(tokens.find(t => t.word === "records")?.phoneme).toBe("ɹɪˈkɔɹdz");
    });
  });

  test("inheritance cannot replace an accented or already full derived vowel", () => {
    expect(preserveAryDiphthongs("ˈpɪvɛɹiən", "ˈpaɪvɛɹi")).toBe("ˈpɪvɛɹiən");
    expect(preserveAryDiphthongs("pɑˈvɛɹiən", "ˈpaɪvɛɹi")).toBe("pɑˈvɛɹiən");
  });

})();

// Original suite: en-ascii-g.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/index") = require("../src/index");
  const { toIPA, toARPABET } = __suiteModule1;

  // Regression: the ^giv/^gif/^gir PHONEME_RULES entries in src/en/syllabify.ts
  // once spelled their hard-/ɡ/ onset with ASCII "g" (U+0067) instead of the
  // IPA script letter "ɡ" (U+0261) that every other rule, the dictionary
  // (data/en/dict.json) and the rest of the codebase use. Rules-only output
  // for words like "gift" and "girl" therefore silently shipped a different
  // Unicode codepoint than the dictionary's own /ɡ/ — invisible to the eye,
  // but a real mismatch for any consumer normalizing or comparing IPA text.
  // Fixed by respelling those three PHONEME_RULES entries with U+0261.
  const ASCII_G = "g"; // U+0067, must never appear in IPA output
  const IPA_G = "ɡ"; // U+0261, the correct IPA symbol

  const GIFT_GIRL_WORDS = [
    "gift",
    "girl",
    "give",
    "get",
    "begin",
    "guest",
    "eggs",
    "anger",
  ];

  describe("no ASCII g (U+0067) in English IPA output", () => {
    const g2pRules = new EnglishG2P({ disableDict: true });
    const g2pDict = new EnglishG2P();

    for (const word of GIFT_GIRL_WORDS) {
      it(`rules-only: ${word}`, () => {
        const ipa = g2pRules.predict(word, "en");
        expect(ipa).toBeDefined();
        expect(ipa).not.toContain(ASCII_G);
      });

      it(`shipped (dict-enabled) EnglishG2P: ${word}`, () => {
        const ipa = g2pDict.predict(word, "en");
        expect(ipa).toBeDefined();
        expect(ipa).not.toContain(ASCII_G);
      });

      it(`toIPA() en-US: ${word}`, () => {
        expect(toIPA(word)).not.toContain(ASCII_G);
      });

      it(`toIPA() en-GB: ${word}`, () => {
        expect(toIPA(word, "en-GB")).not.toContain(ASCII_G);
      });
    }

    // Words whose onset actually exercises the fixed rules (^gif/^gir/^giv
    // one-syllable match) should still contain the correct IPA /ɡ/ — a
    // guard against a fix that drops the consonant instead of re-encoding it.
    it("gift and girl still contain the correct IPA ɡ (U+0261)", () => {
      expect(g2pRules.predict("gift", "en")).toContain(IPA_G);
      expect(g2pRules.predict("girl", "en")).toContain(IPA_G);
    });

    // Genuinely out-of-vocabulary words (not in data/en/dict.json) that hit
    // the same ^gif/^gir/^giv onset rules through the ordinary rule fallback
    // any real caller would take for an unrecognized word.
    it("out-of-vocabulary gif-/gir-/giv- onsets stay ASCII-g-free", () => {
      for (const nonce of ["gifflebot", "girzoid", "givnak"]) {
        const ipa = g2pDict.predict(nonce, "en");
        expect(ipa).not.toContain(ASCII_G);
        expect(ipa).toContain(IPA_G);
      }
    });

    // ARPABET conversion must map the correct /ɡ/ codepoint to G and never
    // emit "undefined" for an unmapped character.
    it("ARPABET conversion maps ɡ to G with no unmapped characters", () => {
      for (const word of GIFT_GIRL_WORDS) {
        const arp = toARPABET(word);
        expect(arp).toContain("G");
        expect(arp).not.toContain("undefined");
      }
    });
  });

})();

// Original suite: en-asm-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  describe("Greek asm voicing and neighboring roots", () => {
    test.each([['plasma', 'ˈpɫæzmə'], ['plasmas', 'ˈpɫæzməz'], ["plasma's", 'ˈpɫæzməz'], ['cytoplasmic', 'ˌsaɪtəˈpɫæzmɪk']])('%s retains voiced sm by rule', (word, ipa) => {
      expect(new EnglishG2P({disableDict: true}).predict(word)).toBe(ipa);
    });
    test('miasma voices sm without claiming its initial vowel is repaired', () => {
      expect(new EnglishG2P({disableDict: true}).predict('miasma')).toContain('æzm');
    });
    test.each([["cosmic", false, "ˈkɑzmɪk"], ["cosmos", false, "ˈkɑzmoʊs"], ["dismay", false, "dɪsˈmeɪ"], ["dismal", false, "ˈdɪzməɫ"], ["basement", false, "ˈbeɪsmənt"], ["small", false, "ˈsmɔɫ"], ["asthma", false, "ˈæzmə"], ["spasm", false, "ˈspæzəm"], ["spasms", false, "ˈspæsmz"], ["plasm", false, "ˈpɫæzəm"], ["cosmic", true, "ˈkɑzmɪk"], ["cosmos", true, "ˈkɔzmoʊz"], ["dismay", true, "ˈdɪsmeɪ"], ["dismal", true, "ˈdɪsməɫ"], ["basement", true, "ˈbeɪsmənt"], ["small", true, "ˈsmɔɫ"], ["asthma", true, "ˈæzmə"], ["spasm", true, "ˈspæzəm"], ["spasms", true, "ˈspæsmz"], ["plasm", true, "ˈpɫæzəm"]])('neighbor %s (rules=%s)', (word, disableDict, ipa) => {
      expect(new EnglishG2P({disableDict}).predict(word)).toBe(ipa);
    });
    test.each([false, true])('voices the Greek roots and preserves native compound boundaries (rules=%s)', disableDict => {
      const engine = new EnglishG2P({disableDict});
      expect(engine.predict('smallplasma')).toMatch(/^sm.*zmə$/);
      expect(engine.predict('cosmosplasmic')).toMatch(/kɑzm.*zmɪk$/);
      expect(engine.predict('seismicplasma')).toMatch(/saɪzmɪk.*zmə$/);
    });

  });

})();

// Original suite: en-assimilated-ad-root-inflections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("inflections of assimilated ad- before a vouched verb root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["accredited", "əˈkɹɛdɪtɪd"],
      ["accrediting", "əˈkɹɛdɪtɪŋ"],
    ])("retains credit's short vowel in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("keeps suffix-specific reduction and neighboring doubled-consonant roots", () => {
      expect(rules.predict("accreditation", "en-US")).toBe("əˌkɹɛdəˈteɪʃən");
      expect(rules.predict("acclimated", "en-US")).toBe("ˈækɫəˌmeɪtɪd");
      expect(rules.predict("acclimating", "en-US")).toBe("ˈækɫəˌmeɪtɪŋ");
      expect(rules.predict("acceded", "en-US")).toBe("ækˈsidɪd");
      expect(rules.predict("accessed", "en-US")).toBe("ˈæksɛst");
      expect(rules.predict("acclaimed", "en-US")).toBe("əˈkɫeɪmd");
    });
  });

})();

// Original suite: en-assimilated-aff-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak assimilated ad- before fect, flict, and firm", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["affect", "əˈfɛkt"],
      ["affects", "əˈfɛkts"],
      ["afflict", "əˈfɫɪkt"],
      ["afflicts", "əˈfɫɪkts"],
      ["affirm", "əˈfɝm"],
      ["affirms", "əˈfɝmz"],
    ])("keeps the assimilated prefix weak in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["affix", "ˈæfɪks"],
      ["affable", "ˈæfəbəɫ"],
      ["affluent", "əˈfɫuənt"],
    ])("preserves the neighboring aff- class in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("preserves the noun and verb readings of affect", () => {
      const lexical = new EnglishG2P();
      expect(lexical.predict("affect", "en-US", "V")).toBe("əˈfɛkt");
      expect(lexical.predict("affect", "en-US", "N")).toBe("ˈæfɛkt");
    });
  });

})();

// Original suite: en-assimilated-ex-effect.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak assimilated ex- in effect", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("gives the effect root second-syllable stress like its inflections", () => {
      expect(rules.predict("effect", "en-US")).toBe("ɪˈfɛkt");
      expect(rules.predict("effects", "en-US")).toBe("ɪˈfɛkts");
      expect(rules.predict("effected", "en-US")).toBe("ɪˈfɛktɪd");
      expect(rules.predict("effecting", "en-US")).toBe("ɪˈfɛktɪŋ");
      expect(rules.predict("effective", "en-US")).toBe("ɪˈfɛktɪv");
    });

    it("keeps neighboring ef- words and the lexical noun/verb reading intact", () => {
      expect(rules.predict("effort", "en-US")).toBe("ˈɛfɝt");
      expect(rules.predict("efface", "en-US")).toBe("ˈɛfəs");
      const lexical = new EnglishG2P();
      expect(lexical.predict("effect", "en-US", "N")).toBe("ɪˈfɛkt");
      expect(lexical.predict("effect", "en-US", "V")).toBe("ɪˈfɛkt");
    });
  });

})();

// Original suite: en-assimilated-negative-adjectives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Transparent adjectival in- allomorphs reuse their independently vouched roots.
  describe.each([false, true])("assimilated negative adjective roots, rules=%s", disableDict => {
    it("keeps stress and complete roots through eviction and inflection", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["irrational", "illegal", "immoral", "immortal", "improbable"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [
        ["irrational", "ˌɪˈɹæʃənəɫ"], ["irrationally", "ˌɪˈɹæʃənəɫi"],
        ["illegal", "ˌɪˈɫiɡəɫ"], ["illegally", "ˌɪˈɫiɡəɫi"],
        ["immoral", "ˌɪˈmɔɹəɫ"], ["immortal", "ˌɪˈmɔɹtəɫ"],
        ["immortals", "ˌɪˈmɔɹtəɫz"], ["improbable", "ˌɪmˈpɹɑbəbəɫ"],
        ["improbably", "ˌɪmˈpɹɑbəbɫi"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves earlier weak-root and opaque-word controls", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("irresponsible")).toBe("ˌɪɹəˈspɑnsəbəɫ");
      expect(engine.predict("irreligious")).toBe("ˌɪɹəˈɫɪdʒəs");
      expect(engine.predict("immigrate")).toBe("ˈɪməˌɡɹeɪt");
      expect(engine.predict("irritable")).toMatch(/^ˈɪɹ[əɪ]təbəɫ$/);
      expect(engine.predict("improvisational")).toMatch(/ˈzeɪʃənəɫ$/);
    });
    it("accepts both complete independently vouched impious readings", () => {
      // Merriam-Webster lists both, so the older variant is not a bad expectation.
      expect(["ˈɪmpiəs", "ˌɪmˈpaɪəs"]).toContain(new EnglishG2P({ disableDict }).predict("impious"));
    });
    it("respects caller phonemic boundaries and whole children", () => {
      for (const [root, word, prefix] of [["rational", "irrational", "ˌɪɹ"], ["legal", "illegal", "ˌɪɫ"],
        ["moral", "immoral", "ˌɪm"], ["possible", "impossible", "ˌɪm"]]) {
        const engine = new EnglishG2P({ disableDict });
        const dictionary = { ...Reflect.get(engine, "dictionary") };
        delete dictionary[word];
        Reflect.set(engine, "dictionary", dictionary);
        engine.addPronunciation(root, "ˈzɛŋ");
        expect(engine.predict(word)).toBe(prefix + "ˈzɛŋ");
        engine.addPronunciation(word, "ˈbɛŋ");
        expect(engine.predict(word)).toBe("ˈbɛŋ");
      }
    });
    it("retains caller weak vowels without applying lexical weakening", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["irreligious"]);
      engine.addPronunciation("religious", "ɹiˈzɛŋ");
      expect(engine.predict("irreligious")).toBe("ˌɪɹiˈzɛŋ");
    });
    it("preserves adjective, noun and verb controls in full prose", () => {
      const api = createPhonemizer({processors: [new EnglishG2P({ disableDict })]});
      const out = api.phonemize("The illegal reader read the improbable story yesterday.", {language: "en-US", returnArray: true});
      for (const [word, ipa] of [["illegal", "ˌɪˈɫiɡəɫ"], ["reader", "ˈɹidɝ"], ["read", "ɹɛd"], ["improbable", "ˌɪmˈpɹɑbəbəɫ"]]) {
        expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
      }
    });
  });

})();

// Original suite: en-assimilated-prefix-ow.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])("keeps strong assimilated-prefix ow and weak controls (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const word of Object.keys(dictionary)) if (/allow/.test(word)) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary);
   for (const word of ["allow", "allows", "allowed", "allowing", "allowance", "allowances", "disallow", "disallowed", "appow"]) expect(e.predict(word)).toContain("aʊ");
   for (const word of ["arrow", "arrowsmith", "fallow", "follow", "below", "slow"]) expect(e.predict(word)).toContain("oʊ");
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["They allow the change.", "The allowance was small.", "The allowed amount was small."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^allow/.test(t.word))?.phoneme).toContain("aʊ");
  });
  test("keeps the caller's ow root through inflection", () => {
   const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("allow", "ˈtɛst");
   expect(e.predict("allow")).toBe("ˈtɛst"); expect(e.predict("allows")).toBe("ˈtɛsts"); expect(e.predict("allowed")).toBe("ˈtɛstɪd");
  });

})();

// Original suite: en-assimilated-stress-and-weak-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("assimilated stress and weak vowels (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["assess", "assign", "attach", "attack", "attempt", "attend", "attract"])("%s gives stress to its heavy root", word => {
      expect(g2p.predict(word, "en")).toMatch(/^əˈ[st]/);
    });
    test.each(["asset", "attic"])("%s retains initial stress over a light root", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ˈæ/);
    });
    test.each(["adolescent", "adolescence", "evanescence", "convalescent"])("%s stresses its inchoative ending", word => {
      expect(g2p.predict(word, "en")).toMatch(/ˈ[lɫn]ɛsən/);
    });
    test("descent retains its short-word stress", () => {
      expect(g2p.predict("descent", "en")).toMatch(/ˈsɛnt$/);
    });
    test("crescent retains its first stressed nucleus", () => {
      expect(g2p.predict("crescent", "en")).toMatch(/^ˈkɹɛ/);
    });
    test.each(["eligible", "intelligible", "intelligent"])("%s centralizes its weak thematic i", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɛ[lɫ]ədʒ/);
    });
    test("ineligible retains its root stress and the supplied lexical vowel", () => {
      const ipa = g2p.predict("ineligible", "en");
      expect(ipa).toMatch(/ˈn?ɛ[lɫ]/);
      expect(ipa).toMatch(disableDict ? /ɛ[lɫ]ədʒ/ : /ɛ[lɫ][əɪ]dʒ/);
    });
    test("legible retains stress on its short root", () => {
      expect(g2p.predict("legible", "en")).toMatch(/^ˈ[lɫ]ɛdʒ/);
    });
    test.each(["operator", "moderator", "interaction", "literary", "peripheral"])("%s coalesces weak e with r", word => {
      expect(g2p.predict(word, "en")).toContain("ɝ");
      expect(g2p.predict(word, "en")).not.toContain("ɪɹ");
    });
    test.each(["petition", "peninsula"])("%s centralizes its weak pe-", word => {
      expect(g2p.predict(word, "en")).toMatch(/^pə/);
    });
    test.each(["decide", "defend"])("%s retains the distinct de- prefix", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ˌ?dɪ/);
    });
    test.each(["believe", "begin"])("%s retains the distinct be- prefix", word => {
      expect(g2p.predict(word, "en")).toMatch(/^bɪ/);
    });
    test("political shifts stress from its citation stem", () => {
      expect(g2p.predict("political", "en")).toMatch(/^pəˈ[lɫ]ɪ/);
    });
  });

  // Exercise the public composition path against the independent CMU gains.
  test.each(["open", "opening", "opened", "happened"])("%s retains the weak root vowel through the public API", word => {
    expect(toIPA(word)).toContain("pən");
  });

})();

// Original suite: en-assimilated-suc-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("assimilated suc- stress", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["succeed", "səkˈsid"],
      ["success", "səkˈsɛs"],
      ["succinct", "səkˈsɪŋkt"],
      ["succumb", "səˈkʌm"],
    ])("stresses and reduces %s", (word, ipa) => {
      expect(rules.predict(word)).toBe(ipa);
    });

    it("leaves nearby suc-/suck- roots on their established routes", () => {
      expect(rules.predict("succor")).toBe("ˈsʌkɔɹ");
      expect(rules.predict("succulent")).toBe("ˈsʌkjəɫənt");
      expect(rules.predict("suck")).toBe("ˈsʌk");
      expect(rules.predict("sucrose")).toBe("ˈsukɹoʊz");
    });
  });

})();

// Original suite: en-assimilated-sup-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  // Cambridge US: support /səˈpɔrt/, suppose /səˈpoʊz/, suppress /səˈpres/,
  // and supplant /səˈplænt/. These are the assimilated sub- prefix before p-roots.
  describe.each([false, true])("assimilated sup- prefix (disableDict=%s)", disableDict => {
    const processor = new EnglishG2P({ disableDict });

    it.each([
      ["support", "səˈpɔɹt"],
      ["suppose", "səˈpoʊz"],
      ["suppress", "səˈpɹɛs"],
      ["supplant", "səˈpɫænt"],
    ])("assigns stress to the p-initial root in %s", (word, ipa) => {
      expect(processor.predict(word, "en-US")).toBe(ipa);
      if (disableDict) expect(processor.trace(word, "en-US").path).toBe("rules");
    });

    it("preserves the distinct unprefixed stems and derived forms", () => {
      expect(processor.predict("supper", "en-US")).toBe("ˈsʌpɝ");
      expect(processor.predict("supple", "en-US")).toBe("ˈsʌpəɫ");
      expect(processor.predict("super", "en-US")).toBe("ˈsupɝ");
      expect(processor.predict("supine", "en-US")).toBe("ˈsupaɪn");
      expect(processor.predict("supply", "en-US")).toBe("səˈpɫaɪ");
      expect(processor.predict("supported", "en-US")).toBe("səˈpɔɹtɪd");
      expect(processor.predict("supposed", "en-US")).toBe("səˈpoʊzd");
      expect(processor.predict("suppression", "en-US")).toBe("səˈpɹɛʃən");
      expect(processor.predict("supposition", "en-US")).toBe("ˌsʌpəˈzɪʃən");
    });
  });

  it("keeps the assimilated sup- readings in full sentence context", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = api.phonemize(
      "They support the plan. I suppose we can suppress it before it may supplant the old rule.",
      { language: "en-US", returnArray: true },
    );
    for (const [word, ipa] of [
      ["support", "səˈpɔɹt"], ["suppose", "səˈpoʊz"],
      ["suppress", "səˈpɹɛs"], ["supplant", "səˈpɫænt"],
    ]) expect(tokens.find(token => token.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-ate-pos-contrast.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  it("keeps lexical weak -ate in noun contexts and the full suffix in verb contexts", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const noun = api.phonemize("The graduate spoke.", { language: "en-US", returnArray: true });
    const verb = api.phonemize("They graduate in May.", { language: "en-US", returnArray: true });

    expect(noun.find(token => token.word === "graduate")?.phoneme).toBe("ˈɡɹædʒuət");
    expect(verb.find(token => token.word === "graduate")?.phoneme).toBe("ˈɡɹædʒuˌeɪt");
  });

  it("reduces a nonverbal -ate tail without weakening a verbal control", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const noun = api.phonemize("The climate changed.", { language: "en-US", returnArray: true });
    const estate = api.phonemize("The estate changed hands.", { language: "en-US", returnArray: true });
    const rate = api.phonemize("The current rate changed.", { language: "en-US", returnArray: true });
    const verb = api.phonemize("We will federate the states.", { language: "en-US", returnArray: true });

    expect(noun.find(token => token.word === "climate")?.phoneme).toBe("ˈkɫaɪmət");
    expect(estate.find(token => token.word === "estate")?.phoneme).toBe("ɪˈsteɪt");
    expect(rate.find(token => token.word === "rate")?.phoneme).toBe("ɹeɪt");
    expect(verb.find(token => token.word === "federate")?.phoneme).toBe("ˈfɛdɝˌeɪt");
  });

})();

// Original suite: en-ation-silent-e.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Supplied silent-e roots before -ation (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    it.each([
      ["compilation", "ˌkɑmpəˈɫeɪʃən"], ["derivation", "ˌdɛɹəˈveɪʃən"],
      ["compilations", "ˌkɑmpəˈɫeɪʃənz"], ["derivations", "ˌdɛɹəˈveɪʃənz"],
      ["deprivation", "ˌdɛpɹəˈveɪʃən"],
    ])("keeps the noun's medial vowel in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it.each([
      ["examination", "ɪɡˌzæməˈneɪʃən"], ["imagination", "ɪˌmædʒəˈneɪʃən"],
      ["preservation", "ˌpɹɛzɝˈveɪʃən"], ["quotation", "ˌkwoʊˈteɪʃən"],
      ["inactivation", "ɪˌnæktɪˈveɪʃən"], ["univation", "ˌjunɪˈveɪʃən"],
      ["deprive", "dɪˈpɹaɪv"], ["deprived", "dɪˈpɹaɪvd"], ["depriving", "dɪˈpɹaɪvɪŋ"],
    ])("preserves neighboring root classes in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it("carries a weak-vowel -mit root's rules reading into -mitation", () => {
      expect(engine.predict("limitation")).toBe("ˌɫɪmɪˈteɪʃən");
      expect(engine.predict("imitation")).toBe("ˌɪməˈteɪʃən");
      expect(engine.predict("gravitation")).toBe("ˌɡɹævɪˈteɪʃən");
    });

    it("keeps the root and derived noun distinct in connected text", () => {
      const tokens = api.phonemize("They limit the imitation and discuss the limitation.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(t => t.word === "limit")?.phoneme).toBe(disableDict ? "ˈɫɪmɪt" : "ˈɫɪmət");
      expect(tokens.find(t => t.word === "imitation")?.phoneme).toBe("ˌɪməˈteɪʃən");
      expect(tokens.find(t => t.word === "limitation")?.phoneme).toBe("ˌɫɪmɪˈteɪʃən");
    });

    it("preserves the stem, verb and participial adjective in a full sentence", () => {
      const tokens = api.phonemize("We compile the compilation from compiled records.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(t => t.word === "compile")?.phoneme).toBe("kəmˈpaɪɫ");
      expect(tokens.find(t => t.word === "compiled")?.phoneme).toBe("kəmˈpaɪɫd");
      expect(tokens.find(t => t.word === "compilation")?.phoneme).toBe("ˌkɑmpəˈɫeɪʃən");
    });

    it("keeps the verb's PRICE vowel in a paired derivation sentence", () => {
      const tokens = api.phonemize("They derive derivations from derived values.", {
        language: "en-US", returnArray: true,
      });
      for (const word of ["derive", "derived"]) {
        expect(tokens.find(t => t.word === word)?.phoneme).toMatch(/aɪv(?:d)?$/);
      }
      expect(tokens.find(t => t.word === "derivations")?.phoneme).toBe("ˌdɛɹəˈveɪʃənz");
    });

    it("uses the same noun frame for a supplied OOV prefixed root", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("recompile", "R IY0 K AH0 M P AY1 L");
      expect(custom.predict("recompilation")).toMatch(/mpəˈɫeɪʃən$/);
    });
  });

})();

// Original suite: en-ation-y-stem.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("-ation restores a final y stem before composing", () => {
    it("uses vary rather than the unrelated i-final Vari entry for variation", () => {
      const rules = new EnglishG2P({ disableDict: true });
      expect(rules.predict("variation", "en-US")).toBe("ˌvɛɹiˈeɪʃən");
    });

    it("preserves y-stem derivatives and unrelated -ation controls", () => {
      const rules = new EnglishG2P({ disableDict: true });
      for (const [word, ipa] of [
        ["vary", "ˈvɛɹi"], ["varied", "ˈvɛɹid"], ["varies", "ˈvɛɹiz"],
        ["varying", "ˈvɛɹiɪŋ"], ["variety", "vɝˈaɪəti"],
        ["variations", "ˌvɛɹiˈeɪʃənz"],
        ["aviation", "ˌeɪviˈeɪʃən"], ["radiation", "ˌɹeɪdiˈeɪʃən"],
        ["initiation", "ɪˌnɪʃiˈeɪʃən"], ["variate", "ˈvɛɹiˌeɪt"],
      ]) expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-atri-hiatus-and-iarch.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge atrium /eɪ/; Collins patriarch /peɪtriɑrk/.
  // https://dictionary.cambridge.org/dictionary/chinese-traditional-english/心房
  // https://www.dictionary.com/browse/patriarch
  describe.each([false, true])("stressed a before tri hiatus and Greek -iarch, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["atrium", "ˈeɪtɹiəm"],
      ["compatriot", "kəmˈpeɪtɹiət"],
      ["patriot", "ˈpeɪtɹiət"],
      ["patriarch", "ˈpeɪtɹiɑɹk"],
      ["patriarch's", "ˈpeɪtɹiɑɹks"],
      ["matriarch", "ˈmeɪtɹiɑɹk"],
      ["matriarchy", "ˈmeɪtɹiɑɹki"],
      ["patriarchy", "ˈpeɪtɹiɑɹki"],
      ["repatriate", "ɹiˈpeɪtɹieɪt"],
    ])("keeps root, derivation and inflection segments: %s", (word, ipa) => {
      expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("does not broaden into front-vowel or nonhiatus neighbors", () => {
      expect(engine.predict("patrie")).toMatch(/^ˈpæt/);
      expect(engine.predict("patrician")).toMatch(/ˈtɹɪ/);
      expect(engine.predict("matrimony")).toMatch(/^ˈmæt/);
      expect(engine.predict("matrix")).toBe("ˈmeɪtɹɪks");
      expect(engine.predict("search")).toBe("ˈsɝtʃ");
      expect(engine.predict("cornstarch")).toMatch(/stɑɹtʃ$/);
      expect(engine.predict("overarching")).toContain("ɑɹtʃ");
    });
    it("applies the spelling class to OOV forms and honors a caller target", () => {
      expect(engine.predict("zatrium")).toBe("ˈzeɪtɹiəm");
      expect(engine.predict("diarch")).toMatch(/ɑɹk$/);
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("zatrium", "ˈzɛŋ");
      expect(own.predict("zatrium")).toBe("ˈzɛŋ");
    });
    it("preserves surrounding noun, adjective and verb controls", () => {

      const tokens = englishTokens(engine, "They record a kind minder following the patriarch.");
      expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
      expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
      expect(tokens.find(t => t.word === "patriarch")?.phoneme.replace(/ˌ/g, "")).toBe("ˈpeɪtɹiɑɹk");
      if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
    });
  });

})();

// Original suite: en-auxiliary-context.test.ts
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

  describe("auxiliary frames with negation, adverbs and quotation", () => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    it.each([
      ["John won't permit it.", "permit", "pɝˈmɪt"],
      ["The guard can’t permit it.", "permit", "pɝˈmɪt"],
      ["John cannot read.", "read", "ɹid"],
      ["She shouldn't read yesterday's notes.", "read", "ɹid"],
      ["She wouldn't read last week.", "read", "ɹid"],
      ["I couldn’t “read” the label yesterday.", "read", "ɹid"],
      ["The form you can’t record is new.", "record", "ɹɪˈkɔɹd"],
      ["They should rather invite people.", "invite", "ɪnˈvaɪt"],
      ["He would later read.", "read", "ɹid"],
      ["The guard could readily permit it.", "permit", "pɝˈmɪt"],
      ["Would he gladly present a record?", "present", "pɹɪˈzɛnt"],
      ["The “can’t” record was deleted.", "record", "ˈɹɛkɝd"],
      ['The "cannot" record was missing.', "record", "ˈɹɛkɝd"],
      ["She isn't present today.", "present", "ˈpɹɛzənt"],
      ["He hasn't read the label.", "read", "ɹɛd"],
      ["Her choices reflect free will broadly present across cultures.", "present", "ˈpɹɛzənt"],
      ["We refer to readily present evidence.", "present", "ˈpɹɛzənt"],
      ["I would rather he quickly read.", "read", "ɹɛd"],
      ["I read that book yesterday.", "read", "ɹɛd"],
      ["I read books every day.", "read", "ɹid"],
    ])("selects the contextual reading in %s", (sentence, word, ipa) => {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(reading(tokens.find(token => token.word === word)!.phoneme)).toEqual(reading(ipa));
    });

    it.each(["'", "‘", "’"])("accepts negation apostrophe %s", apostrophe => {
      const tokens = api.phonemize(`John shouldn${apostrophe}t read yesterday's notes.`, {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(token => token.word === "read")!.phoneme).toBe("ɹid");
    });

    it("preserves explicit custom pronunciation before contextual inference", () => {
      const custom = new EnglishG2P();
      custom.addPronunciation("read", "ˈɹaɪd");
      const instance = createPhonemizer({ processors: [custom] });
      expect(instance.toIPA("I cannot read yesterday's notes.", "en-US")).toContain("ɹaɪd");
    });

    it("passes original punctuation and independent sentence streams to the tagger", () => {
      const processor = new EnglishG2P();
      const spy = jest.spyOn(processor, "tagWord");
      const instance = createPhonemizer({ processors: [processor] });
      instance.phonemize("The “can’t” record was deleted. She can record it.", {
        language: "en-US", returnArray: true,
      });
      const contexts = spy.mock.calls.filter(([word]) => word === "record").map(([, context]) => context!);
      expect(contexts[0].prev).toBe("can’t");
      expect(contexts[0].next).toBe("was");
      expect(contexts[0].sentence!.words).toEqual(["The", "“", "can’t", "”", "record", "was", "deleted", "."]);
      expect(contexts[0].sentence!.index).toBe(4);
      expect(contexts[1].sentence!.words).toEqual(["She", "can", "record", "it", "."]);
      expect(contexts[1].sentence!.index).toBe(2);
    });
  });

})();

// Original suite: en-auxiliary-s-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("auxiliary citation s versus lexical codas, rules=%s", disableDict => {
    test("present auxiliaries retain voiced citation endings", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("has")).toBe("ˈhæz");
      expect(engine.predict("is")).toBe("ˈɪz");
      expect(engine.predict("his")).toBe("ˈhɪz");
      expect(engine.predict("its")).toMatch(/ts$/);
      expect(engine.predict("was")).toMatch(/z$/);
      for (const word of ["gas", "hiss", "this", "thus", "us"]) expect(engine.predict(word)).toMatch(/s$/);
    });
    test("full sentences preserve weak auxiliaries and ordinary nouns", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const out = api.phonemize("He has a gas stove. The record is clear.", { language: "en-US", returnArray: true });
      expect(out.find(t => t.word === "has")!.phoneme).toBe("həz");
      expect(out.find(t => t.word === "is")!.phoneme).toBe("ɪz");
      expect(out.find(t => t.word === "gas")!.phoneme).toMatch(/ɡæs$/);
    });
    test("caller-owned roots retain their supplied citation output", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const word of ["has", "is", "was"]) { engine.addPronunciation(word, "ˈtɛst"); expect(engine.predict(word)).toBe("ˈtɛst"); }
    });
  });
  test("the rules path voices the past auxiliary without imposing a citation vowel on does", () => {
    const engine = new EnglishG2P({ disableDict: true });
    expect(engine.predict("was")).toMatch(/z$/);
    expect(engine.predict("does")).toMatch(/z$/);
  });

})();

// Original suite: en-avi-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the avi- root across stress and derivation", () => {
    const rules = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });

    it.each([
      ["aviation", "ˌeɪviˈeɪʃən"],
      ["aviator", "ˈeɪvieɪtɝ"],
      ["aviary", "ˈeɪviɛɹi"],
      ["avian", "ˈeɪviən"],
      ["avionics", "ˌeɪviˈɑnɪks"],
    ])("keeps FACE in %s when the avi- root is strong", (word, expected) => {
      expect(rules.toIPA(word, "en-US")).toBe(expected);
    });

    it.each([
      ["aviate", "əviˈeɪt"],
      ["aviated", "əviˈeɪtɪd"],
      ["aviating", "əviˈeɪtɪŋ"],
      ["avid", "ˈævɪd"],
      ["avidity", "əˈvɪdəti"],
    ])("preserves the unstressed or checked control %s", (word, expected) => {
      expect(rules.toIPA(word, "en-US")).toBe(expected);
    });

    it("keeps the root vowel in sentences across the noun and adjective controls", () => {
      const tokens = rules.phonemize("An avid aviator sits beside an aviary.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.filter(token => ["avid", "aviator", "aviary"].includes(token.word))
        .map(token => token.phoneme)).toEqual(["ˈævɪd", "ˈeɪvieɪtɝ", "ˈeɪviɛɹi"]);
    });
  });

})();
