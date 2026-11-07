// Original suite: en-ies-route-choice.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const { EnglishG2P } = __suiteModule0;

  describe("-ies morphology keeps a whole-word reading when both routes agree apart from one vowel", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("uses the standard /ɪ/ series reading from the direct rule route", () => {
      expect(rules.predict("series", "en")).toBe("ˈsɪɹiz");
    });

    it.each([
      ["queries", "ˈkwɪɹiz"],
      ["countries", "ˈkʌntɹiz"],
      ["batteries", "ˈbætɝiz"],
      ["ministries", "ˈmɪnəstɹiz"],
      ["cranberries", "ˈkɹænbɛɹiz"],
      ["festivities", "fɛˈstɪvətiz"],
    ])("keeps the existing morphology for %s", (word, ipa) => {
      expect(rules.predict(word, "en")).toBe(ipa);
    });
  });

})();

// Original suite: en-ietary-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("PRICE hiatus before -ary (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const access = engine as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["dietary", "proprietary"]) delete access.dictionary[word];

    it.each([
      ["dietary", "ˈdaɪəˌtɛɹi"], ["proprietary", "pɹəˈpɹaɪəˌtɛɹi"],
      ["dietaries", "ˈdaɪəˌtɛɹiz"], ["proprietaries", "pɹəˈpɹaɪəˌtɛɹiz"],
      ["dietarily", "ˈdaɪəˌtɛɹəɫi"], ["proprietarily", "pɹəˈpɹaɪəˌtɛɹəɫi"],
    ])("preserves both nuclei and root stress in %s after eviction", (word, ipa) => {
      delete access.dictionary[word];
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each(["nondietary", "antidietary", "nonproprietary", "antiproprietary"])(
      "retains the hiatus after a prefix in %s", word => {
        delete access.dictionary[word];
        expect(engine.predict(word)).toContain("ˈ");
        expect(engine.predict(word)).toContain("aɪəˌtɛɹi");
      },
    );
    it.each(["diet", "quiet", "client", "piety", "society", "propriety"])(
      "preserves the existing hiatus in %s", word => {
        expect(engine.predict(word)).toContain("aɪə");
      },
    );
    it.each(["niece", "field", "brief"])("preserves the FLEECE digraph in %s", word => {
      expect(engine.predict(word)).toContain("i");
      expect(engine.predict(word)).not.toContain("aɪə");
    });
    it("retains caller-owned complete roots", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("dietary", "ˈdɛtɝi");
      expect(custom.predict("dietary")).toBe("ˈdɛtɝi");
      expect(custom.predict("dietarily")).toBe("ˈdɛtɝəɫi");
    });
    it("preserves noun, adjective and finite verb readings in a complete sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will harvest dietary plants.");
      for (const [word, ipa] of [["dietary", "ˈdaɪəˌtɛɹi"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["harvest", "ˈhɑɹvəst"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-ify-attested-nominal.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("-ify from an independently attested nominal (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    test.each([
      ["notify", "ˈnoʊtəˌfaɪ"],
      ["falsify", "ˈfɔɫsəˌfaɪ"],
      ["modify", "ˈmɑdəˌfaɪ"],
      ["ratify", "ˈɹætəˌfaɪ"],
      ["pacify", "ˈpæsəˌfaɪ"],
    ])("keeps the stem vowel in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    test.each(["N", "ADJ", "V"])("retains a supplied %s reading", pos => {
      expect(engine.predict("notify", "en-US", pos)).toBe("ˈnoʊtəˌfaɪ");
    });

    test("keeps the vowel in full sentences and inflections", () => {
      const api = createPhonemizer({ processors: [engine] });
      for (const [sentence, word] of [
        ["They notify the committee.", "notify"],
        ["She notified the committee.", "notified"],
        ["They are notifying the committee.", "notifying"],
      ]) {
        const output = api.phonemize(sentence, { language: "en-US", returnArray: true });
        expect(output.find(token => token.word === word)?.phoneme).toMatch(/^ˈnoʊt/);
      }
    });
  });

})();

// Original suite: en-ify-nominal-derivations.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("ify nominal root ownership, rules=%s", disableDict => {
    it("recovers actual verb roots after nominal eviction", () => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of ["modification", "notification", "qualification", "clarification", "verification"]) delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const [word, ipa] of [
        ["modification", "ˌmɑdəfəˈkeɪʃən"], ["notification", "ˌnoʊtəfəˈkeɪʃən"],
        ["qualification", "ˌkwɑɫəfəˈkeɪʃən"], ["clarification", "ˌkɫɛɹəfəˈkeɪʃən"],
        ["verification", "ˌvɛɹəfəˈkeɪʃən"],
      ]) expect(engine.predict(word)).toBe(ipa);
      expect(["ˌkɑdəfəˈkeɪʃən", "ˌkoʊdəfəˈkeɪʃən"]).toContain(engine.predict("codification"));
    });
    it("keeps caller-owned root phones and full-word precedence", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["modification"]);
      engine.addPronunciation("modify", "ˈzɛŋəˌfaɪ");
      expect(engine.predict("modification")).toBe("ˌzɛŋəfəˈkeɪʃən");
      engine.addPronunciation("modification", "ˈkɛŋ");
      expect(engine.predict("modification")).toBe("ˈkɛŋ");
    });
    it("preserves noun, adjective and verb context", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ["The modification is clear.", "modification", "ˌmɑdəfəˈkeɪʃən"],
        ["They modify the design.", "modify", "ˈmɑdəˌfaɪ"],
        ["They qualify for the final.", "qualify", "ˈkwɑɫəˌfaɪ"],
        ["The qualified teacher is here.", "qualified", "ˈkwɑɫəˌfaɪd"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-igate-reduction.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const rules = new EnglishG2P({ disableDict: true });
  const inSentence = (word: string, sentence: string, pos: string) => {
    const words: string[] = sentence.toLowerCase().match(/[a-z']+/g) ?? [];
    return rules.predict(word, "en-US", pos, { words, index: words.indexOf(word) });
  };

  describe("weak i before final -gate", () => {
    it.each([
      ["castigate", "ˈkæstəˌɡeɪt"],
      ["fumigate", "ˈfjuməˌɡeɪt"],
      ["instigate", "ˈɪnstəˌɡeɪt"],
      ["irrigate", "ˈɪɹəˌɡeɪt"],
      ["litigate", "ˈɫɪtəˌɡeɪt"],
      ["mitigate", "ˈmɪtəˌɡeɪt"],
      ["navigate", "ˈnævəˌɡeɪt"],
      ["obligate", "ˈɑbɫəˌɡeɪt"],
    ])("reduces the weak <i> in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps stressed and complex-onset controls", () => {
      expect(rules.predict("digate", "en-US")).toBe("ˈdaɪɡeɪt");
      expect(rules.predict("profligate", "en-US", "A")).toBe("ˈpɹɑfɫɪɡət");
    });

    it.each([
      ["castigates", "ˈkæstəˌɡeɪts"],
      ["castigated", "ˈkæstəˌɡeɪtɪd"],
      ["castigating", "ˈkæstəˌɡeɪtɪŋ"],
      ["navigates", "ˈnævəˌɡeɪts"],
      ["navigated", "ˈnævəˌɡeɪtɪd"],
      ["navigating", "ˈnævəˌɡeɪtɪŋ"],
    ])("preserves regular verb morphology in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("preserves sentence-context verbs and noun/adjective controls", () => {
      expect(inSentence("navigate", "They navigate the channel", "V")).toBe("ˈnævəˌɡeɪt");
      expect(inSentence("profligate", "The profligate policy wasted money", "A")).toBe("ˈpɹɑfɫɪɡət");
    });

    it("uses the dictionary-supported lexical rime for frigate in prose", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P()] });
      const tokens = api.phonemize("The frigate crossed the bay.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "frigate")?.phoneme).toBe("ˈfɹɪɡət");
    });

  });

})();

// Original suite: en-ility-plurals.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("-ility plural stems", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["disabilities", "ˌdɪsəˈbɪɫətiz"],
      ["facilities", "fəˈsɪɫətiz"],
      ["liabilities", "ˌɫaɪəˈbɪɫətiz"],
      // Cambridge US gives schwa in the corresponding singular suffix too.
      ["vulnerabilities", "ˌvʌɫnɝəˈbɪɫətiz"],
    ])("preserves the weak vowel of the rule-derived stem in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["abilities", "əˈbɪɫətiz"],
      ["capabilities", "ˌkeɪpəˈbɪɫətiz"],
      ["instabilities", "ˌɪnstəˈbɪɫɪtiz"],
      ["sensibilities", "ˌsɛnsɪˈbɪɫɪtiz"],
    ])("preserves neighboring stem patterns for %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the corrected plural readings in sentence context", () => {
      const phonemizer = createPhonemizer({ processors: [rules] });
      const tokens = phonemizer.phonemize(
        "Facilities improved; disabilities and liabilities affect those facilities.",
        { language: "en-US", returnArray: true },
      );
      expect(tokens.filter(token => ["Facilities", "facilities"].includes(token.word)).map(token => token.phoneme))
        .toEqual(["fəˈsɪɫətiz", "fəˈsɪɫətiz"]);
      expect(tokens.find(token => token.word === "disabilities")?.phoneme).toBe("ˌdɪsəˈbɪɫətiz");
      expect(tokens.find(token => token.word === "liabilities")?.phoneme).toBe("ˌɫaɪəˈbɪɫətiz");
      expect(tokens.find(token => token.word === "improved")?.phoneme).toBe("ˌɪmˈpɹuvd");
    });
  });

})();

// Original suite: en-imperative-object.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  test("initial bare predicates govern closed modified plural objects", () => {
    const tagger = new SimplePOSTagger();
    for (const verb of ["Invite", "Record", "Reconstruct"]) {
      const words = [verb, "public", "officials", "."];
      expect(tagger.tagWord(verb, ["", "public"], { words, index: 0 }).pos).toBe("V");
    }
  });
  test("adjectival forms and unclosed noun fragments retain their previous route", () => {
    const tagger = new SimplePOSTagger();
    for (const word of ["Invalid", "Polish", "Learned"]) {
      const words = [word, "public", "officials", "."];
      expect(tagger.tagWord(word, ["", "public"], { words, index: 0 }).pos).not.toBe("V");
    }
    const words = ["Record", "public", "officials"];
    expect(tagger.tagWord("Record", ["", "public"], { words, index: 0 }).pos).not.toBe("V");
  });
  test("public API distinguishes imperative, nominal and past readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
    expect(pick("Invite public officials.", "invite")).toContain("ˈvaɪt");
    expect(pick("Record official responses.", "record")).toContain("ˈkɔɹd");
    expect(pick("Read public excerpts.", "read")).toBe("ɹid");
    expect(pick("The record was clear.", "record")).toMatch(/^ˈɹɛ/);
    expect(pick("He read public excerpts yesterday.", "read")).toBe("ɹɛd");
    expect(pick("He will read public excerpts.", "read")).toBe("ɹid");
  });

})();

// Original suite: en-imum-schwa.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("weak -imum vowel, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it("keeps the reduced vowel in the Latin superlative class", () => {
      for (const [word, ipa] of [
        ["maximum", "ˈmæksəməm"],
        ["optimum", "ˈɑptəməm"],
        ["minimum", "ˈmɪnəməm"],
        ["maximums", "ˈmæksəməmz"],
        ["optimums", "ˈɑptəməmz"],
      ]) expect(engine.predict(word, "en")).toBe(ipa);
      if (disableDict) expect(engine.predict("minimums", "en")).toBe("ˈmɪnəməmz");
    });

    it("leaves related vowel sequences outside -imum intact", () => {
      expect(engine.predict("premium", "en")).toBe("ˈpɹimiəm");
    });
  });

  it("keeps the weak -imum vowel in full sentences", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    for (const [sentence, word, ipa] of [
      ["The maximum value is unknown.", "maximum", "ˈmæksəməm"],
      ["Use the optimum setting.", "optimum", "ˈɑptəməm"],
      ["Set the minimum limit.", "minimum", "ˈmɪnəməm"],
    ]) {
      const tokens = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
    }
  });

})();

// Original suite: en-in-short-able.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("in- before short silent-e -able roots (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["incapable", "ˌɪnˈkeɪpəbəɫ"], ["incurable", "ˌɪnˈkjʊɹəbəɫ"],
      ["inhalable", "ˌɪnˈheɪɫəbəɫ"], ["incapably", "ˌɪnˈkeɪpəbɫi"],
      ["incurably", "ˌɪnˈkjʊɹəbɫi"],
      ["capable", "ˈkeɪpəbəɫ"], ["curable", "ˈkjʊɹəbəɫ"],
      ["inextricable", "ɪˈnɛkstɹɪkəbəɫ"], ["inapplicable", disableDict ? "ˌɪnəˈpɫɪkəbəɫ" : "ˌɪˈnæpɫɪkəbəɫ"],
    ])("keeps the root or unaffected boundary in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves the unrelated irritable frame", () => {
      expect(engine.predict("irritable")).toBe(disableDict ? "ˈɪɹɪtəbəɫ" : "ˈɪɹətəbəɫ");
    });
    it("retains complete roots after exception eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["capable", "curable", "incapable", "incurable"]) delete access.dictionary[word];
      expect(evicted.predict("incapable")).toBe("ˌɪnˈkeɪpəbəɫ");
      expect(evicted.predict("incurable")).toBe("ˌɪnˈkjʊɹəbəɫ");
    });
    it("preserves a caller-owned root during composition", () => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      delete access.dictionary.incapable;
      custom.addPronunciation("capable", "ˈkæpəbəɫ");
      expect(custom.predict("incapable")).toBe("ˌɪnˈkæpəbəɫ");
    });
    it("preserves adjective, noun and verb readings in full sentences", () => {

      const tokens = englishTokens(engine, "The incapable reader will work on an incurable problem.");
      expect(tokens.find(t => t.word === "incapable")?.phoneme).toBe("ˌɪnˈkeɪpəbəɫ");
      expect(tokens.find(t => t.word === "incurable")?.phoneme).toBe("ˌɪnˈkjʊɹəbəɫ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();

// Original suite: en-inchoative-sce.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false,true])("inchoative -sce and nominal tails, disableDict=%s",disableDict=>{
    const cold=()=>{const e=new EnglishG2P({disableDict}),dictionary={...Reflect.get(e,"dictionary")};for(const w of Object.keys(dictionary))if(/^convalesc/.test(w)||w==="pesce")delete dictionary[w];Reflect.set(e,"dictionary",dictionary);return e;};
    it("renders a cold verb with root stress and a soft final c",()=>{
      const e=cold();for(const w of ["convalesce","CONVALESCE"])expect(e.predict(w)).toBe("ˌkɑnvəˈɫɛs");
    });
    it("keeps short and OOV uppercase roots on the word route",()=>{
      const e=cold();expect(e.predict("PESCE")).toBe("ˈpɛs");expect(e.predict("EVANESCE")).toBe("ˌɛvəˈnɛs");
    });
    it("preserves cold inflections, nouns and adjectives",()=>{
      const e=cold();expect(e.predict("convalesces")).toBe("ˌkɑnvəˈɫɛsəz");expect(e.predict("convalesced")).toBe("ˌkɑnvəˈɫɛst");expect(e.predict("convalescing")).toBe("ˌkɑnvəˈɫɛsɪŋ");expect(e.predict("convalescent")).toBe("ˌkɑnvəˈɫɛsənt");expect(e.predict("convalescence")).toBe("ˌkɑnvəˈɫɛsəns");
    });
    it("extends the phonological tail without a runtime lexicon",()=>{
      const e=cold();expect(e.predict("effervesce")).toBe("ˌɛfɝˈvɛs");expect(e.predict("evanesce")).toBe("ˌɛvəˈnɛs");expect(e.predict("homovalesce")).toMatch(/ˈɫɛs$/);expect(e.predict("preconvalesce")).toMatch(/ˈɫɛs$/);expect(e.predict("reminisce")).toMatch(/ˈnɪs$/);expect(e.predict("reminiscent")).toMatch(/ˈnɪsənt$/);
    });
    it("retains neighboring roots and caller ownership",()=>{
      const e=cold();expect(e.predict("scene")).toBe("ˈsin");expect(e.predict("descent")).toBe("dɪˈsɛnt");expect(e.predict("crescent")).toBe("ˈkɹɛsənt");expect(e.predict("quiet")).toBe("ˈkwaɪət");
      e.addPronunciation("convalesce","ˈtɛst");expect(e.predict("convalesce")).toBe("ˈtɛst");expect(e.predict("convalesces")).toBe("ˈtɛsts");expect(e.predict("convalesced")).toBe("ˈtɛstɪd");
    });
    it("preserves full-sentence noun, adjective, verb and tense controls",()=>{
      const api=createPhonemizer({processors:[cold()]});const pick=(s:string,w:string)=>api.phonemize(s,{language:"en-US",returnArray:true}).find(t=>t.word===w)?.phoneme;
      expect(pick("They convalesce at home.","convalesce")).toBe("ˌkɑnvəˈɫɛs");expect(pick("The convalescent patient rested.","convalescent")).toBe("ˌkɑnvəˈɫɛsənt");expect(pick("The convalescence was slow.","convalescence")).toBe("ˌkɑnvəˈɫɛsəns");
      expect(pick("The records of blue notes are missing.","records")).toBe("ˈɹɛkɝdz");expect(pick("The musician records blue notes.","records")).toBe("ɹɪˈkɔɹdz");expect(pick("The viral infection spreads.","viral")).toBe("ˈvaɪɹəɫ");
      if(!disableDict){expect(pick("I read that book yesterday.","read")).toBe("ɹɛd");expect(pick("I will read it tomorrow.","read")).toBe("ɹid");}
    });
  });

})();

// Original suite: en-indefinite-plural-subject.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("indefinite quantifiers with explicit plural heads, disableDict=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    it("retains the bare predicate after a modified plural subject", () => {
      expect(pick("Some dog handlers use trade secrets to trim and style a dog for the show ring.", "use")).toBe("juz");
    });
    it("shares the number requirement with any", () => {
      expect(pick("Any experienced designers use trade secrets to protect their work?", "use")).toBe("juz");
    });
    it("does not infer a plural subject from an indefinite determiner alone", () => {
      expect(pick("Some computer use cases require care.", "use")).toBe("jus");
      expect(pick("Any computer use cases require care?", "use")).toBe("jus");
    });
    it("preserves noun, adjective, verb and tense controls", () => {
      expect(pick("Some computer uses were documented.", "uses")).toBe("ˈjusəz");
      expect(pick("Some city records list events.", "records")).toBe("ˈɹɛkɝdz");
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
      expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
      if (!disableDict) {
        expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
        expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
        expect(pick("Aust wins invite to next year's ASEAN summit.", "invite")).toBe("ˈɪnvaɪt");
      }
    });
    it("preserves the independently attested verb stress on exploit", () => {
      const ipa = pick("Some digital channelizers exploit aliasing in this way for computational efficiency.", "exploit");
      expect(ipa?.replace(/[ˈˌ]/g, "")).toBe("ɪkspɫɔɪt");
      // The onset boundary differs across existing paths; the stressed vowel and every phone are exact.
      expect(ipa).toMatch(/^ɪk(?:sˈ|ˈs)pɫɔɪt$/);
    });
    it("applies the grammar without a target-lemma exception", () => {
      expect(pick("Some sources estimate upwards of two thousand congregations.", "estimate")?.replace(/ˌ/g, "")).toMatch(/^ˈɛst[əɪ]meɪt$/);
    });
  });

})();

// Original suite: en-independent-stem-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const predict = (word: string) => g.predict(word, "en")!;
    const segments = (word: string) => predict(word).replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
    describe(`Independent native stems (${disableDict})`, () => {
      test("restores soft silent-e verbs in agents and adjectives", () => {
        for (const word of ["advisor", "advisors", "advisor's", "advisory"])
          expect(predict(word)).toMatch(/vaɪzɝ/);
        for (const word of ["licensor", "licensors", "licensor's"])
          expect(predict(word)).toMatch(/[ɫl]aɪsənsɝ/);
      });
      test("retains short unrelated roots and existing er agents", () => {
        expect(predict("oncor")).toMatch(/k/);
        expect(segments("censor")).toBe("sɛnsɝ");
        expect(predict("adviser")).toMatch(/vaɪzɝ$/);
        expect(predict("producer")).toMatch(/dusɝ$/);
      });
      test("retains an independently supplied ance root in ant forms", () => {
        for (const [word, ending] of [["compliant", "plaɪənt"], ["defiant", "faɪənt"], ["reliant", "laɪənt"]])
          expect(segments(word)).toMatch(new RegExp(ending + "$"));
        for (const word of ["noncompliant", "uncompliant", "anticompliant", "semicompliant"])
          expect(predict(word)).toMatch(/[ɫl]aɪənt/);
        expect(segments("cognizant")).toBe("kɑɡnəzənt");
        expect(segments("vigilant")).toBe("vɪdʒələnt");
      });
      test("keeps opaque and independently stressed roots", () => {
        expect(predict("suppliant")).toMatch(/^ˈsʌp[ɫl]iənt$/);
        expect(predict("valiant")).toMatch(/^ˈvæ[ɫl]jənt$/);
        expect(predict("brilliant")).toMatch(/^ˈbɹɪ[ɫl]jənt$/);
        if (disableDict) expect(predict("emergent")).toMatch(/^ɪˈmɝdʒənt$/);
      });
      test("contracts lian after a later stressed i", () => {
        for (const word of ["civilian", "civilians", "brazilian", "brazilians", "reptilian", "crocodilian", "crocodilianwise", "nonreptilian", "noncrocodilian"])
          expect(predict(word)).toMatch(/[ɫl]jən/);
      });
      test("retains shorter and other-vowel lian hiatus", () => {
        for (const word of ["julian", "mongolian", "aristotelian", "mammalian"])
          expect(predict(word)).toMatch(/[ɫl]iən/);
      });
    });
  }

})();

// Original suite: en-infinitive-capitalization.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  test("capitalized infinitives after passive verbs retain their verb reading", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const phone = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)?.phoneme;
    expect(phone("He was asked to Record Evidence.", "Record")).toBe("ɹɪˈkɔɹd");
    expect(phone("They were instructed to Present Evidence.", "Present")).toBe("pɹɪˈzɛnt");
    expect(phone("He was asked to record evidence.", "record")).toBe("ɹɪˈkɔɹd");
    expect(phone("The record was presented.", "record")).toBe("ˈɹɛkɝd");
  });

})();

// Original suite: en-infinitive-object-frame.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { hasFiniteObjectFrame } = __suiteModule2;
  const frame = (sentence: string, target: string) => { const words = sentence.match(/[A-Za-z]+|[^\w\s]/g)!; return hasFiniteObjectFrame({ words, index: words.indexOf(target) }); };
  test("recognizes an agreed predicate with a noun object before an infinitive", () => {
    for (const [sentence, target] of [["The formulation uses sodium deoxycholate to improve solubility.", "uses"], ["The device uses recycled materials to reduce waste.", "uses"], ["The scientist records electrical signals to detect faults.", "records"], ["The workers create electrical signals to detect faults.", "create"], ["Glider pilots use GNSS Flight Recorders to log data.", "use"]]) expect(frame(sentence, target)).toBe(true);
  });
  test("preserves nouns, finite following predicates and participles", () => {
    for (const [sentence, target] of [["Strong winds contributed to power outages.", "winds"], ["The device uses are documented.", "uses"], ["The record of events is clear.", "record"], ["The record entries were checked.", "record"], ["The uses of sodium to improve processing are documented.", "uses"], ["Stone offers produce boxes to deliver later.", "produce"]]) expect(frame(sentence, target)).toBe(false);
  });
  test("retains distinct use readings in full sentences", () => {
   const e = new EnglishG2P(), api = createPhonemizer({ processors: [e] });
   const segment = (sentence: string, target: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === target)!.phoneme;
   expect(segment("The formulation uses sodium deoxycholate to improve solubility.", "uses")).toMatch(/z[ɪə]z$/);
   expect(segment("The uses of sodium are documented.", "uses")).toMatch(/s[ɪə]z$/);
   expect(segment("Strong winds contributed to power outages.", "winds")).toContain("ɪ");
  });

})();

// Original suite: en-inflection-regressions.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/index") = require("../src/index");
  const { toIPA } = __suiteModule1;

  const regularInflections = [
    ["names", "ˈneɪmz"],
    ["games", "ˈɡeɪmz"],
    ["phones", "ˈfoʊnz"],
    ["homes", "ˈhoʊmz"],
    ["codes", "ˈkoʊdz"],
    ["dates", "ˈdeɪts"],
    ["cakes", "ˈkeɪks"],
    ["bikes", "ˈbaɪks"],
    ["likes", "ˈɫaɪks"],
    ["hopes", "ˈhoʊps"],
    ["notes", "ˈnoʊts"],
    ["smiles", "ˈsmaɪɫz"],
    ["waves", "ˈweɪvz"],
    ["times", "ˈtaɪmz"],
    ["trying", "ˈtɹaɪɪŋ"],
    ["spying", "ˈspaɪɪŋ"],
    ["copying", "ˈkɑpiɪŋ"],
    ["studying", "ˈstʌdiɪŋ"],
    ["worrying", "ˈwɝiɪŋ"],
    ["hurrying", "ˈhɝiɪŋ"],
  ];

  describe.each([false, true])("Inflections with disableDict=%s", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });

    it.each(regularInflections)("preserves the stem pronunciation in %s", (word, ipa) => {
      expect(g2p.predict(word)).toBe(ipa);
    });
  });

  describe("Inflection boundaries", () => {
    it.each([
      ["taxes", "ˈtæksəz"],
      ["mixes", "ˈmɪksəz"],
      ["campuses", "ˈkæmpəsəz"],
      ["housewives", "ˈhaʊsˌwaɪvz"],
      ["finessed", "fɪˈnɛst"],
      ["professed", "pɹəˈfɛst"],
      ["pedalled", "ˈpɛdəɫd"],
      ["dying", "ˈdaɪɪŋ"],
      ["lying", "ˈɫaɪɪŋ"],
      ["tying", "ˈtaɪɪŋ"],
      ["buying", "ˈbaɪɪŋ"],
      ["saying", "ˈseɪɪŋ"],
    ])("does not misinterpret the stem of %s", (word, ipa) => {
      expect(toIPA(word)).toBe(ipa);
    });

    it("preserves silent-e vowels in connected speech", () => {
      expect(toIPA("names games")).toBe("neɪmz ɡeɪmz");
    });
  });

  describe.each([false, true])("Verb-reading stems (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });

    it.each([
      ["used", /juzd$/],
      ["using", /juzɪŋ$/],
      ["closed", /kɫoʊzd$/],
      ["closing", /kɫoʊzɪŋ$/],
      ["living", /ɫɪvɪŋ$/],
      ["housing", /haʊzɪŋ$/],
    ] as const)("takes the explicit verb reading in %s", (word, ending) => {
      expect(g2p.predict(word)).toMatch(ending);
    });

    it("keeps citation stress when the table only specifies a non-noun reading", () => {
      expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ[ʌə]nɪŋ$/);
    });
  });

  describe.each([false, true])("Rhotic silent-e stems (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });

    it.each([
      ["acquired", /əˈkwaɪ/],
      ["desired", /zaɪ[ɝɹ]d$/],
      ["desiring", /zaɪ[ɝɹ]ɪŋ$/],
      ["injured", /^ˈɪndʒ/],
      ["injuring", /^ˈɪndʒ/],
    ] as const)("retains the recovered stem's vowel and stress in %s", (word, expected) => {
      expect(g2p.predict(word)).toMatch(expected);
    });

    it("still rejects a pronounced-e loanword as a dropped-e stem", () => {
      expect(g2p.predict("passed")).toBe("ˈpæst");
    });
  });

  describe("Silent-e probe gating (MAGIC_E_CANDIDATE)", () => {
    // inflect()'s -ed/-ing silent-e fallback fabricates base + "e" and runs
    // it through the full rule pipeline to test whether the base is a
    // dropped-e stem (advanced → advance). Unconditionally, that probe also
    // fires on bases whose ending has no silent-e spelling in English (ask,
    // mask, gasp, form), where it fabricated "aske"/"maske"/"gaspe"/"forme",
    // tensed the vowel through the magic-e rule, and shipped it: asked came
    // out /ˈeɪskt/ at runtime. asked/masked/formed aren't dict keys, so no
    // gate saw it. MAGIC_E_CANDIDATE now gates the probe to endings that can
    // plausibly carry a real silent e.
    const g2p = new EnglishG2P();

    it("keeps the lax vowel in asked", () => {
      expect(g2p.predict("asked")).toMatch(/^ˈæskt$/);
    });

    it.each([
      ["asking", /^ˈæskɪŋ$/],
      ["masked", /^ˈmæskt$/],
      ["gasped", /^ˈɡæspt$/],
      ["formed", /^ˈfɔɹmd$/],
    ] as const)("keeps the lax vowel in %s", (word, expected) => {
      expect(g2p.predict(word)).toMatch(expected);
    });
  });

  describe.each([false, true])("-nge verb inflections (disableDict=%s)", (disableDict) => {
    // inflect()'s closed-stem list ("ll|ss|ch|sh|ck|ng|lk") keeps a bare
    // rule-derived stem for a base ending in one of those clusters, because
    // adding a fictitious silent e usually changes the vowel wrongly
    // (call+ed, reach+ing). "ng" is the one cluster where that default is
    // sometimes wrong: change/range/hinge really did drop a silent e, and
    // bring/sing/hang never had one, but the two shapes are orthographically
    // identical (chang vs bring) and a vowel-tensing test can't tell them
    // apart either (see the comment at that branch in g2p.ts). The one exact
    // signal is the table's own -es plural: -nge is always spelled -nges
    // (changes, ranges), never -ngs, so a stem's -es form being a dict entry
    // is restored evidence a bare -ng plural can never produce by accident.
    const g2p = new EnglishG2P({ disableDict });
    const consonant = (word: string) => g2p.predict(word)?.match(/ndʒ|ŋ/)?.[0];

    it.each([
      "bringing", "singing", "longing", "hanging", "ringing", "belonging",
      "clinging", "swinging", "stinging", "winged", "hanged",
      // "banging" is deliberately excluded: "bange" (a rare surname) is a
      // genuine exceptions.json entry, so inflect()'s dict-based silentE()
      // step accepts it before this branch ever runs. That's a pre-existing
      // table collision upstream of this rule, out of scope here.
    ])("keeps the bare /ŋ/ coda in %s", (word) => {
      expect(consonant(word)).toBe("ŋ");
    });

    it.each([
      "changing", "changed", "ranging", "arranged", "exchanging",
      "challenged", "plunged", "lunging",
      // "hinged"/"cringing"/"binged" stay open: hing/cring/bing have no -es
      // dict entry (unlike chang/rang/exchang), and unlike the -ang stems
      // their vowel doesn't tense either way, so no signal distinguishes
      // them from bring/cling/... — see the -es corroboration comment above.
    ])("restores the silent e to /ndʒ/ in %s", (word) => {
      expect(consonant(word)).toBe("ndʒ");
    });
  });

})();

// Original suite: en-inflection-root-collisions.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("inflection root collisions (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test("carries retains the carry root instead of the name Carrie", () => {
      expect(g2p.predict("carries", "en")).toMatch(/kæɹiz$/);
    });
    test("spies retains the spy diphthong instead of the spie headword", () => {
      expect(g2p.predict("spies", "en")).toMatch(/spaɪz$/);
    });
    test("shied restores the consonant-only shy root", () => {
      expect(g2p.predict("shied", "en")).toMatch(/ʃaɪd$/);
    });
    test("stymied retains the -ie stem rather than an invented final y", () => {
      expect(g2p.predict("stymied", "en")).toMatch(/staɪm[iɪ]d$/);
    });
    test.each(["cries", "tries", "flies"])("%s retains the Cy root's diphthong", word => {
      expect(g2p.predict(word, "en")).toMatch(/aɪz$/);
    });
    test.each(["movies", "navies", "gravies", "cookies", "brownies"])("%s retains its existing weak final vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/iz$/);
    });
    test.each(["passes", "classes", "masses", "kisses", "tosses"])("%s retains the regular sibilant plural", word => {
      expect(g2p.predict(word, "en")).toMatch(/s[əɪ]z$/);
    });
    test.each(["mousses", "finesses"])("%s preserves the consonant-final -sse root", word => {
      expect(g2p.predict(word, "en")).toMatch(/s[əɪ]z$/);
    });
    test("lattes preserves the pronounced-e loanword root", () => {
      expect(g2p.predict("lattes", "en")).toMatch(/eɪz$/);
    });
    test.each(["caller", "baller", "taller", "smaller"])("%s keeps the literal -all root", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɔ[lɫ]ɝ$/);
    });
    test.each(["fuller", "puller"])("%s keeps its lexical root vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/ʊ[lɫ]ɝ$/);
    });
    test.each(["lesser", "presser", "dresser", "kisser"])("%s keeps the literal -ss root", word => {
      expect(g2p.predict(word, "en")).toMatch(/sɝ$/);
    });
    test.each(["grosser", "stroller"])("%s retains its lexical tense root", word => {
      expect(g2p.predict(word, "en")).toMatch(/oʊ[slɫ]ɝ$/);
    });
    test.each(["bigger", "fitter", "flatter", "better", "latter"])("%s retains suffix-induced doubling", word => {
      expect(g2p.predict(word, "en")).toMatch(/[ɪæɛ][ɡt]ɝ$/);
    });
    test("controller restores its longer control stem", () => {
      expect(g2p.predict("controller", "en")).toMatch(/ˈtɹoʊ[lɫ]ɝ$/);
    });
    test("priest is not parsed as pry plus -iest", () => {
      expect(g2p.predict("priest", "en")).toMatch(/pɹist$/);
    });
  });

  test.each(["carries", "spies", "shied", "passes"])("%s exposes the repaired root through the public API", word => {
    const ipa = toIPA(word);
    expect(ipa).toMatch(word === "carries" ? /kæɹi/ : word === "passes" ? /pæs[əɪ]z/ : /aɪ/);
  });

})();

// Original suite: en-inflection-stem-evidence.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("inflection stem evidence (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["shed", "sting", "sting's"])("%s retains its whole-word nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(word === "shed" ? /ʃɛd/ : /stɪŋ/);
    });
    test.each(["producer", "producer's"])("%s derives from the verb reading", word => {
      expect(g2p.predict(word, "en")).toMatch(/əˈdusɝ/);
    });
    test("closer retains the unvoiced comparative reading", () => {
      expect(g2p.predict("closer", "en")).toMatch(/sɝ$/);
    });
    test("coated retains a monosyllabic root", () => {
      expect(g2p.predict("coated", "en")).toMatch(/koʊt[ɪə]d$/);
    });
    test.each(["skater", "created"])("%s preserves a genuine restored -ate stem", word => {
      expect(g2p.predict(word, "en")).toContain("eɪt");
    });
    test("coded restores silent e", () => {
      expect(g2p.predict("coded", "en")).toContain("koʊd");
    });
    test.each(["tried", "copying"])("%s still permits y-bearing stems", word => {
      expect(g2p.predict(word, "en")).toMatch(word === "tried" ? /tɹaɪd$/ : /kɑpiɪŋ$/);
    });
  });

})();

// Original suite: en-ing-plural-verb-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("verbal ing frames (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["readings", "ˈɹidɪŋz"],
      ["recordings", "ɹɪˈkɔɹdɪŋz"],
      ["winding", "ˈwaɪndɪŋ"], ["windings", "ˈwaɪndɪŋz"],
      ["breading", "ˈbɹɛdɪŋ"], ["breeding", "ˈbɹidɪŋ"],
      ["leading", "ˈɫidɪŋ"], ["buildings", "ˈbɪɫdɪŋz"],
      ["reader", "ˈɹidɝ"], ["addressing", "əˈdɹɛsɪŋ"],
    ])("preserves the supported root in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves a supplied custom ing stem in its plural", () => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      delete access.dictionary.recordings;
      custom.addPronunciation("recording", "R OW1 K ER0 D IH0 NG");
      expect(custom.predict("recordings")).toBe("ˈɹoʊkɝdɪŋz");
    });
    it("keeps noun, adjective and finite verb controls in a complete sentence", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The clever reader keeps recordings while they work.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "recordings")?.phoneme).toBe("ɹɪˈkɔɹdɪŋz");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
      const place = api.phonemize("They travelled to Reading.", { language: "en-US", returnArray: true });
      expect(place.find(t => t.word === "Reading")?.phoneme).toBe("ˈɹɛdɪŋ");
    });
  });

})();

// Original suite: en-initial-ed-batch.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("initial ed is a root nucleus (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["edge", "ˈɛdʒ"], ["eddie", "ˈɛdi"], ["edgar", "ˈɛdɡɝ"],
      ["edges", "ˈɛdʒəz"], ["edged", "ˈɛdʒd"], ["edging", "ˈɛdʒɪŋ"],
      ["edgeless", "ˈɛdʒɫəs"], ["edgy", "ˈɛdʒi"],
      ["bed", "ˈbɛd"], ["redder", "ˈɹɛdɝ"], ["walked", "ˈwɔkt"],
      ["played", "ˈpɫeɪd"], ["added", "ˈædɪd"], ["ended", "ˈɛndɪd"],
    ])("preserves the nucleus or inflection of %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps a productive initial nucleus outside dictionary words", () => {
      expect(engine.predict("edvax")).toMatch(/^ˈɛd/);
    });
    it("inherits caller roots through productive inflection", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("edge", "ˈɛŋ");
      expect(custom.predict("edge")).toBe("ˈɛŋ");
      expect(custom.predict("edges")).toBe("ˈɛŋz");
      expect(custom.predict("edging")).toBe("ˈɛŋɪŋ");
    });
    it("preserves noun, adjective and verb controls in a sentence", () => {

      const tokens = englishTokens(engine, "The clever reader will edge the carpet.");
      for (const [word, ipa] of [["edge", "ɛdʒ"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["carpet", "ˈkɑɹpət"]])
        expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-initial-loan-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("initial loan frames (disableDict=%s)", (disableDict) => {
    const g = new EnglishG2P({ disableDict });
    test("open final-a and geminate weak-ent ex frames keep initial stress", () => {
      expect(g.predict("extra")).toMatch(/^ˈɛks/);
      expect(g.predict("excellent")).toMatch(/^ˈɛksə[ɫl]ənt/);
      for (const word of ["excel", "excels", "excelling", "except", "exempt", "extraneous", "extravagant"])
        expect(g.predict(word)).not.toMatch(/^ˈ/);
    });
    test("back-vowel labial-era roots keep their initial nucleus and boundary", () => {
      for (const word of ["camera", "cameras", "opera", "operas"]) expect(g.predict(word)).toMatch(/^ˈ(?:kæm|ɑp)/);
      // Vowel-initial nouns use noun prefixes; the existing un- gate
      // is reserved for vowel-initial adjectives and inflected verbs.
      for (const word of ["camera", "opera"]) for (const prefix of word === "camera" ? ["un", "non", "semi", "multi"] : ["non", "anti", "semi", "multi"])
        expect(g.predict(prefix + word)!.replace(/[ˈˌ]/g, "")).toMatch(/kæm|ɑp/);
      for (const word of ["rivera", "cabrera"]) expect(g.predict(word)).not.toMatch(/^ˈ/);
      expect(g.predict("chimera")!.replace(/[ˈˌ]/g, "")).not.toMatch(/kæm|kɑm/);
    });
    test("a checked rhotic head before a labial-ara tail retracts primary", () => {
      for (const word of ["barbara", "barbaras", "barbara's"]) expect(g.predict(word)).toMatch(/^ˈbɑɹ/);
      for (const prefix of ["un", "non", "semi", "multi"])
        expect(g.predict(prefix + "barbara")!.replace(/[ˈˌ]/g, "")).toMatch(/bɑɹbɝ/);
      expect(g.predict("sahara")).not.toMatch(/^ˈ/);
    });
  });

})();
