import EnglishG2P from "../src/en/g2p";

const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

describe.each([false, true])("weak open-o and geminate soft codas (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const say = (word: string) => clean(g2p.predict(word)!);
  test("initial non-stop o before labial/velar onsets keeps the attested full vowel", () => {
    for (const word of ["mobility", "momentum", "november", "romantic", "romania", "slovenia", "vocabulary"])
      expect(say(word)).toMatch(/^(?:[mnɹv]|sɫ)oʊ/);
    for (const word of ["mobility", "momentum", "november", "romantic", "vocabulary"])
      for (const prefix of ["un", "non", "semi", "multi"])
        expect(say(prefix + word)).toMatch(/oʊ/);
    expect(g2p.predict("vocabularies")).toMatch(/ˈkæbj/);
    expect(say("momentous")).toMatch(/ntəs$/);
    for (const word of ["moviegoer", "moviemaker", "moviemaking"]) expect(say(word)).toMatch(/^muvi/);
    expect(say("novelties")).toMatch(/^nɑvəl|^nɑvəɫ/);
    expect(say("novelistic")).toMatch(/^nɑ/);
    expect(say("rococo")).toMatch(/^ɹə/);
    expect(say("sobriety")).toMatch(/^sə/);
    expect(say("nominated")).toMatch(/neɪt/);
    expect(say("lovette")).not.toMatch(/^loʊ|^ɫoʊ/);
    expect(say("modification")).not.toMatch(/^moʊ/);
    expect(say("volunteer")).not.toMatch(/^voʊ/);
    expect(say("morocco")).not.toMatch(/^moʊ/);
  });
  test("geminate soft-coda nouns stress their real first syllable", () => {
    for (const word of ["challenge", "commerce"])
      expect(g2p.predict(word)).toMatch(/^ˈ/);
    expect(g2p.predict("divorce")).toMatch(/ˈvɔɹ/);
    expect(g2p.predict("enlarge")).toMatch(/ˈɫɑɹ/);
    expect(g2p.predict("enforce")).toMatch(/ˈfɔɹ/);
  });
});
