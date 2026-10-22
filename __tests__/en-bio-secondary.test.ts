import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("secondary-stressed bio- retains its combining vowel", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/biomaterial
    ["biomaterial", "ˌbaɪoʊməˈtɪɹiəɫ"],
    // Cambridge US: https://dictionary.cambridge.org/us/pronunciation/english/biodiversity
    ["biodiversity", "ˌbaɪoʊdɪˈvɝsəti"],
    ["biochemistry", "ˈbaɪoʊtʃəmɪstɹi"],
  ])("keeps the combining vowel in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["biology", "ˌbaɪˈɑɫədʒi"],
    ["biography", "baɪˈɑɡɹəfi"],
    ["biological", "baɪəˈɫɑdʒɪkəɫ"],
    ["biomedical", "baɪəˈmɛdɪkəɫ"],
    ["biopic", "baɪˈɑpɪk"],
  ])("preserves the separate vowel pattern in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("keeps secondary bio- vowels in sentence context", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize(
      "The biomaterial protects biodiversity while biology studies living systems.",
      { language: "en-US", returnArray: true },
    );
    expect(tokens.find(token => token.word === "biomaterial")?.phoneme).toBe("ˌbaɪoʊməˈtɪɹiəɫ");
    expect(tokens.find(token => token.word === "biodiversity")?.phoneme).toBe("ˌbaɪoʊdɪˈvɝsəti");
    expect(tokens.find(token => token.word === "biology")?.phoneme).toBe("ˌbaɪˈɑɫədʒi");
  });
});
