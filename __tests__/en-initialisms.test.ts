import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("Dictionary-attested initialisms", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["c", "si"], ["h", "eɪtʃ"], ["q", "kju"],
    ["dvd", "dividi"], ["pdf", "pidiɛf"], ["bbc", "bibisi"],
    ["html", "eɪtʃtiɛmɛɫ"], ["usb", "juɛsbi"], ["cpu", "sipiju"],
  ])("reads %s as letter names", (word, expected) => {
    expect(phonemizer.toIPA(word).replace(/[ˈˌ\s]/g, "")).toBe(expected);
  });

  it.each([
    ["gas", "ˈɡæs"], ["disclosure", "dɪˈskɫoʊʒɝ"],
  ])("does not use initialisms as morphological parts of %s", (word, expected) => {
    expect(phonemizer.toIPA(word)).toBe(expected);
  });

  it.each([
    ["disclaim", "dɪˈskɫeɪm"], ["disclaimer", "dɪˈskɫeɪmɝ"],
    ["disclose", "dɪˈskɫoʊz"], ["disclosed", "dɪˈskɫoʊzd"],
    ["disclosing", "dɪˈskɫoʊzɪŋ"], ["disclosure", "dɪˈskɫoʊʒɝ"],
  ])("moves dis- /s/ into the /skl/ onset in %s", (word, expected) => {
    // Cambridge US gives disclosure /dɪˈskloʊʒɚ/; the class extends to the
    // same stressed discl- onset in the related verb and noun forms.
    expect(phonemizer.toIPA(word)).toBe(expected);
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it.each([
    ["hiv", "eɪtʃaɪvi"], ["irs", "aɪɑɹɛs"], ["usa", "juɛseɪ"],
    ["usda", "juɛsdi eɪ"], ["ins", "aɪɛnɛs"], ["api", "eɪpiaɪ"],
  ])("uses the registered spelling for rule-only %s", (word, expected) => {
    expect(rules.predict(word, "en")!.replace(/[ˈˌ]/g, "")).toBe(expected.replace(/ /g, ""));
    expect(rules.trace(word).steps[0].rule).toBe("initialism:registered");
  });

  it.each([
    ["aaa", "ˌtɹɪpəˈɫeɪ"], ["ieee", "ˌaɪˌtɹɪpɫəˈi"],
  ])("registers dictionary-backed triple-letter spelling %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
    expect(rules.trace(word).steps[0].rule).toBe("initialism:registered");
  });

  it("preserves triple-letter readings and neighboring lexical controls in a sentence", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("aaa and ieee work with gas and the app.", {
      language: "en-US", returnArray: true,
    });
    const phones = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");
    for (const [word, ipa] of [
      ["aaa", "ˌtɹɪpəˈɫeɪ"], ["ieee", "ˌaɪˌtɹɪpɫəˈi"],
      ["gas", "ˈɡæs"], ["app", "ˈæp"],
    ]) expect(phones(tokens.find(token => token.word === word)?.phoneme ?? "")).toBe(phones(ipa));
  });

  it.each([
    ["gas", "ˈɡæs"], ["app", "ˈæp"],
  ])("keeps unregistered lexical forms on spelling rules: %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it("reports the lexical path for an attested initialism", () => {
    expect(new EnglishG2P().trace("dvd").path).toBe("dictionary");
  });
});
