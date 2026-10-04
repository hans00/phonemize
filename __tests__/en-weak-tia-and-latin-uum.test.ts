import EnglishG2P from "../src/en/g2p";

const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

describe.each([false, true])("weak Latin hiatus and Greek -oic (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const say = (word: string) => clean(g2p.predict(word)!);

  test("weak -uum retains its long u and the licensed yod", () => {
    expect(say("continuum")).toMatch(/njuəm$/);
    expect(say("vacuum")).toMatch(/kju(?:ə)?m$/);
    for (const word of ["continuums", "vacuumed", "vacuuming"])
      expect(say(word)).toMatch(/ju/);
  });

  test("weak final -tia palatalizes in native Latin endings", () => {
    for (const word of ["militia", "scotia", "consortia", "inertia"])
      expect(say(word)).toMatch(/ʃə$/);
    expect(say("prestia")).toMatch(/^pɹɛs/);
    for (const word of ["tia", "poinsettia", "patio"])
      expect(say(word)).toMatch(/ti[əo]/);
  });

  test("transparent derivation retains the complete root after eviction", () => {
    for (const word of ["noncontinuum", "precontinuum", "uncontinuum", "continuumer"])
      expect(say(word)).toMatch(/kəntɪnjuəm/);
    for (const word of ["stoics", "stoical", "stoicer", "stoically", "nonstoic"])
      expect(say(word)).toMatch(/stoʊɪk/);
    for (const word of ["scotias", "scotialike", "consortiawise", "inertias"])
      expect(say(word)).toMatch(/ʃə/);
  });

  test("Greek -oic retains two nuclei with ordinary -ic root stress", () => {
    for (const word of ["stoic", "heroic", "mesozoic", "cenozoic"])
      expect(say(word)).toMatch(/oʊɪk$/);
    expect(g2p.predict("stoic")).toMatch(/^ˈstoʊɪk$/);
    expect(g2p.predict("heroic")).toMatch(/ˈɹoʊɪk$/);
    for (const word of ["coin", "voice", "choice", "voiced", "voicing", "choicer", "devoiced", "devoicing", "unvoiced", "revoiced", "revoicing"])
      expect(say(word)).toMatch(/ɔɪ/);
  });
});
