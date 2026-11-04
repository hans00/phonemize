import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("-ivity composition preserves aligned root schwa", () => {
  const engine = new EnglishG2P({ disableDict: true });

  test("carries the weak nucleus through the sensitivity family", () => {
    expect(engine.predict("sensitive", "en-US")).toBe("ˈsɛnsətɪv");
    expect(engine.predict("sensitivity", "en-US")).toBe("ˌsɛnsəˈtɪvəti");
    expect(engine.predict("insensitivity", "en-US")).toBe("ˌɪnsɛnsəˈtɪvəti");
    expect(engine.predict("oversensitivity", "en-US")).toBe("ˌoʊvɝsɛnsəˈtɪvəti");
  });

  test("keeps lexical-base, stressed-vowel, and unrelated -ivity controls", () => {
    expect(engine.predict("hypersensitivity", "en-US")).toBe("ˌhaɪpɝsɛnsɪˈtɪvəti");
    expect(engine.predict("connectivity", "en-US")).toBe("ˌkɑnɛkˈtɪvəti");
    expect(engine.predict("productivity", "en-US")).toBe("ˌpɹɑdəkˈtɪvəti");
    expect(engine.predict("activity", "en-US")).toBe("ækˈtɪvəti");
  });

  test("keeps the corrected noun reading in full sentence contexts", () => {
    const api = createPhonemizer({ processors: [engine] });
    const cases = [
      ["Sensitivity is essential.", "sensitivity", "ˌsɛnsəˈtɪvəti"],
      ["The sensor’s sensitivity is high.", "sensitivity", "ˌsɛnsəˈtɪvəti"],
      ["They described oversensitivity and insensitivity.", "oversensitivity", "ˌoʊvɝsɛnsəˈtɪvəti"],
      ["They described oversensitivity and insensitivity.", "insensitivity", "ˌɪnsɛnsəˈtɪvəti"],
    ] as const;

    for (const [sentence, target, expected] of cases) {
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(tokens.find(token => token.word.toLowerCase() === target)?.phoneme).toBe(expected);
    }
  });
});
