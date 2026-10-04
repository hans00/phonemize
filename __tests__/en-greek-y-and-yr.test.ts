import EnglishG2P from "../src/en/g2p";

const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

describe.each([false, true])("Greek roots and closed yr (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const say = (word: string) => clean(g2p.predict(word)!);

  test("phys- retains lax y and voices its s through derived forms", () => {
    for (const word of ["physics", "physical", "physically", "physicist", "physiology", "physiologic", "physician", "physique"])
      expect(say(word)).toMatch(/f[ɪə]z/);
  });

  test("dys- before a consonant retains its short unvoiced prefix", () => {
    for (const word of ["dyslexia", "dyslexic", "dysfunction", "dyspeptic", "dysplasia", "dysphoric"])
      expect(say(word)).toMatch(/^dɪs/);
    for (const word of ["dyson", "dysan", "dynamic"])
      expect(say(word)).toMatch(/^daɪ/);
  });

  test("a closed yr coda takes NURSE", () => {
    for (const word of ["myrtle", "myrrh", "myrna", "myrmidon", "smyrna", "byrd", "byrne"])
      expect(say(word)).toMatch(/[mb]ɝ/);
  });

  test("transparent joins recover the same root after exception eviction", () => {
    for (const word of ["physicians", "unphysician", "nonphysician"])
      expect(say(word)).toMatch(/fəzɪʃən/);
    for (const word of ["dyslexics", "nondyslexic", "undyslexic"])
      expect(say(word)).toMatch(/dɪsɫɛksɪk/);
    for (const word of ["myrtles", "myrrhs", "myrrhing"])
      expect(say(word)).toMatch(/mɝ/);
    for (const word of ["antiques", "uniques", "techniques", "nonunique", "preunique", "uniquewise"])
      expect(say(word)).toMatch(/ik/);
    expect(g2p.predict("physicalwise")).toMatch(/^ˈfɪz/);
    expect(g2p.predict("semiphysical")).toMatch(/ˈfɪz/);
    expect(g2p.predict("multiphysical")).toMatch(/ˈfɪz/);
    expect(g2p.predict("postpique")).toMatch(/poʊst/);
  });

  test("open yr and y+r+silent-e keep their existing checked or PRICE vowel", () => {
    for (const word of ["lyric", "tyranny", "pyrrhic"])
      expect(say(word)).toMatch(/[ɫpt]ɪɹ/);
    for (const word of ["lyre", "pyre", "tyre"])
      expect(say(word)).toMatch(/[ɫpt]aɪ/);
  });

  test("final French -ique has FLEECE while other que rimes retain their vowels", () => {
    for (const word of ["antique", "unique", "technique", "mystique", "oblique", "pique"])
      expect(say(word)).toMatch(/ik$/);
    expect(say("plaque")).toMatch(/æk$/);
    expect(say("mosque")).toMatch(/ɑsk$/);
    expect(say("torque")).toMatch(/ɔɹk$/);
  });
});
