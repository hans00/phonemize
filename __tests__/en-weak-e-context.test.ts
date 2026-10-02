import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak e after m / soft g (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each([
    ["generic", /^dʒə/], ["genetic", /^dʒə/],
    ["indigenous", /dʒən/], ["legendary", /dʒən/],
    ["memorial", /^mə/], ["metallic", /^mə/],
    ["commentary", /mən/], ["diameter", /mət/],
  ] as const)("%s reduces its weak e", (word, expected) => {
    expect(g2p.predict(word, "en")).toMatch(expected);
  });
  test.each([
    ["gem", /^ˈdʒɛm/], ["member", /^ˈmɛm/],
    ["believe", /^bɪ/], ["design", /^dɪ/],
  ] as const)("%s retains its stressed vowel or lexical prefix", (word, expected) => {
    expect(g2p.predict(word, "en")).toMatch(expected);
  });
});

describe.each([false, true])("rich boundary and rhotic coalescence (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["rich", "richer", "riches"])("%s retains the English affricate", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɹɪtʃ/);
  });
  test.each(["erich", "emerich", "emmerich", "helmerich", "hemmerich"])(
    "%s keeps the German suffix after vowel reduction", word => {
      expect(g2p.predict(word, "en")).toMatch(/ɪk$/);
    },
  );
});
