import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Strong prefix and agent roots (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });
  const phones = (word: string) => engine.predict(word, "en-US")!.replace(/[ˈˌ]/g, "");

  it.each([
    ["enhance", "ɛnˈhæns"], ["enrage", "ɛnˈɹeɪdʒ"],
    ["encase", "ɛnˈkeɪs"], ["restage", "ɹiˈsteɪdʒ"],
  ])("keeps root stress in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  it.each(["enhances", "enhancing", "enhancement", "enhancer"])(
    "preserves the checked root in %s", word => expect(phones(word)).toContain("hæns"),
  );
  it.each(["enrages", "enraged", "enraging"])(
    "preserves FACE before suffixes in %s", word => expect(phones(word)).toContain("ɹeɪdʒ"),
  );

  it.each([
    ["engine", "ˈɛndʒən"], ["average", "ˈævɝɪdʒ"],
    ["leverage", "ˈɫɛvɝɪdʒ"], ["garbage", "ˈɡɑɹbɪdʒ"],
  ])("preserves the unrelated noun %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  it.each(["reader", "readers", "readerless", "rereader"])(
    "takes the present verb root in %s", word => expect(phones(word)).toContain("ɹid"),
  );
  it.each([
    ["header", "hɛdɝ"], ["spreader", "spɹɛdɝ"],
    ["leader", "ɫidɝ"], ["closer", "kɫoʊsɝ"],
  ])("preserves neighboring agent/comparative %s", (word, ipa) => {
    expect(phones(word)).toBe(ipa);
  });

  it.each([
    ["They enhance the image.", "enhance", "ɛnˈhæns"],
    ["The new reader arrived.", "reader", "ˈɹidɝ"],
  ])("preserves the reading in %s", (sentence, word, ipa) => {
    const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word.toLowerCase() === word)!;
    expect(target.phoneme).toBe(ipa);
  });
});

describe("Unchanged default read controls", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
  it.each([
    ["She read books every day.", "ɹid"],
    ["They have read the book.", "ɹɛd"],
  ])("preserves %s", (sentence, ipa) => {
    expect(phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === "read")!.phoneme).toBe(ipa);
  });
});
