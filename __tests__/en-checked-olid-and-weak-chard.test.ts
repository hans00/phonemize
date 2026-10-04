import EnglishG2P from "../src/en/g2p";

const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

describe.each([false, true])("checked adjective and weak doubled-onset rimes (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const say = (word: string) => clean(g2p.predict(word)!);

  test("strong open o before weak -lid is checked, with a reduced final nucleus", () => {
    for (const word of ["solid", "stolid"])
      expect(say(word)).toMatch(/ɑɫəd$/);
    for (const word of ["polar", "solar"])
      expect(say(word)).toMatch(/oʊɫ/);
  });

  test("transparent suffixes and prefixes retain a rule-exact root after eviction", () => {
    for (const word of ["solids", "stolids", "solidly", "solider", "nonsolid", "semisolid", "multisolid"])
      expect(say(word)).toMatch(/s?tɑɫəd|sɑɫəd/);
    for (const word of ["richards", "richard's", "richarder", "nonrichard", "semirichard"])
      expect(say(word)).toMatch(/ɹɪtʃɝd/);
    expect(g2p.predict("semisolid")).toMatch(/[ˈˌ]sɑɫəd/);
  });

  test("weak English -chard retains its consonant and reduces its rhotic vowel", () => {
    for (const word of ["richard", "prichard", "blanchard", "echard"])
      expect(say(word)).toMatch(/tʃɝd$/);
    for (const word of ["diehard", "tryhard", "churchyard", "junkyard"])
      expect(say(word)).toMatch(/ɑɹd$/);
  });

  test("weak -ssia after a short u coalesces, preserving native inflection", () => {
    for (const word of ["russia", "prussia", "russian", "prussian"])
      expect(say(word)).toMatch(/[ʌə]ʃ[əɪ]/);
    for (const word of ["cassia", "quassia"])
      expect(say(word)).toMatch(/iə$/);
    expect(say("massive")).toMatch(/sɪv$/);
  });
});
