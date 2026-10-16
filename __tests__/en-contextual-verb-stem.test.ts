import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string) => {
  const { phones, primary } = parseIpa(ipa);
  return { phones, primary };
};

describe.each([false, true])("contextual verb stems before silent-e restoration (disableDict=%s)", disableDict => {
  const target = (sentence: string, word: string, custom?: string) => {
    const processor = new EnglishG2P({ disableDict });
    if (custom) processor.addPronunciation(word, custom);
    const tokens = createPhonemizer({ processors: [processor] }).phonemize(sentence, {
      language: "en-US", returnArray: true,
    });
    return tokens.find(token => token.word === word)!.phoneme;
  };

  it.each([
    "She is reading the book.",
    "She enjoys reading books.",
  ])("uses the vouched verb stem in %s", sentence => {
    expect(reading(target(sentence, "reading"))).toEqual(reading("ˈɹidɪŋ"));
  });

  it.each([
    "The reading public responded.",
    "They teach the fundamentals of reading.",
    "They study mathematics and excel in reading.",
  ])("retains the verb stem when the ing form is nominal in %s", sentence => {
    expect(reading(target(sentence, "reading"))).toEqual(reading("ˈɹidɪŋ"));
  });

  it("keeps citation and plural ing forms consistent", () => {
    expect(reading(target("reading", "reading"))).toEqual(reading("ˈɹidɪŋ"));
    expect(reading(target("readings", "readings"))).toEqual(reading("ˈɹidɪŋz"));
  });

  it("preserves a capitalized geographical reading", () => {
    expect(reading(target("They stopped in Reading yesterday.", "Reading"))).toEqual(reading("ˈɹɛdɪŋ"));
  });

  it("preserves a direct caller pronunciation", () => {
    expect(reading(target("She is reading the book.", "reading", "ˈzɛŋ"))).toEqual(reading("ˈzɛŋ"));
  });
});
