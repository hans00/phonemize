import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("open e before a split iV tail, rules=%s", disableDict => {
  it.each([
    ["appreciate", "əˈpɹiʃiˌeɪt"], ["depreciate", "dɪˈpɹiʃiˌeɪt"],
    ["abbreviate", "əˈbɹiviˌeɪt"], ["alleviate", "əˈɫiviˌeɪt"],
    ["mediate", "ˈmidiˌeɪt"],
  ])("preserves the full vowel and owned coda in %s", (word, ipa) => {
    expect(new EnglishG2P({ disableDict }).predict(word)).toBe(ipa);
  });
  it("keeps derived roots and closed nasal + ci controls", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const word of ["appreciates", "appreciated", "appreciating", "appreciation"])
      expect(engine.predict(word)).toMatch(/pɹiʃi/);
    for (const word of ["enunciate", "enunciation", "annunciate"])
      expect(engine.predict(word)).toMatch(/nsi/);
    expect(engine.predict("associate")).toMatch(/soʊsi/);
    expect(engine.predict("association")).toMatch(/soʊsi/);
    for (const word of ["specialise", "specialises", "specialising"])
      expect(engine.predict(word)).toMatch(/^ˈspɛ/);
    expect(engine.predict("medal")).toBe("ˈmɛdəɫ");
    expect(engine.predict("special")).toBe("ˈspɛʃəɫ");
  });
  it("retains caller-owned whole words", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("appreciate", "ˈzɛŋ");
    expect(engine.predict("appreciate")).toBe("ˈzɛŋ");
  });
});
it("preserves noun/adjective/verb sentence controls", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const [sentence, target, ipa] of [
    ["I appreciate the help.", "appreciate", "əˈpɹiʃiˌeɪt"],
    ["It is a precious gift.", "precious", "ˈpɹɛʃəs"],
    ["Use discretion here.", "discretion", "dɪsˈkɹɛʃən"],
    ["The medical report is clear.", "medical", "ˈmɛdɪkəɫ"],
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === target)?.phoneme).toBe(ipa);
});
