import { phonemize, toIPA, toARPABET, createPhonemizer } from "../src/all";
import EnglishG2P from "../src/en/g2p";
import { transformAmericanToRP } from "../src/en/gb";

describe("en-GB (Received Pronunciation) transformation", () => {
  describe("non-rhotic transformation", () => {
    it("strips coda /ɹ/ and lengthens preceding vowel for START class", () => {
      expect(phonemize("car", "en-GB")).toBe("ˈkɑː");
      expect(phonemize("far", "en-GB")).toBe("ˈfɑː");
      expect(phonemize("start", "en-GB")).toBe("ˈstɑːt");
    });

    it("strips coda /ɹ/ and lengthens preceding vowel for NORTH/FORCE", () => {
      expect(phonemize("for", "en-GB")).toBe("ˈfɔː");
      expect(phonemize("more", "en-GB")).toBe("ˈmɔː");
    });

    it("turns SQUARE class into /ɛə/", () => {
      expect(phonemize("hair", "en-GB")).toBe("ˈhɛə");
      expect(phonemize("bear", "en-GB")).toBe("ˈbɛə");
    });

    it("turns NEAR class into /ɪə/", () => {
      expect(phonemize("near", "en-GB")).toBe("ˈnɪə");
    });

    it("turns CURE class into /ʊə/", () => {
      expect(phonemize("tour", "en-GB")).toBe("ˈtʊə");
    });

    it("turns FIRE / POWER diphthong+/ɹ/ into the /ə/ ending", () => {
      expect(phonemize("fire", "en-GB")).toBe("ˈfaɪə");
      expect(phonemize("hour", "en-GB")).toBe("ˈaʊə");
    });

    it("preserves onset /ɹ/ between vowels", () => {
      // ɹ in barrel / very is in onset (followed by a vowel) → must stay
      expect(phonemize("barrel", "en-GB")).toContain("ɹ");
      expect(phonemize("very", "en-GB")).toContain("ɹ");
      expect(phonemize("married", "en-GB")).toContain("ɹ");
    });
  });

  describe("NURSE vowel split", () => {
    it("converts stressed rhotacized schwa /ɝ/ to /ɜː/", () => {
      expect(phonemize("bird", "en-GB")).toBe("ˈbɜːd");
      expect(phonemize("word", "en-GB")).toBe("ˈwɜːd");
      expect(phonemize("nurse", "en-GB")).toBe("ˈnɜːs");
    });

    it("converts unstressed rhotacized schwa to plain /ə/ (commA-LETTER merger)", () => {
      expect(phonemize("doctor", "en-GB")).toBe("ˈdɑktə");
      expect(phonemize("letter", "en-GB")).toBe("ˈɫɛtə");
      expect(phonemize("teacher", "en-GB")).toContain("tʃə");
    });
  });

  describe("word-level RP overrides", () => {
    it("French /-age/ borrowings end in /ʒ/, not /dʒ/", () => {
      expect(phonemize("garage", "en-GB")).toContain("ʒ");
      expect(phonemize("massage", "en-GB")).toContain("ʒ");
      expect(phonemize("sabotage", "en-GB")).toContain("ʒ");
    });

    it("retains yod /j/ after /s/ where AmE drops it", () => {
      expect(phonemize("sue", "en-GB")).toBe("ˈsjuː");
      expect(phonemize("suit", "en-GB")).toBe("ˈsjuːt");
      expect(phonemize("super", "en-GB")).toBe("ˈsjuːpə");
    });

    it("yod rule does not fire on words like 'sushi' (next IPA is /ʃ/)", () => {
      expect(phonemize("sushi", "en-GB")).not.toContain("sj");
    });

    it("French /-age/ rule lengthens the final back vowel and drops /d/", () => {
      // garage and sabotage have stressed /ɑʒ/ — should lengthen to /ɑːʒ/
      expect(phonemize("garage", "en-GB")).toContain("ɑːʒ");
      expect(phonemize("sabotage", "en-GB")).toContain("ɑːʒ");
      // espionage has /ɑdʒ/ — should drop the /d/ and lengthen
      expect(phonemize("espionage", "en-GB")).toContain("ɑːʒ");
      expect(phonemize("espionage", "en-GB")).not.toContain("dʒ");
      // native English -age stays untouched (no false positive on
      // marriage / package / image / etc.)
      expect(phonemize("package", "en-GB")).toContain("dʒ");
    });

    it("preserves /ɔː/ in -ormation words", () => {
      // base AmE reduces this to /ɝ/ (rhotacized schwa)
      expect(phonemize("information", "en-GB")).toBe("ˌɪnfəˈmeɪʃən");
    });

    it("schedule uses initial /ʃ/ in RP", () => {
      expect(phonemize("schedule", "en-GB")).toContain("ʃ");
    });
  });

  describe("integration", () => {
    it("does not change AmE output when no language is specified", () => {
      expect(phonemize("car")).toBe("ˈkɑɹ"); // baseline AmE
      expect(phonemize("bird")).toBe("ˈbɝd");
    });

    it("toIPA('text', 'en-GB') yields the RP form", () => {
      expect(toIPA("doctor", "en-GB")).toBe("ˈdɑktə");
    });

    it("EnglishG2P({ dialect: 'en-GB' }) instance defaults to RP without explicit tag", () => {
      const p = createPhonemizer({
        processors: [new EnglishG2P({ dialect: "en-GB" })],
      });
      expect(p.phonemize("car")).toBe("ˈkɑː");
    });

    it("explicit language tag overrides the instance dialect", () => {
      const p = createPhonemizer({
        processors: [new EnglishG2P({ dialect: "en-GB" })],
      });
      expect(p.phonemize("car", "en-US")).toBe("ˈkɑɹ");
    });
  });

  describe("ARPABET output for en-GB", () => {
    it("emits no 'undefined' tokens for words the RP transform touches", () => {
      // ɜ and ː are RP-only IPA symbols not in the canonical ARPABET
      // inventory; they should be mapped (ɜ → ER) or stripped (ː) so
      // ARPABET output is clean.
      const out = toARPABET("car", "en-GB");
      expect(out).not.toContain("undefined");
      expect(out).toContain("AA"); // car → AA1
    });

    it("NURSE words round-trip to ER in ARPABET", () => {
      expect(toARPABET("bird", "en-GB")).toContain("ER");
    });
  });

  describe("user customDict beats RP lexical override", () => {
    it("addPronunciation on a shibboleth still wins under en-GB", () => {
      // 'schedule' is in src-data/en-gb/lexical.json — without this
      // fix, calling addPronunciation('schedule', ...) would have no
      // effect for en-GB output.
      const p = createPhonemizer({ processors: [new EnglishG2P()] });
      p.addPronunciation("schedule", "ɛksɛkjuːʃən"); // arbitrary marker
      expect(p.phonemize("schedule", "en-GB")).toBe("ɛksɛkjuːʃən");
      expect(p.phonemize("schedule", "en-US")).toBe("ɛksɛkjuːʃən");
    });
  });

  describe("transformAmericanToRP unit tests", () => {
    it("is a pure function on word + AmE IPA", () => {
      expect(transformAmericanToRP("car", "ˈkɑɹ")).toBe("ˈkɑː");
      expect(transformAmericanToRP("doctor", "ˈdɑktɝ")).toBe("ˈdɑktə");
      expect(transformAmericanToRP("bird", "ˈbɝd")).toBe("ˈbɜːd");
    });

    it("lexical exception (en-gb/lexical.json) wins over rule-based transform", () => {
      // 'schedule' has no rule-derivable form (initial /sk/ → /ʃ/);
      // the JSON lookup short-circuits the rule pass.
      expect(transformAmericanToRP("schedule", "ˈskɛdʒuɫ")).toBe("ˈʃɛdjuːl");
    });
  });
});
