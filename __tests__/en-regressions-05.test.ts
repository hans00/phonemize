// Original suite: en-common-name-lexicon.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("dictionary-backed common-word readings", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["Canada", "ˈkænədə"],
      ["Carmichael", "ˈkɑɹmaɪkəɫ"],
      ["London", "ˈɫʌndən"],
      ["Londonderry", "ˈɫʌndəndɛɹi"],
      ["Washington", "ˈwɑʃɪŋtən"],
      ["China", "ˈtʃaɪnə"],
      ["David", "ˈdeɪvɪd"],
      ["Japan", "dʒəˈpæn"],
      ["February", "ˈfɛbɹuˌɛɹi"],
      ["Florida", "ˈfɫɔɹɪdə"],
      ["Michael", "ˈmaɪkəɫ"],
      ["Oklahoma", "oʊkɫəˈhoʊmə"],
      ["Omaha", "ˈoʊməˌhɑ"],
      ["Thomas", "ˈtɑməs"],
      ["Nicholas", "ˈnɪkəɫəs"],
      ["Jose", "ˌhoʊˈzeɪ"],
      ["Juan", "ˈhwɑn"],
      ["Andreas", "ɑnˈdɹeɪəs"],
      ["Joshua", "ˈdʒɑʃuə"],
      ["Louise", "ɫuˈiz"],
      ["Nicaragua", "ˌnɪkɝˈɑɡwə"],
      ["Somalia", "səˈmɑɫiə"],
      ["Ciao", "ˈtʃaʊ"],
      ["Carolina", "ˌkɛɹəˈɫaɪnə"],
      ["Dylan", "ˈdɪɫən"],
      ["Mali", "ˈmɑɫi"],
      ["California", "ˌkæɫəˈfɔɹnjə"],
      ["Europe", "ˈjʊɹəp"],
      ["England", "ˈɪŋɡɫənd"],
      ["Virginia", "vɝˈdʒɪnjə"],
      ["Chicago", "ʃɪˈkɑɡoʊ"],
      ["July", "ˌdʒuˈɫaɪ"],
    ])("uses the dictionary's US reading for %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("preserves lexical readings in ordinary sentence context", () => {
      const api = createPhonemizer({ processors: [rules] });
      const tokens = api.phonemize("Michael Carmichael, Thomas, Nicholas, Jose, Juan, Andreas, Joshua, Louise, Nicaragua, Somalia, Carolina, Dylan, Mali, California, Europe, England, Virginia, Chicago, and July, then said ciao before visiting Omaha, Florida, and Oklahoma this February.", {
        language: "en-US", returnArray: true,
      });
      const byWord = new Map(tokens.map(token => [token.word.toLowerCase(), token.phoneme]));
      expect(byWord.get("michael")).toBe("ˈmaɪkəɫ");
      expect(byWord.get("carmichael")).toBe("ˈkɑɹmaɪkəɫ");
      expect(byWord.get("florida")).toBe("ˈfɫɔɹɪdə");
      expect(byWord.get("oklahoma")).toBe("oʊkɫəˈhoʊmə");
      expect(byWord.get("february")).toBe("ˈfɛbɹuˌɛɹi");
      expect(byWord.get("omaha")).toBe("ˈoʊməˌhɑ");
      expect(byWord.get("thomas")).toBe("ˈtɑməs");
      expect(byWord.get("nicholas")).toBe("ˈnɪkəɫəs");
      expect(byWord.get("jose")).toBe("ˌhoʊˈzeɪ");
      // Sentence-level prosody may de-stress this monosyllabic name here.
      expect(byWord.get("juan")).toBe("hwɑn");
      expect(byWord.get("andreas")).toBe("ɑnˈdɹeɪəs");
      expect(byWord.get("joshua")).toBe("ˈdʒɑʃuə");
      expect(byWord.get("louise")).toBe("ɫuˈiz");
      expect(byWord.get("nicaragua")).toBe("ˌnɪkɝˈɑɡwə");
      expect(byWord.get("somalia")).toBe("səˈmɑɫiə");
      // Sentence-level prosody may de-stress this monosyllabic interjection.
      expect(byWord.get("ciao")).toBe("tʃaʊ");
      expect(byWord.get("carolina")).toBe("ˌkɛɹəˈɫaɪnə");
      expect(byWord.get("dylan")).toBe("ˈdɪɫən");
      expect(byWord.get("mali")).toBe("ˈmɑɫi");
      expect(byWord.get("california")).toBe("ˌkæɫəˈfɔɹnjə");
      expect(byWord.get("europe")).toBe("ˈjʊɹəp");
      expect(byWord.get("england")).toBe("ˈɪŋɡɫənd");
      expect(byWord.get("virginia")).toBe("vɝˈdʒɪnjə");
      expect(byWord.get("chicago")).toBe("ʃɪˈkɑɡoʊ");
      expect(byWord.get("july")).toBe("ˌdʒuˈɫaɪ");
      expect(rules.predict("florist", "en-US")).toBe("ˈfɫɔɹɪst");
    });

    it("uses the attested dictionary variant for elite without changing general final -ite rules", () => {
      expect(rules.predict("elite", "en-US")).toBe("eɪˈɫit");
      expect(rules.predict("elite", "en-US", "N")).toBe("eɪˈɫit");
      expect(rules.predict("bite", "en-US")).toBe("ˈbaɪt");
      expect(rules.predict("polite", "en-US")).toBe("ˈpoʊɫaɪt");
    });

    it("keeps the readings in ordinary sentence context and preserves spelling controls", () => {
      const api = createPhonemizer({ processors: [rules] });
      const names = api.phonemize("David visited Canada, China, Japan, London, and Washington.", {
        language: "en-US", returnArray: true,
      });
      const byWord = new Map(names.map(token => [token.word.toLowerCase(), token.phoneme]));
      expect(byWord.get("david")).toBe("ˈdeɪvɪd");
      expect(byWord.get("canada")).toBe("ˈkænədə");
      expect(byWord.get("china")).toBe("ˈtʃaɪnə");
      expect(byWord.get("japan")).toBe("dʒəˈpæn");
      expect(byWord.get("london")).toBe("ˈɫʌndən");
      expect(byWord.get("washington")).toBe("ˈwɑʃɪŋtən");
      expect(rules.predict("washing", "en-US")).toBe("ˈwɑʃɪŋ");
      expect(rules.predict("land", "en-US")).toBe("ˈɫænd");
    });
  });

})();

// Original suite: en-common-reference-corrections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const dictionary = require("../data/en/dict.json");

  describe("Cambridge US common-word reference corrections", () => {
    const readings = [
      ["article", "ˈɑɹtɪkəl", "ˈɑɹtɪkəɫ"],
      ["presenting", "pɹɪˈzɛntɪŋ", "pɹɪˈzɛntɪŋ"],
    ] as const;

    it.each(readings)("stores and serves the Cambridge US reading for %s", (word, dictIpa, runtimeIpa) => {
      expect(dictionary[word]).toBe(dictIpa);
      expect(new EnglishG2P().predict(word, "en-US")).toBe(runtimeIpa);
    });

    it("preserves Cambridge's final /t/ in investment", () => {
      const stripStress = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");
      expect(stripStress(dictionary.investment)).toBe("ɪnvɛstmənt");
      expect(stripStress(new EnglishG2P().predict("investment", "en-US") ?? "")).toBe("ɪnvɛstmənt");
    });

    it.each([
      ["credit", "ˈkɹɛdɪt"],
      ["edit", "ˈɛdɪt"],
      ["editor", "ˈɛdɪtɝ"],
      ["edition", "ɪˈdɪʃən"],
    ] as const)("uses Cambridge US's /ɪ/ reading for %s", (word, expected) => {
      expect(dictionary[word]).toBe(expected);
      expect(new EnglishG2P().predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-compan-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("the compan- root keeps its source-checked STRUT vowel", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/company
      ["company", "ˈkʌmpəni"],
      // Cambridge US: https://dictionary.cambridge.org/pronunciation/english/accompany
      ["accompany", "əˈkʌmpəni"],
      ["companion", "kəmˈpænjən"],
      ["companies", "ˈkʌmpəˌniz"],
      ["accompanied", "əˈkʌmpənid"],
      ["accompanying", "əˈkʌmpəniɪŋ"],
      ["companionship", "kəmˈpænjənˌʃɪp"],
    ])("keeps the expected reading for %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["Germany", "ˈdʒɝməni"],
      ["compare", "kəmˈpɛɹ"],
      ["community", "kəˈmjunəti"],
      ["communal", "ˈkɑmənəɫ"],
      ["companionable", "kəmˈpænjənəbəɫ"],
    ])("preserves the neighboring reading for %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("keeps the readings in sentence context", () => {

      const tokens = englishTokens(rules, "The company will accompany its companion to Germany.");
      for (const [word, ipa] of [
        ["company", "ˈkʌmpəni"],
        ["accompany", "əˈkʌmpəni"],
        ["companion", "kəmˈpænjən"],
        ["germany", "ˈdʒɝməni"],
      ])
        expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-compare-comparison.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("comparison retains the productive compare stem", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("derives comparison from compare rather than re-syllabifying the whole word", () => {
      expect(rules.predict("comparison", "en-US")).toBe("kəmˈpɛɹəsən");
      expect(rules.predict("comparisons", "en-US")).toBe("kəmˈpɛɹəsənz");
    });

    it("leaves the verb paradigm and related -ison words on their own paths", () => {
      expect(rules.predict("compare", "en-US")).toBe("kəmˈpɛɹ");
      expect(rules.predict("compared", "en-US")).toBe("kəmˈpɛɹd");
      expect(rules.predict("compares", "en-US")).toBe("kəmˈpɛɹz");
      expect(rules.predict("comparing", "en-US")).toBe("kəmˈpɛɹɪŋ");
      expect(rules.predict("comparative", "en-US")).toBe("kəmˈpæɹətɪv");
      expect(rules.predict("prison", "en-US")).toBe("ˈpɹɪsən");
      expect(rules.predict("decision", "en-US")).toBe("dɪˈsɪʒən");
    });
  });

})();

// Original suite: en-complete-doubled-agent.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  describe.each([false,true])("complete doubled roots before agents, disableDict=%s",disableDict=>{
   const engine=new EnglishG2P({disableDict});
   it.each([["reseller","ɹiˈsɛɫɝ"],["putter","ˈpʌtɝ"],["rototiller","ˈɹoʊtəˌtɪɫɝ"]])("preserves the vouched root of %s",(word,ipa)=>expect(engine.predict(word)).toBe(ipa));
   it("preserves weak-el and suffix-induced doubling",()=>{
    expect(engine.predict("reveller")).toBe("ˈɹɛvəɫɝ");
    expect(engine.predict("jewellers")).toBe("ˈdʒuəɫɝz");
    expect(engine.predict("latter")).toBe("ˈɫætɝ");
    expect(engine.predict("bitter")).toBe("ˈbɪtɝ");
   });
   it("keeps the agent noun and its existing source verb in context",()=>{
    const api=createPhonemizer({processors:[engine]});
    const out=api.phonemize("The reseller was reselling a putter.",{language:"en-US",returnArray:true});
    expect(out.find(t=>t.word==="reseller")?.phoneme).toBe("ɹiˈsɛɫɝ");
    expect(out.find(t=>t.word==="reselling")?.phoneme).toBe("ɹiˈsɛɫɪŋ");
    expect(out.find(t=>t.word==="putter")?.phoneme).toBe("ˈpʌtɝ");
   });
   it("preserves caller-provided doubled roots and explicit children",()=>{
    const own=new EnglishG2P({disableDict}),dictionary={...Reflect.get(own,"dictionary")};
    for(const word of ["reseller","resellers","jeweller","jewelled","jewelling"])delete dictionary[word];
    Reflect.set(own,"dictionary",dictionary);own.addPronunciation("resell","ˈzɛŋ");
    expect(own.predict("reseller")).toBe("ˈzɛŋɝ");expect(own.predict("resellers")).toBe("ˈzɛŋɝz");
    own.addPronunciation("jewell","ˈbɛŋ");expect(own.predict("jeweller")).toBe("ˈbɛŋɝ");
    expect(own.predict("jewelled")).toBe("ˈbɛŋd");expect(own.predict("jewelling")).toBe("ˈbɛŋɪŋ");
    own.addPronunciation("reseller","ˈkɛŋ");expect(own.predict("reseller")).toBe("ˈkɛŋ");
   });
  });

})();

// Original suite: en-complete-ed-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // MW woodshed/hotbed: the complete lexical tail retains DRESS, not past -ed.
  describe.each([false, true])("complete -ed compound tails, rules=%s", disableDict => {
    test.each([
      ["woodshed", "ˈwʊdˌʃɛd"],
      ["hotbed", "ˈhɑtˌbɛd"],
      ["toolshed", "ˈtuɫˌʃɛd"],
    ])("retains the complete tail in %s across caller roles", (word, expected) => {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"])
        expect(engine.predict(word, "en-US", pos)).toBe(expected);
    });

    test.each([
      ["The woodshed is warm.", "woodshed", "ˈwʊdˌʃɛd"],
      ["The hotbed is warm.", "hotbed", "ˈhɑtˌbɛd"],
      ["The toolshed is warm.", "toolshed", "ˈtuɫˌʃɛd"],
      ["Musicians woodshed every day.", "woodshed", "ˈwʊdˌʃɛd"],
    ])("preserves the full reading in %s", (sentence, word, expected) => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)?.phoneme).toBe(expected);
    });

    test("keeps caller-owned regular verb stems ahead of compound recovery", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("toolsh", "Z AE1 P");
      for (const pos of [undefined, "N", "ADJ", "V"])
        expect(engine.predict("toolshed", "en-US", pos)).toBe(pos === undefined ? "ˈzæpt" : "zæpt");
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize("They toolshed the wall.", { language: "en-US", returnArray: true })
        .find(token => token.word === "toolshed")?.phoneme).toBe("zæpt");
    });

    test("keeps ordinary past-tense restoration", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("wanted")).toBe(disableDict ? "ˈwɑntɪd" : "ˈwɔntɪd");
      expect(engine.predict("tired")).toBe("ˈtaɪɝd");
      for (const [word, expected] of [["seemed", "ˈsimd"], ["deemed", "ˈdimd"], ["teemed", "ˈtimd"], ["teamed", "ˈtimd"], ["boomed", "ˈbumd"], ["zoomed", "ˈzumd"], ["harmed", "ˈhɑɹmd"], ["barbed", "ˈbɑɹbd"], ["surfed", "ˈsɝft"]])
        expect(engine.predict(word)).toBe(expected);
    });

    test("retains full consumer readings after root retention", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, expected] of [["harmison", "ˈhɑɹmɪsən"], ["barbarian", "bɑɹˈbɛɹiən"], ["tribal", "ˈtɹaɪbəɫ"], ["barbeaus", "bɑɹˈboʊz"]])
        expect(engine.predict(word)).toBe(expected);
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize("The Barbeaus arrived today.", { language: "en-US", returnArray: true })
        .find(token => token.word === "Barbeaus")?.phoneme).toBe("bɑɹˈboʊz");
    });

    test("keeps the compound stem's stress in agents and full sentences", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"]) {
        expect(engine.predict("woodshedder", "en-US", pos)).toBe("ˈwʊdˌʃɛdɝ");
        expect(engine.predict("woodshedders", "en-US", pos)).toBe("ˈwʊdˌʃɛdɝz");
      }
      const api = createPhonemizer({ processors: [engine] });
      for (const [sentence, word, expected] of [
        ["The woodshedder is rehearsing.", "woodshedder", "ˈwʊdˌʃɛdɝ"],
        ["The woodshedders are rehearsing.", "woodshedders", "ˈwʊdˌʃɛdɝz"],
        ["The musicians are woodshedding.", "woodshedding", "ˈwʊdˌʃɛdɪŋ"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)?.phoneme).toBe(expected);
    });

    test("keeps vouched fly compounds distinct from ordinary ly adverbs", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"]) {
        expect(engine.predict("barfly", "en-US", pos)).toBe("ˈbɑɹˌfɫaɪ");
        expect(engine.predict("barflies", "en-US", pos)).toBe("ˈbɑɹˌfɫaɪz");
      }
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize("The barfly drinks here.", { language: "en-US", returnArray: true })
        .find(token => token.word === "barfly")?.phoneme).toBe("ˈbɑɹˌfɫaɪ");
      expect(api.phonemize("The barflies drink here.", { language: "en-US", returnArray: true })
        .find(token => token.word === "barflies")?.phoneme).toBe("ˈbɑɹˌfɫaɪz");
      engine.addPronunciation("barf", "Z AE1 P");
      expect(engine.predict("barfly")).toBe("ˈzæpɫi");
      for (const [word, expected] of [["briefly", "ˈbɹifɫi"], ["chiefly", "ˈtʃifɫi"], ["deafly", "ˈdɛfɫi"], ["safely", "ˈseɪfɫi"]])
        expect(engine.predict(word)).toBe(expected);
    });
  });

})();

// Original suite: en-compound-agent-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../data/en/exceptions.json") = require("../data/en/exceptions.json");
  const exceptions: typeof import("../data/en/exceptions.json") = require("../data/en/exceptions.json");
  const __suiteModule3: typeof import("../src/utils") = require("../src/utils");
  const { resolveJson } = __suiteModule3;

  test.each([false, true])("compound agents preserve complete roots and stress (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("onlooker")).toMatch(/^ˈ[ɑɔ]nˌɫʊkɝ$/);
    expect(engine.predict("anteater")).toMatch(/^ˈæn(?:ˌt|tˌ)itɝ$/);
    expect(engine.predict("bargainer")).toBe(disableDict ? "ˈbɑɹɡənɝ" : "ˈbɑɹɡɪnɝ");
    expect(engine.predict("seedeater")).toBe("ˈsiˌditɝ");
    expect(engine.predict("linseeder")).toBe(`${engine.predict("linseed")}ɝ`);
    engine.addPronunciation("linseed", "ˈzi");
    expect(engine.predict("linseeder")).toBe("ˈziɝ");
  });

  test.each([false, true])("recovers a compound root after lexical eviction (disableDict=%s)", disableDict => {
    const table = { ...resolveJson<Record<string, string>>(exceptions) };
    delete table.homestead;
    delete table.homesteader;
    delete table.spearhead;
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: table });
    expect(engine.predict("homesteaded")).toBe("ˈhoʊmˌstɛdɪd");
    expect(engine.predict("homesteading")).toBe("ˈhoʊmˌstɛdɪŋ");
    // Cambridge: https://dictionary.cambridge.org/us/dictionary/english/spearheading
    expect(engine.predict("spearheading")).toBe("ˈspɪɹˌhɛdɪŋ");
    engine.addPronunciation("homestead", "ˈzi");
    expect(engine.predict("homesteading")).toBe("ˈziɪŋ");
  });

  // Cambridge records homestead as both a noun and a verb and lists homesteaded.
  // https://dictionary.cambridge.org/us/dictionary/english/homesteaded
  test.each([false, true])("retains regular compound forms in sentences (disableDict=%s)", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, expected] of [
      ["They homesteaded the land.", "homesteaded", "ˈhoʊmˌstɛdɪd"],
      ["They are homesteading the land.", "homesteading", "ˈhoʊmˌstɛdɪŋ"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)?.phoneme).toBe(expected);
  });

})();

// Original suite: en-compound-forest.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("compatible recursive compound forest", () => {
    const engine = new EnglishG2P({ disableDict: true });
    test("preserves both castaway boundaries and whole-word rendering", () => {
      const forest = engine.analyzeWordForest("castaway");
      expect(forest.status).toBe("complete");
      expect(forest.analysis).toEqual(engine.analyzeWord("castaway"));
      expect(forest.nodes.filter(n => n.kind === "compound")).toHaveLength(2);
      expect(forest.nodes.some(n => n.kind === "whole" && n.start === 0 && n.end === 8 && n.origin === "direct-rules")).toBe(true);
      expect(Object.isFrozen(forest.nodes)).toBe(true);
    });
    test.each(["upperclassmen", "underclassmen"])("retains nested structure and explicitly projects secondary stress: %s", word => {
      const forest = engine.analyzeWordForest(word);
      expect(forest.status).toBe("complete");
      expect(forest.nodes.some(n => n.kind === "compound" && n.start === 5 && n.end === 13)).toBe(true);
      const projection = forest.nodes.find(n => n.kind === "secondary-projection");
      expect(projection).toBeDefined();
      if (projection?.kind === "secondary-projection") {
        const source = forest.nodes[projection.source];
        expect(source.componentIpa?.replace(/ˌ/g, "")).toBe(projection.componentIpa);
        expect(source.componentIpa).not.toBe(projection.componentIpa);
      }
      for (const node of forest.nodes) {
        if (node.kind === "choice" && node.componentIpa !== null)
          for (const id of node.alternatives) expect(forest.nodes[id].componentIpa).toBe(node.componentIpa);
        if (node.kind === "compound") {
          expect(forest.nodes[node.left].start).toBe(node.start);
          expect(forest.nodes[node.left].end).toBe(forest.nodes[node.right].start);
          expect(forest.nodes[node.right].end).toBe(node.end);
        }
        const edges = node.kind === "choice" ? node.alternatives : node.kind === "compound" ? [node.left, node.right] : node.kind === "secondary-projection" ? [node.source] : [];
        for (const id of edges) expect(id).toBeLessThan(node.id);
      }
    });
    test("retains the contextual component instead of the free head reading", () => {
      const forest = engine.analyzeWordForest("automotive");
      const compound = forest.nodes.find(n => n.kind === "compound");
      expect(compound).toBeDefined();
      if (compound?.kind === "compound") expect(forest.nodes[compound.left].componentIpa).toBe("ˈɔtə");
      expect(forest.analysis.actual.ipa).toBe(engine.predict("automotive"));
    });
    test("exposes whole-word dispatch guards and unsupported inputs", () => {
      const guarded = engine.analyzeWordForest("inquire");
      expect(guarded.guardedSpans).toBe(1);
      expect(guarded.nodes.some(n => n.kind === "compound")).toBe(false);
      expect(engine.analyzeWordForest("O’Reilly")).toMatchObject({ status: "unsupported", root: null, nodes: [] });
    });
    test("a bounded partial search cannot report complete analysis", () => {
      expect(engine.analyzeWordForest("upperclassmen", 1)).toMatchObject({ status: "truncated", root: null });
      expect(() => engine.analyzeWordForest("upperclassmen", 0)).toThrow(RangeError);
      expect(() => engine.analyzeWordForest("upperclassmen", 1.5)).toThrow(RangeError);
    });
  });

})();

// Original suite: en-compound-line-plural.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("regular plurals of line compounds", () => {
    it.each([false, true])("keeps the verified compound in the stem (disableDict=%s)", disableDict => {
      const g2p = new EnglishG2P({ disableDict });

      expect(g2p.predict("guideline", "en")).toBe("ˈɡaɪdˌɫaɪn");
      expect(g2p.predict("guidelines", "en")).toBe("ˈɡaɪdˌɫaɪnz");
      expect(g2p.predict("sidelines", "en")).toBe("ˈsaɪdˌɫaɪnz");
      expect(g2p.predict("lifelines", "en")).toBe("ˈɫaɪfˌɫaɪnz");
      expect(g2p.predict("pipelines", "en")).toBe("ˈpaɪpˌɫaɪnz");
      expect(g2p.predict("baselines", "en")).toBe("ˈbeɪsˌɫaɪnz");
      expect(g2p.predict("timelines", "en")).toBe("ˈtaɪmˌɫaɪnz");
      expect(g2p.predict("headlines", "en")).toBe("ˈhɛdˌɫaɪnz");
    });
  });

})();

// Original suite: en-compound-plural-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge: arrowhead, spearhead, grandparent and wetlands pronunciations.
  // https://dictionary.cambridge.org/us/pronunciation/english/arrowhead
  // https://dictionary.cambridge.org/pronunciation/english/spearhead
  // https://dictionary.cambridge.org/us/pronunciation/english/grandparent
  // https://dictionary.cambridge.org/pronunciation/english/wetlands
  describe.each([false, true])("compound plural boundaries, disableDict=%s", disableDict => {
    test("retains complete compound roots and caller readings", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"]) {
        expect(engine.predict("arrowheads", "en-US", pos)).toBe("ˈæɹoʊˌhɛdz");
        expect(engine.predict("spearheads", "en-US", pos)).toBe("ˈspɪɹˌhɛdz");
        expect(engine.predict("networks", "en-US", pos)).toBe("ˈnɛtˌwɝks");
        expect(engine.predict("wetlands", "en-US", pos)).toBe("ˈwɛtɫəndz");
        expect(engine.predict("comedies", "en-US", pos)).toBe("ˈkɑmədiz");
        expect(engine.predict("frogmouths", "en-US", pos)).toBe("ˈfɹɑɡˌmaʊðz");
        expect(engine.predict("limpets", "en-US", pos)).toBe("ˈɫɪmpəts");
      }
      engine.addPronunciation("arrowhead", "ˈzi");
      expect(engine.predict("arrowheads")).toBe("ˈziz");
      engine.addPronunciation("network", "ˈzæp");
      expect(engine.predict("networks")).toBe("ˈzæps");
      expect(engine.predict("protests", "en-US", "N")).toBe("ˈpɹoʊˌtɛsts");
      expect(engine.predict("protests", "en-US", "V")).toBe("pɹəˈtɛsts");
    });

    test("keeps noun, adjective and verb readings in full sentences", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, expected] of [
        ["The arrowheads are sharp.", "arrowheads", "ˈæɹoʊˌhɛdz"],
        ["She spearheads the project.", "spearheads", "ˈspɪɹˌhɛdz"],
        ["The wetlands are beautiful.", "wetlands", "ˈwɛtɫəndz"],
        ["A newborn baby sleeps.", "newborn", "ˈnuˌbɔɹn"],
        ["She outperforms the team.", "outperforms", disableDict ? "aʊtˈpɝfɔɹmz" : "ˌaʊtpɝˈfɔɹmz"],
        ["The protests continue.", "protests", "ˈpɹoʊˌtɛsts"],
        ["She protests the decision.", "protests", "pɹəˈtɛsts"],
        ["Their grandparents' house is old.", "grandparents'", "ˈɡɹændˌpɛɹənts"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)?.phoneme).toBe(expected);
    });
  });

})();

// Original suite: en-compound-y-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Compound final y and adverb -ly (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });

    it.each(["butterfly", "firefly", "dragonfly", "housefly", "horsefly", "gadfly", "overfly", "oversupply"])(
      "retains the complete compound tail in %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/aɪ$/);
      },
    );

    it.each(["butterflies", "fireflies", "dragonflies", "houseflies", "horseflies"])(
      "retains the tail through plural y-restoration in %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/aɪz$/);
      },
    );

    it.each(["moonfly", "cloudfly", "bookfly"])(
      "composes a novel word from existing verified parts: %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/f[ɫl]aɪ$/);
      },
    );

    it.each(["deeply", "simply", "safely", "freely", "probably", "invariably", "multifamily", "otherworldly"])(
      "keeps the ordinary final vowel in %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/i$/);
      },
    );

    it.each([
      ["The butterfly can fly.", "butterfly", /f[ɫl]aɪ$/],
      ["They overfly the field.", "overfly", /f[ɫl]aɪ$/],
      ["They simply fly home.", "fly", /^f[ɫl]aɪ$/],
      ["The simple plan works.", "simple", /^sɪmpə[ɫl]$/],
      ["Her family simply smiled.", "family", /^fæmə[ɫl]i$/],
      ["She simply smiled deeply.", "simply", /^sɪmp[ɫl]i$/],
      ["She simply smiled deeply.", "deeply", /^dip[ɫl]i$/],
    ] as const)("preserves the boundary in %s (%s)", (sentence, word, phones) => {
      const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)!;
      expect(target.phoneme.replace(/[ˈˌ]/g, "")).toMatch(phones);
    });
  });

})();

// Original suite: en-con-ation-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("con- noun stress retraction (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["confirmation", "ˌkɑnfɝˈmeɪʃən"],
      ["consultation", "ˌkɑnsəɫˈteɪʃən"],
      ["condemnation", "ˌkɑndəmˈneɪʃən"],
      ["confrontation", "ˌkɑnfɹənˈteɪʃən"],
      ["conformational", "ˌkɑnfɝˈmeɪʃənəɫ"],
      ["conformation", "ˌkɑnfɝˈmeɪʃən"],
    ])("renders the complete noun frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([
      ["information", "ˌɪnfɝˈmeɪʃən"],
      ["presentation", "ˌpɹɛzənˈteɪʃən"],
      ["distillation", "ˌdɪstəˈɫeɪʃən"],
    ])("preserves a neighboring noun frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains FORCE after a vowel-final prefix", () => {
      expect(engine.predict("deformation")).toMatch(/fɔɹˈmeɪʃən$/);
    });
    it("preserves plurals and prefixes after noun eviction", () => {
      const fresh = new EnglishG2P({ disableDict });
      const access = fresh as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["confirmation", "confirmations", "consultation", "consultations"]) delete access.dictionary[word];
      expect(fresh.predict("confirmations")).toBe("ˌkɑnfɝˈmeɪʃənz");
      expect(fresh.predict("consultations")).toBe("ˌkɑnsəɫˈteɪʃənz");
      expect(fresh.predict("nonconfirmation")).toBe("nɑnˌkɑnfɝˈmeɪʃən");
      expect(fresh.predict("nonconsultation")).toBe("nɑnˌkɑnsəɫˈteɪʃən");
      expect(fresh.predict("preconfirmation")).toMatch(/kɑnfɝˈmeɪʃən$/);
      if (!disableDict) expect(fresh.predict("reconfirmation")).toMatch(/kɑnfɝˈmeɪʃən$/);
    });
    it("preserves noun, adjective and verb controls in a full sentence", () => {

      const tokens = englishTokens(engine, "After confirmation, the clever reader will work.");
      expect(tokens.find(t => t.word === "confirmation")?.phoneme).toBe("ˌkɑnfɝˈmeɪʃən");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

  it.each([
    ["confirm", "kənˈfɝm"], ["consult", "kənˈsʌɫt"],
    ["condemn", "kənˈdɛm"], ["confront", "kənˈfɹʌnt"],
  ])("preserves the supplied verb citation in %s", (word, ipa) => {
    expect(new EnglishG2P().predict(word, "en", "V")).toBe(ipa);
  });

})();

// Original suite: en-con-bound-verb-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("weak con- verb roots (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const standard = (ipa: string | null) => (ipa ?? "").replace(/ˌ/g, "").replace(/ʌ/g, "ə");

    it("keeps the prefix weak and stresses the bound verb root", () => {
      const expected: Record<string, string> = {
        concern: "kənˈsɝn",
        confess: "kənˈfɛs",
        confirm: "kənˈfɝm",
        constrict: "kənˈstɹɪkt",
        constrain: "kənˈstɹeɪn",
        consult: "kənˈsəɫt",
      };
      for (const [word, ipa] of Object.entries(expected)) expect(standard(g2p.predict(word, "en"))).toBe(ipa);
    });

    it("preserves initial-stressed noun and homograph controls", () => {
      expect(standard(g2p.predict("concert", "en"))).toBe("ˈkɑnsɝt");
      expect(standard(g2p.predict("concept", "en"))).toBe("ˈkɑnsɛpt");
      expect(standard(g2p.predict("conflict", "en"))).toBe("ˈkɑnfɫɪkt");
      expect(standard(g2p.predict("contract", "en"))).toBe("ˈkɑntɹækt");
      expect(standard(g2p.predict("constraint", "en"))).toBe(disableDict ? "ˈkɑnstɹeɪnt" : "kənˈstɹeɪnt");
      expect(standard(g2p.predict("construct", "en"))).toBe("ˈkɑnstɹəkt");
      expect(standard(g2p.predict("content", "en"))).toBe("ˈkɑntɛnt");
    });

    it("keeps root stress under outer un- inflection", () => {
      expect(standard(g2p.predict("unconfirmed", "en"))).toBe("ənkənˈfɝmd");
      expect(standard(g2p.predict("unconstrained", "en"))).toBe("ənkənˈstɹeɪnd");
      expect(standard(g2p.predict("unconsulted", "en"))).toBe("ənkənˈsəɫtɪd");
    });
  });

})();

// Original suite: en-con-ti-weak-schwa.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak unprefixed con-ti-n syllables", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["continental", "ˌkɑntəˈnɛntəɫ"],
      ["continuity", "ˌkɑntəˈnuəti"],
    ])("centralizes the unstressed i in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["continue", "kənˈtɪnju"],
      ["continuous", "kənˈtɪnjuəs"],
      ["continuation", "kənˌtɪnjuˈeɪʃən"],
      ["subcontinent", "ˌsʌbˈkɑntənənt"],
    ])("preserves the existing contrast in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-concen-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the unstressed con|cen|tr frame", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const withoutSecondaryStress = (ipa: string) => ipa.replace(/ˌ/g, "");

    it.each([
      ["concentrate", "ˈkɑnsənˌtɹeɪt"],
      ["concentrator", "ˈkɑnsənˌtɹeɪtɝ"],
    ])("centralizes the weak <cen> in %s", (word, ipa) => {
      expect(withoutSecondaryStress(rules.predict(word, "en-US") ?? "")).toBe(withoutSecondaryStress(ipa));
      expect(rules.trace(word, "en-US").path).toBe("rules");
    });

    it.each([
      ["concentrates", "ˈkɑnsənˌtɹeɪts"],
      ["concentrated", "ˈkɑnsənˌtɹeɪtɪd"],
      ["concentrating", "ˈkɑnsənˌtɹeɪtɪŋ"],
      ["concentration", "ˌkɑnsənˈtɹeɪʃən"],
    ])("preserves the existing morphology reading of %s", (word, ipa) => {
      expect(withoutSecondaryStress(rules.predict(word, "en-US") ?? "")).toBe(withoutSecondaryStress(ipa));
      expect(rules.trace(word, "en-US").path).toBe("morphology");
    });

    it.each([
      ["concentric", "kənˈsɛntɹɪk"],
      ["concentrically", "kənˈsɛntɹɪkɫi"],
      ["eccentric", "ɛkˈsɛntɹɪk"],
      ["concern", "kənˈsɝn"],
    ])("keeps the distinct stressed or neighboring root in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the public sentence reading of concentrate", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
      const tokens = phonemizer.phonemize("Please concentrate on the task.", {
        language: "en-US",
        returnArray: true,
      });
      expect(withoutSecondaryStress(tokens.find(token => token.word === "concentrate")?.phoneme ?? ""))
        .toBe(withoutSecondaryStress("ˈkɑnsənˌtɹeɪt"));
    });
  });

})();

// Original suite: en-consolidate-morphology.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("consolidate root morphology", () => {
    const shipped = new EnglishG2P();
    const rules = new EnglishG2P({ disableDict: true });

    it("uses the Cambridge US root reading in the shipped dictionary", () => {
      expect(shipped.predict("consolidate", "en-US")).toBe("kənˈsɑɫəˌdeɪt");
    });

    it.each([
      ["consolidates", "kənˈsɑɫəˌdeɪts"],
      ["consolidated's", "kənˈsɑɫəˌdeɪtɪdz"],
    ])("keeps the corrected source reading for %s", (word, expected) => {
      expect(shipped.predict(word, "en-US")).toBe(expected);
    });

    it.each([
      ["consolidates", "kənˈsɑɫəˌdeɪts"],
      ["consolidated", "kənˈsɑɫəˌdeɪtɪd"],
      ["consolidated's", "kənˈsɑɫəˌdeɪtɪdz"],
      ["consolidating", "kənˈsɑɫəˌdeɪtɪŋ"],
      ["consolidation", "kənˌsɑɫəˈdeɪʃən"],
    ])("uses the corrected root for %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("preserves the derived reading in a sentence with verb POS", () => {
      const sentence = ["They", "consolidated", "several", "accounts"];
      expect(rules.predictWithContext("consolidated", { words: sentence, index: 1 }, "en-US", "V"))
        .toBe("kənˈsɑɫəˌdeɪtɪd");
    });

    it.each([
      ["solid", "ˈsɑɫəd"],
      ["solidify", "səˈɫɪdəˌfaɪ"],
      ["solidity", "səˈɫɪdəti"],
      ["consolidator", "kənˈsɑɫɪˌdeɪtɝ"],
      ["reconsolidated", "ˌɹikənˈsɑɫɪˌdeɪtɪd"],
    ])("leaves the neighboring %s form unchanged", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-consonant-and-ule-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("consonant and -ule boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("x voices only at the start of a word", () => {
      for (const word of ["proxy", "sexy", "boxy", "foxy", "oxygen", "oxygenate"])
        expect(segments(word)).toContain("ks");
      expect(segments("xylophone")).toMatch(/^z/);
    });

    test("front suffixes coalesce the final sc cluster", () => {
      for (const word of ["fascist", "fascists", "fascism"])
        expect(segments(word)).toContain("fæʃ");
      expect(segments("criticize")).toContain("s");
      expect(segments("druggist")).toContain("ɡ");
    });

    test("a strong the syllable keeps its own vowel", () => {
      expect(segments("these")).toBe("ðiz");
      for (const word of ["hypothetical", "empathetic", "pathetic"])
        expect(segments(word)).toContain("θɛ");
      expect(segments("hypothesis")).toContain("θə");
    });

    test("long u survives in weak -ule and coalesces with t or d", () => {
      for (const word of ["module", "nodule"])
        expect(segments(word)).toMatch(/dʒuɫ$/);
      for (const word of ["molecule", "minuscule", "tubule", "vestibule"])
        expect(segments(word)).toMatch(/juɫ$/);
      expect(segments("overrule")).toMatch(/ɹuɫ$/);
      expect(segments("capsule")).toMatch(/səɫ$/);
      expect(segments("granule")).toMatch(/n[j]?əɫ$/);
    });
  });

})();

// Original suite: en-contextual-s-plural-homographs.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("verb stems in contextual -s forms", () => {
    const processor = new EnglishG2P({ disableDict: true });
    const api = createPhonemizer({ processors: [processor] });
    const tokens = (sentence: string) => api.phonemize(sentence, {
      language: "en-US", returnArray: true,
    });

    it("uses the attested verb reading for explicitly tagged inflections", () => {
      expect(processor.predict("combines", "en-US", "V")).toBe("kəmˈbaɪnz");
      expect(processor.predict("consoles", "en-US", "V")).toBe("kənˈsoʊɫz");
      expect(processor.predict("produces", "en-US", "V")).toBe("pɹəˈdusəz");
    });

    it("selects finite verbs and preserves plural-noun readings in sentence context", () => {
      const verbTokens = tokens("The team combines their data. The program consoles the caller.");
      expect(verbTokens.find(token => token.word === "combines")?.phoneme).toBe("kəmˈbaɪnz");
      expect(verbTokens.find(token => token.word === "consoles")?.phoneme).toBe("kənˈsoʊɫz");

      const nounTokens = tokens("The farmers operate combines. The game consoles are popular.");
      expect(nounTokens.find(token => token.word === "combines")?.phoneme).toBe("ˈkɑmbaɪnz");
      expect(nounTokens.find(token => token.word === "consoles")?.phoneme).toBe("ˈkɑnsoʊɫz");
    });
  });

})();

// Original suite: en-contextual-verb-stem.test.ts
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

  describe.each([false, true])("contextual verb stems before silent-e restoration (disableDict=%s)", disableDict => {
    const target = (sentence: string, word: string, custom?: string) => {
      const processor = new EnglishG2P({ disableDict });
      if (custom) processor.addPronunciation(word, custom);
      const tokens = createPhonemizer({ processors: [processor] }).phonemize(sentence, {
        language: "en-US", returnArray: true,
      });
      return tokens.find(token => token.word === word)!.phoneme;
    };

    it.each([
      "She is reading the book.",
      "She enjoys reading books.",
    ])("uses the vouched verb stem in %s", sentence => {
      expect(reading(target(sentence, "reading"))).toEqual(reading("ˈɹidɪŋ"));
    });

    it.each([
      "The reading public responded.",
      "They teach the fundamentals of reading.",
      "They study mathematics and excel in reading.",
    ])("retains the verb stem when the ing form is nominal in %s", sentence => {
      expect(reading(target(sentence, "reading"))).toEqual(reading("ˈɹidɪŋ"));
    });

    it("keeps citation and plural ing forms consistent", () => {
      expect(reading(target("reading", "reading"))).toEqual(reading("ˈɹidɪŋ"));
      expect(reading(target("readings", "readings"))).toEqual(reading("ˈɹidɪŋz"));
    });

    it("uses the common process verb reading in derived forms and keeps the noun", () => {
      expect(reading(target("They are processing the applications.", "processing")))
        .toEqual(reading("ˈpɹɑsɛsɪŋ"));
      expect(reading(target("The processed applications were archived.", "processed")))
        .toEqual(reading("ˈpɹɑsɛst"));
      expect(reading(target("They process the applications.", "process")))
        .toEqual(reading("ˈpɹɑsɛs"));
      expect(reading(target("The process was completed.", "process")))
        .toEqual(reading("ˈpɹɑsɛs"));
    });

    it("preserves a capitalized geographical reading", () => {
      expect(reading(target("They stopped in Reading yesterday.", "Reading"))).toEqual(reading("ˈɹɛdɪŋ"));
    });

    it("preserves a direct caller pronunciation", () => {
      expect(reading(target("She is reading the book.", "reading", "ˈzɛŋ"))).toEqual(reading("ˈzɛŋ"));
    });
  });

})();

// Original suite: en-contracted-auxiliaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { inferVerbForm, simplePOSTagger } = __suiteModule2;

  const contractions = ["he's", "she’s", "it‘s", "that's", "there's", "what's", "who's", "I'm", "you're", "we’re", "they're"];

  describe("Contracted auxiliaries retain their grammatical role", () => {
    it.each(contractions)("recognizes %s before a predicate", auxiliary => {
      expect(simplePOSTagger.tagWord("learned", [auxiliary, "a"]).pos).toBe("!V");
      expect(inferVerbForm({ words: [auxiliary, "read", "it"], index: 1 })).toBe("participle");
    });

    it.each(["Hammond's", "teachers'", "Mary’s"])("preserves the possessive in %s record", possessive => {
      expect(simplePOSTagger.tagWord("record", [possessive, "was"]).pos).toBe("N");
      expect(inferVerbForm({ words: [possessive, "read", "bus"], index: 1 })).toBeUndefined();
    });

    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    it.each([
      ["He's read the book.", "read", "ɹɛd"],
      ["She's already read the book.", "read", "ɹɛd"],
      ["They're read aloud.", "read", "ɹɛd"],
      ["He's learned a lot.", "learned", "ɫɝnd"],
      ["They're present today.", "present", "ˈpɹɛzənt"],
      ["He's an invalid.", "invalid", "ˈɪnvəɫəd"],
      ["That's invalid.", "invalid", "ˌɪnˈvæɫəd"],
    ])("selects the predicate in %s", (sentence, word, ipa) => {
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
    });

    it("keeps adjective, noun and verb controls in the same sentence", () => {
      const tokens = api.phonemize("That's invalid on Hammond's record; they record it.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.filter(t => t.word === "record").map(t => t.phoneme))
        .toEqual(["ˈɹɛkɝd", "ɹɪˈkɔɹd"]);
    });

    it("does not introduce a whole-target homograph lookup in rules mode", () => {
      const rules = new EnglishG2P({ disableDict: true });
      const api = createPhonemizer({ processors: [rules] });
      const token = api.phonemize("He's read it.", { language: "en-US", returnArray: true })
        .find(t => t.word === "read")!;
      expect(token.phoneme).toBe(rules.predict("read", "en-US", "!V"));
    });
  });

})();
