import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Weak -el before British l-doubling (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });

  it.each(["model", "models", "modeled", "modeling", "modeler", "modelled", "modelling", "modeller", "modellers"])(
    "preserves the complete root in %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/^ˈmɑdəˌ?[ɫl]/);
    },
  );

  it.each([
    ["labelled", /^ˈ[ɫl]eɪbə[ɫl]d$/],
    ["levelled", /^ˈ[ɫl]ɛvə[ɫl]d$/],
    ["gavelled", /^ˈɡævə[ɫl]d$/],
    ["gaveller", /^ˈɡævə[ɫl]ɝ$/],
  ] as const)("retains the weak nucleus and root stress in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toMatch(ipa);
  });

  it.each(["repelled", "repelling", "expelled", "expelling"])(
    "keeps a stressed -pel root outside the weak frame: %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/ˈpɛ[ɫl]/);
    },
  );

  it.each(["bookseller", "bestseller", "bestselling"])(
    "keeps the full vowel in a closed compound root: %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/sɛ[ɫl]/);
    },
  );

  it.each([
    ["They modelled the bridge.", "modelled"],
    ["The modelled bridge is ready.", "modelled"],
    ["He is a modeller.", "modeller"],
    ["The model is ready.", "model"],
  ])("preserves the noun/adjective/verb root in %s", (sentence, word) => {
    const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)!;
    expect(target.phoneme).toMatch(/^ˈmɑdəˌ?[ɫl]/);
  });
});
