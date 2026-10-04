import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("checked o and final ie (disableDict=%s)", (disableDict) => {
  const g = new EnglishG2P({ disableDict });
  const say = (word: string) => g.predict(word)!.replace(/[ˈˌ]/g, "");
  test("open o is checked before weak labial ert, non-rhotic ald and st+silent-e tails", () => {
    for (const word of ["robert", "donald", "ronald", "costume", "costumes", "costumed", "costuming", "costumer", "posture", "postures", "postured", "posturing"]) expect(say(word)).toMatch(/^[^ɑɔ]*[ɑɔ]/);
    for (const word of ["robert", "donald", "costume", "posture"]) for (const prefix of ["un", "non", "semi", "multi"])
      expect(say(prefix + word)).toMatch(/ɑ/);
    for (const word of ["covert", "overt", "postum", "poster", "noble"]) expect(say(word)).toMatch(/oʊ/);
    for (const word of ["torald", "thorald"]) expect(say(word)).toMatch(/ɔɹ/);
  });
  test("a single-sonorant oly root keeps its GOAT vowel through composition", () => {
    for (const word of ["holy", "holier", "holiest", "holiness", "holily", "moly", "unholy", "nonholy", "semiholy", "multiholy"]) expect(say(word)).toMatch(/oʊ/);
    for (const word of ["poly", "polymer", "holly", "molly"]) expect(say(word)).not.toMatch(/oʊ/);
  });
  test("open a before single-consonant ie keeps FACE, while checked and doubled roots stay lax", () => {
    for (const word of ["katie", "jamie", "gracie", "tracie", "davie"]) expect(say(word)).toMatch(/eɪ/);
    for (const word of ["katie", "jamie"]) for (const prefix of ["un", "non", "semi", "multi"])
      expect(say(prefix + word)).toMatch(/eɪ/);
    for (const word of ["jackie", "maggie", "hattie", "camel", "panel", "wagon", "rapid"]) expect(say(word)).not.toMatch(/eɪ/);
  });
});
