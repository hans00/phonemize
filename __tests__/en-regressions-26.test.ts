// Original suite: en-vouched-wh-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Oxford meanwhile retains PRICE in the independent while root in both dialects.
  describe.each([false, true])("vouched heads and grammatical wh tails, disableDict=%s", disableDict => {
    const cold = () => {
      const en = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(en, ["meanwhile"]);
      return en;
    };
    it("recovers the root after eviction and keeps ordinary inflections", () => {
      const en = cold();
      for (const language of ["en-US", "en-GB"]) {
        expect(en.predict("meanwhile", language)).toBe("ˈminˌwaɪɫ");
        expect(en.predict("meanwhiles", language)).toBe("ˈminˌwaɪɫz");
      }
    });
    it("preserves existing indefinite forms", () => {
      const en = cold();
      expect(en.predict("somewhere")).toBe("ˈsʌmˌwɛɹ");
      expect(en.predict("anywhere")).toBe("ˈɛniˌwɛɹ");
    });
    it("honors custom heads, tails and whole-token pronunciations", () => {
      const en = cold();
      en.addPronunciation("mean", "ˈtɛst");
      expect(en.predict("meanwhile")).toBe("ˈtɛstˌwaɪɫ");
      en.addPronunciation("while", "ˈfɔɹm");
      expect(en.predict("meanwhile")).toBe("ˈtɛstˌfɔɹm");
      en.addPronunciation("meanwhile", "ˈkʌstəm");
      expect(en.predict("meanwhile")).toBe("ˈkʌstəm");
    });
    it("does not treat every wh word as a grammatical compound tail", () => {
      const en = cold(), before = en.predict("meanwhistle");
      en.addPronunciation("whistle", "ˈtɛst");
      expect(en.predict("meanwhistle")).toBe(before);
    });
    it("preserves adverb, noun and verb controls in complete sentences", () => {
      const api = createPhonemizer({ processors: [cold()] });
      const out = api.phonemize("Meanwhile, the musician records blue notes. The records of blue notes are missing. The mean is clear. They mean well.", { language: "en-US", returnArray: true });
      expect(out.find(t => t.word === "Meanwhile")?.phoneme).toBe("ˈminˌwaɪɫ");
      expect(out.filter(t => t.word === "records").map(t => t.phoneme)).toEqual(["ɹɪˈkɔɹdz", "ˈɹɛkɝdz"]);
      expect(out.filter(t => t.word === "mean").map(t => t.phoneme)).toEqual(["min", "min"]);
    });
  });

})();

// Original suite: en-vowelless-initialisms.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("vowelless letter sequences", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["pm", "ˌpiˈɛm"], ["dvd", "ˌdiˌviˈdi"], ["cd", "ˌsiˈdi"],
      ["pc", "ˌpiˈsi"], ["tv", "ˌtiˈvi"],
    ])("spells the letters in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([["hm", "ˈhm"], ["hmm", "ˈhm"], ["hmmm", "ˈhm"], ["sh", "ˈʃ"], ["shh", "ˈʃ"], ["mm", "ˈm"], ["nth", "ˈnθ"]])(
      "keeps pronounceable consonant forms like %s intact",
      (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
    );

    it("leaves a consonantal syllable with a written vowel intact", () => {
      expect(rules.predict("rhythm", "en-US")).toBe("ˈɹɪðəm");
    });

    it("uses the custom dictionary reading for the ordinal in shipped mode", () => {
      expect(new EnglishG2P().predict("nth", "en-US")).toBe("ˈɛnθ");
    });
  });

})();

// Original suite: en-w-near-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;

  const g2p = new EnG2P({ disableDict: true });
  const lexicalG2P = new EnG2P();
  const rules = (word: string) => g2p.predict(word, "en");

  describe("/iɹ/ before a vowel after /w/ is NEAR", () => {
    it.each([
      ["queries", "ˈkwɪɹiz"],
      ["queried", "ˈkwɪɹid"],
      ["weary", "ˈwɪɹi"],
      ["wearisome", "ˈwɪɹɪsəm"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

    it.each([
      ["wary", "ˈwɛɹi"],
      ["we", "ˈwi"],
      ["serious", "ˈsɪɹiəs"],
    ])("leaves the neighboring pattern %s unchanged", (word, ipa) => {
      expect(rules(word)).toBe(ipa);
    });

    it("keeps the authoritative US near vowel in dictionary-backed query", () => {
      expect(lexicalG2P.predict("query", "en")).toBe("ˈkwɪɹi");
    });

    it("does not rewrite a dictionary-backed name through a rules-only vowel class", () => {
      expect(lexicalG2P.predict("quiram", "en")).toBe("ˈkwiɹəm");
    });
  });

})();

// Original suite: en-wash-stems.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const dictionary = require("../data/en/dict.json");

  describe.each([false, true])("complete -sh stems (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    test("keeps the stem vowel in agents and inflections", () => {
      for (const pos of [undefined, "N", "ADJ", "V"]) {
        expect(engine.predict("washer", "en-US", pos)).toBe("ˈwɑʃɝ");
        expect(engine.predict("washes", "en-US", pos)).toContain("wɑʃ");
        expect(engine.predict("squasher", "en-US", pos)).toContain("kwɑʃɝ");
        expect(engine.predict("squashes", "en-US", pos)).toContain("kwɑʃ");
      }
      expect(engine.predict("ambushes", "en-US")).toContain("bʊʃ");
      expect(engine.predict("distinguishes", "en-US")).toContain("dɪˈstɪŋɡwɪʃ");
      expect(engine.predict("swordfishes", "en-US")).toMatch(/^ˈsɔɹd(?:ˌ)?fɪʃ/);
      expect(engine.predict("whitewashes", "en-US")).toContain("wɑʃ");
    });
    test("keeps neighboring roots and endings", () => {
      expect(engine.predict("wash")).toBe("ˈwɑʃ");
      expect(engine.predict("washed")).toBe("ˈwɑʃt");
      expect(engine.predict("washing")).toBe("ˈwɑʃɪŋ");
      expect(engine.predict("watcher")).toBe("ˈwɑtʃɝ");
      expect(engine.predict("wagon")).toBe("ˈwæɡən");
      expect(engine.predict("wager")).toBe("ˈweɪdʒɝ");
      expect(engine.predict("dishes")).toBe("ˈdɪʃəz");
    });
    test.each(["en-US", "en-GB"])("preserves target selection in %s sentences", language => {
      for (const [sentence, word] of [["The washer washes dishes.", "washer"], ["The washer washes dishes.", "washes"], ["They squashed the squashes.", "squashes"], ["She distinguishes cases.", "distinguishes"], ["They caught swordfishes.", "swordfishes"]]) {
        expect(api.phonemize(sentence, { language, returnArray: true }).find(token => token.word === word)?.phoneme)
          .toBe(engine.predict(word, language));
      }
    });
    test.each([["wash", "washes"], ["squash", "squasher"], ["languish", "languishes"], ["distinguish", "distinguishes"], ["swordfish", "swordfishes"]])("preserves an explicit %s stem", (root, word) => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation(root, "ˈtʊɡ");
      expect(custom.predict(word)).toMatch(/^ˈtʊɡ/);
    });
    test("retains caller stems after derived exceptions are evicted", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("wash", "ˈtʊɡ");
      custom.addPronunciation("brainwash", "ˈtʊɡ");
      expect(custom.predict("washer")).toBe("ˈtʊɡɝ");
      expect(custom.predict("washers")).toBe("ˈtʊɡɝz");
      expect(custom.predict("brainwashes")).toBe("ˈtʊɡz");
    });
    test("preserves the existing priority of a whole-word exception", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("ambush", "ˈtʊɡ");
      expect(custom.predict("ambushes")).toBe(disableDict ? "ˈtʊɡz" : engine.predict("ambushes"));
    });
  });

  test.each(["backlashes", "whiplashes"])("preserves the source stress convention for %s", word => {
    const reference = (dictionary as Record<string, string>)[word];
    expect(reference).toBeDefined();
    expect(new EnglishG2P({ disableDict: true }).predict(word)).toBe(reference);
  });

})();

// Original suite: en-weak-acy-root-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;
  test.each([false, true])(
    "keeps weak acy root stress after eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict }),
        d = { ...Reflect.get(e, "dictionary") };
      delete d.advocacy;
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["advocacy", "ˈædvəkəsi"],
        ["advocacies", "ˈædvəkəsiz"],
        ["nonadvocacy", "nɑnˈædvəkəsi"],
      ])
        expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
      // The remaining weak i variants are separate errors; this class owns the root beat.
      for (const [word, primary] of [
        ["delicacy", 0],
        ["intricacy", 0],
        ["obstinacy", 0],
        ["indelicacy", 1],
        ["candidacy", 0],
        ["privacy", 0],
        ["democracy", 1],
      ] as const)
        expect(parseIpa(e.predict(word)!).primary).toBe(primary);
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("Their advocacy changed the policy.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "advocacy")?.phoneme,
      ).toBe("ˈædvəkəsi");
    },
  );
  test("preserves supplied noun roots and targets", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("advocacy", "ˈzɛmp");
    expect(e.predict("advocacies")).toBe("ˈzɛmps");
    expect(e.predict("nonadvocacy")).toBe("nɑnˈzɛmp");
    e.addPronunciation("nonadvocacy", "ˈtɛst");
    expect(e.predict("nonadvocacy")).toBe("ˈtɛst");
  });

})();

// Original suite: en-weak-cess.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak -cess vowel in the rules path", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps /ɛ/ in unstressed checked -cess", () => {
      expect(rules.predict("access")).toBe("ˈæksɛs");
      expect(rules.predict("princess")).toBe("ˈpɹɪnsɛs");
      expect(rules.predict("reprocess")).toBe("ɹiˈpɹoʊsɛs");
    });

    it("preserves adjacent c and soft-c endings", () => {
      expect(rules.predict("accessible")).toBe("əkˈsɛsəbəɫ");
      expect(rules.predict("princes")).toBe("ˈpɹɪnsəz");
      expect(rules.predict("procession")).not.toContain("sɛs");
    });
  });

})();

// Original suite: en-weak-civ-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak initial vowel in the civil family", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["civilian", "səˈvɪɫjən"],
      ["civility", "səˈvɪɫəti"],
    ])("reduces the initial vowel in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["civil", "ˈsɪvəɫ"],
      ["civilization", "ˌsɪvəɫəˈzeɪʃən"],
    ])("preserves stress-bearing root vowel in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-weak-e-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("weak e after m / soft g (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each([
      ["generic", /^dʒə/], ["genetic", /^dʒə/],
      ["indigenous", /dʒən/], ["legendary", /dʒən/],
      ["memorial", /^mə/], ["metallic", /^mə/],
      ["commentary", /mən/], ["diameter", /mət/],
    ] as const)("%s reduces its weak e", (word, expected) => {
      expect(g2p.predict(word, "en")).toMatch(expected);
    });
    test.each([
      ["gem", /^ˈdʒɛm/], ["member", /^ˈmɛm/],
      ["believe", /^bɪ/], ["design", /^dɪ/],
    ] as const)("%s retains its stressed vowel or lexical prefix", (word, expected) => {
      expect(g2p.predict(word, "en")).toMatch(expected);
    });
  });

  describe.each([false, true])("rich boundary and rhotic coalescence (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["rich", "richer", "riches"])("%s retains the English affricate", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɹɪtʃ/);
    });
    test.each(["erich", "emerich", "emmerich", "helmerich", "hemmerich"])(
      "%s keeps the German suffix after vowel reduction", word => {
        expect(g2p.predict(word, "en")).toMatch(/ɪk$/);
      },
    );
  });

})();

// Original suite: en-weak-el-doubling.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Weak -el before British l-doubling (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });

    it.each(["model", "models", "modeled", "modeling", "modeler", "modelled", "modelling", "modeller", "modellers"])(
      "preserves the complete root in %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/^ˈmɑdəˌ?[ɫl]/);
      },
    );

    it.each([
      ["labelled", /^ˈ[ɫl]eɪbə[ɫl]d$/],
      ["levelled", /^ˈ[ɫl]ɛvə[ɫl]d$/],
      ["gavelled", /^ˈɡævə[ɫl]d$/],
      ["gaveller", /^ˈɡævə[ɫl]ɝ$/],
    ] as const)("retains the weak nucleus and root stress in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toMatch(ipa);
    });

    it.each(["repelled", "repelling", "expelled", "expelling"])(
      "keeps a stressed -pel root outside the weak frame: %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/ˈpɛ[ɫl]/);
      },
    );

    it.each(["bookseller", "bestseller", "bestselling"])(
      "keeps the full vowel in a closed compound root: %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/sɛ[ɫl]/);
      },
    );

    it.each([
      ["They modelled the bridge.", "modelled"],
      ["The modelled bridge is ready.", "modelled"],
      ["He is a modeller.", "modeller"],
      ["The model is ready.", "model"],
    ])("preserves the noun/adjective/verb root in %s", (sentence, word) => {
      const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)!;
      expect(target.phoneme).toMatch(/^ˈmɑdəˌ?[ɫl]/);
    });
  });

})();

// Original suite: en-weak-elor.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("weak -elor (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });

    test.each([
      ["bachelor", "N", "ˈbætʃəɫɝ"],
      ["counselor", "N", "ˈkaʊnsəɫɝ"],
      ["counselors", "N", "ˈkaʊnsəɫɝz"],
      ["counsel", "V", "ˈkaʊnsəɫ"],
    ])("%s in %s context", (word, pos, expected) => {
      expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });

    test.each([
      ["The bachelor thanked the counselor.", "ðə ˈbætʃəɫɝ θæŋkt ðə ˈkaʊnsəɫɝ."],
      ["They counsel the students.", "ðeɪ ˈkaʊnsəɫ ðə ˈstudənts."],
      ["The counselors advised the bachelor.", "ðə ˈkaʊnsəɫɝz ædˈvaɪzd ðə ˈbætʃəɫɝ."],
    ])("preserves sentence context: %s", (sentence, expected) => {
      expect(phonemizer.phonemize(sentence, { language: "en-US" })).toBe(expected);
    });
  });

})();

// Original suite: en-weak-emis.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/en/postlex") = require("../src/en/postlex");
  const { applyPostStress } = __suiteModule2;

  describe.each([false, true])("weak emis in extended forms (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test.each([
      ["chemistry", "N", "ˈkɛməstɹi"], ["premises", "N", "ˈpɹɛməsəz"],
      ["chemist", "N", "ˈkɛmɪst"], ["chemists", "N", "ˈkɛmɪsts"],
      ["chemical", "ADJ", "ˈkɛmɪkəɫ"], ["remiss", "ADJ", "ɹiˈmɪs"],
    ])("preserves the appropriate vowel in %s", (word, pos, expected) => {
      expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });

    test.each([
      ["Chemistry explains the premises.", "ˈkɛməstɹi ɪksˈpɫeɪnz ðə ˈpɹɛməsəz."],
      ["The chemist is remiss.", "ðə ˈkɛmɪst ɪz ɹiˈmɪs."],
    ])("preserves sentence context: %s", (sentence, expected) => {
      expect(api.phonemize(sentence, { language: "en-US" })).toBe(expected);
    });

    test("keeps the verbal stem outside the reduction", () => {
      if (!disableDict) expect(api.phonemize("They premise their argument on facts.", { language: "en-US" })).toBe("ðeɪ ˈpɹɛmɪs ðəɹ ˈɑɹɡjəmənt ɑn fækts.");
    });
  });

  test("protects stressed m and sm onsets in the spelling environment", () => {
    expect(applyPostStress("ˈmɪsəz", "emises")).toBe("ˈmɪsəz");
    expect(applyPostStress("ˈsmɪstɹi", "semistry")).toBe("ˈsmɪstɹi");
  });

})();

// Original suite: en-weak-et-and-tch.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

  describe.each([false, true])("weak rimes and protected tch (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const say = (word: string) => clean(g2p.predict(word)!);

    test("native single -et retains its reduced nucleus", () => {
      for (const word of ["planet", "target", "helmet", "velvet", "janet"])
        expect(say(word)).toMatch(/ət$/);
      for (const word of ["target", "targets", "targeted", "targeting", "targeter"])
        expect(say(word)).toMatch(/tɑɹɡ/);
      for (const word of ["nonplanet", "semiplanet", "multiplanet"])
        expect(say(word)).toMatch(/pɫænət/);
      for (const word of ["planets", "targets", "helmets", "velvets"])
        expect(say(word)).toMatch(/əts$/);
      for (const word of ["ferret", "ferreted", "ferreting", "ferreter", "puppet", "puppeted", "puppeting"])
        expect(say(word)).toMatch(/(?:ɹət|pət)/);
      for (const word of ["beckett", "bartlett", "brackett"])
        expect(say(word)).toMatch(/ɪt$/);
    });

    test("weak Latin -tim/-xim survives ordinary inflection and suffix composition", () => {
      for (const word of ["victim", "victims", "maxim", "maxims", "optimist", "optimism"])
        expect(say(word)).toMatch(/(?:t|ks)əm/);
      for (const word of ["victimed", "victiming", "victimer", "velveted", "velveting", "velveter"])
        expect(say(word)).toMatch(/(?:təm|vət)/);
      for (const word of ["darwin", "griffin", "colin", "virgin"])
        expect(say(word)).toMatch(/ɪn$/);
    });

    test("weak -ster is checked while real -ost agents retain their roots", () => {
      for (const word of ["foster", "roster", "fosters", "rosters", "fostered", "fostering", "rostered", "rostering", "nonfoster", "semifoster", "multifoster", "nonroster", "semiroster", "multiroster"])
        expect(say(word)).toMatch(/ɑst/);
      for (const word of ["post", "host", "most", "poster", "posters", "posterize", "hoster", "moster", "unposter", "preposter"])
        expect(say(word)).toMatch(/oʊst/);
      for (const word of ["competed", "competing", "completed", "completing", "deleted", "deleting"])
        expect(say(word)).toMatch(/it(?:ɪ[ŋd]|əd)/);
    });

    test("tch cannot become a velar through post-lexical cleanup", () => {
      for (const word of ["dispatch", "dispatched", "dispatching", "mismatch", "mismatched", "creditwatch", "farfetched"])
        expect(say(word)).toMatch(/tʃ/);
      expect(say("stomach")).toMatch(/mək$/);
      expect(say("eunuch")).toMatch(/nək$/);
    });
  });

})();

// Original suite: en-weak-hiatus-nuclei.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("weak hiatus nuclei (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test("ia keeps a weak second nucleus before its sonorant or s coda", () => {
      for (const word of ["bias", "dial", "giant", "trial"])
        expect(g2p.predict(word)).toMatch(/aɪə/);
      for (const word of ["liar", "diary"])
        expect(g2p.predict(word)).toMatch(/aɪ(?:ɝ|əɹ)/);
      expect(g2p.predict("triad")?.replace(/[ˈˌ]/g, "")).toMatch(/aɪæd/);
      expect(g2p.predict("fiat")?.replace(/[ˈˌ]/g, "")).toMatch(/[iɪ]æt/);
    });
    test("ia inflections retain the root nucleus after exception eviction", () => {
      for (const word of ["biased", "biases", "dialed", "dialing", "dials", "giants"])
        expect(g2p.predict(word)).toMatch(/aɪə/);
    });
    test("bare oe has hiatus before m/t but not a borrowed consonant cluster", () => {
      for (const word of ["poem", "poems", "poet", "poets", "poetry"])
        expect(g2p.predict(word)).toMatch(/oʊə/);
      for (const word of ["bloem", "goetting", "koetting"])
        expect(g2p.predict(word)).not.toMatch(/oʊə/);
    });
    test("uel retains the second nucleus without inventing it in doubled ll", () => {
      for (const word of ["fuel", "fuels", "fueled", "duel", "duels", "cruel", "gruel"])
        expect(g2p.predict(word)).toMatch(/u[əɪ][lɫ]/);
      expect(g2p.predict("fueling")).toMatch(disableDict ? /uə[lɫ]/ : /u[əɪ]?[lɫ]/);
      for (const word of ["duell", "mueller", "cuellar"])
        expect(g2p.predict(word)).not.toMatch(/uə[lɫ]/);
    });
    test("rhotic able restores an attested silent-e root", () => {
      for (const word of ["desirable", "desirably", "undesirable"])
        expect(g2p.predict(word)).toMatch(/zaɪ[ɹɝ]/);
      expect(g2p.predict("admirable")).toMatch(/^ˈædm[ɝɹ]/);
      expect(g2p.predict("comparable")).toMatch(/^ˈkɑmp[ɝɹ]/);
    });
  });

  test("public API preserves the weak hiatus nuclei", () => {
    expect(toIPA("dial")).toMatch(/aɪə/);
    expect(toIPA("poetry")).toMatch(/oʊə/);
    expect(toIPA("fuel")).toMatch(/uə/);
  });

})();

// Original suite: en-weak-imacy-beat.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;
  test.each([false, true])(
    "keeps imacy root beat and weak linker after eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict }),
        d = { ...Reflect.get(e, "dictionary") };
      delete d.intimacy;
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["intimacy", "ˈɪntəməsi"],
        ["intimacies", "ˈɪntəməsiz"],
        ["nonintimacy", "nɑnˈɪntəməsi"],
      ])
        expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
      for (const [word, primary] of [
        ["legitimacy", 1],
        ["illegitimacy", 2],
        ["democracy", 1],
        ["privacy", 0],
      ] as const)
        expect(parseIpa(e.predict(word)!).primary).toBe(primary);
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("Their intimacy surprised the visitors.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "intimacy")?.phoneme,
      ).toBe("ˈɪntəməsi");
    },
  );
  test("keeps supplied roots and targets", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("intimacy", "ˈzɛmp");
    expect(e.predict("intimacies")).toBe("ˈzɛmps");
    expect(e.predict("nonintimacy")).toBe("nɑnˈzɛmp");
    e.addPronunciation("nonintimacy", "ˈtɛst");
    expect(e.predict("nonintimacy")).toBe("ˈtɛst");
  });

})();

// Original suite: en-weak-imate.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak /ɪ/ before final -mate", () => {
    const g2p = new EnglishG2P({ disableDict: true });

    it.each([
      ["animate", "ˈænəˌmeɪt"],
      ["animated", "ˈænəˌmeɪtɪd"],
      ["animating", "ˈænəˌmeɪtɪŋ"],
      ["estimate", "ˈɛstəˌmeɪt"],
      ["estimating", "ˈɛstəˌmeɪtɪŋ"],
      ["inanimate", "ɪˈnænəˌmeɪt"],
      ["intimation", "ˌɪntəˈmeɪʃən"],
    ])("reduces the weak vowel in %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it("uses the sourced climate root without generalizing -ate reduction", () => {
      expect(g2p.predict("climate", "en-US")).toBe("ˈkɫaɪmət");
      expect(g2p.predict("private", "en-US")).toBe("ˈpɹaɪvət");
      expect(g2p.predict("evaluate", "en-US")).toBe("ɪˈvæɫjuˌeɪt");
    });

    it("uses the independently verified US citation form in the shipped dictionary", () => {
      expect(new EnglishG2P().predict("climate", "en-US")).toBe("ˈkɫaɪmət");
    });
  });

})();

// Original suite: en-weak-ine-and-ident.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("weak endings (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("-ident/-inent leaves the weak theme outside primary stress", () => {
      for (const word of ["confident", "continent", "prominent", "resident", "residents", "continents", "president", "incident", "abstinent", "provident"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
      expect(g2p.predict("nonresident")).toContain("ɹɛz");
      expect(g2p.predict("intransigent")).toContain("ns");
      expect(g2p.predict("overconfident")).toMatch(/^ˌ?oʊvɝ/);
      expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
      for (const word of ["consistent", "persistent", "insistence"])
        expect(g2p.predict(word)).not.toMatch(/^ˈ/);
    });

    test("bound weak -ine survives inflection after its stem leaves the table", () => {
      for (const word of ["engine", "engines", "engine's"])
        expect(g2p.predict(word)).toContain("dʒən");
      for (const word of ["discipline", "disciplines", "disciplined", "disciplining"])
        expect(g2p.predict(word)).toContain("pɫən");
      for (const word of ["doctrine", "doctrines"])
        expect(g2p.predict(word)).toContain("tɹən");
      for (const word of ["spline", "alkaline"]) expect(g2p.predict(word)).toContain("aɪn");
      for (const word of ["citrine", "latrine", "marine", "machine"])
        expect(g2p.predict(word)).toMatch(/[iɪ]n$/);
    });

    test("hard-ger correction requires g and leaves j soft", () => {
      for (const word of ["major", "majors", "major's"]) expect(g2p.predict(word)).toContain("dʒɝ");
      for (const word of ["eager", "eagerly", "tiger", "tigers", "bigger"])
        expect(g2p.predict(word)).toContain("ɡɝ");
    });
  });

})();

// Original suite: en-weak-initial-ce-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const { EnglishG2P } = __suiteModule0;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("weak initial ce- in the celebr- family", () => {
    const g2p = new EnglishG2P({ disableDict: true });

    it.each([
      ["celebrity", "səˈɫɛbɹəti"],
      ["celebratory", "səˈɫɛbɹəˌtɔɹi"],
    ])("reduces the unstressed initial ce- in %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["celebrate", "ˈsɛɫəˌbɹeɪt"],
      ["celebrant", "ˈsɛɫəbɹənt"],
      ["celebrated", "ˈsɛɫəˌbɹeɪtɪd"],
      ["celebrating", "ˈsɛɫəˌbɹeɪtɪŋ"],
      ["celebrities", "səˈɫɛbɹɪtiz"],
      ["celestial", "sɪˈɫɛstiəɫ"],
      ["celibate", "ˈsɛɫɪˌbeɪt"],
      ["celery", "ˈsɛɫɝi"],
    ])("preserves the neighboring stress or vowel frame in %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it("preserves the target and its stressed controls in a sentence", () => {

      const tokens = englishTokens(g2p, "A celebrity celebrated a celestial event.");
      expect(tokens.find(token => token.word === "celebrity")?.phoneme).toBe("səˈɫɛbɹəti");
      expect(tokens.find(token => token.word === "celebrated")?.phoneme).toBe("ˈsɛɫəˌbɹeɪtɪd");
      expect(tokens.find(token => token.word === "celestial")?.phoneme).toBe("sɪˈɫɛstiəɫ");
    });
  });

})();

// Original suite: en-weak-intro-compound.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("bound intro- before a stressed root (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it.each([
      ["introduce", "ˌɪntɹəˈdus"],
      ["introduced", "ˌɪntɹəˈdust"],
      ["introducing", "ˌɪntɹəˈdusɪŋ"],
      ["introduces", "ˌɪntɹəˈdusəz"],
      ["introduction", "ˌɪntɹəˈdʌkʃən"],
    ])("uses the weak combining form in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    it("preserves free intro-, head-stressed compounds, and related roots", () => {
      expect(engine.predict("intro", "en-US")).toBe("ˈɪntɹoʊ");
      expect(engine.predict("introvert", "en-US")).toBe("ˈɪntɹoʊˌvɝt");
      if (!disableDict) {
        expect(engine.predict("introspect", "en-US")).toBe("ˈɪntɹəˌspɛkt");
        expect(engine.predict("introspection", "en-US")).toBe("ˌɪntɹəˈspɛkʃən");
      }
    });

    it("preserves sentence tokens and POS controls", () => {
      const api = createPhonemizer({ processors: [engine] });
      const sentence = api.phonemize("I introduce a new concept.", { language: "en-US", returnArray: true });
      expect(sentence.map(token => token.phoneme)).toEqual(["aɪ", "ˌɪntɹəˈdus", "ə", "nu", "ˈkɑnsɛpt", "."]);
      expect(engine.predict("introduce", "en-US", "V")).toBe("ˌɪntɹəˈdus");
      expect(engine.predict("introduce", "en-US", "NN")).toBe("ˌɪntɹəˈdus");
    });
  });

})();

// Original suite: en-weak-le-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress } = __suiteModule2;

  // https://www.oxfordlearnersdictionaries.com/definition/english/uncle
  // https://www.merriam-webster.com/dictionary/inclement

  function withoutStoredRoot(disableDict: boolean, root: string): EnglishG2P {
    const engine = new EnglishG2P({ disableDict });
    const table: unknown = Reflect.get(engine, "dictionary");
    if (table === null || typeof table !== "object") throw new Error("Missing root lookup");
    const copied: Record<string, unknown> = { ...table };
    delete copied[root];
    Object.defineProperty(engine, "dictionary", { value: copied });
    return engine;
  }

  describe.each([false, true])("weak syllabic-l root boundaries (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([undefined, "N", "ADJ", "V"])("retains the complete root for POS %s", pos => {
      expect(engine.predict("uncle", "en-US", pos)).toBe("ˈʌŋkəɫ");
    });
    test.each(["uncles", "uncle's", "unclehood", "unclelike", "uncleless"])("preserves the root in %s", word => {
      expect(engine.predict(word)).toMatch(/^ˈʌŋkəɫ/);
    });
    test.each(["unclear", "uncleared", "unkind", "uncover", "include", "conclude", "uncouple"])("keeps the genuine nasal prefix in %s", word => {
      expect(engine.predict(word)).toMatch(/n[ˈˌ]?k/);
    });
    test("honors a caller-owned root through inflection", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("uncle", "ˈʌnkəɫ");
      expect(custom.predict("uncle")).toBe("ˈʌnkəɫ");
      expect(custom.predict("uncles")).toBe("ˈʌnkəɫz");
    });
    test("recovers the complete root when its stored entry is absent", () => {
      const evicted = withoutStoredRoot(disableDict, "uncle");
      for (const word of ["uncles", "unkles"]) expect(evicted.predict(word)).toBe("ˈʌŋkəɫz");
      for (const word of ["unclehood", "unclelike", "uncleless", "unklehood", "unklelike", "unkleless", "uncleable", "unkleable"])
        expect(evicted.predict(word)).toMatch(/^ˈʌŋkəɫ/);
    });
    test.each([
      ["preble", "prebles", "ˈpɹɛbəɫz"], ["dekle", "dekles", "ˈdɛkəɫz"],
      ["table", "tables", "ˈteɪbəɫz"], ["maple", "maples", "ˈmeɪpəɫz"],
      ["cycle", "cycles", "ˈsaɪkəɫz"], ["trifle", "trifles", "ˈtɹaɪfəɫz"],
    ])("retains the complete %s root in %s without its table entry", (root, plural, expected) => {
      expect(withoutStoredRoot(disableDict, root).predict(plural)).toBe(expected);
    });
    test("a supplied consonant-final stem outranks an invented silent-e root", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("piktl", "ˈpɛktəɫ");
      expect(custom.predict("piktles")).toBe("ˈpɛktəɫz");
    });
    test("keeps prefix vowels and an independently supplied root", () => {
      expect(engine.predict("commingle")).toBe("kəˈmɪŋɡəɫ");
      expect(engine.predict("preamble")).toBe("pɹiˈæmbəɫ");
      expect(engine.predict("recouple")).toBe("ɹiˈkʌpəɫ");
    });
    test.each([
      ["dismantle", "dɪˈsmæntəɫ"], ["dismantled", "dɪˈsmæntəɫd"],
      ["uncleable", "ˈʌŋkəɫəbəɫ"], ["dishable", "ˈdɪʃəbəɫ"],
      ["disneyable", "ˈdɪzniəbəɫ"],
    ])("keeps the existing stem boundary in %s", (word, expected) => {
      expect(engine.predict(word)).toBe(expected);
    });
    test("does not fabricate syllabic l after glide or lateral rimes", () => {
      expect(engine.predict("bolles")).toBe("ˈboʊɫz");
      expect(engine.predict("bowles")).toBe("ˈboʊɫz");
      expect(engine.predict("rawles")).toBe("ˈɹɔɫz");
    });
    test("preserves the surrounding noun, adjective and verb", () => {
      const tokens = createPhonemizer({ processors: [engine] }).phonemize(
        "The careful reader told his uncle to include the record.",
        { language: "en-US", returnArray: true },
      );
      expect(tokens.find(t => t.word === "uncle")?.phoneme).toBe("ˈʌŋkəɫ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "careful")?.phoneme).toBe("ˈkɛɹfəɫ");
      expect(tokens.find(t => t.word === "include")?.phoneme).toBe("ɪnˈkɫud");
    });
  });

  test.each([["pre", "ble"], ["de", "kle"], ["un", "kle"]])("a weak final %s/%s slot cannot receive root stress", (head, tail) => {
    expect(assignStress([head, tail], head + tail)).toBe(0);
  });

  test("an unattested silent-le fragment cannot license neutral -ment", () => {
    expect(new EnglishG2P({ disableDict: true }).predict("inclement")).toBe("ɪnˈkɫɛmənt");
  });

  test("silent h before l does not certify an independent C-le syllable", () => {
    const engine = new EnglishG2P({ disableDict: true });
    expect(engine.predict("kohles")).toBe("ˈkoʊɫz");
    expect(engine.predict("ahles")).toBe("ˈɑɫz");
  });

})();

// Original suite: en-weak-ment-plurals.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Oxford document and MW implement/ornament/compliment distinguish weak noun -ment from strong verb -ment.
  describe.each([false, true])("weak nominal -ment plurals, disableDict=%s", disableDict => {
    const cold = () => {
      const e = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(e, "dictionary") };
      for (const stem of ["document", "implement", "ornament", "compliment", "supplement"])
        for (const end of ["", "s", "ed", "ing"]) delete dictionary[stem + end];
      Reflect.set(e, "dictionary", dictionary);
      return e;
    };
    it.each([
      ["supplements", "ˈsʌpɫəmənts", "ˈsʌpɫəmɛnts", "The supplements are missing.", "She supplements her income."],
      ["documents", "ˈdɑkjəmənts", "ˈdɑkjumɛnts", "The documents are missing.", "She documents events."],
      ["implements", "ˈɪmpɫəmənts", "ˈɪmpɫəmɛnts", "The implements are missing.", "She implements changes."],
      ["ornaments", "ˈɔɹnəmənts", "ˈɔɹnəmɛnts", "The ornaments are missing.", "She ornaments the hall."],
      ["compliments", "ˈkɑmpɫəmənts", "ˈkɑmpɫəmɛnts", "The compliments are welcome.", "She compliments the artist."],
    ])("preserves the noun and verb readings of %s", (word, noun, verb, nounSentence, verbSentence) => {
      const e = cold(), api = createPhonemizer({ processors: [e] });
      // Secondary boundary marking differs between existing paths; exact phones and primary stress stay protected.
      expect(e.predict(word, "en-US", "N")?.replace(/ˌ/g, "")).toBe(noun);
      expect(e.predict(word, "en-US", "V")?.replace(/ˌ/g, "")).toBe(verb);
      for (const [sentence, ipa] of [[nounSentence, noun], [verbSentence, verb]])
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("keeps caller root and whole-token overrides", () => {
      const e = cold();
      e.addPronunciation("document", "ˈtɛst");
      expect(e.predict("documents")).toBe("ˈtɛsts");
      e.addPronunciation("documents", "ˈkʌstəm");
      expect(e.predict("documents", "en-US", "V")).toBe("ˈkʌstəm");
    });
    it("preserves regular verb inflections and nominal prefix ownership", () => {
      const e = cold();
      expect(e.predict("documented")?.replace(/ˌ/g, "")).toBe("ˈdɑkjumɛntɪd");
      expect(e.predict("documenting")?.replace(/ˌ/g, "")).toBe("ˈdɑkjumɛntɪŋ");
      expect(e.predict("nondocuments")?.replace(/ˌ/g, "")).toBe("nɑnˈdɑkjəmənts");
    });
    it("preserves noun primary stress in separate stress-shift classes", () => {
      const e = cold();
      expect(e.predict("segments", "en-US", "N")).toBe("ˈsɛɡmənts");
      expect(e.predict("torments", "en-US", "N")?.replace(/ˌ/g, "")).toBe("ˈtɔɹmɛnts");
      expect(e.predict("fragments", "en-US", "N")?.replace(/ˌ/g, "")).toBe("ˈfɹæɡmənts");
    });
    it("preserves neighboring noun, adjective, verb and tense controls", () => {
      const api = createPhonemizer({ processors: [cold()] });
      const pick = (s: string, w: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === w)?.phoneme;
      expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
      expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
      expect(pick("The documentary documents a conflict.", "documents")?.replace(/ˌ/g, "")).toBe("ˈdɑkjumɛnts");
      if (!disableDict) {
        expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
        expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
      }
    });
  });

  // This route is correct before the change; default and a fully evicted ambiguous stem remain existing POS limitations.
  it("preserves the original rules verb when its tag is ambiguous !V", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = api.phonemize("For example, a World Rainforest Movement report documents land disputes and human rights abuses at Mount Elgon.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "documents")?.phoneme).toMatch(/^ˈdɑkj[əu]ˌ?mɛnts$/);
  });

})();
