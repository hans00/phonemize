import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Compound final y and adverb -ly (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });

  it.each(["butterfly", "firefly", "dragonfly", "housefly", "horsefly", "gadfly", "overfly", "oversupply"])(
    "retains the complete compound tail in %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/aɪ$/);
    },
  );

  it.each(["butterflies", "fireflies", "dragonflies", "houseflies", "horseflies"])(
    "retains the tail through plural y-restoration in %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/aɪz$/);
    },
  );

  it.each(["moonfly", "cloudfly", "bookfly"])(
    "composes a novel word from existing verified parts: %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/f[ɫl]aɪ$/);
    },
  );

  it.each(["deeply", "simply", "safely", "freely", "probably", "invariably", "multifamily", "otherworldly"])(
    "keeps the ordinary final vowel in %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/i$/);
    },
  );

  it.each([
    ["The butterfly can fly.", "butterfly", /f[ɫl]aɪ$/],
    ["They overfly the field.", "overfly", /f[ɫl]aɪ$/],
    ["They simply fly home.", "fly", /^f[ɫl]aɪ$/],
    ["The simple plan works.", "simple", /^sɪmpə[ɫl]$/],
    ["Her family simply smiled.", "family", /^fæmə[ɫl]i$/],
    ["She simply smiled deeply.", "simply", /^sɪmp[ɫl]i$/],
    ["She simply smiled deeply.", "deeply", /^dip[ɫl]i$/],
  ] as const)("preserves the boundary in %s (%s)", (sentence, word, phones) => {
    const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)!;
    expect(target.phoneme.replace(/[ˈˌ]/g, "")).toMatch(phones);
  });
});
