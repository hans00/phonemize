import EnglishG2P from "../src/en/g2p";
import { applyPhonotactics } from "../src/en/phonotactics";
import { createPhonemizer } from "../src/core";

test("a final -ere after an s-obstruent cluster retains its rhotic vowel", () => {
  expect(applyPhonotactics("ˈætməsfɪɹ", "atmosphere")).toBe("ˈætməsfɪɹ");
  expect(applyPhonotactics("ˈɔstɪɹ", "austere")).toBe("ˈɔstɪɹ");
  expect(applyPhonotactics("ˈbaɪoʊsfɪɹz", "biosphere's")).toBe("ˈbaɪoʊsfɪɹz");
  expect(applyPhonotactics("ˈmæstɪɹ", "master")).toBe("ˈmæstɝ");
  expect(applyPhonotactics("ˈɫæmfɪɹ", "lamphere")).toBe("ˈɫæmfɝ");
});

test.each([false, true])( "compound root and nearby rime controls, disableDict=%s", disableDict => {
  const g = new EnglishG2P({ disableDict });
  for (const pos of [undefined, "N", "ADJ", "V"]) {
    expect(g.predict("atmosphere", "en-US", pos)).toMatch(/s[ˌ]?fɪɹ$/);
    expect(g.predict("biosphere", "en-US", pos)).toMatch(/s[ˌ]?fɪɹ$/);
    expect(g.predict("austere", "en-US", pos)).toMatch(/stɪɹ$/);
    expect(g.predict("master", "en-US", pos)).toBe("ˈmæstɝ");
    for (const word of ["atmospheres", "atmosphere's", "biospheres", "biosphere's", "stratospheres", "stratosphere's", "telespheres", "telesphere's"])
      expect(g.predict(word, "en-US", pos)).toMatch(/s?fɪɹz$/);
  }
  expect(g.predict("astrosphere", "en-US")).toMatch(/s[ˌ]?fɪɹ$/);
  expect(g.predict("astrospheres", "en-US")).toMatch(/s[ˌ]?fɪɹz$/);
  expect(g.predict("masteres", "en-US")).toBe("ˈmæstɝz");
  expect(g.predict("transferes", "en-US")).toBe("ˈtɹænsfɝz");
  const p = createPhonemizer({ processors: [g] });
  const tokens = p.phonemize("The atmosphere surrounds the biosphere, and the master is austere.", { language: "en-US", returnArray: true });
  for (const word of ["atmosphere", "biosphere"]) expect(tokens.find(t => t.word === word)?.phoneme).toMatch(/s[ˌ]?fɪɹ$/);
  expect(tokens.find(t => t.word === "master")?.phoneme).toBe("ˈmæstɝ");
  expect(tokens.find(t => t.word === "austere")?.phoneme).toMatch(/stɪɹ$/);
});
