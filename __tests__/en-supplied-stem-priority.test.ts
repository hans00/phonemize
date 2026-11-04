import EnglishG2P from "../src/en/g2p";

// Regular l-final stems take -s, not -es: https://advice.writing.utoronto.ca/revising/plurals/
describe.each([false, true])("supplied consonant-final stem, rules=%s", (disableDict) => {
  test("preserves the supplied root in regular inflections", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("vornil", "ˈvɔɹnɪl");
    expect(engine.predict("vornil")).toBe("ˈvɔɹnɪl");
    expect(engine.predict("vornils")).toBe("ˈvɔɹnɪɫz");
    expect(engine.predict("vorniled")).toBe("ˈvɔɹnɪɫd");
    expect(engine.predict("vorniling")).toBe("ˈvɔɹnɪɫɪŋ");
    engine.addPronunciation("kit", "ˈkɪt");
    expect(engine.predict("kits")).toBe("ˈkɪts");
    expect(engine.predict("kites")).toBe("ˈkaɪts");
    engine.addPronunciation("vornile", "ˈvɔɹnaɪl");
    expect(engine.predict("vorniles")).toBe("ˈvɔɹnaɪɫz");
  });
});
