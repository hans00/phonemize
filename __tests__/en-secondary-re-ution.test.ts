import EnglishG2P from "../src/en/g2p";

test("secondary re- has /ɛ/ before the -solution/-volution/-stitution/-tribution stems", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const expected = new Map([
    ["resolution", "ˌɹɛzəˈɫuʃən"],
    ["revolution", "ˌɹɛvəˈɫuʃən"],
    ["resolutions", "ˌɹɛzəˈɫuʃənz"],
    ["revolutions", "ˌɹɛvəˈɫuʃənz"],
    ["revolutionary", "ˌɹɛvəˈɫuʃəˌnɛɹi"],
    ["revolutionize", "ˌɹɛvəˈɫuʃəˌnaɪz"],
    ["revolutionized", "ˌɹɛvəˈɫuʃəˌnaɪzd"],
    ["revolutionizing", "ˌɹɛvəˈɫuʃəˌnaɪzɪŋ"],
  ]);
  for (const [word, ipa] of expected) expect(rules.predict(word, "en")).toBe(ipa);

  for (const word of ["restitution", "retribution"]) expect(rules.predict(word, "en")).toMatch(/^ˌɹɛ/);
  for (const word of ["reconstitution", "reconstruct", "redistribution", "resolve", "revolve"])
    expect(rules.predict(word, "en")).toMatch(/^ˌ?ɹi/);
});
