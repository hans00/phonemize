import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string) => {
  const { phones, primary } = parseIpa(ipa);
  return { phones, primary };
};

describe.each([false, true])("be/re boundary before w (disableDict=%s)", disableDict => {
  it.each([
    ["reward", "ɹiˈwɔɹd"], ["rewarding", "ɹiˈwɔɹdɪŋ"],
    ["reword", "ɹiˈwɝd"], ["rework", "ɹiˈwɝk"],
    ["beware", "bɪˈwɛɹ"], ["bewilder", "bɪˈwɪɫdɝ"],
    ["bewitch", "bɪˈwɪtʃ"],
  ])("preserves the onset after the prefix in %s", (word, ipa) => {
    expect(reading(new EnglishG2P({ disableDict }).predict(word)!)).toEqual(reading(ipa));
  });

  it.each([
    ["brew", "ˈbɹu"], ["grew", "ˈɡɹu"], ["screw", "ˈskɹu"],
    ["dewy", "ˈdui"], ["buyer", "ˈbaɪɝ"], ["night", "ˈnaɪt"],
    ["Lighthizer", "ˈɫaɪthaɪzɝ"],
  ])("keeps the neighboring digraph or morpheme in %s", (word, ipa) => {
    expect(reading(new EnglishG2P({ disableDict }).predict(word)!)).toEqual(reading(ipa));
  });

  it("retains noun, adjective and verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ["The reward was generous.", "reward", "ɹiˈwɔɹd"],
      ["The rewarding job matters.", "rewarding", "ɹiˈwɔɹdɪŋ"],
      ["They reward careful work.", "reward", "ɹiˈwɔɹd"],
      ["They can rewind the tape.", "rewind", "ɹiˈwaɪnd"],
    ]) {
      const target = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)!;
      expect(reading(target.phoneme)).toEqual(reading(ipa));
    }
    // Merriam-Webster attests both primary-stress placements for the noun.
    const noun = api.phonemize("The rewind button is broken.", { language: "en-US", returnArray: true }).find(t => t.word === "rewind")!;
    expect([reading("ˈɹiwaɪnd"), reading("ɹiˈwaɪnd")]).toContainEqual(reading(noun.phoneme));
  });
});

it("preserves the existing lexical surname readings after rebuilding", () => {
  const engine = new EnglishG2P();
  for (const [word, ipa] of [["Rewerts", "ˈɹuɝts"], ["Rewey", "ˈɹui"], ["Rewis", "ˈɹuɪs"]]) {
    expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
  }
});
