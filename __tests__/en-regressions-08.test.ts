// Original suite: en-else-deictic-compound.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("else + deictic adverb compounds", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["elsewhere", "ˈɛɫsˌwɛɹ"],
      ["elsewhen", "ˈɛɫsˌwɛn"],
    ])("keeps the deictic tail in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["else", "ˈɛɫs"],
      ["where", "ˈhwɛɹ"],
      ["when", "ˈhwɛn"],
      ["elsewise", "ˈɛɫsˌwaɪz"],
      ["somewhere", "ˈsʌmˌwɛɹ"],
    ])("preserves the neighboring %s frame", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-enquiry-morpheme.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([true, false])("enquiry family rime (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    it.each([
      ["enquiry", ["ɪnˈkwaɪɹi"]],
      ["inquiry", ["ɪnˈkwaɪɹi"]],
      ["enquire", ["ɪnˈkwaɪɹ", "ɪnˈkwaɪɝ"]],
      ["inquire", ["ɪnˈkwaɪɹ", "ɪnˈkwaɪɝ"]],
    ])("reads the shared en/in + quire family: %s", (word, readings) => {
      // Merriam-Webster gives optional schwa before /r/ in acquire/inquire.
      if (disableDict) expect(readings).toContain(g2p.predict(word));
    });

    it.each([
      ["acquire", ["əˈkwaɪɹ", "əˈkwaɪɝ"], "əˈkwaɪɝ"],
      ["require", ["ɹiˈkwaɪɹ", "ɹiˈkwaɪɝ"], ["ˌɹiˈkwaɪɝ", "ɹiˈkwaɪɝ"]],
      ["quiet", "ˈkwaɪət", "ˈkwaɪət"],
    ])("preserves neighboring forms: %s", (word, rulesReadings, dictionaryReadings) => {
      const readings = disableDict ? rulesReadings : dictionaryReadings;
      expect(readings).toContain(g2p.predict(word));
    });
  });

})();

// Original suite: en-even-pronunciation.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("standard even pronunciation", () => {
    it("uses the independently attested schwa reading in rules and the shipped dictionary", () => {
      expect(new EnglishG2P({ disableDict: true }).predict("even", "en-US")).toBe("ˈivən");
      expect(new EnglishG2P().predict("even", "en-US")).toBe("ˈivən");
    });

    it.each([
      ["evened", "ˈivənd"],
      ["evens", "ˈivənz"],
    ])("keeps the regular inflection of %s aligned across both routes", (word, ipa) => {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
      expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-every-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("the free every root keeps its spoken /r/", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("uses the source-checked root reading on the default API", () => {
      expect(new EnglishG2P().predict("every")).toBe("ˈɛvɹi");
    });

    it("keeps the root reading in full sentence context", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P()] });
      const tokens = api.phonemize(
        "Every day, everyone reads everything everywhere.",
        { language: "en-US", returnArray: true },
      );
      for (const [word, ipa] of [
        ["Every", "ˈɛvɹi"],
        ["everyone", "ˈɛvɹiˌwʌn"],
        ["everything", "ˈɛvɹiˌθɪŋ"],
        ["everywhere", "ˈɛvɹiˌwɛɹ"],
      ])
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(ipa);
    });

    it.each([
      ["every", "ˈɛvɹi"],
      ["everyone", "ˈɛvɹiˌwʌn"],
      ["everybody", "ˈɛvɹiˌbɑdi"],
      ["everything", "ˈɛvɹiˌθɪŋ"],
      ["everywhere", "ˈɛvɹiˌwɛɹ"],
      ["everyplace", "ˈɛvɹiˌpɫeɪs"],
      ["everyday", "ˈɛvɹiˌdeɪ"],
      ["everywhere's", "ˈɛvɹiˌwɛɹz"],
    ])("renders %s from the rule path", (word, ipa) => {
      expect(rules.predict(word)).toBe(ipa);
    });

    it.each([
      ["very", "ˈvɛɹi"],
      ["verywell", "ˈvɛɹiˌwɛɫ"],
      ["several", "ˈsɛvɝəɫ"],
      ["cleverly", "ˈkɫɛvɝɫi"],
      ["delivery", "dɪˈɫɪvɝi"],
      ["reverie", "ɹiˈvɪɹi"],
      ["everydayness", "ˌɛvɹiˈdeɪnəs"],
    ])("preserves neighboring reading %s", (word, ipa) => {
      expect(rules.predict(word)).toBe(ipa);
    });
  });

})();

// Original suite: en-exh-front-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("exh front-vowel boundary, rules=%s", disableDict => {
    it("drops h after a full ex prefix before weak i without voicing ks", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("exhibition")).toMatch(/^ˌɛks[əɪ]ˈbɪʃən$/);
      expect(engine.predict("exhalation")).toBe("ˌɛkshəˈɫeɪʃən");
      expect(engine.predict("exhibit")).toBe("ɪɡˈzɪbɪt");
      expect(engine.predict("exhaust")).toBe("ɪɡˈzɔst");
      if (!disableDict) {
        expect(engine.predict("exhale")).toBe("ɛksˈheɪɫ");
        expect(engine.predict("exhume")).toBe("ɛksˈhjum");
      }
    });
    it("retains noun and verb sentence controls", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      expect(api.phonemize("The exhibition is here.", { language: "en-US", returnArray: true }).find(t => t.word === "exhibition")?.phoneme).toMatch(/^ˌɛks[əɪ]ˈbɪʃən$/);
      expect(api.phonemize("They exhibit the art.", { language: "en-US", returnArray: true }).find(t => t.word === "exhibit")?.phoneme).toBe("ɪɡˈzɪbɪt");
    });
  });

})();

// Original suite: en-final-all-plural-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("regular -s preserves the doubled-l -all rime", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["calls", "ˈkɔɫz"],
      ["balls", "ˈbɔɫz"],
      ["falls", "ˈfɔɫz"],
      ["walls", "ˈwɔɫz"],
      ["halls", "ˈhɔɫz"],
      ["malls", "ˈmɔɫz"],
      ["smalls", "ˈsmɔɫz"],
      ["stalls", "ˈstɔɫz"],
    ])("predicts %s from its -all stem", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the singular and non-doubled-l controls on their existing routes", () => {
      expect(rules.predict("call", "en-US")).toBe("ˈkɔɫ");
      expect(rules.predict("called", "en-US")).toBe("ˈkɔɫd");
      expect(rules.predict("calling", "en-US")).toBe("ˈkɔɫɪŋ");
      expect(rules.predict("pal", "en-US")).toBe("ˈpæɫ");
      expect(rules.predict("pals", "en-US")).toBe("ˈpɔɫz");
      expect(rules.predict("shall", "en-US")).toBe("ˈʃæɫ");
      expect(rules.predict("install", "en-US")).toBe("ˌɪnˈstɔɫ");
      expect(rules.predict("installment", "en-US")).toBe("ˌɪnˈstɔɫmənt");
    });

    it("keeps plural rimes intact in sentence tokenization", () => {

      const tokens = englishTokens(rules, "Calls came from the halls and walls.");
      expect(tokens.find(token => token.word === "Calls")?.phoneme).toBe("kɔɫz");
      expect(tokens.find(token => token.word === "halls")?.phoneme).toBe("hɔɫz");
      expect(tokens.find(token => token.word === "walls")?.phoneme).toBe("wɔɫz");
    });
  });

})();

// Original suite: en-final-cket-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("-cket quantity compounds", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps the full noun suffix in the -cketful quantity class", () => {
      expect(rules.predict("pocketful", "en-US")).toBe("ˈpɑkɪtˌfʊɫ");
      expect(rules.predict("pocketfuls", "en-US")).toBe("ˈpɑkɪtˌfʊɫz");
    });

    it("leaves adjective -ful compounds weak", () => {
      expect(rules.predict("hopeful", "en-US")).toBe("ˈhoʊpfəɫ");
      expect(rules.predict("harmful", "en-US")).toBe("ˈhɑɹmfəɫ");
      expect(rules.predict("create-a-book", "en-US")).toBe("kɹieɪˈtɛəbʊk");
    });
  });

})();

// Original suite: en-final-eye.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("final eye and its neighboring spellings (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word.toLowerCase() === word)?.phoneme;

    test("keeps the same vowel as a noun and a verb in full sentences", () => {
      expect(phone("The eye is open.", "eye")).toBe("aɪ");
      expect(phone("They eye the prize.", "eye")).toBe("aɪ");
      expect(phone("The eyes are open.", "eyes")).toBe("aɪz");
    });

    test("preserves the compound tail and nearby non-silent-e words", () => {
      expect(engine.predict("buckeye", "en-US")).toMatch(/kaɪ$/);
      expect(engine.predict("goldeneye", "en-US")).toMatch(/naɪ$/);
      expect(engine.predict("hey", "en-US")).toBe("ˈheɪ");
      expect(engine.predict("grey", "en-US")).toBe("ˈɡɹeɪ");
      expect(engine.predict("dye", "en-US")).toBe("ˈdaɪ");
      expect(engine.predict("beyer", "en-US")).toBe("ˈbeɪɝ");
    });
  });

})();

// Original suite: en-final-mat.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("checked final -mat rime", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["format", "ˈfɔɹmæt"],
      ["formats", "ˈfɔɹmæts"],
      ["formatted", "ˈfɔɹmætɪd"],
      ["formatting", "ˈfɔɹmætɪŋ"],
      ["reformat", "ɹiˈfɔɹmæt"],
      ["reformats", "ɹiˈfɔɹmæts"],
      ["reformatted", "ɹiˈfɔɹmætɪd"],
    ])("retains the checked vowel through %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it.each([
      ["mat", "ˈmæt"],
      ["diplomat", "ˈdɪpɫəmæt"],
      ["diplomatic", "ˌdɪpɫəˈmætɪk"],
      ["laundromat", "ˈɫɔndɹəmæt"],
      ["combat", "ˈkɑmbæt"],
      ["kabat", "ˈkæbət"],
      ["wombat", "ˈwɑmbət"],
    ])("preserves the neighboring rime control %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it.each([
      ["astigmatism", "əˈstɪɡməˌtɪzəm"],
      ["astigmatist", "əˈstɪɡmətɪst"],
      ["dramatization", "ˌdɹæmətəˈzeɪʃən"],
      ["dramatize", "ˈdɹæməˌtaɪz"],
      ["traumatize", "ˈtɹɔməˌtaɪz"],
      ["pragmatism", "ˈpɹæɡməˌtɪzəm"],
    ])("leaves bound -mat roots unchanged in %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it("keeps noun and verb uses stable in full sentence context", () => {

      const tokens = englishTokens(rules, "They format the report, then save the format.");
      expect(tokens.filter(token => token.word === "format").map(token => token.phoneme)).toEqual([
        "ˈfɔɹmæt",
        "ˈfɔɹmæt",
      ]);
    });
  });

})();

// Original suite: en-final-scle.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Cambridge muscle/corpuscle: final -scle is /səl/; muscular retains /skj/.
  describe.each([false, true])("final scle and sounded scul, rules=%s", disableDict => {
    it("retains the complete silent-c root after eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["muscle"]);
      for (const [word, ipa] of [["muscle", "ˈmʌsəɫ"], ["muscles", "ˈmʌsəɫz"],
        ["muscled", "ˈmʌsəɫd"], ["muscling", "ˈmʌsəɫɪŋ"]]) expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves the OOV plural nucleus without claiming the stem stress is repaired", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("corpuscle")).toMatch(/səɫ$/);
      expect(engine.predict("corpuscles")).toMatch(/səɫz$/);
    });
    it("retains the velar in neighboring sounded environments", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("muscular")).toBe("ˈmʌskjəɫɝ");
      expect(engine.predict("musculature")).toBe("ˈmʌskjəɫətʃɝ");
      expect(engine.predict("sclerotic")).toMatch(/^sk/);
      expect(engine.predict("sickle")).toBe("ˈsɪkəɫ");
    });
    it("preserves duplicate noun/verb occurrences and adjective controls", () => {
      const api = createPhonemizer({processors: [new EnglishG2P({ disableDict })]});
      const out = api.phonemize("The muscular reader trains the muscle while they muscle the bar.", {language: "en-US", returnArray: true});
      expect(out.filter(token => token.word === "muscle").map(token => token.phoneme)).toEqual(["ˈmʌsəɫ", "ˈmʌsəɫ"]);
      expect(out.find(token => token.word === "muscular")?.phoneme).toBe("ˈmʌskjəɫɝ");
      expect(out.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    });
    it("retains explicit caller clusters and whole-child overrides", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("muscle", "ˈmʌskəɫ");
      expect(engine.predict("muscles")).toBe("ˈmʌskəɫz");
      engine.addPronunciation("muscles", "ˈzɛŋ");
      expect(engine.predict("muscles")).toBe("ˈzɛŋ");
    });
  });

})();

// Original suite: en-final-ves-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])(
    "keeps medial ves vocalic after root eviction (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict }),
        d = { ...Reflect.get(e, "dictionary") };
      for (const w of ["vessel", "vessels"]) delete d[w];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["vessel", "ˈvɛsəl"],
        ["vessels", "ˈvɛsəlz"],
        ["nonvessel", "nɑnˈvɛsəl"],
        ["loaves", "ˈloʊvz"],
        ["selves", "ˈsɛlvz"],
        ["wolves", "ˈwʊlvz"],
      ])
        expect(e.predict(word)?.replace(/ɫ/g, "l")).toBe(ipa);
      expect(e.predict("eavesdrop")).toBe(disableDict ? "iˈvzdɹʌp" : "ˈivzˌdɹɑp");
      expect(e.predict("ArchivesThe")).toBe("ˈɑɹkɪvzð");
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("The vessel carries several loaves.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "vessel")
          ?.phoneme.replace(/ɫ/g, "l"),
      ).toBe("ˈvɛsəl");
    },
  );
  test("preserves supplied roots and targets", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("vessel", "ˈzɛmp");
    expect(e.predict("vessels")).toBe("ˈzɛmps");
    e.addPronunciation("vessels", "ˈtɛst");
    expect(e.predict("vessels")).toBe("ˈtɛst");
  });

})();

// Original suite: en-financ-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the English financ- root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["finance", "ˈfaɪnæns"],
      ["financial", "faɪˈnænʃəɫ"],
    ])("uses the attested PRICE root in %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it.each([
      ["finances", "ˈfaɪˌnænsəz"],
      // Cambridge's AmE entry gives primary stress on /næn/ with no marked
      // secondary stress on /faɪ/: https://dictionary.cambridge.org/us/pronunciation/english/financially
      ["financially", "faɪˈnænʃəɫi"],
      ["financiera", "ˌfɪnənˈsiɹə"],
      ["financiero", "ˌfɪnənˈsiɹoʊ"],
      ["financo", "fɪˈnæŋkoʊ"],
    ])("preserves the neighboring reading of %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });
  });

})();

// Original suite: en-finite-asides-and-names.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("finite asides and nominal labels, rules=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    it("retains agreement through an aside and numbered objects", () => {
      for (const sentence of [
        "His design, patented in 1820 and 1835, uses easy-to-handle planks arranged diagonally.",
        "NSA uses two serial protocols for key fill.",
        "The Japan Meteorological Agency uses 10-minute sustained winds.",
        "Cooper uses Dean Guitars and EMG pickups.",
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toBe("ˈjuzəz");
    });
    it("preserves noun lists, possessives and a separate finite predicate", () => {
      for (const sentence of [
        "The industrial uses guide is here.",
        "Cooper's uses for the device are clear.",
        "The guide, records, uses and permits are listed.",
      ]) {
        const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
        expect(tokens.find(t => t.word === "uses")?.phoneme).toBe("ˈjusəz");
      }
    });
  });

  it("does not infer present tense merely from a following cardinal object", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const sentence of [
      "During his first audition, Daggs read four scenes from the pilot.",
      "He read four scenes yesterday.",
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
  });

})();

// Original suite: en-finite-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("finite morphology respects noun boundaries, disableDict=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word === word)?.phoneme;
    it.each([
      ["For concerts, this console may be moved.", "concerts", "ˈkɑnsɝts"],
      ["They work on projects that combine several methods.", "projects", "ˈpɹɑdʒɛkts"],
      ["There are unlimited lives, the player keeps going.", "lives", "ɫaɪvz"],
      ["The mountain winds, a common hazard, are strong.", "winds", "wɪndz"],
    ])("preserves the noun %s", (sentence, word, ipa) => {
      expect(phone(sentence, word)).toBe(ipa);
    });
    it("preserves distinct finite and noun readings of uses", () => {
      expect(phone("The pacemaker uses batteries.", "uses")).toBe("ˈjuzəz");
      expect(phone("There are also uses of batteries.", "uses")).toBe("ˈjusəz");
      expect(phone("She lives here.", "lives")).toBe("ɫɪvz");
      // Pinned CMU proceed/proceed(3) preserve both weak rhotic variants.
      expect(phone("As polymerization proceeds, the fibers form.", "proceeds")).toMatch(/^(?:pɹə|pɝ)ˈsidz$/);
    });
  });

})();

// Original suite: en-finite-locative-and-shared-subject.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("finite subject frames through locative and infinitive phrases (disableDict=%s)", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const processor = new EnglishG2P({ disableDict });
    const target = (sentence: string, word: string) => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
    const pos = (sentence: string, word: string) => {
      const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
      const index = words.findIndex(token => token.toLowerCase() === word.toLowerCase());
      return processor.tagWord(word, { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
    };

    it("selects third-person verb readings before bounded locative phrases", () => {
      for (const sentence of [
        "Norman lives at Greenwood children's home, south of London.",
        "This gastropod lives in most oceans.",
        "Currently, Bishop Zipfel lives at Little Sisters of the Poor.",
        "He currently lives in Studio City, California.",
      ]) expect(target(sentence, "lives")).toBe("ɫɪvz");
    });

    it("keeps plural lives as a noun before its own locative phrase", () => {
      expect(target("Their lives at sea were difficult.", "lives")).toBe("ɫaɪvz");
      expect(target("The lives in the story are very different.", "lives")).toBe("ɫaɪvz");
    });

    it("recognizes a plural subject across one PP before a to-infinitive", () => {
      expect(target("The puzzle elements in the first few levels combine to form more complex puzzles.", "combine"))
        .toBe("kəmˈbaɪn");
      expect(target("Then, too, the flowers refuse to be self-fertilized.", "refuse"))
        .toBe(disableDict ? "ɹiˈfjus" : "ɹɪˈfjuz");
      expect(target("The first few levels of the puzzle combine to form a challenge.", "combine"))
        .toBe("kəmˈbaɪn");
    });

    it("keeps a shared subject across a but-coordinated to-infinitive predicate", () => {
      expect(target("They manage to steal the diamond, but refuse to hand it over to JD.", "refuse"))
        .toBe(disableDict ? "ɹiˈfjus" : "ɹɪˈfjuz");
    });

    it("keeps noun refuse and combine readings outside finite predicate frames", () => {
      expect(pos("The refuse was collected.", "refuse")).not.toBe("V");
      expect(pos("The combine is stored beside the barn.", "combine")).not.toBe("V");
      if (!disableDict) {
        expect(target("The refuse was collected.", "refuse")).toMatch(/^ˈɹɛ/);
        expect(target("The combine is stored beside the barn.", "combine")).toBe("ˈkɑmbaɪn");
      }
    });
  });

})();

// Original suite: en-finite-modified-objects.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  describe.each([false, true])("bounded finite object frames, rules=%s", disableDict => {
    it("keeps full finite, noun and adjective sentence controls", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const cases = [
        ["This secondary array uses pumped-fluid cooling.", "uses", "ˈjuzəz"],
        ["The device uses recycled materials.", "uses", "ˈjuzəz"],
        ["Her film uses both interviews and archival material.", "uses", "ˈjuzəz"],
        ["Compared to other mass circulation papers in Israel, Haaretz uses smaller headlines and print.", "uses", "ˈjuzəz"],
        ["Their many uses remain clear.", "uses", "ˈjusəz"],
        ["Strong winds uprooted trees.", "winds", "wɪndz"],
        ["Strong winds also uprooted trees.", "winds", "wɪndz"],
        ["High winds also disrupted communications.", "winds", "wɪndz"],
        ["Sustained winds reached forty-eight knots.", "winds", "wɪndz"],
        ["The old records damaged the equipment.", "records", "ˈɹɛkɝdz"],
        ["The child records all were preserved.", "records", "ˈɹɛkɝdz"],
        ["The city permits were signed.", "permits", "ˈpɝmɪts"],
        ["The child records several songs.", "records", "ɹɪˈkɔɹdz"],
        ["The workshop permits restored cars.", "permits", "pɝˈmɪts"],
        ["There were stone axes that were found.", "axes", "ˈæksəz"],
        ...(disableDict ? [["The school records that were released are clear.", "records", "ˈɹɛkɝdz"]] : []),
        ...(!disableDict ? [
          ["The present record is clear.", "present", "ˈpɹɛzənt"],
          ["The present record is clear.", "record", "ˈɹɛkɝd"],
        ] : []),
      ];
      for (const [sentence, word, ipa] of cases)
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
    });

    it("recognizes base verbs after modified bare plural subjects with compound objects", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const sentence of [
        "Adequate safety stock levels permit business operations to proceed.",
        "Such stand-alone power systems permit operations at night.",
        "Most U.S. states with low population densities commonly permit bicycle use on interstate freeways.",
      ]) {
        const token = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "permit");
        expect(token?.phoneme).toBe(disableDict ? "ˈpɝmɪt" : "pɝˈmɪt");
      }
      for (const sentence of ["A permit was issued.", "They applied for a permit.", "The permit applications arrived."]) {
        const token = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "permit");
        expect(token?.phoneme).toBe("ˈpɝmɪt");
      }
    });

    it("recognizes a transitive phrasal verb before its particle object", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const sentence = "Firecats invite back coaches Mastrole, Hall, Naples Daily News, September 24, 2005.";
      const token = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "invite");
      expect(token?.phoneme).toBe(disableDict ? "ɪnˈvaɪt" : "ˌɪnˈvaɪt");

      const noun = api.phonemize("The invite came by email.", { language: "en-US", returnArray: true })
        .find(t => t.word.toLowerCase() === "invite");
      expect(noun?.phoneme).toBe(disableDict ? "ɪnˈvaɪt" : "ˈɪnvaɪt");
    });
  });
  it("infers finite POS from the same determiner-backed syntax for unrelated verbs", () => {
    const tagger = new SimplePOSTagger();
    for (const target of ["uses", "records", "permits"]) {
      const words = ["The", "device", target, "recycled", "materials", "."];
      expect(tagger.tagWord(target, ["device", "recycled"], { words, index: 2 }).pos).toBe("V");
    }
  });

})();

// Original suite: en-finite-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const cases: Array<[string, string, string]> = [
    ["The method uses toxic gases.", "uses", "ˈjuzəz"],
    ["This version uses electric guitars.", "uses", "ˈjuzəz"],
    ["The alphabet uses only ordinary letters.", "uses", "ˈjuzəz"],
    ["Haaretz uses smaller headlines.", "uses", "ˈjuzəz"],
    ["The department records medical notes.", "records", "ɹɪˈkɔɹdz"],
    ["The department records clinical samples collected daily.", "records", "ɹɪˈkɔɹdz"],
    ["The municipal records local residents collected are archived.", "records", "ˈɹɛkɝdz"],
    ["We examined the city records local residents collected.", "records", "ˈɹɛkɝdz"],
    ["The city records local residents collected are archived.", "records", "ˈɹɛkɝdz"],
    ["The various uses require care.", "uses", "ˈjusəz"],
  ];
  it.each(cases)("preserves the full clause and its contrast: %s", (text, word, ipa) => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-finite-plural-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("finite plural objects, disableDict=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word === word)?.phoneme;
    it("recognizes a singular subject and direct plural object", () => {
      expect(phone("The pacemaker uses batteries.", "uses")).toBe("ˈjuzəz");
      expect(phone("Since a pacemaker uses batteries, the device works.", "uses")).toBe("ˈjuzəz");
    });
    it("preserves plural nouns and following predicates", () => {
      expect(phone("The uses of batteries are varied.", "uses")).toBe("ˈjusəz");
      expect(phone("The uses batteries have are varied.", "uses")).toBe("ˈjusəz");
      expect(phone("These uses were recorded.", "uses")).toBe("ˈjusəz");
    });
    it("preserves a neighboring agent and past-tense verb", () => {
      expect(phone("The reader read the notes yesterday.", "read")).toBe("ɹɛd");
    });
  });

})();

// Original suite: en-finite-use-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("finite monosyllabic use voicing, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phones = (word: string, pos: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "");
    it("preserves the noun/verb contrast without whole-target lexical lookup", () => {
      expect(phones("use", "V")).toBe("juz");
      expect(phones("use", "N")).toBe("jus");
    });
    it.each(["fuse", "muse", "truse"])("preserves the neighbouring monosyllable %s", word => {
      expect(phones(word, "V")).toMatch(/uz$/);
    });
    it("preserves regular verb inflections", () => {
      expect(phones("uses", "V")).toBe("juzəz");
      expect(phones("used", "VBN")).toBe("juzd");
      expect(phones("using", "V")).toBe("juzɪŋ");
    });
    it("preserves an explicit caller pronunciation", () => {
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("use", "ˈjus");
      expect(own.predict("use", "en-US", "V")).toBe("ˈjus");
    });
    it("preserves adjective and noun controls beside the finite verb", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The kind muse will use a fuse.", { language: "en-US", returnArray: true });
      expect(tokens.filter(t => ["kind", "muse", "use", "fuse"].includes(t.word)).map(t => t.phoneme))
        .toEqual(["kaɪnd", "mjuz", "juz", "fjuz"]);
      expect(api.phonemize("The use of a fuse is safe.", { language: "en-US", returnArray: true })
        .find(t => t.word === "use")?.phoneme).toBe("jus");
    });
  });
  it("preserves the existing rule-path terminal to-nominal phone", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    expect(api.phonemize("His skills were put to use.", { language: "en-US", returnArray: true })
      .find(t => t.word === "use")?.phoneme).toBe("jus");
  });

  describe.each([false, true])("caller-owned recursive roots, disableDict=%s", disableDict => {
    it("preserves the owned segment before phonological voicing", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("use", "ˈzɛŋ");
      expect(engine.predict("re-use", "en-US", "V")).toMatch(/ˈzɛŋ$/);
      engine.addPronunciation("use", "ˈjus");
      expect(engine.predict("re-use", "en-US", "V")).toMatch(/ˈjus$/);
      engine.addPronunciation("re-use", "ˈbɛŋ");
      expect(engine.predict("re-use", "en-US", "V")).toBe("ˈbɛŋ");
    });
    it("keeps finite re- verbs voiced", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      expect(api.phonemize("They can re-use the tools.", { language: "en-US", returnArray: true })
        .find(t => t.word === "use")?.phoneme).toBe("juz");
    });
  });
  it.each(["re-use", "re-re-use"])("retains the ambiguous to-nominal after %s boundaries", word => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    expect(api.phonemize(`His skills were put to ${word}.`, { language: "en-US", returnArray: true })
      .find(t => t.word === "use")?.phoneme).toBe("jus");
  });

  it.each([["\"", "\""], ["“", "”"]])("retains a quoted to-nominal between %s and %s", (open, close) => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    expect(api.phonemize(`His skills were put to ${open}use${close}.`, { language: "en-US", returnArray: true })
      .find(t => t.word === "use")?.phoneme).toBe("jus");
  });

})();

// Original suite: en-finite-verb-plurals.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("vouched verb stems in finite s forms, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word === word)?.phoneme;
    it("keeps finite verb and plural noun readings distinct", () => {
      expect(phone("He uses the tools.", "uses")).toBe("ˈjuzəz");
      expect(phone("She lives here.", "lives")).toBe("ɫɪvz");
      expect(phone("The lives of sailors are difficult.", "lives")).toBe("ɫaɪvz");
      expect(phone("The uses of tools are varied.", "uses")).toBe("ˈjusəz");
      expect(phone("He excuses the error.", "excuses")).toBe("ɪkˈskjuzəz");
      if (!disableDict) expect(phone("The excuses were recorded.", "excuses")).toBe("ɪkˈskjusəz");
    });
    it("preserves explicit POS and an unlabelled citation reading", () => {
      expect(engine.predict("uses", "en-US", "V")).toBe("ˈjuzəz");
      expect(engine.predict("uses", "en-US", "N")).toBe("ˈjusəz");
      expect(engine.predict("uses")).toBe("ˈjusəz");
    });
    it("preserves a caller-owned root on the composition route", () => {
      const own = new EnglishG2P({ disableDict: true });
      own.addPronunciation("use", "ˈzɛŋ");
      expect(own.predict("uses", "en-US", "V")).toBe("zɛŋz");
      own.addPronunciation("uses", "ˈkɛŋ");
      expect(own.predict("uses", "en-US", "V")).toBe("ˈkɛŋ");
    });
  });

})();
