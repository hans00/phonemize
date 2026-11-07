// Original suite: en-greek-theta-and-loan-plurals.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("Greek theta and loan plurals (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each(["theater", "theatre", "theorem", "theory", "theoretical", "theology", "therapeutic", "therapist", "therapy", "thermal", "thermodynamic"])("%s keeps the voiceless Greek onset", word => {
      expect(g2p.predict(word, "en")).toMatch(/^[ˈˌ]?θ/);
    });
    test.each(["therapy", "therapist", "therapeutic"])("%s does not read its initial syllable as the article", word => {
      expect(g2p.predict(word, "en")).toMatch(/θɛɹ/);
    });
    test.each(["the", "them", "themselves", "there", "therefore", "thenceforth"])("%s retains its voiced function-word onset", word => {
      expect(g2p.predict(word, "en")).toMatch(/^[ˈˌ]?ð/);
    });
    test.each(["mother", "brother", "weather", "father", "further", "other"])("%s preserves its medial voiced dental", word => {
      expect(g2p.predict(word, "en")).toMatch(/ð/);
    });
    test.each(["she", "he"])("%s retains its pronoun vowel", word => {
      expect(g2p.predict(word, "en")).toMatch(/i$/);
    });
    test("skis derives from the attested ski loan stem", () => {
      expect(g2p.predict("skis", "en")).toMatch(/skiz$/);
    });
    test.each(["this", "his", "has", "yes"])("%s is not a false vowel-stem plural", word => {
      expect(g2p.predict(word, "en")).not.toMatch(/(?:aɪ|eɪ|i)z$/);
    });
    test("yes keeps its voiceless final sibilant instead of borrowing the ye stem", () => {
      expect(g2p.predict("yes", "en")).toBe("ˈjɛs");
    });
    test.each([["this", "ˈðɪs"], ["his", "ˈhɪz"], ["has", "ˈhæz"], ["gas", "ˈɡæs"], ["photos", "ˈfoʊtoʊz"], ["videos", "ˈvɪdioʊz"]])(
      "%s retains its independent final sibilant", (word, ipa) => {
        expect(g2p.predict(word, "en")).toBe(ipa);
      },
    );
    test.each([["types", "ˈtaɪps"], ["bytes", "ˈbaɪts"]])("%s keeps its silent-e stem", (word, ipa) => {
      expect(g2p.predict(word, "en")).toBe(ipa);
    });
  });

  test.each(["therapy", "therapeutic", "theoretical", "skis"])("%s is preserved through the public API", word => {
    expect(toIPA(word)).toMatch(word === "skis" ? /skiz/ : /θ/);
  });

})();

// Original suite: en-greek-us-and-lateral-able.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test.each([false, true])(
    "keeps productive voiced Greek roots after eviction (rules=%s)",
    (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(engine, "dictionary") };
      for (const w of ["music", "museum", "valuable", "invaluable"]) delete d[w];
      Reflect.set(engine, "dictionary", d);
      for (const [word, ipa] of [
        ["music", "ˈmjuzɪk"],
        ["musics", "ˈmjuzɪks"],
        ["music's", "ˈmjuzɪks"],
        ["nonmusic", "nɑnˈmjuzɪk"],
        ["allmusic", "ˈɔɫˌmjuzɪk"],
        ["allmusical", "ˈɔɫˌmjuzɪkəɫ"],
        ["musical", "ˈmjuzɪkəɫ"],
        ["musically", "ˈmjuzɪkɫi"],
        ["musicality", "ˌmjuzɪˈkæɫəti"],
        ["musician", "mjuˈzɪʃən"],
        ["musicians", "mjuˈzɪʃənz"],
        ["nonmuseum", "nɑnˈmjuziəm"],
        ["valuable", "ˈvæɫjəbəɫ"],
        ["valuables", "ˈvæɫjəbəɫz"],
        ["valuably", "ˈvæɫjəbɫi"],
        ["invaluable", "ˌɪnˈvæɫjəbəɫ"],
        ["invaluably", "ˌɪnˈvæɫjəbɫi"],
        ["nonvaluable", "nɑnˈvæɫjəbəɫ"],
      ])
        expect(engine.predict(word)).toBe(ipa);
      // Supplied surname rimes and other u-able allomorphs keep their prior phones.
      expect(engine.predict("musick")).toBe("ˈmjusɪk");
      expect(engine.predict("arguable")).toBe(
        disableDict ? "ˈɑɹɡuəbəɫ" : "ˈɑɹɡjuəbəɫ",
      );
      expect(engine.predict("issuable")).toBe(
        disableDict ? "ˈɪsuəbəɫ" : "ˈɪʃuəbəɫ",
      );
      const api = createPhonemizer({ processors: [engine] });
      expect(
        api
          .phonemize("They value valuable music.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "valuable")?.phoneme,
      ).toBe("ˈvæɫjəbəɫ");
    },
  );
  test("preserves caller root and target ownership", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("value", "ˈzɛmp");
    expect(e.predict("valuable")).toBe("ˈzɛmpəbəɫ");
    e.addPronunciation("valuable", "ˈkɛmp");
    expect(e.predict("valuable")).toBe("ˈkɛmp");
  });

})();

// Original suite: en-greek-y-and-yr.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

  describe.each([false, true])("Greek roots and closed yr (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const say = (word: string) => clean(g2p.predict(word)!);

    test("phys- retains lax y and voices its s through derived forms", () => {
      for (const word of ["physics", "physical", "physically", "physicist", "physiology", "physiologic", "physician", "physique"])
        expect(say(word)).toMatch(/f[ɪə]z/);
    });

    test("dys- before a consonant retains its short unvoiced prefix", () => {
      for (const word of ["dyslexia", "dyslexic", "dysfunction", "dyspeptic", "dysplasia", "dysphoric"])
        expect(say(word)).toMatch(/^dɪs/);
      for (const word of ["dyson", "dysan", "dynamic"])
        expect(say(word)).toMatch(/^daɪ/);
    });

    test("a closed yr coda takes NURSE", () => {
      for (const word of ["myrtle", "myrrh", "myrna", "myrmidon", "smyrna", "byrd", "byrne"])
        expect(say(word)).toMatch(/[mb]ɝ/);
    });

    test("transparent joins recover the same root after exception eviction", () => {
      for (const word of ["physicians", "unphysician", "nonphysician"])
        expect(say(word)).toMatch(/fəzɪʃən/);
      for (const word of ["dyslexics", "nondyslexic", "undyslexic"])
        expect(say(word)).toMatch(/dɪsɫɛksɪk/);
      for (const word of ["myrtles", "myrrhs", "myrrhing"])
        expect(say(word)).toMatch(/mɝ/);
      for (const word of ["antiques", "uniques", "techniques", "nonunique", "preunique", "uniquewise"])
        expect(say(word)).toMatch(/ik/);
      expect(g2p.predict("physicalwise")).toMatch(/^ˈfɪz/);
      expect(g2p.predict("semiphysical")).toMatch(/ˈfɪz/);
      expect(g2p.predict("multiphysical")).toMatch(/ˈfɪz/);
      expect(g2p.predict("postpique")).toMatch(/poʊst/);
    });

    test("open yr and y+r+silent-e keep their existing checked or PRICE vowel", () => {
      for (const word of ["lyric", "tyranny", "pyrrhic"])
        expect(say(word)).toMatch(/[ɫpt]ɪɹ/);
      for (const word of ["lyre", "pyre", "tyre"])
        expect(say(word)).toMatch(/[ɫpt]aɪ/);
    });

    test("final French -ique has FLEECE while other que rimes retain their vowels", () => {
      for (const word of ["antique", "unique", "technique", "mystique", "oblique", "pique"])
        expect(say(word)).toMatch(/ik$/);
      expect(say("plaque")).toMatch(/æk$/);
      expect(say("mosque")).toMatch(/ɑsk$/);
      expect(say("torque")).toMatch(/ɔɹk$/);
    });
  });

})();

// Original suite: en-guarant-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("the bound guarant- root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["guarantee", "ˌɡɛɹənˈti"],
      ["guaranteed", "ˌɡɛɹənˈtid"],
      ["guaranty", "ˈɡɛɹənti"],
    ])("uses the checked /ɛɹ/ vowel in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["guard", "ˈɡɑɹd"],
      ["guardian", "ˈɡɑɹdiən"],
    ])("preserves the /ɑɹ/ guard-family control %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-guitar-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("lexical guitar root and controls", () => {
    it.each([false, true])("keeps the attested root and composes its inflections (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("guitar", "en-US", "NN")).toBe("ɡɪˈtɑɹ");
      expect(engine.predict("guitars", "en-US", "NNS")).toBe("ɡɪˈtɑɹz");
      expect(engine.predict("guitarist", "en-US", "NN")).toBe("ɡɪˈtɑɹɪst");
      expect(engine.predict("guitarists", "en-US", "NNS")).toBe("ɡɪˈtɑɹɪsts");
      expect(engine.predict("sitar", "en-US", "NN")).toBe(disableDict ? "ˈsɪtɝ" : "sɪˈtɑɹ");
      expect(engine.predict("altar", "en-US", "NN")).toBe("ˈɔɫtɝ");
    });

    it("retains stress and controls in a sentence", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
      const tokens = api.phonemize("The guitarist played guitars beside the altar and sitar.", {
        language: "en-US", returnArray: true,
      });
      const read = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(read("guitarist")).toBe("ɡɪˈtɑɹɪst");
      expect(read("guitars")).toBe("ɡɪˈtɑɹz");
      expect(read("altar")).toBe("ˈɔɫtɝ");
      expect(read("sitar")).toBe("ˈsɪtɝ");
    });
  });

})();

// Original suite: en-hard-g-before-in-compounds.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const rules = new EnglishG2P({ disableDict: true });
  const segmental = (word: string) => (rules.predict(word) ?? "").replace(/[ˈˌ]/g, "");

  describe("hard g across a closed compound boundary before -in", () => {
    it.each([
      ["login", "ɫɔɡɪn"],
      ["plugin", "pɫʌɡɪn"],
      ["logins", "ɫɔɡɪnz"],
      ["plugins", "pɫʌɡɪnz"],
    ])("retains the free stem pronunciation in %s", (word, expected) => {
      expect(segmental(word)).toBe(expected);
    });

    it.each([
      ["begin", "bɪˈɡɪn"],
      ["virgin", "ˈvɝdʒɪn"],
      ["origin", "ˈɔɹɪdʒɪn"],
      ["margin", "ˈmɑɹdʒɪn"],
    ])("preserves the lexical soft-g reading of %s", (word, expected) => {
      expect(rules.predict(word)).toBe(expected);
    });
  });

})();

// Original suite: en-hard-g-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("en- before native hard-g roots (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["engage", "ɛnˈɡeɪdʒ"], ["engaged", "ɛnˈɡeɪdʒd"],
      ["engaging", "ɛnˈɡeɪdʒɪŋ"], ["engagement", "ɛnˈɡeɪdʒmənt"],
    ])("preserves the prefix boundary in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it.each([
      ["Engert", "ˈɛŋɡɝt"], ["Engquist", "ˈɛŋkwɪst"],
    ])("preserves a different spelling environment in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each(["English", "England", "congress"])("retains internal assimilation in %s", word => {
      expect(engine.predict(word)).toContain("ŋɡ");
    });
    it("retains assimilation before k", () => {
      expect(engine.predict("think")).toContain("ŋk");
    });

    it("keeps derivations correct if the now rule-exact stem is evicted", () => {
      const fresh = new EnglishG2P({ disableDict });
      const internal = fresh as unknown as { dictionary: Record<string, string> };
      internal.dictionary = { ...internal.dictionary };
      delete internal.dictionary.engage;
      for (const word of ["disengage", "unengage", "nonengage"]) {
        expect(fresh.predict(word)).toMatch(/nˈɡeɪdʒ$/);
      }

      expect(fresh.predict("engager")).toBe("ɛnˈɡeɪdʒɝ");
      expect(fresh.predict("engagers")).toBe("ɛnˈɡeɪdʒɝz");
      expect(fresh.predict("engaging")).toBe("ɛnˈɡeɪdʒɪŋ");
      expect(fresh.predict("engages")).toMatch(/^ɛnˈɡeɪdʒ[əɪ]z$/);
      expect(fresh.predict("engagement")).toBe("ɛnˈɡeɪdʒmənt");
    });

    it("uses the strong -age frame for another OOV agent", () => {
      expect(engine.predict("enrager")).toBe("ɛnˈɹeɪdʒɝ");
    });
    it.each(["manager", "packager"])("does not tense weak -age in %s", word => {
      expect(engine.predict(word)).toMatch(/[əɪ]dʒɝ$/);
      expect(engine.predict(word)).not.toContain("eɪdʒ");
    });

    it("preserves adjective, noun and verb controls in a full sentence", () => {

      const tokens = englishTokens(engine, "The engaged reader will work.");
      expect(tokens.find(t => t.word === "engaged")?.phoneme).toBe("ɛnˈɡeɪdʒd");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();

// Original suite: en-he-pronoun-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("the he pronoun rule stays within its syllable context", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const phonemizer = createPhonemizer({ processors: [rules] });

    it.each([
      ["he", "ˈhi"],
      ["herald", "ˈhɛɹəɫd"],
      ["heron", "ˈhɛɹən"],
      ["heresy", "ˈhɛɹəsi"],
      ["hero", "ˈhiɹoʊ"],
      ["heroic", "hiˈɹoʊɪk"],
    ])("renders %s without borrowing the pronoun vowel", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });

    it("keeps the her- vowel in noun and verb sentence contexts", () => {
      const tokens = phonemizer.phonemize("A herald said that they heralded the heron.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.filter(token => ["herald", "heralded", "heron"].includes(token.word))
        .map(token => token.phoneme)).toEqual(["ˈhɛɹəɫd", "ˈhɛɹəɫdɪd", "ˈhɛɹən"]);
    });
  });

})();

// Original suite: en-heterorganic-initialism.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("onsetless heterorganic nasal codas (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["amd", "ˌeɪˌɛmˈdi"], ["amd's", "ˌeɪˌɛmˈdiz"],
      ["omg", "ˌoʊˌɛmˈdʒi"], ["anb", "ˌeɪˌɛnˈbi"],
      ["and", "ˈænd"], ["end", "ˈɛnd"], ["ink", "ˈɪŋk"],
      ["limb", "ˈɫɪm"], ["ism", "ˈɪzəm"],
    ])("handles %s without changing licensed native codas", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps caller-supplied pronunciation before letter spelling", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("amd", "ˈzɛŋ");
      expect(custom.predict("amd")).toBe("ˈzɛŋ");
      expect(custom.predict("amd's")).toBe("ˈzɛŋz");
    });
    it("preserves noun, adjective and verb controls in a sentence", () => {
      const api = createPhonemizer({ processors: [engine] });
      const result = api.phonemize("The clever reader will work at amd.", {
        language: "en-US", returnArray: true,
      });
      for (const [word, ipa] of [["amd", "ˌeɪˌɛmˈdi"], ["clever", "ˈkɫɛvɝ"],
        ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
        expect(result.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-hiatus-and-posttonic-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("hiatus and posttonic boundaries (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("uy retains its diphthong before an agent ending", () => {
      for (const word of ["buyer", "buyer's", "guyer"])
        expect(segments(word)).toMatch(/aɪɝ/);
      for (const word of ["buy", "guy"])
        expect(segments(word)).toMatch(/aɪ$/);
    });

    test("eo+r keeps the strong soft-g contraction and Greek hiatus", () => {
      for (const word of ["george", "georgia", "georgian"])
        expect(segments(word)).toMatch(/^dʒɔɹdʒ/);
      for (const word of ["theory", "theorist", "theorize"])
        expect(segments(word)).toMatch(/^θiɝ/);
    });

    test("checked l/r before a weak affricate contracts final ia", () => {
      for (const word of ["belgian", "borgia", "georgia"])
        expect(segments(word)).toMatch(/dʒə[nz]?$/);
      for (const word of ["collegial", "theologian", "hemiplegia"])
        expect(segments(word)).toContain("dʒiə");
    });

    test("tient coalesces without removing the diet/client hiatus", () => {
      for (const word of ["patient", "impatient", "quotient"])
        expect(segments(word)).toMatch(/ʃənt$/);
      expect(segments("patient")).toMatch(/^peɪ/);
      expect(segments("diet")).toContain("aɪət");
      expect(segments("client")).toContain("aɪənt");
    });

    test("posttonic ci/fi before d-vowel reduces without weakening a closed id", () => {
      for (const word of ["accident", "incidence", "incident"])
        expect(segments(word)).toContain("səd");
      for (const word of ["confidence", "confident"])
        expect(segments(word)).toContain("fəd");
      expect(segments("rancid")).toMatch(/sɪd$/);
      expect(segments("incidental")).toContain("sɪd");
    });

    test("posttonic d+i before cine keeps a weak medial nucleus", () => {
      for (const word of ["medicine", "medicine's", "genemedicine"])
        expect(segments(word)).toContain("dəs");
      expect(segments("judiciary")).toContain("dɪ");
    });

    test("r+ea retains a final weak nucleus while native digraphs stay single", () => {
      for (const word of ["area", "urea"])
        expect(segments(word)).toMatch(/iə$/);
      expect(segments("cream")).toMatch(/im$/);
      expect(segments("really")).toMatch(/iɫi$/);
    });

    test("a complete vowel+r+ly rime stays whole while y remains an onset", () => {
      expect(segments("early")).toBe("ɝɫi");
      for (const word of ["yearly", "nearly", "dearly", "clearly"])
        expect(segments(word)).toMatch(/ɪɹɫi$/);
      expect(segments("yearly")).toMatch(/^j/);
    });
  });

})();

// Original suite: en-hiatus-rimes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("hiatus rimes (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("nasal gu keeps its glide across root and suffix boundaries", () => {
      for (const word of ["penguin", "penguins", "languid", "languidly"])
        expect(g2p.predict(word)).toMatch(/ŋɡwə[nd]/);
      for (const word of ["lingua", "linguistic", "linguistics", "monolingual", "monolingually"])
        expect(g2p.predict(word)!.replace(/[ˈˌ]/g, "")).toContain("ŋɡw");
      expect(g2p.predict("language")).toMatch(/ŋɡ?wɪdʒ$/);
    });

    test("a split ate tail retains the preceding u nucleus", () => {
      for (const word of ["situate", "situates", "actuate", "actuates", "punctuate"])
        expect(g2p.predict(word)).toContain("tʃu");
      for (const word of ["attenuate", "continuation", "insinuate"])
        expect(g2p.predict(word)).toContain("nju");
      for (const word of ["evaluate", "devaluate", "revaluation"])
        expect(g2p.predict(word)).toContain("ɫju");
    });

    test("a Latin eum coda retains its two vowel nuclei", () => {
      for (const word of ["museum", "museums", "mausoleum", "mausoleums", "lyceum", "petroleum"])
        expect(g2p.predict(word)).toMatch(/iəmz?$/);
      expect(g2p.predict("neuter")).not.toContain("iə");
      expect(g2p.predict("deuce")).not.toContain("iə");
    });
  });

  test("the nasal-gu frame preserves neighbouring silent-u and ine classes", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    for (const word of ["sanguine", "linguine", "vanguard", "vanguilder", "unguile", "conguide"])
      expect(g2p.predict(word)).not.toContain("ɡw");
  });

})();

// Original suite: en-homograph-pos-union.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge lists the disyllabic EDUCATED reading as an adjective.
  describe("homograph readings shared across lexical POS", () => {
    it.each(["N", "ADJ"])("selects the OLD reading of aged for %s", pos => {
      expect(new EnglishG2P().predict("aged", "en-US", pos)).toBe("ˈeɪdʒɪd");
    });
    it.each(["V", "VBD", "!V"])("selects the AGE reading of aged for %s", pos => {
      expect(new EnglishG2P().predict("aged", "en-US", pos)).toBe("eɪdʒd");
    });
    it.each(["N", "ADJ"])("selects the educated reading for %s", pos => {
      expect(new EnglishG2P().predict("learned", "en-US", pos)).toBe("ˈɫɝnɪd");
    });
    it.each(["V", "VBD", "!V"])("preserves the complementary reading for %s", pos => {
      expect(new EnglishG2P().predict("learned", "en-US", pos)).toBe("ɫɝnd");
    });
    it("keeps the verb in full prose and the caller's direct override", () => {
      const engine = new EnglishG2P();
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize("They learned the lesson.", { language: "en-US", returnArray: true }).find(t => t.word === "learned")?.phoneme).toBe("ɫɝnd");
      engine.addPronunciation("learned", "ˈzɛŋ");
      expect(engine.predict("learned", "en-US", "ADJ")).toBe("ˈzɛŋ");
    });
    it("selects old-age vs of-age readings in full sentences", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P()] });
      const old = api.phonemize("Moumita takes good care of aged Pranabendu.", { language: "en-US", returnArray: true });
      const ofAge = api.phonemize("The students were aged 18.", { language: "en-US", returnArray: true });
      const verb = api.phonemize("She has aged well.", { language: "en-US", returnArray: true });

      expect(old.find(token => token.word === "aged")?.phoneme).toBe("ˈeɪdʒɪd");
      expect(ofAge.find(token => token.word === "aged")?.phoneme).toBe("eɪdʒd");
      expect(verb.find(token => token.word === "aged")?.phoneme).toBe("eɪdʒd");
    });
  });

  it("keeps an independently sourced noun/base reading distinct from the participle", () => {
    const engine = new EnglishG2P();
    for (const pos of ["N", "V"]) expect(engine.predict("read", "en-US", pos)).toBe("ɹid");
    for (const pos of ["ADJ", "VBD"]) expect(engine.predict("read", "en-US", pos)).toBe("ɹɛd");
  });

  it("uses an explicitly selected lexical adjective reading in rules-only mode", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("wicked", "en-US", "ADJ")).toBe("ˈwɪkɪd");
    expect(rules.predict("wicked", "en-US", "V")).toBe("wɪkt");
    const api = createPhonemizer({ processors: [rules] });
    const adjective = api.phonemize("The wicked witch cackled.", { language: "en-US", returnArray: true });
    const verb = api.phonemize("They wicked the dog.", { language: "en-US", returnArray: true });
    expect(adjective.find(token => token.word === "wicked")?.phoneme).toBe("ˈwɪkɪd");
    expect(verb.find(token => token.word === "wicked")?.phoneme).toBe("wɪkt");
  });

  it("selects the dictionary-sourced certificate noun and verb in full sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const noun = api.phonemize("The certificate expired.", { language: "en-US", returnArray: true });
    const verb = api.phonemize("The board will certificate the copy.", { language: "en-US", returnArray: true });

    expect(noun.find(token => token.word === "certificate")?.phoneme).toBe("sɝˈtɪfəkət");
    expect(verb.find(token => token.word === "certificate")?.phoneme).toBe("sɝˈtɪfɪkeɪt");
  });

})();

// Original suite: en-how-rime.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("MOUTH in the initial independent <h> + <ow> rime", () => {
    const g2p = new EnglishG2P({ disableDict: true });

    it.each([
      ["how", "ˈhaʊ"],
      ["somehow", "ˈsʌmˌhaʊ"],
      ["anyhow", "ˈɛniˌhaʊ"],
      ["however", "ˌhaʊˈɛvɝ"],
    ])("uses MOUTH for %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["show", "ˈʃoʊ"],
      ["snow", "ˈsnoʊ"],
      ["throw", "ˈθɹoʊ"],
      ["slow", "ˈsɫoʊ"],
    ])("preserves GOAT in neighboring <ow> rimes: %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the independent onset in Howard and howitzer", () => {
      expect(g2p.predict("Howard", "en-US")).toBe("ˈhaʊɝd");
      expect(g2p.predict("howitzer", "en-US")).toMatch(/^haʊ/);
    });

    it("keeps the bound rime in sentence context", () => {

      const tokens = englishTokens(g2p, "How, somehow, did the show end?");
      expect(tokens.find(token => token.word === "How")?.phoneme).toBe("haʊ");
      expect(tokens.find(token => token.word === "somehow")?.phoneme).toContain("ˌhaʊ");
      expect(tokens.find(token => token.word === "show")?.phoneme).toBe("ʃoʊ");
    });
  });

})();

// Original suite: en-iac-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");
  const stripSecondary = (ipa: string | null | undefined) => ipa?.replace(/ˌ/g, "");

  describe.each([false, true])("final -iac hiatus (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test.each([
      ["cardiac", "ˈkɑɹdiæk"], ["celiac", "ˈsiɫiæk"],
      ["iliac", "ˈɪɫiæk"], ["zodiac", "ˈzoʊdiæk"], ["insomniac", "ɪnˈsɑmniæk"],
    ])("keeps the full final vowel in %s across caller POS", (word, expected) => {
      for (const pos of [undefined, "N", "ADJ", "V"]) expect(stripSecondary(engine.predict(word, "en-US", pos))).toBe(expected);
    });

    test.each([
      ["The cardiac patient recovered.", "cardiac", "ˈkɑɹdiæk"],
      ["Celiac disease requires care.", "Celiac", "ˈsiɫiæk"],
      ["The zodiac is ancient.", "zodiac", "ˈzoʊdiæk"],
      ["The insomniac slept.", "insomniac", "ɪnˈsɑmniæk"],
    ])("preserves the reading in %s", (sentence, word, expected) => {
      expect(stripSecondary(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme)).toBe(expected);
    });

    test("keeps the same vowel in plural and prefixed forms", () => {
      expect(stripStress(engine.predict("celiacs", "en-US"))).toBe("siɫiæks");
      expect(stripStress(engine.predict("non-cardiac", "en-US"))).toMatch(/kɑɹdiæk$/);
    });

    test("preserves unrelated hiatus and a caller pronunciation", () => {
      expect(engine.predict("mosaic", "en-US")).toContain("eɪ");
      expect(engine.predict("diacritic", "en-US")).toContain("daɪ");
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("celiac", "Z AE1 P");
      expect(custom.predict("celiac", "en-US")).toBe("ˈzæp");
    });
  });

})();

// Original suite: en-ic-plural-stem.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("-ic plural stem (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test("retains the singular's final vowel in its regular plural", () => {
      expect(engine.predict("republics", "en-US", "N")).toBe("ɹiˈpʌbɫɪks");
      expect(engine.predict("publics", "en-US", "N")).toBe("ˈpʌbɫɪks");
      expect(engine.predict("diacritics", "en-US", "N")).toBe("ˌdaɪəˈkɹɪtɪks");
      expect(engine.predict("telepathics", "en-US", "N")).toBe("ˌtɛɫəˈpæθɪks");
      expect(engine.predict("classicals", "en-US", "N")).toBe("ˈkɫæsɪkəɫz");
      expect(engine.predict("basic", "en-US", "ADJ")).toBe("ˈbeɪsɪk");
      expect(api.phonemize("The republics publish basic laws.", { language: "en-US" })).toBe("ðə ɹiˈpʌbɫɪks ˈpʌbɫɪʃ ˈbeɪsɪk ɫɔz.");
    });

    test("preserves an explicitly supplied root", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("public", "ˈpəblək");
      expect(custom.predict("publics", "en-US", "N")).toBe("ˈpʌbɫəks");
    });
  });

})();

// Original suite: en-ical-plural-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak-vowel contrast in regular -icals plurals", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps the rule-supported vowel in chemicals after its stem leaves the table", () => {
      expect(rules.predict("chemicals", "en-US")).toBe("ˈkɛmɪkəɫz");
    });

    it.each([
      ["biologicals", "baɪəˈɫɑdʒɪkəɫz"],
      ["cyclicals", "ˈsaɪkɫɪkəɫz"],
      ["evangelicals", "ˌivænˈdʒɛɫɪkəɫz"],
      ["agrochemicals", "ˌæɡɹoʊˈkɛməkəɫz"],
    ])("preserves the existing reading of %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps dictionary-backed chemicals unchanged", () => {
      expect(new EnglishG2P().predict("chemicals", "en-US")).toBe("ˈkɛmɪkəɫz");
    });

    it("preserves the lexical stress pattern while correcting the weak vowel", () => {
      expect(new EnglishG2P().predict("hierarchicals", "en-US")).toBe("ˌhaɪˈɹɑɹkɪkəɫz");
    });
  });

})();

// Original suite: en-ical-reference.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("Cambridge US unstressed -ical references", () => {
    const words = [
      ["biblical", "ˈbɪbɫɪkəɫ"],
      ["chemical", "ˈkɛmɪkəɫ"],
      ["clinical", "ˈkɫɪnɪkəɫ"],
      ["hypothetical", "ˌhaɪpəˈθɛtɪkəɫ"],
      ["medical", "ˈmɛdɪkəɫ"],
      ["numerical", "nuˈmɛɹɪkəɫ"],
      ["practical", "ˈpɹæktɪkəɫ"],
      ["radical", "ˈɹædɪkəɫ"],
      ["typical", "ˈtɪpɪkəɫ"],
    ] as const;

    it.each([false, true])("uses the independently verified /ɪ/ forms (rules=%s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of words) expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps political as a separate /ə/ class on both pronunciation routes", () => {
      expect(new EnglishG2P().predict("political", "en-US")).toBe("pəˈɫɪtəkəɫ");
      expect(new EnglishG2P({ disableDict: true }).predict("political", "en-US")).toBe("pəˈɫɪtəkəɫ");
    });
  });

})();

// Original suite: en-ican-reference.test.ts
(() => {
  const dictionary = require("../data/en/dict.json");
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("Cambridge US -ican reference corrections", () => {
    it.each([
      ["american", "əˈmɛɹɪkən"],
      ["african", "ˈæfɹɪkən"],
    ])("stores the Cambridge US reference for %s", (word, ipa) => {
      expect(dictionary[word as keyof typeof dictionary]).toBe(ipa);
    });

    it.each([
      ["american", "əˈmɛɹɪkən"],
      ["african", "ˈæfɹɪkən"],
    ])("keeps the general rule-path reading of %s", (word, ipa) => {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the -ican vowel in Vatican as a paired control", () => {
      expect(new EnglishG2P().predict("vatican", "en-US")).toBe("ˈvætɪkən");
      expect(new EnglishG2P({ disableDict: true }).predict("vatican", "en-US")).toBe("ˈvætɪkən");
    });
  });

})();

// Original suite: en-icity-structure.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("-icity preserves a coda vowel only if the competing analysis disagrees", () => {
    for (const disableDict of [false, true]) {
      const g = new EnglishG2P({ disableDict });
      for (const pos of [undefined, "N", "ADJ", "V"]) {
        expect(g.predict("toxicity", "en-US", pos)).toBe("tɑkˈsɪsəti");
        expect(g.predict("plasticity", "en-US", pos)).toBe("pɫæsˈtɪsəti");
        expect(g.predict("complicity", "en-US", pos)).toBe("kəmˈpɫɪsəti");
      }
      expect(g.predict("toxicities")).toBe("tɑkˈsɪsətiz");
      expect(g.predict("plasticities")).toBe("pɫæsˈtɪsətiz");
      expect(g.predict("publicity")).toMatch(/^pə/);
      expect(g.predict("simplicity")).toMatch(/^sɪm/);
      expect(g.predict("complicit")).toMatch(/^kəm/);
      expect(g.predict("object", "en-US", "N")).toBe("ˈɑbdʒɛkt");
      expect(g.predict("object", "en-US", "ADJ")).toBe("ˈɑbdʒɛkt");
      expect(g.predict("object", "en-US", "V")).toBe("əbˈdʒɛkt");
      const p = createPhonemizer({ processors: [g] });
      for (const [sentence, expected] of [["The object is plastic.", "ˈɑbdʒɛkt"], ["They object to toxicity.", "əbˈdʒɛkt"]]) {
        expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "object")?.phoneme).toBe(expected);
      }
      for (const language of ["en-US", "en-GB"]) {
        const tokens = p.phonemize("Toxicity and plasticity do not establish complicity.", { language, returnArray: true });
        expect(tokens.find(t => t.word === "Toxicity")?.phoneme).toMatch(/kˈsɪs/);
        expect(tokens.find(t => t.word === "plasticity")?.phoneme).toMatch(/æsˈtɪs/);
        expect(tokens.find(t => t.word === "complicity")?.phoneme).toMatch(/^kəm/);
      }
    }
  });

  test("caller-supplied adjective vowels compose through -icity and plural", () => {
    for (const disableDict of [false, true]) {
      const g = new EnglishG2P({ disableDict });
      g.addPronunciation("toxic", "ˈtɛksɪk");
      expect(g.predict("toxicity")).toBe("tɛkˈsɪsəti");
      expect(g.predict("toxicities")).toBe("tɛkˈsɪsətiz");
    }
  });

})();

// Original suite: en-idential-morphology.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("-idential morphology (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    test("preserves the -ident base and moves primary stress to -ential", () => {
      expect(g2p.predict("presidential")).toBe(disableDict ? "ˌpɹɛzɪˈdɛnʃəɫ" : "ˌpɹɛzəˈdɛnʃəɫ");
      expect(g2p.predict("residential")).toBe("ˌɹɛzɪˈdɛnʃəɫ");
      expect(g2p.predict("confidential")).toBe("ˌkɑnfəˈdɛnʃəɫ");
    });

    test("keeps the base readings and established inflections intact", () => {
      expect(g2p.predict("president")).toContain("pɹɛz");
      expect(g2p.predict("resident")).toContain("ɹɛz");
      expect(g2p.predict("confident")).toContain("kɑnf");
      expect(g2p.predict("residentials")).toContain("ɹɛzɪ");
      expect(g2p.predict("confidentially")).toContain("kɑnfə");
    });

    test("does not extend the stress shift to neighboring -dential words", () => {
      expect(g2p.predict("prudential")).toBe("pɹuˈdɛnʃəɫ");
      expect(g2p.predict("providential")).toBe(disableDict ? "ˌpɹɑvɪˈdɛnʃəɫ" : "ˌpɹɑvəˈdɛnʃəɫ");
      expect(g2p.predict("credential")).toBe(disableDict ? "kɹɪˈdɛnʃəɫ" : "kɹəˈdɛnʃəɫ");
    });

    test("preserves sentence tokenization and neighboring noun/verb readings", () => {

      const tokens = englishTokens(g2p, "The president announced a presidential plan. A resident requested residential housing. The manager kept confidential records.");
      expect(tokens.find(token => token.word === "presidential")?.phoneme).toBe(disableDict ? "ˌpɹɛzɪˈdɛnʃəɫ" : "ˌpɹɛzəˈdɛnʃəɫ");
      expect(tokens.find(token => token.word === "residential")?.phoneme).toBe("ˌɹɛzɪˈdɛnʃəɫ");
      expect(tokens.find(token => token.word === "confidential")?.phoneme).toBe("ˌkɑnfəˈdɛnʃəɫ");
      expect(tokens.find(token => token.word === "announced")?.phoneme).toBe("əˈnaʊnst");
      expect(tokens.filter(token => token.word === "president")).toHaveLength(1);
      expect(tokens.filter(token => token.word === "resident")).toHaveLength(1);
    });
  });

})();
