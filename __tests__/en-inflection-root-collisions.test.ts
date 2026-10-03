import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("inflection root collisions (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test("carries retains the carry root instead of the name Carrie", () => {
    expect(g2p.predict("carries", "en")).toMatch(/kæɹiz$/);
  });
  test("spies retains the spy diphthong instead of the spie headword", () => {
    expect(g2p.predict("spies", "en")).toMatch(/spaɪz$/);
  });
  test("shied restores the consonant-only shy root", () => {
    expect(g2p.predict("shied", "en")).toMatch(/ʃaɪd$/);
  });
  test("stymied retains the -ie stem rather than an invented final y", () => {
    expect(g2p.predict("stymied", "en")).toMatch(/staɪm[iɪ]d$/);
  });
  test.each(["cries", "tries", "flies"])("%s retains the Cy root's diphthong", word => {
    expect(g2p.predict(word, "en")).toMatch(/aɪz$/);
  });
  test.each(["movies", "navies", "gravies", "cookies", "brownies"])("%s retains its existing weak final vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/iz$/);
  });
  test.each(["passes", "classes", "masses", "kisses", "tosses"])("%s retains the regular sibilant plural", word => {
    expect(g2p.predict(word, "en")).toMatch(/s[əɪ]z$/);
  });
  test.each(["mousses", "finesses"])("%s preserves the consonant-final -sse root", word => {
    expect(g2p.predict(word, "en")).toMatch(/s[əɪ]z$/);
  });
  test("lattes preserves the pronounced-e loanword root", () => {
    expect(g2p.predict("lattes", "en")).toMatch(/eɪz$/);
  });
  test.each(["caller", "baller", "taller", "smaller"])("%s keeps the literal -all root", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɔ[lɫ]ɝ$/);
  });
  test.each(["fuller", "puller"])("%s keeps its lexical root vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/ʊ[lɫ]ɝ$/);
  });
  test.each(["lesser", "presser", "dresser", "kisser"])("%s keeps the literal -ss root", word => {
    expect(g2p.predict(word, "en")).toMatch(/sɝ$/);
  });
  test.each(["grosser", "stroller"])("%s retains its lexical tense root", word => {
    expect(g2p.predict(word, "en")).toMatch(/oʊ[slɫ]ɝ$/);
  });
  test.each(["bigger", "fitter", "flatter", "better", "latter"])("%s retains suffix-induced doubling", word => {
    expect(g2p.predict(word, "en")).toMatch(/[ɪæɛ][ɡt]ɝ$/);
  });
  test("controller restores its longer control stem", () => {
    expect(g2p.predict("controller", "en")).toMatch(/ˈtɹoʊ[lɫ]ɝ$/);
  });
  test("priest is not parsed as pry plus -iest", () => {
    expect(g2p.predict("priest", "en")).toMatch(/pɹist$/);
  });
});

test.each(["carries", "spies", "shied", "passes"])("%s exposes the repaired root through the public API", word => {
  const ipa = toIPA(word);
  expect(ipa).toMatch(word === "carries" ? /kæɹi/ : word === "passes" ? /pæs[əɪ]z/ : /aɪ/);
});
