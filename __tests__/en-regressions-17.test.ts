// Original suite: en-personally-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("-ally derives from the personal root (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });


    it("keeps the rule-supported weak vowel in personally", () => {
      expect(engine.predict("personally", "en")).toBe("ˈpɝsənəɫi");
      expect(engine.predict("personal", "en", "ADJ")).toBe(disableDict ? "ˈpɝsənəɫ" : "ˈpɝsɪnəɫ");
      expect(engine.predict("person", "en", "N")).toBe("ˈpɝsən");
      expect(engine.predict("person", "en", "V")).toBe("ˈpɝsən");
    });

    it("preserves the reading in a full sentence with noun and adjective controls", () => {
      const tokens = englishTokens(engine, "The person spoke personally about the personal account.");
      expect(tokens.find(token => token.word === "person")?.phoneme).toBe("ˈpɝsən");
      expect(tokens.find(token => token.word === "personally")?.phoneme).toBe("ˈpɝsənəɫi");
      expect(tokens.find(token => token.word === "personal")?.phoneme).toBe(disableDict ? "ˈpɝsənəɫ" : "ˈpɝsɪnəɫ");
    });

    it("leaves neighboring -ally families on their own root readings", () => {
      expect(engine.predict("especially", "en")).toBe("əˈspɛʃəɫi");
      expect(engine.predict("eventually", "en")).toBe("ɪˈvɛntʃuəɫi");
      expect(engine.predict("continually", "en")).toBe("kənˈtɪnjuəɫi");
    });
  });

})();

// Original suite: en-phas-phras-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("voiced final -se in Greek phas-/phras- roots", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["phase", "ˈfeɪz"],
      ["phrase", "ˈfɹeɪz"],
      ["paraphrase", "ˈpɛɹəˌfɹeɪz"],
    ])("voices the root in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("voices the root in rephrase while retaining its separate prefix vowel", () => {
      expect(rules.predict("rephrase", "en-US")).toBe("ɹɛˈfɹeɪz");
    });

    it.each([
      ["alphased", "ˈæɫfeɪst"],
      ["alphasing", "ˈæɫfeɪsɪŋ"],
    ])("does not voice the unrelated alpha stem in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["case", "ˈkeɪs"],
      ["base", "ˈbeɪs"],
      ["chase", "ˈtʃeɪs"],
    ])("keeps homographic -ase voiceless in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-phonemic-nuclei.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const lightL = (ipa: string | null | undefined): string | undefined => ipa?.replace(/ɫ/g, "l");

  // MW current/flower/shower: connected speech retains polysyllabic primary stress.
  describe.each([false, true])("phonemic nuclei and public stress (rules=%s)", disableDict => {
    test("explicit caller pronunciations retain their stress policy", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const supplied of [
        "ˈvɝi", "ˈviɝ", "ˈvaɪɝ",
        "ˈvia", "ˈvaʊə",
        "ˈvɝ", "ˈvaɪ", "ˈvoʊ", "ˈvɔɪ",
      ]) {
        engine.addPronunciation("vurni", supplied);
        for (const pos of ["N", "ADJ", "V", "ADV"])
          expect(engine.predict("vurni", "en-US", pos)).toBe(supplied);
      }
    });

    test.each([
      ["liar", "ˈlaɪɝ"], ["currant", "ˈkɝənt"],
      ["flowering", "ˈflaʊɝɪŋ"], ["showering", "ˈʃaʊɝɪŋ"],
    ])("keeps complete %s readings for every caller role", (word, expected) => {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"])
        expect(lightL(engine.predict(word, "en-US", pos))).toBe(expected);
    });

    test.each([
      ["The liar left the house.", "liar", "ˈlaɪɝ"],
      ["The currant buns are warm.", "currant", "ˈkɝənt"],
      ["The flowering plant is tall.", "flowering", "ˈflaʊɝɪŋ"],
      ["They are showering now.", "showering", "ˈʃaʊɝɪŋ"],
    ])("preserves full target stress in %s", (sentence, word, expected) => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(lightL(tokens.find(token => token.word === word)?.phoneme)).toBe(expected);
    });

    test("single diphthong nuclei keep connected-speech stress suppression", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, expected] of [["go", "ɡoʊ"], ["boy", "bɔɪ"], ["cry", "kɹaɪ"]])
        for (const pos of ["N", "ADJ", "V"])
          expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });

    test("raised diphthongs in the existing route do not gain a stress mark", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("guys", "en-US", "N")).not.toContain("ˈ");
    });

    test.each([
      ["bear", "bɛə"], ["near", "nɪə"], ["tour", "tʊə"],
      ["care", "kɛə"], ["beer", "bɪə"],
      ["R's", "ɑːz"], ["A's", "eɪz"], ["U's", "juz"],
    ])("RP centering or letter nucleus stays single in %s", (word, expected) => {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of ["N", "ADJ", "V"])
        expect(engine.predict(word, "en-GB", pos)).toBe(expected);
    });

    test.each(["bird", "dog", "lot"])("RP %s keeps its existing phones and single-nucleus policy", word => {
      const engine = new EnglishG2P({ disableDict });
      const citation = engine.predict(word, "en-GB");
      expect(citation).not.toBeNull();
      for (const pos of ["N", "ADJ", "V"])
        expect(engine.predict(word, "en-GB", pos)).toBe(citation?.replace("ˈ", ""));
    });

    test("a supplied syllabic consonant remains a nucleus after inflection", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("vurn", "ˈvʌn̩");
      for (const pos of ["N", "ADJ", "V"])
        expect(engine.predict("vurns", "en-US", pos)).toBe("ˈvʌn̩z");
    });

    test("preserves the existing literal morphology route", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("stewards")).toBe("ˈstuɝdz");
    });
  });

})();

// Original suite: en-phonetic-es-and-ue.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule1;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;
  test.each([false,true])("composes es by the final phone and preserves ue stems (rules=%s)",disableDict=>{
   const e=new EnglishG2P({disableDict}),d={...Reflect.get(e,"dictionary")};for(const w of ["hues","hughes","hughes'","values'","leagues'","boxes","buses","gases","dishes","roses"])delete d[w];Reflect.set(e,"dictionary",d);
   for(const [word,ipa]of [["hues","ˈhjuz"],["Hughes","ˈhjuz"],["Hughes'","ˈhjuz"],["values'","ˈvæljuz"],["leagues'","ˈliɡz"],["cayes","ˈkeɪz"]])expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
   expect(e.predict("gases")).toMatch(/ɡæs[ɪə]z$/);
   expect(e.predict("muses")).toMatch(/mjuz[ɪə]z$/);expect(e.predict("ruses")).toMatch(/ɹuz[ɪə]z$/);
   expect(e.predict("heroes")).toMatch(/oʊz$/);expect(e.predict("echoes")).toMatch(/oʊz$/);
   for(const w of ["boxes","buses","gases"])expect(e.predict(w)).toMatch(/s[ɪə]z$/);expect(e.predict("dishes")).toMatch(/ʃ[ɪə]z$/);expect(e.predict("roses")).toMatch(/z[ɪə]z$/);
   // Foreign names retain their lexical reading on the default route.
   if(!disableDict)expect(parseIpa(e.predict("Antilles")!)).toEqual(parseIpa("ænˈtɪliz"));
   const api=createPhonemizer({processors:[e]});expect(api.phonemize("The hues of the boxes were clear.",{language:"en-US",returnArray:true}).find(t=>t.word==="hues")?.phoneme.replace(/[ˈˌ]/g,"")).toBe("hjuz");
  });
  test("keeps caller ownership through restored es and y plurals",()=>{
   const e=new EnglishG2P({disableDict:true});e.addPronunciation("hero","ˈdju");expect(e.predict("heroes")).toBe("ˈdjuz");e.addPronunciation("Hugh","ˈnju");expect(e.predict("Hughes")).toBe("ˈnjuz");e.addPronunciation("hue","ˈzɛmp");expect(e.predict("hues")).toBe("ˈzɛmps");e.addPronunciation("hues","ˈtɛst");expect(e.predict("hues")).toBe("ˈtɛst");
  });

})();

// Original suite: en-phonotactics-audit.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/phonotactics") = require("../src/en/phonotactics");
  const { applyPhonotactics, addInitialSecondary } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule1.default;

  // Audit regressions for src/en/phonotactics.ts.
  //
  // applyPhonotactics runs on the output of BOTH the rule path and the
  // dictionary/exception-table path, so every rule in it must be measured
  // against the lexicon it post-processes, not just against the rule path.
  // These cases pin the environments where a rule was found to be rewriting
  // pronunciations the lexicon already had right. Each frame carries the
  // dict ratio that decided it; the words named are class exemplars.
  //
  // The unit tests below call applyPhonotactics directly: the mined exception
  // table is regenerated by build-dict, so a full-IPA expectation routed
  // through EnglishG2P can move underneath the test, but the phonotactic
  // transform on a given input string cannot.

  describe("phonotactics: STRUT promotion is a transcription-convention choice", () => {
    // normalizeStrut promotes a stressed /ə/ to /ʌ/ and demotes an unstressed
    // /ʌ/ to /ə/. The two references this repo scores against disagree about
    // that position, so the promotion is an adapter, not a phonological claim:
    //
    //   data/en/dict.json (open-dict-data ipa-dict en_US, which the shipped
    //     exception table copies verbatim) writes /ə/ under stress too — it
    //     contains /ʌ/ 0 times against 5714 entries with a stressed /ə/.
    //   scripts/evaluate-common-accuracy.ts (pinned CMUdict) maps AH1/AH2 to
    //     /ʌ/ and AH0 to /ə/, i.e. it wants the promotion.
    //
    // Deleting the promotion measured runtime strict parity 92.28% → 95.10%
    // and top-5000 segment accuracy 92.26% → 89.62%; 136 of the 346 remaining
    // top-5000 mismatches would then differ from CMUdict by ə/ʌ alone. These
    // tests pin the convention as it currently ships so the choice is explicit.
    it("promotes a stressed schwa to STRUT", () => {
      expect(applyPhonotactics("ˈhəndɝd", "hundred")).toBe("ˈhʌndɝd");
      expect(applyPhonotactics("ˈwən", "one")).toBe("ˈwʌn");
    });

    it("demotes an unstressed STRUT to schwa", () => {
      expect(applyPhonotactics("ˈtɹʌbəɫsʌm", "troublesome")).toBe("ˈtɹʌbəɫsəm");
    });

    it("exempts the weak-form function word 'the'", () => {
      expect(applyPhonotactics("ˈðə", "the")).toBe("ˈðə");
    });
  });



  describe("phonotactics: /ɪɹ/ coalescence skips a diphthong offglide", () => {
    // /[aeoɔ]ɪɹ/ 342 : /[aeoɔ]ɝ/ 10 — the /ɪ/ after a diphthong nucleus is an
    // offglide, so /aɪɹ/ is /aɪ/ + onset /ɹ/, not a lax /ɪ/ before coda /ɹ/.
    it("keeps aɪɹ / eɪɹ / ɔɪɹ intact", () => {
      expect(applyPhonotactics("ˈbaɪɹən", "byron")).toBe("ˈbaɪɹən");
      expect(applyPhonotactics("ˈsaɪɹəs", "cyrus")).toBe("ˈsaɪɹəs");
      expect(applyPhonotactics("ˈkɔɪɹoʊ", "coiro")).toBe("ˈkɔɪɹoʊ");
      expect(applyPhonotactics("ˌkaɪɹoʊˈpɹæktɪk", "chiropractic")).toBe(
        "ˌkaɪɹoʊˈpɹæktɪk",
      );
    });

    it("still coalesces an unstressed /ɪɹ/ after a consonant", () => {
      // /Cɝ/ 20066 : /CɪɹV/ 932.
      expect(applyPhonotactics("ˈsɛntɪɹd", "centered")).toBe("ˈsɛntɝd");
      expect(applyPhonotactics("ˈbætɪɹiz", "batteries")).toBe("ˈbætɝiz");
    });
  });

  describe("phonotactics: syllabic-/l/ epenthesis needs an obstruent onset", () => {
    // After an obstruent the lexicon epenthesizes without exception
    // (/Cəɫ/+C 778 : /Cɫ/+C 0); after /ɹ/ it does not (carlson, marlboro),
    // and /ɫj/, /ɫw/ are onsets (306 : 16).
    it("does not break up a /ɹl/ coda", () => {
      expect(applyPhonotactics("ˈkɑɹɫsən", "carlson")).toBe("ˈkɑɹɫsən");
      expect(applyPhonotactics("ˈmɑɹɫbɝoʊ", "marlboro")).toBe("ˈmɑɹɫbɝoʊ");
    });

    it("does not break up an /lj/ or /lw/ onset", () => {
      expect(applyPhonotactics("ˌɪnˈtæɡɫjoʊ", "intaglio")).toBe("ˌɪnˈtæɡɫjoʊ");
      expect(applyPhonotactics("ˈbɫwin", "blouin")).toBe("ˈbɫwin");
    });

    it("still epenthesizes after an obstruent", () => {
      expect(applyPhonotactics("ˈsaɪkɫd", "cycled")).toBe("ˈsaɪkəɫd");
    });
  });

  describe("phonotactics: environment derivatives select the weak PRICE stem", () => {
    it.each([
      ["environment", "ˈɛnvɝənmənt", "ɪnˈvaɪɹənmənt"],
      ["environmental", "ˌɛnvɝənˈmɛntəl", "ɪnˌvaɪɹənˈmɛntəl"],
    ])("reinterprets the stem in %s", (word, input, expected) => {
      expect(applyPhonotactics(input, word)).toBe(expected);
    });

    it.each([
      ["environ", "ˈɛnvɝən"],
      ["environs", "ˈɛnvɝənz"],
      ["environment-friendly", "ˈɛnvɝənməntˈfɹɛndli"],
      ["environmentally", "ɪnˌvaɪɹənˈmɛntəli"],
    ])("preserves the neighboring form %s", (word, ipa) => {
      expect(applyPhonotactics(ipa, word)).toBe(ipa);
    });
  });

  describe("phonotactics: word-initial /h/ + sonorant is a licit onset", () => {
    // The lexicon keeps it 24 times and drops it once (hlavaty, hruska,
    // hmong, hnat). Word-final /h/ is still dropped: 2754 : 18.
    it("keeps hl / hr / hm / hn word-initially", () => {
      expect(applyPhonotactics("ˈhɫæd", "hlad")).toBe("ˈhɫæd");
      expect(applyPhonotactics("ˈhɹubi", "hruby")).toBe("ˈhɹubi");
      expect(applyPhonotactics("ˈhmɔŋ", "hmong")).toBe("ˈhmɔŋ");
      expect(applyPhonotactics("ˈhnæt", "hnat")).toBe("ˈhnæt");
    });

    it("still drops a word-internal or word-final /h/", () => {
      expect(applyPhonotactics("ˈæhktɝ", "akhtar")).toBe("ˈæktɝ");
      expect(applyPhonotactics("ˈbɔɹəh", "borah")).toBe("ˈbɔɹə");
    });
  });

  describe("phonotactics: -ed allomorph keeps a nucleus schwa", () => {
    // An obstruent + /ɹ/ + /d/ is not a possible English coda: /Cɹəd/ 9,
    // /Cɹd/ 0.
    it("does not create an illegal /Cɹd/ coda", () => {
      expect(applyPhonotactics("ˈæɫfɹəd", "alfred")).toBe("ˈæɫfɹəd");
      expect(applyPhonotactics("ˈheɪtɹəd", "hatred")).toBe("ˈheɪtɹəd");
      expect(applyPhonotactics("ˈseɪkɹəd", "sacred")).toBe("ˈseɪkɹəd");
    });

    it("still applies the allomorph elsewhere", () => {
      expect(applyPhonotactics("ˈhaɪpəd", "hyped")).toBe("ˈhaɪpt");
      expect(applyPhonotactics("ˈɹaɪməd", "rhymed")).toBe("ˈɹaɪmd");
    });
  });

  describe("phonotactics: velar -ed adjectives retain their lexical syllable", () => {
    it("preserves lexical /kəd/ and /ɡəd/ outside verb readings", () => {
      for (const [ipa, word] of [
        ["ˈneɪkəd", "naked"], ["ˈwɪkəd", "wicked"], ["ˈkɹʊkəd", "crooked"],
        ["ˈɹæɡəd", "ragged"], ["ˈɹʌɡəd", "rugged"], ["ˈɫɛɡəd", "legged"],
      ]) {
        expect(applyPhonotactics(ipa, word, undefined, true)).toBe(ipa);
        expect(applyPhonotactics(ipa, word, "ADJ", true)).toBe(ipa);
        expect(applyPhonotactics(ipa, word, "V", true)).toBe(ipa.replace(/(k|ɡ)əd$/, (_, c) => `${c}${c === "k" ? "t" : "d"}`));
      }
    });

    it("leaves ordinary velar-final past forms unchanged", () => {
      for (const [ipa, word] of [
        ["ˈfɫæɡd", "flagged"], ["ˈbeɪkt", "baked"], ["ˈæskt", "asked"],
        ["ˈpɪkt", "picked"], ["ˈwɝkt", "worked"],
      ]) {
        expect(applyPhonotactics(ipa, word)).toBe(ipa);
        expect(applyPhonotactics(ipa, word, "V")).toBe(ipa);
      }
    });

    it("lets tokenizer-supplied verb POS select the regular past allomorph", () => {
      const g2p = new EnG2P();
      expect(g2p.predict("wicked", "en", "ADJ")).toBe("ˈwɪkɪd");
      expect(g2p.predict("wicked", "en", "V")).toBe("wɪkt");
      expect(g2p.predict("crooked", "en", "ADJ")).toBe("ˈkɹʊkɪd");
      expect(g2p.predict("crooked", "en", "V")).toBe("kɹʊkt");
      expect(g2p.predict("bryked", "en", "V")).toBe("bɹaɪkt");
    });
  });

  describe("phonotactics: rhotic -ire stems before agent -er", () => {
    it("restores the stem coda instead of stacking two rhotic nuclei", () => {
      expect(applyPhonotactics("əˈkwaɪɝɝ", "acquirer")).toBe("əˈkwaɪɹɝ");
      expect(applyPhonotactics("dɪˈzaɪɝɝ", "desirer")).toBe("dɪˈzaɪɹɝ");
    });
    it("leaves unrelated -irer forms alone", () => {
      expect(applyPhonotactics("ˈmɪɹɝ", "mirror")).toBe("ˈmɪɹɝ");
    });
  });

  describe("phonotactics: initial secondary stress is rule-path only", () => {
    // addInitialSecondary is no longer part of applyPhonotactics — applied to
    // lexical output it stamped a ˌ the lexicon does not write on 1550
    // exception-table entries. applyPostStress calls it for the rule and
    // morphology paths instead.
    it("is not applied by applyPhonotactics", () => {
      expect(applyPhonotactics("ɛnsaɪkɫəˈpidiə", "encyclopedia")).toBe(
        "ɛnsaɪkɫəˈpidiə",
      );
    });

    it("still marks an unmarked long Latinate word when called directly", () => {
      expect(addInitialSecondary("ɛnsaɪkɫəˈpidiə")).toBe("ˌɛnsaɪkɫəˈpidiə");
    });
  });

  describe("phonotactics: lexical entries survive the pass intact", () => {
    // The regression this audit exists for: a phonotactics rule that rewrites
    // a correct lexical pronunciation ships a worse one than the table holds.
    const g2p = new EnG2P();
    const cases: Array<[string, string]> = [
      ["byron", "ˈbaɪɹən"],
      ["admire", "ædˈmaɪɹ"],
      ["carlson", "ˈkɑɹɫsən"],
      ["hruska", "ˈhɹʊskə"],
      ["alfred", "ˈæɫfɹəd"],
      ["chiropractic", "ˌkaɪɹoʊˈpɹæktɪk"],
    ];
    it.each(cases)("%s", (word, ipa) => {
      expect(g2p.predict(word, "en")).toBe(ipa);
    });
  });

})();

// Original suite: en-plicit-schwa.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("unstressed -plicit suffix", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["explicit", "ɪksˈpɫɪsət"],
      ["explicitly", "ɪksˈpɫɪsətɫi"],
      ["complicit", "kəmˈpɫɪsət"],
    ])("centralizes the final vowel in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("matches implicit's stress-stripped pronunciation despite secondary-stress conventions", () => {
      expect(rules.predict("implicit", "en-US")?.replace(/[ˈˌ]/g, "")).toBe("ɪmpɫɪsət");
    });

    it.each([
      ["duplicity", "duˈpɫɪsəti"],
      ["simplicity", "sɪmˈpɫɪsəti"],
      ["multiplicity", "ˌmʌɫtəˈpɫɪsəti"],
    ])("leaves related -plicity in %s unchanged", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["The clause was explicit.", "explicit", "ɪksˈpɫɪsət"],
      ["He was complicit in it.", "complicit", "kəmˈpɫɪsət"],
      ["The meaning stayed implicit.", "implicit", "ɪmˈpɫɪsət"],
      ["They spoke explicitly.", "explicitly", "ɪksˈpɫɪsətɫi"],
    ])("preserves the contextual reading in %s", (sentence, word, ipa) => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
      const token = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find((item) => item.word === word);
      expect(token?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-plural-compound-heads.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  describe.each([false,true])("vouched plural compound heads, disableDict=%s",disableDict=>{
   const engine=new EnglishG2P({disableDict});
   it.each([["trees","ˈtɹiz"],["sees","ˈsiz"],["fees","ˈfiz"],["bees","ˈbiz"],["toes","ˈtoʊz"],["stewards","ˈstuɝdz"]])("preserves an evicted literal stem in %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
   it("distinguishes the present verb from its unchanged neighboring noun",()=>{
    const api=createPhonemizer({processors:[engine]});
    const out=api.phonemize("The sailor sees the trees.",{language:"en-US",returnArray:true});
    expect(out.find(t=>t.word==="sees")?.phoneme).toBe("siz");
    expect(out.find(t=>t.word==="trees")?.phoneme).toBe("tɹiz");
    expect(engine.predict("say")).toBe("ˈseɪ");
   });
   it("retains a plural root before a full tail",()=>{
    expect(engine.predict("townspeople")).toBe("ˈtaʊnzˌpipəɫ");
    expect(engine.predict("woodspeople")).toBe("ˈwʊdzˌpipəɫ");
    expect(engine.predict("newspaper")).toMatch(/^ˈnj?uzˌpeɪpɝ$/);
    expect(engine.predict("newsletter")).toMatch(/^ˈnj?uzˌɫɛtɝ$/);
   });
   it.each([["airspace","ˈɛɹˌspeɪs"],["keystone","ˈkiˌstoʊn"],["joystick","ˈdʒɔɪˌstɪk"],["peasant","ˈpɛzənt"],["hausfeld","ˈhaʊsfɛɫd"],["moosman","ˈmusmən"]])("preserves the original boundary in %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
   it("retains full sentence roles and tense",()=>{
    const api=createPhonemizer({processors:[engine]});
    const out=api.phonemize("The kind townspeople read the newspaper yesterday.",{language:"en-US",returnArray:true});
    expect(out.find(t=>t.word==="townspeople")?.phoneme).toBe("ˈtaʊnzˌpipəɫ");
    expect(out.find(t=>t.word==="read")?.phoneme).toBe("ɹɛd");
   });
   it("preserves caller roots, heads, tails and whole-word overrides",()=>{
    const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};delete dictionary.townspeople;Reflect.set(own,"dictionary",dictionary);
    own.addPronunciation("town","ˈzɛŋ");expect(own.predict("townspeople")).toBe("ˈzɛŋzˌpipəɫ");
    own.addPronunciation("towns","ˈkɛŋ");expect(own.predict("townspeople")).toBe("ˈkɛŋˌpipəɫ");
    own.addPronunciation("people","ˈbɛŋ");expect(own.predict("townspeople")).toBe("ˈkɛŋˌbɛŋ");
    own.addPronunciation("townspeople","ˈdɛŋ");expect(own.predict("townspeople")).toBe("ˈdɛŋ");
   });
  });

})();

// Original suite: en-plural-gerund-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  it.each([
    ["These methods permit preventing damage.", "permit", "pɝˈmɪt"],
    ["The rules permit recording conversations.", "permit", "pɝˈmɪt"],
    ["The camping permit hanging on the wall is expired.", "permit", "ˈpɝmɪt"],
    ["The parks permit hanging on the wall is expired.", "permit", "ˈpɝmɪt"],
    ["The Adams Extract building continued production.", "Extract", "ˈɛkstɹækt"],
    ["These permits are valid.", "permits", "ˈpɝmɪts"],
  ])("preserves finite and nominal frames in %s", (sentence, word, ipa) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });

})();

// Original suite: en-plural-infinitive.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;

  test("plural subjects license silent-e predicates governing infinitives", () => {
    for (const sentence of ["The monks refuse to capitulate.", "Both speakers refuse to talk.", "Many local restaurants refuse to host events."]) expect(pick(sentence, "refuse")).toContain("ˈfjuz");
    expect(pick("The neighbours live to entertain guests.", "live")).toBe("ɫɪv");
  });
  test("nominal, adjective and zero-change tense controls remain separate", () => {
    expect(pick("The refuse was collected.", "refuse")).toMatch(/^ˈɹɛ/);
    expect(pick("The neighbours are close to the house.", "close")).toBe("kɫoʊs");
    expect(pick("The neighbours read to the children yesterday.", "read")).toBe("ɹɛd");
    expect(pick("The neighbours will read to the children.", "read")).toBe("ɹid");
  });

})();

// Original suite: en-plural-into-frame.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("plural subject with into complement (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const pos = (sentence: string, word: string) => {
      const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
      const index = words.findIndex(token => token.toLowerCase() === word);
      return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
    };

    test.each([
      ["The creatures combine into several groups.", "combine"],
      ["The compounds convert into liquid.", "convert"],
      ["They combine into a group.", "combine"],
    ])("finds the predicate in %s", (sentence, word) => {
      expect(pos(sentence, word)).toBe("V");
    });

    test("keeps a later coordinated predicate verbal", () => {
      const sentence = "Laser treatment causes tattoo pigment particles to heat up and fragment into smaller pieces.";
      expect(pos(sentence, "fragment")).toBe("V");
      if (!disableDict) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === "fragment")?.phoneme).toBe("fɹæɡˈmɛnt");
    });

    test("preserves a nominal subject and explicit readings", () => {
      expect(pos("The combines into the fields were old.", "combines")).not.toBe("V");
      if (!disableDict) {
        expect(api.phonemize("The creatures combine into several groups.", { language: "en-US" })).toBe("ðə ˈkɹitʃɝz kəmˈbaɪn ˈɪntu ˈsɛvɝəɫ ɡɹups.");
        expect(engine.predict("combine", "en-US", "N")).toBe("ˈkɑmbaɪn");
        expect(engine.predict("combine", "en-US", "ADJ")).toBe("ˈkɑmbaɪn");
        expect(engine.predict("combine", "en-US", "V")).toBe("kəmˈbaɪn");
      }
    });
  });

})();

// Original suite: en-possessive-ordinal.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("possessive ordinal noun phrase (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tag = (sentence: string, word: string) => {
      const words = sentence.match(/[A-Za-z]+(?:['’]s)?|[^A-Za-z\s]/g) ?? [];
      const index = words.findIndex(token => token.toLowerCase() === word);
      return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
    };

    test("recognizes the noun after a possessive and ordinal", () => {
      expect(tag("Euclid's fifth postulate of geometry.", "postulate")).toBe("N");
      expect(tag("Euclid's second postulate.", "postulate")).toBe("N");
      expect(tag("Mary's first record of the event survived.", "record")).toBe("N");
      expect(tag("Mary's second permit for the project expired.", "permit")).toBe("N");
      if (!disableDict) expect(api.phonemize("Euclid's fifth postulate of geometry.", { language: "en-US" })).toContain("ˈpɑstʃəɫət");
    });

    test("retains verbs when the ordinal is the subject", () => {
      expect(tag("Mary's fifth leads the team.", "leads")).toBe("V");
      expect(tag("They will postulate the theory.", "postulate")).toBe("V");
      expect(tag("Mary's health permits travel.", "permits")).not.toBe("N");
      expect(tag("Mary's first separate account was closed.", "separate")).not.toBe("N");
      if (!disableDict) expect(api.phonemize("They will postulate the theory.", { language: "en-US" })).toContain("ˈpɑstʃəˌɫeɪt");
    });
  });

})();

// Original suite: en-post-s-plural-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("rime-sensitive monosyllabic -st plurals, rules=%s", disableDict => {
    test("keeps the singular nucleus when plural -s closes the word", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [["posts", "ˈpoʊsts"], ["hosts", "ˈhoʊsts"], ["ghosts", "ˈɡoʊsts"]]) {
        expect(engine.predict(word)).toBe(ipa);
        expect(engine.predict(word.toUpperCase())).toBe(ipa);
      }
    });

    test("keeps contrasting coda and caller-owned root controls", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("costs")).toBe("ˈkɑsts");
      expect(engine.predict("mists")).toBe("ˈmɪsts");
      engine.addPronunciation("post", "ˈtɛst");
      expect(engine.predict("posts")).toBe("ˈtɛsts");
    });
  });

})();

// Original suite: en-posttonic-lar.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { syllableToIPA } = __suiteModule1;

  // Oxford/MW similar and MW basilar attest this weak nucleus independently.
  describe.each([false, true])("post-primary i before final lar, rules=%s", (disableDict) => {
    test.each([undefined, "N", "ADJ", "V"])("retains the frame under caller POS %s", (pos) => {
      const engine = new EnglishG2P({ disableDict });
      for (const word of ["similar", "basilar", "vimsilar"])
        expect(engine.predict(word, "en-US", pos)).toMatch(/[ms]əɫɝ$/);
    });

    test("composes a novel verb from its rule-owned root", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("vimsilared", "en-US", "V")).toBe("ˈvɪmsəɫɝd");
      expect(engine.predict("vimsilaring", "en-US", "V")).toBe("ˈvɪmsəɫɝɪŋ");
    });

    test("keeps caller-supplied target readings", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("vimsilar", "ˈvɪmsɪlɝ");
      expect(engine.predict("vimsilar")).toBe("ˈvɪmsɪlɝ");
    });
  });

  test("reduces only the owned weak slot, preserving stress and tail boundaries", () => {
    const render = (stressed: boolean, finalTail: boolean, secondary: boolean, previousPrimary: boolean, previous = "si") =>
      syllableToIPA("mi", 1, stressed, false, "lar", undefined, previous, finalTail, "lar", secondary, previous, previousPrimary);
    expect(render(false, true, false, true)).toBe("mə");
    for (const prefix of ["non", "un", "dis", "pre"])
      expect(render(false, true, false, true, prefix)).not.toBe("mə");
    for (const control of [[true, true, false, true], [false, true, true, true], [false, false, false, true], [false, true, false, false]])
      expect(render(control[0], control[1], control[2], control[3])).not.toBe("mə");
  });

})();

// Original suite: en-posttonic-mine.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { isWeakAMineRoot } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  describe.each([false, true])("posttonic a + mine (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const access = engine as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.examine;

    it("retains KIT after the parent exception is removed", () => {
      expect(engine.predict("examine")).toBe("ɪɡˈzæmɪn");
    });
    it.each([
      ["examines", disableDict ? "ɪɡˈzæmɪnz" : "ɪɡˈzæmənz"],
      ["examined", disableDict ? "ɪɡˈzæmɪnd" : "ɪɡˈzæmənd"],
      ["examining", "ɪɡˈzæmɪnɪŋ"],
      ["examiner", disableDict ? "ɪɡˈzæmɪnɝ" : "ɪɡˈzæmənɝ"],
      ["examiners", disableDict ? "ɪɡˈzæmənɝz" : "ɪɡˈzæmɪnɝz"],
      ["examinable", "ɪɡˈzæmɪnəbəɫ"],
    ])("preserves the frozen derived reading of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([
      ["carmine", disableDict ? "ˈkɑɹˌmaɪn" : "ˈkɑɹmən"],
      ["calamine", "ˈkæɫəˌmaɪn"], ["dopamine", "ˈdɑpəˌmaɪn"],
      ["histamine", disableDict ? "ˈhɪstəˌmaɪn" : "ˈhɪstəˌmin"],
      ["bromine", disableDict ? "ˈbɹoʊmaɪn" : "ˈbɹoʊˌmin"],
      ["landmine", "ˈɫændˌmaɪn"],
    ])("preserves the frozen dictionary/rule control for %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves caller-owned roots and their inflections", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("examine", "ɪɡˈzɛŋ");
      expect(custom.predict("examine")).toBe("ɪɡˈzɛŋ");
      expect(custom.predict("examining")).toBe("ɪɡˈzɛŋɪŋ");
      custom.addPronunciation("examining", "ˈkɛŋ");
      expect(custom.predict("examining")).toBe("ˈkɛŋ");
    });
    it("preserves noun, adjective and finite verb readings in a sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will examine the carpet.");
      for (const [word, ipa] of [["examine", "ɪɡˈzæmɪn"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["carpet", "ˈkɑɹpət"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

  it("keeps vowel teams outside the checked-a class", () => {
    expect(isWeakAMineRoot("examine")).toBe(true);
    expect(isWeakAMineRoot("monoamine")).toBe(false);
    expect(isWeakAMineRoot("thiamine")).toBe(false);
  });

})();

// Original suite: en-posttonic-rhotic-se.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("posttonic rhotic -se (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    test.each([["purchase", "ˈpɝtʃəs"], ["purpose", "ˈpɝpəs"]])("keeps the weak final syllable of %s across caller POS", (word, expected) => {
      for (const pos of [undefined, "N", "ADJ", "V"]) expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });
    test.each([
      ["They purchase a book.", "purchase", "ˈpɝtʃəs"],
      ["The purchase was final.", "purchase", "ˈpɝtʃəs"],
      ["The purpose was clear.", "purpose", "ˈpɝpəs"],
    ])("keeps the reading in %s", (sentence, word, expected) => {
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
    });
    test.each([["purchases", "ˈpɝtʃəsəz"], ["purchased", "ˈpɝtʃəst"], ["purchasing", "ˈpɝtʃəsɪŋ"], ["purposes", "ˈpɝpəsəz"], ["purposeful", "ˈpɝpəsfəɫ"]])("preserves derived %s", (word, expected) => {
      expect(engine.predict(word, "en-US")).toBe(expected);
    });
    test.each(["surprise", "surmise"])("preserves the PRICE vowel in %s", word => {
      expect(engine.predict(word, "en-US", "V")).toMatch(/aɪz$/);
    });
    test("preserves the rime in a hyphenated compound", () => {
      expect(engine.predict("all-purpose", "en-US", "ADJ")).toMatch(/ˈpɝpəs$/);
      const tokens = api.phonemize("This is an all-purpose tool.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "purpose")?.phoneme).toBe("ˈpɝpəs");
    });
    test("preserves a caller-supplied pronunciation", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("purchase", "Z AE1 P");
      expect(custom.predict("purchase", "en-US")).toBe("ˈzæp");
    });
    test("preserves a caller-supplied strong rime in derived forms", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("bercase", "B ER1 K EY2 S");
      expect(custom.predict("bercased", "en-US")).toBe("ˈbɝˌkeɪst");
      expect(custom.predict("bercasing", "en-US")).toBe("ˈbɝˌkeɪsɪŋ");
    });
  });

  test.each([false, true])("keeps the same weak rime in en-GB (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("purchase", "en-GB", "V")).toBe("ˈpɜːtʃəs");
    expect(engine.predict("purpose", "en-GB", "N")).toBe("ˈpɜːpəs");
    expect(engine.predict("surmise", "en-GB", "V")).toMatch(/aɪz$/);
  });

})();

// Original suite: en-pre-l-rounding.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("pre-l source rounding (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["salt", "bald", "false", "alter", "alternative", "also", "always", "baltimore", "malta", "walter"])("%s rounds its pre-l a", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɔ[lɫ]/);
    });
    test.each(["alto", "altitude", "altimeter", "altruism", "maltreat", "malware", "alderman"])("%s retains its learned/prefix vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/æ[lɫ]/);
    });
    test("aldinger keeps the supplied lexical variant and native rule vowel", () => {
      expect(g2p.predict("aldinger", "en")).toMatch(disableDict ? /^ˈæ[lɫ]/ : /^ˈɔ[lɫ]/);
    });
    test.each(["royalty", "loyalty"])("%s does not round a vowel in a merged diphthong slot", word => {
      expect(g2p.predict(word, "en")).not.toMatch(/ɔɪɔ[lɫ]/);
    });
    test.each(["salad", "balance", "valley", "galaxy"])("%s keeps a checked vowel outside the dental frame", word => {
      expect(g2p.predict(word, "en")).toMatch(/æ/);
    });
    test.each(["salted", "salting", "balding"])("%s retains its attested rounded root through inflection", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɔ[lɫ]/);
    });
  });

  test.each(["salt", "bald", "false", "always"])("%s is preserved through the public API", word => {
    expect(toIPA(word)).toMatch(/ɔ[lɫ]/);
  });

})();

// Original suite: en-prefix-ew-batch.test.ts
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

  describe.each([false, true])("be/re boundary before w (disableDict=%s)", disableDict => {
    it.each([
      ["reward", "ɹiˈwɔɹd"], ["rewarding", "ɹiˈwɔɹdɪŋ"],
      ["reword", "ɹiˈwɝd"], ["rework", "ɹiˈwɝk"],
      ["beware", "bɪˈwɛɹ"], ["bewilder", "bɪˈwɪɫdɝ"],
      ["bewitch", "bɪˈwɪtʃ"],
    ])("preserves the onset after the prefix in %s", (word, ipa) => {
      expect(reading(new EnglishG2P({ disableDict }).predict(word)!)).toEqual(reading(ipa));
    });

    it.each([
      ["brew", "ˈbɹu"], ["grew", "ˈɡɹu"], ["screw", "ˈskɹu"],
      ["dewy", "ˈdui"], ["buyer", "ˈbaɪɝ"], ["night", "ˈnaɪt"],
      ["Lighthizer", "ˈɫaɪthaɪzɝ"],
    ])("keeps the neighboring digraph or morpheme in %s", (word, ipa) => {
      expect(reading(new EnglishG2P({ disableDict }).predict(word)!)).toEqual(reading(ipa));
    });

    it("retains noun, adjective and verb readings in full sentences", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ["The reward was generous.", "reward", "ɹiˈwɔɹd"],
        ["The rewarding job matters.", "rewarding", "ɹiˈwɔɹdɪŋ"],
        ["They reward careful work.", "reward", "ɹiˈwɔɹd"],
        ["They can rewind the tape.", "rewind", "ɹiˈwaɪnd"],
      ]) {
        const target = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)!;
        expect(reading(target.phoneme)).toEqual(reading(ipa));
      }
      // Merriam-Webster attests both primary-stress placements for the noun.
      const noun = api.phonemize("The rewind button is broken.", { language: "en-US", returnArray: true }).find(t => t.word === "rewind")!;
      expect([reading("ˈɹiwaɪnd"), reading("ɹiˈwaɪnd")]).toContainEqual(reading(noun.phoneme));
    });
  });

  it("preserves the existing lexical surname readings after rebuilding", () => {
    const engine = new EnglishG2P();
    for (const [word, ipa] of [["Rewerts", "ˈɹuɝts"], ["Rewey", "ˈɹui"], ["Rewis", "ˈɹuɪs"]]) {
      expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
    }
  });

})();

// Original suite: en-prefix-force.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Cambridge accord/afford: primary FORCE survives the weak -ford suffix.
  describe.each([false, true])("closed assimilated prefixes, disableDict=%s", disableDict => {
    it("preserves the root across eviction and derivation", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["accord", "afford", "affordable"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [
        ["accord", "əˈkɔɹd"], ["accords", "əˈkɔɹdz"],
        ["accordance", "əˈkɔɹdəns"], ["afford", "əˈfɔɹd"],
        ["affords", "əˈfɔɹdz"], ["affordable", "əˈfɔɹdəbəɫ"],
        ["affordance", "əˈfɔɹdəns"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves adjacent weak rhotic endings", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("allard")).toBe("ˈæɫɝd");
      expect(engine.predict("allert")).toBe("ˈæɫɝt");
      expect(engine.predict("stafford")).toBe("ˈstæfɝd");
      expect(engine.predict("counterman")).toBe(disableDict ? "ˈkaʊntɝmən" : "ˈkaʊntɝˌmæn");
      expect(engine.predict("cooper")).toBe("ˈkupɝ");
    });
    it("retains noun, adjective and verb context", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const out = api.phonemize("The accord was affordable and they can afford it.", {
        language: "en-US", returnArray: true,
      });
      for (const [word, ipa] of [["accord", "əˈkɔɹd"], ["affordable", "əˈfɔɹdəbəɫ"], ["afford", "əˈfɔɹd"]]) {
        expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
      }
    });
    it("preserves caller-owned roots and explicit derived words", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("afford", "ˈzɛŋ");
      expect(engine.predict("affords")).toBe("ˈzɛŋz");
      engine.addPronunciation("affords", "ˈkɛŋ");
      expect(engine.predict("affords")).toBe("ˈkɛŋ");
    });
  });

  // MW admits both strong and weak cooperative endings; compare the prefix only.
  describe("vouched co- roots", () => {
    it("retains separate prefix vowels without stealing longer prefixes", () => {
      const engine = new EnglishG2P({ disableDict: true });
      expect(engine.predict("coefficient")).toBe("ˌkoʊɪˈfɪʃənt");
      expect(engine.predict("coarticulate")).toBe("ˌkoʊɑɹˈtɪkjəˌɫeɪt");
      expect(engine.predict("cooperative")).toMatch(/^ˌkoʊˈɑp/);
      expect(engine.predict("counterman")).toBe("ˈkaʊntɝmən");
      expect(engine.predict("cooper")).toBe("ˈkupɝ");
    });
    it.each([false, true])("respects caller prefix, root and child ownership (%s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["coarticulate"]);
      engine.addPronunciation("co", "ˈzɛŋ");
      engine.addPronunciation("articulate", "ˈkɛŋ");
      expect(engine.predict("coarticulate")).toBe("ˌzɛŋˈkɛŋ");
      engine.addPronunciation("coarticulate", "ˈbɛŋ");
      expect(engine.predict("coarticulate")).toBe("ˈbɛŋ");
    });
  });

})();

// Original suite: en-prefix-grammar-bound.test.ts
(() => {
  const __suiteModule0: typeof import("node:child_process") = require("node:child_process");
  const { spawn } = __suiteModule0;

  test("repeated prefixes finish when the ending does not match", async () => {
    const source = require.resolve("../src/en/syllabify");
    const check = `const { syllabify, assignStress } = require(${JSON.stringify(source)});
      for (const word of ["ab".repeat(32) + "x", "ab".repeat(32) + "mend"]) {
        const syllables = syllabify(word), stress = assignStress(syllables, word);
        if (!Number.isInteger(stress) || stress < 0 || stress >= syllables.length) process.exit(1);
      }`;
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, ["--require", "tsx/cjs", "-e", check], { stdio: "ignore" });
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("prefix stress worker exceeded its completion bound"));
      }, 5000);
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", code => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`prefix stress worker exited ${code}`));
      });
    });
  }, 10000);

})();

// Original suite: en-prefix-stance-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("bound -stance after prefixes (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["instance", "ˈɪnstəns"], ["instances", "ˈɪnstənsəz"],
      ["substance", "ˈsʌbstəns"], ["substances", "ˈsʌbstənsəz"],
      ["stance", "ˈstæns"], ["instant", "ˈɪnstənt"],
      ["distance", "ˈdɪstəns"], ["distanced", "ˈdɪstənst"], ["distancing", "ˈdɪstənsɪŋ"],
    ])("keeps the suffix or independent root in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains roots and prefix stress after exception eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["instance", "substance"]) delete access.dictionary[word];
      expect(evicted.predict("instance")).toBe("ˈɪnstəns");
      expect(evicted.predict("substance")).toBe("ˈsʌbstəns");
      expect(evicted.predict("noninstance")).toBe("nɑˈnɪnstəns");
      expect(evicted.predict("noninstances")).toBe("nɑˈnɪnstənsəz");
      expect(evicted.predict("nonsubstance")).toBe("nɑnˈsʌbstəns");
    });
    it("preserves caller-owned complete roots", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("instance", "ˈɪnstæns");
      expect(custom.predict("instance")).toBe("ˈɪnstæns");
      expect(custom.predict("noninstance")).toMatch(/ɪnstæns$/);
    });
    it("preserves adjective, noun and verb context in complete sentences", () => {

      const tokens = englishTokens(engine, "The instant reader will work with this substance, for instance.");
      expect(tokens.find(t => t.word === "substance")?.phoneme).toBe("ˈsʌbstəns");
      expect(tokens.find(t => t.word === "instance")?.phoneme).toBe("ˈɪnstəns");
      expect(tokens.find(t => t.word === "instant")?.phoneme).toBe("ˈɪnstənt");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();
