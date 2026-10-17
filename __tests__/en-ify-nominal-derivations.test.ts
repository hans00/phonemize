import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("ify nominal root ownership, rules=%s", disableDict => {
  it("recovers actual verb roots after nominal eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["modification", "notification", "qualification", "clarification", "verification"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [
      ["modification", "ˌmɑdəfəˈkeɪʃən"], ["notification", "ˌnoʊtəfəˈkeɪʃən"],
      ["qualification", "ˌkwɑɫəfəˈkeɪʃən"], ["clarification", "ˌkɫɛɹəfəˈkeɪʃən"],
      ["verification", "ˌvɛɹəfəˈkeɪʃən"],
    ]) expect(engine.predict(word)).toBe(ipa);
    expect(["ˌkɑdəfəˈkeɪʃən", "ˌkoʊdəfəˈkeɪʃən"]).toContain(engine.predict("codification"));
  });
  it("keeps caller-owned root phones and full-word precedence", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.modification;
    Reflect.set(engine, "dictionary", dictionary);
    engine.addPronunciation("modify", "ˈzɛŋəˌfaɪ");
    expect(engine.predict("modification")).toBe("ˌzɛŋəfəˈkeɪʃən");
    engine.addPronunciation("modification", "ˈkɛŋ");
    expect(engine.predict("modification")).toBe("ˈkɛŋ");
  });
  it("preserves noun, adjective and verb context", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ["The modification is clear.", "modification", "ˌmɑdəfəˈkeɪʃən"],
      ["They modify the design.", "modify", "ˈmɑdəˌfaɪ"],
      ["They qualify for the final.", "qualify", "ˈkwɑɫəˌfaɪ"],
      ["The qualified teacher is here.", "qualified", "ˈkwɑɫəˌfaɪd"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
