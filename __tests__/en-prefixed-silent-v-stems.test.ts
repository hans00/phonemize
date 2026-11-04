import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("a verified prefixed silent-e stem composes across nominal and adjective suffixes", () => {
  const g = new EnglishG2P({ disableDict: true });
  for (const pos of [undefined, "N", "ADJ", "V"]) {
    expect(g.predict("removal", "en-US", pos)).toMatch(/ˈmuvəɫ$/);
    expect(g.predict("removable", "en-US", pos)).toMatch(/ˈmuvəbəɫ$/);
    expect(g.predict("immovable", "en-US", pos)).toMatch(/ɪˈmuvəbəɫ$/);
    expect(g.predict("inconceivable", "en-US", pos)).toMatch(/kənˈsivəbəɫ$/);
  }
  expect(g.predict("probable")).toBe("ˈpɹɑbəbəɫ");
  expect(g.predict("survival")).toBe("sɝˈvaɪvəɫ");
  expect(g.predict("unlivable")).toBe("ənˈɫɪvəbəɫ");
  const p = createPhonemizer({ processors: [g] });
  const tokens = p.phonemize("The removable panel requires removal before the immovable base is checked.", { language: "en-US", returnArray: true });
  for (const word of ["removable", "removal", "immovable"]) expect(tokens.find(t => t.word === word)?.phoneme).toMatch(/ˈmuv/);
});

test("a supplied lexical stem propagates through a prefixed out-of-dictionary derivative", () => {
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    g.addPronunciation("approve", "əˈtɛv");
    expect(g.predict("reapproval")).toBe("ɹiəˈtɛvəɫ");
    expect(g.predict("reapprovable")).toBe("ɹiəˈtɛvəbəɫ");
  }
});

test("ambiguous prefix analyses do not choose a caller stem arbitrarily", () => {
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    g.addPronunciation("move", "ˈmuv");
    g.addPronunciation("bmove", "ˈbɛv");
    for (const word of ["abmovable", "abmoval"]) {
      const result = g.predict(word);
      expect(result).not.toContain("muv");
      expect(result).not.toContain("bɛv");
    }
  }
});
