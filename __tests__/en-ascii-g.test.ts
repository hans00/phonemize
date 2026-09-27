import EnglishG2P from "../src/en/g2p";
import { toIPA, toARPABET } from "../src/index";

// Regression: the ^giv/^gif/^gir PHONEME_RULES entries in src/en/syllabify.ts
// once spelled their hard-/ɡ/ onset with ASCII "g" (U+0067) instead of the
// IPA script letter "ɡ" (U+0261) that every other rule, the dictionary
// (data/en/dict.json) and the rest of the codebase use. Rules-only output
// for words like "gift" and "girl" therefore silently shipped a different
// Unicode codepoint than the dictionary's own /ɡ/ — invisible to the eye,
// but a real mismatch for any consumer normalizing or comparing IPA text.
// Fixed by respelling those three PHONEME_RULES entries with U+0261.
const ASCII_G = "g"; // U+0067, must never appear in IPA output
const IPA_G = "ɡ"; // U+0261, the correct IPA symbol

const GIFT_GIRL_WORDS = [
  "gift",
  "girl",
  "give",
  "get",
  "begin",
  "guest",
  "eggs",
  "anger",
];

describe("no ASCII g (U+0067) in English IPA output", () => {
  const g2pRules = new EnglishG2P({ disableDict: true });
  const g2pDict = new EnglishG2P();

  for (const word of GIFT_GIRL_WORDS) {
    it(`rules-only: ${word}`, () => {
      const ipa = g2pRules.predict(word, "en");
      expect(ipa).toBeDefined();
      expect(ipa).not.toContain(ASCII_G);
    });

    it(`shipped (dict-enabled) EnglishG2P: ${word}`, () => {
      const ipa = g2pDict.predict(word, "en");
      expect(ipa).toBeDefined();
      expect(ipa).not.toContain(ASCII_G);
    });

    it(`toIPA() en-US: ${word}`, () => {
      expect(toIPA(word)).not.toContain(ASCII_G);
    });

    it(`toIPA() en-GB: ${word}`, () => {
      expect(toIPA(word, "en-GB")).not.toContain(ASCII_G);
    });
  }

  // Words whose onset actually exercises the fixed rules (^gif/^gir/^giv
  // one-syllable match) should still contain the correct IPA /ɡ/ — a
  // guard against a fix that drops the consonant instead of re-encoding it.
  it("gift and girl still contain the correct IPA ɡ (U+0261)", () => {
    expect(g2pRules.predict("gift", "en")).toContain(IPA_G);
    expect(g2pRules.predict("girl", "en")).toContain(IPA_G);
  });

  // Genuinely out-of-vocabulary words (not in data/en/dict.json) that hit
  // the same ^gif/^gir/^giv onset rules through the ordinary rule fallback
  // any real caller would take for an unrecognized word.
  it("out-of-vocabulary gif-/gir-/giv- onsets stay ASCII-g-free", () => {
    for (const nonce of ["gifflebot", "girzoid", "givnak"]) {
      const ipa = g2pDict.predict(nonce, "en");
      expect(ipa).not.toContain(ASCII_G);
      expect(ipa).toContain(IPA_G);
    }
  });

  // ARPABET conversion must map the correct /ɡ/ codepoint to G and never
  // emit "undefined" for an unmapped character.
  it("ARPABET conversion maps ɡ to G with no unmapped characters", () => {
    for (const word of GIFT_GIRL_WORDS) {
      const arp = toARPABET(word);
      expect(arp).toContain("G");
      expect(arp).not.toContain("undefined");
    }
  });
});
