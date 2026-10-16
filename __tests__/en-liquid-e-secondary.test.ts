import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string) => {
  const { phones, primary } = parseIpa(ipa);
  return { phones, primary };
};

describe.each([false, true])("weak e before a closed liquid syllable (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["electronic", "ɪɫɛkˈtɹɑnɪk"], ["electronics", "ɪɫɛkˈtɹɑnɪks"],
    ["electrician", "ɪɫɛkˈtɹɪʃən"], ["electricians", "ɪɫɛkˈtɹɪʃənz"],
    ["electricity", "ɪɫɛkˈtɹɪsəti"], ["electricities", "ɪɫɛkˈtɹɪsətiz"],
  ])("retains the root vowel and stress in %s after rebuilding", (word, ipa) => {
    expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
  });
  it("preserves open second syllables and longer prefix controls", () => {
    const controls = disableDict
      ? ["ˌɛɫəˈmɛntɝi", "ˌɛpɪˈɫɛptɪk", "ˌɪɫəktɹɑməɡˈnɛtɪk"]
      : ["ˌɛɫəˈmɛntɝɹi", "ˌɛpəˈɫɛptɪk", "ˌɪˌɫɛktɹoʊmæɡˈnɛtɪk"];
    ["elementary", "epileptic", "electromagnetic"].forEach((word, i) => {
      expect(engine.predict(word)).toBe(controls[i]);
    });
  });
  it("keeps caller root pronunciations in unlisted plurals", () => {
    for (const root of ["electronic", "electrician", "electricity"]) {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation(root, "ˈzɛŋ");
      expect(reading(custom.predict(root + "s")!)).toEqual(reading("ˈzɛŋz"));
    }
  });
  it("handles noun and adjective targets in full prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const result = api.phonemize("The electrician will work with electronic equipment.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["electrician", "ɪɫɛkˈtɹɪʃən"], ["electronic", "ɪɫɛkˈtɹɑnɪk"]]) {
      expect(reading(result.find(token => token.word === word)!.phoneme)).toEqual(reading(ipa));
    }
    expect(result.find(token => token.word === "work")?.phoneme).toBe("wɝk");
  });
});
