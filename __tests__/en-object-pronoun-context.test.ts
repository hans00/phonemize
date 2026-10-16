import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("Object pronouns after transitive verbs", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
  const target = (sentence: string, word: string) => phonemizer.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word.toLowerCase() === word)!.phoneme;

  it.each([
    ["Friends invite them along.", "invite", "ɪnˈvaɪt"],
    ["Officials permit them to enter.", "permit", "pɝˈmɪt"],
    ["Please record him speaking.", "record", "ɹɪˈkɔɹd"],
  ])("reads the verb in %s", (sentence, word, ipa) => {
    expect(target(sentence, word)).toContain(ipa);
  });

  it.each([
    ["The invite itself was unexpected.", "invite", "ˈɪnvaɪt"],
    ["The permit itself was valid.", "permit", "ˈpɝmɪt"],
    ["Keep a record of them.", "record", "ˈɹɛkɝd"],
    ["Record US sales rose.", "record", "ˈɹɛkɝd"],
    ["The organ console itself was moved.", "console", "ˈkɑnsoʊɫ"],
    ["The invalid himself declined.", "invalid", "ˈɪnvəɫəd"],
    ["The result was invalid.", "invalid", "ɪnˈvæɫəd"],
    ["A learned scholar arrived.", "learned", "ˈɫɝnɪd"],
  ])("preserves the noun/adjective in %s", (sentence, word, ipa) => {
    expect(target(sentence, word)).toContain(ipa);
  });
});
