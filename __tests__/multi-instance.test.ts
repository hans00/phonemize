import {
  phonemize,
  toIPA,
  createPhonemizer,
  Phonemizer,
  G2PRegistry,
} from "../src/all";
import type { G2PProcessor } from "../src/g2p";
import EnglishG2P from "../src/en-g2p";
import ChineseG2P from "../src/zh-g2p";

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
      const enOnly = createPhonemizer({ g2ps: [new EnglishG2P()] });
      const result = enOnly.phonemize("hello 中文");
      expect(result).toContain("həˈɫoʊ");
      // No Chinese processor on this instance → 中文 falls through unchanged
      expect(result).toContain("中文");
    });

    it("applies a default language across calls", () => {
      const rp = createPhonemizer({
        g2ps: [new EnglishG2P()],
        language: "en-GB",
      });
      expect(rp.phonemize("car")).toBe("ˈkɑː");
      expect(rp.phonemize("doctor")).toBe("ˈdɑktə");
    });

    it("lets per-call language override the instance default", () => {
      const rp = createPhonemizer({
        g2ps: [new EnglishG2P()],
        language: "en-GB",
      });
      expect(rp.phonemize("car", "en-US")).toBe("ˈkɑɹ");
    });

    it("supports useG2P() chaining for late registration", () => {
      const p = new Phonemizer();
      p.useG2P(new EnglishG2P()).useG2P(new ChineseG2P());
      const result = p.phonemize("hello 中文");
      expect(result).toContain("həˈɫoʊ");
      expect(result).toMatch(/[˥˧]/);
    });

    it("unregister removes a processor from the registry", () => {
      const p = createPhonemizer({ g2ps: [new EnglishG2P()] });
      expect(p.phonemize("hello")).toBe("həˈɫoʊ");
      const removed = p.unregister("en-g2p");
      expect(removed).toBe(true);
      expect(p.phonemize("hello")).toBe("hello"); // no processor → passthrough
    });

    it("addPronunciation only mutates the instance registry", () => {
      const a = createPhonemizer({ g2ps: [new EnglishG2P()] });
      const b = createPhonemizer({ g2ps: [new EnglishG2P()] });
      a.addPronunciation("xyzzy", "ɛksɪzi");
      expect(a.phonemize("xyzzy")).toBe("ɛksɪzi");
      // b was created with a fresh EnglishG2P — must not see a's override
      expect(b.phonemize("xyzzy")).not.toBe("ɛksɪzi");
    });
  });

  describe("G2PRegistry language tag matching", () => {
    it("processor declaring 'en' matches en-GB request (parent fallback)", () => {
      const reg = new G2PRegistry();
      reg.register(new EnglishG2P());
      const proc = reg.findBestProcessor("hello", "en-GB");
      expect(proc?.id).toBe("en-g2p");
    });

    it("prefers exact dialect match over parent-tag fallback", () => {
      class GBOnly implements G2PProcessor {
        readonly id = "gb-only";
        readonly name = "British";
        readonly supportedLanguages = ["en-GB"];
        predict() {
          return "rp";
        }
        addPronunciation() {}
      }
      const reg = new G2PRegistry();
      reg.register(new EnglishG2P()); // declares en, en-US, en-GB
      reg.register(new GBOnly()); // only en-GB
      const proc = reg.findBestProcessor("x", "en-GB");
      // Both processors declare en-GB. Insertion order should win in a
      // tie. EnglishG2P was registered first → it's still preferred.
      expect(proc?.id).toBe("en-g2p");
    });
  });
});
