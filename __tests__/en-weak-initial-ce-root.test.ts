import { EnglishG2P } from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

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

    const tokens = englishTokens(g2p, "A celebrity celebrated a celestial event.");
    expect(tokens.find(token => token.word === "celebrity")?.phoneme).toBe("səˈɫɛbɹəti");
    expect(tokens.find(token => token.word === "celebrated")?.phoneme).toBe("ˈsɛɫəˌbɹeɪtɪd");
    expect(tokens.find(token => token.word === "celestial")?.phoneme).toBe("sɪˈɫɛstiəɫ");
  });
});
