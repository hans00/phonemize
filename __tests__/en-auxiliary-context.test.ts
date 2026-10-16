import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string) => {
  const { phones, primary } = parseIpa(ipa);
  return { phones, primary };
};

describe("auxiliary frames with negation, adverbs and quotation", () => {
  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  it.each([
    ["John won't permit it.", "permit", "pɝˈmɪt"],
    ["The guard can’t permit it.", "permit", "pɝˈmɪt"],
    ["John cannot read.", "read", "ɹid"],
    ["She shouldn't read yesterday's notes.", "read", "ɹid"],
    ["She wouldn't read last week.", "read", "ɹid"],
    ["I couldn’t “read” the label yesterday.", "read", "ɹid"],
    ["The form you can’t record is new.", "record", "ɹɪˈkɔɹd"],
    ["They should rather invite people.", "invite", "ɪnˈvaɪt"],
    ["He would later read.", "read", "ɹid"],
    ["The guard could readily permit it.", "permit", "pɝˈmɪt"],
    ["Would he gladly present a record?", "present", "pɹɪˈzɛnt"],
    ["The “can’t” record was deleted.", "record", "ˈɹɛkɝd"],
    ['The "cannot" record was missing.', "record", "ˈɹɛkɝd"],
    ["She isn't present today.", "present", "ˈpɹɛzənt"],
    ["He hasn't read the label.", "read", "ɹɛd"],
    ["Her choices reflect free will broadly present across cultures.", "present", "ˈpɹɛzənt"],
    ["We refer to readily present evidence.", "present", "ˈpɹɛzənt"],
    ["I would rather he quickly read.", "read", "ɹɛd"],
    ["I read that book yesterday.", "read", "ɹɛd"],
    ["I read books every day.", "read", "ɹid"],
  ])("selects the contextual reading in %s", (sentence, word, ipa) => {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(reading(tokens.find(token => token.word === word)!.phoneme)).toEqual(reading(ipa));
  });

  it.each(["'", "‘", "’"])("accepts negation apostrophe %s", apostrophe => {
    const tokens = api.phonemize(`John shouldn${apostrophe}t read yesterday's notes.`, {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "read")!.phoneme).toBe("ɹid");
  });

  it("preserves explicit custom pronunciation before contextual inference", () => {
    const custom = new EnglishG2P();
    custom.addPronunciation("read", "ˈɹaɪd");
    const instance = createPhonemizer({ processors: [custom] });
    expect(instance.toIPA("I cannot read yesterday's notes.", "en-US")).toContain("ɹaɪd");
  });

  it("passes original punctuation and independent sentence streams to the tagger", () => {
    const processor = new EnglishG2P();
    const spy = jest.spyOn(processor, "tagWord");
    const instance = createPhonemizer({ processors: [processor] });
    instance.phonemize("The “can’t” record was deleted. She can record it.", {
      language: "en-US", returnArray: true,
    });
    const contexts = spy.mock.calls.filter(([word]) => word === "record").map(([, context]) => context!);
    expect(contexts[0].prev).toBe("can’t");
    expect(contexts[0].next).toBe("was");
    expect(contexts[0].sentence!.words).toEqual(["The", "“", "can’t", "”", "record", "was", "deleted", "."]);
    expect(contexts[0].sentence!.index).toBe(4);
    expect(contexts[1].sentence!.words).toEqual(["She", "can", "record", "it", "."]);
    expect(contexts[1].sentence!.index).toBe(2);
  });
});
