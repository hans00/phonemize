// Original suite: en-sibilant-stem-controls.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  test.each([false, true])("silent-e sibilant roots survive inflection (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("lenses", "en-US")).toBe("ˈɫɛnzəz");
    expect(engine.predict("rinses", "en-US")).toBe("ˈɹɪnsəz");
    expect(engine.predict("tenses", "en-US")).toBe("ˈtɛnsəz");
    expect(engine.predict("senses", "en-US")).toBe("ˈsɛnsəz");
    expect(engine.predict("suspense", "en-US")).toBe("səˈspɛns");
    expect(engine.predict("suspenseful", "en-US")).toBe("səˈspɛnsfəɫ");
    expect(engine.predict("dispense", "en-US")).toBe("dɪˈspɛns");
    engine.addPronunciation("rinse", "ˈzi");
    expect(engine.predict("rinses", "en-US")).toBe("ˈziz");
    engine.addPronunciation("suspense", "ˈzaɪ");
    expect(engine.predict("suspenseful", "en-US")).toBe("ˈzaɪfəɫ");
  });

})();

// Original suite: en-silent-e-agents.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  const restored = [
    ["cubist", "ˈkjubɪst"], ["cubism", "ˈkjubɪzəm"],
    ["nudist", "ˈnudɪst"], ["nudism", "ˈnudɪzəm"],
    ["purist", "ˈpjʊɹɪst"], ["racist", "ˈɹeɪsɪst"],
    ["typist", "ˈtaɪpɪst"], ["stylist", "ˈstaɪɫɪst"],
  ];

  describe.each([false, true])("silent-e agent roots (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const access = engine as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const [word] of restored) {
      for (const ending of ["", "s", "'s"]) delete access.dictionary[word + ending];
    }
    it.each(restored)("restores the root of %s after exception eviction", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
      expect(engine.predict(word + "s")).toBe(ipa + (word.endsWith("ism") ? "z" : "s"));
      expect(engine.predict(word + "'s")).toBe(ipa + (word.endsWith("ism") ? "z" : "s"));
    });
    it.each([
      ["antiracist", "ˌæntɪˈɹeɪsɪst"], ["noncubist", "ˌnɑnˈkjubɪst"],
      ["antinudist", "ˌæntɪˈnudɪst"], ["nontypist", "ˌnɑnˈtaɪpɪst"],
    ])("preserves the derived root in %s", (word, ipa) => {
      for (const ending of ["", "s", "'s"]) {
        delete access.dictionary[word + ending];
        expect(engine.predict(word + ending)).toBe(ipa + (ending ? "s" : ""));
      }
    });
    it.each([
      ["monism", "ˈmɑnɪzəm"], ["nazism", "ˈnæzɪzəm"],
      ["lyrist", "ˈɫɪɹɪst"], ["tavist", "ˈtævɪst"],
      ["banister", "ˈbænɪstɝ"], ["metabolism", "məˈtæbəˌɫɪzəm"],
      ["minister", "ˈmɪnəstɝ"],
    ])("preserves the complete reading of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves caller-owned bare and restored roots", () => {
      for (const [root, ipa] of [["nud", "ˈnɛd"], ["cub", "ˈkɛb"], ["nude", "ˈnoʊd"]]) {
        const custom = new EnglishG2P({ disableDict });
        const customAccess = custom as unknown as { dictionary: Record<string, string> };
        customAccess.dictionary = { ...customAccess.dictionary };
        delete customAccess.dictionary[root.replace(/e$/, "") + "ist"];
        custom.addPronunciation(root, ipa);
        expect(custom.predict(root.replace(/e$/, "") + "ist")).toBe(ipa + "ɪst");
      }
    });
    it("keeps noun, adjective and finite verb readings in a complete sentence", () => {

      const tokens = englishTokens(engine, "The clever typist will harvest beside the carpet.");
      for (const [word, ipa] of [["typist", "ˈtaɪpɪst"], ["clever", "ˈkɫɛvɝ"],
        ["harvest", "ˈhɑɹvəst"], ["carpet", "ˈkɑɹpət"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-silent-e-suffix-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("silent-e suffix boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("open i remains tense before a weak -ence tail", () => {
      for (const word of ["silent", "silence", "licence"])
        expect(g2p.predict(word)).toContain("aɪ");
      for (const word of ["difference", "diligence", "incidence"])
        expect(g2p.predict(word)).not.toContain("aɪ");
      expect(g2p.predict("presence")).not.toContain("pri");
      expect(g2p.predict("balance")).not.toContain("eɪ");
      expect(g2p.predict("lawrence")).not.toContain("eɪ");
    });

    test("a supplied -uid-e root retains its diphthong before -ance", () => {
      for (const word of ["guide", "guidance", "guided"])
        expect(g2p.predict(word)).toContain("ɡaɪd");
      for (const word of ["residence", "presidence"])
        expect(g2p.predict(word)).not.toContain("zaɪd");
      expect(g2p.predict("fluid")).not.toContain("aɪ");
    });

    test("a short vowel-bearing -able root contrasts with a consonant fragment", () => {
      for (const word of ["liable", "viable", "pliable"])
        expect(g2p.predict(word)).toContain("aɪəb");
      expect(g2p.predict("doable")).toContain("duəb");
      for (const word of ["stable", "enable", "fable", "table"])
        expect(g2p.predict(word)).toContain("eɪb");
      expect(g2p.predict("variable")).not.toContain("aɪ");
      expect(g2p.predict("sociable")).not.toContain("aɪ");
    });
  });

})();

// Original suite: en-silent-gn-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule2;

  describe.each([false, true])("final silent gn stress (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["align", "əˈɫaɪn"], ["consign", "kənˈsaɪn"], ["malign", "məˈɫaɪn"],
      ["aligned", "əˈɫaɪnd"], ["aligning", "əˈɫaɪnɪŋ"],
      ["alignment", "əˈɫaɪnmənt"], ["aligner", "əˈɫaɪnɝ"],
      ["consigned", "kənˈsaɪnd"], ["consigning", "kənˈsaɪnɪŋ"],
      ["maligned", "məˈɫaɪnd"], ["maligning", "məˈɫaɪnɪŋ"],
      ["misalign", "ˌmɪsəˈɫaɪn"], ["misaligned", "ˌmɪsəˈɫaɪnd"],
      ["misalignments", "ˌmɪsəˈɫaɪnmənts"],
      ["reconsign", "ˌɹikənˈsaɪn"], ["reconsigning", "ˌɹikənˈsaɪnɪŋ"],
      ["sign", "ˈsaɪn"], ["reign", "ˈɹeɪn"], ["deign", "ˈdeɪn"],
      ["benign", "bɪˈnaɪn"], ["career", "kɝˈɪɹ"],
    ])("retains the root and neighboring class in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves primary on an open-class nominal compound head", () => {
      expect(parseIpa(engine.predict("webdesign")!).primary).toBe(0);
    });
    it("preserves a custom root after whole-target eviction", () => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      delete access.dictionary.aligned;
      custom.addPronunciation("align", "AH0 L EY1 N");
      expect(custom.predict("aligned")).toBe("əˈɫeɪnd");
    });
    it("checks adjective, noun and verb readings in a complete sentence", () => {

      const tokens = englishTokens(engine, "The malign reader will align the sign.");
      expect(tokens.find(t => t.word === "malign")?.phoneme).toBe("məˈɫaɪn");
      expect(tokens.find(t => t.word === "align")?.phoneme).toBe("əˈɫaɪn");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "sign")?.phoneme).toBe("saɪn");
    });
  });

  it.each([
    ["ensign", "ˈɛnsən"], ["foreign", "ˈfɑɹən"], ["sovereign", "ˈsɑvɹən"],
  ])("preserves the default supplied nominal reading in %s", (word, ipa) => {
    expect(new EnglishG2P().predict(word)).toBe(ipa);
  });

})();

// Original suite: en-silent-h-and-root-corrections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("borrowed onsets and strong ancy (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => (g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "");

    test("honor and honest keep a silent h and LOT through their derivatives", () => {
      for (const word of ["honest", "honestly", "honesty", "honor", "honors", "honored", "honoring", "honorable", "honorably", "honorarium", "honoraria", "honorific", "honorifics"])
        expect(segments(word)).toMatch(/^ɑn/);
      // Honour's unrelated final OUR rule gap remains open in rules-only mode.
      expect(segments("honour")).toMatch(/^ɑn/);
    });

    test("transparent prefixes recover the quiet root after exception eviction", () => {
      for (const word of ["dishonor", "dishonored", "dishonest", "dishonesty", "unhonest", "nonhonest", "unhonorable", "nonhonorable"])
        expect(segments(word)).toContain("ɑn");
      expect(g2p.predict("honorarily")).toMatch(/^ˈɑn/);
    });

    test("native hon spellings retain the pronounced h", () => {
      for (const word of ["honcho", "honda", "honey", "hone", "honk", "honing"])
        expect(segments(word)).toMatch(/^h/);
    });

    test("the US schedul root uses sk across prefix and inflection boundaries", () => {
      for (const word of ["schedule", "schedules", "scheduled", "scheduling", "scheduler", "reschedule", "rescheduled", "unscheduled"])
        expect(segments(word)).toContain("skɛdʒ");
      for (const word of ["schedler", "schiller", "schmidt"])
        expect(segments(word)).toMatch(/^ʃ/);
    });

    test("the echo combining root keeps k while nearby ch spellings stay distinct", () => {
      for (const word of ["echo", "echoes", "echoed", "echoing", "echoer", "echoers", "echolalia", "echographic", "echocardiography"])
        expect(segments(word)).toMatch(/k/);
      for (const word of ["echochamber", "echochambers", "echochime", "echochild"])
        expect(segments(word)).toMatch(/tʃ/);
      // The longer forms' separate vowel/stress gaps are outside this rule.
      for (const word of ["chew", "check", "chicken", "chortle"])
        expect(segments(word)).toMatch(/^tʃ/);
    });

    test("a short C+ancy root retains strong TRAP through transparent prefixing", () => {
      for (const word of ["fancy", "fancies", "fanciest", "fancier", "chancy", "nancy", "clancy", "unfancy", "nonfancy"])
        expect(segments(word)).toContain("æn");
      // Francies has a supplied weak-vowel name reading; own only its /s/ join.
      expect(segments("francies")).toMatch(/nsiz$/);
      for (const word of ["vacancy", "pregnancy", "occupancy", "buoyancy", "truancy"])
        expect(segments(word)).toMatch(/ənsi$/);
    });
  });

})();

// Original suite: en-silent-head-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Silent-e compound boundaries (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });
    const phones = (word: string) => engine.predict(word)!.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə");

    it.each(["firefox", "fireeye"])("retains a merged rhotic root in %s", word => {
      expect(engine.predict(word)).toMatch(/^ˈfaɪɝ/);
    });

    it.each([
      ["smokescreen", "smoʊkskɹin"], ["widespread", "waɪdspɹɛd"],
      ["thereby", "ðɛɹbaɪ"], ["moreover", "mɔɹoʊvɝ"], ["somewhat", "səmwət"],
    ])("restores the segmental boundary in %s", (word, ipa) => {
      expect(phones(word)).toBe(ipa);
    });

    it.each(["fireeye", "wavefox", "stonefox"])("uses existing verified parts for a novel compound: %s", word => {
      expect(phones(word)).not.toMatch(/(?:ɹɪ|vɪ|nə)f/);
      expect(engine.predict(word)).toMatch(/(?:aɪ|f[ɑɔ]ks)$/);
    });

    it.each(["lacerate", "laceration"])("keeps the bound Latin root in %s", word => {
      expect(engine.predict(word)).toMatch(/[ˈˌ][ɫl]æs/);
    });
    it("keeps adjective/borrowed-root stress outside compound splitting", () => {
      expect(engine.predict("comedic")).toMatch(/kəˈm[ɛi]/);
      expect(engine.predict("pageant")).toMatch(/^ˈpædʒ/);
    });

    it.each(["racetam", "piracetam", "levetiracetam"])("keeps the bound chemical stem in %s", word => {
      expect(engine.predict(word)).not.toContain("ɹeɪs");
    });

    it.each(["fireman", "foreman"])("keeps the weak occupational suffix in %s", word => {
      expect(engine.predict(word)).toMatch(/mən$/);
    });
    it.each(["wholesome", "lonesome"])("keeps weak adjective -some in %s", word => {
      expect(engine.predict(word)).toMatch(/səm$/);
    });
    it("retains the weak directional rime", () => {
      expect(engine.predict("shoreward")).toMatch(/ɝd$/);
    });

    it.each([
      ["Firefox opened the page.", "Firefox", /faɪɝ/],
      ["They built a smokescreen.", "smokescreen", /smoʊkskɹin/],
      ["The damage is widespread.", "widespread", /waɪdspɹɛd/],
      ["They lacerate the surface.", "lacerate", /[ɫl]æs/],
    ] as const)("preserves noun/adjective/verb boundaries in %s", (sentence, word, ipa) => {
      const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)!;
      expect(target.phoneme.replace(/[ˈˌ]/g, "")).toMatch(ipa);
    });
  });

})();

// Original suite: en-silent-head-plurals.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("silent-e compound inflections, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([
      ["trademark", "ˈtɹeɪdˌmɑɹk", "trademarks", "ˈtɹeɪdˌmɑɹks"],
      ["notebook", "ˈnoʊtˌbʊk", "notebooks", "ˈnoʊtˌbʊks"],
      ["homeboy", "ˈhoʊmˌbɔɪ", "homeboys", "ˈhoʊmˌbɔɪz"],
      ["notebag", "ˈnoʊtˌbæɡ", "notebags", "ˈnoʊtˌbæɡz"],
      ["homekit", "ˈhoʊmˌkɪt", "homekits", "ˈhoʊmˌkɪts"],
    ])("retains the head rime in %s / %s", (stem, singular, plural, expected) => {
      expect(engine.predict(stem)).toBe(singular);
      expect(engine.predict(plural)).toBe(expected);
    });
    test("preserves y-plural restoration and ordinary short roots", () => {
      expect(engine.predict("comedies")).toBe("ˈkɑmədiz");
      expect(engine.predict("limpets")).toBe("ˈɫɪmpəts");
      expect(engine.predict("neckties")).toBe("ˈnɛkˌtaɪz");
      expect(engine.predict("placeboes")).toBe("pɫəˈsiboʊz");
      expect(engine.predict("outdoes")).toBe("ˌaʊtˈdʌz");
      expect(engine.predict("sidelined")).toBe("ˈsaɪdˌɫaɪnd");
      expect(engine.predict("stalemated")).toBe("ˈsteɪɫˌmeɪtɪd");
    });
    test.each([
      ["flower", "ˈfɫaʊɝ"], ["shower", "ˈʃaʊɝ"],
      ["tower", "ˈtaʊɝ"], ["glower", "ˈɡɫaʊɝ"],
      ["forecast", "ˈfɔɹˌkæst"],
    ])("retains an evicted stem across -ed and -ing: %s", (stem, ipa) => {
      expect(engine.predict(stem + "ing")).toBe(ipa + "ɪŋ");
      expect(engine.predict(stem + "ed")).toBe(ipa + (stem.endsWith("t") ? "ɪd" : "d"));
      if (stem.endsWith("ower")) expect(engine.predict(stem + "er")).toBe(ipa + "ɝ");
    });
    test.each([
      ["Their trademarks are registered.", "trademarks", "ˈtɹeɪdˌmɑɹks"],
      ["She trademarks the design.", "trademarks", "ˈtɹeɪdˌmɑɹks"],
      ["Her notebooks are open.", "notebooks", "ˈnoʊtˌbʊks"],
      ["The flowering plant is tall.", "flowering", "ˈfɫaʊɝɪŋ"],
      ["They are showering now.", "showering", "ˈʃaʊɝɪŋ"],
      ["They are forecasting rain.", "forecasting", "ˈfɔɹˌkæstɪŋ"],
    ])("preserves sentence context in %s", (sentence, word, ipa) => {
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
    test("keeps caller-owned whole stems ahead of recovered compound parts", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("notebook", "N AA1 T B UH2 K");
      expect(custom.predict("notebooks")).toBe("ˈnɑtˌbʊks");
      expect(engine.predict("notebooks")).toBe("ˈnoʊtˌbʊks");
    });
  });

  test("keeps neighboring adjective and noun/verb readings in full prose", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const target = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    expect(target("The appropriate trademarks are listed.", "appropriate")).toBe("əˈpɹoʊpɹiət");
    expect(target("They record the trademark.", "record")).toBe("ɹɪˈkɔɹd");
    expect(target("The record shows trademarks.", "record")).toBe("ˈɹɛkɝd");
  });

})();

// Original suite: en-single-letter-clitics.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge I'm/I've and Oxford A (noun): the apostrophe retains the letter nucleus.
  describe.each([false, true])("single-letter clitics, disableDict=%s", (disableDict) => {
    it.each([
      ["a", "ˈeɪ"], ["b", "ˈbi"], ["c", "ˈsi"], ["d", "ˈdi"], ["e", "ˈi"],
      ["f", "ˈɛf"], ["g", "ˈdʒi"], ["h", "ˈeɪtʃ"], ["i", "ˈaɪ"], ["k", "ˈkeɪ"],
      ["l", "ˈɛɫ"], ["m", "ˈɛm"], ["n", "ˈɛn"], ["p", "ˈpi"], ["r", "ˈɑɹ"],
      ["s", "ˈɛs"], ["t", "ˈti"], ["v", "ˈvi"], ["x", "ˈɛks"], ["y", "ˈwaɪ"],
    ])("reads standalone %s by its letter name", (letter, expected) => {
      expect(new EnglishG2P({ disableDict }).predict(letter, "en-US")).toBe(expected);
    });

    it("preserves article A as a weak form in prose", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const out = api.phonemize("A cat. I can read.", { language: "en-US", returnArray: true });
      expect(out.find((token) => token.word === "A")?.phoneme).toBe("ə");
      expect(out.find((token) => token.word === "I")?.phoneme).toBe("aɪ");
    });

    it.each([
      ["I'm", "ˈaɪm"], ["I've", "ˈaɪv"], ["I'd", "ˈaɪd"], ["I'll", "ˈaɪl"],
      ["a's", "ˈeɪz"], ["e's", "ˈiz"], ["q's", "ˈkjuz"], ["l's", "ˈɛɫz"],
      ["w's", "ˈdʌbəɫjuz"], ["z's", "ˈziz"],
    ])("composes %s from the existing letter name", (word, expected) => {
      const en = new EnglishG2P({ disableDict });
      for (const variant of [word, word.toUpperCase(), word.replace("'", "’")]) {
        expect(en.predict(variant, "en-US")).toBe(expected);
      }
    });

    it("keeps letter nouns full in prose and leaves article and tense controls intact", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const out = api.phonemize("I'm ready. I've earned A's. A cat read that book yesterday. I will read it tomorrow.", { language: "en-US", returnArray: true });
      expect(out.find(t => t.word === "I'm")?.phoneme).toBe("aɪm");
      expect(out.find(t => t.word === "I've")?.phoneme).toBe("aɪv");
      expect(out.find(t => t.word === "A's")?.phoneme).toBe("eɪz");
      expect(out.find(t => t.word === "A")?.phoneme).toBe("ə");
      if (!disableDict) expect(out.filter(t => t.word === "read").map(t => t.phoneme)).toEqual(["ɹɛd", "ɹid"]);
    });

    it("uses the shared dialect and phonotactic stages for letter stems", () => {
      const en = new EnglishG2P({ disableDict });
      expect(en.predict("R's", "en-GB")).toBe("ˈɑːz");
      expect(en.predict("R's", "en-US")).toBe("ˈɑɹz");
      expect(en.predict("W's", "en-US", "N")).toBe("ˈdʌbəɫjuz");
      expect(en.predict("L's", "en-US", "N")).toBe("ɛɫz");
    });

    it("preserves explicit stem and whole-token ownership", () => {
      const en = new EnglishG2P({ disableDict });
      en.addPronunciation("i", "ˈtɛst");
      expect(en.predict("I'm", "en-GB")).toBe("ˈtɛstm");
      en.addPronunciation("I'm", "ˈkʌstəm");
      expect(en.predict("I’m", "en-GB")).toBe("ˈkʌstəm");
      en.addPronunciation("q", "ˈtɛst");
      expect(en.predict("q's")).toBe("ˈtɛsts");
    });

    it("does not turn ordinary lexical stems into initialisms", () => {
      const en = new EnglishG2P({ disableDict });
      expect(en.predict("gas")).toBe("ˈɡæs");
      expect(en.predict("gassed")).toBe("ˈɡæst");
      expect(en.predict("workin'")).toMatch(/ɪn$/);
      expect(en.predict("o'clock")).not.toBe(en.predict("o") + "kɫɑk");
    });
  });

})();

// Original suite: en-sium-voicing-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])(
    "owns single-s ium roots after eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const w of ["cesium", "magnesium", "symposium", "gymnasium"])
        delete d[w];
      Reflect.set(e, "dictionary", d);
      // This class owns primary stress, vowel quality and s/z; optional secondary and dark-l notation are unchanged.
      for (const [word, ipa] of [
        ["cesium", "ˈsiziəm"],
        ["magnesium", "mæɡˈniziəm"],
        ["symposium", "sɪmˈpoʊziəm"],
        ["gymnasium", "dʒɪmˈneɪziəm"],
        ["gymnasiums", "dʒɪmˈneɪziəmz"],
        ["nonmagnesium", "nɑnmæɡˈniziəm"],
        ["potassium", "pəˈtæsiəm"],
        ["calcium", "ˈkælsiəm"],
        ["stadium", "ˈsteɪdiəm"],
      ])
        expect(e.predict(word)?.replace(/ˌ/g, "").replace(/ɫ/g, "l")).toBe(ipa);
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("The gymnasium contains magnesium samples.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "gymnasium")?.phoneme,
      ).toBe("dʒɪmˈneɪziəm");
    },
  );
  test("preserves supplied roots and targets", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("gymnasium", "ˈzɛmp");
    expect(e.predict("gymnasiums")).toBe("ˈzɛmps");
    e.addPronunciation("magnesium", "ˈtɛst");
    expect(e.predict("magnesium")).toBe("ˈtɛst");
  });

})();

// Original suite: en-soever-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("fused ever compounds (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["wherever", /^(?:ˌ)?hwɛˈɹɛvɝ$/],
      ["whatsoever", /^ˌhw[əʌ]tsoʊˈɛvɝ$/],
      ["whosoever", /^ˌhusoʊˈɛvɝ$/],
      ["whomsoever", /^ˌhumsoʊˈɛvɝ$/],
      ["howsoever", /^ˌhaʊsoʊˈɛvɝ$/],
      ["wheresoever", /^ˌhwɛɹsoʊˈɛvɝ$/],
    ] as const)("preserves the components in %s", (word, ipa) => {
      expect(engine.predict(word)).toMatch(ipa);
    });
    it.each([
      ["believer", /^b[ɪə]ˈɫivɝ$/],
      ["reliever", /^ɹ[iɪ]ˈɫivɝ$/],
      ["cheever", /^ˈtʃivɝ$/],
      ["lever", /^ˈɫ[ɛi]vɝ$/],
      ["clever", /^ˈkɫɛvɝ$/],
      ["never", /^ˈnɛvɝ$/],
      ["sever", /^ˈsɛvɝ$/],
    ] as const)("preserves an unrelated root in %s", (word, ipa) => {
      expect(engine.predict(word)).toMatch(ipa);
    });
    it.each(["however", "whatever", "whenever", "whoever", "whichever", "whomever"])("retains final primary stress in %s", word => {
      expect(engine.predict(word)).toMatch(/ˈ[^ˈ]*ɛvɝ$/);
    });
    it("preserves noun, adjective and verb controls in a full sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will work wherever he can.");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "wherever")?.phoneme).toMatch(/hwɛˈɹɛvɝ$/);
    });
  });

})();

// Original suite: en-spanish-jua.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("internal Spanish-loan <jua>", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["marijuana", "ˌmɛɹɪˈwɑnə"],
      ["tijuana", "tɪˈwɑnə"],
    ])("uses /wɑ/ in the internal <jua> frame of %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["jua", "ˈdʒʌæ"],
      ["juana", "dʒəˈænə"],
      ["juanita", "dʒəəˈnitə"],
      ["juarez", "dʒəˈæɹɛz"],
      ["juang", "ˈdʒʌæŋ"],
      ["sanjuan", "ˈsændʒəən"],
      ["kajuahar", "ˈkædʒəəhɝ"],
    ])("preserves the contrasting <j> reading in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("uses the dictionary reading for the established name Juan", () => {
      expect(rules.predict("juan", "en-US")).toBe("ˈhwɑn");
    });
  });

})();

// Original suite: en-split-iv-tail.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("open e before a split iV tail, rules=%s", disableDict => {
    it.each([
      ["appreciate", "əˈpɹiʃiˌeɪt"], ["depreciate", "dɪˈpɹiʃiˌeɪt"],
      ["abbreviate", "əˈbɹiviˌeɪt"], ["alleviate", "əˈɫiviˌeɪt"],
      ["mediate", "ˈmidiˌeɪt"],
    ])("preserves the full vowel and owned coda in %s", (word, ipa) => {
      expect(new EnglishG2P({ disableDict }).predict(word)).toBe(ipa);
    });
    it("keeps derived roots and closed nasal + ci controls", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const word of ["appreciates", "appreciated", "appreciating", "appreciation"])
        expect(engine.predict(word)).toMatch(/pɹiʃi/);
      for (const word of ["enunciate", "enunciation", "annunciate"])
        expect(engine.predict(word)).toMatch(/nsi/);
      expect(engine.predict("associate")).toMatch(/soʊsi/);
      expect(engine.predict("association")).toMatch(/soʊsi/);
      for (const word of ["specialise", "specialises", "specialising"])
        expect(engine.predict(word)).toMatch(/^ˈspɛ/);
      expect(engine.predict("medal")).toBe("ˈmɛdəɫ");
      expect(engine.predict("special")).toBe("ˈspɛʃəɫ");
    });
    it("retains caller-owned whole words", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("appreciate", "ˈzɛŋ");
      expect(engine.predict("appreciate")).toBe("ˈzɛŋ");
    });
  });
  it("preserves noun/adjective/verb sentence controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const [sentence, target, ipa] of [
      ["I appreciate the help.", "appreciate", "əˈpɹiʃiˌeɪt"],
      ["It is a precious gift.", "precious", "ˈpɹɛʃəs"],
      ["Use discretion here.", "discretion", "dɪsˈkɹɛʃən"],
      ["The medical report is clear.", "medical", "ˈmɛdɪkəɫ"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === target)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-stem-voicing-candidate.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  test.each([false, true])( "a voiced stem keeps its consonant in derivatives and neighbors stay unchanged, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of ["N", "ADJ", "V", undefined]) {
      expect(engine.predict("possession", "en", pos)).toBe("pəˈzɛʃən");
      expect(engine.predict("possessive", "en", pos)).toBe("pəˈzɛsɪv");
      expect(engine.predict("repossession", "en", pos)).toBe("ˌɹipəˈzɛʃən");
      expect(engine.predict("procession", "en", pos)).toBe("pɹəˈsɛʃən");
      expect(engine.predict("confession", "en", pos)).toBe("kənˈfɛʃən");
    }

    const tokens = englishTokens(engine, "The possession is hers; the procession will proceed.");
    expect(tokens.find(t => t.word.toLowerCase() === "possession")?.phoneme).toBe("pəˈzɛʃən");
    expect(tokens.find(t => t.word.toLowerCase() === "procession")?.phoneme).toBe("pɹəˈsɛʃən");
  });

  test("silent-e fake stems do not override whole-word rules", () => {
    const engine = new EnglishG2P({ disableDict: true });
    expect(engine.predict("diseaseive", "en")).toBe("ˌdɪsiˈseɪv");
    expect(engine.predict("diseaseion", "en")).toBe("dɪˈsiseiən");
  });

  test("a caller-supplied stem takes priority in rules-only pronunciation", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("possess", "pəˈsɛs");
    expect(engine.predict("possession", "en")).toBe("pəˈsɛʃən");
    engine.addPronunciation("possess", "pəˈzɛs");
    expect(engine.predict("possession", "en")).toBe("pəˈzɛʃən");
    engine.addPronunciation("susan", "ˈsuzən");
    expect(engine.predict("susanor", "en")).toBe("ˈsuzənɝ");
    engine.addPronunciation("susan", "ˈsusən");
    expect(engine.predict("susanor", "en")).toBe("ˈsusənɝ");
  });

})();

// Original suite: en-sthm-clusters.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Merriam-Webster asthma, isthmus and isthmian supply the independent AmE readings.
  describe.each([false, true])("Greek sth before m, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["asthma", "ˈæzmə"], ["asthmatic", "æzˈmætɪk"],
      ["asthmas", "ˈæzməz"], ["isthmus", "ˈɪsməs"],
      ["isthmian", "ˈɪsmiən"], ["isthmic", "ˈɪsmɪk"],
      ["isthmuses", "ˈɪsməsəz"], ["asthmatically", "æzˈmætɪkɫi"],
    ])("simplifies the complete cluster in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves the British voiceless counterpart", () => {
      expect(engine.predict("asthma", "en-GB")).toBe("ˈæsmə");
      expect(engine.predict("asthmatic", "en-GB")).toBe("æsˈmætɪk");
    });
    it("preserves adjacent native boundaries", () => {
      expect(engine.predict("eastman")).toBe("ˈistmən");
      expect(engine.predict("postman")).toBe(disableDict ? "ˈpoʊstmən" : "ˈpoʊsmən");
      expect(engine.predict("basement")).toBe("ˈbeɪsmənt");
    });
    it("preserves adjective, agent noun and past verb in a complete sentence", () => {
      const api = createPhonemizer({ processors: [engine] });
      const out = api.phonemize("The asthmatic reader read the notes yesterday.", {
        language: "en-US", returnArray: true,
      });
      expect(out.find(t => t.word === "asthmatic")?.phoneme).toBe("æzˈmætɪk");
      expect(out.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(out.find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
    });
    it("retains a complete root after dictionary eviction", () => {
      const own = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(own, ["asthma"]);
      expect(own.predict("asthmas")).toBe("ˈæzməz");
      expect(own.predict("asthmas", "en-GB")).toBe("ˈæsməz");
    });
    it("preserves caller roots, explicit children and literal clusters", () => {
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("asthma", "ˈzɛŋ");
      expect(own.predict("asthmas")).toBe("ˈzɛŋz");
      own.addPronunciation("asthmas", "ˈkɛŋ");
      expect(own.predict("asthmas")).toBe("ˈkɛŋ");
      own.addPronunciation("asthma", "ˈæstmə");
      expect(own.predict("asthma")).toBe("ˈæstmə");
    });
  });

})();

// Original suite: en-storm-source.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Cambridge American Dictionary hurricane /ˈhɜr·əˌkeɪn/ and
  // Cambridge US cyclone /ˈsaɪ.kloʊn/; regular inflections preserve these stems.
  describe("verified storm dictionary readings", () => {
    const engine = new EnglishG2P();
    test.each([
      ["hurricane", "ˈhɝəˌkeɪn"],
      ["hurricanes", "ˈhɝəˌkeɪnz"],
      ["hurricane's", "ˈhɝəˌkeɪnz"],
      ["cyclone", "ˈsaɪkɫoʊn"],
      ["cyclones", "ˈsaɪkɫoʊnz"],
      ["cyclone's", "ˈsaɪkɫoʊnz"],
    ])("preserves the vouched reading in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
      expect(engine.predict(word, "en-US", "N")).toBe(ipa);
    });
    test("preserves full noun contexts and adjective/verb controls", () => {

      const tokens = englishTokens(engine, "The hurricane is strong. The cyclone is large. Cyclones move quickly.");
      expect(tokens.filter(token => /^(?:hurricane|cyclone|Cyclones)$/.test(token.word)).map(token => token.phoneme)).toEqual(["ˈhɝəˌkeɪn", "ˈsaɪkɫoʊn", "ˈsaɪkɫoʊnz"]);
      expect(tokens.find(token => token.word === "strong")?.phoneme).toBe("stɹɔŋ");
      expect(tokens.find(token => token.word === "move")?.phoneme).toBe("muv");
    });
  });

})();

// Original suite: en-stress-bearing-endings.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("stress-bearing endings (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["career", "engineer", "pioneer", "volunteer"])("%s retains stressed NEAR in -eer", word => {
      expect(g2p.predict(word, "en")).toMatch(/ˈ[^ɑæɛiɪɔʊuəʌɝ]*ɪɹ$/);
    });
    test.each(["chinese", "japanese"])("%s stresses the -ese vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/ˈniz$/);
    });
    test("a novel -ese word uses the same suffix stress", () => {
      expect(g2p.predict("zorbese", "en")).toMatch(/ˈbiz$/);
    });
    test.each(["nebraska", "necessity", "nevada"])("%s centralizes weak ne", word => {
      expect(g2p.predict(word, "en")).toMatch(/^nə/);
    });
    test("cinema centralizes its medial weak ne", () => {
      expect(g2p.predict("cinema", "en")).toMatch(/nəmə$/);
    });
    test("genetic keeps its stressed ne vowel", () => {
      expect(g2p.predict("genetic", "en")).toMatch(/ˈnɛ/);
    });
    test("neutral -er still composes with its stem", () => {
      expect(g2p.predict("controller", "en")).toMatch(/oʊɫɝ$/);
    });
    test("a monosyllabic -eer rime keeps its nucleus", () => {
      expect(g2p.predict("deer", "en")).toMatch(/ɪɹ$/);
    });
  });

})();

// Original suite: en-stress-bearing-tee.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const predict = (word: string) => g.predict(word, "en")!;
    describe(`Stress-bearing -ee (${disableDict})`, () => {
      test("retains the terminal beat through noun and verb forms", () => {
        for (const root of ["guarantee", "absentee"])
          for (const word of [root, root + "s", root + "'s", "non" + root])
            expect(predict(word)).toMatch(/ˈti/);
        for (const word of ["guaranteed", "guaranteeing"])
          expect(predict(word)).toMatch(/ˈti/);
      });
      test("keeps the bound a-prefix weak", () => {
        expect(predict("appointee")).toMatch(/^ə/);
        if (disableDict) {
          expect(predict("appointee")).toMatch(/pɔɪnˈti$/);
          expect(predict("assentee")).toMatch(/^əsɛnˈti$/);
        }
      });
      test("preserves other ee roots and ordinary past forms", () => {
        expect(predict("coffee")).toMatch(/^ˈk[ɑɔ]fi$/);
        expect(predict("pedigree")).toMatch(/^ˈpɛ/);
        expect(predict("feed")).toMatch(/fid$/);
        expect(predict("need")).toMatch(/nid$/);
        expect(predict("agreed")).toMatch(/ˈɡɹid$/);
      });
    });
  }

})();

// Original suite: en-stress-stable-cie.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("stress-stable Latin cie, rules=%s", disableDict => {
    it("keeps the complete singular rime when species leaves the table", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["species"]);
      for (const [word, ipa] of [
        ["specie", "ˈspiʃi"], ["species", "ˈspiʃiz"], ["species'", "ˈspiʃiz"], ["specie's", "ˈspiʃiz"],
        ["speciation", "spiʃiˈeɪʃən"],
      ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("preserves the existing y stress, vowel teams and ordinary names", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["prophecy", "ˈpɹɑfəsi"], ["prophecies", "ˈpɹɑfəsiz"],
        ["fleecies", "ˈfɫisiz"], ["leslie", "ˈɫɛsɫi"], ["lucie", "ˈɫusi"],
        ["policies", "ˈpɑɫəsiz"], ["agencies", "ˈeɪdʒənsiz"], ["mercies", "ˈmɝsiz"],
        ["specify", "ˈspɛsəfaɪ"], ["specimen", "ˈspɛsəmən"], ["specious", "ˈspiʃəs"],
      ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it.each(["specie", "specy"])("respects a supplied %s stem and full child", stem => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["species"]);
      engine.addPronunciation(stem, "ˈzɛŋ");
      expect(engine.predict("species")).toBe("ˈzɛŋz");
      engine.addPronunciation("species", "ˈkɛŋ");
      expect(engine.predict("species")).toBe("ˈkɛŋ");
    });
    it("preserves noun, adjective and verb sentence controls", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const sentence of ["The species is rare.", "The species are rare.", "The report specifies the species.", "The species-specific result is clear."])
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "species")?.phoneme).toBe("ˈspiʃiz");
      expect(api.phonemize("They specify the details.", { language: "en-US", returnArray: true }).find(t => t.word === "specify")?.phoneme.replace(/ˌ/g, "")).toBe("ˈspɛsəfaɪ");
    });
  });

})();

// Original suite: en-stressed-ial-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("stressed final -ial hiatus, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test("retains the diphthong and primary stress through word forms", () => {
      expect(engine.predict("denial", "en", "N")).toBe("dɪˈnaɪəɫ");
      expect(engine.predict("denials", "en", "N")).toBe("dɪˈnaɪəɫz");
      expect(engine.predict("redial", "en", "V")).toBe("ɹiˈdaɪəɫ");
      expect(engine.predict("retrial", "en", "N")).toBe("ɹiˈtɹaɪəɫ");
      expect(engine.predict("deny", "en", "V")).toBe("dɪˈnaɪ");
      expect(engine.predict("dial", "en", "V")).toBe("ˈdaɪəɫ");
      expect(engine.predict("initial", "en", "ADJ")).toContain("nɪʃəɫ");
    });

    test("uses the new reading in full sentences", () => {
      expect(api.phonemize("The denial surprised them.", { language: "en-US" }))
        .toBe("ðə dɪˈnaɪəɫ səˈpɹaɪzd ðəm.");
      expect(api.phonemize("They redial the number.", { language: "en-US" }))
        .toBe("ðeɪ ɹiˈdaɪəɫ ðə ˈnʌmbɝ.");
    });
  });

  test("the default pipeline preserves redial's noun and verb stress contrast", () => {
    const engine = new EnglishG2P();
    expect(engine.predict("redial", "en", "N")).toBe("ˈɹiˌdaɪəɫ");
    expect(engine.predict("redial", "en", "V")).toBe("ɹiˈdaɪəɫ");
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("The redial is automatic.", { language: "en-US" }))
      .toBe("ðə ˈɹiˌdaɪəɫ ɪz ˌɔtəˈmætɪk.");
  });

  test("a doubled final consonant is not forced into the hiatus class", () => {
    expect(new EnglishG2P({ disableDict: true }).predict("aviall", "en")).not.toContain("aɪ");
  });

})();

// Original suite: en-stressed-soft-geminate.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("primary lax-e geminate (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["suggestion", "səˈdʒɛstʃən"], ["suggestions", "səˈdʒɛstʃənz"],
      ["suggestion's", "səˈdʒɛstʃənz"], ["suggestible", "səˈdʒɛstəbəɫ"],
      ["dagger", "ˈdæɡɝ"], ["aggie", "ˈæɡi"], ["baggy", "ˈbæɡi"],
      ["buggy", "ˈbʌɡi"], ["legge", "ˈɫɛɡ"], ["bagge", "ˈbæɡ"],
    ])("preserves the root or contrast in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains a hard g before a closed e syllable", () => {
      expect(engine.predict("leggette")).toMatch(/ˈɡɛt$/);
    });
    it("retains a hard g before primary i", () => {
      expect(engine.predict("biaggini")).toContain("ˈɡini");
    });
    it("preserves the tense-vowel hard g", () => {
      expect(engine.predict("saggese")).toContain("ɡi");
    });
    it("preserves the weak closed get rime", () => {
      expect(engine.predict("nugget")).toMatch(/ɡ[əɪ]t$/);
    });
    it("does not merge a distinct g + j boundary in an OOV compound", () => {
      expect(engine.predict("eggjam")).toMatch(/ɡ[ˈˌ]?dʒ/);
    });
    it.each(["autosuggestion", "ruggestion", "nuggestible"])("keeps the softened root productive in %s", word => {
      expect(engine.predict(word)).toContain("ˈdʒɛst");
    });
    it("preserves an existing root under the non prefix", () => {
      expect(engine.predict("nonsuggestible")).toContain("səˈdʒɛstəbəɫ");
    });
    it("preserves a caller's root and its inflections", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("suggestion", "ˈzɛŋ");
      for (const [word, ipa] of [["suggestion", "ˈzɛŋ"], ["suggestions", "ˈzɛŋz"],
        ["suggestion's", "ˈzɛŋz"]])
        expect(custom.predict(word)).toBe(ipa);
    });
    it("preserves noun, adjective and verb readings in full sentences", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The clever reader will work on a suggestion.", {
        language: "en-US", returnArray: true,
      });
      for (const [word, ipa] of [["suggestion", "səˈdʒɛstʃən"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
      expect(api.phonemize("The suggestible reader will work.", {
        language: "en-US", returnArray: true,
      }).find(t => t.word === "suggestible")?.phoneme).toBe("səˈdʒɛstəbəɫ");
    });
  });

})();
