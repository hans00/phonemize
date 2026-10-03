import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("root rimes and inflection boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["feed", "need", "seed", "reed", "deed", "bleed", "breed", "tweed", "freed", "agreed", "proceed"])("%s retains its ee nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(/id$/);
  });
  test.each(["feeding", "feeder", "seeding", "seeded", "needed", "deeds"])("%s keeps the ee root in a derivative", word => {
    expect(g2p.predict(word, "en")).toMatch(/id/);
  });
  test.each(["died", "lied", "tied", "untied", "untried", "vied", "pied", "tried", "cried", "fried", "shied"])("%s preserves its ie/y nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(/aɪd$/);
  });
  test.each(["added", "quoted", "coated", "printed", "fitted"])("%s retains a real syllabic past ending", word => {
    expect(g2p.predict(word, "en")).toMatch(/[ɪə]d$/);
  });
  test.each(["angry", "hungry", "angrily", "hungrily"])("%s preserves the stop before internal r", word => {
    expect(g2p.predict(word, "en")).toMatch(/ŋɡɹ/);
  });
  test.each(["sing", "singing", "singer", "song", "springroll", "strongroom", "wingrail"])("%s keeps an ordinary or compound ng boundary", word => {
    expect(g2p.predict(word, "en")).toMatch(/ŋ/);
    expect(g2p.predict(word, "en")).not.toMatch(/ŋɡ/);
  });
  test.each(["header", "heading", "headed", "deaden", "threading"])("%s preserves the split ead nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɛd/);
  });
  test.each(["breast", "abreast", "breasts", "breastfeeding", "breasted", "breasting", "breaster"])("%s keeps lax ea before the fricative cluster", word => {
    expect(g2p.predict(word, "en")).toMatch(/bɹɛst/);
  });
  test.each(["beast", "feast", "east", "least"])("%s keeps the high ea vowel outside the lax onset frame", word => {
    expect(g2p.predict(word, "en")).toMatch(/ist/);
  });
  test.each(["bear", "pear", "bearing", "bearer", "bearable"])("%s preserves the initial labial ear nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɛɹ/);
  });
  test.each(["beard", "appear", "appearing", "fear", "hear", "spear"])("%s keeps the contrasting high ear nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɪɹ/);
  });
  test("pearl retains its coda-controlled rhotic nucleus", () => {
    expect(g2p.predict("pearl", "en")).toMatch(/ɝ/);
  });
});

test.each(["feed", "tied", "angry", "heading", "breast", "bearer", "bearing"])("%s has the corrected nucleus through the public API", word => {
  const expected = { feed: /id$/, tied: /aɪd$/, angry: /ŋɡɹ/, heading: /ɛd/, breast: /bɹɛst/, bearer: /ɛɹ/, bearing: /ɛɹ/ };
  expect(toIPA(word)).toMatch(expected[word as keyof typeof expected]);
});
