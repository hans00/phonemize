import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Silent-e stems before diminutive -let (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });

  it.each([
    ["bracelet", "ˈbɹeɪsɫət"], ["platelet", "ˈpɫeɪtɫət"],
    ["platelets", "ˈpɫeɪtɫəts"], ["wavelet", "ˈweɪvɫət"],
    ["notelet", "ˈnoʊtɫət"], ["capelet", "ˈkeɪpɫət"], ["codelet", "ˈkoʊdɫət"],
  ])("retains the stem and weak suffix in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it("retains the stem through plural and possessive composition", () => {
    expect(engine.predict("bracelets")).toMatch(/^ˈbɹeɪsɫ[əɪ]ts$/);
    expect(engine.predict("wavelet's")).toBe("ˈweɪvɫəts");
  });

  it.each(["outlet", "inlet"])("retains the strong free-word rime in %s", word => {
    expect(engine.predict(word)).toMatch(/ɫɛt$/);
  });
  it.each(["violet", "wallet", "bullet", "toilet"])("does not invent a diminutive stem for %s", word => {
    expect(engine.trace(word).path).not.toBe("morphology");
  });

  it.each([
    ["The bracelet looks fine.", "bracelet", /^ˈbɹeɪsɫət$/],
    ["Wavelet filtering is useful.", "Wavelet", /^ˈweɪvɫət$/],
    ["The violet light faded.", "violet", /^ˈvaɪəɫ[əɪ]t$/],
    ["They let the water through the inlet.", "let", /^ɫɛt$/],
  ] as const)("preserves noun/adjective/verb readings in %s", (sentence, word, ipa) => {
    const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)!;
    expect(target.phoneme).toMatch(ipa);
  });
});
