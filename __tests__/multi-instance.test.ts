import {
  phonemize,
  toIPA,
  createPhonemizer,
  Phonemizer,
  LanguageRegistry,
} from "../src/all";
import type { LanguageProcessor } from "../src/g2p";
import EnglishG2P from "../src/en/g2p";
import ChineseG2P from "../src/zh/g2p";

describe("Multi-instance and language preference", () => {
  describe("phonemize() language shorthand", () => {
    it("treats a string second arg as preferred language", () => {
      const us = phonemize("car");
      const gb = phonemize("car", "en-GB");
      expect(us).toContain("ɹ"); // rhotic
      expect(gb).not.toContain("ɹ"); // non-rhotic
      expect(gb).toContain("ɑː");
    });

    it("still supports legacy boolean returnArray flag", () => {
      const result = phonemize("hello", true);
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts language via options object", () => {
      const gb = phonemize("doctor", { language: "en-GB" });
      expect(gb).toBe("ˈdɑktə");
    });

    it("does not affect zh tokens — script detection still wins", () => {
      const result = phonemize("hello 中文", "en-GB");
      expect(result).toContain("həˈɫoʊ"); // English part still phonemized
      expect(result).toMatch(/[˥˧]/); // Chinese tones present
    });

    it("re-detects per-token script when source has no whitespace boundary", () => {
      // 'hello中文' tokenizes as 'hello' + '中文'. The languageMap
      // (built from whitespace-split chunks) only knows the combined
      // chunk; without per-token re-detection the CJK side would
      // wrongly inherit the preferred 'en-GB' tag.
      const result = phonemize("hello中文", "en-GB");
      expect(result).toContain("həˈɫoʊ");
      expect(result).toMatch(/[˥˧]/);
    });
  });

  describe("toIPA() language shorthand", () => {
    it("accepts a language string", () => {
      expect(toIPA("car", "en-GB")).toBe("ˈkɑː");
      expect(toIPA("car", "en-US")).toBe("ˈkɑɹ");
    });
  });

  describe("createPhonemizer", () => {
    it("creates an isolated registry that does not see global processors", () => {
      const empty = createPhonemizer();
      // No processors registered → input echoes back through the tokenizer
      // unchanged (each token returns null from predictPhonemes, falls
      // through to the original token).
      const result = empty.phonemize("hello");
      expect(result).toBe("hello");
    });

    it("scopes processors to its own registry", () => {
      const enOnly = createPhonemizer({ processors: [new EnglishG2P()] });
      const result = enOnly.phonemize("hello 中文");
      expect(result).toContain("həˈɫoʊ");
      // No Chinese processor on this instance → 中文 falls through unchanged
      expect(result).toContain("中文");
    });

    it("applies a default language across calls", () => {
      const rp = createPhonemizer({
        processors: [new EnglishG2P()],
        language: "en-GB",
      });
      expect(rp.phonemize("car")).toBe("ˈkɑː");
      expect(rp.phonemize("doctor")).toBe("ˈdɑktə");
    });

    it("lets per-call language override the instance default", () => {
      const rp = createPhonemizer({
        processors: [new EnglishG2P()],
        language: "en-GB",
      });
      expect(rp.phonemize("car", "en-US")).toBe("ˈkɑɹ");
    });

    it("supports useProcessor() chaining for late registration", () => {
      const p = new Phonemizer();
      p.useProcessor(new EnglishG2P()).useProcessor(new ChineseG2P());
      const result = p.phonemize("hello 中文");
      expect(result).toContain("həˈɫoʊ");
      expect(result).toMatch(/[˥˧]/);
    });

    it("unregister removes a processor from the registry", () => {
      const p = createPhonemizer({ processors: [new EnglishG2P()] });
      expect(p.phonemize("hello")).toBe("həˈɫoʊ");
      const removed = p.unregister("en-g2p");
      expect(removed).toBe(true);
      expect(p.phonemize("hello")).toBe("hello"); // no processor → passthrough
    });

    it("addPronunciation only mutates the instance registry", () => {
      const a = createPhonemizer({ processors: [new EnglishG2P()] });
      const b = createPhonemizer({ processors: [new EnglishG2P()] });
      a.addPronunciation("xyzzy", "ɛksɪzi");
      expect(a.phonemize("xyzzy")).toBe("ɛksɪzi");
      // b was created with a fresh EnglishG2P — must not see a's override
      expect(b.phonemize("xyzzy")).not.toBe("ɛksɪzi");
    });
  });

  describe("BCP 47 case-insensitive matching", () => {
    it("phonemize accepts en-gb (lowercase) the same as en-GB", () => {
      expect(phonemize("car", "en-gb")).toBe("ˈkɑː");
      expect(phonemize("car", "EN-GB")).toBe("ˈkɑː");
      expect(phonemize("car", "en-Gb")).toBe("ˈkɑː");
    });

    it("registry lookup is case-insensitive on the request tag", () => {
      const reg = new LanguageRegistry();
      reg.register(new EnglishG2P());
      expect(reg.findBestProcessor("hello", "en-GB")?.id).toBe("en-g2p");
      expect(reg.findBestProcessor("hello", "EN-gb")?.id).toBe("en-g2p");
    });

    it("phonemize honors dialect even with extended BCP 47 subtags", () => {
      // `en-US-x-foo` (private use) and `en-GB-u-ca-gregory` (extension)
      // both have the dialect region nested past additional subtags.
      // Without proper region parsing these would fall back to the
      // instance default and silently emit AmE for an en-GB request.
      expect(phonemize("car", "en-GB-u-ca-gregory")).toBe("ˈkɑː");
      expect(phonemize("car", "en-US-x-private")).toBe("ˈkɑɹ");
      // Tag with script subtag — region is the third subtag, not second.
      expect(phonemize("car", "en-Latn-GB")).toBe("ˈkɑː");
    });

    it("mixed-case request still prefers exact dialect over parent", () => {
      // EnglishG2P declares ['en','en-US','en-GB']. A processor
      // declaring only 'en-GB' must outrank the bare-'en' fallback,
      // even when the request tag is mixed case.
      class GBOnly implements LanguageProcessor {
        readonly id = "gb-only";
        readonly name = "British";
        readonly supportedLanguages = ["en-GB"];
        predict() {
          return "rp-only";
        }
        addPronunciation() {}
      }
      class EnOnly implements LanguageProcessor {
        readonly id = "en-only";
        readonly name = "English";
        readonly supportedLanguages = ["en"];
        predict() {
          return "en-only";
        }
        addPronunciation() {}
      }
      const reg = new LanguageRegistry();
      reg.register(new EnOnly()); // parent tag, registered first
      reg.register(new GBOnly()); // exact dialect, registered second
      // Without case-insensitive exact match, 'EN-GB' would skip the
      // exact bucket and the parent EnOnly would win.
      expect(reg.findBestProcessor("x", "EN-GB")?.id).toBe("gb-only");
      expect(reg.findBestProcessor("x", "en-gb")?.id).toBe("gb-only");
    });
  });

  describe("registry register / unregister hygiene", () => {
    it("re-registering an id swaps the implementation in place", () => {
      class FakeEn implements LanguageProcessor {
        readonly id = "en-g2p";
        readonly name: string;
        readonly supportedLanguages = ["en"];
        constructor(public marker: string) {
          this.name = "Fake " + marker;
        }
        predict() {
          return this.marker;
        }
        addPronunciation() {}
      }
      const reg = new LanguageRegistry();
      reg.register(new FakeEn("v1"));
      reg.register(new FakeEn("v2"));
      // After swap, only one entry per id and dispatch hits the new one.
      expect(reg.getAllProcessors()).toHaveLength(1);
      expect(reg.findBestProcessor("anything", "en")?.predict("anything")).toBe(
        "v2",
      );
    });

    it("unregister removes every reference, not just one", () => {
      const reg = new LanguageRegistry();
      reg.register(new EnglishG2P());
      reg.register(new EnglishG2P()); // same id, replaces in place
      expect(reg.unregister("en-g2p")).toBe(true);
      expect(reg.getAllProcessors()).toHaveLength(0);
      expect(reg.findBestProcessor("hello", "en")).toBeNull();
    });
  });

  describe("LanguageRegistry language tag matching", () => {
    it("processor declaring 'en' matches en-GB request (parent fallback)", () => {
      const reg = new LanguageRegistry();
      reg.register(new EnglishG2P());
      const proc = reg.findBestProcessor("hello", "en-GB");
      expect(proc?.id).toBe("en-g2p");
    });

    it("among parent matches, the longest-prefix tag wins", () => {
      // For `en-US-x-foo` neither processor exact-matches; both are
      // parent matches. `en-US` is a longer prefix than `en`, so it
      // should outrank the bare-`en` processor regardless of registration
      // order.
      class EnUS implements LanguageProcessor {
        readonly id = "en-us-only";
        readonly name = "American";
        readonly supportedLanguages = ["en-US"];
        predict() {
          return "us";
        }
        addPronunciation() {}
      }
      class EnBare implements LanguageProcessor {
        readonly id = "en-bare";
        readonly name = "Generic";
        readonly supportedLanguages = ["en"];
        predict() {
          return "bare";
        }
        addPronunciation() {}
      }
      const reg = new LanguageRegistry();
      reg.register(new EnBare()); // shorter prefix, registered first
      reg.register(new EnUS()); // longer prefix, registered second
      expect(reg.findBestProcessor("x", "en-US-x-foo")?.id).toBe("en-us-only");
    });

    it("prefers exact dialect match over parent-tag fallback", () => {
      class GBOnly implements LanguageProcessor {
        readonly id = "gb-only";
        readonly name = "British";
        readonly supportedLanguages = ["en-GB"];
        predict() {
          return "rp";
        }
        addPronunciation() {}
      }
      const reg = new LanguageRegistry();
      reg.register(new EnglishG2P()); // declares en, en-US, en-GB
      reg.register(new GBOnly()); // only en-GB
      const proc = reg.findBestProcessor("x", "en-GB");
      // Both processors declare en-GB. Insertion order should win in a
      // tie. EnglishG2P was registered first → it's still preferred.
      expect(proc?.id).toBe("en-g2p");
    });
  });
});
