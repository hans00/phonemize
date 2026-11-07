// Original suite: en-ough-contextual-rimes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  const withoutStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");

  describe("contextual ough rimes", () => {
    it.each([false, true])("reads through and though across dictionary modes (disableDict=%s)", disableDict => {
      const g2p = new EnglishG2P({ disableDict });
      expect(g2p.predict("through", "en-US")).toBe("ˈθɹu");
      expect(g2p.predict("though", "en-US")).toBe("ˈðoʊ");
      expect(withoutStress(g2p.predict("although", "en-US"))).toBe("ɔɫðoʊ");
    });

    it("preserves the distinct rough, tough and thought rimes", () => {
      const g2p = new EnglishG2P({ disableDict: true });
      expect(g2p.predict("rough", "en-US")).toBe("ˈɹʌf");
      expect(g2p.predict("tough", "en-US")).toBe("ˈtʌf");
      expect(g2p.predict("thought", "en-US")).toBe("ˈθɔt");
    });

    it("keeps the corrected rimes and neighbors in full sentences", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
      const tokens = phonemizer.phonemize("Although it was rough, we went through, though it was tough.", {
        language: "en-US", returnArray: true,
      });
      const ipa = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(withoutStress(ipa("although"))).toBe("ɔɫðoʊ");
      expect(withoutStress(ipa("through"))).toBe("θɹu");
      expect(withoutStress(ipa("though"))).toBe("ðoʊ");
      expect(withoutStress(ipa("rough"))).toBe("ɹʌf");
      expect(withoutStress(ipa("tough"))).toBe("tʌf");
    });
  });

})();

// Original suite: en-ough-inflection-boundaries.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("ough at a vowel suffix boundary, rules=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["roughest", "ˈɹʌfəst"],
      ["toughen", "ˈtʌfən"],
      ["toughest", "ˈtʌfəst"],
      ["toughie", "ˈtʌfi"],
      ["roughen", "ˈɹʌfən"],
      ["rougher", "ˈɹʌfɝ"],
      ["higher", "ˈhaɪɝ"],
      ["highest", "ˈhaɪəst"],
      ["ghost", "ˈɡoʊst"],
      ["bougher", "ˈbaʊɝ"],
    ])("preserves stems, derivations and neighboring rimes: %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("leaves a real g+h boundary sounded", () => {
      expect(engine.predict("bighearted")).toMatch(/bɪɡ[ˈˌ]hɑɹtɪd$/);
    });
    it("preserves whole-target caller priority", () => {
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("roughen", "ˈzɛŋ");
      expect(own.predict("roughen")).toBe("ˈzɛŋ");
    });
    it("retains full sentence noun, adjective and verb controls", () => {

      const tokens = englishTokens(engine, "They record the kind minder choosing the toughest protocol.");
      expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
      expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
      expect(tokens.find(t => t.word === "toughest")?.phoneme).toBe("ˈtʌfəst");
      expect(tokens.find(t => t.word === "protocol")?.phoneme).toBe("ˈpɹoʊtəˌkɑɫ");
      if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
    });
  });

})();

// Original suite: en-our-and-posttonic-rimes.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("our and posttonic rimes (disableDict=%s)", (disableDict) => {
    const g2p = new EnglishG2P({ disableDict });
    const segments = (word: string): string => g2p.predict(word)!.replace(/[ˈˌ]/g, "");

    test("single-onset FORCE and CURE roots survive regular inflections", () => {
      for (const word of ["four", "fours", "fourth", "fourths", "pour", "pours", "poured", "pouring"])
        expect(segments(word)).toMatch(/^[fp]ɔɹ/);
      for (const word of ["tour", "toured", "touring", "tournament"])
        expect(segments(word)).toMatch(/^tʊɹ/);
      // Supplied tours/tournaments entries attest different rhotic vowels.
      expect(segments("tours")).toMatch(disableDict ? /^tʊɹ/ : /^t[ʊɔ]ɹ/);
      expect(segments("tournaments")).toMatch(disableDict ? /^tʊɹ/ : /^t(?:ʊɹ|ɝ)/);
      for (const word of ["mourn", "mourns", "mourned", "mourning", "mourner", "mournful"])
        expect(segments(word)).toMatch(/^mɔɹ/);
    });

    test("MOUTH and medial NURSE rimes retain their vowels", () => {
      for (const word of ["hour", "hours", "flour", "flours", "sour", "soured", "scour", "scouring", "devour", "devoured"])
        expect(segments(word)).toContain("aʊ");
      for (const word of ["journal", "journals", "journey", "journeys", "adjourn", "adjourned"])
        expect(segments(word)).toContain("dʒɝ");
    });

    test("checked weak dental and lateral tails centralize thematic i", () => {
      for (const word of ["difficult", "difficulty", "difficulties"])
        expect(segments(word)).toContain("fəkəɫ");
      for (const word of ["evidence", "evidences", "evidencing", "evident", "evidently"])
        expect(segments(word)).toMatch(/^ɛvəd/);
      expect(segments("evidenced")).toMatch(disableDict ? /^ɛvəd/ : /^ɛv[əɪ]d/);
      for (const word of ["magnificent", "magnificently", "magnificence"])
        expect(segments(word)).toContain("nɪfəs");
    });

    test("a full ficant or root after a bound prefix retains KIT", () => {
      for (const word of ["significant", "significance"])
        expect(segments(word)).toContain("nɪfɪk");
      expect(segments("dividend")).toMatch(/^dɪvɪ/);
      expect(segments("provident")).toMatch(/^pɹɑvɪ/);
      expect(segments("envisage")).toContain("vɪ");
    });

    test("nasal um tails centralize without changing a stressed i", () => {
      expect(segments("minimum")).toMatch(/^mɪnəm/);
      expect(segments("minimums")).toMatch(disableDict ? /^mɪnəm/ : /^mɪn[əɪ]m/);
      for (const word of ["aluminum", "aluminum's"])
        expect(segments(word)).toContain("ɫumənəm");
      expect(segments("intimidate")).toContain("tɪmɪ");
    });
  });

})();

// Original suite: en-our-soft-g.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("rhotic ou before soft g (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["encourage", "ɛnˈkɝɪdʒ"],
      ["discourage", "dɪˈskɝɪdʒ"],
      ["courageous", "kɝˈeɪdʒəs"], ["scourge", "ˈskɝdʒ"],
    ])("retains the NURSE vowel and root stress in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each(["courage", "encouraged", "encouraging", "encouragement", "discouraged", "discouraging", "discouragement", "courageously", "uncourageous"])("retains the owned root rime in %s", word => {
      expect(engine.predict(word)).toMatch(/kɝ/);
      expect(engine.predict(word)).not.toMatch(/aʊ/);
    });
    it.each([
      ["scour", "ˈskaʊɝ"], ["scouring", "ˈskaʊɝɪŋ"], ["sour", "ˈsaʊɝ"],
      ["souring", "ˈsaʊɝɪŋ"], ["tour", "ˈtʊɹ"], ["touring", "ˈtʊɹɪŋ"],
      ["advantageous", "ˌædvənˈteɪdʒəs"], ["contagious", "kənˈteɪdʒəs"], ["outrageous", "aʊˈtɹeɪdʒəs"],
      ["court", "ˈkɔɹt"], ["course", "ˈkɔɹs"], ["forge", "ˈfɔɹdʒ"], ["tiger", "ˈtaɪɡɝ"],
    ])("preserves an unaffected rime in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves the root after lexical eviction", () => {
      const fresh = new EnglishG2P({ disableDict });
      const access = fresh as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const w of ["encourage", "encourages", "encouraged", "encouraging", "encouragement"]) delete access.dictionary[w];
      for (const w of ["encourage", "encourages", "encouraged", "encouraging", "encouragement"]) expect(fresh.predict(w)).toMatch(/kɝ/);
    });
    it("preserves the full vowel of a Greek root before plural s", () => {
      expect(engine.predict("macrophages")).toMatch(/feɪdʒ[əɪ]z$/);
      expect(engine.predict("phages")).toMatch(/feɪdʒ[əɪ]z$/);
    });
    it("retains the weak syllable in an evicted third-person verb", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("This encourages the exchange of many new ideas.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "encourages")?.phoneme).toBe("ɛnˈkɝɪdʒəz");
    });
    it("preserves full-sentence noun, adjective and verb controls", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The courageous reader will encourage the clever child against the scourge.", { language: "en-US", returnArray: true });
      for (const [word, ipa] of [["courageous", "kɝˈeɪdʒəs"], ["scourge", "skɝdʒ"], ["reader", "ˈɹidɝ"], ["encourage", "ɛnˈkɝɪdʒ"], ["clever", "ˈkɫɛvɝ"]]) expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-outh-ern.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  describe.each([false, true])("dental ern rime, rules=%s", disableDict => {
    it("recovers the whole root with its target entry removed", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["southern"]);
      expect(engine.predict("southern")).toBe("ˈsʌðɝn");
      expect(engine.predict("nonsouthern")?.replace(/ˌ/g, "")).toBe("nɑnˈsʌðɝn");
      expect(engine.predict("unsouthern")?.replace(/ˌ/g, "")).toBe("ənˈsʌðɝn");
      expect(engine.predict("southernmost")?.replace(/ˌ/g, "")).toBe("ˈsʌðɝnmoʊst");
    });
    it("retains independent vouched roots in agent derivations", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["southerner","southerners"]);
      expect(engine.predict("southerner")).toBe("ˈsʌðɝnɝ");
      expect(engine.predict("southerners")).toBe("ˈsʌðɝnɝz");
    });
    it("preserves agent er and directional word controls", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["mouther", "ˈmaʊðɝ"], ["mouthers", "ˈmaʊðɝz"], ["mouthing", "ˈmaʊðɪŋ"],
        ["south", "ˈsaʊθ"], ["southward", "ˈsaʊθwɝd"], ["southbound", "ˈsaʊθbaʊnd"],
        ["northern", "ˈnɔɹðɝn"],
      ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    });
    it("preserves literal caller roots and complete children", () => {
      const engine = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(engine, ["southerner","southerners"]);
      engine.addPronunciation("southern", "ˈzɛŋ");
      expect(engine.predict("southern")).toBe("ˈzɛŋ");
      expect(engine.predict("southerner")).toBe("ˈzɛŋɝ");
      expect(engine.predict("southerners")).toBe("ˈzɛŋɝz");
      engine.addPronunciation("southerner", "ˈkɛŋ");
      expect(engine.predict("southerner")).toBe("ˈkɛŋ");
    });
  });
  it("preserves full noun, adjective and verb contexts", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    for (const [sentence, word, ipa] of [
      ["The southern border is clear.", "southern", "ˈsʌðɝn"],
      ["The southerner is here.", "southerner", "ˈsʌðɝnɝ"],
      ["They mouth the words.", "mouth", "maʊð"],
      ["His mouth is dry.", "mouth", "maʊθ"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-owned-compound-ed.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule2;
  test.each([false, true])(
    "retains complete compound tails before inflection guessing (rules=%s)",
    (disableDict) => {
      const e = new EnglishG2P({ disableDict }),
        d = { ...Reflect.get(e, "dictionary") };
      for (const w of ["inbred", "thoroughbred"]) delete d[w];
      Reflect.set(e, "dictionary", d);
      for (const [word, ipa] of [
        ["inbred", "ˈɪnbɹɛd"],
        ["inbreds", "ˈɪnbɹɛdz"],
        ["inbredness", "ˈɪnbɹɛdnəs"],
        ["noninbred", "nɑnˈɪnbɹɛd"],
        ["outbred", "ˈaʊtbɹɛd"],
        ["wellbred", "ˈwɛlbɹɛd"],
        ["thoroughbred", "ˈθɝoʊbɹɛd"],
        ["thoroughbreds", "ˈθɝoʊbɹɛdz"],
        ["nonthoroughbred", "nɑnˈθɝoʊbɹɛd"],
        ["fired", "ˈfaɪɝd"],
        ["centred", "ˈsɛntɹd"],
      ])
        expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
      const api = createPhonemizer({ processors: [e] });
      for (const sentence of [
        "The inbred line was healthy.",
        "The thoroughbred won the race.",
      ])
        expect(
          api
            .phonemize(sentence, { language: "en-US", returnArray: true })
            .find((t) => /^(inbred|thoroughbred)$/.test(t.word))?.phoneme,
        ).toContain("bɹɛd");
    },
  );
  test("keeps supplied compound roots and explicit forms", () => {
    const e = new EnglishG2P({ disableDict: true });
    e.addPronunciation("inbred", "ˈzɛmp");
    expect(e.predict("inbreds")).toBe("ˈzɛmps");
    expect(e.predict("noninbred")).toBe("nɑnˈzɛmp");
    e.addPronunciation("noninbred", "ˈtɛst");
    expect(e.predict("noninbred")).toBe("ˈtɛst");
  });

})();

// Original suite: en-owned-two-syllable-prefix.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("./helpers/english") = require("./helpers/english");
  const { withoutDictionaryEntries } = __suiteModule2;

  // Collins antivirus and Cambridge anti-missile attest both anti- vowel variants.
  describe.each([false, true])("owned two-syllable prefix roots, disableDict=%s", disableDict => {
    it("retains the independent root under a compositional prefix", () => {
      const en = new EnglishG2P({ disableDict });
      expect(en.predict("antivirus")).toMatch(/ˈvaɪɹəs$/);
      expect(en.predict("antimissile")).toMatch(/ˈmɪsəɫ$/);
      expect(en.predict("antiviruses")).toMatch(/ˈvaɪɹəs[əɪ]z$/);
      expect(en.predict("antimissiles")).toMatch(/ˈmɪsəɫz$/);
      expect(en.predict("nonviral")).toMatch(/ˈvaɪɹəɫ$/);
      expect(en.predict("antisiren")).toMatch(/ˈsaɪɹən$/);
    });

    it.each([["virus", "ˈvaɪɹəs"], ["viral", "ˈvaɪɹəɫ"], ["siren", "ˈsaɪɹən"], ["spiral", "ˈspaɪɹəɫ"]])("preserves the base %s", (word, ipa) => {
      const en = new EnglishG2P({ disableDict });
      expect(en.predict(word)).toBe(ipa);
    });

    it("honors custom prefix, root and whole-token readings after lexical eviction", () => {
      const en = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(en, ["antivirus"]);
      en.addPronunciation("anti", "ˈbɹi");
      en.addPronunciation("virus", "ˈtɛst");
      expect(en.predict("antivirus")).toBe("ˌbɹiˈtɛst");
      en.addPronunciation("antivirus", "ˈkʌstəm");
      expect(en.predict("antivirus")).toBe("ˈkʌstəm");
    });

    it("preserves noun, adjective and verb readings in complete sentences", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const out = api.phonemize("The viral infection spreads. The musician records blue notes. The records of blue notes are missing. They use antivirus software.", { language: "en-US", returnArray: true });
      expect(out.find(t => t.word === "viral")?.phoneme).toBe("ˈvaɪɹəɫ");
      expect(out.find(t => t.word === "antivirus")?.phoneme).toMatch(/ˈvaɪɹəs$/);
      expect(out.filter(t => t.word === "records").map(t => t.phoneme)).toEqual(["ɹɪˈkɔɹdz", "ˈɹɛkɝdz"]);
    });
  });

})();

// Original suite: en-oy-al-hiatus.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("CHOICE before weak al", () => {
    it.each([false, true])("retains the root vowel with disableDict=%s", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("royalty")).toBe("ˈɹɔɪəɫti");
      expect(engine.predict("loyalty")).toBe("ˈɫɔɪəɫti");
      const api = createPhonemizer({ processors: [engine] });
      const words = api.phonemize("The loyal reader discussed royalty and loyalty.", { language: "en-US", returnArray: true });
      expect(words.filter(t => /^(royalty|loyalty)$/.test(t.word)).map(t => t.phoneme)).toEqual(["ˈɹɔɪəɫti", "ˈɫɔɪəɫti"]);
    });
    it.each([false, true])("inherits custom roots but prioritizes explicit forms (rules=%s)", disableDict => {
      const engine = new EnglishG2P({ disableDict });
      for (const root of ["royalty", "loyalty"]) {
        engine.addPronunciation(root, "ˈzɛŋ");
        const plural = root.slice(0, -1) + "ies";
        expect(engine.predict(root)).toBe("ˈzɛŋ");
        expect(engine.predict(plural)).toBe("ˈzɛŋz");
        engine.addPronunciation(plural, "ˈkɛŋ");
        expect(engine.predict(plural)).toBe("ˈkɛŋ");
      }
    });

  });

})();

// Original suite: en-paired-ild-grades.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens, withoutDictionaryEntries } = __suiteModule1;

  describe.each([false, true])("paired PRICE-ild grades, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([["milder", "ˈmaɪɫdɝ"], ["mildest", "ˈmaɪɫdəst"], ["wildest", "ˈwaɪɫdəst"]])("retains the root nucleus in %s", (word, ipa) => {
      if (!disableDict && word === "wildest") expect(engine.predict(word)).toMatch(/^ˈwaɪɫd[əɪ]st$/);
      else expect(engine.predict(word)).toBe(ipa);
    });
    it.each([["gilder", "ˈɡɪɫdɝ"], ["guilder", "ˈɡɪɫdɝ"], ["childers", "ˈtʃɪɫdɝz"]])("preserves the ungraded or checked root in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("preserves an owned base with an independent counterpart after eviction", () => {
      const own = new EnglishG2P({ disableDict });
      withoutDictionaryEntries(own, ["milder"]);
      own.addPronunciation("mildest", "ˈmaɪɫdəst");
      own.addPronunciation("mild", "ˈzɛŋ");
      expect(own.predict("milder")).toBe("ˈzɛŋɝ");
    });
    it("supports an OOV counterpart without adding a runtime word map", () => {
      const own = new EnglishG2P({ disableDict });
      own.addPronunciation("zildest", "ˈzaɪɫdəst");
      expect(own.predict("zilder")).toBe("ˈzaɪɫdɝ");
      own.addPronunciation("zild", "ˈzɛŋ");
      expect(own.predict("zilder")).toBe("ˈzɛŋɝ");
      own.addPronunciation("zilder", "ˈbɛŋ");
      expect(own.predict("zilder")).toBe("ˈbɛŋ");
    });
    it("preserves noun, adjective and verb neighbours in a sentence", () => {

      const tokens = englishTokens(engine, "The kind minder will hinder the milder child.");
      expect(tokens.filter(t => ["kind", "minder", "hinder", "milder", "child"].includes(t.word)).map(t => t.phoneme))
        .toEqual(["kaɪnd", "ˈmaɪndɝ", "ˈhɪndɝ", "ˈmaɪɫdɝ", "tʃaɪɫd"]);
    });
  });

})();

// Original suite: en-paired-nominal-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  // MW communism, atheism and egotism independently confirm these roots.
  describe.each([false, true])("paired nominal roots, rules=%s", disableDict => {
    it("recovers independently vouched bound roots after target eviction", () => {
      for (const [word, ipa, witness, witnessIpa] of [
        ["communism", "ˈkɑmjəˌnɪzəm", "communist", "ˈkɑmjənɪst"],
        ["atheism", "ˈeɪθiˌɪzəm", "atheist", "ˈeɪθiɪst"],
        ["egotism", "ˈiɡəˌtɪzəm", "egotist", "ˈiɡətɪst"],
      ]) {
        const engine = new EnglishG2P({ disableDict });
        const dictionary = { ...Reflect.get(engine, "dictionary") };
        delete dictionary[word];
        Reflect.set(engine, "dictionary", dictionary);
        engine.addPronunciation(witness, witnessIpa);
        expect(engine.predict(word)).toBe(ipa);
      }
    });
    it("handles a supplied new family while retaining root and target ownership", () => {
      const engine = new EnglishG2P({ disableDict });
      engine.addPronunciation("zembrianism", "ˈzɛmbɹiəˌnɪzəm");
      expect(engine.predict("zembrianist")).toBe("ˈzɛmbɹiənɪst");
      engine.addPronunciation("zembrian", "ˈzɛt");
      expect(engine.predict("zembrianist")).toBe("ˈzɛtɪst");
      engine.addPronunciation("zembrianist", "ˈkɛŋ");
      expect(engine.predict("zembrianist")).toBe("ˈkɛŋ");
    });
    it("preserves weak variants, free roots and accidental consonantal pairs", () => {
      const engine = new EnglishG2P({ disableDict });
      for (const [word, ipa] of [
        ["activism", "ˈæktɪˌvɪzəm"], ["capitalist", "ˈkæpətəɫɪst"],
        ["classicism", "ˈkɫæsɪˌsɪzəm"], ["feminism", "ˈfɛmɪˌnɪzəm"],
        ["jansenist", "ˈdʒænsənɪst"], ["schism", disableDict ? "ˈʃɪzəm" : "ˈskɪzəm"], ["schist", "ˈʃɪst"],
      ]) expect(engine.predict(word)).toBe(ipa);
    });
    it("composes communism from the independently attested communist root", () => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("communist", "en-US")).toBe("ˈkɑmjənɪst");
      expect(engine.predict("communism", "en-US")).toBe("ˈkɑmjəˌnɪzəm");
      expect(engine.predict("communism's", "en-US")).toBe("ˈkɑmjəˌnɪzəmz");
    });
    it("keeps complete noun, adjective and verb contexts", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      for (const [sentence, word, ipa] of [
        ["They discuss atheism.", "atheism", "ˈeɪθiˌɪzəm"],
        ["The communist teacher is here.", "communist", "ˈkɑmjənɪst"],
        ["They play the game.", "play", "pɫeɪ"],
      ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-participial-adverbs.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  it.each([
    ["She is a well-read woman.", "ɹɛd"],
    ["He wrote a much-read treatise.", "ɹɛd"],
    ["They are widely-read books.", "ɹɛd"],
    ["He was much read in Serbia.", "ɹɛd"],
    ["The book was well read by Alice.", "ɹɛd"],
    ["They can well read the notice.", "ɹid"],
    ["The read-only file is safe.", "ɹid"],
    ["They read well.", "ɹid"],
  ])("preserves participles and base controls in %s", (sentence, ipa) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
  });

})();

// Original suite: en-participial-object-frame.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  test("bare plural subjects govern verbs before participial plural objects", () => {
    const tagger = new SimplePOSTagger();
    for (const [subject, verb, modifier, object] of [
      ["Residents", "construct", "themed", "scarecrows"],
      ["Engineers", "reconstruct", "damaged", "bridges"],
      ["Researchers", "record", "selected", "performances"],
    ]) expect(tagger.tagWord(verb, [subject, modifier], { words: [subject, verb, modifier, object, "."], index: 1 }).pos).toBe("V");
  });
  test("public API preserves verb/noun contrasts and unaffected nominal clauses", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const reading = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === word)!.phoneme;
    expect(reading("Residents construct themed scarecrows.", "construct")).toContain("ˈstɹʌkt");
    expect(reading("The construct was useful.", "construct")).toMatch(/^ˈkɑn/);
    expect(reading("Researchers record selected performances.", "record")).toContain("ˈkɔɹd");
    expect(reading("The record was clear.", "record")).toMatch(/^ˈɹɛ/);
    for (const sentence of ["The strongest winds hit Wales.", "Strong winds also uprooted trees."]) expect(reading(sentence, "winds")).toBe("wɪndz");
    expect(reading("Incorrect diagnoses include migraines.", "diagnoses")).toContain("oʊsiz");
    expect(reading("During his first audition, Daggs read four scenes from the pilot.", "read")).toBe("ɹɛd");
    expect(reading("Many people actually read such publications.", "read")).toBe("ɹid");
  });

})();

// Original suite: en-participle-agent-frames.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { SimplePOSTagger } = __suiteModule2;

  it.each([false, true])("recognizes an explicit passive agent without changing used-to senses (%s)", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, expected] of [
      ["The car was used by Alice.", "juzd"],
      ["The car is now used by Alice.", "juzd"],
      ["The car was often used by Alice.", "juzd"],
      ...(!disableDict ? [["She is used to the noise.", "just"], ["She used to live here.", "just"]] : []),
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "used")?.phoneme.replace(/[ˈˌ]/g, "")).toBe(expected);
  });
  it("assigns a participle from syntax independently of the lemma", () => {
    const tagger = new SimplePOSTagger();
    for (const word of ["used", "painted", "dogged"]) {
      const words = ["It", "was", "often", word, "by", "Alice", "."];
      expect(tagger.tagWord(word, ["often", "by"], { words, index: 3 }).pos).toBe("VBN");
    }
  });

})();

// Original suite: en-particle-tail.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // MW lookup/hang-up and Cambridge cookout independently attest these roots.
  // https://www.merriam-webster.com/dictionary/lookup
  // https://www.merriam-webster.com/dictionary/hang-up
  // https://dictionary.cambridge.org/us/pronunciation/english/cookout
  const phones = (ipa: string | null | undefined): string => (ipa ?? "").replace(/ˌ/g, "").replace(/ʌ/g, "ə");

  describe.each([false, true])("vouched particle tails (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each([
      ["lookup", "ˈɫʊkəp"], ["lookout", "ˈɫʊkaʊt"],
      ["cookout", "ˈkʊkaʊt"], ["lookups", "ˈɫʊkəps"],
    ])("preserves the complete root in %s", (word, expected) => {
      expect(phones(engine.predict(word))).toBe(expected);
    });
    test.each([
      ["look", "ˈɫʊk"], ["cook", "ˈkʊk"], ["group", "ˈɡɹup"],
      ["croup", "ˈkɹup"], ["soup", "ˈsup"], ["upper", "ˈʌpɝ"],
      ["reader", "ˈɹidɝ"],
    ])("keeps the neighboring %s root", (word, expected) => {
      expect(engine.predict(word)).toBe(expected);
    });
    test("keeps noun, adjective and verb controls in the full sentence", () => {

      const tokens = englishTokens(engine, "The careful reader used a lookup table during the cookout.");
      expect(phones(tokens.find(t => t.word === "lookup")?.phoneme)).toBe("ˈɫʊkəp");
      expect(phones(tokens.find(t => t.word === "cookout")?.phoneme)).toBe("ˈkʊkaʊt");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "careful")?.phoneme).toBe("ˈkɛɹfəɫ");
    });
    test("uses a caller-owned root before an OOV particle tail", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("look", "ˈɫɑk");
      expect(phones(custom.predict("lookoff"))).toBe("ˈɫɑkɔf");
    });
    test.each(["backup", "pickup", "setup"])("retains a weak particle in %s", word => {
      expect(engine.predict(word)).toMatch(/əp$/);
    });
    test.each([
      ["takeover", "ˈteɪkˌoʊvɝ"], ["voiceover", "ˈvɔɪsˌoʊvɝ"],
      ["takeoff", "ˈteɪkˌɔf"], ["takeout", "ˈteɪkˌaʊt"],
    ])("preserves the established strong tail in %s", (word, expected) => {
      expect(engine.predict(word)).toBe(expected);
    });
  });

  test("the rule-composed nasal retains its root boundary before up", () => {
    expect(phones(new EnglishG2P({ disableDict: true }).predict("hangup"))).toBe("ˈhæŋəp");
  });

  test("the default dictionary retains an opaque surname", () => {
    expect(new EnglishG2P().predict("Gallup")).toBe("ˈɡæɫəp");
  });

})();

// Original suite: en-partitive-pronoun-infinitive.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("plural partitive pronouns license a bare infinitival predicate", () => {
    const g = new EnglishG2P(), p = createPhonemizer({ processors: [g] });
    for (const sentence of ["Both of them refuse to believe this.", "Many of us refuse to leave.", "Some of them still refuse to enter."]) {
      expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ɹɪˈfjuz");
    }
    for (const sentence of ["The refuse to recycle is wet.", "Some of the students' refuse to recycle is wet."]) {
      expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ˈɹɛfjus");
    }
    expect(p.phonemize("Both of them Refuse to leave.", { language: "en-US", returnArray: true }).find(t => t.word === "Refuse")?.phoneme).toBe("ˈɹɛfjus");
    expect(p.phonemize("Some of the officers' conduct to review is documented.", { language: "en-US", returnArray: true }).find(t => t.word === "conduct")?.phoneme).toBe("ˈkɑndəkt");
    expect(g.predict("object", "en-US", "N")).toBe("ˈɑbdʒɛkt");
    expect(g.predict("object", "en-US", "ADJ")).toBe("ˈɑbdʒɛkt");
    expect(g.predict("object", "en-US", "V")).toBe("əbˈdʒɛkt");
  });

})();

// Original suite: en-partitive-reduced-passives.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { inferVerbForm } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  describe("partitive reduced passive", () => {
    it("does not infer a participle from a noun followed by by", () => {
      const words = "It is a good read by a famous author".split(" ");
      expect(inferVerbForm({ words, index: 4 })).toBeUndefined();
    });
    it.each([
      ["It is one of the books still read by English speakers today.", "ɹɛd"],
      ["It will be one of the books read by Alice.", "ɹɛd"],
      ["The students still read by the window.", "ɹid"],
      ["Some of the students still read by the window.", "ɹid"],
      ["It is one of the books I read by candlelight.", "ɹid"],
    ])("preserves the reading in %s", (sentence, ipa) => {
      const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(out.find(token => token.word === "read")?.phoneme).toBe(ipa);
    });
  });

})();

// Original suite: en-partitive-subject-infinitive.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  test("partitive plural subjects license an infinitival verb", () => {
    const g = new EnglishG2P(), p = createPhonemizer({ processors: [g] });
    expect(g.predict("object", "en-US", "N")).toBe("ˈɑbdʒɛkt");
    expect(g.predict("object", "en-US", "ADJ")).toBe("ˈɑbdʒɛkt");
    expect(g.predict("object", "en-US", "V")).toBe("əbˈdʒɛkt");
    for (const sentence of [
      "Several of the speakers refuse to sign.",
      "Some of the local workers still refuse to leave.",
      "Both of the people refuse to leave.",
      "Today, several of the Korku speakers refuse to acknowledge the Nihali language.",
    ]) {
      expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ɹɪˈfjuz");
    }
    for (const sentence of ["Some of the yard refuse to recycle is wet.", "The yard refuse to recycle is wet.", "Some of the students' refuse to recycle is wet.", "Both of the children's refuse to recycle is wet."]) {
      expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ˈɹɛfjus");
    }
    expect(p.phonemize("Some of the officers' conduct to review is documented.", { language: "en-US", returnArray: true }).find(t => t.word === "conduct")?.phoneme).toBe("ˈkɑndəkt");
    expect(p.phonemize("The government contract to purchase equipment expired.", { language: "en-US", returnArray: true }).find(t => t.word === "contract")?.phoneme).toBe("ˈkɑntɹækt");
  });

})();

// Original suite: en-passive-placement.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  const __suiteModule2: typeof import("../src/en/pos-tagger") = require("../src/en/pos-tagger");
  const { simplePOSTagger } = __suiteModule2;

  it.each([
    "His skills were never put to use.", "The tool was put to use.",
    "The worker is put to work.", "The child was put to sleep.",
    "The claim was put to rest.", "The accused was put to trial.",
  ])("recognizes a closed nominal complement: %s", sentence => {
    const words = sentence.replace(/\./g, " .").split(" ");
    const index = words.indexOf("to") + 1;
    expect(simplePOSTagger.tagWord(words[index], ["to", words[index + 1]], { words, index }).pos).toBe("N");
  });

  it.each([
    "They want to use tools.", "He was told to use tools.",
    "He was put to work the machine.", "They put tools to use resources.",
  ])("preserves infinitives: %s", sentence => {
    const words = sentence.replace(/\./g, " .").split(" ");
    const index = words.indexOf("to") + 1;
    expect(simplePOSTagger.tagWord(words[index], ["to", words[index + 1]], { words, index }).pos).toBe("V");
  });

  describe.each([false, true])("passive placement, disableDict=%s", disableDict => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
    it("keeps noun use voiceless", () => {
      expect(pick("His skills were never put to use.", "use")).toBe("jus");
      expect(pick("The use of tools is clear.", "use")).toBe("jus");
    });
    it("preserves noun and verb stress in neighboring clauses", () => {
      expect(pick("The records were put to use.", "records")).toBe("ˈɹɛkɝdz");
      expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    });
    it("preserves past and modal read controls", () => {
      if (!disableDict) {
        expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
        expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
        expect(pick("They want to use tools.", "use")).toBe("juz");
      }
    });
  });

})();

// Original suite: en-patho-ology.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak patho- allomorph before -ology", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("uses the source-supported weak reading in pathology", () => {
      expect(rules.predict("pathology", "en-US")).toBe("pəˈθɑɫədʒi");
      expect(rules.predict("pathologies", "en-US")).toBe("pəˈθɑɫədʒiz");
    });

    it.each([
      ["path", "ˈpæθ"],
      ["pathos", "ˈpæθoʊz"],
      ["pathogenesis", "ˌpæθəˈdʒɛnəsɪs"],
      ["pathological", "ˌpæθəˈɫɑdʒɪkəɫ"],
    ])("preserves the full path- vowel in %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();

// Original suite: en-perhaps-exercise-roots.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("sourced perhaps and exercise roots", () => {
    it.each([false, true])("uses the dictionary-backed forms in both modes and context (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("perhaps", "en-US", "RB")).toBe("pɝˈhæps");
      expect(engine.predict("exercise", "en-US", "NN")).toBe("ˈɛksɝˌsaɪz");
      expect(engine.predict("exercise", "en-US", "VB")).toBe("ˈɛksɝˌsaɪz");
      expect(engine.predict("exercises", "en-US", "NNS")).toBe("ˈɛksɝˌsaɪzəz");
      expect(engine.predict("exercised", "en-US", "VBD")).toBe("ˈɛksɝˌsaɪzd");
      expect(engine.predict("exercising", "en-US", "VBG")).toBe("ˈɛksɝˌsaɪzɪŋ");
      expect(engine.predict("exorcise", "en-US", "VB")).toBe("ɪɡˈzɔɹsaɪz");


      const tokens = englishTokens(engine, "Perhaps we should exercise more often; the exercise is useful.");
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("perhaps")).toBe("pɝˈhæps");
      expect(tokens.filter(token => token.word.toLowerCase() === "exercise").map(token => token.phoneme)).toEqual([
        "ˈɛksɝˌsaɪz", "ˈɛksɝˌsaɪz",
      ]);
    });
  });

})();
