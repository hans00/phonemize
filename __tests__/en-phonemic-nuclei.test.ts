import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const lightL = (ipa: string | null | undefined): string | undefined => ipa?.replace(/ɫ/g, "l");

// MW current/flower/shower: connected speech retains polysyllabic primary stress.
describe.each([false, true])("phonemic nuclei and public stress (rules=%s)", disableDict => {
  test("explicit caller pronunciations retain their stress policy", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const supplied of [
      "ˈvɝi", "ˈviɝ", "ˈvaɪɝ",
      "ˈvia", "ˈvaʊə",
      "ˈvɝ", "ˈvaɪ", "ˈvoʊ", "ˈvɔɪ",
    ]) {
      engine.addPronunciation("vurni", supplied);
      for (const pos of ["N", "ADJ", "V", "ADV"])
        expect(engine.predict("vurni", "en-US", pos)).toBe(supplied);
    }
  });

  test.each([
    ["liar", "ˈlaɪɝ"], ["currant", "ˈkɝənt"],
    ["flowering", "ˈflaʊɝɪŋ"], ["showering", "ˈʃaʊɝɪŋ"],
  ])("keeps complete %s readings for every caller role", (word, expected) => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"])
      expect(lightL(engine.predict(word, "en-US", pos))).toBe(expected);
  });

  test.each([
    ["The liar left the house.", "liar", "ˈlaɪɝ"],
    ["The currant buns are warm.", "currant", "ˈkɝənt"],
    ["The flowering plant is tall.", "flowering", "ˈflaʊɝɪŋ"],
    ["They are showering now.", "showering", "ˈʃaʊɝɪŋ"],
  ])("preserves full target stress in %s", (sentence, word, expected) => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(lightL(tokens.find(token => token.word === word)?.phoneme)).toBe(expected);
  });

  test("single diphthong nuclei keep connected-speech stress suppression", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, expected] of [["go", "ɡoʊ"], ["boy", "bɔɪ"], ["cry", "kɹaɪ"]])
      for (const pos of ["N", "ADJ", "V"])
        expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });

  test("raised diphthongs in the existing route do not gain a stress mark", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("guys", "en-US", "N")).not.toContain("ˈ");
  });

  test.each([
    ["bear", "bɛə"], ["near", "nɪə"], ["tour", "tʊə"],
    ["care", "kɛə"], ["beer", "bɪə"],
    ["R's", "ɑːz"], ["A's", "eɪz"], ["U's", "juz"],
  ])("RP centering or letter nucleus stays single in %s", (word, expected) => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of ["N", "ADJ", "V"])
      expect(engine.predict(word, "en-GB", pos)).toBe(expected);
  });

  test.each(["bird", "dog", "lot"])("RP %s keeps its existing phones and single-nucleus policy", word => {
    const engine = new EnglishG2P({ disableDict });
    const citation = engine.predict(word, "en-GB");
    expect(citation).not.toBeNull();
    for (const pos of ["N", "ADJ", "V"])
      expect(engine.predict(word, "en-GB", pos)).toBe(citation?.replace("ˈ", ""));
  });

  test("a supplied syllabic consonant remains a nucleus after inflection", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("vurn", "ˈvʌn̩");
    for (const pos of ["N", "ADJ", "V"])
      expect(engine.predict("vurns", "en-US", pos)).toBe("ˈvʌn̩z");
  });

  test("preserves the existing literal morphology route", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("stewards")).toBe("ˈstuɝdz");
  });
});
