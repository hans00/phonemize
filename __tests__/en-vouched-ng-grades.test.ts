import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("vouched ng grades, rules=%s", disableDict => {
  it("uses the independently attested opposite grade after target eviction", () => {
    for (const [word, ipa, witness, witnessIpa] of [
      ["younger", "ˈjʌŋɡɝ", "youngest", "ˈjʌŋɡəst"],
      ["youngest", "ˈjʌŋɡəst", "younger", "ˈjʌŋɡɝ"],
      ["longer", "ˈɫɔŋɡɝ", "longest", "ˈɫɔŋɡəst"],
      ["longest", "ˈɫɔŋɡəst", "longer", "ˈɫɔŋɡɝ"],
      ["stronger", "ˈstɹɔŋɡɝ", "strongest", "ˈstɹɔŋɡəst"],
      ["strongest", "ˈstɹɔŋɡəst", "stronger", "ˈstɹɔŋɝ"],
    ]) {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      engine.addPronunciation(witness, witnessIpa);
      expect(engine.predict(word)).toBe(ipa);
    }
  });
  it("preserves caller root phones and complete target overrides", () => {
    for (const [word, ending] of [["younger", "ɝ"], ["youngest", "əst"]]) {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      engine.addPronunciation(word === "younger" ? "youngest" : "younger", word === "younger" ? "ˈjʌŋɡəst" : "ˈjʌŋɡɝ");
      engine.addPronunciation("young", "ˈzɛt");
      expect(engine.predict(word)).toBe("ˈzɛt" + ending);
      engine.addPronunciation(word, "ˈkɛŋ");
      expect(engine.predict(word)).toBe("ˈkɛŋ");
    }
  });
  it("keeps agent nouns and bound nge spellings out of the grade class", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("singer")).toBe("ˈsɪŋɝ");
    for (const word of ["congest", "ingest", "strangest"]) expect(engine.predict(word)).toContain("dʒ");
  });
  it("keeps noun, adjective and finite verb sentence controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [["The younger reader is here.", "younger", "ˈjʌŋɡɝ"], ["The youngest reader is here.", "youngest", "ˈjʌŋɡəst"], ["The singer reads the book.", "singer", "ˈsɪŋɝ"]])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
    expect(api.phonemize("They congest the channel.", { language: "en-US", returnArray: true }).find(t => t.word === "congest")?.phoneme).toContain("dʒ");
  });
});
