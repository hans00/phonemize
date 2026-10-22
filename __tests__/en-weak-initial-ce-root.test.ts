import { EnglishG2P } from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("weak initial ce- in the celebr- family", () => {
  const g2p = new EnglishG2P({ disableDict: true });

  it.each([
    ["celebrity", "səˈɫɛbɹəti"],
    ["celebratory", "səˈɫɛbɹəˌtɔɹi"],
  ])("reduces the unstressed initial ce- in %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["celebrate", "ˈsɛɫəˌbɹeɪt"],
    ["celebrant", "ˈsɛɫəbɹənt"],
    ["celebrated", "ˈsɛɫəˌbɹeɪtɪd"],
    ["celebrating", "ˈsɛɫəˌbɹeɪtɪŋ"],
    ["celebrities", "səˈɫɛbɹɪtiz"],
    ["celestial", "sɪˈɫɛstiəɫ"],
    ["celibate", "ˈsɛɫɪˌbeɪt"],
    ["celery", "ˈsɛɫɝi"],
  ])("preserves the neighboring stress or vowel frame in %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it("preserves the target and its stressed controls in a sentence", () => {
    const api = createPhonemizer({ processors: [g2p] });
    const tokens = api.phonemize("A celebrity celebrated a celestial event.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "celebrity")?.phoneme).toBe("səˈɫɛbɹəti");
    expect(tokens.find(token => token.word === "celebrated")?.phoneme).toBe("ˈsɛɫəˌbɹeɪtɪd");
    expect(tokens.find(token => token.word === "celestial")?.phoneme).toBe("sɪˈɫɛstiəɫ");
  });
});
