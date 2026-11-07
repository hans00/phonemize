// Original suite: en-numbered-subject-objects.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("numbered subjects and stacked objects, rules=%s", disableDict => {
    it("uses named or determiner-backed subjects with bounded adjective stacks", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ["Ukraine uses five-digit numeric postal codes.", "uses", "ˈjuzəz"],
        ["Alice uses four-part digital recordings.", "uses", "ˈjuzəz"],
        ["Line 2 uses four-car trains.", "uses", "ˈjuzəz"],
        ["The model twenty five uses four-part records.", "uses", "ˈjuzəz"],
        ["Phase 3 records four-part digital readings.", "records", "ɹɪˈkɔɹdz"],
        ["Zone 2 permits four-part recordings.", "permits", "pɝˈmɪts"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("keeps adjective-led wind nouns and numbered noun phrases", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const sentence of ["Strong winds uprooted trees.", "High winds also disrupted communications.", "Sustained winds reached forty-eight knots."])
        expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "winds")?.phoneme).toBe("wɪndz");
      expect(api.phonemize("The two uses were clear.", { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toBe("ˈjusəz");
    });
    it("retains both verb and noun occurrences around number expansion", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const tokens = api.phonemize("Line 2 uses four-car trains; the two uses were clear.", { language: "en-US", returnArray: true });
      expect(tokens.filter(t => t.word === "uses").map(t => t.phoneme)).toEqual(["ˈjuzəz", "ˈjusəz"]);
      expect(tokens.filter(t => t.word === "two")).toHaveLength(2);
    });
  });

})();

// Original suite: en-nurse-agent-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("NURSE agent boundary (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["merger", "ˈmɝdʒɝ"], ["mergers", "ˈmɝdʒɝz"], ["merger's", "ˈmɝdʒɝz"],
      ["merge", "ˈmɝdʒ"], ["merging", "ˈmɝdʒɪŋ"], ["merged", "ˈmɝdʒd"],
      ["unmerged", "ənˈmɝdʒd"], ["urger", "ˈɝdʒɝ"], ["purger", "ˈpɝdʒɝ"], ["surger", "ˈsɝdʒɝ"],
      ["burger", "ˈbɝɡɝ"], ["burgers", "ˈbɝɡɝz"], ["Berger", "ˈbɝɡɝ"],
      ["Kruger", "ˈkɹuɡɝ"], ["tiger", "ˈtaɪɡɝ"], ["larger", "ˈɫɑɹdʒɝ"], ["charger", "ˈtʃɑɹdʒɝ"],
    ])("retains the root and neighboring frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains roots and plurals after target eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["merger", "mergers", "merger's"]) delete access.dictionary[word];
      expect(evicted.predict("merger")).toBe("ˈmɝdʒɝ");
      expect(evicted.predict("mergers")).toBe("ˈmɝdʒɝz");
      expect(evicted.predict("merger's")).toBe("ˈmɝdʒɝz");
    });
    it("honors a caller's complete stem", () => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      delete access.dictionary.merger;
      custom.addPronunciation("merge", "M ER1 G");
      expect(custom.predict("merger")).toBe("ˈmɝɡɝ");
    });
    it("preserves noun, adjective and finite verb controls in prose", () => {

      const tokens = englishTokens(engine, "The larger merger will work.");
      expect(tokens.find(t => t.word === "larger")?.phoneme).toBe("ˈɫɑɹdʒɝ");
      expect(tokens.find(t => t.word === "merger")?.phoneme).toBe("ˈmɝdʒɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

  it.each([["Ferger", "ˈfɝɡɝ"], ["Jerger", "ˈdʒɝɡɝ"], ["Boerger", "ˈbɔɹɡɝ"]])(
    "preserves the existing default source reading of %s after rebuild", (word, ipa) => {
      expect(new EnglishG2P().predict(word)).toBe(ipa);
    },
  );

})();

// Original suite: en-nx-price-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;
  test.each([false, true])("voices nx before a PRICE hiatus after eviction (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const word of Object.keys(dictionary)) if (/anxiet/.test(word)) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary);
   expect(parseIpa(e.predict("anxiety")!)).toEqual(parseIpa("æŋˈzaɪəti"));
   for (const word of ["anxieties", "antianxiety", "nonanxiety", "anxietylike", "enxiety"]) expect(e.predict(word)).toMatch(/ˈzaɪ/);
   for (const word of ["anxious", "anxiously", "anxiousness"]) expect(e.predict(word)).toContain("ŋkʃ");
   for (const word of ["lynx", "minx", "bronx"]) expect(e.predict(word)).toContain("ŋks");
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["Anxiety makes her anxious.", "They examine anxious patients."]) {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    for (const token of out.filter(t => t.word.toLowerCase() === "anxiety")) expect(token.phoneme).toMatch(/ˈzaɪ/);
    for (const token of out.filter(t => t.word === "anxious")) expect(token.phoneme).toContain("ŋkʃ");
    for (const token of out.filter(t => t.word === "examine")) expect(token.phoneme).toContain("ɡˈzæm");
   }
  });
  test("retains an explicit anxiety root through plural restoration", () => {
   const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("anxiety", "ˈtɛst");
   expect(e.predict("anxiety")).toBe("ˈtɛst"); expect(e.predict("anxieties")).toBe("ˈtɛsts");
  });

})();

// Original suite: en-object-article-clause-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const api = () => createPhonemizer({ processors: [new EnglishG2P()] });
  it.each([
    ["The school record, 'The First', was clear.", "record", "ˈɹɛkɝd"],
    ["They received a school permit, 'The Pass', yesterday.", "permit", "ˈpɝmɪt"],
    ["The school subject, 'The Past', was clear.", "subject", "ˈsʌbdʒɪkt"],
    ["The school object, 'The Orb', was lost.", "object", "ˈɑbdʒɛkt"],
    ["In making a wooden bow, the greater part is done on a straight stick.", "bow", "boʊ"],
    ["The weapons permit, a license, was renewed.", "permit", "ˈpɝmɪt"],
    ["They regard it as the weapons permit, a license for access.", "permit", "ˈpɝmɪt"],
  ])("keeps a nominal head before a new clause: %s", (sentence, word, ipa) => {
    expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });
  it.each([
    ["Record the signal.", "Record", "ɹɪˈkɔɹd"],
    ["Record 'the signal'.", "Record", "ɹɪˈkɔɹd"],
    ["The engineers record the signal.", "record", "ɹɪˈkɔɹd"],
    ["The engineers record 'the signal'.", "record", "ɹɪˈkɔɹd"],
    ["As the cells degenerate, a problem develops.", "degenerate", "dɪˈdʒɛnɝeɪt"],
    ["When the workers refuse, a conflict follows.", "refuse", "ɹɪˈfjuz"],
    ["Whichever way the branches of the tree incline, the path remains clear.", "incline", "ɪnˈkɫaɪn"],
    ["They tried to prove, or discard, the claim.", "discard", "dɪˈskɑɹd"],
  ])("preserves a real finite or coordinated predicate: %s", (sentence, word, ipa) => {
    expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });
  it.each([
    ["The present moment matters.", "present", "ˈpɹɛzənt"],
    ["They present the award.", "present", "pɹɪˈzɛnt"],
    ["The record was clear.", "record", "ˈɹɛkɝd"],
  ])("preserves adjective, verb and noun controls: %s", (sentence, word, ipa) => {
    expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });

  it("preserves both predicates in the original quantified-PP training sentence", () => {
    const sentence = "Since consumption of other goods increase, the embodied fuel used in the production of those goods would increase as well.";
    const occurrences = api().phonemize(sentence, { language: "en-US", returnArray: true }).filter(segment => segment.word === "increase");
    expect(occurrences.map(segment => segment.phoneme.replace(/ˌ/g, ""))).toEqual(["ɪnˈkɹis", "ɪnˈkɹis"]);
  });

})();

// Original suite: en-object-aside.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  const cases: Array<[string, string, string]> = [
    ["She proposes appropriate names for characters.", "appropriate", "əˈpɹoʊpɹiət"],
    ["The dealer offers live animals for sale.", "live", "ɫaɪv"],
    ["The Dealer offers live animals for sale.", "live", "ɫaɪv"],
    ["Stone offers produce boxes for delivery.", "produce", "ˈpɹoʊdus"],
    ["The crews use ordinary (filtered) water.", "use", "juz"],
    ["Small water reactors, which heat water, use ordinary (filtered) water.", "use", "juz"],
    ["The crews use ordinary (clean (filtered)) water.", "use", "juz"],
    ["The crews close specific roads.", "close", "kɫoʊz"],
    ["Females produce litters of young animals.", "produce", "pɹəˈdus"],
    ["The agencies appropriate educational grants.", "appropriate", "əˈpɹoʊpɹiˌeɪt"],
    ["The age appropriate educational materials are available.", "appropriate", "əˈpɹoʊpɹiət"],
    ["The warehouse produce local residents bought is fresh.", "produce", "ˈpɹoʊdus"],
    ["The city records local residents read are archived.", "records", "ˈɹɛkɝdz"],
    ["The city records clinical samples that are stored.", "records", "ɹɪˈkɔɹdz"],
    ["More appropriate names for the project are needed.", "appropriate", "əˈpɹoʊpɹiət"],
    ["Using incense seal clocks requires patience.", "incense", "ˈɪnˌsɛns"],
    ["The elaborate entrance gates are still missing.", "entrance", "ˈɛntɹəns"],
  ];
  it.each(cases)("keeps subject/object and noun contrasts in %s", (text, word, ipa) => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-object-determinatives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api=()=>createPhonemizer({processors:[new EnglishG2P()]});
  test.each([
   ["The tools exploit certain short-term visual memory and depth-mapping psychophysical processes.","exploit","ɪkˈspɫɔɪt"],
   ["The administrators invite certain players to be moderators, also known as helpers.","invite","ˌɪnˈvaɪt"],
   ["The critics record few concerts.","record","ɹɪˈkɔɹd"],
   ["They present certain records.","present","pɹɪˈzɛnt"],
  ])("recognizes an indefinite object phrase: %s",(sentence,word,ipa)=>{expect(api().phonemize(sentence,{language:"en-US",returnArray:true}).find(t=>t.word===word)?.phoneme).toBe(ipa);});
  test.each([
   ["They bought certain records.","records","ˈɹɛkɝdz"],
   ["Other Records Both Classical Covers.","Records","ˈɹɛkɝdz"],
   ["The present moment matters.","present","ˈpɹɛzənt"],
   ["The record was clear.","record","ˈɹɛkɝd"],
  ])("preserves nominal and adjective controls: %s",(sentence,word,ipa)=>{expect(api().phonemize(sentence,{language:"en-US",returnArray:true}).find(t=>t.word===word)?.phoneme?.replace(/ˌ/g,"")).toBe(ipa);});
  test("preserves explicit pronunciation ownership",()=>{const e=new EnglishG2P();e.addPronunciation("invite","ˈzɛmp");const own=createPhonemizer({processors:[e]});expect(own.phonemize("The administrators invite certain players.",{language:"en-US",returnArray:true}).find(t=>t.word==="invite")?.phoneme).toBe("ˈzɛmp");});

})();

// Original suite: en-object-pronoun-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("Object pronouns after transitive verbs", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
    const target = (sentence: string, word: string) => phonemizer.phonemize(sentence, {
      language: "en-US", returnArray: true,
    }).find(token => token.word.toLowerCase() === word)!.phoneme;

    it.each([
      ["Friends invite them along.", "invite", "ɪnˈvaɪt"],
      ["Officials permit them to enter.", "permit", "pɝˈmɪt"],
      ["Please record him speaking.", "record", "ɹɪˈkɔɹd"],
    ])("reads the verb in %s", (sentence, word, ipa) => {
      expect(target(sentence, word)).toContain(ipa);
    });

    it.each([
      ["The invite itself was unexpected.", "invite", "ˈɪnvaɪt"],
      ["The permit itself was valid.", "permit", "ˈpɝmɪt"],
      ["Keep a record of them.", "record", "ˈɹɛkɝd"],
      ["Record US sales rose.", "record", "ˈɹɛkɝd"],
      ["The organ console itself was moved.", "console", "ˈkɑnsoʊɫ"],
      ["The invalid himself declined.", "invalid", "ˈɪnvəɫəd"],
      ["The result was invalid.", "invalid", "ɪnˈvæɫəd"],
      ["A learned scholar arrived.", "learned", "ˈɫɝnɪd"],
    ])("preserves the noun/adjective in %s", (sentence, word, ipa) => {
      expect(target(sentence, word)).toContain(ipa);
    });
  });

})();

// Original suite: en-object-relative-named-subject.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  describe.each([false, true])("object-relative named subjects, rules=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    it.each([
      ["The techniques which Batman uses are clear.", "uses", "ˈjuzəz"],
      ["We discussed the technique which Batman uses.", "uses", "ˈjuzəz"],
      ["Which Batman records are clear?", "records", "ˈɹɛkɝdz"],
      ["She knows which Batman records are available.", "records", "ˈɹɛkɝdz"],
      ["The city records local residents collected are archived.", "records", "ˈɹɛkɝdz"],
      ["The various uses require care.", "uses", "ˈjusəz"],
      ...(!disableDict ? [["The notes that Sable records are clear.", "records", "ɹɪˈkɔɹdz"]] : []),
    ])("preserves the clause and paired noun: %s", (sentence, word, ipa) => {
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });
  it.each(["uses", "records", "permits", "winds"])("uses one relative-clause frame for %s", target => {
    const words = ["The", "notes", "which", "Sable", target, "are", "clear", "."];
    expect(new SimplePOSTagger().tagWord(target, ["Sable", "are"], { words, index: 4 }).pos).toBe("V");
  });

})();

// Original suite: en-october-lexical-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("lexical month-name stress", () => {
    it("uses the sourced October reading without disturbing adjacent month controls", () => {
      const g2p = new EnglishG2P({ disableDict: true });
      expect(g2p.predict("october", "en-US")).toBe("ɑkˈtoʊbɝ");
      expect(g2p.predict("september", "en-US")).toBe("sɛpˈtɛmbɝ");
      expect(g2p.predict("november", "en-US")).toBe("noʊˈvɛmbɝ");
      expect(g2p.predict("december", "en-US")).toBe("dɪˈsɛmbɝ");


      const tokens = englishTokens(g2p, "They arrived in October after September and before November.");
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("october")).toBe("ɑkˈtoʊbɝ");
      expect(reading("september")).toBe("sɛpˈtɛmbɝ");
      expect(reading("november")).toBe("noʊˈvɛmbɝ");
    });
  });

})();

// Original suite: en-ocus-inflections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("-ocus inflections keep the unstressed /əs/ stem", () => {
    it.each([false, true])("composes focus derivatives without restoring a silent e (rules=%s)", disableDict => {
      const g2p = new EnglishG2P({ disableDict });
      for (const [word, expected] of [
        ["focused", "ˈfoʊkəst"],
        ["focusing", "ˈfoʊkəsɪŋ"],
        ["refocused", "ɹiˈfoʊkəst"],
        ["refocusing", "ɹiˈfoʊkəsɪŋ"],
        ["refocuses", "ɹiˈfoʊkəsəz"],
      ]) {
        expect(g2p.predict(word, "en-US")).toBe(expected);
        expect(g2p.trace(word, "en-US").path).toBe("morphology");
      }
    });

    it.each([
      ["focus", "ˈfoʊkəs"],
      ["accused", "əkˈjuzd"],
      ["accusing", "əkˈjuzɪŋ"],
      ["refused", "ɹɪˈfjuzd"],
      ["used", "ˈjuzd"],
      ["using", "ˈjuzɪŋ"],
    ])("preserves the root or silent-e control %s", (word, expected) => {
      expect(new EnglishG2P().predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-of-function-word.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("of pronunciation, rules-only=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    it("voices the final fricative in the function word of", () => {
      expect(api.toIPA("of", "en-US")).toBe("ˈʌv");
      expect(api.phonemize("a cup of tea", { language: "en-US", returnArray: true }).map(token => token.phoneme))
        .toContain("əv");
    });

    it.each(["off", "office", "offer", "proof", "roof", "aloof"])(
      "keeps the lexical coda in %s",
      word => {
        expect(api.toIPA(word, "en-US")).not.toMatch(/v$/);
      },
    );
  });

})();

// Original suite: en-of-modified-subject.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;
  test("recovers the singular subject head across a bounded of phrase", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   for (const sentence of ["The Council of the European Union uses records.", "The union of the councils uses records.", "The council of a union uses records.", "The Council of the European Union uses 'Qualified majority voting'."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toContain("juz");
   const tagger = new SimplePOSTagger();
   for (const target of ["uses", "records", "presents"]) {
    const words = ["The", "council", "of", "the", "union", target, "records", "."];
    expect(tagger.tagWord(target, ["union", "records"], { words, index: 5 }).pos).toBe("V");
   }
  });
  test("keeps noun uses and plural head agreement controls", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   for (const sentence of ["The uses of the union are varied.", "The council of the union uses are varied.", "They discuss the council of the union uses."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toContain("jus");
  });

  test("keeps noun and finite readings in the same original sentence", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   const sentence = "The uses of the union are varied; the council of the union uses records.";
   const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true }).filter(t => t.word === "uses");
   expect(tokens).toHaveLength(2); expect(tokens[0].phoneme).toContain("jus"); expect(tokens[1].phoneme).toContain("juz"); expect(tokens[1].position).toBeGreaterThan(tokens[0].position);
  });

})();

// Original suite: en-onsets-and-near-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src") = require("../src");
  const { toIPA } = __suiteModule1;

  describe.each([false, true])("onsets and NEAR hiatus (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each([
      ["fbi", /ɛfbiaɪ$/], ["cpu", /sipiju$/], ["dna", /diɛneɪ$/], ["mba", /ɛmbieɪ$/],
    ] as const)("%s spells its letters", (word, segments) => {
      expect(g2p.predict(word, "en")!.replace(/[ˈˌ]/g, "")).toMatch(segments);
    });
    test("fallback letter spelling has a single final primary stress", () => {
      const ipa = g2p.predict("fbi", "en")!;
      expect(ipa.match(/ˈ/g)).toHaveLength(1);
      expect(ipa).toMatch(/ˈaɪ$/);
    });
    test("native digraphs and loan onsets retain a spoken onset", () => {
      for (const [word, onset] of [["who", /^h/], ["rho", /^ɹ/], ["gnu", /^n/]] as const)
        expect(g2p.predict(word, "en")!.replace(/[ˈˌ]/g, "")).toMatch(onset);
      expect(g2p.predict("pty", "en")).toMatch(/taɪ$/);
      // Sri also has a supplied abbreviation reading; its rule onset stays spoken.
      if (disableDict) expect(g2p.predict("sri", "en")).toMatch(/^ˈsɹ/);
    });
    test("custom pronunciations precede the new onset fallback", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("fbi", "F AA1 B IY0");
      expect(custom.predict("fbi", "en")).toMatch(/fɑbi$/);
    });
    test("anger and its inflections retain the complete hard-ng root", () => {
      for (const word of ["anger", "angers", "angered", "angering"])
        expect(g2p.predict(word, "en")).toMatch(/^ˈæŋɡɝ/);
    });
    test("soft-ng and ordinary ng boundaries remain distinct", () => {
      for (const word of ["danger", "ranger", "stranger"])
        expect(g2p.predict(word, "en")).toMatch(/ndʒɝ$/);
      expect(g2p.predict("singer", "en")).toMatch(/ɪŋɝ$/);
    });
    test.each(["period", "material", "bacterial", "experience", "interior", "exterior", "superior", "ulterior"])("%s retains the strong NEAR nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(/ˈ[^ˈ]*ɪɹi/);
    });
    test("weak ior/iour after n and v supplies a glide", () => {
      for (const word of ["junior", "senior", "savior", "saviour", "behavior", "behaviour", "misbehavior"])
        expect(g2p.predict(word, "en")).toMatch(/[nv]jɝ/);
      expect(g2p.predict("warrior", "en")).toMatch(/ɹiɝ$/);
      expect(g2p.predict("interior", "en")).toMatch(/ɹiɝ$/);
    });
    test("ontal derivatives keep root stress rather than citation-stem stress", () => {
      expect(g2p.predict("horizontal", "en")).toMatch(/ˈzɑnt/);
      expect(g2p.predict("periodontal", "en")).toMatch(/ˈdɑnt/);
    });
    test("aerial and stereo retain their contrasting e nuclei", () => {
      expect(g2p.predict("aerial", "en")).toMatch(/^ˈɛɹi/);
      expect(g2p.predict("stereo", "en")).toMatch(/^ˈstɛɹi/);
    });
  });

  test("public API preserves spelled onsets and NEAR roots", () => {
    expect(toIPA("fbi")).toMatch(/ɛfˌ?biˈaɪ$/);
    expect(toIPA("superior")).toMatch(/ˈpɪɹi/);
  });

})();

// Original suite: en-open-dental-and-bound-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])(
    "open dental frames and bound roots (disableDict=%s)",
    (disableDict) => {
      const g2p = new EnglishG2P({ disableDict });
      const segments = (word: string): string =>
        g2p.predict(word)!.replace(/[ˈˌ]/g, "");

      test("open wa retains rounding through neutral derivatives", () => {
        for (const word of [
          "water",
          "watery",
          "waterish",
          "waterman",
          "watermen",
        ])
          expect(g2p.predict(word)).toMatch(/^ˈwɔtɝ/);
        for (const word of ["wattle", "wattage"])
          expect(g2p.predict(word)).toMatch(/^ˈwɑ/);
      });

      test("regular past endings retain their complete stem", () => {
        expect(segments("seemed")).toBe("simd");
        expect(segments("probed")).toBe("pɹoʊbd");
      });

      test("the bound tain verb differs from a weak noun rime", () => {
        for (const word of ["contain", "contains", "contained", "containing"])
          expect(g2p.predict(word)).toMatch(/^kənˈteɪn/);
        for (const word of ["maintain", "maintains", "maintained", "maintaining"])
          expect(g2p.predict(word)).toMatch(/^meɪnˈteɪn/);
        for (const word of ["pertain", "entertain"])
          expect(g2p.predict(word)).toMatch(/ˈteɪn$/);
        for (const word of ["certain", "captain", "curtain", "mountain"])
          expect(g2p.predict(word)).toMatch(/^ˈ/);
        expect(segments("captain")).toMatch(/tən$/);
      });

      test("bound sent has root stress while the absent adjective keeps its head", () => {
        for (const word of ["consent", "consents", "consented", "consenting"])
          expect(g2p.predict(word)).toMatch(/^kənˈsɛnt/);
        for (const word of ["dissent", "dissents", "dissented", "dissenting"])
          expect(g2p.predict(word)).toMatch(/^dɪˈsɛnt/);
        expect(g2p.predict("absent")).toMatch(/^ˈæb/);
      });

      test("the two-slot tr+ol root survives doubling and agent suffixes", () => {
        for (const word of [
          "control",
          "controls",
          "controlled",
          "controlling",
          "controller",
        ])
          expect(g2p.predict(word)).toMatch(/^kənˈtɹoʊɫ/);
        for (const word of [
          "patrol",
          "patrols",
          "patrolled",
          "patrolling",
          "patroller",
        ])
          expect(g2p.predict(word)).toMatch(/^pəˈtɹoʊɫ/);
        expect(segments("trolley")).toMatch(/^tɹɑɫ/);
        expect(g2p.predict("petrol")).toMatch(/^ˈpɛ/);
      });

      test("complex rhotic ow plus silent se retains its vowel and voicing", () => {
        for (const word of [
          "browse",
          "browses",
          "browsed",
          "browsing",
          "browser",
        ])
          expect(g2p.predict(word)).toMatch(/^ˈbɹaʊz/);
        for (const word of ["bowse", "rowse"])
          expect(segments(word)).toMatch(/oʊs$/);
      });
    },
  );

})();

// Original suite: en-open-e-sity.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])("stressed open e retains FLEECE before single s-ity (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const key of Object.keys(dictionary)) if (/obes/.test(key)) delete dictionary[key];
   Reflect.set(e, "dictionary", dictionary);
   for (const word of ["obesity", "obesities", "nonobesity"]) expect(e.predict(word)).toContain("ˈbis");
   expect(e.predict("mesity")).toMatch(/^ˈmis/);
   for (const word of ["necessity", "density", "intensity"]) expect(e.predict(word)).toContain("ɛ");
   const api = createPhonemizer({ processors: [e] });
   const out = api.phonemize("They avoid obesity in dense communities.", { language: "en-US", returnArray: true });
   expect(out.find(t => t.word === "obesity")!.phoneme).toContain("ˈbis");
   expect(out.find(t => t.word === "dense")!.phoneme).toContain("dɛns");
   expect(out.find(t => t.word === "avoid")!.phoneme).toContain("ˈvɔɪd");
  });

})();

// Original suite: en-open-i-stop-foot.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  function cold(disableDict: boolean) {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for(const word of ["item", "idol", "itemize", "itemized", "itemizing", "itemizer", "idolize", "idolized", "idolizing"]) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary); return e;
  }
  describe.each([false, true])("open i and a weak stop-initial foot, rules=%s", disableDict => {
   test("citation roots and capital forms survive lexical eviction", () => {
    const e = cold(disableDict);
    for(const [word,ipa] of [["item", "ˈaɪtəm"], ["items", "ˈaɪtəmz"], ["idol", "ˈaɪdəɫ"], ["idols", "ˈaɪdəɫz"]]) {
     expect(e.predict(word)).toBe(ipa); expect(e.predict(word.toUpperCase())).toBe(ipa);
    }
    expect(e.predict("idol's")).toBe("ˈaɪdəɫz");
   });
   test("derived and nonce forms retain the owned initial vowel", () => {
    const e = cold(disableDict);
    for(const word of ["itemlike", "idollike", "itemize", "itemized", "itemizing", "itemization", "idolize", "idolized", "idolizing", "idolization", "itemer", "nonitem", "nonidol", "nonitemized", "nonidolized", "ipem", "ipems"]) expect(e.predict(word)?.replace(/ˌ/g, "")).toMatch(word.startsWith("non") ? /aɪ(?:təm|də)/ : /^[ˈˌ]?aɪ/);
   });
   test("Greek hiatus, short high-vowel tails and consonant onsets stay separate", () => {
    const e = cold(disableDict);
    for(const word of ["ibid", "idiom", "idiot", "image", "igloo"]) expect(e.predict(word)).toMatch(/^ˈɪ/);
    if(disableDict) expect(e.predict("imam")).toMatch(/^ˈɪ/);
    expect(e.predict("IBM")).toMatch(/aɪ.*bi.*ɛm/);
   });
   test("custom roots retain priority through inflection and compounding", () => {
    const e = cold(disableDict); e.addPronunciation("item", "ˈtɛst");
    expect(e.predict("ITEM")).toBe("ˈtɛst"); expect(e.predict("items")).toBe("ˈtɛsts");
    expect(e.predict("itemlike")).toMatch(/^ˈtɛst/);
   });
   test("noun, adjective and verb sentences retain their independent readings", () => {
    const api = createPhonemizer({ processors: [cold(disableDict)] });
    const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
    expect(pick("The item was new.", "item")).toBe("ˈaɪtəm");
    expect(pick("They item the costs.", "item")).toBe("ˈaɪtəm");
    expect(pick("The idle singer admired the idol.", "idol")).toBe("ˈaɪdəɫ");
    expect(pick("The idle singer admired the idol.", "idle")).toBe("ˈaɪdəɫ");
   });
  });
  test("past and modal reading controls remain distinct", () => {
   const api = createPhonemizer({ processors: [cold(false)] });
   for(const [sentence,ipa] of [["She read the item yesterday.", "ɹɛd"], ["She will read the item.", "ɹid"]]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-open-prefix-lect.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])("keeps open-prefix lect roots after eviction (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const word of Object.keys(dictionary)) if (/(?:elect|neglect)/.test(word)) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary);
   for (const word of ["elect", "elects", "elected", "electing", "elector", "reelect", "reelected", "neglect", "neglects", "neglected", "neglecting", "neglectful", "nonneglectful"]) expect(e.predict(word)).toMatch(/ˈ[ɡɫl]*ɛkt/);
   for (const word of ["select", "selected", "reflect", "deflect", "belect"]) expect(e.predict(word)).toMatch(/ˈ[fɫl]*ɛkt/);
   expect(e.predict("collect", "en-US", "N")).toMatch(/^ˈkɑ/);
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["They elect the leader.", "The elect are here.", "The neglect was severe.", "They neglect the task."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^(?:elect|neglect)$/.test(t.word))?.phoneme).toMatch(/ˈ[ɡɫl]*ɛkt/);
   expect(api.phonemize("The collect was read.", { language: "en-US", returnArray: true }).find(t => t.word === "collect")?.phoneme).toMatch(/^ˈkɑ/);
   if (!disableDict) for (const word of ["dialect", "intellect"]) expect(e.predict(word)).toMatch(/^ˈ/);
  });
  test("retains an explicit lect root owner", () => {
   const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("elect", "ˈtɛst");
   expect(e.predict("elect")).toBe("ˈtɛst"); expect(e.predict("elects")).toBe("ˈtɛsts"); expect(e.predict("elected")).toBe("ˈtɛstɪd");
  });

})();

// Original suite: en-open-root-and-inflection-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("open roots and inflection boundaries (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("checked pro nouns retain head stress and LOT", () => {
      for (const word of ["product", "products", "product's", "problem", "problems", "proper", "properly", "property", "properties", "prodigy", "prodigies", "prosody"])
        expect(g2p.predict(word)).toMatch(/^ˈpɹɑ/);
    });

    test("bound pro verbs keep their root stress and vowel", () => {
      for (const word of ["profess", "professed", "professing"])
        expect(g2p.predict(word)).toMatch(/^pɹəˈfɛs/);
      for (const word of ["propel", "propelled", "propelling"])
        expect(g2p.predict(word)).toMatch(/^pɹəˈpɛɫ/);
      expect(g2p.predict("protect")).toMatch(/^pɹəˈtɛkt/);
      expect(g2p.predict("proposal")).toMatch(/^pɹəˈpoʊ/);
    });

    test("i plus a weak ary or ory tail retains PRICE", () => {
      for (const word of ["binary", "binaries", "ivory", "ivories", "library", "libraries", "primary", "primaries"])
        expect(g2p.predict(word)).toMatch(/^ˈ[^aeiouæɑɔəɛɪʊʌɝ]*aɪ/);
      for (const word of ["library", "primary"])
        expect(segments(word)).toMatch(/ɛɹi$/);
      expect(segments("history")).toMatch(/^hɪ/);
      expect(segments("primarily")).toMatch(/^pɹaɪ/);
      expect(segments("family")).toMatch(/^fæ/);
    });

    test("merged consonant-y frames retain their root vowel in derivatives", () => {
      for (const word of ["pony", "ponies", "ponytail", "phony", "phonies", "nosy", "nosier", "cozy", "cozier"])
        expect(segments(word)).toContain("oʊ");
      for (const word of ["tiny", "tinier", "tiniest", "shiny", "shinier", "spiny", "spinier", "icy", "icier", "icily", "spicy", "spicier", "spicily", "pricy", "priciest"])
        expect(segments(word)).toContain("aɪ");
      for (const word of ["body", "copy", "poly"])
        expect(segments(word)).toMatch(/ɑ/);
      expect(segments("Pliny")).toMatch(/^pɫɪ/);
    });

    test("a bare primary open root centralizes sis without changing medial roots", () => {
      expect(segments("basis")).toMatch(/eɪsəs$/);
      expect(segments("crisis")).toMatch(/aɪsəs$/);
      expect(segments("thesis")).toBe("θisəs");
      expect(segments("prosthesis")).toMatch(/θɛsɪs$/);
      for (const word of ["nemesis", "parenthesis"])
        expect(segments(word)).toMatch(/sɪs$/);
    });

    test("vowel-final monosyllables keep their vowel across ing", () => {
      expect(segments("seeing")).toBe("siɪŋ");
      expect(segments("hoeing")).toBe("hoʊɪŋ");
      expect(segments("freeing")).toBe("fɹiɪŋ");
      expect(segments("cooing")).toBe("kuɪŋ");
      expect(segments("doing")).toBe("duɪŋ");
      expect(segments("planned")).toBe("pɫænd");
      expect(segments("stopped")).toBe("stɑpt");
    });

    test("prefix plus ion retains root stress", () => {
      expect(g2p.predict("provision")).toMatch(/^pɹəˈvɪʒən$/);
      expect(g2p.predict("indecision")).toMatch(/ˈsɪʒən$/);
      expect(g2p.predict("indigestion")).toMatch(/ˈdʒɛstʃən$/);
      expect(g2p.predict("indiscretion")).toMatch(/ˈkɹɛʃən$/);
    });
  });

  test("trace identifies compound joins that bypass syllable rules", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    for (const word of ["foreword", "television"]) {
      const trace = g2p.trace(word);
      expect(trace.path).toBe("compound");
      expect(trace.ipa).toBe(g2p.predict(word));
      expect(trace.steps.every((step) => step.rule === "compound")).toBe(true);
    }
    expect(g2p.trace("provision").path).toBe("rules");
  });

  test("runtime retains noun and verb readings after the checked-root change", () => {
    const g2p = new EnglishG2P();
    for (const word of ["project", "progress", "prospect"]) {
      expect(g2p.predict(word, "en", "N")).toMatch(/^ˈpɹ/);
      expect(g2p.predict(word, "en", "V")).toMatch(/^[ˌ]?pɹ[əʌ]ˈ/);
    }
    expect(g2p.predict("invite", "en", "N")).toMatch(/^ˈɪn/);
    expect(g2p.predict("invite", "en", "V")).toMatch(/ˈvaɪt$/);
    expect(g2p.predict("overrunning")).toMatch(/^ˈoʊvɝɹ/);
  });

})();

// Original suite: en-open-stop-r-ed.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("unvouched open stop-r ed (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["sacred", "ˈseɪkɹəd"], ["hatred", "ˈheɪtɹəd"],
      ["hatreds", "ˈheɪtɹədz"], ["unsacred", "ənˈseɪkɹəd"],
      ["non-sacred", "nɑnˈseɪkɹəd"],
      ["mitred", "ˈmaɪtɝd"], ["metred", "ˈmitɝd"],
      ["barred", "ˈbɑɹd"], ["typed", "ˈtaɪpt"], ["hoped", "ˈhoʊpt"],
    ])("preserves the root frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("retains derived and prefixed roots after complete lexical eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["sacred", "hatred", "hatreds", "unsacred"]) delete access.dictionary[word];
      expect(evicted.predict("sacred")).toBe("ˈseɪkɹəd");
      expect(evicted.predict("hatreds")).toBe("ˈheɪtɹədz");
      expect(evicted.predict("unsacred")).toBe("ənˈseɪkɹəd");
    });
    it("honors an explicitly supplied otherwise unvouched stem", () => {
      const custom = new EnglishG2P({ disableDict });
      const access = custom as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary }; delete access.dictionary.sacred;
      custom.addPronunciation("sacr", "S AE1 K R");
      expect(custom.predict("sacred")).toBe("ˈsækɹd");
    });
    it("retains adjective, noun and finite verb controls in full prose", () => {

      const tokens = englishTokens(engine, "The sacred reader will work without hatred.");
      expect(tokens.find(t => t.word === "sacred")?.phoneme).toBe("ˈseɪkɹəd");
      expect(tokens.find(t => t.word === "hatred")?.phoneme).toBe("ˈheɪtɹəd");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    });
  });

})();

// Original suite: en-open-vowel-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("open vowels and suffix context (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    test.each([
      ["equal", /ˈik/], ["sequence", /ˈsik/], ["frequency", /ˈfɹik/],
      ["meter", /ˈmit/], ["cedar", /ˈsid/],
    ] as const)("%s keeps its tense open e", (word, nucleus) => {
      expect(g2p.predict(word, "en")).toMatch(nucleus);
    });
    test.each(["move", "prove", "remove", "approve", "improve", "movie", "movies"])("%s takes GOOSE before the v ending", word => {
      expect(g2p.predict(word, "en")).toMatch(/uv/);
    });
    test.each(["probe", "prove"])("%s attaches stress to its nucleus, before the onset", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ˈpɹ/);
    });
    test.each(["native", "basic", "bacon", "dative"])("%s keeps tense a in its ending frame", word => {
      expect(g2p.predict(word, "en")).toContain("eɪ");
    });
    test.each(["changes", "exchanges", "ranges"])("%s retains the tense -ange vowel before the plural", word => {
      expect(g2p.predict(word, "en")).toMatch(/eɪndʒəz$/);
    });
    test("flanges keeps the lateral-onset lax vowel", () => {
      expect(g2p.predict("flanges", "en")).toMatch(/æ/);
    });
    test.each(["efficient", "efficiency"])("%s raises weak ef and stresses the following nucleus", word => {
      expect(g2p.predict(word, "en")).toMatch(/^ɪˈfɪʃən/);
    });
    test.each(["efficiency", "deficiency", "proficiency", "sufficiency"])("%s coalesces the -ciency ending", word => {
      expect(g2p.predict(word, "en")).toMatch(/ʃənsi$/);
    });
    test("disclose composes with the verb's voiced close", () => {
      expect(g2p.predict("disclose", "en")).toMatch(/oʊz$/);
    });
    test("disable composes with able", () => {
      expect(g2p.predict("disable", "en")).toMatch(/^dɪˈseɪ/);
    });
    test("discover retains its root's STRUT vowel", () => {
      expect(g2p.predict("discover", "en")).toMatch(/[ʌə]vɝ$/);
    });
    test("prerequisite retains the known root's weak ending", () => {
      expect(g2p.predict("prerequisite", "en")).toMatch(/kwəzət$/);
    });
    test.each(["preference", "clever", "never", "equity"])("%s retains its lax e", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɛ/);
    });
    test("a novel -asic word follows the same open-a context", () => {
      expect(g2p.predict("tasic", "en")).toMatch(/eɪsɪk$/);
    });
    test("a longer -ative word retains the weak middle vowel", () => {
      expect(g2p.predict("sanative", "en")).toMatch(/nətɪv$/);
    });
    test.each(["navies", "gravies"])("%s retains aCy lengthening through its y stem", word => {
      expect(g2p.predict(word, "en")).toMatch(/eɪviz$/);
    });
    test("coffee's final vowel is pronounced", () => {
      expect(g2p.predict("coffee", "en")).toMatch(/fi$/);
    });
  });

})();
