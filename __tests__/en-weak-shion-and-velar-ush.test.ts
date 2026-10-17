import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { syllableToIPA } from "../src/en/syllabify";

// https://dictionary.cambridge.org/us/dictionary/english/fashion
// https://dictionary.cambridge.org/pronunciation/english/cushion
const family = ["fashion", "fashions", "fashioned", "fashioning", "fashionable", "refashion", "refashioning",
  "cushion", "cushions", "cushioned", "cushioning", "cushy", "recushion", "recushioning", "uncushioned", "cushey", "parishioner", "parishioners", "oldfashioned"];
describe.each([false, true])("weak shion and vocalic velar ush, rules=%s", disableDict => {
  const withoutFamily = () => {
    const own = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(own, "dictionary") };
    for (const word of family) delete dictionary[word];
    Reflect.set(own, "dictionary", dictionary);
    return own;
  };
  it.each([
    ["fashion", "ˈfæʃən"], ["fashions", "ˈfæʃənz"], ["fashioned", "ˈfæʃənd"],
    ["fashioning", "ˈfæʃənɪŋ"], ["fashionable", "ˈfæʃənəbəɫ"],
    ["refashion", "ɹiˈfæʃən"], ["refashioning", "ɹiˈfæʃənɪŋ"],
    ["cushion", "ˈkʊʃən"], ["cushions", "ˈkʊʃənz"], ["cushioned", "ˈkʊʃənd"],
    ["cushioning", "ˈkʊʃənɪŋ"], ["cushy", "ˈkʊʃi"],
    ["cushey", "ˈkʊʃi"], ["noncushey", "nɑnˈkʊʃi"],
    ["noncushy", "nɑnˈkʊʃi"], ["noncushion", "nɑnˈkʊʃən"], ["nonfashion", "nɑnˈfæʃən"],
    ["nonparishioner", "nɑnpɝˈɪʃənɝ"], ["nonparishioners", "nɑnpɝˈɪʃənɝz"],
    ["parishioner", "pɝˈɪʃənɝ"], ["oldfashioned", "oʊɫdˈfæʃənd"],
    ["cushier", "ˈkʊʃiɝ"], ["cushiest", "ˈkʊʃiəst"],
    ["recushion", "ɹiˈkʊʃən"], ["recushioning", "ɹiˈkʊʃənɪŋ"], ["uncushioned", "ənˈkʊʃənd"],
  ])("keeps the root and suffix after eviction: %s", (word, ipa) => {
    expect(withoutFamily().predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("keeps the same root under productive and repeated prefixes", () => {
    const own = withoutFamily();
    for (const word of ["unrecushioning", "countercushioning", "overcushioning"])
      expect(own.predict(word)).toMatch(/ˈkʊʃənɪŋ$/);
  });
  it.each([
    ["bush", "ˈbʊʃ"], ["push", "ˈpʊʃ"], ["gush", "ˈɡʌʃ"], ["hush", "ˈhʌʃ"],
    ["rush", "ˈɹʌʃ"], ["brush", "ˈbɹʌʃ"], ["crush", "ˈkɹʌʃ"], ["plush", "ˈpɫʌʃ"],
    ["percussion", "pɝˈkʌʃən"], ["discussion", "dɪˈskʌʃən"],
    ["vision", "ˈvɪʒən"], ["passion", "ˈpæʃən"], ["mission", "ˈmɪʃən"],
  ])("preserves the neighboring onset and coalescence: %s", (word, ipa) => {
    expect(new EnglishG2P({ disableDict }).predict(word)).toBe(ipa);
  });
  it("preserves caller-owned roots and complete targets", () => {
    const own = withoutFamily();
    own.addPronunciation("fashion", "ˈzɛŋ");
    expect(own.predict("fashioning")).toBe("ˈzɛŋɪŋ");
    own.addPronunciation("fashioning", "ˈʃiən");
    expect(own.predict("fashioning")).toBe("ˈʃiən");
    own.addPronunciation("cushion", "ˈzɛŋ");
    expect(own.predict("cushioning")).toBe("ˈzɛŋɪŋ");
  });
  it.each([
    ["They fashion the badge for the kind minder.", "fashion", "ˈfæʃən"],
    ["The fashion was clear.", "fashion", "ˈfæʃən"],
    ["The fashionable badge was clear.", "fashionable", "ˈfæʃənəbəɫ"],
  ])("preserves noun, verb and adjective sentence controls: %s", (sentence, word, ipa) => {
    const api = createPhonemizer({ processors: [withoutFamily()] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
it("coalesces only a noninitial weak shion syllable", () => {
  expect(syllableToIPA("shion", 1, false, true, undefined, undefined, "fa")).toBe("ʃən");
  for (const [index, stressed, secondary] of [[0, false, false], [1, true, false], [1, false, true]] as const)
    expect(syllableToIPA("shion", index, stressed, true, undefined, undefined, "fa", false, undefined, secondary)).not.toBe("ʃən");
});
