import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("indefinite quantifiers with explicit plural heads, disableDict=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  it("retains the bare predicate after a modified plural subject", () => {
    expect(pick("Some dog handlers use trade secrets to trim and style a dog for the show ring.", "use")).toBe("juz");
  });
  it("shares the number requirement with any", () => {
    expect(pick("Any experienced designers use trade secrets to protect their work?", "use")).toBe("juz");
  });
  it("does not infer a plural subject from an indefinite determiner alone", () => {
    expect(pick("Some computer use cases require care.", "use")).toBe("jus");
    expect(pick("Any computer use cases require care?", "use")).toBe("jus");
  });
  it("preserves noun, adjective, verb and tense controls", () => {
    expect(pick("Some computer uses were documented.", "uses")).toBe("ˈjusəz");
    expect(pick("Some city records list events.", "records")).toBe("ˈɹɛkɝdz");
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
    if (!disableDict) {
      expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
      expect(pick("Aust wins invite to next year's ASEAN summit.", "invite")).toBe("ˈɪnvaɪt");
    }
  });
  it("preserves the independently attested verb stress on exploit", () => {
    const ipa = pick("Some digital channelizers exploit aliasing in this way for computational efficiency.", "exploit");
    expect(ipa?.replace(/[ˈˌ]/g, "")).toBe("ɪkspɫɔɪt");
    // The onset boundary differs across existing paths; the stressed vowel and every phone are exact.
    expect(ipa).toMatch(/^ɪk(?:sˈ|ˈs)pɫɔɪt$/);
  });
  it("applies the grammar without a target-lemma exception", () => {
    expect(pick("Some sources estimate upwards of two thousand congregations.", "estimate")?.replace(/ˌ/g, "")).toMatch(/^ˈɛst[əɪ]meɪt$/);
  });
});
