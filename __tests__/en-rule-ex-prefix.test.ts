import EnG2P from "../src/en/g2p";
import { assignStress, syllabify } from "../src/en/syllabify";

// The ex- prefix, rule path only. Each case pins the segment the rule
// owns — the stress slot, or the /ɡz/ cluster and the mark that splits
// it — not the whole IPA string, which can move when build-dict re-mines
// the stems the morphology handlers look up.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("two-syllable ex- before a vowel takes final stress", () => {
  // Onset maximisation gives the <x> to the second syllable, so these
  // words reach assignStress as e|xist and the "ex" entry in
  // PREFIXES_2SYL cannot see the prefix. The dict wants final stress on
  // 11 of the 16 true two-syllable ex+vowel words.
  it.each(["exist", "exam", "exact", "exempt", "exert"])(
    "%s is stressed on the root",
    (word) => {
      expect(syllabify(word)).toEqual(["e", word.slice(1)]);
      expect(assignStress(syllabify(word), word)).toBe(1);
      expect(rules(word)).toMatch(/^ɪɡˈz/);
    },
  );

  it("ex+consonant words still reach the prefix table spelt whole", () => {
    expect(syllabify("expect")).toEqual(["ex", "pect"]);
    expect(assignStress(syllabify("expect"), "expect")).toBe(1);
  });
});

describe("the stress mark splits the /ɡz/ cluster", () => {
  // /ɡz/ is not a licit English onset: the dict writes the ɡ in the
  // preceding coda in all 112 entries that contain the cluster, and
  // never puts a stress mark in front of it.
  it.each(["exist", "example", "exotic", "exemption", "exude", "exhibit"])(
    "%s has no mark before the cluster",
    (word) => {
      const ipa = rules(word);
      expect(ipa).toContain("ɡˈz");
      expect(ipa).not.toMatch(/[ˈˌ]ɡz/);
    },
  );
});

describe("ex+h voices and drops the h when the prefix is reduced", () => {
  // 14:0 in the dict for a reduced prefix, 8:1 the other way for a full
  // /ɛ/ one — the split is the prefix vowel, not the spelling.
  it.each(["exhibit", "exhaust", "exhort", "exhilarate", "exhaustive"])(
    "%s is /ɡz/ with no h",
    (word) => {
      const ipa = rules(word);
      expect(ipa).toContain("ɡˈz");
      expect(ipa).not.toContain("h");
    },
  );

  it.each(["exhaled", "exhalation", "exhibition", "exhibitionist"])(
    "%s keeps the voiceless /ks/ behind a full ɛ",
    (word) => {
      const ipa = rules(word);
      expect(ipa).toContain("ɛks");
      expect(ipa).not.toContain("ɡz");
    },
  );
});
