// Original suite: en-determined-ing-modifier.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  describe("determined participial noun modifiers", () => {
    it.each([
      ["It was an engrossing read.", "read", "ɹid"],
      ["It was a crackling read.", "read", "ɹid"],
      ['It was a "crackling read.', "read", "ɹid"],
      ["An interesting read can present a problem.", "read", "ɹid"],
      ["An interesting read can present a problem.", "present", "pɹɪˈzɛnt"],
      ["The following read the notice.", "read", "ɹid"],
      ["The building permits the work.", "permits", "pɝˈmɪts"],
    ])("preserves the syntactic reading in %s", (sentence, word, ipa) => {
      const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-determined-nominal-tail.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { simplePOSTagger } = __suiteModule2;

  const api = createPhonemizer({ processors: [new EnglishG2P()] });

  function readToken(sentence: string) {
    return api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word.toLowerCase() === "read")?.phoneme;
  }

  test("a base-form homograph after a closed modifier chain is the noun head", () => {
    const sentence = "Fade to Black is perhaps Flinn's second-best known realistic novel and a frequent high school required read.";
    const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
    const index = words.findIndex(word => word.toLowerCase() === "read");

    expect(simplePOSTagger.tagWord("read", [words[index - 1], words[index + 1]], { words, index }, true).pos).toBe("N");
    expect(readToken(sentence)).toBe("ɹid");
    expect(readToken("A frequent school required read was assigned.")).toBe("ɹid");
  });

  test.each([
    ["The recording artist read that book yesterday.", "ɹɛd"],
    ["I read a required book yesterday.", "ɹɛd"],
    ["They may read the required book.", "ɹid"],
    ["A very well read scholar spoke.", "ɹɛd"],
    ["The required book was read yesterday.", "ɹɛd"],
  ])("preserves verb and participial controls in %s", (sentence, expected) => {
    expect(readToken(sentence)).toBe(expected);
  });

})();

// Original suite: en-diamond-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("diamond lexical stress", () => {
    it.each([false, true])("keeps the sourced noun/adjective root and derived compound (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("diamond", "en-US", "NN")).toBe("ˈdaɪmənd");
      expect(engine.predict("diamond", "en-US", "JJ")).toBe("ˈdaɪmənd");
      expect(engine.predict("diamonds", "en-US", "NNS")).toBe("ˈdaɪməndz");
      expect(engine.predict("diamondback", "en-US", "NN")).toBe("daɪəˈmɑndbæk");
      expect(engine.predict("diameter", "en-US", "NN")).toBe("daɪˈæmətɝ");
      expect(engine.predict("diary", "en-US", "NN")).toBe("ˈdaɪɝi");


      const tokens = englishTokens(engine, "The diamond has a diamond-shaped face.");
      expect(tokens.find(token => token.word.toLowerCase() === "diamond")?.phoneme).toBe("ˈdaɪmənd");
    });
  });

})();

// Original suite: en-diminutive-ie.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("diminutive ie with a vouched digraph root (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["cookie", "ˈkʊki"], ["cookies", "ˈkʊkiz"],
      ["bookie", "ˈbʊki"], ["bookies", "ˈbʊkiz"],
      ["rookie", "ˈɹʊki"], ["rookies", "ˈɹʊkiz"],
      ["goodie", "ˈɡʊdi"], ["goodies", "ˈɡʊdiz"],
      ["sweetie", "ˈswiti"], ["spookie", "ˈspuki"], ["kookie", "ˈkuki"],
      ["ladies", "ˈɫeɪdiz"], ["navies", "ˈneɪviz"], ["allie", "ˈæɫi"],
      ["book", "ˈbʊk"], ["cook", "ˈkʊk"], ["noncookie", "nɑnˈkʊki"],
      ["steadier", "ˈstɛdiɝ"], ["steadiest", "ˈstɛdiəst"],
    ])("retains the root or neighboring frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains singular and plural roots after lexical eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["cookie", "cookies", "bookie", "bookies", "rookie", "rookies", "goodie", "goodies"]) delete access.dictionary[word];
      expect(evicted.predict("cookie")).toBe("ˈkʊki");
      expect(evicted.predict("cookies")).toBe("ˈkʊkiz");
      expect(evicted.predict("bookie")).toBe("ˈbʊki");
      expect(evicted.predict("rookie")).toBe("ˈɹʊki");
      expect(evicted.predict("goodie")).toBe("ˈɡʊdi");
    });
    it("honors a custom complete root", () => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      delete access.dictionary.cookie;
      custom.addPronunciation("cook", "K UW1 K");
      expect(custom.predict("cookie")).toBe("ˈkuki");
    });
    it("preserves an ambiguous rhotic name and bound verb frame", () => {
      expect(engine.predict("fourier")).toBe(disableDict ? "ˈfaʊɹiɝ" : "ˈfʊɹieɪ");
      expect(engine.predict("belie")).toBe(disableDict ? "bɪˈɫi" : "bɪˈɫaɪ");
    });
    it("retains noun, adjective and finite verb controls in prose", () => {

      const tokens = englishTokens(engine, "The clever rookie will cook a cookie.");
      expect(tokens.find(t => t.word === "rookie")?.phoneme).toBe("ˈɹʊki");
      expect(tokens.find(t => t.word === "cookie")?.phoneme).toBe("ˈkʊki");
      expect(tokens.find(t => t.word === "cook")?.phoneme).toBe("kʊk");
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    });
  });

})();

// Original suite: en-diminutive-let.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Silent-e stems before diminutive -let (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });

    it.each([
      ["bracelet", "ˈbɹeɪsɫət"], ["platelet", "ˈpɫeɪtɫət"],
      ["platelets", "ˈpɫeɪtɫəts"], ["wavelet", "ˈweɪvɫət"],
      ["notelet", "ˈnoʊtɫət"], ["capelet", "ˈkeɪpɫət"], ["codelet", "ˈkoʊdɫət"],
    ])("retains the stem and weak suffix in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it("retains the stem through plural and possessive composition", () => {
      expect(engine.predict("bracelets")).toMatch(/^ˈbɹeɪsɫ[əɪ]ts$/);
      expect(engine.predict("wavelet's")).toBe("ˈweɪvɫəts");
    });

    it.each(["outlet", "inlet"])("retains the strong free-word rime in %s", word => {
      expect(engine.predict(word)).toMatch(/ɫɛt$/);
    });
    it.each(["violet", "wallet", "bullet", "toilet"])("does not invent a diminutive stem for %s", word => {
      expect(engine.trace(word).path).not.toBe("morphology");
    });

    it.each([
      ["The bracelet looks fine.", "bracelet", /^ˈbɹeɪsɫət$/],
      ["Wavelet filtering is useful.", "Wavelet", /^ˈweɪvɫət$/],
      ["The violet light faded.", "violet", /^ˈvaɪəɫ[əɪ]t$/],
      ["They let the water through the inlet.", "let", /^ɫɛt$/],
    ] as const)("preserves noun/adjective/verb readings in %s", (sentence, word, ipa) => {
      const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)!;
      expect(target.phoneme).toMatch(ipa);
    });
  });

})();

// Original suite: en-diphthong-nasal-voicing.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("diphthong before weak nasal, rules=%s", disableDict => {
    it("voices the licensed rimes and their inflections", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["poison", "ˈpɔɪzən"], ["poisons", "ˈpɔɪzənz"], ["poisoned", "ˈpɔɪzənd"], ["poisoning", "ˈpɔɪzənɪŋ"],
        ["raisin", "ˈɹeɪzɪn"],
      ]) expect(engine.predict(word)).toBe(ipa);
      for (const word of ["raisins", "raisin's", "raisins'"]) expect(engine.predict(word)).toMatch(/^ˈɹeɪz[əɪ]nz$/);
    });
    it("keeps the neighboring voiceless rimes", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const word of ["bison", "basin", "mason", "noisome"])
        expect(engine.predict(word)).toMatch(/s/);
    });
    it("preserves complete caller overrides", () => {
      for (const stem of ["poison", "raisin"]) {
        const engine = new EnglishG2P({ disableDict });
        const dictionary = { ...Reflect.get(engine, "dictionary") };
        delete dictionary[stem + "s"];
        Reflect.set(engine, "dictionary", dictionary);
        engine.addPronunciation(stem, "ˈzɛŋ");
        expect(engine.predict(stem)).toBe("ˈzɛŋ");
        expect(engine.predict(stem + "s")).toBe("ˈzɛŋz");
      }
    });
    it("retains noun, adjective and verb sentence context", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ["The poison is here.", "poison", "ˈpɔɪzən"], ["They poison the water.", "poison", "ˈpɔɪzən"],
        ["The noisome air is here.", "noisome", "ˈnɔɪsəm"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-direct-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const stripStress = (ipa: string): string => ipa.replace(/[ˈˌ]/g, "");

  describe("direct- root pronunciation", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["direct", "daɪɹɛkt"],
      ["directed", "daɪɹɛktɪd"],
      ["directing", "daɪɹɛktɪŋ"],
      ["director", "daɪɹɛktɝ"],
      ["direction", "daɪɹɛkʃən"],
      ["directory", "daɪɹɛktɝi"],
      ["directive", "daɪɹɛktɪv"],
      ["directorial", "daɪɹəkˈtɔɹiəɫ"],
    ])("retains the PRICE root in %s", (word, expected) => {
      expect(stripStress(rules.predict(word, "en-US")!)).toBe(stripStress(expected));
    });

    it.each([
      ["indirect", "ɪndɪɹɛkt"],
      ["redirect", "ɹidɪɹɛkt"],
      ["discrete", "dɪskɹit"],
    ])("leaves the neighboring %s reading intact", (word, expected) => {
      expect(stripStress(rules.predict(word, "en-US")!)).toBe(expected);
    });

    it("keeps stress placement in the unstressed direct- root derivatives", () => {
      expect(rules.predict("direct", "en-US")).toBe("daɪˈɹɛkt");
      expect(rules.predict("director", "en-US")).toBe("daɪˈɹɛktɝ");
      expect(rules.predict("direction", "en-US")).toBe("daɪˈɹɛkʃən");
    });

    it("stresses parallel two-syllable -rect roots on the second syllable", () => {
      expect(rules.predict("correct", "en-US")).toBe("kɝˈɛkt");
      expect(rules.predict("erect", "en-US")).toBe("ɪˈɹɛkt");
      expect(rules.predict("directs", "en-US")).toBe("daɪˈɹɛkts");
      expect(rules.predict("erects", "en-US")).toBe("ɪˈɹɛkts");
    });

    it("preserves the root reading across adjective, verb, and noun sentence contexts", () => {
      const phonemizer = createPhonemizer({ processors: [rules] });
      const tokens = phonemizer.phonemize(
        "Take a direct route. They direct traffic. The director gave clear direction.",
        { language: "en-US", returnArray: true },
      );
      const direct = tokens.filter(token => token.word === "direct").map(token => token.phoneme);
      expect(direct).toHaveLength(2);
      expect(direct.map(stripStress)).toEqual(["daɪɹɛkt", "daɪɹɛkt"]);
      expect(tokens.find(token => token.word === "director")?.phoneme).toBe("daɪˈɹɛktɝ");
      expect(tokens.find(token => token.word === "direction")?.phoneme).toBe("daɪˈɹɛkʃən");
    });
  });

})();

// Original suite: en-dis-checked-stems.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("checked roots after dis- (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["dispatch", /^dɪ(?:ˈs|sˈ)pætʃ$/],
      ["distract", /^dɪ(?:ˈs|sˈ)tɹækt$/],
      ["distend", /^dɪ(?:ˈs|sˈ)tɛnd$/],
    ])("preserves the root vowel and stressed nucleus in %s", (word, ipa) => {
      // Both mark placements identify the same stressed root nucleus.
      expect(engine.predict(word)).toMatch(ipa);
    });
    it.each([
      ["dispack", "dɪsˈpæk"], ["dismesh", "dɪsˈmɛʃ"], ["discheck", "dɪsˈtʃɛk"],
      ["discount", "ˈdɪskaʊnt"], ["distant", "ˈdɪstənt"], ["legal", "ˈɫiɡəɫ"],
    ])("renders the class or preserves a neighboring frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains roots in inflections after exception eviction", () => {
      const fresh = new EnglishG2P({ disableDict });
      const access = fresh as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["dispatch", "dispatches", "dispatched", "dispatching", "distract", "distracts", "distracting"]) delete access.dictionary[word];
      for (const word of ["dispatch", "dispatches", "dispatched", "dispatching"]) expect(fresh.predict(word)).toMatch(/pætʃ/);
      for (const word of ["distract", "distracts", "distracting"]) expect(fresh.predict(word)).toMatch(/tɹækt/);
    });
    it("preserves noun, adjective and verb readings in connected prose", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The distant reader will dispatch the letter.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "distant")?.phoneme).toBe("ˈdɪstənt");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "dispatch")?.phoneme).toMatch(/^dɪ(?:ˈs|sˈ)pætʃ$/);
      const noun = api.phonemize("The dispatch was clear.", { language: "en-US", returnArray: true });
      expect(noun.find(t => t.word === "dispatch")?.phoneme).toMatch(/^dɪ(?:ˈs|sˈ)pætʃ$/);
    });
  });

})();

// Original suite: en-do-es-allomorph.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnG2P = __suiteModule0.default;
  const __suiteModule1: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { isFunctionWord } = __suiteModule1;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;

  describe("the vowel change in do + third-person -es", () => {
    const rules = new EnG2P({ disableDict: true });

    it.each([
      ["does", "ˈdʌz"],
      ["redoes", "ɹiˈdʌz"],
      ["undoes", "ənˈdʌz"],
    ])("derives %s as %s", (word, expected) => {
      expect(rules.predict(word, "en")).toBe(expected);
    });

    it("preserves the root and unrelated -oes controls", () => {
      expect(rules.predict("do", "en")).toBe("ˈdu");
      expect(rules.predict("dodo", "en")).toBe("ˈdoʊdoʊ");
      expect(rules.predict("do-si-do", "en")).toMatch(/doʊ$/);
      expect(rules.predict("colorado", "en")).toMatch(/doʊ$/);
      expect(rules.predict("doing", "en")).toBe("ˈduɪŋ");
      expect(rules.predict("done", "en")).toBe("ˈdʌn");
      expect(rules.predict("to", "en")).toBe("ˈtu");
      expect(rules.predict("goes", "en")).toBe("ˈɡoʊz");
    });

    it("uses doe + plural -s when context marks does as a noun", () => {
      expect(isFunctionWord("does", "N")).toBe(false);
      expect(isFunctionWord("does", "V")).toBe(true);
      expect(rules.predict("does", "en", "N")).toBe("doʊz");
    });

    it("keeps the verb weak in sentence context", () => {
      const api = createPhonemizer({ processors: [new EnG2P()] });
      const token = api.phonemize("She does the work.", { language: "en-US", returnArray: true })
        .find(({ word }) => word === "does");
      expect(token?.phoneme).toBe("dəz");
    });
  });

})();

// Original suite: en-duces-morphology.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("verbal -duce inflections", () => {
    const processor = new EnglishG2P({ disableDict: true });

    it("uses the verb stem for the productive third-person form of produce", () => {
      expect(processor.predict("produces", "en-US")).toBe("pɹəˈdusəz");
      expect(processor.trace("produces", "en-US").path).toBe("morphology");
    });

    it("keeps the noun and neighboring verbal -duce forms distinct", () => {
      expect(processor.predict("produce", "en-US")?.replace(/[ˈˌ]/g, "")).toBe("pɹoʊdus");
      expect(processor.predict("reduces", "en-US")).toBe("ɹəˈdusəz");
      expect(processor.predict("introduces", "en-US")).toBe("ˌɪntɹəˈdusəz");
      expect(processor.predict("deduces", "en-US")).toBe("dɪˈdusəz");
      expect(processor.predict("seduces", "en-US")).toBe("sɪˈdusəz");
    });

    it("applies the weak pro- root to regular -s forms without a noun homograph", () => {
      expect(processor.predict("proceeds", "en-US")).toBe("pɹəˈsidz");
      expect(processor.predict("provides", "en-US")).toBe("pɹəˈvaɪdz");
      expect(processor.predict("productives", "en-US")).toBe("pɹəˈdʌktɪvz");
      expect(processor.predict("promotionals", "en-US")).toBe("pɹəˈmoʊʃənəɫz");
      expect(processor.predict("progresses", "en-US")).toBe("ˈpɹɑˌɡɹɛsəz");
      expect(processor.predict("processes", "en-US")).toBe("ˈpɹɑˌsɛsəz");
    });
  });

})();

// Original suite: en-ductory-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("Latinate -ductory retains its -duct root stress", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("matches the standard stress and weak intro- vowel in introductory", () => {
      expect(rules.predict("introductory", "en-US")).toBe("ˌɪntɹəˈdʌktɝi");
    });

    it("carries the corrected root through -ly and leaves introduction stable", () => {
      expect(rules.predict("introductorily", "en-US")).toBe("ˌɪntɹəˈdʌktɝəɫi");
      expect(rules.predict("introduction", "en-US")).toBe("ˌɪntɹəˈdʌkʃən");
    });

    it.each([
      ["laboratory", "ɫəˈbɔɹəˌtɔɹi"],
      ["satisfactory", "ˌsætɪsˈfæktɝi"],
      ["territory", "ˈtɛɹəˌtɔɹi"],
    ])("does not change the neighboring -tory pattern in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the shipped dictionary pronunciation of introductory", () => {
      expect(new EnglishG2P().predict("introductory", "en-US")).toBe("ˌɪntɹəˈdʌktɝi");
    });
  });

})();

// Original suite: en-during-reference.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const dictionary = require("../data/en/dict.json");

  describe("Cambridge US reading of during", () => {
    it("serves the US /ʊr/ reading in isolation and in a sentence", () => {
      const engine = new EnglishG2P();
      const api = createPhonemizer({ processors: [engine] });

      expect(dictionary.during).toBe("ˈdʊɹɪŋ");
      expect(engine.predict("during", "en-US")).toBe("ˈdʊɹɪŋ");
      const tokens = api.phonemize("We met during the war.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "during")?.phoneme).toBe("ˈdʊɹɪŋ");
    });

    it("keeps the source-backed reading on the dictionary-disabled route", () => {
      const rules = new EnglishG2P({ disableDict: true });
      expect(rules.predict("during", "en-US")).toBe("ˈdʊɹɪŋ");
      const api = createPhonemizer({ processors: [rules] });
      const tokens = api.phonemize("We met during the war.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "during")?.phoneme).toBe("ˈdʊɹɪŋ");
    });

    it("uses the regular edit + -ed reading on the dictionary-disabled route", () => {
      const rules = new EnglishG2P({ disableDict: true });
      expect(rules.predict("edited", "en-US", "V")).toBe("ˈɛdɪtɪd");
      const api = createPhonemizer({ processors: [rules] });
      const tokens = api.phonemize("They edited the paper.", { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === "edited")?.phoneme).toBe("ˈɛdɪtɪd");
      expect(rules.predict("editing", "en-US", "V")).toBe("ˈɛdɪtɪŋ");
    });

    it("keeps the longer credit root ahead of the embedded edit spelling", () => {
      const rules = new EnglishG2P({ disableDict: true });
      expect(rules.predict("credit", "en-US", "N")).toBe("ˈkɹɛdɪt");
      expect(rules.predict("credited", "en-US", "V")).toBe("ˈkɹɛdɪtɪd");
      expect(rules.predict("crediting", "en-US", "V")).toBe("ˈkɹɛdɪtɪŋ");
      expect(rules.predict("accredited", "en-US", "V")).toBe("əˈkɹɛdɪtɪd");
      expect(rules.predict("accrediting", "en-US", "V")).toBe("əˈkɹɛdɪtɪŋ");
    });

    it.each([
      ["duress", "ˈdʊɹɛs"],
      ["durable", "ˈdʊɹəbəɫ"],
      ["duration", "ˌdʊˈɹeɪʃən"],
    ])("leaves neighboring du+r words unchanged: %s", (word, ipa) => {
      expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-ea-rime-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("ea rime boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["breath", "death", "deaf", "breathy", "breathless", "deathbed"])("%s preserves the checked vowel before f/th", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɛ[θf]/);
    });
    test.each(["heath", "sheath", "wreath", "beneath"])("%s keeps the high vowel outside the voiced-stop onset frame", word => {
      expect(g2p.predict(word, "en")).toMatch(/iθ/);
    });
    test.each(["break", "great", "breaking", "backbreaking", "lawbreaking", "greater", "greatest", "greatly", "greatness", "breaker"])("%s preserves the stop+r lengthened rime", word => {
      expect(g2p.predict(word, "en")).toMatch(/eɪ[kt]/);
    });
    test.each(["freak", "creak", "bleak", "beak", "peak"])("%s keeps the ordinary ea reading", word => {
      expect(g2p.predict(word, "en")).toMatch(/ik/);
    });
    test.each(["breathe", "breathing", "breather"])("%s preserves its sounded-e verb stem", word => {
      expect(g2p.predict(word, "en")).toMatch(/ið/);
    });
  });

  test.each(["breath", "death", "deaf", "break", "breaking", "great"])("%s survives the public API", word => {
    expect(toIPA(word)).toMatch(/ɛ[θf]|eɪ[kt]/);
  });

})();

// Original suite: en-ea-sury-suffix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])("keeps weak sure-to-sury palatalization after ea (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const w of ["treasury", "treasuries", "treasury's", "nontreasury", "treasuryless"]) delete dictionary[w];
   Reflect.set(e, "dictionary", dictionary);
   for (const w of ["treasury", "treasuries", "treasury's", "nontreasury", "treasuryless"]) expect(e.predict(w)).toContain("ʒɝi");
   for (const w of ["accessory", "nursery", "Esarey"]) expect(e.predict(w)).not.toContain("ʒ");
   expect(e.predict("insure")).toContain("ʃ");
   if (!disableDict) expect(e.predict("usury")).toContain("z");
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["The treasury was empty.", "The treasury official spoke."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "treasury")?.phoneme).toContain("ʒɝi");
  });
  test("keeps caller-owned sure-to-sury stems", () => {
   const e = new EnglishG2P({ disableDict: true });
   e.addPronunciation("treasury", "ˈtɛst");
   expect(e.predict("treasuries")).toBe("ˈtɛsts");
  });

})();

// Original suite: en-ea-weak-v-rimes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("ea before weak v rimes (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["heaven", "ˈhɛvən"], ["heavy", "ˈhɛvi"], ["leaven", "ˈɫɛvən"],
      ["heavenly", "ˈhɛvənɫi"], ["heavier", "ˈhɛviɝ"], ["heaviest", "ˈhɛviəst"],
      ["heavily", "ˈhɛvəɫi"], ["leavened", "ˈɫɛvənd"], ["leavening", "ˈɫɛvənɪŋ"],
    ])("retains the native root in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([
      ["beaver", "ˈbivɝ"], ["weaver", "ˈwivɝ"], ["heaving", "ˈhivɪŋ"],
      ["leaving", "ˈɫivɪŋ"], ["weaving", "ˈwivɪŋ"],
      ["cleavenger", "ˈkɫivɪndʒɝ"], ["eavenson", "ˈivɪnsən"],
    ])("preserves a different spelling boundary in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains derivations after all family exceptions are evicted", () => {
      const fresh = new EnglishG2P({ disableDict });
      const access = fresh as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["heavy", "heaven", "leaven", "heavier", "heaviest", "heavily", "heavenly", "leavened", "leavening"]) delete access.dictionary[word];
      expect(fresh.predict("heavily")).toBe("ˈhɛvəɫi");
      expect(fresh.predict("heavier")).toBe("ˈhɛviɝ");
      expect(fresh.predict("heaviest")).toBe("ˈhɛviəst");
      expect(fresh.predict("heavenly")).toBe("ˈhɛvənɫi");
      expect(fresh.predict("leavened")).toBe("ˈɫɛvənd");
      expect(fresh.predict("leavening")).toBe("ˈɫɛvənɪŋ");
      expect(fresh.predict("unheavenly")).toMatch(/ˈhɛvənɫi$/);
      expect(fresh.predict("unleavened")).toMatch(/ˈɫɛvənd$/);
      expect(fresh.predict("heavenless")).toBe("ˈhɛvənɫəs");
    });
    it("preserves noun, adjective and verb controls in sentences", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The heavy reader will work.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "heavy")?.phoneme).toBe("ˈhɛvi");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
      const verb = api.phonemize("They leaven the bread.", { language: "en-US", returnArray: true });
      expect(verb.find(t => t.word === "leaven")?.phoneme).toBe("ˈɫɛvən");
    });
  });

  it.each([
    ["Beaven", "ˈbivən"], ["Leavy", "ˈɫivi"], ["Peavy", "ˈpivi"],
  ])("retains existing lexical name coverage for %s in the default API", (word, ipa) => {
    expect(new EnglishG2P().predict(word)).toBe(ipa);
  });

})();

// Original suite: en-ear-stop-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("ear before a written stop (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["heart", "ˈhɑɹt"], ["hearts", "ˈhɑɹts"], ["heart's", "ˈhɑɹts"],
      ["hearty", "ˈhɑɹti"], ["heartier", "ˈhɑɹtiɝ"], ["heartiest", "ˈhɑɹtiəst"],
      ["earth", "ˈɝθ"], ["earthy", "ˈɝθi"], ["dearth", "ˈdɝθ"],
      ["care", "ˈkɛɹ"], ["bare", "ˈbɛɹ"], ["start", "ˈstɑɹt"],
      ["barren", "ˈbæɹən"], ["barring", "ˈbɑɹɪŋ"],
      ["hear", "ˈhɪɹ"], ["beard", "ˈbɪɹd"],
    ])("preserves the rime or neighboring frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each(["hearted", "heartening", "unhearted", "halfhearted", "heartthrob", "braveheart"])(
      "retains the owned root in %s without claiming the complete word", word => {
        expect(engine.predict(word)).toContain("hɑɹt");
      },
    );
    it("retains roots and plurals after target eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["heart", "hearts", "heart's", "hearty"]) delete access.dictionary[word];
      expect(evicted.predict("heart")).toBe("ˈhɑɹt");
      expect(evicted.predict("hearts")).toBe("ˈhɑɹts");
      expect(evicted.predict("hearty")).toBe("ˈhɑɹti");
    });
    it("honors a supplied root and plural", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("heart", "HH IH1 R T");
      expect(custom.predict("heart")).toBe("ˈhɪɹt");
      expect(custom.predict("hearts")).toBe("ˈhɪɹts");
    });
    it("preserves adjective, noun and finite verb controls in prose", () => {

      const tokens = englishTokens(engine, "The hearty reader will start.");
      expect(tokens.find(t => t.word === "hearty")?.phoneme).toBe("ˈhɑɹti");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "start")?.phoneme).toBe("stɑɹt");
    });
  });

  it.each([["Enyeart", "ˈɛnjɝt"], ["McBrearty", "məkˈbɹɪɹti"], ["hearten", "ˈhɑɹtən"]])(
    "preserves existing default source coverage in %s after rebuild", (word, ipa) => {
      expect(new EnglishG2P().predict(word)).toBe(ipa);
    },
  );

})();

// Original suite: en-ebook-coverage.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("the dictionary covers ebook and its regular plural", () => {
    const engine = new EnglishG2P();
    expect(engine.predict("ebook")).toBe("ˈiˌbʊk");
    expect(engine.predict("ebooks")).toBe("ˈiˌbʊks");
    expect(engine.predict("estate")).toBe("ɪˈsteɪt");
    expect(engine.predict("escape")).toBe("ɪˈskeɪp");
    const api = createPhonemizer({ processors: [engine] });
    for (const [sentence, word, expected] of [
      ["The ebook was available.", "ebook", "ˈiˌbʊk"],
      ["The ebooks were available.", "ebooks", "ˈiˌbʊks"],
    ]) {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(expected);
    }
    const verb = api.phonemize("They book the room.", { language: "en-US", returnArray: true });
    expect(verb.find(token => token.word === "book")?.phoneme).toBe(engine.predict("book", "en-US", "V"));
  });

})();

// Original suite: en-ect-pos-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/syllabify") = require("../src/en/syllabify");
  const { assignStress, syllabify } = __suiteModule2;

  // Collect's telephone adjective/adverb shares the verb reading; its prayer noun differs.
  // https://dictionary.cambridge.org/us/dictionary/english/collect
  // https://www.collinsdictionary.com/us/dictionary/english/collect
  describe.each([false, true])("bound -ect stress with caller POS (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([
      ["N", "ˈkɑɫɛkt"], ["V", "kəˈɫɛkt"], ["ADJ", "kəˈɫɛkt"], ["ADV", "kəˈɫɛkt"],
    ])("distinguishes collect as %s", (pos, ipa) => {
      expect(engine.predict("collect", "en-US", pos)).toBe(ipa);
    });
    test.each(["connect", "confect"])("places primary on the verb root in %s", word => {
      expect(engine.predict(word, "en-US", "V")).toBe(word === "connect" ? "kəˈnɛkt" : "kənˈfɛkt");
    });
    test("preserves noun, adjective and verb neighbors in full sentences", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The collect is short. They will collect stamps and connect wires. The active artist will print reports.", { language: "en-US", returnArray: true });
      expect(tokens.filter(t => t.word === "collect").map(t => t.phoneme)).toEqual(["ˈkɑɫɛkt", "kəˈɫɛkt"]);
      expect(tokens.find(t => t.word === "connect")?.phoneme).toBe("kəˈnɛkt");
      expect(tokens.find(t => t.word === "active")?.phoneme).toBe("ˈæktɪv");
      expect(tokens.find(t => t.word === "print")?.phoneme).toBe("pɹɪnt");
    });
    test("recognizes the noun before a regular past predicate", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Her favorite collect ended the service.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "collect")?.phoneme).toBe("ˈkɑɫɛkt");
    });
    test.each([["The report read shocked the committee.", "read", "ɹɛd"], ["The skill learned changed the course.", "learned", "ɫɝnd"]])("preserves the reduced passive in %s", (text, word, ipa) => {
      const tokens = createPhonemizer({ processors: [engine] }).phonemize(text, { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
    test("keeps noun-sense ambiguity distinct from a grammatical NP", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("His former lead formed the group.", { language: "en-US", returnArray: true });
      expect(engine.tagWord("lead", { prev: "former", next: "formed", sentence: { words: ["His", "former", "lead", "formed", "the", "group"], index: 2 } }).pos).toBe("!V");
      if (!disableDict) expect(tokens.find(t => t.word === "lead")?.phoneme).toBe("ɫid");
    });
    test("keeps the supplied reading above POS-sensitive spelling rules", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("collect", "ˈzɛŋ");
      expect(owned.predict("collect", "en-US", "N")).toBe("ˈzɛŋ");
      expect(owned.predict("collect", "en-US", "V")).toBe("ˈzɛŋ");
    });
    test("recovers prefixed roots after exception eviction", () => {
      expect(engine.predict("disconnect")?.replace(/ˌ/g, "")).toBe("dɪskəˈnɛkt");
      expect(engine.predict("uncollected")).toBe(disableDict ? "ˌʌnkəˈɫɛktɪd" : "ənkəˈɫɛktɪd");
    });
    test("recognizes a verb association inside a mixed POS entry", () => {
      expect(engine.predict("contents", "en-US", "V")).toBe("kənˈtɛnts");
      expect(engine.predict("contents", "en-US", "N")).toBe("ˈkɑntɛnts");
    });
    test.each([["She made a collect call.", "ADJ"], ["They call collect.", "ADV"]])("uses known %s POS without changing neighboring tokens", (text, pos) => {
      const known = new EnglishG2P({ disableDict }), tag = known.tagWord.bind(known);
      known.tagWord = (word, context) => word === "collect" ? { pos, confidence: 1 } : tag(word, context);
      const options = { language: "en-US", returnArray: true as const };
      const automatic = createPhonemizer({ processors: [engine] }).phonemize(text, options);
      const annotated = createPhonemizer({ processors: [known] }).phonemize(text, options);
      expect(annotated.find(t => t.word === "collect")?.phoneme).toBe("kəˈɫɛkt");
      expect(annotated.filter(t => t.word !== "collect")).toEqual(automatic.filter(t => t.word !== "collect"));
    });
  });

  test("applies the same stress distinction to novel bound-root spellings", () => {
    for (const word of ["conzect", "complect"]) {
      const slots = syllabify(word);
      expect(assignStress(slots, word, "N")).toBe(0);
      expect(assignStress(slots, word, "V")).toBe(1);
    }
  });

  test("preserves a fixed morphology stress instruction above caller POS", () => {
    const engine = new EnglishG2P({ disableDict: true });
    expect(engine.predict("connected")).toBe("kəˈnɛktɪd");
    expect(engine.predict("collecting")).toBe("kəˈɫɛktɪŋ");
    expect(engine.trace("collect", "en-US", "N").path).toBe("rules");
    expect(engine.trace("collect", "en-US", "V").path).toBe("rules");
  });

})();

// Original suite: en-ectivity-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("-ect roots retain DRESS before -ivity without changing neighboring suffixes", () => {
    const g = new EnglishG2P({ disableDict: true });
    for (const word of ["connectivity", "objectivity", "selectivity", "subjectivity", "collectivity", "affectivity", "electivity"]) {
      for (const pos of [undefined, "N", "ADJ", "V"]) expect(g.predict(word, "en-US", pos)).toMatch(/ɛk[ˈˌ]?tɪv/);
    }
    expect(g.predict("connect")).toBe("kəˈnɛkt");
    expect(g.predict("connective")).toBe("kəˈnɛktɪv");
    expect(g.predict("activity")).toBe("ækˈtɪvəti");
    expect(g.predict("productivity")).toBe("ˌpɹɑdəkˈtɪvəti");
    for (const word of ["connectivities", "selectivities", "collectivities"]) expect(g.predict(word)).toMatch(/ɛk[ˈˌ]?tɪv/);
    for (const disableDict of [false, true]) {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("collectivity", "ˈtʊɡ");
      expect(custom.predict("collectivity")).toBe("ˈtʊɡ");
      expect(custom.predict("collectivities")).toBe("ˈtʊɡz");
    }
    const p = createPhonemizer({ processors: [g] });
    for (const language of ["en-US", "en-GB"]) {
      const sentence = "Objectivity and connectivity improve selectivity.";
      for (const word of ["Objectivity", "connectivity", "selectivity"]) {
        expect(p.phonemize(sentence, { language, returnArray: true }).find(t => t.word === word)?.phoneme).toMatch(/ɛk[ˈˌ]?tɪv/);
      }
    }
  });

})();

// Original suite: en-either-neither-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("either/neither ei-before-th reading, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it("uses an attested US /aɪ/ variant in both paired forms", () => {
      expect(engine.predict("either", "en")).toBe("ˈaɪðɝ");
      expect(engine.predict("neither", "en")).toBe("ˈnaɪðɝ");
    });

    it("keeps other ei and th spellings in their established environments", () => {
      for (const [word, ipa] of [
        ["weight", "ˈweɪt"],
        ["height", "ˈhaɪt"],
        ["their", "ˈðɛɹ"],
        ["theory", "ˈθiɝi"],
      ]) expect(engine.predict(word, "en")).toBe(ipa);
    });
  });

  it("keeps the ei-before-ther reading in full sentences", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    for (const [sentence, word, ipa] of [
      ["Either route works.", "Either", "ˈaɪðɝ"],
      ["Neither option fits.", "Neither", "ˈnaɪðɝ"],
    ]) {
      const tokens = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme).toBe(ipa);
    }
  });

})();
