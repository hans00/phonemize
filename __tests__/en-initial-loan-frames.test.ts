import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("initial loan frames (disableDict=%s)", (disableDict) => {
  const g = new EnglishG2P({ disableDict });
  test("open final-a and geminate weak-ent ex frames keep initial stress", () => {
    expect(g.predict("extra")).toMatch(/^ˈɛks/);
    expect(g.predict("excellent")).toMatch(/^ˈɛksə[ɫl]ənt/);
    for (const word of ["excel", "excels", "excelling", "except", "exempt", "extraneous", "extravagant"])
      expect(g.predict(word)).not.toMatch(/^ˈ/);
  });
  test("back-vowel labial-era roots keep their initial nucleus and boundary", () => {
    for (const word of ["camera", "cameras", "opera", "operas"]) expect(g.predict(word)).toMatch(/^ˈ(?:kæm|ɑp)/);
    // Vowel-initial nouns use noun prefixes; the existing un- gate
    // is reserved for vowel-initial adjectives and inflected verbs.
    for (const word of ["camera", "opera"]) for (const prefix of word === "camera" ? ["un", "non", "semi", "multi"] : ["non", "anti", "semi", "multi"])
      expect(g.predict(prefix + word)!.replace(/[ˈˌ]/g, "")).toMatch(/kæm|ɑp/);
    for (const word of ["rivera", "cabrera"]) expect(g.predict(word)).not.toMatch(/^ˈ/);
    expect(g.predict("chimera")!.replace(/[ˈˌ]/g, "")).not.toMatch(/kæm|kɑm/);
  });
  test("a checked rhotic head before a labial-ara tail retracts primary", () => {
    for (const word of ["barbara", "barbaras", "barbara's"]) expect(g.predict(word)).toMatch(/^ˈbɑɹ/);
    for (const prefix of ["un", "non", "semi", "multi"])
      expect(g.predict(prefix + "barbara")!.replace(/[ˈˌ]/g, "")).toMatch(/bɑɹbɝ/);
    expect(g.predict("sahara")).not.toMatch(/^ˈ/);
  });
});
