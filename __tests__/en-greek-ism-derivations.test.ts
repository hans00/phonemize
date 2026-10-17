import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// This class owns sm voicing; existing stress-placement errors are separate.
describe("Greek ism before vocalic derivations", () => {
  test.each([false, true])(
    "preserves the root after lexical eviction (rules=%s)",
    (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      const dictionary = { ...Reflect.get(engine, "dictionary") };
      for (const word of [
        "charisma",
        "charismatic",
        "prismatic",
        "organismic",
        "blepharisma",
      ])
        delete dictionary[word];
      Reflect.set(engine, "dictionary", dictionary);
      for (const word of [
        "charisma",
        "charismas",
        "charisma's",
        "noncharisma",
        "charismatic",
        "charismatically",
        "noncharismatic",
        "prismatic",
        "nonprismatic",
        "organismic",
        "nonorganismic",
      ]) {
        expect(engine.predict(word)).toMatch(/ɪ[ˈˌ]?z[ˈˌ]?m/);
        expect(engine.predict(word)).not.toMatch(/ɪ[ˈˌ]?sm/);
      }
      expect(engine.predict("charisma")).toBe("kɝˈɪzmə");
      expect(engine.predict("prismatic")).toBe("pɹɪzˈmætɪk");
      expect(engine.predict("charismatic")?.replace(/ˌ/g, "")).toBe(
        "kɛɹɪzˈmætɪk",
      );
    },
  );
  test.each([false, true])(
    "preserves unrelated boundaries (rules=%s)",
    (disableDict) => {
      const engine = new EnglishG2P({ disableDict });
      expect(engine.predict("talisman")).toBe("ˈtæɫɪsmən");
      for (const word of [
        "antismoking",
        "dismay",
        "heisman",
        "chrisman",
        "naismith",
      ])
        expect(engine.predict(word)).not.toMatch(/ɪ[ˈˌ]?z[ˈˌ]?m/);
      const api = createPhonemizer({ processors: [engine] });
      expect(
        api
          .phonemize(
            "The charisma of the present speaker attracts attention.",
            { language: "en-US", returnArray: true },
          )
          .find((t) => t.word === "charisma")?.phoneme,
      ).toBe("kɝˈɪzmə");
      if (!disableDict)
        for (const [sentence, word, ipa] of [
          ["The present moment matters.", "present", "ˈpɹɛzənt"],
          ["They present the award.", "present", "pɹɪˈzɛnt"],
          ["The record was clear.", "record", "ˈɹɛkɝd"],
        ])
          expect(
            api
              .phonemize(sentence, { language: "en-US", returnArray: true })
              .find((t) => t.word === word)?.phoneme,
          ).toBe(ipa);
    },
  );
  test("preserves custom target ownership", () => {
    const engine = new EnglishG2P();
    engine.addPronunciation("charisma", "ˈzɛmp");
    expect(engine.predict("charisma")).toBe("ˈzɛmp");
  });
});
