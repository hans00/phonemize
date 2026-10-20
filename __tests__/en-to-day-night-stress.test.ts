import EnglishG2P from "../src/en/g2p";

describe("weak to- in temporal compounds", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([["today", "təˈdeɪ"], ["tonight", "təˈnaɪt"]])(
    "%s has weak to- and primary stress on its day/night root",
    (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
  );

  it.each([["todays", "təˈdeɪz"], ["tonights", "təˈnaɪts"]])(
    "keeps weak to- in the plural %s",
    (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
  );

  it.each(["total", "tonic", "tomorrow", "holiday"])(
    "leaves the neighboring %s frame unchanged",
    word => expect(rules.predict(word, "en-US")).toBe({
      total: "ˈtoʊtəɫ", tonic: "ˈtɑnɪk", tomorrow: "təˈmɔɹoʊ", holiday: "ˈhɑɫɪdeɪ",
    }[word]),
  );
});
