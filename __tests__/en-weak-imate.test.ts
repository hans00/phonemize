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

  it("keeps the /aɪ/ vowel team in climate outside the reduction", () => {
    expect(g2p.predict("climate", "en-US")).toBe("ˈkɫaɪmeɪt");
  });
});
