import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("rime-sensitive monosyllabic -st plurals, rules=%s", disableDict => {
  test("keeps the singular nucleus when plural -s closes the word", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [["posts", "ˈpoʊsts"], ["hosts", "ˈhoʊsts"], ["ghosts", "ˈɡoʊsts"]]) {
      expect(engine.predict(word)).toBe(ipa);
      expect(engine.predict(word.toUpperCase())).toBe(ipa);
    }
  });

  test("keeps contrasting coda and caller-owned root controls", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("costs")).toBe("ˈkɑsts");
    expect(engine.predict("mists")).toBe("ˈmɪsts");
    engine.addPronunciation("post", "ˈtɛst");
    expect(engine.predict("posts")).toBe("ˈtɛsts");
  });
});
