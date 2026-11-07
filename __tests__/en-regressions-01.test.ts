// Original suite: en-a-velar-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("a- before a checked velar root, disableDict=%s", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it("keeps weak a- before the heavy root", () => {
      expect(engine.predict("along")).toBe("əˈɫɔŋ");
      expect(engine.predict("along", "en-GB")).toMatch(/^əˈ/);
    });
    it("preserves inflected and closed initial syllable controls", () => {
      expect(engine.predict("aging")).toBe("ˈeɪdʒɪŋ");
      expect(engine.predict("axing")).toBe("ˈæksɪŋ");
      expect(engine.predict("ankle")).toBe("ˈæŋkəɫ");
      expect(engine.predict("amber")).toBe("ˈæmbɝ");
    });
    it("preserves full sentence context and explicit custom output", () => {

      const tokens = englishTokens(engine, "The aging reader will walk along the river.");
      expect(tokens.find(t => t.word === "along")?.phoneme).toBe("əˈɫɔŋ");
      expect(tokens.find(t => t.word === "aging")?.phoneme).toBe("ˈeɪdʒɪŋ");
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("along", "ˈzɛŋ");
      expect(custom.predict("along")).toBe("ˈzɛŋ");
    });
  });

})();

// Original suite: en-ab-rhotic-stop.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../scripts/context-ipa") = require("../scripts/context-ipa");
  const { parseIpa } = __suiteModule1;
  const __suiteModule2: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule2;
  test.each([false, true])("retains a closed rhotic root and split s voicing (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const w of ["absorb", "absorbs", "absorbed", "absorbing", "absorbable", "absorbent", "absorbency"]) delete dictionary[w];
   Reflect.set(e, "dictionary", dictionary);
   for (const [word, ipa] of [["absorb", "əbˈzɔɹb"], ["absorbs", "əbˈzɔɹbz"], ["absorbed", "əbˈzɔɹbd"], ["absorbing", "əbˈzɔɹbɪŋ"], ["absorbable", "əbˈzɔɹbəbəl"], ["absorbent", "əbˈzɔɹbənt"], ["absorbency", "əbˈzɔɹbənsi"]]) expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
   for (const w of ["absent", "absinthe", "absolute", "absorption", "absurd"]) expect(e.predict(w)).toContain("s");
   expect(e.predict("abject")).toBe("ˈæbdʒɛkt");
   expect(e.predict("abortion")).toContain("ʃ");
   const api = createPhonemizer({ processors: [e] });
   for (const sentence of ["They absorb the light.", "The absorbent cloth was dry.", "The absorbency was high."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^absorb/.test(t.word))?.phoneme).toContain("zɔɹb");
  });
  test("keeps explicit root ownership and an unseen rhotic-stop root", () => {
   const e = new EnglishG2P({ disableDict: true });
   expect(e.predict("abglorb")).toMatch(/ˈɡ[ɫl]ɔɹb$/);
   expect(e.predict("abglorbs")).toMatch(/ˈɡ[ɫl]ɔɹbz$/);
   e.addPronunciation("absorb", "ˈɑbsɔɹb");
   expect(e.predict("absorb")).toBe("ˈɑbsɔɹb");
   expect(e.predict("absorbs")).toBe("ˈɑbsɔɹbz");
   expect(e.predict("absorbed")).toBe("ˈɑbsɔɹbd");
  });
  test.each([false, true])("retains a prefixed root in combining-o derivatives (rules=%s)", disableDict => {
   const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
   for (const word of ["absorb", "absorbed", "absorbing", "absorbable", "bioabsorb", "bioabsorbable", "bioabsorbed", "bioabsorbing", "reabsorb", "reabsorbed", "nonabsorbable"]) delete dictionary[word];
   Reflect.set(e, "dictionary", dictionary);
   for (const word of ["bioabsorb", "bioabsorbable", "bioabsorbed", "bioabsorbing", "reabsorb", "reabsorbed", "nonabsorbable"]) expect(e.predict(word)).toMatch(/əbˈzɔɹb/);
   const api = createPhonemizer({ processors: [e] });
   expect(api.phonemize("It is a bioabsorbable stent.", { language: "en-US", returnArray: true }).find(t => t.word === "bioabsorbable")?.phoneme).toMatch(/əbˈzɔɹb/);
  });

})();

// Original suite: en-able-stress-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("weak -able root and stress controls (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    test.each(["interminable", "determinable"])("keeps the weak stem vowel of %s", word => {
      const phrase = `The ${word} debate continued.`;
      for (const pos of [undefined, "ADJ", "N", "V"]) {
        expect(engine.predict(word, "en-US", pos)).toMatch(/ˈtɝm[əɪ]nəbəɫ$/);
      }
      expect(api.phonemize(phrase, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme)
        .toMatch(/ˈtɝm[əɪ]nəbəɫ$/);
    });

    test("inherits the witnessed -ply root through in- without changing lexical -plicable roots", () => {
      const applicable = disableDict ? "əˈpɫɪkəbəɫ" : "ˈæpɫəkəbəɫ";
      const inapplicable = disableDict ? "ˌɪnəˈpɫɪkəbəɫ" : "ˌɪˈnæpɫɪkəbəɫ";
      for (const pos of [undefined, "ADJ", "N", "V"]) {
        expect(engine.predict("applicable", "en-US", pos)).toBe(applicable);
        expect(engine.predict("inapplicable", "en-US", pos)).toBe(inapplicable);
        expect(engine.predict("replicable", "en-US", pos)).toBe("ɹiˈpɫɪkəbəɫ");
        expect(engine.predict("relicable", "en-US", pos)).toBe("ˈɹɛɫɪkəbəɫ");
      }
      expect(engine.predict("invisible", "en-US")).toBe("ˌɪnˈvɪzəbəɫ");
      expect(engine.predict("inflexible", "en-US")).toBe("ˌɪnˈfɫɛksəbəɫ");

      for (const word of ["applicable", "inapplicable", "replicable"]) {
        const phrase = `An ${word} result was recorded.`;
        expect(api.phonemize(phrase, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme)
          .toBe(engine.predict(word, "en-US"));
      }
    });
  });

})();

// Original suite: en-able-undoubled-cvc.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe.each([false, true])("undoubled roots before -able (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["capable", "ˈkeɪpəbəɫ"], ["curable", "ˈkjʊɹəbəɫ"],
      ["notable", "ˈnoʊtəbəɫ"], ["potable", "ˈpoʊtəbəɫ"],
      ["salable", "ˈseɪɫəbəɫ"], ["ridable", "ˈɹaɪdəbəɫ"],
      ["ratable", "ˈɹeɪtəbəɫ"], ["datable", "ˈdeɪtəbəɫ"],
    ])("retains the restored silent-e vowel in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it.each([
      ["livable", "ˈɫɪvəbəɫ"], ["unlivable", "ənˈɫɪvəbəɫ"],
      ["tenable", "ˈtɛnəbəɫ"], ["untenable", "ənˈtɛnəbəɫ"],
      ["taxable", "ˈtæksəbəɫ"], ["fixable", "ˈfɪksəbəɫ"], ["mixable", "ˈmɪksəbəɫ"],
      ["cappable", "ˈkæpəbəɫ"], ["rattable", "ˈɹætəbəɫ"], ["hoppable", "ˈhɑpəbəɫ"],
      ["excusable", "ɪkˈskjuzəbəɫ"], ["combinable", "kəmˈbaɪnəbəɫ"],
    ])("preserves spelling contrasts or a verb reading in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("keeps roots available to outer morphology after eviction", () => {
      const evicted = new EnglishG2P({ disableDict });
      const access = evicted as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["capable", "notable", "curable"]) delete access.dictionary[word];
      for (const [word, ipa] of [
        ["capably", "ˈkeɪpəbɫi"], ["notably", "ˈnoʊtəbɫi"],
        ["uncurable", "ənˈkjʊɹəbəɫ"], ["noncapable", "nɑnˈkeɪpəbəɫ"],
      ]) expect(evicted.predict(word)).toBe(ipa);
    });
    it("preserves prefix stress after a vouched silent-e root leaves the table", () => {
      for (const word of ["dislike", "disliked", "dislikes", "disliking"]) {
        expect(engine.predict(word)).toMatch(/^dɪ(?:sˈ|ˈs)ɫaɪk(?:t|s|ɪŋ)?$/);
      }
      expect(engine.predict("discount")).toBe("ˈdɪskaʊnt");
    });
    // Cambridge US: /dɪˈfjuː.zə.bəl/, https://dictionary.cambridge.org/dictionary/english/diffusible
    it("uses the voiced verb stem in diffusible", () => {
      expect(engine.predict("diffusible")).toBe("dɪˈfjuzəbəɫ");
    });
    it("preserves caller-owned silent-e stems", () => {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("cure", "ˈkjʊɹ");
      custom.addPronunciation("live", "ˈɫɪv");
      expect(custom.predict("curable")).toBe("ˈkjʊɹəbəɫ");
      expect(custom.predict("livable")).toBe("ˈɫɪvəbəɫ");
    });
    it("preserves noun, adjective and finite verb controls in full sentences", () => {

      const tokens = englishTokens(engine, "The capable reader will work with a livable plan.");
      expect(tokens.find(t => t.word === "capable")?.phoneme).toBe("ˈkeɪpəbəɫ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
      expect(tokens.find(t => t.word === "livable")?.phoneme).toBe("ˈɫɪvəbəɫ");
    });
  });

  it("retains the existing source pronunciation of Valable on the default path", () => {
    expect(new EnglishG2P().predict("Valable")).toBe("ˈvæɫəbəɫ");
    expect(new EnglishG2P().predict("Dismore")).toBe("ˈdɪsmɔɹ");
  });

})();

// Original suite: en-ably-spelling-boundary.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("Weak -ably/-ibly spelling boundary (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const phonemizer = createPhonemizer({ processors: [engine] });

    it.each([
      ["sibley", "ˈsɪbɫi"], ["shibley", "ˈʃɪbɫi"],
      ["mabley", "ˈmæbɫi"], ["stabley", "ˈstæbɫi"],
    ])("preserves the complete name root in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    it.each(["probably", "possibly", "terribly", "horribly", "comfortably"])(
      "retains the weak suffix in %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/əb[ɫl]i$/);
      },
    );

    it.each(["canola", "canolas", "canola's"])(
      "preserves the weak vowel before /noʊ/ in %s", word => {
        expect(engine.predict(word, "en-US")).toMatch(/^kəˈnoʊ/);
      },
    );
    it("preserves the same novel plural class beyond canola", () => {
      expect(engine.predict("granolas", "en-US")).toMatch(/^ɡɹəˈnoʊɫəz$/);
    });
    it("keeps a closed o syllable outside the plural-root frame", () => {
      expect(engine.predict("pocahontas", "en-US")).toMatch(/ntəs$/);
    });
    it("retains the KIT nucleus supplied to -tude", () => {
      expect(engine.predict("rectitude", "en-US")).toMatch(/tɪ[ˌ]?tud$/);
    });
    it.each([
      ["attitude", "ˈætəˌtud"], ["latitude", "ˈɫætəˌtud"],
      ["altitude", "ˈæɫtəˌtud"], ["solitude", "ˈsɑɫəˌtud"],
      ["know", "ˈnoʊ"], ["snow", "ˈsnoʊ"],
      ["texas", "ˈtɛksəs"], ["alias", "ˈeɪɫiəs"], ["canvas", "ˈkænvəs"],
    ])("preserves the unrelated root/suffix in %s", (word, ipa) => {
      expect(engine.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["Sibley arrived.", "Sibley", "sɪbɫi"],
      ["They probably arrived.", "probably", "əbɫi"],
    ])("preserves the boundary in %s", (sentence, word, phones) => {
      const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
        .find(token => token.word === word)!;
      expect(target.phoneme.replace(/[ˈˌ]/g, "")).toContain(phones);
    });
  });

  it.each([
    ["anona", "ɑˈnoʊnə"], ["cannone", "kɑˈnoʊni"], ["canova", "kɑˈnoʊvə"],
  ])("retains the supplied default reading of %s after re-mining", (word, ipa) => {
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
  });

})();

// Original suite: en-acquisition-schwa.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("weak /ɪ/ in the -acquisition spelling family", () => {
    const g2p = new EnglishG2P({ disableDict: true });

    it.each([
      ["acquisition", "ˌækwəˈzɪʃən"],
      ["acquisitions", "ˌækwəˈzɪʃənz"],
    ])("uses the reduced <qui> in %s", (word, ipa) => {
      expect(g2p.predict(word, "en-US")).toBe(ipa);
    });

    it.each(["reacquisition", "microacquisition"])(
      "composes with the -acquisition morpheme in OOV form %s",
      (word) => expect(g2p.predict(word, "en-US")).toMatch(/kwəˈzɪʃən/),
    );

    it.each([
      ["acquire", "əˈkwaɪɹ"],
      ["acquisitive", "əˈkwɪzətɪv"],
      ["inquisition", "ˌɪnkwɪˈzɪʃən"],
      ["inquisitive", "ɪnˈkwɪzətɪv"],
    ])("preserves neighboring <qui> readings in %s", (word, ipa) => {
      // Merriam-Webster records acquire with optional schwa before /r/.
      const readings = word === "acquire" ? [ipa, "əˈkwaɪɝ"] : [ipa];
      expect(readings).toContain(g2p.predict(word, "en-US"));
    });

    it("keeps the acquisition/inquisition contrast in a sentence", () => {

      const tokens = englishTokens(g2p, "The acquisition followed an inquisition.");
      expect(tokens.find(token => token.word === "acquisition")?.phoneme).toBe("ˌækwəˈzɪʃən");
      expect(tokens.find(token => token.word === "inquisition")?.phoneme).toBe("ˌɪnkwɪˈzɪʃən");
    });
  });

})();

// Original suite: en-acy-long-i.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("tense i in pi-/pri- -acy relatives", () => {
    const processor = new EnglishG2P({ disableDict: true });

    it.each([
      ["privacy", "ˈpɹaɪvəsi"],
      ["piracy", "ˈpaɪɹəsi"],
      ["primacy", "ˈpɹaɪməsi"],
    ])("preserves the root vowel in %s", (word, ipa) => {
      expect(processor.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["literacy", "ˈɫɪtɝəsi"],
      ["accuracy", "ˈækjɝəsi"],
      ["prison", "ˈpɹɪsən"],
      ["privacies", "ˈpɹaɪvəsiz"],
      ["piracies", "ˈpaɪɹəsiz"],
    ])("preserves the neighboring frame in %s", (word, ipa) => {
      expect(processor.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the root vowel in sentence context", () => {
      const phonemizer = createPhonemizer({ processors: [processor] });
      const tokens = phonemizer.phonemize(
        "Privacy and piracy have primacy over privacy settings.",
        { language: "en-US", returnArray: true },
      );
      for (const word of ["Privacy", "piracy", "primacy", "privacy"]) {
        const token = tokens.find((entry) => entry.word.toLowerCase() === word.toLowerCase());
        expect(token?.phoneme).toMatch(/aɪ/);
      }
    });
  });

})();

// Original suite: en-ad-closed-root-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("assimilated ad- before closed pt/ft roots", () => {
    const processor = new EnglishG2P({ disableDict: true });

    it.each([
      ["adopt", "əˈdɑpt"],
      ["adapt", "əˈdæpt"],
      ["adept", "əˈdɛpt"],
      ["adrift", "əˈdɹɪft"],
    ])("keeps root stress in %s", (word, ipa) => {
      expect(processor.predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["adopts", "əˈdɑpts"],
      ["adapts", "əˈdæpts"],
      ["adepts", "əˈdɛpts"],
      ["adrifts", "əˈdɹɪfts"],
    ])("preserves root stress in the plural %s", (word, ipa) => {
      expect(processor.predict(word, "en-US")).toBe(ipa);
    });

    it("preserves neighboring ad- and a- words in sentence context", () => {
      const phonemizer = createPhonemizer({ processors: [processor] });
      const tokens = phonemizer.phonemize(
        "We adopt a plan, adapt the design, and leave the boat adrift; an adult gave an address at the advent.",
        { language: "en-US", returnArray: true },
      );
      const ipa = (word: string) => tokens.find(token => token.word === word)?.phoneme;
      expect(ipa("adopt")).toBe("əˈdɑpt");
      expect(ipa("adapt")).toBe("əˈdæpt");
      expect(ipa("adrift")).toBe("əˈdɹɪft");
      expect(ipa("adult")).toBe("ˈædəɫt");
      expect(ipa("address")).toBe("ˈædɹɛs");
      expect(ipa("advent")).toBe("ˈædvənt");
    });
  });

})();

// Original suite: en-ad-cluster-inflections.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe.each([false, true])("assimilated ad- cluster inflections (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    it.each([
      ["addressed", "əˈdɹɛst"], ["addressing", "əˈdɹɛsɪŋ"],
      ["acclaimed", "əˈkɫeɪmd"], ["acclaiming", "əˈkɫeɪmɪŋ"],
      ["affronted", "əˈfɹʌntɪd"], ["affronting", "əˈfɹʌntɪŋ"],
      ["accreted", "əˈkɹitɪd"], ["address", "ˈædɹɛs"],
      ["unaddressed", "ˌʌnəˈdɹɛst"], ["unaddressing", "ˌʌnəˈdɹɛsɪŋ"],
    ])("restores a verb root or preserves its neighboring frame in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
    it("uses the existing vouched part after lexical stem eviction", () => {
      const fresh = new EnglishG2P({ disableDict });
      const access = fresh as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      for (const word of ["address", "dress", "addressed", "addressing", "unaddressed"]) delete access.dictionary[word];
      expect(fresh.predict("addressed")).toBe("əˈdɹɛst");
      expect(fresh.predict("addressing")).toBe("əˈdɹɛsɪŋ");
      expect(fresh.predict("unaddressed")).toBe("ˌʌnəˈdɹɛst");
    });
    it("preserves an explicit custom stem pronunciation", () => {
      const fresh = new EnglishG2P({ disableDict });
      fresh.addPronunciation("address", "AA1 D R EH0 S");
      const access = fresh as unknown as { dictionary: Record<string, string> };
      access.dictionary = { ...access.dictionary };
      delete access.dictionary.addressed;
      delete access.dictionary.addressing;
      expect(fresh.predict("addressed")).toBe("ˈɑdɹɛst");
      expect(fresh.predict("addressing")).toBe("ˈɑdɹɛsɪŋ");
    });
    it("preserves noun and adjective controls beside the inflected verb", () => {
      const api = createPhonemizer({ processors: [engine] });
      const tokens = api.phonemize("The clever reader addressed the letter.", { language: "en-US", returnArray: true });
      expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
      expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
      expect(tokens.find(t => t.word === "addressed")?.phoneme).toBe("əˈdɹɛst");
      const noun = api.phonemize("The address is clear.", { language: "en-US", returnArray: true });
      expect(noun.find(t => t.word === "address")?.phoneme).toBe("ˈædɹɛs");
    });
  });

  it("preserves an independently supplied polysyllabic verb citation", () => {
    expect(new EnglishG2P().predict("accredited")).toBe("əˈkɹɛdɪtɪd");
  });

})();

// Original suite: en-ad-j-verb-stress.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("weak ad- in disyllabic j-verbs", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it.each([
      ["adjust", "əˈdʒʌst"],
      ["adjoin", "əˈdʒɔɪn"],
      ["adjourn", "əˈdʒɝn"],
      ["adjure", "əˈdʒʊɹ"],
    ])("stresses the root and weakens ad- in %s", (word, ipa) => {
      expect(rules.predict(word, "en-US")).toBe(ipa);
    });

    it("keeps related nouns and longer words on their existing readings", () => {
      const api = createPhonemizer({ processors: [new EnglishG2P()] });
      const tokens = api.phonemize("The adjunct instructor described the adjective in an adjusted form.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(token => token.word === "adjunct")?.phoneme).toBe("ˈædʒəŋkt");
      expect(tokens.find(token => token.word === "adjective")?.phoneme).toBe("ˈædʒɪktɪv");
      expect(tokens.find(token => token.word === "adjusted")?.phoneme).toBe("əˈdʒʌstɪd");
      expect(rules.predict("adjunct", "en-US")).toBe("ˈædʒəŋkt");
    });
  });

})();

// Original suite: en-age-plural-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("retained -age stems before plural -s", () => {
    it.each([
      ["average", "ˈævɝɪdʒ"],
      ["beverage", "ˈbɛvɝɪdʒ"],
      ["porterage", "ˈpɔɹtɝɪdʒ"],
    ])("retains the attested base reading of %s", (stem, expected) => {
      expect(new EnglishG2P({ disableDict: true }).predict(stem, "en-US")).toBe(expected);
    });

    it.each([
      ["average", "averages", "ˈævɝɪdʒəz"],
      ["beverage", "beverages", "ˈbɛvɝɪdʒəz"],
      ["porterage", "porterages", "ˈpɔɹtɝɪdʒəz"],
    ])("preserves %s stress in %s on the rules path", (_stem, plural, expected) => {
      const g2p = new EnglishG2P({ disableDict: true });
      expect(g2p.trace(plural, "en-US").path).toBe("morphology");
      expect(g2p.predict(plural, "en-US")).toBe(expected);
    });

    it.each([
      ["stages", "ˈsteɪdʒəz"],
      ["underages", "ˈʌndɝɪdʒəz"],
      ["percentages", "pɝˈsɛntɪdʒəz"],
      ["wages", "ˈweɪdʒəz"],
      ["damages", "ˈdæmɪdʒɪz"],
      ["mortgages", "ˈmɔɹɡɪdʒɪz"],
    ])("preserves the distinct neighboring plural %s", (plural, expected) => {
      const g2p = new EnglishG2P({ disableDict: true });
      expect(g2p.predict(plural, "en-US")).toBe(expected);
    });

    it.each([
      ["image", "images", "ˈɪmɪdʒɪz"],
      ["message", "messages", "ˈmɛsɪdʒɪz"],
      ["package", "packages", "ˈpækɪdʒɪz"],
      ["cottage", "cottages", "ˈkɑtɪdʒɪz"],
    ])("keeps a KIT-final %s stem distinct before plural -es", (stem, plural, expected) => {
      const g2p = new EnglishG2P({ disableDict: true });
      expect(g2p.trace(stem, "en-US").path).toBe("rules");
      expect(g2p.trace(plural, "en-US").path).toBe("morphology");
      expect(g2p.predict(plural, "en-US")).toBe(expected);
    });

    it("keeps the inherited stems in sentence context across noun, adjective, and verb readings", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
      const tokens = phonemizer.phonemize(
        "The beverage was cold. The average price changed. The price is above average. We average the results. Porterages were charged separately.",
        { language: "en-US", returnArray: true },
      );
      const outputs = tokens.map(token => [token.word.toLowerCase(), token.phoneme] as const);
      expect(outputs.filter(([word]) => word === "average").map(([, ipa]) => ipa)).toEqual([
        "ˈævɝɪdʒ", "ˈævɝɪdʒ", "ˈævɝɪdʒ",
      ]);
      expect(outputs.find(([word]) => word === "beverage")?.[1]).toBe("ˈbɛvɝɪdʒ");
      expect(outputs.find(([word]) => word === "porterages")?.[1]).toBe("ˈpɔɹtɝɪdʒəz");
    });
  });

})();

// Original suite: en-age-reference.test.ts
(() => {
  const dictionary = require("../data/en/dict.json");
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;

  describe("Cambridge US weak -age references", () => {
    const words = [
      ["damage", "ˈdæmɪdʒ"],
      ["damages", "ˈdæmɪdʒɪz"],
      ["damaged", "ˈdæmɪdʒd"],
      ["usage", "ˈjusɪdʒ"],
      ["usages", "ˈjusɪdʒɪz"],
      ["courage", "ˈkɝɪdʒ"],
    ] as const;

    it.each(words)("stores the Cambridge US reading for %s", (word, ipa) => {
      expect(dictionary[word]).toBe(ipa);
      expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
    });

    it.each(words)("keeps the spelling-rule reading for %s", (word, ipa) => {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
    });

    it.each([
      ["discouraged", "dɪˈskɝɪdʒd"],
      ["discouraging", "dɪˈskɝɪdʒɪŋ"],
    ])("stores the Cambridge-supported inflection for %s", (word, ipa) => {
      expect(dictionary[word as keyof typeof dictionary]).toBe(ipa);
      expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
    });

    it("keeps the independently listed STRUT prefix in undamaged", () => {
      expect(dictionary.undamaged).toBe("ˌʌnˈdæmɪdʒd");
      expect(new EnglishG2P().predict("undamaged", "en-US")).toBe("ˌʌnˈdæmɪdʒd");
    });

    it("keeps the full vowel in the teen+age compound", () => {
      expect(new EnglishG2P().predict("teenage", "en-US")).toBe("ˈtiˌneɪdʒ");
      expect(new EnglishG2P({ disableDict: true }).predict("teenage", "en-US")).toBe("ˈtineɪdʒ");
      for (const word of ["advantage", "cottage", "damage", "image"]) {
        expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toMatch(/ɪdʒ$/);
      }
      expect(new EnglishG2P().predict("teenager", "en-US")).toBe("ˈtiˌneɪdʒɝ");
    });

    it("preserves the compound and weak-age controls in a sentence on the rules route", () => {
      const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
      const tokens = phonemizer.phonemize("The teenage actor saw a cottage as an advantage.", {
        language: "en-US", returnArray: true,
      });
      expect(tokens.find(token => token.word === "teenage")?.phoneme).toBe("ˈtineɪdʒ");
      expect(tokens.find(token => token.word === "cottage")?.phoneme).toMatch(/ɪdʒ$/);
      expect(tokens.find(token => token.word === "advantage")?.phoneme).toMatch(/ɪdʒ$/);
    });
  });

})();

// Original suite: en-aging-schwa.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("weak vowel in -aging forms (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });

    it.each([
      ["damaging", "ˈdæmɪdʒɪŋ"],
      ["imaging", "ˈɪmɪdʒɪŋ"],
      ["messaging", "ˈmɛsɪdʒɪŋ"],
      ["mortgaging", "ˈmɔɹɡɪdʒɪŋ"],
      ["packaging", "ˈpækɪdʒɪŋ"],
      ["salvaging", "ˈsæɫvɪdʒɪŋ"],
      ["savaging", "ˈsævɪdʒɪŋ"],
    ])("uses KIT in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });

    it.each([
      ["managing", "ˈmænədʒɪŋ"],
      ["staging", "ˈsteɪdʒɪŋ"],
      ["engaging", "ɛnˈɡeɪdʒɪŋ"],
      ["aging", "ˈeɪdʒɪŋ"],
    ])("preserves the neighboring pronunciation in %s", (word, ipa) => {
      expect(engine.predict(word)).toBe(ipa);
    });
  });

})();

// Original suite: en-airi-rhotic.test.ts
(() => {
  const __suiteModule0: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule0;
  const __suiteModule1: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule1.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe.each([false, true])("air before i (disableDict=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });

    test.each([
      ["prairie", "ˈpɹɛɹi"], ["airier", "ˈɛɹiɝ"], ["airiest", "ˈɛɹiəst"],
      ["fairies", "ˈfɛɹiz"], ["air", "ˈɛɹ"], ["airing", "ˈɛɹɪŋ"],
    ])("preserves the rhotic vowel in %s", (word, expected) => {
      expect(engine.predict(word, "en-US")).toBe(expected);
    });

    test.each([
      ["The prairie is wide.", "ðə ˈpɹɛɹi ɪz waɪd."],
      ["The airier room feels bright.", "ðə ˈɛɹiɝ ɹum fiɫz bɹaɪt."],
      ["They are airing the room.", "ðeɪ ɑɹ ˈɛɹɪŋ ðə ɹum."],
    ])("preserves the sentence %s", (sentence, expected) => {
      expect(api.phonemize(sentence, { language: "en-US" })).toBe(expected);
    });
  });

})();

// Original suite: en-alf-coda.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    const predict = (word: string) => g.predict(word, "en")!;
    describe(`checked alf coda (${disableDict})`, () => {
      test("keeps the root vowel and silent lateral", () => {
        for (const word of ["half", "calf", "behalf", "half's", "calf's", "calfs"])
          expect(predict(word)).toMatch(/æf(?:s)?$/);
      });
      test("retains the supplied root in ordinary compositions", () => {
        for (const word of ["halves", "calves", "halfway", "halfback", "halfhearted", "halfheartedly", "halftime"])
          expect(predict(word)).not.toMatch(/æ[lɫ][fv]/);
      });
      test("keeps other ves endings and supplied sonorant-f roots", () => {
        for (const word of ["shelves", "wolves", "elves", "ourselves", "themselves"])
          expect(predict(word)).toMatch(/v[zʒ]?$/);
        for (const [word, ending] of [["cheves", /tʃivz$/], ["ives", /aɪvz$/], ["gives", /ɡɪvz$/], ["hives", /aɪvz$/], ["curves", /ɝvz$/]] as const)
          expect(predict(word)).toMatch(ending);
      });
      test("retains laterals in names and medial codas", () => {
        for (const word of ["alf", "ralf", "scalf", "alfred", "halfdan", "gandalf"])
          expect(predict(word)).toMatch(/[lɫ]f/);
        for (const word of ["film", "helm", "realm"])
          expect(predict(word)).toMatch(/[lɫ]m/);
      });
    });
  }

})();

// Original suite: en-alien-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("alien lexical stress and hiatus", () => {
    it.each([false, true])("preserves the alienate reading while fixing alien and its plural (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("alien", "en-US", "NN")).toBe("ˈeɪɫiən");
      expect(engine.predict("alien", "en-US", "JJ")).toBe("ˈeɪɫiən");
      expect(engine.predict("aliens", "en-US", "NNS")).toBe("ˈeɪɫiənz");
      expect(engine.predict("alienate", "en-US", "VB")).toBe(disableDict ? "ˈeɪɫiəˌneɪt" : "ˈeɪɫjəˌneɪt");
      expect(engine.predict("alienated", "en-US", "VBD")).toBe("ˈeɪɫiəˌneɪtɪd");
      expect(engine.predict("alienates", "en-US", "VBZ")).toBe("ˈeɪɫiəˌneɪts");
      expect(engine.predict("alienating", "en-US", "VBG")).toBe("ˈeɪɫiəˌneɪtɪŋ");
      expect(engine.predict("alienation", "en-US", "NN")).toBe("ˌeɪɫiəˈneɪʃən");


      const tokens = englishTokens(engine, "An alien visitor met two aliens; the insult alienated and alienates people, causing alienation.");
      const readings = tokens.filter(token => ["alien", "aliens", "alienated", "alienates", "alienation"].includes(token.word.toLowerCase()));
      expect(readings.map(token => token.phoneme)).toEqual([
        "ˈeɪɫiən", "ˈeɪɫiənz", "ˈeɪɫiəˌneɪtɪd", "ˈeɪɫiəˌneɪts", "ˌeɪɫiəˈneɪʃən",
      ]);
    });
  });

})();

// Original suite: en-almost-root.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  describe("almost lexicalized compound reading", () => {
    it.each([false, true])("keeps the all+most vowel in the word and sentence (dictionary disabled: %s)", (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("almost", "en-US", "RB")).toBe("ˈɔɫˌmoʊst");
      expect(engine.predict("all", "en-US")).toBe("ˈɔɫ");
      expect(engine.predict("most", "en-US")).toBe("ˈmoʊst");
      expect(engine.predict("foremost", "en-US")).toBe("ˈfɔɹˌmoʊst");


      const tokens = englishTokens(engine, "Almost all the work is done; most of it is foremost in our plan.");
      const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
      expect(reading("almost")).toBe("ˈɔɫˌmoʊst");
      expect(reading("all")).toBe("ɔɫ");
      expect(reading("most")).toBe("moʊst");
      expect(reading("foremost")).toBe("ˈfɔɹˌmoʊst");
    });
  });

})();

// Original suite: en-analysis-integration.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("../src/core") = require("../src/core");
  const { createPhonemizer } = __suiteModule1;
  type SentenceAnalysis = import("../src/g2p").SentenceAnalysis;

  describe("shadow sentence analysis integration", () => {
    test("analyzes comma lists in the actual tokenizer without changing pronunciation", () => {
      const engine = new EnglishG2P({ analysis: "shadow" });
      const api = createPhonemizer({ processors: [engine] });
      const legacy = createPhonemizer({ processors: [new EnglishG2P()] });
      let analysis: SentenceAnalysis | undefined;
      const tag = engine.tagWord.bind(engine);
      engine.tagWord = (word, context) => {
        if (word === "record") analysis = context?.sentence?.analysis;
        return tag(word, context);
      };
      const sentence = "They will read, record, and replay the tape.";
      const options = { language: "en-US", returnArray: true } as const;
      expect(api.phonemize(sentence, options)).toEqual(legacy.phonemize(sentence, options));
      expect(analysis?.status).toBe("parsed");
      expect(analysis?.words).toEqual(["They", "will", "read", ",", "record", ",", "and", "replay", "the", "tape", "."]);
      expect(analysis?.tokens[4].tags).toContain("V");
    });
    test.each([false, true])("shares one immutable analysis per sentence, preserving occurrence hooks, rules=%s", disableDict => {
      const engine = new EnglishG2P({ disableDict, analysis: "shadow" });
      const api = createPhonemizer({ processors: [engine] });
      const legacy = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const calls: Array<{ word: string; index: number; analysis: SentenceAnalysis | undefined }> = [];
      const tag = engine.tagWord.bind(engine);
      engine.tagWord = (word, context) => {
        calls.push({ word, index: context?.sentence?.index ?? -1, analysis: context?.sentence?.analysis });
        return tag(word, context);
      };
      const sentence = "They record a record. I will read yesterday's notes.";
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true })).toEqual(legacy.phonemize(sentence, { language: "en-US", returnArray: true }));
      expect(calls.map(c => c.word)).toEqual(["They", "record", "a", "record", "I", "will", "read", "yesterday's", "notes"]);
      expect(calls.map(c => c.index)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 4]);
      expect(calls.every(c => c.analysis !== undefined)).toBe(true);
      expect(new Set(calls.slice(0, 4).map(c => c.analysis)).size).toBe(1);
      expect(new Set(calls.map(c => c.analysis)).size).toBe(2);
    });
    test("Known-POS changes only the selected occurrence and preserves other tokens", () => {
      const engine = new EnglishG2P({ analysis: "shadow" });
      const api = createPhonemizer({ processors: [engine] });
      const options: { language: string; returnArray: true } = { language: "en-US", returnArray: true };
      const before = api.phonemize("They record a record.", options);
      const tag = engine.tagWord.bind(engine);
      let seen = 0;
      engine.tagWord = (word, context) => word === "record" && ++seen === 2 ? { pos: "V", confidence: 1 } : tag(word, context);
      const after = api.phonemize("They record a record.", options);
      expect(after.slice(0, 3)).toEqual(before.slice(0, 3));
      expect(after[3].phoneme).not.toBe(before[3].phoneme);
      expect(after.slice(4)).toEqual(before.slice(4));
    });
    test("default and isolated citation paths keep the existing entry behavior", () => {
      expect(new EnglishG2P().analyzeSentence).toBeUndefined();
      const engine = new EnglishG2P({ analysis: "shadow" });
      const analyze = jest.spyOn(engine, "analyzeSentence");
      const api = createPhonemizer({ processors: [engine] });
      expect(api.phonemize("for", { language: "en-US" })).toBe(createPhonemizer({ processors: [new EnglishG2P()] }).phonemize("for", { language: "en-US" }));
      expect(analyze).not.toHaveBeenCalled();
    });
  });

  test("trace records the actual legacy component choice without changing IPA", () => {
    const engine = new EnglishG2P({ disableDict: true });
    const trace = engine.trace("automotive");
    expect(trace.ipa).toBe(engine.predict("automotive"));
    expect(trace.structure).toMatchObject({ kind: "legacy-compound", left: { spelling: "auto", start: 0, end: 4 }, right: { spelling: "motive", start: 4, end: 10 }, stressOwner: "right", boundary: "unclassified" });
    expect(engine.trace("webpage").structure).toMatchObject({ kind: "legacy-compound", right: { spelling: "page", componentIpa: "ˈpeɪdʒ" } });
    const lexical = new EnglishG2P();
    lexical.addPronunciation("automotive", "ˌɔtəˈmoʊtɪv");
    expect(lexical.trace("automotive").structure).toMatchObject({ kind: "opaque", route: "custom-dict" });
  });

})();

// Original suite: en-ange-lateral-foot.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;
  const __suiteModule1: typeof import("./helpers/english") = require("./helpers/english");
  const { englishTokens } = __suiteModule1;

  // Oxford American angel /ˈeɪndʒl/:
  // https://www.oxfordlearnersdictionaries.com/definition/american_english/angel
  // Synthetic forms assert only the vowel/rime owned by the rule.
  describe.each([false, true])("ange lateral foot (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    test.each(["angel", "angels", "angel's", "zangel", "zangels"])("preserves the tense vowel in %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/eɪndʒə[lɫ]z?$/);
    });
    test.each(["angelic", "evangel", "tangent", "tangible", "anger", "flange"])("retains the short vowel in %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("æ");
    });
    test.each(["angeled", "angeling", "angeler", "angelous"])("keeps the complete root after eviction: %s", word => {
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("eɪndʒə");
    });
    // Cambridge US: https://dictionary.cambridge.org/us/dictionary/english/larcenous
    test("keeps the weak nominal root before neutral -ous", () => {
      expect(engine.predict("larcenous")).toBe("ˈɫɑɹsənəs");
      expect(engine.predict("larcenously")).toContain("sənəs");
    });
    test("preserves caller-owned roots", () => {
      const owned = new EnglishG2P({ disableDict });
      owned.addPronunciation("zangel", "ˈzɛŋ");
      expect(owned.predict("zangel")).toBe("ˈzɛŋ");
      expect(owned.predict("zangels")).toBe("ˈzɛŋz");
    });
    test("preserves noun, adjective and verb readings in sentences", () => {

      const tokens = englishTokens(engine, "The angel records angelic voices. They anger the manager.");
      for (const [word, pos] of [["angel", "N"], ["angelic", "ADJ"], ["anger", "V"]])
        expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
      expect(tokens.find(token => token.word === "records")?.phoneme).toBe(engine.predict("records", "en-US", "V"));
    });
  });

})();

// Original suite: en-anti-v-compound.test.ts
(() => {
  const __suiteModule0: typeof import("../src/en/g2p") = require("../src/en/g2p");
  const EnglishG2P = __suiteModule0.default;
  type EnglishG2P = import("../src/en/g2p").default;

  describe("anti- before an independently verified v-root", () => {
    const rules = new EnglishG2P({ disableDict: true });

    it("keeps the bound prefix /i/ and assigns stress to the known root", () => {
      expect(rules.predict("antivirus", "en-US")).toBe("ˌæntiˈvaɪɹəs");
      expect(rules.trace("antivirus", "en-US").path).toBe("compound");
      expect(rules.predict("antivirus", "en-US", "N")).toBe("ˌæntiˈvaɪɹəs");
    });

    it.each([
      ["anti", "ˈænti"],
      ["anticipated", "ænˈtɪsəˌpeɪtɪd"],
      ["antidote", "ˈæntɪˌdoʊt"],
      ["antimissile", "ˌænˌtaɪˈmɪsəɫ"],
    ])("preserves the unsplit control %s", (word, expected) => {
      expect(rules.predict(word, "en-US")).toBe(expected);
    });
  });

})();
