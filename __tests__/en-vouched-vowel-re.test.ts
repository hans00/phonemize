import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
describe.each([false, true])("vouched closed vowel-initial roots after re, rules=%s", disableDict => {
  it("preserves complete roots through whole-word eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["react", "reaction", "reactive", "rearm", "readjust", "reenter"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [
      ["react", "ɹiˈækt"], ["reaction", "ɹiˈækʃən"], ["reactive", "ɹiˈæktɪv"],
      ["rearm", "ɹiˈɑɹm"], ["readjust", "ɹiəˈdʒʌst"], ["reenter", "ɹiˈɛntɝ"],
    ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    for (const word of ["reacts", "reacted", "reacting", "reactivate", "reactivity"])
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^ɹiækt/);
    expect(engine.predict("reactivity")).toMatch(/ˈtɪv/);
  });
  it("retains nested negative-prefix roots after stem eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["reactive", "reactivity", "rearm", "unreactive", "nonreactive", "unreactiveness", "unreactivity", "unrearmable"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [
      ["unreactive", "ʌnɹiˈæktɪv"], ["nonreactive", "nɑnɹiˈæktɪv"],
      ["unreactiveness", "ʌnɹiˈæktɪvnəs"], ["unreactivity", "ʌnɹiækˈtɪvəti"],
      ["unrearmable", "ʌnɹiˈɑɹməbəɫ"],
    ]) expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
    expect(engine.predict("rearm", "en-GB")?.replace(/ˌ/g, "")).toBe("ɹiˈɑːm");
    expect(engine.predict("reaction", "en-GB")?.replace(/ˌ/g, "")).toBe("ɹiˈækʃən");
  });
  it("keeps digraphs, ordinary ea roots and repeated-prefix controls", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["reach", "ˈɹitʃ"], ["reaches", "ˈɹitʃəz"], ["reeck", "ˈɹik"],
      ["really", "ˈɹiɫi"], ["realm", "ˈɹɛɫm"], ["reading", "ˈɹidɪŋ"],
      ["reason", "ˈɹizən"], ["reregister", "ɹiˈɹɛdʒɪstɝ"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves supplied prefix, root and complete-child readings", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.react; delete dictionary.reaction;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("re", "ˈkɛŋ");
    engine.addPronunciation("act", "ˈzɛŋ");
    engine.addPronunciation("action", "ˈbɛŋ");
    expect(engine.predict("react")).toBe("ˌkɛŋˈzɛŋ");
    expect(engine.predict("reaction")).toBe("ˌkɛŋˈbɛŋ");
    engine.addPronunciation("react", "ˈdɛŋ");
    expect(engine.predict("react")).toBe("ˈdɛŋ");
  });
});
it("preserves noun/adjective/verb context controls", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const [sentence, word, ipa] of [
    ["They react to the news.", "react", "ɹiˈækt"],
    ["The reaction was quick.", "reaction", "ɹiˈækʃən"],
    ["The reactive material is safe.", "reactive", "ɹiˈæktɪv"],
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
});
