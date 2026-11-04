import EnglishG2P from "../src/en/g2p";

describe("weak /ɪ/ before final -mate", () => {
  const g2p = new EnglishG2P({ disableDict: true });

  it.each([
    ["animate", "ˈænəˌmeɪt"],
    ["animated", "ˈænəˌmeɪtɪd"],
    ["animating", "ˈænəˌmeɪtɪŋ"],
    ["estimate", "ˈɛstəˌmeɪt"],
    ["estimating", "ˈɛstəˌmeɪtɪŋ"],
    ["inanimate", "ɪˈnænəˌmeɪt"],
    ["intimation", "ˌɪntəˈmeɪʃən"],
  ])("reduces the weak vowel in %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it("uses the sourced climate root without generalizing -ate reduction", () => {
    expect(g2p.predict("climate", "en-US")).toBe("ˈkɫaɪmət");
    expect(g2p.predict("private", "en-US")).toBe("ˈpɹaɪvət");
    expect(g2p.predict("evaluate", "en-US")).toBe("ɪˈvæɫjuˌeɪt");
  });

  it("uses the independently verified US citation form in the shipped dictionary", () => {
    expect(new EnglishG2P().predict("climate", "en-US")).toBe("ˈkɫaɪmət");
  });
});
