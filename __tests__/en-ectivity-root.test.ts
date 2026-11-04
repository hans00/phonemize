import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("-ect roots retain DRESS before -ivity without changing neighboring suffixes", () => {
  const g = new EnglishG2P({ disableDict: true });
  for (const word of ["connectivity", "objectivity", "selectivity", "subjectivity", "collectivity", "affectivity", "electivity"]) {
    for (const pos of [undefined, "N", "ADJ", "V"]) expect(g.predict(word, "en-US", pos)).toMatch(/ɛk[ˈˌ]?tɪv/);
  }
  expect(g.predict("connect")).toBe("kəˈnɛkt");
  expect(g.predict("connective")).toBe("kəˈnɛktɪv");
  expect(g.predict("activity")).toBe("ækˈtɪvəti");
  expect(g.predict("productivity")).toBe("ˌpɹɑdəkˈtɪvəti");
  for (const word of ["connectivities", "selectivities", "collectivities"]) expect(g.predict(word)).toMatch(/ɛk[ˈˌ]?tɪv/);
  for (const disableDict of [false, true]) {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("collectivity", "ˈtʊɡ");
    expect(custom.predict("collectivity")).toBe("ˈtʊɡ");
    expect(custom.predict("collectivities")).toBe("ˈtʊɡz");
  }
  const p = createPhonemizer({ processors: [g] });
  for (const language of ["en-US", "en-GB"]) {
    const sentence = "Objectivity and connectivity improve selectivity.";
    for (const word of ["Objectivity", "connectivity", "selectivity"]) {
      expect(p.phonemize(sentence, { language, returnArray: true }).find(t => t.word === word)?.phoneme).toMatch(/ɛk[ˈˌ]?tɪv/);
    }
  }
});
