import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("vouched ish roots, rules=%s", disableDict => {
  it("retains complete roots and the suffix vowel after target eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["bluish", "boorish", "dovish", "feverish", "ghoulish", "moorish", "yellowish"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [
      ["bluish", "ˈbɫuɪʃ"], ["boorish", "ˈbʊɹɪʃ"], ["dovish", "ˈdʌvɪʃ"],
      ["feverish", "ˈfivɝɪʃ"], ["ghoulish", "ˈɡuɫɪʃ"], ["moorish", "ˈmʊɹɪʃ"], ["yellowish", "ˈjɛɫoʊɪʃ"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps lexicalized verbs and existing silent-e derivations", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["cherish", "ˈtʃɛɹɪʃ"], ["perish", "ˈpɛɹɪʃ"], ["refinish", "ɹiˈfɪnɪʃ"], ["finish", "ˈfɪnɪʃ"],
      ["banish", "ˈbænɪʃ"], ["fetish", "ˈfɛtɪʃ"], ["racist", "ˈɹeɪsɪst"], ["racism", "ˈɹeɪsɪzəm"],
      ["nudist", "ˈnudɪst"], ["nudism", "ˈnudɪzəm"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps caller root phones without front-suffix c/g softening", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [root, ipa] of [["civic", "ˈzɛk"], ["smog", "ˈzɛɡ"]]) {
      engine.addPronunciation(root, ipa);
      expect(engine.predict(root + "ish")).toBe(ipa + "ɪʃ");
    }
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.bluish;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("blue", "ˈzɛŋ");
    expect(engine.predict("bluish")).toBe("ˈzɛŋɪʃ");
    engine.addPronunciation("bluish", "ˈkɛŋ");
    expect(engine.predict("bluish")).toBe("ˈkɛŋ");
  });
  it("preserves noun, adjective and verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ...(!disableDict ? [["The dove is here.", "dove", "dʌv"], ["They dove into the water.", "dove", "doʊv"]] : []),
      ["The fish is here.", "fish", "fɪʃ"], ["The dovish reader is here.", "dovish", "ˈdʌvɪʃ"],
      ["They cherish the child.", "cherish", "ˈtʃɛɹɪʃ"], ["They finish the task.", "finish", "ˈfɪnɪʃ"],
      ["The feverish reader read yesterday.", "read", "ɹɛd"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
