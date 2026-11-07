// Original suite: en-rule-reduction.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for unstressed-vowel quality (/ɪ/ vs /ə/), the
  // 2026-09-10 heuristic-learning pass. Each case names a frame, not a word:
  // the frame was counted over the whole dictionary and then measured as a
  // win/loss list on the rules-only path before adoption.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("unstressed <i> before an obstruent + liquid reduces", () => {
    it.each([
      ["compatible", "kəmˈpætəbəɫ"],
      ["collectible", "kəˈɫɛktəbəɫ"],
      ["credible", "ˈkɹɛdəbəɫ"],
      ["principle", "ˈpɹɪnsəpəɫ"],
      ["emigrant", "ˈɛməɡɹənt"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("unstressed <i> before a single t in a long word reduces", () => {
    it.each([
      ["absurdity", "əbˈsɝdəti"],
      ["capacitance", "kəˈpæsətəns"],
      ["military", "ˈmɪɫəˌtɛɹi"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("unstressed <i> two groups from the end reduces before f/g/m/n/s/z", () => {
    it.each([
      ["organization", "ˌɔɹɡənəˈzeɪʃən"],
      ["investigate", "ɪnˈvɛstəˌɡeɪt"],
      // Merriam-Webster acidification: ə-ˌsi-də-fə-ˈkā-shən.
      ["acidification", "əˌsɪdəfəˈkeɪʃən"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("unstressed <e> two groups from the end reduces", () => {
    it.each([
      ["secretary", "ˈsɛkɹəˌtɛɹi"],
      ["ceremony", "ˈsɛɹəˌmoʊni"],
      ["cinematic", "ˌsɪnəˈmætɪk"],
      ["desegregate", "dɪˈsɛɡɹəˌɡeɪt"],
      ["allegory", "ˈæɫəˌɡɔɹi"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("frames that keep /ɪ/", () => {
    it.each([
      // -ing: 0 ə vs 532 ɪ in the dict
      ["willing", "ˈwɪɫɪŋ"],
      // before c, which is ɪ-keeping (africa, republic, medical)
      ["africa", "ˈæfɹɪkə"],
      // a word-initial vowel group is not a reduction site
      ["invite", "ɪnˈvaɪt"],
      ["believe", "bɪˈɫiv"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("unstressed final -tain", () => {
    it.each(["certain", "captain", "mountain", "fountain", "curtain", "chieftain"])(
      "reduces the ending in %s", (word) => expect(rules(word)).toMatch(/tən$/),
    );

    it.each(["retain", "detain", "obtain", "stain"])(
      "keeps the stressed diphthong in %s", (word) => expect(rules(word)).toMatch(/teɪn$/),
    );
  });

  describe("-tain plurals after rule-exact stem eviction", () => {
    it.each(["mountains", "captains", "curtains", "fountains", "chieftains"])(
      "preserves the reduced stem in %s", (word) => expect(rules(word)).toMatch(/tənz$/),
    );
  });

})();

// Original suite: en-rule-reduction2.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Second pass over the unstressed-vowel residue (2026-09-10). The frames
  // here are conditioned on the SUFFIX rather than on the following
  // consonant and the word-end distance: the reduced slot is the one
  // immediately before an unstressed suffix, wherever the primary sits.
  // Each frame was counted over data/en/dict.json and then measured as a
  // rules-only win/loss list before adoption.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("the penult <i> before a -y suffix reduces", () => {
    it.each([
      ["cavity", "ˈkævəti"],
      ["gravity", "ˈɡɹævəti"],
      ["entity", "ˈɛntəti"],
      ["equity", "ˈɛkwəti"],
      ["purity", "ˈpjʊɹəti"],
      ["policy", "ˈpɑɫəsi"],
      ["gossipy", "ˈɡɑsəpi"],
      ["mutiny", "ˈmjutəni"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("carries through the -ies/-ied inflections", () => {
      expect(rules("abilities")).toBe("əˈbɪɫətiz");
      expect(rules("amplifies")).toBe("ˈæmpɫəˌfaɪz");
    });

    it("leaves a stressed <i> in the same shape alone", () => {
      expect(rules("city")).toBe("ˈsɪti");
    });
  });

  // The -ly/-al/-ment handlers price the base without the suffix in view,
  // so these assert only the segment the reduction owns: the stems come
  // from the mined table and the rest of the string can move with it.
  describe("the pre-suffix vowel of a -ly adverb reduces", () => {
    it.each([
      ["angrily", "ŋɡɹəɫi"],
      ["happily", "pəɫi"],
      ["easily", "zəɫi"],
      ["family", "məɫi"],
    ])("%s contains %s", (word, seg) => expect(rules(word)).toContain(seg));

    it("does not touch a -y base the suffix did not rewrite", () => {
      expect(rules("daily")).not.toContain("əɫi");
    });
  });

  describe("-bly reads its -ble base so the cluster rule can fire", () => {
    it.each([
      ["credibly", "dəbɫi"],
      ["possibly", "səbɫi"],
      ["forcibly", "səbɫi"],
      ["flexibly", "səbɫi"],
    ])("%s contains %s", (word, seg) => expect(rules(word)).toContain(seg));
  });

  describe("the vowel before an unstressed Latinate ending reduces", () => {
    it.each([
      ["luminous", "ˈɫumənəs"],
      ["ominous", "ˈɑmənəs"],
      ["militant", "ˈmɪɫətənt"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it.each([
      ["animal", "nəməɫ"],
      ["capital", "pətəɫ"],
      ["terminal", "mənəɫ"],
      ["cardinal", "dənəɫ"],
      ["condiment", "dəmənt"],
    ])("%s contains %s", (word, seg) => expect(rules(word)).toContain(seg));
  });

  describe("a word-final <e> under a geminate t raises to /ɪ/", () => {
    it.each([
      ["bartlett", "ˈbɑɹtɫɪt"],
      ["beckett", "ˈbɛkɪt"],
      ["brackett", "ˈbɹækɪt"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("recognizes the -cket KIT rime with a single t", () => {
      expect(rules("bracket")).toBe("ˈbɹækɪt");
    });
  });

  // Unstressed vowel before a final silent-e -ce: schwa applies in e.g. palace,
  // while independently attested checked <i> keeps /ɪ/ (Cambridge: notice,
  // practice). Their derived forms remain an open class because the current
  // pinned full-dictionary references trade more strict matches than they gain.
  describe("the unstressed vowel before -ce reduces", () => {
    it.each([
      ["palace", "ɫəs"],
      ["notice", "tɪs"],
      ["purchase", "tʃəs"], // Oxford records the weak vowel for both noun and verb.
      ["furnace", "nəs"],
    ])("%s ends in %s", (word, tail) => expect(rules(word)).toMatch(new RegExp(`${tail}$`)));

    it("leaves a free root after a two-syllable compounding prefix", () => {
      expect(rules("interface")).toMatch(/feɪs$/);
    });

    it("does not count an inflection toward trisyllabic laxing", () => {
      expect(rules("notices")).toMatch(/^ˈnoʊ/);
    });

    it("keeps the regular /ɪz/ ending in -tice plurals", () => {
      expect(rules("notices")).toBe("ˈnoʊtɪsɪz");
      expect(rules("practices")).toBe("ˈpɹæktɪsɪz");
      expect(rules("justices")).toBe("ˈdʒʌstɪsɪz");
      expect(rules("malpractices")).toBe("ˌmæɫˈpɹæktɪsɪz");
    });

    it("preserves the checked root vowel in -tice past tense forms", () => {
      expect(rules("noticed")).toBe("ˈnoʊtɪst");
      expect(rules("practiced")).toBe("ˈpɹæktɪst");
    });

    it("keeps the weak /əz/ convention for neighboring sibilant plurals", () => {
      expect(rules("classes")).toBe("ˈkɫæsəz");
      expect(rules("buses")).toBe("ˈbʌsəz");
    });
  });

  // A word-initial closed <o> before the stress keeps its full vowel, like
  // <a> and <e> (2026-09-26); the com-/con-/ob- prefixes still reduce.
  describe("the initial closed <o> frame", () => {
    it("keeps /ɑ/ in dog·matic", () => expect(rules("dogmatic")).toMatch(/^dɑɡ/));
    it("still reduces ob- and com-", () => {
      expect(rules("objective")).toMatch(/^əb/);
      expect(rules("community")).toMatch(/^kə/);
    });
  });

  // An unstressed word-final -ine after a reduced/French-loan gram does not
  // take the magic-e /aɪ/ (2026-09-26).
  describe("unstressed -ine after reduced/French grams", () => {
    it.each(["clandestine", "termine"])("%s has no /aɪn/", (w) => expect(rules(w)).not.toMatch(/aɪn$/));
    it("keeps alpine /aɪn/", () => expect(rules("alpine")).toMatch(/aɪn$/));
  });

})();

// Original suite: en-rule-rhotic.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for unstressed rhotic syllables and the unstressed
  // vowel qualities fixed alongside them: the inflected -its/-ists ending and
  // the word-initial <e> closed by a sonorant. Every case is a rule, not a
  // word — the word named is the class exemplar, and each frame was measured
  // over the whole dict before adoption.
  //
  // An unstressed /ɝ/ sitting immediately before a stress mark + vowel keeps
  // its r-colouring; the /ɹ/ is NOT re-analysed as the onset of the stressed
  // syllable. Measured over data/en/dict.json: 1659 entries spell that
  // position /ɝ/ against 101 that spell it /ə/ + /ɹ/ (16:1), and the
  // de-rhoticizing rule that used to run in the phonotactic pass scored
  // 360:9 strict against the lexicon on the rules-only dump — plus it was
  // rewriting dictionary output at runtime, since the phonotactic pass runs
  // on every path. Removed; these cases pin the behaviour.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("unstressed rhotic before a stressed syllable keeps /ɝ/", () => {
    describe("medially", () => {
      it.each([
        ["operating", "ˈɑpɝˌeɪtɪŋ"],
        ["operation", "ˌɑpɝˈeɪʃən"],
        ["operational", "ˌɑpɝˈeɪʃənəɫ"],
        ["generation", "ˌdʒɛnɝˈeɪʃən"],
        ["federation", "ˌfɛdɝˈeɪʃən"],
        ["cooperation", "ˌkwɑpɝˈeɪʃən"],
        ["authorized", "ˈɔθɝˌaɪzd"],
        ["terrorism", "ˈtɛɹɝˌɪzəm"],
        ["toronto", "tɝˈɑntoʊ"],
        ["correctly", "kɝˈɛktɫi"],
        ["derived", "dɝˈaɪvd"],
      ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

      // collaboration is built from collaborate, which leaves the mined table
      // once the -ate stress rule makes it rule-exact; the whole-word path has
      // no secondary on co·LLA (two open slots), so only the rhotic segment
      // this rule owns is pinned.
      it("collaboration keeps /ɝ/ before the stressed -ation", () => {
        expect(rules("collaboration")).toMatch(/bɝˈeɪʃən$/);
      });

      // incorporated reaches the rules through a morphology stem, so its
      // leading secondary mark depends on the mined exception table and
      // moves when the table is rebuilt. Assert the rhotic this rule owns.
      it("keeps the rhotic in a word built from a lexical stem", () => {
        expect(rules("incorporated")).toMatch(/ˈkɔɹpɝˌeɪtɪd$/);
      });
    });

    // arising derives from a stem the rules get right on their own, so the
    // stem is not in the mined table and the -ing join reads it by rule;
    // what this case owns is the rhotic, not the stem's vowel.
    it("keeps the rhotic when the stem is rule-derived", () => {
      expect(rules("arising")).toMatch(/^ɝ/);
    });

    describe("word-initially", () => {
      it.each([
        ["arrived", "ɝˈaɪvd"],
        ["arranged", "ɝˈeɪndʒd"],
        ["originally", "ɝˈɪdʒənəɫi"],
      ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
    });
  });

  // The -s handlers build the plural from the stem's pronunciation, so a
  // stem whose final <i> is written /ə/ carried that schwa into the plural.
  // The lexicon raises it before the /ts/ or /sts/ cluster (-its 21 ɪ : 8 ə,
  // -ists 30 : 14), which is where credit ˈkɹɛdət / credits ˈkɹɛdɪts and
  // artist ˈɑɹtəst / artists ˈɑɹtɪsts come from.
  describe("inflected -its/-ists raise the stem schwa to /ɪ/", () => {
    it.each([
      ["credits", "ˈkɹɛdɪts"],
      ["profits", "ˈpɹɑfɪts"],
      ["spirits", "ˈspɪɹɪts"],
      ["artists", "ˈɑɹtɪsts"],
      ["jurists", "ˈdʒʊɹɪsts"],
      ["panelists", "ˈpænəɫɪsts"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves the singular stem alone", () => {
      expect(rules("credit")).toBe("ˈkɹɛdɪt");
      expect(rules("artist")).toBe("ˈɑɹtɪst");
    });
  });

  // A word-initial unstressed <e> closed by a sonorant coda keeps its full
  // /ɛ/ rather than raising to /ɪ/; an open initial syllable still reduces,
  // and so does a sonorant followed by /t/ or /s/. Measured 71 ɛ : 19 ɪ over
  // data/en/dict.json on exactly that frame.
  describe("word-initial unstressed <e> before a sonorant coda", () => {
    it.each([
      ["embargo", "ɛmˈbɑɹɡoʊ"],
      ["endorse", "ɛnˈdɔɹs"],
      ["enforce", "ɛnˈfɔɹs"],
      ["enlarge", "ɛnˈɫɑɹdʒ"],
      ["ellington", "ɛˈɫɪŋtən"],
      ["elfrieda", "ɛɫˈfɹidə"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves an open initial syllable reduced", () => {
      expect(rules("election")).toBe("ɪˈɫɛkʃən");
      expect(rules("erosion")).toBe("ɪˈɹoʊʒən");
    });

    it("leaves a sonorant + /t/ or /s/ coda reduced", () => {
      expect(rules("entirely")).toBe("ɪnˈtaɪɝɫi");
      expect(rules("ensconce")).toBe("ɪnˈskɑns");
    });
  });

})();

// Original suite: en-rule-secondary-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for alternating (rhythmic) secondary stress:
  // the beat two syllables from the primary keeps its full vowel instead
  // of being flattened by the reduction pass. Every case is a class
  // exemplar, not a word; the frames and their dict ratios live on
  // `secondaryStressIndices` in src/en/syllabify.ts. Each expectation
  // below is the dictionary's own pronunciation.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("pretonic beat two syllables before the primary keeps its vowel", () => {
    it.each([
      ["application", "ˌæpɫəˈkeɪʃən"],
      ["competition", "ˌkɑmpəˈtɪʃən"],
      ["combination", "ˌkɑmbəˈneɪʃən"],
      ["conservation", "ˌkɑnsɝˈveɪʃən"],
      ["academic", "ˌækəˈdɛmɪk"],
      ["economic", "ˌɛkəˈnɑmɪk"],
      ["expedition", "ˌɛkspəˈdɪʃən"],
      ["acrobatic", "ˌækɹəˈbætɪk"],
      ["alcoholic", "ˌæɫkəˈhɑɫɪk"],
      ["abolition", "ˌæbəˈɫɪʃən"],
      ["allegation", "ˌæɫəˈɡeɪʃən"],
      ["alphabetic", "ˌæɫfəˈbɛtɪk"],
      ["anaconda", "ˌænəˈkɑndə"],
    ])("%s → %s", (word, ipa) => {
      expect(rules(word)).toBe(ipa);
    });
  });

  describe("a medial linking vowel is not a beat", () => {
    it.each([
      ["fortification", "ˌfɔɹtəfəˈkeɪʃən"],
      ["organization", "ˌɔɹɡənəˈzeɪʃən"],
    ])("%s → %s", (word, ipa) => {
      expect(rules(word)).toBe(ipa);
    });
  });

  describe("post-tonic beat keeps its vowel only before an obstruent coda", () => {
    it.each([
      ["argonaut", "ˈɑɹɡəˌnɔt"],
      ["arthropod", "ˈɑɹθɹəˌpɑd"],
      ["alcatraz", "ˈæɫkəˌtɹæz"],
      ["armistead", "ˈɑɹmɪˌstɛd"],
      ["adaptaplex", "əˈdæptəˌpɫɛks"],
    ])("%s → %s", (word, ipa) => {
      expect(rules(word)).toBe(ipa);
    });

    // The inflectional -es syllable is not a beat.
    it.each([
      ["campuses", "ˈkæmpəsəz"],
      ["circuses", "ˈsɝkəsəz"],
    ])("%s → %s", (word, ipa) => {
      expect(rules(word)).toBe(ipa);
    });
  });

  // A secondary-stressed STRUT is written /ə/ in this lexicon, so the
  // un- prefix stays reduced even when it lands on a beat. Asserted on
  // the vowel, not the whole string: the ˌ mark on an initial schwa is a
  // separate open question (dict ˌənɪmˈpɫɔɪmənt).
  it("un- prefix beat stays schwa", () => {
    expect(rules("unemployment")).toMatch(/^ˌ?ənɪmˈpɫɔɪmənt$/);
  });

})();

// Original suite: en-rule-sibilants.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for the `s` voicing frames added in the 2026-09
  // heuristic-learning pass. Every case is a rule, not a word: the word
  // named is the class exemplar, and each frame was measured over the full
  // dict (win/loss on the rules-only dump) before adoption.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("-se on a consonant + open u stem voices", () => {
    it.each([
      ["fuse", "ˈfjuz"],
      ["muse", "ˈmjuz"],
      ["ruse", "ˈɹuz"],
    ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps /s/ where the stem is longer than u|se", () => {
      expect(rules("use")).toBe("ˈjus");
      expect(rules("abuse")).toBe("əˈbjus");
    });
  });

  describe("s opening a syllable after an open one", () => {
    it.each([
      ["chosen", "ˈtʃoʊzən"],
      ["rosen", "ˈɹoʊzən"],
      ["cosey", "ˈkoʊzi"],
      ["mosey", "ˈmoʊzi"],
      ["rosie", "ˈɹoʊzi"],
      ["hosie", "ˈhoʊzi"],
      ["reason", "ˈɹizən"],
      ["season", "ˈsizən"],
      ["treason", "ˈtɹizən"],
      ["peasant", "ˈpɛzənt"],
      ["pheasant", "ˈfɛzənt"],
      ["pleasant", "ˈpɫɛzənt"],
      ["easel", "ˈizəɫ"],
      ["weasel", "ˈwizəɫ"],
      ["feasible", "ˈfizəbəɫ"],
      ["paisley", "ˈpeɪzɫi"],
      ["beasley", "ˈbizɫi"],
      ["keesler", "ˈkizɫɝ"],
      ["visit", "ˈvɪzɪt"],
      ["revisit", "ɹiˈvɪzɪt"],
      ["visitor", "ˈvɪzɪtɝ"],
      ["visible", "ˈvɪzəbəɫ"],
      ["divisible", "dɪˈvɪzəbəɫ"],
      ["depository", "dɪˈpɑzəˌtɔɹi"],
    ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves the ea tails that keep /s/ alone", () => {
      expect(rules("easter")).toBe("ˈistɝ");
      expect(rules("measure")).toBe("ˈmɛʒɝ");
      expect(rules("base")).toBe("ˈbeɪs");
    });
  });

  describe("s after an ab-/ob-/de- prefix before a -serv-/-sorb- stem", () => {
    it.each([
      ["deserve", "dɪˈzɝv"],
      ["desertion", "dɪˈzɝʃən"],
      ["observe", "əbˈzɝv"],
    ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("-ser on an oe/ey/oo name base voices", () => {
    it.each([
      ["loeser", "ˈɫoʊzɝ"],
      ["heyser", "ˈheɪzɝ"],
    ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

})();

// Original suite: en-rule-tail-recovery-batch.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/postlex") = require("../src/en/postlex");
  const { applyPostStress } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;

  const reading = (ipa: string) => {
    const { phones, primary } = parseIpa(ipa);
    return { phones, primary };
  };

  describe.each([false, true])("rule tails after exception eviction (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    // Simulate eviction per instance; never alter the shared imported table.
    const table = { ...Reflect.get(engine, "dictionary") };
    for (const root of ["elastic", "technologic", "academic", "alcoholic", "economic"]) delete table[root];
    Object.defineProperty(engine, "dictionary", { value: table });

    it.each([
      ["viscoelastic", "vɪskoʊɪˈlæstɪk"],
      ["picoelastic", "pikoʊɪˈlæstɪk"],
      ["biotechnological", "ˌbaɪoʊˌtɛknəˈlɑdʒɪkəl"],
      ["nonacademic", "nɑnˌækəˈdɛmɪk"],
      ["nonalcoholic", "nɑnˌælkəˈhɑlɪk"],
      ["noneconomic", "nɑnˌɛkəˈnɑmɪk"],
    ])("recovers the complete root in %s", (word, ipa) => {
      expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
    });

    it.each([
      ["technologic", "ˌtɛknəˈlɑdʒɪk"],
      ["geologic", "ˌdʒiəˈlɑdʒɪk"],
      ["biologic", "ˌbaɪəˈlɑdʒɪk"],
    ])("preserves the short Greek tail in %s", (word, ipa) => {
      expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
    });
  });

  it.each([
    ["dietary", "ˈdaɪətɛɹi"],
    ["proprietary", "pɹəˈpɹaɪətɛɹi"],
    ["nonproprietary", "nɑnpɹəˈpɹaɪətɛɹi"],
  ])("keeps secondary-stress composition idempotent for %s", (word, ipa) => {
    const once = applyPostStress(ipa, word);
    expect(once).not.toMatch(/[ˈˌ]{2}/);
    expect(applyPostStress(once, word)).toBe(once);
  });

})();

// Original suite: en-rule-tense-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  // Rule-path regressions for the tense/lax readings of i and e fixed in
  // the 2026-09 heuristic-learning pass. Every case is a rule, not a word:
  // the word named is the class exemplar, and each class was measured as a
  // win/loss list over the whole dictionary before adoption.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("ea is lax when a d closes the syllable", () => {
    it.each([
      ["head", "ˈhɛd"],
      ["bread", "ˈbɹɛd"],
      ["dead", "ˈdɛd"],
      ["spread", "ˈspɹɛd"],
      ["thread", "ˈθɹɛd"],
      ["ready", "ˈɹɛdi"],
      ["deadline", "ˈdɛdˌɫaɪn"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps the tense reading when the d opens the next syllable", () => {
      expect(rules("leader")).toBe("ˈɫidɝ");
    });
  });

  describe("ea is lax before the -ther/-san/-lou tails", () => {
    it.each([
      ["feather", "ˈfɛðɝ"],
      ["leather", "ˈɫɛðɝ"],
      ["weather", "ˈwɛðɝ"],
      ["jealous", "ˈdʒɛɫəs"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves -son and -ter tense", () => {
      expect(rules("season")).toMatch(/^ˈsi/);
    });
  });

  describe("syllable-final -ign is the silent-g /aɪn/ rime", () => {
    it.each([
      ["sign", "ˈsaɪn"],
      ["benign", "bɪˈnaɪn"],
      ["signer", "ˈsaɪnɝ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves ɡn intact when a vowel follows the n", () => {
      expect(rules("dignity")).toBe("ˈdɪɡnəti");
    });
  });

  describe("stressed i in hiatus with the next vowel is tense", () => {
    it.each([
      ["lion", "ˈɫaɪɑn"],
      ["riot", "ˈɹaɪɑt"],
      ["giant", "ˈdʒaɪənt"],
      ["dial", "ˈdaɪəɫ"],
      ["bias", "ˈbaɪəs"],
      ["bio", "ˈbaɪoʊ"],
      ["die", "ˈdaɪ"],
      ["cries", "ˈkɹaɪz"],
      ["crier", "ˈkɹaɪɝ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves the unstressed -ier/-ion suffixes alone", () => {
      expect(rules("carrier")).toBe("ˈkæɹiɝ");
      expect(rules("million")).toBe("ˈmɪɫjən");
    });
  });

  describe("i is tense before a single-consonant coda plus syllabic -le", () => {
    it.each([
      ["title", "ˈtaɪtəɫ"],
      ["idle", "ˈaɪdəɫ"],
      ["bridle", "ˈbɹaɪdəɫ"],
      ["entitle", "ɛnˈtaɪtəɫ"], // the dict's own reading; the rules now match it
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps a doubled coda lax", () => {
      expect(rules("little")).toBe("ˈɫɪtəɫ");
      expect(rules("middle")).toBe("ˈmɪdəɫ");
    });
  });

  describe("-cial/-tial imposes its own stem vowel", () => {
    it.each([
      ["special", "ˈspɛʃəɫ"],
      ["racial", "ˈɹeɪʃəɫ"],
      ["facial", "ˈfeɪʃəɫ"],
      ["spatial", "ˈspeɪʃəɫ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("two-syllable open e tenses before the measured endings", () => {
    it.each([
      ["legal", "ˈɫiɡəɫ"],
      ["penal", "ˈpinəɫ"],
      ["fetus", "ˈfitəs"],
      ["genus", "ˈdʒinəs"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves the endings the dict does not back lax", () => {
      expect(rules("never")).toBe("ˈnɛvɝ");
      expect(rules("seven")).toBe("ˈsɛvən");
      expect(rules("metal")).toBe("ˈmɛtəɫ");
    });
  });

})();

// Original suite: en-rule-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Rule-path regressions for the vowel classes fixed in the 2026-09
  // heuristic-learning pass. Every case is a rule, not a word: the word
  // named is the class exemplar. Measured on the full dict before adoption.
  const g2p = new EnG2P({ disableDict: true });
  const rules = (word: string) => g2p.predict(word, "en");

  describe("open-syllable long u depends on the onset", () => {
    it.each([
      ["use", "ˈjus"],
      ["cute", "ˈkjut"],
      ["few", "ˈfju"],
      ["human", "ˈhjumən"],
      ["huge", "ˈhjudʒ"],
      ["student", "ˈstudənt"],
      ["tune", "ˈtun"],
      ["new", "ˈnu"],
      ["rule", "ˈɹuɫ"],
      ["curious", "ˈkjʊɹiəs"],
      ["value", "ˈvæɫju"],
      ["continue", "kənˈtɪnju"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps a closed-syllable u short, also before s+C and bl onsets", () => {
      expect(rules("custom")).toBe("ˈkʌstəm");
      expect(rules("public")).toBe("ˈpʌbɫɪk");
      expect(rules("cut")).toBe("ˈkʌt");
    });
  });

  describe("y as a nucleus after a consonant", () => {
    it.each([
      ["system", "ˈsɪstəm"],
      ["cycle", "ˈsaɪkəɫ"],
      ["type", "ˈtaɪp"],
      ["buy", "ˈbaɪ"],
      ["guy", "ˈɡaɪ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("two-syllable words with an inflection-shaped second syllable take the tense vowel", () => {
    it.each([
      ["paper", "ˈpeɪpɝ"],
      ["taken", "ˈteɪkən"],
      ["agent", "ˈeɪdʒənt"],
      ["tiger", "ˈtaɪɡɝ"],
      ["final", "ˈfaɪnəɫ"],
      ["total", "ˈtoʊtəɫ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves other endings, v-stems and prefixed a- lax", () => {
      expect(rules("magic")).toBe("ˈmædʒɪk");
      expect(rules("river")).toBe("ˈɹɪvɝ");
      expect(rules("about")).not.toMatch(/^ˈeɪ/);
    });
  });

  describe("rime and cluster rules", () => {
    it.each([
      ["be", "ˈbi"],
      ["me", "ˈmi"],
      ["we", "ˈwi"],
      ["learn", "ˈɫɝn"],
      ["search", "ˈsɝtʃ"],
      ["natural", "ˈnætʃɝəɫ"],
      ["guess", "ˈɡɛs"],
      ["guild", "ˈɡɪɫd"],
      ["guile", "ˈɡaɪɫ"],
      ["league", "ˈɫiɡ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("derived forms read their base by rule when it is not lexical", () => {
    it.each([
      ["finally", "ˈfaɪnəɫi"],
      ["totally", "ˈtoʊtəɫi"],
      ["driving", "ˈdɹaɪvɪŋ"],
      ["providing", "pɹəˈvaɪdɪŋ"],
      ["buying", "ˈbaɪɪŋ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("word-final suffix vowels", () => {
    it.each([
      ["distance", "ˈdɪstəns"],
      ["balance", "ˈbæɫəns"],
      ["absence", "ˈæbsəns"],
      ["sentence", "ˈsɛntəns"],
      ["persian", "ˈpɝʒən"],
      ["malaysian", "məˈɫeɪʒən"],
      ["martian", "ˈmɑɹʃən"],
      ["haitian", "ˈheɪʃən"],
      ["pension", "ˈpɛnʃən"],
      ["dimension", "dɪˈmɛnʃən"],
      ["audience", "ˈɔdiəns"],
      ["ambient", "ˈæmbiənt"],
      ["nutrient", "ˈnutɹiənt"],
      ["influence", "ˈɪnfɫuəns"],
      ["fluent", "ˈfɫuənt"],
      ["factory", "ˈfæktɝi"],
      ["trajectory", "tɹəˈdʒɛktɝi"],
      ["happiest", "ˈhæpiəst"],
      ["measure", "ˈmɛʒɝ"],
      ["pleasure", "ˈpɫɛʒɝ"],
      ["figure", "ˈfɪɡjɝ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves the non-suffix look-alikes alone", () => {
      expect(rules("priest")).toBe("ˈpɹist");
      expect(rules("nature")).toMatch(/tʃɝ$/);
      expect(rules("secure")).toMatch(/jʊɹ$/);
    });
  });

  describe("the final vowel in native -cket words", () => {
    it.each([
      ["packet", "ˈpækɪt"],
      ["jacket", "ˈdʒækɪt"],
      ["pocket", "ˈpɑkɪt"],
      ["ticket", "ˈtɪkɪt"],
      ["socket", "ˈsɑkɪt"],
      ["cricket", "ˈkɹɪkɪt"],
      ["rocket", "ˈɹɑkɪt"],
      ["bracket", "ˈbɹækɪt"],
      ["bucket", "ˈbʌkɪt"],
      ["becket", "ˈbɛkɪt"],
      ["docket", "ˈdɑkɪt"],
      ["picket", "ˈpɪkɪt"],
      ["racket", "ˈɹækɪt"],
      ["locket", "ˈɫɑkɪt"],
      ["thicket", "ˈθɪkɪt"],
      ["wicket", "ˈwɪkɪt"],
      ["sprocket", "ˈspɹɑkɪt"],
      ["jackets", "ˈdʒækɪts"],
      ["packets", "ˈpækɪts"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps similar -ket words with schwa", () => {
      expect(rules("basket")).toBe("ˈbæskət");
      expect(rules("market")).toBe("ˈmɑɹkət");
      expect(rules("blanket")).toBe("ˈbɫæŋkət");
    });
  });

  describe("plural readings", () => {
    it("does not read this/his/has as plurals of a lexical stem", () => {
      expect(rules("this")).toBe("ˈðɪs");
      expect(rules("gas")).toBe("ˈɡæs");
    });
    it("reads -ses after a one-syllable stem as magic-e + s", () => {
      expect(rules("uses")).toMatch(/^ˈjus/);
      expect(rules("cases")).toMatch(/^ˈkeɪs/);
    });
  });

  describe("nasal assimilation stops at a prefix boundary", () => {
    it.each([
      ["include", "ɪnˈkɫud"],
      ["unclear", "ənˈkɫɪɹ"],
      ["conclude", "kənˈkɫud"],
      ["encase", "ɛnˈkeɪs"],
      ["encrypt", "ˈɛnkɹɪpt"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("still assimilates word-internally", () => {
      expect(rules("think")).toBe("ˈθɪŋk");
    });
  });

  describe("word-initial <ex> before a vowel is /ɡz/", () => {
    it.each([
      ["example", "ɪɡˈzæmpəɫ"],
      ["exotic", "ɪɡˈzɑtɪk"],
      ["exemption", "ɪɡˈzɛmpʃən"],
      ["exude", "ɪɡˈzud"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("clusters that drop or devoice a segment", () => {
    it.each([
      ["castle", "ˈkæsəɫ"],
      ["wrestle", "ˈɹɛsəɫ"],
      ["bristle", "ˈbɹɪsəɫ"],
      ["bakowski", "bəˈkɔfski"],
      ["bobrowski", "bəˈbɹɔfski"],
      ["bacchi", "ˈbæki"],
      ["macchi", "ˈmæki"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("a front-vowel suffix keeps the base's final c/g soft", () => {
    it.each([
      ["criticize", "ˈkɹɪtɪˌsaɪz"],
      ["classicism", "ˈkɫæsɪˌsɪzəm"],
      ["specify", "ˈspɛsəˌfaɪ"],
      ["energize", "ˈɛnɝˌdʒaɪz"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves a doubled gg hard", () => {
      expect(rules("druggist")).toMatch(/ɡ[ɪə]st$/);
    });
  });

  describe("<wh> keeps its /hw/ onset word-initially", () => {
    it.each([
      ["which", "ˈhwɪtʃ"],
      ["white", "ˈhwaɪt"],
      ["whale", "ˈhweɪɫ"],
      ["wheel", "ˈhwiɫ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("resyllabifies to /w/ inside a compound", () => {
      expect(rules("cartwheel")).toBe("ˈkɑɹtwiɫ");
    });
  });

  describe("open e is tense in the magic-e frame and before -tion/-sion", () => {
    it.each([
      ["cede", "ˈsid"],
      ["scene", "ˈsin"],
      ["gene", "ˈdʒin"],
      ["compete", "kəmˈpit"],
      ["delete", "dɪˈɫit"],
      ["completion", "kəmˈpɫiʃən"],
      ["deletion", "dɪˈɫiʃən"],
      ["lesion", "ˈɫiʒən"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps e lax when the magic-e syllable is unstressed or non-final", () => {
      expect(rules("college")).toBe("ˈkɑɫɪdʒ");
      expect(rules("generous")).toBe("ˈdʒɛnɝəs");
      expect(rules("section")).toBe("ˈsɛkʃən");
    });
  });

  describe("Latinate re-/de- before weak -cent", () => {
    it.each([
      ["recent", "ˈɹisənt"],
      ["decent", "ˈdisənt"],
      ["recently", "ˈɹisəntɫi"],
      ["recentness", "ˈɹisəntnəs"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps strong-root -cent controls out of the weak suffix frame", () => {
      expect(rules("accent")).toBe("ˈæksənt");
      expect(rules("percent")).toBe("pɝˈsɛnt");
      expect(rules("percentage")).toBe("pɝˈsɛntɪdʒ");
      expect(rules("percentile")).toBe("pɝˈsɛntɪɫ");
      expect(rules("cent")).toBe("ˈsɛnt");
      expect(rules("vincent")).toBe("ˈvɪnsənt");
    });

    it("keeps the compositional unit reading in sentence context", () => {
      const api = createPhonemizer({ processors: [new EnG2P({ disableDict: true })] });
      const tokens = api.phonemize(
        "Costs fell by ten percent. The recent report mentioned a decent rate and a clear accent.",
        { language: "en-US", returnArray: true },
      );
      const readings = tokens.filter(token => ["percent", "recent", "decent", "accent"].includes(token.word.toLowerCase()));
      expect(readings.map(token => [token.word.toLowerCase(), token.phoneme])).toEqual([
        ["percent", "pɝˈsɛnt"],
        ["recent", "ˈɹisənt"],
        ["decent", "ˈdisənt"],
        ["accent", "ˈæksənt"],
      ]);
    });
  });

  describe("stressed open e before consonant + i + vowel is tense", () => {
    it.each([
      ["medium", "ˈmidiəm"],
      ["premium", "ˈpɹimiəm"],
      ["tedious", "ˈtidiəs"],
      ["comedian", "kəˈmidiən"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps e lax before a lax cluster", () => {
      expect(rules("congestion")).toBe("kənˈdʒɛstʃən");
    });
  });

  describe("the unstressed re-/pre- prefix is /i/", () => {
    it.each([
      ["release", "ɹiˈɫis"],
      ["report", "ɹiˈpɔɹt"],
      ["prevent", "pɹiˈvɛnt"],
      ["precast", "pɹiˈkæst"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("leaves the de-/be- prefixes reduced", () => {
      expect(rules("debate")).toMatch(/^d[ɪə]ˈbeɪt$/);
      expect(rules("begin")).toBe("bɪˈɡɪn");
    });
  });

  describe("final -ger keeps the hard g after a tense vowel", () => {
    it.each([
      ["eager", "ˈiɡɝ"],
      ["meager", "ˈmiɡɝ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });
  // assignStress: the 2-syllable prefix rule used to send every ab/ad/con/in
  // word to final stress. The dict majority for words whose first syllable is
  // exactly the prefix is initial stress for those four.
  describe("two-syllable prefixes with an initial-stress dict majority", () => {
    it.each([
      ["concept", "ˈkɑnsɛpt"],
      ["concert", "ˈkɑnsɝt"],
      ["conduct", "ˈkɑndəkt"],
      ["conflict", "ˈkɑnfɫɪkt"],
      ["context", "ˈkɑntɛkst"],
      ["convert", "ˈkɑnvɝt"],
      ["constant", "ˈkɑnstənt"],
      ["instant", "ˈɪnstənt"],
      ["industry", "ˈɪndəstɹi"],
      ["admin", "ˈædmɪn"],
      ["advert", "ˈædvɝt"],
      ["absent", "ˈæbsənt"],
      ["abject", "ˈæbdʒɛkt"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("prefixes whose dict majority is final stress keep it", () => {
    it.each([
      ["begin", "bɪˈɡɪn"],
      ["believe", "bɪˈɫiv"],
      ["depend", "dɪˈpɛnd"],
      ["express", "ɪksˈpɹɛs"],
      ["promote", "pɹəˈmoʊt"],
      ["propose", "pɹəˈpoʊz"],
      ["compare", "kəmˈpɛɹ"],
      ["obtain", "əbˈteɪn"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("a root after a stress-bearing prefix keeps its vowel", () => {
    it("does not reduce an obstruent-coda root", () => {
      expect(rules("index")).toBe("ˈɪndɛks");
      expect(rules("contest")).toBe("ˈkɑntɛst");
    });
    it("still reduces a sonorant or open coda", () => {
      expect(rules("instant")).toBe("ˈɪnstənt");
      expect(rules("constant")).toBe("ˈkɑnstənt");
    });
  });

  describe("s after an unstressed re-/pre- prefix is voiced", () => {
    it.each([
      ["presume", /^pɹ[iɪ]ˈzum$/],
      ["resistor", /^ɹ[iɪ]ˈzɪstɝ$/],
      ["reservist", /^ɹ[iɪ]ˈzɝvɪst$/],
    ])("%s", (word, re) => expect(rules(word)).toMatch(re));
  });

  describe("th voicing follows the Greek/Latin vs native split", () => {
    it.each([
      ["author", "ˈɔθɝ"],
      ["method", "ˈmɛθəd"],
      ["anthony", "ˈænθəni"],
      ["marathon", "ˈmæɹəθən"],
      ["panther", "ˈpænθɝ"],
      ["synthetic", "sɪnˈθɛtɪk"],
      ["strengthen", "ˈstɹɛŋθən"],
      ["thalamus", "ˈθæɫəməs"],
      ["thacker", "ˈθækɝ"],
      ["whether", "ˈhwɛðɝ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    // Its stress is lexical (-Vtha is 76% penult in the dict); the th is not.
    it("keeps th voiceless in agatha", () => expect(rules("agatha")).toMatch(/θə$/));

    it("keeps th+e voiced in native words and in monosyllabic function words", () => {
      for (const w of ["mother", "father", "weather", "another"])
        expect(rules(w)).toContain("ð");
      for (const w of ["this", "that", "than", "those"])
        expect(rules(w)).toContain("ð");
    });
  });

  describe("s voices in the contexts where the dict majority does", () => {
    it.each([
      ["user", "ˈjuzɝ"],
      ["composer", "kəmˈpoʊzɝ"],
      ["cause", "ˈkɔz"],
      ["clause", "ˈkɫɔz"],
      ["because", "bɪˈkɔz"],
      ["pause", "ˈpɔz"],
      ["easy", "ˈizi"],
      ["daisy", "ˈdeɪzi"],
      ["drowsy", "ˈdɹaʊzi"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it("keeps /s/ where the context does not voice", () => {
      expect(rules("house")).toBe("ˈhaʊs");
      expect(rules("fantasy")).toBe("ˈfæntəsi");
      expect(rules("basing")).toBe("ˈbeɪsɪŋ");
    });
  });

  // Stressed photo retains /oʊ/; its contrasting family is covered in
  // en-derived-vowel-boundaries.test.ts (Cambridge photograph pronunciation).
  describe("trisyllabic laxing of a stressed open o/y", () => {
    it.each([
      ["poverty", "ˈpɑvɝti"],
      ["comedy", "ˈkɑmədi"],
      ["democracy", "dɪˈmɑkɹəsi"],
      ["holiday", "ˈhɑɫɪdeɪ"],
      ["monitor", "ˈmɑnɪtɝ"],
      ["tolerant", "ˈtɑɫɝənt"],
      ["pyramid", "ˈpɪɹəmɪd"],
      ["synergy", "ˈsɪnɝdʒi"],
      ["typical", "ˈtɪpɪkəɫ"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it.each([
      ["topic", "ˈtɑpɪk"],
      ["sardonic", "sɑɹˈdɑnɪk"],
      ["cynic", "ˈsɪnɪk"],
    ])("stress-attracting -ic laxes the stem vowel: %s → %s", (word, ipa) =>
      expect(rules(word)).toBe(ipa));

    it.each([
      ["motion", "ˈmoʊʃən"],
      ["hero", "ˈhiɹoʊ"],
      ["donate", "ˈdoʊneɪt"],
      ["notary", "ˈnoʊtɝi"],
      ["overrun", "ˈoʊvɝɹən"],
      ["lozano", "ɫoʊˈzɑnoʊ"],
      ["molano", "moʊˈɫɑnoʊ"],
      ["historic", "hɪˈstɔɹɪk"],
      ["hydrogen", "ˈhaɪdɹədʒən"],
      ["cyclone", "ˈsaɪkɫoʊn"],
    ])("keeps the tense vowel: %s → %s", (word, ipa) =>
      expect(rules(word)).toBe(ipa));
  });

  // Open <o> before final -ther(s) is STRUT (other, mother, brother) —
  // 16 ʌ : 2 ɑ in the dict (2026-09-26).
  describe("-other spells STRUT", () => {
    it.each(["other", "mother", "brother"])("%s", (w) =>
      expect(new EnG2P({ disableDict: true }).predict(w, "en")).toMatch(/ʌðɝ$/));
  });

  // Word-initial gu + a: guar- has a silent u, other gua- is /ɡw/
  // (2026-09-26, 32 : 2 and 31 : 6 in the dict).
  describe("word-initial gua-", () => {
    const g = new EnG2P({ disableDict: true });
    it("guard has a silent u", () => expect(g.predict("guard", "en")).toBe("ˈɡɑɹd"));
    it("guam is /ɡw/", () => expect(g.predict("guam", "en")).toMatch(/^ˈɡw/));
  });

  // Indefinite pronouns/adverbs are determiner + free noun (2026-09-26).
  describe("indefinite compounds", () => {
    const g = new EnG2P({ disableDict: true });
    it.each([
      ["anything", /^ˈɛniˌθɪŋ$/],
      ["nothing", /^ˈnʌθɪŋ$/],
      ["someone", /^ˈsʌmˌwʌn$/],
      ["somewhere", /ˌwɛɹ$/],
      ["nohow", /^ˈnoʊˌhaʊ$/],
      ["noone", /^ˈnoʊˌwʌn$/],
    ])("%s", (w, re) => expect(g.predict(w, "en")).toMatch(re));

    it("composes weak an with the stressed free word other", () => {
      expect(g.predict("another", "en")).toBe("əˈnʌðɝ");
    });

    it("keeps the composition in sentence tokenization and preserves other", () => {
      const api = createPhonemizer({ processors: [g] });
      const tokens = (sentence: string) => api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens("Another person arrived.").find(({ word }) => word.toLowerCase() === "another")?.phoneme).toBe("əˈnʌðɝ");
      expect(tokens("The other person arrived.").find(({ word }) => word.toLowerCase() === "other")?.phoneme).toBe("ˈʌðɝ");
    });

    it("carries the lexicalized nothing reading into regular derivatives", () => {
      expect(g.predict("nothingness", "en")).toBe("ˈnʌθɪŋnəs");
      expect(g.predict("nothings", "en")).toBe("ˈnʌθɪŋz");
      expect(g.predict("nohow", "en")).toBe("ˈnoʊˌhaʊ");
      expect(g.predict("noone", "en")).toBe("ˈnoʊˌwʌn");
    });
  });

  // a + w + a/o: the w is the next onset, not part of an aw digraph
  // (2026-09-26, 181 : 5 in the dict).
  describe("a·w·a splits before the w", () => {
    it("away", () => expect(new EnG2P({ disableDict: true }).predict("away", "en")).toBe("əˈweɪ"));
  });

  // STRUT spelt ou (double, country, young) and NURSE before th (earth)
  // (2026-09-26).
  describe("ou as STRUT, ear before th", () => {
    const g = new EnG2P({ disableDict: true });
    it.each([
      ["double", /^ˈdʌb/],
      ["country", /^ˈkʌn/],
      ["young", /^ˈjʌŋ$/],
      ["earth", /^ˈɝθ$/],
      ["lounge", /aʊ/],
    ])("%s", (w, re) => expect(g.predict(w, "en")).toMatch(re));
  });

  // STRUT spelt o: l/b + final -ve, -vern, -nth (2026-09-26).
  describe("o as STRUT before -ve/-vern/-nth", () => {
    const g = new EnG2P({ disableDict: true });
    it.each([
      ["love", /^ˈɫʌv$/],
      ["above", /ˈbʌv$/],
      ["govern", /^ˈɡʌv/],
      ["month", /^ˈmʌnθ$/],
    ])("%s", (w, re) => expect(g.predict(w, "en")).toMatch(re));
  });

  describe("a bare -ic syllable", () => {
    // The suffix table's ipa is used literally; an "ɪk$1" entry once shipped
    // the text "$1" for these.
    it.each(["ickes", "lewicki"])("%s has no substitution residue", (w) =>
      expect(rules(w)).not.toContain("$"));
  });

  describe("word-final written <i> takes FLEECE in the rules path", () => {
    const engine = new EnG2P({ disableDict: true });
    it.each([
      ["ski", "ˈski"],
      ["Mississippi", "ˌmɪsɪsɪˈpi"],
      ["taxi", "ˈtæksi"],
      ["mini", "ˈmɪni"],
    ])("%s → %s", (word, ipa) => expect(engine.predict(word, "en-US")).toBe(ipa));

    it("preserves the final-i class and neighboring controls in a sentence", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("A ski instructor from Mississippi took a taxi.", {
        language: "en-US", returnArray: true,
      });
      // Attributive ski is stressless in this noun compound; the vowel stays
      // FLEECE while the sentence-level stress controller owns the stress mark.
      expect(tokens.find(token => token.word === "ski")?.phoneme).toBe("ski");
      expect(tokens.find(token => token.word === "Mississippi")?.phoneme).toBe("ˌmɪsɪsɪˈpi");
      expect(tokens.find(token => token.word === "taxi")?.phoneme).toBe("ˈtæksi");
      expect(tokens.find(token => token.word === "instructor")?.phoneme).toBe(engine.predict("instructor", "en-US"));
    });
  });

})();

// Original suite: en-ryan-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const { EnglishG2P } = __suiteModule0;

  describe("productive -ryan/-ryant name rime", () => {
    const rules = new EnglishG2P({ disableDict: true });

    test.each([
      ["Ryan", "ˈɹaɪən"],
      ["Bryan", "ˈbɹaɪən"],
      ["Bryant", "ˈbɹaɪənt"],
      ["Ryan's", "ˈɹaɪənz"],
      ["Bryan's", "ˈbɹaɪənz"],
      ["Bryant's", "ˈbɹaɪənts"],
      ["O'Bryan", "oʊˈbɹaɪən"],
    ])("renders %s with the standard /aɪən/ rime", (word, expected) => {
      expect(rules.predict(word)).toBe(expected);
    });

    it("leaves other -yan and derived readings on their own routes", () => {
      expect(rules.predict("Kenyan")).toBe("ˈkɛnjən");
      expect(rules.predict("Ryans")).toBe("ˈɹaɪənz");
      expect(rules.predict("Bryanism")).toBe("ˈbɹaɪənɪzəm");
    });
  });

})();

// Original suite: en-satin-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("satin lexical weak vowel", () => {
    it.each([false, true])("preserves the weak final vowel across inflections and context (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("satin", "en-US", "NN")).toBe("ˈsætən");
      expect(engine.predict("satins", "en-US", "NNS")).toBe("ˈsætənz");
      expect(engine.predict("satiny", "en-US", "JJ")).toBe("ˈsætəni");
      expect(engine.predict("Latin", "en-US", "JJ")).toBe(disableDict ? "ˈɫætɪn" : "ˈɫætən");
      expect(engine.predict("captain", "en-US", "NN")).toBe("ˈkæptən");


      const tokens = englishTokens(engine, "The satin ribbon was softer than the captain.");
      const satin = tokens.find(token => token.word.toLowerCase() === "satin")?.phoneme;
      expect(satin).toBe("ˈsætən");
      expect(tokens.find(token => token.word.toLowerCase() === "captain")?.phoneme).toBe("ˈkæptən");
    });
  });

})();

// Original suite: en-say-irregular-paradigm.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;

  const reading = (ipa: string | null) => {
    const { phones, primary } = parseIpa(ipa ?? "");
    return { phones, primary };
  };
  const phones = (ipa: string | null) => reading(ipa).phones;

  describe.each([false, true])("dictionary-backed say paradigm (disableDict=%s)", disableDict => {
    const target = (sentence: string, word: string) => {
      const processor = new EnglishG2P({ disableDict });
      const tokens = createPhonemizer({ processors: [processor] }).phonemize(sentence, {
        language: "en-US", returnArray: true,
      });
      return tokens.find(token => token.word.toLowerCase() === word.toLowerCase())!.phoneme;
    };

    it("uses the irregular says and said forms in complete sentences", () => {
      expect(phones(target("She says the answer.", "says"))).toEqual(phones("ˈsɛz"));
      expect(phones(target("She said the answer.", "said"))).toEqual(phones("ˈsɛd"));
    });

    it("preserves the say stem and regular y-final controls", () => {
      const g2p = new EnglishG2P({ disableDict });
      expect(reading(g2p.predict("say", "en"))).toEqual(reading("ˈseɪ"));
      expect(reading(g2p.predict("saying", "en"))).toEqual(reading("ˈseɪɪŋ"));
      expect(reading(g2p.predict("plays", "en"))).toEqual(reading("ˈpleɪz"));
      expect(reading(g2p.predict("stays", "en"))).toEqual(reading("ˈsteɪz"));
    });
  });

})();

// Original suite: en-sday-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  describe("voiced sday tail and separate roots", () => {
    test.each([false, true])('sday voicing and voiceless neighbors (rules=%s)', disableDict => {
      const engine = new EnglishG2P({disableDict});
      for (const word of ['thursday', "thursday's", 'thursdays', 'doomsdays', 'newsdays', 'newsday', "newsday's", 'doomsday'])
        expect(engine.predict(word)).toMatch(/z[ˌˈ]?deɪz?$/);
      expect(engine.predict('sportsday')).toContain('tsdeɪ');
      expect(engine.predict('mopsday')).toContain('psdeɪ');
      expect(engine.predict('busday')).toMatch(/s[ˌˈ]?deɪ$/);
      expect(engine.predict('classday')).toMatch(/s[ˌˈ]?deɪ$/);
      expect(engine.predict('smallthursday')).toMatch(/^ˈ?sm.*z[ˌˈ]?deɪ$/);
    });
    test.each([false, true])('complete prose preserves noun and verb controls (rules=%s)', disableDict => {
      const phonemizer = createPhonemizer({processors:[new EnglishG2P({disableDict})]});
      const sentences=['They record the news on Thursday.', 'The Thursday record was useful.', 'They present a doomsday scenario.', 'The present schedule starts on Tuesday.'];
      for(const sentence of sentences){
        const rows=phonemizer.phonemize(sentence,{language:'en-US',returnArray:true});
        expect(rows.map(row => row.word).join(' ')).toBe(sentence.replace(/\.$/,' .'));
        const target=rows.find(row => /sday$/i.test(row.word));
        expect(target?.phoneme).toMatch(/z[ˌˈ]?deɪ$/);
      }
    });
  });

})();

// Original suite: en-secondary-pos-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  describe.each([false,true])("bound pos- derivatives, disableDict=%s",disableDict=>{
   const engine=new EnglishG2P({disableDict});
   it.each([["proposition","ˌpɹɑpəˈzɪʃən"],["propositions","ˌpɹɑpəˈzɪʃənz"],["propositional","ˌpɹɑpəˈzɪʃənəɫ"]])("retains the full derivational frame of %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
   it("preserves weak and primary-stressed controls",()=>{
    expect(engine.predict("propose")).toBe("pɹəˈpoʊz");
    expect(engine.predict("position")).toBe("pəˈzɪʃən");
    expect(engine.predict("proponent")).toBe("pɹəˈpoʊnənt");
    expect(engine.predict("propane")).toMatch(/^ˈpɹoʊ/);
   });
   it.each(["The proposition was clear.","They will proposition the group."])("preserves noun and verb context in %s",text=>{
    const api=createPhonemizer({processors:[engine]});
    expect(api.phonemize(text,{language:"en-US",returnArray:true}).find(t=>t.word==="proposition")?.phoneme).toBe("ˌpɹɑpəˈzɪʃən");
   });
   it("retains caller roots in owned derivations",()=>{
    const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
    delete dictionary.propositions;delete dictionary.propositional;Reflect.set(own,"dictionary",dictionary);
    own.addPronunciation("proposition","ˈzɛŋ");expect(own.predict("propositions")).toBe("ˈzɛŋz");
    expect(own.predict("propositional")).toBe("ˈzɛŋəɫ");
    own.addPronunciation("propositional","ˈkɛŋ");expect(own.predict("propositional")).toBe("ˈkɛŋ");
   });
  });

})();

// Original suite: en-secondary-re-ution.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  test("secondary re- has /ɛ/ before the -solution/-volution/-stitution/-tribution stems", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const expected = new Map([
      ["resolution", "ˌɹɛzəˈɫuʃən"],
      ["revolution", "ˌɹɛvəˈɫuʃən"],
      ["resolutions", "ˌɹɛzəˈɫuʃənz"],
      ["revolutions", "ˌɹɛvəˈɫuʃənz"],
      ["revolutionary", "ˌɹɛvəˈɫuʃəˌnɛɹi"],
      ["revolutionize", "ˌɹɛvəˈɫuʃəˌnaɪz"],
      ["revolutionized", "ˌɹɛvəˈɫuʃəˌnaɪzd"],
      ["revolutionizing", "ˌɹɛvəˈɫuʃəˌnaɪzɪŋ"],
    ]);
    for (const [word, ipa] of expected) expect(rules.predict(word, "en")).toBe(ipa);

    for (const word of ["restitution", "retribution"]) expect(rules.predict(word, "en")).toMatch(/^ˌɹɛ/);
    for (const word of ["reconstitution", "reconstruct", "redistribution", "resolve", "revolve"])
      expect(rules.predict(word, "en")).toMatch(/^ˌ?ɹi/);
  });

})();

// Original suite: en-select-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("reduced vowel in the productive select root", () => {
    const rules = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });

    it.each([
      ["select", "səˈɫɛkt"],
      ["selection", "səˈɫɛkʃən"],
      ["selective", "səˈɫɛktɪv"],
      ["selectives", "səˈɫɛktɪvz"],
      ["selector", "səˈɫɛktɝ"],
    ])("reduces the initial vowel in %s", (word, expected) => {
      expect(rules.toIPA(word, "en-US")).toBe(expected);
    });

    it.each([
      ["selecta", "sɪˈɫɛktə"],
      ["selectee", "sɪˈɫɛkti"],
      ["self", "ˈsɛɫf"],
    ])("preserves the adjacent control %s", (word, expected) => {
      expect(rules.toIPA(word, "en-US")).toBe(expected);
    });

    it("keeps the vowel through verb, noun, and adjective sentence contexts", () => {
      expect(rules.phonemize("Please select a picture. The selection was selective.", {
        language: "en-US",
      })).toBe("pɫiz səˈɫɛkt ə ˈpɪktʃɝ. ðə səˈɫɛkʃən wɑz səˈɫɛktɪv.");
    });
  });

})();

// Original suite: en-self-prefix-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge self-conscious, self-control and self-torment place primary on the root.
  // https://dictionary.cambridge.org/pronunciation/english/self-conscious
  // https://dictionary.cambridge.org/dictionary/english/self-control
  // https://dictionary.cambridge.org/dictionary/english/self-torment
  describe.each([false, true])("reflexive self- stress (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([
      ["self-conscious", "ˌsɛɫfˈkɑnʃəs"],
      ["self-control", "ˌsɛɫfkənˈtɹoʊɫ"],
      ["self-contained", "ˌsɛɫfkənˈteɪnd"],
      ["self-tormented", "ˌsɛɫftɔɹˈmɛntɪd"],
      ["self-tormenting", "ˌsɛɫftɔɹˈmɛntɪŋ"],
    ])("retains root stress in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    test("preserves a supplied novel root's stress and weak initial vowel", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("vodded", "kəˈzɛŋ");
      expect(owned.predict("self-vodded")).toBe("ˌsɛɫfkəˈzɛŋ");
      owned.addPronunciation("self", "ˈkʌp");
      expect(owned.predict("self-vodded")).toBe("ˌkʌpkəˈzɛŋ");
      owned.addPronunciation("self-vodded", "ˈbɪm");
      expect(owned.predict("self-vodded")).toBe("ˈbɪm");
    });
  });

  test.each([
    ["get-together", "ˈɡɛttəˌɡɛðɝ"],
    ["air-conditioning", "ˈɛɹkənˌdɪʃənɪŋ"],
    ["serbo-croatian", "ˈsɝboʊkɹoʊˌeɪʃən"],
  ])("preserves the independent compound stress of %s", (word, ipa) => {
    expect(new EnglishG2P().predict(word)).toBe(ipa);
  });

  test("preserves noun, adjective and verb neighbors in complete sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize("The self-conscious artist is quiet. The self-tormented man will record a song.", { language: "en-US", returnArray: true });
    expect(tokens.slice(1, 4).map(t => t.word)).toEqual(["self", "-", "conscious"]);
    expect(tokens.find(t => t.word === "conscious")?.phoneme).toBe("ˈkɑnʃəs");
    expect(tokens.find(t => t.word === "tormented")?.phoneme).toBe("tɔɹˈmɛntɪd");
    expect(tokens.find(t => t.word === "quiet")?.phoneme).toBe("ˈkwaɪət");
    expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
  });

})();

// Original suite: en-shared-infinitive-coordination.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { hasFiniteObjectFrame, inferVerbForm, simplePOSTagger } = __suiteModule2;

  const sentenceWords = (sentence: string) => sentence.match(/[A-Za-z]+|[^\sA-Za-z]/g) ?? [];

  describe("shared infinitive and quantified-subject verb frames", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
    const target = (sentence: string, word: string) => phonemizer.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word.toLowerCase() === word)?.phoneme;

    it("carries the infinitive reading across an or-coordinated predicate", () => {
      const sentence = "The possibility of free will to choose or reject God matters.";
      const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "reject");
      const context = { words, index };
      expect(simplePOSTagger.tagWord("reject", ["or", "God"], context).pos).toBe("V");
      expect(inferVerbForm(context)).toBe("base");
      expect(target(sentence, "reject")).toBe("ɹɪˈdʒɛkt");
    });

    it("uses a direct-object frame after bare quantifier all", () => {
      const sentence = "Though not all reject it entirely, some do.";
      const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "reject");
      expect(hasFiniteObjectFrame({ words, index })).toBe(true);
      expect(simplePOSTagger.tagWord("reject", ["all", "it"], { words, index }).pos).toBe("V");
      expect(target(sentence, "reject")).toBe("ɹɪˈdʒɛkt");
    });

    it("keeps coordinated noun phrases from inheriting a prepositional to", () => {
      const sentence = "They traveled to the store or market after lunch.";
      const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "market");
      expect(simplePOSTagger.tagWord("market", ["or", "after"], { words, index }).pos).not.toBe("V");
    });

    it("preserves the noun sense after all when no direct-object clause follows", () => {
      expect(target("Not all content is accurate.", "content")).toBe("ˈkɑntɛnt");
    });
  });

})();

// Original suite: en-she-pronoun-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("standalone she rule boundary (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it.each([
      ["she", "ˈʃi"],
      ["shekel", "ˈʃɛkəɫ"],
      ["shepard", "ˈʃɛpɝd"],
      ["shepley", "ˈʃɛpɫi"],
      ["sheba", "ˈʃibə"],
    ])("preserves the right reading in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it("keeps pronoun and noun readings distinct in a sentence", () => {

      const tokens = englishTokens(engine, "She said the shekel is gone.");
      expect(tokens.find(t => t.word.toLowerCase() === "she")?.phoneme).toBe("ʃi");
      expect(tokens.find(t => t.word.toLowerCase() === "shekel")?.phoneme).toBe("ˈʃɛkəɫ");
    });

    if (!disableDict) it("retains the lexical /p/ of shepherd", () => {
      expect(engine.predict("shepherd")).toBe("ˈʃɛpɝd");
    });
  });

})();

// Original suite: en-short-i-open-ow.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Oxford window, widow, minnow and winnow independently preserve unstressed GOAT.
  describe.each([false, true])("short KIT nasal feet before open -ow, disableDict=%s", disableDict => {
    const cold = () => {
      const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
      for (const word of ["window", "windows", "windowed", "windowing", "windowless", "windowlike", "nonwindow", "nonwindows"]) delete dictionary[word];
      Reflect.set(e, "dictionary", dictionary);
      return e;
    };
    it.each(["window", "Window", "WINDOW"])("retains word pronunciation and stress for %s", word => {
      const e = cold();
      for (const pos of [undefined, "N", "V"]) expect(e.predict(word, "en-US", pos)).toBe("ˈwɪndoʊ");
    });
    it("preserves inflections after singular eviction", () => {
      const e = cold();
      expect(e.predict("windows")).toBe("ˈwɪndoʊz");
      expect(e.predict("windowed")).toBe("ˈwɪndoʊd");
      expect(e.predict("windowing")).toBe("ˈwɪndoʊɪŋ");
      expect(e.predict("WINDOWS")).toBe("ˈwɪndoʊz");
    });
    it("retains root ownership under prefixes and adjective derivation", () => {
      const e = cold();
      expect(e.predict("nonwindow")?.replace(/ˌ/g, "")).toBe("nɑnˈwɪndoʊ");
      expect(e.predict("nonwindows")?.replace(/ˌ/g, "")).toBe("nɑnˈwɪndoʊz");
      expect(e.predict("windowless")).toBe("ˈwɪndoʊɫəs");
      expect(e.predict("windowlike")).toBe("ˈwɪndoʊˌɫaɪk");
    });
    it("preserves previously correct MOUTH names and closed compound rimes", () => {
      const e = cold();
      expect(e.predict("Bandow")).toBe("ˈbænˌdaʊ");
      expect(e.predict("Bandow's")).toBe("ˈbænˌdaʊz");
      expect(e.predict("sundown")).toBe("ˈsʌnˌdaʊn");
      expect(e.predict("browncow")).toBe("ˈbɹaʊnˌkaʊ");
      expect(e.predict("endowment")).toBe("ɛnˈdaʊmənt");
    });
    it("preserves neighboring native GOAT roots", () => {
      const e = cold();
      for (const [word, ipa] of [["widow", "ˈwɪdoʊ"], ["shadow", "ˈʃædoʊ"], ["minnow", "ˈmɪnoʊ"], ["winnow", "ˈwɪnoʊ"], ["rainbow", "ˈɹeɪnboʊ"]]) expect(e.predict(word)).toBe(ipa);
    });
    it("keeps caller root and whole-token overrides", () => {
      const e = cold();
      e.addPronunciation("window", "ˈtɛst");
      expect(e.predict("window", "en-US", "V")).toBe("ˈtɛst");
      expect(e.predict("windows")).toBe("ˈtɛsts");
      expect(e.predict("window's")).toBe("ˈtɛsts");
      e.addPronunciation("windows", "ˈkʌstəm");
      expect(e.predict("windows")).toBe("ˈkʌstəm");
    });
    it("preserves full-sentence noun, adjective, verb and tense controls", () => {
      const api = createPhonemizer({ processors: [cold()] });
      const pick = (s: string, w: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === w)?.phoneme;
      expect(pick("The window is open.", "window")).toBe("ˈwɪndoʊ");
      expect(pick("The windowed wall is open.", "windowed")).toBe("ˈwɪndoʊd");
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
      expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
      expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
      if (!disableDict) {
        expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
        expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
      }
    });
  });

})();

// Original suite: en-short-particle-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("short particle compounds (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["input", "ˈɪnˌpʊt"], ["inputs", "ˈɪnˌpʊts"],
      ["bylaw", "ˈbaɪˌɫɔ"], ["bylaws", "ˈbaɪˌɫɔz"],
      ["inlaw", "ˈɪnˌɫɔ"], ["onset", "ˈɑnˌsɛt"],
      ["onsets", "ˈɑnˌsɛts"], ["upset", "ˈʌpˌsɛt"],
    ])("retains both full rimes in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([["amply", "ˈæmpɫi"], ["hymen", "ˈhaɪmən"], ["upcoming", "ˈʌpˌkʌmɪŋ"]])("does not split unrelated fragments in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("composes an OOV particle plus a verified free tail", () => {
      expect(engine.predict("upbox")).toBe("ˈʌpˌbɑks");
      const longer = engine.predict("upregulation")!;
      expect(longer.replace(/[ˈˌ]/g, "")).toMatch(/^ʌp/);
      expect(longer).toMatch(/ˈɫeɪʃən$/);
    });
    it("preserves inflections if exact compound stems leave the table", () => {
      const fresh = new EnglishG2P({ disableDict });
      const internals = fresh as unknown as { dictionary: Record<string, string> };
      internals.dictionary = { ...internals.dictionary };
      for (const word of ["input", "inputs", "inputting", "inputted", "bylaw", "bylaws", "onset", "onsets"]) delete internals.dictionary[word];
      expect(fresh.predict("inputs")).toBe("ˈɪnˌpʊts");
      expect(fresh.predict("inputting")).toMatch(/^ˈɪnˌpʊtɪŋ$/);
      expect(fresh.predict("inputted")).toMatch(/^ˈɪnˌpʊt[əɪ]d$/);
      expect(fresh.predict("bylaws")).toBe("ˈbaɪˌɫɔz");
      expect(fresh.predict("onsets")).toBe("ˈɑnˌsɛts");
    });
    it("preserves noun, adjective and verb controls in a full sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will input numbers.");
      expect(tokens.find(t => t.word === "input")?.phoneme).toBe("ˈɪnˌpʊt");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    });
  });

  it("preserves the supplied noun/verb contrast for upset", () => {
    const engine = new EnglishG2P();
    expect(engine.predict("upset", "en", "N")).toBe("ˈʌpˌsɛt");
    expect(engine.predict("upset", "en", "V")).toBe("əpˈsɛt");
  });

  it("preserves the dictionary pronunciation of a nontransparent surname", () => {
    expect(new EnglishG2P().predict("Byham")).toBe("ˈbaɪəm");
  });

})();
