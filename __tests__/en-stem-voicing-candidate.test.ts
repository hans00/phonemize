import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

test.each([false, true])( "a voiced stem keeps its consonant in derivatives and neighbors stay unchanged, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  for (const pos of ["N", "ADJ", "V", undefined]) {
    expect(engine.predict("possession", "en", pos)).toBe("pəˈzɛʃən");
    expect(engine.predict("possessive", "en", pos)).toBe("pəˈzɛsɪv");
    expect(engine.predict("repossession", "en", pos)).toBe("ˌɹipəˈzɛʃən");
    expect(engine.predict("procession", "en", pos)).toBe("pɹəˈsɛʃən");
    expect(engine.predict("confession", "en", pos)).toBe("kənˈfɛʃən");
  }

  const tokens = englishTokens(engine, "The possession is hers; the procession will proceed.");
  expect(tokens.find(t => t.word.toLowerCase() === "possession")?.phoneme).toBe("pəˈzɛʃən");
  expect(tokens.find(t => t.word.toLowerCase() === "procession")?.phoneme).toBe("pɹəˈsɛʃən");
});

test("silent-e fake stems do not override whole-word rules", () => {
  const engine = new EnglishG2P({ disableDict: true });
  expect(engine.predict("diseaseive", "en")).toBe("ˌdɪsiˈseɪv");
  expect(engine.predict("diseaseion", "en")).toBe("dɪˈsiseiən");
});

test("a caller-supplied stem takes priority in rules-only pronunciation", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("possess", "pəˈsɛs");
  expect(engine.predict("possession", "en")).toBe("pəˈsɛʃən");
  engine.addPronunciation("possess", "pəˈzɛs");
  expect(engine.predict("possession", "en")).toBe("pəˈzɛʃən");
  engine.addPronunciation("susan", "ˈsuzən");
  expect(engine.predict("susanor", "en")).toBe("ˈsuzənɝ");
  engine.addPronunciation("susan", "ˈsusən");
  expect(engine.predict("susanor", "en")).toBe("ˈsusənɝ");
});
