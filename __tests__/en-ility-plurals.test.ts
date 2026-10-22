import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("-ility plural stems", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["disabilities", "ˌdɪsəˈbɪɫətiz"],
    ["facilities", "fəˈsɪɫətiz"],
    ["liabilities", "ˌɫaɪəˈbɪɫətiz"],
    // Cambridge US gives schwa in the corresponding singular suffix too.
    ["vulnerabilities", "ˌvʌɫnɝəˈbɪɫətiz"],
  ])("preserves the weak vowel of the rule-derived stem in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["abilities", "əˈbɪɫətiz"],
    ["capabilities", "ˌkeɪpəˈbɪɫətiz"],
    ["instabilities", "ˌɪnstəˈbɪɫɪtiz"],
    ["sensibilities", "ˌsɛnsɪˈbɪɫɪtiz"],
  ])("preserves neighboring stem patterns for %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the corrected plural readings in sentence context", () => {
    const phonemizer = createPhonemizer({ processors: [rules] });
    const tokens = phonemizer.phonemize(
      "Facilities improved; disabilities and liabilities affect those facilities.",
      { language: "en-US", returnArray: true },
    );
    expect(tokens.filter(token => ["Facilities", "facilities"].includes(token.word)).map(token => token.phoneme))
      .toEqual(["fəˈsɪɫətiz", "fəˈsɪɫətiz"]);
    expect(tokens.find(token => token.word === "disabilities")?.phoneme).toBe("ˌdɪsəˈbɪɫətiz");
    expect(tokens.find(token => token.word === "liabilities")?.phoneme).toBe("ˌɫaɪəˈbɪɫətiz");
    expect(tokens.find(token => token.word === "improved")?.phoneme).toBe("ˌɪmˈpɹuvd");
  });
});
