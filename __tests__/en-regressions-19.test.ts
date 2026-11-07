// Original suite: en-proto-single-nucleus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("single-nucleus proto tails, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    // Cambridge American Dictionary: /ˈproʊt̬·əˌkɔl, -ˌkɑl/.
    it.each([["protocol", "ˈpɹoʊtəˌkɑɫ"], ["prototype", "ˈpɹoʊtəˌtaɪp"]])("retains the full combining head in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("leaves regular plurals with their singular root", () => {
      const own = new EnglishG2P({ disableDict });
      const plural = own.predict("protocols");
      own.addPronunciation("cols", "ˈzɛŋ");
      expect(own.predict("protocols")).toBe(plural);
    });
    it.each(["zoa", "zoan"])("does not reinterpret the hiatus tail %s as a single-nucleus root", tail => {
      const own = new EnglishG2P({ disableDict });
      const before = own.predict("proto" + tail);
      own.addPronunciation(tail, "ˈzɛŋ");
      expect(own.predict("proto" + tail)).toBe(before);
    });
    it("supports an OOV root and caller-owned prefix, root and target", () => {
      const own = new EnglishG2P({ disableDict });
      expect(own.predict("protokemp")).toBe("ˈpɹoʊtəˌkɛmp");
      own.addPronunciation("proto", "ˈzɛŋ");
      own.addPronunciation("kemp", "ˈfɔɹm");
      expect(own.predict("protokemp")).toBe("ˈzɛŋˌfɔɹm");
      own.addPronunciation("protokemp", "ˈkɛŋ");
      expect(own.predict("protokemp")).toBe("ˈkɛŋ");
    });
    it("preserves neighbouring adjective, noun and verb readings", () => {

      const tokens = englishTokens(engine, "They record a kind minder following the protocol.");
      expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
      expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
      expect(tokens.find(t => t.word === "protocol")?.phoneme).toBe("ˈpɹoʊtəˌkɑɫ");
      if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
    });
  });

})();

// Original suite: en-pse-and-greek-nuclei.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("silent pse and bound Greek nuclei (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("silent pse closes a short-vowel rime through inflection", () => {
      for (const word of ["lapse", "lapses", "lapsed", "lapsing", "lapser", "lapsers", "relapse", "relapses", "relapsed", "relapsing"])
        expect(g2p.predict(word)).toContain("ˈɫæps");
      for (const word of ["collapse", "collapses", "collapsed", "collapsing", "collapser", "collapsers"])
        expect(g2p.predict(word)).toContain("ˈɫæps");
      for (const word of ["glimpse", "glimpses", "glimpsed", "glimpsing", "glimpser", "glimpsers"])
        expect(g2p.predict(word)).toContain("ˈɡɫɪmps");
      for (const word of ["corpse", "corpses", "corpser"])
        expect(g2p.predict(word)).toContain("ˈkɔɹps");
      for (const word of ["traipse", "traipses", "traipsed", "traipsing", "traipser", "traipsers"])
        expect(g2p.predict(word)).toContain("ˈtɹeɪps");
    });

    test("Greek onymous stresses the first of the merged slot's two nuclei", () => {
      for (const word of ["anonymous", "anonymously", "anonymousness", "synonymous", "synonymously"])
        expect(g2p.predict(word)).toContain("ˈnɑn");
      for (const word of ["eponymous", "eponymously"])
        expect(g2p.predict(word)).toMatch(/ˈp[ɑɔ]/);
    });

    test("syn- stays short across an onset split while bare syne keeps PRICE", () => {
      for (const word of ["synod", "synaptic", "synodic", "synergism", "synergistic", "synergetic"])
        expect((g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "")).toMatch(/^sɪn/);
      expect(g2p.predict("syne")).toContain("saɪn");
    });

    test("chron- retains the Greek stop across a syllable boundary", () => {
      for (const word of ["synchronous", "asynchronous", "synchronic", "synchronicity"])
        expect((g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "")).toContain("ŋkɹ");
      expect((g2p.predict("anachronistic") ?? "").replace(/[ˈˌ]/g, "")).toContain("ækɹ");
      for (const word of ["churchroof", "ranchroad", "archrival"])
        expect((g2p.predict(word) ?? "").replace(/[ˈˌ]/g, "")).toContain("tʃɹ");
    });

    test("a- is weak before a doubled coda and neighbouring light roots keep stress", () => {
      for (const word of ["amiss", "abuzz", "amass"])
        expect(g2p.predict(word)).toMatch(/^əˈ/);
      for (const word of ["acid", "atom", "agent", "analyst", "aspect"])
        expect(g2p.predict(word)).toMatch(/^ˈ/);
    });
  });

})();

// Original suite: en-quantified-adverb-subject.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  function reading(sentence: string, word: string) { return api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme; }
  test.each(["Many people actually read such publications.", "Several people read such publications.", "They ask how many people actually read such publications."])("quantifiers supply plural agreement across adverbs: %s", sentence => {
   expect(reading(sentence, "read")).toBe("ɹid");
  });
  test("temporal cues and bare names retain past readings", () => {
   for (const sentence of ["Many people actually read such publications yesterday.", "James read four scenes.", "During his first audition, James read four scenes.", "Daggs read three reports yesterday."]) expect(reading(sentence, "read")).toBe("ɹɛd");
  });
  test("quantified object frames distinguish nouns and verbs", () => {
   expect(reading("Others contest such proposals.", "contest")).toContain("ˈtɛst");
   expect(reading("The contest was fair.", "contest")).toMatch(/^ˈkɑn/);
   expect(reading("Both players discard cards.", "discard")).toContain("ˈskɑɹd");
   expect(reading("The discard pile is large.", "discard")).toMatch(/^ˈdɪs/);
   expect(reading("The unit has a read bus.", "read")).toBe("ɹid");
   expect(reading("They rejected an invalid ISBN.", "invalid")).toContain("ˈvæ");
  });

})();

// Original suite: en-quantified-noun-modifiers.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;

  test("quantified plural subjects retain noun and adjective modifiers", () => {
   expect(pick("Many modern offset presses use computer-to-plate systems.", "use")).toBe("juz");
   expect(pick("Many competition production companies permit photography at events.", "permit")).toContain("ˈmɪt");
   expect(pick("These active cells produce collagenous fibers.", "produce")).toContain("ˈdus");
  });
  test("nominal uses and adjective readings remain distinct", () => {
   expect(pick("Many computer uses were documented.", "uses")).toBe("ˈjusəz");
   expect(pick("Many live recordings were released.", "live")).toBe("ɫaɪv");
   expect(pick("The permit was issued.", "permit")).toMatch(/^ˈpɝ/);
  });
  test("past and modal read retain their own tense", () => {
   expect(pick("Many modern students read reports at night yesterday.", "read")).toBe("ɹɛd");
   expect(pick("Many modern students will read reports at night.", "read")).toBe("ɹid");
  });

})();

// Original suite: en-quantified-plural-objects.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  it.each([
    ["These methods permit some of these measurements.", "permit", "pɝˈmɪt"],
    ["Accessories for typical multimeters permit some of these measurements.", "permit", "pɝˈmɪt"],
    ["The parks permit some people need is expensive.", "permit", "ˈpɝmɪt"],
    ["The permits some people need are expensive.", "permits", "ˈpɝmɪts"],
    ["He did no contest.", "contest", "ˈkɑntɛst"],
  ])("preserves finite and nominal readings in %s", (sentence, word, ipa) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });

})();

// Original suite: en-re-fer-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the weak re- allomorph before the fer verb root", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const runtime = new EnglishG2P();

    it.each([
      ["refer", "ɹɪˈfɝ"],
      ["refers", "ɹɪˈfɝz"],
      ["referred", "ɹɪˈfɝd"],
      ["referring", "ɹɪˈfɝɪŋ"],
      ["referral", "ɹɪˈfɝəɫ"],
      ["referrals", "ɹɪˈfɝəɫz"],
    ])("carries /ɪ/ through %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
      expect(runtime.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["reference", "ˈɹɛfɝəns"],
      ["referent", "ˈɹɛfɝənt"],
      ["reframe", "ɹiˈfɹeɪm"],
    ])("preserves the separate %s reading", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
      expect(runtime.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["referee", "ɹiˈfɛɹi", "ˌɹɛfɝˈi"],
      ["rephrase", "ɹɛˈfɹeɪz", "ɹiˈfɹeɪz"],
    ])("keeps the existing route for %s", (word, ruleExpected, runtimeExpected) => {
      expect(rules.predict(word, "en-US")).toBe(ruleExpected);
      expect(runtime.predict(word, "en-US")).toBe(runtimeExpected);
    });
  });

})();

// Original suite: en-re-flect-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("re- before the flect root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["reflect", "ɹɪˈfɫɛkt"],
      ["reflection", "ɹɪˈfɫɛkʃən"],
      ["reflective", "ɹɪˈfɫɛktɪv"],
      ["reflector", "ɹɪˈfɫɛktɝ"],
      ["reflections", "ɹɪˈfɫɛkʃənz"],
      ["reflected", "ɹɪˈfɫɛktɪd"],
      ["reflecting", "ɹɪˈfɫɛktɪŋ"],
      ["reflectively", "ɹɪˈfɫɛktɪvɫi"],
      ["reflectiveness", "ɹɪˈfɫɛktɪvnəs"],
      ["reflectance", "ɹɪˈfɫɛktəns"],
      ["reflectable", "ɹɪˈfɫɛktəbəɫ"],
    ])("uses the weak re- vowel throughout %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["reflag", "ɹiˈfɫæɡ"],
      ["reflate", "ɹiˈfɫeɪt"],
      ["reflation", "ɹiˈfɫeɪʃən"],
      ["reflux", "ɹiˈfɫʌks"],
      ["reflex", "ɹiˈfɫɛks"],
      ["reflectone", "ɹiˈfɫɛktoʊn"],
    ])("preserves the neighboring %s reading", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-re-fresh-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the weak re- allomorph before the fresh root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["refresh", "ɹɪˈfɹɛʃ"],
      ["refreshed", "ɹɪˈfɹɛʃt"],
      ["refreshing", "ɹɪˈfɹɛʃɪŋ"],
      ["refreshes", "ɹɪˈfɹɛʃəz"],
      ["refresher", "ɹɪˈfɹɛʃɝ"],
      ["refreshment", "ɹɪˈfɹɛʃmənt"],
      ["refreshingly", "ɹɪˈfɹɛʃɪŋɫi"],
    ])("keeps /ɪ/ through %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["reflag", "ɹiˈfɫæɡ"],
      ["reflate", "ɹiˈfɫeɪt"],
      ["reflation", "ɹiˈfɫeɪʃən"],
      ["reflux", "ɹiˈfɫʌks"],
      ["reframe", "ɹiˈfɹeɪm"],
      ["rephrase", "ɹɛˈfɹeɪz"],
    ])("preserves the distinct %s form", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-re-prefix-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  it("keeps tense and subject context across written re prefixes", () => {
    for (const known of [false, true]) {
      const engine = new EnglishG2P();
      const tag = engine.tagWord.bind(engine);
      if (known) engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : tag(word, context);
      const api = createPhonemizer({ processors: [engine] });
      for (const [sentence, word, ipa] of [
        ["He re-read the book.", "read", "ɹɛd"],
        ["They re-read the book every week.", "read", "ɹid"],
        ["He will re-read the book.", "read", "ɹid"],
        ["They have re-read the book.", "read", "ɹɛd"],
        ["He re-re-read the book.", "read", "ɹɛd"],
        ["They re-record the music.", "record", "ɹɪˈkɔɹd"],
        ["The re-record is clear.", "record", "ˈɹɛkɝd"],
        ["The guide refers to re-use of equipment.", "use", "jus"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    }
  });
  it("distinguishes quoted nominal passives from active reading and quoted target words", () => {
    for (const known of [false, true]) {
      const engine = new EnglishG2P();
      const tag = engine.tagWord.bind(engine);
      if (known) engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : tag(word, context);
      const api = createPhonemizer({ processors: [engine] });
      for (const [sentence, ipa] of [
        ['The recording features "A Christmas Carol" read by Wolfgang.', "ɹɛd"],
        ["They read by John.", "ɹid"],
        ['They read "A Christmas Carol" by candlelight.', "ɹid"],
        ['They "read" by John.', "ɹid"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
    }
  });

})();

// Original suite: en-re-source-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the re- + source morpheme boundary", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("preserves the source root's voiceless s in resource", () => {
      expect(rules.predict("resource", "en-US")).toBe("ɹiˈsɔɹs");
    });

    it.each([
      ["research", "ɹiˈsɝtʃ"],
      ["resort", "ɹiˈzɔɹt"],
      ["result", "ɹiˈzʌɫt"],
      ["resupply", "ɹiˈzʌpɫi"],
      ["resources", "ˈɹisɔɹsəz"],
      ["resourceful", "ˈɹisɔɹsfəɫ"],
      ["source", "ˈsɔɹs"],
      ["sources", "ˈsɔɹsəz"],
    ])("preserves the neighboring %s route", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-re-verb-and-license.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge US reproduce/reconstruct/license; re- preserves a verb's own root.
  // https://dictionary.cambridge.org/us/dictionary/english/reproduce
  // https://dictionary.cambridge.org/us/dictionary/english/reconstruct
  // https://dictionary.cambridge.org/us/pronunciation/english/license
  // https://www.oxfordlearnersdictionaries.com/definition/english/reuse_2 (noun /s/)
  const withoutSecondary = (ipa: string | null) => ipa?.replace(/ˌ/g, "");

  describe.each([false, true])("vouched re- verbs and weak ns spellings (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["reproduce", "ɹipɹəˈdus"],
      ["reproduces", "ɹipɹəˈdusəz"],
      ["reproduced", "ɹipɹəˈdust"],
      ["reproducing", "ɹipɹəˈdusɪŋ"],
      ["recombine", "ɹikəmˈbaɪn"],
      ["recombined", "ɹikəmˈbaɪnd"],
      ["recombining", "ɹikəmˈbaɪnɪŋ"],
      ["reconstruct", "ɹikənˈstɹʌkt"],
      ["reconstructed", "ɹikənˈstɹʌktɪd"],
      ["reconstructing", "ɹikənˈstɹʌktɪŋ"],
    ])("retains the complete verb root through %s", (word, ipa) => {
      expect(withoutSecondary(engine.predict(word))).toBe(ipa);
    });
    it.each([
      ["license", "ˈɫaɪsəns"],
      ["licence", "ˈɫaɪsəns"],
      ["licenses", "ˈɫaɪsənsəz"],
      ["licensed", "ˈɫaɪsənst"],
      ["licensing", "ˈɫaɪsənsɪŋ"],
      ["unlicensed", "ənˈɫaɪsənst"],
      ["licensable", "ˈɫaɪsənsəbəɫ"],
      ["licenser", "ˈɫaɪsənsɝ"],
    ])("shares the weak ending without changing the stem in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([
      ["really", "ˈɹiɫi"],
      ["defense", "dɪˈfɛns"],
      ["defence", "dɪˈfɛns"],
      ["dispense", "dɪˈspɛns"],
      ["dense", "ˈdɛns"],
      ["tense", "ˈtɛns"],
      ["suspense", "səˈspɛns"],
      ["silence", "ˈsaɪɫəns"],
    ])("preserves the neighboring environment in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each<[string, string, string, string[]]>([
      ["They reproduce the signal.", "reproduce", "ɹipɹəˈdus", ["ðeɪ", "ðə", "ˈsɪɡnəɫ", "."]],
      ["They reconstruct the active device.", "reconstruct", "ɹikənˈstɹʌkt", ["ðeɪ", "ðə", "ˈæktɪv", "dɪˈvaɪs", "."]],
      ["They license the active device.", "license", "ˈɫaɪsəns", ["ðeɪ", "ðə", "ˈæktɪv", "dɪˈvaɪs", "."]],
      ["The license is active.", "license", "ˈɫaɪsəns", ["ðə", "ɪz", "ˈæktɪv", "."]],
    ])("keeps the target reading in complete prose: %s", (text, word, ipa, others) => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize(text, { language: "en-US", returnArray: true });
      expect(withoutSecondary(tokens.find(token => token.word === word)?.phoneme ?? null)).toBe(ipa);
      expect(tokens.filter(token => token.word !== word).map(token => token.phoneme)).toEqual(others);
      expect(withoutSecondary(engine.predict(word, "en-US", word === "license" && text.startsWith("The") ? "N" : "V"))).toBe(ipa);
    });
    it("does not treat a monosyllabic root's plural as a separate polysyllabic base", () => {
      expect(engine.predict("reuses")).toBe("ɹiˈjusəz");
      expect(engine.predict("reuses", "en-US", "N")).toBe("ɹiˈjusəz");
    });
    it.each(["ADJ", "NN", "IN"])("composes the verb root inside an adjective with supplied %s", pos => {
      expect(engine.predict("reproducible", "en-US", pos)).toBe("ˌɹipɹəˈdusəbəɫ");
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The result is reproducible.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "reproducible")?.phoneme).toBe("ˌɹipɹəˈdusəbəɫ");
    });
    it("retains a vouched whole stem before decomposing its plural-shaped verb", () => {
      expect(engine.predict("represents")).toBe("ˌɹɛpɹɪˈzɛnts");
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("She represents the company.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "represents")?.phoneme).toBe("ˌɹɛpɹɪˈzɛnts");
      expect(tokens.filter(token => token.word !== "represents").map(token => token.word)).toEqual(["She", "the", "company", "."]);
    });
    it.each(["Bacteria reproduce.", "These active organisms reproduce.", "Cells reproduce rapidly.", "Bacteria reproduce in water."])("uses verb-root evidence in an intransitive clause: %s", text => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize(text, { language: "en-US", returnArray: true });
      expect(withoutSecondary(tokens.find(token => token.word === "reproduce")?.phoneme ?? null)).toBe("ɹipɹəˈdus");
      const words = text.replace(/\.$/, "").split(" "), index = words.indexOf("reproduce");
      expect(engine.tagWord("reproduce", { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos).toBe("V");
      if (words.includes("active")) expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
    });

  });

  test("preserves both readings of the unprefixed root in prose", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize("The produce is fresh. They produce fresh food.", { language: "en-US", returnArray: true });
    expect(tokens.filter(token => token.word === "produce").map(token => token.phoneme)).toEqual(["ˈpɹoʊdus", "pɹəˈdus"]);
  });

  test("does not replace a caller's complete target pronunciation", () => {
    const engine = new EnglishG2P({ disableDict: true });
    engine.addPronunciation("reproduce", "ˈzɛŋ");
    expect(engine.predict("reproduce")).toBe("ˈzɛŋ");
  });

  test("preserves noun/verb stress in an unrelated ense root", () => {
    const engine = new EnglishG2P();
    expect(withoutSecondary(engine.predict("incense", "en-US", "N"))).toBe("ˈɪnsɛns");
    expect(withoutSecondary(engine.predict("incense", "en-US", "V"))).toBe("ɪnˈsɛns");
  });

  test("recognizes an ally adverb before an independently vouched verb", () => {
    const engine = new EnglishG2P(), words = ["They", "really", "reproduce"];
    expect(engine.tagWord("really", { prev: "They", next: "reproduce", sentence: { words, index: 1 } }).pos).toBe("ADV");
  });

  test.each(["Profitable reexport is legal", "Profitable reexport continues", "Legal reexport continues"])("retains a nominal re- subject: %s", text => {
    const engine = new EnglishG2P(), words = text.split(" ");
    expect(engine.tagWord("reexport", { prev: words[0], next: words[2], sentence: { words, index: 1 } }).pos).toBe("N");
  });

})();

// Original suite: en-recommend-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  const RECOMMEND = "ˌɹɛkəˈmɛnd";

  describe.each([false, true])("Cambridge-sourced recommend root (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    test("uses the standard verb reading while preserving its inflections", () => {
      expect(engine.predict("recommend", "en", "V")).toBe(RECOMMEND);
      expect(engine.predict("recommends", "en", "V")).toBe("ˌɹɛkəˈmɛndz");
      expect(engine.predict("recommended", "en", "V")).toBe("ˌɹɛkəˈmɛndɪd");
      expect(engine.predict("recommending", "en", "V")).toBe("ˌɹɛkəˈmɛndɪŋ");
    });

    test("does not rewrite the related commend or recommendation roots", () => {
      expect(engine.predict("commend", "en", "V")).toBe("kəˈmɛnd");
      expect(engine.predict("commendation", "en", "N")).toBe("ˌkɑmənˈdeɪʃən");
    });
  });

  test("keeps verb POS and the complement's subjunctive reading in context", () => {
    const engine = new EnglishG2P();

    const tokens = englishTokens(engine, "I recommend that he read the book.");
    expect(tokens.find(token => token.word === "recommend")?.phoneme).toBe(RECOMMEND);
    expect(tokens.find(token => token.word === "read")?.phoneme).toBe("ɹid");
  });

})();

// Original suite: en-recover-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("recover root and inflections", () => {
    it.each([false, true])("keeps the reduced re- vowel across the family (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("recover", "en-US", "VB")).toBe("ɹɪˈkʌvɝ");
      expect(engine.predict("recovers", "en-US", "VBZ")).toBe("ɹɪˈkʌvɝz");
      expect(engine.predict("recovered", "en-US", "VBD")).toBe(disableDict ? "ɹɪˈkʌvɝd" : "ɹəˈkʌvɝd");
      expect(engine.predict("recovery", "en-US", "NN")).toBe("ɹɪˈkʌvɝi");
      expect(engine.predict("recovery's", "en-US")).toBe("ɹɪˈkʌvɝiz");
      expect(engine.predict("cover", "en-US", "VB")).toBe("ˈkʌvɝ");
      expect(engine.predict("discover", "en-US", "VB")).toBe(disableDict ? "dɪsˈkʌvɝ" : "dɪˈskʌvɝ");
      expect(engine.predict("discovery", "en-US", "NN")).toBe(disableDict ? "dɪsˈkʌvɝi" : "ˌdɪsˈkʌvɹi");
      expect((engine.predict("recovery", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("ɹɪkʌvɝi");
      expect(engine.predict("misery", "en-US", "NN")).toBe(disableDict ? "ˈmɪsɝi" : "ˈmɪzɝi");


      const tokens = englishTokens(engine, "She hopes to recover, and her discovery and recovery have been steady.");
      expect(tokens.find(token => token.word.toLowerCase() === "recover")?.phoneme).toBe("ɹɪˈkʌvɝ");
      expect(tokens.find(token => token.word.toLowerCase() === "recovery")?.phoneme).toBe("ɹɪˈkʌvɝi");
      expect(tokens.find(token => token.word.toLowerCase() === "discovery")?.phoneme).toBe(disableDict ? "dɪsˈkʌvɝi" : "ˌdɪsˈkʌvɹi");
    });
  });

})();

// Original suite: en-reflexive-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;
  const __suiteModule3: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule3;

  describe.each([false, true])("closed-class self stress (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["himself", "hɪmˈsɛɫf"], ["herself", "hɝˈsɛɫf"],
      ["itself", "ˌɪtˈsɛɫf"], ["myself", "ˌmaɪˈsɛɫf"],
      ["oneself", "ˌwʌnˈsɛɫf"], ["theirselves", "ˌðɛɹˈsɛɫvz"],
    ])("preserves phonemes and contrastive primary in %s", (word, ipa) => {
      expect(parseIpa(engine.predict(word)!)).toEqual(parseIpa(ipa));
    });
    it.each([
      ["ourselves", "aʊɝˈsɛɫvz"], ["yourselves", "ˈjɔɹsɛɫvz"],
      ["themselves", "ðəmˈsɛɫvz"], ["self", "ˈsɛɫf"],
      ["selfless", "ˈsɛɫfɫəs"], ["selfhood", "ˈsɛɫfˌhʊd"],
    ])("keeps the existing path for %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves a supplied whole-word pronunciation", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("himself", "Z EH1 D");
      expect(custom.predict("himself")).toBe("ˈzɛd");
    });
    it("retains noun, adjective and finite-verb sentence controls", () => {

      const tokens = englishTokens(engine, "The clever reader will work by himself.");
      expect(tokens.find(t => t.word === "himself")?.phoneme).toBe("hɪmˈsɛɫf");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

  it("distinguishes a function-word OOV frame from an open-class compound head", () => {
    expect(assignStress(syllabify("meself"), "meself")).toBe(1);
    expect(assignStress(syllabify("bookself"), "bookself")).toBe(0);
    expect(assignStress(syllabify("iself"), "iself")).toBe(0);
    expect(assignStress(syllabify("aself"), "aself")).toBe(0);
  });

})();

// Original suite: en-register-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule1;

  const rules = new EnglishG2P({ disableDict: true });

  describe("lexical regist- roots keep primary stress off the re- prefix path", () => {
    it.each(["register", "registrar", "registry"])("stresses the root in %s", word => {
      expect(assignStress(syllabify(word), word)).toBe(0);
      expect(rules.predict(word)).toMatch(/^ˈɹɛdʒ/);
    });

    it("leaves the longer registration suffix route intact", () => {
      expect(rules.predict("registration")).toBe("ˌɹɛdʒɪˈstɹeɪʃən");
      expect(rules.predict("registrant")).toBe("ˈɹɛdʒɪstɹənt");
    });

    it("keeps productive re- stress and the separate region root", () => {
      expect(rules.predict("rebuild")).toBe("ɹiˈbɪɫd");
      expect(rules.predict("region")).toBe("ˈɹidʒən");
    });
  });

})();

// Original suite: en-relative-noun-cardinal-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;
  test("keeps a determined nominal head before a finite relative clause", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   for (const sentence of ["It was a school record that lasted until 1974.", "They broke a school record which was famous."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "record")?.phoneme).toMatch(/^ˈɹɛ/);
   for (const sentence of ["They saw a man record that speech.", "They saw a man record that gifted presenter."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "record")?.phoneme).toMatch(/ˈkɔɹd/);
   const tagger = new SimplePOSTagger();
   const words = ["a", "school", "record", "that", "lasted", "until", "1974", "."];
   expect(tagger.tagWord("record", ["school", "that"], { words, index: 2 }).pos).toBe("N");
  });
  test("uses a determined plural subject before a cardinal object with tense controls", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   for (const sentence of ["The labels read 1879.", "These labels read three lines.", "Although its labels read 1879, the distillery was founded in 1826."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹid");
   for (const sentence of ["The workers read three reports yesterday.", "They read three reports yesterday.", "During his first audition, James read four scenes."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
  });

})();

// Original suite: en-relative-prefixes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Oxford/MW infrastructure retain head stress; Cambridge infrared retains root stress.
  describe.each([false, true])("relative prefixes and owned roots, rules=%s", disableDict => {
    it("preserves noun stress and neutral derivation after eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["infrastructure", "infrastructural"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      expect(engine.predict("infrastructure")).toBe("ˈɪnfɹəˌstɹʌktʃɝ");
      expect(engine.predict("infrastructural")).toBe("ˈɪnfɹəˌstɹʌktʃɝəɫ");
      expect(engine.predict("structure")).toBe("ˈstɹʌktʃɝ");
      expect(engine.predict("structural")).toBe("ˈstɹʌktʃɝəɫ");
    });
    it("preserves root-headed adjectives and existing vowel conventions", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("infrared")).toBe(disableDict ? "ˌɪnfɹəˈɹɛd" : "ˌɪnfɹɝˈɛd");
      expect(engine.predict("supranational")).toBe("ˌsupɹəˈnæʃənəɫ");
      expect(engine.predict("supranatural")).toBe("ˌsupɹəˈnætʃɝəɫ");
      expect(engine.predict("natural")).toBe("ˈnætʃɝəɫ");
    });
    it("keeps caller prefix/root and child ownership", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["infrared"]);
      engine.addPronunciation("infra", "ˈzɛŋ");
      engine.addPronunciation("red", "ˈkɛŋ");
      expect(engine.predict("infrared")).toBe("ˌzɛŋˈkɛŋ");
      engine.addPronunciation("infrared", "ˈbɛŋ");
      expect(engine.predict("infrared")).toBe("ˈbɛŋ");
    });
    it("preserves a full adjective, agent noun and finite verb sentence", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const out = api.phonemize("The supranational reader read the notes yesterday.", {language: "en-US", returnArray: true});
      expect(out.find(token => token.word === "supranational")?.phoneme).toBe("ˌsupɹəˈnæʃənəɫ");
      expect(out.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(out.find(token => token.word === "read")?.phoneme).toBe("ɹɛd");
    });
  });

})();

// Original suite: en-repeated-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("repeated productive re- prefixes (rules=%s)", disableDict => {
    it.each(["N", "V"])("preserves the inner release stress for %s", pos => {
      const e = new EnglishG2P({ disableDict });
      expect(e.predict("rerelease", "en-US", pos)).toBe("ˌɹiɹɪˈɫis");
      expect(e.predict("rereleases")).toBe("ˌɹiɹɪˈɫisəz");
      expect(e.predict("rereleased")).toBe("ˌɹiɹɪˈɫist");
      expect(e.predict("rereleasing")).toBe("ˌɹiɹɪˈɫisɪŋ");
      expect(e.predict("rererelease")).toBe("ˌɹiˌɹiɹɪˈɫis");
    });
    it("keeps neighboring non-silent-e and single-nucleus roots", () => {
      const e = new EnglishG2P({ disableDict });
      expect(e.predict("reregister")).toBe("ɹiˈɹɛdʒɪstɝ");
      expect(e.predict("reregistration")).toBe("ɹiˌɹɛdʒɪˈstɹeɪʃən");
      expect(e.predict("reredos")).toBe("ɹiˈɹɛdoʊz");
      expect(e.predict("release")).toBe("ɹiˈɫis");
      expect(e.predict("reregulate")).toBe("ɹiˈɹɛɡjəˌɫeɪt");
      expect(e.predict("reregulation")).toBe("ɹiˌɹɛɡjəˈɫeɪʃən");
    });
    it("composes custom roots without rewriting their vowel or overriding explicit children", () => {
      const e = new EnglishG2P({ disableDict });
      e.addPronunciation("release", "ɹiˈzɛŋ");
      expect(e.predict("rerelease")).toBe("ˌɹiɹiˈzɛŋ");
      e.addPronunciation("rerelease", "ˈkɛŋ");
      expect(e.predict("rerelease")).toBe("ˈkɛŋ");
    });
    it("keeps sentence boundaries and handles long repeated prefixes without recursion", () => {
      const e = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [e] });
      for (const text of ["They rerelease the film.", "The rerelease was successful."])
        expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === "rerelease")?.phoneme).toBe("ˌɹiɹɪˈɫis");
      expect(e.predict("re".repeat(1000) + "release")).toBe("ˌɹi".repeat(1000) + "ɹɪˈɫis");
    });
  });

})();

// Original suite: en-repinned-stem-regression.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("rebuilt stem dependency (rules=%s)", (disableDict) => {
    it("keeps the independently sourced silent-e stem in its derived reading", () => {
      expect(new EnglishG2P({ disableDict }).predict("robling")).toBe("ˈɹoʊbəɫɪŋ");
    });
    it("preserves the name and the neighboring verb in a complete sentence", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const tokens = api.phonemize("Robling was reading the report.", { language: "en-US", returnArray: true });
      expect(tokens.find((token) => token.word === "Robling")?.phoneme).toBe("ˈɹoʊbəɫɪŋ");
      expect(tokens.find((token) => token.word === "reading")?.phoneme).toBe("ˈɹidɪŋ");
    });
  });

})();

// Original suite: en-replace-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("compositional replace root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["replace", "ɹɪˈpɫeɪs"],
      ["replaced", "ɹɪˈpɫeɪst"],
      ["replacement", "ɹɪˈpɫeɪsmənt"],
      ["replacing", "ɹɪˈpɫeɪsɪŋ"],
      ["replaceable", "ɹɪˈpɫeɪsəbəɫ"],
    ])("composes the attested root reading in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the unrelated re- root reading in replay forms", () => {
      expect(rules.predict("replay", "en-US")).toBe("ɹiˈpɫeɪ");
      expect(rules.predict("replayed", "en-US")).toBe("ɹiˈpɫeɪd");
    });

    it("does not duplicate stress when the root combines with privative ir-", () => {
      expect(rules.predict("irreplaceable", "en-US")).toBe("ˌɪɹəˈpɫeɪsəbəɫ");
    });

    it("retains the verb and noun readings in sentence context", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
      const result = phonemizer.phonemize("They replaced the part with a replacement.", {
        language: "en-US", returnArray: true,
      });
      expect(result.find(token => token.word.toLowerCase() === "replaced")?.phoneme)
        .toBe("ɹɪˈpɫeɪst");
      expect(result.find(token => token.word.toLowerCase() === "replacement")?.phoneme)
        .toBe("ɹɪˈpɫeɪsmənt");
    });
  });

})();
