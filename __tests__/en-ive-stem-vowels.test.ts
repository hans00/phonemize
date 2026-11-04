import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("-ivity retains a corresponding full vowel from the adjective without overriding reductions", () => {
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(g.predict("festivity", "en-US", pos)).toMatch(/^fɛ/);
      expect(g.predict("relativity", "en-US", pos)).toMatch(/ɹɛ/);
      expect(g.predict("nativity", "en-US", pos)).toMatch(/^nə/);
      expect(g.predict("passivity", "en-US", pos)).toMatch(/^pə/);
    }
    expect(g.predict("festive")).toBe("ˈfɛstɪv");
    expect(g.predict("relative")).toBe("ˈɹɛɫətɪv");
    expect(g.predict("festivities")).toMatch(/^fɛ/);
    const p = createPhonemizer({ processors: [g] });
    for (const language of ["en-US", "en-GB"]) {
      const tokens = p.phonemize("Festivity and relativity invite festive and relative discussion.", { language, returnArray: true });
      expect(tokens.find(t => t.word === "Festivity")?.phoneme).toMatch(/^fɛ/);
      expect(tokens.find(t => t.word === "relativity")?.phoneme).toMatch(/ɹɛ/);
      expect(tokens.find(t => t.word === "festive")?.phoneme).toMatch(/fɛ/);
      expect(tokens.find(t => t.word === "relative")?.phoneme).toMatch(/ɹɛ/);
    }
  }
});

test("the adjective's caller-supplied vowel propagates through the aligned noun and plural", () => {
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    g.addPronunciation("festive", "ˈfɑstɪv");
    expect(g.predict("festivity")).toBe("fɑˈstɪvəti");
    expect(g.predict("festivities")).toBe("fɑˈstɪvətiz");
  }
});
