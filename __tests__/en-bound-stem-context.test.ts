import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("bound stem context (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each([
    ["beneficial", /ˈfɪ/], ["commercial", /ˈmɝ/],
    ["essential", /ˈsɛn/], ["official", /ˈfɪ/], ["potential", /ˈtɛn/],
  ] as const)("%s places stress before its palatal suffix", (word, owned) => {
    expect(g2p.predict(word, "en")).toMatch(owned);
  });
  test.each([
    ["facial", /eɪʃəɫ$/], ["racial", /eɪʃəɫ$/],
    ["spatial", /eɪʃəɫ$/], ["special", /ɛʃəɫ$/],
  ] as const)("%s retains the short open-stem vowel", (word, owned) => {
    expect(g2p.predict(word, "en")).toMatch(owned);
  });
  test("mutual retains yod coalescence across the bound stem", () => {
    expect(g2p.predict("mutual", "en")).toMatch(/mjutʃuəɫ$/);
  });
  test.each([
    ["heavily", /hɛvəɫi$/], ["readily", /ɹɛdəɫi$/],
    ["angrily", /æŋɡɹəɫi$/], ["hungrily", /ʌŋɡɹəɫi$/],
  ] as const)("%s restores its attested y adjective", (word, owned) => {
    expect(g2p.predict(word, "en")).toMatch(owned);
  });
  test("a novel y adjective supplies the vowel of its adverb", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("bravvy", "B R AE1 V IY0");
    expect(custom.predict("bravvily", "en")).toMatch(/bɹævəɫi$/);
  });
  test.each(["liberal", "mineral"])("%s retains bound-stem laxing", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɪˌ?[bn]/);
  });
  test.each(["essay", "essence"])("%s retains its initial es vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ˈɛˌ?s/);
  });
  test.each(["cats", "ages"])("%s retains its word-final inflection", word => {
    expect(g2p.predict(word, "en")).toMatch(/[sz]$/);
  });
});
