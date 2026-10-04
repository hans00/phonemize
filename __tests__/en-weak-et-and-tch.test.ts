import EnglishG2P from "../src/en/g2p";

const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

describe.each([false, true])("weak rimes and protected tch (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const say = (word: string) => clean(g2p.predict(word)!);

  test("native single -et retains its reduced nucleus", () => {
    for (const word of ["planet", "target", "helmet", "velvet", "janet"])
      expect(say(word)).toMatch(/ət$/);
    for (const word of ["target", "targets", "targeted", "targeting", "targeter"])
      expect(say(word)).toMatch(/tɑɹɡ/);
    for (const word of ["nonplanet", "semiplanet", "multiplanet"])
      expect(say(word)).toMatch(/pɫænət/);
    for (const word of ["planets", "targets", "helmets", "velvets"])
      expect(say(word)).toMatch(/əts$/);
    for (const word of ["ferret", "ferreted", "ferreting", "ferreter", "puppet", "puppeted", "puppeting"])
      expect(say(word)).toMatch(/(?:ɹət|pət)/);
    for (const word of ["beckett", "bartlett", "brackett"])
      expect(say(word)).toMatch(/ɪt$/);
  });

  test("weak Latin -tim/-xim survives ordinary inflection and suffix composition", () => {
    for (const word of ["victim", "victims", "maxim", "maxims", "optimist", "optimism"])
      expect(say(word)).toMatch(/(?:t|ks)əm/);
    for (const word of ["victimed", "victiming", "victimer", "velveted", "velveting", "velveter"])
      expect(say(word)).toMatch(/(?:təm|vət)/);
    for (const word of ["darwin", "griffin", "colin", "virgin"])
      expect(say(word)).toMatch(/ɪn$/);
  });

  test("weak -ster is checked while real -ost agents retain their roots", () => {
    for (const word of ["foster", "roster", "fosters", "rosters", "fostered", "fostering", "rostered", "rostering", "nonfoster", "semifoster", "multifoster", "nonroster", "semiroster", "multiroster"])
      expect(say(word)).toMatch(/ɑst/);
    for (const word of ["post", "host", "most", "poster", "posters", "posterize", "hoster", "moster", "unposter", "preposter"])
      expect(say(word)).toMatch(/oʊst/);
    for (const word of ["competed", "competing", "completed", "completing", "deleted", "deleting"])
      expect(say(word)).toMatch(/it(?:ɪ[ŋd]|əd)/);
  });

  test("tch cannot become a velar through post-lexical cleanup", () => {
    for (const word of ["dispatch", "dispatched", "dispatching", "mismatch", "mismatched", "creditwatch", "farfetched"])
      expect(say(word)).toMatch(/tʃ/);
    expect(say("stomach")).toMatch(/mək$/);
    expect(say("eunuch")).toMatch(/nək$/);
  });
});
