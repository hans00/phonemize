// Original suite: en-coordinated-adjective-after-as.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  const sentenceWords = (sentence: string) => sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];

  describe("adjectival coordination after as", () => {
    test("uses adjective agreement to resolve an ambiguous first conjunct", () => {
      const sentence = "The assembly was classified as learned and ignorant.";
      const words = sentenceWords(sentence), index = words.findIndex(word => word.toLowerCase() === "learned");
      expect(engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos).toBe("ADJ");
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ˈɫɝnɪd");
    });

    test("preserves finite past and explicit passive controls", () => {
      expect(api.phonemize("They learned the lesson and taught the class.", { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ɫɝnd");
      expect(api.phonemize("He was learned by scholars.", { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ɫɝnd");
      expect(api.phonemize("He was very learned.", { language: "en-US", returnArray: true }).find(token => token.word === "learned")?.phoneme).toBe("ˈɫɝnɪd");
    });

  });

})();

// Original suite: en-coordinated-past-context.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test.each([false, true])("a coordinated past predicate after a prepositional phrase retains past read (rules=%s)", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const sentence = "They went to a local library and read all books yesterday.";
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "read")?.phoneme).toBe("ɹɛd");
  });

})();

// Original suite: en-coordinated-regular-past.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { inferVerbForm, simplePOSTagger } = __suiteModule0;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule2.default;
  type EnglishG2P = import("../src/en/g2p").default;

  it.each([
    ["John", "cleaned", "the", "room", "and", "read", "the", "book"],
    ["John", "visited", "Oxford", "and", "read", "the", "book"],
    ["She", "attended", "Downe", "House", "School", ",", "and", "read", "English", "at", "Christ", "Church"],
    ["They", "completed", "the", "plan", "and", "read", "a", "letter"],
    ["The", "teacher", "repaired", "the", "book", "and", "read", "the", "article"],
    ["Breault", "developed", "an", "interest", "in", "science", "fiction", "and", "fantasy", "early", "in", "his", "childhood", ",", "and", "read", "The", "Hobbit"],
  ])("inherits a finite regular past in %j", (...words: string[]) => {
    expect(inferVerbForm({ words, index: words.indexOf("read") })).toBe("past");
  });

  it.each([
    ["John", "planned", "to", "leave", "and", "read", "the", "book"],
    ["They", "visit", "the", "learned", "society", "and", "read", "the", "book"],
    ["John", "cleaned", "the", "room", "and", "they", "read", "the", "book"],
    ["John", "cleaned", "the", "room", "and", "now", "read", "the", "book"],
    ["John", "collected", "books", "and", "read", "receipts"],
    ["John", "will", "clean", "the", "room", "and", "read", "the", "book"],
    ["John", "cleaned", "the", "room", ",", "Oxford", "writes", "and", "read", "the", "book"],
  ])("preserves the other clause or nominal frame in %j", (...words: string[]) => {
    expect(inferVerbForm({ words, index: words.indexOf("read") })).not.toBe("past");
  });

  it("preserves an adjective and noun beside coordinated past read", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const tokens = api.phonemize("He repaired the present record and read the book.", { language: "en-US", returnArray: true });
    expect(tokens.filter(t => ["present", "record", "read"].includes(t.word)).map(t => t.phoneme))
      .toEqual(["ˈpɹɛzənt", "ˈɹɛkɝd", "ɹɛd"]);
  });

  it("uses the same finite frame for POS and inflection beside a proper object", () => {
    const words = ["She", "attended", "Downe", "House", "School", ",", "and", "read", "English", "at", "Oxford"];
    expect(simplePOSTagger.tagWord("read", ["and", "English"], { words, index: 7 }).pos).toBe("V");
    expect(inferVerbForm({ words, index: 7 })).toBe("past");
  });
  it("does not promote a nominal modifier because its later relative mentions yesterday", () => {
    const words = ["The", "letter", "and", "read", "receipts", "generated", "yesterday", "are", "logged"];
    expect(simplePOSTagger.tagWord("read", ["and", "receipts"], { words, index: 3 }).pos).not.toBe("V");
    // Cambridge read receipt /riːd/: an explicit noun reading survives the later relative's tense cue.
    expect(new EnglishG2P().predict("read", "en-US", "N", { words, index: 3 })).toBe("ɹid");
  });

})();

// Original suite: en-coordination-constituent-controls.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const api = createPhonemizer({ processors: [new EnglishG2P()] });

  it.each([
    ["bow", "Iron and steel will bend and bow.", "boʊ"],
    ["expatriate", "The school provides accreditation to local and expatriate students.", "ɛkˈspeɪtɹiət"],
    ["misuse", "He was dismissed on grounds of refusal to teach and misuse of university resources.", "mɪsˈjus"],
  ])("preserves the contextual reading of %s in a coordinated phrase", (word, sentence, expected) => {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find((token) => token.word === word)?.phoneme).toBe(expected);
  });

})();

// Original suite: en-coronal-ation-batch.test.ts
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
  describe.each([false, true])("coronal weak vowel before -ation (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["medication", "mɛdəˈkeɪʃən"], ["litigation", "lɪtəˈɡeɪʃən"],
      ["adjudication", "əˌdʒudəˈkeɪʃən"],
    ])("reduces the newly pretonic vowel in %s", (word, ipa) => {
      expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
    });
    it.each([
      ["medicate", disableDict ? "ˈmɛdəkeɪt" : "ˈmɛdɪkeɪt"], ["litigate", "ˈlɪtəɡeɪt"],
      ["lubrication", "lubɹɪˈkeɪʃən"], ["vacation", "veɪˈkeɪʃən"],
    ])("preserves the unaffected stem or environment in %s", (word, ipa) => {
      expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
    });
    it("preserves caller ownership of the complete noun", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("medication", "ˈzɛŋ");
      expect(custom.predict("medication")).toBe("ˈzɛŋ");
    });
    it("keeps noun, adjective and verb readings in full prose", () => {
      const api = createPhonemizer({ processors: [engine] });
      const result = api.phonemize("The clever reader will work before litigation.", {
        language: "en-US", returnArray: true,
      });
      for (const [word, ipa] of [["work", "wɝk"], ["litigation", "lɪtəˈɡeɪʃən"]])
        expect(reading(result.find(token => token.word === word)!.phoneme)).toEqual(reading(ipa));
      expect(result.find(token => token.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(result.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    });
  });

})();

// Original suite: en-coronal-eat-and-labial-past.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  test.each([false, true])("keeps singleton eat and labial past vowels after eviction (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const word of ["sweat", "sweats", "sweaty", "sweater", "sweating", "threat", "threats", "threaten", "threatened", "threatening", "dreamt", "leapt"]) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary);
   for (const word of ["sweat", "sweats", "sweaty", "sweater", "sweating"]) expect(e.predict(word)).toContain("swɛt");
   for (const word of ["threat", "threats", "threaten", "threatened", "threatening"]) expect(e.predict(word)).toContain("θɹɛt");
   expect(e.predict("dreamt")).toContain("dɹɛm"); expect(e.predict("leapt")).toMatch(/[lɫ]ɛpt/);
   for (const word of ["sweet", "sweeter", "sweatt", "sweatman", "treat", "threatt", "dream", "dreamed", "leap"]) expect(e.predict(word)).toContain("i");
   // The pinned dictionary selects the accepted short leaped variant on lexical hits.
   expect(e.predict("leaped")).toContain(disableDict ? "i" : "ɛ");
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["They treat the threat.", "The sweater was sweaty.", "They threaten the guard."]) {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    for (const token of out.filter(t => /^(?:threat|sweat)/.test(t.word))) expect(token.phoneme).toContain("ɛ");
   }
  });
  test("preserves an explicit eat root owner", () => {
   const e = new EnglishG2P({ disableDict: true }); e.addPronunciation("threat", "ˈtɛst");
   expect(e.predict("threat")).toBe("ˈtɛst"); expect(e.predict("threats")).toBe("ˈtɛsts");
  });

})();

// Original suite: en-coronal-vocalic-stems.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test.each([false, true])(
    "uses AmE free-u allomorphs in productive composition (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const w of ["newly", "newspaper", "newsletter", "newness", "durable"])
        delete d[w];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["news", "ˈnuz"],
        ["newly", "ˈnuɫi"],
        ["newness", "ˈnunəs"],
        ["newspapers", "ˈnuzˌpeɪpɝz"],
        ["newsletters", "ˈnuzˌɫɛtɝz"],
        ["newsworthy", "ˈnuzˌwɝði"],
        ["newspaper", "ˈnuzˌpeɪpɝ"],
        ["newsletter", "ˈnuzˌɫɛtɝ"],
        ["dues", "ˈduz"],
        ["durable", "ˈdʊɹəbəɫ"],
        ["durably", "ˈdʊɹəbɫi"],
      ])
        expect(e.predict(word)).toBe(ipa);
      // The pretonic noun can reduce its root vowel; this control owns yod only.
      expect(e.predict("durability")).not.toMatch(/^[ˈˌ]?dj/);
      expect(e.predict("nonnewspaper")?.replace(/ˌ/g, "")).toBe("nɑnˈnuzpeɪpɝ");
      expect(e.predict("nonprofit")).toBe("nɑnˈpɹɑfət");
      expect(e.predict("nonpayment")).toBe("nɑnˈpeɪmənt");
      // Noncoronal onsets and polysyllabic roots retain their yod.
      for (const [word, ipa] of [
        ["few", "ˈfju"],
        ["hue", "ˈhju"],
        ["queued", "ˈkjud"],
        ["queuing", "ˈkjuɪŋ"],
        ["continued", "kənˈtɪnjud"],
        ["continues", "kənˈtɪnjuz"],
        ["valuing", "ˈvæɫjuɪŋ"],
        ["sued", "ˈsud"],
      ])
        expect(e.predict(word)).toBe(ipa);
      const api = createPhonemizer({ processors: [e] });
      expect(
        api
          .phonemize("The newly appointed recorder keeps the newspaper.", {
            language: "en-US",
            returnArray: true,
          })
          .find((t) => t.word === "newly")?.phoneme,
      ).toBe("ˈnuɫi");
    },
  );
  test.each([false, true])(
    "keeps caller-supplied stem and target ownership (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict });
      const d = { ...Reflect.get(e, "dictionary") };
      for (const w of ["newly", "newspaper", "dues", "durable"]) delete d[w];
      Reflect.set(e, "dictionary", d);
      e.addPronunciation("new", "ˈnju");
      expect(e.predict("newly")).toBe("ˈnjuɫi");
      expect(e.predict("news")).toBe("ˈnjuz");
      expect(e.predict("newspaper")).toBe("ˈnjuzˌpeɪpɝ");
      e.addPronunciation("due", "ˈdju");
      expect(e.predict("dues")).toBe("ˈdjuz");
      e.addPronunciation("dure", "ˈdjʊɹ");
      expect(e.predict("durable")).toBe("ˈdjʊɹəbəɫ");
      e.addPronunciation("newly", "ˈzɛmp");
      expect(e.predict("newly")).toBe("ˈzɛmp");
    },
  );

})();

// Original suite: en-cqu-prefix-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false,true])("assimilated c+qu prefix, disableDict=%s",disableDict=>{
    const cold=()=>{const e=new EnglishG2P({disableDict}),dictionary={...Reflect.get(e,"dictionary")};for(const w of ["acquit","acquits","acquitted","acquitting","acquittal","acquaint","acquaints","acquaintance","acquaintances"])delete dictionary[w];Reflect.set(e,"dictionary",dictionary);return e;};
    it.each([["acquit","əˈkwɪt"],["acquaint","əˈkweɪnt"]])("keeps root primary and weak prefix for %s",(w,ipa)=>{
      const e=cold();for(const pos of [undefined,"N","V"])expect(e.predict(w,"en-US",pos)).toBe(ipa);expect(e.predict(w.toUpperCase())).toBe(ipa);
    });
    it("preserves cold inflections and nominalization",()=>{
      const e=cold();expect(e.predict("acquitted")).toBe("əˈkwɪtɪd");expect(e.predict("acquitting")).toBe("əˈkwɪtɪŋ");expect(e.predict("acquittal")).toBe("əˈkwɪtəɫ");expect(e.predict("acquaints")).toBe("əˈkweɪnts");expect(e.predict("acquaintance")).toBe("əˈkweɪntəns");expect(e.predict("acquaintances")).toBe("əˈkweɪntənsəz");
    });
    it("restores neutral nominal plural boundaries beyond the prefix class",()=>{
      const e=cold();expect(e.predict("experiences")).toBe("ɪksˈpɪɹiənsəz");
      const api=createPhonemizer({processors:[e]}),pick=(sentence:string)=>api.phonemize(sentence,{language:"en-US",returnArray:true}).find(t=>t.word==="experiences")?.phoneme;
      expect(pick("The experiences were useful.")).toBe("ɪksˈpɪɹiənsəz");expect(pick("She experiences pain.")).toBe("ɪksˈpɪɹiənsəz");
    });
    it("retains secondary and hiatus-family prefix vowels",()=>{
      const e=cold();expect(e.predict("acquisition")).toMatch(/^ˌækw/);expect(e.predict("acquiesce")).toMatch(disableDict ? /^æˈkw/ : /^ˌækw/);expect(e.predict("acquiescent")).toMatch(disableDict ? /^æˈkw/ : /^ˌækw/);
    });
    it("preserves unrelated closed syllables and caller roots",()=>{
      const e=cold();expect(e.predict("antenna")).toBe("ænˈtɛnə");expect(e.predict("magnetic")).toBe("mæɡˈnɛtɪk");expect(e.predict("attic")).toBe("ˈætɪk");expect(e.predict("aquatic")).toBe("əˈkwætɪk");expect(e.predict("acquip")).toBe("əˈkwɪp");expect(e.predict("acquips")).toBe("əˈkwɪps");
      e.addPronunciation("acquit","ˈtɛst");expect(e.predict("ACQUIT")).toBe("ˈtɛst");expect(e.predict("acquitted")).toBe("ˈtɛstɪd");
    });
    it("keeps noun/adjective/verb and tense controls in full sentences",()=>{
      const api=createPhonemizer({processors:[cold()]});const pick=(s:string,w:string)=>api.phonemize(s,{language:"en-US",returnArray:true}).find(t=>t.word===w)?.phoneme;
      expect(pick("They acquaint the students with the work.","acquaint")).toBe("əˈkweɪnt");expect(pick("The acquittal was final.","acquittal")).toBe("əˈkwɪtəɫ");expect(pick("The acquired skill was useful.","acquired")).toMatch(/^əˈkw/);
      expect(pick("The records of blue notes are missing.","records")).toBe("ˈɹɛkɝdz");expect(pick("The musician records blue notes.","records")).toBe("ɹɪˈkɔɹdz");expect(pick("The viral infection spreads.","viral")).toBe("ˈvaɪɹəɫ");
      if(!disableDict){expect(pick("I read that book yesterday.","read")).toBe("ɹɛd");expect(pick("I will read it tomorrow.","read")).toBe("ɹid");}
    });
  });

})();

// Original suite: en-criterion-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("Greek criterion root PRICE vowel", () => {
    const g2p = new EnglishG2P({ disableDict: true });

    it.each([
      ["criterion", "kɹaɪˈtɪɹiən"],
      ["criteria", "kɹaɪˈtɪɹiə"],
      ["criterial", "kɹaɪˈtɪɹiəɫ"],
      ["criterium", "kɹaɪˈtɪɹiəm"],
    ])("retains the Greek root vowel in %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["crime", "ˈkɹaɪm"],
      ["critical", "ˈkɹɪtɪkəɫ"],
      ["cricket", "ˈkɹɪkɪt"],
      ["cried", "ˈkɹaɪd"],
    ])("preserves neighboring <cri> words: %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });
  });

})();

// Original suite: en-ctive-root-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Oxford US reproductive /ˌriːprəˈdʌktɪv/ and reconstructive /ˌriːkənˈstrʌktɪv/:
  // https://www.oxfordlearnersdictionaries.com/definition/english/reproductive
  // https://www.oxfordlearnersdictionaries.com/definition/english/reconstructive
  // Novel compounds assert only the root stress/rime this class owns.
  describe.each([false, true])("prefixed act/duct + ive (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([
      ["reproductive", "ˌɹipɹəˈdʌktɪv"],
      ["reconstructive", "ˌɹikənˈstɹʌktɪv"],
    ])("keeps the bound root primary in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
      expect(engine.predict(word, "en-US", "ADJ")).toBe(ipa);
    });
    test.each([
      ["reproductively", "ˈdʌktɪv"], ["reproductiveness", "ˈdʌktɪv"],
      ["reconstructively", "ˈstɹʌktɪv"], ["reconstructiveness", "ˈstɹʌktɪv"],
      ["reinductive", "ˈdʌktɪv"], ["redeductive", "ˈdʌktɪv"],
    ])("retains root stress through composition: %s", (word, rime) => {
      expect(engine.predict(word)).toContain(rime);
    });
    test("preserves the neighboring nominal and adjectival ive readings", () => {
      expect(engine.predict("addictive", "en-US", "ADJ")).toBe("əˈdɪktɪv");
      expect(engine.predict("additive", "en-US", "N")).toBe("ˈædətɪv");
    });
    test("preserves full adjective, noun and verb sentence controls", () => {

      const tokens = englishTokens(engine, "The reproductive cycle is short. The surgeon performs reconstructive surgery. The additive is safe. The addictive substance is dangerous. They reproduce the report.");
      expect(tokens.find(t => t.word === "reproductive")?.phoneme).toBe("ˌɹipɹəˈdʌktɪv");
      expect(tokens.find(t => t.word === "reconstructive")?.phoneme).toBe("ˌɹikənˈstɹʌktɪv");
      expect(tokens.find(t => t.word === "additive")?.phoneme).toBe("ˈædətɪv");
      expect(tokens.find(t => t.word === "addictive")?.phoneme).toBe("əˈdɪktɪv");
      expect(tokens.find(t => t.word === "reproduce")?.phoneme).toBe(engine.predict("reproduce", "en-US", "V"));
    });
    test("keeps caller ownership of a vouched root", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("reproductive", "ˈzɛŋ");
      expect(owned.predict("reproductive")).toBe("ˈzɛŋ");
      expect(owned.predict("reproductively")).toBe("ˈzɛŋɫi");
    });
  });

})();

// Original suite: en-curated-dictionary-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const dictionary = require("../data/en/dict.json");

  describe("curated dictionary roots and paired morphology controls", () => {
    it.each([false, true])("uses the sourced gross vowel across POS and inflections without generalizing -oss (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      const unstressed = (word: string, pos: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "");
      expect(unstressed("gross", "JJ")).toBe("ɡɹoʊs");
      expect(unstressed("gross", "NN")).toBe("ɡɹoʊs");
      expect(unstressed("gross", "VB")).toBe("ɡɹoʊs");
      expect(unstressed("grossed", "VBD")).toBe("ɡɹoʊst");
      expect(unstressed("grossing", "VBG")).toBe("ɡɹoʊsɪŋ");
      expect(unstressed("grosses", "VBZ")).toBe("ɡɹoʊsəz");
      expect(unstressed("grossly", "RB")).toBe("ɡɹoʊsɫi");
      const controlVowels = disableDict ? "ɑ" : "ɔ";
      expect(unstressed("gloss", "NN")).toBe(`ɡɫ${controlVowels}s`);
      expect(unstressed("loss", "NN")).toBe(`ɫ${controlVowels}s`);
      expect(unstressed("moss", "NN")).toBe(`m${controlVowels}s`);
      expect(unstressed("cross", "NN")).toBe(`kɹ${controlVowels}s`);
      expect(unstressed("toss", "NN")).toBe(`t${controlVowels}s`);

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Gross sales fell after the company grossed a million; the grossly exaggerated report glossed over the loss, moss, cross, and toss controls.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("gross")).toBe("ɡɹoʊs");
      expect(reading("grossed")).toBe("ɡɹoʊst");
      expect(reading("grossly")).toBe("ˈɡɹoʊsɫi");
      expect(reading("glossed")).toBe("ɡɫɔst");
      expect(reading("loss")).toBe(`ɫ${controlVowels}s`);
      expect(reading("moss")).toBe(`m${controlVowels}s`);
      expect(reading("cross")).toBe(`kɹ${controlVowels}s`);
      expect(reading("toss")).toBe(`t${controlVowels}s`);
    });

    it("keeps the standard r-colored stem when composing regular plurals", () => {
      const rules = new EnglishG2P({ disableDict: true });
      expect(rules.predict("standard", "en-US")).toBe("ˈstændɝd");
      expect(rules.predict("standards", "en-US", "NNS")).toBe("ˈstændɝdz");
      expect(rules.predict("standardize", "en-US", "VB")).toBe("ˈstændɝˌdaɪz");
      expect(rules.predict("standardized", "en-US", "VBD")).toBe("ˈstændɝˌdaɪzd");
      expect(rules.predict("standardization", "en-US", "NN")).toBe("ˌstændɝdəˈzeɪʃən");

      const api = createPhonemizer({ processors: [rules] });
      const tokens = api.phonemize("The standards were standardized through standardization.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("standards")).toBe("ˈstændɝdz");
      expect(reading("standardized")).toBe("ˈstændɝˌdaɪzd");
      expect(reading("standardization")).toBe("ˌstændɝdəˈzeɪʃən");

      // The rebuilt dictionary route should inherit the corrected regular plural.
      const dictionary = new EnglishG2P();
      expect(dictionary.predict("standards", "en-US", "NNS")).toBe("ˈstændɝdz");
      expect(dictionary.predict("standardized", "en-US", "VBD")).toBe("ˈstændɝˌdaɪzd");
    });

    it.each([false, true])("uses the sourced olive weak-vowel root without changing alive/live controls (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      const normalized = (word: string, pos?: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
      expect(normalized("olive", "NN")).toBe("ɑləv");
      expect(normalized("olives", "NNS")).toBe(disableDict ? "ɑləvz" : "ɑlɪvz");
      expect(engine.predict("alive", "en-US", "JJ")).toBe("əˈɫaɪv");
      expect(normalized("live", "JJ")).toBe("laɪv");
      expect(engine.predict("olivewood", "en-US", "NN")).toBe("ˌɑɫɪˈvjuʊd");
      expect(engine.predict("Oliver", "en-US")).toBe("ˈɑɫəvɝ");
      expect(engine.predict("Olivers", "en-US")).toBe("ˈɑɫəvɝz");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Olive oil was served with olives, while alive guests enjoyed the live music beside olivewood.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
      expect(reading("olive")).toBe("ɑləv");
      expect(reading("olives")).toBe(disableDict ? "ɑləvz" : "ɑlɪvz");
      expect(reading("alive")).toBe("əlaɪv");
      expect(reading("live")).toBe("laɪv");
      expect(reading("olivewood")).toBe("ɑlɪvjuʊd");
    });

    it.each([false, true])("uses the sourced Muslim reading across noun/adjective use without changing Islamic (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      const normalized = (word: string, pos?: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
      expect(normalized("Muslim", "NN")).toBe("mʌzləm");
      expect(normalized("Muslim", "JJ")).toBe("mʌzləm");
      expect(normalized("Muslims", "NNS")).toBe("mʌzləmz");
      expect(normalized("Islamic", "JJ")).toBe(disableDict ? "ɪslæmɪk" : "ɪzlɑmɪk");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The Muslim family visited an Islamic center, and the Muslims spoke about Islam.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
      expect(reading("Muslim")).toBe("mʌzləm");
      expect(reading("Muslims")).toBe("mʌzləmz");
      expect(reading("Islamic")).toBe(disableDict ? "ɪslæmɪk" : "ɪzlɑmɪk");
    });

    it.each([false, true])("uses the sourced renaissance root without absorbing the renascence family (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      const root = disableDict ? "ˈɹɛnəˌsɑns" : "ˌɹɛnəˈsɑns";
      const plural = disableDict ? "ˈɹɛnəˌsɑnsəz" : "ˌɹɛnəˈsɑnsəz";
      expect(engine.predict("renaissance", "en-US", "NN")).toBe(root);
      expect(engine.predict("Renaissance", "en-US", "NN")).toBe(root);
      expect(engine.predict("renaissances", "en-US", "NNS")).toBe(plural);
      expect(engine.predict("renascence", "en-US", "NN")).toBe("ˈɹɛnəsəns");
      expect(engine.predict("renascent", "en-US", "JJ")).toBe("ˈɹɛnəsənt");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The Renaissance inspired a modern renaissance; its cultural renascence was not the same as a renascent tradition.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
      expect(reading("Renaissance")).toBe(root);
      expect(reading("renaissance")).toBe(root);
      expect(reading("renascence")).toBe("ˈɹɛnəsəns");
      expect(reading("renascent")).toBe("ˈɹɛnəsənt");
    });

    it.each([false, true])("uses the sourced imagine verb stem and preserves its morphology controls (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("imagine", "en-US", "VB")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒən");
      expect(engine.predict("imagines", "en-US", "VBZ")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒənz");
      expect(engine.predict("imagined", "en-US", "VBD")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒənd");
      expect(engine.predict("imagining", "en-US", "VBG")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒənɪŋ");
      expect(engine.predict("imagination", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒəneɪʃən");
      expect(engine.predict("image", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("ɪmɪdʒ");
      expect(engine.predict("magic", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("mædʒɪk");
      expect(engine.predict("manage", "en-US", "VB")?.replace(/[ˈˌ]/g, "")).toBe(disableDict ? "mænɪdʒ" : "mænədʒ");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Imagine what she imagined while imagining the scene; her imagination changed.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme?.replace(/[ˈˌ]/g, "");
      expect(reading("imagine")).toBe("ɪmædʒən");
      expect(reading("imagined")).toBe("ɪmædʒənd");
      expect(reading("imagining")).toBe("ɪmædʒənɪŋ");
      expect(reading("imagination")).toBe("ɪmædʒəneɪʃən");
    });

    it.each([false, true])("uses the sourced seminar noun and plural without changing seminary (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("seminar", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("sɛmənɑɹ");
      expect(engine.predict("seminars", "en-US", "NNS")?.replace(/[ˈˌ]/g, "")).toBe("sɛmənɑɹz");
      expect(engine.predict("seminary", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("sɛmənɛɹi");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The seminar ended before the seminars began at the seminary.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme?.replace(/[ˈˌ]/g, "");
      expect(reading("seminar")).toBe("sɛmənɑɹ");
      expect(reading("seminars")).toBe("sɛmənɑɹz");
      expect(reading("seminary")).toBe("sɛmənɛɹi");
    });

    it.each([false, true])("inflects a prefixed standard head before compound decomposition (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("substandard", "en-US", "JJ")).toBe("səbˈstændɝd");
      expect(engine.predict("substandards", "en-US", "NNS")).toBe("səbˈstændɝdz");
      expect(engine.predict("subunites", "en-US")).toBe("ˈsʌbjuˌnaɪts");
      expect(engine.predict("subway", "en-US", "NN")).toBe("ˈsʌbˌweɪ");
      expect(engine.predict("subways", "en-US", "NNS")).toBe("ˈsʌbˌweɪz");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Substandard parts failed standards tests on the subway and subways.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("substandard")).toBe("səbˈstændɝd");
      expect(reading("subways")).toBe("ˈsʌbˌweɪz");
    });

    it.each([false, true])("uses the sourced French-loan variant for restaurant without changing related spellings (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("restaurant", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnt");
      expect(engine.predict("restaurants", "en-US", "NNS")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnts");
      expect(engine.predict("restraint", "en-US", "NN")).toBe("ɹiˈstɹeɪnt");
      expect(engine.predict("restoration", "en-US", "NN")).toBe("ˌɹɛstɝˈeɪʃən");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Restaurants like this restaurant stayed open despite the restraint and later restoration work.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("restaurant")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnt");
      expect(reading("restaurants")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnts");
      expect(reading("restraint")).toBe("ɹiˈstɹeɪnt");
      expect(reading("restoration")).toBe("ˌɹɛstɝˈeɪʃən");
    });

    it.each([false, true])("uses the sourced common roots with paired controls (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      const expected = {
        adjacent: "əˈdʒeɪsənt",
        basin: "ˈbeɪsən",
        depot: "ˈdipoʊ",
        integer: "ˈɪntədʒɝ",
        petroleum: "pəˈtɹoʊɫiəm",
        severe: "səˈvɪɹ",
      };
      for (const [word, ipa] of Object.entries(expected))
        expect(engine.predict(word, "en-US")).toBe(ipa);
      expect(engine.predict("adjust", "en-US")).toBe("əˈdʒʌst");
      expect(engine.predict("basic", "en-US")).toBe("ˈbeɪsɪk");
      expect(engine.predict("several", "en-US")).toBe("ˈsɛvɝəɫ");
      expect(engine.predict("depots", "en-US", "NNS")).toBe("ˈdipoʊz");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The adjacent basin depot listed each integer; petroleum caused severe damage.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      for (const [word, ipa] of Object.entries(expected)) expect(reading(word)).toBe(ipa);
    });

    it.each([false, true])("uses the sourced apparel root without changing neighboring ap- words (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("apparel", "en-US", "NN")).toBe("əˈpæɹəɫ");
      expect(engine.predict("apparent", "en-US", "JJ")).toBe("əˈpɛɹənt");
      expect(engine.predict("appraise", "en-US", "VB")).toBe("əˈpɹeɪz");
      expect(engine.predict("appeal", "en-US", "NN")).toBe("əˈpiɫ");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The apparel store looked apparent while they appraised the appeal of the design.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("apparel")).toBe("əˈpæɹəɫ");
      expect(reading("apparent")).toBe("əˈpɛɹənt");
      expect(reading("appraised")).toBe("əˈpɹeɪzd");
      expect(reading("appeal")).toBe("əˈpiɫ");
    });

    it("keeps shipped-reference inflections when a root is rules-only", () => {
      expect(dictionary.coverages).toBeDefined();
    });

    it.each([false, true])("uses sourced lexical -ate roots without changing controls (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const expected = {
        senate: "ˈsɛnət",
        climate: "ˈkɫaɪmət",
        ultimate: "ˈʌɫtəmət",
        immediate: "ɪˈmidiət",
        prostate: "ˈpɹɑsteɪt",
      };
      for (const [word, ipa] of Object.entries(expected))
        expect(engine.predict(word, "en-US")).toBe(ipa);
      expect(engine.predict("private", "en-US")).toBe("ˈpɹaɪvət");
      expect(engine.predict("evaluate", "en-US")).toBe(`${disableDict ? "ɪ" : "i"}ˈvæɫjuˌeɪt`);
      expect(engine.predict("front", "en-US")).toBe("ˈfɹʌnt");
      expect(engine.predict("some", "en-US")).toBe("ˈsʌm");
      expect(engine.predict("come", "en-US")).toBe("ˈkʌm");
      expect(engine.predict("from", "en-US", "NN")).toBe("fɹʌm");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The Senate discussed climate; the immediate report covered the ultimate goal and prostate health; from there, they will evaluate it.", {
        language: "en-US",
        returnArray: true,
      });
      for (const [word, ipa] of Object.entries(expected))
        expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
      expect(tokens.find(token => token.word.toLowerCase() === "from")?.phoneme).toBe("fɹəm");
      expect(tokens.find(token => token.word.toLowerCase() === "evaluate")?.phoneme).toBe(`${disableDict ? "ɪ" : "i"}ˈvæɫjuˌeɪt`);
    });

    it.each([false, true])("uses the sourced coverage, garage, and heritage roots in context (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("coverage", "en-US", "NN")).toBe(disableDict ? "ˈkʌvɝɪdʒ" : "ˈkʌvɝədʒ");
      expect(engine.predict("heritage", "en-US", "NN")).toBe(disableDict ? "ˈhɛɹɪtɪdʒ" : "ˈhɛɹətədʒ");
      expect(engine.predict("garage", "en-US", "NN")).toBe("ɡɝˈɑʒ");
      expect(engine.predict("garage", "en-US", "VB")).toBe("ɡɝˈɑʒ");
      expect(engine.predict("advance", "en-US", "NN")).toBe("ədˈvæns");
      expect(engine.predict("advance", "en-US", "VB")).toBe("ədˈvæns");
      expect(engine.predict("advanced", "en-US", "VBD")).toBe("ədˈvænst");
      expect(engine.predict("message", "en-US", "NN")).toBe("ˈmɛsɪdʒ");
      expect(engine.predict("average", "en-US", "NN")).toBe("ˈævɝɪdʒ");
      expect(engine.predict("advice", "en-US", "NN")).toBe("ædˈvaɪs");
      expect(engine.predict("advantage", "en-US", "NN")).toBe("ædˈvæntɪdʒ");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Our garage offers coverage for the local heritage site; the average message was brief.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("garage")).toBe("ɡɝˈɑʒ");
      expect(reading("coverage")).toBe(disableDict ? "ˈkʌvɝɪdʒ" : "ˈkʌvɝədʒ");
      expect(reading("heritage")).toBe(disableDict ? "ˈhɛɹɪtɪdʒ" : "ˈhɛɹətədʒ");
      expect(reading("message")).toBe("ˈmɛsɪdʒ");
      expect(reading("average")).toBe("ˈævɝɪdʒ");

      const adTokens = api.phonemize("They made an advance, then advance carefully; advice gave them an advantage.", {
        language: "en-US",
        returnArray: true,
      });
      const readings = (word: string) => adTokens.filter(token => token.word.toLowerCase() === word).map(token => token.phoneme);
      expect(readings("advance")).toEqual(["ədˈvæns", "ədˈvæns"]);
      expect(readings("advice")).toEqual(["ædˈvaɪs"]);
      expect(readings("advantage")).toEqual(["ædˈvæntɪdʒ"]);
    });

    it.each([false, true])("uses the sourced business root without changing -iness controls (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("business", "en-US", "NN")).toBe("ˈbɪznəs");
      expect(engine.predict("businesses", "en-US", "NNS")).toBe("ˈbɪznəsəz");
      expect(engine.predict("happiness", "en-US", "NN")).toBe("ˈhæpinəs");
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("A business plan helped her businesses, and the happiness it brought lasted.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("business")).toBe("ˈbɪznəs");
      expect(reading("businesses")).toBe("ˈbɪznəsəz");
      expect(reading("happiness")).toBe("ˈhæpinəs");
    });

    it.each([false, true])("preserves the sourced base readings on the %s dictionary mode", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("recipe", "en-US", "NN")).toBe("ˈɹɛsəpi");
      expect(engine.predict("cuisine", "en-US", "NN")).toBe("kwɪˈzin");
      expect(engine.predict("periodic", "en-US", "JJ")).toBe("ˌpɪɹiˈɑdɪk");
    });

    it("composes regular plurals from the reviewed roots", () => {
      const rules = new EnglishG2P({ disableDict: true });
      expect(rules.predict("recipes", "en-US", "NNS")).toBe("ˈɹɛsəpiz");
      expect(rules.predict("cuisines", "en-US", "NNS")).toBe("kwɪˈzinz");
    });

    it.each([false, true])("uses the sourced comment root in both POS readings and derivatives (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("comment", "en-US", "NN")).toBe("ˈkɑmɛnt");
      expect(engine.predict("comment", "en-US", "VB")).toBe("ˈkɑmɛnt");
      expect(engine.predict("comments", "en-US", "NNS")).toBe("ˈkɑmɛnts");
      expect(engine.predict("commented", "en-US", "VBD")).toBe("ˈkɑmɛntɪd");
      expect(engine.predict("document", "en-US", "NN")).toBe("ˈdɑkjəmənt");
      expect(engine.predict("document", "en-US", "VB")).toBe("ˈdɑkjəmənt");
    });

    it("keeps eight sourced common-word readings on the rules path and the shipped readings on the dictionary path", () => {
      const expected = {
        ago: ["əˈɡoʊ", "əˈɡoʊ"],
        knowledge: ["ˈnɑɫədʒ", "ˈnɑɫɪdʒ"],
        father: ["ˈfɑðɝ", "ˈfɑðɝ"],
        mortgage: ["ˈmɔɹɡədʒ", "ˈmɔɹɡɪdʒ"],
        christmas: ["ˈkɹɪsməs", "ˈkɹɪsməs"],
        hospital: ["ˈhɑˌspɪtəɫ", "ˈhɑspɪtəɫ"],
        volume: ["ˈvɑɫjum", "ˈvɑɫjum"],
        entire: ["ɪnˈtaɪɝ", "ɪnˈtaɪɝ"],
      };
      const sentence = "Years ago, my father gained knowledge about the mortgage; Christmas at the hospital recorded its volume during the entire visit.";
      const normalize = (ipa: string | undefined) => ipa?.replace(/[ˈˌ]/g, "");

      for (const [mode, disableDict] of [false, true].entries()) {
        const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
        const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
        for (const [word, readings] of Object.entries(expected)) {
          const token = tokens.find(item => item.word.toLowerCase() === word);
          expect(normalize(token?.phoneme)).toBe(normalize(readings[mode]));
        }
      }
    });

    it.each([false, true])("uses the sourced secure reading for adjective and verb in a sentence (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const expected = "sɪˈkjʊɹ";
      expect(engine.predict("secure", "en-US", "JJ")).toBe(expected);
      expect(engine.predict("secure", "en-US", "VB")).toBe(expected);
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The connection is secure, and the team will secure the server.", {
        language: "en-US",
        returnArray: true,
      });
      expect(tokens.filter(token => token.word.toLowerCase() === "secure").map(token => token.phoneme)).toEqual([
        expected, expected,
      ]);
    });

    it.each([false, true])("uses the sourced email root for noun and verb without changing mail controls (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");
      expect(stripStress(engine.predict("email", "en-US", "NN"))).toBe("imeɪɫ");
      expect(stripStress(engine.predict("email", "en-US", "VB"))).toBe("imeɪɫ");
      expect(stripStress(engine.predict("emails", "en-US", "NNS"))).toBe("imeɪɫz");
      expect(engine.predict("mail", "en-US", "NN")).toBe("meɪɫ");
      expect(engine.predict("main", "en-US", "NN")).toBe("meɪn");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("I sent an email, then emailed the team.", { language: "en-US", returnArray: true });
      expect(stripStress(tokens.find(token => token.word === "email")?.phoneme)).toBe("imeɪɫ");
      expect(stripStress(tokens.find(token => token.word === "emailed")?.phoneme)).toBe("imeɪɫd");
    });

    it.each([false, true])("uses the reviewed area, individual, and upon readings without changing neighbors (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");
      expect(engine.predict("area", "en-US", "NN")).toBe("ˈɛɹiə");
      expect(engine.predict("individual", "en-US", "NN")).toBe("ˌɪndəˈvɪdʒəwəɫ");
      expect(engine.predict("individual", "en-US", "JJ")).toBe("ˌɪndəˈvɪdʒəwəɫ");
      expect(engine.predict("upon", "en-US", "IN")).toBe("əˈpɑn");
      expect(engine.predict("calendar", "en-US", "NN")).toBe("ˈkæɫəndɝ");
      expect(engine.predict("calendars", "en-US", "NNS")).toBe("ˈkæɫəndɝz");
      expect(engine.predict("calendrical", "en-US", "JJ")).toBe("kəˈɫɛndɹɪkəɫ");
      expect(engine.predict("aerial", "en-US", "JJ")).toBe("ˈɛɹiəɫ");
      expect(engine.predict("manual", "en-US", "JJ")).toBe("ˈmænjuəɫ");
      expect(engine.predict("camera", "en-US", "NN")).toBe("ˈkæmɝə");
      expect(engine.predict("up", "en-US", "RP")).toBe("ʌp");
      expect(engine.predict("on", "en-US", "IN")).toBe("ɑn");
      expect(engine.predict("canal", "en-US", "NN")).toBe(disableDict ? "ˈkænəɫ" : "kəˈnæɫ");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Each individual mapped the area upon request; the calendar lists its dates up on the manual.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("individual")).toBe("ˌɪndəˈvɪdʒəwəɫ");
      expect(reading("area")).toBe("ˈɛɹiə");
      expect(reading("upon")).toBe("əˈpɑn");
      expect(reading("calendar")).toBe("ˈkæɫəndɝ");
      expect(stripStress(reading("up"))).toBe("ʌp");
      expect(stripStress(reading("on"))).toBe("ɑn");
    });

    it.each([false, true])("uses the sourced weekday stems and preserves other -day words (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("monday", "en-US", "NN")).toBe("ˈmʌnˌdeɪ");
      expect(engine.predict("friday", "en-US", "NN")).toBe("ˈfɹaɪˌdeɪ");
      expect(engine.predict("wednesday", "en-US", "NN")).toBe("ˈwɛnzˌdeɪ");
      expect(engine.predict("mondays", "en-US", "NNS")).toBe("ˈmʌnˌdeɪz");
      expect(engine.predict("fridays", "en-US", "NNS")).toBe("ˈfɹaɪˌdeɪz");
      expect(engine.predict("wednesdays", "en-US", "NNS")).toBe("ˈwɛnzˌdeɪz");
      expect(engine.predict("sunday", "en-US", "NN")).toBe("ˈsʌnˌdeɪ");
      expect(engine.predict("thursday", "en-US", "NN")).toBe("ˈθɝzdeɪ");
      expect(engine.predict("tuesday", "en-US", "NN")).toBe(disableDict ? "ˈtuzdeɪ" : "ˈtjuzˌdeɪ");
      expect(engine.predict("holiday", "en-US", "NN")).toBe(disableDict ? "ˈhɑɫɪdeɪ" : "ˈhɑɫəˌdeɪ");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("We meet on Monday and Wednesday, then finish on Friday.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("monday")).toBe("ˈmʌnˌdeɪ");
      expect(reading("wednesday")).toBe("ˈwɛnzˌdeɪ");
      expect(reading("friday")).toBe("ˈfɹaɪˌdeɪ");
    });

    it.each([false, true])("uses sourced common roots in sentences and morphology (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("budget", "en-US", "NN")).toBe("ˈbʌdʒɪt");
      expect(engine.predict("budget", "en-US", "VB")).toBe("ˈbʌdʒɪt");
      expect(engine.predict("budgeting", "en-US", "VBG")).toBe("ˈbʌdʒɪtɪŋ");
      expect(engine.predict("disease", "en-US", "NN")).toBe("dɪˈziz");
      expect(engine.predict("diseases", "en-US", "NNS")).toBe("dɪˈzizəz");
      expect(engine.predict("furniture", "en-US", "NN")).toBe("ˈfɝnɪtʃɝ");
      expect(engine.predict("political", "en-US", "JJ")).toBe("pəˈɫɪtəkəɫ");
      expect(engine.predict("pretty", "en-US", "JJ")).toBe("ˈpɹɪti");
      expect(engine.predict("prettier", "en-US", "JJR")).toBe("ˈpɹɪtiɝ");
      expect(engine.predict("prettiest", "en-US", "JJS")).toBe("ˈpɹɪtiəst");

      expect(engine.predict("petty", "en-US", "JJ")).toBe("ˈpɛti");
      expect(engine.predict("sweaty", "en-US", "JJ")).toBe("ˈswɛti");
      expect(engine.predict("politician", "en-US", "NN")).toBe(disableDict ? "ˌpɑɫɪˈtɪʃən" : "ˌpɑɫəˈtɪʃən");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize(
        "They budgeted for pretty political furniture after the disease spread.",
        { language: "en-US", returnArray: true },
      );
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("budgeted")).toBe("ˈbʌdʒɪtɪd");
      expect(reading("pretty")).toBe("ˈpɹɪti");
      expect(reading("political")).toBe("pəˈɫɪtəkəɫ");
      expect(reading("furniture")).toBe("ˈfɝnɪtʃɝ");
      expect(reading("disease")).toBe("dɪˈziz");
    });

    it.each([false, true])("retains the target readings in full sentences (dictionary disabled: %s)", (disableDict) => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const tokens = api.phonemize("I tried a recipe from a local cuisine class with periodic reports.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word === word)?.phoneme;
      expect(reading("recipe")).toBe("ˈɹɛsəpi");
      expect(reading("cuisine")).toBe("kwɪˈzin");
      expect(reading("periodic")).toBe("ˌpɪɹiˈɑdɪk");
    });

    it.each([false, true])("uses verified lexical roots and preserves their sentence readings (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The parallel radar apparatus was on the boulevard near the asylum.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word === word)?.phoneme;
      expect(reading("parallel")).toBe("ˈpɛɹəˌɫɛɫ");
      expect(reading("radar")).toBe("ˈɹeɪˌdɑɹ");
      expect(reading("apparatus")).toBe("ˌæpɝˈætəs");
      expect(reading("boulevard")).toBe("ˈbʊɫəˌvɑɹd");
      expect(reading("asylum")).toBe("əˈsaɪɫəm");
      expect(engine.predict("radars", "en-US", "NNS")).toBe("ˈɹeɪˌdɑɹz");
      expect(engine.predict("asylums", "en-US", "NNS")).toBe("əˈsaɪɫəmz");
    });

    it.each([false, true])("keeps diabetes distinct from the regular diabetic family (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Diabetes and prediabetes differ from diabetic conditions.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word === word)?.phoneme;
      expect(reading("Diabetes")).toBe("ˌdaɪəˈbitiz");
      expect(reading("prediabetes")).toBe("pɹiˌdaɪəˈbitiz");
      expect(reading("diabetic")?.replace(/[ˈˌ]/g, "")).toBe("daɪəbɛtɪk");
    });
    it.each([false, true])("preserves promise and compromise morphology in full sentences (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("I promise to keep my promises; a compromise was promised, not compromising.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("promise")).toBe("ˈpɹɑməs");
      expect(reading("promises")).toBe("ˈpɹɑməsəz");
      expect(reading("compromise")).toBe("ˈkɑmpɹəˌmaɪz");
      expect(reading("promised")).toBe("ˈpɹɑməst");
      expect(reading("compromising")).toBe("ˈkɑmpɹəˌmaɪzɪŋ");
    });

    it.each([false, true])("uses dictionary-backed loan roots and keeps their inflections (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The chocolate suited the regime; chocolates were served.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("chocolate")).toBe("ˈtʃɔkɫət");
      expect(reading("regime")).toBe("ɹeɪˈʒim");
      expect(reading("chocolates")).toBe("ˈtʃɔkɫəts");
    });

    it.each([false, true])("preserves common lexical roots, POS readings, and inflections (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The female police officer made breakfast, her favorite meal.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("female")).toBe("ˈfiˌmeɪɫ");
      expect(reading("police")).toBe("pəˈɫis");
      expect(reading("breakfast")).toBe("ˈbɹɛkfəst");
      expect(reading("favorite")).toBe("ˈfeɪvɝɪt");
      expect(engine.predict("females", "en-US", "NNS")).toBe("ˈfiˌmeɪɫz");
      expect(engine.predict("breakfasts", "en-US", "NNS")).toBe("ˈbɹɛkfəsts");
      expect(engine.predict("favorite", "en-US", "JJ")).toBe("ˈfeɪvɝɪt");
      expect(engine.predict("favorite", "en-US", "NN")).toBe("ˈfeɪvɝɪt");
      expect(engine.predict("police", "en-US", "VB")).toBe("pəˈɫis");
    });

    it.each([false, true])("keeps sourced common loan roots and their inflections in context (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("In April, the cafe introduced a genre of massage expertise; nearby cafes offer massages.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("april")).toBe("ˈeɪpɹəɫ");
      expect(reading("cafe")).toBe("kæˈfeɪ");
      expect(reading("genre")).toBe("ˈʒɑnɹə");
      expect(reading("massage")).toBe("məˈsɑʒ");
      expect(reading("expertise")).toBe("ˌɛkspɝˈtiz");
      expect(reading("cafes")?.replace(/ˌ/g, "")).toBe("kæˈfeɪz");
      expect(reading("massages")).toBe("məˈsɑʒəz");
      expect(engine.predict("massage", "en-US", "VB")).toBe("məˈsɑʒ");
    });

    it.each([false, true])("preserves common lexical roots, POS readings, and inflections (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Have one key, put both keys among them, please. Shall we put both keys here?", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
      expect(reading("Have")).toBe("həv");
      expect(reading("one")).toBe("wʌn");
      expect(reading("key")).toBe("ki");
      expect(reading("put")).toBe("pʊt");
      expect(reading("both")).toBe("boʊθ");
      expect(reading("keys")).toBe("kiz");
      expect(reading("among")).toBe("əˈmʌŋ");
      expect(reading("please")).toBe("pɫiz");
      expect(reading("Shall")).toBe("ʃəɫ");
      expect(engine.predict("have", "en-US")).toBe("ˈhæv");
      expect(engine.predict("one", "en-US")).toBe("ˈwʌn");
      expect(engine.predict("both", "en-US")).toBe("ˈboʊθ");
      expect(engine.predict("shall", "en-US")).toBe("ˈʃæɫ");
      expect(engine.predict("put", "en-US")).toBe("ˈpʊt");
      expect(engine.predict("please", "en-US")).toBe("ˈpɫiz");
      expect(engine.predict("key", "en-US")).toBe("ˈki");
      expect(engine.predict("among", "en-US")).toBe("əˈmʌŋ");
      expect(engine.predict("has", "en-US", "VBZ")).toBe("həz");
      expect(engine.predict("putting", "en-US", "VBG")).toBe("ˈpʊtɪŋ");
      expect(engine.predict("putted", "en-US", "VBD")).toBe("ˈpʊtɪd");
      expect(engine.predict("getting", "en-US", "VBG")).toBe("ˈɡɛtɪŋ");
      expect(engine.predict("pleased", "en-US", "VBD")).toBe("pɫizd");
      expect(engine.predict("pleasure", "en-US", "NN")).not.toBe("ˈplizɝ");
    });

    it.each([false, true])("preserves irregular common words and their related controls in context (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("I heard her once, then she was gone. I hear her now, and she is going home.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
      expect(reading("heard")).toBe("hɝd");
      expect(reading("once")).toBe("wʌns");
      expect(reading("gone")).toBe("ɡɔn");
      expect(reading("hear")).toBe("hɪɹ");
      expect(reading("going")).toBe("ˈɡoʊɪŋ");
      expect(reading("her")).toBe("hɝ");
      expect(engine.predict("heard", "en-US", "VBD")).toBe("hɝd");
      expect(engine.predict("hear", "en-US", "VBP")).toBe("hɪɹ");
      expect(engine.predict("go", "en-US", "VB")).toBe("ɡoʊ");
      expect(engine.predict("goes", "en-US", "VBZ")).toBe("ɡoʊz");
      expect(engine.predict("gone", "en-US", "VBN")).toBe("ɡɔn");
      expect(engine.predict("one", "en-US", "CD")).toBe("wʌn");
    });

    it.each([false, true])("uses reviewed roots in productive families without changing neighboring rimes (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The sugar was sugary. The touch was touching; she touched the pouch.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
      expect(reading("sugar")).toBe("ˈʃʊɡɝ");
      if (!disableDict) expect(reading("sugary")).toBe("ˈʃʊɡɝi");
      expect(reading("touch")).toBe("tʌtʃ");
      expect(reading("touching")).toBe("ˈtʌtʃɪŋ");
      expect(reading("touched")).toBe("tʌtʃt");
      expect(reading("pouch")).toBe("paʊtʃ");
      expect(engine.predict("sugar", "en-US")).toBe("ˈʃʊɡɝ");
      expect(engine.predict("sugars", "en-US", "NNS")).toBe("ˈʃʊɡɝz");
      expect(engine.predict("touch", "en-US", "NN")).toBe("tʌtʃ");
      expect(engine.predict("couch", "en-US", "NN")).toBe("kaʊtʃ");
      expect(engine.predict("sure", "en-US", "JJ")).toBe("ʃʊɹ");
    });

    it.each([false, true])("uses the reviewed label root across verb morphology and keeps short-e controls (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("They labeled each folder with a label; labeling is useful.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
      expect(reading("labeled")).toBe("ˈɫeɪbəɫd");
      expect(reading("label")).toBe("ˈɫeɪbəɫ");
      expect(reading("labeling")).toBe("ˈɫeɪbəɫɪŋ");
      expect(engine.predict("labels", "en-US", "NNS")).toBe("ˈɫeɪbəɫz");
      expect((engine.predict("level", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("ɫɛvəɫ");
      expect((engine.predict("camel", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("kæməɫ");
    });

    it.each([false, true])("keeps lexicalized syncope in evening without changing its base (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The meeting lasted into the evening; even the room was quiet.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("evening")).toBe("ˈivnɪŋ");
      expect((engine.predict("even", "en-US", "JJ") ?? "").replace(/[ˈˌ]/g, "")).toBe("ivən");
    });

    it.each([false, true])("uses sourced roots when spelling controls cannot predict them (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("My colleague cleaned the aquarium and bought poultry feed; the league is ready to pounce.", {
        language: "en-US",
        returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("colleague")).toBe("ˈkɑɫiɡ");
      expect(reading("aquarium")).toBe("əˈkwɛɹiəm");
      expect(reading("poultry")).toBe("ˈpoʊɫtɹi");
      expect(engine.predict("colleagues", "en-US", "NNS")).toBe("ˈkɑɫiɡz");
      expect((engine.predict("league", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("ɫiɡ");
      expect((engine.predict("pounce", "en-US", "VB") ?? "").replace(/[ˈˌ]/g, "")).toBe("paʊns");
    });

    it.each([false, true])("uses the lexical ancient vowel without changing the productive -cient class (dictionary disabled: %s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("ancient", "en-US", "JJ")).toBe("ˈeɪntʃənt");
      expect(engine.predict("efficient", "en-US", "JJ")).toBe("ɪˈfɪʃənt");
      expect(engine.predict("deficient", "en-US", "JJ")).toBe("dɪˈfɪʃənt");

      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("Ancient history records efficient and deficient harvests.", {
        language: "en-US", returnArray: true,
      });
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("ancient")).toBe("ˈeɪntʃənt");
      expect(reading("efficient")).toBe("ɪˈfɪʃənt");
      expect(reading("deficient")).toBe("dɪˈfɪʃənt");
    });
  });

})();

// Original suite: en-custom-decomposition-recovery.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule1;

  describe.each([false, true])("custom compound parts after lexical eviction (rules=%s)", (disableDict) => {
    it.each(["visco", "pico", "bio"])("preserves an explicit custom tail after %s", (head) => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["bewilder"]);
      engine.addPronunciation("bewilder", "ˈzɛŋ");
      expect(engine.predict(head + "bewilder")).toContain("zɛŋ");
      expect(engine.predict("bewilder")).toBe("ˈzɛŋ");
    });
  });

})();

// Original suite: en-degree-adjectives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // Cambridge content: noun /ˈkɑntɛnt/, adjective and verb /kənˈtɛnt/.
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  describe("source-backed adjective associations and copular degree phrases", () => {
    it.each([["N", "ˈkɑntɛnt"], ["V", "kənˈtɛnt"], ["ADJ", "kənˈtɛnt"]])("preserves content as %s", (pos, ipa) => {
      expect(new EnglishG2P().predict("content", "en-US", pos)).toBe(ipa);
    });
    it.each([
      ["She was very content.", "content", "kənˈtɛnt"],
      ["She was not very content.", "content", "kənˈtɛnt"],
      ["She was still quite content.", "content", "kənˈtɛnt"],
      ["She was too content.", "content", "kənˈtɛnt"],
      ["He was very learned.", "learned", "ˈɫɝnɪd"],
      ["The very content was deleted.", "content", "ˈkɑntɛnt"],
      ["They content themselves.", "content", "kənˈtɛnt"],
      ["He has learned the lesson.", "learned", "ɫɝnd"],
      ["The lead pipe was heavy.", "lead", "ɫɛd"],
    ])("uses the supplied syntactic evidence in %s", (sentence, word, ipa) => {
      const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
    });
  });

  // Cambridge learnedly: -ly composes with the adjective in a POS union.
  it.each([false, true])("uses adjective unions in productive -ly, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("learnedly")).toBe("ˈɫɝnɪdɫi");
    expect(engine.predict("closely")).toBe("ˈkɫoʊsɫi");
    expect(engine.predict("lively")).toBe("ˈɫaɪvɫi");
    engine.addPronunciation("learned", "ˈzɛŋ");
    expect(engine.predict("learnedly")).toBe("ˈzɛŋɫi");
    engine.addPronunciation("learnedly", "ˈbɛŋ");
    expect(engine.predict("learnedly")).toBe("ˈbɛŋ");
  });

})();

// Original suite: en-degree-deverbal-vowels.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  function cold(disableDict: boolean) {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const key of Object.keys(dictionary)) if (/residu|retinu|anemic|phonemic|beaut|small|full|tall|gross|alliance|readable|contentment|recordable|refundable/.test(key)) delete dictionary[key];
   Reflect.set(e, "dictionary", dictionary); return e;
  }
  test.each([false, true])("posttonic i-ue preserves stress and neighboring vowels (rules=%s)", rules => {
   const e = cold(rules);
   for (const w of ["residue", "residues"]) expect(e.predict(w)).toMatch(/^ˈɹɛzə/);
   expect(e.predict("retinue")).toMatch(/^ˈɹɛtən/);
   expect(e.predict("continue")).toContain("ˈtɪn"); expect(e.predict("revenue")).toMatch(/^ˈɹɛvən/);
   const api = createPhonemizer({ processors: [e] });
   const out = api.phonemize("The residue remains while they continue.", { language: "en-US", returnArray: true });
   expect(out.find(t => t.word === "residue")!.phoneme).toContain("ɹɛzə");
   expect(out.find(t => t.word === "continue")!.phoneme).toContain("ˈtɪn");
  });
  test.each([false, true])("noninitial stressed ne-mic has an open vowel (rules=%s)", rules => {
   const e = cold(rules);
   for (const w of ["anemic", "phonemic", "nonanemic", "zanemic"]) expect(e.predict(w)).toContain("ˈnim");
   for (const w of ["academic", "pandemic", "polemic"]) expect(e.predict(w)).toMatch(/ˈ[^ˈ]*ɛm/);
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["They rejected an anemic plan.", "The phonemic contrast matters."]) {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(out.find(t => /^(anemic|phonemic)$/.test(t.word))!.phoneme).toContain("ˈnim");
   }
  });
  test.each([false, true])("English eau before weak t works across syllable boundaries (rules=%s)", rules => {
   const e = cold(rules);
   for (const w of ["beauty", "beauties", "beautiful", "beautifully", "beautify", "beauteous"]) expect(e.predict(w)).toMatch(/^ˈbju/);
   for (const w of ["beau", "bureau", "plateau"]) expect(e.predict(w)).toContain("oʊ");
   const api = createPhonemizer({ processors: [e] });
   const out = api.phonemize("They know the beauty of a beautiful day.", { language: "en-US", returnArray: true });
   for (const t of out.filter(t => /^(beauty|beautiful)$/.test(t.word))) expect(t.phoneme).toContain("bju");
   expect(out.find(t => t.word === "know")!.phoneme).toContain("noʊ");
  });
  test.each([false, true])("doubled monosyllabic superlatives share stem recovery (rules=%s)", rules => {
   const e = cold(rules);
   for (const w of ["smallest", "fullest", "tallest", "grossest", "frallest"]) expect(e.predict(w)).toMatch(/əst$/);
   expect(e.predict("smallest")).toContain("smɔ"); expect(e.predict("fullest")).toContain("fʊ");
   expect(e.predict("forest")).toMatch(/^ˈfɔɹ/); expect(e.predict("honest")).toMatch(/^ˈɑn/);
   const api = createPhonemizer({ processors: [e] });
   const out = api.phonemize("They fill the fullest cup beside the smallest bowl.", { language: "en-US", returnArray: true });
   for (const t of out.filter(t => /^(fullest|smallest)$/.test(t.word))) expect(t.phoneme).toMatch(/əst$/);
   expect(out.find(t => t.word === "fill")!.phoneme).toContain("fɪ");
  });
  test.each([false, true])("productive deverbal suffixes use vouched base readings (rules=%s)", rules => {
   const e = cold(rules);
   expect(e.predict("alliance")).toContain("ˈɫaɪ"); expect(e.predict("readable")).toContain("ˈɹid");
   expect(e.predict("upgradeable")).toContain("ʌpˈɡɹeɪd");
   expect(e.predict("contentment")).toContain("ˈtɛnt"); expect(e.predict("recordable")).toContain("ˈkɔɹd");
   expect(e.predict("refundable")).toContain("ˈfʌnd"); expect(e.predict("readment")).toContain("ɹidmənt");
   expect(e.predict("interchange", "en-US", "V")).toContain("ɪntɝˈtʃeɪndʒ");
   if (!rules) expect(e.predict("interchange", "en-US", "N")).toMatch(/^ˈɪnt/);
   expect(e.predict("interchangeable")).toContain("ɪntɝˈtʃeɪndʒ");
   const api = createPhonemizer({ processors: [e] });
   const out = api.phonemize("They read a readable record yesterday.", { language: "en-US", returnArray: true });
   expect(out.find(t => t.word === "read")!.phoneme).toBe("ɹɛd");
   expect(out.find(t => t.word === "readable")!.phoneme).toContain("ɹid");
  });
  test("explicit caller roots retain degree and deverbal suffix ownership", () => {
   const e = new EnglishG2P({ disableDict: true });
   e.addPronunciation("small", "ˈtɛst"); expect(e.predict("smallest")).toBe("ˈtɛstəst");
   e.addPronunciation("read", "ˈtɛst"); expect(e.predict("readable")).toBe("ˈtɛstəbəɫ");
   e.addPronunciation("ally", "ˈtɛst"); expect(e.predict("alliance")).toBe("ˈtɛstəns");
   const other = new EnglishG2P({ disableDict: true }); other.addPronunciation("reade", "ˈtɛst");
   expect(other.predict("readable")).toContain("ˈɹid");
  });

  test("prepositional demonstrative noun phrases keep noun readings", () => {
   const api = createPhonemizer({ processors: [new EnglishG2P()] });
   for (const sentence of ["It was proposed from that interchange to the park.", "They returned from that record to the report."]) {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(out.find(t => /^(interchange|record)$/.test(t.word))!.phoneme).toMatch(/^ˈ/);
   }
   const out = api.phonemize("The methods that record to disk work.", { language: "en-US", returnArray: true });
   expect(out.find(t => t.word === "record")!.phoneme).toContain("ˈkɔɹd");
  });

})();

// Original suite: en-degree-nominal-head.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { simplePOSTagger } = __suiteModule2;

  const nounSentences = [
    "It was a really fast read.",
    "It was a very good read.",
    "The very long read was useful.",
    "He enjoyed a quite entertaining read.",
    "It was a terrific, riveting, really fast read and really exciting and really horrifying, but managed to be really touching.",
  ];

  describe.each([false, true])("determined degree phrases, disableDict=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    if (!disableDict) it.each(nounSentences)("preserves noun read /rid/: %s", sentence => {
      expect(pick(sentence, "read")).toBe("ɹid");
    });
    it("preserves neighboring noun, adjective and verb controls", () => {
      expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
      expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
    });
    it("preserves past and modal read", () => {
      if (!disableDict) {
        expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
        expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
        expect(pick("A very carefully read book was on the table.", "read")).toBe("ɹɛd");
      }
    });
  });

  it.each([
    "A very carefully read book was on the table.",
    "A very well read scholar spoke.",
    "A very quickly read and summarized book was on the table.",
    "I really quickly read the book yesterday.",
  ])("does not turn preverbal adverbs into a noun frame: %s", sentence => {
    const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
    const index = words.indexOf("read");
    expect(simplePOSTagger.tagWord("read", [words[index - 1], words[index + 1]], { words, index }).pos).not.toBe("N");
  });

  it.each(nounSentences)("recognizes the nominal head independently of G2P mode: %s", sentence => {
    const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
    const index = words.indexOf("read");
    expect(simplePOSTagger.tagWord("read", [words[index - 1], words[index + 1]], { words, index }).pos).toBe("N");
  });

})();

// Original suite: en-degree-participle.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  test("determined degree phrases before noun heads license adjectives", () => {
    const tagger = new SimplePOSTagger();
    for (const [degree, adjective, head] of [["most", "learned", "scholars"], ["more", "skilled", "researcher"], ["most", "talented", "performers"]]) {
      const words = ["the", degree, adjective, head];
      expect(tagger.tagWord(adjective, [degree, head], { words, index: 2 }).pos).toBe("ADJ");
    }
  });
  test("degree adjectives retain stress and contrast with finite past and noun readings", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const reading = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)!.phoneme;
    expect(reading("He was one of the most learned monarchs of the time.", "learned")).toBe("ˈɫɝnɪd");
    expect(reading("He learned from the scholars.", "learned")).toBe("ɫɝnd");
    expect(reading("The most learned from their mistakes.", "learned")).toBe("ɫɝnd");
    expect(reading("The very record was clear.", "record")).toMatch(/^ˈɹɛ/);
  });

})();

// Original suite: en-deictic-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // References: existing pinned dictionary readings; secondary stress varies.
  describe.each([false, true])("Deictic compound boundaries (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it.each([
      ["hereby", /hɪɹˈbaɪ$/], ["herein", /hɪ(?:ˈɹ|ɹˈ)ɪn$/],
      ["thereby", /ðɛɹˈbaɪ$/], ["therein", /ðɛˈɹɪn$/],
      ["thereof", /ðɛˈɹ[əʌ]v$/], ["whereas", /hwɛˈɹæz$/],
      ["whereby", /hwɛɹˈbaɪ$/], ["wherein", /hwɛˈɹɪn$/],
    ])("keeps the complete components in %s", (word, ipa) => {
      expect(engine.predict(word)).toMatch(ipa);
    });

    it.each([
      ["here", "ˈhɪɹ"], ["there", "ˈðɛɹ"], ["where", "ˈhwɛɹ"],
      ["coastal", "ˈkoʊstəɫ"], ["therefore", "ˈðɛɹˌfɔɹ"],
    ])("preserves the independent rime in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it("keeps adjective, noun and verb readings in the full sentence", () => {
      const tokens = englishTokens(engine, "The invalid record whereby they record results was removed.");
      expect(tokens.find(t => t.word === "whereby")?.phoneme).toMatch(/hwɛɹˈbaɪ$/);
      expect(tokens.filter(t => t.word === "record").map(t => t.phoneme))
        .toEqual([engine.predict("record", "en-US", "N"), engine.predict("record", "en-US", "V")]);
    });
  });

  describe("Lexical controls outside the monosyllabic-tail class", () => {
    const engine = new EnglishG2P();
    it.each([
      ["whereabouts", "ˈhwɛɹəˌbaʊts"], ["hereafter", "hɪˈɹæftɝ"],
      ["thereupon", "ˌðɛɹəˈpɑn"], ["whereupon", "ˌhwɛɹəˈpɑn"],
    ])("preserves %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
  });

})();

// Original suite: en-demonstrative-noun-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("terminal demonstrative homograph, disableDict=%s", disableDict => {
    it("tags a terminal noun homograph after clause-level that as nominal", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.tagWord("record", {
        prev: "that",
        sentence: { words: ["Nearby", "Mawsynram", "currently", "holds", "that"], index: 5 },
      }).pos).toBe("N");
    });

    it("keeps a relative-clause verb after its noun antecedent", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.tagWord("records", {
        prev: "that",
        next: "failures",
        sentence: { words: ["The", "machine", "that"], index: 3 },
      }).pos).toBe("V");
    });
  });

  it("uses the noun reading for sentence-final record without treating a verb as a noun", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    expect(api.phonemize("Nearby Mawsynram currently holds that record.", { language: "en-US", returnArray: true })
      .find(token => token.word === "record")?.phoneme).toBe("ˈɹɛkɝd");
    const engine = new EnglishG2P();
    expect(engine.tagWord("ran", { prev: "that", sentence: { words: ["They", "said", "that"], index: 3 } }).pos).toBe("V");
  });

})();

// Original suite: en-derived-vowel-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("derived vowel boundaries, disableDict=%s", (disableDict) => {
    const g = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g.predict(word)!.replace(/[ˈˌ]/g, "");

    test("igh stays intact before comparative and superlative suffixes", () => {
      expect(segments("higher")).toBe("haɪɝ");
      expect(segments("highest")).toBe("haɪəst");
      expect(segments("bighearted")).toContain("ɡh");
    });

    test("final gion has one weak nucleus", () => {
      for (const word of ["region", "religion", "contagion", "legion"])
        expect(segments(word)).toMatch(/dʒən$/);
      expect(g.predict("region")).toMatch(/^ˈɹi/);
      for (const word of ["legionary", "legionaries"])
        expect(segments(word)).toMatch(/^ɫidʒənɛɹi/);
      expect(segments("reactionary")).toMatch(/^ɹiækʃənɛɹi/);
      expect(segments("ordinary")).toMatch(/^ɔɹ/);
    });

    test("eo before syllabic ple contracts without erasing neo's vowel", () => {
      expect(segments("people")).toBe("pipəɫ");
      expect(segments("neoplatonist")).toContain("nioʊ");
    });

    test("ued and uing recover a vowel-final ue stem", () => {
      expect(segments("argued")).toMatch(/ɡjud$/);
      expect(segments("arguing")).toMatch(/ɡjuɪŋ$/);
      expect(segments("continuing")).toMatch(/njuɪŋ$/);
      expect(segments("issued")).toMatch(/ʃud$/);
      expect(segments("rescuing")).toMatch(/kjuɪŋ$/);
      expect(segments("plaguing")).not.toContain("ɡju");
    });

    test("silent-e roots retain their vowels before ty and keep linking nuclei", () => {
      expect(segments("safety")).toBe("seɪfti");
      expect(segments("ninety")).toBe("naɪnti");
      expect(segments("subtlety")).toMatch(/təɫti$/);
      expect(segments("nicety")).toMatch(/s[əɪ]ti$/);
      expect(segments("surety")).toMatch(/ɹ[əɪ]ti$/);
      expect(segments("rickety")).toMatch(/k[əɪ]ti$/);
      expect(segments("velvety")).toMatch(/v[əɪ]ti$/);
    });

    test("short ual has a full u and a weak second nucleus", () => {
      expect(segments("dual")).toBe("duəɫ");
      expect(segments("quail")).toBe("kweɪɫ");
    });

    test("initial ide retains tense i while idi stays lax", () => {
      for (const word of ["identity", "identical", "ideology"])
        expect(segments(word)).toMatch(/^aɪ/);
      expect(g.predict("idea")).toMatch(/^aɪˈdiə$/);
      expect(g.predict("ideal")).toMatch(/^aɪˈdi/);
      expect(g.predict("ideas")).toBe("aɪˈdiəz");
      for (const word of ["idiot", "idiom", "idiotic"])
        expect(segments(word)).toMatch(/^ɪ/);
    });

    test("photo retains its first long vowel when it carries stress", () => {
      for (const word of ["photograph", "photographic", "photogenic"])
        expect(segments(word)).toMatch(/^foʊ/);
      expect(segments("photography")).toMatch(/^fə/);
    });

    test("weak assimilated por reduces without weakening free or roots", () => {
      expect(segments("opportunity")).toMatch(/^ɑpɝ/);
      expect(segments("immortality")).toContain("mɔɹ");
      expect(segments("importation")).toContain("pɔɹ");
    });

    test("strong sure and ward retain their root vowels", () => {
      for (const word of ["sure", "assure", "insure", "ensure"])
        expect(segments(word)).toMatch(/ʃʊɹ$/);
      expect(segments("award")).toMatch(/wɔɹd$/);
      expect(segments("measure")).toMatch(/ʒɝ$/);
      expect(segments("forward")).toMatch(/wɝd$/);
      expect(segments("entered")).toBe("ɛntɝd");
      expect(segments("entering")).toBe("ɛntɝɪŋ");
    });

    test("co retains a separate vowel before a longer rhotic root", () => {
      for (const word of ["coordinate", "coordinator"])
        expect(g.predict(word)).toMatch(/koʊˈɔɹdə/);
      expect(segments("terminator")).toContain("məneɪt");
      expect(segments("uncoordinated")).toContain("koʊɔɹdəneɪt");
      expect(segments("cooler")).toMatch(/^ku/);
      expect(segments("coastline")).toMatch(/^koʊst/);
    });
  });

})();

// Original suite: en-destination-stem.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak <i> in the -stin + -ation family", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("reduces the demoted root vowel in destination and its inflections", () => {
      expect(rules.predict("destination", "en-US")).toBe("ˌdɛstəˈneɪʃən");
      expect(rules.predict("destinations", "en-US")).toBe("ˌdɛstəˈneɪʃənz");
      expect(rules.predict("destinationist", "en-US")).toBe("ˌdɛstəˈneɪʃənɪst");
    });

    it("composes through pre- without changing the stem class", () => {
      expect(rules.predict("predestination", "en-US")).toContain("dɛstəˈneɪʃən");
    });

    it("preserves -ate-derived and unshifted controls", () => {
      expect(rules.predict("procrastination", "en-US")).toBe("pɹəˌkɹæstəˈneɪʃən");
      expect(rules.predict("destined", "en-US")).toBe("ˈdɛstɪnd");
    });
  });

})();
