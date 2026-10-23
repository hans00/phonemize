import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("stressed monosyllabic -son/-ton rimes", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["son", "ˈsʌn"],
    ["ton", "ˈtʌn"],
  ])("uses STRUT in the stressed standalone %s rime", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it.each([
    ["proton", "pɹəˈtɑn"],
    ["exton", "ɪksˈtɑn"],
    ["tonic", "ˈtɑnɪk"],
    ["tonight", "təˈnaɪt"],
    ["person", "ˈpɝsən"],
    ["lesson", "ˈɫɛsən"],
    ["John", "ˈdʒɑn"],
    ["con", "ˈkɑn"],
    ["don", "ˈdɑn"],
  ])("preserves the neighboring %s environment", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it("keeps the rule readings in sentence context", () => {
    const phonemizer = createPhonemizer({ processors: [rules] });
    const tokens = phonemizer.phonemize("Her son weighed a ton tonight.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.find((token) => token.word === "son")?.phoneme).toBe("sʌn");
    expect(tokens.find((token) => token.word === "ton")?.phoneme).toBe("tʌn");
    expect(tokens.find((token) => token.word === "tonight")?.phoneme).toBe("təˈnaɪt");
  });
});
