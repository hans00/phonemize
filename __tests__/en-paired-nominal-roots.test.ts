import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// MW communism, atheism and egotism independently confirm these roots.
describe.each([false, true])("paired nominal roots, rules=%s", disableDict => {
  it("recovers independently vouched bound roots after target eviction", () => {
    for (const [word, ipa, witness, witnessIpa] of [
      ["communism", "ˈkɑmjəˌnɪzəm", "communist", "ˈkɑmjənɪst"],
      ["atheism", "ˈeɪθiˌɪzəm", "atheist", "ˈeɪθiɪst"],
      ["egotism", "ˈiɡəˌtɪzəm", "egotist", "ˈiɡətɪst"],
    ]) {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      engine.addPronunciation(witness, witnessIpa);
      expect(engine.predict(word)).toBe(ipa);
    }
  });
  it("handles a supplied new family while retaining root and target ownership", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("zembrianism", "ˈzɛmbɹiəˌnɪzəm");
    expect(engine.predict("zembrianist")).toBe("ˈzɛmbɹiənɪst");
    engine.addPronunciation("zembrian", "ˈzɛt");
    expect(engine.predict("zembrianist")).toBe("ˈzɛtɪst");
    engine.addPronunciation("zembrianist", "ˈkɛŋ");
    expect(engine.predict("zembrianist")).toBe("ˈkɛŋ");
  });
  it("preserves weak variants, free roots and accidental consonantal pairs", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["activism", "ˈæktɪˌvɪzəm"], ["capitalist", "ˈkæpətəɫɪst"],
      ["classicism", "ˈkɫæsɪˌsɪzəm"], ["feminism", "ˈfɛmɪˌnɪzəm"],
      ["jansenist", "ˈdʒænsənɪst"], ["schism", disableDict ? "ˈʃɪzəm" : "ˈskɪzəm"], ["schist", "ˈʃɪst"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps complete noun, adjective and verb contexts", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ["They discuss atheism.", "atheism", "ˈeɪθiˌɪzəm"],
      ["The communist teacher is here.", "communist", disableDict ? "ˈkɑmjənɪst" : "ˈkɑmjənəst"],
      ["They play the game.", "play", "pɫeɪ"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
