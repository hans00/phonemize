import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

it("keeps tense and subject context across written re prefixes", () => {
  for (const known of [false, true]) {
    const engine = new EnglishG2P();
    const tag = engine.tagWord.bind(engine);
    if (known) engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : tag(word, context);
    const api = createPhonemizer({ processors: [engine] });
    for (const [sentence, word, ipa] of [
      ["He re-read the book.", "read", "ɹɛd"],
      ["They re-read the book every week.", "read", "ɹid"],
      ["He will re-read the book.", "read", "ɹid"],
      ["They have re-read the book.", "read", "ɹɛd"],
      ["He re-re-read the book.", "read", "ɹɛd"],
      ["They re-record the music.", "record", "ɹɪˈkɔɹd"],
      ["The re-record is clear.", "record", "ˈɹɛkɝd"],
      ["The guide refers to re-use of equipment.", "use", "jus"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  }
});
it("distinguishes quoted nominal passives from active reading and quoted target words", () => {
  for (const known of [false, true]) {
    const engine = new EnglishG2P();
    const tag = engine.tagWord.bind(engine);
    if (known) engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : tag(word, context);
    const api = createPhonemizer({ processors: [engine] });
    for (const [sentence, ipa] of [
      ['The recording features "A Christmas Carol" read by Wolfgang.', "ɹɛd"],
      ["They read by John.", "ɹid"],
      ['They read "A Christmas Carol" by candlelight.', "ɹid"],
      ['They "read" by John.', "ɹid"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe(ipa);
  }
});
