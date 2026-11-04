import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string | null) => {
  const { phones, primary } = parseIpa(ipa ?? "");
  return { phones, primary };
};
const phones = (ipa: string | null) => reading(ipa).phones;

describe.each([false, true])("dictionary-backed say paradigm (disableDict=%s)", disableDict => {
  const target = (sentence: string, word: string) => {
    const processor = new EnglishG2P({ disableDict });
    const tokens = createPhonemizer({ processors: [processor] }).phonemize(sentence, {
      language: "en-US", returnArray: true,
    });
    return tokens.find(token => token.word.toLowerCase() === word.toLowerCase())!.phoneme;
  };

  it("uses the irregular says and said forms in complete sentences", () => {
    expect(phones(target("She says the answer.", "says"))).toEqual(phones("ˈsɛz"));
    expect(phones(target("She said the answer.", "said"))).toEqual(phones("ˈsɛd"));
  });

  it("preserves the say stem and regular y-final controls", () => {
    const g2p = new EnglishG2P({ disableDict });
    expect(reading(g2p.predict("say", "en"))).toEqual(reading("ˈseɪ"));
    expect(reading(g2p.predict("saying", "en"))).toEqual(reading("ˈseɪɪŋ"));
    expect(reading(g2p.predict("plays", "en"))).toEqual(reading("ˈpleɪz"));
    expect(reading(g2p.predict("stays", "en"))).toEqual(reading("ˈsteɪz"));
  });
});
